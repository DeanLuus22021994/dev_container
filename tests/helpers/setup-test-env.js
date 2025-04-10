/**
 * Common test environment setup utilities
 */

/**
 * Sets up environment variables for testing
 */
function setupEnv() {
    process.env.NODE_ENV = 'test';
    process.env.MCP_ENABLED = 'false'; // Disable MCP by default in tests
  }
  
  /**
   * Sets up a mock database or test data if needed
   * @returns {Promise<void>}
   */
  async function setupTestDatabase() {
    // Implementation depends on your database setup
    return Promise.resolve();
  }
  
  /**
   * Cleans up resources after tests
   * @returns {Promise<void>}
   */
  async function cleanupTests() {
    // Clean up any resources created during tests
    return Promise.resolve();
  }
  
  /**
   * Configures MCP for tests if needed
   * @param {boolean} enabled Whether to enable MCP in tests
   */
  function setupMCP(enabled = false) {
    process.env.MCP_ENABLED = enabled ? 'true' : 'false';
    if (enabled) {
      process.env.MCP_GATEWAY_URL = 'http://localhost:8080';
      process.env.PHI_MODEL = 'phi4-mini';
    }
  }
  
  module.exports = {
    setupEnv,
    setupTestDatabase,
    cleanupTests,
    setupMCP
  };