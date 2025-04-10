/**
 * Integration test for workflow functionality
 *
 * This is a sample integration test using Jest to demonstrate
 * how integration tests can interact with the GitHub API
 */

import * as vscode from 'vscode';
import { GitHubUtils } from '../../src/utils/githubUtils';

// Force setting the test environment marker
process.env.NODE_ENV = 'test';

// Set test environment variables directly
process.env.GITHUB_TOKEN = 'mock_github_token_for_testing';
process.env.GITHUB_OWNER = 'your-username';
process.env.GITHUB_REPO = 'cicd-automation';

// For integration tests, use longer timeouts
jest.setTimeout(30000);

describe('GitHub Workflows Integration', () => {
  // Skip tests if running in CI environment without proper credentials
  const runTests = process.env.SKIP_INTEGRATION_TESTS !== 'true';

  (runTests ? describe : describe.skip)('Repository Info', () => {
    it('should retrieve repository information', async () => {
      const repoInfo = await GitHubUtils.getRepositoryInfo();

      // Integration tests validate real interactions, so we check for a proper structure
      // rather than exact values
      expect(repoInfo).toBeDefined();
      if (repoInfo) {
        expect(repoInfo.owner).toBeDefined();
        expect(repoInfo.repo).toBeDefined();
        expect(typeof repoInfo.owner).toBe('string');
        expect(typeof repoInfo.repo).toBe('string');

        // Verify values match our test environment
        expect(repoInfo.owner).toBe('your-username');
        expect(repoInfo.repo).toBe('cicd-automation');
      }
    });
  });

  // This test is always skipped in automated runs to prevent accidental workflow triggers
  // Only enable this manually when needed
  describe.skip('Workflow Dispatch', () => {
    it('should be able to dispatch a workflow', async () => {
      // This is intentionally skipped to prevent accidentally triggering workflows
      // Use with caution when testing manually

      // Mock a workflow name - replace with an actual workflow file when testing
      const workflowFile = 'sample-workflow.yml';

      const result = await GitHubUtils.dispatchWorkflow(workflowFile);
      expect(result).toBe(true);
    });
  });
});
