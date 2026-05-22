const path = require('path');
const { pathToFileURL } = require('url');

const RMT_VSCODE_BRIDGE_SCHEMA = 'xtend.rmt.editor.vscode-bridge.v1';
const RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA = 'xtend.rmt.editor.vscode-primitive-authoring-experience.v1';
const RMT_VSCODE_DX_SCHEMA = 'xtend.rmt.editor.vscode-dx.v1';
const RMT_VSCODE_TASKS_SCHEMA = 'xtend.rmt.editor.vscode-tasks.v1';
const RMT_VSCODE_LAUNCH_SCHEMA = 'xtend.rmt.editor.vscode-launch.v1';
const RMT_VSCODE_BRIDGE_WORKPACKAGE = 'WP-E14-12';
const RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE = 'RMT-VNEXT-PRIM-07';
const RMT_VSCODE_DX_WORKPACKAGE = 'RMT-VSCODE-DX-01';
const DEFAULT_SERVER_RELATIVE_PATH = '../../rmt-language-server/server.js';
const DEFAULT_XTEND_CLI_RELATIVE_PATH = '../../../xtend-builder/scaffold.js';
const TASKS_TEMPLATE_RELATIVE_PATH = 'templates/tasks.json';
const LAUNCH_TEMPLATE_RELATIVE_PATH = 'templates/launch.json';
const RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND = 'source.fixAll.rmt.vnext.primitives';
const RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND = 'xtend.rmt.vnext.extractKernelImport';
const RMT_VSCODE_PRIMITIVE_SAFE_FIX_ALL_COMMAND = 'xtendRmt.rmtVNext.applySafePrimitiveFixAll';
const RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS = Object.freeze([
  'xtendRmt.rmtVNext.showPrimitiveAuthoringApplyExperience',
  'xtendRmt.rmtVNext.showCodeActionPreview',
  'xtendRmt.rmtVNext.showCommandHandoff',
  RMT_VSCODE_PRIMITIVE_SAFE_FIX_ALL_COMMAND
]);
const RMT_VSCODE_DX_COMMANDS = Object.freeze([
  'xtendRmt.restartLanguageServer',
  'xtendRmt.runActiveLint',
  'xtendRmt.runWorkspaceLint',
  'xtendRmt.runRmtBuildCheck',
  'xtendRmt.runScaffoldVerify',
  'xtendRmt.debugLanguageServer',
  'xtendRmt.debugActiveLint',
  'xtendRmt.debugActiveBuild',
  'xtendRmt.openTasksTemplate',
  'xtendRmt.openLaunchTemplate'
]);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function resolveServerModule(context = {}, options = {}) {
  if (options.serverModule) {
    return path.resolve(options.serverModule);
  }

  const extensionPath = context.extensionPath || __dirname;
  return path.resolve(extensionPath, DEFAULT_SERVER_RELATIVE_PATH);
}

function createServerCommand(context = {}, options = {}) {
  return {
    schema: RMT_VSCODE_BRIDGE_SCHEMA,
    workpackage: RMT_VSCODE_BRIDGE_WORKPACKAGE,
    command: options.command || 'node',
    args: options.args ? toArray(options.args) : [resolveServerModule(context, options)],
    transport: 'stdio-json-rpc',
    languageId: 'rmt',
    sourceOfTruth: 'tools/rmt-language-server/server.js',
    networkRequired: false,
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  };
}

function createVsCodeLanguageClientConfig(context = {}, options = {}) {
  const serverCommand = createServerCommand(context, options);

  return {
    schema: RMT_VSCODE_DX_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    clientId: 'xtendRmtLanguageServer',
    clientName: 'XTendRMT Language Server',
    languageId: 'rmt',
    serverOptions: {
      command: serverCommand.command,
      args: toArray(options.args || serverCommand.args),
      transport: 'stdio'
    },
    clientOptions: {
      documentSelector: [
        { scheme: 'file', language: 'rmt' },
        { scheme: 'untitled', language: 'rmt' }
      ],
      synchronize: {
        configurationSection: 'xtendRmt'
      }
    },
    sourceOfTruth: serverCommand.sourceOfTruth,
    networkRequired: false,
    kernelBoundary: serverCommand.kernelBoundary
  };
}

function createRuntimeLanguageClientServerOptions(languageClientModule = {}, serverOptions = {}) {
  const runtimeOptions = { ...serverOptions };

  if (runtimeOptions.transport === 'stdio') {
    if (
      languageClientModule.TransportKind &&
      Object.prototype.hasOwnProperty.call(languageClientModule.TransportKind, 'stdio')
    ) {
      runtimeOptions.transport = languageClientModule.TransportKind.stdio;
    } else {
      delete runtimeOptions.transport;
    }
  }

  return runtimeOptions;
}


function normalizeProblemMatcherSeverity(severity) {
  return severity === 'hint' ? 'info' : severity;
}

function createVsCodeProblemMatcher() {
  return {
    schema: RMT_VSCODE_TASKS_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    name: 'xtend-rmt-lint',
    owner: 'xtendRmt',
    fileLocation: ['relative', '${workspaceFolder}'],
    pattern: {
      regexp: '^(error|warning|info)\\s+([A-Za-z0-9_.-]+)\\s+(.+):(\\d+):(\\d+)\\s+(.*)$',
      severity: 1,
      code: 2,
      file: 3,
      line: 4,
      column: 5,
      message: 6
    },
    severityPolicy: {
      hint: normalizeProblemMatcherSeverity('hint')
    }
  };
}

function taskPresentation() {
  return {
    reveal: 'always',
    panel: 'shared',
    clear: false,
    group: 'xtend'
  };
}

function createXtendCliArgs(commandArgs = []) {
  return ['${workspaceFolder}/xtend-builder/scaffold.js'].concat(commandArgs);
}

