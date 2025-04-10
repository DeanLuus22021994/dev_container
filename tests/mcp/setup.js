/**
 * Setup file for MCP System Tests
 * This file is executed before all tests in the MCP test suite
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const os = require('os');

// Enable fetch API for Node.js if not available natively
if (!globalThis.fetch) {
  // For Node.js versions before 18.x that don't have fetch built-in
  try {
    globalThis.fetch = require('node-fetch');
  } catch (e) {
    console.warn('node-fetch not installed. If running Node.js < 18, install with: npm install node-fetch');
  }
}

// Configure longer timeout for all MCP tests
jest.setTimeout(180000); // 3 minutes

// Log test suite start time
console.log(`Starting MCP System Tests at ${new Date().toISOString()}`);

// Load environment variables from .env file
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.warn(`Error loading .env file: ${result.error.message}`);
  }
} else {
  console.warn(`No .env file found at ${envPath}`);
  
  // Create minimal .env file with required variables if none exists
  const minimalEnvContent = `
# Generated by MCP test setup
REDIS_PASSWORD=DeanLuus1994
MCP_GATEWAY_URL=http://localhost:8080
PHI_MODEL=phi4-mini
OLLAMA_API_URL=http://localhost:11434
  `.trim();
  
  try {
    fs.writeFileSync(envPath, minimalEnvContent);
    console.log(`Created minimal .env file at ${envPath}`);
    // Load the newly created env file
    dotenv.config({ path: envPath });
  } catch (err) {
    console.error(`Failed to create .env file: ${err.message}`);
  }
}

// Ensure REDIS_PASSWORD is set
if (!process.env.REDIS_PASSWORD) {
  console.log('Setting default REDIS_PASSWORD for MCP tests');
  process.env.REDIS_PASSWORD = 'DeanLuus1994';
}

// Check required tools are installed
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker is available');
} catch (error) {
  console.error('\n⛔ Docker not available. MCP tests will fail.');
  console.error('Please install Docker and make sure it is running.\n');
}

// Create test results directory if it doesn't exist
const testResultsDir = path.join(__dirname, '../../test-results/mcp');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// Auto-detect operating system
const isWindows = os.platform() === 'win32' || os.platform() === 'windows';
if (isWindows) {
  console.log('Detected Windows operating system - using Windows-compatible commands');
}

// Output current environment info
console.log(`
=== MCP TEST ENVIRONMENT INFO ===
OS: ${os.platform()} (${os.release()})
Node.js: ${process.version}
Working directory: ${process.cwd()}
Redis password set: ${process.env.REDIS_PASSWORD ? 'Yes' : 'No'}
MCP_GATEWAY_URL: ${process.env.MCP_GATEWAY_URL || 'Not set'}
Cleanup mode: ${process.env.MCP_TEST_CLEANUP === 'true' ? 'Yes' : 'No'}
=================================
`);