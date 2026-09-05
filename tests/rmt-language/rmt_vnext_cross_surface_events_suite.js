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
  RMT_VNEXT_EVENT_ACTION_SCHEMA
} = require('../../tools/rmt-language/vnext-events');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA,
  createEnterpriseSurfaceRegistry
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  CROSS_SURFACE_EVENT_DIRECTIONS,
  CROSS_SURFACE_EVENT_DIRECTION_INVALID_CODE,
  CROSS_SURFACE_EVENT_DUPLICATE_BINDING_CODE,
  CROSS_SURFACE_EVENT_OWNER_CONFLICT_CODE,
  CROSS_SURFACE_EVENT_OWNER_MISSING_CODE,
  CROSS_SURFACE_EVENT_PAIRING_MISSING_CODE,
  CROSS_SURFACE_EVENT_PAYLOAD_CONFLICT_CODE,
  CROSS_SURFACE_EVENT_PAYLOAD_MISSING_CODE,
  CROSS_SURFACE_EVENT_SCOPE_GLOBAL_FORBIDDEN_CODE,
  CROSS_SURFACE_EVENT_SCOPE_MISSING_CODE,
  CROSS_SURFACE_EVENT_SCOPE_TYPES,
  CROSS_SURFACE_EVENT_SCOPE_UNKNOWN_CODE,
  CROSS_SURFACE_EVENT_SURFACE_UNKNOWN_CODE,
  CROSS_SURFACE_EVENT_VERSION_MISSING_CODE,
  RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_CONTRACT_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENT_MODULE_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENT_PACKAGE_SCRIPT,
  RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
  RMT_VNEXT_CROSS_SURFACE_EVENT_SUITE_PATH,
  RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE,
  RMT_VNEXT_CROSS_SURFACE_EVENT_WP_PATH,
  createRmtVNextCrossSurfaceEventProtocol,
  createRmtVNextCrossSurfaceEventProtocolAdapter,
  serializeCrossSurfaceEventProtocol
} = require('../../tools/rmt-language/vnext-cross-surface-events');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const ENTERPRISE_FIXTURE = 'tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json';
const LOCAL_SURFACES_FIXTURE = 'tests/rmt-language/fixtures/vnext-surfaces-valid.rmt';
const REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const CROSS_SURFACE_EVENTS_FIXTURE = 'tests/rmt-language/fixtures/vnext-cross-surface-events-fixture.json';

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

function createProtocolFromFixtures(rootDir, overrides = {}) {
  const enterpriseRegistry = overrides.enterpriseRegistry || createRegistryFromFixtures(rootDir);
  const fixture = {
    ...readJson(CROSS_SURFACE_EVENTS_FIXTURE, rootDir),
    ...overrides.protocol
  };
  return createRmtVNextCrossSurfaceEventProtocol({
    enterpriseRegistry,
    ...fixture
  });
}

function findEvent(report, eventName) {
  return report.events.find((event) => event.event === eventName);
}

function runRmtVNextCrossSurfaceEventsSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-cross-surface-events',
    label: 'Epic 16 RMT vNext Cross Surface Event Protocol'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextCrossSurfaceEvents;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_CROSS_SURFACE_EVENT_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_CROSS_SURFACE_EVENT_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_CROSS_SURFACE_EVENT_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_CROSS_SURFACE_EVENT_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_CROSS_SURFACE_EVENT_MODULE_PATH, rootDir, 'cross surface event module exists');
  assertFileExists(context, RMT_VNEXT_CROSS_SURFACE_EVENT_SUITE_PATH, rootDir, 'cross surface event suite exists');
  assertFileExists(context, RMT_VNEXT_CROSS_SURFACE_EVENT_CONTRACT_PATH, rootDir, 'cross surface event contract exists');
  assertFileExists(context, RMT_VNEXT_CROSS_SURFACE_EVENT_WP_PATH, rootDir, 'WP-E16-06 workpackage document exists');
  assertFileExists(context, CROSS_SURFACE_EVENTS_FIXTURE, rootDir, 'cross surface event fixture exists');
  context.assert(moduleSyntax.ok, `cross surface event module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `cross surface event suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA, 'package metadata declares cross surface event protocol schema');
  context.assert(metadata && metadata.eventSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA, 'package metadata declares cross surface event record schema');
  context.assert(metadata && metadata.bindingSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA, 'package metadata declares cross surface event binding schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'package metadata declares cross surface event report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.eventActionSchema === RMT_VNEXT_EVENT_ACTION_SCHEMA, 'package metadata declares E15 event action schema');
  context.assert(metadata && metadata.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'package metadata declares enterprise surface schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE, 'package metadata points to WP-E16-06');
  context.assert(metadata && metadata.module === RMT_VNEXT_CROSS_SURFACE_EVENT_MODULE_PATH, 'package metadata points to cross surface event module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_CROSS_SURFACE_EVENT_SUITE_PATH, 'package metadata points to cross surface event suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_CROSS_SURFACE_EVENT_CONTRACT_PATH, 'package metadata points to cross surface event contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json', 'package metadata declares cross surface event local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_CROSS_SURFACE_EVENT_PACKAGE_SCRIPT, 'package metadata declares cross surface event package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-cross-surface-events'] === 'string' ? packageManifest.exports['./rmt-language/vnext-cross-surface-events'] : packageManifest.exports['./rmt-language/vnext-cross-surface-events'] && packageManifest.exports['./rmt-language/vnext-cross-surface-events'].default) === './tools/rmt-language/vnext-cross-surface-events.js', 'package exports vNext cross surface events contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-cross-surface-events'] === 'node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events', 'package exposes vNext cross surface events script');
  context.assert(runner.hasSuite("rmt-vnext-cross-surface-events"), 'test runner exposes rmt-vnext-cross-surface-events suite');
  context.assert(runner.hasSuite("rmt-vnext-cross-surface-events"), 'runner help references cross surface events gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-06` | P1 | completed | WS3 |'), 'Epic marks WP-E16-06 completed');
  context.assert(epic.includes('| `WP-E16-07` | P1 | completed | WS3 |'), 'Epic marks WP-E16-07 completed');
  context.assert(epic.includes('| `WP-E16-08` | P1 | completed | WS4 |'), 'Epic marks WP-E16-08 completed');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-cross-surface-event-protocol.v1"'), 'contract document declares cross surface event protocol schema');
  context.assert(workpackage.includes('WP-E16-06` ist abgeschlossen'), 'workpackage records handoff completion');

  assertIncludesAll(context, CROSS_SURFACE_EVENT_DIRECTIONS, ['outbound', 'inbound'], 'cross surface event directions');
  assertIncludesAll(context, CROSS_SURFACE_EVENT_SCOPE_TYPES, ['surface', 'lane', 'shell.slot', 'shell.route', 'shell.session'], 'cross surface event scope types');

  const registry = createRegistryFromFixtures(rootDir);
  context.assert(registry.ok === true, 'enterprise registry fixture is ready');
  const report = createProtocolFromFixtures(rootDir, { enterpriseRegistry: registry });
  context.assert(report.schema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'cross surface events emit report schema');
  context.assert(report.protocolSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA, 'cross surface events record protocol schema');
  context.assert(report.eventSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA, 'cross surface events record event schema');
  context.assert(report.bindingSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA, 'cross surface events record binding schema');
  context.assert(report.eventActionSchema === RMT_VNEXT_EVENT_ACTION_SCHEMA, 'cross surface events link E15 event action schema');
  context.assert(report.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'cross surface events link enterprise registry schema');
  context.assert(report.ok === true && report.status === 'ready', 'cross surface event protocol is ready');
  context.assert(report.eventCount === 2, 'cross surface event protocol contains two events');
  context.assert(report.bindingCount === 5, 'cross surface event protocol contains five bindings');
  context.assert(report.crossSurfaceEventCount === 2, 'both events cross surface boundaries');
  context.assert(report.eventBus.implicitGlobalBusAllowed === false, 'protocol forbids implicit global bus');
  context.assert(report.kernelBoundary.remoteRuntimeExecution === false, 'protocol does not execute remote runtime in kernel');
  context.assert(report.indexes.byDirection.outbound.length === 2, 'protocol indexes outbound bindings');
  context.assert(report.indexes.byDirection.inbound.length === 3, 'protocol indexes inbound bindings');
  context.assert(report.indexes.byOwner['checkout-platform'].length === 1, 'protocol indexes checkout owner');
  context.assert(report.indexes.byScope['shell.slot:sidebar.cart'].length === 2, 'protocol indexes shell slot scope');
  context.assert(report.indexes.byScope['lane:critical'].length === 3, 'protocol indexes lane scope');
  context.assert(report.indexes.byScope['shell.session:current'].length === 1, 'protocol indexes shell session scope');

  const checkout = findEvent(report, 'checkout.cart.updated.v1');
  const session = findEvent(report, 'user.session.changed.v1');
  context.assert(checkout && checkout.schema === RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA, 'checkout event emits cross surface event schema');
  context.assert(checkout && checkout.owner.id === 'checkout-platform', 'checkout event records owner');
  context.assert(checkout && checkout.version === '1.0.0', 'checkout event records version');
  context.assert(checkout && checkout.payload.schema === 'xtend.schemas.cartUpdated.v1', 'checkout event records payload schema');
  context.assert(checkout && checkout.outboundCount === 1 && checkout.inboundCount === 2, 'checkout event records direction counts');
  context.assert(checkout && checkout.bindings[0].schema === RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA, 'checkout binding emits binding schema');
  context.assert(checkout && checkout.bindings[0].remote === true, 'checkout outbound binding is remote');
  context.assert(checkout && checkout.bindings[0].scopes.some((scope) => scope.type === 'shell.route'), 'checkout event records shell route scope');
  context.assert(session && session.owner.id === 'identity-platform', 'session event records owner');
  context.assert(session && session.bindings.some((binding) => binding.scopes.some((scope) => scope.type === 'shell.session')), 'session event records shell session scope');

  const serialized = serializeCrossSurfaceEventProtocol(report);
  const repeat = serializeCrossSurfaceEventProtocol(createProtocolFromFixtures(rootDir, { enterpriseRegistry: registry }));
  context.assert(serialized === repeat, 'cross surface event protocol serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'serialized cross surface event protocol is parseable JSON');

  const fixture = readJson(CROSS_SURFACE_EVENTS_FIXTURE, rootDir);
  const missingOwner = cloneJson(fixture);
  delete missingOwner.events[0].owner;
  const missingOwnerReport = createProtocolFromFixtures(rootDir, { protocol: missingOwner, enterpriseRegistry: registry });
  context.assert(missingOwnerReport.ok === false, 'missing owner blocks cross surface event protocol');
  context.assert(diagnosticCodes(missingOwnerReport).includes(CROSS_SURFACE_EVENT_OWNER_MISSING_CODE), 'missing owner diagnostic is emitted');

  const missingVersion = cloneJson(fixture);
  delete missingVersion.events[0].version;
  const missingVersionReport = createProtocolFromFixtures(rootDir, { protocol: missingVersion, enterpriseRegistry: registry });
  context.assert(missingVersionReport.ok === false, 'missing version blocks cross surface event protocol');
  context.assert(diagnosticCodes(missingVersionReport).includes(CROSS_SURFACE_EVENT_VERSION_MISSING_CODE), 'missing version diagnostic is emitted');

  const missingPayload = cloneJson(fixture);
  delete missingPayload.events[0].payload;
  const missingPayloadReport = createProtocolFromFixtures(rootDir, { protocol: missingPayload, enterpriseRegistry: registry });
  context.assert(missingPayloadReport.ok === false, 'missing payload blocks cross surface event protocol');
  context.assert(diagnosticCodes(missingPayloadReport).includes(CROSS_SURFACE_EVENT_PAYLOAD_MISSING_CODE), 'missing payload diagnostic is emitted');

  const invalidDirection = cloneJson(fixture);
  invalidDirection.events[0].bindings[0].direction = 'sideways';
  const invalidDirectionReport = createProtocolFromFixtures(rootDir, { protocol: invalidDirection, enterpriseRegistry: registry });
  context.assert(invalidDirectionReport.ok === false, 'invalid direction blocks cross surface event protocol');
  context.assert(diagnosticCodes(invalidDirectionReport).includes(CROSS_SURFACE_EVENT_DIRECTION_INVALID_CODE), 'invalid direction diagnostic is emitted');

  const missingScope = cloneJson(fixture);
  missingScope.events[0].bindings[0].scopes = [];
  const missingScopeReport = createProtocolFromFixtures(rootDir, { protocol: missingScope, enterpriseRegistry: registry });
  context.assert(missingScopeReport.ok === false, 'missing scope blocks cross surface event protocol');
  context.assert(diagnosticCodes(missingScopeReport).includes(CROSS_SURFACE_EVENT_SCOPE_MISSING_CODE), 'missing scope diagnostic is emitted');

  const globalScope = cloneJson(fixture);
  globalScope.events[0].bindings[0].scopes = ['*'];
  const globalScopeReport = createProtocolFromFixtures(rootDir, { protocol: globalScope, enterpriseRegistry: registry });
  context.assert(globalScopeReport.ok === false, 'global scope blocks cross surface event protocol');
  context.assert(diagnosticCodes(globalScopeReport).includes(CROSS_SURFACE_EVENT_SCOPE_GLOBAL_FORBIDDEN_CODE), 'global scope diagnostic is emitted');

  const unknownScope = cloneJson(fixture);
  unknownScope.events[0].bindings[0].scopes[0].ref = 'phantom';
  const unknownScopeReport = createProtocolFromFixtures(rootDir, { protocol: unknownScope, enterpriseRegistry: registry });
  context.assert(unknownScopeReport.ok === false, 'unknown scope blocks cross surface event protocol');
  context.assert(diagnosticCodes(unknownScopeReport).includes(CROSS_SURFACE_EVENT_SCOPE_UNKNOWN_CODE), 'unknown scope diagnostic is emitted');

  const unknownSurface = cloneJson(fixture);
  unknownSurface.events[0].bindings[0].surface = 'ghost.surface';
  const unknownSurfaceReport = createProtocolFromFixtures(rootDir, { protocol: unknownSurface, enterpriseRegistry: registry });
  context.assert(unknownSurfaceReport.ok === false, 'unknown surface blocks cross surface event protocol');
  context.assert(diagnosticCodes(unknownSurfaceReport).includes(CROSS_SURFACE_EVENT_SURFACE_UNKNOWN_CODE), 'unknown surface diagnostic is emitted');

  const ownerConflict = cloneJson(fixture);
  ownerConflict.events[0].bindings[1].owner = 'another-team';
  const ownerConflictReport = createProtocolFromFixtures(rootDir, { protocol: ownerConflict, enterpriseRegistry: registry });
  context.assert(ownerConflictReport.ok === false, 'owner conflict blocks cross surface event protocol');
  context.assert(diagnosticCodes(ownerConflictReport).includes(CROSS_SURFACE_EVENT_OWNER_CONFLICT_CODE), 'owner conflict diagnostic is emitted');

  const payloadConflict = cloneJson(fixture);
  payloadConflict.events[0].bindings[1].payload = 'xtend.schemas.otherCartPayload.v1';
  const payloadConflictReport = createProtocolFromFixtures(rootDir, { protocol: payloadConflict, enterpriseRegistry: registry });
  context.assert(payloadConflictReport.ok === false, 'payload conflict blocks cross surface event protocol');
  context.assert(diagnosticCodes(payloadConflictReport).includes(CROSS_SURFACE_EVENT_PAYLOAD_CONFLICT_CODE), 'payload conflict diagnostic is emitted');

  const pairingMissing = cloneJson(fixture);
  pairingMissing.events[0].bindings = pairingMissing.events[0].bindings.filter((binding) => binding.direction === 'outbound');
  const pairingMissingReport = createProtocolFromFixtures(rootDir, { protocol: pairingMissing, enterpriseRegistry: registry });
  context.assert(pairingMissingReport.ok === false, 'missing pairing blocks cross surface event protocol');
  context.assert(diagnosticCodes(pairingMissingReport).includes(CROSS_SURFACE_EVENT_PAIRING_MISSING_CODE), 'missing pairing diagnostic is emitted');

  const duplicateBinding = cloneJson(fixture);
  duplicateBinding.events[0].bindings.push(cloneJson(duplicateBinding.events[0].bindings[1]));
  const duplicateBindingReport = createProtocolFromFixtures(rootDir, { protocol: duplicateBinding, enterpriseRegistry: registry });
  context.assert(duplicateBindingReport.ok === false, 'duplicate binding blocks cross surface event protocol');
  context.assert(diagnosticCodes(duplicateBindingReport).includes(CROSS_SURFACE_EVENT_DUPLICATE_BINDING_CODE), 'duplicate binding diagnostic is emitted');

  const adapter = createRmtVNextCrossSurfaceEventProtocolAdapter();
  context.assert(adapter.schema === RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA, 'adapter exposes cross surface event protocol schema');
  context.assert(adapter.reportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'adapter exposes cross surface event report schema');
  context.assert(adapter.eventSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA, 'adapter exposes cross surface event record schema');
  context.assert(adapter.bindingSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA, 'adapter exposes cross surface event binding schema');
  context.assert(adapter.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'adapter exposes enterprise registry schema');
  context.assert(adapter.createProtocol({
    enterpriseRegistry: registry,
    ...fixture
  }).ok === true, 'adapter creates cross surface event protocol');

  return context.result({
    schema: RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA,
    protocolSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_PROTOCOL_SCHEMA,
    eventSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_RECORD_SCHEMA,
    bindingSchema: RMT_VNEXT_CROSS_SURFACE_EVENT_BINDING_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_CROSS_SURFACE_EVENT_WORKPACKAGE,
    module: RMT_VNEXT_CROSS_SURFACE_EVENT_MODULE_PATH,
    suite: RMT_VNEXT_CROSS_SURFACE_EVENT_SUITE_PATH,
    eventCount: report.eventCount,
    bindingCount: report.bindingCount
  });
}

function printRmtVNextCrossSurfaceEventsReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Cross Surface Event Protocol erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Cross Surface Event Protocol fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextCrossSurfaceEventsReport,
  runRmtVNextCrossSurfaceEventsSuite
};
