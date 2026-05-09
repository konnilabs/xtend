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
  RMT_COMPLETION_ITEM_SCHEMA,
  RMT_COMPLETION_MODULE_PATH,
  RMT_COMPLETION_PACKAGE_SCRIPT,
  RMT_COMPLETION_PROVIDER_SCHEMA,
  RMT_COMPLETION_REPORT_SCHEMA,
  RMT_COMPLETION_SUITE_PATH,
  RMT_COMPLETION_WORKPACKAGE,
  createRmtCompletionProvider,
  getRmtCompletions,
  inferCompletionContext
} = require('../../tools/rmt-language/completions');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_COMPLETION_WP_PATH = 'development/WP-E14-07-Completion-Provider-fuer-RMT-Domains-Adapter-Tags-Routes-und-Schedules-bauen.md';
const VALID_FIXTURE_PATH = 'xtendrmt/rmt-first-demo-app.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function labels(report) {
  return report.items.map((item) => item.label);
}

function assertHasLabel(context, report, label, message) {
  context.assert(labels(report).includes(label), message);
}

function assertItemShape(context, report, message) {
  context.assert(
    report.items.every((item) => item.schema === RMT_COMPLETION_ITEM_SCHEMA && item.label && item.insertText && item.kind && item.source),
    message
  );
}

function createInput(rootDir) {
  return {
    text: readText(VALID_FIXTURE_PATH, rootDir),
    filePath: resolveRepoPath(VALID_FIXTURE_PATH, rootDir),
    version: 7
  };
}

function runStaticCompletionChecks(context, rootDir) {
  const input = createInput(rootDir);
  const topLevel = getRmtCompletions(input, { rootDir, context: 'top-level' });
  const routeFields = getRmtCompletions(input, { rootDir, pointer: '/routes/1' });
  const templateModes = getRmtCompletions(input, { rootDir, pointer: '/templates/0/mode' });
  const hydrationPolicies = getRmtCompletions(input, { rootDir, pointer: '/components/0/hydration/mode' });
  const lanes = getRmtCompletions(input, { rootDir, pointer: '/schedules/0/lane' });

  context.assert(topLevel.schema === RMT_COMPLETION_REPORT_SCHEMA, 'Completion emits report schema');
  context.assert(topLevel.providerSchema === RMT_COMPLETION_PROVIDER_SCHEMA, 'Completion emits provider schema');
  context.assert(topLevel.workpackage === RMT_COMPLETION_WORKPACKAGE, 'Completion belongs to WP-E14-07');
  context.assert(topLevel.status === 'completed', 'Completion report completes for valid source');
  context.assert(topLevel.graphStatus === 'indexed', 'Completion report exposes graph status');
  assertItemShape(context, topLevel, 'Top-level completions have stable item shape');
  assertHasLabel(context, topLevel, 'manifest', 'Top-level completion contains manifest');
  assertHasLabel(context, topLevel, 'components', 'Top-level completion contains components');
  assertHasLabel(context, topLevel, 'routes', 'Top-level completion contains routes');
  assertHasLabel(context, topLevel, 'schedules', 'Top-level completion contains schedules');
  assertHasLabel(context, topLevel, 'templates', 'Top-level completion contains templates');

  context.assert(routeFields.context === 'route-fields', 'Pointer infers route field context');
  assertHasLabel(context, routeFields, 'documentTitle', 'Route field completion contains documentTitle');
  assertHasLabel(context, routeFields, 'metaDescription', 'Route field completion contains metaDescription');
  assertHasLabel(context, routeFields, 'schedule', 'Route field completion contains schedule');

  context.assert(templateModes.context === 'template-modes', 'Template mode pointer infers template modes');
  assertHasLabel(context, templateModes, 'dom_descriptor', 'Template mode completion contains dom_descriptor');
  assertHasLabel(context, templateModes, 'html_fragment', 'Template mode completion contains html_fragment');
  assertHasLabel(context, templateModes, 'text', 'Template mode completion contains text');

  context.assert(hydrationPolicies.context === 'hydration-policies', 'Hydration mode pointer infers hydration policies');
  assertHasLabel(context, hydrationPolicies, 'runtime_render', 'Hydration completion contains runtime_render');
  assertHasLabel(context, hydrationPolicies, 'worker_prerender_hydrate', 'Hydration completion contains worker_prerender_hydrate');
  assertHasLabel(context, hydrationPolicies, 'server_prerender_hydrate', 'Hydration completion contains server_prerender_hydrate');

  assertHasLabel(context, lanes, 'visible', 'Lane completion contains visible');
  assertHasLabel(context, lanes, 'user-blocking', 'Lane completion contains user-blocking');
  assertHasLabel(context, lanes, 'diagnostics', 'Lane completion contains diagnostics');
}

