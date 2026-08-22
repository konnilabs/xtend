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

const SUITE_ID = 'native-first-framework-leverage';
const SUITE_LABEL = 'Native-First Framework Leverage Layer';
const CONTRACT_SCHEMA = 'xtend.native-first.framework-leverage-layer.v1';
const MATRIX_SCHEMA = 'xtend.native-first.framework-leverage-layer-matrix.v1';
const REPORT_SCHEMA = 'xtend.native-first.framework-leverage-layer-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-framework-leverage --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-framework-leverage';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const REQUIRED_CAPABILITIES = Object.freeze([
  'NFM-CAP-02',
  'NFM-CAP-03',
  'NFM-CAP-05',
  'NFM-CAP-13'
]);

const REQUIRED_MATRIX_ROWS = Object.freeze([
  'NFM-FL-01',
  'NFM-FL-02',
  'NFM-FL-03',
  'NFM-FL-04',
  'NFM-FL-05',
  'NFM-FL-06',
  'NFM-FL-07',
  'NFM-FL-08',
  'NFM-FL-09',
  'NFM-FL-10'
]);

const REQUIRED_RADAR_REFS = Object.freeze([
  'NFM-BPR-012',
  'NFM-BPR-013',
  'NFM-BPR-014',
  'NFM-BPR-020'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'design-tokens',
  'xtheme-token-alias-layer',
  'component-shell-theme-matrix',
  'component-network-contract',
  'rmt-shell-authoring-ux',
  'feedback-status-ux',
  'rmt-state-selector-runtime',
  'rmt-event-routing-runtime',
  'fabric-lane-mapping',
  'rmt-vnext-scheduler',
  'rmt-vnext-composition',
  'rmt-vnext-events',
  'references',
  'supply-chain'
]);

