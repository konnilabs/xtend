'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { resolveNpmCli } = require('../../scripts/release/toolchain.cjs');
const { CERTIFICATE_IDENTITY, VERIFICATION_OPTIONS } = require('../../scripts/release/provenance.cjs');
const root = path.resolve(__dirname, '../..');
function cleanShell(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-shell-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cli = resolveNpmCli(), bin = path.join(directory, 'bin'); fs.mkdirSync(bin);
  fs.symlinkSync(cli, path.join(bin, 'npm')); fs.symlinkSync(process.execPath, path.join(bin, 'node'));
  const env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, GITHUB_ENV: path.join(directory, 'github-env') };
  delete env.npm_execpath; delete env.XTEND_NPM_CLI;
  return { directory, cli, env, run: script => execFileSync('bash', ['--noprofile', '--norc', '-c', script], { cwd: root, env, encoding: 'utf8', timeout: 60000 }) };
}
test('plain Node discovers, verifies and exports npm11.17 without inherited lifecycle variables', t => {
  const shell = cleanShell(t);
  const result = JSON.parse(shell.run('test -z "${npm_execpath:-}"; test -z "${XTEND_NPM_CLI:-}"; node scripts/release/toolchain.cjs --execute'));
  assert.equal(result.npmCli, shell.cli); assert.equal(result.npm, '11.17.0');
  assert.equal(fs.readFileSync(shell.env.GITHUB_ENV, 'utf8'), `XTEND_NPM_CLI=${shell.cli}\n`);
  const standalone = path.join(shell.directory, 'toolchain-without-node-modules.cjs');
  fs.copyFileSync(path.join(root, 'scripts/release/toolchain.cjs'), standalone);
  assert.equal(JSON.parse(execFileSync(process.execPath, [standalone], { cwd: shell.directory, env: shell.env, encoding: 'utf8' })).npmCli, shell.cli);
  const script = 'set -a; source "$GITHUB_ENV"; set +a; test -z "${npm_execpath:-}"; node -e \'console.log(require("./scripts/release/toolchain.cjs").resolveNpmCli())\'';
  assert.equal(shell.run(script).trim(), shell.cli);
  if (process.versions.node === '24.18.0') assert.equal(JSON.parse(shell.run('set -a; source "$GITHUB_ENV"; set +a; node -e \'console.log(JSON.stringify(require("./scripts/release/pipeline.cjs").pinnedRuntime()))\'' )).npm, '11.17.0');
});
test('invalid explicit npm paths and shell shims fail closed', t => {
  const shell = cleanShell(t), shim = path.join(shell.directory, 'unverified-npm');
  fs.writeFileSync(shim, '#!/bin/sh\necho 11.17.0\n'); fs.chmodSync(shim, 0o755);
  assert.throws(() => resolveNpmCli({ explicit: shim }), /installed npm CLI/);
  assert.throws(() => resolveNpmCli({ explicit: 'npm-cli.js' }), /absolute/);
  assert.throws(() => resolveNpmCli({ explicit: shell.cli + '\n' }), /absolute/);
});
test('every relevant workflow job exports the verified installed CLI after the pin and before release commands', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/xtend-default-gates.yml'), 'utf8');
  for (const name of ['release-prepare', 'product-candidate-canary', 'release-seal', 'npm-publish-latest']) {
    const job = workflow.split('\n  ' + name + ':\n')[1].split(/\n  [a-z][\w-]*:\n/u)[0];
    const pin = job.indexOf('npm install --global npm@11.17.0');
    const exported = job.indexOf('node scripts/release/toolchain.cjs --execute');
    assert.ok(pin >= 0 && exported > pin, name);
    for (const match of job.matchAll(/node scripts\/release\/(?:pipeline|cli)\.cjs/g)) assert.ok(match.index > exported, name);
  }
});
const cases = [
  { label: 'groups-only', groups: 'mcp', packages: '', expected: ['@ccslabs/xtend-mcp'] },
  { label: 'packages-only', groups: '', packages: '@xtend-material/core', expected: ['@xtend-material/core'] },
  { label: 'both', groups: 'mcp', packages: '@xtend-material/core', expected: ['@xtend-material/core', '@ccslabs/xtend-mcp'] },
  { label: 'neither', groups: '', packages: '', expected: require('../../scripts/release/inventory.json').packages.map(p => p.name) }
];
for (const resume of [false, true]) for (const item of cases) test(`actual workflow shell and CLI selection: ${item.label}, resume=${resume}`, t => {
  const shell = cleanShell(t), workflow = fs.readFileSync(path.join(root, '.github/workflows/xtend-default-gates.yml'), 'utf8');
  const step = workflow.slice(workflow.indexOf('      - name: Prepare once or resume the immutable reviewed artifact'));
  const run = step.match(/run: \|\n((?: {10}[^\n]*\n)+)/)[1].replace(/^ {10}/gm, '').replace(/ --execute\b/g, '');
  Object.assign(shell.env, { RELEASE_GROUPS: item.groups, RELEASE_PACKAGES: item.packages, RESUME_ARTIFACT_ID: resume ? '123' : '' });
  const plan = JSON.parse(shell.run(run));
  assert.equal(plan.mode, 'dry-run'); assert.equal(plan.command, resume ? 'download' : 'prepare');
  assert.deepEqual(plan.releaseScope.order, item.expected);
  assert.ok(!plan.selection?.groups.includes(''));
  assert.ok(!plan.selection?.packages.includes(''));
  const cli = JSON.parse(shell.run('node scripts/release/cli.cjs inventory --groups "$RELEASE_GROUPS" --packages "$RELEASE_PACKAGES"'));
  assert.deepEqual(cli.releaseScope.order, item.expected);
});
for (const value of ['mcp,', 'mcp,mcp', 'unknown', ' mcp', ',']) test(`nonempty malformed release group remains rejected: ${JSON.stringify(value)}`, t => {
  const shell = cleanShell(t); shell.env.RELEASE_GROUPS = value;
  assert.throws(() => shell.run('node scripts/release/pipeline.cjs prepare --artifact /unused --groups "$RELEASE_GROUPS"'), /Unknown\/duplicate/);
});
test('npm11.17 bundled real Sigstore policy rejects every non-exact SAN and issuer', () => {
  const cli = resolveNpmCli(), npmRequire = createRequire(cli);
  assert.equal(npmRequire('../package.json').version, '11.17.0');
  const sigstore = path.dirname(npmRequire.resolve('sigstore'));
  const verify = path.dirname(npmRequire.resolve('@sigstore/verify'));
  assert.equal(require(path.resolve(sigstore, '../package.json')).version, '4.1.1');
  assert.equal(require(path.resolve(verify, '../package.json')).version, '3.1.1');
  const { createVerificationPolicy } = require(path.join(sigstore, 'config.js'));
  const { Verifier } = require(path.join(verify, 'verifier.js'));
  const { verifySubjectAlternativeName } = require(path.join(verify, 'policy.js'));
  const policy = createVerificationPolicy(VERIFICATION_OPTIONS);
  assert.equal(policy.subjectAlternativeName, VERIFICATION_OPTIONS.certificateIdentityURI);
  assert.deepEqual(policy.extensions, { issuer: 'https://token.actions.githubusercontent.com' });
  const verifier = new Verifier({}, { ctlogThreshold: VERIFICATION_OPTIONS.ctLogThreshold, tlogThreshold: VERIFICATION_OPTIONS.tlogThreshold });
  assert.equal(verifier.options.ctlogThreshold, 1); assert.equal(verifier.options.tlogThreshold, 1);
  const identity = { subjectAlternativeName: CERTIFICATE_IDENTITY, extensions: policy.extensions };
  verifier.verifyPolicy(policy, identity);
  // Reproduce the reviewed matcher behavior through the real bundled function.
  verifySubjectAlternativeName(CERTIFICATE_IDENTITY, CERTIFICATE_IDENTITY + '-evil');
  verifySubjectAlternativeName(CERTIFICATE_IDENTITY, CERTIFICATE_IDENTITY.replace('github.com', 'githubXcom'));
  for (const san of [CERTIFICATE_IDENTITY + '-evil', CERTIFICATE_IDENTITY + '/suffix', 'prefix' + CERTIFICATE_IDENTITY,
    CERTIFICATE_IDENTITY + '\n', CERTIFICATE_IDENTITY.replace('github.com', 'githubXcom'),
    CERTIFICATE_IDENTITY.replace('.github', 'Xgithub'), CERTIFICATE_IDENTITY.replace('gates.yml', 'gatesXyml'),
    CERTIFICATE_IDENTITY.replace('xtend-default-gates.yml', 'other.yml'), CERTIFICATE_IDENTITY.replace('/konnilabs/', '/evil/'),
    CERTIFICATE_IDENTITY.replace('https://github.com/', 'https://evilgithub.com/'), undefined]) {
    assert.throws(() => verifier.verifyPolicy(policy, { ...identity, subjectAlternativeName: san }), /certificate identity/);
  }
  for (const issuer of ['https://token.actions.githubusercontent.com.evil', 'https://other.invalid', undefined])
    assert.throws(() => verifier.verifyPolicy(policy, { ...identity, extensions: { issuer } }), /certificate extension/);
});