function runGraphReferenceCompletionChecks(context, rootDir) {
  const input = createInput(rootDir);
  const adapters = getRmtCompletions(input, { rootDir, pointer: '/components/0/adapter' });
  const tags = getRmtCompletions(input, { rootDir, pointer: '/components/0/tag' });
  const components = getRmtCompletions(input, { rootDir, pointer: '/routes/1/component', prefix: 'page.' });
  const templates = getRmtCompletions(input, { rootDir, pointer: '/routes/1/template', prefix: 'page.' });
  const schedules = getRmtCompletions(input, { rootDir, pointer: '/routes/1/schedule', prefix: 'route.' });
  const endpoints = getRmtCompletions(input, { rootDir, pointer: '/templates/0/hydration/metadata/endpointHint', prefix: 'xtendrmt.component' });
  const routePaths = getRmtCompletions(input, { rootDir, context: 'route-paths' });

  context.assert(adapters.context === 'adapter-ids', 'Adapter pointer infers adapter ID context');
  assertHasLabel(context, adapters, 'xtend.component', 'Adapter completion contains xtend.component');
  assertHasLabel(context, adapters, 'xtend.xrouter', 'Adapter completion contains xtend.xrouter');
  assertHasLabel(context, adapters, 'xtend.fabric-telemetry', 'Adapter completion contains built-in telemetry adapter');

  context.assert(tags.context === 'component-tags', 'Tag pointer infers component tag context');
  assertHasLabel(context, tags, 'x-section', 'Component tag completion contains x-section');
  assertHasLabel(context, tags, 'x-router', 'Component tag completion contains x-router');
  assertHasLabel(context, tags, 'x-icon', 'Component tag completion contains x-icon from manifest');

  context.assert(components.context === 'component-ids', 'Component pointer infers component ID context');
  assertHasLabel(context, components, 'page.settings', 'Component ID completion contains page.settings');
  context.assert(labels(components).every((label) => label.startsWith('page.')), 'Component ID completion applies prefix filtering');

  assertHasLabel(context, templates, 'page.settings.template', 'Template ID completion contains page.settings.template');
  assertHasLabel(context, schedules, 'route.transition.render', 'Schedule ID completion contains route.transition.render');
  assertHasLabel(context, endpoints, 'xtendrmt.component.hydrate', 'Schedule endpoint completion contains xtendrmt.component.hydrate');
  assertHasLabel(context, routePaths, '/settings', 'Route path completion contains /settings');
}

function runContextInferenceChecks(context) {
  context.assert(inferCompletionContext({ pointer: '/' }) === 'top-level', 'Pointer / infers top-level');
  context.assert(inferCompletionContext({ pointer: '/routes/0/component' }) === 'component-ids', 'Route component pointer infers component IDs');
  context.assert(inferCompletionContext({ pointer: '/routes/0/template' }) === 'template-ids', 'Route template pointer infers template IDs');
  context.assert(inferCompletionContext({ pointer: '/routes/0/schedule' }) === 'schedule-ids', 'Route schedule pointer infers schedule IDs');
  context.assert(inferCompletionContext({ pointer: '/components/0/tag' }) === 'component-tags', 'Component tag pointer infers tags');
  context.assert(inferCompletionContext({ pointer: '/schedules/0/lane' }) === 'schedule-lanes', 'Schedule lane pointer infers lanes');
  context.assert(inferCompletionContext({ domain: 'components' }) === 'component-fields', 'Domain components infers component fields');
}

