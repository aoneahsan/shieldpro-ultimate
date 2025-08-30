import { StorageManager } from '../shared/utils/storage';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ThemeConfig {
  id: string;
  colors: ThemeColors;
  fontSize?: string;
  fontFamily?: string;
}

export const THEMES: Record<string, ThemeColors> = {
  default: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#10b981',
  },
  dark: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#1f2937',
    text: '#f9fafb',
    accent: '#10b981',
  },
  ocean: {
    primary: '#0891b2',
    secondary: '#0e7490',
    background: '#ecfeff',
    text: '#164e63',
    accent: '#06b6d4',
  },
  forest: {
    primary: '#059669',
    secondary: '#047857',
    background: '#ecfdf5',
    text: '#064e3b',
    accent: '#10b981',
  },
  sunset: {
    primary: '#f97316',
    secondary: '#ea580c',
    background: '#fff7ed',
    text: '#7c2d12',
    accent: '#fb923c',
  },
  purple: {
    primary: '#9333ea',
    secondary: '#7c3aed',
    background: '#faf5ff',
    text: '#581c87',
    accent: '#a855f7',
  },
  rose: {
    primary: '#e11d48',
    secondary: '#be123c',
    background: '#fff1f2',
    text: '#881337',
    accent: '#f43f5e',
  },
  matrix: {
    primary: '#22c55e',
    secondary: '#16a34a',
    background: '#000000',
    text: '#22c55e',
    accent: '#86efac',
  },
  neon: {
    primary: '#ec4899',
    secondary: '#d946ef',
    background: '#18181b',
    text: '#fbbf24',
    accent: '#34d399',
  },
};

class ThemeService {
  private static instance: ThemeService;
  private currentTheme: ThemeConfig | null = null;

  private constructor() {}

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  async initialize(): Promise<void> {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();

    if (settings.theme) {
      this.currentTheme = settings.theme as ThemeConfig;
      this.applyTheme(this.currentTheme);
    }
  }

  async setTheme(themeId: string): Promise<void> {
    const colors = THEMES[themeId];
    if (!colors) return;

    const themeConfig: ThemeConfig = {
      id: themeId,
      colors,
      fontSize: this.currentTheme?.fontSize || 'medium',
      fontFamily: this.currentTheme?.fontFamily || 'system',
    };

    await this.saveAndApplyTheme(themeConfig);
  }

  async setCustomTheme(colors: ThemeColors): Promise<void> {
    const themeConfig: ThemeConfig = {
      id: 'custom',
      colors,
      fontSize: this.currentTheme?.fontSize || 'medium',
      fontFamily: this.currentTheme?.fontFamily || 'system',
    };

    await this.saveAndApplyTheme(themeConfig);
  }

  async setFontSize(size: string): Promise<void> {
    if (!this.currentTheme) {
      this.currentTheme = {
        id: 'default',
        colors: THEMES.default,
        fontSize: size,
        fontFamily: 'system',
      };
    } else {
      this.currentTheme.fontSize = size;
    }

    await this.saveAndApplyTheme(this.currentTheme);
  }

  async setFontFamily(family: string): Promise<void> {
    if (!this.currentTheme) {
      this.currentTheme = {
        id: 'default',
        colors: THEMES.default,
        fontSize: 'medium',
        fontFamily: family,
      };
    } else {
      this.currentTheme.fontFamily = family;
    }

    await this.saveAndApplyTheme(this.currentTheme);
  }

  private async saveAndApplyTheme(theme: ThemeConfig): Promise<void> {
    this.currentTheme = theme;

    // Save to storage
    const storage = StorageManager.getInstance();
    await storage.updateSettings({ theme });

    // Apply to current page
    this.applyTheme(theme);

    // Broadcast to all extension pages
    this.broadcastTheme(theme);
  }