function createVsCodeTaskDefinitions(options = {}) {
  const failOn = options.failOn || 'warning';
  const presentation = taskPresentation();

  return {
    schema: RMT_VSCODE_TASKS_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    taskType: 'xtendRmt',
    problemMatcher: '$xtend-rmt-lint',
    tasks: [
      {
        id: 'lint-active',
        type: 'xtendRmt',
        label: 'XTendRMT: Lint active RMT',
        command: 'node',
        args: createXtendCliArgs(['rmt', 'lint', '${file}', '--format', 'problem-matcher', '--fail-on', failOn]),
        problemMatcher: ['$xtend-rmt-lint'],
        group: 'build',
        presentation
      },
      {
        id: 'lint-workspace',
        type: 'xtendRmt',
        label: 'XTendRMT: Lint workspace RMT',
        command: 'node',
        args: createXtendCliArgs(['rmt', 'lint', '${workspaceFolder}', '--format', 'problem-matcher', '--fail-on', failOn]),
        problemMatcher: ['$xtend-rmt-lint'],
        group: 'build',
        presentation
      },
      {
        id: 'agent-repair-report',
        type: 'xtendRmt',
        label: 'XTendRMT: Agent repair report',
        command: 'node',
        args: createXtendCliArgs(['rmt', 'lint', '${file}', '--agent']),
        problemMatcher: [],
        group: 'test',
        presentation
      },
      {
        id: 'rmt-build-check',
        type: 'xtendRmt',
        label: 'XTendRMT: RMT build check',
        command: 'node',
        args: createXtendCliArgs(['rmt-build', '--source', '${file}', '--check', '--json']),
        problemMatcher: [],
        group: 'build',
        presentation
      },
      {
        id: 'rmt-build-write',
        type: 'xtendRmt',
        label: 'XTendRMT: RMT build write',
        command: 'node',
        args: createXtendCliArgs(['rmt-build', '--source', '${file}', '--write', '--json']),
        problemMatcher: [],
        group: 'build',
        presentation
      },
      {
        id: 'scaffold-verify',
        type: 'xtendRmt',
        label: 'XTend: Scaffold verify',
        command: 'node',
        args: createXtendCliArgs(['verify', '--json']),
        problemMatcher: [],
        group: 'test',
        presentation
      },
      {
        id: 'scaffold-dry-run',
        type: 'xtendRmt',
        label: 'XTend: Scaffold dry-run component',
        command: 'node',
        args: createXtendCliArgs(['component-files', '--tag', 'x-example', '--profile', 'display', '--feature', 'state', '--json']),
        problemMatcher: [],
        group: 'test',
        presentation
      },
      {
        id: 'vnext-primitive-gate',
        type: 'xtendRmt',
        label: 'XTendRMT: vNext primitive gate',
        command: 'npm',
        args: ['run', 'test:rmt-vnext-primitives:report'],
        problemMatcher: [],
        group: 'test',
        presentation
      }
    ]
  };
}

function createVsCodeLaunchConfigurations() {
  return {
    schema: RMT_VSCODE_LAUNCH_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    version: '0.2.0',
    configurations: [
      {
        type: 'node',
        request: 'launch',
        name: 'XTendRMT: Debug Language Server',
        program: '${workspaceFolder}/tools/rmt-language-server/server.js',
        cwd: '${workspaceFolder}',
        console: 'internalConsole',
        outputCapture: 'std',
        skipFiles: ['<node_internals>/**']
      },
      {
        type: 'node',
        request: 'launch',
        name: 'XTendRMT: Debug Active RMT Lint',
        program: '${workspaceFolder}/xtend-builder/scaffold.js',
        args: ['rmt', 'lint', '${file}', '--json'],
        cwd: '${workspaceFolder}',
        console: 'internalConsole',
        outputCapture: 'std',
        skipFiles: ['<node_internals>/**']
      },
      {
        type: 'node',
        request: 'launch',
        name: 'XTendRMT: Debug Active RMT Build',
        program: '${workspaceFolder}/xtend-builder/scaffold.js',
        args: ['rmt-build', '--source', '${file}', '--check', '--json'],
        cwd: '${workspaceFolder}',
        console: 'internalConsole',
        outputCapture: 'std',
        skipFiles: ['<node_internals>/**']
      },
      {
        type: 'node',
        request: 'launch',
        name: 'XTendRMT: Debug Scaffold Verify',
        program: '${workspaceFolder}/xtend-builder/scaffold.js',
        args: ['verify', '--json'],
        cwd: '${workspaceFolder}',
        console: 'internalConsole',
        outputCapture: 'std',
        skipFiles: ['<node_internals>/**']
      }
    ]
  };
}

function getActionPreview(action = {}) {
  return action.preview || (action.data && action.data.preview) || null;
}

function getActionSafeFlag(action = {}) {
  if (action.safe === false) return false;
  if (action.data && action.data.safe === false) return false;
  return true;
}

function getActionDiagnosticCode(action = {}) {
  return action.diagnosticCode || (action.data && action.data.diagnosticCode) || null;
}

function classifyPrimitiveAuthoringAction(action = {}) {
  const kind = action.kind || 'quickfix';
  const command = action.command || null;
  const preview = getActionPreview(action);

  if (kind === RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND) {
    return 'fix-all';
  }

  if (command && command.command === RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND) {
    return 'manual-command';
  }

  if (preview && preview.status === 'manual-command') {
    return 'manual-command';
  }

  if (action.edit) {
    return getActionSafeFlag(action) ? 'workspace-edit' : 'unsafe-edit';
  }

  return command ? 'command' : 'inspect';
}

