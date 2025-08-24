#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix TypeScript errors across the project
const fixes = [
  // Fix src/services/error.service.ts
  {
    file: 'src/services/error.service.ts',
    replacements: [
      {
        from: '      code: authError.code,',
        to: '      code: authError.code || ErrorCode.UNKNOWN,',
      },
      {
        from: '      message: authError.message,',
        to: '      message: authError.message || \'Unknown error\',',
      },
      {
        from: '      userMessage: authError.userMessage,',
        to: '      userMessage: authError.userMessage || \'An error occurred\',',
      },
      {
        from: '      recoverable: authError.recoverable,',
        to: '      recoverable: authError.recoverable ?? true,',
      },
      {
        from: '      retryable: authError.retryable,',
        to: '      retryable: authError.retryable ?? false,',
      },
      {
        from: '      code: firestoreError.code,',
        to: '      code: firestoreError.code || ErrorCode.UNKNOWN,',
      },
      {
        from: '      message: firestoreError.message,',
        to: '      message: firestoreError.message || \'Unknown error\',',
      },
      {
        from: '      userMessage: firestoreError.userMessage,',
        to: '      userMessage: firestoreError.userMessage || \'An error occurred\',',
      },
      {
        from: '      recoverable: firestoreError.recoverable,',
        to: '      recoverable: firestoreError.recoverable ?? true,',
      },
      {
        from: '      retryable: firestoreError.retryable,',
        to: '      retryable: firestoreError.retryable ?? false,',
      },
      {
        from: '    if (typeof window !== \'undefined\' && window.gtag) {',
        to: '    if (typeof window !== \'undefined\' && (window as any).gtag) {',
      },
      {
        from: '      window.gtag(\'event\', \'error\', {',
        to: '      (window as any).gtag(\'event\', \'error\', {',
      },
    ],
  },

  // Fix src/content/popup-blocker.ts
  {
    file: 'src/content/popup-blocker.ts',
    replacements: [
      {
        from: '      return originalOpen.apply(this, args);',
        to: '      return originalOpen.apply(this, args as [url?: string | URL | undefined, target?: string | undefined, features?: string | undefined]);',
      },
      {
        from: '    window.showModalDialog = function() {',
        to: '    (window as any).showModalDialog = function() {',
      },
      {
        from: '    const open = function(url: string, target: string, ...args: any[]) {',
        to: '    const open = function(url: string, _target?: string, ..._args: any[]) {',
      },
    ],
  },

  // Fix src/background/performance-monitor.ts
  {
    file: 'src/background/performance-monitor.ts',
    replacements: [
      {
        from: '    if (performance.memory) {',
        to: '    if ((performance as any).memory) {',
      },
      {
        from: '    entries.forEach(({ name, duration, time }) => {',
        to: '    entries.forEach(({ name, duration }) => {',
      },
      {
        from: '    marks.forEach(({ name, time }) => {',
        to: '    marks.forEach(({ name }) => {',
      },
    ],
  },

  // Fix src/content/element-picker.ts
  {
    file: 'src/content/element-picker.ts',
    replacements: [
      {
        from: '    } catch (e) {',
        to: '    } catch {',
      },
      {
        from: '    const rect = element.getBoundingClientRect();',
        to: '    // const rect = element.getBoundingClientRect();',
      },
    ],
  },

  // Fix src/content/injector.ts - rename the file to injector.tsx
  {
    file: 'src/content/injector.tsx',
    replacements: [
      {
        from: 'chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {',
        to: 'chrome.runtime.onMessage.addListener((request) => {',
      },
    ],
  },

  // Fix src/options/components/CustomFilters.tsx
  {
    file: 'src/options/components/CustomFilters.tsx',
    replacements: [
      {
        from: '    if (tab) {',
        to: '    if (tab?.id) {',
      },
      {
        from: '      tabId: tab.id,',
        to: '      tabId: tab.id!,',
      },
    ],
  },

  // Fix src/options/components/AdvancedWhitelist.tsx
  {
    file: 'src/options/components/AdvancedWhitelist.tsx',
    replacements: [
      {
        from: '  const [editingEntry, setEditingEntry] = useState<WhitelistEntry | null>(null);',
        to: '  // const [editingEntry, setEditingEntry] = useState<WhitelistEntry | null>(null);',
      },
    ],
  },

  // Fix src/tiers/TiersPage.tsx
  {
    file: 'src/tiers/TiersPage.tsx',
    replacements: [
      {
        from: '              {weeklyEngagement[day] ? \'✅\' : \'❌\'}',
        to: '              {weeklyEngagement?.[day] ? \'✅\' : \'❌\'}',
      },
    ],
  },
];

// Apply fixes
fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(from, to);
      modified = true;
      console.log(`✓ Fixed: ${file} - ${from.substring(0, 50)}...`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${file}`);
  }
});

console.log('\n✨ TypeScript error fixes applied successfully!');