import React, { useState, useEffect } from 'react';
import {
  List,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Database,
} from 'lucide-react';

interface FilterList {
  id: string;
  name: string;
  url: string;
  description?: string;
  enabled: boolean;
  autoUpdate: boolean;
  updateInterval: number; // hours
  lastUpdated?: number;
  lastChecked?: number;
  filterCount: number;
  blockedCount: number;
  category: 'ads' | 'privacy' | 'malware' | 'social' | 'custom';
  source: 'builtin' | 'community' | 'custom';
  version?: string;
  homepage?: string;
  license?: string;
  maintainer?: string;
  format: 'easylist' | 'hosts' | 'adguard' | 'ublock';
  priority: number;
  isSubscribed: boolean;
  tags: string[];
}

interface FilterListManagerProps {
  currentTier: number;
}

const BUILTIN_LISTS: FilterList[] = [
  {
    id: 'easylist',
    name: 'EasyList',
    url: 'https://easylist.to/easylist/easylist.txt',
    description: 'Primary ad blocking list',
    enabled: true,
    autoUpdate: true,
    updateInterval: 24,
    filterCount: 75000,
    blockedCount: 0,
    category: 'ads',
    source: 'builtin',
    version: '2024.1',
    homepage: 'https://easylist.to',
    format: 'easylist',
    priority: 1,
    isSubscribed: true,
    tags: ['essential', 'ads', 'popular'],
  },
  {
    id: 'easyprivacy',
    name: 'EasyPrivacy',
    url: 'https://easylist.to/easylist/easyprivacy.txt',
    description: 'Privacy protection list',
    enabled: true,
    autoUpdate: true,
    updateInterval: 24,
    filterCount: 25000,
    blockedCount: 0,
    category: 'privacy',
    source: 'builtin',
    version: '2024.1',
    homepage: 'https://easylist.to',
    format: 'easylist',
    priority: 2,
    isSubscribed: true,
    tags: ['privacy', 'tracking', 'essential'],
  },
  {
    id: 'malware-domains',
    name: 'Malware Domain List',
    url: 'https://malwaredomainlist.com/hostslist/hosts.txt',
    description: 'Block malicious domains',
    enabled: false,
    autoUpdate: true,
    updateInterval: 48,
    filterCount: 15000,
    blockedCount: 0,
    category: 'malware',
    source: 'builtin',
    format: 'hosts',
    priority: 3,
    isSubscribed: false,
    tags: ['security', 'malware', 'phishing'],
  },
];

const COMMUNITY_LISTS: FilterList[] = [
  {
    id: 'fanboy-social',
    name: "Fanboy's Social Blocking List",
    url: 'https://easylist.to/easylist/fanboy-social.txt',
    description: 'Block social media widgets',
    enabled: false,
    autoUpdate: true,
    updateInterval: 72,
    filterCount: 12000,
    blockedCount: 0,
    category: 'social',
    source: 'community',
    format: 'easylist',
    priority: 10,
    isSubscribed: false,
    tags: ['social', 'widgets', 'performance'],
  },
  {
    id: 'peter-lowe',
    name: "Peter Lowe's Ad Server List",
    url: 'https://pgl.yoyo.org/adservers/serverlist.php',
    description: 'Comprehensive ad server blocking',
    enabled: false,
    autoUpdate: true,
    updateInterval: 168,
    filterCount: 3500,
    blockedCount: 0,
    category: 'ads',
    source: 'community',
    format: 'hosts',
    priority: 11,
    isSubscribed: false,
    tags: ['ads', 'servers', 'lightweight'],
  },
];

