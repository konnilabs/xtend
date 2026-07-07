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
  createRemoteSurfaceManifest
} = require('../../tools/rmt-language/vnext-remote-manifest');
const {
  createEnterpriseSurfaceRegistry
} = require('../../tools/rmt-language/vnext-enterprise-registry');
const {
  createDegradationReport
} = require('../../tools/rmt-language/vnext-degradation');
const {
  createRmtVNextRemoteSecurityReport
} = require('../../tools/rmt-language/vnext-remote-security');
const {
  XSURFACE_SHARD_DEGRADATION_BLOCKED_CODE,
  XSURFACE_SHARD_FALLBACK_MISSING_CODE,
  XSURFACE_SHARD_FRAGMENT_SCHEMA,
  XSURFACE_SHARD_HANDOFF_SCHEMA,
  XSURFACE_SHARD_LIFECYCLE_INVALID_TRANSITION_CODE,
  XSURFACE_SHARD_NON_SERIALIZABLE_PAYLOAD_CODE,
  XSURFACE_SHARD_PACKAGE,
  XSURFACE_SHARD_PLAN_SCHEMA,
  XSURFACE_SHARD_SECURITY_BLOCKED_CODE,
  XSURFACE_SHARD_SNAPSHOT_SCHEMA,
  XSCALER_ATC_HANDOFF_SCHEMA,
  createXSurfaceAtcHandoff,
  createXSurfaceShardPlan,
  createXSurfaceShardServer,
  createXSurfaceStreamFragment,
  partitionXSurfaceShardSurfaces,
  serializeXSurfaceShardPlan
} = require('../../xsurface-shard');

