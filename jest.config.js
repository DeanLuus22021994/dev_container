/**
 * Main Jest configuration file
 * Optimized for unit tests and general test execution
 */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/', '<rootDir>/tests/unit/'],
    testMatch: ['**/__tests__/**/*.test.{js,ts}', '**/tests/unit/**/*.test.{js,ts}'],
    testTimeout: 30000,
    verbose: true,
    reporters: [
      'default',
      ['jest-junit', {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
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
    coverageDirectory: '<rootDir>/coverage',
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
  };