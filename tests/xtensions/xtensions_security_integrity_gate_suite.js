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
  XTENSIONS_HOST_CONTROLLER_SCHEMA
} = require('../../tools/xtensions/host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA
} = require('../../tools/xtensions/signal-bridge-contract');
const {
  XTENSIONS_MARACA_MANIFEST_SCHEMA
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA
} = require('../../tools/xtensions/runtime-capability-registry');
const {
  DEFAULT_SECURITY_GATE_POLICY,
  SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE,
  SECURITY_CAPABILITY_NOT_ALLOWED_CODE,
  SECURITY_CDN_SOURCE_FORBIDDEN_CODE,
  SECURITY_CONTRACT_MISSING_CODE,
  SECURITY_CSP_DIRECTIVE_MISSING_CODE,
  SECURITY_CSP_UNSAFE_SOURCE_CODE,
  SECURITY_CSP_WASM_POLICY_MISSING_CODE,
  SECURITY_DEPENDENCY_CLASSIFICATION_INVALID_CODE,
  SECURITY_FALLBACK_MISSING_CODE,
  SECURITY_FRAMEWORK_DEPENDENCY_CODE,
  SECURITY_GATE_BOUNDARIES,
  SECURITY_GATE_STATUSES,
  SECURITY_INTEGRITY_INVALID_CODE,
  SECURITY_INTEGRITY_MISSING_CODE,
  SECURITY_OWNER_MISSING_CODE,
  SECURITY_PACKAGED_FRAMEWORK_DEPENDENCY_CODE,
  SECURITY_POLICY_DRIFT_CODE,
  SECURITY_REMOTE_ARTIFACT_BLOCKED_CODE,
  SECURITY_REQUIRED_CSP_DIRECTIVES,
  SECURITY_VERSION_MISSING_CODE,
  XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA,
  XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA,
  XTENSIONS_SECURITY_INTEGRITY_GATE_CONTRACT_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_PACKAGE_SCRIPT,
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
  XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_TYPES_PATH,
  XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE,
  XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA,
  XTENSIONS_SECURITY_POLICY_SCHEMA,
  XTENSIONS_SECURITY_REPORT_SCHEMA,
  XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA,
  assertXTensionsSecurityDependencyBoundary,
  createXTensionsSecurityIntegrityGate,
  evaluateXTensionSecurity,
  normalizeCspRequirements,
  normalizeSecurityGatePolicy,
  normalizeSupplyChainDependency,
  serializeXTensionsSecurityIntegrityGateReport
} = require('../../tools/xtensions/security-integrity-gate');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const MARACA_CONTRACT_PATH = 'development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md';
const RUNTIME_CONTRACT_PATH = 'development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function createClock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-06-20T09:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function packageDependencyCount(packageManifest) {
  return [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ].reduce((count, section) => count + Object.keys(packageManifest[section] || {}).length, 0);
}

function runXTensionsSecurityIntegrityGateSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-security-integrity-gate',
    label: 'XTensions Security, CSP, Supply Chain and Integrity Gate Contract'
  });

  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsSecurityIntegrityGate;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const maracaContract = readText(MARACA_CONTRACT_PATH, rootDir);
  const runtimeContract = readText(RUNTIME_CONTRACT_PATH, rootDir);
  const securityContract = readText(XTENSIONS_SECURITY_INTEGRITY_GATE_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_SECURITY_INTEGRITY_GATE_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, MARACA_CONTRACT_PATH, rootDir, 'XTensions Maraca contract exists');
  assertFileExists(context, RUNTIME_CONTRACT_PATH, rootDir, 'XTensions runtime contract exists');
  assertFileExists(context, XTENSIONS_SECURITY_INTEGRITY_GATE_CONTRACT_PATH, rootDir, 'XTensions security gate contract exists');
  assertFileExists(context, XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH, rootDir, 'XTensions security gate module exists');
  assertFileExists(context, XTENSIONS_SECURITY_INTEGRITY_GATE_TYPES_PATH, rootDir, 'XTensions security gate types exist');
  assertFileExists(context, XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH, rootDir, 'XTensions security gate suite exists');
  assertFileExists(context, XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH, rootDir, 'XTensions security gate fixture exists');
  context.assert(moduleSyntax.ok, `XTensions security gate module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions security gate suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA, 'package metadata declares security gate schema');
  context.assert(metadata && metadata.policySchema === XTENSIONS_SECURITY_POLICY_SCHEMA, 'package metadata declares security policy schema');
  context.assert(metadata && metadata.cspRequirementsSchema === XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA, 'package metadata declares CSP requirements schema');
  context.assert(metadata && metadata.supplyChainClassificationSchema === XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA, 'package metadata declares supply chain classification schema');
  context.assert(metadata && metadata.manifestReportSchema === XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA, 'package metadata declares manifest report schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_SECURITY_REPORT_SCHEMA, 'package metadata declares security report schema');
  context.assert(metadata && metadata.diagnosticSchema === XTENSIONS_SECURITY_DIAGNOSTIC_SCHEMA, 'package metadata declares diagnostic schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.signalBridgeSchema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'package metadata links Signal Bridge schema');
  context.assert(metadata && metadata.maracaManifestSchema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'package metadata links Maraca manifest schema');
  context.assert(metadata && metadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE, 'package metadata points to XTN-11');
  context.assert(metadata && metadata.module === XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH, 'package metadata points to security gate module');
  context.assert(metadata && metadata.types === XTENSIONS_SECURITY_INTEGRITY_GATE_TYPES_PATH, 'package metadata points to security gate types');
  context.assert(metadata && metadata.fixture === XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH, 'package metadata points to security gate fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH, 'package metadata points to security gate suite');
  context.assert(metadata && metadata.contract === XTENSIONS_SECURITY_INTEGRITY_GATE_CONTRACT_PATH, 'package metadata points to security gate contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-security-integrity-gate --json', 'package metadata declares security gate local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_SECURITY_INTEGRITY_GATE_PACKAGE_SCRIPT, 'package metadata declares security gate package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');
  context.assert(metadata && metadata.remoteArtifactsAllowed === false, 'package metadata blocks remote artifacts by default');

  const exportEntry = packageManifest.exports['./xtensions/security-integrity-gate'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/security-integrity-gate.js', 'package exports XTensions security gate module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/security-integrity-gate.d.ts', 'package exports XTensions security gate types');
  context.assert(packageManifest.scripts['test:xtensions-security-integrity-gate'] === 'node scripts/run_xtend_tests.js xtensions-security-integrity-gate', 'package exposes security gate script');
  context.assert(runner.hasSuite("xtensions-security-integrity-gate"), 'test runner exposes xtensions-security-integrity-gate suite');
  context.assert(runner.hasSuite("xtensions-security-integrity-gate"), 'runner help references security gate');

  context.assert(backlog.includes('| `XTN-11` | P1 | completed | WS10 |'), 'backlog marks XTN-11 completed');
  context.assert(backlog.includes('development/XTensions-Security-CSP-Supply-Chain-Integrity-Gates-Contract.md'), 'backlog references security gate contract');
  context.assert(architectureContract.includes('no-vendored-third-party-frameworks-in-repo-or-npm-package'), 'architecture contract keeps framework vendoring boundary');
  context.assert(maracaContract.includes('Integrity'), 'Maraca contract remains linked through integrity');
  context.assert(runtimeContract.includes('fallback'), 'runtime contract remains linked through fallback handling');
  context.assert(securityContract.includes('Gate Schema: `xtend.xtensions.security-integrity-gate.v1`'), 'security contract declares gate schema');
  context.assert(securityContract.includes('node scripts/run_xtend_tests.js xtensions-security-integrity-gate --json'), 'security contract declares local gate');
  context.assert(securityContract.includes('Remote-faehige Artefakte bleiben standardmaessig blockiert'), 'security contract documents remote default block');

  context.assert(fixture.schema === 'xtend.xtensions.security-integrity-gate.fixture.v1', 'fixture declares security gate fixture schema');
  context.assert(fixture.expectedStatus === 'ready', 'fixture names expected ready status');
  context.assert(fixture.expectedBlockedStatus === 'blocked', 'fixture names expected blocked status');
  context.assert(packageDependencyCount(packageManifest) === 0, 'root package keeps dependency sections empty for XTensions gates');

  const dependencyBoundary = assertXTensionsSecurityDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  });
  context.assert(dependencyBoundary.ok, `XTensions security gate sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badImportBoundary = assertXTensionsSecurityDependencyBoundary({
    sourceText: "import React from 'react';"
  });
  context.assert(
    badImportBoundary.diagnostics.some((diagnostic) => diagnostic.code === SECURITY_FRAMEWORK_DEPENDENCY_CODE),
    'XTensions security dependency guard rejects real framework imports'
  );

  const policy = normalizeSecurityGatePolicy(fixture.policy);
  context.assert(policy.schema === XTENSIONS_SECURITY_POLICY_SCHEMA, 'security policy normalizes with schema');
  context.assert(policy.strict === true, 'security policy is strict');
  context.assert(policy.remoteArtifactsAllowed === false, 'security policy blocks remote artifacts by default');
  context.assert(policy.allowCdnForLocalFixtures === false, 'security policy blocks CDN for local fixtures');
  assertIncludesAll(context, policy.requiredCspDirectives, SECURITY_REQUIRED_CSP_DIRECTIVES, 'security policy keeps required CSP directives');
  assertIncludesAll(context, policy.allowedCapabilities, ['host.lifecycle.mount', 'loading.dynamic-import', 'render.loop.host-fiber'], 'security policy includes XTend orchestration capabilities');
  assertIncludesAll(context, policy.allowedCapabilities, [
    'react.root.lifecycle',
    'react.scheduling.hints',
    'react.boundary.diagnostics',
    'vue.app.lifecycle',
    'vue.explicit-update-adapter',
    'vue.event-normalization'
  ], 'security policy includes React/Vue production adapter capabilities');
  assertIncludesAll(context, SECURITY_GATE_BOUNDARIES, ['deny-by-default-capabilities', 'local-fixtures-require-no-cdn'], 'security gate boundaries include strict policy edges');
  assertIncludesAll(context, SECURITY_GATE_STATUSES, ['ready', 'blocked', 'degraded'], 'security gate statuses include gate states');

  const peerDependency = normalizeSupplyChainDependency(fixture.xtensions[0].dependencies[0]);
  context.assert(peerDependency.schema === XTENSIONS_SECURITY_SUPPLY_CHAIN_CLASSIFICATION_SCHEMA, 'supply chain dependency normalizes with schema');
  context.assert(peerDependency.name === 'react' && peerDependency.classification === 'peer', 'React fixture dependency is classified as peer');
  context.assert(peerDependency.frameworkDependency === true && peerDependency.packageIncluded === false, 'React dependency is framework peer, not packaged');
  const externalPeerDependency = normalizeSupplyChainDependency({
    name: 'vue',
    classification: 'external-peer'
  });
  context.assert(externalPeerDependency.classification === 'peer', 'external-peer dependency classification maps to peer');

  const csp = normalizeCspRequirements(fixture.xtensions[1]);
  context.assert(csp.schema === XTENSIONS_SECURITY_CSP_REQUIREMENTS_SCHEMA, 'CSP requirements normalize with schema');
  context.assert(csp.requiresWasm === true && csp.scriptSrc.includes("'wasm-unsafe-eval'"), 'WASM CSP declaration is explicit');
  context.assert(csp.requiresWorker === true && csp.workerSrc.includes("'self'"), 'worker CSP declaration is explicit');

  const reactSecurity = evaluateXTensionSecurity(fixture.xtensions[0], { policy, clock: createClock() });
  context.assert(reactSecurity.schema === XTENSIONS_SECURITY_MANIFEST_REPORT_SCHEMA, 'manifest security report emits schema');
  context.assert(reactSecurity.ok === true && reactSecurity.status === 'ready', 'React manifest security gate is ready');
  context.assert(reactSecurity.owner === 'xtend-platform', 'React manifest keeps security owner');
  context.assert(reactSecurity.remoteCapable === false, 'React local peer manifest is not remote-capable');
  context.assert(reactSecurity.fallback.visible === true, 'React manifest exposes visible fallback');
  context.assert(reactSecurity.dependencies.every((dependency) => dependency.packageIncluded === false), 'React manifest keeps dependencies out of package');
  context.assert(reactSecurity.artifactRuntime.artifactInspected === false && reactSecurity.artifactRuntime.runtimeBundled === false, 'React manifest has no artifact runtime evidence when no bundle text is provided');

  const reactDriftReport = evaluateXTensionSecurity(fixture.xtensions[0], {
    policy,
    artifactText: '/* react.production.min.js */ const marker = "ReactCurrentDispatcher";',
    clock: createClock()
  });
  context.assert(reactDriftReport.status === 'blocked', 'React host-provided manifest is blocked when bundle contains runtime signatures');
  context.assert(diagnosticCodes(reactDriftReport).includes(SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE), 'React artifact runtime drift diagnostic is emitted');

  const vueDriftManifest = cloneJson(fixture.xtensions[0]);
  vueDriftManifest.id = 'xtension.security.vue-runtime-drift';
  vueDriftManifest.framework = 'vue';
  vueDriftManifest.dependencies = [
    {
      name: 'vue',
      versionRange: '3.5.0',
      classification: 'host-provided',
      bundled: false,
      packageIncluded: false
    }
  ];
  const vueDriftReport = evaluateXTensionSecurity(vueDriftManifest, {
    policy,
    artifactText: '/* @vue/runtime-dom */ const marker = "__VUE__";',
    clock: createClock()
  });
  context.assert(vueDriftReport.status === 'blocked', 'Vue host-provided manifest is blocked when bundle contains runtime signatures');
  context.assert(diagnosticCodes(vueDriftReport).includes(SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE), 'Vue artifact runtime drift diagnostic is emitted');

  const report = createXTensionsSecurityIntegrityGate({
    policy,
    xtensions: fixture.xtensions,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  }, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_SECURITY_REPORT_SCHEMA, 'security gate emits report schema');
  context.assert(report.gateSchema === XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA, 'security gate report links gate schema');
  context.assert(report.ok === true && report.status === fixture.expectedStatus, 'valid security gate fixture is ready');
  context.assert(report.strict === true, 'security gate report is strict');
  context.assert(report.frameworkCodeRequired === false && report.runtimeExecutionRequired === false, 'security gate does not execute framework code');
  context.assert(report.localFixtureNetworkRequired === false, 'security gate fixture needs no network');
  context.assert(report.manifestCount === fixture.xtensions.length, 'security gate counts fixture manifests');
  context.assert(report.readyCount === fixture.xtensions.length && report.blockedCount === 0, 'security gate accepts valid fixture manifests');
  context.assert(report.remoteCapableCount === 0, 'valid fixture has no remote-capable manifest');
  context.assert(report.packagedFrameworkDependencyCount === 0, 'valid fixture packages no framework dependency');
  context.assert(report.summary.dependencyCount === 2, 'security gate counts peer framework declarations as metadata only');
  context.assert(report.summary.errorCount === 0, 'valid security gate report has no errors');
  context.assert(report.dependencyBoundary.ok === true, 'valid security gate dependency boundary is clean');
  context.assert(typeof report.gateFingerprint === 'string' && report.gateFingerprint.startsWith('sha256:'), 'security gate emits stable fingerprint');

  const artifactTruthBatch = createXTensionsSecurityIntegrityGate({
    policy,
    xtensions: [fixture.xtensions[0]],
    artifactTexts: {
      [fixture.xtensions[0].id]: '/* react-dom.production.min.js */ const marker = "ReactCurrentDispatcher";'
    }
  }, { clock: createClock() });
  context.assert(artifactTruthBatch.status === 'blocked', 'security gate batches manifest/artifact drift by XTension id');
  context.assert(diagnosticCodes(artifactTruthBatch).includes(SECURITY_ARTIFACT_RUNTIME_BUNDLED_DRIFT_CODE), 'batched artifact truth diagnostic is emitted');

  const blockedReport = createXTensionsSecurityIntegrityGate({
    policy,
    xtensions: fixture.blockedXtensions
  }, { clock: createClock() });
  const blockedCodes = diagnosticCodes(blockedReport);
  context.assert(blockedReport.ok === false && blockedReport.status === fixture.expectedBlockedStatus, 'blocked security fixture is blocked');
  context.assert(blockedReport.blockedCount === 1, 'blocked security report counts blocked manifest');
  context.assert(blockedReport.remoteCapableCount === 1, 'blocked security report detects remote-capable manifest');
  fixture.expectedDiagnostics.forEach((code) => {
    context.assert(blockedCodes.includes(code), `${code} diagnostic is emitted`);
  });
  context.assert(blockedCodes.includes(SECURITY_OWNER_MISSING_CODE), 'owner missing diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_VERSION_MISSING_CODE), 'version missing diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_CONTRACT_MISSING_CODE), 'contract missing diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_INTEGRITY_MISSING_CODE), 'integrity missing diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_CSP_DIRECTIVE_MISSING_CODE), 'CSP directive diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_CSP_UNSAFE_SOURCE_CODE), 'unsafe CSP diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_REMOTE_ARTIFACT_BLOCKED_CODE), 'remote artifact diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_CDN_SOURCE_FORBIDDEN_CODE), 'CDN source diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_CAPABILITY_NOT_ALLOWED_CODE), 'capability diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_DEPENDENCY_CLASSIFICATION_INVALID_CODE), 'dependency classification diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_PACKAGED_FRAMEWORK_DEPENDENCY_CODE), 'packaged framework diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_FALLBACK_MISSING_CODE), 'fallback diagnostic constant is wired');
  context.assert(blockedCodes.includes(SECURITY_POLICY_DRIFT_CODE), 'policy drift diagnostic constant is wired');

  const invalidIntegrity = cloneJson(fixture.xtensions[0]);
  invalidIntegrity.integrity.sha256 = 'sha256:not-a-valid-hash';
  const invalidIntegrityReport = evaluateXTensionSecurity(invalidIntegrity, { policy, clock: createClock() });
  context.assert(invalidIntegrityReport.ok === false, 'invalid integrity blocks manifest');
  context.assert(diagnosticCodes(invalidIntegrityReport).includes(SECURITY_INTEGRITY_INVALID_CODE), 'invalid integrity diagnostic is emitted');

  const wasmPolicyDrift = cloneJson(fixture.xtensions[1]);
  wasmPolicyDrift.csp.scriptSrc = ["'self'"];
  const wasmPolicyReport = evaluateXTensionSecurity(wasmPolicyDrift, { policy, clock: createClock() });
  context.assert(wasmPolicyReport.ok === false, 'missing WASM CSP policy blocks manifest');
  context.assert(diagnosticCodes(wasmPolicyReport).includes(SECURITY_CSP_WASM_POLICY_MISSING_CODE), 'WASM CSP diagnostic is emitted');

  const serialized = serializeXTensionsSecurityIntegrityGateReport(report);
  const repeat = serializeXTensionsSecurityIntegrityGateReport(createXTensionsSecurityIntegrityGate({
    policy,
    xtensions: fixture.xtensions,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}`
  }, { clock: createClock() }));
  context.assert(serialized === repeat, 'security gate report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_SECURITY_REPORT_SCHEMA, 'serialized security gate report is parseable JSON');
  context.assert(!serialized.includes('https://cdn.jsdelivr.net/npm/react/index.js'), 'valid serialized report contains no CDN module');
  context.assert(!serialized.includes('"dependencies":{"react"'), 'valid serialized report does not serialize package dependencies');
  context.assert(DEFAULT_SECURITY_GATE_POLICY.frameworkDependenciesAllowed === undefined, 'default policy exposes explicit boundaries instead of framework allow flags');

  return context.result({
    schema: XTENSIONS_SECURITY_REPORT_SCHEMA,
    gateSchema: XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA,
    workpackage: XTENSIONS_SECURITY_INTEGRITY_GATE_WORKPACKAGE,
    module: XTENSIONS_SECURITY_INTEGRITY_GATE_MODULE_PATH,
    suite: XTENSIONS_SECURITY_INTEGRITY_GATE_SUITE_PATH,
    fixture: XTENSIONS_SECURITY_INTEGRITY_GATE_FIXTURE_PATH,
    manifestCount: report.manifestCount,
    diagnosticCount: report.summary.diagnosticCount,
    blockedDiagnosticCount: blockedReport.summary.diagnosticCount
  });
}

function printXTensionsSecurityIntegrityGateReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Security, CSP, Supply Chain and Integrity Gate Contract erfolgreich.',
    failureTitle: 'XTensions Security, CSP, Supply Chain and Integrity Gate Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsSecurityIntegrityGateReport,
  runXTensionsSecurityIntegrityGateSuite
};
