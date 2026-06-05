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

const SUITE_ID = 'contract-runtime-parity';
const SUITE_LABEL = 'Native-First Contract-to-Runtime Parity';
const CONTRACT_SCHEMA = 'xtend.native-first.contract-runtime-parity.v1';
const MATRIX_SCHEMA = 'xtend.native-first.contract-runtime-parity-matrix.v1';
const DRIFT_SCHEMA = 'xtend.native-first.contract-runtime-parity-drift-report.v1';
const REPORT_SCHEMA = 'xtend.native-first.contract-runtime-parity-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js contract-runtime-parity --json';
const PACKAGE_SCRIPT = 'npm run test:contract-runtime-parity';
const REGISTRY_SCHEMA = 'xtend.native-first.contract-registry-index.v1';
const KERNEL_BOUNDARY = 'rmt-kernel-remains-host-neutral';

const REQUIRED_FIELDS = Object.freeze([
  'parityId',
  'contractId',
  'domain',
  'owner',
  'contractPath',
  'runtimeArtifacts',
  'testGate',
  'docsPath',
  'reportSchema',
  'parityStatus',
  'residual',
  'nextHandoff'
]);

const REQUIRED_DRIFT_CLASSES = Object.freeze([
  'contract-drift',
  'runtime-drift',
  'test-gate-drift',
  'docs-drift',
  'report-schema-drift',
  'residual-owner-drift',
  'kernel-boundary-drift',
  'supply-chain-drift'
]);

const REQUIRED_DOMAINS = Object.freeze([
  'component',
  'rmt',
  'kernel',
  'security',
  'supply-chain',
  'native-first'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'contract-runtime-parity',
  'contract-registry',
  'component-contract-v2',
  'rmt-vnext-compiler',
  'rmt-vnext-scheduler',
  'rmt-vnext-surfaces',
  'rmt-kernel-trust-authority',
  'rmt-kernel-trusted-dom-runtime',
  'rmt-kernel-binding-security',
  'rmt-kernel-policy-parity',
  'rmt-kernel-security-regression',
  'supply-chain',
  'references'
]);

