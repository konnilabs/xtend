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
  MANAGER_METHODS,
  REQUIRED_ARTIFACTS,
  ROUTE_LIFECYCLE_EVENTS,
  ROUTE_LIFECYCLE_POLICIES,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_BACKLOG,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_DOCS,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_FIXTURE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_LOCAL_GATE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_MODULE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_SUITE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE,
  SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE_DOC,
  XROUTER_ROUTE_CONTRACT,
  createSurfaceManagerRouteLifecyclePlan,
  createSurfaceManagerRouteLifecycleReport,
  validateSurfaceManagerRouteLifecyclePlan
} = require('../../catalog/surface-manager-route-lifecycle');

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

function runSurfaceManagerRouteLifecycleSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-route-lifecycle',
    label: 'SurfaceManager XRouter-bound lifecycle'
  });
  const plan = createSurfaceManagerRouteLifecyclePlan({ rootDir });
  const validation = validateSurfaceManagerRouteLifecyclePlan(plan);
  const report = createSurfaceManagerRouteLifecycleReport({ rootDir, plan });
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const managerTypes = readText('components/xsurfacemanager.d.ts', rootDir);
  const sidePanelRuntime = readText('components/xsidepanel.js', rootDir);
  const xrouterRuntime = readText('components/xrouter.js', rootDir);
  const fixture = readText(SURFACE_MANAGER_ROUTE_LIFECYCLE_FIXTURE, rootDir);
  const docs = readText(SURFACE_MANAGER_ROUTE_LIFECYCLE_DOCS, rootDir);
  const backlog = readText(SURFACE_MANAGER_ROUTE_LIFECYCLE_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE_DOC, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerRouteLifecycle;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const rmtCore = readText('xtendrmt/rmt-core.esm.js', rootDir);
  const rmtRuntime = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const rmtBrowser = readText('xtendrmt/rmt-runtime.browser.js', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as surface route lifecycle artifact`);
  });

  [
    SURFACE_MANAGER_ROUTE_LIFECYCLE_MODULE,
    SURFACE_MANAGER_ROUTE_LIFECYCLE_SUITE,
    'components/xsurfacemanager.js',
    'components/xsidepanel.js',
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA, 'Surface route lifecycle schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA, 'Surface route lifecycle report schema is stable');
  context.assert(plan.xrouterRouteContract === XROUTER_ROUTE_CONTRACT, 'XRouter contract is referenced');
  context.assert(plan.workpackage === SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE, 'Surface route lifecycle belongs to WP-SM-14');
  context.assert(plan.status === SURFACE_MANAGER_ROUTE_LIFECYCLE_STATUS, 'Surface route lifecycle status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET, 'Surface route lifecycle target readiness is stable');
  context.assert(plan.runtimeBoundary.routeAwareManagerOwnedLifecycle === true, 'Route-aware lifecycle is manager-owned');
  context.assert(plan.runtimeBoundary.xrouterOwnsRouteState === true, 'XRouter remains route state owner');
  context.assert(plan.runtimeBoundary.surfaceManagerOwnsSurfaceLifecycle === true, 'SurfaceManager owns surface lifecycle');
  context.assert(plan.runtimeBoundary.globalSurfacesStayStable === true, 'Global surfaces stay stable');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Route lifecycle creates no second registry');
  context.assert(validation.ok === true, 'Surface route lifecycle plan validates');
  context.assert(report.ok === true, 'Surface route lifecycle report validates');
  assertIncludesAll(context, plan.policies, ROUTE_LIFECYCLE_POLICIES, 'Route lifecycle policies');
  assertIncludesAll(context, plan.managerMethods, MANAGER_METHODS, 'Route lifecycle manager methods');
  assertIncludesAll(context, plan.events, ROUTE_LIFECYCLE_EVENTS, 'Route lifecycle events');

  assertTextIncludesAll(context, xrouterRuntime, [
    'route-changed',
    'routechange',
    'xrouter-after-navigate',
    "stateKey: 'xtend.router.current'",
    'xtendState.set',
    'xtend.router.current'
  ], 'XRouter route-state source');

  assertTextIncludesAll(context, managerRuntime, [
    "const SURFACE_ROUTE_LIFECYCLE_SCHEMA = 'xtend.surface.route-lifecycle.v1'",
    "const SURFACE_ROUTE_LIFECYCLE_REPORT_SCHEMA = 'xtend.surface.route-lifecycle-report.v1'",
    'route-lifecycle-policy',
    'snapshotRouteLifecycle()',
    'applyRouteLifecycle(routeInput = null, options = {})',
    '_normalizeRouteLifecycleInput',
    '_surfaceRouteMatches',
    '_applyMatchedSurfaceRouteLifecycle',
    '_applyUnmatchedSurfaceRouteLifecycle',
    'surface-route-lifecycle-applied',
    'surface-route-lifecycle-skipped',
    'xrouter-after-navigate',
    'route-changed',
    'data-surface-route',
    'data-surface-route-policy',
    "hydrateSurfaceContent(record.id, { policy: 'route'",
    'controllerRemainsRegistryTruth: true',
    'xrouterOwnsRouteState: true',
    'createsSecondRegistry: false'
  ], 'x-surface-manager route lifecycle runtime');
  assertTextIncludesAll(context, managerRuntime, ROUTE_LIFECYCLE_POLICIES, 'x-surface-manager route lifecycle policy strings');

  assertTextIncludesAll(context, managerTypes, [
    'XSurfaceManagerRouteLifecyclePolicy',
    'XSurfaceManagerRouteLifecycleSnapshot',
    'XSurfaceManagerRouteLifecycleResult',
    'route-lifecycle-policy',
    'snapshotRouteLifecycle',
    'applyRouteLifecycle',
    'surface-route-lifecycle-applied'
  ], 'x-surface-manager route lifecycle public types');

  assertTextIncludesAll(context, sidePanelRuntime, [
    'this.surfaceManager && typeof this.surfaceManager.applyRouteLifecycle ===',
    "closePanel('route-change')",
    "this._command('collapse')"
  ], 'x-side-panel delegates route lifecycle to manager when managed');

  [rmtCore, rmtRuntime, rmtBrowser].forEach((artifact, index) => {
    assertTextIncludesAll(context, artifact, [
      'resolveSurfaceRouteLifecyclePolicy',
      'data-surface-route',
      'data-surface-route-policy',
      "['global', 'open-close', 'open-collapse', 'open-minimize', 'open-keep', 'hydrate-only', 'manual']",
      "surface.route ? 'route' : null"
    ], `RMT route lifecycle materialization artifact ${index + 1}`);
  });

  assertTextIncludesAll(context, fixture, [
    '<x-router',
    'route-aware="true"',
    'route-lifecycle-policy="open-close"',
    'data-surface-route="workbench"',
    'data-surface-route-policy="open-close"',
    'data-surface-route="settings"',
    'data-surface-route-policy="open-collapse"',
    'data-surface-route-policy="global"',
    'data-surface-route-persistent="true"',
    'manager.applyRouteLifecycle',
    'manager.snapshotRouteLifecycle',
    '__xtendComponentResult'
  ], 'Surface route lifecycle fixture');

  assertTextIncludesAll(context, docs, [
    '# SurfaceManager Route Lifecycle',
    SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA,
    'route-aware',
    'XRouter bleibt Route-State-Quelle',
    'SurfaceManager bleibt Lifecycle-Quelle',
    'globale Surfaces',
    'keine konkurrierenden Lifecycle-Quellen'
  ], 'Surface route lifecycle docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA, 'Package metadata exposes surface route lifecycle schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_ROUTE_LIFECYCLE_LOCAL_GATE, 'Package metadata exposes surface route lifecycle gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_ROUTE_LIFECYCLE_PACKAGE_SCRIPT, 'Package metadata exposes surface route lifecycle package script');
  context.assert(metadata && metadata.xrouterOwnsRouteState === true, 'Package metadata keeps XRouter as route owner');
  context.assert(metadata && metadata.surfaceManagerOwnsSurfaceLifecycle === true, 'Package metadata keeps SurfaceManager as lifecycle owner');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-route-lifecycle'] === 'node scripts/run_xtend_tests.js surface-route-lifecycle', 'Package script test:surface-route-lifecycle exists');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_route_lifecycle_suite')", 'Runner imports surface route lifecycle suite');
  context.assertIncludes(runner, "id: 'surface-route-lifecycle'", 'Runner registers surface route lifecycle suite');

  assertTextIncludesAll(context, backlog, [
    '`WP-SM-14` | P1 | completed',
    'XRouter-gebundene Surface Lifecycles definieren und umsetzen',
    '`WP-SM-15`'
  ], 'Surface route lifecycle backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_ROUTE_LIFECYCLE_SCHEMA,
    SURFACE_MANAGER_ROUTE_LIFECYCLE_LOCAL_GATE,
    'no-second-surface-registry',
    'Router und SurfaceManager besitzen keine konkurrierenden Lifecycle-Quellen'
  ], 'Surface route lifecycle workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_ROUTE_LIFECYCLE_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_ROUTE_LIFECYCLE_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_ROUTE_LIFECYCLE_TARGET,
      policies: ROUTE_LIFECYCLE_POLICIES.length,
      methods: MANAGER_METHODS.length,
      events: ROUTE_LIFECYCLE_EVENTS.length
    }
  });
}

function printSurfaceManagerRouteLifecycleReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Route Lifecycle erfolgreich.',
    failureTitle: 'SurfaceManager Route Lifecycle fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerRouteLifecycleReport,
  runSurfaceManagerRouteLifecycleSuite
};

if (require.main === module) {
  const result = runSurfaceManagerRouteLifecycleSuite();
  printSurfaceManagerRouteLifecycleReport(result);
  process.exit(result.ok ? 0 : 1);
}
