/**
 * Advanced Script Control Panel - Tier 4 Premium Feature
 * Provides granular JavaScript control for websites
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Code, 
  Zap, 
  Globe, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface ScriptRule {
  id: string;
  domain: string;
  scriptType: 'all' | 'analytics' | 'advertising' | 'social' | 'functional' | 'custom';
  action: 'block' | 'allow' | 'delay';
  pattern?: string;
  enabled: boolean;
  createdAt: number;
  lastModified: number;
}

interface DetectedScript {
  url: string;
  type: 'inline' | 'external';
  source?: string;
  size: number;
  blocked: boolean;
  category: 'analytics' | 'advertising' | 'social' | 'functional' | 'unknown';
  domain: string;
}

interface ScriptStats {
  totalScripts: number;
  blockedScripts: number;
  allowedScripts: number;
  savedBandwidth: number;
  performanceGain: number;
}

export const ScriptControlPanel: React.FC = () => {
  const [rules, setRules] = useState<ScriptRule[]>([]);
  const [detectedScripts, setDetectedScripts] = useState<DetectedScript[]>([]);
  const [stats, setStats] = useState<ScriptStats>({
    totalScripts: 0,
    blockedScripts: 0,
    allowedScripts: 0,
    savedBandwidth: 0,
    performanceGain: 0
  });
  const [activeTab, setActiveTab] = useState<'rules' | 'detected' | 'stats'>('rules');
  const [newRuleForm, setNewRuleForm] = useState<Partial<ScriptRule>>({
    domain: '',
    scriptType: 'all',
    action: 'block',
    pattern: '',
    enabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentDomain, setCurrentDomain] = useState<string>('');

  const initializeScriptControl = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load existing rules
      const stored = await chrome.storage.local.get(['scriptRules', 'scriptStats']);
      if (stored.scriptRules) {
        setRules(stored.scriptRules);
      }
      if (stored.scriptStats) {
        setStats(stored.scriptStats);
      }

      // Get detected scripts from current tab
      await loadDetectedScripts();
    } catch (error) {
      console.error('Failed to initialize script control:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeScriptControl();
    getCurrentDomain();
  }, [initializeScriptControl]);


  const getCurrentDomain = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        setCurrentDomain(url.hostname);
        setNewRuleForm(prev => ({ ...prev, domain: url.hostname }));
      }
    } catch (error) {
      console.error('Failed to get current domain:', error);
    }
  };

  const loadDetectedScripts = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Send message to content script to get detected scripts
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'getDetectedScripts'
        });
        
        if (response?.scripts) {
          setDetectedScripts(response.scripts);
        }
      }
    } catch (error) {
      console.error('Failed to load detected scripts:', error);
    }
  };

  const saveRules = async (updatedRules: ScriptRule[]) => {
    try {
      await chrome.storage.local.set({ scriptRules: updatedRules });
      setRules(updatedRules);
    } catch (error) {
      console.error('Failed to save script rules:', error);
    }
  };

  const addRule = () => {
    if (!newRuleForm.domain) return;

    const rule: ScriptRule = {
      id: `rule_${Date.now()}`,
      domain: newRuleForm.domain || '',
      scriptType: newRuleForm.scriptType || 'all',
      action: newRuleForm.action || 'block',
      pattern: newRuleForm.pattern,
      enabled: true,
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    const updatedRules = [...rules, rule];
    saveRules(updatedRules);

    // Reset form
    setNewRuleForm({
      domain: currentDomain,
      scriptType: 'all',
      action: 'block',
      pattern: '',
      enabled: true
    });
  };

  const updateRule = (id: string, updates: Partial<ScriptRule>) => {
    const updatedRules = rules.map(rule => 
      rule.id === id 
        ? { ...rule, ...updates, lastModified: Date.now() }
        : rule
    );
    saveRules(updatedRules);
  };

  const deleteRule = (id: string) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    saveRules(updatedRules);
  };

  const toggleRule = (id: string) => {
    updateRule(id, { enabled: !rules.find(r => r.id === id)?.enabled });
  };

  const getScriptIcon = (type: string) => {
    switch (type) {
      case 'analytics': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'advertising': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'social': return <Globe className="w-4 h-4 text-blue-500" />;
      case 'functional': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Code className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'block': return <ShieldX className="w-4 h-4 text-red-500" />;
      case 'allow': return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case 'delay': return <Pause className="w-4 h-4 text-yellow-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const refreshDetectedScripts = () => {
    loadDetectedScripts();
  };

  const quickBlockScript = (script: DetectedScript) => {
    const rule: ScriptRule = {
      id: `quick_${Date.now()}`,
      domain: script.domain,
      scriptType: script.category === 'unknown' ? 'custom' : script.category,
      action: 'block',
      pattern: script.url,
      enabled: true,
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    const updatedRules = [...rules, rule];
    saveRules(updatedRules);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading Script Control Panel...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Code className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Advanced Script Control</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
            TIER 4
          </span>
        </div>
        <p className="text-gray-600">
          Granular control over JavaScript execution on websites
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Scripts</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalScripts}</p>
            </div>
            <Code className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Blocked</p>
              <p className="text-2xl font-bold text-red-900">{stats.blockedScripts}</p>
            </div>
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Allowed</p>
              <p className="text-2xl font-bold text-green-900">{stats.allowedScripts}</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Bandwidth Saved</p>
              <p className="text-2xl font-bold text-purple-900">
                {(stats.savedBandwidth / 1024).toFixed(1)}KB
              </p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['rules', 'detected', 'stats'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Add New Rule Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Domain (e.g., example.com)"
                value={newRuleForm.domain}
                onChange={(e) => setNewRuleForm(prev => ({ ...prev, domain: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <select
                value={newRuleForm.scriptType}
                onChange={(e) => setNewRuleForm(prev => ({ 
                  ...prev, 
                  scriptType: e.target.value as ScriptRule['scriptType']
                }))}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Scripts</option>
                <option value="analytics">Analytics</option>
                <option value="advertising">Advertising</option>
                <option value="social">Social Media</option>
                <option value="functional">Functional</option>
                <option value="custom">Custom Pattern</option>
              </select>
              
              <select
                value={newRuleForm.action}
                onChange={(e) => setNewRuleForm(prev => ({ 
                  ...prev, 
                  action: e.target.value as ScriptRule['action']
                }))}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="block">Block</option>
                <option value="allow">Allow</option>
                <option value="delay">Delay (3s)</option>
              </select>
              
              <input
                type="text"
                placeholder="Pattern (optional)"
                value={newRuleForm.pattern}
                onChange={(e) => setNewRuleForm(prev => ({ ...prev, pattern: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                onClick={addRule}
                disabled={!newRuleForm.domain}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Rule
              </button>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2">
            {rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No script control rules configured</p>
                <p className="text-sm">Create your first rule above</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`p-2 rounded ${
                        rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {rule.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        {getScriptIcon(rule.scriptType)}
                        <span className="font-medium">{rule.domain}</span>
                        {getActionIcon(rule.action)}
                        <span className="text-sm text-gray-600 capitalize">{rule.action}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="capitalize">{rule.scriptType}</span>
                        {rule.pattern && (
                          <>
                            <span>•</span>
                            <span className="font-mono bg-gray-100 px-1 rounded">{rule.pattern}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detected Scripts Tab */}
      {activeTab === 'detected' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Detected Scripts on Current Page</h3>
            <button
              onClick={refreshDetectedScripts}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            Current domain: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{currentDomain}</span>
          </div>
          
          <div className="space-y-2">
            {detectedScripts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No scripts detected on current page</p>
                <p className="text-sm">Navigate to a website to see detected scripts</p>
              </div>
            ) : (
              detectedScripts.map((script, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    {getScriptIcon(script.category)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{script.domain}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          script.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {script.blocked ? 'Blocked' : 'Allowed'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {script.category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono truncate max-w-md">
                        {script.url}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Size: {(script.size / 1024).toFixed(1)}KB • Type: {script.type}
                      </div>
                    </div>
                  </div>
                  
                  {!script.blocked && (
                    <button
                      onClick={() => quickBlockScript(script)}
                      className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                    >
                      Quick Block
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Performance Impact</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Page Load Improvement:</span>
                  <span className="font-bold text-green-600">+{stats.performanceGain}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Bandwidth Saved:</span>
                  <span className="font-bold">{(stats.savedBandwidth / 1024).toFixed(1)}KB</span>
                </div>
                <div className="flex justify-between">
                  <span>Scripts Blocked:</span>
                  <span className="font-bold text-red-600">{stats.blockedScripts}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Security Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Malicious scripts blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Tracking prevention active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Fingerprinting protection</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Script Control Guidelines</p>
                <p className="text-sm text-yellow-700 mt-1">
                  • Blocking all scripts may break website functionality
                  <br />
                  • Start with blocking advertising and analytics scripts
                  <br />
                  • Use "Allow" for essential functional scripts
                  <br />
                  • "Delay" option improves page load while keeping functionality
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptControlPanel;