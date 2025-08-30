import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import TestApp from './TestApp';
import '../assets/styles/global.css';

// Don't initialize theme service here - it causes Firebase issues in popup
// Theme is handled by theme-loader.js

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
