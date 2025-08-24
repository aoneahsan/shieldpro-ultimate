import '@testing-library/jest-dom';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve()),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
    openOptionsPage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(() => Promise.resolve()),
    create: jest.fn(() => Promise.resolve()),
  },
  declarativeNetRequest: {
    updateDynamicRules: jest.fn(() => Promise.resolve()),
    onRuleMatchedDebug: {
      addListener: jest.fn(),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
  },
} as any;

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  },
  db: {},
}));

// Mock process.env
process.env = {
  ...process.env,
  NODE_ENV: 'test',
};