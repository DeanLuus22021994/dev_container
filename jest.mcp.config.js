/**
 * MCP-specific Jest configuration
 * This configuration is optimized for MCP system tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/mcp/'],
  testMatch: ['**/tests/mcp/**/*.js'],
  testTimeout: 180000, // 3 minutes timeout for MCP tests
  setupFilesAfterEnv: ['<rootDir>/tests/mcp/setup.js'],
  verbose: true,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/mcp',
      outputName: 'mcp-junit.xml',
    }]
  ],
  collectCoverage: false, // Don't collect coverage for MCP system tests
  bail: false, // Don't stop after first failure to allow cleanup to run
  testSequencer: '<rootDir>/tests/mcp/sequencer.js', // Custom sequencer to ensure correct test order
};