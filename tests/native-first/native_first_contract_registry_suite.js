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

const SUITE_ID = 'contract-registry';
const SUITE_LABEL = 'Native-First Contract Registry';
const CONTRACT_SCHEMA = 'xtend.native-first.contract-registry.v1';
const ENTRY_SCHEMA = 'xtend.native-first.contract-registry-entry.v1';
const REGISTRY_SCHEMA = 'xtend.native-first.contract-registry-index.v1';
const DRIFT_SCHEMA = 'xtend.native-first.contract-registry-drift-report.v1';
const REPORT_SCHEMA = 'xtend.native-first.contract-registry-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js contract-registry --json';
const PACKAGE_SCRIPT = 'npm run test:contract-registry';
const INDEX_BOUNDARY = 'registry-is-index-not-runtime-manager';
const KERNEL_BOUNDARY = 'rmt-kernel-remains-host-neutral';

const REQUIRED_FIELDS = Object.freeze([
  'contractId',
  'status',
  'owner',
  'workpackage',
  'phase',
  'reportSchema',
  'localGate',
  'docsPath',
  'sourceOfTruth',
  'domain',
  'evidenceRole'
]);

const REQUIRED_DRIFT_CLASSES = Object.freeze([
  'drift-missing-contract-reference',
  'drift-missing-required-field',
  'drift-missing-docs-path',
  'drift-stale-workpackage-status',
  'drift-stale-report-schema',
  'drift-runtime-manager-claim'
]);

const REQUIRED_DOMAINS = Object.freeze([
  'native-first',
  'component',
  'rmt',
  'kernel',
  'security',
  'supply-chain',
  'release-evidence'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'contract-registry',
  'contract-runtime-parity',
  'rmt-ui-primitive-gap',
  'rmt-syntax-growth',
  'rmt-action-effect-data-resource-primitives',
  'rmt-complete-ui-recipes',
  'rmt-renderer-dom-descriptor-proofs',
  'native-first-budget-gates',
  'native-first-docs-authoring',
  'native-first-migration-deprecation',
  'native-first-mission-handoff',
  'native-first-evidence-pack',
  'native-first-market-pattern-parity',
  'native-first-framework-leverage',
  'native-first-form-navigation-media',
  'native-first-overlay-focus',
  'references',
  'supply-chain'
]);

