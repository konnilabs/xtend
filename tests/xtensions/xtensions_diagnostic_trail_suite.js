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
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA
} = require('../../tools/xtensions/host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('../../tools/xtensions/signal-bridge-contract');
const {
  XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA,
  XTENSIONS_RUNTIME_REPORT_SCHEMA
} = require('../../tools/xtensions/runtime-capability-registry');
const {
  XTENSIONS_MARACA_MANIFEST_SCHEMA
} = require('../../tools/xtensions/maraca-xtension-manifest');
const {
  DEFAULT_REDACTION_POLICY,
  DIAGNOSTIC_TRAIL_ACTIONS,
  DIAGNOSTIC_TRAIL_ACTION_UNSUPPORTED_CODE,
  DIAGNOSTIC_TRAIL_BOUNDARIES,
  DIAGNOSTIC_TRAIL_CORRELATION_MISSING_CODE,
  DIAGNOSTIC_TRAIL_FRAMEWORK_DEPENDENCY_CODE,
  DIAGNOSTIC_TRAIL_PAYLOAD_NON_SERIALIZABLE_CODE,
  DIAGNOSTIC_TRAIL_REDACTION_POLICY_INVALID_CODE,
  DIAGNOSTIC_TRAIL_REDACTION_REQUIRED_CODE,
  DIAGNOSTIC_TRAIL_SEQUENCE_INVALID_CODE,
  DIAGNOSTIC_TRAIL_STATUSES,
  REQUIRED_CORRELATION_FIELDS,
  XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_CONTRACT_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_PACKAGE_SCRIPT,
  XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
  XTENSIONS_DIAGNOSTIC_TRAIL_SUITE_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_TYPES_PATH,
  XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
  assertDiagnosticTrailDependencyBoundary,
  createDiagnosticTrailContract,
  createDiagnosticTrailCorrelation,
  createDiagnosticTrailRecord,
  createDiagnosticTrailReport,
  redactPayload,
  serializeDiagnosticTrailReport
} = require('../../tools/xtensions/diagnostic-trail');

const BACKLOG_PATH = 'development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md';
const ARCHITECTURE_CONTRACT_PATH = 'development/XTensions-Architecture-and-Threat-Model-Contract.md';
const HOST_CONTROLLER_CONTRACT_PATH = 'development/XTensions-HostController-Lifecycle-Contract.md';
const SIGNAL_BRIDGE_CONTRACT_PATH = 'development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md';
const MARACA_CONTRACT_PATH = 'development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md';
const RUNTIME_REGISTRY_CONTRACT_PATH = 'development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md';

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
    return `2026-06-20T10:00:${String(tick).padStart(2, '0')}Z`;
  };
}

