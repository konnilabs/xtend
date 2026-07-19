const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
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
  createRmtSourceModel
} = require('../../tools/rmt-language/source-model');
const {
  RMT_CODE_ACTION_MODULE_PATH,
  RMT_CODE_ACTION_PACKAGE_SCRIPT,
  RMT_CODE_ACTION_PROVIDER_SCHEMA,
  RMT_CODE_ACTION_REPORT_SCHEMA,
  RMT_CODE_ACTION_SCHEMA,
  RMT_CODE_ACTION_SUITE_PATH,
  RMT_CODE_ACTION_WORKPACKAGE,
  RMT_WORKSPACE_EDIT_SCHEMA,
  createRmtCodeActionProvider,
  getRmtCodeActions
} = require('../../tools/rmt-language/code-actions');
const {
  createRmtLanguageServer
} = require('../../tools/rmt-language-server/server');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_CODE_ACTION_WP_PATH = 'development/WP-E14-10-Code-Actions-und-Quick-Fixes-fuer-sichere-Reparaturen-bauen.md';
const VALID_FIXTURE_PATH = 'tests/fixtures/rmt-component-lab-pilot.core.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createProblemFixture() {
  return JSON.stringify({
    kind: 'rmt_document',
    version: '1.0',
    adapters: [
      { id: 'xtend.component', kind: 'component_adapter' },
      { id: 'xtend.xrouter', kind: 'router_adapter' }
    ],
    components: [
      {
        id: 'page.home',
        adapter: 'xtend.component',
        tag: 'x-section',
        schedule: 'missing.schedule',
        hydration: {
          mode: 'teleport'
        },
        metadata: {
          fabric: {
            lane: 'urgent'
          }
        }
      }
    ],
    routes: [
      {
        id: 'home',
        path: '/',
        router: 'xtend.xrouter',
        component: 'page.home',
        template: 'missing.template',
        schedule: 'missing.schedule'
      }
    ],
    schedules: [
      {
        id: 'existing.schedule',
        lane: 'visible'
      }
    ],
    templates: [
      {
        id: 'tpl.home',
        mode: 'dom_descriptor',
        nodes: [
          { component: 'page.home' }
        ]
      }
    ]
  }, null, 2);
}

function getAction(report, code, titleIncludes) {
  return report.actions.find((action) => {
    const codeMatches = !code || action.diagnosticCode === code;
    const titleMatches = !titleIncludes || action.title.includes(titleIncludes);

    return codeMatches && titleMatches;
  });
}

function applyAction(text, uri, action) {
  const edits = action && action.edit && action.edit.changes ? action.edit.changes[uri] || [] : [];
  let nextText = text;

  edits.slice().sort((a, b) => {
    const sourceModel = createRmtSourceModel({ text: nextText, uri });
    return sourceModel.offsetAt(b.range.start) - sourceModel.offsetAt(a.range.start);
  }).forEach((edit) => {
    const sourceModel = createRmtSourceModel({ text: nextText, uri });
    const start = sourceModel.offsetAt(edit.range.start);
    const end = sourceModel.offsetAt(edit.range.end);

    nextText = `${nextText.slice(0, start)}${edit.newText}${nextText.slice(end)}`;
  });

  return nextText;
}

function parseAfterAction(context, text, uri, action, message) {
  const nextText = applyAction(text, uri, action);

  try {
    return JSON.parse(nextText);
  } catch (error) {
    context.fail(`${message}: JSON parse failed (${error.message})`);
    return null;
  }
}

