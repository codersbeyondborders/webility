const axios = require('axios');
const VALID_URL_REGEX = /^https?:\/\/[^ "]+$/;

exports.handler = async (event) => {
  try {
    const { url } = JSON.parse(event.body);

    // Validate URL
    if (!url || !VALID_URL_REGEX.test(url)) {
      return {
        statusCode: 400,
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
        body: JSON.stringify({ error: 'URL does not return HTML content' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ html: response.data }),
    };

  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: 'Failed to fetch HTML',
        details: err?.message || 'Unknown error',
      }),
    };
  }
};
