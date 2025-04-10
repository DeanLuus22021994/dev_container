/**
 * Setup file for MCP tests
 * This file is executed before any MCP tests are run
 */

const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { promisify } = require('util');

// Promisify exec for cleaner async code
const execAsync = promisify(exec);

// Polyfills needed for fetch API in Node.js < 18
if (!globalThis.fetch) {
  // Dynamic import to avoid syntax issues with CommonJS
  globalThis.fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
  
  console.log('Added fetch polyfill for Node.js compatibility');
}

// Extend Jest timeout for all MCP tests
jest.setTimeout(180000); // 3 minutes

// Initialize environment
async function initializeTestEnvironment() {
  console.log('Setting up MCP test environment...');
  
  // Get workspace root directory
  const workspaceRoot = path.resolve(__dirname, '../..');
  
  console.log(`Workspace root: ${workspaceRoot}`);
  
  // Check if required Docker images are available
  try {
    // Check Docker availability
    await execAsync('docker info');
    
    // Prepare environment variables
    const env = {
      MCP_GATEWAY_URL: process.env.MCP_GATEWAY_URL || 'http://localhost:8080',
      OLLAMA_API_URL: process.env.OLLAMA_API_URL || 'http://localhost:11434',
      PHI_MODEL: process.env.PHI_MODEL || 'phi4-mini',
      // Additional environment variables as needed
    };
    
    // Log environment information
    console.log('Test environment is ready with the following configuration:');
    console.log(JSON.stringify(env, null, 2));
    
    // Make environment variables available to tests
    Object.assign(process.env, env);
    
    // Create any necessary test directories
    const testResultsDir = path.join(workspaceRoot, 'test-results', 'mcp');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    console.log('MCP test environment setup complete');
    
  } catch (error) {
    console.error('Failed to set up MCP test environment:', error);
    process.exit(1);
  }
}

// Export environment initialization function
module.exports = async () => {
  await initializeTestEnvironment();
};