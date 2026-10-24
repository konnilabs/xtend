'use strict';
// Private repository release policy, not a dispatch-selectable bypass or public API.
const PROFILE = 'xtend.npm.core-only.v1';
const CANDIDATES = 'xtend.product-candidates.v2';
const ARTIFACT = 'xtend.release.artifact.v2';
const EVIDENCE = 'xtend.release.core-evidence.v1';
const lanes = Object.freeze(['24.18.0', '26.5.0']);
const gates = Object.freeze(['full-release-gates', 'rmt-vnext-primitive-gates', 'package-structure',
  'conditional-network-evidence', 'node-native-toolchain-smoke', 'xtend-mcp-vscode-smoke', 'laravel-release-gates']);
function coreContract(value, schema) {
  if (value?.schema !== schema || value.profile !== PROFILE ||
    ['demoSha', 'demoRepository', 'productEvidence', 'unionEvidence'].some(key => Object.hasOwn(value, key)))
    throw Error('Exact Core contract required; legacy/mixed evidence is forbidden');
  return value;
}
module.exports = { PROFILE, CANDIDATES, ARTIFACT, EVIDENCE, lanes, gates, coreContract };
