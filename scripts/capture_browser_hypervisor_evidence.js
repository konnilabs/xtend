#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { listenXtendDevServer } = require('./serve_xtend_dev');
const {
  createEvidence,
  mergeEvidence,
  normalizeEngine,
  runFixture,
  validateEvidence
} = require('../tools/browser-hypervisor');

const DEFAULT_RUN_ID = 'NFM-OBS-2026-09-03';
const DEFAULT_FIXTURE = 'tests/browser/fixtures/observatory-adoption-lab.html';
const DEFAULT_RESULT_KEY = '__xtendObservatoryAdoptionLabResult';

function parseArgs(argv) {
  const options = { inputs: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--engine' && next) { options.engine = next; index += 1; }
    else if (arg === '--run-id' && next) { options.runId = next; index += 1; }
    else if (arg === '--fixture' && next) { options.fixture = next; index += 1; }
    else if (arg === '--result-key' && next) { options.resultKey = next; index += 1; }
    else if (arg === '--output' && next) { options.output = next; index += 1; }
    else if (arg === '--webdriver-url' && next) { options.webDriverUrl = next; index += 1; }
    else if (arg === '--driver-path' && next) { options.driverPath = next; index += 1; }
    else if (arg === '--browser-name' && next) { options.browserName = next; index += 1; }
    else if (arg === '--browser-binary' && next) { options.browserBinary = next; index += 1; }
    else if (arg === '--timeout-ms' && next) { options.timeoutMs = Number(next); index += 1; }
    else if (arg === '--screenshot' && next) { options.screenshot = next; index += 1; }
    else if (arg === '--input' && next) { options.inputs.push(next); index += 1; }
    else if (arg === '--merge') options.merge = true;
  }
  return options;
}

function writeJson(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function capture(options, rootDir) {
  const engine = normalizeEngine(options.engine || process.env.XTEND_BROWSER_HYPERVISOR_ENGINE);
  if (!engine) throw new Error('--engine is required for capture mode.');
  const runId = options.runId || process.env.XTEND_BROWSER_HYPERVISOR_RUN_ID || DEFAULT_RUN_ID;
  const fixture = options.fixture || DEFAULT_FIXTURE;
  const resultKey = options.resultKey || DEFAULT_RESULT_KEY;
  const fixtureText = fs.readFileSync(path.resolve(rootDir, fixture), 'utf8');
  let server = null;
  try {
    server = await listenXtendDevServer({ rootDir, port: 0, defaultPath: fixture });
    const execution = await runFixture({
      rootDir,
      engine,
      fixturePath: fixture,
      resultKey,
      url: `${server.origin}/${fixture}`,
      webDriverUrl: options.webDriverUrl || process.env.XTEND_BROWSER_HYPERVISOR_URL,
      driverPath: options.driverPath || process.env.XTEND_BROWSER_HYPERVISOR_DRIVER_PATH,
      browserName: options.browserName,
      browserBinary: options.browserBinary,
      timeoutMs: options.timeoutMs || 30000,
      screenshotPath: options.screenshot,
      accept: (result) => result && ['passed', 'unsupported-with-valid-fallback'].includes(result.status)
    });
    const status = execution.result.status === 'unsupported-with-valid-fallback'
      ? 'unsupported-with-valid-fallback'
      : 'passed';
    const evidence = createEvidence({
      runId,
      capturedAt: new Date().toISOString(),
      engine,
      browserName: execution.browserName,
      browserVersion: execution.browserVersion,
      driver: execution.driver,
      driverVersion: execution.driverVersion,
      platformName: execution.platformName,
      harness: fixture,
      harnessText: fixtureText,
      status,
      result: execution.result,
      checks: ['capability-present-or-absent', 'fallback', 'lifecycle-cleanup', 'product-regression'],
      metrics: execution.result.hydration || {},
      claimBoundary: 'version-bound-hypervisor-lab-not-browser-shipping-claim'
    });
    const errors = validateEvidence(evidence, { runId });
    if (errors.length) throw new Error(errors.join('; '));
    const output = path.resolve(rootDir, options.output || `.xtend-test-results/browser-hypervisor/${runId}/${engine}.json`);
    writeJson(output, evidence);
    return { output, evidence };
  } finally {
    if (server && server.server) await new Promise((resolve) => server.server.close(resolve));
  }
}

function merge(options, rootDir) {
  if (options.inputs.length === 0) throw new Error('At least one --input is required for merge mode.');
  const items = options.inputs.map((input) => JSON.parse(fs.readFileSync(path.resolve(rootDir, input), 'utf8')));
  const runId = options.runId || DEFAULT_RUN_ID;
  const matrix = mergeEvidence(items, { runId });
  if (matrix.status !== 'passed') throw new Error(matrix.errors.join('; '));
  const output = path.resolve(rootDir, options.output || `.xtend-test-results/browser-hypervisor/${runId}/matrix.json`);
  writeJson(output, matrix);
  return { output, evidence: matrix };
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const options = parseArgs(process.argv.slice(2));
  const result = options.merge ? merge(options, rootDir) : await capture(options, rootDir);
  process.stdout.write(`${JSON.stringify({ status: 'passed', output: path.relative(rootDir, result.output), schema: result.evidence.schema })}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { capture, merge, parseArgs };
