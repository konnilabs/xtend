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
  MODAL_POLICIES,
  REQUIRED_ARTIFACTS,
  STACK_POLICY_EVENTS,
  SURFACE_MANAGER_STACK_POLICY_BACKLOG,
  SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA,
  SURFACE_MANAGER_STACK_POLICY_DOCS,
  SURFACE_MANAGER_STACK_POLICY_FIXTURE,
  SURFACE_MANAGER_STACK_POLICY_LOCAL_GATE,
  SURFACE_MANAGER_STACK_POLICY_MODULE,
  SURFACE_MANAGER_STACK_POLICY_PACKAGE_SCRIPT,
  SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA,
  SURFACE_MANAGER_STACK_POLICY_SCHEMA,
  SURFACE_MANAGER_STACK_POLICY_STATUS,
  SURFACE_MANAGER_STACK_POLICY_SUITE,
  SURFACE_MANAGER_STACK_POLICY_TARGET,
  SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE,
  SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE_DOC,
  createSurfaceManagerStackPolicyPlan,
  createSurfaceManagerStackPolicyReport,
  validateSurfaceManagerStackPolicyPlan
} = require('../../catalog/surface-manager-stack-policy');

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

function runSurfaceManagerStackPolicySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-stack-policy',
    label: 'SurfaceManager modal focus inert stack policy'
  });
  const plan = createSurfaceManagerStackPolicyPlan({ rootDir });
  const validation = validateSurfaceManagerStackPolicyPlan(plan);
  const report = createSurfaceManagerStackPolicyReport({ rootDir, plan });
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const managerTypes = readText('components/xsurfacemanager.d.ts', rootDir);
  const windowRuntime = readText('components/xsurfacewindow.js', rootDir);
  const sidePanelRuntime = readText('components/xsidepanel.js', rootDir);
  const overlayBridge = readText('components/xsurfaceoverlay-bridge.js', rootDir);
  const modalRuntime = readText('components/xmodal.js', rootDir);
  const dialogRuntime = readText('components/xdialog.js', rootDir);
  const drawerRuntime = readText('components/xdrawer.js', rootDir);
  const fixture = readText(SURFACE_MANAGER_STACK_POLICY_FIXTURE, rootDir);
  const docs = readText(SURFACE_MANAGER_STACK_POLICY_DOCS, rootDir);
  const backlog = readText(SURFACE_MANAGER_STACK_POLICY_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE_DOC, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerStackPolicy;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as surface stack policy artifact`);
  });

  [
    SURFACE_MANAGER_STACK_POLICY_MODULE,
    SURFACE_MANAGER_STACK_POLICY_SUITE,
    'components/xsurfacemanager.js',
    'components/xsurfacewindow.js',
    'components/xsidepanel.js',
    'components/xsurfaceoverlay-bridge.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_STACK_POLICY_SCHEMA, 'Surface stack policy schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA, 'Surface stack policy report schema is stable');
  context.assert(plan.diagnosticSchema === SURFACE_MANAGER_STACK_POLICY_DIAGNOSTIC_SCHEMA, 'Surface stack policy diagnostic schema is stable');
  context.assert(plan.workpackage === SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE, 'Surface stack policy belongs to WP-SM-15');
  context.assert(plan.status === SURFACE_MANAGER_STACK_POLICY_STATUS, 'Surface stack policy status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_STACK_POLICY_TARGET, 'Surface stack policy target readiness is stable');
  context.assert(plan.runtimeBoundary.modalPolicyManagerOwned === true, 'Modal policy is manager-owned');
  context.assert(plan.runtimeBoundary.focusTrapAcrossSurfaces === true, 'Focus trap across surfaces is explicit');
  context.assert(plan.runtimeBoundary.focusRestoreAcrossSurfaces === true, 'Focus restore across surfaces is explicit');
  context.assert(plan.runtimeBoundary.inertBackgroundSurfaces === true, 'Background surfaces become inert');
  context.assert(plan.runtimeBoundary.topmostEscapePriority === true, 'Topmost Escape priority is explicit');
  context.assert(plan.runtimeBoundary.scrollLockForActiveModal === true, 'Scroll lock is part of stack policy');
  context.assert(plan.runtimeBoundary.overlayCompatibilityPreserved === true, 'Overlay compatibility is preserved');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Stack policy creates no second registry');
  context.assert(validation.ok === true, 'Surface stack policy plan validates');
  context.assert(report.ok === true, 'Surface stack policy report validates');
  assertIncludesAll(context, plan.modalPolicies, MODAL_POLICIES, 'Surface modal policies');
  assertIncludesAll(context, plan.managerMethods, MANAGER_METHODS, 'Surface stack policy manager methods');
  assertIncludesAll(context, plan.events, STACK_POLICY_EVENTS, 'Surface stack policy events');

  assertTextIncludesAll(context, managerRuntime, [
    "const SURFACE_STACK_POLICY_SCHEMA = 'xtend.surface.stack-policy.v1'",
    "const SURFACE_STACK_POLICY_REPORT_SCHEMA = 'xtend.surface.stack-policy-report.v1'",
    "const SURFACE_STACK_POLICY_DIAGNOSTIC_SCHEMA = 'xtend.surface.stack-policy-diagnostic.v1'",
    'modal-policy',
    'snapshotStackPolicy()',
    'applyStackPolicy(options = {})',
    '_applyStackPolicy',
    '_applySurfaceStackEntry',
    '_onSurfaceStackKeyDown',
    '_onSurfaceStackFocusIn',
    'document.addEventListener',
    "document.addEventListener('keydown'",
    "document.addEventListener('focusin'",
    'data-surface-inert',
    'data-surface-aria-hidden-by-manager',
    'data-surface-modal-active',
    'data-surface-focus-trap',
    'data-surface-layer-token',
    '--surface-layer-z',
    '--surface-overlay-z',
    'aria-hidden',
    'aria-modal',
    'inert',
    "event.key !== 'Escape'",
    'surface-stack-policy-applied',
    'surface-stack-policy-escape',
    'surface-stack-policy-focus-restored',
    'data-xtend-surface-scroll-lock',
    'controllerRemainsRegistryTruth: true',
    'overlayCompatibilityPreserved: true',
    'createsSecondRegistry: false'
  ], 'x-surface-manager stack policy runtime');
  assertTextIncludesAll(context, managerRuntime, MODAL_POLICIES, 'x-surface-manager modal policy strings');

  assertTextIncludesAll(context, managerTypes, [
    'XSurfaceManagerModalPolicy',
    'XSurfaceManagerStackPolicySnapshot',
    'XSurfaceManagerStackPolicyResult',
    'XSurfaceManagerStackPolicySurface',
    'stackPolicySnapshot',
    'snapshotStackPolicy',
    'applyStackPolicy',
    'surface-stack-policy-applied',
    'surface-stack-policy-escape'
  ], 'x-surface-manager stack policy public types');

  assertTextIncludesAll(context, windowRuntime, [
    "windowSurface.setAttribute('aria-modal', record.modal ? 'true' : 'false')",
    'role="dialog"',
    'surface-window-command'
  ], 'x-surface-window accepts manager-owned modal state');

  assertTextIncludesAll(context, sidePanelRuntime, [
    "_panel.setAttribute('aria-modal'",
    "event.key === 'Escape'",
    'surface-panel-command'
  ], 'x-side-panel remains stack-compatible');

  assertTextIncludesAll(context, overlayBridge, [
    "const SURFACE_OVERLAY_SELECTOR = 'x-modal, x-dialog, x-drawer'",
    'applyOverlaySurfaceSnapshot',
    '--surface-overlay-z',
    'legacyApiPreserved: true'
  ], 'Overlay bridge remains compatible');

  [modalRuntime, dialogRuntime, drawerRuntime].forEach((source, index) => {
    assertTextIncludesAll(context, source, [
      "event.key === 'Escape'",
      'aria-modal',
      'focus'
    ], `Overlay component ${index + 1} keeps local keyboard and focus behavior`);
  });

  assertTextIncludesAll(context, fixture, [
    'modal-policy="topmost"',
    '<x-surface-window',
    '<x-side-panel',
    '<x-modal',
    '<x-dialog',
    '<x-drawer',
    'manager.snapshotStackPolicy',
    'manager.applyStackPolicy',
    "KeyboardEvent('keydown', { key: 'Escape'",
    '__xtendComponentResult'
  ], 'Surface stack policy fixture');

  assertTextIncludesAll(context, docs, [
    '# SurfaceManager Stack Policy',
    SURFACE_MANAGER_STACK_POLICY_SCHEMA,
    'modal-policy',
    'Focus Restore',
    'Inert',
    'Escape',
    'Scroll Lock',
    'keine zweite Registry'
  ], 'Surface stack policy docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_STACK_POLICY_SCHEMA, 'Package metadata exposes surface stack policy schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_STACK_POLICY_LOCAL_GATE, 'Package metadata exposes surface stack policy gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_STACK_POLICY_PACKAGE_SCRIPT, 'Package metadata exposes surface stack policy package script');
  context.assert(metadata && metadata.overlayCompatibilityPreserved === true, 'Package metadata preserves overlay compatibility');
  context.assert(metadata && metadata.createsSecondRegistry === false, 'Package metadata keeps no-second-registry boundary');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-stack-policy'] === 'node scripts/run_xtend_tests.js surface-stack-policy', 'Package script test:surface-stack-policy exists');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_stack_policy_suite')", 'Runner imports surface stack policy suite');
  context.assertIncludes(runner, "id: 'surface-stack-policy'", 'Runner registers surface stack policy suite');

  assertTextIncludesAll(context, backlog, [
    '`WP-SM-15` | P1 | completed',
    'Modal-, Focus-, Inert- und Mixed-Stack-Policy haerten',
    '`WP-SM-16`'
  ], 'Surface stack policy backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_STACK_POLICY_SCHEMA,
    SURFACE_MANAGER_STACK_POLICY_LOCAL_GATE,
    'no-second-surface-registry',
    'bestehende Overlay-Komponenten bleiben kompatibel'
  ], 'Surface stack policy workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_STACK_POLICY_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_STACK_POLICY_WORKPACKAGE,
      targetReadiness: SURFACE_MANAGER_STACK_POLICY_TARGET,
      modalPolicies: MODAL_POLICIES.length,
      methods: MANAGER_METHODS.length,
      events: STACK_POLICY_EVENTS.length
    }
  });
}

function printSurfaceManagerStackPolicyReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Stack Policy erfolgreich.',
    failureTitle: 'SurfaceManager Stack Policy fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerStackPolicyReport,
  runSurfaceManagerStackPolicySuite
};

if (require.main === module) {
  const result = runSurfaceManagerStackPolicySuite();
  printSurfaceManagerStackPolicyReport(result);
  process.exit(result.ok ? 0 : 1);
}