const REQUIRED_NATIVE_CONTRACTS = Object.freeze([
  {
    contractId: 'xtend.native-first.mission-source-of-truth.v1',
    workpackage: 'NFM-WP-01',
    status: 'accepted',
    owner: 'native-first-mission-owner',
    reportSchema: 'xtend.native-first.mission-source-of-truth-report.v1',
    localGate: 'native-first-mission-roadmap',
    docsPath: 'development/XTend-Native-First-Mission-Source-of-Truth-Contract.md',
    sourceOfTruth: 'mission-source-of-truth',
    domain: 'native-first',
    evidenceRole: 'source-contract',
    phase: 'Phase 0'
  },
  {
    contractId: 'xtend.native-first.browser-primitive-radar.v2',
    workpackage: 'NFM-WP-02',
    status: 'accepted',
    owner: 'browser-primitive-owner',
    reportSchema: 'xtend.native-first.browser-primitive-radar-report.v2',
    localGate: 'browser-primitive-radar',
    docsPath: 'development/XTend-Native-First-Browser-Primitive-Radar-Contract.md',
    sourceOfTruth: 'browser-primitive-radar',
    domain: 'native-first',
    evidenceRole: 'source-contract',
    phase: 'Phase 1'
  },
  {
    contractId: 'xtend.native-first.primitive-adoption-gate.v2',
    workpackage: 'NFM-WP-03',
    status: 'accepted',
    owner: 'architecture-governance-owner',
    reportSchema: 'xtend.native-first.primitive-adoption-gate-report.v2',
    localGate: 'primitive-adoption-gate',
    docsPath: 'development/XTend-Native-Primitive-Adoption-Gate-Contract.md',
    sourceOfTruth: 'primitive-adoption-gate',
    domain: 'native-first',
    evidenceRole: 'gate-plan',
    phase: 'Phase 1'
  },
  {
    contractId: 'xtend.native-first.observatory-intake.v1',
    workpackage: 'OBS-2026-09-03',
    status: 'accepted-internal-intake',
    owner: 'architecture-governance-owner',
    reportSchema: 'xtend.native-first.browser-primitive-radar-report.v2',
    localGate: 'browser-primitive-radar',
    docsPath: 'development/XTend-Native-First-Feature-Adoption-Observatory-Contract.md',
    sourceOfTruth: 'feature-adoption-observatory',
    domain: 'native-first',
    evidenceRole: 'source-contract',
    phase: 'Continuous Review'
  },
  {
    contractId: 'xtend.native-first.dependency-diet-policy.v1',
    workpackage: 'NFM-WP-04',
    status: 'accepted',
    owner: 'supply-chain-owner',
    reportSchema: 'xtend.native-first.dependency-diet-policy-report.v1',
    localGate: 'dependency-diet-policy',
    docsPath: 'development/XTend-Native-First-Dependency-Diet-Policy-Contract.md',
    sourceOfTruth: 'dependency-diet-policy',
    domain: 'supply-chain',
    evidenceRole: 'gate-plan',
    phase: 'Phase 1'
  },
  {
    contractId: 'xtend.native-first.vendor-legacy-replacement.v1',
    workpackage: 'NFM-WP-05',
    status: 'accepted-with-residuals',
    owner: 'dependency-migration-owner',
    reportSchema: 'xtend.native-first.vendor-legacy-replacement-report.v1',
    localGate: 'vendor-legacy-replacement',
    docsPath: 'development/XTend-Native-First-Vendor-Legacy-Replacement-Contract.md',
    sourceOfTruth: 'vendor-legacy-replacement',
    domain: 'supply-chain',
    evidenceRole: 'handoff',
    phase: 'Phase 1'
  },
  {
    contractId: 'xtend.native-first.ui-primitive-capability.v1',
    workpackage: 'NFM-WP-06',
    status: 'accepted',
    owner: 'component-platform-owner',
    reportSchema: 'xtend.native-first.ui-primitive-capability-report.v1',
    localGate: 'ui-primitive-capability',
    docsPath: 'development/XTend-Native-First-UI-Primitive-Capability-Contract.md',
    sourceOfTruth: 'ui-primitive-capability-matrix',
    domain: 'component',
    evidenceRole: 'source-contract',
    phase: 'Phase 2'
  },
  {
    contractId: 'xtend.native-first.overlay-focus-hardening.v1',
    workpackage: 'NFM-WP-07',
    status: 'accepted',
    owner: 'component-overlay-owner',
    reportSchema: 'xtend.native-first.overlay-focus-hardening-report.v1',
    localGate: 'native-first-overlay-focus',
    docsPath: 'development/XTend-Native-First-Overlay-Focus-Hardening-Contract.md',
    sourceOfTruth: 'overlay-focus-hardening',
    domain: 'component',
    evidenceRole: 'runtime-contract',
    phase: 'Phase 2'
  },
  {
    contractId: 'xtend.native-first.form-navigation-media-hardening.v1',
    workpackage: 'NFM-WP-08',
    status: 'accepted',
    owner: 'component-forms-navigation-owner',
    reportSchema: 'xtend.native-first.form-navigation-media-hardening-report.v1',
    localGate: 'native-first-form-navigation-media',
    docsPath: 'development/XTend-Native-First-Form-Navigation-Media-Hardening-Contract.md',
    sourceOfTruth: 'form-navigation-media-hardening',
    domain: 'component',
    evidenceRole: 'runtime-contract',
    phase: 'Phase 2'
  },
  {
    contractId: 'xtend.native-first.framework-leverage-layer.v1',
    workpackage: 'NFM-WP-09',
    status: 'accepted',
    owner: 'framework-leverage-owner',
    reportSchema: 'xtend.native-first.framework-leverage-layer-report.v1',
    localGate: 'native-first-framework-leverage',
    docsPath: 'development/XTend-Native-First-Framework-Leverage-Layer-Contract.md',
    sourceOfTruth: 'framework-leverage-layer',
    domain: 'component',
    evidenceRole: 'source-contract',
    phase: 'Phase 2'
  },
  {
    contractId: 'xtend.native-first.market-pattern-parity.v1',
    workpackage: 'NFM-WP-10',
    status: 'accepted-with-residuals',
    owner: 'product-parity-owner',
    reportSchema: 'xtend.native-first.market-pattern-parity-report.v1',
    localGate: 'native-first-market-pattern-parity',
    docsPath: 'development/XTend-Native-First-Market-Pattern-Parity-Contract.md',
    sourceOfTruth: 'market-pattern-parity',
    domain: 'native-first',
    evidenceRole: 'handoff',
    phase: 'Phase 2'
  },
  {
    contractId: 'xtend.native-first.contract-registry.v1',
    workpackage: 'NFM-WP-11',
    status: 'accepted',
    owner: 'contract-governance-owner',
    reportSchema: REPORT_SCHEMA,
    localGate: 'contract-registry',
    docsPath: 'development/XTend-Native-First-Contract-Registry-Contract.md',
    sourceOfTruth: 'contract-registry',
    domain: 'native-first',
    evidenceRole: 'source-contract',
    phase: 'Phase 3'
  },
  {
    contractId: 'xtend.native-first.contract-runtime-parity.v1',
    workpackage: 'NFM-WP-12',
    status: 'accepted',
    owner: 'contract-parity-owner',
    reportSchema: 'xtend.native-first.contract-runtime-parity-report.v1',
    localGate: 'contract-runtime-parity',
    docsPath: 'development/XTend-Native-First-Contract-Runtime-Parity-Contract.md',
    sourceOfTruth: 'contract-runtime-parity',
    domain: 'native-first',
    evidenceRole: 'gate-plan',
    phase: 'Phase 3'
  },
  {
    contractId: 'xtend.native-first.audit-evidence-pack.v1',
    workpackage: 'NFM-WP-13',
    status: 'accepted',
    owner: 'audit-evidence-owner',
    reportSchema: 'xtend.native-first.audit-evidence-pack-report.v1',
    localGate: 'native-first-evidence-pack',
    docsPath: 'development/XTend-Native-First-Audit-Evidence-Pack-Contract.md',
    sourceOfTruth: 'audit-evidence-pack',
    domain: 'native-first',
    evidenceRole: 'release-pack',
    phase: 'Phase 3'
  },
  {
    contractId: 'xtend.native-first.rmt-ui-primitive-gap.v1',
    workpackage: 'NFM-WP-14',
    status: 'accepted-with-prioritized-gaps',
    owner: 'rmt-ui-authoring-owner',
    reportSchema: 'xtend.native-first.rmt-ui-primitive-gap-report.v1',
    localGate: 'rmt-ui-primitive-gap',
    docsPath: 'development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md',
    sourceOfTruth: 'rmt-ui-primitive-gap-analysis',
    domain: 'rmt',
    evidenceRole: 'gate-plan',
    phase: 'Phase 4'
  },
  {
    contractId: 'xtend.native-first.rmt-syntax-growth.v1',
    workpackage: 'NFM-WP-15',
    status: 'accepted-with-migration-fixtures',
    owner: 'rmt-language-owner',
    reportSchema: 'xtend.native-first.rmt-syntax-growth-report.v1',
    localGate: 'rmt-syntax-growth',
    docsPath: 'development/XTend-Native-First-RMT-Syntax-Growth-Contract.md',
    sourceOfTruth: 'rmt-syntax-growth-decision-matrix',
    domain: 'rmt',
    evidenceRole: 'gate-plan',
    phase: 'Phase 4'
  },
  {
    contractId: 'xtend.native-first.rmt-action-effect-data-resource-primitives.v1',
    workpackage: 'NFM-WP-16',
    status: 'accepted-with-runtime-source-gates',
    owner: 'rmt-resource-action-owner',
    reportSchema: 'xtend.native-first.rmt-action-effect-data-resource-primitives-report.v1',
    localGate: 'rmt-action-effect-data-resource-primitives',
    docsPath: 'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md',
    sourceOfTruth: 'rmt-action-effect-data-resource-primitives-matrix',
    domain: 'rmt',
    evidenceRole: 'gate-plan',
    phase: 'Phase 4'
  },
  {
    contractId: 'xtend.native-first.rmt-complete-ui-recipe-fixtures.v1',
    workpackage: 'NFM-WP-17',
    status: 'accepted-with-recipe-fixtures',
    owner: 'rmt-recipe-owner',
    reportSchema: 'xtend.native-first.rmt-complete-ui-recipe-fixtures-report.v1',
    localGate: 'rmt-complete-ui-recipes',
    docsPath: 'development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md',
    sourceOfTruth: 'rmt-complete-ui-recipe-matrix',
    domain: 'rmt',
    evidenceRole: 'gate-plan',
    phase: 'Phase 4'
  },
  {
    contractId: 'xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1',
    workpackage: 'NFM-WP-18',
    status: 'accepted-with-renderer-proof-fixtures',
    owner: 'rmt-renderer-security-owner',
    reportSchema: 'xtend.native-first.rmt-renderer-dom-descriptor-proofs-report.v1',
    localGate: 'rmt-renderer-dom-descriptor-proofs',
    docsPath: 'development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md',
    sourceOfTruth: 'rmt-renderer-dom-descriptor-proof-matrix',
    domain: 'rmt',
    evidenceRole: 'gate-plan',
    phase: 'Phase 4'
  },
  {
    contractId: 'xtend.native-first.performance-complexity-bundle-budget-gates.v1',
    workpackage: 'NFM-WP-19',
    status: 'accepted-with-budget-gates',
    owner: 'performance-owner',
    reportSchema: 'xtend.native-first.performance-complexity-bundle-budget-gates-report.v1',
    localGate: 'native-first-budget-gates',
    docsPath: 'development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md',
    sourceOfTruth: 'performance-complexity-bundle-budget-gates',
    domain: 'native-first',
    evidenceRole: 'gate-plan',
    phase: 'Phase 5'
  },
  {
    contractId: 'xtend.native-first.docs-authoring-guides.v1',
    workpackage: 'NFM-WP-20',
    status: 'accepted-with-authoring-guides',
    owner: 'docs-authoring-owner',
    reportSchema: 'xtend.native-first.docs-authoring-guides-report.v1',
    localGate: 'native-first-docs-authoring',
    docsPath: 'development/XTend-Native-First-Docs-Authoring-Guides-Contract.md',
    sourceOfTruth: 'docs-authoring-guides',
    domain: 'native-first',
    evidenceRole: 'docs-surface',
    phase: 'Phase 5'
  },
  {
    contractId: 'xtend.native-first.migration-deprecation-plan.v1',
    workpackage: 'NFM-WP-21',
    status: 'accepted-with-migration-deprecation-plan',
    owner: 'migration-owner',
    reportSchema: 'xtend.native-first.migration-deprecation-report.v1',
    localGate: 'native-first-migration-deprecation',
    docsPath: 'development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md',
    sourceOfTruth: 'migration-deprecation-plan',
    domain: 'native-first',
    evidenceRole: 'migration-plan',
    phase: 'Phase 5'
  },
  {
    contractId: 'xtend.native-first.mission-handoff.v1',
    workpackage: 'NFM-WP-22',
    status: 'accepted-with-mission-handoff',
    owner: 'native-first-mission-owner',
    reportSchema: 'xtend.native-first.mission-handoff-report.v1',
    localGate: 'native-first-mission-handoff',
    docsPath: 'development/XTend-Native-First-Mission-Handoff-Contract.md',
    sourceOfTruth: 'mission-handoff',
    domain: 'native-first',
    evidenceRole: 'final-handoff',
    phase: 'Phase 5'
  }
]);

