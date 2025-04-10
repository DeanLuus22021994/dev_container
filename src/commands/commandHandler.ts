import * as vscode from 'vscode';
import { GitHubUtilsClass } from '../utils/githubUtils';

/**
 * Class handling commands for the CI/CD Automation extension
 */
export class CommandHandler {
  /**
   * Register all commands for the extension
   * @param context The extension context
   */
  static registerCommands(context: vscode.ExtensionContext): void {
    // Register the hello world command
    const helloWorldCommand = vscode.commands.registerCommand('cicd_automation.helloWorld', () =>
      this.helloWorld()
    );

    // Register the run workflow command
    const runWorkflowCommand = vscode.commands.registerCommand('cicd_automation.runWorkflow', () =>
      this.runWorkflow()
    );

    // Add all commands to the subscriptions
    context.subscriptions.push(helloWorldCommand, runWorkflowCommand);
  }

  /**
   * Hello world command handler
   */
  static helloWorld(): void {
    vscode.window.showInformationMessage('Hello from CI/CD Automation Extension!');
  }

  /**
   * Run workflow command handler
   */
  static async runWorkflow(): Promise<void> {
    const workflowItems: vscode.QuickPickItem[] = [
      { label: 'vscode-insiders-ci.yml', description: 'CI for VS Code extension' },
      {
        label: 'vscode-insiders-release.yml',
        description: 'Release process for VS Code extension',
      },
      { label: 'agent-workflow.yml', description: 'CI/CD for agent component' },
      { label: 'scheduled-integration.yml', description: 'Scheduled integration testing' },
      { label: 'dependency-update.yml', description: 'Dependency updates workflow' },
    ];

    const selectedItem = await vscode.window.showQuickPick(workflowItems, {
      placeHolder: 'Select a workflow to run',
    });

    if (selectedItem) {
      const selectedWorkflow = selectedItem.label;
      vscode.window.showInformationMessage(`Running workflow: ${selectedWorkflow}`);

      // Run the selected workflow using GitHubUtils
      const repoInfo = await GitHubUtilsClass.getRepositoryInfo();
      if (repoInfo) {
        const result = await GitHubUtilsClass.dispatchWorkflow(selectedWorkflow);
        if (result) {
          vscode.window.showInformationMessage(`Successfully dispatched ${selectedWorkflow}`);
        } else {
          vscode.window.showErrorMessage(`Failed to dispatch ${selectedWorkflow}`);
        }
      }
    }
  }
}
