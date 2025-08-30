import React from 'react';
import { LayoutProps } from './types';

export const TabsLayout: React.FC<LayoutProps> = ({ tabs, activeTab, onTabChange, children }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <nav
            className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 px-6"
            aria-label="Tabs"
          >
            <div className="flex space-x-6 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={
                      isActive
                        ? 'flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      borderBottomColor: isActive ? 'var(--primary-500, #3b82f6)' : 'transparent',
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
};
