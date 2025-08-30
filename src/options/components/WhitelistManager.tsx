import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Globe,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Download,
  Upload,
  Star,
  StarOff,
  Edit,
  Save,
  X,
  Link,
  FileText,
  ToggleLeft,
  ToggleRight,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

type WhitelistType = 'domain' | 'page' | 'regex';
type WhitelistScope = 'all' | 'ads' | 'trackers';

interface WhitelistEntry {
  id: string;
  domain: string;
  url?: string;
  type: 'domain' | 'page' | 'regex';
  reason?: string;
  enabled: boolean;
  temporary: boolean;
  expiresAt?: number;
  createdAt: number;
  lastUsed?: number;
  hitCount: number;
  tags: string[];
  priority: number;
  isFavorite: boolean;
  notes?: string;
  scope: 'all' | 'ads' | 'trackers' | 'social' | 'custom';
  customRules?: string[];
}

interface WhitelistGroup {
  id: string;
  name: string;
  description?: string;
  entries: string[]; // entry IDs
  enabled: boolean;
  icon?: string;
  color?: string;
}

interface WhitelistManagerProps {
  currentTier: number;
}

export const WhitelistManager: React.FC<WhitelistManagerProps> = ({ currentTier }) => {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [groups, setGroups] = useState<WhitelistGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<WhitelistEntry>>({
    domain: '',
    type: 'domain',
    reason: '',
    enabled: true,
    temporary: false,
    scope: 'all',
    tags: [],
    isFavorite: false
  });
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Predefined common whitelist entries
  const COMMON_ENTRIES = [
    { domain: 'google.com', reason: 'Search engine', scope: 'trackers' },
    { domain: 'youtube.com', reason: 'Video platform', scope: 'ads' },
    { domain: 'facebook.com', reason: 'Social media', scope: 'trackers' },
    { domain: 'twitter.com', reason: 'Social media', scope: 'trackers' },
    { domain: 'linkedin.com', reason: 'Professional network', scope: 'trackers' },
    { domain: 'github.com', reason: 'Code repository', scope: 'all' },
    { domain: 'stackoverflow.com', reason: 'Developer community', scope: 'ads' }
  ];

  useEffect(() => {
    loadWhitelist();
    loadGroups();
    cleanupExpiredEntries();
  }, []);

  const loadWhitelist = async () => {
    try {
      const result = await chrome.storage.local.get('whitelist');
      if (result.whitelist) {
        setEntries(result.whitelist);
      }
    } catch (error) {
      console.error('Failed to load whitelist:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const result = await chrome.storage.local.get('whitelistGroups');
      if (result.whitelistGroups) {
        setGroups(result.whitelistGroups);
      }
    } catch (error) {
      console.error('Failed to load whitelist groups:', error);
    }
  };

  const saveWhitelist = async (updatedEntries: WhitelistEntry[]) => {
    try {
      await chrome.storage.local.set({ whitelist: updatedEntries });
      setEntries(updatedEntries);
      
      // Notify content scripts
      chrome.runtime.sendMessage({
        action: 'whitelistUpdated',
        entries: updatedEntries
      });
    } catch (error) {
      console.error('Failed to save whitelist:', error);
    }
  };

  const cleanupExpiredEntries = async () => {
    const now = Date.now();
    const activeEntries = entries.filter(entry => 
      !entry.temporary || !entry.expiresAt || entry.expiresAt > now
    );
    
    if (activeEntries.length !== entries.length) {
      await saveWhitelist(activeEntries);
    }
  };

  const addEntry = async () => {
    if (!newEntry.domain) {
      alert('Please provide a domain or URL');
      return;
    }

    const entry: WhitelistEntry = {
      id: Date.now().toString(),
      domain: newEntry.domain,
      url: newEntry.url,
      type: (newEntry.type as WhitelistType) || 'domain',
      reason: newEntry.reason,
      enabled: newEntry.enabled !== false,
      temporary: newEntry.temporary || false,
      expiresAt: newEntry.temporary && newEntry.expiresAt 
        ? newEntry.expiresAt 
        : undefined,
      createdAt: Date.now(),
      hitCount: 0,
      tags: newEntry.tags || [],
      priority: entries.length + 1,
      isFavorite: newEntry.isFavorite || false,
      scope: (newEntry.scope as WhitelistScope) || 'all',
      notes: newEntry.notes
    };

    const updatedEntries = [...entries, entry];
    await saveWhitelist(updatedEntries);
    
    // Reset form
    setNewEntry({
      domain: '',
      type: 'domain',
      reason: '',
      enabled: true,
      temporary: false,
      scope: 'all',
      tags: [],
      isFavorite: false
    });
    setShowAddEntry(false);
  };

  const updateEntry = async (id: string, updates: Partial<WhitelistEntry>) => {
    const updatedEntries = entries.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    );
    await saveWhitelist(updatedEntries);
    setEditingEntry(null);
  };

  const deleteEntry = async (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    await saveWhitelist(updatedEntries);
  };

  const toggleEntry = async (id: string) => {
    const updatedEntries = entries.map(entry =>
      entry.id === id ? { ...entry, enabled: !entry.enabled } : entry
    );
    await saveWhitelist(updatedEntries);
  };

  const toggleFavorite = async (id: string) => {
    const updatedEntries = entries.map(entry =>
      entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
    );
    await saveWhitelist(updatedEntries);
  };

  const quickAddCommon = async (common: any) => {
    const entry: WhitelistEntry = {
      id: Date.now().toString(),
      domain: common.domain,
      type: 'domain',
      reason: common.reason,
      enabled: true,
      temporary: false,
      createdAt: Date.now(),
      hitCount: 0,
      tags: [],
      priority: entries.length + 1,
      isFavorite: false,
      scope: common.scope
    };

    const updatedEntries = [...entries, entry];
    await saveWhitelist(updatedEntries);
  };

  const exportWhitelist = () => {
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      entries: entries,
      groups: groups
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `whitelist-${Date.now()}.json`);
    linkElement.click();
  };

  const importWhitelist = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.entries) {
            const importedEntries = data.entries.map((entry: WhitelistEntry) => ({
              ...entry,
              id: `imported-${Date.now()}-${Math.random()}`
            }));
            const updatedEntries = [...entries, ...importedEntries];
            await saveWhitelist(updatedEntries);
            
            if (data.groups) {
              const importedGroups = data.groups.map((group: WhitelistGroup) => ({
                ...group,
                id: `imported-${Date.now()}-${Math.random()}`
              }));
              await chrome.storage.local.set({ 
                whitelistGroups: [...groups, ...importedGroups] 
              });
              setGroups([...groups, ...importedGroups]);
            }
            
            alert(`Imported ${importedEntries.length} whitelist entries successfully!`);
          }
        } catch (error) {
          alert('Failed to import whitelist. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const testWhitelistEntry = async (entry: WhitelistEntry) => {
    // Send test request to background script
    const response = await chrome.runtime.sendMessage({
      action: 'testWhitelistEntry',
      entry: entry
    });
    
    if (response?.success) {
      alert(`Entry "${entry.domain}" is working correctly!`);
    } else {
      alert(`Entry "${entry.domain}" test failed. Please check the pattern.`);
    }
  };

  if (currentTier < 4) {
    return (
      <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Whitelist Manager</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Upgrade to Tier 4 to unlock advanced whitelist management with temporary entries, groups, and regex support.
        </p>
        <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          Upgrade to Tier 4
        </button>
      </div>
    );
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesScope = selectedScope === 'all' || 
      entry.scope === selectedScope ||
      (selectedScope === 'favorites' && entry.isFavorite);
    
    return matchesSearch && matchesScope;
  });

  const scopes = ['all', 'ads', 'trackers', 'social', 'custom', 'favorites'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Whitelist Manager</h2>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            Tier 4 Feature
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGroupManager(!showGroupManager)}
            className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Groups
          </button>
          <button
            onClick={importWhitelist}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Import whitelist"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={exportWhitelist}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Export whitelist"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddEntry(true)}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search whitelist entries..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex space-x-2">
          {scopes.map(scope => (
            <button
              key={scope}
              onClick={() => setSelectedScope(scope)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedScope === scope
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {scope === 'favorites' ? (
                <Star className="w-4 h-4" />
              ) : (
                scope.charAt(0).toUpperCase() + scope.slice(1)
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Common Sites */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Add Popular Sites</h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_ENTRIES.filter(ce => !entries.find(e => e.domain === ce.domain)).map(common => (
            <button
              key={common.domain}
              onClick={() => quickAddCommon(common)}
              className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>{common.domain}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Entry Form */}
      {showAddEntry && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Add Whitelist Entry</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain or URL
              </label>
              <input
                type="text"
                value={newEntry.domain}
                onChange={(e) => setNewEntry({ ...newEntry, domain: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="example.com or https://example.com/page"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as WhitelistType })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="domain">Domain</option>
                <option value="page">Specific Page</option>
                <option value="regex">Regular Expression</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <input
                type="text"
                value={newEntry.reason}
                onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Why whitelist this site?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scope
              </label>
              <select
                value={newEntry.scope}
                onChange={(e) => setNewEntry({ ...newEntry, scope: e.target.value as WhitelistScope })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Blocking</option>
                <option value="ads">Ads Only</option>
                <option value="trackers">Trackers Only</option>
                <option value="social">Social Only</option>
                <option value="custom">Custom Rules</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="Additional notes about this whitelist entry"
            />
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newEntry.enabled}
                onChange={(e) => setNewEntry({ ...newEntry, enabled: e.target.checked })}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-700">Enable immediately</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newEntry.temporary}
                onChange={(e) => setNewEntry({ ...newEntry, temporary: e.target.checked })}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-700">Temporary entry</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newEntry.isFavorite}
                onChange={(e) => setNewEntry({ ...newEntry, isFavorite: e.target.checked })}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-700">Mark as favorite</span>
            </label>
          </div>

          {newEntry.temporary && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires In
              </label>
              <select
                onChange={(e) => {
                  const hours = parseInt(e.target.value);
                  setNewEntry({
                    ...newEntry,
                    expiresAt: Date.now() + (hours * 60 * 60 * 1000)
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 Hour</option>
                <option value="4">4 Hours</option>
                <option value="24">1 Day</option>
                <option value="168">1 Week</option>
                <option value="720">1 Month</option>
              </select>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddEntry(false);
                setNewEntry({
                  domain: '',
                  type: 'domain',
                  reason: '',
                  enabled: true,
                  temporary: false,
                  scope: 'all',
                  tags: [],
                  isFavorite: false
                });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={addEntry}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Entry
            </button>
          </div>
        </div>
      )}

      {/* Whitelist Entries */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No whitelist entries found</p>
            <p className="text-sm text-gray-500 mt-1">
              Add sites you trust to the whitelist
            </p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{entry.domain}</h4>
                    {entry.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      entry.type === 'domain' ? 'bg-blue-100 text-blue-700' :
                      entry.type === 'page' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {entry.type}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      entry.scope === 'all' ? 'bg-gray-100 text-gray-700' :
                      entry.scope === 'ads' ? 'bg-red-100 text-red-700' :
                      entry.scope === 'trackers' ? 'bg-orange-100 text-orange-700' :
                      entry.scope === 'social' ? 'bg-pink-100 text-pink-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {entry.scope}
                    </span>
                    {entry.temporary && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Temporary</span>
                      </span>
                    )}
                  </div>

                  {entry.reason && (
                    <p className="text-sm text-gray-600 mt-1">{entry.reason}</p>
                  )}

                  {editingEntry === entry.id ? (
                    <div className="mt-2">
                      <textarea
                        value={entry.notes || ''}
                        onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        rows={2}
                        placeholder="Add notes..."
                      />
                    </div>
                  ) : entry.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">{entry.notes}</p>
                  )}

                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Added: {new Date(entry.createdAt).toLocaleDateString()}</span>
                    <span>Hits: {entry.hitCount}</span>
                    {entry.lastUsed && (
                      <span>Last used: {new Date(entry.lastUsed).toLocaleDateString()}</span>
                    )}
                    {entry.temporary && entry.expiresAt && (
                      <span className="text-yellow-600">
                        Expires: {new Date(entry.expiresAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleFavorite(entry.id)}
                    className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                    title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {entry.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingEntry(editingEntry === entry.id ? null : entry.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit notes"
                  >
                    {editingEntry === entry.id ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => testWhitelistEntry(entry)}
                    className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                    title="Test entry"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleEntry(entry.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      entry.enabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={entry.enabled ? 'Disable' : 'Enable'}
                  >
                    {entry.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete entry"
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
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {entries.filter(e => e.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {entries.filter(e => e.temporary).length}
            </div>
            <div className="text-sm text-gray-600">Temporary</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {entries.filter(e => e.isFavorite).length}
            </div>
            <div className="text-sm text-gray-600">Favorites</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {entries.reduce((sum, e) => sum + e.hitCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Hits</div>
          </div>
        </div>
      </div>
    </div>
  );
};