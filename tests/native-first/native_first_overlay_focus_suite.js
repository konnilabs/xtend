const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');

const SUITE_ID = 'native-first-overlay-focus';
const SUITE_LABEL = 'Native-First Overlay Focus Hardening';
const CONTRACT_SCHEMA = 'xtend.native-first.overlay-focus-hardening.v1';
const MATRIX_SCHEMA = 'xtend.native-first.overlay-focus-hardening-matrix.v1';
const REPORT_SCHEMA = 'xtend.native-first.overlay-focus-hardening-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-overlay-focus --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-overlay-focus';

const REQUIRED_COMPONENTS = Object.freeze([
  'x-modal',
  'x-dialog',
  'x-popover',
  'x-tooltip',
  'x-drawer',
  'x-side-panel',
  'x-lightbox',
  'x-surface-manager',
  'x-surface-portal',
  'x-surface-window',
  'x-surface-region'
]);

const REQUIRED_RADAR_REFS = Object.freeze([
  'NFM-BPR-005',
  'NFM-BPR-006',
  'NFM-BPR-007',
  'NFM-BPR-008',
  'NFM-BPR-013',
  'NFM-BPR-020'
]);

const REQUIRED_GATES = Object.freeze([
  'overlay-interaction-ux',
  'surface-overlay-bridge',
  'surface-stack-policy',
  'surface-manager-quality',
  'references',
  'supply-chain'
]);

