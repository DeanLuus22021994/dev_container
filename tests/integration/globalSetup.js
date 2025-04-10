/**
 * Global setup for integration tests
 */
const { setupEnv, setupTestDatabase, setupMCP } = require('../helpers/setup-test-env');

module.exports = async () => {
  console.log('Setting up integration test environment...');
  
  // Basic setup
  setupEnv();
  
  // Enable MCP for integration tests if MCP_ENABLED is set to true
  const enableMCP = process.env.MCP_ENABLED === 'true';
  if (enableMCP) {
    console.log('MCP is enabled for integration tests');
    setupMCP(true);
  } else {
    console.log('MCP is disabled for integration tests');
  }
  
  // Setup test database or other resources
  await setupTestDatabase();
  
  console.log('Integration test setup complete');
};