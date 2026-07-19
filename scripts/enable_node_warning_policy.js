#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const laneIndex = process.argv.indexOf('--lane');
const lane = laneIndex >= 0 && process.argv[laneIndex + 1]
  ? process.argv[laneIndex + 1].replace(/[^a-zA-Z0-9_.-]/gu, '')
  : 'local';
const report = `.xtend-test-results/runtime/xtend-node-warnings-${lane}.jsonl`;
const preload = path.resolve(rootDir, 'scripts/node_warning_policy.cjs').replaceAll(path.sep, '/');
const nodeOptions = `--trace-warnings --trace-deprecation --require=${preload}`;
const githubEnv = process.env.GITHUB_ENV;

if (!githubEnv) {
  process.stderr.write('GITHUB_ENV is required so the warning policy can be enabled for subsequent CI steps.\n');
  process.exitCode = 1;
} else {
  fs.appendFileSync(githubEnv, [
    `NODE_OPTIONS=${nodeOptions}`,
    'XTEND_NODE_WARNING_POLICY=project-error',
    `XTEND_NODE_WARNING_REPORT=${report}`,
    ''
  ].join('\n'));
  process.stdout.write(`${JSON.stringify({
    schema: 'xtend.node-warning-policy-activation.v1',
    lane,
    policy: 'project-error',
    report,
    thirdPartyWarnings: 'reported-non-blocking'
  })}\n`);
}