function diagnosticCodes(record) {
  return (record.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function baseCorrelation(overrides = {}) {
  return {
    xtensionId: 'xtension.react.panel',
    framework: 'react',
    manifestId: 'maraca.xtension.react.panel',
    artifactId: 'maraca.artifact.react.panel.client',
    artifactFingerprint: 'sha256:react-panel-artifact-fixture',
    buildFingerprint: 'sha256:react-panel-build-fixture',
    runtimeHostId: 'xtensions-runtime-host',
    hostId: 'xtensions-runtime-host',
    surfaceId: 'surface.react.panel',
    lane: 'fabric.visible',
    routeId: 'route.dashboard',
    traceId: 'trace.xtensions.diagnostic.fixture',
    correlationId: 'corr.xtensions.diagnostic.fixture',
    ...overrides
  };
}

function runXTensionsDiagnosticTrailSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtensions-diagnostic-trail',
    label: 'XTensions Diagnostic Trail Contract'
  });

  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xtensionsDiagnosticTrail;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const architectureContract = readText(ARCHITECTURE_CONTRACT_PATH, rootDir);
  const hostControllerContract = readText(HOST_CONTROLLER_CONTRACT_PATH, rootDir);
  const signalBridgeContract = readText(SIGNAL_BRIDGE_CONTRACT_PATH, rootDir);
  const maracaContract = readText(MARACA_CONTRACT_PATH, rootDir);
  const runtimeRegistryContract = readText(RUNTIME_REGISTRY_CONTRACT_PATH, rootDir);
  const diagnosticTrailContract = readText(XTENSIONS_DIAGNOSTIC_TRAIL_CONTRACT_PATH, rootDir);
  const fixture = readJson(XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH, rootDir);
  const moduleText = readText(XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH, rootDir);
  const typesText = readText(XTENSIONS_DIAGNOSTIC_TRAIL_TYPES_PATH, rootDir);
  const fixtureText = readText(XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(XTENSIONS_DIAGNOSTIC_TRAIL_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, BACKLOG_PATH, rootDir, 'XTensions backlog exists');
  assertFileExists(context, ARCHITECTURE_CONTRACT_PATH, rootDir, 'XTensions architecture contract exists');
  assertFileExists(context, HOST_CONTROLLER_CONTRACT_PATH, rootDir, 'XTensions HostController contract exists');
  assertFileExists(context, SIGNAL_BRIDGE_CONTRACT_PATH, rootDir, 'XTensions Signal Bridge contract exists');
  assertFileExists(context, MARACA_CONTRACT_PATH, rootDir, 'XTensions Maraca contract exists');
  assertFileExists(context, RUNTIME_REGISTRY_CONTRACT_PATH, rootDir, 'XTensions runtime registry contract exists');
  assertFileExists(context, XTENSIONS_DIAGNOSTIC_TRAIL_CONTRACT_PATH, rootDir, 'XTensions Diagnostic Trail contract exists');
  assertFileExists(context, XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH, rootDir, 'XTensions Diagnostic Trail module exists');
  assertFileExists(context, XTENSIONS_DIAGNOSTIC_TRAIL_TYPES_PATH, rootDir, 'XTensions Diagnostic Trail types exist');
  assertFileExists(context, XTENSIONS_DIAGNOSTIC_TRAIL_SUITE_PATH, rootDir, 'XTensions Diagnostic Trail suite exists');
  assertFileExists(context, XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH, rootDir, 'XTensions Diagnostic Trail fixture exists');
  context.assert(moduleSyntax.ok, `XTensions Diagnostic Trail module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XTensions Diagnostic Trail suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA, 'package metadata declares Diagnostic Trail schema');
  context.assert(metadata && metadata.recordSchema === XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA, 'package metadata declares Diagnostic Trail record schema');
  context.assert(metadata && metadata.correlationSchema === XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA, 'package metadata declares Diagnostic Trail correlation schema');
  context.assert(metadata && metadata.redactionPolicySchema === XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA, 'package metadata declares redaction policy schema');
  context.assert(metadata && metadata.reportSchema === XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA, 'package metadata declares Diagnostic Trail report schema');
  context.assert(metadata && metadata.hostControllerSchema === XTENSIONS_HOST_CONTROLLER_SCHEMA, 'package metadata links HostController schema');
  context.assert(metadata && metadata.lifecycleRecordSchema === XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA, 'package metadata links lifecycle record schema');
  context.assert(metadata && metadata.signalBridgeSchema === XTENSIONS_SIGNAL_BRIDGE_SCHEMA, 'package metadata links Signal Bridge schema');
  context.assert(metadata && metadata.kernelSignalSchema === XTENSIONS_KERNEL_SIGNAL_SCHEMA, 'package metadata links Kernel Signal schema');
  context.assert(metadata && metadata.surfaceEventSchema === XTENSIONS_SURFACE_EVENT_SCHEMA, 'package metadata links Surface Event schema');
  context.assert(metadata && metadata.runtimeRegistrySchema === XTENSIONS_RUNTIME_CAPABILITY_REGISTRY_SCHEMA, 'package metadata links runtime registry schema');
  context.assert(metadata && metadata.runtimeReportSchema === XTENSIONS_RUNTIME_REPORT_SCHEMA, 'package metadata links runtime report schema');
  context.assert(metadata && metadata.maracaManifestSchema === XTENSIONS_MARACA_MANIFEST_SCHEMA, 'package metadata links Maraca manifest schema');
  context.assert(metadata && metadata.workpackage === XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE, 'package metadata points to XTN-10');
  context.assert(metadata && metadata.module === XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH, 'package metadata points to Diagnostic Trail module');
  context.assert(metadata && metadata.types === XTENSIONS_DIAGNOSTIC_TRAIL_TYPES_PATH, 'package metadata points to Diagnostic Trail types');
  context.assert(metadata && metadata.fixture === XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH, 'package metadata points to Diagnostic Trail fixture');
  context.assert(metadata && metadata.contract === XTENSIONS_DIAGNOSTIC_TRAIL_CONTRACT_PATH, 'package metadata points to Diagnostic Trail contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtensions-diagnostic-trail --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTENSIONS_DIAGNOSTIC_TRAIL_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.optional === true, 'package metadata marks diagnostic trail optional');
  context.assert(metadata && metadata.frameworkDependenciesAllowed === false, 'package metadata blocks framework dependencies');
  context.assert(metadata && metadata.runtimeExecutionRequired === false, 'package metadata forbids runtime execution');
  context.assert(metadata && metadata.ciReadable === true && metadata.devtoolsReadable === true, 'package metadata marks CI and DevTools readability');

  const exportEntry = packageManifest.exports['./xtensions/diagnostic-trail'];
  context.assert(exportEntry && exportEntry.default === './tools/xtensions/diagnostic-trail.js', 'package exports Diagnostic Trail module');
  context.assert(exportEntry && exportEntry.types === './tools/xtensions/diagnostic-trail.d.ts', 'package exports Diagnostic Trail types');
  context.assert(packageManifest.scripts['test:xtensions-diagnostic-trail'] === 'node scripts/run_xtend_tests.js xtensions-diagnostic-trail', 'package exposes Diagnostic Trail script');
  context.assert(runner.includes("id: 'xtensions-diagnostic-trail'"), 'test runner exposes xtensions-diagnostic-trail suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xtensions-diagnostic-trail'), 'runner help references Diagnostic Trail gate');

  context.assert(backlog.includes('| `XTN-10` | P1 | completed | WS9 |'), 'backlog marks XTN-10 completed');
  context.assert(backlog.includes('development/XTensions-Diagnostic-Trail-Contract.md'), 'backlog references Diagnostic Trail contract');
  context.assert(architectureContract.includes('no-framework-test-fixture-dependencies-in-xtend-package'), 'architecture contract keeps no framework fixture dependency boundary');
  context.assert(hostControllerContract.includes('HostController'), 'HostController contract remains linked');
  context.assert(signalBridgeContract.includes('SurfaceEvent'), 'Signal Bridge contract remains linked');
  context.assert(maracaContract.includes('Build Provenance'), 'Maraca contract remains linked');
  context.assert(runtimeRegistryContract.includes('Runtime Capability Registry'), 'Runtime registry contract remains linked');
  context.assert(diagnosticTrailContract.includes('Payloads werden vor Report-Ausgabe redigiert.'), 'Diagnostic Trail contract requires payload redaction');
  context.assert(diagnosticTrailContract.includes('node scripts/run_xtend_tests.js xtensions-diagnostic-trail --json'), 'Diagnostic Trail contract declares local gate');

  context.assert(fixture.schema === 'xtend.xtensions.diagnostic-trail.fixture.v1', 'fixture declares Diagnostic Trail fixture schema');
  assertIncludesAll(context, fixture.expectedActions, DIAGNOSTIC_TRAIL_ACTIONS, 'fixture names all expected Diagnostic Trail actions');
  assertIncludesAll(context, Object.keys(fixture.expectedCorrelation), REQUIRED_CORRELATION_FIELDS, 'fixture expected correlation includes required fields');

  const dependencyBoundary = assertDiagnosticTrailDependencyBoundary({
    packageManifest,
    sourceText: `${moduleText}\n${typesText}\n${fixtureText}\n${diagnosticTrailContract}`
  });
  context.assert(dependencyBoundary.ok, `Diagnostic Trail sources avoid framework imports${dependencyBoundary.ok ? '' : ` (${dependencyBoundary.diagnostics.map((diagnostic) => diagnostic.message).join('; ')})`}`);
  const badDependency = assertDiagnosticTrailDependencyBoundary({
    sourceText: "import React from 'react';"
  });
  context.assert(
    badDependency.diagnostics.some((diagnostic) => diagnostic.code === DIAGNOSTIC_TRAIL_FRAMEWORK_DEPENDENCY_CODE),
    'Diagnostic Trail dependency guard rejects framework imports'
  );

  const contract = createDiagnosticTrailContract(fixture);
  context.assert(contract.schema === XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA, 'Diagnostic Trail contract emits schema');
  context.assert(contract.recordSchema === XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA, 'Diagnostic Trail contract links record schema');
  context.assert(contract.correlationSchema === XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA, 'Diagnostic Trail contract links correlation schema');
  context.assert(contract.redactionPolicySchema === XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA, 'Diagnostic Trail contract links redaction policy schema');
  context.assert(contract.optional === true, 'Diagnostic Trail contract is optional');
  context.assert(contract.frameworkDependenciesAllowed === false, 'Diagnostic Trail contract blocks framework dependencies');
  context.assert(contract.runtimeExecutionRequired === false, 'Diagnostic Trail contract requires no runtime execution');
  assertIncludesAll(context, contract.actions, DIAGNOSTIC_TRAIL_ACTIONS, 'Diagnostic Trail contract exposes actions');
  assertIncludesAll(context, contract.statuses, DIAGNOSTIC_TRAIL_STATUSES, 'Diagnostic Trail contract exposes statuses');
  assertIncludesAll(context, contract.requiredCorrelationFields, REQUIRED_CORRELATION_FIELDS, 'Diagnostic Trail contract exposes required correlation fields');
  assertIncludesAll(context, contract.boundaries, DIAGNOSTIC_TRAIL_BOUNDARIES, 'Diagnostic Trail contract exposes boundaries');
  context.assert(DEFAULT_REDACTION_POLICY.schema === XTENSIONS_DIAGNOSTIC_REDACTION_POLICY_SCHEMA, 'default redaction policy emits schema');

  const correlation = createDiagnosticTrailCorrelation(baseCorrelation(), { clock: createClock() });
  context.assert(correlation.schema === XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA, 'Diagnostic Trail correlation emits schema');
  context.assert(correlation.ok === true && correlation.correlationId === 'corr.xtensions.diagnostic.fixture', 'complete correlation is accepted');
  const missingCorrelation = createDiagnosticTrailCorrelation({ xtensionId: 'xtension.missing' }, { clock: createClock() });
  context.assert(missingCorrelation.ok === false, 'missing correlation fields are rejected');
  context.assert(diagnosticCodes(missingCorrelation).includes(DIAGNOSTIC_TRAIL_CORRELATION_MISSING_CODE), 'missing correlation diagnostic is emitted');

  const allowlistRedaction = redactPayload({
    id: 'user-42',
    role: 'operator',
    email: 'operator@example.invalid',
    token: 'secret-token'
  }, {
    payloadSchema: 'xtensions.user.profile.v1',
    policy: fixture.redactionPolicy,
    subject: baseCorrelation()
  });
  context.assert(allowlistRedaction.ok === true && allowlistRedaction.action === 'allowlist', 'allowlist redaction is accepted');
  context.assert(allowlistRedaction.payload.id === 'user-42' && allowlistRedaction.payload.role === 'operator', 'allowlist keeps approved fields');
  context.assert(!Object.prototype.hasOwnProperty.call(allowlistRedaction.payload, 'email'), 'allowlist removes email field');
  context.assert(!Object.prototype.hasOwnProperty.call(allowlistRedaction.payload, 'token'), 'allowlist removes token field');
  const shapeRedaction = redactPayload({
    center: [52.52, 13.405],
    zoom: 12
  }, {
    payloadSchema: 'xtensions.map.viewport-event.v1',
    policy: fixture.redactionPolicy,
    subject: baseCorrelation()
  });
  context.assert(shapeRedaction.ok === true && shapeRedaction.action === 'shape' && shapeRedaction.payload.mode === 'shape', 'shape redaction replaces payload with shape marker');
  const hashRedaction = redactPayload({
    message: 'Adapter boundary error',
    authorization: 'Bearer secret'
  }, {
    payloadSchema: 'xtensions.error.v1',
    policy: fixture.redactionPolicy,
    subject: baseCorrelation()
  });
  context.assert(hashRedaction.ok === true && hashRedaction.action === 'hash' && hashRedaction.payload.sha256, 'hash redaction replaces payload with hash marker');
  const passthroughSensitiveRedaction = redactPayload({
    ok: true,
    password: 'plain-text'
  }, {
    payloadSchema: 'xtensions.lifecycle.summary.v1',
    policy: fixture.redactionPolicy,
    subject: baseCorrelation()
  });
  context.assert(passthroughSensitiveRedaction.ok === true && passthroughSensitiveRedaction.redacted === true, 'passthrough schema still redacts sensitive fields');
  context.assert(!Object.prototype.hasOwnProperty.call(passthroughSensitiveRedaction.payload, 'password'), 'sensitive password field is dropped');
  const unknownRedaction = redactPayload({
    unknown: true
  }, {
    payloadSchema: 'xtensions.unknown.v1',
    policy: fixture.redactionPolicy,
    subject: baseCorrelation()
  });
  context.assert(unknownRedaction.ok === true && diagnosticCodes(unknownRedaction).includes(DIAGNOSTIC_TRAIL_REDACTION_REQUIRED_CODE), 'unknown payload schema emits redaction-required info diagnostic');
  const invalidRedaction = redactPayload({
    value: 'x'
  }, {
    payloadSchema: 'xtensions.invalid.v1',
    policy: {
      ...fixture.redactionPolicy,
      schemaRules: [
        {
          payloadSchema: 'xtensions.invalid.v1',
          action: 'teleport'
        }
      ]
    },
    subject: baseCorrelation()
  });
  context.assert(invalidRedaction.ok === false && diagnosticCodes(invalidRedaction).includes(DIAGNOSTIC_TRAIL_REDACTION_POLICY_INVALID_CODE), 'invalid redaction policy is diagnosed');

  const mountRecord = createDiagnosticTrailRecord({
    action: 'mount',
    status: 'ok',
    payloadSchema: 'xtensions.lifecycle.summary.v1',
    correlation: baseCorrelation(),
    payload: { phase: 'ready' }
  }, {
    redactionPolicy: fixture.redactionPolicy,
    sequence: 1,
    clock: createClock()
  });
  context.assert(mountRecord.schema === XTENSIONS_DIAGNOSTIC_TRAIL_RECORD_SCHEMA, 'Diagnostic Trail record emits schema');
  context.assert(mountRecord.ok === true && mountRecord.action === 'mount', 'mount Diagnostic Trail record is accepted');
  context.assert(mountRecord.correlation.schema === XTENSIONS_DIAGNOSTIC_TRAIL_CORRELATION_SCHEMA, 'Diagnostic Trail record embeds correlation');
  const unsupportedRecord = createDiagnosticTrailRecord({
    action: 'teleport',
    payloadSchema: 'xtensions.lifecycle.summary.v1',
    correlation: baseCorrelation(),
    payload: {}
  }, {
    redactionPolicy: fixture.redactionPolicy,
    sequence: 2,
    clock: createClock()
  });
  context.assert(unsupportedRecord.ok === false && diagnosticCodes(unsupportedRecord).includes(DIAGNOSTIC_TRAIL_ACTION_UNSUPPORTED_CODE), 'unsupported action is diagnosed');
  const negativeSequence = createDiagnosticTrailRecord({
    action: 'update',
    sequence: -1,
    payloadSchema: 'xtensions.lifecycle.summary.v1',
    correlation: baseCorrelation(),
    payload: {}
  }, {
    redactionPolicy: fixture.redactionPolicy,
    clock: createClock()
  });
  context.assert(negativeSequence.ok === false && diagnosticCodes(negativeSequence).includes(DIAGNOSTIC_TRAIL_SEQUENCE_INVALID_CODE), 'negative sequence is diagnosed');
  const functionPayload = createDiagnosticTrailRecord({
    action: 'update',
    payloadSchema: 'xtensions.lifecycle.summary.v1',
    correlation: baseCorrelation(),
    payload: { onClick() {} }
  }, {
    redactionPolicy: fixture.redactionPolicy,
    sequence: 3,
    clock: createClock()
  });
  context.assert(functionPayload.ok === false && diagnosticCodes(functionPayload).includes(DIAGNOSTIC_TRAIL_PAYLOAD_NON_SERIALIZABLE_CODE), 'non-serializable Diagnostic Trail payload is diagnosed');

  const report = createDiagnosticTrailReport(fixture, { clock: createClock() });
  context.assert(report.schema === XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA, 'Diagnostic Trail report emits schema');
  context.assert(report.ok === true && report.status === 'ready', 'Diagnostic Trail fixture report is ready');
  context.assert(report.ciReadable === true && report.devtoolsReadable === true, 'Diagnostic Trail report is CI and DevTools readable');
  context.assert(report.frameworkCodeRequired === false && report.runtimeExecutionRequired === false, 'Diagnostic Trail report requires no framework code');
  context.assert(report.summary.recordCount === DIAGNOSTIC_TRAIL_ACTIONS.length, 'Diagnostic Trail report contains one record per action');
  assertIncludesAll(context, Object.keys(report.summary.recordsByAction), DIAGNOSTIC_TRAIL_ACTIONS, 'Diagnostic Trail report summarizes all actions');
  context.assert(report.summary.redactionCount >= 6, 'Diagnostic Trail report records payload redactions');
  context.assert(report.summary.correlationIds.includes('corr.xtensions.diagnostic.fixture'), 'Diagnostic Trail report summarizes correlation ids');
  context.assert(report.records.every((record) => record.ok === true), 'Diagnostic Trail report records are accepted');
  context.assert(report.records.every((record) => record.correlation.ok === true), 'Diagnostic Trail report records have complete correlation');
  context.assert(report.records.some((record) => record.action === 'error' && record.severity === 'error'), 'Diagnostic Trail report marks error action severity');
  context.assert(report.records.some((record) => record.action === 'update' && record.redaction.action === 'allowlist'), 'Diagnostic Trail report includes allowlist redaction');
  context.assert(report.records.some((record) => record.action === 'signal.receive' && record.redaction.action === 'shape'), 'Diagnostic Trail report includes shape redaction');
  context.assert(report.records.some((record) => record.action === 'error' && record.redaction.action === 'hash'), 'Diagnostic Trail report includes hash redaction');

  const serialized = serializeDiagnosticTrailReport(report);
  const repeat = serializeDiagnosticTrailReport(createDiagnosticTrailReport(fixture, { clock: createClock() }));
  context.assert(serialized === repeat, 'Diagnostic Trail report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA, 'serialized Diagnostic Trail report is parseable JSON');
  context.assert(!serialized.includes('secret-token'), 'serialized Diagnostic Trail report does not expose token');
  context.assert(!serialized.includes('operator@example.invalid'), 'serialized Diagnostic Trail report does not expose email');
  context.assert(!serialized.includes('Bearer secret'), 'serialized Diagnostic Trail report does not expose authorization value');
  context.assert(!serialized.includes('Adapter boundary error'), 'serialized Diagnostic Trail report does not expose raw error message');

  return context.result({
    schema: XTENSIONS_DIAGNOSTIC_TRAIL_REPORT_SCHEMA,
    trailSchema: XTENSIONS_DIAGNOSTIC_TRAIL_SCHEMA,
    workpackage: XTENSIONS_DIAGNOSTIC_TRAIL_WORKPACKAGE,
    module: XTENSIONS_DIAGNOSTIC_TRAIL_MODULE_PATH,
    suite: XTENSIONS_DIAGNOSTIC_TRAIL_SUITE_PATH,
    fixture: XTENSIONS_DIAGNOSTIC_TRAIL_FIXTURE_PATH,
    recordCount: report.summary.recordCount,
    redactionCount: report.summary.redactionCount,
    diagnosticCount: report.summary.diagnosticCount
  });
}

function printXTensionsDiagnosticTrailReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTensions Diagnostic Trail Contract erfolgreich.',
    failureTitle: 'XTensions Diagnostic Trail Contract fehlgeschlagen:'
  });
}

module.exports = {
  printXTensionsDiagnosticTrailReport,
  runXTensionsDiagnosticTrailSuite
};
