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
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
  createEnterpriseSurfaceRegistry
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
  createRmtVNextCrossSurfaceEventProtocol
} = require('../../tools/rmt-language/vnext-cross-surface-events');
const {
  EVENT_GOVERNANCE_CORRELATION_ID_MISSING_CODE,
  EVENT_GOVERNANCE_CROSS_TEAM_REVIEW_MISSING_CODE,
  EVENT_GOVERNANCE_DELIVERY_MODE_INVALID_CODE,
  EVENT_GOVERNANCE_DELIVERY_MODES,
  EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE,
  EVENT_GOVERNANCE_IDEMPOTENCY_KEY_MISSING_CODE,
  EVENT_GOVERNANCE_IMPLICIT_COUPLING_CODE,
  EVENT_GOVERNANCE_OWNER_UNKNOWN_CODE,
  EVENT_GOVERNANCE_PAYLOAD_OWNER_MISMATCH_CODE,
  EVENT_GOVERNANCE_PROTOCOL_BLOCKED_CODE,
  EVENT_GOVERNANCE_SENSITIVITY_LEVELS,
  EVENT_GOVERNANCE_SENSITIVITY_MISSING_CODE,
  EVENT_GOVERNANCE_TTL_MISSING_CODE,
  EVENT_GOVERNANCE_VERSION_OWNER_MISMATCH_CODE,
  RMT_VNEXT_EVENT_GOVERNANCE_CONTRACT_PATH,
  RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_MODULE_PATH,
  RMT_VNEXT_EVENT_GOVERNANCE_PACKAGE_SCRIPT,
  RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
  RMT_VNEXT_EVENT_GOVERNANCE_SUITE_PATH,
  RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE,
  RMT_VNEXT_EVENT_GOVERNANCE_WP_PATH,
  createRmtVNextEventGovernanceAdapter,
  createRmtVNextEventGovernanceReport,
  serializeEventGovernanceReport
} = require('../../tools/rmt-language/vnext-event-governance');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const ENTERPRISE_FIXTURE = 'tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json';
const LOCAL_SURFACES_FIXTURE = 'tests/rmt-language/fixtures/vnext-surfaces-valid.rmt';
const REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const CROSS_SURFACE_EVENTS_FIXTURE = 'tests/rmt-language/fixtures/vnext-cross-surface-events-fixture.json';
const EVENT_GOVERNANCE_FIXTURE = 'tests/rmt-language/fixtures/vnext-event-governance-fixture.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(result) {
  return (result.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function createRegistryFromFixtures(rootDir) {
  const fixture = readJson(ENTERPRISE_FIXTURE, rootDir);
  const localCompile = compileFixture(LOCAL_SURFACES_FIXTURE, rootDir);
  const remoteManifest = readJson(REMOTE_MANIFEST_FIXTURE, rootDir);
  return createEnterpriseSurfaceRegistry({
    ...fixture,
    coreDocument: localCompile.coreDocument,
    remoteManifests: [remoteManifest]
  });
}

function createCrossSurfaceReportFromFixtures(rootDir, enterpriseRegistry, overrides = {}) {
  const fixture = {
    ...readJson(CROSS_SURFACE_EVENTS_FIXTURE, rootDir),
    ...overrides
  };
  return createRmtVNextCrossSurfaceEventProtocol({
    enterpriseRegistry,
    ...fixture
  });
}

function createGovernanceReportFromFixtures(rootDir, overrides = {}) {
  const enterpriseRegistry = overrides.enterpriseRegistry || createRegistryFromFixtures(rootDir);
  const crossSurfaceEventReport = overrides.crossSurfaceEventReport || createCrossSurfaceReportFromFixtures(rootDir, enterpriseRegistry, overrides.crossSurfaceEvents);
  const fixture = {
    ...readJson(EVENT_GOVERNANCE_FIXTURE, rootDir),
    ...overrides.governance
  };
  return createRmtVNextEventGovernanceReport({
    enterpriseRegistry,
    crossSurfaceEventReport,
    ...fixture
  });
}

function findGovernanceEvent(report, eventName) {
  return report.events.find((event) => event.event === eventName);
}

function runRmtVNextEventGovernanceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-event-governance',
    label: 'Epic 16 RMT vNext Event Governance'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextEventGovernance;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_EVENT_GOVERNANCE_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_EVENT_GOVERNANCE_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_EVENT_GOVERNANCE_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_EVENT_GOVERNANCE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_EVENT_GOVERNANCE_MODULE_PATH, rootDir, 'event governance module exists');
  assertFileExists(context, RMT_VNEXT_EVENT_GOVERNANCE_SUITE_PATH, rootDir, 'event governance suite exists');
  assertFileExists(context, RMT_VNEXT_EVENT_GOVERNANCE_CONTRACT_PATH, rootDir, 'event governance contract exists');
  assertFileExists(context, RMT_VNEXT_EVENT_GOVERNANCE_WP_PATH, rootDir, 'WP-E16-07 workpackage document exists');
  assertFileExists(context, EVENT_GOVERNANCE_FIXTURE, rootDir, 'event governance fixture exists');
  context.assert(moduleSyntax.ok, `event governance module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `event governance suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA, 'package metadata declares event governance policy schema');
  context.assert(metadata && metadata.governanceEventSchema === RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA, 'package metadata declares event governance event schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'package metadata declares event governance report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.crossSurfaceEventProtocolSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA, 'package metadata declares cross surface event protocol schema');
  context.assert(metadata && metadata.crossSurfaceEventReportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'package metadata declares cross surface event report schema');
  context.assert(metadata && metadata.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'package metadata declares enterprise surface schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE, 'package metadata points to WP-E16-07');
  context.assert(metadata && metadata.module === RMT_VNEXT_EVENT_GOVERNANCE_MODULE_PATH, 'package metadata points to event governance module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_EVENT_GOVERNANCE_SUITE_PATH, 'package metadata points to event governance suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_EVENT_GOVERNANCE_CONTRACT_PATH, 'package metadata points to event governance contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-event-governance --json', 'package metadata declares event governance local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_EVENT_GOVERNANCE_PACKAGE_SCRIPT, 'package metadata declares event governance package script');
  context.assert(packageManifest.exports['./rmt-language/vnext-event-governance'] === './tools/rmt-language/vnext-event-governance.js', 'package exports vNext event governance contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-event-governance'] === 'node scripts/run_xtend_tests.js rmt-vnext-event-governance', 'package exposes vNext event governance script');
  context.assert(runner.includes("id: 'rmt-vnext-event-governance'"), 'test runner exposes rmt-vnext-event-governance suite');
  context.assert(runner.includes('node scripts/run_xtend_tests.js rmt-vnext-event-governance'), 'runner help references event governance gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-07` | P1 | completed | WS3 |'), 'Epic marks WP-E16-07 completed');
  context.assert(epic.includes('| `WP-E16-08` | P1 | completed | WS4 |'), 'Epic marks WP-E16-08 completed');
  context.assert(epic.includes('| `WP-E16-09` | P1 | completed | WS4 |'), 'Epic marks WP-E16-09 completed');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-event-governance-policy.v1"'), 'contract document declares event governance schema');
  context.assert(workpackage.includes('WP-E16-07` ist abgeschlossen'), 'workpackage records handoff completion');

  assertIncludesAll(context, EVENT_GOVERNANCE_DELIVERY_MODES, ['sync', 'queued', 'replayable', 'drop-if-stale'], 'event governance delivery modes');
  assertIncludesAll(context, EVENT_GOVERNANCE_SENSITIVITY_LEVELS, ['public', 'internal', 'confidential', 'restricted'], 'event governance sensitivity levels');

  const registry = createRegistryFromFixtures(rootDir);
  const crossSurfaceEventReport = createCrossSurfaceReportFromFixtures(rootDir, registry);
  context.assert(registry.ok === true, 'enterprise registry fixture is ready');
  context.assert(crossSurfaceEventReport.ok === true, 'cross surface event fixture is ready');
  const report = createGovernanceReportFromFixtures(rootDir, { enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(report.schema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'event governance emits report schema');
  context.assert(report.policySchema === RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA, 'event governance records policy schema');
  context.assert(report.governanceEventSchema === RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA, 'event governance records event schema');
  context.assert(report.crossSurfaceEventProtocolSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA, 'event governance links cross surface protocol schema');
  context.assert(report.crossSurfaceEventReportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'event governance links cross surface report schema');
  context.assert(report.crossSurfaceEventSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA, 'event governance links cross surface event schema');
  context.assert(report.crossSurfaceEventBindingSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA, 'event governance links cross surface binding schema');
  context.assert(report.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'event governance links enterprise registry schema');
  context.assert(report.ok === true && report.status === 'ready', 'event governance report is ready');
  context.assert(report.eventCount === 2, 'event governance reports two events');
  context.assert(report.governedEventCount === 2, 'event governance accepts two governed events');
  context.assert(report.crossTeamEventCount === 2, 'event governance marks both events as cross-team');
  context.assert(report.governanceMode.missingDeliveryPolicyBlocks === true, 'event governance blocks missing delivery policies');
  context.assert(report.governanceMode.crossTeamReviewRequired === true, 'event governance requires cross-team review');
  context.assert(report.indexes.byDeliveryMode.queued.length === 1, 'event governance indexes queued delivery');
  context.assert(report.indexes.byDeliveryMode.replayable.length === 1, 'event governance indexes replayable delivery');
  context.assert(report.indexes.bySensitivity.internal.length === 1, 'event governance indexes internal sensitivity');
  context.assert(report.indexes.bySensitivity.confidential.length === 1, 'event governance indexes confidential sensitivity');
  context.assert(report.indexes.crossTeamEvents.length === 2, 'event governance indexes cross-team events');

  const checkout = findGovernanceEvent(report, 'checkout.cart.updated.v1');
  const session = findGovernanceEvent(report, 'user.session.changed.v1');
  context.assert(checkout && checkout.schema === RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA, 'checkout governance event emits governance event schema');
  context.assert(checkout && checkout.delivery.mode === 'queued', 'checkout governance records queued delivery');
  context.assert(checkout && checkout.delivery.ttlMs === 30000, 'checkout governance records TTL');
  context.assert(checkout && checkout.delivery.correlationId === 'required', 'checkout governance requires correlationId');
  context.assert(checkout && checkout.delivery.idempotencyKey === 'required', 'checkout governance requires idempotencyKey');
  context.assert(checkout && checkout.delivery.sensitivity === 'internal', 'checkout governance records sensitivity');
  context.assert(checkout && checkout.coupling.crossTeam === true, 'checkout governance detects cross-team coupling');
  context.assert(checkout && checkout.coupling.surfaceOwnerIds.includes('shell-platform'), 'checkout governance lists shell owner coupling');
  context.assert(session && session.delivery.mode === 'replayable', 'session governance records replayable delivery');
  context.assert(session && session.delivery.replayable === true, 'session governance records replayable fact');

  const serialized = serializeEventGovernanceReport(report);
  const repeat = serializeEventGovernanceReport(createGovernanceReportFromFixtures(rootDir, { enterpriseRegistry: registry, crossSurfaceEventReport }));
  context.assert(serialized === repeat, 'event governance report serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'serialized event governance report is parseable JSON');

  const fixture = readJson(EVENT_GOVERNANCE_FIXTURE, rootDir);
  const missingPolicy = cloneJson(fixture);
  delete missingPolicy.policies['checkout.cart.updated.v1'];
  const missingPolicyReport = createGovernanceReportFromFixtures(rootDir, { governance: missingPolicy, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(missingPolicyReport.ok === false, 'missing delivery policy blocks event governance');
  context.assert(diagnosticCodes(missingPolicyReport).includes(EVENT_GOVERNANCE_DELIVERY_POLICY_MISSING_CODE), 'missing delivery policy diagnostic is emitted');

  const invalidMode = cloneJson(fixture);
  invalidMode.policies['checkout.cart.updated.v1'].delivery.mode = 'broadcast';
  const invalidModeReport = createGovernanceReportFromFixtures(rootDir, { governance: invalidMode, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(invalidModeReport.ok === false, 'invalid delivery mode blocks event governance');
  context.assert(diagnosticCodes(invalidModeReport).includes(EVENT_GOVERNANCE_DELIVERY_MODE_INVALID_CODE), 'invalid delivery mode diagnostic is emitted');

  const missingTtl = cloneJson(fixture);
  delete missingTtl.policies['checkout.cart.updated.v1'].delivery.ttlMs;
  const missingTtlReport = createGovernanceReportFromFixtures(rootDir, { governance: missingTtl, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(missingTtlReport.ok === false, 'missing TTL blocks event governance');
  context.assert(diagnosticCodes(missingTtlReport).includes(EVENT_GOVERNANCE_TTL_MISSING_CODE), 'missing TTL diagnostic is emitted');

  const missingCorrelation = cloneJson(fixture);
  delete missingCorrelation.policies['checkout.cart.updated.v1'].delivery.correlationId;
  const missingCorrelationReport = createGovernanceReportFromFixtures(rootDir, { governance: missingCorrelation, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(missingCorrelationReport.ok === false, 'missing correlationId blocks event governance');
  context.assert(diagnosticCodes(missingCorrelationReport).includes(EVENT_GOVERNANCE_CORRELATION_ID_MISSING_CODE), 'missing correlationId diagnostic is emitted');

  const missingIdempotency = cloneJson(fixture);
  delete missingIdempotency.policies['checkout.cart.updated.v1'].delivery.idempotencyKey;
  const missingIdempotencyReport = createGovernanceReportFromFixtures(rootDir, { governance: missingIdempotency, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(missingIdempotencyReport.ok === false, 'missing idempotencyKey blocks event governance');
  context.assert(diagnosticCodes(missingIdempotencyReport).includes(EVENT_GOVERNANCE_IDEMPOTENCY_KEY_MISSING_CODE), 'missing idempotencyKey diagnostic is emitted');

  const missingSensitivity = cloneJson(fixture);
  delete missingSensitivity.policies['checkout.cart.updated.v1'].delivery.sensitivity;
  const missingSensitivityReport = createGovernanceReportFromFixtures(rootDir, { governance: missingSensitivity, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(missingSensitivityReport.ok === false, 'missing sensitivity blocks event governance');
  context.assert(diagnosticCodes(missingSensitivityReport).includes(EVENT_GOVERNANCE_SENSITIVITY_MISSING_CODE), 'missing sensitivity diagnostic is emitted');

  const unknownOwner = cloneJson(fixture);
  delete unknownOwner.ownerCatalog['checkout-platform'];
  const unknownOwnerReport = createGovernanceReportFromFixtures(rootDir, { governance: unknownOwner, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(unknownOwnerReport.ok === false, 'unknown owner blocks event governance');
  context.assert(diagnosticCodes(unknownOwnerReport).includes(EVENT_GOVERNANCE_OWNER_UNKNOWN_CODE), 'unknown owner diagnostic is emitted');

  const versionOwnerMismatch = cloneJson(fixture);
  versionOwnerMismatch.policies['checkout.cart.updated.v1'].versionOwner = 'shell-platform';
  const versionOwnerMismatchReport = createGovernanceReportFromFixtures(rootDir, { governance: versionOwnerMismatch, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(versionOwnerMismatchReport.ok === false, 'version owner mismatch blocks event governance');
  context.assert(diagnosticCodes(versionOwnerMismatchReport).includes(EVENT_GOVERNANCE_VERSION_OWNER_MISMATCH_CODE), 'version owner mismatch diagnostic is emitted');

  const payloadOwnerMismatch = cloneJson(fixture);
  payloadOwnerMismatch.policies['checkout.cart.updated.v1'].payloadOwner = 'shell-platform';
  const payloadOwnerMismatchReport = createGovernanceReportFromFixtures(rootDir, { governance: payloadOwnerMismatch, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(payloadOwnerMismatchReport.ok === false, 'payload owner mismatch blocks event governance');
  context.assert(diagnosticCodes(payloadOwnerMismatchReport).includes(EVENT_GOVERNANCE_PAYLOAD_OWNER_MISMATCH_CODE), 'payload owner mismatch diagnostic is emitted');

  const implicitCoupling = cloneJson(fixture);
  delete implicitCoupling.policies['checkout.cart.updated.v1'].delivery.crossTeamReview;
  const implicitCouplingReport = createGovernanceReportFromFixtures(rootDir, { governance: implicitCoupling, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(implicitCouplingReport.ok === false, 'implicit cross-team coupling blocks event governance');
  context.assert(diagnosticCodes(implicitCouplingReport).includes(EVENT_GOVERNANCE_IMPLICIT_COUPLING_CODE), 'implicit coupling diagnostic is emitted');

  const reviewMissing = cloneJson(fixture);
  reviewMissing.policies['checkout.cart.updated.v1'].delivery.crossTeamReview = 'pending';
  const reviewMissingReport = createGovernanceReportFromFixtures(rootDir, { governance: reviewMissing, enterpriseRegistry: registry, crossSurfaceEventReport });
  context.assert(reviewMissingReport.ok === false, 'unapproved cross-team review blocks event governance');
  context.assert(diagnosticCodes(reviewMissingReport).includes(EVENT_GOVERNANCE_CROSS_TEAM_REVIEW_MISSING_CODE), 'cross-team review diagnostic is emitted');

  const blockedProtocol = cloneJson(crossSurfaceEventReport);
  blockedProtocol.status = 'blocked';
  blockedProtocol.ok = false;
  const blockedProtocolReport = createGovernanceReportFromFixtures(rootDir, { governance: fixture, enterpriseRegistry: registry, crossSurfaceEventReport: blockedProtocol });
  context.assert(blockedProtocolReport.ok === false, 'blocked cross surface protocol blocks event governance');
  context.assert(diagnosticCodes(blockedProtocolReport).includes(EVENT_GOVERNANCE_PROTOCOL_BLOCKED_CODE), 'blocked protocol diagnostic is emitted');

  const adapter = createRmtVNextEventGovernanceAdapter();
  context.assert(adapter.schema === RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA, 'adapter exposes event governance policy schema');
  context.assert(adapter.reportSchema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'adapter exposes event governance report schema');
  context.assert(adapter.governanceEventSchema === RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA, 'adapter exposes event governance event schema');
  context.assert(adapter.crossSurfaceEventReportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'adapter exposes cross surface event report schema');
  context.assert(adapter.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'adapter exposes enterprise registry schema');
  context.assert(adapter.createReport({
    enterpriseRegistry: registry,
    crossSurfaceEventReport,
    ...fixture
  }).ok === true, 'adapter creates event governance report');

  return context.result({
    schema: RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA,
    policySchema: RMT_VNEXT_EVENT_GOVERNANCE_POLICY_SCHEMA,
    governanceEventSchema: RMT_VNEXT_EVENT_GOVERNANCE_EVENT_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_EVENT_GOVERNANCE_WORKPACKAGE,
    module: RMT_VNEXT_EVENT_GOVERNANCE_MODULE_PATH,
    suite: RMT_VNEXT_EVENT_GOVERNANCE_SUITE_PATH,
    eventCount: report.eventCount,
    crossTeamEventCount: report.crossTeamEventCount
  });
}

function printRmtVNextEventGovernanceReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Event Governance erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Event Governance fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextEventGovernanceReport,
  runRmtVNextEventGovernanceSuite
};