function summarizePrimitiveAuthoringAction(action = {}, index = 0) {
  const preview = getActionPreview(action);
  const mode = classifyPrimitiveAuthoringAction(action);

  return {
    index,
    title: action.title || `RMT vNext Primitive Action ${index + 1}`,
    kind: action.kind || 'quickfix',
    mode,
    diagnosticCode: getActionDiagnosticCode(action),
    safe: getActionSafeFlag(action),
    hasEdit: !!action.edit,
    hasCommand: !!action.command,
    command: action.command ? action.command.command || null : null,
    previewStatus: preview ? preview.status || null : null,
    previewSchema: preview ? preview.schema || null : null,
    changedLineCount: preview && Number.isInteger(preview.changedLineCount) ? preview.changedLineCount : 0,
    firstChangedLine: preview && Number.isInteger(preview.firstChangedLine) ? preview.firstChangedLine : null,
    previewAfter: preview ? toArray(preview.after).slice(0, 4) : [],
    source: 'xtend-rmt-vscode-primitive-authoring'
  };
}

function normalizeDocumentUri(uri) {
  if (!uri) {
    return 'untitled:rmt-vnext-active-document';
  }

  if (typeof uri === 'string') {
    return uri;
  }

  if (typeof uri.toString === 'function') {
    return uri.toString();
  }

  return String(uri);
}

function normalizeDocumentFilePath(document = {}) {
  if (document.fileName) return document.fileName;
  if (document.filePath) return document.filePath;
  if (document.uri && document.uri.fsPath) return document.uri.fsPath;
  return null;
}

function normalizeTextDocument(document = {}) {
  const text = typeof document.getText === 'function'
    ? document.getText()
    : (typeof document.text === 'string' ? document.text : '');
  const uri = normalizeDocumentUri(document.uri || (document.filePath ? pathToFileURL(document.filePath).toString() : null));

  return {
    uri,
    filePath: normalizeDocumentFilePath(document),
    languageId: document.languageId || 'rmt',
    version: Number.isInteger(document.version) ? document.version : 0,
    text
  };
}

function resolveWorkspaceRoot(vscodeApi, document = {}, options = {}) {
  if (options.rootDir) {
    return path.resolve(options.rootDir);
  }

  if (vscodeApi && vscodeApi.workspace && typeof vscodeApi.workspace.getWorkspaceFolder === 'function') {
    const workspaceFolder = vscodeApi.workspace.getWorkspaceFolder(document.uri);
    if (workspaceFolder && workspaceFolder.uri && workspaceFolder.uri.fsPath) {
      return workspaceFolder.uri.fsPath;
    }
  }

  const filePath = normalizeDocumentFilePath(document);
  return filePath ? path.dirname(filePath) : process.cwd();
}

function activeRmtTextDocument(vscodeApi, options = {}) {
  if (options.document) {
    return options.document;
  }

  const activeEditor = vscodeApi && vscodeApi.window && vscodeApi.window.activeTextEditor;
  return activeEditor ? activeEditor.document : null;
}

function getWorkspaceFolder(vscodeApi, document = null) {
  if (!vscodeApi || !vscodeApi.workspace) {
    return null;
  }

  if (document && document.uri && typeof vscodeApi.workspace.getWorkspaceFolder === 'function') {
    const folder = vscodeApi.workspace.getWorkspaceFolder(document.uri);
    if (folder) return folder;
  }

  return Array.isArray(vscodeApi.workspace.workspaceFolders) && vscodeApi.workspace.workspaceFolders.length > 0
    ? vscodeApi.workspace.workspaceFolders[0]
    : null;
}

function normalizeWorkspaceFolderPath(folder) {
  return folder && folder.uri && folder.uri.fsPath ? folder.uri.fsPath : process.cwd();
}

function substituteVariables(value, variables = {}) {
  if (Array.isArray(value)) {
    return value.map((entry) => substituteVariables(entry, variables));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, substituteVariables(entry, variables)]));
  }

  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\$\{workspaceFolder\}/g, variables.workspaceFolder || '')
    .replace(/\$\{file\}/g, variables.file || '');
}

function getConfigurationValue(vscodeApi, key, fallback) {
  const workspace = vscodeApi && vscodeApi.workspace;
  const configuration = workspace && typeof workspace.getConfiguration === 'function'
    ? workspace.getConfiguration('xtendRmt')
    : null;

  if (configuration && typeof configuration.get === 'function') {
    const configured = configuration.get(key);
    if (configured !== undefined && configured !== null) {
      return configured;
    }
  }

  return fallback;
}

function resolveXtendCliInvocation(vscodeApi, context = {}, options = {}) {
  const document = activeRmtTextDocument(vscodeApi, options);
  const workspaceFolder = getWorkspaceFolder(vscodeApi, document);
  const workspaceFolderPath = normalizeWorkspaceFolderPath(workspaceFolder);
  const activeFile = normalizeDocumentFilePath(document || {}) || options.file || '';
  const command = options.command || getConfigurationValue(vscodeApi, 'xtendCli.command', 'node');
  const configuredArgs = options.args || getConfigurationValue(vscodeApi, 'xtendCli.args', ['${workspaceFolder}/xtend-builder/scaffold.js']);
  const fallbackCliPath = path.resolve(context.extensionPath || __dirname, DEFAULT_XTEND_CLI_RELATIVE_PATH);
  const variables = {
    workspaceFolder: workspaceFolderPath,
    file: activeFile
  };
  const args = substituteVariables(toArray(configuredArgs), variables);

  if (args.length === 0) {
    args.push(fallbackCliPath);
  }

  return {
    schema: RMT_VSCODE_DX_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    command,
    args,
    workspaceFolder,
    workspaceFolderPath,
    activeFile,
    fallbackCliPath
  };
}

