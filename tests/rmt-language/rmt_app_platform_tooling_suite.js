const fs = require('fs');
const os = require('os');
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
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  REQUIRED_ARTIFACTS,
  REQUIRED_BOUNDARIES,
  REQUIRED_COMPLETION_CONTEXTS,
  REQUIRED_DIAGNOSTIC_CODES,
  REQUIRED_DOCS,
  REQUIRED_TOOLING_CAPABILITIES,
  RMT_APP_PLATFORM_TOOLING_DOCS,
  RMT_APP_PLATFORM_TOOLING_FIXTURE,
  RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_GENERATOR,
  RMT_APP_PLATFORM_TOOLING_LOCAL_GATE,
  RMT_APP_PLATFORM_TOOLING_MODULE,
  RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT,
  RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_RUNTIME,
  RMT_APP_PLATFORM_TOOLING_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_STATUS,
  RMT_APP_PLATFORM_TOOLING_SUITE,
  RMT_APP_PLATFORM_TOOLING_TARGET,
  RMT_APP_PLATFORM_TOOLING_TYPES,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
  RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC,
  createRmtAppPlatformToolingPlan,
  createRmtAppPlatformToolingReport,
  validateRmtAppPlatformToolingPlan
} = require('../../catalog/epic18-rmt-app-platform-tooling');
const {
  RMT_APP_PLATFORM_DIAGNOSTIC_CODES,
  RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
  RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA,
  analyzeRmtAppPlatformSource,
  createRmtAppPlatformScaffoldPlan,
  getRmtAppPlatformCompletions,
  getRmtAppPlatformHover
} = require('../../tools/rmt-language/app-platform-tooling');
const {
  lintRmtSource
} = require('../../tools/rmt-language/diagnostics');
const {
  DEFAULT_SOURCE_PATH,
  RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA,
  RMT_APP_PLATFORM_BUILD_SCHEMA,
  createRmtAppPlatformBuild,
  resolveBuildPaths
} = require('../../xtend-builder/generators/rmt-app-platform');

