// Type definitions for testing GitHubUtils
import { Octokit } from '@octokit/rest';

// Define a partial mock type for Octokit to allow for simpler testing
export type OctokitMock = {
  actions: {
    createWorkflowDispatch: sinon.SinonStub;
  }
};

// Define a type to access private members of GitHubUtils for testing
export type GitHubUtilsPrivate = {
  _octokit?: OctokitMock;
  _initializeOctokit?: () => void;
};

// Augment the GitHubUtils class for testing purposes
declare module '../../src/utils/githubUtils' {
  interface GitHubUtils {
    // No instance members needed
  }

  // Add static properties for testing
  interface GitHubUtilsConstructor {
    octokit: Octokit;
    initializeOctokit(): void;
  }

  // Apply the constructor interface to the GitHubUtils class constructor
  export const GitHubUtils: GitHubUtilsConstructor;
}