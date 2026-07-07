const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRepoPath, resolveRootDir } = require('../utils/files');
const { syntaxCheckFile } = require('../utils/process');
const {
  XSCALER_ATC_HANDOFF_SCHEMA,
  XSCALER_CAPABILITY_MISMATCH_CODE,
  XSCALER_FALLBACK_MISSING_CODE,
  XSCALER_INTEGRITY_MISSING_CODE,
  XSCALER_ORIGIN_BLOCKED_CODE,
  XSCALER_PREFLIGHT_REQUEST_SCHEMA,
  XSCALER_PREFLIGHT_RESPONSE_SCHEMA,
  XSCALER_REMOTE_SURFACE_PLAN_SCHEMA,
  XSCALER_SSR_NETWORK_DENIED_CODE,
  XSCALER_XTENSION_DENIED_CODE,
  XSCALER_XTENSION_DEPLOYMENT_SCHEMA,
  createXScalerAtcHandoff,
  createXScalerPreflightRequest,
  createXScalerPreflightResponse,
  createXScalerRemoteSurfacePlan,
  createXScalerXtensionDeployment,
  evaluateXScalerPreflight
} = require('../../tools/rmt-language/xscaler-protocol');

const XSCALER_PROTOCOL_SCHEMA = 'xtend.xscaler.protocol-suite.v1';
const FIXTURE_DIR = 'tests/rmt/fixtures/xscaler';
const XSCALER_MODULE = 'tools/rmt-language/xscaler-protocol.js';
const XSCALER_TYPES = 'tools/rmt-language/xscaler-protocol.d.ts';
const XSCALER_CLOSURE_PLAN = 'development/XScaler-Luecken-und-Drift-Closure-Plan.md';
const DEFAULT_WORKFLOW = '.github/workflows/xtend-default-gates.yml';
const NIGHTLY_WORKFLOW = '.github/workflows/xtend-nightly-build.yml';
const FIXTURES = {
  preflightRequest: {
    path: `${FIXTURE_DIR}/xscaler-preflight-request.json`,
    schema: XSCALER_PREFLIGHT_REQUEST_SCHEMA
  },
  preflightResponse: {
    path: `${FIXTURE_DIR}/xscaler-preflight-response.json`,
    schema: XSCALER_PREFLIGHT_RESPONSE_SCHEMA
  },
  remoteSurfacePlan: {
    path: `${FIXTURE_DIR}/xscaler-remote-surface-plan.json`,
    schema: XSCALER_REMOTE_SURFACE_PLAN_SCHEMA
  },
  xtensionDeployment: {
    path: `${FIXTURE_DIR}/xscaler-xtension-deployment.json`,
    schema: XSCALER_XTENSION_DEPLOYMENT_SCHEMA
  }
};
const NEGATIVE_FIXTURES = [
  { path: `${FIXTURE_DIR}/xscaler-preflight-rejection-origin-blocked.json`, code: XSCALER_ORIGIN_BLOCKED_CODE },
  { path: `${FIXTURE_DIR}/xscaler-preflight-rejection-integrity-missing.json`, code: XSCALER_INTEGRITY_MISSING_CODE },
  { path: `${FIXTURE_DIR}/xscaler-preflight-rejection-ssr-network-denied.json`, code: XSCALER_SSR_NETWORK_DENIED_CODE },
  { path: `${FIXTURE_DIR}/xscaler-preflight-rejection-fallback-missing.json`, code: XSCALER_FALLBACK_MISSING_CODE },
  { path: `${FIXTURE_DIR}/xscaler-preflight-rejection-xtension-denied.json`, code: XSCALER_XTENSION_DENIED_CODE },
  { path: `${FIXTURE_DIR}/xscaler-preflight-rejection-capability-mismatch.json`, code: XSCALER_CAPABILITY_MISMATCH_CODE }
];
const DOCS = ['docs/en/xscaler-protocol.md', 'docs/de/xscaler-protocol.md'];
const REQUIRED_ANCHORS = ['## Schemas', '## Remote surface plan', '## SSR compatibility', '## XTensions deployment', '## ATC handoff'];
const REQUIRED_DE_ANCHORS = ['## Schemas', '## Remote-Surface-Plan', '## SSR-Kompatibilitaet', '## XTensions-Deployment', '## ATC-Handoff'];
const OLD_TESTBENCH_SCHEMAS = [
  'xtend.xscaler.protocol-' + 'lazy-preflight.v1',
  'xtend.xscaler.atc-' + 'lazy-surface.v1'
];

