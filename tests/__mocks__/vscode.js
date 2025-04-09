// Mock implementation of the vscode module for tests
const vscode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showQuickPick: jest.fn(),
    registerTreeDataProvider: jest.fn(),
    showTextDocument: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn().mockReturnValue({ dispose: jest.fn() }),
    executeCommand: jest.fn(),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
    getWorkspaceFolder: jest.fn(),
    openTextDocument: jest.fn().mockResolvedValue({}),
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn(),
      update: jest.fn(),
    }),
  },
  Uri: {
    file: path => ({ fsPath: path }),
    parse: jest.fn(),
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  TreeItem: class TreeItem {
    constructor(label, collapsibleState) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  EventEmitter: class EventEmitter {
    constructor() {
      this.event = jest.fn();
      this.fire = jest.fn();
    }
  },
  ThemeIcon: class ThemeIcon {
    constructor(id) {
      this.id = id;
    }
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
  ExtensionContext: class ExtensionContext {
    constructor() {
      this.subscriptions = [];
      this.extensionPath = '/mock/extension/path';
      this.globalState = {
        get: jest.fn(),
        update: jest.fn(),
      };
      this.workspaceState = {
        get: jest.fn(),
        update: jest.fn(),
      };
    }
  },
};

module.exports = vscode;
