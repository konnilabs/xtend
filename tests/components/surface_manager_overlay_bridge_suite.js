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
  BRIDGE_EVENTS,
  COMPONENT_TAGS,
  KERNEL_BOUNDARY,
  LEGACY_EVENTS,
  LEGACY_STATE_KEYS,
  NEXT_DECISION,
  NEXT_WORKPACKAGE,
  OVERLAY_SURFACE_TYPES,
  REQUIRED_ARTIFACTS,
  REQUIRED_DOCS,
  RUNTIME_ARTIFACTS,
  SURFACE_CONTROLLER_SCHEMA,
  SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT,
  SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS,
  SURFACE_MANAGER_OVERLAY_BRIDGE_FIXTURE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_MODULE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_PACKAGE_SCRIPT,
  SURFACE_MANAGER_OVERLAY_BRIDGE_PLAN,
  SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA,
  SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA,
  SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS,
  SURFACE_MANAGER_OVERLAY_BRIDGE_SUITE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET,
  SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE,
  SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC,
  SURFACE_MANAGER_SCHEMA,
  SURFACE_RECORD_SCHEMA,
  SURFACE_SNAPSHOT_SCHEMA,
  createSurfaceManagerOverlayBridgePlan,
  createSurfaceManagerOverlayBridgeReport,
  validateSurfaceManagerOverlayBridgePlan
} = require('../../catalog/surface-manager-overlay-bridge');

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

function runSurfaceManagerOverlayBridgeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-overlay-bridge',
    label: 'SurfaceManager overlay stack bridge contract'
  });
  const plan = createSurfaceManagerOverlayBridgePlan({ rootDir });
  const validation = validateSurfaceManagerOverlayBridgePlan(plan);
  const report = createSurfaceManagerOverlayBridgeReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerOverlayBridge;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const bridgeRuntime = readText('components/xsurfaceoverlay-bridge.js', rootDir);
  const bridgeTypes = readText('components/xsurfaceoverlay-bridge.d.ts', rootDir);
  const managerRuntime = readText('components/xsurfacemanager.js', rootDir);
  const modalRuntime = readText('components/xmodal.js', rootDir);
  const dialogRuntime = readText('components/xdialog.js', rootDir);
  const drawerRuntime = readText('components/xdrawer.js', rootDir);
  const fixture = readText(SURFACE_MANAGER_OVERLAY_BRIDGE_FIXTURE, rootDir);
  const planningDoc = readText(SURFACE_MANAGER_OVERLAY_BRIDGE_PLAN, rootDir);
  const contractDoc = readText(SURFACE_MANAGER_OVERLAY_BRIDGE_CONTRACT, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE_DOC, rootDir);
  const docs = readText(SURFACE_MANAGER_OVERLAY_BRIDGE_DOCS, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const referenceRegistry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface overlay bridge artifact`);
  });
  REQUIRED_DOCS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as Surface overlay bridge doc`);
  });

  [
    SURFACE_MANAGER_OVERLAY_BRIDGE_MODULE,
    SURFACE_MANAGER_OVERLAY_BRIDGE_SUITE,
    'components/xsurfaceoverlay-bridge.js',
    'components/xsurfacemanager.js',
    'components/xmodal.js',
    'components/xdialog.js',
    'components/xdrawer.js'
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA, 'Surface overlay bridge schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA, 'Surface overlay bridge report schema is stable');
  context.assert(plan.surfaceManagerSchema === SURFACE_MANAGER_SCHEMA, 'Surface overlay bridge reuses manager schema');
  context.assert(plan.surfaceRecordSchema === SURFACE_RECORD_SCHEMA, 'Surface overlay bridge reuses record schema');
  context.assert(plan.surfaceControllerSchema === SURFACE_CONTROLLER_SCHEMA, 'Surface overlay bridge reuses controller schema');
  context.assert(plan.snapshotSchema === SURFACE_SNAPSHOT_SCHEMA, 'Surface overlay bridge reuses snapshot schema');
  context.assert(plan.workpackage === SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE, 'Surface overlay bridge belongs to WP-SM-06');
  context.assert(plan.status === SURFACE_MANAGER_OVERLAY_BRIDGE_STATUS, 'Surface overlay bridge status is accepted');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_OVERLAY_BRIDGE_TARGET, 'Surface overlay bridge target is ready');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Surface overlay bridge keeps kernel boundary');
  context.assert(plan.nextWorkpackage === NEXT_WORKPACKAGE, 'Surface overlay bridge hands off to WP-SM-07');
  context.assert(plan.nextDecision === NEXT_DECISION, 'Surface overlay bridge exposes next decision');
  context.assert(validation.ok === true, 'Surface overlay bridge plan validates');
  context.assert(report.ok === true, 'Surface overlay bridge report validates');
  assertIncludesAll(context, plan.runtimeArtifacts, RUNTIME_ARTIFACTS, 'Surface overlay bridge runtime artifacts');
  assertIncludesAll(context, plan.componentTags, COMPONENT_TAGS, 'Surface overlay bridge component tags');
  assertIncludesAll(context, plan.overlaySurfaceTypes, OVERLAY_SURFACE_TYPES, 'Surface overlay bridge surface types');
  assertIncludesAll(context, plan.legacyEvents, LEGACY_EVENTS, 'Surface overlay bridge legacy events');
  assertIncludesAll(context, plan.bridgeEvents, BRIDGE_EVENTS, 'Surface overlay bridge events');
  assertIncludesAll(context, plan.legacyStateKeys, LEGACY_STATE_KEYS, 'Surface overlay bridge state keys');

  assertTextIncludesAll(context, bridgeRuntime, [
    "const SURFACE_OVERLAY_SELECTOR = 'x-modal, x-dialog, x-drawer'",
    "const SURFACE_OVERLAY_BRIDGE_SCHEMA = 'xtend.surface.overlay-stack-bridge.v1'",
    'toOverlaySurfaceRecord(element, managerId =',
    'applyOverlaySurfaceSnapshot(element, record = {})',
    'createOverlayCompatibilityProfile(element)',
    'legacyApiPreserved: true',
    "managerEvent: 'surface-overlay-command'",
    "surfaceRecordSchema: SURFACE_RECORD_SCHEMA",
    'OVERLAY_LIFECYCLE_EVENTS',
    'modal-opened',
    'dialog-opened',
    'drawer-opened',
    'no-rmt-kernel-import-of-xtend-types'
  ], 'xsurfaceoverlay-bridge runtime');

  assertTextIncludesAll(context, bridgeTypes, [
    'XtendSurfaceOverlayCompatibilityProfile',
    'xtend.surface.overlay-stack-bridge.v1',
    'surface-overlay-command',
    'toOverlaySurfaceRecord',
    'applyOverlaySurfaceSnapshot',
    'x-modal',
    'x-dialog',
    'x-drawer'
  ], 'xsurfaceoverlay-bridge types');

  assertTextIncludesAll(context, managerRuntime, [
    "from './xsurfaceoverlay-bridge.js'",
    'SURFACE_MANAGED_ELEMENT_SELECTOR',
    'x-surface-window, x-side-panel',
    'SURFACE_OVERLAY_SELECTOR',
    'surface-overlay-command',
    'OVERLAY_LIFECYCLE_EVENTS',
    'findSurfaceOverlayElement(event)',
    'toOverlaySurfaceRecord(element, this._managerId())',
    'applyOverlaySurfaceSnapshot(element, record)',
    '_syncingOverlayElements',
    'drawer-route-selected',
    'xtend.surface.overlay-stack-bridge.v1'
  ], 'x-surface-manager overlay bridge');

  [modalRuntime, dialogRuntime, drawerRuntime].forEach((runtime, index) => {
    const tag = COMPONENT_TAGS[index + 1];
    assertTextIncludesAll(context, runtime, [
      'xtendSurfaceOverlayCompatibilityProfile',
      SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA,
      `componentRef: '${tag}'`,
      "managerSlot: 'overlays'",
      "managerEvent: 'surface-overlay-command'",
      "legacyApiPreserved: true",
      "bridgeModule: 'components/xsurfaceoverlay-bridge.js'",
      'var(--surface-overlay-z'
    ], `${tag} compatibility profile`);
  });
  context.assertIncludes(drawerRuntime, 'var(--surface-overlay-backdrop-z', 'x-drawer receives backdrop z-index variable');

  assertTextIncludesAll(context, fixture, [
    '<x-surface-manager',
    'slot="overlays"',
    '<x-modal',
    '<x-dialog',
    '<x-drawer',
    'surface-overlay-command',
    'surface-id="overlay.modal"',
    'surface-id="overlay.dialog"',
    'surface-id="overlay.drawer"',
    '__xtendComponentResult'
  ], 'Surface overlay bridge fixture');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de'), 'Surface overlay bridge fixture has no CDN dependency');

  assertTextIncludesAll(context, contractDoc, [
    SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA,
    'xsurfaceoverlay-bridge.js',
    'surface-overlay-command',
    'legacyApiPreserved',
    'modal-open-<id>',
    'dialog-open-<id>',
    'xdrawer-open-<id>',
    KERNEL_BOUNDARY
  ], 'Surface overlay bridge contract doc');
  assertTextIncludesAll(context, workpackageDoc, [
    SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE,
    SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE,
    'Done Criteria',
    'WP-SM-07'
  ], 'Surface overlay bridge workpackage doc');
  assertTextIncludesAll(context, docs, [
    SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA,
    'x-modal',
    'x-dialog',
    'x-drawer',
    'surface-overlay-command',
    'Surface Stack',
    SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE
  ], 'Surface overlay bridge docs');

  context.assert(metadata && metadata.schema === SURFACE_MANAGER_OVERLAY_BRIDGE_SCHEMA, 'Package metadata exposes Surface overlay bridge schema');
  context.assert(metadata && metadata.reportSchema === SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA, 'Package metadata exposes Surface overlay bridge report schema');
  context.assert(metadata && metadata.workpackage === SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE, 'Package metadata exposes WP-SM-06');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE, 'Package metadata exposes Surface overlay bridge local gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_OVERLAY_BRIDGE_PACKAGE_SCRIPT, 'Package metadata exposes Surface overlay bridge package script');
  context.assert(metadata && Array.isArray(metadata.componentTags) && metadata.componentTags.includes('x-modal'), 'Package metadata exposes x-modal tag');
  context.assert(metadata && metadata.nextWorkpackage === NEXT_WORKPACKAGE, 'Package metadata exposes WP-SM-07 handoff');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-overlay-bridge'] === 'node scripts/run_xtend_tests.js surface-overlay-bridge', 'Package script test:surface-overlay-bridge exists');
  context.assertIncludes(scaffoldConfig, 'surfaceManagerOverlayBridge', 'Scaffold config exposes surfaceManagerOverlayBridge');
  context.assertIncludes(scaffoldConfig, 'components/xsurfaceoverlay-bridge.js', 'Scaffold config references Surface overlay bridge runtime');
  context.assertIncludes(scaffoldConfig, SURFACE_MANAGER_OVERLAY_BRIDGE_LOCAL_GATE, 'Scaffold config references Surface overlay bridge local gate');
  context.assertIncludes(runner, "require('../tests/components/surface_manager_overlay_bridge_suite')", 'Runner imports Surface overlay bridge suite');
  context.assertIncludes(runner, "id: 'surface-overlay-bridge'", 'Runner registers surface-overlay-bridge suite');
  context.assertIncludes(docsReadme, 'SurfaceManager Overlay Bridge', 'Docs README links Surface overlay bridge');
  context.assertIncludes(docsMenu, 'surface-manager-overlay-bridge', 'Docs menu contains Surface overlay bridge page');
  context.assertIncludes(referenceRegistry, 'WP-SM-06', 'Reference registry contains WP-SM-06');
  context.assertIncludes(referenceRegistry, 'components/xsurfaceoverlay-bridge.js', 'Reference registry contains Surface overlay bridge runtime');
  context.assertIncludes(planningDoc, '`WP-SM-06` | P1 | completed', 'Planning doc marks WP-SM-06 completed');
  context.assertIncludes(planningDoc, '`WP-SM-07` | P1 | completed', 'Planning doc marks WP-SM-07 completed');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_OVERLAY_BRIDGE_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_OVERLAY_BRIDGE_WORKPACKAGE,
      runtimeArtifacts: RUNTIME_ARTIFACTS.length,
      componentTags: COMPONENT_TAGS.length,
      legacyEvents: LEGACY_EVENTS.length,
      overlaySurfaceTypes: OVERLAY_SURFACE_TYPES.length
    }
  });
}

function printSurfaceManagerOverlayBridgeReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Overlay Stack Bridge erfolgreich.',
    failureTitle: 'SurfaceManager Overlay Stack Bridge fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerOverlayBridgeReport,
  runSurfaceManagerOverlayBridgeSuite
};

if (require.main === module) {
  const result = runSurfaceManagerOverlayBridgeSuite();
  printSurfaceManagerOverlayBridgeReport(result);
  process.exit(result.ok ? 0 : 1);
}
