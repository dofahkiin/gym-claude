import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const mode = import.meta.env.MODE || 'development';

// Provide a lightweight process.env shim for code paths that check NODE_ENV.
if (typeof globalThis.process === 'undefined') {
  globalThis.process = { env: { NODE_ENV: mode } };
} else {
  globalThis.process.env = { ...globalThis.process.env, NODE_ENV: mode };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
