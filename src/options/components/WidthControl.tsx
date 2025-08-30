import React, { useState, useEffect } from 'react';
import { Maximize2, Monitor, Tablet, Smartphone, Settings2 } from 'lucide-react';

interface WidthControlProps {
  currentWidth: string;
  onWidthChange: (width: string) => void;
}

export const WidthControl: React.FC<WidthControlProps> = ({ currentWidth, onWidthChange }) => {
  const [customWidth, setCustomWidth] = useState<number>(80);
  const [isCustom, setIsCustom] = useState(false);

  // Predefined width options
  const widthOptions = [
    {
      value: 'full',
      label: 'Full Width',
      icon: Maximize2,
      description: '100% of screen',
      percentage: 100,
    },
    {
      value: 'extra-wide',
      label: 'Extra Wide',
      icon: Monitor,
      description: '90% of screen',
      percentage: 90,
    },
    {
      value: 'wide',
      label: 'Wide',
      icon: Monitor,
      description: '80% of screen',
      percentage: 80,
    },
    {
      value: 'standard',
      label: 'Standard',
      icon: Tablet,
      description: '70% of screen',
      percentage: 70,
    },
    {
      value: 'compact',
      label: 'Compact',
      icon: Smartphone,
      description: '60% of screen',
      percentage: 60,
    },
  ];

  useEffect(() => {
    // Check if current width is a custom value
    const isPreset = widthOptions.some((opt) => opt.value === currentWidth);
    if (!isPreset && currentWidth.includes('custom-')) {
      setIsCustom(true);
      const percentage = parseInt(currentWidth.replace('custom-', ''));
      setCustomWidth(percentage);
    }
  }, [currentWidth]);

  const handlePresetChange = (value: string, percentage: number) => {
    setIsCustom(false);
    onWidthChange(value);
  };

  const handleCustomChange = (value: number) => {
    setCustomWidth(value);
    setIsCustom(true);
    onWidthChange(`custom-${value}`);
  };

  const getActiveWidth = () => {
    if (isCustom) {
      return `custom-${customWidth}`;
    }
    return currentWidth;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Content Width</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Adjust how wide the options page content appears on your screen
        </p>
      </div>

      {/* Preset Width Options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {widthOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentWidth === option.value && !isCustom;

          return (
            <button
              key={option.value}
              onClick={() => handlePresetChange(option.value, option.percentage)}
              className={`
                relative flex flex-col items-center p-3 rounded-lg border-2 transition-all
                ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                </div>
              )}

              <Icon
                className={`w-6 h-6 mb-1 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}
              />

              <span
                className={`text-xs font-medium ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'}`}
              >
                {option.label}
              </span>

              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Width Slider */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Width
            </label>
          </div>
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{customWidth}%</span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={customWidth}
            onChange={(e) => handleCustomChange(parseInt(e.target.value))}
            className="
              w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
              slider focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            "
            style={{
              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((customWidth - 50) / 50) * 100}%, rgb(229, 231, 235) ${((customWidth - 50) / 50) * 100}%, rgb(229, 231, 235) 100%)`,
            }}
          />

          {/* Tick marks */}
          <div className="flex justify-between mt-1 px-1">
            <span className="text-xs text-gray-500">50%</span>
            <span className="text-xs text-gray-500">75%</span>
            <span className="text-xs text-gray-500">100%</span>
          </div>
        </div>

        {isCustom && (
          <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Using custom width: {customWidth}% of screen
            </p>
          </div>
        )}
      </div>

      {/* Visual Preview */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Preview
        </label>
        <div className="relative h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-16 bg-primary-500/20 border-2 border-primary-500 rounded transition-all duration-300"
              style={{
                width: `${isCustom ? customWidth : widthOptions.find((o) => o.value === currentWidth)?.percentage || 80}%`,
              }}
            >
              <div className="h-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                  Content Area
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Defaults Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
              Responsive Defaults
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
              <li>• Screens below 1920×1080: 80% width (recommended)</li>
              <li>• Screens 1920×1080 and above: 70% width</li>
              <li>• Mobile devices: Full width automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidthControl;
