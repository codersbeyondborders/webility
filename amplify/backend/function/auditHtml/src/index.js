const { JSDOM } = require('jsdom');
const axeSource = require('axe-core').source;

exports.handler = async (event) => {
  try {
    const { html } = JSON.parse(event.body);

    if (!html || typeof html !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid HTML input' }),
      };
    }

    // Create a DOM
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      resources: "usable",
    });

    const { window } = dom;

    // Wait until DOM is fully loaded
    await new Promise((resolve) => {
      window.addEventListener('load', resolve);
      setTimeout(resolve, 1000); // fallback in case 'load' doesn't fire
    });

    // Inject axe-core into the DOM
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = axeSource;
    window.document.head.appendChild(scriptEl);

    // Run axe
    const results = await window.eval(`
      new Promise((resolve) => {
        axe.run().then(results => resolve(results));
      })
    `);

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error('AXE audit failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'axe-core audit failed',
        details: err.message,
      }),
    };
  }
};
