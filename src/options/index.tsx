import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options';
import '../assets/styles/global.css';
import { StorageManager } from '../shared/utils/storage';

// Initialize theme on load
const initializeTheme = async () => {
  try {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    
    if (settings.theme) {
      // Apply dark mode if needed
      if (settings.theme.id === 'dark' || 
          (settings.theme.colors && settings.theme.colors.background === '#1f2937')) {
        document.documentElement.classList.add('dark');
      }
      
      // Apply theme colors
      if (settings.theme.colors) {
        const colors = settings.theme.colors;
        
        // Apply background and text colors
        if (colors.background) {
          document.body.style.backgroundColor = colors.background;
        }
        if (colors.text) {
          document.body.style.color = colors.text;
        }
        
        // Apply CSS variables
        Object.entries(colors).forEach(([key, value]) => {
          if (typeof value === 'string') {
            document.documentElement.style.setProperty(`--theme-${key}`, value);
          }
        });
      }
      
      // Apply font settings
      if (settings.theme.fontSize) {
        const sizeMap: Record<string, string> = {
          'small': '14px',
          'medium': '16px',
          'large': '18px'
        };
        document.documentElement.style.fontSize = sizeMap[settings.theme.fontSize];
      }
      
      if (settings.theme.fontFamily) {
        const fontMap: Record<string, string> = {
          'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'serif': 'Georgia, "Times New Roman", serif',
          'mono': '"Courier New", monospace',
          'comic': '"Comic Sans MS", cursive',
          'dyslexic': 'OpenDyslexic, sans-serif'
        };
        document.documentElement.style.fontFamily = fontMap[settings.theme.fontFamily];
      }
    }
  } catch (error) {
    console.error('Failed to initialize theme:', error);
  }
};

// Initialize theme before rendering
initializeTheme();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);