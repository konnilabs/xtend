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

const SUITE_ID = 'rmt-ui-primitive-gap';
const SUITE_LABEL = 'Native-First RMT UI Primitive Gap Analysis';
const CONTRACT_SCHEMA = 'xtend.native-first.rmt-ui-primitive-gap.v1';
const MATRIX_SCHEMA = 'xtend.native-first.rmt-ui-primitive-gap-matrix.v1';
const ITEM_SCHEMA = 'xtend.native-first.rmt-ui-primitive-gap-item.v1';
const REPORT_SCHEMA = 'xtend.native-first.rmt-ui-primitive-gap-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-ui-primitive-gap';
const KERNEL_BOUNDARY = 'rmt-kernel-remains-host-neutral';

const REQUIRED_FIELDS = Object.freeze([
  'gapId',
  'marketPattern',
  'capabilities',
  'ownedPrimitivePackage',
  'rmtDomains',
  'gapClasses',
  'coverageStatus',
  'priority',
  'appAuthorableWithoutManualShell',
  'blockedClaim',
  'proposedExtension',
  'sourceContracts',
  'sourceGates',
  'nextHandoff'
]);

const REQUIRED_GAP_CLASSES = Object.freeze([
  'syntax',
  'core-record',
  'adapter',
  'component-contract',
  'security-policy',
  'tooling',
  'docs'
]);

const REQUIRED_COVERAGE_STATUSES = Object.freeze([
  'authorable-now',
  'authorable-with-adapter-residual',
  'contract-only-gap',
  'syntax-growth-needed',
  'owned-primitive-needed',
  'renderer-proof-deferred-to-wp18'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-ui-primitive-gap',
  'native-first-market-pattern-parity',
  'contract-runtime-parity',
  'native-first-evidence-pack',
  'rmt-vnext-compiler',
  'rmt-vnext-scheduler',
  'rmt-vnext-surfaces',
  'rmt-vnext-composition',
  'rmt-vnext-events',
  'rmt-vnext-security',
  'rmt-dom-descriptor-renderer',
  'rmt-component-template-primitives',
  'rmt-state-selector-runtime',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-app-platform-tooling',
  'rmt-app-platform-fixture',
  'rmt-native-shell-migration',
  'epic18-rmt-app-platform'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'app-authorable-without-manual-shell',
  'gap-analysis-does-not-claim-implemented-primitives',
  KERNEL_BOUNDARY,
  'no-inline-javascript-or-unsafe-html-sink',
  'no-new-runtime-dependency',
  'syntax-growth-requires-core-record-and-source-map',
  'missing-owned-primitives-remain-negative-claims'
]);

