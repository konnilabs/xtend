'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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

const NODE_ADAPTER_PATH = 'xtendrmt/rmt-node-ssr-adapter.js';
const NODE_ADAPTER_TYPES_PATH = 'xtendrmt/rmt-node-ssr-adapter.d.ts';
const PHP_ADAPTER_PATH = 'xtendrmt/rmt-php-ssr-adapter.php';
const ACCEPTED_PREFLIGHT_PATH = 'tests/rmt/fixtures/xscaler/xscaler-preflight-response.json';
const NETWORK_DENIED_PREFLIGHT_PATH = 'tests/rmt/fixtures/xscaler/xscaler-preflight-rejection-ssr-network-denied.json';
const XSCALER_SSR_HYDRATION_SCHEMA = 'xtend.xscaler.ssr-hydration.v1';
const NODE_INVALID_DIAGNOSTIC = 'rmt.node_ssr.xscaler_preflight_invalid';
const PHP_INVALID_DIAGNOSTIC = 'rmt.php_ssr.xscaler_preflight_invalid';
const REPORT_PATH = '.xtend-test-results/xtend-rmt-xscaler-ssr-hydration-parity-report.json';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createNetworkDuringRenderViolation(accepted, denied) {
  const invalid = clone(accepted);
  invalid.requestId = denied.requestId;
  invalid.accepted = denied.accepted;
  invalid.ok = denied.ok;
  invalid.compatibility = clone(denied.compatibility);
  invalid.remoteSurfacePlan.ssr = {
    ...invalid.remoteSurfacePlan.ssr,
    networkDuringRender: true
  };
  invalid.atc = clone(denied.atc);
  invalid.rejection = clone(denied.rejection);
  invalid.diagnostics = clone(denied.diagnostics);
  return invalid;
}

function createInvalidPreflights(accepted, denied) {
  const networkDuringRender = createNetworkDuringRenderViolation(accepted, denied);
  const forgedProtocol = clone(accepted);
  forgedProtocol.requestId = 'xscaler-preflight-forged-protocol';
  forgedProtocol.protocol = 'xscaler-forged';
  const acceptedAtcRefused = clone(accepted);
  acceptedAtcRefused.requestId = 'xscaler-preflight-accepted-atc-refused';
  acceptedAtcRefused.atc = clone(denied.atc);
  const acceptedWithRejection = clone(accepted);
  acceptedWithRejection.requestId = 'xscaler-preflight-accepted-with-rejection';
  acceptedWithRejection.rejection = clone(denied.rejection);
  return [networkDuringRender, forgedProtocol, acceptedAtcRefused, acceptedWithRejection];
}

function renderInput() {
  return {
    descriptor: {
      type: 'text',
      text: 'XScaler SSR preflight placeholder'
    }
  };
}

function hydrationContract(result) {
  const hydration = result && result.hydration || {};
  return {
    schema: hydration.schema || null,
    executionMode: hydration.executionMode || null,
    sourceKind: hydration.sourceKind || null,
    xscaler: hydration.xscaler || null
  };
}

function preflightHint(result) {
  const hints = result && result.head && Array.isArray(result.head.hints) ? result.head.hints : [];
  return hints.find((hint) => hint && hint.rel === 'xtend-xscaler-preflight') || null;
}

function createPhpHarness(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  const harnessPath = path.join(os.tmpdir(), `xtend-rmt-xscaler-ssr-parity-${process.pid}-${Date.now()}.php`);
  const source = `<?php
declare(strict_types=1);

$payload = json_decode(base64_decode('${encoded}'), true, 64, JSON_THROW_ON_ERROR);
require $payload['adapterPath'];

$networkCalls = 0;
$fetchTripwire = static function () use (&$networkCalls): void {
    $networkCalls += 1;
    throw new RuntimeException('SSR XScaler preflight must not invoke a fetch adapter.');
};
$adapter = createRmtPhpSsrAdapter();
$input = [
    'descriptor' => [
        'type' => 'text',
        'text' => 'XScaler SSR preflight placeholder',
    ],
];

$accepted = $adapter->render($input, [
    'requestId' => 'xscaler-ssr-parity-accepted',
    'renderedAt' => '2026-01-01T00:00:00.000Z',
    'xscalerPreflight' => $payload['accepted'],
    'fetchAdapter' => $fetchTripwire,
]);
$rejected = $adapter->render($input, [
    'requestId' => 'xscaler-ssr-parity-rejected',
    'renderedAt' => '2026-01-01T00:00:00.000Z',
    'xscalerPreflight' => $payload['rejected'],
    'fetchAdapter' => $fetchTripwire,
]);
$invalid = $adapter->render($input, [
    'requestId' => 'xscaler-ssr-parity-invalid-contracts',
    'renderedAt' => '2026-01-01T00:00:00.000Z',
    'xscalerPreflights' => $payload['invalids'],
    'fetchAdapter' => $fetchTripwire,
]);

echo json_encode([
    'accepted' => $accepted,
    'rejected' => $rejected,
    'invalid' => $invalid,
    'networkCalls' => $networkCalls,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
`;
  fs.writeFileSync(harnessPath, source, 'utf8');
  return harnessPath;
}