const BACKLOG_PATH = 'development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md';
const EPIC_PATH = 'docs/epic18-media-manager-vendor-upstream.md';
const SYNTAX_CHECK_PATHS = [
  RMT_APP_PLATFORM_TOOLING_MODULE,
  RMT_APP_PLATFORM_TOOLING_RUNTIME,
  'tools/rmt-language/rules/app-platform-policy.js',
  RMT_APP_PLATFORM_TOOLING_GENERATOR,
  RMT_APP_PLATFORM_TOOLING_SUITE
];

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, label) {
  const values = Array.isArray(actual) ? actual : [];
  expected.forEach((entry) => {
    context.assert(values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function labels(report) {
  return (report.items || []).map((item) => item.label);
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function createProblemFixture() {
  return JSON.stringify({
    kind: 'rmt_document',
    schema: 'xtend.epic18.rmt-app-platform-tooling-negative-fixture.v1',
    manifest: {
      metadata: {
        contractVersion: RMT_APP_PLATFORM_TOOLING_SCHEMA
      }
    },
    adapters: [],
    components: [
      {
        id: 'component.bad',
        tag: 'x-bad',
        template: 'template.bad',
        innerHTML: '<strong>bad</strong>'
      }
    ],
    routes: [],
    schedules: [],
    templates: [
      {
        id: 'template.bad',
        html: '<div>Unsafe HTML without trust boundary</div>'
      }
    ],
    records: {},
    resources: [
      {
        id: 'resource.unowned',
        kind: 'stream'
      }
    ],
    portals: [
      {
        id: 'portal.app',
        policy: 'stacked'
      }
    ],
    surfaces: [
      {
        id: 'surface.bad',
        kind: 'window',
        source: 'records.missing',
        repeat: true,
        portal: 'portal.missing',
        component: 'component.bad',
        resources: ['resource.missing']
      }
    ],
    overlays: [
      {
        id: 'overlay.bad',
        kind: 'tooltip',
        portal: 'portal.missing',
        resources: ['resource.missing']
      }
    ],
    actions: [
      {
        id: 'action.bad',
        resources: ['resource.missing']
      }
    ],
    events: [
      {
        id: 'event.bad',
        kind: 'custom',
        action: 'action.bad'
      }
    ]
  }, null, 2);
}

function createTempRoot(rootDir) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-app-platform-tooling-'));
  const sourceDir = path.join(tempRoot, 'tests', 'fixtures');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(
    path.join(sourceDir, 'app.rmt'),
    readText(RMT_APP_PLATFORM_TOOLING_FIXTURE, rootDir),
    'utf8'
  );
  fs.writeFileSync(
    path.join(sourceDir, 'app.core.json'),
    readText(RMT_APP_PLATFORM_TOOLING_FIXTURE.replace(/\.rmt$/u, '.core.json'), rootDir),
    'utf8'
  );
  return tempRoot;
}

function runCatalogChecks(context, rootDir) {
  const plan = createRmtAppPlatformToolingPlan();
  const validation = validateRmtAppPlatformToolingPlan(plan);
  const report = createRmtAppPlatformToolingReport({ plan });

  context.assert(plan.schema === RMT_APP_PLATFORM_TOOLING_SCHEMA, 'WP11 plan exposes App Platform Tooling schema');
  context.assert(plan.reportSchema === RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA, 'WP11 plan exposes report schema');
  context.assert(plan.workpackage === RMT_APP_PLATFORM_TOOLING_WORKPACKAGE, 'WP11 plan belongs to WP-E18-11');
  context.assert(plan.status === RMT_APP_PLATFORM_TOOLING_STATUS, 'WP11 plan is accepted');
  context.assert(plan.targetReadiness === RMT_APP_PLATFORM_TOOLING_TARGET, 'WP11 plan targets authoring tooling readiness');
  context.assert(plan.localGate === RMT_APP_PLATFORM_TOOLING_LOCAL_GATE, 'WP11 plan declares local gate');
  context.assert(plan.packageScript === RMT_APP_PLATFORM_TOOLING_PACKAGE_SCRIPT, 'WP11 plan declares package script');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'WP11 plan hands off to WP-E18-12');
  context.assert(plan.nextDecision === NEXT_DECISION, 'WP11 plan declares generic fixture next decision');
  context.assert(validation.ok, 'WP11 plan validates without errors');
  context.assert(report.ok && report.capabilityCount === REQUIRED_TOOLING_CAPABILITIES.length, 'WP11 report summarizes required capabilities');
  assertIncludesAll(context, plan.capabilities, REQUIRED_TOOLING_CAPABILITIES, 'WP11 capabilities');
  assertIncludesAll(context, plan.diagnosticCodes, REQUIRED_DIAGNOSTIC_CODES, 'WP11 diagnostic codes');
  assertIncludesAll(context, plan.completionContexts, REQUIRED_COMPLETION_CONTEXTS, 'WP11 completion contexts');
  assertIncludesAll(context, plan.boundaries, REQUIRED_BOUNDARIES, 'WP11 boundaries');
  REQUIRED_ARTIFACTS.concat(REQUIRED_DOCS).forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });
  SYNTAX_CHECK_PATHS.forEach((relativePath) => {
    const result = syntaxCheckFile(relativePath, { rootDir });
    context.assert(result.ok, `${relativePath} has valid JavaScript syntax`);
  });
}

function runFixtureAndAnalysisChecks(context, rootDir) {
  const fixture = readJson(RMT_APP_PLATFORM_TOOLING_FIXTURE, rootDir);
  const fixtureText = readText(RMT_APP_PLATFORM_TOOLING_FIXTURE, rootDir);
  const analysis = analyzeRmtAppPlatformSource({
    text: fixtureText,
    filePath: resolveRepoPath(RMT_APP_PLATFORM_TOOLING_FIXTURE, rootDir)
  }, {
    rootDir
  });

  context.assert(fixture.schema === RMT_APP_PLATFORM_TOOLING_FIXTURE_SCHEMA, 'WP11 fixture exposes fixture schema');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_APP_PLATFORM_TOOLING_SCHEMA, 'WP11 fixture declares tooling contract');
  context.assert(fixture.acceptance.scaffoldPipelineForRmtAppSources === true, 'WP11 fixture accepts scaffold pipeline');
  context.assert(fixture.acceptance.manualHtmlRendererAllowed === false, 'WP11 fixture keeps manual HTML disabled');
  context.assert(!/Media\s*Manager|media-manager|mediaManager|MediaRecord|mediaRecord|explorer\.|player\./u.test(fixtureText), 'WP11 fixture stays product-agnostic');
  context.assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/u.test(fixtureText), 'WP11 fixture contains no manual HTML sink');

  context.assert(analysis.schema === RMT_APP_PLATFORM_TOOLING_REPORT_SCHEMA, 'Analyzer emits WP11 report schema');
  context.assert(analysis.status === 'passed' && analysis.ok, 'Valid WP11 fixture passes App Platform analysis');
  context.assert(analysis.summary.errorCount === 0, 'Valid WP11 fixture has no App Platform errors');
  context.assert(analysis.sourceMap.schema === RMT_APP_PLATFORM_SOURCE_MAP_SCHEMA, 'Analyzer emits source-map schema');
  context.assert(analysis.sourceMap.totalCount >= 10, 'Analyzer produces a non-trivial source map');
  ['surfaces', 'overlays', 'portals', 'resources', 'events', 'actions', 'dataSources', 'state'].forEach((domain) => {
    context.assert(analysis.sourceMap.byDomain[domain] >= 1, `Source map covers ${domain}`);
  });

  const scaffoldPlan = createRmtAppPlatformScaffoldPlan({
    text: fixtureText,
    source: RMT_APP_PLATFORM_TOOLING_FIXTURE,
    filePath: resolveRepoPath(RMT_APP_PLATFORM_TOOLING_FIXTURE, rootDir)
  }, {
    rootDir
  });
  context.assert(scaffoldPlan.schema === RMT_APP_PLATFORM_SCAFFOLD_SCHEMA, 'Scaffold plan emits scaffold schema');
  context.assert(scaffoldPlan.status === 'planned' && scaffoldPlan.ok, 'Scaffold plan is planned for valid fixture');
  context.assert(scaffoldPlan.outputs.length === 3, 'Scaffold plan creates diagnostics, source-map and report outputs');
  context.assert(scaffoldPlan.report.generated.diagnostics.endsWith('.app-platform-diagnostics.json'), 'Scaffold plan names diagnostics artifact');
}