const REQUIRED_PARITY_ROWS = Object.freeze([
  {
    parityId: 'NFM-CRP-01',
    contractId: 'xtend.component.contract.v2',
    domain: 'component',
    owner: 'component-platform-owner',
    contractPath: 'development/XTend-Component-Contract-v2.md',
    runtimeArtifacts: [
      'components/manifest.json',
      'xtend-builder/typing/component-contract-v2.js',
      'tests/components/component_contract_v2_suite.js'
    ],
    testGate: 'component-contract-v2',
    docsPath: 'development/XTend-Component-Contract-v2.md',
    reportSchema: 'xtend.component.contract-report.v2',
    parityStatus: 'parity-covered',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  },
  {
    parityId: 'NFM-CRP-02',
    contractId: 'xtend.rmt.core-format.vnext.v1',
    domain: 'rmt',
    owner: 'rmt-language-owner',
    contractPath: 'development/XTendRMT-vNext-Core-Format-Contract.md',
    runtimeArtifacts: [
      'tools/rmt-language/vnext-compiler.js',
      'tests/rmt-language/rmt_vnext_compiler_suite.js',
      'xtendrmt/rmt.schema.json'
    ],
    testGate: 'rmt-vnext-compiler',
    docsPath: 'development/XTendRMT-vNext-Core-Format-Contract.md',
    reportSchema: 'xtend.rmt.vnext-compiler-report.v1',
    parityStatus: 'parity-covered-with-residual',
    residual: 'NFM-WP-14 quantifiziert UI-Primitive-Abdeckung gegen Core Domains',
    nextHandoff: 'NFM-WP-14'
  },
  {
    parityId: 'NFM-CRP-03',
    contractId: 'xtend.rmt.vnext-scheduler-policy.v1',
    domain: 'rmt',
    owner: 'scheduler-owner',
    contractPath: 'development/XTendRMT-vNext-Scheduler-Policy-Contract.md',
    runtimeArtifacts: [
      'tools/rmt-language/vnext-scheduler.js',
      'tests/rmt-language/rmt_vnext_scheduler_suite.js',
      'tests/rmt-language/fixtures/vnext-scheduler-valid.rmt'
    ],
    testGate: 'rmt-vnext-scheduler',
    docsPath: 'development/XTendRMT-vNext-Scheduler-Policy-Contract.md',
    reportSchema: 'xtend.rmt.vnext-scheduler-report.v1',
    parityStatus: 'parity-covered',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  },
  {
    parityId: 'NFM-CRP-04',
    contractId: 'xtend.rmt.vnext-surface-registry.v1',
    domain: 'rmt',
    owner: 'surface-runtime-owner',
    contractPath: 'development/XTendRMT-vNext-Surface-Registry-Contract.md',
    runtimeArtifacts: [
      'tools/rmt-language/vnext-surfaces.js',
      'tests/rmt-language/rmt_vnext_surface_registry_suite.js',
      'tests/rmt-language/fixtures/vnext-surfaces-valid.rmt'
    ],
    testGate: 'rmt-vnext-surfaces',
    docsPath: 'development/XTendRMT-vNext-Surface-Registry-Contract.md',
    reportSchema: 'xtend.rmt.vnext-surface-report.v1',
    parityStatus: 'parity-covered-with-residual',
    residual: 'NFM-WP-14 prueft Surface- und UI-Maximality fuer App-/Overlay-/Workspace-UIs',
    nextHandoff: 'NFM-WP-14'
  },
  {
    parityId: 'NFM-CRP-05',
    contractId: 'xtend.rmt.kernel-trust-hardening.v1',
    domain: 'kernel',
    owner: 'kernel-security-owner',
    contractPath: 'development/XTendRMT-Kernel-Trust-Hardening-Contract.md',
    runtimeArtifacts: [
      'tools/rmt-language/kernel-trust-authority.js',
      'xtendrmt/rmt-core.esm.js',
      'tests/rmt-language/rmt_kernel_trust_authority_suite.js'
    ],
    testGate: 'rmt-kernel-trust-authority',
    docsPath: 'development/XTendRMT-Kernel-Trust-Hardening-Contract.md',
    reportSchema: 'xtend.rmt.kernel-trust-authority-report.v1',
    parityStatus: 'parity-covered',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  },
  {
    parityId: 'NFM-CRP-06',
    contractId: 'xtend.rmt.kernel-trusted-dom-runtime.v1',
    domain: 'kernel',
    owner: 'kernel-security-owner',
    contractPath: 'development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md',
    runtimeArtifacts: [
      'xtendrmt/rmt-core.esm.js',
      'xtendrmt/rmt-runtime.esm.js',
      'xtendrmt/rmt-runtime.browser.js',
      'tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite.js'
    ],
    testGate: 'rmt-kernel-trusted-dom-runtime',
    docsPath: 'development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md',
    reportSchema: 'xtend.rmt.kernel-trusted-dom-runtime-report.v1',
    parityStatus: 'parity-covered',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  },
  {
    parityId: 'NFM-CRP-07',
    contractId: 'xtend.rmt.kernel-policy-parity.v1',
    domain: 'kernel',
    owner: 'kernel-policy-owner',
    contractPath: 'development/XTendRMT-Kernel-Policy-Parity-Contract.md',
    runtimeArtifacts: [
      'tools/rmt-language/kernel-policy-parity.js',
      'xtendrmt/rmt-core.esm.js',
      'tests/rmt-language/rmt_kernel_policy_parity_suite.js'
    ],
    testGate: 'rmt-kernel-policy-parity',
    docsPath: 'development/XTendRMT-Kernel-Policy-Parity-Contract.md',
    reportSchema: 'xtend.rmt.kernel-policy-parity-report.v1',
    parityStatus: 'parity-covered',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  },
  {
    parityId: 'NFM-CRP-08',
    contractId: 'xtend.rmt.kernel-security-regression.v1',
    domain: 'kernel',
    owner: 'kernel-security-owner',
    contractPath: 'development/XTendRMT-Kernel-Security-Regression-Contract.md',
    runtimeArtifacts: [
      'tools/rmt-language/kernel-security-regression.js',
      'tests/rmt-language/fixtures/kernel-security-regression-fixtures.json',
      'tests/browser/fixtures/rmt-kernel-security-regression-smoke.html'
    ],
    testGate: 'rmt-kernel-security-regression',
    docsPath: 'development/XTendRMT-Kernel-Security-Regression-Contract.md',
    reportSchema: 'xtend.rmt.kernel-security-regression-report.v1',
    parityStatus: 'parity-covered',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  },
  {
    parityId: 'NFM-CRP-09',
    contractId: 'xtend.security.trusted-dom-policy.v1',
    domain: 'security',
    owner: 'security-owner',
    contractPath: 'development/XTend-Trusted-DOM-und-Sanitizing-Policy.md',
    runtimeArtifacts: [
      'security/trusted-dom-policy.js',
      'security/trusted-dom-policy.d.ts',
      'catalog/epic13-trusted-dom-boundary.js'
    ],
    testGate: 'epic13-trusted-dom-boundary',
    docsPath: 'development/XTend-Trusted-DOM-und-Sanitizing-Policy.md',
    reportSchema: 'xtend.epic13.trusted-dom-boundary-report.v1',
    parityStatus: 'parity-covered-with-residual',
    residual: 'NFM-WP-18 prueft browsernahe DOM-Descriptor- und Renderer-Proofs',
    nextHandoff: 'NFM-WP-18'
  },
  {
    parityId: 'NFM-CRP-10',
    contractId: 'xtend.security.supply-chain-gate-plan.v1',
    domain: 'supply-chain',
    owner: 'supply-chain-owner',
    contractPath: 'development/XTend-Supply-Chain-Gate-Plan.md',
    runtimeArtifacts: [
      'security/supply-chain-gate-policy.js',
      'security/supply-chain-gate-policy.d.ts',
      'package-lock.json'
    ],
    testGate: 'supply-chain',
    docsPath: 'development/XTend-Supply-Chain-Gate-Plan.md',
    reportSchema: 'xtend.security.supply-chain-report.v1',
    parityStatus: 'parity-covered',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  },
  {
    parityId: 'NFM-CRP-11',
    contractId: 'xtend.native-first.contract-registry.v1',
    domain: 'native-first',
    owner: 'contract-governance-owner',
    contractPath: 'development/XTend-Native-First-Contract-Registry-Contract.md',
    runtimeArtifacts: [
      'development/XTend-Native-First-Contract-Registry.md',
      'tests/native-first/native_first_contract_registry_suite.js',
      'package.json'
    ],
    testGate: 'contract-registry',
    docsPath: 'development/XTend-Native-First-Contract-Registry.md',
    reportSchema: 'xtend.native-first.contract-registry-report.v1',
    parityStatus: 'docs-report-parity',
    residual: 'none',
    nextHandoff: 'NFM-WP-13'
  }
]);

