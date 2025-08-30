import React, { useState, useEffect } from 'react';
import {
  Code,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Search,
  Copy,
  X,
  TestTube,
  BookOpen,
  Zap,
  Download,
  Upload,
  ToggleLeft,
  ToggleRight,
  Star,
  Sparkles,
} from 'lucide-react';
import { earlyAdopterService } from '../../shared/services/early-adopter.service';
import { EarlyAdopterStatus } from '../../shared/constants/marketing';

interface RegexPattern {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  description?: string;
  category: 'url' | 'domain' | 'element' | 'content' | 'custom';
  action: 'block' | 'allow' | 'modify' | 'redirect';
  enabled: boolean;
  testCases: string[];
  matchCount: number;
  lastMatched?: number;
  createdAt: number;
  priority: number;
  performance: 'fast' | 'medium' | 'slow';
  complexity: number;
  tags: string[];
}

interface RegexPatternManagerProps {
  currentTier: number;
}

const REGEX_TEMPLATES = [
  {
    name: 'Block tracking parameters',
    pattern: '(utm_[a-z]+|fbclid|gclid|mc_[a-z]+)=[^&]*',
    description: 'Remove common tracking parameters from URLs',
    category: 'url',
  },
  {
    name: 'Block ad domains',
    pattern: '^https?:\\/\\/[^/]*(doubleclick|googlesyndication|amazon-adsystem)',
    description: 'Block common ad server domains',
    category: 'domain',
  },
  {
    name: 'Hide sponsored content',
    pattern: 'sponsored|promoted|advertisement',
    description: 'Hide elements containing sponsored content keywords',
    category: 'content',
  },
  {
    name: 'Block popup triggers',
    pattern: 'onclick=".*window\\.open.*"',
    description: 'Block elements that trigger popups',
    category: 'element',
  },
  {
    name: 'Remove social widgets',
    pattern: '(facebook|twitter|linkedin)\\.com\\/(plugins|widgets)',
    description: 'Block social media embedded widgets',
    category: 'url',
  },
];