function assertIncludesAll(context, content, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(content, entry, `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runNativeFirstOverlayFocusSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Overlay-Focus-Hardening-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Overlay-Focus-Hardening-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-07-Owned-Overlay-Dialog-Popover-und-Focus-Primitives-haerten.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const capabilityMatrix = readText('development/XTend-Native-First-UI-Primitive-Capability-Matrix.md', rootDir);
  const radar = readText('development/XTend-Native-First-Browser-Primitive-Radar.md', rootDir);
  const adoptionGate = readText('development/XTend-Native-Primitive-Adoption-Gate-Contract.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const componentManifest = readJson('components/manifest.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstOverlayFocusHardening;

  context.assertIncludes(contract, CONTRACT_SCHEMA, 'Contract declares schema');
  context.assertIncludes(contract, MATRIX_SCHEMA, 'Contract declares matrix schema');
  context.assertIncludes(contract, REPORT_SCHEMA, 'Contract declares report schema');
  context.assertIncludes(contract, 'owned-overlay-focus-stack-before-framework-dependency', 'Contract preserves owned overlay boundary');
  context.assertIncludes(contract, 'native-dialog-popover-anchor-remain-radar-linked', 'Contract preserves native adoption boundary');
  context.assertIncludes(contract, 'no-second-surface-registry', 'Contract preserves single registry boundary');
  assertIncludesAll(context, contract, REQUIRED_RADAR_REFS, 'Contract radar refs');
  assertIncludesAll(context, contract, REQUIRED_GATES, 'Contract gates');

  context.assertIncludes(matrix, MATRIX_SCHEMA, 'Matrix declares schema');
  assertIncludesAll(context, matrix, [
    'NFM-OF-01',
    'NFM-OF-02',
    'NFM-OF-03',
    'NFM-OF-04',
    'NFM-OF-05',
    'NFM-OF-06',
    'NFM-OF-07',
    'NFM-OF-08',
    'NFM-OF-09',
    'NFM-OF-10'
  ], 'Matrix primitive groups');
  assertIncludesAll(context, matrix, ['NFM-CAP-06', 'NFM-CAP-07', 'NFM-CAP-18'], 'Matrix capability handoff');
  assertIncludesAll(context, matrix, ['defer-with-watch', 'wrap-as-xtend-primitive', 'hardened-owned'], 'Matrix decision statuses');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  context.assertIncludes(workpackage, CONTRACT_SCHEMA, 'Workpackage declares contract schema');
  context.assertIncludes(workpackage, LOCAL_GATE, 'Workpackage declares local gate');
  assertIncludesAll(context, workpackage, REQUIRED_GATES, 'Workpackage verification gates');

  context.assertIncludes(roadmap, '| `NFM-WP-07` | P1 | completed |', 'Roadmap marks NFM-WP-07 completed');
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Overlay-Focus-Hardening-Contract.md', 'Roadmap references WP-07 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-07 gate');
  context.assertIncludes(mission, 'Overlay Focus Hardening Contract: `xtend.native-first.overlay-focus-hardening.v1`', 'Mission references WP-07 contract');
  context.assertIncludes(capabilityMatrix, '`NFM-CAP-06` | Overlay, Dialog, Popover, Drawer und Focus | `owned-native-backed` | `ready-with-radar-watch`', 'Capability matrix upgrades NFM-CAP-06');
  context.assertIncludes(capabilityMatrix, 'owned Overlay-/Focus-Pfad ist durch `NFM-WP-07` gehaertet', 'Capability matrix records WP-07 handoff');
  assertIncludesAll(context, radar, REQUIRED_RADAR_REFS, 'Radar includes WP-07 refs');
  context.assertIncludes(adoptionGate, '`NFM-WP-07`', 'Adoption gate hands off to WP-07');

  REQUIRED_COMPONENTS.forEach((tag) => {
    context.assert(Object.prototype.hasOwnProperty.call(componentManifest, tag), `Manifest includes ${tag}`);
  });

  [
    'components/xmodal.js',
    'components/xdialog.js',
    'components/xpopover.js',
    'components/xtooltip.js',
    'components/xdrawer.js',
    'components/xsidepanel.js',
    'components/xsurfaceportal.js',
    'components/xsurfacemanager.js'
  ].forEach((filePath) => {
    const source = readText(filePath, rootDir);
    context.assertIncludes(source, 'xtend.rmt.component-contract.v1', `${filePath} exposes RMT component metadata`);
  });

  const manager = readText('components/xsurfacemanager.js', rootDir);
  assertIncludesAll(context, manager, [
    'xtend.surface.stack-policy.v1',
    'applyStackPolicy',
    'snapshotStackPolicy',
    'data-surface-inert',
    'surface-stack-policy-escape',
    'surface-stack-policy-focus-restored',
    "document.addEventListener('keydown'",
    "document.addEventListener('focusin'"
  ], 'Surface manager stack policy runtime');

  const overlayBridge = readText('components/xsurfaceoverlay-bridge.js', rootDir);
  assertIncludesAll(context, overlayBridge, [
    'xtend.surface.overlay-stack-bridge.v1',
    'x-modal, x-dialog, x-drawer, x-popover, x-tooltip, x-toast, x-lightbox, x-menu',
    'legacyApiPreserved: true',
    'applyOverlaySurfaceSnapshot'
  ], 'Overlay bridge runtime');

  const packageScripts = packageManifest.scripts || {};
  context.assert(packageScripts['test:native-first-overlay-focus'] === 'node scripts/run_xtend_tests.js native-first-overlay-focus', 'Package exposes native-first overlay focus test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_overlay_focus_suite')", 'Runner imports native-first overlay focus suite');
  context.assertIncludes(runner, "id: 'native-first-overlay-focus'", 'Runner registers native-first overlay focus suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-07 contract schema');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Overlay-Focus-Hardening-Matrix.md', 'Package metadata exposes WP-07 matrix');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes WP-07 local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes WP-07 package script');
  assertArrayIncludesAll(context, metadata && metadata.components, REQUIRED_COMPONENTS, 'Package metadata components');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.radarRefs, REQUIRED_RADAR_REFS, 'Package metadata radar refs');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata preserves RMT kernel boundary');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-07',
      contract: CONTRACT_SCHEMA,
      components: REQUIRED_COMPONENTS.length,
      radarRefs: REQUIRED_RADAR_REFS.length,
      sourceGates: REQUIRED_GATES.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true
    }
  });
}

function printNativeFirstOverlayFocusReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Overlay Focus Hardening erfolgreich.',
    failureTitle: 'Native-First Overlay Focus Hardening fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstOverlayFocusReport,
  runNativeFirstOverlayFocusSuite
};
