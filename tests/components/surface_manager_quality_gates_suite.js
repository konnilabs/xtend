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
  A11Y_ASSERTIONS,
  COMPONENT_TAGS,
  DOMAIN_GATES,
  KERNEL_BOUNDARY,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  PERFORMANCE_BUDGETS,
  QUALITY_DOMAINS,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  RUNTIME_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE,
  SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA,
  SURFACE_MANAGER_QUALITY_GATES_CONTRACT,
  SURFACE_MANAGER_QUALITY_GATES_DOCS,
  SURFACE_MANAGER_QUALITY_GATES_DOCS_DE,
  SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE,
  SURFACE_MANAGER_QUALITY_GATES_MODULE,
  SURFACE_MANAGER_QUALITY_GATES_PACKAGE_SCRIPT,
  SURFACE_MANAGER_QUALITY_GATES_PLAN,
  SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA,
  SURFACE_MANAGER_QUALITY_GATES_SCHEMA,
  SURFACE_MANAGER_QUALITY_GATES_STATUS,
  SURFACE_MANAGER_QUALITY_GATES_SUITE,
  SURFACE_MANAGER_QUALITY_GATES_TARGET,
  SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE,
  SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC,
  SURFACE_MANAGER_QUALITY_VISUAL_BASELINE,
  SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_OVERLAY_BRIDGE_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  SURFACE_TYPES,
  VISUAL_SNAPSHOT_IDS,
  createSurfaceManagerQualityGatesPlan,
  createSurfaceManagerQualityGatesReport,
  validateSurfaceManagerQualityGatesPlan
} = require('../../catalog/surface-manager-quality-gates');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function runSurfaceManagerQualityGatesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const requestedDomain = options.domain || 'all';
  const context = createSuiteContext({
    id: requestedDomain === 'all' ? 'surface-manager-quality' : `surface-manager-${requestedDomain}`,
    label: requestedDomain === 'all'
      ? 'SurfaceManager browser, a11y, performance and visual gates'
      : `SurfaceManager ${requestedDomain} quality gate`
  });
  const plan = createSurfaceManagerQualityGatesPlan({ rootDir });
  const validation = validateSurfaceManagerQualityGatesPlan(plan);
  const report = createSurfaceManagerQualityGatesReport({ rootDir, plan, domain: requestedDomain });
  const visualBaseline = readJson(SURFACE_MANAGER_QUALITY_VISUAL_BASELINE, rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerQualityGates;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const browserFixture = readText(SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE, rootDir);
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const windowRuntime = readText('components/xsurfacewindow.js', rootDir);
  const sidePanelRuntime = readText('components/xsidepanel.js', rootDir);
  const modalRuntime = readText('components/xmodal.js', rootDir);
  const dialogRuntime = readText('components/xdialog.js', rootDir);
  const drawerRuntime = readText('components/xdrawer.js', rootDir);
  const overlayBridgeRuntime = readText('components/xsurfaceoverlay-bridge.js', rootDir);
  const planningDoc = readText(SURFACE_MANAGER_QUALITY_GATES_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_QUALITY_GATES_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_MANAGER_QUALITY_GATES_DOCS, rootDir);
  const docsDe = readText(SURFACE_MANAGER_QUALITY_GATES_DOCS_DE, rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const browserReadme = readText('tests/browser/README.md', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);

  if (requestedDomain !== 'all') {
    context.assert(QUALITY_DOMAINS.includes(requestedDomain), `Requested quality domain ${requestedDomain} is registered`);
  }

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager quality artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as SurfaceManager quality doc`);
  });

  [
    SURFACE_MANAGER_QUALITY_GATES_MODULE,
    SURFACE_MANAGER_QUALITY_GATES_SUITE,
    'tests/browser/browser_smoke_suite.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_QUALITY_GATES_SCHEMA, 'SurfaceManager quality schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA, 'SurfaceManager quality report schema is stable');
  context.assert(plan.browserSmokeSchema === SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA, 'SurfaceManager quality browser schema is stable');
  context.assert(plan.visualBaselineSchema === SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA, 'SurfaceManager quality visual baseline schema is stable');
  context.assert(plan.surfaceManagerSchema === SURFACE_MANAGER_SCHEMA, 'SurfaceManager quality reuses manager schema');
  context.assert(plan.surfaceRecordSchema === SURFACE_RECORD_SCHEMA, 'SurfaceManager quality reuses record schema');
  context.assert(plan.surfaceControllerSchema === SURFACE_CONTROLLER_SCHEMA, 'SurfaceManager quality reuses controller schema');
  context.assert(plan.snapshotSchema === SURFACE_SNAPSHOT_SCHEMA, 'SurfaceManager quality reuses snapshot schema');
  context.assert(plan.overlayBridgeSchema === SURFACE_OVERLAY_BRIDGE_SCHEMA, 'SurfaceManager quality reuses overlay bridge schema');
  context.assert(plan.workpackage === SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE, 'SurfaceManager quality belongs to WP-SM-07');
  context.assert(plan.status === SURFACE_MANAGER_QUALITY_GATES_STATUS, 'SurfaceManager quality status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_QUALITY_GATES_TARGET, 'SurfaceManager quality target is ready');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'SurfaceManager quality keeps kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'SurfaceManager quality hands off to WP-SM-08');
  context.assert(plan.nextDecision === NEXT_DECISION, 'SurfaceManager quality exposes next decision');
  context.assert(validation.ok === true, 'SurfaceManager quality plan validates');
  context.assert(report.ok === true, 'SurfaceManager quality report validates');
  context.assert(report.requestedDomain === requestedDomain, 'SurfaceManager quality report records requested domain');
  assertIncludesAll(context, plan.domains, QUALITY_DOMAINS, 'SurfaceManager quality domains');
  assertIncludesAll(context, plan.runtimeArtifacts, RUNTIME_ARTIFACTS, 'SurfaceManager quality runtime artifacts');
  assertIncludesAll(context, plan.componentTags, COMPONENT_TAGS, 'SurfaceManager quality component tags');
  assertIncludesAll(context, plan.surfaceTypes, SURFACE_TYPES, 'SurfaceManager quality surface types');
  assertIncludesAll(context, plan.a11yAssertions, A11Y_ASSERTIONS, 'SurfaceManager quality a11y assertions');
  assertIncludesAll(context, plan.visualSnapshotIds, VISUAL_SNAPSHOT_IDS, 'SurfaceManager quality visual snapshots');
  DOMAIN_GATES.forEach((gate) => {
    context.assert(plan.domainGates.some((entry) => entry.id === gate.id && entry.localGate === gate.localGate), `${gate.id} domain gate is planned`);
  });
  context.assert(plan.performanceBudgets.openCloseBudgetMs === PERFORMANCE_BUDGETS.openCloseBudgetMs, 'SurfaceManager quality keeps open/close budget');
  context.assert(plan.performanceBudgets.snapshotBudgetMs === PERFORMANCE_BUDGETS.snapshotBudgetMs, 'SurfaceManager quality keeps snapshot budget');
  context.assert(plan.featureFlags.mixedStackBrowserFixtureImplemented === true, 'Mixed-stack browser fixture is implemented');
  context.assert(plan.featureFlags.browserHarnessActivated === true, 'Browser harness is activated');
  context.assert(plan.featureFlags.a11yGateImplemented === true, 'A11y gate is implemented');
  context.assert(plan.featureFlags.performanceGateImplemented === true, 'Performance gate is implemented');
  context.assert(plan.featureFlags.visualDomBaselineImplemented === true, 'Visual DOM baseline is implemented');
  context.assert(plan.featureFlags.usesWorkbenchFixtureFromWpSm05 === true, 'WP-SM-07 uses WP-SM-05 workbench fixture');
  context.assert(plan.featureFlags.usesOverlayBridgeFromWpSm06 === true, 'WP-SM-07 uses WP-SM-06 overlay bridge');
  context.assert(plan.featureFlags.createsSecondRegistry === false, 'WP-SM-07 rejects a second registry');

  context.assert(visualBaseline.schema === SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA, 'SurfaceManager visual baseline declares schema');
  context.assert(visualBaseline.workpackage === SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE, 'SurfaceManager visual baseline belongs to WP-SM-07');
  context.assert(visualBaseline.fixture === SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE, 'SurfaceManager visual baseline points to quality fixture');
  context.assert(visualBaseline.binaryBaselines === false, 'SurfaceManager visual baseline is JSON-only');
  context.assert(visualBaseline.snapshotCount === VISUAL_SNAPSHOT_IDS.length, 'SurfaceManager visual baseline counts snapshots');
  assertIncludesAll(context, visualBaseline.surfaceTypes, SURFACE_TYPES, 'SurfaceManager visual baseline surface types');
  assertIncludesAll(context, (visualBaseline.records || []).map((record) => record.id), VISUAL_SNAPSHOT_IDS, 'SurfaceManager visual baseline records');
  (visualBaseline.records || []).forEach((record) => {
    context.assert(record.root && record.children && record.children.length >= 2, `${record.id}: baseline has DOM signature`);
    context.assert(record.assertions && record.assertions.length >= 3, `${record.id}: baseline has assertions`);
  });

  assertTextIncludesAll(context, browserFixture, [
    SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA,
    '__xtendSurfaceQualitySmokeResult',
    '/components/xsurfacemanager-controller.js',
    '/components/xsurfaceoverlay-bridge.js',
    '/components/xsurfacemanager.js',
    '/components/xsurfacewindow.js',
    '/components/xsidepanel.js',
    '/components/xmodal.js',
    '/components/xdialog.js',
    '/components/xdrawer.js',
    'data-quality-gate="surface-manager-mixed-stack"',
    'surface-overlay-command',
    'performance.mark',
    'surface-quality-open-close'
  ], 'SurfaceManager quality browser fixture');
  [
    'surface quality all components defined',
    'surface quality mixed stack registered',
    'surface quality overlay command opened modal',
    'surface quality drawer participates in stack',
    'surface quality side panel responsive mode visible',
    'surface quality a11y roles available',
    'surface quality z order css variables applied',
    'surface quality legacy overlay events preserved',
    'surface quality performance marks recorded',
    'surface quality no external network dependency'
  ].forEach((check) => {
    context.assertIncludes(browserFixture, `recordCheck('${check}'`, `SurfaceManager quality fixture records ${check}`);
  });
  context.assert(!browserFixture.includes('https://cdn.ccs-networks.de'), 'SurfaceManager quality fixture has no CDN dependency');

  assertTextIncludesAll(context, browserSuite, [
    'SURFACE_MANAGER_QUALITY_SMOKE_FIXTURE_PATH',
    'SurfaceManager quality smoke fixture',
    '__xtendSurfaceQualitySmokeResult',
    'assertSurfaceManagerQualityFixtureContract(context, rootDir)',
    SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE
  ], 'Browser harness SurfaceManager quality activation');

  assertTextIncludesAll(context, managerRuntime, [
    'xtendScaffoldA11yProfile',
    'xtendScaffoldPerformanceProfile',
    'xtendScreenreaderSignals',
    'xtendMotionContrastPolicy',
    'surface-overlay-command',
    'role="application"',
    'aria-live="polite"',
    '(forced-colors: active)'
  ], 'SurfaceManager a11y and performance runtime');
  assertTextIncludesAll(context, windowRuntime, [
    'xtendScaffoldA11yProfile',
    'xtendScaffoldPerformanceProfile',
    'role="dialog"',
    'aria-hidden',
    '(prefers-reduced-motion: reduce)',
    '(forced-colors: active)',
    'surface-window-command'
  ], 'Surface window quality runtime');
  assertTextIncludesAll(context, sidePanelRuntime, [
    'responsive-mode',
    'role="complementary"',
    'aria-expanded',
    'fullscreen-under-720',
    '(prefers-reduced-motion: reduce)',
    '(forced-colors: active)',
    'surface-panel-command'
  ], 'SidePanel quality runtime');
  [modalRuntime, dialogRuntime, drawerRuntime].forEach((runtime, index) => {
    const tag = ['x-modal', 'x-dialog', 'x-drawer'][index];
    assertTextIncludesAll(context, runtime, [
      'xtendSurfaceOverlayCompatibilityProfile',
      'xtendOverlayInteractionUxProfile',
      'xtendScaffoldPerformanceProfile',
      'xtendScreenreaderSignals',
      'focus-return',
      '(prefers-reduced-motion: reduce)',
      '(forced-colors: active)',
      'var(--surface-overlay-z'
    ], `${tag} quality runtime`);
  });
  assertTextIncludesAll(context, overlayBridgeRuntime, [
    'xtend.surface.overlay-stack-bridge.v1',
    'applyOverlaySurfaceSnapshot',
    'surface-overlay-command',
    'legacyApiPreserved: true'
  ], 'Overlay bridge quality runtime');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_QUALITY_GATES_SCHEMA, 'Package metadata exposes SurfaceManager quality schema');
  context.assert(metadata && metadata.reportSchema === SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA, 'Package metadata exposes SurfaceManager quality report schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE, 'Package metadata exposes WP-SM-07');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE, 'Package metadata exposes SurfaceManager quality local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_QUALITY_GATES_PACKAGE_SCRIPT, 'Package metadata exposes SurfaceManager quality package script');
  context.assert(metadata && metadata.docs === SURFACE_MANAGER_QUALITY_GATES_DOCS, 'Package metadata exposes canonical English quality docs');
  context.assert(metadata && metadata.localizedDocs && metadata.localizedDocs.de === SURFACE_MANAGER_QUALITY_GATES_DOCS_DE, 'Package metadata exposes German quality docs');
  context.assert(metadata && metadata.browserFixture === SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE, 'Package metadata exposes SurfaceManager quality browser fixture');
  context.assert(metadata && metadata.visualBaseline === SURFACE_MANAGER_QUALITY_VISUAL_BASELINE, 'Package metadata exposes SurfaceManager quality visual baseline');
  context.assert(metadata && Array.isArray(metadata.domains) && metadata.domains.includes('visual'), 'Package metadata exposes quality domains');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-SM-08 handoff');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-manager-quality'] === 'node scripts/run_xtend_tests.js surface-manager-quality', 'Package script test:surface-manager-quality exists');
  DOMAIN_GATES.forEach((gate) => {
    context.assert(packageManifest.scripts[`test:${gate.id}`] === `node scripts/run_xtend_tests.js ${gate.id}`, `Package script test:${gate.id} exists`);
  });
  context.assertIncludes(scaffoldConfig, 'surfaceManagerQualityGates', 'Scaffold config exposes surfaceManagerQualityGates');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_QUALITY_GATES_SCHEMA, 'Scaffold config references SurfaceManager quality schema');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE, 'Scaffold config references SurfaceManager quality fixture');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE, 'Scaffold config references SurfaceManager quality local gate');
  context.assert(runner.hasImplementation({ path: "tests/components/surface_manager_quality_gates_suite.js" }), 'Runner imports SurfaceManager quality suite');
  context.assert(runner.hasSuite("surface-manager-quality"), 'Runner registers surface-manager-quality suite');
  DOMAIN_GATES.forEach((gate) => {
    context.assert(runner.hasSuite(gate.id), `Runner registers ${gate.id}`);
  });

  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_QUALITY_GATES_SCHEMA,
    SURFACE_MANAGER_QUALITY_BROWSER_SMOKE_SCHEMA,
    SURFACE_MANAGER_QUALITY_VISUAL_BASELINE_SCHEMA,
    SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE,
    SURFACE_MANAGER_QUALITY_VISUAL_BASELINE,
    'focus-return',
    'openCloseBudgetMs',
    'surface-quality-open-close',
    KERNEL_BOUNDARY
  ], 'SurfaceManager quality contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE,
    SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE,
    'Done Criteria',
    'WP-SM-08'
  ], 'SurfaceManager quality workpackage doc');
  assertTextIncludesAll(context, docs, [
    SURFACE_MANAGER_QUALITY_GATES_SCHEMA,
    'Browser',
    'A11y',
    'Performance',
    'Visual',
    SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE,
    SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE
  ], 'SurfaceManager quality docs');
  context.assertIncludes(docsDe, SURFACE_MANAGER_QUALITY_GATES_SCHEMA, 'German SurfaceManager quality docs expose the contract schema');
  context.assertIncludes(docsMenu, 'surface-manager-quality-gates', 'Docs menu contains SurfaceManager quality page');
  context.assertIncludes(testsReadme, SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE, 'Tests README documents SurfaceManager quality gate');
  context.assertIncludes(browserReadme, SURFACE_MANAGER_QUALITY_GATES_LOCAL_GATE, 'Browser README documents SurfaceManager quality gate');
  context.assertIncludes(referenceRegistry, 'WP-SM-07', 'Reference registry contains WP-SM-07');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_QUALITY_BROWSER_FIXTURE, 'Reference registry contains SurfaceManager quality fixture');
  context.assertIncludes(referenceRegistry, SURFACE_MANAGER_QUALITY_VISUAL_BASELINE, 'Reference registry contains SurfaceManager quality baseline');
  context.assertIncludes(planningDoc, '`WP-SM-07` | P1 | completed', 'Planning doc marks WP-SM-07 completed');
  context.assertIncludes(planningDoc, '`WP-SM-08` | P2 | completed', 'Planning doc marks WP-SM-08 completed');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_QUALITY_GATES_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_QUALITY_GATES_WORKPACKAGE,
      requestedDomain,
      domains: QUALITY_DOMAINS.length,
      domainGates: DOMAIN_GATES.length,
      visualSnapshots: VISUAL_SNAPSHOT_IDS.length,
      a11yAssertions: A11Y_ASSERTIONS.length
    }
  });
}

function printSurfaceManagerQualityGatesReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Quality Gates erfolgreich.',
    failureTitle: 'SurfaceManager Quality Gates fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerQualityGatesReport,
  runSurfaceManagerQualityGatesSuite
};

if (require.main === module) {
  const result = runSurfaceManagerQualityGatesSuite();
  printSurfaceManagerQualityGatesReport(result);
  process.exit(result.ok ? 0 : 1);
}
