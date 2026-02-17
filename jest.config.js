/** @type {import('jest').Config} */
const shared = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
};

const config = {
  projects: [
    {
      ...shared,
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/__tests__/!(api)/**/*.(ts|tsx|js)',
        '<rootDir>/**/*.(test|spec).(ts|tsx|js)',
      ],
      testPathIgnorePatterns: ['/node_modules/', '__tests__/api/', '__tests__/solana/'],
      collectCoverageFrom: [
        'components/**/*.(ts|tsx)',
        '!**/*.d.ts',
      ],
    },
    {
      ...shared,
      displayName: 'solana',
      testMatch: ['<rootDir>/__tests__/solana/**/*.test.(ts|tsx)'],
      collectCoverageFrom: [
        'lib/solana/**/*.(ts|tsx)',
        '!**/*.d.ts',
      ],
    },
    {
      ...shared,
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/api/**/*.test.(ts|tsx)'],
      collectCoverageFrom: [
        'app/api/**/*.(ts|tsx)',
        'lib/api-utils.(ts|tsx)',
        '!**/*.d.ts',
      ],
    },
  ],
};

module.exports = config;