function resolveLanguageServerInvocation(vscodeApi, context = {}, options = {}) {
  const document = activeRmtTextDocument(vscodeApi, options);
  const workspaceFolder = getWorkspaceFolder(vscodeApi, document);
  const workspaceFolderPath = normalizeWorkspaceFolderPath(workspaceFolder);
  const fallbackServerPath = resolveServerModule(context, options);
  const command = options.command || getConfigurationValue(vscodeApi, 'languageServer.command', 'node');
  const configuredArgs = options.args || getConfigurationValue(vscodeApi, 'languageServer.args', ['${workspaceFolder}/tools/rmt-language-server/server.js']);
  const args = substituteVariables(toArray(configuredArgs), {
    workspaceFolder: workspaceFolderPath,
    file: normalizeDocumentFilePath(document || {}) || ''
  });

  return {
    schema: RMT_VSCODE_DX_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    command,
    args: args.length > 0 ? args : [fallbackServerPath],
    workspaceFolder,
    workspaceFolderPath,
    fallbackServerPath
  };
}

function resolveTaskDefinition(taskId, options = {}) {
  const tasks = createVsCodeTaskDefinitions(options).tasks;
  return tasks.find((task) => task.id === taskId || task.label === taskId) || null;
}

function toVsCodeTask(vscodeApi, context = {}, definition = {}, options = {}) {
  if (!vscodeApi || !vscodeApi.Task || !vscodeApi.ShellExecution) {
    return {
      schema: RMT_VSCODE_TASKS_SCHEMA,
      workpackage: RMT_VSCODE_DX_WORKPACKAGE,
      status: 'dry-run',
      ok: true,
      definition
    };
  }

  const document = activeRmtTextDocument(vscodeApi, options);
  const workspaceFolder = getWorkspaceFolder(vscodeApi, document);
  const workspaceFolderPath = normalizeWorkspaceFolderPath(workspaceFolder);
  const activeFile = normalizeDocumentFilePath(document || {}) || options.file || '';
  const cli = resolveXtendCliInvocation(vscodeApi, context, options);
  const variables = {
    workspaceFolder: workspaceFolderPath,
    file: activeFile
  };
  const usesDefaultXtendCli = definition.command === 'node' && toArray(definition.args)[0] === '${workspaceFolder}/xtend-builder/scaffold.js';
  const command = substituteVariables(usesDefaultXtendCli ? cli.command : (definition.command || cli.command), variables);
  const rawArgs = usesDefaultXtendCli ? cli.args.concat(toArray(definition.args).slice(1)) : toArray(definition.args);
  const args = substituteVariables(rawArgs, variables);
  const scope = workspaceFolder || vscodeApi.TaskScope.Workspace;
  const task = new vscodeApi.Task(
    { type: 'xtendRmt', task: definition.id },
    scope,
    definition.label,
    'XTendRMT',
    new vscodeApi.ShellExecution(command, args, { cwd: workspaceFolderPath }),
    toArray(definition.problemMatcher)
  );

  if (definition.group === 'build') task.group = vscodeApi.TaskGroup.Build;
  if (definition.group === 'test') task.group = vscodeApi.TaskGroup.Test;
  task.presentationOptions = definition.presentation || taskPresentation();
  return task;
}

function createVsCodeTaskProvider(vscodeApi, context = {}, options = {}) {
  return {
    provideTasks() {
      return createVsCodeTaskDefinitions(options).tasks.map((definition) => toVsCodeTask(vscodeApi, context, definition, options));
    },
    resolveTask(task) {
      const taskId = task && task.definition ? task.definition.task : null;
      const definition = resolveTaskDefinition(taskId, options);
      return definition ? toVsCodeTask(vscodeApi, context, definition, options) : undefined;
    }
  };
}

function runXtendRmtTask(vscodeApi, context = {}, taskId, options = {}) {
  const definition = resolveTaskDefinition(taskId, {
    failOn: options.failOn || getConfigurationValue(vscodeApi, 'tasks.defaultFailOn', 'warning')
  });

  if (!definition) {
    return {
      schema: RMT_VSCODE_TASKS_SCHEMA,
      workpackage: RMT_VSCODE_DX_WORKPACKAGE,
      status: 'not-found',
      ok: false,
      taskId
    };
  }

  const task = toVsCodeTask(vscodeApi, context, definition, options);

  if (vscodeApi && vscodeApi.tasks && typeof vscodeApi.tasks.executeTask === 'function') {
    const execution = vscodeApi.tasks.executeTask(task);
    return {
      schema: RMT_VSCODE_TASKS_SCHEMA,
      workpackage: RMT_VSCODE_DX_WORKPACKAGE,
      status: 'started',
      ok: true,
      taskId: definition.id,
      label: definition.label,
      execution
    };
  }

  return {
    schema: RMT_VSCODE_TASKS_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    status: 'dry-run',
    ok: true,
    taskId: definition.id,
    label: definition.label,
    task
  };
}

function resolveDebugConfiguration(debugId) {
  const launch = createVsCodeLaunchConfigurations();
  return launch.configurations.find((config) => config.name === debugId || config.name.toLowerCase().includes(String(debugId).toLowerCase())) || null;
}

