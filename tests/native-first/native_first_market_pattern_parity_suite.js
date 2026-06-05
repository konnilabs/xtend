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

const SUITE_ID = 'native-first-market-pattern-parity';
const SUITE_LABEL = 'Native-First Market Pattern Parity';
const CONTRACT_SCHEMA = 'xtend.native-first.market-pattern-parity.v1';
const MATRIX_SCHEMA = 'xtend.native-first.market-pattern-parity-matrix.v1';
const REPORT_SCHEMA = 'xtend.native-first.market-pattern-parity-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-market-pattern-parity --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-market-pattern-parity';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const REQUIRED_PATTERNS = Object.freeze([
  'NFM-MP-01',
  'NFM-MP-02',
  'NFM-MP-03',
  'NFM-MP-04',
  'NFM-MP-05',
  'NFM-MP-06',
  'NFM-MP-07',
  'NFM-MP-08',
  'NFM-MP-09',
  'NFM-MP-10',
  'NFM-MP-11',
  'NFM-MP-12'
]);

const REQUIRED_STATUSES = Object.freeze([
  'parity-ready-owned',
  'parity-ready-radar-watch',
  'parity-contract-only',
  'parity-gap-owned-primitive-needed',
  'parity-docs-only'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'native-first-framework-leverage',
  'native-first-form-navigation-media',
  'native-first-overlay-focus',
  'form-controls-ux',
  'navigation-routing-ux',
  'layout-display-media-ux',
  'overlay-interaction-ux',
  'component-network-contract',
  'rmt-shell-authoring-ux',
  'rmt-state-selector-runtime',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-surface-resource-graph-runtime',
  'fabric-lane-mapping',
  'rmt-vnext-composition',
  'rmt-vnext-events',
  'rmt-vnext-scheduler',
  'hydration-policy',
  'rmt-node-ssr-adapter',
  'rmt-php-ssr-adapter',
  'docs-php-ssr-prehydration',
  'catalog-coverage',
  'references',
  'supply-chain'
]);

const REQUIRED_CAPABILITIES = Object.freeze([
  'NFM-CAP-01',
  'NFM-CAP-02',
  'NFM-CAP-04',
  'NFM-CAP-06',
  'NFM-CAP-08',
  'NFM-CAP-09',
  'NFM-CAP-13',
  'NFM-CAP-15',
  'NFM-CAP-16',
  'NFM-CAP-17',
  'NFM-CAP-18'
]);

const BLOCKED_COMPONENTS = Object.freeze([
  'x-table',
  'x-tree',
  'x-list',
  'x-virtual-list',
  'x-command-palette',
  'x-autocomplete',
  'x-combobox'
]);

