const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  XSCALER_CAPABILITY_MISMATCH_CODE,
  XSCALER_FALLBACK_MISSING_CODE,
  XSCALER_INTEGRITY_MISSING_CODE,
  XSCALER_ORIGIN_BLOCKED_CODE,
  XSCALER_SSR_NETWORK_DENIED_CODE,
  XSCALER_XTENSION_DENIED_CODE,
  createXScalerPreflightRequest,
  createXScalerRemoteSurfacePlan,
  evaluateXScalerPreflight
} = require('../../xscaler/protocol');

const XSCALER_PHP_PARITY_SUITE_SCHEMA = 'xtend.xscaler.php-preflight-parity-suite.v1';
const PHP_EVALUATOR = 'xscaler/xscaler-preflight.php';

function baseRequest(overrides = {}) {
  return createXScalerPreflightRequest({
    requestId: 'xscaler-parity',
    surface: 'checkout.cart',
    capabilities: ['remote-surface-plan', 'ssr-compatible', 'xtension-deployment'],
    constraints: { allowNetworkDuringSsr: false },
    ...overrides
  });
}

function basePlan(overrides = {}) {
  return createXScalerRemoteSurfacePlan({
    surface: 'checkout.cart',
    surfaceId: 'remoteSurface:checkout.cart',
    owner: 'checkout-platform',
    origin: 'https://cdn.xtend.example',
    integrity: { algorithm: 'sha256', digest: 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' },
    fallbackSurface: 'checkout.cart.fallback',
    lanes: [{ lane: 'visible', target: 'shell.slot:checkout' }],
    ssr: { mode: 'preflight-only', networkDuringRender: false },
    ...overrides
  });
}

function parityCases() {
  return [
    {
      id: 'accepted',
      expectedCode: null,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan(),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
      }
    },
    {
      id: 'origin-blocked',
      expectedCode: XSCALER_ORIGIN_BLOCKED_CODE,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan(),
        hostCapabilities: { allowedOrigins: ['https://blocked.example'] }
      }
    },
    {
      id: 'integrity-missing',
      expectedCode: XSCALER_INTEGRITY_MISSING_CODE,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan({ integrity: { algorithm: 'sha256', digest: '' } }),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
      }
    },
    {
      id: 'ssr-network-denied',
      expectedCode: XSCALER_SSR_NETWORK_DENIED_CODE,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan({ ssr: { mode: 'preflight-only', networkDuringRender: true } }),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
      }
    },
    {
      id: 'fallback-missing',
      expectedCode: XSCALER_FALLBACK_MISSING_CODE,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan({ fallbackSurface: '' }),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
      }
    },
    {
      id: 'xtension-denied',
      expectedCode: XSCALER_XTENSION_DENIED_CODE,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan(),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'], allowXtensionDeployment: false }
      }
    },
    {
      id: 'capability-mismatch',
      expectedCode: XSCALER_CAPABILITY_MISMATCH_CODE,
      input: {
        request: baseRequest({ capabilities: ['ssr-compatible'] }),
        remoteSurfacePlan: basePlan(),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] }
      }
    },
    {
      id: 'security-report-blocked',
      expectedCode: XSCALER_ORIGIN_BLOCKED_CODE,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan(),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] },
        remoteSecurityReport: { diagnostics: [{ code: 'remote.blocked', severity: 'error', message: 'blocked' }] }
      }
    },
    {
      id: 'degradation-report-blocked',
      expectedCode: XSCALER_FALLBACK_MISSING_CODE,
      input: {
        request: baseRequest(),
        remoteSurfacePlan: basePlan(),
        hostCapabilities: { allowedOrigins: ['https://cdn.xtend.example'] },
        degradationReport: { diagnostics: [{ code: 'fallback.blocked', status: 'blocked', severity: 'warning', message: 'blocked' }] }
      }
    }
  ];
}

function phpSyntax(rootDir) {
  return spawnSync('php', ['-l', resolveRepoPath(PHP_EVALUATOR, rootDir)], {
    cwd: rootDir,
    encoding: 'utf8'
  });
}

function evaluateWithPhp(rootDir, cases) {
  const payload = Buffer.from(JSON.stringify(cases.map((entry) => entry.input))).toString('base64');
  const evaluatorPath = resolveRepoPath(PHP_EVALUATOR, rootDir);
  const code = [
    `require ${JSON.stringify(evaluatorPath)};`,
    `$inputs = json_decode(base64_decode(${JSON.stringify(payload)}), true);`,
    '$results = [];',
    'foreach ($inputs as $input) { $results[] = evaluateXScalerPreflight($input); }',
    'echo json_encode($results, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);'
  ].join(' ');
  const result = spawnSync('php', ['-d', 'variables_order=EGPCS', '-r', code], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `PHP exited ${result.status}`).trim());
  }
  return JSON.parse(result.stdout);
}

function runXScalerPhpPreflightParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xscaler-php-preflight-parity', label: 'XScaler JS/PHP Preflight Parity' });
  context.assert(fs.existsSync(resolveRepoPath(PHP_EVALUATOR, rootDir)), 'standalone PHP preflight evaluator exists');
  const syntax = phpSyntax(rootDir);
  context.assert(syntax.status === 0, `PHP preflight evaluator syntax passes${syntax.status === 0 ? '' : ` (${syntax.stderr || syntax.stdout})`}`);
  const source = readText(PHP_EVALUATOR, rootDir);
  context.assert(source.includes('declare(strict_types=1)'), 'PHP evaluator enables strict types');
  context.assert(source.includes('function evaluateXScalerPreflight'), 'PHP evaluator exposes canonical evaluator');
  ['proc_open', 'shell_exec', 'passthru', 'rmt-php-ssr-adapter.php', 'docs/index.php'].forEach((forbidden) => {
    context.assert(!source.includes(forbidden), `PHP evaluator is independent of ${forbidden}`);
  });

  const cases = parityCases();
  const jsResults = cases.map((entry) => evaluateXScalerPreflight(entry.input));
  const phpResults = evaluateWithPhp(rootDir, cases);
  context.assert(phpResults.length === jsResults.length, 'PHP evaluates every JS parity case');
  cases.forEach((entry, index) => {
    const js = jsResults[index];
    const php = phpResults[index];
    context.assert(JSON.stringify(php) === JSON.stringify(js), `${entry.id} has byte-stable JS/PHP JSON parity`);
    context.assert((php.rejection && php.rejection.code || null) === entry.expectedCode, `${entry.id} reports expected decision code`);
    context.assert(php.remoteSurfacePlan.runtimeBoundary.kernelRemoteExecution === false, `${entry.id} preserves PHP kernel no-remote-execution boundary`);
  });

  return context.result({
    schema: XSCALER_PHP_PARITY_SUITE_SCHEMA,
    evaluator: PHP_EVALUATOR,
    caseCount: cases.length
  });
}

function printXScalerPhpPreflightParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'XScaler JS/PHP Preflight Parity Gate erfolgreich.',
    failureTitle: 'XScaler JS/PHP Preflight Parity Gate fehlgeschlagen:'
  });
}

if (require.main === module) {
  try {
    const result = runXScalerPhpPreflightParitySuite();
    printXScalerPhpPreflightParityReport(result);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

module.exports = {
  printXScalerPhpPreflightParityReport,
  runXScalerPhpPreflightParitySuite
};
