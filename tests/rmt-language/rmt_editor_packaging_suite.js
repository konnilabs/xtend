const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  RMT_EDITOR_PACKAGING_PACKAGE_SCRIPT,
  RMT_EDITOR_PACKAGING_SCHEMA,
  RMT_EDITOR_PACKAGING_SUITE_PATH,
  RMT_EDITOR_PACKAGING_WORKPACKAGE,
  RMT_LANGUAGE_SERVER_ENTRYPOINT,
  RMT_SNIPPET_CATALOG_SCHEMA,
  RMT_SNIPPET_MODULE_PATH,
  RMT_SNIPPET_SCHEMA,
  RMT_SNIPPET_VSCODE_PATH,
  RMT_VSCODE_BRIDGE_PATH,
  createEditorPackagingManifest,
  createRmtSnippetCatalog,
  createVsCodeSnippetDocument,
  resolveEditorSetup
} = require('../../tools/rmt-language/snippets');
const {
  RMT_VSCODE_DX_COMMANDS,
  RMT_VSCODE_DX_SCHEMA,
  RMT_VSCODE_DX_WORKPACKAGE,
  RMT_VSCODE_LAUNCH_SCHEMA,
  RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS,
  RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA,
  RMT_VSCODE_TASKS_SCHEMA,
  RMT_VSCODE_BRIDGE_SCHEMA,
  applyPrimitiveAuthoringWorkspaceEdit,
  createActiveDocumentPrimitiveAuthoringExperience,
  createPrimitiveAuthoringApplyExperience,
  createRuntimeLanguageClientServerOptions,
  createTerminalCommandLine,
  createXtendCliCandidates,
  createXtendCliWorkflowDefinitions,
  createVsCodeLanguageClientConfig,
  createVsCodeLaunchConfigurations,
  createVsCodeProblemMatcher,
  createVsCodeTaskDefinitions,
  resolveDebugConfiguration,
  resolveLanguageServerInvocation,
  resolveXtendCliInvocation,
  runXtendCliInTerminal,
  runXtendRmtTask,
  openXtendCliTerminal,
  showXtendCliCommandPalette,
  startLanguageClient,
  stopLanguageClientState,
  startXtendRmtDebugSession,
  renderPrimitiveAuthoringApplyExperience,
  createServerCommand
} = require('../../tools/rmt-editor/vscode/extension');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_EDITOR_DOC_PATH = 'docs/rmt-language-server.md';
const RMT_EDITOR_WP_PATH = 'development/WP-E14-12-Snippets-Editor-Packaging-und-optionale-VS-Code-Bridge-vorbereiten.md';
const VSCODE_PACKAGE_PATH = 'tools/rmt-editor/vscode/package.json';
const VSCODE_ICON_PATH = 'tools/rmt-editor/vscode/XTend-Logo.png';
const VSCODE_LANGUAGE_CONFIGURATION_PATH = 'tools/rmt-editor/vscode/language-configuration.json';
const VSCODE_GRAMMAR_PATH = 'tools/rmt-editor/vscode/syntaxes/rmt.tmLanguage.json';
const VSCODE_PACKAGED_SNIPPETS_PATH = 'tools/rmt-editor/vscode/snippets/rmt.code-snippets';
const VSCODE_TASKS_TEMPLATE_PATH = 'tools/rmt-editor/vscode/templates/tasks.json';
const VSCODE_LAUNCH_TEMPLATE_PATH = 'tools/rmt-editor/vscode/templates/launch.json';
const PRIMITIVE_INVALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function joinedSnippetBody(snippet) {
  return Array.isArray(snippet.body) ? snippet.body.join('\n') : '';
}

