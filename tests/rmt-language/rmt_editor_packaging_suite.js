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
  RMT_VSCODE_BRIDGE_SCHEMA,
  createServerCommand
} = require('../../tools/rmt-editor/vscode/extension');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_EDITOR_DOC_PATH = 'docs/rmt-language-server.md';
const RMT_EDITOR_WP_PATH = 'development/WP-E14-12-Snippets-Editor-Packaging-und-optionale-VS-Code-Bridge-vorbereiten.md';
const VSCODE_PACKAGE_PATH = 'tools/rmt-editor/vscode/package.json';
const VSCODE_LANGUAGE_CONFIGURATION_PATH = 'tools/rmt-editor/vscode/language-configuration.json';
const VSCODE_GRAMMAR_PATH = 'tools/rmt-editor/vscode/syntaxes/rmt.tmLanguage.json';
const VSCODE_PACKAGED_SNIPPETS_PATH = 'tools/rmt-editor/vscode/snippets/rmt.code-snippets';

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
  context.assert(catalog.snippets.every((snippet) => !joinedSnippetBody(snippet).includes('.rmt.json')), 'Snippets do not generate .rmt.json documents');
  context.assert(vscodeSnippets['RMT Minimal App'].prefix === 'rmt-app', 'VS Code snippet document exposes minimal app prefix');
  context.assert(staticVscodeSnippets['RMT Minimal App'].prefix === vscodeSnippets['RMT Minimal App'].prefix, 'Static VS Code snippets match generated prefix');
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
  const sourceSnippets = readJson(RMT_SNIPPET_VSCODE_PATH, rootDir);
  const command = createServerCommand({ extensionPath: resolveRepoPath('tools/rmt-editor/vscode', rootDir) });

  context.assert(command.schema === RMT_VSCODE_BRIDGE_SCHEMA, 'VS Code bridge emits stable schema');
  context.assert(command.workpackage === RMT_EDITOR_PACKAGING_WORKPACKAGE, 'VS Code bridge belongs to WP-E14-12');
  context.assert(command.args[0].endsWith(RMT_LANGUAGE_SERVER_ENTRYPOINT), 'VS Code bridge resolves LSP server path');
  context.assert(vscodePackage.contributes.languages[0].id === 'rmt', 'VS Code package contributes rmt language id');
  context.assert(vscodePackage.contributes.languages[0].extensions.includes('.rmt'), 'VS Code package contributes .rmt extension');
  context.assert(!vscodePackage.contributes.languages[0].extensions.includes('.rmt.json'), 'VS Code package does not normalize .rmt.json authoring');
  context.assert(vscodePackage.contributes.snippets[0].path === './snippets/rmt.code-snippets', 'VS Code package references packaged snippets');
  context.assert(vscodePackage.files.includes('snippets/**'), 'VS Code package includes snippets in packaged files');
  context.assert(packagedSnippets['RMT Minimal App'].prefix === 'rmt-app', 'VS Code packaged snippets mirror RMT app snippet');
  context.assert(JSON.stringify(packagedSnippets) === JSON.stringify(sourceSnippets), 'VS Code packaged snippets stay in sync with source snippets');
  context.assert(languageConfiguration.brackets.length >= 3, 'VS Code language configuration defines JSON brackets');
  context.assert(grammar.scopeName === 'source.rmt', 'VS Code grammar uses source.rmt scope');
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
  context.assert(metadata && metadata.suite === RMT_EDITOR_PACKAGING_SUITE_PATH, 'package metadata points to editor packaging suite');
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
