module.exports = {
  testEnvironment: 'node',
  globalSetup: './__tests__/setup.js',
  globalTeardown: './__tests__/teardown.js', // Added teardown script
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  verbose: true,
  forceExit: true,
  testTimeout: 15000
};