const REQUIRED_GAPS = Object.freeze([
  {
    gapId: 'NFM-RUG-01',
    marketPattern: 'NFM-MP-01',
    capabilities: ['NFM-CAP-08', 'NFM-CAP-18'],
    ownedPrimitivePackage: 'NFM-OP-04',
    rmtDomains: ['routes', 'surfaces', 'schedules', 'events'],
    gapClasses: ['syntax', 'adapter', 'docs'],
    coverageStatus: 'authorable-with-adapter-residual',
    priority: 'P0',
    appAuthorableWithoutManualShell: 'partial',
    blockedClaim: 'no-native-navigation-api-product-claim',
    proposedExtension: 'route-shell-record-and-navigation-state-binding',
    sourceContracts: ['xtend.rmt.core-format.vnext.v1', 'xtend.rmt.vnext-surface-registry.v1', 'xtend.native-first.market-pattern-parity.v1'],
    sourceGates: ['rmt-vnext-compiler', 'rmt-vnext-surfaces', 'rmt-app-platform-fixture'],
    nextHandoff: 'NFM-WP-15'
  },
  {
    gapId: 'NFM-RUG-02',
    marketPattern: 'NFM-MP-02',
    capabilities: ['NFM-CAP-09', 'NFM-CAP-14', 'NFM-CAP-18'],
    ownedPrimitivePackage: 'NFM-OP-03',
    rmtDomains: ['templates', 'slots', 'surfaces'],
    gapClasses: ['syntax', 'core-record', 'tooling', 'docs'],
    coverageStatus: 'syntax-growth-needed',
    priority: 'P0',
    appAuthorableWithoutManualShell: 'partial',
    blockedClaim: 'no-complete-layout-sugar-claim',
    proposedExtension: 'layout-region-slot-composition-sugar',
    sourceContracts: ['xtend.rmt.core-format.vnext.v1', 'xtend.native-first.ui-primitive-capability.v1'],
    sourceGates: ['rmt-vnext-composition', 'rmt-component-template-primitives', 'native-first-market-pattern-parity'],
    nextHandoff: 'NFM-WP-15'
  },
  {
    gapId: 'NFM-RUG-03',
    marketPattern: 'NFM-MP-03',
    capabilities: ['NFM-CAP-04', 'NFM-CAP-17'],
    ownedPrimitivePackage: 'NFM-OP-02',
    rmtDomains: ['components', 'events', 'actions', 'dataSources'],
    gapClasses: ['adapter', 'component-contract', 'docs'],
    coverageStatus: 'authorable-with-adapter-residual',
    priority: 'P1',
    appAuthorableWithoutManualShell: 'partial',
    blockedClaim: 'no-rich-combobox-autocomplete-claim',
    proposedExtension: 'form-binding-validation-result-record',
    sourceContracts: ['xtend.rmt.vnext-event-action-contract.v1', 'xtend.native-first.form-navigation-media-hardening.v1'],
    sourceGates: ['rmt-vnext-events', 'rmt-action-effect-runtime', 'native-first-form-navigation-media'],
    nextHandoff: 'NFM-WP-16'
  },
  {
    gapId: 'NFM-RUG-04',
    marketPattern: 'NFM-MP-04',
    capabilities: ['NFM-CAP-02', 'NFM-CAP-13'],
    ownedPrimitivePackage: 'NFM-OP-05',
    rmtDomains: ['state', 'selectors', 'components', 'schedules'],
    gapClasses: ['adapter', 'tooling'],
    coverageStatus: 'authorable-now',
    priority: 'P1',
    appAuthorableWithoutManualShell: 'yes',
    blockedClaim: 'none',
    proposedExtension: 'typed-theme-state-selector-authoring',
    sourceContracts: ['xtend.native-first.framework-leverage-layer.v1', 'xtend.rmt.core-format.vnext.v1'],
    sourceGates: ['rmt-state-selector-runtime', 'rmt-event-routing-runtime', 'native-first-framework-leverage'],
    nextHandoff: 'NFM-WP-19'
  },
  {
    gapId: 'NFM-RUG-05',
    marketPattern: 'NFM-MP-05',
    capabilities: ['NFM-CAP-03', 'NFM-CAP-13', 'NFM-CAP-17'],
    ownedPrimitivePackage: 'NFM-OP-08',
    rmtDomains: ['events', 'actions', 'operations'],
    gapClasses: ['syntax', 'adapter', 'component-contract'],
    coverageStatus: 'authorable-with-adapter-residual',
    priority: 'P1',
    appAuthorableWithoutManualShell: 'partial',
    blockedClaim: 'no-command-palette-claim',
    proposedExtension: 'command-action-binding-record',
    sourceContracts: ['xtend.rmt.vnext-event-action-contract.v1', 'xtend.native-first.market-pattern-parity.v1'],
    sourceGates: ['rmt-vnext-events', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime'],
    nextHandoff: 'NFM-WP-16'
  },
  {
    gapId: 'NFM-RUG-06',
    marketPattern: 'NFM-MP-06',
    capabilities: ['NFM-CAP-15', 'NFM-CAP-16'],
    ownedPrimitivePackage: 'NFM-OP-06',
    rmtDomains: ['dataSources', 'resources', 'operations'],
    gapClasses: ['core-record', 'adapter', 'security-policy', 'tooling'],
    coverageStatus: 'contract-only-gap',
    priority: 'P0',
    appAuthorableWithoutManualShell: 'no',
    blockedClaim: 'no-resource-data-ui-family-claim',
    proposedExtension: 'resource-query-lifecycle-record',
    sourceContracts: ['xtend.rmt.vnext-event-action-contract.v1', 'xtend.native-first.contract-runtime-parity.v1'],
    sourceGates: ['rmt-vnext-events', 'rmt-surface-resource-graph-runtime', 'contract-runtime-parity'],
    nextHandoff: 'NFM-WP-16'
  },
  {
    gapId: 'NFM-RUG-07',
    marketPattern: 'NFM-MP-07',
    capabilities: ['NFM-CAP-06', 'NFM-CAP-07', 'NFM-CAP-18'],
    ownedPrimitivePackage: 'NFM-OP-01',
    rmtDomains: ['surfaces', 'slots', 'securityPolicies', 'schedules'],
    gapClasses: ['syntax', 'adapter', 'security-policy'],
    coverageStatus: 'syntax-growth-needed',
    priority: 'P0',
    appAuthorableWithoutManualShell: 'partial',
    blockedClaim: 'no-complete-surface-maximality-claim',
    proposedExtension: 'surface-region-portal-overlay-records',
    sourceContracts: ['xtend.rmt.vnext-surface-registry.v1', 'xtend.security.trusted-dom-policy.v1'],
    sourceGates: ['rmt-vnext-surfaces', 'rmt-dom-descriptor-renderer', 'rmt-native-shell-migration'],
    nextHandoff: 'NFM-WP-18'
  },
  {
    gapId: 'NFM-RUG-08',
    marketPattern: 'NFM-MP-08',
    capabilities: ['NFM-CAP-05', 'NFM-CAP-13'],
    ownedPrimitivePackage: 'NFM-OP-05',
    rmtDomains: ['lanes', 'schedules', 'operations', 'events'],
    gapClasses: ['docs', 'tooling'],
    coverageStatus: 'authorable-now',
    priority: 'P2',
    appAuthorableWithoutManualShell: 'yes',
    blockedClaim: 'none',
    proposedExtension: 'feedback-lane-pattern-docs',
    sourceContracts: ['xtend.rmt.vnext-scheduler-policy.v1', 'xtend.native-first.framework-leverage-layer.v1'],
    sourceGates: ['rmt-vnext-scheduler', 'rmt-event-routing-runtime', 'native-first-framework-leverage'],
    nextHandoff: 'NFM-WP-19'
  },
  {
    gapId: 'NFM-RUG-09',
    marketPattern: 'NFM-MP-09',
    capabilities: ['NFM-CAP-01', 'NFM-CAP-14'],
    ownedPrimitivePackage: 'NFM-OP-03',
    rmtDomains: ['templates', 'surfaces', 'schedules', 'securityPolicies'],
    gapClasses: ['tooling', 'docs'],
    coverageStatus: 'authorable-with-adapter-residual',
    priority: 'P1',
    appAuthorableWithoutManualShell: 'partial',
    blockedClaim: 'no-production-bundle-claim-without-release-gate',
    proposedExtension: 'hydration-boot-record-handoff',
    sourceContracts: ['xtend.rmt.core-format.vnext.v1', 'xtend.native-first.audit-evidence-pack.v1'],
    sourceGates: ['rmt-app-platform-tooling', 'rmt-app-platform-fixture', 'epic18-rmt-app-platform'],
    nextHandoff: 'NFM-WP-20'
  },
  {
    gapId: 'NFM-RUG-10',
    marketPattern: 'NFM-MP-10',
    capabilities: ['NFM-CAP-13', 'NFM-CAP-18'],
    ownedPrimitivePackage: 'NFM-OP-05',
    rmtDomains: ['operations', 'events', 'diagnostics'],
    gapClasses: ['adapter', 'docs'],
    coverageStatus: 'authorable-now',
    priority: 'P1',
    appAuthorableWithoutManualShell: 'yes',
    blockedClaim: 'none',
    proposedExtension: 'diagnostic-boundary-record',
    sourceContracts: ['xtend.native-first.framework-leverage-layer.v1', 'xtend.native-first.audit-evidence-pack.v1'],
    sourceGates: ['rmt-event-routing-runtime', 'rmt-surface-resource-graph-runtime', 'native-first-evidence-pack'],
    nextHandoff: 'NFM-WP-19'
  },
  {
    gapId: 'NFM-RUG-11',
    marketPattern: 'NFM-MP-11',
    capabilities: ['NFM-CAP-16'],
    ownedPrimitivePackage: 'NFM-OP-06',
    rmtDomains: ['components', 'templates', 'dataSources', 'resources'],
    gapClasses: ['component-contract', 'syntax', 'adapter', 'tooling', 'docs'],
    coverageStatus: 'owned-primitive-needed',
    priority: 'P0',
    appAuthorableWithoutManualShell: 'no',
    blockedClaim: 'no-table-tree-data-grid-virtual-list-claim',
    proposedExtension: 'collection-view-record-and-owned-data-display-package',
    sourceContracts: ['xtend.native-first.ui-primitive-capability.v1', 'xtend.native-first.market-pattern-parity.v1'],
    sourceGates: ['native-first-market-pattern-parity', 'rmt-component-template-primitives', 'rmt-surface-resource-graph-runtime'],
    nextHandoff: 'owned-data-display-package'
  },
  {
    gapId: 'NFM-RUG-12',
    marketPattern: 'NFM-MP-12',
    capabilities: ['NFM-CAP-17'],
    ownedPrimitivePackage: 'NFM-OP-08',
    rmtDomains: ['components', 'events', 'actions', 'state', 'resources'],
    gapClasses: ['component-contract', 'syntax', 'adapter', 'tooling', 'docs'],
    coverageStatus: 'owned-primitive-needed',
    priority: 'P1',
    appAuthorableWithoutManualShell: 'no',
    blockedClaim: 'no-command-palette-autocomplete-rich-combobox-claim',
    proposedExtension: 'command-source-record-and-owned-search-package',
    sourceContracts: ['xtend.native-first.ui-primitive-capability.v1', 'xtend.native-first.market-pattern-parity.v1'],
    sourceGates: ['native-first-market-pattern-parity', 'rmt-action-effect-runtime', 'rmt-event-routing-runtime'],
    nextHandoff: 'owned-command-search-package'
  }
]);

const REQUIRED_BLOCKED_CLAIMS = Object.freeze([
  'no-table-tree-data-grid-virtual-list-claim',
  'no-command-palette-autocomplete-rich-combobox-claim',
  'no-complete-layout-sugar-claim',
  'no-complete-surface-maximality-claim',
  'no-resource-data-ui-family-claim'
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

function assertPathExists(context, rootDir, relativePath, label) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), `${label} exists at ${relativePath}`);
}

