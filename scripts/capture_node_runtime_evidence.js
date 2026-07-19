#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, '.xtend-test-results', 'runtime');
const SCHEMA = 'xtend.ci.node-runtime-evidence.v1';

const RUNTIME_LANES = Object.freeze({
  'node-24-lts': Object.freeze({
    node: '24.18.0',
    npm: '11.17.0',
    role: 'lts'
  }),
  'node-26-current': Object.freeze({
    node: '26.5.0',
    npm: '11.17.0',
    role: 'current'
  }),
  'node-24-publish': Object.freeze({
    node: '24.18.0',
    npm: '11.17.0',
    role: 'publish'
  })
});

function parseArgs(argv) {
  const options = {
    lane: null,
    output: null
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--lane') options.lane = argv[++index] || null;
    else if (argument.startsWith('--lane=')) options.lane = argument.slice('--lane='.length);
    else if (argument === '--out') options.output = argv[++index] || null;
    else if (argument.startsWith('--out=')) options.output = argument.slice('--out='.length);
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function npmVersion() {
  const result = spawnSync('npm', ['--version'], {
    cwd: ROOT_DIR,
    encoding: 'utf8'
  });
  const succeeded = !result.error && result.status === 0;
  return {
    version: succeeded ? String(result.stdout || '').trim() : null,
    status: Number.isInteger(result.status) ? result.status : null,
    error: result.error
      ? {
          code: result.error.code || null,
          message: result.error.message
        }
      : null,
    stderr: String(result.stderr || '').trim() || null
  };
}

function isNumericVersion(value) {
  return typeof value === 'string' && /^[0-9]+$/u.test(value);
}

function createEvidence(laneId) {
  const expected = RUNTIME_LANES[laneId] || null;
  const npm = npmVersion();
  const observed = {
    node: process.versions.node || null,
    npm: npm.version,
    v8: process.versions['v8'] || null,
    openssl: process.versions.openssl || null,
    modules: process.versions.modules || null,
    napi: process.versions.napi || null
  };
  const checks = [
    {
      id: 'known-runtime-lane',
      ok: expected !== null,
      expected: Object.keys(RUNTIME_LANES),
      observed: laneId
    },
    {
      id: 'exact-node-version',
      ok: Boolean(expected) && observed.node === expected.node,
      expected: expected ? expected.node : null,
      observed: observed.node
    },
    {
      id: 'exact-npm-version',
      ok: Boolean(expected) && npm.status === 0 && observed.npm === expected.npm,
      expected: expected ? expected.npm : null,
      observed: observed.npm
    },
    {
      id: 'v8-version-present',
      ok: typeof observed.v8 === 'string' && observed.v8.length > 0,
      expected: 'non-empty',
      observed: observed.v8
    },
    {
      id: 'openssl-version-present',
      ok: typeof observed.openssl === 'string' && observed.openssl.length > 0,
      expected: 'non-empty',
      observed: observed.openssl
    },
    {
      id: 'modules-abi-present',
      ok: isNumericVersion(observed.modules),
      expected: 'numeric-string',
      observed: observed.modules
    },
    {
      id: 'napi-version-present',
      ok: isNumericVersion(observed.napi),
      expected: 'numeric-string',
      observed: observed.napi
    }
  ];
  const ok = checks.every((check) => check.ok === true);
  return {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    lane: laneId,
    role: expected ? expected.role : null,
    ok,
    status: ok ? 'passed' : 'failed',
    expected,
    observed,
    npmCommand: {
      status: npm.status,
      error: npm.error,
      stderr: npm.stderr
    },
    platform: {
      platform: process.platform,
      arch: process.arch
    },
    github: {
      workflow: process.env.GITHUB_WORKFLOW || null,
      job: process.env.GITHUB_JOB || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
      sha: process.env.GITHUB_SHA || null
    },
    checks
  };
}

function resolveOutputPath(options) {
  if (options.output) return path.resolve(ROOT_DIR, options.output);
  const safeLane = String(options.lane || 'unknown').replace(/[^a-z0-9._-]+/giu, '-');
  return path.join(DEFAULT_OUTPUT_DIR, `xtend-node-runtime-${safeLane}.json`);
}

function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
    return;
  }
  if (!options.lane) {
    process.stderr.write('Missing required --lane argument.\n');
    process.exitCode = 1;
    return;
  }
  const evidence = createEvidence(options.lane);
  const outputPath = resolveOutputPath(options);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    schema: evidence.schema,
    lane: evidence.lane,
    ok: evidence.ok,
    status: evidence.status,
    observed: evidence.observed,
    output: path.relative(ROOT_DIR, outputPath)
  }, null, 2)}\n`);
  if (!evidence.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  RUNTIME_LANES,
  SCHEMA,
  createEvidence,
  parseArgs,
  resolveOutputPath
};
