import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommandHandler } from '../../src/commands/commandHandler';
import { GitHubUtils } from '../../src/utils/githubUtils';

describe('CommandHandler', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('registerCommands', () => {
    it('should register all commands', () => {
      // Mock vscode commands
      const registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
      const context = {
        subscriptions: [],
      } as unknown as vscode.ExtensionContext;

      // Call the method
      CommandHandler.registerCommands(context);

      // Verify the commands were registered
      expect(registerCommandStub.calledTwice).toBe(true);
      expect(registerCommandStub.firstCall.args[0]).toBe('cicd_automation.helloWorld');
      expect(registerCommandStub.secondCall.args[0]).toBe('cicd_automation.runWorkflow');
      expect(context.subscriptions.length).toBe(2);
    });
  });

  describe('helloWorld', () => {
    it('should show information message', () => {
      // Mock the showInformationMessage function
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');

      // Call the method
      CommandHandler.helloWorld();

      // Verify the message was shown
      expect(showInfoStub.calledOnceWith('Hello from CI/CD Automation Extension!')).toBe(true);
    });
  });

  describe('runWorkflow', () => {
    it('should run the selected workflow', async () => {
      // Mock the necessary functions
      const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      showQuickPickStub.resolves({
        label: 'agent-workflow.yml',
        description: 'CI/CD for agent component',
      });

      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
      const getRepoInfoStub = sandbox.stub(GitHubUtils, 'getRepositoryInfo');
      getRepoInfoStub.resolves({ owner: 'test', repo: 'test-repo' });

      const dispatchWorkflowStub = sandbox.stub(GitHubUtils, 'dispatchWorkflow');
      dispatchWorkflowStub.resolves(true);

      // Call the method
      await CommandHandler.runWorkflow();

      // Verify the workflow was dispatched
      expect(showQuickPickStub.calledOnce).toBe(true);
      expect(showInfoStub.calledWith('Running workflow: agent-workflow.yml')).toBe(true);
      expect(getRepoInfoStub.calledOnce).toBe(true);
      expect(dispatchWorkflowStub.calledWith('agent-workflow.yml')).toBe(true);
      expect(showInfoStub.calledWith('Successfully dispatched agent-workflow.yml')).toBe(true);
    });

    it('should handle workflow dispatch failure', async () => {
      // Mock the necessary functions
      const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      showQuickPickStub.resolves({
        label: 'agent-workflow.yml',
        description: 'CI/CD for agent component',
      });

      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
      const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');

      const getRepoInfoStub = sandbox.stub(GitHubUtils, 'getRepositoryInfo');
      getRepoInfoStub.resolves({ owner: 'test', repo: 'test-repo' });

      const dispatchWorkflowStub = sandbox.stub(GitHubUtils, 'dispatchWorkflow');
      dispatchWorkflowStub.resolves(false);

      // Call the method
      await CommandHandler.runWorkflow();

      // Verify proper error handling
      expect(showErrorStub.calledWith('Failed to dispatch agent-workflow.yml')).toBe(true);
    });

    it('should do nothing when no workflow is selected', async () => {
      // Mock showQuickPick to return undefined (no selection)
      const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      showQuickPickStub.resolves(undefined);

      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
      const getRepoInfoStub = sandbox.stub(GitHubUtils, 'getRepositoryInfo');

      // Call the method
      await CommandHandler.runWorkflow();

      // Verify that no further actions were taken
      expect(showInfoStub.called).toBe(false);
      expect(getRepoInfoStub.called).toBe(false);
    });
  });
});
