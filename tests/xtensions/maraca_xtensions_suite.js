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
  MARACA_XTENSION_CSP_MISSING_CODE,
  MARACA_XTENSION_FALLBACK_MISSING_CODE,
  MARACA_XTENSION_INTEGRITY_MISSING_CODE,
  MARACA_XTENSION_LAZY_POLICY_MISSING_CODE,
  MARACA_XTENSION_MANIFEST_MISSING_CODE,
  MARACA_XTENSION_POLICY_BLOCKED_CODE,
  MARACA_XTENSION_VENDORED_FRAMEWORK_CODE,
  VALID_XTENSION_LAZY_MODES,
  XTENSIONS_MARACA_ARTIFACT_SCHEMA,
  XTENSIONS_MARACA_BUILD_PLAN_SCHEMA,
  XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA,
  XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA,
  XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA,
  XTENSIONS_MARACA_CONTRACT_PATH,
  XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA,
  XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  XTENSIONS_MARACA_MISSING_FIXTURE_PATH,
  XTENSIONS_MARACA_MODULE_PATH,
  XTENSIONS_MARACA_PACKAGE_SCRIPT,
  XTENSIONS_MARACA_POLICY_BLOCKED_FIXTURE_PATH,
  XTENSIONS_MARACA_SUITE_PATH,
  XTENSIONS_MARACA_TYPES_PATH,
  XTENSIONS_MARACA_VALID_FIXTURE_PATH,
  XTENSIONS_MARACA_WORKPACKAGE,
  assertMaracaXTensionDependencyBoundary,
  classifyXTensionDependencies,
  createMaracaXTensionBuildPlan,
  createMaracaXTensionsBundleReport,
  normalizeContractSnapshot,
  normalizeXTensionManifest,
  serializeMaracaXTensionReport
} = require('../../tools/xtensions/maraca-xtension-manifest');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';
const SIGNAL_BRIDGE_CONTRACT_PATH = 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';

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
    return `2026-06-20T02:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(report) {
  return (report.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function runMaracaXTensionsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'maraca-xtensions',
    label: 'XTensions Maraca Manifest and Build Provenance Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsMaracaManifest;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const maracaContract = readText(XTENSIONS_MARACA_CONTRACT_PATH, rootDir);
  const validFixture = readJson(XTENSIONS_MARACA_VALID_FIXTURE_PATH, rootDir);
  const missingFixture = readJson(XTENSIONS_MARACA_MISSING_FIXTURE_PATH, rootDir);
  const policyBlockedFixture = readJson(XTENSIONS_MARACA_POLICY_BLOCKED_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_MARACA_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_MARACA_TYPES_PATH, rootDir);
  const validFixtureText = readText(XTENSIONS_MARACA_VALID_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_MARACA_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_MARACA_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, XTENSIONS_MARACA_CONTRACT_PATH, rootDir, 'XTensions Maraca contract exists');
  assertFileExists(context, XTENSIONS_MARACA_MODULE_PATH, rootDir, 'XTensions Maraca module exists');
  assertFileExists(context, XTENSIONS_MARACA_TYPES_PATH, rootDir, 'XTensions Maraca types exist');
  assertFileExists(context, XTENSIONS_MARACA_SUITE_PATH, rootDir, 'XTensions Maraca suite exists');
  assertFileExists(context, XTENSIONS_MARACA_VALID_FIXTURE_PATH, rootDir, 'valid XTension manifest fixture exists');
  assertFileExists(context, XTENSIONS_MARACA_MISSING_FIXTURE_PATH, rootDir, 'missing XTension manifest fixture exists');
  assertFileExists(context, XTENSIONS_MARACA_POLICY_BLOCKED_FIXTURE_PATH, rootDir, 'policy-blocked XTension manifest fixture exists');
  context.assert(moduleSyntax.ok, `XTensions Maraca module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions Maraca suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'package metadata declares XTension manifest schema');
  context.assert(metadata && metadata.contractSnapshotSchema === XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA, 'package metadata declares contract snapshot schema');
  context.assert(metadata && metadata.artifactSchema === XTENSIONS_MARACA_ARTIFACT_SCHEMA, 'package metadata declares artifact schema');
  context.assert(metadata && metadata.provenanceSchema === XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA, 'package metadata declares provenance schema');
  context.assert(metadata && metadata.buildPlanSchema === XTENSIONS_MARACA_BUILD_PLAN_SCHEMA, 'package metadata declares build plan schema');
  context.assert(metadata && metadata.bundleReportSchema === XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA, 'package metadata declares bundle report schema');
  context.assert(metadata && metadata.bundleSectionSchema === XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA, 'package metadata declares bundle section schema');
  context.assert(metadata && metadata.dependencyClassificationSchema === XTENSIONS_MARACA_DEPENDENCY_CLASSIFICATION_SCHEMA, 'package metadata declares dependency classification schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.signalBridgeSchema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'package metadata links Signal Bridge schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_MARACA_WORKPACKAGE, 'package metadata points to XTN-03');
  context.assert(metadata && metadata.module === XTENSIONS_MARACA_MODULE_PATH, 'package metadata points to XTension Maraca module');
  context.assert(metadata && metadata.types === XTENSIONS_MARACA_TYPES_PATH, 'package metadata points to XTension Maraca types');
  context.assert(metadata && metadata.validFixture === XTENSIONS_MARACA_VALID_FIXTURE_PATH, 'package metadata points to valid fixture');
  context.assert(metadata && metadata.missingFixture === XTENSIONS_MARACA_MISSING_FIXTURE_PATH, 'package metadata points to missing fixture');
  context.assert(metadata && metadata.policyBlockedFixture === XTENSIONS_MARACA_POLICY_BLOCKED_FIXTURE_PATH, 'package metadata points to policy-blocked fixture');
  context.assert(metadata && metadata.suite === XTENSIONS_MARACA_SUITE_PATH, 'package metadata points to XTension Maraca suite');
  context.assert(metadata && metadata.contract === XTENSIONS_MARACA_CONTRACT_PATH, 'package metadata points to XTension Maraca contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js maraca-xtensions --json', 'package metadata declares XTension Maraca local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_MARACA_PACKAGE_SCRIPT, 'package metadata declares XTension Maraca package script');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');

  const exportEntry = packageManifest.exports['./xtensions/maraca-manifest-contract'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/maraca-xtension-manifest.js', 'package exports XTension Maraca manifest module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/maraca-xtension-manifest.d.ts', 'package exports XTension Maraca manifest types');
  context.assert(packageManifest.scripts['test:maraca-xtensions'] === 'node scripts/run_xtend_tests.js maraca-xtensions', 'package exposes maraca-xtensions test script');
  context.assert(runner.includes("id: 'maraca-xtensions'"), 'test runner exposes maraca-xtensions suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js maraca-xtensions'), 'runner help references maraca-xtensions gate');

  context.assert(backlog.includes('| `XTN-03` | P0/P1 | completed | WS3 |'), 'backlog marks XTN-03 completed');
  context.assert(backlog.includes('development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md'), 'backlog references XTension Maraca contract');
  context.assert(architectureContract.includes('no-vendored-third-party-frameworks-in-repo-or-npm-package'), 'architecture contract keeps vendored framework boundary');
  context.assert(hostControllerContract.includes('xtend.xtensions.host-controller.v1'), 'HostController contract remains linked');
  context.assert(signalBridgeContract.includes('xtend.xtensions.signal-bridge.v1'), 'Signal Bridge contract remains linked');
  context.assert(maracaContract.includes('Manifest Schema: `xtend.maraca.xtension-manifest.v1`'), 'XTension Maraca contract declares manifest schema');
  context.assert(maracaContract.includes('lazy-loading-remains-explicit-opt-in'), 'XTension Maraca contract records lazy opt-in boundary');
  context.assert(maracaContract.includes('node scripts/run_xtend_tests.js maraca-xtensions --json'), 'XTension Maraca contract declares local gate');

  context.assert(validFixture.schema === 'xtend.maraca.xtension-manifest.fixture.v1', 'valid fixture declares fixture schema');
  context.assert(validFixture.xtensions.length === 2, 'valid fixture includes two XTensions');
  context.assert(missingFixture.expectedDiagnostic === MARACA_XTENSION_MANIFEST_MISSING_CODE, 'missing fixture names expected diagnostic');
  assertIncludesAll(context, policyBlockedFixture.expectedDiagnostics, [
    MARACA_XTENSION_LAZY_POLICY_MISSING_CODE,
    MARACA_XTENSION_INTEGRITY_MISSING_CODE,
    MARACA_XTENSION_CSP_MISSING_CODE,
    MARACA_XTENSION_FALLBACK_MISSING_CODE,
    MARACA_XTENSION_POLICY_BLOCKED_CODE,
    MARACA_XTENSION_VENDORED_FRAMEWORK_CODE
  ], 'policy-blocked fixture names expected diagnostics');

  const dependencyBoundary = assertMaracaXTensionDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${validFixtureText}`,
    xtensions: validFixture.xtensions
  });
  context.assert(dependencyBoundary.ok, `XTension Maraca package, module and valid fixture avoid packaged framework dependencies${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badImportBoundary = assertMaracaXTensionDependencyBoundary({
    sourceText: "import React from 'react';"
  });
  context.assert(badImportBoundary.diagnostics.some((diagnostic) => diagnostic.code === 'xtensions.maraca.framework_dependency'), 'XTension Maraca dependency guard rejects framework imports');

  const contractSnapshot = normalizeContractSnapshot(validFixture.xtensions[0].contract);
  context.assert(contractSnapshot.schema === XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA, 'contract snapshot emits snapshot schema');
  context.assert(contractSnapshot.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'contract snapshot keeps HostController schema');
  context.assert(contractSnapshot.signalBridgeSchema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'contract snapshot keeps Signal Bridge schema');
  context.assert(typeof contractSnapshot.fingerprint === 'string' && contractSnapshot.fingerprint.startsWith('sha256:'), 'contract snapshot exposes sha256 fingerprint');

  const manifest = normalizeXTensionManifest(validFixture.xtensions[0], { clock: createClock() });
  context.assert(manifest.schema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'normalized manifest emits manifest schema');
  context.assert(manifest.ok === true && manifest.status === 'ready', 'valid manifest is ready');
  context.assert(manifest.lazy.mode === 'route' && manifest.lazy.optIn === true, 'valid manifest keeps lazy opt-in');
  context.assert(manifest.integrity.sha256.startsWith('sha256:'), 'valid manifest keeps integrity');
  context.assert(manifest.dependencies.externalPeerCount === 1, 'valid manifest classifies framework as external peer');
  context.assert(manifest.dependencies.packageDependencyCount === 0, 'valid manifest does not package framework dependency');
  context.assert(manifest.dependencies.vendoredDependencyCount === 0, 'valid manifest does not vendor framework dependency');
  context.assert(typeof manifest.manifestFingerprint === 'string' && manifest.manifestFingerprint.startsWith('sha256:'), 'valid manifest exposes manifest fingerprint');
  context.assert(typeof manifest.artifactFingerprint === 'string' && manifest.artifactFingerprint.startsWith('sha256:'), 'valid manifest exposes artifact fingerprint');

  const plan = createMaracaXTensionBuildPlan(validFixture, { clock: createClock() });
  context.assert(plan.schema === XTENSIONS_MARACA_BUILD_PLAN_SCHEMA, 'valid fixture emits build plan schema');
  context.assert(plan.ok === true && plan.status === 'ready', 'valid fixture build plan is ready');
  context.assert(plan.manifestCount === 2, 'valid build plan includes two manifests');
  context.assert(plan.artifactCount === 2, 'valid build plan includes two artifacts');
  context.assert(plan.artifacts.every((artifact) => artifact.schema === XTENSIONS_MARACA_ARTIFACT_SCHEMA), 'valid build plan artifacts keep artifact schema');
  context.assert(plan.artifacts.every((artifact) => artifact.provenance.schema === XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA), 'valid build plan artifacts include provenance');
  context.assert(plan.artifacts.every((artifact) => artifact.provenance.packageIncluded === false), 'valid provenance keeps packageIncluded false');
  context.assert(plan.artifacts.every((artifact) => artifact.provenance.vendoredFrameworksAllowed === false), 'valid provenance blocks vendored frameworks');
  context.assert(plan.artifacts.every((artifact) => artifact.provenance.frameworkDependenciesAllowed === false), 'valid provenance blocks framework dependencies');
  context.assert(plan.artifacts.every((artifact) => artifact.manifestFingerprint && artifact.manifestFingerprint.startsWith('sha256:')), 'valid artifacts expose manifest fingerprints');
  context.assert(plan.artifacts.every((artifact) => artifact.artifactFingerprint && artifact.artifactFingerprint.startsWith('sha256:')), 'valid artifacts expose artifact fingerprints');

  const report = createMaracaXTensionsBundleReport(validFixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA, 'valid fixture emits bundle report schema');
  context.assert(report.xtensions.schema === XTENSIONS_MARACA_BUNDLE_SECTION_SCHEMA, 'bundle report exposes xtensions section');
  context.assert(report.ok === true && report.status === 'ready', 'valid fixture bundle report is ready');
  context.assert(report.xtensions.readyArtifactCount === 2, 'bundle report counts ready artifacts');
  context.assert(report.xtensions.blockedArtifactCount === 0, 'bundle report has no blocked artifacts');
  context.assert(report.xtensions.manifestFingerprints.length === 2, 'bundle report exposes manifest fingerprints');
  context.assert(report.xtensions.artifactFingerprints.length === 2, 'bundle report exposes artifact fingerprints');
  context.assert(report.xtensions.lazyPolicies.every((policy) => policy.optIn === true), 'bundle report exposes lazy opt-in policies');
  context.assert(report.xtensions.dependencyClassifications.every((classification) => classification.packageDependencyCount === 0), 'bundle report dependency classifications do not package frameworks');

  const entryChanged = cloneJson(validFixture);
  entryChanged.xtensions[0].entry.module = 'external-peer://react/todo-host-controller-v2';
  const entryChangedReport = createMaracaXTensionsBundleReport(entryChanged, { clock: createClock() });
  context.assert(
    entryChangedReport.xtensions.artifactFingerprints[0] !== report.xtensions.artifactFingerprints[0],
    'artifact fingerprint changes when entry changes'
  );

  const contractChanged = cloneJson(validFixture);
  contractChanged.xtensions[0].contract.accepts.push('props.replace');
  const contractChangedReport = createMaracaXTensionsBundleReport(contractChanged, { clock: createClock() });
  context.assert(
    contractChangedReport.xtensions.manifestFingerprints[0] !== report.xtensions.manifestFingerprints[0],
    'manifest fingerprint changes when contract changes'
  );

  const missingReport = createMaracaXTensionsBundleReport(missingFixture, { clock: createClock() });
  context.assert(missingReport.ok === false && missingReport.status === 'blocked', 'missing manifest blocks bundle report');
  context.assert(diagnosticCodes(missingReport).includes(MARACA_XTENSION_MANIFEST_MISSING_CODE), 'missing manifest diagnostic is emitted');
  context.assert(missingReport.xtensions.blockedArtifactCount === 1, 'missing manifest stays visible as blocked artifact');

  const policyBlockedReport = createMaracaXTensionsBundleReport(policyBlockedFixture, { clock: createClock() });
  const policyCodes = diagnosticCodes(policyBlockedReport);
  context.assert(policyBlockedReport.ok === false && policyBlockedReport.status === 'blocked', 'policy-blocked manifest blocks bundle report');
  policyBlockedFixture.expectedDiagnostics.forEach((code) => {
    context.assert(policyCodes.includes(code), `${code} diagnostic is emitted`);
  });
  context.assert(policyBlockedReport.xtensions.blockedArtifactCount === 1, 'policy-blocked manifest stays visible as blocked artifact');

  const vendoredClassification = classifyXTensionDependencies(policyBlockedFixture.xtensions[0]);
  context.assert(vendoredClassification.ok === false, 'vendored dependency classification fails');
  context.assert(vendoredClassification.packageDependencyCount === 1, 'vendored classification detects package dependency');
  context.assert(vendoredClassification.vendoredDependencyCount === 1, 'vendored classification detects vendored dependency');

  assertIncludesAll(context, VALID_XTENSION_LAZY_MODES, ['none', 'explicit', 'route', 'visible', 'idle'], 'XTension Maraca lazy modes');
  const serialized = serializeMaracaXTensionReport(report);
  const repeat = serializeMaracaXTensionReport(createMaracaXTensionsBundleReport(validFixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'XTension Maraca report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA, 'serialized XTension Maraca report is parseable JSON');

  return context.result({
    schema: XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA,
    manifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    artifactSchema: XTENSIONS_MARACA_ARTIFACT_SCHEMA,
    provenanceSchema: XTENSIONS_MARACA_BUILD_PROVENANCE_SCHEMA,
    workpackage: XTENSIONS_MARACA_WORKPACKAGE,
    module: XTENSIONS_MARACA_MODULE_PATH,
    suite: XTENSIONS_MARACA_SUITE_PATH,
    validFixture: XTENSIONS_MARACA_VALID_FIXTURE_PATH,
    manifestCount: plan.manifestCount,
    artifactCount: plan.artifactCount
  });
}

function printMaracaXTensionsReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Maraca Manifest and Build Provenance Contract erfolgreich.',
    failureTitle: 'XTensions Maraca Manifest and Build Provenance Contract fehlgeschlagen:'
  });
}

module.exports = {
  printMaracaXTensionsReport,
  runMaracaXTensionsSuite
};
