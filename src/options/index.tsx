import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options';
import '../assets/styles/global.css';
import { themeService } from '../services/theme.service';

// Initialize theme before rendering
themeService.initialize();

// Listen for theme changes from other pages
chrome.storage.onChanged.addListener((changes) => {
  if (changes.currentTheme) {
    themeService.applyTheme(changes.currentTheme.newValue);
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);