function assertRunnerGate(context, runner, gate) {
  context.assertIncludes(runner, `id: '${gate}'`, `Runner registers ${gate}`);
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function runNativeFirstRmtUiPrimitiveGapSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', rootDir);
  const workpackage = readText('development/NFM-WP-14-RMT-UI-Primitive-Gap-Analysis-erstellen.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const capabilityMatrix = readText('development/XTend-Native-First-UI-Primitive-Capability-Matrix.md', rootDir);
  const marketMatrix = readText('development/XTend-Native-First-Market-Pattern-Parity-Matrix.md', rootDir);
  const parityMatrix = readText('development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md', rootDir);
  const evidencePack = readText('development/XTend-Native-First-Audit-Evidence-Pack.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstRmtUiPrimitiveGapAnalysis;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    'xtend.native-first.ui-primitive-capability.v1',
    'xtend.native-first.market-pattern-parity.v1',
    'xtend.native-first.contract-runtime-parity.v1',
    'xtend.native-first.audit-evidence-pack.v1'
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, REQUIRED_GAP_CLASSES, 'Contract gap classes');
  assertIncludesAll(context, contract, REQUIRED_COVERAGE_STATUSES, 'Contract coverage statuses');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, REQUIRED_BOUNDARIES, 'Contract boundaries');
  assertIncludesAll(context, contract, [
    'NFM-WP-15',
    'NFM-WP-16',
    'NFM-WP-17',
    'NFM-WP-18',
    'NFM-WP-19'
  ], 'Contract handoff');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    'Coverage Summary',
    'App Authorability Summary',
    'Blockierte Claims nach WP-14',
    'Positiv erlaubte Claims'
  ], 'Matrix header and summaries');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix fields');
  REQUIRED_GAPS.forEach((gap) => {
    assertIncludesAll(context, matrix, [
      gap.gapId,
      gap.marketPattern,
      gap.ownedPrimitivePackage,
      gap.coverageStatus,
      gap.priority,
      gap.appAuthorableWithoutManualShell,
      gap.blockedClaim,
      gap.proposedExtension,
      gap.nextHandoff
    ], `Matrix row ${gap.gapId}`);
    assertIncludesAll(context, matrix, gap.capabilities, `Matrix row ${gap.gapId} capabilities`);
    assertIncludesAll(context, matrix, gap.rmtDomains, `Matrix row ${gap.gapId} RMT domains`);
    assertIncludesAll(context, matrix, gap.gapClasses, `Matrix row ${gap.gapId} gap classes`);
    assertIncludesAll(context, matrix, gap.sourceContracts, `Matrix row ${gap.gapId} source contracts`);
    assertIncludesAll(context, matrix, gap.sourceGates, `Matrix row ${gap.gapId} source gates`);
    gap.sourceGates.forEach((gate) => assertRunnerGate(context, runner, gate));
  });
  assertIncludesAll(context, matrix, REQUIRED_BLOCKED_CLAIMS, 'Matrix blocked claims');
  assertIncludesAll(context, matrix, [
    '`authorable-now` | 3',
    '`authorable-with-adapter-residual` | 4',
    '`contract-only-gap` | 1',
    '`syntax-growth-needed` | 2',
    '`owned-primitive-needed` | 2',
    '`yes` | 3',
    '`partial` | 6',
    '`no` | 3'
  ], 'Matrix count summaries');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'NFM-WP-15',
    'NFM-WP-16',
    'NFM-WP-17',
    'NFM-WP-18',
    'NFM-WP-19'
  ], 'Workpackage schemas, gate and handoff');
  assertIncludesAll(context, workpackage, REQUIRED_GAP_CLASSES, 'Workpackage gap classes');

  assertIncludesAll(context, capabilityMatrix, [
    'NFM-CAP-07',
    'NFM-CAP-08',
    'NFM-CAP-14',
    'NFM-CAP-15',
    'NFM-CAP-16',
    'NFM-CAP-17',
    'NFM-CAP-18',
    'RMT UI Maximality noch nicht quantitativ bewertet'
  ], 'Capability matrix WP-14 inputs');
  assertIncludesAll(context, marketMatrix, [
    'NFM-MP-01',
    'NFM-MP-12',
    'parity-contract-only',
    'parity-gap-owned-primitive-needed',
    'blocked-negative-claim'
  ], 'Market matrix WP-14 inputs');
  assertIncludesAll(context, parityMatrix, [
    'NFM-CRP-02',
    'NFM-CRP-04',
    'NFM-CRP-09',
    'NFM-WP-14'
  ], 'Parity residual inputs');
  assertIncludesAll(context, evidencePack, [
    'NFM-AEP-02',
    'NFM-AEP-09',
    'NFM-WP-14'
  ], 'Audit evidence inputs');

  context.assertIncludes(roadmap, '| `NFM-WP-14` | P0 | completed |', 'Roadmap marks NFM-WP-14 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-15` | P1 | ready |') || roadmap.includes('| `NFM-WP-15` | P1 | completed |'),
    'Roadmap marks NFM-WP-15 ready or completed'
  );
  context.assert(
    roadmap.includes('| `NFM-WP-16` | P1 | ready |') || roadmap.includes('| `NFM-WP-16` | P1 | completed |'),
    'Roadmap marks NFM-WP-16 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md', 'Roadmap references WP-14 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-14 gate');

  context.assertIncludes(mission, 'RMT UI Primitive Gap Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`', 'Mission references WP-14 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', 'Mission source-of-truth lists WP-14 matrix');
  context.assertIncludes(mission, '`NFM-WP-14` | completed', 'Mission handoff marks WP-14 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'rmt-ui-authoring-owner',
    'NFM-WP-14',
    REPORT_SCHEMA,
    'rmt-ui-primitive-gap',
    'development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md',
    'rmt-ui-primitive-gap-analysis',
    'gate-plan'
  ], 'Registry WP-14 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-14',
    'rmt-ui-primitive-gap',
    'xtend.native-first.rmt-ui-primitive-gap.v1'
  ], 'Registry contract WP-14 extension');

  context.assert(packageScripts['test:rmt-ui-primitive-gap'] === 'node scripts/run_xtend_tests.js rmt-ui-primitive-gap', 'Package exposes WP-14 test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_rmt_ui_primitive_gap_suite')", 'Runner imports WP-14 suite');
  context.assertIncludes(runner, "id: 'rmt-ui-primitive-gap'", 'Runner registers WP-14 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-14 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-14 matrix schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes WP-14 item schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-14 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-14-RMT-UI-Primitive-Gap-Analysis-erstellen.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework dependency');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata preserves RMT kernel boundary');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.gapClasses, REQUIRED_GAP_CLASSES, 'Package metadata gap classes');
  assertArrayIncludesAll(context, metadata && metadata.coverageStatuses, REQUIRED_COVERAGE_STATUSES, 'Package metadata coverage statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Package metadata blocked claims');

  const gaps = (metadata && metadata.gaps) || [];
  context.assert(gaps.length === REQUIRED_GAPS.length, 'Package metadata registers all gap rows');
  REQUIRED_GAPS.forEach((required) => {
    const gap = gaps.find((candidate) => candidate.gapId === required.gapId);
    context.assert(Boolean(gap), `Package metadata registers ${required.gapId}`);
    if (!gap) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(gap[field]), `Package metadata ${required.gapId} has ${field}`);
    });
    context.assert(gap.marketPattern === required.marketPattern, `Package metadata ${required.gapId} has market pattern`);
    context.assert(gap.ownedPrimitivePackage === required.ownedPrimitivePackage, `Package metadata ${required.gapId} has owned package`);
    context.assert(gap.coverageStatus === required.coverageStatus, `Package metadata ${required.gapId} has coverage status`);
    context.assert(gap.priority === required.priority, `Package metadata ${required.gapId} has priority`);
    context.assert(gap.appAuthorableWithoutManualShell === required.appAuthorableWithoutManualShell, `Package metadata ${required.gapId} has authorability status`);
    context.assert(gap.blockedClaim === required.blockedClaim, `Package metadata ${required.gapId} has blocked claim`);
    context.assert(gap.proposedExtension === required.proposedExtension, `Package metadata ${required.gapId} has proposed extension`);
    context.assert(String(gap.nextHandoff).includes(required.nextHandoff), `Package metadata ${required.gapId} has next handoff`);
    assertArrayIncludesAll(context, gap.capabilities, required.capabilities, `Package metadata ${required.gapId} capabilities`);
    assertArrayIncludesAll(context, gap.rmtDomains, required.rmtDomains, `Package metadata ${required.gapId} RMT domains`);
    assertArrayIncludesAll(context, gap.gapClasses, required.gapClasses, `Package metadata ${required.gapId} gap classes`);
    assertArrayIncludesAll(context, gap.sourceContracts, required.sourceContracts, `Package metadata ${required.gapId} source contracts`);
    assertArrayIncludesAll(context, gap.sourceGates, required.sourceGates, `Package metadata ${required.gapId} source gates`);
  });

  const coverageCounts = countBy(gaps, 'coverageStatus');
  context.assert(coverageCounts['authorable-now'] === 3, 'Package metadata counts authorable-now gaps');
  context.assert(coverageCounts['authorable-with-adapter-residual'] === 4, 'Package metadata counts adapter residual gaps');
  context.assert(coverageCounts['contract-only-gap'] === 1, 'Package metadata counts contract-only gaps');
  context.assert(coverageCounts['syntax-growth-needed'] === 2, 'Package metadata counts syntax growth gaps');
  context.assert(coverageCounts['owned-primitive-needed'] === 2, 'Package metadata counts owned primitive gaps');
  const authorabilityCounts = countBy(gaps, 'appAuthorableWithoutManualShell');
  context.assert(authorabilityCounts.yes === 3, 'Package metadata counts fully authorable gaps');
  context.assert(authorabilityCounts.partial === 6, 'Package metadata counts partial authorability gaps');
  context.assert(authorabilityCounts.no === 3, 'Package metadata counts non-authorable gaps');

  const registryEntries = (registryMetadata && registryMetadata.entries) || [];
  context.assert(registryEntries.some((entry) => entry.contractId === CONTRACT_SCHEMA && entry.workpackage === 'NFM-WP-14'), 'Registry package metadata includes WP-14 contract');
  context.assert(Array.isArray(registryMetadata && registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('rmt-ui-primitive-gap'), 'Registry package metadata lists WP-14 source gate');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md', 'WP-14 contract path');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', 'WP-14 matrix path');
  assertPathExists(context, rootDir, 'development/NFM-WP-14-RMT-UI-Primitive-Gap-Analysis-erstellen.md', 'WP-14 workpackage path');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-14',
      contract: CONTRACT_SCHEMA,
      matrixSchema: MATRIX_SCHEMA,
      gapRows: REQUIRED_GAPS.length,
      coverageCounts,
      authorabilityCounts,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      rmtKernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    }
  });
}

function printNativeFirstRmtUiPrimitiveGapReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First RMT UI Primitive Gap Analysis erfolgreich.',
    failureTitle: 'Native-First RMT UI Primitive Gap Analysis fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstRmtUiPrimitiveGapReport,
  runNativeFirstRmtUiPrimitiveGapSuite
};