function runActionGenerationChecks(context) {
  const uri = 'file:///virtual/code-actions.rmt';
  const text = createProblemFixture();
  const provider = createRmtCodeActionProvider();
  const report = provider.codeActions({ text, uri });
  const repeatReport = getRmtCodeActions({ text, uri });
  const scheduleAction = getAction(report, 'rmt.ref.schedule.unresolved', 'missing.schedule');
  const templateAction = getAction(report, 'rmt.ref.template.unresolved', 'missing.template');
  const laneAction = getAction(report, 'rmt.fabric.lane.unknown', 'visible');
  const hydrationAction = getAction(report, 'rmt.hydration.policy.unknown', 'runtime_render');
  const titleAction = getAction(report, 'rmt.route.document-title.missing', 'documentTitle');
  const endpointAction = getAction(report, 'rmt.schedule.endpoint.missing', 'endpointName');

  context.assert(provider.schema === RMT_CODE_ACTION_PROVIDER_SCHEMA, 'Code Action provider exposes schema');
  context.assert(report.schema === RMT_CODE_ACTION_REPORT_SCHEMA, 'Code Action provider emits report schema');
  context.assert(report.providerSchema === RMT_CODE_ACTION_PROVIDER_SCHEMA, 'Code Action report emits provider schema');
  context.assert(report.actionSchema === RMT_CODE_ACTION_SCHEMA, 'Code Action report emits action schema');
  context.assert(report.editSchema === RMT_WORKSPACE_EDIT_SCHEMA, 'Code Action report emits edit schema');
  context.assert(report.workpackage === RMT_CODE_ACTION_WORKPACKAGE, 'Code Action report belongs to WP-E14-10');
  context.assert(report.status === 'completed', 'Code Action report completes for indexed source');
  context.assert(report.actions.every((action) => action.schema === RMT_CODE_ACTION_SCHEMA), 'All code actions have stable action schema');
  context.assert(report.actions.every((action) => action.kind === 'quickfix'), 'All code actions are quickfixes');
  context.assert(report.actions.every((action) => action.safe === true), 'All MVP code actions are safe');
  context.assert(scheduleAction && scheduleAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'Missing schedule creates workspace edit');
  context.assert(templateAction && templateAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'Missing template creates workspace edit');
  context.assert(laneAction && laneAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'Unknown Fabric lane creates replace edit');
  context.assert(hydrationAction && hydrationAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'Unknown hydration policy creates replace edit');
  context.assert(titleAction && titleAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'Missing route title creates append-property edit');
  context.assert(endpointAction && endpointAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'Missing endpointName creates append-property edit');
  context.assert(
    JSON.stringify(report.actions) === JSON.stringify(repeatReport.actions),
    'Code Action output is deterministic for repeated runs'
  );

  const scheduleDoc = parseAfterAction(context, text, uri, scheduleAction, 'Schedule action');
  const templateDoc = parseAfterAction(context, text, uri, templateAction, 'Template action');
  const laneDoc = parseAfterAction(context, text, uri, laneAction, 'Lane action');
  const hydrationDoc = parseAfterAction(context, text, uri, hydrationAction, 'Hydration action');
  const titleDoc = parseAfterAction(context, text, uri, titleAction, 'Route title action');
  const endpointDoc = parseAfterAction(context, text, uri, endpointAction, 'Endpoint action');

  context.assert(scheduleDoc && scheduleDoc.schedules.some((schedule) => schedule.id === 'missing.schedule'), 'Schedule action inserts missing schedule stub');
  context.assert(templateDoc && templateDoc.templates.some((template) => template.id === 'missing.template' && template.mode === 'dom_descriptor'), 'Template action inserts DOM descriptor template stub');
  context.assert(laneDoc && laneDoc.components[0].metadata.fabric.lane === 'visible', 'Lane action replaces unknown lane with visible');
  context.assert(hydrationDoc && hydrationDoc.components[0].hydration.mode === 'runtime_render', 'Hydration action replaces unknown policy with runtime_render');
  context.assert(titleDoc && titleDoc.routes[0].documentTitle === 'Home', 'Route title action adds documentTitle');
  context.assert(endpointDoc && endpointDoc.schedules[0].endpointName === 'xtendrmt.existing.schedule', 'Endpoint action adds endpointName');
}

function runDiagnosticFilterChecks(context) {
  const uri = 'file:///virtual/code-actions-filtered.rmt';
  const text = createProblemFixture();
  const report = getRmtCodeActions({ text, uri }, {
    diagnostics: [
      {
        code: 'rmt.ref.template.unresolved',
        data: {
          pointer: '/routes/0/template'
        }
      }
    ]
  });

  context.assert(report.actions.length === 1, 'Code Action provider can filter by LSP diagnostic context');
  context.assert(report.actions[0].title.includes('missing.template'), 'Filtered code action targets requested diagnostic');
}

function runFallbackAndFailureChecks(context, rootDir) {
  const text = readText(VALID_FIXTURE_PATH, rootDir);
  const filePath = resolveRepoPath('tests/fixtures/legacy-code-actions.rmt.json', rootDir);
  const report = getRmtCodeActions({
    text,
    filePath
  }, {
    rootDir
  });
  const renameAction = getAction(report, 'rmt.document.extension.fallback-used', '.rmt');
  const brokenReport = getRmtCodeActions({
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}',
    uri: 'file:///virtual/broken-code-actions.rmt'
  }, {
    rootDir
  });

  context.assert(renameAction && !renameAction.edit, 'Fallback file policy action uses command instead of text edit');
  context.assert(renameAction && renameAction.command.command === 'xtend.rmt.renameFileExtension', 'Fallback file policy command uses stable command id');
  context.assert(renameAction && renameAction.command.arguments[0].to.endsWith('.rmt'), 'Fallback file policy command proposes .rmt target');
  context.assert(brokenReport.status === 'source_unavailable', 'Code Action provider reports source_unavailable for syntax-broken source');
  context.assert(brokenReport.actionCount === 0, 'Syntax-broken source has no code actions before parse recovery');
}

