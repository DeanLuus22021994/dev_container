// Setup file that runs before all tests
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Mock VS Code API
jest.mock('vscode');

// Ensure we're in test mode
process.env.NODE_ENV = 'test';

// Set up test environment variables to ensure consistent test behavior
process.env.GITHUB_TOKEN = 'mock_github_token_for_testing';
process.env.GITHUB_OWNER = 'your-username';
process.env.GITHUB_REPO = 'cicd-automation';
process.env.GITHUB_REPOSITORY = 'your-username/cicd-automation';

// Try to load environment variables from .env.test if it exists
const testEnvPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath });
  console.log('Loaded test environment from:', testEnvPath);
}