function assertFileExists(context, rootDir, relativePath, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagnosticCodes(result) {
  return (result.diagnostics || []).map((diagnostic) => diagnostic.code);
}

function baseRequest() {
  return createXScalerPreflightRequest({
    requestId: 'xscaler-evaluator-001',
    surface: 'checkout.cart',
    capabilities: ['remote-surface-plan', 'ssr-compatible', 'xtension-deployment'],
    constraints: { allowNetworkDuringSsr: false }
  });
}

function basePlan() {
  return createXScalerRemoteSurfacePlan({
    surface: 'checkout.cart',
    owner: 'checkout-platform',
    origin: 'https://cdn.xtend.example',
    integrity: { algorithm: 'sha256', digest: 'sha256-valid' },
    fallbackSurface: 'checkout.cart.fallback',
    lanes: [{ lane: 'visible', target: 'shell.slot:checkout' }],
    ssr: { mode: 'preflight-only', networkDuringRender: false }
  });
}

function assertEvaluatorBlocks(context, code, mutator, options = {}) {
  const request = options.request || baseRequest();
  const plan = basePlan();
  mutator(plan);
  const result = evaluateXScalerPreflight({
    request,
    remoteSurfacePlan: plan,
    hostCapabilities: options.hostCapabilities || { allowedOrigins: ['https://cdn.xtend.example'] }
  });
  context.assert(result.accepted === false && result.ok === false, `Evaluator rejects ${code}`);
  context.assert(result.rejection && result.rejection.code === code, `Evaluator reports rejection ${code}`);
  context.assert(diagnosticCodes(result).includes(code), `Evaluator diagnostics include ${code}`);
}

function validateContractModule(context, rootDir) {
  const syntax = syntaxCheckFile(XSCALER_MODULE, { rootDir, extension: '.js' });
  const types = readText(XSCALER_TYPES, rootDir);
  const api = require(resolveRepoPath(XSCALER_MODULE, rootDir));

  assertFileExists(context, rootDir, XSCALER_MODULE, 'XScaler internal contract module exists');
  assertFileExists(context, rootDir, XSCALER_TYPES, 'XScaler internal contract types exist');
  assertFileExists(context, rootDir, XSCALER_CLOSURE_PLAN, 'XScaler closure plan exists');
  context.assert(syntax.ok, `XScaler protocol module syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  [
    'createXScalerPreflightRequest',
    'createXScalerPreflightResponse',
    'createXScalerRemoteSurfacePlan',
    'createXScalerXtensionDeployment',
    'createXScalerAtcHandoff',
    'evaluateXScalerPreflight'
  ].forEach((name) => {
    context.assert(typeof api[name] === 'function', `XScaler module exports ${name}`);
    context.assert(types.includes(name), `XScaler types declare ${name}`);
  });
  [
    XSCALER_PREFLIGHT_REQUEST_SCHEMA,
    XSCALER_PREFLIGHT_RESPONSE_SCHEMA,
    XSCALER_REMOTE_SURFACE_PLAN_SCHEMA,
    XSCALER_XTENSION_DEPLOYMENT_SCHEMA,
    XSCALER_ATC_HANDOFF_SCHEMA
  ].forEach((schema) => {
    context.assert(types.includes(schema) || readText(XSCALER_MODULE, rootDir).includes(schema), `XScaler module tracks ${schema}`);
  });

  const request = createXScalerPreflightRequest({ surface: 'checkout.cart' });
  const response = createXScalerPreflightResponse({ requestId: request.requestId, surface: request.surface, accepted: true });
  const rejection = createXScalerPreflightResponse({
    requestId: request.requestId,
    surface: request.surface,
    accepted: false,
    diagnostics: [{ code: XSCALER_CAPABILITY_MISMATCH_CODE, severity: 'error', message: 'capability mismatch' }]
  });
  const plan = createXScalerRemoteSurfacePlan(basePlan());
  const deployment = createXScalerXtensionDeployment({ surface: 'checkout.cart', xtension: 'react-host-controller' });
  const handoff = createXScalerAtcHandoff({ surfaceId: 'remoteSurface:checkout.cart', sessionId: 'session:checkout' });

  context.assert(request.schema === XSCALER_PREFLIGHT_REQUEST_SCHEMA, 'Factory creates canonical preflight request schema');
  context.assert(response.accepted === true && response.ok === true, 'Factory keeps accepted/ok parity for accepted responses');
  context.assert(rejection.accepted === false && rejection.ok === false && rejection.rejection.code === XSCALER_CAPABILITY_MISMATCH_CODE, 'Factory keeps accepted/ok parity for rejected responses');
  context.assert(plan.schema === XSCALER_REMOTE_SURFACE_PLAN_SCHEMA && plan.runtimeBoundary.kernelRemoteExecution === false, 'Factory creates remote surface plan with kernel boundary');
  context.assert(deployment.schema === XSCALER_XTENSION_DEPLOYMENT_SCHEMA && deployment.ssr.hydrateAfterPreflight === true, 'Factory creates SSR-compatible XTension deployment');
  context.assert(handoff.schema === XSCALER_ATC_HANDOFF_SCHEMA && handoff.runtimeBoundary.remoteRuntimeExecution === false, 'Factory creates canonical ATC handoff');

  const accepted = evaluateXScalerPreflight({
    request: baseRequest(),
    remoteSurfacePlan: basePlan(),
    hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
  });
  context.assert(accepted.accepted === true && accepted.ok === true, 'Evaluator accepts valid XScaler preflight facts');
  assertEvaluatorBlocks(context, XSCALER_ORIGIN_BLOCKED_CODE, () => {}, { hostCapabilities: { allowedOrigins: ['https://blocked.example'] } });
  assertEvaluatorBlocks(context, XSCALER_INTEGRITY_MISSING_CODE, (plan) => { plan.integrity.digest = ''; });
  assertEvaluatorBlocks(context, XSCALER_SSR_NETWORK_DENIED_CODE, (plan) => { plan.ssr.networkDuringRender = true; });
  assertEvaluatorBlocks(context, XSCALER_FALLBACK_MISSING_CODE, (plan) => { plan.fallbackSurface = ''; });
  assertEvaluatorBlocks(context, XSCALER_XTENSION_DENIED_CODE, () => {}, { hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'], allowXtensionDeployment: false } });
  assertEvaluatorBlocks(context, XSCALER_CAPABILITY_MISMATCH_CODE, () => {}, {
    request: createXScalerPreflightRequest({ surface: 'checkout.cart', capabilities: ['ssr-compatible'] }),
    hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
  });
}

function validateFixtures(context, rootDir) {
  const request = readJson(FIXTURES.preflightRequest.path, rootDir);
  const response = readJson(FIXTURES.preflightResponse.path, rootDir);
  const plan = readJson(FIXTURES.remoteSurfacePlan.path, rootDir);
  const deployment = readJson(FIXTURES.xtensionDeployment.path, rootDir);

  Object.values(FIXTURES).forEach((fixture) => {
    assertFileExists(context, rootDir, fixture.path, `${fixture.path} exists`);
    const data = readJson(fixture.path, rootDir);
    context.assert(data.schema === fixture.schema, `${fixture.path} declares ${fixture.schema}`);
    context.assert(data.protocol === 'xscaler', `${fixture.path} declares xscaler protocol`);
  });

  context.assert(request.requestId === response.requestId, 'preflight response correlates to request id');
  context.assert(response.accepted === true && response.ok === response.accepted, 'preflight response keeps accepted/ok parity');
  context.assert(request.capabilities.includes('remote-surface-plan'), 'preflight request asks for remote surface plan capability');
  context.assert(request.capabilities.includes('ssr-compatible'), 'preflight request asks for SSR compatibility');
  context.assert(request.capabilities.includes('xtension-deployment'), 'preflight request asks for XTension deployment');
  context.assert(response.compatibility.ssr === 'compatible', 'preflight response marks SSR compatible');
  context.assert(plan.ssr.networkDuringRender === false, 'remote surface plan disables network during SSR render');
  context.assert(plan.fallbackSurface && plan.integrity.algorithm === 'sha256', 'remote surface plan has fallback and integrity');
  context.assert(deployment.remoteSurfacePlan === path.basename(FIXTURES.remoteSurfacePlan.path), 'XTension deployment references remote surface plan fixture');
  context.assert(deployment.ssr.hydrateAfterPreflight === true && deployment.ssr.requiresDom === false, 'XTension deployment is SSR-compatible');

  context.assert(NEGATIVE_FIXTURES.length >= 6, 'XScaler has at least six negative preflight fixtures');
  NEGATIVE_FIXTURES.forEach((fixture) => {
    assertFileExists(context, rootDir, fixture.path, `${fixture.path} exists`);
    const data = readJson(fixture.path, rootDir);
    context.assert(data.schema === XSCALER_PREFLIGHT_RESPONSE_SCHEMA, `${fixture.path} declares rejected preflight response schema`);
    context.assert(data.protocol === 'xscaler', `${fixture.path} declares xscaler protocol`);
    context.assert(data.accepted === false && data.ok === false && data.ok === data.accepted, `${fixture.path} keeps rejected accepted/ok parity`);
    context.assert(data.rejection && data.rejection.code === fixture.code, `${fixture.path} carries rejection ${fixture.code}`);
    context.assert(diagnosticCodes(data).includes(fixture.code), `${fixture.path} diagnostics include ${fixture.code}`);
  });
}

function validateDocs(context, rootDir) {
  const menu = readText('docs/menu.json', rootDir);
  DOCS.forEach((docPath) => assertFileExists(context, rootDir, docPath, `${docPath} exists`));
  const en = readText(DOCS[0], rootDir);
  const de = readText(DOCS[1], rootDir);
  Object.values(FIXTURES).forEach((fixture) => {
    context.assert(en.includes(fixture.schema), `English docs mention ${fixture.schema}`);
    context.assert(de.includes(fixture.schema), `German docs mention ${fixture.schema}`);
  });
  context.assert(en.includes(XSCALER_ATC_HANDOFF_SCHEMA), `English docs mention ${XSCALER_ATC_HANDOFF_SCHEMA}`);
  context.assert(de.includes(XSCALER_ATC_HANDOFF_SCHEMA), `German docs mention ${XSCALER_ATC_HANDOFF_SCHEMA}`);
  REQUIRED_ANCHORS.forEach((anchor) => context.assert(en.includes(anchor), `English docs include ${anchor}`));
  REQUIRED_DE_ANCHORS.forEach((anchor) => context.assert(de.includes(anchor), `German docs include ${anchor}`));
  context.assert(menu.includes('xscaler-protocol'), 'docs menu links XScaler protocol');
  ['docs/en/rmt-reference-remote-surfaces.md', 'docs/de/rmt-reference-remote-surfaces.md', 'docs/en/rmt-node-ssr-adapter.md', 'docs/de/rmt-php-ssr-adapter.md', 'docs/de/xtensions-authoring-guide.md'].forEach((docPath) => {
    const text = readText(docPath, rootDir);
    context.assert(text.includes('xscaler-protocol'), `${docPath} references XScaler protocol docs`);
  });
}

function validateRegistration(context, rootDir) {
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const pkg = readJson('package.json', rootDir);
  const defaultWorkflow = readText(DEFAULT_WORKFLOW, rootDir);
  const nightlyWorkflow = readText(NIGHTLY_WORKFLOW, rootDir);
  const nightlyManifestScript = readText('scripts/create_xtend_nightly_manifest.js', rootDir);
  const nightlyCommandSet = (((pkg.xtend || {}).ciGateMatrix || {}).nightlyBuild || {}).commandSet || [];
  context.assert(runner.includes("require('../tests/rmt/xscaler_protocol_suite')"), 'runner imports XScaler suite');
  context.assert(runner.includes("require('../tests/rmt/xscaler_source_to_sea_suite')"), 'runner imports XScaler source-to-sea suite');
  context.assert(runner.includes("id: 'xscaler-protocol'"), 'runner registers xscaler-protocol gate');
  context.assert(runner.includes("id: 'xscaler-source-to-sea'"), 'runner registers xscaler-source-to-sea gate');
  context.assert(pkg.scripts['test:xscaler-protocol'] === 'node scripts/run_xtend_tests.js xscaler-protocol', 'package exposes XScaler script');
  context.assert(pkg.scripts['test:xscaler-source-to-sea'] === 'node scripts/run_xtend_tests.js xscaler-source-to-sea', 'package exposes XScaler source-to-sea script');
  context.assert((pkg.xtend.releaseGates || []).includes('npm run test:xscaler-protocol'), 'release gates include XScaler protocol');
  context.assert((pkg.xtend.releaseGates || []).includes('npm run test:xscaler-source-to-sea'), 'release gates include XScaler source-to-sea');
  context.assert(defaultWorkflow.includes('npm run test:xscaler-protocol'), 'default workflow validates XScaler protocol');
  context.assert(defaultWorkflow.includes('npm run test:xscaler-source-to-sea:report'), 'default workflow validates XScaler source-to-sea');
  context.assert(defaultWorkflow.includes('.xtend-test-results/xtend-xscaler-protocol-report.json'), 'default workflow uploads XScaler protocol report');
  context.assert(defaultWorkflow.includes('.xtend-test-results/xtend-xscaler-source-to-sea-report.json'), 'default workflow uploads XScaler source-to-sea report');
  context.assert(nightlyWorkflow.includes('npm run test:xscaler-protocol:report'), 'nightly workflow validates XScaler protocol');
  context.assert(nightlyWorkflow.includes('npm run test:xscaler-source-to-sea:report'), 'nightly workflow validates XScaler source-to-sea');
  context.assert(nightlyWorkflow.includes('.xtend-test-results/xtend-xscaler-protocol-report.json'), 'nightly workflow uploads XScaler protocol report');
  context.assert(nightlyWorkflow.includes('.xtend-test-results/xtend-xscaler-source-to-sea-report.json'), 'nightly workflow uploads XScaler source-to-sea report');
  context.assert(nightlyCommandSet.includes('npm run test:xscaler-protocol:report'), 'nightly metadata tracks XScaler protocol report command');
  context.assert(nightlyCommandSet.includes('npm run test:xscaler-source-to-sea:report'), 'nightly metadata tracks XScaler source-to-sea report command');
  context.assert(nightlyManifestScript.includes('npm run test:xscaler-protocol:report'), 'nightly manifest tracks XScaler protocol command');
  context.assert(nightlyManifestScript.includes('npm run test:xscaler-source-to-sea:report'), 'nightly manifest tracks XScaler source-to-sea command');
  context.assert(nightlyManifestScript.includes('.xtend-test-results/xtend-xscaler-protocol-report.json'), 'nightly manifest tracks XScaler protocol artifact');
  context.assert(nightlyManifestScript.includes('.xtend-test-results/xtend-xscaler-source-to-sea-report.json'), 'nightly manifest tracks XScaler source-to-sea artifact');
  ['test:pr', 'test:pr:report', 'test:release:full', 'test:release:full:report'].forEach((scriptName) => {
    context.assert(pkg.scripts[scriptName].includes('xscaler-protocol'), `${scriptName} includes xscaler-protocol`);
    context.assert(pkg.scripts[scriptName].includes('xscaler-source-to-sea'), `${scriptName} includes xscaler-source-to-sea`);
  });
}

function validateTestbenchDriftGuards(context, rootDir) {
  const files = [
    'products/rmt-animation-testbench/src/shared/testbench-data.mjs',
    'products/rmt-animation-testbench/server/index.mjs',
    'products/rmt-animation-testbench/src/client/testbench-controller.mjs',
    'products/rmt-animation-testbench/scripts/verify.mjs',
    'products/rmt-animation-testbench/scripts/browser-smoke.mjs'
  ];
  const combined = files.map((file) => readText(file, rootDir)).join('\n');
  OLD_TESTBENCH_SCHEMAS.forEach((schema) => {
    context.assert(!combined.includes(schema), `Testbench no longer references old schema ${schema}`);
  });
  context.assert(combined.includes(XSCALER_PREFLIGHT_RESPONSE_SCHEMA), 'Testbench references canonical preflight response schema');
  context.assert(combined.includes(XSCALER_ATC_HANDOFF_SCHEMA), 'Testbench references canonical ATC handoff schema');
  context.assert(combined.includes('accepted: true'), 'Testbench emits accepted preflight alias');
  context.assert(combined.includes('ok: true'), 'Testbench keeps ok compatibility alias');
}

function runXScalerProtocolSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xscaler-protocol', label: 'XScaler Protocol Gate' });
  const syntax = syntaxCheckFile('tests/rmt/xscaler_protocol_suite.js', { rootDir, extension: '.js' });
  context.assert(syntax.ok, `XScaler suite syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  validateContractModule(context, rootDir);
  validateFixtures(context, rootDir);
  validateDocs(context, rootDir);
  validateTestbenchDriftGuards(context, rootDir);
  validateRegistration(context, rootDir);
  return context.result({
    schema: XSCALER_PROTOCOL_SCHEMA,
    fixtures: Object.values(FIXTURES).map((fixture) => fixture.path),
    negativeFixtures: NEGATIVE_FIXTURES.map((fixture) => fixture.path),
    docs: DOCS,
    module: XSCALER_MODULE,
    types: XSCALER_TYPES
  });
}

function printXScalerProtocolReport(result) {
  printSuiteReport(result, {
    successTitle: 'XScaler Protocol Gate erfolgreich.',
    failureTitle: 'XScaler Protocol Gate fehlgeschlagen:'
  });
}

module.exports = { printXScalerProtocolReport, runXScalerProtocolSuite };
