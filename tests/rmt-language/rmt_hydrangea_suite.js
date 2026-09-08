'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
function runRmtHydrangeaSuite({ rootDir = path.resolve(__dirname, '../..') } = {}) {
  const context = createSuiteContext('RMT JIT Hydrangea');
  for (const fixture of ['contracts.cjs', 'cache.cjs', 'browser.mjs', 'preview.cjs', 'transport.php']) {
    const file = path.join(rootDir, 'tests/performance/hydrangea', fixture);
    const php = fixture.endsWith('.php');
    const child = spawnSync(php ? 'php' : process.execPath, php ? [file, process.execPath] : [file], { cwd: rootDir, encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
    context.assert(child.status === 0, `Hydrangea ${fixture}: ${child.status === 0 ? child.stdout.trim() : (child.error || child.stderr || child.stdout)}`);
  }
  return context.result();
}
function printRmtHydrangeaReport(result) { printSuiteReport(result, { successTitle: 'Hydrangea checks passed.', failureTitle: 'Hydrangea checks failed:' }); }
module.exports = { runRmtHydrangeaSuite, printRmtHydrangeaReport };