export const RegexPatternManager: React.FC<RegexPatternManagerProps> = ({ currentTier }) => {
  const [patterns, setPatterns] = useState<RegexPattern[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddPattern, setShowAddPattern] = useState(false);
  const [editingPattern, setEditingPattern] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const [newPattern, setNewPattern] = useState<Partial<RegexPattern>>({
    name: '',
    pattern: '',
    flags: 'gi',
    description: '',
    category: 'custom',
    action: 'block',
    enabled: true,
    testCases: [],
    tags: [],
  });
  const [patternError, setPatternError] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [earlyAdopterStatus, setEarlyAdopterStatus] = useState<EarlyAdopterStatus | null>(null);

  useEffect(() => {
    loadPatterns();
    checkEarlyAdopterStatus();
  }, []);

  const checkEarlyAdopterStatus = async () => {
    try {
      const status = await earlyAdopterService.initializeUser();
      setEarlyAdopterStatus(status);
    } catch {
      console.error('Failed to check early adopter status:', error);
    }
  };

  const loadPatterns = async () => {
    try {
      const result = await chrome.storage.local.get('regexPatterns');
      if (result.regexPatterns) {
        setPatterns(result.regexPatterns);
      }
    } catch {
      console.error('Failed to load regex patterns:', error);
    }
  };

  const savePatterns = async (updatedPatterns: RegexPattern[]) => {
    try {
      await chrome.storage.local.set({ regexPatterns: updatedPatterns });
      setPatterns(updatedPatterns);

      // Notify background script
      chrome.runtime.sendMessage({
        action: 'regexPatternsUpdated',
        patterns: updatedPatterns,
      });
    } catch {
      console.error('Failed to save regex patterns:', error);
    }
  };

  const validatePattern = (pattern: string, flags: string): boolean => {
    try {
      new RegExp(pattern, flags);
      setPatternError('');
      return true;
    } catch {
      setPatternError(`Invalid regex: ${error.message}`);
      return false;
    }
  };

  const calculateComplexity = (pattern: string): number => {
    let complexity = 0;

    // Check for expensive operations
    if (pattern.includes('.*')) complexity += 2;
    if (pattern.includes('.+')) complexity += 2;
    if (pattern.includes('\\s*')) complexity += 1;
    if (pattern.includes('|')) complexity += pattern.split('|').length;
    if (pattern.includes('(?=') || pattern.includes('(?!')) complexity += 3; // Lookahead
    if (pattern.includes('(?<=') || pattern.includes('(?<!')) complexity += 3; // Lookbehind
    if (pattern.match(/\{[\d,]+\}/g)) complexity += 2; // Quantifiers

    // Nested groups
    const groups = pattern.match(/\([^)]*\)/g);
    if (groups) complexity += groups.length;

    return Math.min(complexity, 10);
  };

  const getPerformanceRating = (complexity: number): 'fast' | 'medium' | 'slow' => {
    if (complexity <= 3) return 'fast';
    if (complexity <= 6) return 'medium';
    return 'slow';
  };

  const addPattern = async () => {
    if (!newPattern.name || !newPattern.pattern) {
      alert('Please provide a name and pattern');
      return;
    }

    if (!validatePattern(newPattern.pattern, newPattern.flags || 'gi')) {
      return;
    }

    const complexity = calculateComplexity(newPattern.pattern);
    const pattern: RegexPattern = {
      id: Date.now().toString(),
      name: newPattern.name,
      pattern: newPattern.pattern,
      flags: newPattern.flags || 'gi',
      description: newPattern.description,
      category: (newPattern.category as any) || 'custom',
      action: (newPattern.action as any) || 'block',
      enabled: newPattern.enabled !== false,
      testCases: newPattern.testCases || [],
      matchCount: 0,
      createdAt: Date.now(),
      priority: patterns.length + 1,
      performance: getPerformanceRating(complexity),
      complexity,
      tags: newPattern.tags || [],
    };

    const updatedPatterns = [...patterns, pattern];
    await savePatterns(updatedPatterns);

    // Reset form
    setNewPattern({
      name: '',
      pattern: '',
      flags: 'gi',
      description: '',
      category: 'custom',
      action: 'block',
      enabled: true,
      testCases: [],
      tags: [],
    });
    setShowAddPattern(false);
    setPatternError('');
  };

  const deletePattern = async (id: string) => {
    const updatedPatterns = patterns.filter((p) => p.id !== id);
    await savePatterns(updatedPatterns);
  };

  const togglePattern = async (id: string) => {
    const updatedPatterns = patterns.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    await savePatterns(updatedPatterns);
  };

  const testPattern = (pattern: RegexPattern, input: string): boolean => {
    try {
      const regex = new RegExp(pattern.pattern, pattern.flags);
      return regex.test(input);
    } catch {
      return false;
    }
  };

  const testAllPatterns = () => {
    if (!testInput) return;

    const results: { [key: string]: boolean } = {};
    patterns.forEach((pattern) => {
      if (pattern.enabled) {
        results[pattern.id] = testPattern(pattern, testInput);
      }
    });
    setTestResults(results);
  };

  const applyTemplate = (template: any) => {
    setNewPattern({
      ...newPattern,
      name: template.name,
      pattern: template.pattern,
      description: template.description,
      category: template.category,
      flags: 'gi',
    });
  };

  const exportPatterns = () => {
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      patterns: patterns,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `regex-patterns-${Date.now()}.json`);
    linkElement.click();
  };

  const importPatterns = () => {
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
          if (data.patterns && Array.isArray(data.patterns)) {
            const importedPatterns = data.patterns.map((p: RegexPattern) => ({
              ...p,
              id: `imported-${Date.now()}-${Math.random()}`,
            }));
            const updatedPatterns = [...patterns, ...importedPatterns];
            await savePatterns(updatedPatterns);
            alert(`Imported ${importedPatterns.length} patterns successfully!`);
          }
        } catch {
          alert('Failed to import patterns. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  // Early adopters get full access regardless of tier
  const hasAccess = earlyAdopterStatus?.isEarlyAdopter || currentTier >= 4;
  const isEarlyAdopter = earlyAdopterStatus?.isEarlyAdopter || false;
  const userNumber = earlyAdopterStatus?.userNumber || 0;

  if (!hasAccess) {
    return (
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Code className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Regex Pattern Manager</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Upgrade to Tier 4 to unlock advanced regex pattern filtering for ultimate control.
        </p>
        <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
          Upgrade to Tier 4
        </button>
      </div>
    );
  }

  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch =
      searchQuery === '' ||
      pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.pattern.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || pattern.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'url', 'domain', 'element', 'content', 'custom'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Code className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Regex Pattern Manager</h2>

          {/* Tier Badge */}
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs rounded-full font-semibold flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>Tier 4 Advanced</span>
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
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Regex help"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={importPatterns}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Import patterns"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={exportPatterns}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Export patterns"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddPattern(true)}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pattern</span>
          </button>
        </div>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Regex Quick Reference</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800">Common Patterns:</p>
              <ul className="mt-1 space-y-1 text-blue-700">
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">.</code> - Any character
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">*</code> - 0 or more
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">+</code> - 1 or more
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">?</code> - 0 or 1
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">[abc]</code> - Character set
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">^</code> - Start of string
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">$</code> - End of string
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800">Flags:</p>
              <ul className="mt-1 space-y-1 text-blue-700">
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">g</code> - Global match
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">i</code> - Case insensitive
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">m</code> - Multiline
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">s</code> - Dot matches newline
                </li>
                <li>
                  <code className="bg-white dark:bg-gray-700 px-1">u</code> - Unicode
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patterns..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Tester */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-900 mb-2">Test Patterns</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter text to test against patterns..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={testAllPatterns}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <TestTube className="w-4 h-4" />
            <span>Test All</span>
          </button>
        </div>
        {Object.keys(testResults).length > 0 && (
          <div className="mt-2 text-sm">
            <span className="text-purple-700">
              Matches: {Object.values(testResults).filter((r) => r).length} /{' '}
              {Object.keys(testResults).length}
            </span>
          </div>
        )}
      </div>

      {/* Add Pattern Form */}
      {showAddPattern && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Create Regex Pattern</h3>

          {/* Templates */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Use a template:</p>
            <div className="flex flex-wrap gap-2">
              {REGEX_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pattern Name</label>
              <input
                type="text"
                value={newPattern.name}
                onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Block tracking pixels"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newPattern.category}
                onChange={(e) => setNewPattern({ ...newPattern, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="url">URL</option>
                <option value="domain">Domain</option>
                <option value="element">Element</option>
                <option value="content">Content</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regular Expression Pattern
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPattern.pattern}
                onChange={(e) => {
                  setNewPattern({ ...newPattern, pattern: e.target.value });
                  validatePattern(e.target.value, newPattern.flags || 'gi');
                }}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm ${
                  patternError ? 'border-red-500' : ''
                }`}
                placeholder="e.g., (tracking|analytics)\\.(js|gif|png)"
              />
              <input
                type="text"
                value={newPattern.flags}
                onChange={(e) => {
                  setNewPattern({ ...newPattern, flags: e.target.value });
                  validatePattern(newPattern.pattern || '', e.target.value);
                }}
                className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="gi"
              />
            </div>
            {patternError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {patternError}
              </p>
            )}
            {newPattern.pattern && !patternError && (
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span
                  className={`flex items-center space-x-1 ${
                    getPerformanceRating(calculateComplexity(newPattern.pattern)) === 'fast'
                      ? 'text-green-600'
                      : getPerformanceRating(calculateComplexity(newPattern.pattern)) === 'medium'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    Performance: {getPerformanceRating(calculateComplexity(newPattern.pattern))}
                  </span>
                </span>
                <span className="text-gray-600">
                  Complexity: {calculateComplexity(newPattern.pattern)}/10
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={newPattern.action}
                onChange={(e) => setNewPattern({ ...newPattern, action: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="block">Block</option>
                <option value="allow">Allow</option>
                <option value="modify">Modify</option>
                <option value="redirect">Redirect</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newPattern.description}
                onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="What does this pattern do?"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newPattern.enabled}
                onChange={(e) => setNewPattern({ ...newPattern, enabled: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-gray-700">Enable immediately</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddPattern(false);
                setNewPattern({
                  name: '',
                  pattern: '',
                  flags: 'gi',
                  description: '',
                  category: 'custom',
                  action: 'block',
                  enabled: true,
                  testCases: [],
                  tags: [],
                });
                setPatternError('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={addPattern}
              disabled={!!patternError || !newPattern.name || !newPattern.pattern}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Pattern
            </button>
          </div>
        </div>
      )}

      {/* Patterns List */}
      <div className="space-y-3">
        {filteredPatterns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No regex patterns found</p>
            <p className="text-sm text-gray-500 mt-1">
              Create powerful patterns for advanced filtering
            </p>
          </div>
        ) : (
          filteredPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{pattern.name}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        pattern.category === 'url'
                          ? 'bg-blue-100 text-blue-700'
                          : pattern.category === 'domain'
                            ? 'bg-green-100 text-green-700'
                            : pattern.category === 'element'
                              ? 'bg-purple-100 text-purple-700'
                              : pattern.category === 'content'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pattern.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        pattern.action === 'block'
                          ? 'bg-red-100 text-red-700'
                          : pattern.action === 'allow'
                            ? 'bg-green-100 text-green-700'
                            : pattern.action === 'modify'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {pattern.action}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded flex items-center space-x-1 ${
                        pattern.performance === 'fast'
                          ? 'bg-green-100 text-green-700'
                          : pattern.performance === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{pattern.performance}</span>
                    </span>
                    {testResults[pattern.id] === true && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {testResults[pattern.id] === false && <X className="w-4 h-4 text-gray-400" />}
                  </div>

                  {pattern.description && (
                    <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                  )}

                  <div className="mt-2 bg-gray-50 dark:bg-gray-700 rounded p-2">
                    <code className="text-xs text-gray-700 font-mono break-all">
                      /{pattern.pattern}/{pattern.flags}
                    </code>
                  </div>

                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Matches: {pattern.matchCount}</span>
                    <span>Complexity: {pattern.complexity}/10</span>
                    <span>Created: {new Date(pattern.createdAt).toLocaleDateString()}</span>
                    {pattern.lastMatched && (
                      <span>Last match: {new Date(pattern.lastMatched).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pattern.pattern);
                      alert('Pattern copied to clipboard!');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy pattern"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => togglePattern(pattern.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      pattern.enabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={pattern.enabled ? 'Disable' : 'Enable'}
                  >
                    {pattern.enabled ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => deletePattern(pattern.id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete pattern"
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
      <div className="bg-indigo-50 rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {patterns.filter((p) => p.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {patterns.filter((p) => p.performance === 'fast').length}
            </div>
            <div className="text-sm text-gray-600">Fast</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {patterns.reduce((sum, p) => sum + p.matchCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(
                patterns.reduce((sum, p) => sum + p.complexity, 0) / Math.max(patterns.length, 1)
              )}
            </div>
            <div className="text-sm text-gray-600">Avg Complexity</div>
          </div>
        </div>
      </div>
    </div>
  );
};