function runDeterministicAndFailureChecks(context, rootDir) {
  const input = createInput(rootDir);
  const first = getRmtCompletions(input, { rootDir, pointer: '/routes/1/component', prefix: 'page.' });
  const second = getRmtCompletions(input, { rootDir, pointer: '/routes/1/component', prefix: 'page.' });
  const brokenTopLevel = getRmtCompletions({
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}',
    uri: 'file:///virtual/broken-completion.rmt'
  }, {
    rootDir,
    context: 'top-level'
  });
  const brokenReferences = getRmtCompletions({
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}',
    uri: 'file:///virtual/broken-completion.rmt'
  }, {
    rootDir,
    context: 'component-ids'
  });
  const provider = createRmtCompletionProvider({ rootDir });
  const providerReport = provider.complete(input, { pointer: '/routes/1/template', prefix: 'page.' });

  context.assert(JSON.stringify(first.items) === JSON.stringify(second.items), 'Completion output is deterministic for repeated runs');
  context.assert(brokenTopLevel.status === 'completed', 'Top-level static completion works on syntax-broken source');
  assertHasLabel(context, brokenTopLevel, 'templates', 'Broken-source top-level completion still contains templates');
  context.assert(brokenReferences.status === 'source_unavailable', 'Reference completion reports source_unavailable on syntax-broken source');
  context.assert(brokenReferences.itemCount === 0, 'Reference completion returns no graph refs on syntax-broken source');
  context.assert(provider.schema === RMT_COMPLETION_PROVIDER_SCHEMA, 'Completion provider exposes schema');
  assertHasLabel(context, providerReport, 'page.settings.template', 'Completion provider instance returns template completions');
}

function runRmtCompletionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-completions',
    label: 'Epic 14 RMT Completion Provider'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtCompletions;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_COMPLETION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_COMPLETION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_COMPLETION_MODULE_PATH, rootDir, 'RMT Completion provider module exists');
  assertFileExists(context, RMT_COMPLETION_SUITE_PATH, rootDir, 'RMT Completion suite exists');
  assertFileExists(context, RMT_COMPLETION_WP_PATH, rootDir, 'WP-E14-07 workpackage document exists');
  context.assert(moduleSyntax.ok, `RMT Completion module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT Completion suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_COMPLETION_PROVIDER_SCHEMA, 'package metadata declares RMT Completion provider schema');
  context.assert(metadata && metadata.reportSchema === RMT_COMPLETION_REPORT_SCHEMA, 'package metadata declares RMT Completion report schema');
  context.assert(metadata && metadata.workpackage === RMT_COMPLETION_WORKPACKAGE, 'package metadata points to WP-E14-07');
  context.assert(metadata && metadata.module === RMT_COMPLETION_MODULE_PATH, 'package metadata points to completion module');
  context.assert(metadata && metadata.suite === RMT_COMPLETION_SUITE_PATH, 'package metadata points to completion suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-completions --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_COMPLETION_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(packageManifest.exports['./rmt-language/completions'] === './tools/rmt-language/completions.js', 'package exports RMT Completion provider');
  context.assert(packageManifest.scripts['test:rmt-completions'] === 'node scripts/run_xtend_tests.js rmt-completions', 'package exposes rmt-completions script');
  context.assert(runner.includes("id: 'rmt-completions'"), 'test runner exposes rmt-completions suite');
  context.assert(epic.includes('| `WP-E14-07` | P1 | completed | WS4 |'), 'Epic marks WP-E14-07 completed');
  context.assert(epic.includes('WP-E14-08` ist `ready`'), 'Epic hands off WP-E14-08 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-07`'), 'Architecture documents RMT Completion provider status');
  context.assert(architecture.includes('xtend.rmt.completion-provider.v1'), 'Architecture documents RMT Completion provider schema');

  runStaticCompletionChecks(context, rootDir);
  runGraphReferenceCompletionChecks(context, rootDir);
  runContextInferenceChecks(context);
  runDeterministicAndFailureChecks(context, rootDir);

  return context.result({
    schema: RMT_COMPLETION_REPORT_SCHEMA,
    providerSchema: RMT_COMPLETION_PROVIDER_SCHEMA,
    workpackage: RMT_COMPLETION_WORKPACKAGE,
    module: RMT_COMPLETION_MODULE_PATH,
    suite: RMT_COMPLETION_SUITE_PATH
  });
}

function printRmtCompletionReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Completion Provider erfolgreich.',
    failureTitle: 'Epic 14 RMT Completion Provider fehlgeschlagen:'
  });
}

module.exports = {
  printRmtCompletionReport,
  runRmtCompletionSuite
};
