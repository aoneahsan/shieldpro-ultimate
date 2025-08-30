import React, { useState, useRef, useEffect } from 'react';
import { LayoutProps } from './types';
import { ChevronDown } from 'lucide-react';

export const HeaderLayout: React.FC<LayoutProps> = ({ tabs, activeTab, onTabChange, children }) => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group tabs by sections
  const groupedTabs = {
    basic: tabs.filter((t) =>
      ['general', 'filters', 'privacy', 'whitelist', 'tiers'].includes(t.id)
    ),
    advanced: tabs.filter((t) =>
      ['themes', 'custom-filters', 'image-swap', 'backup-sync'].includes(t.id)
    ),
    expert: tabs.filter((t) =>
      [
        'filter-lists',
        'whitelist-manager',
        'regex-patterns',
        'scripts',
        'network',
        'security',
      ].includes(t.id)
    ),
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActiveSection = () => {
    if (groupedTabs.basic.find((t) => t.id === activeTab)) return 'basic';
    if (groupedTabs.advanced.find((t) => t.id === activeTab)) return 'advanced';
    if (groupedTabs.expert.find((t) => t.id === activeTab)) return 'expert';
    return 'basic';
  };

  const sectionLabels = {
    basic: 'Basic Settings',
    advanced: 'Advanced Features',
    expert: 'Expert Tools',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8" ref={dropdownRef}>
              {Object.entries(groupedTabs).map(([section, sectionTabs]) => {
                if (sectionTabs.length === 0) return null;
                const isActive = getActiveSection() === section;
                const isOpen = dropdownOpen === section;

                return (
                  <div key={section} className="relative">
                    <button
                      onClick={() => setDropdownOpen(isOpen ? null : section)}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                        ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <span className="font-medium">
                        {sectionLabels[section as keyof typeof sectionLabels]}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {sectionTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isTabActive = activeTab === tab.id;

                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                onTabChange(tab.id);
                                setDropdownOpen(null);
                              }}
                              className={`
                                w-full flex items-center space-x-3 px-4 py-3
                                transition-colors text-left
                                ${
                                  isTabActive
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }
                              `}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick access to current tab */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Current:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {tabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">{children}</div>
      </main>
    </div>
  );
};
