/**
 * Jest configuration for MCP orchestration tests
 */
module.exports = {
  displayName: 'MCP System Tests',
  testMatch: ['**/tests/mcp/**/*.js'],
  testTimeout: 120000, // 2 minutes
  maxWorkers: 1, // Run tests sequentially to ensure proper order
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: false,
  setupFilesAfterEnv: ['./tests/mcp/setup.js'], // Optional setup file
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/mcp',
      outputName: 'junit.xml',
    }],
  ]
};