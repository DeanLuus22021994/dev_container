/**
 * Integration test specific Jest configuration
 * This configuration is optimized for integration tests that require more setup
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration/'],
  testMatch: ['**/tests/integration/**/*.test.{js,ts}'],
  testTimeout: 60000, // 1 minute timeout for integration tests
  globalSetup: '<rootDir>/tests/integration/globalSetup.js',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.js',
  verbose: true,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/integration',
      outputName: 'integration-junit.xml',
    }]
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/out/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage-integration',
};