function runDiagnosticsChecks(context, rootDir) {
  const problemText = createProblemFixture();
  const analysis = analyzeRmtAppPlatformSource({
    text: problemText,
    uri: 'file:///virtual/problem-app.rmt'
  }, {
    rootDir
  });
  const codes = diagnosticCodes(analysis);

  context.assert(analysis.status === 'failed' && !analysis.ok, 'Problem fixture fails App Platform analysis');
  Object.values(RMT_APP_PLATFORM_DIAGNOSTIC_CODES).forEach((code) => {
    context.assert(codes.includes(code), `Problem analysis emits ${code}`);
  });

  const lintReport = lintRmtSource({
    text: problemText,
    uri: 'file:///virtual/problem-app.rmt'
  }, {
    rootDir
  });
  const lintCodes = diagnosticCodes(lintReport);
  context.assert(lintReport.ruleCount === 6, 'Default RMT linter registers App Platform policy as sixth rule');
  Object.values(RMT_APP_PLATFORM_DIAGNOSTIC_CODES).forEach((code) => {
    context.assert(lintCodes.includes(code), `Default linter emits ${code}`);
  });
}

function runLspChecks(context, rootDir) {
  const fixtureText = readText(RMT_APP_PLATFORM_TOOLING_FIXTURE, rootDir);
  const completionInput = {
    text: fixtureText,
    filePath: resolveRepoPath(RMT_APP_PLATFORM_TOOLING_FIXTURE, rootDir)
  };
  const overlayKinds = getRmtAppPlatformCompletions(completionInput, { rootDir, pointer: '/overlays/0/kind' });
  const portalPolicies = getRmtAppPlatformCompletions(completionInput, { rootDir, pointer: '/portals/0/policy' });
  const resourceKinds = getRmtAppPlatformCompletions(completionInput, { rootDir, pointer: '/resources/0/kind' });
  const portalIds = getRmtAppPlatformCompletions(completionInput, { rootDir, pointer: '/surfaces/0/portal' });
  const resourceIds = getRmtAppPlatformCompletions(completionInput, { rootDir, pointer: '/surfaces/0/resources/0' });
  const surfaceStates = getRmtAppPlatformCompletions(completionInput, { rootDir, pointer: '/surfaces/0/initialState' });
  const portalHover = getRmtAppPlatformHover(completionInput, { rootDir, pointer: '/portals/0/policy' });
  const overlayHover = getRmtAppPlatformHover(completionInput, { rootDir, pointer: '/overlays/1/kind' });

  assertIncludesAll(context, labels(overlayKinds), ['tooltip', 'dialog'], 'Overlay kind completions');
  assertIncludesAll(context, labels(portalPolicies), ['stacked', 'toast-region', 'clipping-escape'], 'Portal policy completions');
  assertIncludesAll(context, labels(resourceKinds), ['object-url', 'stream'], 'Resource kind completions');
  assertIncludesAll(context, labels(portalIds), ['portal.app', 'portal.overlay', 'portal.toast'], 'Portal reference completions');
  assertIncludesAll(context, labels(resourceIds), ['resource.preview-stream', 'resource.preview-url'], 'Resource reference completions');
  assertIncludesAll(context, labels(surfaceStates), ['closed', 'open', 'minimized'], 'Surface state completions');
  context.assert(portalHover.ok && portalHover.hover.markdown.includes('Generic stacked app layer'), 'Portal policy hover explains stacked policy');
  context.assert(overlayHover.ok && overlayHover.hover.title === 'lightbox', 'Overlay hover resolves lightbox kind');
}

