import React, { useState, useRef, useEffect } from 'react';
import { LayoutProps } from './types';
import { ChevronDown, Menu, X } from 'lucide-react';

export const HeaderSidebarLayout: React.FC<LayoutProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group tabs by sections for header
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
    <div className="flex h-full min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-64 bg-white dark:bg-gray-800 shadow-lg
          transform transition-transform duration-300 ease-in-out
          pt-16 lg:pt-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="hidden lg:block px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Quick Navigation
          </h3>
        </div>

        {/* Sidebar Navigation */}
        <nav className="h-full overflow-y-auto py-6">
          <div className="px-4 space-y-6">
            {/* Group tabs by section in sidebar */}
            {Object.entries(groupedTabs).map(([section, sectionTabs]) => {
              if (sectionTabs.length === 0) return null;

              return (
                <div key={section}>
                  <h4 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {sectionLabels[section as keyof typeof sectionLabels]}
                  </h4>
                  <div className="space-y-1">
                    {sectionTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            onTabChange(tab.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`
                            w-full flex items-center space-x-3 px-4 py-2 rounded-lg
                            transition-all duration-200 text-left text-sm
                            ${
                              isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }
                          `}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header Navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
          <nav className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6" ref={dropdownRef}>
                {/* Section Dropdowns */}
                {Object.entries(groupedTabs).map(([section, sectionTabs]) => {
                  if (sectionTabs.length === 0) return null;
                  const isActive = getActiveSection() === section;
                  const isOpen = dropdownOpen === section;

                  return (
                    <div key={section} className="relative">
                      <button
                        onClick={() => setDropdownOpen(isOpen ? null : section)}
                        className={`
                          flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm
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
                          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                                  w-full flex items-center space-x-3 px-4 py-2.5
                                  transition-colors text-left text-sm
                                  ${
                                    isTabActive
                                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }
                                `}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
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

              {/* Current page indicator */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Current:</span>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const currentTab = tabs.find((t) => t.id === activeTab);
                    const Icon = currentTab?.icon;
                    return (
                      <>
                        {Icon && <Icon className="w-4 h-4 text-primary-500" />}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {currentTab?.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
