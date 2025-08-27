import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Save,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  Code,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Star,
  Sparkles,
  Gift
} from 'lucide-react';
import { earlyAdopterService } from '../../shared/services/early-adopter.service';
import { EarlyAdopterStatus } from '../../shared/constants/marketing';

interface CustomFilter {
  id: string;
  name: string;
  selector: string;
  description?: string;
  enabled: boolean;
  createdAt: number;
  lastUsed?: number;
  matchCount: number;
  isScheduled?: boolean;
  schedule?: {
    days: string[];
    startTime?: string;
    endTime?: string;
  };
  isRegex?: boolean;
}

interface CustomFiltersProps {
  currentTier: number;
}

export const CustomFilters: React.FC<CustomFiltersProps> = ({ currentTier }) => {
  const [filters, setFilters] = useState<CustomFilter[]>([]);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<CustomFilter>>({
    name: '',
    selector: '',
    description: '',
    enabled: true,
    isRegex: false,
    isScheduled: false
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingSelector, setIsTestingSelector] = useState(false);
  const [earlyAdopterStatus, setEarlyAdopterStatus] = useState<EarlyAdopterStatus | null>(null);

  useEffect(() => {
    loadFilters();
    checkEarlyAdopterStatus();
  }, []);

  const checkEarlyAdopterStatus = async () => {
    try {
      const status = await earlyAdopterService.initializeUser();
      setEarlyAdopterStatus(status);
    } catch (error) {
      console.error('Failed to check early adopter status:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const result = await chrome.storage.local.get('customFilters');
      if (result.customFilters) {
        setFilters(result.customFilters);
      }
    } catch (error) {
      console.error('Failed to load custom filters:', error);
    }
  };

  const saveFilters = async (updatedFilters: CustomFilter[]) => {
    try {
      await chrome.storage.local.set({ customFilters: updatedFilters });
      setFilters(updatedFilters);
      
      // Notify content scripts
      chrome.runtime.sendMessage({
        action: 'customFiltersUpdated',
        filters: updatedFilters
      });
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  };

  const addFilter = () => {
    if (!newFilter.name || !newFilter.selector) {
      alert('Please provide a name and selector');
      return;
    }

    const filter: CustomFilter = {
      id: Date.now().toString(),
      name: newFilter.name,
      selector: newFilter.selector,
      description: newFilter.description,
      enabled: newFilter.enabled !== false,
      createdAt: Date.now(),
      matchCount: 0,
      isRegex: newFilter.isRegex,
      isScheduled: newFilter.isScheduled,
      schedule: newFilter.isScheduled ? {
        days: selectedDays,
        startTime: (document.getElementById('startTime') as HTMLInputElement)?.value,
        endTime: (document.getElementById('endTime') as HTMLInputElement)?.value
      } : undefined
    };

    const updatedFilters = [...filters, filter];
    saveFilters(updatedFilters);
    
    // Reset form
    setNewFilter({
      name: '',
      selector: '',
      description: '',
      enabled: true,
      isRegex: false,
      isScheduled: false
    });
    setSelectedDays([]);
    setShowAddFilter(false);
  };

  const deleteFilter = (id: string) => {
    const updatedFilters = filters.filter(f => f.id !== id);
    saveFilters(updatedFilters);
  };

  const toggleFilter = (id: string) => {
    const updatedFilters = filters.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    saveFilters(updatedFilters);
  };

  const testSelector = async () => {
    if (!newFilter.selector) return;
    
    setIsTestingSelector(true);
    
    // Send message to content script to test selector
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'testSelector',
        selector: newFilter.selector,
        isRegex: newFilter.isRegex
      }, (response) => {
        if (response?.matchCount !== undefined) {
          setTestResult(`Found ${response.matchCount} matching element(s)`);
        } else {
          setTestResult('Error testing selector');
        }
        setIsTestingSelector(false);
      });
    }
  };

  const exportFilters = () => {
    const dataStr = JSON.stringify(filters, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `shieldpro-filters-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFilters = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedFilters = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedFilters)) {
            const updatedFilters = [...filters, ...importedFilters];
            await saveFilters(updatedFilters);
            alert(`Imported ${importedFilters.length} filters successfully!`);
          }
        } catch (error) {
          alert('Failed to import filters. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const activateElementPicker = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'activateElementPicker' });
      window.close(); // Close options page to use picker
    }
  };

  // Early adopters get full access regardless of tier
  const hasAccess = earlyAdopterStatus?.isEarlyAdopter || currentTier >= 3;
  const isEarlyAdopter = earlyAdopterStatus?.isEarlyAdopter || false;
  const userNumber = earlyAdopterStatus?.userNumber || 0;

  if (!hasAccess) {
    return (
      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Custom Filters</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Upgrade to Tier 3 to unlock custom filter creation, element picker, and advanced blocking rules.
        </p>
        <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
          Upgrade to Tier 3
        </button>
      </div>
    );
  }

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Filter className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Custom Filters</h2>
          
          {/* Tier Badge */}
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs rounded-full font-semibold flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>Tier 3 Feature</span>
            </span>
            
            {isEarlyAdopter && (
              <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 text-xs rounded-full font-semibold flex items-center space-x-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>🎉 FREE for Early Adopter #{userNumber.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={activateElementPicker}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Element Picker</span>
          </button>
          <button
            onClick={importFilters}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Import filters"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={exportFilters}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Export filters"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddFilter(true)}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Filter</span>
          </button>
        </div>
      </div>

      {/* Add Filter Form */}
      {showAddFilter && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Filter</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Name
              </label>
              <input
                type="text"
                value={newFilter.name}
                onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Remove sidebar ads"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newFilter.description}
                onChange={(e) => setNewFilter({ ...newFilter, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="What does this filter do?"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CSS Selector or Pattern
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newFilter.selector}
                onChange={(e) => setNewFilter({ ...newFilter, selector: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder=".ad-container, #sidebar-ads, [class*='sponsored']"
              />
              <button
                onClick={testSelector}
                disabled={isTestingSelector}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {isTestingSelector ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test'}
              </button>
            </div>
            {testResult && (
              <p className="mt-2 text-sm text-gray-600">{testResult}</p>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newFilter.enabled}
                onChange={(e) => setNewFilter({ ...newFilter, enabled: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Enable immediately</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newFilter.isRegex}
                onChange={(e) => setNewFilter({ ...newFilter, isRegex: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Use as Regular Expression</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newFilter.isScheduled}
                onChange={(e) => setNewFilter({ ...newFilter, isScheduled: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Schedule this filter</span>
            </label>
          </div>

          {/* Schedule Settings */}
          {newFilter.isScheduled && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule Settings</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Active Days</label>
                  <div className="flex space-x-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDays(prev =>
                            prev.includes(day)
                              ? prev.filter(d => d !== day)
                              : [...prev, day]
                          );
                        }}
                        className={`px-3 py-1 text-sm rounded ${
                          selectedDays.includes(day)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      id="startTime"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      id="endTime"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddFilter(false);
                setNewFilter({
                  name: '',
                  selector: '',
                  description: '',
                  enabled: true,
                  isRegex: false,
                  isScheduled: false
                });
                setTestResult('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={addFilter}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters List */}
      <div className="space-y-3">
        {filters.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No custom filters yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first filter or use the element picker
            </p>
          </div>
        ) : (
          filters.map(filter => (
            <div key={filter.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{filter.name}</h4>
                    {filter.isRegex && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        RegEx
                      </span>
                    )}
                    {filter.isScheduled && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Scheduled</span>
                      </span>
                    )}
                  </div>
                  
                  {filter.description && (
                    <p className="text-sm text-gray-600 mt-1">{filter.description}</p>
                  )}
                  
                  <div className="mt-2 space-y-1">
                    <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded block overflow-x-auto">
                      {filter.selector}
                    </code>
                    
                    {filter.isScheduled && filter.schedule && (
                      <div className="text-xs text-gray-500">
                        Active: {filter.schedule.days.join(', ')}
                        {filter.schedule.startTime && filter.schedule.endTime && (
                          <span> • {filter.schedule.startTime} - {filter.schedule.endTime}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Created: {new Date(filter.createdAt).toLocaleDateString()}</span>
                    <span>Matches: {filter.matchCount}</span>
                    {filter.lastUsed && (
                      <span>Last used: {new Date(filter.lastUsed).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleFilter(filter.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      filter.enabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={filter.enabled ? 'Disable' : 'Enable'}
                  >
                    {filter.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(filter.selector);
                      alert('Selector copied to clipboard!');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy selector"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteFilter(filter.id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete filter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {filters.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {filters.filter(f => f.enabled).length} active filters
              </span>
            </div>
            <span className="text-sm text-blue-700">
              Total blocked: {filters.reduce((sum, f) => sum + f.matchCount, 0)} elements
            </span>
          </div>
        </div>
      )}

      {/* Early Adopter Info */}
      {isEarlyAdopter && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-start space-x-3">
            <Gift className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-purple-900 mb-1">
                🎊 Early Adopter Benefit Unlocked!
              </h4>
              <p className="text-xs text-purple-700">
                As Early Adopter #{userNumber.toLocaleString()}, you have lifetime access to this Tier 3 feature. 
                Custom filters help you block any specific elements on any website!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};