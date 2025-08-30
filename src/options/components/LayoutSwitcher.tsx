import React from 'react';
import { LayoutType } from '../layouts/types';
import { Layout, Sidebar, Menu, PanelLeft } from 'lucide-react';

interface LayoutSwitcherProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ currentLayout, onLayoutChange }) => {
  const layouts: { type: LayoutType; label: string; icon: React.FC<any>; description: string }[] = [
    {
      type: 'tabs',
      label: 'Tabs Layout',
      icon: Layout,
      description: 'Traditional horizontal tabs at the top'
    },
    {
      type: 'sidebar',
      label: 'Sidebar Layout',
      icon: Sidebar,
      description: 'Vertical navigation sidebar on the left'
    },
    {
      type: 'header',
      label: 'Header Menu',
      icon: Menu,
      description: 'Dropdown menus in the header'
    },
    {
      type: 'header-sidebar',
      label: 'Header + Sidebar',
      icon: PanelLeft,
      description: 'Combined header and sidebar navigation'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Layout Style
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose how you want the options page to be organized
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          const isActive = currentLayout === layout.type;

          return (
            <button
              key={layout.type}
              onClick={() => onLayoutChange(layout.type)}
              className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                ${isActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full" />
                </div>
              )}

              <Icon className={`w-8 h-8 mb-2 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`} />
              
              <h4 className={`font-medium text-sm mb-1 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {layout.label}
              </h4>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {layout.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};