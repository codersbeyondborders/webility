import React, { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFixedUrl(null);
    setError('');
    setLoading(true);

    try {
      const response = await post({
        apiName: 'webilityAPI',
        path: '/fix-html',
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
      console.error('Fix failed:', err);
      setError('Failed to fix URL: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Web Accessibility Fixer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Fixing...' : 'Fix Accessibility'}
        </button>
      </form>

      {fixedUrl && (
        <div className="result">
          <h3>Fixed HTML Available:</h3>
          <a href={fixedUrl} target="_blank" rel="noopener noreferrer">
            View Remediated Page
          </a>
        </div>
      )}

      {error && <div className="error"> {error}</div>}
    </div>
  );
}

export default App;
