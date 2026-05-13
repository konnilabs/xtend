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
  SKELETON_LOADER_CONTRACT,
  STYLE_REGISTRY_CONTRACT,
  SURFACE_LOADING_EVENTS,
  SURFACE_LOADING_POLICIES,
  SURFACE_LOADING_POLICY_SCHEMA,
  SURFACE_LOADING_REPORT_SCHEMA,
  SURFACE_MANAGER_LAZY_LOADING_BACKLOG,
  SURFACE_MANAGER_LAZY_LOADING_DOCS,
  SURFACE_MANAGER_LAZY_LOADING_FIXTURE,
  SURFACE_MANAGER_LAZY_LOADING_LOCAL_GATE,
  SURFACE_MANAGER_LAZY_LOADING_MODULE,
  SURFACE_MANAGER_LAZY_LOADING_PACKAGE_SCRIPT,
  SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA,
  SURFACE_MANAGER_LAZY_LOADING_SCHEMA,
  SURFACE_MANAGER_LAZY_LOADING_STATUS,
  SURFACE_MANAGER_LAZY_LOADING_SUITE,
  SURFACE_MANAGER_LAZY_LOADING_TARGET,
  SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE,
  SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE_DOC,
  createSurfaceManagerLazyLoadingPlan,
  createSurfaceManagerLazyLoadingReport,
  validateSurfaceManagerLazyLoadingPlan
} = require('../../catalog/surface-manager-lazy-loading');

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

function runSurfaceManagerLazyHydrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-lazy-hydration',
    label: 'SurfaceManager shell-first lazy hydration'
  });
  const plan = createSurfaceManagerLazyLoadingPlan({ rootDir });
  const validation = validateSurfaceManagerLazyLoadingPlan(plan);
  const report = createSurfaceManagerLazyLoadingReport({ rootDir, plan });
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const managerTypes = readText('components/xsurfacemanager.d.ts', rootDir);
  const loaderRuntime = readText('xtend-loader.js', rootDir);
  const fixture = readText(SURFACE_MANAGER_LAZY_LOADING_FIXTURE, rootDir);
  const docs = readText(SURFACE_MANAGER_LAZY_LOADING_DOCS, rootDir);
  const backlog = readText(SURFACE_MANAGER_LAZY_LOADING_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE_DOC, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerLazyLoading;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const rmtCore = readText('xtendrmt/rmt-core.esm.js', rootDir);
  const rmtRuntime = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const rmtBrowser = readText('xtendrmt/rmt-runtime.browser.js', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as surface lazy hydration artifact`);
  });

  [
    SURFACE_MANAGER_LAZY_LOADING_MODULE,
    SURFACE_MANAGER_LAZY_LOADING_SUITE,
    'components/xsurfacemanager.js',
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_LAZY_LOADING_SCHEMA, 'Surface lazy hydration schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA, 'Surface lazy hydration report schema is stable');
  context.assert(plan.loadingPolicySchema === SURFACE_LOADING_POLICY_SCHEMA, 'Surface loading policy schema is stable');
  context.assert(plan.loadingReportSchema === SURFACE_LOADING_REPORT_SCHEMA, 'Surface loading report schema is stable');
  context.assert(plan.skeletonLoaderContract === SKELETON_LOADER_CONTRACT, 'SkeletonLoader contract is referenced');
  context.assert(plan.styleRegistryContract === STYLE_REGISTRY_CONTRACT, 'StyleRegistry contract is referenced');
  context.assert(plan.workpackage === SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE, 'Surface lazy hydration belongs to WP-SM-13');
  context.assert(plan.status === SURFACE_MANAGER_LAZY_LOADING_STATUS, 'Surface lazy hydration status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_LAZY_LOADING_TARGET, 'Surface lazy hydration target readiness is stable');
  context.assert(plan.runtimeBoundary.shellFirst === true, 'Shell-first boundary is explicit');
  context.assert(plan.runtimeBoundary.usesXTendLoader === true, 'Lazy hydration uses XTendLoader');
  context.assert(plan.runtimeBoundary.usesSkeletonLoader === true, 'Lazy hydration uses SkeletonLoader');
  context.assert(plan.runtimeBoundary.usesStyleRegistry === true, 'Lazy hydration uses StyleRegistry');
  context.assert(plan.runtimeBoundary.protectsUnstyledContent === true, 'Unstyled content protection is explicit');
  context.assert(plan.runtimeBoundary.keepsSkeletonOnHydrationFailure === true, 'Skeleton stays active on hydration failure');
  context.assert(plan.runtimeBoundary.docsAppMonkeypatch === false, 'Docs app monkeypatch stays disallowed');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Lazy hydration creates no second registry');
  context.assert(validation.ok === true, 'Surface lazy hydration plan validates');
  context.assert(report.ok === true, 'Surface lazy hydration report validates');
  assertIncludesAll(context, plan.policies, SURFACE_LOADING_POLICIES, 'Surface loading policies');
  assertIncludesAll(context, plan.managerMethods, MANAGER_METHODS, 'Surface loading manager methods');
  assertIncludesAll(context, plan.events, SURFACE_LOADING_EVENTS, 'Surface loading events');

  assertTextIncludesAll(context, loaderRuntime, [
    "const SKELETON_LOADER_CONTRACT = 'xtend.loader.skeleton-loader.v1'",
    "const STYLE_REGISTRY_CONTRACT = 'xtend.loader.style-registry.v1'",
    'window.XTendStyleRegistry = XTendStyleRegistry',
    'window.XTendSkeletonLoader = SkeletonLoader',
    'showSkeleton',
    'hideSkeleton',
    'ensureComponent',
    'hydrateTree'
  ], 'XTend Loader framework-native skeleton and hydration APIs');

  assertTextIncludesAll(context, managerRuntime, [
    "const SURFACE_LOADING_POLICY_SCHEMA = 'xtend.surface.loading-policy.v1'",
    "const SURFACE_LOADING_REPORT_SCHEMA = 'xtend.surface.loading-report.v1'",
    'surface-loading-policy',
    'surface-skeleton',
    'surface-hydration-timeout',
    'snapshotSurfaceLoading()',
    'hydrateSurfaceContent(surfaceRef, options = {})',
    '_showSurfaceSkeleton',
    '_runSurfaceHydration',
    'surfaceLoaderApi',
    'ensureRuntimeStyles',
    'showSkeleton',
    'ensureComponent',
    'hydrateTree',
    'data-xtend-surface-content-ready',
    'data-xtend-surface-skeleton',
    'surface-content-loading',
    'surface-content-hydrated',
    'surface-content-hydration-error',
    'requestIdleCallback',
    'xtend-route-changed'
  ], 'x-surface-manager lazy hydration runtime');
  assertTextIncludesAll(context, managerRuntime, SURFACE_LOADING_POLICIES, 'x-surface-manager runtime policy strings');

  assertTextIncludesAll(context, managerTypes, [
    'XSurfaceManagerLoadingPolicy',
    'XSurfaceManagerLoadingSnapshot',
    'XSurfaceManagerLoadingResult',
    'surface-loading-policy',
    'surface-hydration-timeout',
    'snapshotSurfaceLoading',
    'hydrateSurfaceContent',
    'surface-content-hydrated'
  ], 'x-surface-manager lazy hydration public types');

  [rmtCore, rmtRuntime, rmtBrowser].forEach((artifact, index) => {
    assertTextIncludesAll(context, artifact, [
      'resolveSurfaceHydrationPolicy',
      'data-surface-hydration-policy',
      "['eager', 'visible', 'open', 'idle', 'route']"
    ], `RMT materialization artifact ${index + 1}`);
  });

  assertTextIncludesAll(context, fixture, [
    '<script src="/xtend-loader.js"></script>',
    'surface-loading-policy="open"',
    'surface-skeleton="block"',
    'surface-hydration-timeout="5000"',
    'data-surface-hydration-policy="open"',
    'data-surface-hydration-policy="idle"',
    'data-surface-hydration-policy="route"',
    'data-xtend-parsedown-container="true"',
    'data-remote-capable-content-slot="true"',
    'manager.snapshotSurfaceLoading',
    'manager.hydrateSurfaceContent',
    'xtend-route-changed',
    '__xtendComponentResult'
  ], 'Surface lazy hydration fixture');

  assertTextIncludesAll(context, docs, [
    '# SurfaceManager Lazy Hydration',
    SURFACE_LOADING_POLICY_SCHEMA,
    'SkeletonLoader',
    'XTendLoader.ensureComponent',
    'hydrateTree',
    'Parsedown',
    'kein Monkeypatch'
  ], 'Surface lazy hydration docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_LAZY_LOADING_SCHEMA, 'Package metadata exposes surface lazy hydration schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_LAZY_LOADING_LOCAL_GATE, 'Package metadata exposes surface lazy hydration gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_LAZY_LOADING_PACKAGE_SCRIPT, 'Package metadata exposes surface lazy hydration package script');
  context.assert(metadata && metadata.shellFirst === true, 'Package metadata marks shell-first');
  context.assert(metadata && metadata.docsAppMonkeypatch === false, 'Package metadata keeps docs app monkeypatch false');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-lazy-hydration'] === 'node scripts/run_xtend_tests.js surface-lazy-hydration', 'Package script test:surface-lazy-hydration exists');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_lazy_hydration_suite')", 'Runner imports surface lazy hydration suite');
  context.assertIncludes(runner, "id: 'surface-lazy-hydration'", 'Runner registers surface lazy hydration suite');

  assertTextIncludesAll(context, backlog, [
    '`WP-SM-13` | P0 | completed',
    'Shell-first Lazy Surface Loading mit Skeleton-Hydration bauen',
    '`WP-SM-14`'
  ], 'Surface lazy hydration backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_LAZY_LOADING_SCHEMA,
    SURFACE_LOADING_POLICY_SCHEMA,
    SURFACE_MANAGER_LAZY_LOADING_LOCAL_GATE,
    'no-second-surface-registry',
    'kein ungestylter Content'
  ], 'Surface lazy hydration workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_LAZY_LOADING_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_LAZY_LOADING_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_LAZY_LOADING_TARGET,
      policies: SURFACE_LOADING_POLICIES.length,
      methods: MANAGER_METHODS.length,
      events: SURFACE_LOADING_EVENTS.length
    }
  });
}

function printSurfaceManagerLazyHydrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Lazy Hydration erfolgreich.',
    failureTitle: 'SurfaceManager Lazy Hydration fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerLazyHydrationReport,
  runSurfaceManagerLazyHydrationSuite
};

if (require.main === module) {
  const result = runSurfaceManagerLazyHydrationSuite();
  printSurfaceManagerLazyHydrationReport(result);
  process.exit(result.ok ? 0 : 1);
}
