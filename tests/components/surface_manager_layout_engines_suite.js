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
  LAYOUT_ENGINES,
  LAYOUT_ENGINE_EVENTS,
  MANAGER_METHODS,
  REQUIRED_ARTIFACTS,
  SURFACE_MANAGER_LAYOUT_ENGINE_BACKLOG,
  SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA,
  SURFACE_MANAGER_LAYOUT_ENGINE_DOCS,
  SURFACE_MANAGER_LAYOUT_ENGINE_FIXTURE,
  SURFACE_MANAGER_LAYOUT_ENGINE_LOCAL_GATE,
  SURFACE_MANAGER_LAYOUT_ENGINE_MODULE,
  SURFACE_MANAGER_LAYOUT_ENGINE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA,
  SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA,
  SURFACE_MANAGER_LAYOUT_ENGINE_STATUS,
  SURFACE_MANAGER_LAYOUT_ENGINE_SUITE,
  SURFACE_MANAGER_LAYOUT_ENGINE_TARGET,
  SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE,
  SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE_DOC,
  createSurfaceManagerLayoutEnginesPlan,
  createSurfaceManagerLayoutEnginesReport,
  validateSurfaceManagerLayoutEnginesPlan
} = require('../../catalog/surface-manager-layout-engines');

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

function runSurfaceManagerLayoutEnginesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-layout-engines',
    label: 'SurfaceManager docking split tile layout engines'
  });
  const plan = createSurfaceManagerLayoutEnginesPlan({ rootDir });
  const validation = validateSurfaceManagerLayoutEnginesPlan(plan);
  const report = createSurfaceManagerLayoutEnginesReport({ rootDir, plan });
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const managerTypes = readText('components/xsurfacemanager.d.ts', rootDir);
  const sidePanelRuntime = readText('components/xsidepanel.js', rootDir);
  const sidePanelTypes = readText('components/xsidepanel.d.ts', rootDir);
  const windowRuntime = readText('components/xsurfacewindow.js', rootDir);
  const fixture = readText(SURFACE_MANAGER_LAYOUT_ENGINE_FIXTURE, rootDir);
  const docs = readText(SURFACE_MANAGER_LAYOUT_ENGINE_DOCS, rootDir);
  const backlog = readText(SURFACE_MANAGER_LAYOUT_ENGINE_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE_DOC, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerLayoutEngines;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as surface layout engine artifact`);
  });

  [
    SURFACE_MANAGER_LAYOUT_ENGINE_MODULE,
    SURFACE_MANAGER_LAYOUT_ENGINE_SUITE,
    'components/xsurfacemanager.js',
    'components/xsurfacewindow.js',
    'components/xsidepanel.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA, 'Surface layout engine schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA, 'Surface layout engine report schema is stable');
  context.assert(plan.diagnosticSchema === SURFACE_MANAGER_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA, 'Surface layout engine diagnostic schema is stable');
  context.assert(plan.workpackage === SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE, 'Surface layout engine belongs to WP-SM-16');
  context.assert(plan.status === SURFACE_MANAGER_LAYOUT_ENGINE_STATUS, 'Surface layout engine status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_LAYOUT_ENGINE_TARGET, 'Surface layout engine target readiness is stable');
  context.assert(plan.runtimeBoundary.managerOwnsLayoutPolicy === true, 'Manager owns layout policy');
  context.assert(plan.runtimeBoundary.controllerOwnsRegistry === true, 'Controller remains registry owner');
  context.assert(plan.runtimeBoundary.snapshotCompatibleBounds === true, 'Layout bounds are snapshot compatible');
  context.assert(plan.runtimeBoundary.visibleDockingRuntime === true, 'Docking is visible runtime behavior');
  context.assert(plan.runtimeBoundary.stackedResponsiveFallback === true, 'Stacked responsive fallback is explicit');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Layout engine creates no second registry');
  context.assert(validation.ok === true, 'Surface layout engine plan validates');
  context.assert(report.ok === true, 'Surface layout engine report validates');
  assertIncludesAll(context, plan.layoutEngines, LAYOUT_ENGINES, 'Surface layout engines');
  assertIncludesAll(context, plan.managerMethods, MANAGER_METHODS, 'Surface layout engine manager methods');
  assertIncludesAll(context, plan.events, LAYOUT_ENGINE_EVENTS, 'Surface layout engine events');

  assertTextIncludesAll(context, managerRuntime, [
    "const SURFACE_LAYOUT_ENGINE_SCHEMA = 'xtend.surface.layout-engine.v1'",
    "const SURFACE_LAYOUT_ENGINE_REPORT_SCHEMA = 'xtend.surface.layout-engine-report.v1'",
    "const SURFACE_LAYOUT_ENGINE_DIAGNOSTIC_SCHEMA = 'xtend.surface.layout-engine-diagnostic.v1'",
    "Object.freeze(['freeform', 'docked', 'split', 'tile', 'stacked'])",
    'layout-engine',
    'surface-layout-gap',
    'surface-layout-snap',
    'snapshotSurfaceLayout()',
    'applyLayoutEngine(engine = this._layoutEngine(), options = {})',
    'undockSurface(id, bounds = {})',
    '_createSurfaceLayoutModel',
    '_applyLayoutEngineSnapshot',
    '_layoutRecordsInArea',
    '_applyDockedSurfaceLayout',
    '_createFreeformLayoutEntries',
    'data-surface-layout-engine',
    'data-surface-layout-zone',
    '--surface-layout-x',
    '--surface-layout-width',
    'surface-layout-engine-applied',
    'xtend.surface.layoutEngine',
    'snapshotCompatible: true',
    'controllerRemainsRegistryTruth: true',
    'createsSecondRegistry: false'
  ], 'x-surface-manager layout engine runtime');
  assertTextIncludesAll(context, managerRuntime, LAYOUT_ENGINES, 'x-surface-manager layout engine strings');

  assertTextIncludesAll(context, managerTypes, [
    'XSurfaceManagerLayoutEngine',
    'XSurfaceManagerLayoutEngineSnapshot',
    'XSurfaceManagerLayoutEngineResult',
    'layoutEngineSnapshot',
    'snapshotSurfaceLayout',
    'applyLayoutEngine',
    'undockSurface',
    'surface-layout-engine-applied'
  ], 'x-surface-manager layout engine public types');

  assertTextIncludesAll(context, sidePanelRuntime, [
    ':host([mode="floating"])',
    '--surface-layout-x',
    '--surface-layout-y',
    "'floating'",
    "this.removeAttribute('placement')"
  ], 'x-side-panel supports floating undock layout');
  context.assertIncludes(sidePanelTypes, "'floating'", 'x-side-panel public types include floating mode');
  context.assertIncludes(windowRuntime, '--surface-window-x', 'x-surface-window keeps bounds-driven layout variables');

  assertTextIncludesAll(context, fixture, [
    'layout-engine="split"',
    'surface-layout-gap="12"',
    'surface-layout-snap="8"',
    '<x-surface-window',
    '<x-side-panel',
    "manager.applyLayoutEngine('tile'",
    "manager.dockSurface('inspector-panel'",
    "manager.undockSurface('inspector-panel'",
    'manager.snapshotSurfaceLayout',
    '__xtendComponentResult'
  ], 'Surface layout engine fixture');

  assertTextIncludesAll(context, docs, [
    '# SurfaceManager Layout Engines',
    SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA,
    'freeform',
    'docked',
    'split',
    'tile',
    'stacked',
    'Snapshot',
    'keine zweite Registry'
  ], 'Surface layout engine docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA, 'Package metadata exposes surface layout engine schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_LAYOUT_ENGINE_LOCAL_GATE, 'Package metadata exposes surface layout engine gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_LAYOUT_ENGINE_PACKAGE_SCRIPT, 'Package metadata exposes surface layout engine package script');
  context.assert(metadata && metadata.visibleDockingRuntime === true, 'Package metadata marks visible docking runtime');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-layout-engines'] === 'node scripts/run_xtend_tests.js surface-layout-engines', 'Package script test:surface-layout-engines exists');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_layout_engines_suite')", 'Runner imports surface layout engines suite');
  context.assertIncludes(runner, "id: 'surface-layout-engines'", 'Runner registers surface layout engines suite');

  assertTextIncludesAll(context, backlog, [
    '`WP-SM-16` | P1 | completed',
    'Docking, Split Panes, Tiling und weitere Layout Engines ergaenzen',
    '`WP-SM-17`'
  ], 'Surface layout engine backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_LAYOUT_ENGINE_SCHEMA,
    SURFACE_MANAGER_LAYOUT_ENGINE_LOCAL_GATE,
    'no-second-surface-registry',
    'Docking ist sichtbares Runtime-Verhalten'
  ], 'Surface layout engine workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_LAYOUT_ENGINE_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_LAYOUT_ENGINE_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_LAYOUT_ENGINE_TARGET,
      engines: LAYOUT_ENGINES.length,
      methods: MANAGER_METHODS.length,
      events: LAYOUT_ENGINE_EVENTS.length
    }
  });
}

function printSurfaceManagerLayoutEnginesReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Layout Engines erfolgreich.',
    failureTitle: 'SurfaceManager Layout Engines fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerLayoutEnginesReport,
  runSurfaceManagerLayoutEnginesSuite
};

if (require.main === module) {
  const result = runSurfaceManagerLayoutEnginesSuite();
  printSurfaceManagerLayoutEnginesReport(result);
  process.exit(result.ok ? 0 : 1);
}