function startXtendRmtDebugSession(vscodeApi, context = {}, debugId, options = {}) {
  const configuration = resolveDebugConfiguration(debugId);

  if (!configuration) {
    return {
      schema: RMT_VSCODE_LAUNCH_SCHEMA,
      workpackage: RMT_VSCODE_DX_WORKPACKAGE,
      status: 'not-found',
      ok: false,
      debugId
    };
  }

  const document = activeRmtTextDocument(vscodeApi, options);
  const workspaceFolder = getWorkspaceFolder(vscodeApi, document);
  const workspaceFolderPath = normalizeWorkspaceFolderPath(workspaceFolder);
  const activeFile = normalizeDocumentFilePath(document || {}) || options.file || '';
  const resolved = substituteVariables(configuration, {
    workspaceFolder: workspaceFolderPath,
    file: activeFile
  });

  if (vscodeApi && vscodeApi.debug && typeof vscodeApi.debug.startDebugging === 'function') {
    const started = vscodeApi.debug.startDebugging(workspaceFolder, resolved);
    return {
      schema: RMT_VSCODE_LAUNCH_SCHEMA,
      workpackage: RMT_VSCODE_DX_WORKPACKAGE,
      status: 'started',
      ok: true,
      debugId,
      configuration: resolved,
      started
    };
  }

  return {
    schema: RMT_VSCODE_LAUNCH_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    status: 'dry-run',
    ok: true,
    debugId,
    configuration: resolved,
    contextPath: context.extensionPath || __dirname
  };
}

function openVsCodeTemplate(vscodeApi, context = {}, relativePath) {
  const templatePath = path.resolve(context.extensionPath || __dirname, relativePath);

  if (!vscodeApi || !vscodeApi.workspace || typeof vscodeApi.workspace.openTextDocument !== 'function') {
    return {
      schema: RMT_VSCODE_DX_SCHEMA,
      workpackage: RMT_VSCODE_DX_WORKPACKAGE,
      status: 'dry-run',
      ok: true,
      templatePath
    };
  }

  return vscodeApi.workspace.openTextDocument(templatePath).then((document) => {
    if (vscodeApi.window && typeof vscodeApi.window.showTextDocument === 'function') {
      return vscodeApi.window.showTextDocument(document);
    }
    return document;
  });
}

function startLanguageClient(vscodeApi, context = {}, output = null, options = {}) {
  const config = createVsCodeLanguageClientConfig(context, options);
  let languageClientModule = options.languageClientModule || null;

  if (!languageClientModule) {
    try {
      languageClientModule = require('vscode-languageclient/node');
    } catch (error) {
      if (output && typeof output.appendLine === 'function') {
        output.appendLine(`XTendRMT LanguageClient dependency missing: ${error.message}`);
      }
      return {
        schema: RMT_VSCODE_DX_SCHEMA,
        workpackage: RMT_VSCODE_DX_WORKPACKAGE,
        status: 'missing-dependency',
        ok: false,
        error: error.message,
        config
      };
    }
  }

  const serverOptions = createRuntimeLanguageClientServerOptions(languageClientModule, config.serverOptions);
  const client = new languageClientModule.LanguageClient(
    config.clientId,
    config.clientName,
    serverOptions,
    config.clientOptions
  );
  const started = typeof client.start === 'function' ? client.start() : null;

  if (output && typeof output.appendLine === 'function') {
    output.appendLine('XTendRMT Language Server client started.');
  }

  return {
    schema: RMT_VSCODE_DX_SCHEMA,
    workpackage: RMT_VSCODE_DX_WORKPACKAGE,
    status: 'started',
    ok: true,
    client,
    started,
    config: {
      ...config,
      serverOptions
    }
  };
}

function createLanguageServer(context = {}, options = {}) {
  if (options.server) {
    return options.server;
  }

  if (typeof options.serverFactory === 'function') {
    return options.serverFactory(options);
  }

  const serverModulePath = resolveServerModule(context, options);
  const serverModule = require(serverModulePath);
  return serverModule.createRmtLanguageServer({
    rootDir: options.rootDir || process.cwd()
  });
}

function documentFullRange(document = {}) {
  const lines = String(document.text || '').split(/\r\n|\r|\n/u);
  const lastLine = Math.max(0, lines.length - 1);

  return {
    start: { line: 0, character: 0 },
    end: { line: lastLine, character: lines[lastLine] ? lines[lastLine].length : 0 }
  };
}

function requestPrimitiveCodeActionsForDocument(document = {}, context = {}, options = {}) {
  const normalized = normalizeTextDocument(document);
  const rootDir = resolveWorkspaceRoot(options.vscode, document, options);
  const server = createLanguageServer(context, {
    ...options,
    rootDir
  });
  const initializeResponse = server.handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      rootUri: pathToFileURL(rootDir).toString()
    }
  })[0];
  const openResponses = server.handleMessage({
    jsonrpc: '2.0',
    method: 'textDocument/didOpen',
    params: {
      textDocument: {
        uri: normalized.uri,
        languageId: normalized.languageId,
        version: normalized.version,
        text: normalized.text
      }
    }
  });
  const diagnostics = openResponses
    .filter((response) => response && response.method === 'textDocument/publishDiagnostics')
    .flatMap((response) => toArray(response.params && response.params.diagnostics));
  const codeActionResponse = server.handleMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'textDocument/codeAction',
    params: {
      textDocument: { uri: normalized.uri },
      range: options.range || documentFullRange(normalized),
      context: {
        diagnostics
      }
    }
  })[0];

  return {
    schema: 'xtend.rmt.editor.vscode-active-document-code-actions.v1',
    workpackage: RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE,
    status: codeActionResponse && codeActionResponse.result ? 'ready' : 'empty',
    ok: !!(codeActionResponse && codeActionResponse.result),
    rootDir,
    document: normalized,
    diagnostics,
    actions: toArray(codeActionResponse && codeActionResponse.result),
    initialize: initializeResponse ? initializeResponse.result : null
  };
}

