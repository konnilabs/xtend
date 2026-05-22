#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  syntaxCheckFile
} = require('../tests/utils/process');

const rootDir = path.resolve(__dirname, '..');
const defaultFiles = [
  'xtendrmt/rmt-dom-descriptor-renderer.js',
  'xtendrmt/rmt-state-selector-runtime.js',
  'xtendrmt/rmt-action-effect-runtime.js',
  'xtendrmt/rmt-event-routing-runtime.js',
  'xtendrmt/rmt-surface-resource-graph-runtime.js',
  'xtendrmt/rmt-native-shell-runtime.js',
  'components/xplayer.js',
  'tools/rmt-language/app-platform-tooling.js',
  'scripts/run_xtend_tests.js'
];

const args = process.argv.slice(2);
const json = args.includes('--json');
const requestedFiles = args.filter((entry) => entry !== '--json');
const files = (requestedFiles.length ? requestedFiles : defaultFiles)
  .map((entry) => entry.replace(/\\/g, '/'))
  .filter((entry) => fs.existsSync(path.join(rootDir, entry)));

const results = files.map((filePath) => ({
  filePath,
  ...syntaxCheckFile(filePath, { rootDir, extension: '.js' })
}));
const failed = results.filter((entry) => !entry.ok);
const report = {
  schema: 'xtend.syntax-check-report.v1',
  ok: failed.length === 0,
  checkedCount: results.length,
  failedCount: failed.length,
  results: results.map((entry) => ({
    filePath: entry.filePath,
    ok: entry.ok,
    message: entry.message
  }))
};

if (json) {
  console.log(`${JSON.stringify(report, null, 2)}\n`);
} else if (failed.length > 0) {
  console.error('Syntax check failed:\n');
  failed.forEach((entry) => {
    console.error(`- ${entry.filePath}: ${entry.message}`);
  });
} else {
  console.log(`Syntax check passed for ${results.length} files.`);
}

if (!report.ok) process.exit(1);