const REQUIRED_CROSS_DOMAIN_CONTRACTS = Object.freeze([
  'xtend.component.contract.v2',
  'xtend.rmt.core-format.vnext.v1',
  'xtend.rmt.vnext-scheduler-policy.v1',
  'xtend.rmt.vnext-surface-registry.v1',
  'xtend.rmt.kernel-trust-hardening.v1',
  'xtend.security.trusted-dom-policy.v1',
  'xtend.security.supply-chain-gate-plan.v1',
  'xtend.epic13.rc1-gate-matrix.v1'
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

function runNativeFirstContractRegistrySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const workpackage = readText('development/NFM-WP-11-Contract-Registry-und-Contract-Discoverability-produktisieren.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const capabilityMatrix = readText('development/XTend-Native-First-UI-Primitive-Capability-Matrix.md', rootDir);
  const capabilityContract = readText('development/XTend-Native-First-UI-Primitive-Capability-Contract.md', rootDir);
  const adoptionGate = readText('development/XTend-Native-Primitive-Adoption-Gate-Contract.md', rootDir);
  const marketContract = readText('development/XTend-Native-First-Market-Pattern-Parity-Contract.md', rootDir);
  const marketWorkpackage = readText('development/NFM-WP-10-Market-Pattern-Parity-Matrix-ohne-Framework-Abhaengigkeit-erstellen.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  context.assertIncludes(contract, CONTRACT_SCHEMA, 'Contract declares schema');
  context.assertIncludes(contract, ENTRY_SCHEMA, 'Contract declares entry schema');
  context.assertIncludes(contract, REGISTRY_SCHEMA, 'Contract declares registry schema');
  context.assertIncludes(contract, DRIFT_SCHEMA, 'Contract declares drift report schema');
  context.assertIncludes(contract, REPORT_SCHEMA, 'Contract declares report schema');
  assertIncludesAll(context, contract, [INDEX_BOUNDARY, KERNEL_BOUNDARY, 'contracts-are-auditable-product-surface'], 'Contract boundaries');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract entry fields');
  assertIncludesAll(context, contract, REQUIRED_DRIFT_CLASSES, 'Contract drift classes');
  assertIncludesAll(context, contract, REQUIRED_DOMAINS, 'Contract connected domains');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');

  context.assertIncludes(registry, REGISTRY_SCHEMA, 'Registry declares schema');
  context.assertIncludes(registry, DRIFT_SCHEMA, 'Registry declares drift report schema');
  context.assertIncludes(registry, LOCAL_GATE, 'Registry declares local gate');
  assertIncludesAll(context, registry, REQUIRED_FIELDS, 'Registry required fields');
  assertIncludesAll(context, registry, REQUIRED_DRIFT_CLASSES, 'Registry drift classes');
  assertIncludesAll(context, registry, REQUIRED_DOMAINS, 'Registry connected domains');
  assertIncludesAll(context, registry, REQUIRED_CROSS_DOMAIN_CONTRACTS, 'Registry cross-domain contracts');
  REQUIRED_NATIVE_CONTRACTS.forEach((entry) => {
    assertIncludesAll(context, registry, [
      entry.contractId,
      entry.workpackage,
      entry.status,
      entry.owner,
      entry.reportSchema,
      entry.localGate,
      entry.docsPath,
      entry.sourceOfTruth,
      entry.domain,
      entry.evidenceRole,
      entry.phase
    ], `Registry entry ${entry.contractId}`);
    assertPathExists(context, rootDir, entry.docsPath, `Registry docs path for ${entry.contractId}`);
  });
  context.assert(!registry.includes('runtimeManager') && !registry.includes('Runtime Manager'), 'Registry does not claim runtime manager role');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  context.assertIncludes(workpackage, CONTRACT_SCHEMA, 'Workpackage declares contract schema');
  context.assertIncludes(workpackage, REGISTRY_SCHEMA, 'Workpackage declares registry schema');
  context.assertIncludes(workpackage, LOCAL_GATE, 'Workpackage declares local gate');
  assertIncludesAll(context, workpackage, REQUIRED_DRIFT_CLASSES, 'Workpackage drift classes');
  assertIncludesAll(context, workpackage, REQUIRED_SOURCE_GATES, 'Workpackage verification gates');

  context.assertIncludes(roadmap, '| `NFM-WP-11` | P0 | completed |', 'Roadmap marks NFM-WP-11 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-12` | P0 | ready |') || roadmap.includes('| `NFM-WP-12` | P0 | completed |'),
    'Roadmap marks NFM-WP-12 ready or completed'
  );
  context.assert(
    roadmap.includes('| `NFM-WP-13` | P1 | next |') || roadmap.includes('| `NFM-WP-13` | P1 | ready |') || roadmap.includes('| `NFM-WP-13` | P1 | completed |'),
    'Roadmap keeps NFM-WP-13 next, ready or completed'
  );
  context.assert(
    roadmap.includes('| `NFM-WP-14` | P0 | ready |') || roadmap.includes('| `NFM-WP-14` | P0 | completed |'),
    'Roadmap keeps NFM-WP-14 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Contract-Registry-Contract.md', 'Roadmap references WP-11 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-11 gate');

  context.assertIncludes(mission, 'Contract Registry Contract: `xtend.native-first.contract-registry.v1`', 'Mission references WP-11 contract');
  context.assertIncludes(mission, '`NFM-WP-11` | completed', 'Mission handoff marks WP-11 completed');
  context.assert(
    mission.includes('`NFM-WP-12` | ready') || mission.includes('`NFM-WP-12` | completed'),
    'Mission handoff marks WP-12 ready or completed'
  );
  context.assert(
    mission.includes('`NFM-WP-13` | ready') || mission.includes('`NFM-WP-13` | completed'),
    'Mission handoff marks WP-13 ready or completed'
  );
  context.assertIncludes(mission, 'development/XTend-Native-First-Contract-Registry.md', 'Mission source-of-truth lists registry');
  context.assertIncludes(capabilityMatrix, 'Contract Registry', 'Capability matrix records contract registry baseline');
  context.assertIncludes(capabilityContract, '`NFM-WP-11` | Contract Registry inventarisiert Capability- und Contract-Oberflaechen', 'Capability contract hands off WP-11');
  context.assertIncludes(adoptionGate, '`NFM-WP-11`', 'Adoption gate hands off to WP-11');
  context.assertIncludes(marketContract, '`NFM-WP-11` hat Pattern-IDs in die Contract Registry aufgenommen', 'Market contract records WP-11 completion');
  context.assertIncludes(marketWorkpackage, '`NFM-WP-11` hat Pattern-IDs und Claim-Status in Contract Registry/Discoverability aufgenommen', 'Market workpackage records WP-11 completion');

  context.assert(packageScripts['test:contract-registry'] === 'node scripts/run_xtend_tests.js contract-registry', 'Package exposes contract registry test script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/native_first_contract_registry_suite.js" }), 'Runner imports contract registry suite');
  context.assert(runner.hasSuite("contract-registry"), 'Runner registers contract registry suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-11 contract schema');
  context.assert(metadata && metadata.entrySchema === ENTRY_SCHEMA, 'Package metadata exposes WP-11 entry schema');
  context.assert(metadata && metadata.registrySchema === REGISTRY_SCHEMA, 'Package metadata exposes WP-11 registry schema');
  context.assert(metadata && metadata.driftReportSchema === DRIFT_SCHEMA, 'Package metadata exposes WP-11 drift schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-11 report schema');
  context.assert(metadata && metadata.registry === 'development/XTend-Native-First-Contract-Registry.md', 'Package metadata exposes registry path');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-Contract-Registry-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-11-Contract-Registry-und-Contract-Discoverability-produktisieren.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.registryIsRuntimeManager === false, 'Package metadata declares registry is not runtime manager');
  context.assert(metadata && metadata.driftReportRequired === true, 'Package metadata requires drift report');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.driftClasses, REQUIRED_DRIFT_CLASSES, 'Package metadata drift classes');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');

  const entries = (metadata && metadata.entries) || [];
  REQUIRED_NATIVE_CONTRACTS.forEach((required) => {
    const entry = entries.find((candidate) => candidate.contractId === required.contractId);
    context.assert(Boolean(entry), `Package metadata registers ${required.contractId}`);
    if (!entry) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(entry[field]), `Package metadata ${required.contractId} has ${field}`);
    });
    context.assert(entry.status === required.status, `Package metadata ${required.contractId} has status ${required.status}`);
    context.assert(entry.owner === required.owner, `Package metadata ${required.contractId} has owner ${required.owner}`);
    context.assert(entry.workpackage === required.workpackage, `Package metadata ${required.contractId} has workpackage ${required.workpackage}`);
    context.assert(entry.reportSchema === required.reportSchema, `Package metadata ${required.contractId} has report schema ${required.reportSchema}`);
    context.assert(entry.localGate === required.localGate, `Package metadata ${required.contractId} has gate ${required.localGate}`);
    context.assert(entry.docsPath === required.docsPath, `Package metadata ${required.contractId} has docs path ${required.docsPath}`);
    context.assert(entry.sourceOfTruth === required.sourceOfTruth, `Package metadata ${required.contractId} has source of truth ${required.sourceOfTruth}`);
    context.assert(entry.domain === required.domain, `Package metadata ${required.contractId} has domain ${required.domain}`);
    context.assert(entry.evidenceRole === required.evidenceRole, `Package metadata ${required.contractId} has evidence role ${required.evidenceRole}`);
    context.assert(entry.phase === required.phase, `Package metadata ${required.contractId} has phase ${required.phase}`);
    assertPathExists(context, rootDir, entry.docsPath, `Package metadata docs path for ${required.contractId}`);
  });

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-11',
      contract: CONTRACT_SCHEMA,
      registrySchema: REGISTRY_SCHEMA,
      nativeContracts: REQUIRED_NATIVE_CONTRACTS.length,
      crossDomainContracts: REQUIRED_CROSS_DOMAIN_CONTRACTS.length,
      driftClasses: REQUIRED_DRIFT_CLASSES.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      localGate: LOCAL_GATE,
      registryIsRuntimeManager: false,
      noRuntimeDependency: true
    }
  });
}

function printNativeFirstContractRegistryReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Contract Registry erfolgreich.',
    failureTitle: 'Native-First Contract Registry fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstContractRegistryReport,
  runNativeFirstContractRegistrySuite
};
