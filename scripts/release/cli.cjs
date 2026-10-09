#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { check, loadInventory } = require('./inventory.cjs');
const { selectRelease, parseSelection } = require('./selection.cjs');
const { resolveNpmCli } = require('./toolchain.cjs');
const { verifyArtifact } = require('./artifact.cjs');
const { publishRelease } = require('./publish.cjs');
const { npmAdapters, runNpm } = require('./npm.cjs');
const { verifyCandidateBinding } = require('./candidates.cjs');
const { verifyNeeds } = require('./github.cjs');
function assertPublishInput(env) {
  check(env.XTEND_RELEASE_PUBLISH === 'true', 'Actual publish requires explicit workflow input publish_to_npm=true');
  check(env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY === 'konnilabs/xtend' &&
    env.GITHUB_WORKFLOW_REF === 'konnilabs/xtend/.github/workflows/xtend-default-gates.yml@refs/heads/main' &&
    env.GITHUB_REF === 'refs/heads/main' && env.GITHUB_EVENT_NAME === 'workflow_dispatch' &&
    env.XTEND_RELEASE_ENVIRONMENT === 'npm-publish' && env.ACTIONS_ID_TOKEN_REQUEST_URL && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
    'Publish requires the existing trusted workflow identity and npm-publish environment');
  verifyNeeds(JSON.parse(env.XTEND_RELEASE_NEEDS || '{}'), { sealed: true });
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
  check(!values.promote && !values['dist-tags-authorized'], 'Optional dist-tag promotion is not the integrated default; a separately reviewed capability is required');
  const selection = parseSelection(values);
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
    check(process.env.GITHUB_SHA === artifact.sourceSha, 'Publish run source must match immutable artifact');
    await verifyCandidateBinding(artifact, { directory: values.artifact, rootDir, requireProductEvidence: true });
    const receipt = JSON.parse(fs.readFileSync(path.join(values.artifact, 'gate-receipt.json')));
    check(receipt.manifestIntegrity === artifact.manifestIntegrity && receipt.sourceSha === artifact.sourceSha &&
      receipt.repository === 'konnilabs/xtend' && receipt.workflow === '.github/workflows/xtend-default-gates.yml', 'Immutable gate receipt mismatch');
    verifyNeeds(receipt.needs);
  }
  const npmCli = resolveNpmCli({ explicit: values['npm-cli'] });
  const actual = await runNpm(npmCli, ['--version'], rootDir);
  check(actual.status === 0 && actual.stdout.trim() === artifact.toolchain.npm &&
    process.versions.node === artifact.toolchain.node, 'Preflight must use the committed Node/npm pins');
  const adapters = npmAdapters({ npmCli, cwd: rootDir });
  const ledger = await publishRelease({ artifact, ...adapters,
    ledgerFile: path.resolve(values.ledger || path.join(rootDir, '.xtend-test-results/npm-release-ledger.json')),
    prereleaseTag: values['prerelease-tag'], publish: values.execute,
    bootstrapPackages: artifact.manifest.bootstrapPackages || [] });
  console.log(JSON.stringify(ledger, null, 2));
  check(!values.execute || ledger.status === 'complete', 'Release needs explicit tag repair or recovery; inspect the preserved ledger');
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { main, assertPublishInput };
