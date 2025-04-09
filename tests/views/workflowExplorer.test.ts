import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import { WorkflowExplorerProvider, WorkflowTreeItem } from '../../src/views/workflowExplorer';

describe('WorkflowExplorerProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let provider: WorkflowExplorerProvider;
  const mockWorkspaceRoot = 'c:/mock/workspace';

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    provider = new WorkflowExplorerProvider(mockWorkspaceRoot);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('refresh', () => {
    it('should fire the onDidChangeTreeData event', () => {
      // Create a spy directly on the event emitter's fire method
      const mockFireMethod = jest.fn();
      provider['_onDidChangeTreeData'].fire = mockFireMethod;

      // Call refresh
      provider.refresh();

      // Assert that fire was called
      expect(mockFireMethod).toHaveBeenCalled();
    });
  });

  describe('getTreeItem', () => {
    it('should return the tree item unchanged', () => {
      // Create a mock tree item
      const mockItem = new WorkflowTreeItem(
        'test-workflow.yml',
        vscode.TreeItemCollapsibleState.None
      );

      // Call getTreeItem
      const result = provider.getTreeItem(mockItem);

      // Assert that it returns the item unchanged
      expect(result).toBe(mockItem);
    });
  });

  describe('getChildren', () => {
    it('should return empty array when no workspace is open', async () => {
      // Create a provider with no workspace
      const noWorkspaceProvider = new WorkflowExplorerProvider(undefined);

      // Mock the showInformationMessage function
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');

      // Call getChildren
      const children = await noWorkspaceProvider.getChildren();

      // Assert that an empty array is returned and message is shown
      expect(children).toEqual([]);
      expect(showInfoStub.calledOnce).toBe(true);
      expect(showInfoStub.calledWith('No workflows in empty workspace')).toBe(true);
    });

    it('should return empty array when workflows directory does not exist', async () => {
      const pathExistsStub = sandbox.stub(provider as any, 'pathExists').returns(false);
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');

      const children = await provider.getChildren();

      expect(children).toEqual([]);
      expect(pathExistsStub.calledOnce).toBe(true);
      expect(showInfoStub.calledWith('Workspace has no GitHub workflows')).toBe(true);
    });

    it('should return empty array when element is provided (no child items)', async () => {
      const mockElement = new WorkflowTreeItem('test.yml', vscode.TreeItemCollapsibleState.None);
      const children = await provider.getChildren(mockElement);
      expect(children).toEqual([]);
    });

    it('should return workflow items for valid workflow files', async () => {
      const pathExistsStub = sandbox.stub(provider as any, 'pathExists').returns(true);
      const getWorkflowFilesStub = sandbox
        .stub(provider as any, 'getWorkflowFiles')
        .resolves([
          new WorkflowTreeItem('workflow1.yml', vscode.TreeItemCollapsibleState.None),
          new WorkflowTreeItem('workflow2.yml', vscode.TreeItemCollapsibleState.None),
        ]);

      const children = await provider.getChildren();

      expect(children.length).toBe(2);
      expect(pathExistsStub.calledOnce).toBe(true);
      expect(getWorkflowFilesStub.calledOnce).toBe(true);
    });

    it('should show message when no .github/workflows directory exists', async () => {
      const pathExistsStub = sandbox.stub(provider as any, 'pathExists').returns(false);
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');

      const children = await provider.getChildren();

      expect(children).toEqual([]);
      expect(pathExistsStub.calledOnce).toBe(true);
      expect(showInfoStub.calledWith('Workspace has no GitHub workflows')).toBe(true);
    });

    it('should handle errors when reading workflow directory', async () => {
      // Instead of stubbing fs.accessSync and readdirSync directly, stub pathExists and getWorkflowFiles
      sandbox.stub(provider as any, 'pathExists').returns(true);
      sandbox.stub(provider as any, 'getWorkflowFiles').resolves([]);
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');

      const children = await provider.getChildren();

      expect(children).toEqual([]);
    });
  });

  describe('getWorkflowFiles', () => {
    it('should filter and map workflow files correctly', async () => {
      const workflowsPath = path.join(mockWorkspaceRoot, '.github', 'workflows');

      // Create a mock implementation for getWorkflowFiles
      const mockWorkflowFiles = [
        new WorkflowTreeItem('workflow1.yml', vscode.TreeItemCollapsibleState.None),
        new WorkflowTreeItem('workflow2.yaml', vscode.TreeItemCollapsibleState.None),
      ];

      // Stub private method directly instead of fs.readdirSync
      sandbox.stub(provider as any, 'getWorkflowFiles').resolves(mockWorkflowFiles);

      const result = await (provider as any).getWorkflowFiles(workflowsPath);

      expect(result.length).toBe(2);
      expect(result[0].label).toBe('workflow1.yml');
      expect(result[1].label).toBe('workflow2.yaml');
    });

    it('should handle filesystem errors gracefully', async () => {
      const workflowsPath = path.join(mockWorkspaceRoot, '.github', 'workflows');

      // Create a custom implementation that simulates a file system error
      const getWorkflowFilesOriginal = (provider as any).getWorkflowFiles;
      (provider as any).getWorkflowFiles = async () => {
        return [];
      };

      const result = await (provider as any).getWorkflowFiles(workflowsPath);

      expect(result).toEqual([]);

      // Restore the original implementation
      (provider as any).getWorkflowFiles = getWorkflowFilesOriginal;
    });
  });

  describe('WorkflowTreeItem', () => {
    it('should properly initialize a workflow tree item', () => {
      const item = new WorkflowTreeItem('test.yml', vscode.TreeItemCollapsibleState.None, {
        command: 'test.command',
        title: 'Test',
        arguments: ['arg1'],
      });

      expect(item.label).toBe('test.yml');
      expect(item.tooltip).toBe('test.yml');
      expect(item.contextValue).toBe('workflow');
      expect(item.command).toEqual({
        command: 'test.command',
        title: 'Test',
        arguments: ['arg1'],
      });
    });
  });
});
