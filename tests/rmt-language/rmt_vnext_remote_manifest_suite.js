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
  RMT_VNEXT_CORE_SCHEMA
} = require('../../tools/rmt-language/vnext-compiler');
const {
  REMOTE_ADAPTER_BOUNDARY_MISSING_CODE,
  REMOTE_CAPABILITY_IMPLICIT_CODE,
  REMOTE_CAPABILITY_MISSING_CODE,
  REMOTE_EXPOSES_MISSING_CODE,
  REMOTE_FALLBACK_MISSING_CODE,
  REMOTE_ID_MISSING_CODE,
  REMOTE_INTEGRITY_MISSING_CODE,
  REMOTE_ORIGIN_INVALID_CODE,
  REMOTE_ORIGIN_MISSING_CODE,
  REMOTE_OWNER_MISSING_CODE,
  REMOTE_REQUIRED_FACTS,
  REMOTE_RUNTIME_EXECUTION_CODE,
  REMOTE_TRUST_BOUNDARY_MISSING_CODE,
  REMOTE_VERSION_MISSING_CODE,
  RMT_VNEXT_REMOTE_MANIFEST_CONTRACT_PATH,
  RMT_VNEXT_REMOTE_MANIFEST_MODULE_PATH,
  RMT_VNEXT_REMOTE_MANIFEST_PACKAGE_SCRIPT,
  RMT_VNEXT_REMOTE_MANIFEST_REPORT_SCHEMA,
  RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
  RMT_VNEXT_REMOTE_MANIFEST_SUITE_PATH,
  RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE,
  RMT_VNEXT_REMOTE_MANIFEST_WP_PATH,
  RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
  createRemoteSurfaceManifest,
  createRemoteSurfaceRecord,
  createRmtVNextRemoteManifestAdapter,
  serializeRemoteSurfaceManifest
} = require('../../tools/rmt-language/vnext-remote-manifest');

const EPIC_16_PATH = 'development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md';
const THREAT_MODEL_PATH = 'development/XTendRMT-vNext-Remote-Surfaces-Threat-Model-Contract.md';
const VALID_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const INVALID_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-invalid.json';

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

function runRmtVNextRemoteManifestSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-remote-manifest',
    label: 'Epic 16 RMT vNext Remote Surface Manifest Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextRemoteManifest;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_16_PATH, rootDir);
  const contract = readText(RMT_VNEXT_REMOTE_MANIFEST_CONTRACT_PATH, rootDir);
  const workpackage = readText(RMT_VNEXT_REMOTE_MANIFEST_WP_PATH, rootDir);
  const threatModel = readText(THREAT_MODEL_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_MANIFEST_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_REMOTE_MANIFEST_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_REMOTE_MANIFEST_MODULE_PATH, rootDir, 'remote manifest module exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_MANIFEST_SUITE_PATH, rootDir, 'remote manifest suite exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_MANIFEST_CONTRACT_PATH, rootDir, 'remote manifest contract exists');
  assertFileExists(context, RMT_VNEXT_REMOTE_MANIFEST_WP_PATH, rootDir, 'WP-E16-02 workpackage document exists');
  assertFileExists(context, VALID_MANIFEST_FIXTURE, rootDir, 'valid remote manifest fixture exists');
  assertFileExists(context, INVALID_MANIFEST_FIXTURE, rootDir, 'invalid remote manifest fixture exists');
  context.assert(moduleSyntax.ok, `remote manifest module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `remote manifest suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'package metadata declares remote manifest schema');
  context.assert(metadata && metadata.remoteSurfaceSchema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'package metadata declares remote surface schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_REMOTE_MANIFEST_REPORT_SCHEMA, 'package metadata declares remote manifest report schema');
  context.assert(metadata && metadata.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'package metadata declares vNext core schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE, 'package metadata points to WP-E16-02');
  context.assert(metadata && metadata.module === RMT_VNEXT_REMOTE_MANIFEST_MODULE_PATH, 'package metadata points to remote manifest module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_REMOTE_MANIFEST_SUITE_PATH, 'package metadata points to remote manifest suite');
  context.assert(metadata && metadata.contract === RMT_VNEXT_REMOTE_MANIFEST_CONTRACT_PATH, 'package metadata points to remote manifest contract');
  context.assert(metadata && metadata.workpackageDocument === RMT_VNEXT_REMOTE_MANIFEST_WP_PATH, 'package metadata points to WP-E16-02 document');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json', 'package metadata declares remote manifest local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_REMOTE_MANIFEST_PACKAGE_SCRIPT, 'package metadata declares remote manifest package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-remote-manifest'] === 'string' ? packageManifest.exports['./rmt-language/vnext-remote-manifest'] : packageManifest.exports['./rmt-language/vnext-remote-manifest'] && packageManifest.exports['./rmt-language/vnext-remote-manifest'].default) === './tools/rmt-language/vnext-remote-manifest.js', 'package exports vNext remote manifest contract');
  context.assert(packageManifest.scripts['test:rmt-vnext-remote-manifest'] === 'node scripts/run_xtend_tests.js rmt-vnext-remote-manifest', 'package exposes vNext remote manifest script');
  context.assert(runner.hasSuite("rmt-vnext-remote-manifest"), 'test runner exposes rmt-vnext-remote-manifest suite');
  context.assert(runner.hasSuite("rmt-vnext-remote-manifest"), 'runner help references remote manifest gate');

  context.assert(epic.includes('- Status: `completed / Epic 16 Enterprise MFE Release Handoff accepted`'), 'Epic records current E16 accepted status');
  context.assert(epic.includes('| `WP-E16-02` | P0 | completed | WS1 |'), 'Epic marks WP-E16-02 completed');
  context.assert(epic.includes('| `WP-E16-03` | P0 | completed | WS1 |'), 'Epic records WP-E16-03 handoff');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-remote-surface-manifest.v1"'), 'contract document declares remote manifest schema');
  context.assert(workpackage.includes('WP-E16-02` ist abgeschlossen'), 'workpackage records handoff completion');
  context.assert(threatModel.includes('`WP-E16-02` darf Manifest- und Core-Felder definieren'), 'threat model hands off to WP-E16-02');

  context.assert(REMOTE_REQUIRED_FACTS.length === 10, 'remote manifest exposes ten mandatory facts');
  assertIncludesAll(context, REMOTE_REQUIRED_FACTS, [
    'owner',
    'version',
    'remote',
    'origin',
    'integrity',
    'trustBoundary',
    'allowedCapabilities',
    'adapterBoundary',
    'shellTargets',
    'fallback'
  ], 'remote manifest mandatory facts');

  const validFixture = readJson(VALID_MANIFEST_FIXTURE, rootDir);
  const validManifest = createRemoteSurfaceManifest(validFixture);
  context.assert(validManifest.schema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'valid manifest emits manifest schema');
  context.assert(validManifest.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'valid manifest records vNext core schema');
  context.assert(validManifest.remoteSurfaceSchema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'valid manifest records remote surface schema');
  context.assert(validManifest.workpackage === RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE, 'valid manifest records WP-E16-02');
  context.assert(validManifest.ok === true && validManifest.status === 'ready', 'valid manifest is ready');
  context.assert(validManifest.surfaceCount === 1, 'valid manifest contains one remote surface');
  context.assert(validManifest.runtimeBoundary.kernelRemoteExecution === false, 'manifest runtime boundary blocks kernel remote execution');
  context.assert(validManifest.runtimeBoundary.networkRequiredByKernel === false, 'manifest does not require network in kernel');

  const remoteSurface = validManifest.remoteSurface;
  context.assert(remoteSurface.schema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'remote surface emits remote surface schema');
  context.assert(remoteSurface.surfaceId === 'remoteSurface:checkout.cart', 'remote surface id is stable');
  context.assert(remoteSurface.owner.id === 'checkout-platform', 'remote surface records owner');
  context.assert(remoteSurface.remote.id === '@xtend/checkout-cart', 'remote surface records remote id');
  context.assert(remoteSurface.remote.origin === 'https://cdn.xtend.example', 'remote surface records origin');
  context.assert(remoteSurface.remote.versionRange === '^2.4.0', 'remote surface records version range');
  context.assert(remoteSurface.remote.integrity.algorithm === 'sha256', 'remote surface records integrity algorithm');
  context.assert(remoteSurface.security.trustBoundary === 'xtend.security.remote-surface.v1', 'remote surface records trust boundary');
  context.assert(remoteSurface.security.capabilityMode === 'deny-by-default', 'remote surface records deny-by-default capability mode');
  context.assert(remoteSurface.shellBindings.length === 2, 'remote surface records shell lane bindings');
  context.assert(remoteSurface.capabilities.length === 3, 'remote surface records explicit capabilities');
  context.assert(remoteSurface.adapterBoundary.adapterId === 'xtend.remote-surface.host', 'remote surface records adapter boundary');
  context.assert(remoteSurface.adapterBoundary.capabilities.includes('surface.mount'), 'adapter boundary allows surface.mount');
  context.assert(remoteSurface.fallback.ref === 'checkout.cart.fallback', 'remote surface records fallback');
  context.assert(remoteSurface.runtime.kernelRemoteExecution === false, 'remote surface cannot execute remote runtime in kernel');
  context.assert(remoteSurface.runtime.hostAdapterRequired === true, 'remote surface requires host adapter');

  const serialized = serializeRemoteSurfaceManifest(validManifest);
  const repeat = serializeRemoteSurfaceManifest(createRemoteSurfaceManifest(validFixture));
  context.assert(serialized === repeat, 'remote manifest serialization is byte-stable');
  context.assert(JSON.parse(serialized).schema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'serialized remote manifest is parseable JSON');

  const invalidFixture = readJson(INVALID_MANIFEST_FIXTURE, rootDir);
  const invalidManifest = createRemoteSurfaceManifest(invalidFixture);
  const invalidCodes = diagnosticCodes(invalidManifest);
  context.assert(invalidManifest.ok === false && invalidManifest.status === 'blocked', 'invalid manifest is blocked');
  assertIncludesAll(context, invalidCodes, [
    REMOTE_OWNER_MISSING_CODE,
    REMOTE_VERSION_MISSING_CODE,
    REMOTE_ORIGIN_INVALID_CODE,
    REMOTE_INTEGRITY_MISSING_CODE,
    REMOTE_TRUST_BOUNDARY_MISSING_CODE,
    REMOTE_ADAPTER_BOUNDARY_MISSING_CODE,
    REMOTE_EXPOSES_MISSING_CODE,
    REMOTE_FALLBACK_MISSING_CODE,
    REMOTE_CAPABILITY_IMPLICIT_CODE
  ], 'invalid manifest diagnostics');

  const missingRemote = cloneJson(validFixture);
  delete missingRemote.surface.remote.id;
  delete missingRemote.surface.remote.origin;
  missingRemote.surface.capabilities = [];
  const missingRemoteManifest = createRemoteSurfaceManifest(missingRemote);
  const missingCodes = diagnosticCodes(missingRemoteManifest);
  assertIncludesAll(context, missingCodes, [
    REMOTE_ID_MISSING_CODE,
    REMOTE_ORIGIN_MISSING_CODE,
    REMOTE_CAPABILITY_MISSING_CODE
  ], 'missing remote facts diagnostics');

  const runtimeLoader = cloneJson(validFixture);
  runtimeLoader.surface.adapterBoundary.runtimeLoader = true;
  const runtimeLoaderManifest = createRemoteSurfaceManifest(runtimeLoader);
  context.assert(runtimeLoaderManifest.ok === false, 'runtime loader requests block manifest');
  context.assert(diagnosticCodes(runtimeLoaderManifest).includes(REMOTE_RUNTIME_EXECUTION_CODE), 'runtime loader request produces kernel boundary diagnostic');

  const directRecord = createRemoteSurfaceRecord(validFixture.surface);
  context.assert(directRecord.schema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'direct remote surface record can be created');
  context.assert(directRecord.status === 'ready', 'direct remote surface record is ready');

  const adapter = createRmtVNextRemoteManifestAdapter();
  context.assert(adapter.schema === RMT_VNEXT_REMOTE_MANIFEST_SCHEMA, 'adapter exposes remote manifest schema');
  context.assert(adapter.remoteSurfaceSchema === RMT_VNEXT_REMOTE_SURFACE_SCHEMA, 'adapter exposes remote surface schema');
  context.assert(adapter.coreSchema === RMT_VNEXT_CORE_SCHEMA, 'adapter exposes vNext core schema');
  context.assert(adapter.createManifest(validFixture).ok === true, 'adapter creates valid manifest');
  context.assert(adapter.createRemoteSurface(validFixture.surface).status === 'ready', 'adapter creates remote surface record');

  return context.result({
    schema: RMT_VNEXT_REMOTE_MANIFEST_REPORT_SCHEMA,
    manifestSchema: RMT_VNEXT_REMOTE_MANIFEST_SCHEMA,
    remoteSurfaceSchema: RMT_VNEXT_REMOTE_SURFACE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_REMOTE_MANIFEST_WORKPACKAGE,
    module: RMT_VNEXT_REMOTE_MANIFEST_MODULE_PATH,
    suite: RMT_VNEXT_REMOTE_MANIFEST_SUITE_PATH,
    requiredFactCount: REMOTE_REQUIRED_FACTS.length
  });
}

function printRmtVNextRemoteManifestReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 16 RMT vNext Remote Surface Manifest Contract erfolgreich.',
    failureTitle: 'Epic 16 RMT vNext Remote Surface Manifest Contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextRemoteManifestReport,
  runRmtVNextRemoteManifestSuite
};
