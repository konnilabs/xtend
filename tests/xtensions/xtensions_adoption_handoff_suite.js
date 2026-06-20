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
  XTENSIONS_MARACA_MANIFEST_SCHEMA
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA
} = require('../../tools/xtensions/runtime-capability-registry');
const {
  XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA
} = require('../../tools/xtensions/security-integrity-gate');
const {
  XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA
} = require('../../tools/xtensions/registry-package-strategy');
const {
  ADOPTION_BOUNDARY_MISSING_CODE,
  ADOPTION_DOC_KINDS,
  ADOPTION_DOC_MISSING_CODE,
  ADOPTION_FRAMEWORK_DEPENDENCY_CODE,
  ADOPTION_REQUIRED_BOUNDARIES,
  ADOPTION_START_PACKAGE_IDS,
  ADOPTION_START_PACKAGE_MISSING_CODE,
  ADOPTION_TOPIC_MISSING_CODE,
  DOC_REQUIRED_TOPICS,
  XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA,
  XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA,
  XTENSIONS_ADOPTION_HANDOFF_CONTRACT_PATH,
  XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH,
  XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH,
  XTENSIONS_ADOPTION_HANDOFF_PACKAGE_SCRIPT,
  XTENSIONS_ADOPTION_HANDOFF_SCHEMA,
  XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH,
  XTENSIONS_ADOPTION_HANDOFF_TYPES_PATH,
  XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
  XTENSIONS_ADOPTION_REPORT_SCHEMA,
  XTENSIONS_ADOPTION_START_PACKAGE_SCHEMA,
  XTENSIONS_AUTHORING_GUIDE_DOC_PATH,
  XTENSIONS_ENTERPRISE_HANDOFF_DOC_PATH,
  XTENSIONS_MIGRATION_COEXISTENCE_DOC_PATH,
  XTENSIONS_SECURITY_CHECKLIST_DOC_PATH,
  assertAdoptionHandoffDependencyBoundary,
  createXTensionsAdoptionHandoffReport,
  normalizeDocArtifact,
  normalizeStartPackage,
  serializeAdoptionHandoffReport
} = require('../../tools/xtensions/adoption-handoff');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const SECURITY_CONTRACT_PATH = 'development/XTensions-Security-CSP-Supply-Chain-Integrity-Gates-Contract.md';
const DASHBOARD_CONTRACT_PATH = 'development/XTensions-Multi-Framework-Dashboard-Fixture-and-Browser-Smokes-Contract.md';
const REGISTRY_CONTRACT_PATH = 'development/XTensions-Registry-and-Package-Strategy-Contract.md';