const REQUIRED_METADATA_LINKS = Object.freeze([
  {
    key: 'componentContractV2',
    schemaField: 'schema',
    schema: 'xtend.component.contract.v2',
    localGate: 'node scripts/run_xtend_tests.js component-contract-v2 --json'
  },
  {
    key: 'rmtVNextCompiler',
    schemaField: 'coreSchema',
    schema: 'xtend.rmt.core-format.vnext.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-vnext-compiler --json'
  },
  {
    key: 'rmtVNextScheduler',
    schemaField: 'schema',
    schema: 'xtend.rmt.vnext-scheduler-policy.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-vnext-scheduler --json'
  },
  {
    key: 'rmtVNextSurfaces',
    schemaField: 'schema',
    schema: 'xtend.rmt.vnext-surface-registry.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-vnext-surfaces --json'
  },
  {
    key: 'rmtKernelTrustAuthority',
    schemaField: 'hardeningContract',
    schema: 'xtend.rmt.kernel-trust-hardening.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json'
  },
  {
    key: 'rmtKernelTrustedDomRuntime',
    schemaField: 'schema',
    schema: 'xtend.rmt.kernel-trusted-dom-runtime.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json'
  },
  {
    key: 'rmtKernelPolicyParity',
    schemaField: 'schema',
    schema: 'xtend.rmt.kernel-policy-parity.v1',
    localGate: 'node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json'
  },
  {
    key: 'supplyChain',
    schemaField: 'schema',
    schema: 'xtend.security.supply-chain-gate-plan.v1',
    localGate: 'node scripts/verify_supply_chain_policy.js --json'
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

function assertPathExists(context, rootDir, relativePath, label) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), `${label} exists at ${relativePath}`);
}

