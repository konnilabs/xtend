#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const testRoot = path.join(packageRoot, 'tests');
const packageManifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const knowledgeManifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'generated', 'knowledge-manifest.json'), 'utf8'));
const outputArgument = process.argv.indexOf('--report');
const outputPath = path.resolve(
  repoRoot,
  outputArgument >= 0 && process.argv[outputArgument + 1]
    ? process.argv[outputArgument + 1]
    : '.xtend-test-results/xtend-mcp-gate-report.json'
);

function execute(id, label, args) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
    timeout: 180000
  });
  const ok = !result.error && result.status === 0;
  return {
    id,
    label,
    ok,
    status: ok ? 'passed' : 'failed',
    exitCode: Number.isInteger(result.status) ? result.status : null,
    signal: result.signal || null,
    error: result.error ? result.error.message : null,
    startedAt,
    durationMs: Date.now() - started
  };
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
const runtime = {
  id: 'node-runtime',
  label: 'Node.js runtime contract',
  ok: Number.isInteger(nodeMajor) && nodeMajor >= 24,
  status: Number.isInteger(nodeMajor) && nodeMajor >= 24 ? 'passed' : 'failed',
  required: '>=24',
  observed: process.versions.node
};
const testFiles = fs.readdirSync(testRoot)
  .filter((fileName) => fileName.endsWith('.test.mjs'))
  .sort()
  .map((fileName) => path.relative(repoRoot, path.join(testRoot, fileName)));
const steps = [runtime];

if (runtime.ok) {
  steps.push(execute(
    'knowledge-drift',
    'Deterministic knowledge artifact drift check',
    [path.join(packageRoot, 'scripts', 'build-knowledge.mjs'), '--check']
  ));
  steps.push(execute(
    'mcp-contracts',
    'MCP contract, security, parity and integration tests',
    ['--test', ...testFiles]
  ));
}

const ok = steps.every((step) => step.ok === true);
const report = {
  schema: 'xtend.mcp.gate-report.v1',
  generatedAt: new Date().toISOString(),
  ok,
  status: ok ? 'passed' : 'failed',
  package: {
    name: packageManifest.name,
    version: packageManifest.version
  },
  runtime: {
    node: process.versions.node,
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
  knowledge: {
    schema: knowledgeManifest.schema,
    docs: knowledgeManifest.docs.count,
    docsArtifactSha256: knowledgeManifest.docs.artifactSha256,
    rmtKitVersion: knowledgeManifest.rmtKit.version
  },
  testFiles,
  steps
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  schema: report.schema,
  ok: report.ok,
  status: report.status,
  report: path.relative(repoRoot, outputPath),
  steps: report.steps.map((step) => ({ id: step.id, status: step.status }))
}, null, 2)}\n`);

if (!ok) process.exitCode = 1;