function runBuilderChecks(context, rootDir) {
  const tempRoot = createTempRoot(rootDir);
  const source = 'tests/fixtures/app.rmt';
  const paths = resolveBuildPaths({ source });
  const dryRun = createRmtAppPlatformBuild({ source }, { rootDir: tempRoot });
  const writeRun = createRmtAppPlatformBuild({ source, write: true }, { rootDir: tempRoot });
  const checkRun = createRmtAppPlatformBuild({ source, check: true }, { rootDir: tempRoot });
  const invalidRun = createRmtAppPlatformBuild({
    source: 'tests/fixtures/app.txt'
  }, {
    rootDir: tempRoot
  });

  context.assert(DEFAULT_SOURCE_PATH === RMT_APP_PLATFORM_TOOLING_FIXTURE, 'RMT App Platform generator defaults to WP11 fixture');
  context.assert(paths.ok && paths.reportPath.endsWith('app.app-platform-build.json'), 'Build path resolver creates app build report path');
  context.assert(dryRun.schema === RMT_APP_PLATFORM_BUILD_SCHEMA, 'Build returns build schema');
  context.assert(dryRun.reportSchema === RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA, 'Build returns build report schema');
  context.assert(dryRun.status === 'planned' && dryRun.ok, 'Dry-run build plans valid fixture');
  context.assert(dryRun.outputs.length === 3, 'Dry-run build exposes three generated outputs');
  context.assert(writeRun.status === 'written' && writeRun.ok, 'Write build writes generated artifacts');
  context.assert(writeRun.ownershipManifest && writeRun.ownershipManifest.changed === true, 'Write build records Scaffold ownership');
  context.assert(fs.existsSync(path.join(tempRoot, 'tests/fixtures/.xtend-build/app.app-platform-build.json')), 'Build report artifact is written');
  context.assert(fs.existsSync(path.join(tempRoot, 'tests/fixtures/.xtend-build/app.app-platform-source-map.json')), 'Source-map artifact is written');
  context.assert(checkRun.status === 'current' && checkRun.ok, 'Check build is current after write');
  context.assert(invalidRun.status === 'invalid_input' && !invalidRun.ok, 'Build rejects non-.rmt source input');
}

function runPackagingAndDocsChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const toolsManifest = readJson('tools/package.json', rootDir);
  const runnerText = readText('scripts/run_xtend_tests.js', rootDir);
  const registryText = readText('xtend-builder/generators/registry.js', rootDir);
  const cliText = readText('xtend-builder/lib/cli.js', rootDir);
  const configText = readText('xtend-builder/scaffold.config.js', rootDir);
  const docsText = readText(RMT_APP_PLATFORM_TOOLING_DOCS, rootDir);
  const wpText = readText(RMT_APP_PLATFORM_TOOLING_WORKPACKAGE_DOC, rootDir);
  const backlogText = readText(BACKLOG_PATH, rootDir);
  const epicText = readText(EPIC_PATH, rootDir);

  context.assert(packageManifest.exports['./rmt-language/app-platform-tooling'].types === './tools/rmt-language/app-platform-tooling.d.ts', 'Package exports App Platform Tooling types condition');
  context.assert(toolsManifest.exports['./rmt-language/app-platform-tooling'].types === './rmt-language/app-platform-tooling.d.ts', 'Tools package exports App Platform Tooling types condition');
  context.assert(packageManifest.scripts['test:rmt-app-platform-tooling'] === 'node scripts/run_xtend_tests.js rmt-app-platform-tooling', 'Package script wires WP11 suite');
  context.assert(packageManifest.xtend.rmtAppPlatformTooling.schema === RMT_APP_PLATFORM_TOOLING_SCHEMA, 'Package metadata exposes WP11 schema');
  context.assert(packageManifest.xtend.rmtAppPlatformTooling.localGate === RMT_APP_PLATFORM_TOOLING_LOCAL_GATE, 'Package metadata exposes WP11 gate');
  context.assert(packageManifest.xtend.rmtAppPlatformTooling.diagnosticCodes.length === REQUIRED_DIAGNOSTIC_CODES.length, 'Package metadata lists WP11 diagnostics');
  context.assert(runnerText.includes('runRmtAppPlatformToolingSuite'), 'Runner imports WP11 suite');
  context.assert(runnerText.includes("id: 'rmt-app-platform-tooling'"), 'Runner registers WP11 suite id');
  context.assert(registryText.includes("command: 'rmt-app-platform'"), 'Builder registry exposes rmt-app-platform command');
  context.assert(cliText.includes("command === 'rmt-app-platform'"), 'Builder CLI exposes rmt-app-platform command');
  context.assert(configText.includes('rmtAppPlatformTooling'), 'Scaffold config exposes WP11 metadata');
  assertTextIncludesAll(context, docsText, [
    RMT_APP_PLATFORM_TOOLING_SCHEMA,
    RMT_APP_PLATFORM_TOOLING_LOCAL_GATE,
    'rmt-app-platform',
    'innerHTML'
  ], 'WP11 docs');
  assertTextIncludesAll(context, wpText, [
    RMT_APP_PLATFORM_TOOLING_WORKPACKAGE,
    RMT_APP_PLATFORM_TOOLING_LOCAL_GATE,
    'Scaffold Pipeline',
    'LSP'
  ], 'WP11 workpackage doc');
  assertTextIncludesAll(context, backlogText, [
    '| `WP-E18-11` | P1 | completed |',
    '| `WP-E18-12` | P1 | completed |',
    '| `WP-E18-13` | P2 | completed |',
    RMT_APP_PLATFORM_TOOLING_LOCAL_GATE
  ], 'Epic18 backlog');
  assertTextIncludesAll(context, epicText, [
    '| `WP-E18-11` | P1 | completed |',
    '| `WP-E18-12` | P1 | completed |',
    '| `WP-E18-13` | P2 | completed |',
    RMT_APP_PLATFORM_TOOLING_LOCAL_GATE
  ], 'Epic18 document');
}

function runRmtAppPlatformToolingSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'rmt-app-platform-tooling',
    label: 'Epic 18 RMT App Platform Tooling'
  });

  runCatalogChecks(context, rootDir);
  runFixtureAndAnalysisChecks(context, rootDir);
  runDiagnosticsChecks(context, rootDir);
  runLspChecks(context, rootDir);
  runBuilderChecks(context, rootDir);
  runPackagingAndDocsChecks(context, rootDir);

  return context.result({
    report: createRmtAppPlatformToolingReport()
  });
}

function printRmtAppPlatformToolingReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 18 RMT App Platform Tooling Gate erfolgreich.',
    failureTitle: 'Epic 18 RMT App Platform Tooling Gate fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtAppPlatformToolingSuite();
  printRmtAppPlatformToolingReport(result);
  process.exit(result.ok ? 0 : 1);
}

module.exports = {
  printRmtAppPlatformToolingReport,
  runRmtAppPlatformToolingSuite
};
