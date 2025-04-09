import * as vscode from 'vscode';
import { CommandHandler } from './commands/commandHandler';
import { WorkflowExplorerProvider } from './views/workflowExplorer';

/**
 * This method is called when the extension is activated.
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "cicd_automation" is now active!');

  // Register commands
  CommandHandler.registerCommands(context);

  // Set up workflow explorer view
  const workspaceRoot =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  const workflowExplorerProvider = new WorkflowExplorerProvider(workspaceRoot);
  vscode.window.registerTreeDataProvider('workflowExplorer', workflowExplorerProvider);

  // Register open workflow command
  const openWorkflowCommand = vscode.commands.registerCommand(
    'cicd_automation.openWorkflow',
    (filePath: string) => {
      vscode.workspace.openTextDocument(filePath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    }
  );

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand('workflowExplorer.refresh', () => {
    workflowExplorerProvider.refresh();
  });

  context.subscriptions.push(openWorkflowCommand, refreshCommand);
}

/**
 * This method is called when the extension is deactivated
 */
export function deactivate() {
  console.log('Extension "cicd_automation" is now deactivated.');
}
