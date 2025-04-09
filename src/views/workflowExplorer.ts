import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * TreeDataProvider for GitHub workflow files
 */
export class WorkflowExplorerProvider implements vscode.TreeDataProvider<WorkflowTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<WorkflowTreeItem | undefined | null | void> =
    new vscode.EventEmitter<WorkflowTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<WorkflowTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WorkflowTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: WorkflowTreeItem): Promise<WorkflowTreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No workflows in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve([]);
    } else {
      const workflowsPath = path.join(this.workspaceRoot, '.github', 'workflows');
      if (this.pathExists(workflowsPath)) {
        return this.getWorkflowFiles(workflowsPath);
      } else {
        vscode.window.showInformationMessage('Workspace has no GitHub workflows');
        return Promise.resolve([]);
      }
    }
  }

  private async getWorkflowFiles(workflowsPath: string): Promise<WorkflowTreeItem[]> {
    try {
      const files = fs.readdirSync(workflowsPath);
      const workflowFiles = files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

      return workflowFiles.map(file => {
        return new WorkflowTreeItem(file, vscode.TreeItemCollapsibleState.None, {
          command: 'cicd_automation.openWorkflow',
          title: 'Open Workflow',
          arguments: [path.join(workflowsPath, file)],
        });
      });
    } catch (err) {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
      return true;
    } catch (err) {
      return false;
    }
  }
}

/**
 * Tree item representing a workflow file
 */
export class WorkflowTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = '';
    this.iconPath = new vscode.ThemeIcon('github-action');
    this.contextValue = 'workflow';
  }
}
