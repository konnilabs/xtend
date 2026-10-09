#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { check, loadInventory } = require('./inventory.cjs');
const { selectRelease } = require('./selection.cjs');
const { verifyArtifact } = require('./artifact.cjs');
const { publishRelease } = require('./publish.cjs');
const { npmAdapters, runNpm } = require('./npm.cjs');
function assertPublishInput(env) {
  check(env.XTEND_RELEASE_PUBLISH === 'true', 'Actual publish requires explicit workflow input publish_to_npm=true');
  check(env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY === 'konnilabs/xtend' &&
    /^konnilabs\/xtend\/\.github\/workflows\/xtend-default-gates\.yml@refs\/(heads\/main|tags\/[^\s]+)$/.test(env.GITHUB_WORKFLOW_REF || '') &&
    env.XTEND_RELEASE_ENVIRONMENT === 'npm-publish' && env.ACTIONS_ID_TOKEN_REQUEST_URL && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
    'Publish requires the existing trusted workflow identity and npm-publish environment');
  check(env.XTEND_RELEASE_GATES_VERIFIED === 'true', 'All existing release gates must have verified evidence for this source/artifact');
}
async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, strict: true, options: {
    artifact: { type: 'string' }, 'manifest-integrity': { type: 'string' }, 'source-sha': { type: 'string' },
    'npm-cli': { type: 'string' }, ledger: { type: 'string' }, 'prerelease-tag': { type: 'string', default: 'next' },
    groups: { type: 'string' }, packages: { type: 'string' },
    execute: { type: 'boolean', default: false }, promote: { type: 'boolean', default: false },
    'dist-tags-authorized': { type: 'boolean', default: false }
  } });
  const rootDir = path.resolve(__dirname, '../..'), command = positionals[0] || 'inventory';
  check(positionals.length <= 1 && ['inventory', 'verify', 'preflight', 'publish'].includes(command), 'Commands: inventory, verify, preflight, publish');
  check(!values.execute || command === 'publish', '--execute only applies to publish');
  check(!values.promote || values.execute, '--promote requires --execute');
  const selection = values.groups !== undefined || values.packages !== undefined
    ? { groups: values.groups?.split(',') || [], packages: values.packages?.split(',') || [] } : undefined;
  if (command === 'inventory') {
    const inventory = loadInventory(rootDir);
    console.log(JSON.stringify({ ...inventory, releaseScope: selectRelease(inventory, selection),
      packages: inventory.packages.map(({ manifest, ...entry }) => entry) }, null, 2)); return;
  }
  const artifact = await verifyArtifact({ directory: values.artifact, manifestIntegrity: values['manifest-integrity'],
    sourceSha: values['source-sha'], rootDir, selection });
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim();
  check(head === artifact.sourceSha, 'Checkout must match immutable artifact source SHA');
  if (command === 'verify') { console.log(JSON.stringify({ ok: true, sourceSha: head, tarballSetIntegrity: artifact.tarballSetIntegrity })); return; }
  if (values.execute) {
    assertPublishInput(process.env);
    check(execFileSync('git', ['status', '--porcelain'], { cwd: rootDir, encoding: 'utf8' }).trim() === '', 'Publish requires clean source checkout');
    // Activation stays closed until reviewed integration can verify complete gate
    // evidence and Sigstore authenticity, rather than accepting environment flags.
    throw Error('Workflow activation deferred: reviewed migration checkpoint and gate/Sigstore integration required');
  }
  const npmCli = values['npm-cli'] || process.env.npm_execpath;
  const actual = await runNpm(npmCli, ['--version'], rootDir);
  check(actual.status === 0 && actual.stdout.trim() === artifact.toolchain.npm &&
    process.versions.node === artifact.toolchain.node, 'Preflight must use the committed Node/npm pins');
  const adapters = npmAdapters({ npmCli, cwd: rootDir });
  const ledger = await publishRelease({ artifact, ...adapters,
    ledgerFile: path.resolve(values.ledger || path.join(rootDir, '.xtend-test-results/npm-release-ledger.json')),
    prereleaseTag: values['prerelease-tag'] });
  console.log(JSON.stringify(ledger, null, 2));
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { main, assertPublishInput };
