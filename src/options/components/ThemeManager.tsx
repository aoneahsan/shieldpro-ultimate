import React, { useState, useEffect } from 'react';
import { Palette, Check, Lock, Sparkles } from 'lucide-react';
import { StorageManager } from '../../shared/utils/storage';

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  requiredTier: number;
  preview: string;
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#10b981'
    },
    requiredTier: 1,
    preview: '🎨'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#1f2937',
      text: '#f9fafb',
      accent: '#10b981'
    },
    requiredTier: 1,
    preview: '🌙'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      primary: '#0891b2',
      secondary: '#0e7490',
      background: '#ecfeff',
      text: '#164e63',
      accent: '#06b6d4'
    },
    requiredTier: 2,
    preview: '🌊'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#059669',
      secondary: '#047857',
      background: '#ecfdf5',
      text: '#064e3b',
      accent: '#10b981'
    },
    requiredTier: 2,
    preview: '🌲'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      background: '#fff7ed',
      text: '#7c2d12',
      accent: '#fb923c'
    },
    requiredTier: 2,
    preview: '🌅'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    colors: {
      primary: '#9333ea',
      secondary: '#7c3aed',
      background: '#faf5ff',
      text: '#581c87',
      accent: '#a855f7'
    },
    requiredTier: 3,
    preview: '👑'
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    colors: {
      primary: '#e11d48',
      secondary: '#be123c',
      background: '#fff1f2',
      text: '#881337',
      accent: '#f43f5e'
    },
    requiredTier: 3,
    preview: '🌹'
  },
  {
    id: 'matrix',
    name: 'Matrix',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      background: '#000000',
      text: '#22c55e',
      accent: '#86efac'
    },
    requiredTier: 4,
    preview: '💻'
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    colors: {
      primary: '#ec4899',
      secondary: '#d946ef',
      background: '#18181b',
      text: '#fbbf24',
      accent: '#34d399'
    },
    requiredTier: 5,
    preview: '✨'
  },
  {
    id: 'gradient',
    name: 'Gradient Dreams',
    colors: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      text: '#1a1a1a',
      accent: '#ff6b6b'
    },
    requiredTier: 5,
    preview: '🌈'
  }
];

interface ThemeManagerProps {
  currentTier: number;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({ currentTier }) => {
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [customColors, setCustomColors] = useState({
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#10b981'
  });
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('system');

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    
    if (settings.theme) {
      setSelectedTheme(settings.theme.id || 'default');
      setFontSize(settings.theme.fontSize || 'medium');
      setFontFamily(settings.theme.fontFamily || 'system');
      if (settings.theme.customColors) {
        setCustomColors(settings.theme.customColors);
      }
    }
  };

  const applyTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || currentTier < theme.requiredTier) return;

    setSelectedTheme(themeId);
    
    const storage = StorageManager.getInstance();
    await storage.setSettings({
      theme: {
        id: themeId,
        colors: theme.colors,
        fontSize,
        fontFamily
      }
    });

    // Apply theme to extension UI
    chrome.runtime.sendMessage({
      action: 'applyTheme',
      theme: theme.colors
    });

    // Apply to current page
    if (theme.id === 'custom') {
      applyThemeColors(customColors);
    } else {
      applyThemeColors(theme.colors);
    }
  };

  const applyThemeColors = (colors: any) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--theme-${key}`, value);
      }
    });
  };

  const handleFontSizeChange = async (size: string) => {
    setFontSize(size);
    document.documentElement.style.setProperty('--font-size', 
      size === 'small' ? '14px' : 
      size === 'large' ? '18px' : '16px'
    );
    
    const storage = StorageManager.getInstance();
    await storage.setSettings({
      theme: {
        id: selectedTheme,
        fontSize: size,
        fontFamily
      }
    });
  };

  const handleFontFamilyChange = async (family: string) => {
    setFontFamily(family);
    const fontMap: Record<string, string> = {
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'serif': 'Georgia, "Times New Roman", serif',
      'mono': '"Courier New", monospace',
      'comic': '"Comic Sans MS", cursive',
      'dyslexic': 'OpenDyslexic, sans-serif'
    };
    
    document.documentElement.style.setProperty('--font-family', fontMap[family]);
    
    const storage = StorageManager.getInstance();
    await storage.setSettings({
      theme: {
        id: selectedTheme,
        fontSize,
        fontFamily: family
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-600" />
            <span>Themes</span>
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              AdBlock charges $40/yr - We offer FREE!
            </span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize the look and feel of ShieldPro Ultimate
          </p>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                disabled={currentTier < theme.requiredTier}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedTheme === theme.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                } ${currentTier < theme.requiredTier ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="text-3xl mb-2">{theme.preview}</div>
                <div className="text-sm font-medium">{theme.name}</div>
                
                {selectedTheme === theme.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                {currentTier < theme.requiredTier && (
                  <div className="absolute top-2 left-2">
                    <Lock className="w-3 h-3 text-gray-400" />
                  </div>
                )}
                
                {theme.requiredTier > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Tier {theme.requiredTier}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Typography</h3>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Size
            </label>
            <div className="flex space-x-2">
              {['small', 'medium', 'large'].map(size => (
                <button
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    fontSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="system">System Default</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="comic">Comic Sans</option>
              <option value="dyslexic" disabled={currentTier < 3}>
                OpenDyslexic {currentTier < 3 && '(Tier 3+)'}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Custom Theme Creator (Tier 5) */}
      {currentTier >= 5 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <span>Custom Theme Creator</span>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                Tier 5 Exclusive
              </span>
            </h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(customColors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                    {key} Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setCustomColors({...customColors, [key]: e.target.value})}
                      className="w-12 h-12 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setCustomColors({...customColors, [key]: e.target.value})}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                applyThemeColors(customColors);
                // Save custom theme
                const storage = StorageManager.getInstance();
                storage.setSettings({
                  theme: {
                    id: 'custom',
                    colors: customColors,
                    fontSize,
                    fontFamily
                  }
                });
              }}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
            >
              Apply Custom Theme
            </button>
          </div>
        </div>
      )}
    </div>
  );
};