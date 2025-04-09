# Documentation Index

This directory contains all the documentation for the CI/CD Automation project. Use this index to quickly find the information you need.

## Core Documentation

| Document | Description | Last Updated |
|----------|-------------|-------------|
| [CI/CD Setup Guide](cicd-setup.md) | Complete instructions for configuring CI/CD workflows and environment variables | April 10, 2025 |
| [Development Guide](development.md) | Guidelines for development, best practices, and workflows | April 10, 2025 |
| [Testing Guide](testing.md) | Information about testing strategies, Jest configuration, and integration tests | April 10, 2025 |
| [Troubleshooting](troubleshooting.md) | Common issues and their solutions | April 10, 2025 |

## Topics by Category

### Development Environment

- [Dev Container Setup](development.md#dev-container-setup)
- [Local Development](development.md#local-development)
- [VS Code Extensions & Tools](development.md#vs-code-extensions--tools)

### CI/CD Configuration

- [Environment Variables](cicd-setup.md#required-environment-variables)
- [GitHub Actions Workflows](cicd-setup.md#cicd-workflow-overview)
- [Docker Registry Setup](cicd-setup.md#setting-up-environment-variables)

### Testing

- [Unit Tests](testing.md#unit-testing)
- [Integration Tests](testing.md#integration-testing)
- [Testing with Act](testing.md#testing-with-act)
- [Test Coverage Reports](testing.md#test-coverage)

### Repository Structure

```text
cicd_automation/
├── .devcontainer/      # Development container configuration
├── .github/            # GitHub Actions workflows
│   └── workflows/      # GitHub workflow definitions
├── docs/               # Documentation files
├── scripts/            # Utility scripts including validate-env.js
├── src/                # Source code
│   ├── commands/       # Command implementations
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── views/          # View components
└── tests/              # Test files
    ├── integration/    # Integration tests
    └── __mocks__/      # Test mocks
```

## How to Update Documentation

1. All documentation files use Markdown format (.md extension)
2. When adding new documentation:
   - Update this index file with a link to your new document
   - Follow the established formatting patterns
   - Add the document to the appropriate category
   - Include the last updated date

3. When updating existing documentation:
   - Update the "Last Updated" date in this file
   - Consider adding a changelog at the bottom of the modified document

4. Documentation file naming convention:
   - Use kebab-case (lowercase with hyphens)
   - Be descriptive but concise
   - Example: `github-actions-workflow.md`