const REQUIRED_METADATA = Object.freeze([
  {
    key: 'nativeFirstFrameworkLeverageLayer',
    schema: 'xtend.native-first.framework-leverage-layer.v1',
    localGate: 'node scripts/run_xtend_tests.js native-first-framework-leverage --json'
  },
  {
    key: 'nativeFirstFormNavigationMediaHardening',
    schema: 'xtend.native-first.form-navigation-media-hardening.v1',
    localGate: 'node scripts/run_xtend_tests.js native-first-form-navigation-media --json'
  },
  {
    key: 'nativeFirstOverlayFocusHardening',
    schema: 'xtend.native-first.overlay-focus-hardening.v1',
    localGate: 'node scripts/run_xtend_tests.js native-first-overlay-focus --json'
  },
  {
    key: 'rmtActionEffectRuntime',
    schema: 'xtend.epic18.rmt-action-effect-runtime.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-action-effect-runtime --json'
  },
  {
    key: 'rmtSurfaceResourceGraphRuntime',
    schema: 'xtend.epic18.rmt-surface-resource-graph-runtime.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json'
  },
  {
    key: 'hydrationPolicy',
    schema: 'xtend.fabric.hydration-policy.v1',
    localGate: 'node scripts/run_xtend_tests.js hydration-policy --json'
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

function runNativeFirstMarketPatternParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Market-Pattern-Parity-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Market-Pattern-Parity-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-10-Market-Pattern-Parity-Matrix-ohne-Framework-Abhaengigkeit-erstellen.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const capabilityMatrix = readText('development/XTend-Native-First-UI-Primitive-Capability-Matrix.md', rootDir);
  const capabilityContract = readText('development/XTend-Native-First-UI-Primitive-Capability-Contract.md', rootDir);
  const frameworkMatrix = readText('development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md', rootDir);
  const formNavigationMatrix = readText('development/XTend-Native-First-Form-Navigation-Media-Hardening-Matrix.md', rootDir);
  const radar = readText('development/XTend-Native-First-Browser-Primitive-Radar.md', rootDir);
  const adoptionGate = readText('development/XTend-Native-Primitive-Adoption-Gate-Contract.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const componentManifest = readJson('components/manifest.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstMarketPatternParity;
  const packageScripts = packageManifest.scripts || {};

  context.assertIncludes(contract, CONTRACT_SCHEMA, 'Contract declares schema');
  context.assertIncludes(contract, MATRIX_SCHEMA, 'Contract declares matrix schema');
  context.assertIncludes(contract, REPORT_SCHEMA, 'Contract declares report schema');
  assertIncludesAll(context, contract, [
    'market-patterns-not-framework-api-emulation',
    'no-external-ui-framework-runtime',
    'negative-claims-must-stay-visible',
    'docs-demo-claims-require-pattern-id',
    'React',
    'Vue',
    'Angular',
    'Svelte',
    'Next',
    KERNEL_BOUNDARY
  ], 'Contract boundaries and comparison vocabulary');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');

  context.assertIncludes(matrix, MATRIX_SCHEMA, 'Matrix declares schema');
  assertIncludesAll(context, matrix, REQUIRED_PATTERNS, 'Matrix pattern rows');
  assertIncludesAll(context, matrix, REQUIRED_STATUSES, 'Matrix statuses');
  assertIncludesAll(context, matrix, REQUIRED_CAPABILITIES, 'Matrix capability mappings');
  assertIncludesAll(context, matrix, [
    'blocked-negative-claim',
    'blocked-non-goal',
    'Data Grid',
    'Virtual List',
    'Command Palette',
    'Autocomplete',
    'Combobox'
  ], 'Matrix negative claims');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  context.assertIncludes(workpackage, CONTRACT_SCHEMA, 'Workpackage declares contract schema');
  context.assertIncludes(workpackage, LOCAL_GATE, 'Workpackage declares local gate');
  assertIncludesAll(context, workpackage, REQUIRED_SOURCE_GATES, 'Workpackage verification gates');

  context.assertIncludes(roadmap, '| `NFM-WP-10` | P2 | completed |', 'Roadmap marks NFM-WP-10 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-11` | P0 | ready |') || roadmap.includes('| `NFM-WP-11` | P0 | completed |'),
    'Roadmap keeps NFM-WP-11 ready or completed'
  );
  context.assert(
    roadmap.includes('| `NFM-WP-14` | P0 | ready |') || roadmap.includes('| `NFM-WP-14` | P0 | completed |'),
    'Roadmap keeps NFM-WP-14 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Market-Pattern-Parity-Contract.md', 'Roadmap references WP-10 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-10 gate');
  context.assertIncludes(mission, 'Market Pattern Parity Contract: `xtend.native-first.market-pattern-parity.v1`', 'Mission references WP-10 contract');
  context.assertIncludes(mission, '`NFM-WP-10` | completed', 'Mission handoff marks WP-10 completed');
  context.assertIncludes(capabilityMatrix, 'Market Pattern Parity Matrix', 'Capability matrix records WP-10 baseline');
  context.assertIncludes(capabilityMatrix, '`NFM-CAP-16` | Data Display: Table, Tree, Virtual List und Collection Controls | `missing` | `missing-owned-primitive`', 'Capability matrix keeps data display missing');
  context.assertIncludes(capabilityMatrix, '`NFM-CAP-17` | Command Palette, Combobox und Autocomplete | `missing` | `missing-owned-primitive`', 'Capability matrix keeps command/search missing');
  context.assertIncludes(capabilityMatrix, '`NFM-WP-10` hat die Luecke priorisiert', 'Capability matrix records WP-10 prioritization');
  context.assertIncludes(capabilityContract, '`NFM-WP-10` | Market-Pattern-Parity gegen diese Matrix abgeschlossen', 'Capability contract hands off WP-10');
  context.assertIncludes(radar, '`NFM-WP-10`', 'Radar hands off to WP-10');
  context.assertIncludes(adoptionGate, '`NFM-WP-10`', 'Adoption gate hands off to WP-10');

  assertIncludesAll(context, frameworkMatrix, ['NFM-FL-01', 'NFM-FL-08', 'owned-framework-leverage-ready'], 'Framework leverage source matrix');
  assertIncludesAll(context, formNavigationMatrix, ['NFM-FNM-09', 'NFM-FNM-10', 'missing-owned-primitive'], 'Form/navigation/media source matrix');

  BLOCKED_COMPONENTS.forEach((tag) => {
    context.assert(!Object.prototype.hasOwnProperty.call(componentManifest, tag), `Manifest does not claim ${tag}`);
  });

  REQUIRED_METADATA.forEach((entry) => {
    const item = packageManifest.xtend && packageManifest.xtend[entry.key];
    context.assert(item && item.schema === entry.schema, `Package metadata exposes ${entry.key} schema`);
    context.assert(item && item.localGate === entry.localGate, `Package metadata exposes ${entry.key} local gate`);
    context.assert(!item || !item.kernelBoundary || item.kernelBoundary === KERNEL_BOUNDARY || item.kernelBoundary === 'no-rmt-kernel-import-of-host-runtime-types', `${entry.key} keeps host-neutral kernel boundary`);
  });

  context.assert(packageScripts['test:native-first-market-pattern-parity'] === 'node scripts/run_xtend_tests.js native-first-market-pattern-parity', 'Package exposes native-first market pattern parity test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_market_pattern_parity_suite')", 'Runner imports native-first market pattern parity suite');
  context.assertIncludes(runner, "id: 'native-first-market-pattern-parity'", 'Runner registers native-first market pattern parity suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-10 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-10 matrix schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-10 report schema');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Market-Pattern-Parity-Matrix.md', 'Package metadata exposes WP-10 matrix');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes WP-10 local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes WP-10 package script');
  assertArrayIncludesAll(context, metadata && metadata.patterns, REQUIRED_PATTERNS, 'Package metadata patterns');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.negativeClaims, ['data-display', 'command-search', 'framework-api-emulation'], 'Package metadata negative claims');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.noExternalUiFrameworkRuntime === true, 'Package metadata rejects external UI framework runtime');
  context.assert(metadata && metadata.frameworkApiEmulationAllowed === false, 'Package metadata blocks framework API emulation');
  context.assert(metadata && metadata.claimsDataGrid === false, 'Package metadata does not claim data grid');
  context.assert(metadata && metadata.claimsCommandPalette === false, 'Package metadata does not claim command palette');
  context.assert(metadata && metadata.rmtKernelBoundary === KERNEL_BOUNDARY, 'Package metadata preserves RMT kernel boundary');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-10',
      contract: CONTRACT_SCHEMA,
      patterns: REQUIRED_PATTERNS.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      negativeClaims: BLOCKED_COMPONENTS.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      noExternalUiFrameworkRuntime: true,
      frameworkApiEmulationAllowed: false
    }
  });
}

function printNativeFirstMarketPatternParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Market Pattern Parity erfolgreich.',
    failureTitle: 'Native-First Market Pattern Parity fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstMarketPatternParityReport,
  runNativeFirstMarketPatternParitySuite
};
