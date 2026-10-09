'use strict';
// Always-on local workflow attempt ledger, including failure before the sealed
// artifact can be downloaded. The authoritative per-package ledger is separate.
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { execute: { type: 'boolean', default: false },
    output: { type: 'string', default: '.xtend-test-results/npm-release-attempt.json' }, outcome: { type: 'string' } } });
  if (!values.execute) { console.log(JSON.stringify({ mode: 'dry-run', command: positionals[0] || 'status' })); return; }
  const file = path.resolve(values.output);
  let ledger;
  if (positionals[0] === 'init') {
    const root = path.resolve(__dirname, '../..'), inventory = require('./inventory.json');
    ledger = { schema: 'xtend.release.attempt.v1', status: 'pending', sourceSha: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID,
      artifactId: process.env.RELEASE_ARTIFACT_ID, packages: inventory.packages.map(entry => ({ name: entry.name,
        version: JSON.parse(fs.readFileSync(path.join(root, entry.path, 'package.json'))).version, state: 'pending' })) };
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(ledger, null, 2) + '\n', { flag: 'wx' });
  } else if (positionals[0] === 'finish') {
    ledger = JSON.parse(fs.readFileSync(file)); ledger.status = values.outcome === 'success' ? 'complete' : 'failed';
    const resultFile = path.join(path.dirname(file), 'npm-release-ledger.json');
    if (fs.existsSync(resultFile)) {
      const result = JSON.parse(fs.readFileSync(resultFile));
      if (result.schema !== 'xtend.release.ledger.v1' || result.sourceSha !== ledger.sourceSha) throw Error('Authoritative result ledger identity mismatch');
      ledger.manifestIntegrity = result.manifestIntegrity; ledger.packages = result.packages;
      ledger.registryDependencies = result.registryDependencies; ledger.resultStatus = result.status;
    }
    ledger.completedAt = new Date().toISOString(); fs.writeFileSync(file, JSON.stringify(ledger, null, 2) + '\n');
  } else throw Error('Commands: init, finish; default is read-only');
}
if (require.main === module) main();
module.exports = { main };
