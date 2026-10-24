'use strict';
const fs = require('node:fs');
// This subset is for PR development feedback only. The release gate set and
// authenticated browser proof remain defined by scripts/release/*.
const required = Object.freeze(['core-source-artifact', 'pr-fast-gates', 'rmt-vnext-primitive-gates',
  'release-prepare', 'core-installed-consumers', 'package-structure',
  'node-native-toolchain-smoke', 'xtend-mcp-vscode-smoke']);
function evaluate(needs) {
  if (!needs || typeof needs !== 'object' || Array.isArray(needs)) throw Error('GitHub needs object required');
  const checks = required.map(id => ({id, status:needs[id]?.result || 'not-provided'}));
  return {status:checks.every(row => row.status === 'success') ? 'passed' : 'failed', checks,
    scope:'Core / Node / RMT development checks only', browserSecurityEvidence:'not-evaluated',
    releaseDecision:'not-evaluated'};
}
if (require.main === module) {
  const result = evaluate(JSON.parse(process.env.XTEND_DEVELOPMENT_NEEDS || 'null'));
  const text = '## Core / Node / RMT development checks\n\n' +
    result.checks.map(row => `- ${row.id}: ${row.status}`).join('\n') +
    '\n\nBrowser security is a separate required check. This result is not browser coverage or release approval.\n';
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === 'passed' ? 0 : 1;
}
module.exports = {required, evaluate};
