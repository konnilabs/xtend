'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Development readiness: pending features are valid, stale contracts are not.
// Actual feature acceptance remains at the production preparation/publish gates.
const CHECKS = Object.freeze([
  ['scripts/generate_rmt_classic_contract.js', '--check'],
  ['scripts/sync_rmt_compiler_contracts.cjs', '--check', '--json'],
  ['--test', 'tests/rmt-language/action-execution-lowering.test.cjs', 'tests/rmt-language/event-condition-guards.test.cjs', 'tests/rmt-language/action-backend-regressions.test.cjs', 'tests/rmt/renderer-structural-ownership.test.cjs'],
  ['--test', 'tests/rmt/surface-materialize-lifetime.test.cjs', 'tests/rmt/maraca-view-lifecycle.test.cjs', 'tests/maraca/native-surface-lifecycle.test.mjs'],
  ['--test', 'tests/rmt-language/backend-ast-result.test.cjs', 'tests/rmt-language/rmtx-frontend.test.cjs', 'tests/rmt-language/rmtx-maraca-integration.test.cjs'],
  ['development/rmtx-a06/frontend/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-operator-profiles.test.cjs', 'tests/rmt-language/rmtx-selector-dependencies.test.cjs', 'tests/rmt-language/rmtx-selectors.test.cjs'],
  ['development/rmtx-a06/selector-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-host-scopes.test.cjs', 'tests/rmt-language/rmtx-profile3-backend.test.cjs', 'tests/rmt-language/rmtx-maraca-host-scopes.test.cjs'],
  ['development/rmtx-a06/keyed-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-extended-operators.test.cjs', 'tests/rmt-language/rmtx-orchestration.test.cjs', 'tests/rmt-language/rmtx-inline-components.test.cjs', 'tests/rmt-language/action-input-contract.test.cjs', 'tests/xtensions/projected-state-binding.test.cjs', 'tests/xtensions/projected-url-state.test.cjs', 'tests/xtensions/platform-projection-profile.test.cjs', 'tests/xtensions/projected-xrouter-url-state.test.cjs'],
  ['development/rmtx-a06/orchestration-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-native-view.test.cjs', 'tests/xtensions/native-view-projection.test.cjs', 'tests/xtensions/native-state-binding.test.cjs', 'tests/xtensions/native-url-state.test.cjs', 'tests/xtensions/native-composition-profile.test.cjs', 'tests/rmt/renderer-preflight.test.cjs', 'tests/maraca/rmtx-native-boundaries.test.mjs'],
  ['development/rmtx-a06/native-view-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-lifecycle.test.cjs', 'tests/xtensions/native-lifecycle-protocol.test.cjs', 'tests/xtensions/lifecycle-composition-profile.test.cjs', 'tests/xtensions/lifecycle-browser-profile.test.cjs', 'tests/maraca/rmtx-lifecycle.test.mjs'],
  ['development/rmtx-a06/lifecycle-profile/inspect.cjs', '--check'],
  ['--test', '--test-concurrency=1', 'tests/rmt-language/rmtx-native-orchestration.test.cjs', 'tests/xtensions/native-orchestrated-contracts.test.cjs', 'tests/xtensions/native-orchestrated-prewarm.test.cjs', 'tests/xtensions/native-surface-projection.test.cjs', 'tests/maraca/rmtx-surface-graph.test.mjs', 'tests/maraca/rmtx-orchestration.test.mjs'],
  ['development/rmtx-a06/native-components/generate.cjs', '--check'],
  ['development/rmtx-a06/native-orchestration-profile/inspect.cjs', '--check'],
  ['development/rmtx-a06/native-component-catalog/generate.cjs', '--check'],
  ['--test', '--test-concurrency=1', 'tests/rmt-language/native-component-catalog-v2.test.cjs', 'tests/rmt-language/native-component-catalog-projection.test.cjs', 'tests/rmt-language/native-component-catalog-types.test.cjs', 'tests/rmt-language/native-managed-renderer.test.mjs'],
  ['--test', '--test-concurrency=1', 'tests/components/native-managed-ui.test.mjs', 'tests/components/native-platform-services.test.mjs', 'tests/components/component-source.test.cjs', 'tests/components/native-demo-reference.test.mjs', 'tests/maraca/rmtx-managed.test.mjs', 'tests/maraca/native-platform-managed.test.mjs', 'tests/maraca/native-private-cores.test.mjs', 'tests/maraca/native-data-literal.test.cjs'],
  ['development/rmtx-a01/inspect.cjs', '--check'],
  ['development/rmtx-a02/inspect.cjs', '--check'],
  ['development/rmtx-a02/url-history/inspect.cjs', '--check'],
  ['development/rmtx-a02/url-history/integration-inspect.cjs', '--check'],
  ['development/rmtx-a03/inspect.cjs', '--check'],
  ['development/rmtx-a03/graph-inspect.cjs', '--check'],
  ['development/rmtx-a03/budget-inspect.cjs', '--check'],
  ['development/rmtx-a03/capability-inspect.cjs', '--check'],
  ['development/rmtx-a04/inspect.cjs', '--check'],
  ['development/rmtx-a04/integration-inspect.cjs', '--check'],
  ['development/rmtx-a04/graph-inspect.cjs', '--check'],
  ['development/rmtx-a04/loading-inspect.cjs', '--check'],
  ['development/rmtx-a04/peer-inspect.cjs', '--check'],
  ['development/rmtx-a04/delivery-inspect.cjs', '--check'],
  ['development/rmtx-a04/integrity-inspect.cjs', '--check'],
  ['development/rmtx-a04/runtime-inspect.cjs', '--check'],
  ['development/rmtx-a04/updates-inspect.cjs', '--check'],
  ['development/rmtx-a05/inspect.cjs', '--check'],
  ['development/rmtx-a06/two-host-inspect.cjs', '--check'],
  ['--test', 'tests/xtensions/component-interface.test.cjs'],
    ['development/rmtx-a06/automatic-inspect.cjs', '--check'],
    ['--test', 'tests/xtensions/component-composition.test.cjs'],
    ['development/rmtx-a06/scoped-inspect.cjs', '--check'],
    ['--test', 'tests/xtensions/scoped-components.test.cjs'],
  ['scripts/sync_xtend_package_versions.js', '--check'],
  ['--test', '--test-concurrency=1', 'tests/rmt-language/rmt-project.test.cjs', 'tests/rmt-language/rmtx-language-service.test.cjs', 'tests/rmt-language/rmtx-language-server.test.cjs', 'tests/rmt-language/rmtx-editor.test.cjs', 'tests/rmt-language/rmt-project-integrations.test.cjs'],
  ['scripts/release/feature-scope.cjs', '--check-plan']
].map(command => Object.freeze(command)));

function runReleasePreparationChecks({ rootDir = path.resolve(__dirname, '..'), execute = spawnSync } = {}) {
  for (const command of CHECKS) {
    const bounded = command[0] === '--test' && !command.some(value => value.startsWith('--test-concurrency='))
      ? ['--test-concurrency=1', ...command] : command;
    const result = execute(process.execPath, ['--max-old-space-size=1024', ...bounded], { cwd: rootDir, stdio: 'inherit', timeout:240000 });
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status || 1;
  }
  return 0;
}
if (require.main === module) process.exitCode = runReleasePreparationChecks();
module.exports = { CHECKS, runReleasePreparationChecks };
