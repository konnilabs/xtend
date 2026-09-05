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
  REMOTE_FALLBACK_MISSING_CODE,
  REMOTE_INTEGRITY_MISSING_CODE,
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA
} = require('../../tools/rmt-language/vnext-remote-manifest');
const {
  RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA,
  RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-cross-surface-events');
const {
  RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-event-governance');
const {
  RMT_VNEXT_DEGRADATION_REPORT_SCHEMA
} = require('../../tools/rmt-language/vnext-degradation');
const {
  RMT_VNEXT_COMPILER_SCHEMA,
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  RMT_VNEXT_REMOTE_COMPILER_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH,
  RMT_VNEXT_REMOTE_COMPILER_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
  RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH,
  RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE,
  RMT_VNEXT_REMOTE_COMPILER_WP_PATH,
  compileRmtVNextRemoteSource,
  createRmtVNextRemoteCompiler,
  serializeRemoteCompilerCore
} = require('../../tools/rmt-language/vnext-remote-compiler');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const VALID_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-compiler-valid.rmt';
const INVALID_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-compiler-invalid.rmt';
const GOLDEN_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-compiler-valid.core.json';
const E15_COMPILER_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-complex.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function compileFixture(relativePath, rootDir) {
  return compileRmtVNextRemoteSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function diagnosticCodes(result) {
  return (result.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function assertIncludesAll(context, actual, expected, message) {
  const list = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((item) => !list.includes(item));
  context.assert(missing.length === 0, `${message}${missing.length > 0 ? ` missing ${missing.join(', ')}` : ''}`);
}

function createGoldenProjection(result) {
  const remoteSurface = result.coreDocument.remoteSurfaces[0];
  const manifest = result.remoteManifests[0];
  const manifestSurface = manifest.remoteSurfaces[0];
  const remoteEnterpriseSurface = result.enterpriseRegistry.surfaces.find((surface) => surface.kind === 'remote');
  const degradationSurfaces = result.degradationReport.surfaces.map((surface) => ({
    name: surface.name,
    kind: surface.kind,
    state: surface.state,
    fallbackResolved: surface.fallbackResolution.resolved,
    versionStatus: surface.version.status
  }));

  return stableSort({
    schema: result.schema,
    reportSchema: result.reportSchema,
    status: result.status,
    document: {
      schema: result.coreDocument.schema,
      compilerSchema: RMT_VNEXT_COMPILER_SCHEMA,
      remoteSurfaceCount: result.coreDocument.remoteSurfaces.length,
      remoteSurface: {
        name: remoteSurface.name,
        remote: remoteSurface.remote,
        owner: remoteSurface.owner,
        security: remoteSurface.security,
        exposes: remoteSurface.exposes,
        events: remoteSurface.events,
        capabilities: remoteSurface.capabilities,
        adapterBoundary: remoteSurface.adapterBoundary,
        fallback: remoteSurface.fallback,
        runtime: remoteSurface.runtime
      },
      sourceMapNodeTypes: result.coreDocument.sourceMap
        .filter((entry) => entry.corePointer.startsWith('/remoteSurfaces/0'))
        .map((entry) => entry.nodeType)
    },
    remoteManifest: {
      schema: manifest.schema,
      status: manifest.status,
      surfaceCount: manifest.surfaceCount,
      remoteSurface: {
        schema: manifestSurface.schema,
        name: manifestSurface.name,
        owner: manifestSurface.owner,
        remote: manifestSurface.remote,
        security: manifestSurface.security,
        shellBindings: manifestSurface.shellBindings,
        capabilities: manifestSurface.capabilities,
        adapterBoundary: manifestSurface.adapterBoundary,
        fallback: manifestSurface.fallback,
        status: manifestSurface.status
      }
    },
    enterpriseRegistry: {
      schema: result.enterpriseRegistry.schema,
      status: result.enterpriseRegistry.status,
      surfaceCount: result.enterpriseRegistry.surfaceCount,
      localSurfaceCount: result.enterpriseRegistry.localSurfaceCount,
      remoteSurfaceCount: result.enterpriseRegistry.remoteSurfaceCount,
      remoteSurface: {
        name: remoteEnterpriseSurface.name,
        kind: remoteEnterpriseSurface.kind,
        owner: remoteEnterpriseSurface.owner,
        version: remoteEnterpriseSurface.version,
        shellTargets: remoteEnterpriseSurface.shellTargets,
        events: remoteEnterpriseSurface.events,
        status: remoteEnterpriseSurface.status
      }
    },
    crossSurfaceEvents: {
      schema: result.crossSurfaceEventReport.schema,
      status: result.crossSurfaceEventReport.status,
      eventCount: result.crossSurfaceEventReport.eventCount,
      bindingCount: result.crossSurfaceEventReport.bindingCount,
      crossSurfaceEventCount: result.crossSurfaceEventReport.crossSurfaceEventCount,
      events: result.crossSurfaceEventReport.events.map((event) => ({
        event: event.event,
        status: event.status,
        owner: event.owner,
        version: event.version,
        outboundCount: event.outboundCount,
        inboundCount: event.inboundCount,
        scopes: event.scopes,
        surfaces: event.surfaces
      }))
    },
    eventGovernance: {
      schema: result.eventGovernanceReport.schema,
      status: result.eventGovernanceReport.status,
      eventCount: result.eventGovernanceReport.eventCount,
      governedEventCount: result.eventGovernanceReport.governedEventCount,
      crossTeamEventCount: result.eventGovernanceReport.crossTeamEventCount,
      deliveryModes: result.eventGovernanceReport.indexes.byDeliveryMode,
      sensitivities: result.eventGovernanceReport.indexes.bySensitivity
    },
    degradation: {
      schema: result.degradationReport.schema,
      status: result.degradationReport.status,
      stateCounts: result.degradationReport.stateCounts,
      surfaceCount: result.degradationReport.surfaceCount,
      surfaces: degradationSurfaces
    }
  });
}

function runRmtVNextRemoteCompilerSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-remote-compiler',
    label: 'Epic 16 RMT vNext Remote Compiler'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextRemoteCompiler;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_REMOTE_COMPILER_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_REMOTE_COMPILER_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH, rootDir, 'remote compiler module exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH, rootDir, 'remote compiler suite exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_COMPILER_CONTRACT_PATH, rootDir, 'remote compiler contract exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_COMPILER_WP_PATH, rootDir, 'WP-E16-08 workpackage document exists');
  assertFileExists(context, VALID_FIXTURE, rootDir, 'remote compiler valid fixture exists');
  assertFileExists(context, INVALID_FIXTURE, rootDir, 'remote compiler invalid fixture exists');
  assertFileExists(context, GOLDEN_FIXTURE, rootDir, 'remote compiler golden projection exists');
  context.assert(moduleSyntax.ok, `remote compiler module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `remote compiler suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_REMOTE_COMPILER_SCHEMA, 'package metadata declares remote compiler schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA, 'package metadata declares remote compiler report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.remoteManifestSchema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'package metadata declares remote manifest schema');
  context.assert(metadata && metadata.remoteSurfaceSchema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'package metadata declares remote surface schema');
  context.assert(metadata && metadata.enterpriseRegistrySchema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'package metadata declares enterprise registry schema');
  context.assert(metadata && metadata.enterpriseSurfaceSchema === RMT_VNEXT_ENTERPRISE_SURFACE_SCHEMA, 'package metadata declares enterprise surface schema');
  context.assert(metadata && metadata.crossSurfaceEventReportSchema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'package metadata declares cross surface event report schema');
  context.assert(metadata && metadata.eventGovernanceReportSchema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'package metadata declares event governance report schema');
  context.assert(metadata && metadata.degradationReportSchema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'package metadata declares degradation report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE, 'package metadata points to WP-E16-08');
  context.assert(metadata && metadata.module === RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH, 'package metadata points to remote compiler module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH, 'package metadata points to remote compiler suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_REMOTE_COMPILER_CONTRACT_PATH, 'package metadata points to remote compiler contract');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json', 'package metadata declares remote compiler local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_REMOTE_COMPILER_PACKAGE_SCRIPT, 'package metadata declares remote compiler package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-remote-compiler'] === 'string' ? packageManifest.exports['./rmt-language/vnext-remote-compiler'] : packageManifest.exports['./rmt-language/vnext-remote-compiler'] && packageManifest.exports['./rmt-language/vnext-remote-compiler'].default) === './tools/rmt-language/vnext-remote-compiler.js', 'package exports vNext remote compiler');
  context.assert(packageManifest.scripts['test:rmt-vnext-remote-compiler'] === 'node scripts/run_xtend_tests.js rmt-vnext-remote-compiler', 'package exposes vNext remote compiler script');
  context.assert(runner.hasSuite("rmt-vnext-remote-compiler"), 'test runner exposes rmt-vnext-remote-compiler suite');
  context.assert(runner.hasSuite("rmt-vnext-remote-compiler"), 'runner help references remote compiler gate');
  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-08` | P1 | completed | WS4 |'), 'Epic marks WP-E16-08 completed');
  context.assert(epic.includes('| `WP-E16-09` | P1 | completed | WS4 |'), 'Epic marks WP-E16-09 completed');
  context.assert(epic.includes('| `WP-E16-10` | P2 | completed | WS5 |'), 'Epic marks WP-E16-10 completed');
  context.assert(epic.includes('| `WP-E16-11` | P2 | completed | WS5 |'), 'Epic marks WP-E16-11 completed');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-remote-compiler.v1"'), 'contract declares remote compiler schema');
  context.assert(workpackage.includes('WP-E16-08` ist abgeschlossen'), 'workpackage records handoff completion');

  const valid = compileFixture(VALID_FIXTURE, rootDir);
  context.assert(valid.schema === RMT_VNEXT_REMOTE_COMPILER_SCHEMA, 'valid fixture emits remote compiler schema');
  context.assert(valid.ok === true && valid.status === 'compiled', 'valid fixture compiles successfully');
  context.assert(valid.coreDocument.schema === RMT_VNEXT_CORE_SCHEMA, 'valid fixture keeps vNext core schema');
  context.assert(valid.coreDocument.remoteSurfaces.length === 1, 'valid fixture compiles one remote surface');
  context.assert(valid.remoteManifests.length === 1, 'valid fixture emits one remote manifest');
  context.assert(valid.remoteManifests[0].schema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'valid fixture links remote manifest schema');
  context.assert(valid.remoteManifests[0].status === 'ready', 'valid remote manifest is ready');
  context.assert(valid.enterpriseRegistry.schema === RMT_VNEXT_ENTERPRISE_REGISTRY_SCHEMA, 'valid fixture emits enterprise registry');
  context.assert(valid.enterpriseRegistry.status === 'ready', 'valid enterprise registry is ready');
  context.assert(valid.enterpriseRegistry.remoteSurfaceCount === 1, 'enterprise registry includes one remote surface');
  context.assert(valid.crossSurfaceEventReport.schema === RMT_VNEXT_CROSS_SURFACE_EVENT_REPORT_SCHEMA, 'valid fixture emits cross surface event report');
  context.assert(valid.crossSurfaceEventReport.status === 'ready', 'cross surface event report is ready');
  context.assert(valid.crossSurfaceEventReport.eventCount === 2, 'cross surface event report has two events');
  context.assert(valid.crossSurfaceEventReport.bindingCount === 4, 'cross surface event report has four bindings');
  context.assert(valid.eventGovernanceReport.schema === RMT_VNEXT_EVENT_GOVERNANCE_REPORT_SCHEMA, 'valid fixture emits event governance report');
  context.assert(valid.eventGovernanceReport.status === 'ready', 'event governance report is ready');
  context.assert(valid.degradationReport.schema === RMT_VNEXT_DEGRADATION_REPORT_SCHEMA, 'valid fixture emits degradation report');
  context.assert(valid.degradationReport.status === 'full', 'degradation report is full for valid fixture');

  const remoteSurface = valid.coreDocument.remoteSurfaces[0];
  context.assert(remoteSurface.remote.id === '@xtend/checkout-cart', 'remote surface preserves remote id');
  context.assert(remoteSurface.remote.origin === 'https://cdn.xtend.example', 'remote surface preserves origin');
  context.assert(remoteSurface.remote.integrity.algorithm === 'sha256', 'remote surface preserves integrity algorithm');
  context.assert(remoteSurface.owner.id === 'checkout-platform', 'remote surface preserves owner');
  context.assert(remoteSurface.security.trustBoundary === 'xtend.security.remote-surface.v1', 'remote surface preserves trust boundary');
  context.assert(remoteSurface.fallback.ref === 'checkout.cart.fallback', 'remote surface preserves fallback');
  context.assert(remoteSurface.exposes.length === 2, 'remote surface preserves exposed lanes');
  context.assert(remoteSurface.events.emits.length === 1, 'remote surface preserves emitted event');
  context.assert(remoteSurface.events.consumes.length === 1, 'remote surface preserves consumed event');
  assertIncludesAll(context, remoteSurface.capabilities.map((capability) => capability.id), ['surface.mount', 'event.emit', 'event.consume'], 'remote surface infers capabilities');
  context.assert(remoteSurface.runtime.kernelRemoteExecution === false, 'remote compiler keeps kernel remote execution disabled');
  context.assert(
    valid.coreDocument.sourceMap.some((entry) => entry.nodeType === 'RmtRemoteSurfaceDeclaration' && entry.corePointer === '/remoteSurfaces/0'),
    'remote surface declaration has source map'
  );
  context.assert(
    valid.coreDocument.sourceMap.some((entry) => entry.nodeType === 'RmtRemoteEventClause'),
    'remote event clauses have source maps'
  );

  const repeat = compileFixture(VALID_FIXTURE, rootDir);
  context.assert(valid.coreJson === repeat.coreJson, 'valid fixture compiles to byte-stable remote core JSON');
  context.assert(serializeRemoteCompilerCore(valid.coreBundle) === valid.coreJson, 'remote compiler serializer matches output');

  const golden = stableSort(readJson(GOLDEN_FIXTURE, rootDir));
  const projection = createGoldenProjection(valid);
  context.assert(JSON.stringify(projection, null, 2) === JSON.stringify(golden, null, 2), 'valid fixture matches golden core projection');

  const adapter = createRmtVNextRemoteCompiler();
  const adapterResult = adapter.compileSource({
    text: readText(VALID_FIXTURE, rootDir),
    filePath: resolveRepoPath(VALID_FIXTURE, rootDir)
  });
  context.assert(adapterResult.ok === true, 'remote compiler adapter compiles fixture successfully');

  const invalid = compileFixture(INVALID_FIXTURE, rootDir);
  context.assert(invalid.ok === false && invalid.status === 'blocked', 'invalid fixture blocks remote compilation');
  assertIncludesAll(context, diagnosticCodes(invalid), [REMOTE_INTEGRITY_MISSING_CODE, REMOTE_FALLBACK_MISSING_CODE], 'invalid fixture reports remote semantic diagnostics');

  const e15Result = compileRmtVNextSource({
    text: readText(E15_COMPILER_FIXTURE, rootDir),
    filePath: resolveRepoPath(E15_COMPILER_FIXTURE, rootDir)
  });
  context.assert(e15Result.ok === true, 'existing E15 compiler fixture remains green');
  context.assert(Array.isArray(e15Result.coreDocument.remoteSurfaces) && e15Result.coreDocument.remoteSurfaces.length === 0, 'existing E15 fixture gets empty remoteSurfaces extension');

  return context.result({
    schema: RMT_VNEXT_REMOTE_COMPILER_REPORT_SCHEMA,
    remoteCompilerSchema: RMT_VNEXT_REMOTE_COMPILER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_COMPILER_WORKPACKAGE,
    compilerModule: RMT_VNEXT_REMOTE_COMPILER_MODULE_PATH,
    suite: RMT_VNEXT_REMOTE_COMPILER_SUITE_PATH,
    goldenFixtureCount: 1
  });
}

function printRmtVNextRemoteCompilerReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Remote Compiler erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Remote Compiler fehlgeschlagen:'
  });
}

module.exports = {
  createGoldenProjection,
  printRmtVNextRemoteCompilerReport,
  runRmtVNextRemoteCompilerSuite
};
