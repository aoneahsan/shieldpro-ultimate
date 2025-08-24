import React from 'react';
import ReactDOM from 'react-dom/client';
import TiersPage from './TiersPage';
import '../assets/styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <TiersPage />
  </React.StrictMode>
);