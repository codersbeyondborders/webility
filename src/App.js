import React, { useState, useEffect } from 'react';
import './App.css';
import { Amplify } from 'aws-amplify';
import { post } from 'aws-amplify/api';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

function App() {
  const [url, setUrl] = useState('');
  const [fixedUrl, setFixedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Load from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFixedUrl(null);
    setError('');
    setLoading(true);

    try {
      const response = await post({
        apiName: 'webilityAPI',
        path: '/fixHtml',
        options: {
          body: { url },
          headers: { 'Content-Type': 'application/json' },
        },
      }).response;

      const data = await response.body.json();
      if (data.fixedHtmlUrl) {
        setFixedUrl(data.fixedHtmlUrl);
      } else {
        setError('Unexpected response format.');
      }
    } catch (err) {
      setError('Failed to fix the page. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-container" role="main">
      <header>
        <h1>♿ Web Accessibility Fixer</h1>
        <p>Enter a website URL to receive an accessible, remediated version.</p>
        <div className="toggle-container" aria-label="Toggle dark mode">
          <label htmlFor="darkModeToggle" className="toggle-label">
            <input
              id="darkModeToggle"
              type="checkbox"
              className="toggle-input"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
            <span className="toggle-slider">
              <span className="toggle-icon">
                {darkMode ? '🌙' : '🌞'}
              </span>
            </span>
          </label>
        </div>

      </header>

      <form onSubmit={handleSubmit} aria-label="Fix website accessibility">
        <label htmlFor="url-input">Website URL</label>
        <input
          id="url-input"
          name="url"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          aria-required="true"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Fixing…' : 'Fix Accessibility'}
        </button>
      </form>

      {error && <div className="error-message" role="alert">{error}</div>}

      {fixedUrl && (
        <section className="result" aria-live="polite">
          <h2>Remediated Page</h2>
          <p>
            <a href={fixedUrl} target="_blank" rel="noopener noreferrer">
              Open in New Tab
            </a>
          </p>
          <iframe
            src={fixedUrl}
            title="Remediated HTML Preview"
            width="100%"
            height="600"
            style={{ border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </section>
      )}
    </main>
  );
}

export default App;
