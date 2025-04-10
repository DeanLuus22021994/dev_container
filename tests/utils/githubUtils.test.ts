import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { GitHubUtils } from '../../src/utils/githubUtils';

// Force setting the test environment marker
process.env.NODE_ENV = 'test';

describe('GitHubUtils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Set test environment variables directly for the tests
    process.env.GITHUB_TOKEN = 'mock_github_token_for_testing';
    process.env.GITHUB_OWNER = 'your-username';
    process.env.GITHUB_REPO = 'cicd-automation';
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getRepositoryInfo', () => {
    it('should return repository information', async () => {
      // Call the method
      const result = await GitHubUtils.getRepositoryInfo();

      // Verify the result
      expect(result).toEqual({
        owner: 'your-username',
        repo: 'cicd-automation',
      });
    });

    it('should handle errors gracefully', async () => {
      // Save the original implementation
      const originalGetRepositoryInfo = GitHubUtils.getRepositoryInfo;

      // Mock window.showErrorMessage
      const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');

      // Replace the implementation with one that throws
      GitHubUtils.getRepositoryInfo = async () => {
        throw new Error('Test error');
      };

      // Call the method
      const result = await GitHubUtils.getRepositoryInfo();

      // Verify the result
      expect(result).toBeUndefined();
      expect(showErrorStub.calledOnce).toBe(true);
      expect(showErrorStub.firstCall.args[0]).toContain('Test error');

      // Restore the original implementation
      GitHubUtils.getRepositoryInfo = originalGetRepositoryInfo;
    });
  });

  describe('dispatchWorkflow', () => {
    it('should dispatch a workflow successfully', async () => {
      // Mock dependencies
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
      const getRepoInfoStub = sandbox.stub(GitHubUtils, 'getRepositoryInfo');
      getRepoInfoStub.resolves({ owner: 'your-username', repo: 'cicd-automation' });

      // Mock Octokit's createWorkflowDispatch
      const octokitMock = {
        actions: {
          createWorkflowDispatch: sandbox.stub().resolves({ status: 204 }),
        },
      };

      // Override the actual Octokit initialization
      sandbox.stub(GitHubUtils as any, 'initializeOctokit').callsFake(function (this: any) {
        this.octokit = octokitMock;
      });

      // Call the method
      const result = await GitHubUtils.dispatchWorkflow('test-workflow.yml');

      // Verify the result
      expect(result).toBe(true);
      expect(showInfoStub.calledOnce).toBe(true);
      expect(showInfoStub.firstCall.args[0]).toContain('test-workflow.yml');
    });

    it('should dispatch a workflow with inputs', async () => {
      // Mock dependencies
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
      const getRepoInfoStub = sandbox.stub(GitHubUtils, 'getRepositoryInfo');
      getRepoInfoStub.resolves({ owner: 'your-username', repo: 'cicd-automation' });

      // Mock Octokit's createWorkflowDispatch
      const octokitMock = {
        actions: {
          createWorkflowDispatch: sandbox.stub().resolves({ status: 204 }),
        },
      };

      // Override the actual Octokit initialization
      sandbox.stub(GitHubUtils as any, 'initializeOctokit').callsFake(function (this: any) {
        this.octokit = octokitMock;
      });

      // Create test inputs
      const inputs = {
        version: '1.0.0',
        environment: 'staging',
      };

      // Call the method
      const result = await GitHubUtils.dispatchWorkflow('test-workflow.yml', inputs);

      // Verify the result
      expect(result).toBe(true);
      expect(showInfoStub.calledOnce).toBe(true);
      expect(showInfoStub.firstCall.args[0]).toContain('test-workflow.yml');
      expect(showInfoStub.firstCall.args[0]).toContain('2 input(s)');
    });

    it('should handle errors when repository info is not available', async () => {
      // Mock dependencies
      const getRepoInfoStub = sandbox.stub(GitHubUtils, 'getRepositoryInfo');
      getRepoInfoStub.resolves(undefined);

      // Call the method
      const result = await GitHubUtils.dispatchWorkflow('test-workflow.yml');

      // Verify the result
      expect(result).toBe(false);
    });

    it('should handle exceptions during workflow dispatch', async () => {
      // Mock dependencies
      const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
      const getRepoInfoStub = sandbox.stub(GitHubUtils, 'getRepositoryInfo');
      getRepoInfoStub.resolves({ owner: 'your-username', repo: 'cicd-automation' });

      // Mock the createWorkflowDispatch function to throw an error
      const octokitMock = {
        actions: {
          createWorkflowDispatch: sandbox.stub().throws(new Error('API error')),
        },
      };

      // Override the Octokit initialization
      const originalInitializeOctokit = (GitHubUtils as any)['initializeOctokit'];
      (GitHubUtils as any)['initializeOctokit'] = function (this: any) {
        this.octokit = octokitMock;
      };

      // Call the method
      const result = await GitHubUtils.dispatchWorkflow('test-workflow.yml');

      // Verify the result
      expect(result).toBe(false);
      expect(showErrorStub.calledOnce).toBe(true);
      expect(showErrorStub.firstCall.args[0]).toContain('API error');

      // Restore the original implementation
      (GitHubUtils as any)['initializeOctokit'] = originalInitializeOctokit;
    });
  });
});