function runSnippetCatalogChecks(context, rootDir) {
  const catalog = createRmtSnippetCatalog({ rootDir });
  const vscodeSnippets = createVsCodeSnippetDocument({ rootDir });
  const staticVscodeSnippets = readJson(RMT_SNIPPET_VSCODE_PATH, rootDir);
  const minimal = catalog.snippets.find((snippet) => snippet.id === 'rmt-minimal-app');
  const route = catalog.snippets.find((snippet) => snippet.id === 'rmt-xrouter-route');
  const schedule = catalog.snippets.find((snippet) => snippet.id === 'rmt-schedule');
  const validation = catalog.snippets.find((snippet) => snippet.id === 'rmt-vnext-validation');
  const transition = catalog.snippets.find((snippet) => snippet.id === 'rmt-vnext-transition');
  const orchestrationApp = catalog.snippets.find((snippet) => snippet.id === 'rmt-vnext-maraca-orchestration-app');

  context.assert(catalog.schema === RMT_SNIPPET_CATALOG_SCHEMA, 'Snippet catalog emits stable schema');
  context.assert(catalog.workpackage === RMT_EDITOR_PACKAGING_WORKPACKAGE, 'Snippet catalog belongs to WP-E14-12');
  context.assert(catalog.primaryExtension === '.rmt', 'Snippet catalog keeps .rmt as primary extension');
  context.assert(catalog.networkRequired === false, 'Snippet catalog has no network requirement');
  context.assert(catalog.snippets.length >= 6, 'Snippet catalog exposes baseline snippets');
  context.assert(catalog.snippets.every((snippet) => snippet.schema === RMT_SNIPPET_SCHEMA), 'Every snippet has stable snippet schema');
  context.assert(minimal && joinedSnippetBody(minimal).includes('"kind": "rmt_document"'), 'Minimal app snippet creates RMT document kind');
  context.assert(minimal && joinedSnippetBody(minimal).includes('"documentTitle"'), 'Minimal app snippet includes route documentTitle');
  context.assert(route && joinedSnippetBody(route).includes('"router": "xtend.xrouter"'), 'Route snippet targets XRouter adapter');
  context.assert(schedule && joinedSnippetBody(schedule).includes('visible,user-blocking,transition,idle,background,diagnostics'), 'Schedule snippet offers Lane choices');
  context.assert(validation && joinedSnippetBody(validation).includes('target action'), 'Validation snippet declares target action');
  context.assert(validation && joinedSnippetBody(validation).includes('required email message'), 'Validation snippet declares field rules');
  context.assert(transition && joinedSnippetBody(transition).includes('durationMs'), 'Transition snippet declares durationMs');
  context.assert(transition && joinedSnippetBody(transition).includes('effect ${7|fade,crossfade'), 'Transition snippet offers effect choices');
  context.assert(orchestrationApp && joinedSnippetBody(orchestrationApp).includes('validation ${6:app.contact}'), 'Maraca orchestration snippet includes validation block');
  context.assert(orchestrationApp && joinedSnippetBody(orchestrationApp).includes('transition ${9:app.contactToIssue}'), 'Maraca orchestration snippet includes transition block');
  context.assert(catalog.snippets.every((snippet) => !joinedSnippetBody(snippet).includes('.rmt.json')), 'Snippets do not generate .rmt.json documents');
  context.assert(vscodeSnippets['RMT Minimal App'].prefix === 'rmt-app', 'VS Code snippet document exposes minimal app prefix');
  context.assert(vscodeSnippets['RMT vNext Validation'].prefix === 'rmt-vnext-validation', 'VS Code snippet document exposes validation prefix');
  context.assert(vscodeSnippets['RMT vNext Surface Transition'].prefix === 'rmt-vnext-transition', 'VS Code snippet document exposes transition prefix');
  context.assert(vscodeSnippets['RMT vNext Maraca Orchestration App'].prefix === 'rmt-vnext-maraca-orchestration-app', 'VS Code snippet document exposes Maraca orchestration prefix');
  context.assert(staticVscodeSnippets['RMT Minimal App'].prefix === vscodeSnippets['RMT Minimal App'].prefix, 'Static VS Code snippets match generated prefix');
  context.assert(staticVscodeSnippets['RMT vNext Validation'].prefix === vscodeSnippets['RMT vNext Validation'].prefix, 'Static VS Code snippets include generated validation prefix');
  context.assert(staticVscodeSnippets['RMT vNext Surface Transition'].prefix === vscodeSnippets['RMT vNext Surface Transition'].prefix, 'Static VS Code snippets include generated transition prefix');
}

function runEditorPackagingChecks(context, rootDir) {
  const manifest = createEditorPackagingManifest({ rootDir });
  const vscodeSetup = resolveEditorSetup('vscode', { rootDir });
  const neovimSetup = resolveEditorSetup('neovim', { rootDir });
  const helixSetup = resolveEditorSetup('helix', { rootDir });
  const jetbrainsSetup = resolveEditorSetup('jetbrains', { rootDir });

  context.assert(manifest.schema === RMT_EDITOR_PACKAGING_SCHEMA, 'Editor packaging manifest emits stable schema');
  context.assert(manifest.workpackage === RMT_EDITOR_PACKAGING_WORKPACKAGE, 'Editor packaging belongs to WP-E14-12');
  context.assert(manifest.languageId === 'rmt', 'Editor packaging uses rmt language id');
  context.assert(manifest.primaryExtension === '.rmt', 'Editor packaging primary extension is .rmt');
  context.assert(manifest.lsp.sourceOfTruth === RMT_LANGUAGE_SERVER_ENTRYPOINT, 'Editor packaging points to LSP source of truth');
  context.assert(manifest.lsp.command === 'node', 'Editor packaging starts LSP through node');
  context.assert(manifest.lsp.args[0].endsWith(RMT_LANGUAGE_SERVER_ENTRYPOINT), 'Editor packaging LSP arg targets server entrypoint');
  context.assert(manifest.snippets.vscode === RMT_SNIPPET_VSCODE_PATH, 'Editor packaging references VS Code snippets');
  context.assert(vscodeSetup.bridge === RMT_VSCODE_BRIDGE_PATH, 'VS Code setup points to bridge stub');
  context.assert(neovimSetup.filetypes.includes('rmt'), 'Neovim setup exposes rmt filetype');
  context.assert(helixSetup.languageId === 'rmt', 'Helix setup exposes rmt language id');
  context.assert(jetbrainsSetup.extension === '.rmt', 'JetBrains setup exposes .rmt file type');
  context.assert(manifest.networkRequired === false, 'Editor packaging has no network requirement');
}