export const FilterListManager: React.FC<FilterListManagerProps> = ({ currentTier }) => {
  const [lists, setLists] = useState<FilterList[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddList, setShowAddList] = useState(false);
  const [newList, setNewList] = useState<Partial<FilterList>>({
    name: '',
    url: '',
    description: '',
    category: 'custom',
    format: 'easylist',
    autoUpdate: true,
    updateInterval: 24,
    tags: [],
  });
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadFilterLists();
  }, []);

  const loadFilterLists = async () => {
    try {
      const result = await chrome.storage.local.get('filterLists');
      if (result.filterLists) {
        setLists(result.filterLists);
      } else {
        // Initialize with builtin lists
        const initialLists = [...BUILTIN_LISTS];
        await chrome.storage.local.set({ filterLists: initialLists });
        setLists(initialLists);
      }
    } catch {
      console.error('Failed to load filter lists:', error);
    }
  };

  const saveFilterLists = async (updatedLists: FilterList[]) => {
    try {
      await chrome.storage.local.set({ filterLists: updatedLists });
      setLists(updatedLists);

      // Notify background script
      chrome.runtime.sendMessage({
        action: 'filterListsUpdated',
        lists: updatedLists,
      });
    } catch {
      console.error('Failed to save filter lists:', error);
    }
  };

  const addCustomList = async () => {
    if (!newList.name || !newList.url) {
      alert('Please provide a name and URL for the filter list');
      return;
    }

    const list: FilterList = {
      id: `custom-${Date.now()}`,
      name: newList.name,
      url: newList.url,
      description: newList.description || '',
      enabled: true,
      autoUpdate: newList.autoUpdate || false,
      updateInterval: newList.updateInterval || 168,
      filterCount: 0,
      blockedCount: 0,
      category: (newList.category as any) || 'custom',
      source: 'custom',
      format: (newList.format as any) || 'easylist',
      priority: lists.length + 1,
      isSubscribed: true,
      tags: newList.tags || [],
    };

    const updatedLists = [...lists, list];
    await saveFilterLists(updatedLists);

    // Reset form
    setNewList({
      name: '',
      url: '',
      description: '',
      category: 'custom',
      format: 'easylist',
      autoUpdate: true,
      updateInterval: 24,
      tags: [],
    });
    setShowAddList(false);

    // Trigger immediate update
    await updateFilterList(list.id);
  };

  const toggleList = async (id: string) => {
    const updatedLists = lists.map((list) =>
      list.id === id ? { ...list, enabled: !list.enabled } : list
    );
    await saveFilterLists(updatedLists);
  };

  const deleteList = async (id: string) => {
    if (lists.find((l) => l.id === id)?.source === 'builtin') {
      alert('Cannot delete built-in filter lists');
      return;
    }

    const updatedLists = lists.filter((list) => list.id !== id);
    await saveFilterLists(updatedLists);
  };

  const updateFilterList = async (id: string) => {
    setIsUpdating(id);
    setUpdateProgress({ ...updateProgress, [id]: 0 });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUpdateProgress((prev) => ({
          ...prev,
          [id]: Math.min((prev[id] || 0) + 10, 90),
        }));
      }, 200);

      // Send update request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'updateFilterList',
        listId: id,
      });

      clearInterval(progressInterval);
      setUpdateProgress({ ...updateProgress, [id]: 100 });

      if (response?.success) {
        const updatedLists = lists.map((list) =>
          list.id === id
            ? {
                ...list,
                lastUpdated: Date.now(),
                lastChecked: Date.now(),
                filterCount: response.filterCount || list.filterCount,
              }
            : list
        );
        await saveFilterLists(updatedLists);
      }

      setTimeout(() => {
        setUpdateProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[id];
          return newProgress;
        });
      }, 1000);
    } catch {
      console.error('Failed to update filter list:', error);
      alert('Failed to update filter list');
    } finally {
      setIsUpdating(null);
    }
  };

  const updateAllLists = async () => {
    for (const list of lists.filter((l) => l.enabled && l.autoUpdate)) {
      await updateFilterList(list.id);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limiting
    }
  };

  const subscribeToList = async (listId: string) => {
    const communityList = COMMUNITY_LISTS.find((l) => l.id === listId);
    if (!communityList) return;

    const updatedLists = [...lists, { ...communityList, isSubscribed: true }];
    await saveFilterLists(updatedLists);
    await updateFilterList(listId);
  };

  const exportLists = () => {
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      lists: lists.filter((l) => l.source === 'custom'),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `filter-lists-${Date.now()}.json`);
    linkElement.click();
  };

  const importLists = () => {
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
          if (data.lists && Array.isArray(data.lists)) {
            const importedLists = data.lists.map((list: FilterList) => ({
              ...list,
              id: `imported-${Date.now()}-${Math.random()}`,
            }));
            const updatedLists = [...lists, ...importedLists];
            await saveFilterLists(updatedLists);
            alert(`Imported ${importedLists.length} filter lists successfully!`);
          }
        } catch {
          alert('Failed to import filter lists. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  if (currentTier < 4) {
    return (
      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <List className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Filter List Manager</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Upgrade to Tier 4 to unlock advanced filter list management, custom subscriptions, and
          import/export functionality.
        </p>
        <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
          Upgrade to Tier 4
        </button>
      </div>
    );
  }

  const filteredLists = lists.filter((list) => {
    const matchesSearch =
      searchQuery === '' ||
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || list.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'ads', 'privacy', 'malware', 'social', 'custom'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Filter List Manager</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
            Tier 4 Feature
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={updateAllLists}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Update All</span>
          </button>
          <button
            onClick={importLists}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Import lists"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={exportLists}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Export lists"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddList(true)}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add List</span>
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
            placeholder="Search filter lists..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Add List Form */}
      {showAddList && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Add Custom Filter List</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
              <input
                type="text"
                value={newList.name}
                onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Custom Ad Block List"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newList.category}
                onChange={(e) => setNewList({ ...newList, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="ads">Ads</option>
                <option value="privacy">Privacy</option>
                <option value="malware">Malware</option>
                <option value="social">Social</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter List URL</label>
            <input
              type="url"
              value={newList.url}
              onChange={(e) => setNewList({ ...newList, url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/filters.txt"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newList.description}
              onChange={(e) => setNewList({ ...newList, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={2}
              placeholder="What does this filter list block?"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                value={newList.format}
                onChange={(e) => setNewList({ ...newList, format: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="easylist">EasyList</option>
                <option value="hosts">Hosts File</option>
                <option value="adguard">AdGuard</option>
                <option value="ublock">uBlock Origin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Interval (hours)
              </label>
              <input
                type="number"
                value={newList.updateInterval}
                onChange={(e) =>
                  setNewList({ ...newList, updateInterval: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                min="1"
                max="720"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newList.autoUpdate}
                onChange={(e) => setNewList({ ...newList, autoUpdate: e.target.checked })}
                className="rounded text-purple-600"
              />
              <span className="text-sm text-gray-700">Enable automatic updates</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddList(false);
                setNewList({
                  name: '',
                  url: '',
                  description: '',
                  category: 'custom',
                  format: 'easylist',
                  autoUpdate: true,
                  updateInterval: 24,
                  tags: [],
                });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={addCustomList}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add List
            </button>
          </div>
        </div>
      )}

      {/* Filter Lists */}
      <div className="space-y-3">
        {filteredLists.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No filter lists found</p>
          </div>
        ) : (
          filteredLists.map((list) => (
            <div
              key={list.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{list.name}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        list.source === 'builtin'
                          ? 'bg-blue-100 text-blue-700'
                          : list.source === 'community'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {list.source}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        list.category === 'ads'
                          ? 'bg-red-100 text-red-700'
                          : list.category === 'privacy'
                            ? 'bg-indigo-100 text-indigo-700'
                            : list.category === 'malware'
                              ? 'bg-orange-100 text-orange-700'
                              : list.category === 'social'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {list.category}
                    </span>
                  </div>

                  {list.description && (
                    <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                  )}

                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Filter className="w-3 h-3" />
                      <span>{list.filterCount.toLocaleString()} filters</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>{list.blockedCount.toLocaleString()} blocked</span>
                    </span>
                    {list.lastUpdated && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(list.lastUpdated).toLocaleDateString()}</span>
                      </span>
                    )}
                    {list.autoUpdate && (
                      <span className="flex items-center space-x-1">
                        <RefreshCw className="w-3 h-3" />
                        <span>Every {list.updateInterval}h</span>
                      </span>
                    )}
                  </div>

                  {/* Update Progress */}
                  {updateProgress[list.id] !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${updateProgress[list.id]}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {list.tags && list.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {list.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleList(list.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      list.enabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={list.enabled ? 'Disable' : 'Enable'}
                  >
                    {list.enabled ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => updateFilterList(list.id)}
                    disabled={isUpdating === list.id}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Update now"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isUpdating === list.id ? 'animate-spin' : ''}`}
                    />
                  </button>
                  {list.homepage && (
                    <a
                      href={list.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Visit homepage"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {list.source === 'custom' && (
                    <button
                      onClick={() => deleteList(list.id)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Delete list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Community Lists */}
      {currentTier >= 4 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Available Community Lists</h3>
          <div className="space-y-3">
            {COMMUNITY_LISTS.filter((cl) => !lists.find((l) => l.id === cl.id)).map((list) => (
              <div
                key={list.id}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{list.name}</h4>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        community
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{list.filterCount.toLocaleString()} filters</span>
                      <span>{list.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => subscribeToList(list.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Subscribe</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {lists.filter((l) => l.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Active Lists</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {lists.reduce((sum, l) => sum + (l.enabled ? l.filterCount : 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Filters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {lists.reduce((sum, l) => sum + l.blockedCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Blocked</div>
          </div>
        </div>
      </div>
    </div>
  );
};
