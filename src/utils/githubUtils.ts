import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Check if we're in a test environment
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;

// First try to load from the root directory of the project
const rootPath = path.resolve(__dirname, '../../');
const testEnvPath = path.join(rootPath, '.env.test');
const regularEnvPath = path.join(rootPath, '.env');

// Load environment variables from test .env file if running tests
const envPath = isTestEnv && fs.existsSync(testEnvPath) ? testEnvPath : regularEnvPath;

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded environment from:', envPath);
} else {
  console.warn('Warning: .env file not found at:', envPath);
  dotenv.config(); // Fallback to default .env lookup
}

// Environment variables for GitHub configuration using standardized names
const GITHUB_TOKEN = process.env.PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';
const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH || 'main';
const OWNER = process.env.OWNER || process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;

/**
 * Utility functions for working with GitHub
 */
export class GitHubUtilsClass {
  private static octokit: Octokit;

  /**
   * Initialize the GitHub API client
   */
  private static initializeOctokit(): void {
    // Initialize with authentication token if available
    if (GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: GITHUB_TOKEN,
        baseUrl: GITHUB_API_URL,
      });
    } else {
      // For development/testing without a token
      this.octokit = new Octokit({
        baseUrl: GITHUB_API_URL,
      });
      console.warn('GitHub token not found. Using unauthenticated client with rate limits.');
    }
  }

  /**
   * Get the repository information from the workspace dynamically
   * @returns Repository information object
   */
  public static async getRepositoryInfo(): Promise<{ owner: string; repo: string } | undefined> {
    try {
      // First check environment variables using standardized names
      if (OWNER && REPO) {
        return {
          owner: OWNER,
          repo: REPO,
        };
      }

      // Fallback to dynamic retrieval from Git
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        throw new Error('Git extension not found');
      }

      const api = gitExtension.exports.getAPI(1);
      const gitRepo = api.repositories[0];
      if (!gitRepo) {
        throw new Error('No Git repository found');
      }

      const remoteUrl = gitRepo.state.remotes[0]?.fetchUrl || gitRepo.state.remotes[0]?.pushUrl;
      if (!remoteUrl) {
        throw new Error('No remote URL found');
      }

      // Using standard capturing groups instead of named groups for compatibility
      const match = /github\.com[:/]([^/]+)\/([^/.]+)(\.git)?/.exec(remoteUrl);
      if (!match || match.length < 3) {
        throw new Error('Invalid GitHub remote URL');
      }

      return {
        owner: match[1],
        repo: match[2],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to get repository information: ${errorMessage}`);
      return undefined;
    }
  }

  /**
   * Dispatch a workflow on GitHub with improved error handling
   * @param workflowFile The workflow file to dispatch
   * @param inputs Optional workflow inputs
   */
  public static async dispatchWorkflow(
    workflowFile: string,
    inputs?: Record<string, string>
  ): Promise<boolean> {
    try {
      if (!this.octokit) {
        this.initializeOctokit();
      }

      const repoInfo = await this.getRepositoryInfo();
      if (!repoInfo) {
        return false;
      }

      // Get reference branch from environment variables or use default
      const ref = process.env.WORKFLOW_REF || DEFAULT_BRANCH;

      // Prepare inputs with defaults from environment variables if needed
      const enrichedInputs = {
        deployment_env: process.env.DEPLOYMENT_ENV || 'development',
        ...inputs,
      };

      // Log dispatch information
      const inputsMessage = inputs ? ` with ${Object.keys(inputs).length} input(s)` : '';
      vscode.window.showInformationMessage(`Dispatching workflow: ${workflowFile}${inputsMessage}`);

      // If token exists, make the actual API call
      if (GITHUB_TOKEN) {
        await this.octokit.actions.createWorkflowDispatch({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          workflow_id: workflowFile,
          ref: ref,
          inputs: enrichedInputs,
        });
      } else {
        console.warn('Simulating workflow dispatch (no GitHub token available)');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to dispatch workflow: ${errorMessage}`);
      return false;
    }
  }
}
