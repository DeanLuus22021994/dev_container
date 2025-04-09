import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from the central .env file
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('Warning: .env file not found at:', envPath);
  dotenv.config(); // Fallback to default .env lookup
}

// Environment variables for GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';
const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH || 'main';

/**
 * Utility functions for working with GitHub
 */
export class GitHubUtils {
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
      // First check environment variables
      const envOwner = process.env.GITHUB_OWNER;
      const envRepo = process.env.GITHUB_REPO;

      if (envOwner && envRepo) {
        return {
          owner: envOwner,
          repo: envRepo,
        };
      }

      // Fallback to dynamic retrieval from Git
      // Dynamically parse the git remote URL
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        throw new Error('Git extension not found');
      }

      const api = gitExtension.exports.getAPI(1);
      const repo = api.repositories[0];
      if (!repo) {
        throw new Error('No Git repository found');
      }

      const remoteUrl = repo.state.remotes[0]?.fetchUrl;
      if (!remoteUrl) {
        throw new Error('No remote URL found');
      }

      const match = /github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(\.git)?/.exec(remoteUrl);
      if (!match?.groups) {
        throw new Error('Invalid GitHub remote URL');
      }

      return {
        owner: match.groups.owner,
        repo: match.groups.repo,
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
