import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

const isDev = process.env.NODE_ENV === 'development';

export default defineManifest(async () => ({
  manifest_version: 3,
  name: isDev 
    ? `[DEV] ShieldPro Ultimate` 
    : 'ShieldPro Ultimate - Advanced Ad Blocker',
  version: packageJson.version,
  description: 'Revolutionary ad blocking with 5-tier progressive feature unlock system. First 100,000 users get lifetime premium access!',
  
  icons: {
    '16': 'public/icons/icon-16.png',
    '32': 'public/icons/icon-32.png',
    '48': 'public/icons/icon-48.png',
    '128': 'public/icons/icon-128.png'
  },

  permissions: [
    'declarativeNetRequest',
    'declarativeNetRequestWithHostAccess',
    'declarativeNetRequestFeedback',
    'storage',
    'unlimitedStorage',
    'tabs',
    'scripting',
    'webNavigation',
    'alarms',
    'notifications',
    'contextMenus',
    'cookies'
  ],

  host_permissions: [
    '<all_urls>'
  ],

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },

  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'public/icons/icon-16.png',
      '32': 'public/icons/icon-32.png',
      '48': 'public/icons/icon-48.png',
      '128': 'public/icons/icon-128.png'
    },
    default_title: 'ShieldPro Ultimate'
  },

  options_page: 'src/options/index.html',
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content.ts'],
      css: ['src/content/content.css'],
      run_at: 'document_idle',
      all_frames: false,
      match_about_blank: false
    }
  ],

  declarative_net_request: {
    rule_resources: [
      {
        id: 'tier1_rules',
        enabled: true,
        path: 'public/rules/tier1.json'
      },
      {
        id: 'tier2_rules',
        enabled: true,
        path: 'public/rules/tier2.json'
      },
      {
        id: 'tier3_rules',
        enabled: false,
        path: 'public/rules/tier3.json'
      },
      {
        id: 'tier4_rules',
        enabled: false,
        path: 'public/rules/tier4.json'
      },
      {
        id: 'tier4_security_rules',
        enabled: false,
        path: 'public/rules/tier4-security.json'
      },
      {
        id: 'tier5_rules',
        enabled: false,
        path: 'public/rules/tier5.json'
      }
    ]
  },

  web_accessible_resources: [
    {
      resources: [
        'src/injected/*.js',
        'assets/*',
        'public/assets/*',
        'public/fonts/*'
      ],
      matches: ['<all_urls>']
    }
  ],

  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  },

  commands: {
    'toggle-extension': {
      suggested_key: {
        default: 'Alt+Shift+S',
        mac: 'Alt+Shift+S'
      },
      description: 'Toggle extension on/off'
    },
    'open-options': {
      suggested_key: {
        default: 'Alt+Shift+O',
        mac: 'Alt+Shift+O'
      },
      description: 'Open options page'
    },
    'block-element': {
      suggested_key: {
        default: 'Alt+Shift+B',
        mac: 'Alt+Shift+B'
      },
      description: 'Block element on page'
    }
  },

  offline_enabled: true,
  incognito: 'spanning',
  minimum_chrome_version: '90'
}));