const REQUIRED_METADATA = Object.freeze([
  {
    key: 'designTokens',
    schema: 'xtend.design-tokens.product-contract.v1',
    localGate: 'node scripts/run_xtend_tests.js design-tokens --json',
    packageScript: 'npm run test:design-tokens'
  },
  {
    key: 'componentShellThemeMatrix',
    schema: 'xtend.epic11.component-shell-theme-matrix.v1',
    localGate: 'node scripts/run_xtend_tests.js component-shell-theme-matrix --json',
    packageScript: 'npm run test:component-shell-theme-matrix'
  },
  {
    key: 'componentNetworkContract',
    schema: 'xtend.component.network.v1',
    localGate: 'node scripts/run_xtend_tests.js component-network-contract --json',
    packageScript: 'npm run test:component-network-contract'
  },
  {
    key: 'rmtShellAuthoringComponentUx',
    schema: 'xtend.rmt.shell-authoring.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json',
    packageScript: 'npm run test:rmt-shell-authoring-ux'
  },
  {
    key: 'feedbackStatusUxMaturity',
    schema: 'xtend.component.feedback-status-ux.v1',
    localGate: 'node scripts/run_xtend_tests.js feedback-status-ux --json',
    packageScript: 'npm run test:feedback-status-ux'
  },
  {
    key: 'rmtStateSelectorRuntime',
    schema: 'xtend.epic18.rmt-state-selector-runtime.v2',
    localGate: 'node scripts/run_xtend_tests.js rmt-state-selector-runtime --json',
    packageScript: 'npm run test:rmt-state-selector-runtime'
  },
  {
    key: 'rmtEventRoutingRuntime',
    schema: 'xtend.epic18.rmt-event-routing-runtime.v2',
    localGate: 'node scripts/run_xtend_tests.js rmt-event-routing-runtime --json',
    packageScript: 'npm run test:rmt-event-routing-runtime'
  },
  {
    key: 'rmtVNextScheduler',
    schema: 'xtend.rmt.vnext-scheduler-policy.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-vnext-scheduler --json',
    packageScript: 'npm run test:rmt-vnext-scheduler'
  },
  {
    key: 'rmtVNextComposition',
    schema: 'xtend.rmt.vnext-composition.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-vnext-composition --json',
    packageScript: 'npm run test:rmt-vnext-composition'
  },
  {
    key: 'rmtVNextEvents',
    schema: 'xtend.rmt.vnext-event-action-contract.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-vnext-events --json',
    packageScript: 'npm run test:rmt-vnext-events'
  }
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

function runNativeFirstFrameworkLeverageSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Framework-Leverage-Layer-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-09-Framework-Hebel-Layer-fuer-Theme-State-Events-Slots-und-Scheduler-schneiden.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const capabilityMatrix = readText('development/XTend-Native-First-UI-Primitive-Capability-Matrix.md', rootDir);
  const radar = readText('development/XTend-Native-First-Browser-Primitive-Radar.md', rootDir);
  const adoptionGate = readText('development/XTend-Native-Primitive-Adoption-Gate-Contract.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstFrameworkLeverageLayer;
  const packageScripts = packageManifest.scripts || {};
  const exportsMap = packageManifest.exports || {};

  context.assertIncludes(contract, CONTRACT_SCHEMA, 'Contract declares schema');
  context.assertIncludes(contract, MATRIX_SCHEMA, 'Contract declares matrix schema');
  context.assertIncludes(contract, REPORT_SCHEMA, 'Contract declares report schema');
  assertIncludesAll(context, contract, [
    'framework-leverage-through-owned-contracts',
    'no-external-ui-framework-runtime',
    'no-implicit-global-event-bus',
    'state-host-adapter-injected-not-kernel-imported',
    'scheduler-lanes-are-contract-records',
    KERNEL_BOUNDARY
  ], 'Contract boundaries');
  assertIncludesAll(context, contract, REQUIRED_RADAR_REFS, 'Contract radar refs');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');

  context.assertIncludes(matrix, MATRIX_SCHEMA, 'Matrix declares schema');
  assertIncludesAll(context, matrix, REQUIRED_MATRIX_ROWS, 'Matrix rows');
  assertIncludesAll(context, matrix, REQUIRED_CAPABILITIES, 'Matrix capability handoff');
  assertIncludesAll(context, matrix, [
    'owned-framework-leverage-ready',
    'owned-framework-leverage-ready-with-residual',
    'contract-handoff-ready'
  ], 'Matrix decision statuses');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  context.assertIncludes(workpackage, CONTRACT_SCHEMA, 'Workpackage declares contract schema');
  context.assertIncludes(workpackage, LOCAL_GATE, 'Workpackage declares local gate');
  assertIncludesAll(context, workpackage, REQUIRED_SOURCE_GATES, 'Workpackage verification gates');

  context.assertIncludes(roadmap, '| `NFM-WP-09` | P1 | completed |', 'Roadmap marks NFM-WP-09 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-10` | P2 | ready |') || roadmap.includes('| `NFM-WP-10` | P2 | completed |'),
    'Roadmap makes NFM-WP-10 ready or completed after WP09'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Framework-Leverage-Layer-Contract.md', 'Roadmap references WP-09 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-09 gate');
  context.assertIncludes(mission, 'Framework Leverage Layer Contract: `xtend.native-first.framework-leverage-layer.v1`', 'Mission references WP-09 contract');
  context.assertIncludes(capabilityMatrix, '`NFM-CAP-13` | State, Theme State und Component Network | `owned` | `ready-with-contract-residual`', 'Capability matrix upgrades NFM-CAP-13');
  context.assertIncludes(capabilityMatrix, 'Framework-Hebel-Layer durch `NFM-WP-09`', 'Capability matrix records WP-09 layer handoff');
  context.assertIncludes(radar, '`NFM-WP-09`', 'Radar hands off to WP-09');
  context.assertIncludes(adoptionGate, '`NFM-WP-09`', 'Adoption gate hands off to WP-09');

  context.assert(packageScripts['test:native-first-framework-leverage'] === 'node scripts/run_xtend_tests.js native-first-framework-leverage', 'Package exposes native-first framework leverage test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_framework_leverage_suite')", 'Runner imports native-first framework leverage suite');
  context.assertIncludes(runner, "id: 'native-first-framework-leverage'", 'Runner registers native-first framework leverage suite');

  REQUIRED_METADATA.forEach((entry) => {
    const item = packageManifest.xtend && packageManifest.xtend[entry.key];
    context.assert(item && item.schema === entry.schema, `Package metadata exposes ${entry.key} schema`);
    context.assert(item && item.localGate === entry.localGate, `Package metadata exposes ${entry.key} local gate`);
    context.assert(item && item.packageScript === entry.packageScript, `Package metadata exposes ${entry.key} package script`);
    context.assert(!item || !item.kernelBoundary || item.kernelBoundary === KERNEL_BOUNDARY || item.kernelBoundary === 'no-rmt-kernel-import-of-host-runtime-types', `${entry.key} keeps host-neutral kernel boundary`);
  });

  context.assert(exportsMap['./design-tokens'] && (exportsMap['./design-tokens'].default === './design-tokens/xtend-design-tokens.js' || exportsMap['./design-tokens'] === './design-tokens/xtend-design-tokens.js'), 'Package exports design tokens');
  context.assert(exportsMap['./design-tokens/xtheme-token-alias-layer'] && exportsMap['./design-tokens/xtheme-token-alias-layer'].default === './design-tokens/xtheme-token-alias-layer.js', 'Package exports XTheme token alias layer');
  context.assert(packageScripts['test:xtheme-token-alias-layer'] === 'node scripts/run_xtend_tests.js xtheme-token-alias-layer', 'Package exposes XTheme alias layer gate');
  context.assert(packageScripts['test:fabric-lanes'] === 'node scripts/run_xtend_tests.js fabric-lane-mapping', 'Package exposes Fabric lane mapping gate');

  const stateMetadata = packageManifest.xtend.rmtStateSelectorRuntime;
  const eventMetadata = packageManifest.xtend.rmtEventRoutingRuntime;
  context.assert(stateMetadata.stateRuntimeImportedByRuntime === false, 'State selector runtime does not import state');
  context.assert(stateMetadata.stateProjectionMode === 'injected-host-adapter', 'State selector runtime uses injected host adapter');
  context.assert(eventMetadata.productEventFrameworkAllowed === false, 'Event routing rejects product event framework');
  context.assert(eventMetadata.closestDelegationRequired === false, 'Event routing does not require closest delegation');

  const stateRuntime = readText('xtendrmt/rmt-state-selector-runtime.js', rootDir);
  const eventRuntime = readText('xtendrmt/rmt-event-routing-runtime.js', rootDir);
  const fabricLaneMapping = readText('fabric/rmt-lane-mapping.js', rootDir);
  const shellAuthoring = readText('development/XTend-RMT-Shell-Authoring-fuer-Component-UX.md', rootDir);
  const componentNetwork = readText('development/XTend-Component-Network-Compatibility-Contract.md', rootDir);
  context.assert(!stateRuntime.includes("from '../components/state'") && !stateRuntime.includes("require('../components/state") && !stateRuntime.includes('components/state'), 'State selector runtime has no state import');
  context.assertIncludes(eventRuntime, 'xtend.epic18.rmt-event-routing-runtime.v2', 'Event runtime declares stable schema');
  context.assert(!eventRuntime.includes('mitt') && !eventRuntime.includes('EventEmitter'), 'Event runtime avoids external event bus primitives');
  context.assertIncludes(fabricLaneMapping, 'xtend.fabric.rmt-lane-mapping.v1', 'Fabric lane mapping declares contract');
  context.assert(!fabricLaneMapping.includes('rmt-runtime'), 'Fabric lane mapping does not import RMT runtime');
  assertIncludesAll(context, shellAuthoring, ['slots', 'events', 'commands', 'schedules', KERNEL_BOUNDARY], 'RMT shell authoring contract');
  assertIncludesAll(context, componentNetwork, ['no-global-magic-state', 'xtend:theme-change', 'xtend:network-diagnostic'], 'Component Network contract');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-09 contract schema');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md', 'Package metadata exposes WP-09 matrix');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes WP-09 local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes WP-09 package script');
  assertArrayIncludesAll(context, metadata && metadata.capabilities, REQUIRED_CAPABILITIES, 'Package metadata capabilities');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.radarRefs, REQUIRED_RADAR_REFS, 'Package metadata radar refs');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.noExternalUiFrameworkRuntime === true, 'Package metadata rejects external UI framework runtime');
  context.assert(metadata && metadata.noImplicitGlobalEventBus === true, 'Package metadata rejects implicit global event bus');
  context.assert(metadata && metadata.stateProjectionMode === 'injected-host-adapter', 'Package metadata records state injected bridge mode');
  context.assert(metadata && metadata.rmtKernelBoundary === KERNEL_BOUNDARY, 'Package metadata preserves RMT kernel boundary');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-09',
      contract: CONTRACT_SCHEMA,
      matrixRows: REQUIRED_MATRIX_ROWS.length,
      capabilities: REQUIRED_CAPABILITIES.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      radarRefs: REQUIRED_RADAR_REFS.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      noExternalUiFrameworkRuntime: true
    }
  });
}

function printNativeFirstFrameworkLeverageReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Framework Leverage Layer erfolgreich.',
    failureTitle: 'Native-First Framework Leverage Layer fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstFrameworkLeverageReport,
  runNativeFirstFrameworkLeverageSuite
};
