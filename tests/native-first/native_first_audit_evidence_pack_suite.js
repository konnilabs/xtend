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

const SUITE_ID = 'native-first-evidence-pack';
const SUITE_LABEL = 'Native-First Audit Evidence Pack';
const CONTRACT_SCHEMA = 'xtend.native-first.audit-evidence-pack.v1';
const ITEM_SCHEMA = 'xtend.native-first.audit-evidence-item.v1';
const PACK_SCHEMA = 'xtend.native-first.audit-evidence-pack-index.v1';
const REDACTION_POLICY = 'xtend.native-first.diagnostic-redaction-policy.v1';
const REPORT_SCHEMA = 'xtend.native-first.audit-evidence-pack-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-evidence-pack --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-evidence-pack';
const EVIDENCE_PREPARATION_COMMAND = 'npm run native-first:evidence:prepare';
const EVIDENCE_PREPARATION_SCRIPT = 'scripts/prepare_native_first_evidence_artifacts.js';
const KERNEL_BOUNDARY = 'rmt-kernel-remains-host-neutral';

const REQUIRED_FIELDS = Object.freeze([
  'evidenceId',
  'evidenceType',
  'sourceContract',
  'owner',
  'localGate',
  'reportSchema',
  'artifacts',
  'status',
  'redactionClass',
  'releaseOwnerUse',
  'residual',
  'nextHandoff'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'native-first-evidence-pack',
  'contract-registry',
  'contract-runtime-parity',
  'supply-chain',
  'rmt-kernel-trust-authority',
  'rmt-kernel-trusted-dom-runtime',
  'rmt-kernel-policy-parity',
  'rmt-kernel-security-regression',
  'epic13-trusted-dom-boundary',
  'epic13-conditional-network-evidence',
  'epic13-conditional-network-evidence-ci',
  'epic13-release-report-pack-dry-run-evidence',
  'epic13-rc1-gate-matrix-ci-handoff',
  'references'
]);

const REQUIRED_EVIDENCE_TYPES = Object.freeze([
  'contract-registry',
  'contract-parity',
  'dependency',
  'supply-chain',
  'security',
  'conditional-network',
  'release-pack',
  'redaction-policy'
]);

const REQUIRED_REDACTION_FIELDS = Object.freeze([
  'token',
  'secret',
  'password',
  'authorization',
  'cookie',
  'set-cookie',
  'npm_token',
  'credential-url',
  'raw-env-value',
  'raw-untrusted-html',
  'absolute-local-path',
  'private-stacktrace-path'
]);

const REQUIRED_PRESERVED_FIELDS = Object.freeze([
  'contractId',
  'gateId',
  'reportSchema',
  'owner',
  'workpackage',
  'status',
  'residual',
  'diagnosticCode',
  'severity',
  'repo-relative-artifact-path'
]);

const REQUIRED_TEXT_REDACTION_MARKERS = Object.freeze([
  'token',
  'secret',
  'password',
  'authorization',
  'cookie',
  'set-cookie',
  'npm_token',
  'Credentials',
  'Environment',
  'HTML',
  'absolute',
  'Stacktrace'
]);

