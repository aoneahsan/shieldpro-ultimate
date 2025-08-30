import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Plus, 
  Trash2, 
  Edit2,
  Save,
  X,
  Search,
  Download,
  Upload,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Link,
  Calendar,
  Star,
  Sparkles,
  Gift
} from 'lucide-react';
import { earlyAdopterService } from '../../shared/services/early-adopter.service';
import { EarlyAdopterStatus } from '../../shared/constants/marketing';

interface WhitelistEntry {
  id: string;
  domain: string;
  pattern?: string;
  description?: string;
  enabled: boolean;
  createdAt: number;
  lastUsed?: number;
  isTemporary?: boolean;
  expiresAt?: number;
  isRegex?: boolean;
  allowedResources?: string[];
}

interface AdvancedWhitelistProps {
  currentTier: number;
}

export const AdvancedWhitelist: React.FC<AdvancedWhitelistProps> = ({ currentTier }) => {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEntry, setShowAddEntry] = useState(false);
  // const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<WhitelistEntry>>({
    domain: '',
    pattern: '',
    description: '',
    enabled: true,
    isRegex: false,
    isTemporary: false,
    allowedResources: []
  });
  const [earlyAdopterStatus, setEarlyAdopterStatus] = useState<EarlyAdopterStatus | null>(null);

  useEffect(() => {
    loadWhitelist();
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

  const loadWhitelist = async () => {
    try {
      const result = await chrome.storage.local.get('advancedWhitelist');
      if (result.advancedWhitelist) {
        setWhitelist(result.advancedWhitelist);
      }
    } catch (error) {
      console.error('Failed to load whitelist:', error);
    }
  };

  const saveWhitelist = async (updatedWhitelist: WhitelistEntry[]) => {
    try {
      await chrome.storage.local.set({ advancedWhitelist: updatedWhitelist });
      setWhitelist(updatedWhitelist);
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'whitelistUpdated',
        whitelist: updatedWhitelist
      });
    } catch (error) {
      console.error('Failed to save whitelist:', error);
    }
  };

  const addEntry = () => {
    if (!newEntry.domain && !newEntry.pattern) {
      alert('Please provide a domain or pattern');
      return;
    }

    const entry: WhitelistEntry = {
      id: Date.now().toString(),
      domain: newEntry.domain || '',
      pattern: newEntry.pattern,
      description: newEntry.description,
      enabled: newEntry.enabled !== false,
      createdAt: Date.now(),
      isRegex: newEntry.isRegex,
      isTemporary: newEntry.isTemporary,
      expiresAt: newEntry.isTemporary 
        ? Date.now() + (parseInt((document.getElementById('tempDuration') as HTMLInputElement)?.value || '24') * 60 * 60 * 1000)
        : undefined,
      allowedResources: newEntry.allowedResources || []
    };

    const updatedWhitelist = [...whitelist, entry];
    saveWhitelist(updatedWhitelist);
    
    // Reset form
    setNewEntry({
      domain: '',
      pattern: '',
      description: '',
      enabled: true,
      isRegex: false,
      isTemporary: false,
      allowedResources: []
    });
    setShowAddEntry(false);
  };

  const deleteEntry = (id: string) => {
    const updatedWhitelist = whitelist.filter(e => e.id !== id);
    saveWhitelist(updatedWhitelist);
  };

  const toggleEntry = (id: string) => {
    const updatedWhitelist = whitelist.map(e => 
      e.id === id ? { ...e, enabled: !e.enabled } : e
    );
    saveWhitelist(updatedWhitelist);
  };

  const exportWhitelist = () => {
    const dataStr = JSON.stringify(whitelist, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `shieldpro-whitelist-${Date.now()}.json`);
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
          const importedEntries = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedEntries)) {
            const updatedWhitelist = [...whitelist, ...importedEntries];
            await saveWhitelist(updatedWhitelist);
            alert(`Imported ${importedEntries.length} entries successfully!`);
          }
        } catch (error) {
          alert('Failed to import whitelist. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const filteredWhitelist = whitelist.filter(entry => 
    entry.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.pattern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resourceTypes = [
    'script', 'image', 'stylesheet', 'font', 'media', 
    'xmlhttprequest', 'sub_frame', 'other'
  ];

  if (currentTier < 3) {
    return (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Advanced Whitelist</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Upgrade to Tier 3 to unlock advanced whitelist features including patterns, regex support, and temporary whitelisting.
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Upgrade to Tier 3
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Advanced Whitelist</h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            Tier 3 Feature
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={importWhitelist}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Import whitelist"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={exportWhitelist}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Export whitelist"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddEntry(true)}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search whitelist entries..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Add Entry Form */}
      {showAddEntry && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Add Whitelist Entry</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain
              </label>
              <input
                type="text"
                value={newEntry.domain}
                onChange={(e) => setNewEntry({ ...newEntry, domain: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pattern (Optional)
              </label>
              <input
                type="text"
                value={newEntry.pattern}
                onChange={(e) => setNewEntry({ ...newEntry, pattern: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="*/path/* or regex pattern"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Why is this site whitelisted?"
            />
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newEntry.enabled}
                onChange={(e) => setNewEntry({ ...newEntry, enabled: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Enable immediately</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newEntry.isRegex}
                onChange={(e) => setNewEntry({ ...newEntry, isRegex: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Use Regular Expression</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newEntry.isTemporary}
                onChange={(e) => setNewEntry({ ...newEntry, isTemporary: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Temporary whitelist</span>
            </label>
          </div>

          {/* Temporary Duration */}
          {newEntry.isTemporary && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                id="tempDuration"
                defaultValue="24"
                min="1"
                max="720"
                className="w-32 px-3 py-2 border rounded-lg"
              />
            </div>
          )}

          {/* Allowed Resources */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Resource Types (Leave empty for all)
            </label>
            <div className="flex flex-wrap gap-2">
              {resourceTypes.map(type => (
                <label key={type} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={newEntry.allowedResources?.includes(type)}
                    onChange={(e) => {
                      const resources = newEntry.allowedResources || [];
                      if (e.target.checked) {
                        setNewEntry({ ...newEntry, allowedResources: [...resources, type] });
                      } else {
                        setNewEntry({ ...newEntry, allowedResources: resources.filter(r => r !== type) });
                      }
                    }}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddEntry(false);
                setNewEntry({
                  domain: '',
                  pattern: '',
                  description: '',
                  enabled: true,
                  isRegex: false,
                  isTemporary: false,
                  allowedResources: []
                });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={addEntry}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>
        </div>
      )}

      {/* Whitelist Entries */}
      <div className="space-y-3">
        {filteredWhitelist.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No whitelist entries yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add trusted sites to allow ads on them
            </p>
          </div>
        ) : (
          filteredWhitelist.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {entry.domain || entry.pattern}
                    </h4>
                    {entry.isRegex && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        RegEx
                      </span>
                    )}
                    {entry.isTemporary && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Temporary</span>
                      </span>
                    )}
                    {!entry.enabled && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  
                  {entry.description && (
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                  )}
                  
                  {entry.pattern && (
                    <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                      Pattern: {entry.pattern}
                    </code>
                  )}
                  
                  {entry.allowedResources && entry.allowedResources.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Allowed: </span>
                      {entry.allowedResources.map(resource => (
                        <span key={resource} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-1">
                          {resource}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Added: {new Date(entry.createdAt).toLocaleDateString()}</span>
                    {entry.lastUsed && (
                      <span>Last used: {new Date(entry.lastUsed).toLocaleDateString()}</span>
                    )}
                    {entry.expiresAt && (
                      <span className="text-yellow-600">
                        Expires: {new Date(entry.expiresAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleEntry(entry.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      entry.enabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={entry.enabled ? 'Disable' : 'Enable'}
                  >
                    {entry.enabled ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
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
      {whitelist.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {whitelist.filter(e => e.enabled).length} active entries
              </span>
            </div>
            <span className="text-sm text-green-700">
              {whitelist.filter(e => e.isTemporary).length} temporary
            </span>
          </div>
        </div>
      )}
    </div>
  );
};