const XSURFACE_SHARD_SUITE_SCHEMA = 'xtend.xsurface.shard-suite.v1';
const XSURFACE_SHARD_MODULE = 'xsurface-shard/index.js';
const XSURFACE_SHARD_TYPES = 'xsurface-shard/index.d.ts';
const XSURFACE_SHARD_README = 'xsurface-shard/README.md';
const XSURFACE_SHARD_PACKAGE_JSON = 'xsurface-shard/package.json';
const REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const ENTERPRISE_REGISTRY_FIXTURE = 'tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json';
const DEGRADATION_FIXTURE = 'tests/rmt-language/fixtures/vnext-degradation-policy-fixture.json';
const REMOTE_SECURITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-security-policy-fixture.json';

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function diagnosticCodes(result) {
  return (result.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function remoteSurface(plan) {
  return plan.surfaces.find((surface) => surface.surfaceId === 'remoteSurface:checkout.cart');
}

function createShardInput(rootDir, overrides = {}) {
  const remoteManifestInput = readJson(REMOTE_MANIFEST_FIXTURE, rootDir);
  const registryCatalog = readJson(ENTERPRISE_REGISTRY_FIXTURE, rootDir);
  const degradationInput = readJson(DEGRADATION_FIXTURE, rootDir);
  const securityInput = readJson(REMOTE_SECURITY_FIXTURE, rootDir);
  const remoteManifest = createRemoteSurfaceManifest(remoteManifestInput);
  const enterpriseRegistry = createEnterpriseSurfaceRegistry({
    ...registryCatalog,
    remoteManifests: [remoteManifest]
  });
  const degradationReport = createDegradationReport({
    ...degradationInput,
    enterpriseRegistry
  });
  const remoteSecurityReport = createRmtVNextRemoteSecurityReport({
    ...securityInput,
    enterpriseRegistry,
    degradationReport
  });

  return {
    enterpriseRegistry: overrides.enterpriseRegistry || enterpriseRegistry,
    degradationReport: overrides.degradationReport || degradationReport,
    remoteSecurityReport: overrides.remoteSecurityReport || remoteSecurityReport
  };
}

function validateRuntimeApi(context, rootDir) {
  const moduleSyntax = syntaxCheckFile(XSURFACE_SHARD_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile('tests/xsurface/xsurface_shard_suite.js', { rootDir, extension: '.js' });
  const api = require(resolveRepoPath(XSURFACE_SHARD_MODULE, rootDir));
  const source = readText(XSURFACE_SHARD_MODULE, rootDir);

  context.assert(moduleSyntax.ok, `XSurface Shard module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `XSurface Shard suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(api.XSURFACE_SHARD_PACKAGE === XSURFACE_SHARD_PACKAGE, 'Package can be loaded through CommonJS require');
  [
    'createXSurfaceShardPlan',
    'createXSurfaceShardServer',
    'partitionXSurfaceShardSurfaces',
    'createXSurfaceAtcHandoff',
    'createXSurfaceStreamFragment',
    'serializeXSurfaceShardPlan'
  ].forEach((name) => context.assert(typeof api[name] === 'function', `Runtime exports ${name}`));
  context.assert(!source.includes('fetch('), 'Runtime does not call fetch');
  context.assert(!source.includes('import('), 'Runtime does not use dynamic import');
}

function validateReadyPlan(context, rootDir) {
  const input = createShardInput(rootDir);
  const plan = createXSurfaceShardPlan(input, { generatedAt: 'test-static' });
  const shards = partitionXSurfaceShardSurfaces(input);
  const surface = remoteSurface(plan);
  const serialized = serializeXSurfaceShardPlan(plan);

  context.assert(plan.schema === XSURFACE_SHARD_PLAN_SCHEMA, 'Plan uses canonical shard plan schema');
  context.assert(plan.status === 'ready' && plan.ok === true, 'Valid E16 remote surface partitions as ready');
  context.assert(plan.surfaceCount === 1 && plan.shardCount === 1, 'Plan contains one remote surface in one shard');
  context.assert(surface && surface.decision === 'ready', 'Remote checkout surface is ready');
  context.assert(surface && surface.shardId === 'xsurface-shard:checkout-platform:shell.slot-sidebar.cart', 'Shard id is owner plus primary shell target');
  context.assert(plan.shards[0].shardId === surface.shardId, 'Shard snapshot references the surface shard id');
  context.assert(shards.length === 1 && shards[0].shardId === surface.shardId, 'partitionXSurfaceShardSurfaces returns deterministic shard records');
  context.assert(serialized.endsWith('\n') && serialized.includes(XSURFACE_SHARD_PLAN_SCHEMA), 'serializeXSurfaceShardPlan emits stable JSON with newline');
}

function validateRefusalAndDegradation(context, rootDir) {
  const readyInput = createShardInput(rootDir);
  const securityReport = cloneJson(readyInput.remoteSecurityReport);
  securityReport.postures[0].status = 'blocked';
  securityReport.postures[0].diagnostics = [{
    code: 'rmt.vnext.remote_security.origin_not_allowed',
    severity: 'error',
    message: 'blocked in test'
  }];
  const securityBlockedPlan = createXSurfaceShardPlan({
    ...readyInput,
    remoteSecurityReport: securityReport
  });
  const securitySurface = remoteSurface(securityBlockedPlan);

  context.assert(securitySurface.decision === 'refused', 'Security-blocked surface is refused');
  context.assert(diagnosticCodes(securitySurface).includes(XSURFACE_SHARD_SECURITY_BLOCKED_CODE), 'Security refusal emits stable diagnostic code');

  const degradationReport = cloneJson(readyInput.degradationReport);
  degradationReport.surfaces[0].state = 'blocked';
  degradationReport.surfaces[0].diagnostics = [{
    code: 'rmt.vnext.degradation.surface_blocked',
    severity: 'error',
    message: 'blocked in test'
  }];
  const degradationBlockedPlan = createXSurfaceShardPlan({
    ...readyInput,
    degradationReport
  });
  const degradationBlockedSurface = remoteSurface(degradationBlockedPlan);

  context.assert(degradationBlockedSurface.decision === 'refused', 'Degradation-blocked surface is refused');
  context.assert(diagnosticCodes(degradationBlockedSurface).includes(XSURFACE_SHARD_DEGRADATION_BLOCKED_CODE), 'Degradation refusal emits stable diagnostic code');

  const degradedReport = cloneJson(readyInput.degradationReport);
  degradedReport.surfaces[0].state = 'degraded';
  const degradedPlan = createXSurfaceShardPlan({
    ...readyInput,
    degradationReport: degradedReport
  });
  const degradedSurface = remoteSurface(degradedPlan);
  const handoff = createXSurfaceAtcHandoff({
    surface: degradedSurface,
    status: degradedSurface.decision,
    action: 'fallback_active',
    handoffSignal: 'activate-fallback'
  });

  context.assert(degradedSurface.decision === 'degraded', 'Degraded surface with fallback remains orchestratable');
  context.assert(handoff.schema === XSURFACE_SHARD_HANDOFF_SCHEMA && handoff.status === 'degraded', 'ATC handoff carries degraded status');
  context.assert(handoff.atc.schema === XSCALER_ATC_HANDOFF_SCHEMA, 'ATC handoff carries canonical XScaler handoff schema');
  context.assert(handoff.atc.protocol === 'xscaler-atc-compatible', 'ATC handoff declares XScaler compatibility');
  context.assert(handoff.runtimeBoundary.remoteRuntimeExecution === false && handoff.runtimeBoundary.kernelRemoteExecution === false, 'ATC handoff preserves no remote execution boundary');

  const missingFallbackRegistry = cloneJson(readyInput.enterpriseRegistry);
  missingFallbackRegistry.surfaces.find((surface) => surface.kind === 'remote').fallback = null;
  const missingFallbackDegradation = cloneJson(degradedReport);
  missingFallbackDegradation.surfaces[0].fallbackResolution = {
    required: true,
    resolved: false,
    fallback: null
  };
  const missingFallbackPlan = createXSurfaceShardPlan({
    enterpriseRegistry: missingFallbackRegistry,
    degradationReport: missingFallbackDegradation,
    remoteSecurityReport: readyInput.remoteSecurityReport
  });
  const missingFallbackSurface = remoteSurface(missingFallbackPlan);
  context.assert(missingFallbackSurface.decision === 'refused', 'Degraded surface without fallback is refused');
  context.assert(diagnosticCodes(missingFallbackSurface).includes(XSURFACE_SHARD_FALLBACK_MISSING_CODE), 'Missing fallback emits stable diagnostic code');
}

function validateServerLifecycleAndFragments(context, rootDir) {
  const input = createShardInput(rootDir);
  const server = createXSurfaceShardServer({ input });
  const attach = server.attach('remoteSurface:checkout.cart');
  const detach = server.detach('remoteSurface:checkout.cart');
  const invalidDetach = server.detach('remoteSurface:checkout.cart');
  const fragment = server.publishFragment({
    surfaceId: 'remoteSurface:checkout.cart',
    shardId: attach.shardId,
    sequence: 1,
    payload: { type: 'surface.patch', records: [] }
  });
  const invalidFragment = createXSurfaceStreamFragment({
    surfaceId: 'remoteSurface:checkout.cart',
    payload: { render() {} }
  });
  const snapshot = server.snapshot();
  const disposed = server.dispose();
  const disposedFragment = server.publishFragment({
    surfaceId: 'remoteSurface:checkout.cart',
    payload: { type: 'late.patch' }
  });

  context.assert(attach.status === 'ready' && attach.atc.lifecycleState === 'attached', 'Server attach returns ready ATC handoff');
  context.assert(detach.status === 'ready' && detach.atc.lifecycleState === 'detached', 'Server detach returns ready ATC handoff');
  context.assert(invalidDetach.status === 'refused', 'Invalid lifecycle transition is refused');
  context.assert(diagnosticCodes(invalidDetach).includes(XSURFACE_SHARD_LIFECYCLE_INVALID_TRANSITION_CODE), 'Invalid lifecycle transition emits stable diagnostic');
  context.assert(fragment.schema === XSURFACE_SHARD_FRAGMENT_SCHEMA && fragment.ok === true, 'JSON-safe stream fragment is accepted');
  context.assert(invalidFragment.status === 'refused', 'Non-serializable stream fragment is refused');
  context.assert(diagnosticCodes(invalidFragment).includes(XSURFACE_SHARD_NON_SERIALIZABLE_PAYLOAD_CODE), 'Non-serializable payload emits stable diagnostic');
  context.assert(snapshot.schema === XSURFACE_SHARD_SNAPSHOT_SCHEMA && snapshot.fragmentCount === 1, 'Snapshot records accepted stream fragments');
  context.assert(disposed.status === 'disposed' && disposed.disposed === true, 'Dispose returns disposed snapshot');
  context.assert(disposedFragment.status === 'refused', 'Disposed server refuses late stream fragments');
}

function validateDocsMetadataAndRegistration(context, rootDir) {
  const rootPackage = readJson('package.json', rootDir);
  const shardPackage = readJson(XSURFACE_SHARD_PACKAGE_JSON, rootDir);
  const readme = readText(XSURFACE_SHARD_README, rootDir);
  const types = readText(XSURFACE_SHARD_TYPES, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const exportLock = readText('catalog/epic13-package-export-lock.js', rootDir);
  const metadata = rootPackage.xtend && rootPackage.xtend.xsurfaceShard;

  assertFileExists(context, XSURFACE_SHARD_MODULE, rootDir, 'XSurface Shard runtime exists');
  assertFileExists(context, XSURFACE_SHARD_TYPES, rootDir, 'XSurface Shard types exist');
  assertFileExists(context, XSURFACE_SHARD_README, rootDir, 'XSurface Shard README exists');
  context.assert(rootPackage.exports['./xsurface-shard'].default === './xsurface-shard/index.js', 'Root package exports ./xsurface-shard');
  context.assert(rootPackage.scripts['test:xsurface-shard'] === 'node scripts/run_xtend_tests.js xsurface-shard', 'Root package exposes xsurface-shard test script');
  context.assert(metadata && metadata.schema === XSURFACE_SHARD_PLAN_SCHEMA, 'Root package metadata declares shard plan schema');
  context.assert(metadata && metadata.snapshotSchema === XSURFACE_SHARD_SNAPSHOT_SCHEMA, 'Root package metadata declares snapshot schema');
  context.assert(metadata && metadata.handoffSchema === XSURFACE_SHARD_HANDOFF_SCHEMA, 'Root package metadata declares handoff schema');
  context.assert(metadata && metadata.fragmentSchema === XSURFACE_SHARD_FRAGMENT_SCHEMA, 'Root package metadata declares fragment schema');
  context.assert(metadata && metadata.networkRequired === false && metadata.kernelRemoteExecution === false, 'Root package metadata preserves network and kernel boundary');
  context.assert(shardPackage.engines && shardPackage.engines.node === '>=18', 'Shard package declares Node 18 engine');
  context.assert(shardPackage.peerDependenciesMeta && shardPackage.peerDependenciesMeta['@ccslabs/xtend-rmt'].optional === true, 'Shard package declares optional RMT peer');
  [
    XSURFACE_SHARD_PLAN_SCHEMA,
    XSURFACE_SHARD_SNAPSHOT_SCHEMA,
    XSURFACE_SHARD_HANDOFF_SCHEMA,
    XSURFACE_SHARD_FRAGMENT_SCHEMA,
    XSCALER_ATC_HANDOFF_SCHEMA,
    'createXSurfaceShardPlan',
    'createXSurfaceShardServer',
    'publishFragment()'
  ].forEach((anchor) => context.assert(readme.includes(anchor), `README documents ${anchor}`));
  [
    'createXSurfaceShardPlan',
    'createXSurfaceShardServer',
    'partitionXSurfaceShardSurfaces',
    'createXSurfaceAtcHandoff',
    'createXSurfaceStreamFragment',
    'serializeXSurfaceShardPlan'
  ].forEach((name) => context.assert(types.includes(name), `Types declare ${name}`));
  context.assert(runner.includes("require('../tests/xsurface/xsurface_shard_suite')"), 'Runner imports XSurface Shard suite');
  context.assert(runner.includes("id: 'xsurface-shard'"), 'Runner registers xsurface-shard gate');
  context.assert(runner.includes('node scripts/run_xtend_tests.js xsurface-shard'), 'Runner help references xsurface-shard gate');
  context.assert(exportLock.includes("'./xsurface-shard'"), 'Package export lock expects xsurface-shard root export');
  context.assert(exportLock.includes("'xsurface-shard'"), 'Package export lock expects xsurface-shard package root');
}

function runXSurfaceShardSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xsurface-shard',
    label: 'XSurface Shard server orchestration'
  });

  validateRuntimeApi(context, rootDir);
  validateReadyPlan(context, rootDir);
  validateRefusalAndDegradation(context, rootDir);
  validateServerLifecycleAndFragments(context, rootDir);
  validateDocsMetadataAndRegistration(context, rootDir);

  return context.result({
    schema: XSURFACE_SHARD_SUITE_SCHEMA,
    module: XSURFACE_SHARD_MODULE,
    types: XSURFACE_SHARD_TYPES,
    docs: XSURFACE_SHARD_README
  });
}

function printXSurfaceShardReport(result) {
  printSuiteReport(result, {
    successTitle: 'XSurface Shard Gate erfolgreich.',
    failureTitle: 'XSurface Shard Gate fehlgeschlagen:'
  });
}

module.exports = {
  printXSurfaceShardReport,
  runXSurfaceShardSuite
};
