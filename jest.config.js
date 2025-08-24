/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/background/(.*)$': '<rootDir>/src/background/$1',
    '^@/content/(.*)$': '<rootDir>/src/content/$1',
    '^@/popup/(.*)$': '<rootDir>/src/popup/$1',
    '^@/options/(.*)$': '<rootDir>/src/options/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@/assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@/locales/(.*)$': '<rootDir>/src/locales/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/index.tsx',
    '!src/config/**',
    '!src/locales/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx)',
    '<rootDir>/tests/**/*.spec.(ts|tsx)',
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  globals: {
    chrome: {}
  }
};