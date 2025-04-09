/**
 * Global setup for integration tests
 * Sets up the environment for devcontainer automation testing
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line no-console
module.exports = async () => {
  console.log('🚀 Setting up integration test environment for devcontainer automation...');

  // Check Docker availability
  try {
    const dockerVersion = execSync('docker --version').toString().trim();
    // eslint-disable-next-line no-console
    console.log(`✓ Docker available: ${dockerVersion}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️ Docker not available. Some tests may fail:', error.message);
  }

  // Check environment variables
  const requiredVars = ['DOCKER_USERNAME', 'DOCKER_REGISTRY'];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    // eslint-disable-next-line no-console
    console.warn('Some tests may be skipped or fail. Check your .env file.');
  }

  // Create temp directory for test artifacts if it doesn't exist
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    // eslint-disable-next-line no-console
    console.log('✓ Created temp directory for test artifacts');
  }

  // Set global variables for tests
  global.__TESTING_DEVCONTAINER__ = true;
  global.__TEMP_DIR__ = tempDir;

  // Use actual containers if configured, otherwise use mocks
  if (process.env.USE_ACTUAL_CONTAINERS === 'true') {
    // eslint-disable-next-line no-console
    console.log('🐳 Using actual containers for testing');
    try {
      // Pull a base image that might be needed for testing
      execSync('docker pull node:16-alpine', { stdio: 'inherit' });
      // eslint-disable-next-line no-console
      console.log('✓ Pulled base container image');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('⚠️ Failed to pull container image:', error.message);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('🔸 Using mock containers for testing');
  }

  // eslint-disable-next-line no-console
  console.log('✓ Integration test environment setup complete');
};