function createPrimitiveAuthoringApplyExperience(input = {}, options = {}) {
  const actions = toArray(input.actions || (input.report && input.report.actions) || input);
  const summaries = actions.map(summarizePrimitiveAuthoringAction);
  const fixAll = summaries.filter((entry) => entry.mode === 'fix-all');
  const safeQuickFixes = summaries.filter((entry) => entry.mode === 'workspace-edit' && entry.safe);
  const manualHandoffs = summaries.filter((entry) => entry.mode === 'manual-command');
  const previews = summaries.filter((entry) => entry.previewSchema);

  return {
    schema: RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA,
    bridgeSchema: RMT_VSCODE_BRIDGE_SCHEMA,
    workpackage: RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE,
    bridgeWorkpackage: RMT_VSCODE_BRIDGE_WORKPACKAGE,
    status: summaries.length > 0 ? 'ready' : 'empty',
    ok: true,
    languageId: 'rmt',
    source: options.source || 'vscode-bridge',
    commandIds: RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS.slice(),
    actionCount: summaries.length,
    quickFixCount: summaries.filter((entry) => entry.kind === 'quickfix').length,
    safeQuickFixCount: safeQuickFixes.length,
    fixAllCount: fixAll.length,
    manualHandoffCount: manualHandoffs.length,
    previewCount: previews.length,
    applyPlan: {
      defaultMode: fixAll.length > 0 ? 'fix-all' : (safeQuickFixes.length > 0 ? 'workspace-edit' : (manualHandoffs.length > 0 ? 'manual-command' : 'inspect')),
      safeAutomationAvailable: fixAll.length > 0 || safeQuickFixes.length > 0,
      manualReviewRequired: manualHandoffs.length > 0,
      kernelBoundaryCommand: RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND
    },
    actions: summaries
  };
}

function createActiveDocumentPrimitiveAuthoringExperience(context = {}, options = {}) {
  const vscodeApi = options.vscode || null;
  const document = activeRmtTextDocument(vscodeApi, options);

  if (!document) {
    const emptyExperience = createPrimitiveAuthoringApplyExperience([], {
      source: 'vscode-active-document'
    });
    return {
      ...emptyExperience,
      status: 'no-active-document',
      ok: false,
      activeDocument: null,
      lsp: {
        status: 'not_requested',
        diagnosticCount: 0,
        codeActionCount: 0
      },
      rawActions: []
    };
  }

  const request = requestPrimitiveCodeActionsForDocument(document, context, options);
  const experience = createPrimitiveAuthoringApplyExperience({
    actions: request.actions
  }, {
    source: 'vscode-active-document'
  });

  return {
    ...experience,
    activeDocument: {
      uri: request.document.uri,
      filePath: request.document.filePath,
      languageId: request.document.languageId,
      version: request.document.version
    },
    lsp: {
      status: request.status,
      diagnosticCount: request.diagnostics.length,
      codeActionCount: request.actions.length,
      serverInfo: request.initialize ? request.initialize.serverInfo || null : null
    },
    rawActions: options.includeRawActions === false ? [] : request.actions
  };
}

function renderPrimitiveAuthoringApplyExperience(experience = {}) {
  const lines = [
    'XTendRMT vNext Primitive Authoring',
    `Status: ${experience.status || 'unknown'}`,
    `Actions: ${experience.actionCount || 0}`,
    `Safe Quick-Fixes: ${experience.safeQuickFixCount || 0}`,
    `Fix-All: ${experience.fixAllCount || 0}`,
    `Manual Handoffs: ${experience.manualHandoffCount || 0}`,
    `Default Apply Path: ${experience.applyPlan ? experience.applyPlan.defaultMode : 'inspect'}`
  ];

  toArray(experience.actions).forEach((action) => {
    lines.push(`- ${action.mode}: ${action.title}`);
    if (action.diagnosticCode) lines.push(`  diagnostic: ${action.diagnosticCode}`);
    if (action.command) lines.push(`  command: ${action.command}`);
    if (action.previewStatus) lines.push(`  preview: ${action.previewStatus}, changed lines: ${action.changedLineCount}`);
    toArray(action.previewAfter).forEach((line) => lines.push(`  > ${line}`));
  });

  return lines;
}

function isSafeWorkspaceEditAction(action = {}) {
  return !!(action && action.edit && getActionSafeFlag(action) && classifyPrimitiveAuthoringAction(action) !== 'manual-command');
}

function workspaceEditEntryCount(edit = {}) {
  return Object.values(edit && edit.changes ? edit.changes : {}).reduce((count, edits) => count + toArray(edits).length, 0);
}

function toVscodeRange(vscodeApi, range = {}) {
  return new vscodeApi.Range(
    new vscodeApi.Position(range.start ? range.start.line : 0, range.start ? range.start.character : 0),
    new vscodeApi.Position(range.end ? range.end.line : 0, range.end ? range.end.character : 0)
  );
}

function toVscodeWorkspaceEdit(vscodeApi, edit = {}) {
  const workspaceEdit = new vscodeApi.WorkspaceEdit();

  Object.entries(edit.changes || {}).forEach(([uri, edits]) => {
    const vscodeUri = vscodeApi.Uri.parse(uri);
    toArray(edits).forEach((entry) => {
      workspaceEdit.replace(vscodeUri, toVscodeRange(vscodeApi, entry.range), entry.newText || '');
    });
  });

  return workspaceEdit;
}