function runPhpHarness(rootDir, payload) {
  const harnessPath = createPhpHarness(payload);
  try {
    const result = spawnSync('php', [harnessPath], {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `PHP XScaler SSR harness exited ${result.status}`);
    }
    return JSON.parse(result.stdout);
  } finally {
    fs.rmSync(harnessPath, { force: true });
  }
}

function assertDeepParity(context, actual, expected, message) {
  try {
    assert.deepEqual(actual, expected);
    context.pass(message);
  } catch (error) {
    context.fail(`${message}: ${error.message}`);
  }
}

async function runRmtXScalerSsrHydrationParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-xscaler-ssr-hydration-parity',
    label: 'RMT Node/PHP XScaler SSR Hydration Parity'
  });
  const nodeAdapterPath = resolveRepoPath(NODE_ADAPTER_PATH, rootDir);
  const phpAdapterPath = resolveRepoPath(PHP_ADAPTER_PATH, rootDir);
  const accepted = readJson(ACCEPTED_PREFLIGHT_PATH, rootDir);
  const denied = readJson(NETWORK_DENIED_PREFLIGHT_PATH, rootDir);
  const invalids = createInvalidPreflights(accepted, denied);
  const invalid = invalids[0];
  const nodeTypes = readText(NODE_ADAPTER_TYPES_PATH, rootDir);
  const nodeSource = readText(NODE_ADAPTER_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const defaultWorkflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.xscaler;
  const gateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;

  context.assert(runner.includes("id: 'rmt-xscaler-ssr-hydration-parity'"), 'central runner registers XScaler SSR hydration parity');
  context.assert(packageManifest.scripts['test:rmt-xscaler-ssr-hydration-parity'] === 'node scripts/run_xtend_tests.js rmt-xscaler-ssr-hydration-parity', 'root package exposes the focused SSR parity script');
  context.assert(packageManifest.scripts['test:xscaler'].includes('rmt-xscaler-ssr-hydration-parity'), 'XScaler aggregate includes SSR hydration parity');
  context.assert(packageManifest.scripts['test:pr'].includes('rmt-xscaler-ssr-hydration-parity') && packageManifest.scripts['test:release:full'].includes('rmt-xscaler-ssr-hydration-parity'), 'PR and release scripts execute SSR hydration parity');
  context.assert(gateMatrix.prFastGate.suites.includes('rmt-xscaler-ssr-hydration-parity') && gateMatrix.fullReleaseGate.suites.includes('rmt-xscaler-ssr-hydration-parity'), 'CI matrices require SSR hydration parity');
  context.assert(metadata && metadata.ssrHydrationSchema === XSCALER_SSR_HYDRATION_SCHEMA && metadata.ssrHydrationParitySuiteId === 'rmt-xscaler-ssr-hydration-parity', 'XScaler metadata owns the versioned SSR hydration parity contract');
  context.assert(defaultWorkflow.includes('npm run test:rmt-xscaler-ssr-hydration-parity:report') && nightlyWorkflow.includes('npm run test:rmt-xscaler-ssr-hydration-parity:report'), 'default and nightly workflows emit the dedicated SSR parity report');
  context.assert(metadata && Array.isArray(metadata.reportArtifacts) && metadata.reportArtifacts.includes(REPORT_PATH), 'XScaler metadata retains the SSR parity report artifact');

  context.assert(fs.existsSync(nodeAdapterPath), 'Node SSR adapter exists');
  context.assert(fs.existsSync(phpAdapterPath), 'PHP SSR adapter exists');
  context.assert(accepted.accepted === true && accepted.remoteSurfacePlan.ssr.networkDuringRender === false, 'uses the accepted XScaler preflight fixture');
  context.assert(invalid.remoteSurfacePlan.ssr.networkDuringRender === true, 'negative fixture changes SSR networkDuringRender to true');
  context.assert(invalids[1].protocol === 'xscaler-forged', 'negative fixtures include a forged preflight protocol');
  context.assert(invalids[2].accepted === true && invalids[2].atc.status === 'refused', 'negative fixtures include an accepted response with a refused ATC handoff');
  context.assert(invalids[3].accepted === true && invalids[3].rejection !== null, 'negative fixtures include an accepted response with a contradictory rejection');
  context.assert(
    invalid.remoteSurfacePlan.runtimeBoundary.remoteRuntimeExecution === false
      && invalid.remoteSurfacePlan.runtimeBoundary.kernelRemoteExecution === false
      && invalid.remoteSurfacePlan.runtimeBoundary.networkRequiredByKernel === false,
    'negative fixture leaves all other remote-runtime boundaries valid'
  );
  context.assert(nodeTypes.includes("RMT_XSCALER_SSR_HYDRATION_SCHEMA: 'xtend.xscaler.ssr-hydration.v1'"), 'Node declarations expose the XScaler SSR hydration schema');
  context.assert(nodeTypes.includes("mode: 'preflight-only'") && nodeTypes.includes('remoteModuleExecuted: false'), 'Node declarations lock preflight-only/no-remote execution');
  context.assert(!nodeSource.includes("from '../xscaler") && !nodeSource.includes("require('../xscaler"), 'standalone @ccslabs/xtend-rmt SSR adapter has no hidden root-package XScaler dependency');

  const nodeApi = await import(`${new URL(`file://${nodeAdapterPath}`).href}?suite=xscaler-ssr-parity`);
  context.assert(nodeApi.RMT_XSCALER_SSR_HYDRATION_SCHEMA === XSCALER_SSR_HYDRATION_SCHEMA, 'Node runtime exposes the XScaler SSR hydration schema');
  const nodeAdapter = nodeApi.createRmtNodeSsrAdapter({ disableAutoCompiler: true });
  let nodeNetworkCalls = 0;
  const fetchTripwire = async () => {
    nodeNetworkCalls += 1;
    throw new Error('SSR XScaler preflight must not invoke a fetch adapter.');
  };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = fetchTripwire;
  let nodeAccepted;
  let nodeRejected;
  let nodeInvalid;
  try {
    nodeAccepted = await nodeAdapter.render(renderInput(), {
      requestId: 'xscaler-ssr-parity-accepted',
      renderedAt: '2026-01-01T00:00:00.000Z',
      xscalerPreflight: accepted,
      fetchAdapter: fetchTripwire
    });
    nodeRejected = await nodeAdapter.render(renderInput(), {
      requestId: 'xscaler-ssr-parity-rejected',
      renderedAt: '2026-01-01T00:00:00.000Z',
      xscalerPreflight: denied,
      fetchAdapter: fetchTripwire
    });
    nodeInvalid = await nodeAdapter.render(renderInput(), {
      requestId: 'xscaler-ssr-parity-invalid-contracts',
      renderedAt: '2026-01-01T00:00:00.000Z',
      xscalerPreflights: invalids,
      fetchAdapter: fetchTripwire
    });
  } finally {
    if (previousFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = previousFetch;
  }

  let php;
  try {
    php = runPhpHarness(rootDir, {
      adapterPath: phpAdapterPath,
      accepted,
      rejected: denied,
      invalids
    });
  } catch (error) {
    context.fail(`PHP SSR parity fixture executes: ${error && error.stack || error}`);
    return context.result({ runtimePair: ['node', 'php'] });
  }

  const nodeAcceptedContract = hydrationContract(nodeAccepted);
  const phpAcceptedContract = hydrationContract(php.accepted);
  assertDeepParity(context, nodeAcceptedContract, phpAcceptedContract, 'accepted Node/PHP hydration contracts are identical');
  context.assert(nodeAccepted.ok === true && php.accepted.ok === true, 'accepted preflight keeps both SSR renders successful');
  context.assert(nodeAccepted.status === 'rendered' && php.accepted.status === 'rendered', 'accepted preflight renders in both runtimes');
  context.assert(nodeAcceptedContract.xscaler.schema === XSCALER_SSR_HYDRATION_SCHEMA, 'accepted hydration uses the versioned XScaler SSR schema');
  context.assert(nodeAcceptedContract.xscaler.mode === 'preflight-only', 'accepted hydration is preflight-only');
  context.assert(nodeAcceptedContract.xscaler.networkDuringRender === false, 'accepted hydration forbids network during SSR');
  context.assert(nodeAcceptedContract.xscaler.remoteModuleExecuted === false, 'accepted hydration records zero remote-module execution');
  context.assert(nodeAcceptedContract.xscaler.count === 1 && nodeAcceptedContract.xscaler.preflights.length === 1, 'accepted hydration emits exactly one preflight record');
  context.assert(
    nodeAcceptedContract.xscaler.preflights[0].requestId === accepted.requestId
      && nodeAcceptedContract.xscaler.preflights[0].accepted === true,
    'accepted hydration preserves preflight identity and decision'
  );
  assertDeepParity(context, preflightHint(nodeAccepted), preflightHint(php.accepted), 'accepted Node/PHP head hints are identical');

  const nodeRejectedContract = hydrationContract(nodeRejected);
  const phpRejectedContract = hydrationContract(php.rejected);
  assertDeepParity(context, nodeRejectedContract, phpRejectedContract, 'rejected Node/PHP hydration contracts are identical');
  context.assert(nodeRejected.ok === true && php.rejected.ok === true, 'a schema-valid rejected preflight remains valid SSR fallback metadata');
  context.assert(nodeRejectedContract.xscaler.count === 1 && nodeRejectedContract.xscaler.preflights[0].accepted === false, 'rejected preflight is retained without executing a remote module');
  context.assert(nodeRejectedContract.xscaler.preflights[0].rejection.code === denied.rejection.code, 'rejected hydration preserves the declared rejection reason');
  assertDeepParity(context, preflightHint(nodeRejected), preflightHint(php.rejected), 'rejected Node/PHP head hints are identical');

  const nodeInvalidContract = hydrationContract(nodeInvalid);
  const phpInvalidContract = hydrationContract(php.invalid);
  assertDeepParity(context, nodeInvalidContract, phpInvalidContract, 'blocked Node/PHP hydration contracts are identical');
  context.assert(nodeInvalid.ok === false && php.invalid.ok === false, 'all contradictory XScaler contracts block both SSR renders');
  context.assert(nodeInvalid.status === 'blocked' && php.invalid.status === 'blocked', 'invalid contract fixtures produce blocked status in both runtimes');
  context.assert(nodeInvalidContract.xscaler.count === 0 && nodeInvalidContract.xscaler.preflights.length === 0, 'invalid preflight is excluded from hydration in both runtimes');
  context.assert(nodeInvalid.diagnostics.some((entry) => entry.code === NODE_INVALID_DIAGNOSTIC && entry.severity === 'error'), 'Node emits a blocking XScaler SSR diagnostic');
  context.assert(php.invalid.diagnostics.some((entry) => entry.code === PHP_INVALID_DIAGNOSTIC && entry.severity === 'error'), 'PHP emits a blocking XScaler SSR diagnostic');
  context.assert(nodeInvalid.diagnostics.filter((entry) => entry.code === NODE_INVALID_DIAGNOSTIC).length === invalids.length, 'Node rejects every forged or contradictory XScaler contract');
  context.assert(php.invalid.diagnostics.filter((entry) => entry.code === PHP_INVALID_DIAGNOSTIC).length === invalids.length, 'PHP rejects every forged or contradictory XScaler contract');

  context.assert(nodeNetworkCalls === 0 && php.networkCalls === 0, 'accepted, rejected and invalid SSR paths perform no host fetch calls');
  context.assert(!nodeAccepted.html.includes(accepted.remoteSurfacePlan.origin) && !php.accepted.html.includes(accepted.remoteSurfacePlan.origin), 'SSR HTML contains no remote origin or registration module');
  context.assert(!nodeInvalid.html.includes(accepted.remoteSurfacePlan.origin) && !php.invalid.html.includes(accepted.remoteSurfacePlan.origin), 'blocked SSR HTML contains no remote execution material');
  context.assert(
    nodeAcceptedContract.xscaler.preflights[0].remoteSurfacePlan.runtimeBoundary.remoteRuntimeExecution === false
      && nodeAcceptedContract.xscaler.preflights[0].atc.runtimeBoundary.remoteRuntimeExecution === false,
    'hydration preserves no-remote-execution boundaries'
  );

  return context.result({
    runtimePair: ['node', 'php'],
    acceptedFixture: ACCEPTED_PREFLIGHT_PATH,
    rejectedFixture: NETWORK_DENIED_PREFLIGHT_PATH,
    invalidFixtureCount: invalids.length
  });
}

function printRmtXScalerSsrHydrationParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Node/PHP XScaler SSR Hydration-Parität erfolgreich.',
    failureTitle: 'RMT Node/PHP XScaler SSR Hydration-Parität fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtXScalerSsrHydrationParitySuite().then((result) => {
    printRmtXScalerSsrHydrationParityReport(result);
    process.exitCode = result.ok ? 0 : 1;
  }).catch((error) => {
    process.stderr.write(`${error && error.stack || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  printRmtXScalerSsrHydrationParityReport,
  runRmtXScalerSsrHydrationParitySuite
};