function assertRunnerGate(context, runner, gate) {
  if (gate === 'supply-chain') {
    context.assertIncludes(runner, "id: 'supply-chain'", 'Runner registers supply-chain source gate');
    return;
  }
  context.assertIncludes(runner, `id: '${gate}'`, `Runner registers ${gate}`);
}

function runNativeFirstContractRuntimeParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Contract-Runtime-Parity-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-12-Contract-to-Runtime-Parity-Gate-fuer-Kernel-Components-und-RMT-bauen.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRuntimeParity;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  context.assertIncludes(contract, CONTRACT_SCHEMA, 'Contract declares schema');
  context.assertIncludes(contract, MATRIX_SCHEMA, 'Contract declares matrix schema');
  context.assertIncludes(contract, DRIFT_SCHEMA, 'Contract declares drift schema');
  context.assertIncludes(contract, REPORT_SCHEMA, 'Contract declares report schema');
  context.assertIncludes(contract, REGISTRY_SCHEMA, 'Contract declares source registry schema');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, REQUIRED_DRIFT_CLASSES, 'Contract drift classes');
  assertIncludesAll(context, contract, REQUIRED_DOMAINS, 'Contract domains');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'contracts-require-runtime-test-docs-report-counterparts',
    'owner-reviewed-residuals-are-allowed-only-if-explicit',
    'kernel-component-rmt-supply-chain-parity-required',
    'runtime-parity-does-not-create-runtime-coupling',
    KERNEL_BOUNDARY
  ], 'Contract boundaries');

  context.assertIncludes(matrix, MATRIX_SCHEMA, 'Matrix declares schema');
  context.assertIncludes(matrix, LOCAL_GATE, 'Matrix declares local gate');
  assertIncludesAll(context, matrix, REQUIRED_DRIFT_CLASSES, 'Matrix drift classes');
  assertIncludesAll(context, matrix, REQUIRED_DOMAINS, 'Matrix domains');
  REQUIRED_PARITY_ROWS.forEach((row) => {
    assertIncludesAll(context, matrix, [
      row.parityId,
      row.contractId,
      row.domain,
      row.owner,
      row.contractPath,
      row.testGate,
      row.docsPath,
      row.reportSchema,
      row.parityStatus,
      row.residual,
      row.nextHandoff
    ], `Matrix row ${row.parityId}`);
    row.runtimeArtifacts.forEach((artifact) => {
      context.assertIncludes(matrix, artifact, `Matrix row ${row.parityId} includes runtime artifact ${artifact}`);
    });
    assertPathExists(context, rootDir, row.contractPath, `Contract path for ${row.parityId}`);
    assertPathExists(context, rootDir, row.docsPath, `Docs path for ${row.parityId}`);
    row.runtimeArtifacts.forEach((artifact) => {
      assertPathExists(context, rootDir, artifact, `Runtime artifact for ${row.parityId}`);
    });
    assertRunnerGate(context, runner, row.testGate);
  });

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  context.assertIncludes(workpackage, CONTRACT_SCHEMA, 'Workpackage declares contract schema');
  context.assertIncludes(workpackage, MATRIX_SCHEMA, 'Workpackage declares matrix schema');
  context.assertIncludes(workpackage, LOCAL_GATE, 'Workpackage declares local gate');
  assertIncludesAll(context, workpackage, REQUIRED_DRIFT_CLASSES, 'Workpackage drift classes');
  assertIncludesAll(context, workpackage, REQUIRED_SOURCE_GATES, 'Workpackage verification gates');

  context.assertIncludes(registry, 'xtend.native-first.contract-runtime-parity.v1', 'Registry includes WP-12 contract');
  context.assertIncludes(registry, 'xtend.rmt.core-format.vnext.v1', 'Registry uses canonical RMT core format contract id');
  context.assert(!registry.includes('xtend.rmt.vnext-core-format.v1'), 'Registry no longer uses stale RMT core format id');
  context.assertIncludes(registry, 'rmt-vnext-compiler', 'Registry maps RMT core format to compiler gate');
  context.assertIncludes(registry, 'xtend.security.trusted-dom-policy.v1', 'Registry uses canonical Trusted DOM contract id');
  context.assert(!registry.includes('xtend.security.trusted-dom-sanitizing-policy.v1'), 'Registry no longer uses stale Trusted DOM policy id');
  context.assertIncludes(registryContract, 'NFM-WP-12', 'Registry contract acknowledges WP-12 extension');

  context.assertIncludes(roadmap, '| `NFM-WP-12` | P0 | completed |', 'Roadmap marks NFM-WP-12 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-13` | P1 | ready |') || roadmap.includes('| `NFM-WP-13` | P1 | completed |'),
    'Roadmap marks NFM-WP-13 ready or completed'
  );
  context.assert(
    roadmap.includes('| `NFM-WP-14` | P0 | ready |') || roadmap.includes('| `NFM-WP-14` | P0 | completed |'),
    'Roadmap keeps NFM-WP-14 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Contract-Runtime-Parity-Contract.md', 'Roadmap references WP-12 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-12 gate');

  context.assertIncludes(mission, 'Contract Runtime Parity Contract: `xtend.native-first.contract-runtime-parity.v1`', 'Mission references WP-12 contract');
  context.assertIncludes(mission, '`NFM-WP-12` | completed', 'Mission handoff marks WP-12 completed');
  context.assert(
    mission.includes('`NFM-WP-13` | ready') || mission.includes('`NFM-WP-13` | completed'),
    'Mission handoff marks WP-13 ready or completed'
  );

  context.assert(packageScripts['test:contract-runtime-parity'] === 'node scripts/run_xtend_tests.js contract-runtime-parity', 'Package exposes contract runtime parity test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_contract_runtime_parity_suite')", 'Runner imports contract runtime parity suite');
  context.assertIncludes(runner, "id: 'contract-runtime-parity'", 'Runner registers contract runtime parity suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-12 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-12 matrix schema');
  context.assert(metadata && metadata.driftReportSchema === DRIFT_SCHEMA, 'Package metadata exposes WP-12 drift schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-12 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-Contract-Runtime-Parity-Contract.md', 'Package metadata exposes WP-12 contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md', 'Package metadata exposes WP-12 matrix path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes WP-12 local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes WP-12 package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata preserves RMT kernel boundary');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.driftClasses, REQUIRED_DRIFT_CLASSES, 'Package metadata drift classes');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.domains, REQUIRED_DOMAINS, 'Package metadata domains');

  const parityRows = (metadata && metadata.parityRows) || [];
  REQUIRED_PARITY_ROWS.forEach((required) => {
    const row = parityRows.find((candidate) => candidate.parityId === required.parityId);
    context.assert(Boolean(row), `Package metadata registers ${required.parityId}`);
    if (!row) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(row[field]), `Package metadata ${required.parityId} has ${field}`);
    });
    context.assert(row.contractId === required.contractId, `Package metadata ${required.parityId} has contract id ${required.contractId}`);
    context.assert(row.domain === required.domain, `Package metadata ${required.parityId} has domain ${required.domain}`);
    context.assert(row.owner === required.owner, `Package metadata ${required.parityId} has owner ${required.owner}`);
    context.assert(row.contractPath === required.contractPath, `Package metadata ${required.parityId} has contract path ${required.contractPath}`);
    context.assert(row.testGate === required.testGate, `Package metadata ${required.parityId} has test gate ${required.testGate}`);
    context.assert(row.docsPath === required.docsPath, `Package metadata ${required.parityId} has docs path ${required.docsPath}`);
    context.assert(row.reportSchema === required.reportSchema, `Package metadata ${required.parityId} has report schema ${required.reportSchema}`);
    context.assert(row.parityStatus === required.parityStatus, `Package metadata ${required.parityId} has status ${required.parityStatus}`);
    context.assert(row.residual === required.residual, `Package metadata ${required.parityId} has residual ${required.residual}`);
    context.assert(row.nextHandoff === required.nextHandoff, `Package metadata ${required.parityId} has handoff ${required.nextHandoff}`);
    assertArrayIncludesAll(context, row.runtimeArtifacts, required.runtimeArtifacts, `Package metadata ${required.parityId} runtime artifacts`);
    assertPathExists(context, rootDir, row.contractPath, `Package metadata contract path for ${required.parityId}`);
    assertPathExists(context, rootDir, row.docsPath, `Package metadata docs path for ${required.parityId}`);
    row.runtimeArtifacts.forEach((artifact) => assertPathExists(context, rootDir, artifact, `Package metadata runtime artifact for ${required.parityId}`));
  });

  REQUIRED_METADATA_LINKS.forEach((entry) => {
    const item = packageManifest.xtend && packageManifest.xtend[entry.key];
    context.assert(item && item[entry.schemaField] === entry.schema, `Package metadata source ${entry.key} exposes ${entry.schema}`);
    context.assert(item && item.localGate === entry.localGate, `Package metadata source ${entry.key} exposes local gate`);
    context.assert(!item || !item.kernelBoundary || item.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types' || item.kernelBoundary === 'no-rmt-kernel-import-of-host-runtime-types', `${entry.key} keeps kernel boundary`);
  });

  const registryEntries = (registryMetadata && registryMetadata.entries) || [];
  context.assert(registryEntries.some((entry) => entry.contractId === CONTRACT_SCHEMA && entry.workpackage === 'NFM-WP-12'), 'Registry package metadata includes WP-12 contract');
  context.assert(Array.isArray(registryMetadata && registryMetadata.crossDomainContracts) && registryMetadata.crossDomainContracts.includes('xtend.rmt.core-format.vnext.v1'), 'Registry package metadata uses canonical RMT core contract id');
  context.assert(!(registryMetadata && registryMetadata.crossDomainContracts || []).includes('xtend.rmt.vnext-core-format.v1'), 'Registry package metadata removed stale RMT core id');
  context.assert(Array.isArray(registryMetadata && registryMetadata.crossDomainContracts) && registryMetadata.crossDomainContracts.includes('xtend.security.trusted-dom-policy.v1'), 'Registry package metadata uses canonical Trusted DOM contract id');
  context.assert(!(registryMetadata && registryMetadata.crossDomainContracts || []).includes('xtend.security.trusted-dom-sanitizing-policy.v1'), 'Registry package metadata removed stale Trusted DOM id');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-12',
      contract: CONTRACT_SCHEMA,
      matrixSchema: MATRIX_SCHEMA,
      parityRows: REQUIRED_PARITY_ROWS.length,
      driftClasses: REQUIRED_DRIFT_CLASSES.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      residuals: REQUIRED_PARITY_ROWS.filter((row) => row.residual !== 'none').length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      rmtKernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    }
  });
}

function printNativeFirstContractRuntimeParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Contract-to-Runtime Parity erfolgreich.',
    failureTitle: 'Native-First Contract-to-Runtime Parity fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstContractRuntimeParityReport,
  runNativeFirstContractRuntimeParitySuite
};
