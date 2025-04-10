# Troubleshooting Guide

This document provides solutions to common issues you might encounter when working with the CI/CD Automation project.

## Table of Contents

- [GitHub Actions Workflow Issues](#github-actions-workflow-issues)
- [DevContainer Issues](#devcontainer-issues)
- [Docker Issues](#docker-issues)
- [Environment Variable Problems](#environment-variable-problems)
- [Testing Issues](#testing-issues)
- [Common Error Messages](#common-error-messages)
- [Getting Help](#getting-help)

## GitHub Actions Workflow Issues

### Workflow Fails on Module Not Found

**Problem**: Errors like `Cannot find module '/home/runner/work/dev_container/dev_container/scripts/validate-env.js'`

**Solution**:

1. Check the repository name in the error path. If it doesn't match your actual repository name, use `$GITHUB_WORKSPACE` to reference paths:

   ```yaml
   - name: Run script
     run: node $GITHUB_WORKSPACE/scripts/your-script.js
   ```

2. Verify the script exists and is committed to the repository.

### Missing Upload Artifact Info

**Problem**: Error message: `Missing download info for actions/upload-artifact@v3`

**Solution**:

1. Check that the artifact name matches between upload and download jobs
2. Ensure the path specified in the upload action exists
3. Add error detection with `if-no-files-found: error` to make failures explicit:

   ```yaml
   - uses: actions/upload-artifact@v3
     with:
       name: my-artifact
       path: ./dist
       if-no-files-found: error
   ```

### Workflow Permissions Issues

**Problem**: Permissions errors when pushing to container registry or accessing GitHub API

**Solution**:

1. Verify secrets are correctly set up in repository settings
2. Check if the workflow needs explicit permissions:

   ```yaml
   permissions:
     contents: read
     packages: write
   ```

3. Verify PAT has sufficient scope to perform required operations

## DevContainer Issues

### Container Fails to Build

**Problem**: VS Code fails to build the development container

**Solution**:

1. Check Docker is running
2. Review the Docker build logs for errors:

   ```bash
   docker build -f .devcontainer/Dockerfile .
   ```

3. Verify .devcontainer files are properly formatted
4. Try rebuilding with: Command Palette → "Remote-Containers: Rebuild Container"

### Extension Installation Failures

**Problem**: Extensions fail to install in the dev container

**Solution**:

1. Check internet connectivity within the container
2. Verify the extension ID is correct in devcontainer.json
3. Try installing the extension manually from VS Code marketplace
4. Check VS Code logs: Command Palette → "Developer: Show Logs"

## Docker Issues

### Docker Registry Authentication

**Problem**: `Error: denied: requested access to the resource is denied`

**Solution**:

1. Verify Docker credentials:

   ```bash
   echo $DOCKER_ACCESS_TOKEN | docker login $DOCKER_REGISTRY -u $DOCKER_USERNAME --password-stdin
   ```

2. Check that registry URL is correct
3. Ensure image name follows expected format: `registry/username/image:tag`

### Docker Build Context Issues

**Problem**: Files missing during Docker build

**Solution**:

1. Verify context path in your build command:

   ```bash
   docker build -t my-image -f Dockerfile .
   ```

2. Check .dockerignore file isn't excluding required files
3. Use absolute paths when needed

## Environment Variable Problems

### Missing Environment Variables

**Problem**: Scripts fail with missing environment variables

**Solution**:

1. Check your .env file has all required variables from [CI/CD Setup](cicd-setup.md#required-environment-variables)
2. Ensure .env file is loaded properly:

   ```bash
   # On Windows PowerShell
   Get-Content .env | ForEach-Object {
       if ($_ -match "^([^=]+)=(.*)$") {
           $name = $matches[1]
           $value = $matches[2]
           [Environment]::SetEnvironmentVariable($name, $value, "Process")
       }
   }
   
   # On Linux/Mac
   export $(grep -v '^#' .env | xargs)
   ```

3. Check for typos in environment variable names

### Environment Variables Not Available in GitHub Actions

**Problem**: Environment variables defined locally aren't available in GitHub Actions

**Solution**:

1. Add needed variables to GitHub repository secrets
2. Reference them properly in workflow files:

   ```yaml
   env:
     MY_VAR: ${{ secrets.MY_VAR }}
   ```

## Testing Issues

### Jest Tests Timing Out

**Problem**: Integration tests time out, especially with Docker

**Solution**:

1. Increase timeout for specific tests:

   ```javascript
   it('should do something with Docker', async () => {
     jest.setTimeout(30000);
     // test code
   });
   ```

2. Set longer timeout in environment: `JEST_TIMEOUT=60000 npm test`
3. Use environment variable in jest config:

   ```javascript
   testTimeout: process.env.JEST_TIMEOUT ? parseInt(process.env.JEST_TIMEOUT, 10) : 10000,
   ```

### Tests Pass Locally but Fail in CI

**Problem**: Tests work on your machine but fail in GitHub Actions

**Solution**:

1. Check for environment-specific code
2. Look for hardcoded paths or configurations
3. Verify all dependencies are properly installed in CI
4. Test locally with Act to simulate GitHub Actions:

   ```bash
   act -j build-and-test --secret-file .env
   ```

5. Add more logging to tests to diagnose issues

## Common Error Messages

### "MODULE_NOT_FOUND"

**Problem**: `Error: Cannot find module 'some-module'`

**Solution**:

1. Install the missing module: `npm install some-module`
2. Check the module is listed in package.json
3. Verify node_modules is not in .gitignore if needed for the build

### "Error: EACCES: permission denied"

**Problem**: Permission issues when running scripts

**Solution**:

1. Check file permissions: `chmod +x scripts/*.js`
2. Use sudo only if necessary (avoid when possible)
3. Check ownership of files: `chown -R $(whoami) .`

## Getting Help

If you're still experiencing issues:

1. Check for similar issues in the GitHub repository issues
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Logs, error messages, and screenshots
   - Environment information (OS, Node.js version, etc.)

---

Last Updated: April 10, 2025
