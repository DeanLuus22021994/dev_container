// Setup file that runs before all tests
jest.mock('vscode');

// Add any global test setup here
process.env.NODE_ENV = 'test';

// Jest assertion library is used for all tests
