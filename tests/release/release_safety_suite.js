'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createSuiteContext } = require('../utils/assertions');
function runReleaseSafetySuite({ rootDir }) {
  const context = createSuiteContext({ id: 'release-safety', label: 'Scoped npm release safety' });
  const result = spawnSync(process.execPath, ['--test', '--test-isolation=none', '--test-reporter=tap', path.join(rootDir, 'tests/release/inventory.test.cjs'),
    path.join(rootDir, 'tests/release/artifact.test.cjs'), path.join(rootDir, 'tests/release/publish.test.cjs')],
    { cwd: rootDir, encoding: 'utf8', timeout: 240000, maxBuffer: 8 * 1024 * 1024 });
  console.log(result.stdout || '');
  context.assert(!result.error && result.status === 0, result.error?.message || result.stderr || 'Release security and regression tests pass');
  context.assert(Number(result.stdout?.match(/# tests (\d+)/)?.[1]) >= 50, 'Runner reports the executed individual assertions, not only file summaries');
  return context.result();
}
module.exports = { runReleaseSafetySuite };
