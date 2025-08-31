import React from 'react';
import ReactDOM from 'react-dom/client';
import { TiersInfoPage } from './TiersInfo';
import '../styles/globals.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <TiersInfoPage />
    </React.StrictMode>
  );
}