function runLanguageServerCodeActionChecks(context, rootDir) {
  const uri = 'file:///virtual/lsp-code-actions.rmt';
  const text = createProblemFixture();
  const server = createRmtLanguageServer({ rootDir });

  server.handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { rootPath: rootDir }
  });
  const notifications = server.handleMessage({
    jsonrpc: '2.0',
    method: 'textDocument/didOpen',
    params: {
      textDocument: {
        uri,
        languageId: 'rmt',
        version: 1,
        text
      }
    }
  });
  const diagnostics = notifications[0].params.diagnostics;
  const response = server.handleMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'textDocument/codeAction',
    params: {
      textDocument: { uri },
      range: diagnostics[0].range,
      context: {
        diagnostics
      }
    }
  })[0];

  context.assert(Array.isArray(response.result), 'Language Server returns CodeAction array');
  context.assert(response.result.some((action) => action.title.includes('missing.schedule')), 'Language Server maps missing schedule code action');
  context.assert(response.result.some((action) => action.title.includes('missing.template')), 'Language Server maps missing template code action');
  context.assert(response.result.some((action) => action.edit && action.edit.changes[uri]), 'Language Server maps workspace edits to LSP shape');
  context.assert(response.result.every((action) => action.kind === 'quickfix'), 'Language Server exposes quickfix kind');
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtCodeActions;
  const languageServerMetadata = packageManifest.xtend && packageManifest.xtend.rmtLanguageServer;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_CODE_ACTION_PROVIDER_SCHEMA, 'package metadata declares RMT Code Action provider schema');
  context.assert(metadata && metadata.reportSchema === RMT_CODE_ACTION_REPORT_SCHEMA, 'package metadata declares RMT Code Action report schema');
  context.assert(metadata && metadata.actionSchema === RMT_CODE_ACTION_SCHEMA, 'package metadata declares action schema');
  context.assert(metadata && metadata.editSchema === RMT_WORKSPACE_EDIT_SCHEMA, 'package metadata declares workspace edit schema');
  context.assert(metadata && metadata.workpackage === RMT_CODE_ACTION_WORKPACKAGE, 'package metadata points to WP-E14-10');
  context.assert(metadata && metadata.module === RMT_CODE_ACTION_MODULE_PATH, 'package metadata points to code actions module');
  context.assert(metadata && metadata.suite === RMT_CODE_ACTION_SUITE_PATH, 'package metadata points to code actions suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-code-actions --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_CODE_ACTION_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(languageServerMetadata && languageServerMetadata.codeActionProvider === true, 'Language Server metadata enables code actions');
  context.assert((typeof packageManifest.exports['./rmt-language/code-actions'] === 'string' ? packageManifest.exports['./rmt-language/code-actions'] : packageManifest.exports['./rmt-language/code-actions'] && packageManifest.exports['./rmt-language/code-actions'].default) === './tools/rmt-language/code-actions.js', 'package exports RMT Code Actions provider');
  context.assert(packageManifest.scripts['test:rmt-code-actions'] === 'node scripts/run_xtend_tests.js rmt-code-actions', 'package exposes rmt-code-actions script');
  context.assert(runner.includes("id: 'rmt-code-actions'"), 'test runner exposes rmt-code-actions suite');
  context.assert(epic.includes('| `WP-E14-10` | P1 | completed | WS5 |'), 'Epic marks WP-E14-10 completed');
  context.assert(epic.includes('WP-E14-11` ist `ready`'), 'Epic hands off WP-E14-11 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-10`'), 'Architecture documents RMT Code Actions status');
  context.assert(architecture.includes('xtend.rmt.code-action-provider.v1'), 'Architecture documents RMT Code Actions provider schema');
}

function runRmtCodeActionsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-code-actions',
    label: 'Epic 14 RMT Code Actions'
  });
  const moduleSyntax = syntaxCheckFile(RMT_CODE_ACTION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_CODE_ACTION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_CODE_ACTION_MODULE_PATH, rootDir, 'RMT Code Actions module exists');
  assertFileExists(context, RMT_CODE_ACTION_SUITE_PATH, rootDir, 'RMT Code Actions suite exists');
  assertFileExists(context, RMT_CODE_ACTION_WP_PATH, rootDir, 'WP-E14-10 workpackage document exists');
  context.assert(moduleSyntax.ok, `RMT Code Actions module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT Code Actions suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runActionGenerationChecks(context);
  runDiagnosticFilterChecks(context);
  runFallbackAndFailureChecks(context, rootDir);
  runLanguageServerCodeActionChecks(context, rootDir);

  return context.result({
    schema: RMT_CODE_ACTION_REPORT_SCHEMA,
    providerSchema: RMT_CODE_ACTION_PROVIDER_SCHEMA,
    actionSchema: RMT_CODE_ACTION_SCHEMA,
    editSchema: RMT_WORKSPACE_EDIT_SCHEMA,
    workpackage: RMT_CODE_ACTION_WORKPACKAGE,
    module: RMT_CODE_ACTION_MODULE_PATH,
    suite: RMT_CODE_ACTION_SUITE_PATH
  });
}

function printRmtCodeActionsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Code Actions erfolgreich.',
    failureTitle: 'Epic 14 RMT Code Actions fehlgeschlagen:'
  });
}

module.exports = {
  printRmtCodeActionsReport,
  runRmtCodeActionsSuite
};