  applyTheme(theme: ThemeConfig): void {
    const { colors, fontSize, fontFamily } = theme;

    // Apply dark mode class
    const isDark = this.isDarkTheme(colors);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    });

    // Apply background and text colors
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;

    // Fix cards and components
    this.fixComponentStyles(colors, isDark);

    // Apply font settings
    if (fontSize) {
      const sizeMap: Record<string, string> = {
        small: '14px',
        medium: '16px',
        large: '18px',
      };
      document.documentElement.style.fontSize = sizeMap[fontSize];
      document.body.style.fontSize = sizeMap[fontSize];
    }

    if (fontFamily) {
      const fontMap: Record<string, string> = {
        system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        serif: 'Georgia, "Times New Roman", serif',
        mono: '"Courier New", monospace',
        comic: '"Comic Sans MS", cursive',
        dyslexic: 'OpenDyslexic, sans-serif',
      };
      document.documentElement.style.fontFamily = fontMap[fontFamily];
      document.body.style.fontFamily = fontMap[fontFamily];
    }
  }

  private fixComponentStyles(colors: ThemeColors, isDark: boolean): void {
    // Create a style element for theme overrides
    let styleEl = document.getElementById('theme-overrides');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-overrides';
      document.head.appendChild(styleEl);
    }

    // Generate CSS overrides
    const css = `
      /* Card backgrounds */
      .bg-white, 
      .dark\\:bg-gray-800 {
        background-color: ${isDark ? '#374151' : '#ffffff'} !important;
      }
      
      .bg-gray-50,
      .dark\\:bg-gray-700 {
        background-color: ${isDark ? '#4b5563' : '#f9fafb'} !important;
      }
      
      .bg-gray-100,
      .dark\\:bg-gray-600 {
        background-color: ${isDark ? '#6b7280' : '#f3f4f6'} !important;
      }
      
      /* Text colors */
      .text-gray-900,
      .dark\\:text-white {
        color: ${colors.text} !important;
      }
      
      .text-gray-700,
      .dark\\:text-gray-300 {
        color: ${isDark ? '#d1d5db' : '#374151'} !important;
      }
      
      .text-gray-600,
      .dark\\:text-gray-400 {
        color: ${isDark ? '#9ca3af' : '#4b5563'} !important;
      }
      
      .text-gray-500,
      .dark\\:text-gray-500 {
        color: ${isDark ? '#9ca3af' : '#6b7280'} !important;
      }
      
      /* Primary colors */
      .text-primary-600,
      .dark\\:text-primary-400,
      .text-blue-600,
      .dark\\:text-blue-400 {
        color: ${colors.primary} !important;
      }
      
      .bg-primary-600,
      .bg-blue-600 {
        background-color: ${colors.primary} !important;
      }
      
      .border-primary-500,
      .border-blue-500 {
        border-color: ${colors.primary} !important;
      }
      
      /* Buttons */
      button.bg-primary-600,
      button.bg-blue-600 {
        background-color: ${colors.primary} !important;
      }
      
      button.bg-primary-600:hover,
      button.bg-blue-600:hover {
        background-color: ${colors.secondary} !important;
      }
      
      /* Borders */
      .border-gray-200,
      .dark\\:border-gray-700 {
        border-color: ${isDark ? '#4b5563' : '#e5e7eb'} !important;
      }
      
      .border-gray-300,
      .dark\\:border-gray-600 {
        border-color: ${isDark ? '#6b7280' : '#d1d5db'} !important;
      }
      
      /* Special backgrounds */
      .bg-blue-50,
      .dark\\:bg-blue-900\\/20 {
        background-color: ${isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff'} !important;
      }
      
      .bg-green-50,
      .dark\\:bg-green-900\\/20 {
        background-color: ${isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4'} !important;
      }
      
      .bg-yellow-50,
      .dark\\:bg-yellow-900\\/20 {
        background-color: ${isDark ? 'rgba(251, 191, 36, 0.1)' : '#fefce8'} !important;
      }
      
      .bg-purple-50,
      .dark\\:bg-purple-900\\/20 {
        background-color: ${isDark ? 'rgba(147, 51, 234, 0.1)' : '#faf5ff'} !important;
      }
      
      .bg-red-50,
      .dark\\:bg-red-900\\/20 {
        background-color: ${isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2'} !important;
      }
      
      /* Input fields */
      input[type="text"],
      input[type="email"],
      input[type="password"],
      select,
      textarea {
        background-color: ${isDark ? '#374151' : '#ffffff'} !important;
        color: ${colors.text} !important;
        border-color: ${isDark ? '#6b7280' : '#d1d5db'} !important;
      }
      
      /* Scrollbars */
      ::-webkit-scrollbar-thumb {
        background-color: ${isDark ? '#6b7280' : '#d1d5db'} !important;
      }
      
      /* Popup specific */
      .popup-container {
        background-color: ${colors.background} !important;
        color: ${colors.text} !important;
      }
      
      /* Tab navigation */
      .tab-navigation {
        background-color: ${isDark ? '#374151' : '#ffffff'} !important;
      }
    `;

    styleEl.textContent = css;
  }

  private isDarkTheme(colors: ThemeColors): boolean {
    return (
      colors.background === '#1f2937' ||
      colors.background === '#000000' ||
      colors.background === '#18181b'
    );
  }

  private broadcastTheme(theme: ThemeConfig): void {
    // Send to background script to relay to all pages
    try {
      chrome.runtime.sendMessage({
        action: 'broadcastTheme',
        theme,
      });
    } catch {
      console.log('Could not broadcast theme:', error);
    }

    // Also broadcast via storage event for other open tabs
    chrome.storage.local.set({ currentTheme: theme });
  }

  getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme;
  }
}

export const themeService = ThemeService.getInstance();