const REQUIRED_EVIDENCE_ITEMS = Object.freeze([
  {
    evidenceId: 'NFM-AEP-01',
    evidenceType: 'contract-registry',
    sourceContract: 'xtend.native-first.contract-registry.v1',
    owner: 'contract-governance-owner',
    localGate: 'contract-registry',
    reportSchema: 'xtend.native-first.contract-registry-report.v1',
    status: 'local-passed',
    redactionClass: 'public-contract',
    residual: 'none',
    nextHandoff: 'NFM-WP-20',
    artifacts: [
      'development/XTend-Native-First-Contract-Registry.md',
      'development/XTend-Native-First-Contract-Registry-Contract.md',
      'tests/native-first/native_first_contract_registry_suite.js',
      'package.json'
    ]
  },
  {
    evidenceId: 'NFM-AEP-02',
    evidenceType: 'contract-parity',
    sourceContract: 'xtend.native-first.contract-runtime-parity.v1',
    owner: 'contract-parity-owner',
    localGate: 'contract-runtime-parity',
    reportSchema: 'xtend.native-first.contract-runtime-parity-report.v1',
    status: 'parity-passed-with-residual',
    redactionClass: 'public-contract',
    residual: 'NFM-WP-14, NFM-WP-18',
    nextHandoff: 'NFM-WP-14',
    artifacts: [
      'development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md',
      'development/XTend-Native-First-Contract-Runtime-Parity-Contract.md',
      'tests/native-first/native_first_contract_runtime_parity_suite.js',
      'package.json'
    ]
  },
  {
    evidenceId: 'NFM-AEP-03',
    evidenceType: 'dependency',
    sourceContract: 'xtend.native-first.dependency-diet-policy.v1',
    owner: 'supply-chain-owner',
    localGate: 'supply-chain',
    reportSchema: 'xtend.native-first.dependency-diet-policy-report.v1',
    status: 'local-passed',
    redactionClass: 'dependency-evidence',
    residual: 'workspace-SBOM bleibt conditional-network Evidence',
    nextHandoff: 'NFM-WP-19',
    artifacts: [
      'development/XTend-Native-First-Dependency-Diet-Policy-Contract.md',
      'development/XTend-Native-First-Dependency-Exit-Plan-Matrix.md',
      'development/NFM-WP-04-Dependency-Diet-Policy-und-Runtime-Dependency-Exit-Plaene-erstellen.md',
      'package-lock.json'
    ]
  },
  {
    evidenceId: 'NFM-AEP-04',
    evidenceType: 'supply-chain',
    sourceContract: 'xtend.security.supply-chain-gate-plan.v1',
    owner: 'supply-chain-owner',
    localGate: 'supply-chain',
    reportSchema: 'xtend.security.supply-chain-report.v1',
    status: 'local-passed',
    redactionClass: 'dependency-evidence',
    residual: 'npm sbom ist conditional und publish-boundary-gesteuert',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTend-Supply-Chain-Gate-Plan.md',
      'security/supply-chain-gate-policy.js',
      'security/supply-chain-gate-policy.d.ts',
      'package-lock.json',
      '.xtend-test-results/xtend-npm-audit-report.json'
    ]
  },
  {
    evidenceId: 'NFM-AEP-05',
    evidenceType: 'security',
    sourceContract: 'xtend.rmt.kernel-trust-hardening.v1',
    owner: 'kernel-security-owner',
    localGate: 'rmt-kernel-trust-authority',
    reportSchema: 'xtend.rmt.kernel-trust-authority-report.v1',
    status: 'local-passed',
    redactionClass: 'security-sensitive',
    residual: 'none',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTendRMT-Kernel-Trust-Hardening-Contract.md',
      'tools/rmt-language/kernel-trust-authority.js',
      'xtendrmt/rmt-core.esm.js',
      'tests/rmt-language/rmt_kernel_trust_authority_suite.js'
    ]
  },
  {
    evidenceId: 'NFM-AEP-06',
    evidenceType: 'security',
    sourceContract: 'xtend.rmt.kernel-trusted-dom-runtime.v1',
    owner: 'kernel-security-owner',
    localGate: 'rmt-kernel-trusted-dom-runtime',
    reportSchema: 'xtend.rmt.kernel-trusted-dom-runtime-report.v1',
    status: 'local-passed',
    redactionClass: 'security-sensitive',
    residual: 'none',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md',
      'xtendrmt/rmt-core.esm.js',
      'xtendrmt/rmt-runtime.esm.js',
      'xtendrmt/rmt-runtime.browser.js',
      'tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite.js'
    ]
  },
  {
    evidenceId: 'NFM-AEP-07',
    evidenceType: 'security',
    sourceContract: 'xtend.rmt.kernel-policy-parity.v1',
    owner: 'kernel-policy-owner',
    localGate: 'rmt-kernel-policy-parity',
    reportSchema: 'xtend.rmt.kernel-policy-parity-report.v1',
    status: 'local-passed',
    redactionClass: 'security-sensitive',
    residual: 'none',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTendRMT-Kernel-Policy-Parity-Contract.md',
      'tools/rmt-language/kernel-policy-parity.js',
      'xtendrmt/rmt-core.esm.js',
      'tests/rmt-language/rmt_kernel_policy_parity_suite.js'
    ]
  },
  {
    evidenceId: 'NFM-AEP-08',
    evidenceType: 'security',
    sourceContract: 'xtend.rmt.kernel-security-regression.v1',
    owner: 'kernel-security-owner',
    localGate: 'rmt-kernel-security-regression',
    reportSchema: 'xtend.rmt.kernel-security-regression-report.v1',
    status: 'local-passed',
    redactionClass: 'security-sensitive',
    residual: 'none',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTendRMT-Kernel-Security-Regression-Contract.md',
      'tools/rmt-language/kernel-security-regression.js',
      'tests/rmt-language/fixtures/kernel-security-regression-fixtures.json',
      'tests/browser/fixtures/rmt-kernel-security-regression-smoke.html'
    ]
  },
  {
    evidenceId: 'NFM-AEP-09',
    evidenceType: 'security',
    sourceContract: 'xtend.security.trusted-dom-policy.v1',
    owner: 'security-owner',
    localGate: 'epic13-trusted-dom-boundary',
    reportSchema: 'xtend.epic13.trusted-dom-boundary-report.v1',
    status: 'parity-passed-with-residual',
    redactionClass: 'security-sensitive',
    residual: 'NFM-WP-18 prueft Renderer-Proofs',
    nextHandoff: 'NFM-WP-18',
    artifacts: [
      'development/XTend-Trusted-DOM-und-Sanitizing-Policy.md',
      'development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md',
      'security/trusted-dom-policy.js',
      'tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html'
    ]
  },
  {
    evidenceId: 'NFM-AEP-10',
    evidenceType: 'conditional-network',
    sourceContract: 'xtend.epic13.conditional-network-evidence.v1',
    owner: 'release-owner',
    localGate: 'epic13-conditional-network-evidence',
    reportSchema: 'xtend.epic13.conditional-network-evidence-report.v1',
    status: 'conditional-network-deferred',
    redactionClass: 'network-conditional',
    residual: 'network execution bleibt conditional',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTend-Epic13-Conditional-Network-Evidence-Contract.md',
      'docs/conditional-network-evidence.md',
      'catalog/epic13-conditional-network-evidence.js',
      '.xtend-test-results/xtend-conditional-network-evidence-report.json'
    ]
  },
  {
    evidenceId: 'NFM-AEP-11',
    evidenceType: 'conditional-network',
    sourceContract: 'xtend.epic13.conditional-network-evidence-ci.v1',
    owner: 'release-owner',
    localGate: 'epic13-conditional-network-evidence-ci',
    reportSchema: 'xtend.epic13.conditional-network-evidence-ci-report.v1',
    status: 'ci-planned',
    redactionClass: 'network-conditional',
    residual: 'CI execution owner-controlled',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTend-Epic13-Conditional-Network-Evidence-CI-Contract.md',
      'docs/conditional-network-evidence-ci.md',
      'catalog/epic13-conditional-network-evidence-ci.js'
    ]
  },
  {
    evidenceId: 'NFM-AEP-12',
    evidenceType: 'release-pack',
    sourceContract: 'xtend.epic13.release-report-pack-dry-run-evidence.v1',
    owner: 'release-owner',
    localGate: 'epic13-release-report-pack-dry-run-evidence',
    reportSchema: 'xtend.epic13.release-report-pack-dry-run-evidence-report.v1',
    status: 'release-owner-review-ready',
    redactionClass: 'release-evidence',
    residual: 'publish bleibt private bis Owner Acceptance',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTend-Epic13-Release-Report-und-Pack-Dry-Run-Evidence.md',
      'docs/release-report-pack-dry-run-evidence.md',
      'catalog/epic13-release-report-pack-dry-run-evidence.js',
      '.xtend-test-results/xtend-pack-dry-run.json',
      '.xtend-test-results/xtend-package-export-lock-report.json'
    ]
  },
  {
    evidenceId: 'NFM-AEP-13',
    evidenceType: 'release-pack',
    sourceContract: 'xtend.epic13.rc1-gate-matrix-ci-handoff.v1',
    owner: 'release-owner',
    localGate: 'epic13-rc1-gate-matrix-ci-handoff',
    reportSchema: 'xtend.epic13.rc1-gate-matrix-ci-handoff-report.v1',
    status: 'release-owner-review-ready',
    redactionClass: 'release-evidence',
    residual: 'publish bleibt private bis Owner Acceptance',
    nextHandoff: 'NFM-WP-22',
    artifacts: [
      'development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md',
      'docs/en/release-verification.md',
      'catalog/epic13-rc1-gate-matrix-ci-handoff.js'
    ]
  },
  {
    evidenceId: 'NFM-AEP-14',
    evidenceType: 'redaction-policy',
    sourceContract: REDACTION_POLICY,
    owner: 'audit-evidence-owner',
    localGate: 'native-first-evidence-pack',
    reportSchema: REPORT_SCHEMA,
    status: 'redaction-policy-ready',
    redactionClass: 'diagnostic-redacted',
    residual: 'none',
    nextHandoff: 'NFM-WP-20',
    artifacts: [
      'development/XTend-Native-First-Audit-Evidence-Pack-Contract.md',
      'development/XTend-Native-First-Audit-Evidence-Pack.md',
      'tests/native-first/native_first_audit_evidence_pack_suite.js',
      'package.json'
    ]
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
  context.assert(runner.hasSuite(gate), `Runner registers ${gate}`);
}

function runNativeFirstAuditEvidencePackSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Audit-Evidence-Pack-Contract.md', rootDir);
  const evidencePack = readText('development/XTend-Native-First-Audit-Evidence-Pack.md', rootDir);
  const workpackage = readText('development/NFM-WP-13-Audit-Evidence-Pack-fuer-Contracts-Security-und-Dependencies-buendeln.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const parityMatrix = readText('development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md', rootDir);
  const parityWorkpackage = readText('development/NFM-WP-12-Contract-to-Runtime-Parity-Gate-fuer-Kernel-Components-und-RMT-bauen.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstAuditEvidencePack;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    ITEM_SCHEMA,
    PACK_SCHEMA,
    REDACTION_POLICY,
    REPORT_SCHEMA,
    LOCAL_GATE,
    'release-owner-can-review-from-one-pack',
    'evidence-pack-references-existing-gates',
    'conditional-network-status-is-explicit',
    'diagnostics-redaction-before-release-sharing',
    'audit-pack-does-not-run-network-by-default',
    KERNEL_BOUNDARY
  ], 'Contract header and boundaries');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, REQUIRED_EVIDENCE_TYPES, 'Contract evidence types');
  assertIncludesAll(context, contract, REQUIRED_TEXT_REDACTION_MARKERS, 'Contract redaction policy');

  assertIncludesAll(context, evidencePack, [
    PACK_SCHEMA,
    CONTRACT_SCHEMA,
    ITEM_SCHEMA,
    REDACTION_POLICY,
    REPORT_SCHEMA,
    LOCAL_GATE,
    'Conditional Network Status'
  ], 'Evidence pack header');
  assertIncludesAll(context, evidencePack, REQUIRED_FIELDS, 'Evidence pack fields');
  assertIncludesAll(context, evidencePack, REQUIRED_TEXT_REDACTION_MARKERS, 'Evidence pack redaction checklist');

  REQUIRED_EVIDENCE_ITEMS.forEach((item) => {
    assertIncludesAll(context, evidencePack, [
      item.evidenceId,
      item.evidenceType,
      item.sourceContract,
      item.owner,
      item.localGate,
      item.reportSchema,
      item.status,
      item.redactionClass,
      item.residual,
      item.nextHandoff
    ], `Evidence pack row ${item.evidenceId}`);
    item.artifacts.forEach((artifact) => {
      context.assertIncludes(evidencePack, artifact, `Evidence pack row ${item.evidenceId} includes artifact ${artifact}`);
      assertPathExists(context, rootDir, artifact, `Evidence artifact for ${item.evidenceId}`);
    });
    assertRunnerGate(context, runner, item.localGate);
  });

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    ITEM_SCHEMA,
    PACK_SCHEMA,
    REDACTION_POLICY,
    REPORT_SCHEMA,
    LOCAL_GATE
  ], 'Workpackage schemas and gate');
  assertIncludesAll(context, workpackage, REQUIRED_SOURCE_GATES, 'Workpackage verification gates');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'audit-evidence-owner',
    'NFM-WP-13',
    REPORT_SCHEMA,
    'native-first-evidence-pack',
    'development/XTend-Native-First-Audit-Evidence-Pack-Contract.md',
    'audit-evidence-pack',
    'release-pack',
    'NFM-WP-01` bis `NFM-WP-13',
    'NFM-WP-13` ist abgeschlossen'
  ], 'Registry WP-13 entry and baseline');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-01` bis `NFM-WP-13',
    'native-first-evidence-pack',
    'NFM-WP-13` hat',
    'Native-First-Contracts bis `NFM-WP-13`'
  ], 'Registry contract WP-13 extension');
  assertIncludesAll(context, parityMatrix, [
    'NFM-WP-13` hat aus dieser Matrix ein Audit Evidence Pack gebaut',
    'NFM-WP-14'
  ], 'Parity matrix handoff');
  assertIncludesAll(context, parityWorkpackage, [
    'NFM-WP-13` hat Audit Evidence Packs',
    'Conditional Network',
    'Redaction-Regeln'
  ], 'WP-12 handoff');

  context.assertIncludes(roadmap, '| `NFM-WP-13` | P1 | completed |', 'Roadmap marks NFM-WP-13 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-14` | P0 | ready |') || roadmap.includes('| `NFM-WP-14` | P0 | completed |'),
    'Roadmap keeps NFM-WP-14 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Audit-Evidence-Pack-Contract.md', 'Roadmap references WP-13 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-13 gate');

  context.assertIncludes(mission, 'Audit Evidence Pack Contract: `xtend.native-first.audit-evidence-pack.v1`', 'Mission references WP-13 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-Audit-Evidence-Pack.md', 'Mission source-of-truth lists evidence pack');
  context.assertIncludes(mission, '`NFM-WP-13` | completed', 'Mission handoff marks WP-13 completed');

  context.assert(packageScripts['test:native-first-evidence-pack'] === 'node scripts/run_xtend_tests.js native-first-evidence-pack', 'Package exposes audit evidence pack test script');
  context.assert(packageScripts['native-first:evidence:prepare'] === `node ${EVIDENCE_PREPARATION_SCRIPT}`, 'Package exposes Native-First evidence preparation script');
  assertPathExists(context, rootDir, EVIDENCE_PREPARATION_SCRIPT, 'Native-First evidence preparation script');
  context.assert(runner.hasImplementation({ path: "tests/native-first/native_first_audit_evidence_pack_suite.js" }), 'Runner imports audit evidence pack suite');
  context.assert(runner.hasSuite("native-first-evidence-pack"), 'Runner registers audit evidence pack suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-13 contract schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes evidence item schema');
  context.assert(metadata && metadata.packSchema === PACK_SCHEMA, 'Package metadata exposes evidence pack schema');
  context.assert(metadata && metadata.redactionPolicy === REDACTION_POLICY, 'Package metadata exposes redaction policy');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-Audit-Evidence-Pack-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.evidencePack === 'development/XTend-Native-First-Audit-Evidence-Pack.md', 'Package metadata exposes pack path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.evidencePreparationCommand === EVIDENCE_PREPARATION_COMMAND, 'Package metadata exposes evidence preparation command');
  context.assert(metadata && metadata.evidencePreparationScript === EVIDENCE_PREPARATION_SCRIPT, 'Package metadata exposes evidence preparation script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalNetworkAllowedInLocalGate === false, 'Package metadata blocks local network execution');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata preserves RMT kernel boundary');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.redactionFields, REQUIRED_REDACTION_FIELDS, 'Package metadata redaction fields');
  assertArrayIncludesAll(context, metadata && metadata.preservedFields, REQUIRED_PRESERVED_FIELDS, 'Package metadata preserved fields');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.evidenceTypes, REQUIRED_EVIDENCE_TYPES, 'Package metadata evidence types');

  const evidenceItems = (metadata && metadata.evidenceItems) || [];
  context.assert(evidenceItems.length === REQUIRED_EVIDENCE_ITEMS.length, 'Package metadata registers all evidence items');
  REQUIRED_EVIDENCE_ITEMS.forEach((required) => {
    const item = evidenceItems.find((candidate) => candidate.evidenceId === required.evidenceId);
    context.assert(Boolean(item), `Package metadata registers ${required.evidenceId}`);
    if (!item) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(item[field]), `Package metadata ${required.evidenceId} has ${field}`);
    });
    context.assert(item.evidenceType === required.evidenceType, `Package metadata ${required.evidenceId} has evidence type`);
    context.assert(item.sourceContract === required.sourceContract, `Package metadata ${required.evidenceId} has source contract`);
    context.assert(item.owner === required.owner, `Package metadata ${required.evidenceId} has owner`);
    context.assert(item.localGate === required.localGate, `Package metadata ${required.evidenceId} has local gate`);
    context.assert(item.reportSchema === required.reportSchema, `Package metadata ${required.evidenceId} has report schema`);
    context.assert(item.status === required.status, `Package metadata ${required.evidenceId} has status`);
    context.assert(item.redactionClass === required.redactionClass, `Package metadata ${required.evidenceId} has redaction class`);
    context.assert(item.residual === required.residual, `Package metadata ${required.evidenceId} has residual`);
    context.assert(item.nextHandoff === required.nextHandoff, `Package metadata ${required.evidenceId} has handoff`);
    context.assert(typeof item.releaseOwnerUse === 'string' && item.releaseOwnerUse.length > 12, `Package metadata ${required.evidenceId} has release owner use`);
    assertArrayIncludesAll(context, item.artifacts, required.artifacts, `Package metadata ${required.evidenceId} artifacts`);
    required.artifacts.forEach((artifact) => assertPathExists(context, rootDir, artifact, `Package metadata artifact for ${required.evidenceId}`));
  });

  const registryEntries = (registryMetadata && registryMetadata.entries) || [];
  context.assert(registryEntries.some((entry) => entry.contractId === CONTRACT_SCHEMA && entry.workpackage === 'NFM-WP-13'), 'Registry package metadata includes WP-13 contract');
  context.assert(Array.isArray(registryMetadata && registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('native-first-evidence-pack'), 'Registry package metadata lists WP-13 source gate');

  const sourceMetadata = packageManifest.xtend || {};
  context.assert(sourceMetadata.nativeFirstContractRegistry && sourceMetadata.nativeFirstContractRegistry.schema === 'xtend.native-first.contract-registry.v1', 'Package metadata links contract registry source');
  context.assert(sourceMetadata.nativeFirstContractRuntimeParity && sourceMetadata.nativeFirstContractRuntimeParity.schema === 'xtend.native-first.contract-runtime-parity.v1', 'Package metadata links contract runtime parity source');
  context.assert(sourceMetadata.supplyChain && sourceMetadata.supplyChain.schema === 'xtend.security.supply-chain-gate-plan.v1', 'Package metadata links supply-chain source');
  context.assert(sourceMetadata.epic13ConditionalNetworkEvidence && sourceMetadata.epic13ConditionalNetworkEvidence.schema === 'xtend.epic13.conditional-network-evidence.v1', 'Package metadata links conditional network source');
  context.assert(sourceMetadata.epic13ConditionalNetworkEvidenceCi && sourceMetadata.epic13ConditionalNetworkEvidenceCi.schema === 'xtend.epic13.conditional-network-evidence-ci.v1', 'Package metadata links conditional network CI source');
  context.assert(sourceMetadata.epic13ReleaseReportPackDryRunEvidence && sourceMetadata.epic13ReleaseReportPackDryRunEvidence.schema === 'xtend.epic13.release-report-pack-dry-run-evidence.v1', 'Package metadata links release pack dry run source');
  context.assert(sourceMetadata.epic13Rc1GateMatrixCiHandoff && sourceMetadata.epic13Rc1GateMatrixCiHandoff.schema === 'xtend.epic13.rc1-gate-matrix-ci-handoff.v1', 'Package metadata links RC1 gate matrix source');
  context.assert(sourceMetadata.epic13TrustedDomBoundary && sourceMetadata.epic13TrustedDomBoundary.schema === 'xtend.epic13.trusted-dom-boundary.v1', 'Package metadata links Trusted DOM boundary source');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-13',
      contract: CONTRACT_SCHEMA,
      packSchema: PACK_SCHEMA,
      evidenceItems: REQUIRED_EVIDENCE_ITEMS.length,
      evidenceTypes: REQUIRED_EVIDENCE_TYPES.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      localGate: LOCAL_GATE,
      externalNetworkAllowedInLocalGate: false,
      redactionPolicy: REDACTION_POLICY,
      noRuntimeDependency: true,
      rmtKernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    }
  });
}

function printNativeFirstAuditEvidencePackReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Audit Evidence Pack erfolgreich.',
    failureTitle: 'Native-First Audit Evidence Pack fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstAuditEvidencePackReport,
  runNativeFirstAuditEvidencePackSuite
};