function applyPrimitiveAuthoringWorkspaceEdit(actionOrEdit = {}, options = {}) {
  const looksLikeAction = actionOrEdit && (
    Object.prototype.hasOwnProperty.call(actionOrEdit, 'edit') ||
    Object.prototype.hasOwnProperty.call(actionOrEdit, 'command') ||
    Object.prototype.hasOwnProperty.call(actionOrEdit, 'kind')
  );
  const action = looksLikeAction ? actionOrEdit : {
    title: options.title || 'RMT vNext Primitive WorkspaceEdit',
    kind: options.kind || 'quickfix',
    safe: options.safe !== false,
    edit: actionOrEdit
  };
  const edit = action.edit || null;
  const editCount = workspaceEditEntryCount(edit);

  if (!isSafeWorkspaceEditAction(action)) {
    return {
      schema: 'xtend.rmt.editor.vscode-primitive-workspace-edit-apply.v1',
      workpackage: RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE,
      status: 'blocked',
      ok: false,
      reason: action.command ? 'manual-command' : 'unsafe-or-empty-action',
      title: action.title || null,
      editCount
    };
  }

  if (!options.vscode || !options.vscode.workspace || typeof options.vscode.workspace.applyEdit !== 'function') {
    return {
      schema: 'xtend.rmt.editor.vscode-primitive-workspace-edit-apply.v1',
      workpackage: RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE,
      status: 'dry-run',
      ok: true,
      title: action.title || null,
      kind: action.kind || 'quickfix',
      editCount
    };
  }

  const workspaceEdit = toVscodeWorkspaceEdit(options.vscode, edit);
  const applied = options.vscode.workspace.applyEdit(workspaceEdit);
  const toResult = (success) => ({
    schema: 'xtend.rmt.editor.vscode-primitive-workspace-edit-apply.v1',
    workpackage: RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE,
    status: success ? 'applied' : 'rejected',
    ok: success === true,
    title: action.title || null,
    kind: action.kind || 'quickfix',
    editCount
  });

  return applied && typeof applied.then === 'function'
    ? applied.then(toResult)
    : toResult(applied);
}

function showPrimitiveAuthoringApplyExperience(output, input = {}, options = {}) {
  const experience = input && input.schema === RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA
    ? input
    : createPrimitiveAuthoringApplyExperience(input, options);

  if (output && typeof output.clear === 'function') output.clear();
  renderPrimitiveAuthoringApplyExperience(experience).forEach((line) => {
    if (output && typeof output.appendLine === 'function') output.appendLine(line);
  });
  if (output && typeof output.show === 'function') output.show(true);

  return experience;
}

function actionQuickPickItems(experience = {}, rawActions = []) {
  return toArray(experience.actions).map((summary) => ({
    label: summary.mode === 'fix-all' ? 'Apply Fix-All' : summary.title,
    description: summary.mode,
    detail: summary.previewStatus ? `preview: ${summary.previewStatus}` : summary.diagnosticCode || '',
    action: rawActions[summary.index],
    summary
  }));
}

function showPrimitiveAuthoringHandoff(output, action = {}, handoff = null) {
  const lines = [
    'XTendRMT vNext Primitive Command Handoff',
    `Command: ${action.command ? action.command.command : action.command || RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND}`,
    'Status: manual_handoff',
    'WorkspaceEdit: none'
  ];

  if (handoff && handoff.target) lines.push(`Target: ${handoff.target}`);
  if (handoff && handoff.boundary) lines.push(`Boundary: ${handoff.boundary}`);
  if (action.title) lines.push(`Action: ${action.title}`);
  if (output && typeof output.clear === 'function') output.clear();
  lines.forEach((line) => {
    if (output && typeof output.appendLine === 'function') output.appendLine(line);
  });
  if (output && typeof output.show === 'function') output.show(true);

  return {
    schema: 'xtend.rmt.editor.vscode-primitive-command-handoff-view.v1',
    workpackage: RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE,
    status: 'manual_handoff',
    ok: true,
    action,
    handoff
  };
}

function executePrimitiveCommandHandoff(action = {}, context = {}, options = {}) {
  const command = action.command && action.command.command ? action.command.command : RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND;
  const args = action.command && Array.isArray(action.command.arguments) ? action.command.arguments : [];
  const server = createLanguageServer(context, options);
  const response = server.handleMessage({
    jsonrpc: '2.0',
    id: 3,
    method: 'workspace/executeCommand',
    params: {
      command,
      arguments: args
    }
  })[0];

  return response ? response.result : null;
}