const DOC_PATHS = [
  XTENSIONS_AUTHORING_GUIDE_DOC_PATH,
  XTENSIONS_MIGRATION_COEXISTENCE_DOC_PATH,
  XTENSIONS_SECURITY_CHECKLIST_DOC_PATH,
  XTENSIONS_ENTERPRISE_HANDOFF_DOC_PATH
];

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
    return `2026-06-20T12:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function dependencySectionCount(packageManifest) {
  return [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ].reduce((count, section) => count + Object.keys(packageManifest[section] || {}).length, 0);
}

function docsWithText(fixture, rootDir) {
  return fixture.docs.map((doc) => ({
    ...doc,
    requiredTopics: DOC_REQUIRED_TOPICS[doc.kind],
    text: readText(doc.path, rootDir)
  }));
}

function runXTensionsAdoptionHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-adoption-handoff',
    label: 'XTensions Docs, Migration and Enterprise Adoption Handoff Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtensionsAdoptionHandoff;
  const xtendMetadata = packageManifest.xtend && packageManifest.xtend.xtensionsAdoptionHandoff;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const securityContract = readText(SECURITY_CONTRACT_PATH, rootDir);
  const dashboardContract = readText(DASHBOARD_CONTRACT_PATH, rootDir);
  const registryContract = readText(REGISTRY_CONTRACT_PATH, rootDir);
  const adoptionContract = readText(XTENSIONS_ADOPTION_HANDOFF_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_ADOPTION_HANDOFF_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH, rootDir);
  const docs = docsWithText(fixture, rootDir);
  const docText = docs.map((doc) => doc.text).join('\n');
  const moduleSyntax = syntaxCheckFile(XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH, { rootDir, extension: '.js' });

  [
    BACKLOG_PATH,
    ARCHITECTURE_CONTRACT_PATH,
    SECURITY_CONTRACT_PATH,
    DASHBOARD_CONTRACT_PATH,
    REGISTRY_CONTRACT_PATH,
    XTENSIONS_ADOPTION_HANDOFF_CONTRACT_PATH,
    XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH,
    XTENSIONS_ADOPTION_HANDOFF_TYPES_PATH,
    XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH,
    XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH,
    ...DOC_PATHS
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });

  context.assert(moduleSyntax.ok, `XTensions adoption handoff module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions adoption handoff suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(!metadata, 'adoption handoff metadata is stored under package.xtend only');
  context.assert(xtendMetadata && xtendMetadata.schema === XTENSIONS_ADOPTION_HANDOFF_SCHEMA, 'package metadata declares adoption handoff schema');
  context.assert(xtendMetadata && xtendMetadata.docArtifactSchema === XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA, 'package metadata declares doc artifact schema');
  context.assert(xtendMetadata && xtendMetadata.startPackageSchema === XTENSIONS_ADOPTION_START_PACKAGE_SCHEMA, 'package metadata declares start package schema');
  context.assert(xtendMetadata && xtendMetadata.reportSchema === XTENSIONS_ADOPTION_REPORT_SCHEMA, 'package metadata declares adoption report schema');
  context.assert(xtendMetadata && xtendMetadata.diagnosticSchema === XTENSIONS_ADOPTION_DIAGNOSTIC_SCHEMA, 'package metadata declares adoption diagnostic schema');
  context.assert(xtendMetadata && xtendMetadata.maracaManifestSchema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'package metadata links Maraca manifest schema');
  context.assert(xtendMetadata && xtendMetadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(xtendMetadata && xtendMetadata.securityGateSchema === XTENSIONS_SECURITY_INTEGRITY_GATE_SCHEMA, 'package metadata links security gate schema');
  context.assert(xtendMetadata && xtendMetadata.registryStrategySchema === XTENSIONS_REGISTRY_PACKAGE_STRATEGY_SCHEMA, 'package metadata links registry strategy schema');
  context.assert(xtendMetadata && xtendMetadata.workpackage === XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE, 'package metadata points to XTN-14');
  context.assert(xtendMetadata && xtendMetadata.module === XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH, 'package metadata points to adoption handoff module');
  context.assert(xtendMetadata && xtendMetadata.types === XTENSIONS_ADOPTION_HANDOFF_TYPES_PATH, 'package metadata points to adoption handoff types');
  context.assert(xtendMetadata && xtendMetadata.fixture === XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH, 'package metadata points to adoption handoff fixture');
  context.assert(xtendMetadata && xtendMetadata.suite === XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH, 'package metadata points to adoption handoff suite');
  context.assert(xtendMetadata && xtendMetadata.contract === XTENSIONS_ADOPTION_HANDOFF_CONTRACT_PATH, 'package metadata points to adoption handoff contract');
  context.assert(xtendMetadata && xtendMetadata.localGate === 'node scripts/run_xtend_tests.js xtensions-adoption-handoff --json', 'package metadata declares adoption handoff local gate');
  context.assert(xtendMetadata && xtendMetadata.packageScript === XTENSIONS_ADOPTION_HANDOFF_PACKAGE_SCRIPT, 'package metadata declares adoption handoff package script');
  context.assert(xtendMetadata && xtendMetadata.optInCoexistence === true, 'package metadata keeps opt-in coexistence');
  context.assert(xtendMetadata && xtendMetadata.nativeFirstDefault === true, 'package metadata keeps native-first default');
  context.assert(xtendMetadata && xtendMetadata.frameworkAgnosticKernel === true, 'package metadata keeps framework-agnostic kernel');
  context.assert(xtendMetadata && xtendMetadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(xtendMetadata && xtendMetadata.vendoredFrameworksAllowed === false, 'package metadata blocks vendored frameworks');
  context.assert(xtendMetadata && xtendMetadata.runtimeExecutionRequired === false, 'package metadata requires no framework runtime execution');
  assertIncludesAll(context, xtendMetadata && Object.values(xtendMetadata.docs || {}), DOC_PATHS, 'package metadata lists adoption docs');

  const exportEntry = packageManifest.exports['./xtensions/adoption-handoff'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/adoption-handoff.js', 'package exports XTensions adoption handoff module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/adoption-handoff.d.ts', 'package exports XTensions adoption handoff types');
  context.assert(packageManifest.scripts['test:xtensions-adoption-handoff'] === 'node scripts/run_xtend_tests.js xtensions-adoption-handoff', 'package exposes adoption handoff test script');
  context.assert(runner.includes("id: 'xtensions-adoption-handoff'"), 'test runner exposes xtensions-adoption-handoff suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-adoption-handoff'), 'runner help references adoption handoff gate');

  context.assert(backlog.includes('| `XTN-14` | P2 | completed | WS13 |'), 'backlog marks XTN-14 completed');
  context.assert(backlog.includes('development/XTensions-Docs-Migration-Enterprise-Adoption-Handoff-Contract.md'), 'backlog references adoption handoff contract');
  context.assert(architectureContract.includes('orchestration targets, not XTend dependencies'), 'architecture contract keeps dependency framing');
  context.assert(securityContract.includes('Framework-Runtimes muessen `peer` oder `optional` bleiben'), 'security contract keeps peer dependency boundary');
  context.assert(dashboardContract.includes('React-, Vue-, Chart.js-, Leaflet- und Three.js-aehnlichen XTension-Surfaces'), 'dashboard contract feeds adoption context');
  context.assert(registryContract.includes('XTensions starten als projekt-lokale Maraca-Manifeste'), 'registry contract feeds adoption distribution decision');
  context.assert(adoptionContract.includes('Local Gate: `node scripts/run_xtend_tests.js xtensions-adoption-handoff --json`'), 'adoption contract declares local gate');
  context.assert(adoptionContract.includes('Testkomponenten fuer echte Frameworks gehoeren in externe opt-in Peer-Harnesses'), 'adoption contract keeps external peer harness boundary');

  context.assert(fixture.schema === 'xtend.xtensions.adoption-handoff.fixture.v1', 'fixture declares adoption handoff fixture schema');
  context.assert(fixture.expectedStatus === 'ready', 'fixture names expected ready status');
  context.assert(fixture.expectedBlockedStatus === 'blocked', 'fixture names expected blocked status');
  context.assert(fixture.dependencyPolicy.frameworkDependenciesAllowed === false, 'fixture blocks framework dependencies');
  context.assert(dependencySectionCount(packageManifest) === 0, 'root package keeps dependency sections empty');
  assertIncludesAll(context, fixture.boundaries, ADOPTION_REQUIRED_BOUNDARIES, 'fixture exposes adoption boundaries');
  assertIncludesAll(context, fixture.startPackages.map((startPackage) => startPackage.id), ADOPTION_START_PACKAGE_IDS, 'fixture exposes start package ids');

  docs.forEach((doc) => {
    context.assert(ADOPTION_DOC_KINDS.includes(doc.kind), `${doc.path} declares a known doc kind`);
    DOC_REQUIRED_TOPICS[doc.kind].forEach((topic) => {
      context.assert(doc.text.toLowerCase().includes(topic.toLowerCase()), `${doc.path} includes required topic ${topic}`);
    });
  });

  const dependencyBoundary = assertAdoptionHandoffDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${docText}\n${adoptionContract}`
  });
  context.assert(dependencyBoundary.ok, `adoption handoff sources avoid real framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependency = assertAdoptionHandoffDependencyBoundary({
    sourceText: "import React from 'react';"
  });
  context.assert(
    badDependency.diagnostics.some((diagnostic) => diagnostic.code === ADOPTION_FRAMEWORK_DEPENDENCY_CODE),
    'adoption dependency guard rejects framework imports'
  );

  const authoringDoc = normalizeDocArtifact(docs[0], { clock: createClock() });
  context.assert(authoringDoc.ok === true && authoringDoc.schema === XTENSIONS_ADOPTION_DOC_ARTIFACT_SCHEMA, 'authoring doc normalizes as ready artifact');
  const missingTopicDoc = normalizeDocArtifact({
    kind: 'authoring-guide',
    path: 'docs/de/missing.md',
    title: 'Missing',
    requiredTopics: ['HostController', 'external opt-in peer harness'],
    text: 'HostController only'
  }, { clock: createClock() });
  context.assert(diagnosticCodes(missingTopicDoc).includes(ADOPTION_TOPIC_MISSING_CODE), 'doc topic guard emits missing topic diagnostic');
  const badStartPackage = normalizeStartPackage({
    id: 'external-peer-harness-template',
    title: 'Bad Harness',
    outcomes: ['bad'],
    frameworkDependenciesAllowed: true
  }, { clock: createClock() });
  context.assert(diagnosticCodes(badStartPackage).includes(ADOPTION_FRAMEWORK_DEPENDENCY_CODE), 'start package guard rejects bundled framework dependencies');

  const report = createXTensionsAdoptionHandoffReport({
    ...fixture,
    docs,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${docText}\n${adoptionContract}`
  }, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_ADOPTION_REPORT_SCHEMA, 'adoption handoff report emits schema');
  context.assert(report.ok === true && report.status === fixture.expectedStatus, 'valid adoption handoff report is ready');
  context.assert(report.handoffSchema === XTENSIONS_ADOPTION_HANDOFF_SCHEMA, 'report links handoff schema');
  context.assert(report.optInCoexistence === true, 'report keeps opt-in coexistence');
  context.assert(report.nativeFirstDefault === true, 'report keeps native-first default');
  context.assert(report.frameworkAgnosticKernel === true, 'report keeps framework-agnostic kernel');
  context.assert(report.frameworkCodeRequired === false && report.runtimeExecutionRequired === false, 'report executes no framework code');
  context.assert(report.packageFrameworkDependenciesAllowed === false && report.vendoredFrameworksAllowed === false, 'report blocks packaged frameworks');
  context.assert(report.summary.docCount === 4 && report.summary.readyDocCount === 4, 'report counts ready adoption docs');
  context.assert(report.summary.startPackageCount === 5 && report.summary.readyStartPackageCount === 5, 'report counts start packages');
  context.assert(report.summary.errorCount === 0, 'valid adoption report has no blocking errors');
  assertIncludesAll(context, report.summary.docKinds, ADOPTION_DOC_KINDS, 'report summarizes doc kinds');
  assertIncludesAll(context, report.summary.startPackageIds, ADOPTION_START_PACKAGE_IDS, 'report summarizes start package ids');
  assertIncludesAll(context, report.boundaries, ADOPTION_REQUIRED_BOUNDARIES, 'report carries required boundaries');
  context.assert(typeof report.handoffFingerprint === 'string' && report.handoffFingerprint.startsWith('sha256:'), 'report emits fingerprint');

  const blockedReport = createXTensionsAdoptionHandoffReport({
    docs: [docs[0]],
    startPackages: [],
    boundaries: [],
    sourceText: "const Vue = require('vue');"
  }, { clock: createClock() });
  const blockedCodes = diagnosticCodes(blockedReport);
  context.assert(blockedReport.ok === false && blockedReport.status === fixture.expectedBlockedStatus, 'blocked adoption handoff report is blocked');
  [
    ADOPTION_DOC_MISSING_CODE,
    ADOPTION_BOUNDARY_MISSING_CODE,
    ADOPTION_START_PACKAGE_MISSING_CODE,
    ADOPTION_FRAMEWORK_DEPENDENCY_CODE
  ].forEach((code) => {
    context.assert(blockedCodes.includes(code), `${code} diagnostic is emitted`);
  });
  fixture.expectedDiagnostics.forEach((code) => {
    context.assert(blockedCodes.includes(code) || code === ADOPTION_TOPIC_MISSING_CODE, `${code} diagnostic constant is wired`);
  });

  const serialized = serializeAdoptionHandoffReport(report);
  const repeat = serializeAdoptionHandoffReport(createXTensionsAdoptionHandoffReport({
    ...fixture,
    docs,
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${docText}\n${adoptionContract}`
  }, { clock: createClock() }));
  context.assert(serialized === repeat, 'adoption handoff report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_ADOPTION_REPORT_SCHEMA, 'serialized adoption report is parseable JSON');
  context.assert(!serialized.includes('"dependencies":{"react"'), 'serialized adoption report does not add package dependencies');
  context.assert(!serialized.includes('node_modules'), 'serialized adoption report contains no vendored module path');

  return context.result({
    schema: XTENSIONS_ADOPTION_REPORT_SCHEMA,
    handoffSchema: XTENSIONS_ADOPTION_HANDOFF_SCHEMA,
    workpackage: XTENSIONS_ADOPTION_HANDOFF_WORKPACKAGE,
    module: XTENSIONS_ADOPTION_HANDOFF_MODULE_PATH,
    suite: XTENSIONS_ADOPTION_HANDOFF_SUITE_PATH,
    fixture: XTENSIONS_ADOPTION_HANDOFF_FIXTURE_PATH,
    docCount: report.summary.docCount,
    startPackageCount: report.summary.startPackageCount,
    diagnosticCount: report.summary.diagnosticCount,
    blockedDiagnosticCount: blockedReport.summary.diagnosticCount
  });
}

function printXTensionsAdoptionHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Docs, Migration and Enterprise Adoption Handoff Contract erfolgreich.',
    failureTitle: 'XTensions Docs, Migration and Enterprise Adoption Handoff Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsAdoptionHandoffReport,
  runXTensionsAdoptionHandoffSuite
};
