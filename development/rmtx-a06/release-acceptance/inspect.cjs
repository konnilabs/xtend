'use strict';
const path = require('node:path');
const { checkTargetMatrix } = require('./target-contract.cjs');

// A read-only plan check: no generated reports, runtime evaluation or grants.
function main(args = process.argv.slice(2)) {
  let rootDir = path.resolve(__dirname, '../../..');
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!['--check', '--json', '--root'].includes(arg) || seen.has(arg)) {
      console.error('Usage: node inspect.cjs [--check] [--json] [--root <repository>]'); return 1;
    }
    seen.add(arg);
    if (arg === '--root') {
      const next = args[++index];
      if (!next || next.startsWith('--')) { console.error('--root requires a repository path.'); return 1; }
      rootDir = path.resolve(next);
    }
  }
  const report = checkTargetMatrix({ rootDir });
  console.log(JSON.stringify(report, null, 2));
  return report.valid ? 0 : 1;
}
if (require.main === module) process.exitCode = main();
module.exports = { main };
