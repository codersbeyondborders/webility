const axios = require('axios');
const VALID_URL_REGEX = /^https?:\/\/[^ "]+$/;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace * with specific domain for tighter security
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

exports.handler = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    const { url } = JSON.parse(event.body);

    // Validate URL
    if (!url || !VALID_URL_REGEX.test(url)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid or missing URL' }),
      };
    }

    // Fetch HTML content
    const response = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'WebsibilityBot/1.0' },
      maxRedirects: 3,
    });

    // Validate content type
    const contentType = response.headers['content-type'];
    if (!contentType.includes('text/html')) {
      return {
        statusCode: 415,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'URL does not return HTML content' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ html: response.data }),
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch HTML',
        details: err?.message || 'Unknown error',
      }),
    };
  }
};
