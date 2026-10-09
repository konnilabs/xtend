#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync, spawnSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { check, loadInventory } = require('./inventory.cjs');
const { verifyArtifact, digest } = require('./artifact.cjs');
const { adaptCandidates, inspectCandidates, verifyCandidateBinding, write } = require('./candidates.cjs');
const { runConsumers } = require('./consumer.cjs');
const { npmAdapters } = require('./npm.cjs');
const { verifyNeeds, downloadSealedArtifact } = require('./github.cjs');
const rootDir = path.resolve(__dirname, '../..');
const git = args => execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim();
function pinnedRuntime() {
  const toolchain = { node: fs.readFileSync(path.join(rootDir, '.nvmrc'), 'utf8').trim(), npm: require('../../package.json').packageManager.slice(4) };
  check(process.versions.node === toolchain.node, 'Release producer requires committed Node pin');
  check(execFileSync(process.execPath, [process.env.npm_execpath, '--version'], { encoding: 'utf8' }).trim() === toolchain.npm, 'Release producer requires committed npm pin');
  return toolchain;
}
function buildCommittedSource(sourceSha) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-build-'));
  try {
    const archive = execFileSync('git', ['archive', '--format=tar', sourceSha], { cwd: rootDir, maxBuffer: 256 * 1024 * 1024 });
    execFileSync('tar', ['-xf', '-', '-C', temporary], { input: archive });
    const tracked = git(['ls-files', '-z']).split('\0').filter(Boolean);
    const before = new Map(tracked.filter(file => fs.statSync(path.join(temporary, file)).isFile()).map(file => [file, digest(fs.readFileSync(path.join(temporary, file)))]));
    fs.symlinkSync(path.join(rootDir, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
    const commands = [['scripts', 'build:components'], ['scripts', 'build:rmt-esm-entrypoints'], ['scripts', 'build:html-sanitizer'],
      ['node', 'products/xtend-mcp/scripts/build-knowledge.mjs'], ['node', 'products/xtend-mcp/scripts/build-knowledge.mjs', '--check', '--quiet']];
    for (const command of commands) execFileSync(process.execPath, command[0] === 'scripts' ? [process.env.npm_execpath, 'run', command[1]] : command.slice(1),
      { cwd: temporary, stdio: 'pipe', timeout: 300000, maxBuffer: 16 * 1024 * 1024 });
    const changed = [...before].filter(([file, hash]) => !fs.existsSync(path.join(temporary, file)) || digest(fs.readFileSync(path.join(temporary, file))) !== hash).map(([file]) => file);
    check(changed.length === 0, `Committed generated artifacts are stale; review and commit regeneration before release: ${changed.join(', ')}`);
    return { commands, mcpKnowledgeGenerated: true, mcpKnowledgeChecked: true };
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
async function prepare({ directory, selection }) {
  const sourceSha = git(['rev-parse', 'HEAD']), toolchain = pinnedRuntime();
  check(git(['status', '--porcelain', '--untracked-files=no']) === '', 'Release preparation requires clean committed source');
  const demoSha = require('../../product-demos.lock.json').demoSha;
  loadInventory(rootDir);
  const preparedAt = new Date().toISOString();
  const build = { schema: 'xtend.release.build.v1', sourceSha, toolchain, ...buildCommittedSource(sourceSha) };
  // The sole production packer: unchanged reviewed packCandidates function.
  require('../product-candidate-canary.cjs').packCandidates({ output: directory, demoSha });
  let manifest = await adaptCandidates({ directory, sourceSha, demoSha, rootDir, selection, buildEvidence: build,
    registry: npmAdapters({ npmCli: process.env.npm_execpath, cwd: rootDir }).registry });
  manifest.preparedAt = preparedAt;
  fs.writeFileSync(path.join(directory, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  let manifestIntegrity = digest(fs.readFileSync(path.join(directory, 'release-manifest.json')));
  const artifact = await verifyArtifact({ directory, sourceSha, rootDir, manifestIntegrity, requireCanary: false });
  await runConsumers({ artifact, rootDir, npmCli: process.env.npm_execpath, executeCanary: true, outputFile: path.join(directory, 'consumer.json') });
  manifest.canary = { file: 'consumer.json', integrity: digest(fs.readFileSync(path.join(directory, 'consumer.json'))) };
  fs.writeFileSync(path.join(directory, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  manifestIntegrity = digest(fs.readFileSync(path.join(directory, 'release-manifest.json')));
  return { sourceSha, demoSha, manifestIntegrity, candidateSha256: require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(directory, 'manifest.json'))) };
}
async function consumers({ directory, candidateSha256, demoRepository }) {
  const node = process.versions.node;
  check(['24.18.0', '26.5.0'].includes(node), 'Product consumer requires a committed Node lane');
  const npm = execFileSync(process.execPath, [process.env.npm_execpath, '--version'], { encoding: 'utf8' }).trim();
  check(npm === '11.17.0', 'Product consumer requires committed npm pin');
  const args = ['scripts/product-candidate-canary.cjs', '--existing-candidates', '--manifest-sha256', candidateSha256, '--out', directory];
  if (demoRepository) args.push('--demo-repository', demoRepository);
  const run = spawnSync(process.execPath, args, { cwd: rootDir, stdio: 'inherit', timeout: 2400000 });
  const file = path.join(rootDir, '.xtend-test-results/product-candidate.json');
  if (fs.existsSync(file)) {
    const report = JSON.parse(fs.readFileSync(file)); report.releaseRuntime = { node, npm };
    fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  }
  check(run.status === 0 && !run.error, 'Required pinned product consumer gates failed');
  execFileSync(process.execPath, ['scripts/product-candidate-evidence.cjs', file], { cwd: rootDir, stdio: 'inherit' });
}
async function seal({ directory, manifestIntegrity, lanesDirectory, resume = false }) {
  const sourceSha = git(['rev-parse', 'HEAD']), artifact = await verifyArtifact({ directory, manifestIntegrity, sourceSha, rootDir });
  await verifyCandidateBinding(artifact, { directory, rootDir });
  const manifest = structuredClone(artifact.manifest);
  const originalDirectory = directory;
  if (resume) {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-resume-check-'));
    fs.cpSync(originalDirectory, directory, { recursive: true });
    fs.rmSync(path.join(directory, 'lanes'), { recursive: true, force: true });
  }
  try {
  manifest.productEvidence = [];
  for (const [node, suffix] of [['24.18.0', 'node-24-18-0'], ['26.5.0', 'node-26-5-0']]) {
    const source = path.join(lanesDirectory, 'product-candidate-evidence-' + (node === '24.18.0' ? 'node-24-lts' : 'node-26-current'));
    const candidateDir = path.join(source, 'product-candidates');
    await inspectCandidates({ directory: candidateDir, rootDir, sourceSha, demoSha: manifest.candidateBinding.demoSha });
    check(digest(fs.readFileSync(path.join(candidateDir, 'manifest.json'))) === manifest.candidateBinding.integrity, 'Consumer lane packed different candidates');
    const target = path.join(directory, 'lanes', suffix); fs.mkdirSync(target, { recursive: true });
    fs.copyFileSync(path.join(source, 'product-candidate.json'), path.join(target, 'product-candidate.json'));
    for (const name of ['locks', 'reports']) fs.cpSync(path.join(candidateDir, name), path.join(target, name), { recursive: true, errorOnExist: true });
    const file = `lanes/${suffix}/product-candidate.json`;
    manifest.productEvidence.push({ node, file, integrity: digest(fs.readFileSync(path.join(directory, file))) });
  }
  manifest.sealedAt = new Date().toISOString();
  // Validate before writing the final, immutable release manifest.
  await verifyCandidateBinding({ ...artifact, manifest }, { directory, rootDir, requireProductEvidence: true, now: Date.now() });
  if (resume) return { sourceSha, manifestIntegrity, candidateSha256: require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(originalDirectory, 'manifest.json'))) };
  const finalFile = path.join(directory, 'release-manifest.json');
  fs.writeFileSync(finalFile, JSON.stringify(manifest, null, 2) + '\n');
  const finalIntegrity = digest(fs.readFileSync(finalFile));
  const needs = JSON.parse(process.env.XTEND_RELEASE_NEEDS || '{}'); verifyNeeds(needs);
  check(process.env.GITHUB_REPOSITORY === 'konnilabs/xtend' && /^\d+$/.test(process.env.GITHUB_RUN_ID || '') && process.env.GITHUB_SHA === sourceSha,
    'Sealing requires authenticated workflow run identity');
  write(directory, 'gate-receipt.json', { schema: 'xtend.release.gates.v1', repository: 'konnilabs/xtend',
    workflow: '.github/workflows/xtend-default-gates.yml', runId: process.env.GITHUB_RUN_ID, sourceSha, manifestIntegrity: finalIntegrity, needs });
  return { sourceSha, manifestIntegrity: finalIntegrity, candidateSha256: require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(directory, 'manifest.json'))) };
  } finally { if (resume) fs.rmSync(directory, { recursive: true, force: true }); }
}
async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    artifact: { type: 'string' }, groups: { type: 'string' }, packages: { type: 'string' }, 'manifest-integrity': { type: 'string' },
    'candidate-sha256': { type: 'string' }, lanes: { type: 'string' }, 'demo-repository': { type: 'string' },
    'artifact-id': { type: 'string' }, resume: { type: 'boolean', default: false }, execute: { type: 'boolean', default: false }
  } });
  const command = positionals[0]; check(positionals.length === 1 && ['prepare', 'consumers', 'seal', 'download'].includes(command), 'Commands: prepare, consumers, seal, download');
  check(values.artifact, '--artifact is required');
  const selection = values.groups !== undefined || values.packages !== undefined ? { groups: values.groups?.split(',') || [], packages: values.packages?.split(',') || [] } : undefined;
  const options = { directory: path.resolve(values.artifact), selection, manifestIntegrity: values['manifest-integrity'],
    candidateSha256: values['candidate-sha256'], lanesDirectory: values.lanes, demoRepository: values['demo-repository'], resume: values.resume };
  if (!values.execute) { console.log(JSON.stringify({ mode: 'dry-run', command, ...options })); return; }
  let result;
  if (command === 'download') {
    const sourceSha = git(['rev-parse', 'HEAD']);
    const downloaded = await downloadSealedArtifact({ id: values['artifact-id'], directory: options.directory, sourceSha });
    result = { sourceSha, manifestIntegrity: downloaded.manifestIntegrity,
      candidateSha256: require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(options.directory, 'manifest.json'))) };
    const artifact = await verifyArtifact({ directory: options.directory, manifestIntegrity: result.manifestIntegrity, sourceSha, rootDir, selection });
    await verifyCandidateBinding(artifact, { directory: options.directory, rootDir, requireProductEvidence: true });
  } else result = await ({ prepare, consumers, seal })[command](options);
  if (result && process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(''));
  if (result) console.log(JSON.stringify(result));
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { pinnedRuntime, buildCommittedSource, prepare, consumers, seal, main };
