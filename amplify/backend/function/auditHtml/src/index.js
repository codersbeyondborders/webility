const { JSDOM } = require('jsdom');
const axeSource = require('axe-core').source;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace '*' with your frontend domain in production
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

exports.handler = async (event) => {
  try {
    // Handle CORS Preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    const { html } = JSON.parse(event.body || '{}');

    if (!html || typeof html !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing or invalid HTML input' }),
      };
    }

    // Initialize DOM
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
    });

    const { window } = dom;

    // Wait for DOM load (with fallback)
    await new Promise((resolve) => {
      window.addEventListener('load', resolve);
      setTimeout(resolve, 1000); // fallback timeout
    });

    // Inject axe-core
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = axeSource;
    window.document.head.appendChild(scriptEl);

    // Run axe-core audit
    const results = await window.eval(`
      new Promise((resolve) => {
        axe.run().then(results => resolve(results));
      })
    `);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error('AXE audit failed:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'axe-core audit failed',
        details: err.message || 'Unknown error',
      }),
    };
  }
};