function runVsCodeBridgeChecks(context, rootDir) {
  const vscodePackage = readJson(VSCODE_PACKAGE_PATH, rootDir);
  const languageConfiguration = readJson(VSCODE_LANGUAGE_CONFIGURATION_PATH, rootDir);
  const grammar = readJson(VSCODE_GRAMMAR_PATH, rootDir);
  const packagedSnippets = readJson(VSCODE_PACKAGED_SNIPPETS_PATH, rootDir);
  const tasksTemplate = readJson(VSCODE_TASKS_TEMPLATE_PATH, rootDir);
  const launchTemplate = readJson(VSCODE_LAUNCH_TEMPLATE_PATH, rootDir);
  const sourceSnippets = readJson(RMT_SNIPPET_VSCODE_PATH, rootDir);
  const extensionContext = { extensionPath: resolveRepoPath('tools/rmt-editor/vscode', rootDir) };
  const command = createServerCommand(extensionContext);
  const languageClientConfig = createVsCodeLanguageClientConfig(extensionContext);
  const configuredServerInvocation = resolveLanguageServerInvocation(null, extensionContext, {
    args: ['${workspaceFolder}/tools/rmt-language-server/server.js']
  });
  const fakeLanguageClient = startLanguageClient(null, extensionContext, null, {
    languageClientModule: {
      TransportKind: {
        stdio: 0
      },
      LanguageClient: class FakeLanguageClient {
        constructor(id, name, serverOptions, clientOptions) {
          this.id = id;
          this.name = name;
          this.serverOptions = serverOptions;
          this.clientOptions = clientOptions;
        }

        start() {
          return 'started';
        }

        stop() {
          this.stopped = true;
          return 'stopped';
        }
      }
    }
  });
  const stoppedLanguageClient = stopLanguageClientState(fakeLanguageClient);
  const runtimeServerOptions = createRuntimeLanguageClientServerOptions({
    TransportKind: {
      stdio: 0
    }
  }, languageClientConfig.serverOptions);
  const problemMatcher = createVsCodeProblemMatcher();
  const taskDefinitions = createVsCodeTaskDefinitions();
  const launchConfigurations = createVsCodeLaunchConfigurations();
  const workflowDefinitions = createXtendCliWorkflowDefinitions();
  const cliCandidates = createXtendCliCandidates(null, extensionContext, {
    workspaceFolderPath: rootDir,
    file: resolveRepoPath('xtendrmt/rmt-vnext-reference-demo.rmt', rootDir)
  });
  const resolvedCli = resolveXtendCliInvocation(null, extensionContext, {
    workspaceFolderPath: rootDir,
    file: resolveRepoPath('xtendrmt/rmt-vnext-reference-demo.rmt', rootDir)
  });
  const resolvedBinCli = resolveXtendCliInvocation(null, extensionContext, {
    workspaceFolderPath: '/workspace/app',
    file: '/workspace/app/app.rmt',
    fileExists: (filePath) => filePath === '/workspace/app/node_modules/.bin/xt'
  });
  const missingCli = resolveXtendCliInvocation(null, extensionContext, {
    workspaceFolderPath: '/workspace/missing',
    file: '/workspace/missing/app.rmt',
    fileExists: () => false
  });
  const terminalCommandLine = createTerminalCommandLine(resolvedCli, ['rmt', 'lint', '${file}', '--json'], {
    workspaceFolder: rootDir,
    file: resolveRepoPath('xtendrmt/rmt-vnext-reference-demo.rmt', rootDir)
  });
  const openTerminalDryRun = openXtendCliTerminal(null, extensionContext, {
    workspaceFolderPath: rootDir
  });
  const terminalBuildDryRun = runXtendCliInTerminal(null, extensionContext, 'rmt-build-check', {
    workspaceFolderPath: rootDir,
    file: resolveRepoPath('xtendrmt/rmt-vnext-reference-demo.rmt', rootDir)
  });
  const paletteDryRun = showXtendCliCommandPalette(null, extensionContext, {
    workspaceFolderPath: rootDir
  });
  const dryRunTask = runXtendRmtTask(null, extensionContext, 'lint-active');
  const dryRunDebug = startXtendRmtDebugSession(null, extensionContext, 'Debug Active RMT Build', {
    workspaceFolderPath: rootDir,
    file: resolveRepoPath('xtendrmt/rmt-vnext-reference-demo.rmt', rootDir)
  });
  const debugConfiguration = resolveDebugConfiguration('Debug Language Server');
  const primitiveInvalidPath = resolveRepoPath(PRIMITIVE_INVALID_VNEXT_FIXTURE, rootDir);
  const activePrimitiveExperience = createActiveDocumentPrimitiveAuthoringExperience({
    extensionPath: resolveRepoPath('tools/rmt-editor/vscode', rootDir)
  }, {
    rootDir,
    document: {
      uri: `file://${primitiveInvalidPath}`,
      fileName: primitiveInvalidPath,
      languageId: 'rmt',
      version: 7,
      getText: () => readText(PRIMITIVE_INVALID_VNEXT_FIXTURE, rootDir)
    }
  });
  const primitiveExperience = createPrimitiveAuthoringApplyExperience({
    actions: [
      {
        title: 'State initial-Wert ergaenzen',
        kind: 'quickfix',
        diagnosticCode: 'rmt.vnext.primitive.initial-missing',
        safe: true,
        edit: { changes: { 'file:///demo.rmt': [] } },
        preview: {
          schema: 'xtend.rmt.vnext.primitive-code-action-preview.v1',
          status: 'ready',
          changedLineCount: 1,
          after: ['  initial {}']
        }
      },
      {
        title: 'Alle sicheren vNext-Primitive Quick-Fixes anwenden (3)',
        kind: 'source.fixAll.rmt.vnext.primitives',
        safe: true,
        edit: { changes: { 'file:///demo.rmt': [] } },
        preview: {
          schema: 'xtend.rmt.vnext.primitive-code-action-preview.v1',
          status: 'ready',
          changedLineCount: 3,
          after: ['  initial {}', '  key instance.id']
        }
      },
      {
        title: 'Kernel/Fabric Import in Host-Adapter auslagern',
        kind: 'quickfix',
        safe: false,
        command: {
          command: 'xtend.rmt.vnext.extractKernelImport',
          title: 'Kernel/Fabric Import in Host-Adapter auslagern'
        },
        data: {
          preview: {
            schema: 'xtend.rmt.vnext.primitive-code-action-preview.v1',
            status: 'manual-command',
            changedLineCount: 0,
            after: []
          }
        }
      }
    ]
  });
  const primitiveExperienceLines = renderPrimitiveAuthoringApplyExperience(primitiveExperience);
  const activeFixAll = activePrimitiveExperience.rawActions.find((action) => action.kind === 'source.fixAll.rmt.vnext.primitives');
  const dryRunApply = applyPrimitiveAuthoringWorkspaceEdit(activeFixAll);
  const blockedApply = applyPrimitiveAuthoringWorkspaceEdit({
    title: 'Kernel/Fabric Import in Host-Adapter auslagern',
    kind: 'quickfix',
    safe: false,
    edit: null,
    command: {
      command: 'xtend.rmt.vnext.extractKernelImport'
    }
  });

  context.assert(command.schema === RMT_VSCODE_BRIDGE_SCHEMA, 'VS Code bridge emits stable schema');
  context.assert(command.workpackage === RMT_EDITOR_PACKAGING_WORKPACKAGE, 'VS Code bridge belongs to WP-E14-12');
  context.assert(command.args[0].endsWith(RMT_LANGUAGE_SERVER_ENTRYPOINT), 'VS Code bridge resolves LSP server path');
  context.assert(languageClientConfig.schema === RMT_VSCODE_DX_SCHEMA, 'VS Code DX emits stable LanguageClient schema');
  context.assert(languageClientConfig.workpackage === RMT_VSCODE_DX_WORKPACKAGE, 'VS Code DX belongs to DX workpackage');
  context.assert(languageClientConfig.serverOptions.args[0].endsWith(RMT_LANGUAGE_SERVER_ENTRYPOINT), 'VS Code LanguageClient config targets server entrypoint');
  context.assert(languageClientConfig.clientOptions.documentSelector.some((entry) => entry.language === 'rmt'), 'VS Code LanguageClient config selects rmt documents');
  context.assert(configuredServerInvocation.args[0].endsWith(RMT_LANGUAGE_SERVER_ENTRYPOINT), 'VS Code configured LanguageClient invocation can target workspace server entrypoint');
  context.assert(fakeLanguageClient.status === 'started' && fakeLanguageClient.client.id === 'xtendRmtLanguageServer', 'VS Code extension can start a LanguageClient wrapper');
  context.assert(stoppedLanguageClient.status === 'stopped' && fakeLanguageClient.client.stopped === true, 'VS Code extension stops the active LanguageClient during restart/deactivate');
  context.assert(runtimeServerOptions.transport === 0, 'VS Code LanguageClient runtime config converts stdio string to TransportKind enum');
  context.assert(fakeLanguageClient.client.serverOptions.transport === 0, 'VS Code LanguageClient receives TransportKind.stdio instead of unsupported string transport');
  context.assert(problemMatcher.schema === RMT_VSCODE_TASKS_SCHEMA, 'VS Code problem matcher emits stable tasks schema');
  context.assert(problemMatcher.name === 'xtend-rmt-lint', 'VS Code problem matcher has stable public name');
  context.assert(problemMatcher.pattern.regexp.includes('(error|warning|info)'), 'VS Code problem matcher consumes linter problem format');
  context.assert(taskDefinitions.tasks.length >= 8, 'VS Code task definitions expose lint, build, scaffold and gate tasks');
  context.assert(taskDefinitions.tasks.some((task) => task.args.includes('problem-matcher')), 'VS Code lint task uses problem matcher linter format');
  context.assert(taskDefinitions.tasks.some((task) => task.id === 'rmt-build-write'), 'VS Code tasks include explicit write build task');
  context.assert(workflowDefinitions.some((workflow) => workflow.id === 'open-terminal'), 'VS Code CLI workflows expose open terminal action');
  context.assert(workflowDefinitions.some((workflow) => workflow.id === 'agent-repair-report'), 'VS Code CLI workflows expose agent repair report action');
  context.assert(cliCandidates.candidates.some((candidate) => candidate.id === 'workspace-scaffold' && candidate.exists), 'VS Code CLI resolver detects workspace scaffold.js');
  context.assert(resolvedCli.ok && resolvedCli.selected.id === 'workspace-scaffold', 'VS Code CLI resolver prefers workspace scaffold.js in the upstream repo');
  context.assert(resolvedBinCli.ok && resolvedBinCli.selected.id === 'workspace-bin', 'VS Code CLI resolver falls back to node_modules/.bin/xt in normal projects');
  context.assert(missingCli.ok === false && missingCli.status === 'missing', 'VS Code CLI resolver reports missing CLI with diagnostics');
  context.assert(terminalCommandLine.includes('rmt lint') && terminalCommandLine.includes('rmt-vnext-reference-demo.rmt'), 'VS Code terminal command line expands active RMT file');
  context.assert(openTerminalDryRun.status === 'dry-run' && openTerminalDryRun.cli.ok, 'VS Code CLI terminal supports dry-run without VS Code host');
  context.assert(terminalBuildDryRun.status === 'dry-run' && terminalBuildDryRun.commandLine.includes('rmt-build'), 'VS Code terminal runner supports RMT build check dry-run');
  context.assert(paletteDryRun && typeof paletteDryRun.then === 'function', 'VS Code CLI command palette is async for host QuickPick support');
  context.assert(launchConfigurations.schema === RMT_VSCODE_LAUNCH_SCHEMA, 'VS Code launch config emits stable schema');
  context.assert(launchConfigurations.configurations.length >= 4, 'VS Code launch config exposes debug console entries');
  context.assert(debugConfiguration && debugConfiguration.program.includes('rmt-language-server'), 'VS Code debug resolver finds language server config');
  context.assert(dryRunTask.status === 'dry-run' && dryRunTask.taskId === 'lint-active', 'VS Code task runner supports dry-run without VS Code host');
  context.assert(dryRunDebug.status === 'dry-run' && dryRunDebug.configuration.console === 'internalConsole', 'VS Code debug runner supports Debug Console dry-run');
  context.assert(dryRunDebug.configuration.program.endsWith('xtend-builder/scaffold.js'), 'VS Code debug runner resolves XTend CLI program before launch');
  context.assert(primitiveExperience.schema === RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA, 'VS Code bridge emits primitive authoring experience schema');
  context.assert(primitiveExperience.workpackage === 'RMT-VNEXT-PRIM-07', 'VS Code primitive authoring experience belongs to PRIM-07');
  context.assert(primitiveExperience.fixAllCount === 1, 'VS Code primitive authoring experience exposes fix-all path');
  context.assert(primitiveExperience.safeQuickFixCount === 1, 'VS Code primitive authoring experience exposes safe quick fix path');
  context.assert(primitiveExperience.manualHandoffCount === 1, 'VS Code primitive authoring experience exposes manual command handoff path');
  context.assert(primitiveExperience.applyPlan.defaultMode === 'fix-all', 'VS Code primitive authoring experience prefers safe fix-all when available');
  context.assert(primitiveExperienceLines.some((line) => line.includes('manual-command')), 'VS Code primitive authoring renderer marks manual command handoff');
  context.assert(activePrimitiveExperience.status === 'ready', 'VS Code bridge builds active-document primitive authoring experience');
  context.assert(activePrimitiveExperience.activeDocument && activePrimitiveExperience.activeDocument.languageId === 'rmt', 'VS Code bridge reads active .rmt document metadata');
  context.assert(activePrimitiveExperience.lsp && activePrimitiveExperience.lsp.codeActionCount > 0, 'VS Code bridge requests real LSP code actions for active document');
  context.assert(activePrimitiveExperience.fixAllCount >= 1, 'VS Code bridge exposes active-document safe fix-all');
  context.assert(dryRunApply.status === 'dry-run' && dryRunApply.ok === true && dryRunApply.editCount > 0, 'VS Code bridge can dry-run safe WorkspaceEdit application');
  context.assert(blockedApply.status === 'blocked' && blockedApply.ok === false, 'VS Code bridge blocks manual kernel-boundary WorkspaceEdit application');
  context.assert(vscodePackage.contributes.languages[0].id === 'rmt', 'VS Code package contributes rmt language id');
  context.assert(vscodePackage.contributes.languages[0].extensions.includes('.rmt'), 'VS Code package contributes .rmt extension');
  context.assert(!vscodePackage.contributes.languages[0].extensions.includes('.rmt.json'), 'VS Code package does not normalize .rmt.json authoring');
  context.assert(vscodePackage.contributes.snippets[0].path === './snippets/rmt.code-snippets', 'VS Code package references packaged snippets');
  RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS.forEach((commandId) => {
    context.assert(vscodePackage.activationEvents.includes(`onCommand:${commandId}`), `VS Code package activates primitive authoring command ${commandId}`);
    context.assert(vscodePackage.contributes.commands.some((entry) => entry.command === commandId), `VS Code package contributes primitive authoring command ${commandId}`);
  });
  RMT_VSCODE_DX_COMMANDS.forEach((commandId) => {
    context.assert(vscodePackage.activationEvents.includes(`onCommand:${commandId}`), `VS Code package activates DX command ${commandId}`);
    context.assert(vscodePackage.contributes.commands.some((entry) => entry.command === commandId), `VS Code package contributes DX command ${commandId}`);
  });
  context.assert(vscodePackage.dependencies && vscodePackage.dependencies['vscode-languageclient'], 'VS Code package depends on vscode-languageclient');
  context.assert(vscodePackage.files.includes('templates/**'), 'VS Code package includes support-file templates');
  context.assert(vscodePackage.contributes.taskDefinitions.some((entry) => entry.type === 'xtendRmt'), 'VS Code package contributes xtendRmt task definition');
  context.assert(vscodePackage.contributes.problemMatchers.some((entry) => entry.name === 'xtend-rmt-lint'), 'VS Code package contributes RMT problem matcher');
  context.assert(vscodePackage.contributes.configuration.properties['xtendRmt.xtendCli.command'].default === 'node', 'VS Code package contributes XTend CLI command setting');
  context.assert(vscodePackage.contributes.configuration.properties['xtendRmt.xtendCli.path'].default === '', 'VS Code package contributes XTend CLI path resolver setting');
  context.assert(vscodePackage.contributes.configuration.properties['xtendRmt.tasks.defaultFailOn'].default === 'warning', 'VS Code package contributes task fail threshold setting');
  context.assert(vscodePackage.icon === 'XTend-Logo.png', 'VS Code package declares XTend logo icon');
  context.assert(vscodePackage.files.includes('XTend-Logo.png'), 'VS Code package includes XTend logo icon in packaged files');
  context.assert(vscodePackage.files.includes('snippets/**'), 'VS Code package includes snippets in packaged files');
  context.assert(packagedSnippets['RMT Minimal App'].prefix === 'rmt-app', 'VS Code packaged snippets mirror RMT app snippet');
  context.assert(packagedSnippets['RMT vNext Validation'].prefix === 'rmt-vnext-validation', 'VS Code packaged snippets include validation snippet');
  context.assert(packagedSnippets['RMT vNext Surface Transition'].prefix === 'rmt-vnext-transition', 'VS Code packaged snippets include transition snippet');
  context.assert(packagedSnippets['RMT vNext Maraca Orchestration App'].prefix === 'rmt-vnext-maraca-orchestration-app', 'VS Code packaged snippets include Maraca orchestration snippet');
  context.assert(JSON.stringify(packagedSnippets) === JSON.stringify(sourceSnippets), 'VS Code packaged snippets stay in sync with source snippets');
  context.assert(tasksTemplate.tasks.some((task) => task.label === 'XTendRMT: RMT build check'), 'VS Code tasks template exposes RMT build check');
  context.assert(tasksTemplate.tasks.some((task) => task.problemMatcher === '$xtend-rmt-lint'), 'VS Code tasks template wires RMT problem matcher');
  context.assert(launchTemplate.configurations.some((entry) => entry.name === 'XTendRMT: Debug Active RMT Build'), 'VS Code launch template exposes active RMT build debug config');
  context.assert(languageConfiguration.comments.lineComment === '//', 'VS Code language configuration defines RMT line comments');
  context.assert(languageConfiguration.brackets.length >= 3, 'VS Code language configuration defines JSON brackets');
  context.assert(grammar.scopeName === 'source.rmt', 'VS Code grammar uses source.rmt scope');
  context.assert(grammar.repository && grammar.repository.keywords.patterns[0].match.includes('template'), 'VS Code grammar highlights RMT vNext keywords');
  context.assert(grammar.repository && grammar.repository.keywords.patterns[0].match.includes('validation'), 'VS Code grammar highlights validation keyword');
  context.assert(grammar.repository && grammar.repository.keywords.patterns[0].match.includes('transition'), 'VS Code grammar highlights transition keyword');
  context.assert(grammar.repository && grammar.repository.keywords.patterns[1].match.includes('durationMs'), 'VS Code grammar highlights transition duration token');
  context.assert(grammar.repository && grammar.repository.keywords.patterns[1].match.includes('required'), 'VS Code grammar highlights validation rule tokens');
  context.assert(grammar.repository && grammar.repository.componentTags.patterns[0].match.includes('x-'), 'VS Code grammar highlights XTend component tags');
  context.assert(grammar.repository && grammar.repository.lanes.patterns[0].match.includes('user-blocking'), 'VS Code grammar highlights RMT lanes');
  context.assert(grammar.patterns.some((pattern) => pattern.include === 'source.json'), 'VS Code grammar delegates to JSON grammar');
}

function runDocumentationAndMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtEditorPackaging;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const docs = readText(RMT_EDITOR_DOC_PATH, rootDir);
  const workpackage = readText(RMT_EDITOR_WP_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_EDITOR_PACKAGING_SCHEMA, 'package metadata declares editor packaging schema');
  context.assert(metadata && metadata.snippetCatalogSchema === RMT_SNIPPET_CATALOG_SCHEMA, 'package metadata declares snippet catalog schema');
  context.assert(metadata && metadata.workpackage === RMT_EDITOR_PACKAGING_WORKPACKAGE, 'package metadata points to WP-E14-12');
  context.assert(metadata && metadata.module === RMT_SNIPPET_MODULE_PATH, 'package metadata points to snippets module');
  context.assert(metadata && metadata.vscodeBridge === RMT_VSCODE_BRIDGE_PATH, 'package metadata points to VS Code bridge');
  context.assert(metadata && metadata.vscodeDxSchema === RMT_VSCODE_DX_SCHEMA, 'package metadata declares VS Code DX schema');
  context.assert(metadata && metadata.vscodeTasksSchema === RMT_VSCODE_TASKS_SCHEMA, 'package metadata declares VS Code tasks schema');
  context.assert(metadata && metadata.vscodeLaunchSchema === RMT_VSCODE_LAUNCH_SCHEMA, 'package metadata declares VS Code launch schema');
  context.assert(metadata && metadata.vscodeTasksTemplate === VSCODE_TASKS_TEMPLATE_PATH, 'package metadata points to VS Code tasks template');
  context.assert(metadata && metadata.vscodeLaunchTemplate === VSCODE_LAUNCH_TEMPLATE_PATH, 'package metadata points to VS Code launch template');
  context.assert(metadata && metadata.vscodeProblemMatcher === '$xtend-rmt-lint', 'package metadata declares VS Code problem matcher');
  context.assert(metadata && metadata.suite === RMT_EDITOR_PACKAGING_SUITE_PATH, 'package metadata points to editor packaging suite');
  context.assert(metadata && metadata.primitiveAuthoringExperienceSchema === RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA, 'package metadata declares primitive authoring experience schema');
  context.assert(metadata && RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS.every((commandId) => metadata.primitiveAuthoringCommands.includes(commandId)), 'package metadata declares primitive authoring VS Code commands');
  context.assert(metadata && RMT_VSCODE_DX_COMMANDS.every((commandId) => metadata.dxCommands.includes(commandId)), 'package metadata declares VS Code DX commands');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-editor-packaging --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_EDITOR_PACKAGING_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert((typeof packageManifest.exports['./rmt-language/snippets'] === 'string' ? packageManifest.exports['./rmt-language/snippets'] : packageManifest.exports['./rmt-language/snippets'] && packageManifest.exports['./rmt-language/snippets'].default) === './tools/rmt-language/snippets/index.js', 'package exports RMT snippets');
  context.assert((typeof packageManifest.exports['./rmt-editor/vscode'] === 'string' ? packageManifest.exports['./rmt-editor/vscode'] : packageManifest.exports['./rmt-editor/vscode'] && packageManifest.exports['./rmt-editor/vscode'].default) === './tools/rmt-editor/vscode/extension.js', 'package exports VS Code bridge stub');
  context.assert(packageManifest.scripts['test:rmt-editor-packaging'] === 'node scripts/run_xtend_tests.js rmt-editor-packaging', 'package exposes rmt-editor-packaging script');
  context.assert(runner.includes("id: 'rmt-editor-packaging'"), 'test runner exposes rmt-editor-packaging suite');
  context.assert(epic.includes('| `WP-E14-12` | P2 | completed | WS7 |'), 'Epic marks WP-E14-12 completed');
  context.assert(epic.includes('WP-E14-13` ist `ready`'), 'Epic hands off WP-E14-13 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-12`'), 'Architecture documents editor packaging status');
  context.assert(architecture.includes('xtend.rmt.editor-packaging.v1'), 'Architecture documents editor packaging schema');
  context.assert(docs.includes('VS Code') && docs.includes('JetBrains') && docs.includes('Neovim') && docs.includes('Helix'), 'Docs cover VS Code, JetBrains, Neovim and Helix');
  context.assert(docs.includes('node tools/rmt-language-server/server.js'), 'Docs expose LSP start command');
  context.assert(docs.includes('XTendRMT: Show vNext Primitive Apply Experience'), 'Docs expose vNext primitive apply experience command');
  context.assert(docs.includes('XTendRMT: Run Active RMT Lint'), 'Docs expose VS Code RMT lint task command');
  context.assert(docs.includes('xt rmt lint app.rmt --format problem-matcher --fail-on warning'), 'Docs expose VS Code problem matcher linter format');
  context.assert(docs.includes('tools/rmt-editor/vscode/templates/launch.json'), 'Docs expose VS Code launch template');
  context.assert(workpackage.includes('LSP bleibt Source of Truth'), 'Workpackage documents LSP source-of-truth rule');
}

function runRmtEditorPackagingSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-editor-packaging',
    label: 'Epic 14 RMT Editor Packaging'
  });
  const snippetsSyntax = syntaxCheckFile(RMT_SNIPPET_MODULE_PATH, { rootDir, extension: '.js' });
  const vscodeBridgeSyntax = syntaxCheckFile(RMT_VSCODE_BRIDGE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_SNIPPET_MODULE_PATH, rootDir, 'RMT snippet module exists');
  assertFileExists(context, RMT_SNIPPET_VSCODE_PATH, rootDir, 'VS Code snippet export exists');
  assertFileExists(context, RMT_VSCODE_BRIDGE_PATH, rootDir, 'VS Code bridge stub exists');
  assertFileExists(context, VSCODE_PACKAGE_PATH, rootDir, 'VS Code package stub exists');
  assertFileExists(context, VSCODE_ICON_PATH, rootDir, 'VS Code package icon exists');
  assertFileExists(context, VSCODE_TASKS_TEMPLATE_PATH, rootDir, 'VS Code tasks template exists');
  assertFileExists(context, VSCODE_LAUNCH_TEMPLATE_PATH, rootDir, 'VS Code launch template exists');
  assertFileExists(context, RMT_EDITOR_DOC_PATH, rootDir, 'RMT Language Server docs exist');
  assertFileExists(context, RMT_EDITOR_WP_PATH, rootDir, 'WP-E14-12 workpackage document exists');
  context.assert(snippetsSyntax.ok, `RMT snippet module syntax passes${snippetsSyntax.ok ? '' : ` (${snippetsSyntax.message})`}`);
  context.assert(vscodeBridgeSyntax.ok, `VS Code bridge syntax passes${vscodeBridgeSyntax.ok ? '' : ` (${vscodeBridgeSyntax.message})`}`);

  runSnippetCatalogChecks(context, rootDir);
  runEditorPackagingChecks(context, rootDir);
  runVsCodeBridgeChecks(context, rootDir);
  runDocumentationAndMetadataChecks(context, rootDir);

  return context.result({
    schema: RMT_EDITOR_PACKAGING_SCHEMA,
    workpackage: RMT_EDITOR_PACKAGING_WORKPACKAGE,
    module: RMT_SNIPPET_MODULE_PATH,
    suite: RMT_EDITOR_PACKAGING_SUITE_PATH
  });
}

function printRmtEditorPackagingReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Editor Packaging erfolgreich.',
    failureTitle: 'Epic 14 RMT Editor Packaging fehlgeschlagen:'
  });
}

module.exports = {
  printRmtEditorPackagingReport,
  runRmtEditorPackagingSuite
};
