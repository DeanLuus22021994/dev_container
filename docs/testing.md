# Testing Guide

This document provides comprehensive information about testing strategies, configurations, and best practices for the CI/CD Automation project.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Directory Structure](#test-directory-structure)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Testing with Act](#testing-with-act)
- [Test Coverage](#test-coverage)
- [Mocking](#mocking)
- [Continuous Integration Testing](#continuous-integration-testing)

## Testing Philosophy

This project follows a comprehensive testing approach:

- **Unit Tests**: Verify individual components in isolation
- **Integration Tests**: Verify component interactions, focusing on devcontainer build and deployment
- **CI Tests**: Automated tests run in GitHub Actions pipeline

Our goal is to maintain high test coverage while focusing efforts on critical paths and complex logic.

## Test Directory Structure

```text
tests/
├── __mocks__/             # Mock implementations
│   └── vscode.js          # VS Code API mocks
├── setupTests.js          # Jest setup file
├── index.test.js          # Example test file
├── commands/              # Tests for command implementations
├── utils/                 # Tests for utility functions
├── views/                 # Tests for view components
└── integration/           # Integration tests
    ├── devcontainer.test.js    # Devcontainer tests
    ├── globalSetup.js          # Setup for integration tests
    └── globalTeardown.js       # Teardown for integration tests
```

## Unit Testing

Unit tests are written using Jest and are located in the `tests` directory.

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test -- tests/path/to/file.test.js

# Run tests with coverage
npm test -- --coverage
```

### Writing Unit Tests

Basic test structure:

```javascript
// Import the module to test
const { myFunction } = require('../src/utils/myModule');

describe('myFunction', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

## Integration Testing

Integration tests verify the interaction between components and external systems like Docker.

### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run with specific environment variables
USE_ACTUAL_CONTAINERS=true npm run test:integration
```

### Integration Test Configuration

Integration tests use a separate Jest configuration file: `jest.integration.config.js`

Key configuration options:

- Longer timeouts (30 seconds by default)
- Global setup and teardown scripts
- Reduced concurrency (maxWorkers: 1)

### Environment Variables for Integration Tests

- `USE_ACTUAL_CONTAINERS`: Set to 'true' to use real Docker containers instead of mocks
- `CLEANUP_TEST_IMAGES`: Set to 'true' to remove test Docker images after tests
- `JEST_TIMEOUT`: Custom timeout in milliseconds for long-running tests

## Testing with Act

You can test GitHub Actions workflows locally using [Act](https://github.com/nektos/act).

### Setting Up Act

1. Install Act:

   ```bash
   # On Windows with Chocolatey
   choco install act-cli -y

   # On macOS with Homebrew
   brew install act
   ```

2. Create an `.env` file with required environment variables (see [CI/CD Setup](cicd-setup.md))

### Running Workflows Locally

```bash
# Test a specific job
act -j validate-env --secret-file .env

# Test the workflow triggered by a push event
act push --secret-file .env

# Test with a specific GitHub Actions runner image
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest
```

## Test Coverage

We aim to maintain a minimum of 80% code coverage. Coverage reports are generated automatically when running tests with the `--coverage` flag.

### Viewing Coverage Reports

After running tests with coverage, open:

- `coverage/lcov-report/index.html` for unit test coverage
- `coverage-integration/lcov-report/index.html` for integration test coverage

### CI Coverage Checks

The CI pipeline enforces minimum coverage thresholds:

- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

## Mocking

### VS Code API

The VS Code API is mocked in `tests/__mocks__/vscode.js`. This mock implementation simulates VS Code's behavior in a testing environment.

### Docker

For tests that interact with Docker:

- Integration tests can use real Docker interactions by setting `USE_ACTUAL_CONTAINERS=true`
- Unit tests use mocked Docker client responses

Example mock for Docker:

```javascript
jest.mock('../src/utils/docker', () => ({
  buildImage: jest.fn().mockResolvedValue({ success: true }),
  pushImage: jest.fn().mockResolvedValue({ success: true }),
}));
```

## Continuous Integration Testing

Tests run automatically on GitHub Actions for:

- Pull requests to main/develop
- Push events to main/develop

CI test runs include:

1. Linting
2. Unit tests
3. Integration tests
4. Coverage reports

---

Last Updated: April 10, 2025