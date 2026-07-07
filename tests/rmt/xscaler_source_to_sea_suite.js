const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
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
  XSCALER_ATC_HANDOFF_SCHEMA,
  XSCALER_PREFLIGHT_RESPONSE_SCHEMA,
  XSCALER_REMOTE_SURFACE_PLAN_SCHEMA,
  createXScalerAtcHandoff,
  createXScalerPreflightRequest,
  createXScalerRemoteSurfacePlan,
  evaluateXScalerPreflight
} = require('../../tools/rmt-language/xscaler-protocol');
const {
  createXSurfaceShardServer
} = require('../../xsurface-shard');

const XSCALER_SOURCE_TO_SEA_SCHEMA = 'xtend.xscaler.source-to-sea-suite.v1';
const REMOTE_MANIFEST_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-manifest-valid.json';
const ENTERPRISE_REGISTRY_FIXTURE = 'tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json';
const DEGRADATION_FIXTURE = 'tests/rmt-language/fixtures/vnext-degradation-policy-fixture.json';
const REMOTE_SECURITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-remote-security-policy-fixture.json';
const TESTBENCH_SHARED = 'products/rmt-animation-testbench/src/shared/testbench-data.mjs';
const TESTBENCH_SERVER = 'products/rmt-animation-testbench/server/index.mjs';
const TESTBENCH_CLIENT = 'products/rmt-animation-testbench/src/client/testbench-controller.mjs';

function createSourceToSeaInput(rootDir) {
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
    remoteManifest,
    enterpriseRegistry,
    degradationReport,
    remoteSecurityReport
  };
}

function validateRemoteManifestToPreflight(context, input) {
  const request = createXScalerPreflightRequest({
    requestId: 'xscaler-source-to-sea-001',
    surface: 'checkout.cart',
    capabilities: ['remote-surface-plan', 'ssr-compatible', 'xtension-deployment'],
    constraints: { allowNetworkDuringSsr: false }
  });
  const remoteSurfacePlan = createXScalerRemoteSurfacePlan({
    remoteManifest: input.remoteManifest
  });
  const preflight = evaluateXScalerPreflight({
    request,
    remoteSurfacePlan,
    remoteManifest: input.remoteManifest,
    remoteSecurityReport: input.remoteSecurityReport,
    degradationReport: input.degradationReport,
    hostCapabilities: {
      allowedOrigins: ['https://cdn.xtend.example']
    }
  });

  context.assert(remoteSurfacePlan.schema === XSCALER_REMOTE_SURFACE_PLAN_SCHEMA, 'Remote manifest maps to canonical XScaler remote surface plan');
  context.assert(remoteSurfacePlan.runtimeBoundary.kernelRemoteExecution === false, 'XScaler remote surface plan keeps kernel remote execution disabled');
  context.assert(preflight.schema === XSCALER_PREFLIGHT_RESPONSE_SCHEMA, 'Preflight emits canonical response schema');
  context.assert(preflight.accepted === true && preflight.ok === true, 'Preflight accepts valid remote manifest source-to-sea facts');
  context.assert(preflight.remoteSurfacePlan && preflight.remoteSurfacePlan.ssr.networkDuringRender === false, 'Preflight preserves SSR no-network evidence');
  return {
    request,
    remoteSurfacePlan,
    preflight
  };
}

function validateAtcHandoff(context, input, preflightEvidence) {
  const server = createXSurfaceShardServer({ input });
  const handoff = server.attach('remoteSurface:checkout.cart', {
    sessionId: 'xscaler-source-to-sea:checkout.cart'
  });
  const canonicalAtc = createXScalerAtcHandoff({
    surfaceId: handoff.surfaceId,
    sessionId: handoff.atc.sessionId,
    handoffSignal: handoff.atc.handoffSignal,
    lifecycleState: handoff.atc.lifecycleState,
    accepted: preflightEvidence.preflight.accepted,
    fallback: handoff.fallback,
    diagnostics: handoff.diagnostics
  });

  context.assert(handoff.ok === true && handoff.status === 'ready', 'XSurface Shard accepts preflight-ready remote surface');
  context.assert(handoff.atc.schema === XSCALER_ATC_HANDOFF_SCHEMA, 'XSurface Handoff carries canonical XScaler ATC handoff schema');
  context.assert(handoff.atc.protocol === 'xscaler-atc-compatible', 'XSurface Handoff remains XScaler ATC compatible');
  context.assert(handoff.runtimeBoundary.remoteRuntimeExecution === false && handoff.runtimeBoundary.kernelRemoteExecution === false, 'XSurface Handoff preserves runtime boundary');
  context.assert(canonicalAtc.schema === XSCALER_ATC_HANDOFF_SCHEMA && canonicalAtc.ok === true, 'Canonical XScaler ATC handoff accepts XSurface handoff facts');
  context.assert(canonicalAtc.sessionId === handoff.atc.sessionId, 'Canonical ATC handoff preserves XSurface session id');
}

function validateTestbenchEvidence(context, rootDir) {
  const shared = readText(TESTBENCH_SHARED, rootDir);
  const server = readText(TESTBENCH_SERVER, rootDir);
  const client = readText(TESTBENCH_CLIENT, rootDir);

  context.assert(shared.includes(XSCALER_PREFLIGHT_RESPONSE_SCHEMA), 'Testbench shared data uses canonical preflight response schema');
  context.assert(shared.includes(XSCALER_ATC_HANDOFF_SCHEMA), 'Testbench shared data uses canonical ATC handoff schema');
  context.assert(shared.includes('accepted: true') && shared.includes('ok: true'), 'Testbench preflight keeps accepted/ok compatibility');
  context.assert(server.includes('/api/xscaler/preflight'), 'Testbench server exposes XScaler preflight endpoint');
  context.assert(server.includes('/api/lazy-surface/'), 'Testbench server exposes lazy-surface endpoint');
  context.assert(client.includes('/api/xscaler/preflight') && client.includes('/api/lazy-surface/'), 'Testbench client gates lazy surface loading through preflight');
}

function runXScalerSourceToSeaSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xscaler-source-to-sea', label: 'XScaler Source-to-Sea Gate' });
  const suiteSyntax = syntaxCheckFile('tests/rmt/xscaler_source_to_sea_suite.js', { rootDir, extension: '.js' });
  context.assert(suiteSyntax.ok, `XScaler source-to-sea suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  const input = createSourceToSeaInput(rootDir);
  const preflightEvidence = validateRemoteManifestToPreflight(context, input);
  validateAtcHandoff(context, input, preflightEvidence);
  validateTestbenchEvidence(context, rootDir);

  return context.result({
    schema: XSCALER_SOURCE_TO_SEA_SCHEMA,
    remoteManifest: REMOTE_MANIFEST_FIXTURE,
    testbench: TESTBENCH_SHARED
  });
}

function printXScalerSourceToSeaReport(result) {
  printSuiteReport(result, {
    successTitle: 'XScaler Source-to-Sea Gate erfolgreich.',
    failureTitle: 'XScaler Source-to-Sea Gate fehlgeschlagen:'
  });
}

module.exports = {
  printXScalerSourceToSeaReport,
  runXScalerSourceToSeaSuite
};
