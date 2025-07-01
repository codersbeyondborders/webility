/* Amplify Params - DO NOT EDIT
	AUTH_WEBILITY8B7D1685_USERPOOLID
	ENV
	REGION
	STORAGE_WEBILITYAUTH_BUCKETNAME
Amplify Params - DO NOT EDIT */

const AWS = require('aws-sdk');
const REGION = process.env.REGION || 'us-east-1'; 
const s3 = new AWS.S3({ region: REGION });
const rekognition = new AWS.Rekognition({ region: REGION });

const cheerio = require('cheerio');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { URL } = require('url');

const BUCKET_NAME = process.env.STORAGE_WEBILITYAUTH_BUCKETNAME || 'websibility-remediated-html';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace * with a domain in production
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

function resolveUrl(base, relative) {
  try {
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const { url } = JSON.parse(event.body || '{}');
  if (!url || !/^https?:\/\/[^ "]+$/.test(url)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid or missing URL' }),
    };
  }

  try {
    const htmlResponse = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(htmlResponse.data);

    // Normalize HTML
    if ($('html').length === 0) $('body').wrap('<html></html>');
    if ($('head').length === 0) $('html').prepend('<head></head>');
    if ($('meta[charset]').length === 0) $('head').prepend('<meta charset="UTF-8" />');
    if ($('title').length === 0) $('head').prepend('<title>Fixed Page</title>');

    // Remove potentially harmful elements
    $('script, iframe').remove();

    // Fix missing alt tags using Rekognition
    const imgs = $('img:not([alt])');
    for (const el of imgs.toArray()) {
      const srcRaw = $(el).attr('src');
      const src = resolveUrl(url, srcRaw);

      if (!src || src.startsWith('data:')) {
        $(el).attr('alt', 'Image');
        continue;
      }

      try {
        const imgRes = await axios.get(src, { responseType: 'arraybuffer', timeout: 5000 });
        const rekResult = await rekognition.detectLabels({
          Image: { Bytes: imgRes.data },
          MaxLabels: 5,
        }).promise();

        const altText = rekResult.Labels.map((label) => label.Name).join(', ');
        $(el).attr('alt', altText || 'Descriptive image');
      } catch {
        $(el).attr('alt', 'Image');
      }
    }

    // Fix structural issues
    $('b').each((_, el) => $(el).replaceWith(`<strong>${$(el).text()}</strong>`));
    $('[role=""]').removeAttr('role');

    const fixedHtml = $.html();
    const key = `fixed/${uuidv4()}.html`;

    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fixedHtml,
      ContentType: 'text/html',
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        fixedHtmlUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fix and upload HTML',
        details: err.message || 'Unknown error',
      }),
    };
  }
};
