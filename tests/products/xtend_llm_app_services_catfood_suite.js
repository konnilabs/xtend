'use strict';

const fs = require('node:fs');
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

const PRODUCT_ROOT = 'products/xtend-llm';
const PRODUCT_PACKAGE = `${PRODUCT_ROOT}/package.json`;
const CATFOOD_GATE = `${PRODUCT_ROOT}/tests/app-services-catfood-gate.mjs`;
const REPORT_PATH = `${PRODUCT_ROOT}/.xtend-llm-results/app-services-catfood.json`;
const REPORT_SCHEMA = 'xtend-llm.app-services-catfood-report.v1';

function runXtendLlmAppServicesCatfoodSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtend-llm-app-services-catfood',
    label: 'XTend LLM AppServices Catfood'
  });
  const packagePath = resolveRepoPath(PRODUCT_PACKAGE, rootDir);
  const gatePath = resolveRepoPath(CATFOOD_GATE, rootDir);
  const reportPath = resolveRepoPath(REPORT_PATH, rootDir);

  context.assert(fs.existsSync(packagePath), 'XTend LLM product package exists');
  context.assert(fs.existsSync(gatePath), 'XTend LLM AppServices catfood gate exists');

  const productManifest = readJson(PRODUCT_PACKAGE, rootDir);
  context.assert(
    productManifest.scripts && productManifest.scripts['test:catfood'] === 'node scripts/rmt-build.mjs --profile production --quiet && node scripts/run-layout-smoke.mjs && npm run test:catfood:check',
    'product test:catfood script owns production build, browser source-to-sea smoke, and evidence check'
  );

  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const defaultWorkflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  const smokeRunner = readText(`${PRODUCT_ROOT}/scripts/run-layout-smoke.mjs`, rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.maracaAppServices;
  const gateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;
  context.assert(runner.includes("id: 'xtend-llm-app-services-catfood'"), 'central runner registers XTend LLM product catfood');
  context.assert(packageManifest.scripts['test:maraca-app-services'].includes('xtend-llm-app-services-catfood'), 'AppServices aggregate includes XTend LLM product catfood');
  context.assert(packageManifest.scripts['test:pr'].includes('xtend-llm-app-services-catfood') && packageManifest.scripts['test:release:full'].includes('xtend-llm-app-services-catfood'), 'PR and release scripts execute product catfood');
  context.assert(gateMatrix.prFastGate.suites.includes('xtend-llm-app-services-catfood') && gateMatrix.fullReleaseGate.suites.includes('xtend-llm-app-services-catfood'), 'CI matrices require product catfood');
  context.assert(metadata && metadata.catfoodSuiteId === 'xtend-llm-app-services-catfood' && metadata.catfoodReportArtifact === REPORT_PATH, 'AppServices metadata owns the XMS-11 product evidence');
  context.assert(defaultWorkflow.includes(REPORT_PATH) && nightlyWorkflow.includes(REPORT_PATH), 'default and nightly workflows retain the product-owned catfood artifact');
  context.assert(defaultWorkflow.includes('npm ci --prefix products/xtend-llm') && nightlyWorkflow.includes('npm ci --prefix products/xtend-llm'), 'default and nightly workflows install the pinned browser-catfood dependency');
  context.assert(smokeRunner.indexOf("'app-services-catfood.json'") > 0 && smokeRunner.indexOf('fs.rmSync') < smokeRunner.indexOf("require('electron')"), 'browser catfood removes stale smoke and aggregate evidence before Electron resolution');

  fs.rmSync(reportPath, { force: true });
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const execution = spawnSync(command, ['run', 'test:catfood', '--prefix', PRODUCT_ROOT], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  const output = [execution.stdout, execution.stderr].filter(Boolean).join('\n').trim();
  if (execution.error) {
    context.fail(`product catfood command executes: ${execution.error.message}`);
  } else {
    context.assert(execution.status === 0, `product catfood command exits successfully${output ? ` (${output})` : ''}`);
  }

  context.assert(fs.existsSync(reportPath), 'product catfood command emits its JSON evidence artifact');
  let report = null;
  if (fs.existsSync(reportPath)) {
    report = readJson(REPORT_PATH, rootDir);
    context.assert(report.schema === REPORT_SCHEMA, 'catfood evidence uses the versioned report schema');
    context.assert(report.ok === true && report.status === 'passed', 'catfood evidence records a passing product build');
    context.assert(Array.isArray(report.checks) && report.checks.length > 0 && report.checks.every((entry) => entry.ok === true), 'all product-level AppServices checks pass');
    context.assert(report.serviceCoverage && report.serviceCoverage.demands === report.serviceCoverage.implementations, 'product demand and implementation coverage remain exact');
    context.assert(report.build && report.build.profile === 'production' && report.build.appServiceWithinBudget === true, 'product evidence locks the production profile and AppServices budget');
    context.assert(report.smoke && report.smoke.status === 'passed' && report.smoke.sourceToSea && report.smoke.screenshot && report.smoke.screenshot.bytes > 0, 'product evidence requires fresh browser source-to-sea and screenshot proof');
  }

  return context.result({
    report,
    reportPath: REPORT_PATH,
    productCommand: 'npm run test:catfood --prefix products/xtend-llm'
  });
}

function printXtendLlmAppServicesCatfoodReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend LLM AppServices Catfood erfolgreich.',
    failureTitle: 'XTend LLM AppServices Catfood fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXtendLlmAppServicesCatfoodSuite();
  printXtendLlmAppServicesCatfoodReport(result);
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = {
  printXtendLlmAppServicesCatfoodReport,
  runXtendLlmAppServicesCatfoodSuite
};