function activate(context) {
  const vscode = require('vscode');
  const output = vscode.window.createOutputChannel('XTendRMT');
  const serverInvocation = resolveLanguageServerInvocation(vscode, context);
  const serverCommand = createServerCommand(context, serverInvocation);
  let languageClientState = startLanguageClient(vscode, context, output, serverInvocation);
  if (languageClientState.client) {
    context.subscriptions.push(languageClientState.client);
  }
  const disposable = vscode.commands.registerCommand('xtendRmt.showLanguageServerCommand', () => {
    output.clear();
    output.appendLine('XTendRMT Language Server');
    output.appendLine(`${serverCommand.command} ${serverCommand.args.join(' ')}`);
    output.appendLine(`LanguageClient: ${languageClientState.status}`);
    output.show(true);
  });
  const restartLanguageServerDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[0], async () => {
    if (languageClientState.client && typeof languageClientState.client.stop === 'function') {
      await languageClientState.client.stop();
    }
    languageClientState = startLanguageClient(vscode, context, output, resolveLanguageServerInvocation(vscode, context));
    if (languageClientState.client) {
      context.subscriptions.push(languageClientState.client);
    }
    return languageClientState;
  });
  const taskProviderDisposable = vscode.tasks && typeof vscode.tasks.registerTaskProvider === 'function'
    ? vscode.tasks.registerTaskProvider('xtendRmt', createVsCodeTaskProvider(vscode, context))
    : null;
  const runActiveLintDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[1], () => {
    return runXtendRmtTask(vscode, context, 'lint-active');
  });
  const runWorkspaceLintDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[2], () => {
    return runXtendRmtTask(vscode, context, 'lint-workspace');
  });
  const runRmtBuildCheckDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[3], () => {
    return runXtendRmtTask(vscode, context, 'rmt-build-check');
  });
  const runScaffoldVerifyDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[4], () => {
    return runXtendRmtTask(vscode, context, 'scaffold-verify');
  });
  const debugLanguageServerDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[5], () => {
    return startXtendRmtDebugSession(vscode, context, 'Debug Language Server');
  });
  const debugActiveLintDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[6], () => {
    return startXtendRmtDebugSession(vscode, context, 'Debug Active RMT Lint');
  });
  const debugActiveBuildDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[7], () => {
    return startXtendRmtDebugSession(vscode, context, 'Debug Active RMT Build');
  });
  const openTasksTemplateDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[8], () => {
    return openVsCodeTemplate(vscode, context, TASKS_TEMPLATE_RELATIVE_PATH);
  });
  const openLaunchTemplateDisposable = vscode.commands.registerCommand(RMT_VSCODE_DX_COMMANDS[9], () => {
    return openVsCodeTemplate(vscode, context, LAUNCH_TEMPLATE_RELATIVE_PATH);
  });
  const applyExperienceDisposable = vscode.commands.registerCommand(RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS[0], async (input = {}) => {
    if (!input || Object.keys(input).length === 0) {
      const activeExperience = createActiveDocumentPrimitiveAuthoringExperience(context, {
        vscode,
        includeRawActions: true
      });
      showPrimitiveAuthoringApplyExperience(output, activeExperience, { source: 'vscode-active-document-command' });
      const selected = await vscode.window.showQuickPick(actionQuickPickItems(activeExperience, activeExperience.rawActions), {
        placeHolder: 'RMT vNext Primitive Action anwenden oder Handoff anzeigen'
      });
      if (!selected) return activeExperience;
      if (selected.summary.mode === 'manual-command') {
        return showPrimitiveAuthoringHandoff(output, selected.action, executePrimitiveCommandHandoff(selected.action, context, {
          rootDir: resolveWorkspaceRoot(vscode, vscode.window.activeTextEditor && vscode.window.activeTextEditor.document)
        }));
      }
      return applyPrimitiveAuthoringWorkspaceEdit(selected.action, { vscode });
    }

    return showPrimitiveAuthoringApplyExperience(output, input, { source: 'vscode-command' });
  });
  const previewDisposable = vscode.commands.registerCommand(RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS[1], (action = {}) => {
    return showPrimitiveAuthoringApplyExperience(output, { actions: [action] }, { source: 'vscode-preview-command' });
  });
  const handoffDisposable = vscode.commands.registerCommand(RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS[2], (handoffOrAction = {}) => {
    return showPrimitiveAuthoringApplyExperience(output, { actions: [handoffOrAction] }, { source: 'vscode-handoff-command' });
  });
  const safeFixAllDisposable = vscode.commands.registerCommand(RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS[3], async () => {
    const activeExperience = createActiveDocumentPrimitiveAuthoringExperience(context, {
      vscode,
      includeRawActions: true
    });
    const fixAllAction = toArray(activeExperience.rawActions).find((action) => action && action.kind === RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND);
    if (!fixAllAction) {
      showPrimitiveAuthoringApplyExperience(output, activeExperience, { source: 'vscode-fix-all-command' });
      return {
        schema: 'xtend.rmt.editor.vscode-primitive-workspace-edit-apply.v1',
        workpackage: RMT_VSCODE_PRIMITIVE_AUTHORING_WORKPACKAGE,
        status: 'blocked',
        ok: false,
        reason: 'no-safe-fix-all'
      };
    }

    return applyPrimitiveAuthoringWorkspaceEdit(fixAllAction, { vscode });
  });

  context.subscriptions.push(
    output,
    disposable,
    restartLanguageServerDisposable,
    runActiveLintDisposable,
    runWorkspaceLintDisposable,
    runRmtBuildCheckDisposable,
    runScaffoldVerifyDisposable,
    debugLanguageServerDisposable,
    debugActiveLintDisposable,
    debugActiveBuildDisposable,
    openTasksTemplateDisposable,
    openLaunchTemplateDisposable,
    applyExperienceDisposable,
    previewDisposable,
    handoffDisposable,
    safeFixAllDisposable
  );
  if (taskProviderDisposable) {
    context.subscriptions.push(taskProviderDisposable);
  }
  return {
    ...serverCommand,
    languageClient: languageClientState.status,
    dxSchema: RMT_VSCODE_DX_SCHEMA,
    taskSchema: RMT_VSCODE_TASKS_SCHEMA,
    launchSchema: RMT_VSCODE_LAUNCH_SCHEMA
  };
}

function deactivate() {}

module.exports = {
  RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS,
  RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA,
  RMT_VSCODE_DX_COMMANDS,
  RMT_VSCODE_DX_SCHEMA,
  RMT_VSCODE_DX_WORKPACKAGE,
  RMT_VSCODE_LAUNCH_SCHEMA,
  RMT_VSCODE_TASKS_SCHEMA,
  RMT_VSCODE_BRIDGE_SCHEMA,
  RMT_VSCODE_BRIDGE_WORKPACKAGE,
  activate,
  applyPrimitiveAuthoringWorkspaceEdit,
  createActiveDocumentPrimitiveAuthoringExperience,
  createRuntimeLanguageClientServerOptions,
  createVsCodeLanguageClientConfig,
  createVsCodeLaunchConfigurations,
  createVsCodeProblemMatcher,
  createVsCodeTaskDefinitions,
  createVsCodeTaskProvider,
  createPrimitiveAuthoringApplyExperience,
  createServerCommand,
  deactivate,
  executePrimitiveCommandHandoff,
  openVsCodeTemplate,
  renderPrimitiveAuthoringApplyExperience,
  requestPrimitiveCodeActionsForDocument,
  resolveDebugConfiguration,
  resolveLanguageServerInvocation,
  resolveServerModule,
  runXtendRmtTask,
  startLanguageClient,
  startXtendRmtDebugSession
};
