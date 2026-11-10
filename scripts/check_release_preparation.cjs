'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Development readiness: pending features are valid, stale contracts are not.
// Actual feature acceptance remains at the production preparation/publish gates.
const CHECKS = Object.freeze([
  ['scripts/generate_rmt_classic_contract.js', '--check'],
  ['development/rmtx-a01/inspect.cjs', '--check'],
  ['development/rmtx-a02/inspect.cjs', '--check'],
  ['development/rmtx-a02/url-history/inspect.cjs', '--check'],
  ['development/rmtx-a02/url-history/integration-inspect.cjs', '--check'],
  ['development/rmtx-a03/inspect.cjs', '--check'],
  ['development/rmtx-a03/graph-inspect.cjs', '--check'],
  ['development/rmtx-a03/budget-inspect.cjs', '--check'],
  ['development/rmtx-a03/capability-inspect.cjs', '--check'],
  ['scripts/sync_xtend_package_versions.js', '--check'],
  ['scripts/release/feature-scope.cjs', '--check-plan']
].map(command => Object.freeze(command)));

function runReleasePreparationChecks({ rootDir = path.resolve(__dirname, '..'), execute = spawnSync } = {}) {
  for (const command of CHECKS) {
    const result = execute(process.execPath, command, { cwd: rootDir, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status || 1;
  }
  return 0;
}
if (require.main === module) process.exitCode = runReleasePreparationChecks();
module.exports = { CHECKS, runReleasePreparationChecks };
