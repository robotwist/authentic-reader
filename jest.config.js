export default {
  testEnvironment: 'node',
  globalSetup: './__tests__/setup.js',
  globalTeardown: './__tests__/teardown.js',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.integration.test.js'
  ],
  verbose: true,
  forceExit: true,
  testTimeout: 30000,
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};