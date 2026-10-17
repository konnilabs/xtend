#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync, spawnSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { check, loadInventory } = require('./inventory.cjs');
const { resolveNpmCli } = require('./toolchain.cjs');
const { parseSelection, selectRelease } = require('./selection.cjs');
const { verifyArtifact, digest } = require('./artifact.cjs');
const { buildCommands } = require('./contracts.cjs');
const { adaptCandidates, inspectCandidates, verifyCandidateBinding, write } = require('./candidates.cjs');
const { runConsumers } = require('./consumer.cjs');
const { npmAdapters } = require('./npm.cjs');
const { verifyNeeds, downloadSealedArtifact } = require('./github.cjs');
const { PROFILE } = require('./profile.cjs');
const { verifyCoreEvidenceEnvelope, verifyCoreEvidence } = require('./core-evidence.cjs');
const coreSource = require('./core-source.cjs');
const coreAuth = require('./core-auth.cjs');
const rootDir = path.resolve(__dirname, '../..');
const git = args => execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim();
function pinnedRuntime() {
  const toolchain = { node: fs.readFileSync(path.join(rootDir, '.nvmrc'), 'utf8').trim(), npm: require('../../package.json').packageManager.slice(4) };
  check(process.versions.node === toolchain.node, 'Release producer requires committed Node pin');
  check(execFileSync(process.execPath, [resolveNpmCli(), '--version'], { encoding: 'utf8' }).trim() === toolchain.npm, 'Release producer requires committed npm pin');
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
    const commands = buildCommands();
    const npmCli = resolveNpmCli();
    for (const command of commands) execFileSync(process.execPath, command[0] === 'scripts' ? [npmCli, 'run', command[1]] : command.slice(1),
      { cwd: temporary, stdio: 'pipe', timeout: 300000, maxBuffer: 16 * 1024 * 1024 });
    const changed = [...before].filter(([file, hash]) => !fs.existsSync(path.join(temporary, file)) || digest(fs.readFileSync(path.join(temporary, file))) !== hash).map(([file]) => file);
    check(changed.length === 0, `Committed generated artifacts are stale; review and commit regeneration before release: ${changed.join(', ')}`);
    return { commands, mcpKnowledgeGenerated: true, mcpKnowledgeChecked: true };
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
async function prepare({ directory, selection }) {
  assertFreshPreparation(process.env);
  const sourceSha = git(['rev-parse', 'HEAD']);
  check(git(['status', '--porcelain', '--untracked-files=no']) === '', 'Release preparation requires clean committed source');
  return withCheckedSource(sourceSha, async source => {
  coreSource.validateCoreAuthority({...source,rootDir,typescript:require('typescript')});
  const toolchain = pinnedRuntime();
  source.provider.files();
  loadInventory(rootDir);
  const preparedAt = new Date().toISOString();
  const build = { schema: 'xtend.release.build.v1', sourceSha, toolchain, ...buildCommittedSource(sourceSha) };
  // The sole production packer: unchanged reviewed packCandidates function.
  require('../pack-candidates.cjs').packCandidates({ output: directory, profile: PROFILE });
  let manifest = await adaptCandidates({ directory, sourceSha, rootDir, selection, buildEvidence: build,
    registry: npmAdapters({ npmCli: resolveNpmCli(), cwd: rootDir }).registry });
  manifest.preparedAt = preparedAt;
  fs.writeFileSync(path.join(directory, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  let manifestIntegrity = digest(fs.readFileSync(path.join(directory, 'release-manifest.json')));
  await verifyArtifact({ directory, sourceSha, rootDir, manifestIntegrity, requireCanary: false, phase: 'prepared' });
  source.provider.files();
  return { sourceSha, manifestIntegrity, candidateSha256: require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(directory, 'manifest.json'))) };
  });
}
function assertFreshPreparation(env) {
  check(env.GITHUB_ACTIONS !== 'true' || env.GITHUB_RUN_ATTEMPT === '1',
    'Re-running preparation must not rebuild an attempted version; resume the original sealed artifact ID or rerun only the failed publish job');
}
async function withCheckedSource(sourceSha, action) {
  check(process.env.XTEND_CORE_ARCHIVE && process.env.XTEND_CORE_EXPECTED, 'Required authenticated Core source artifact is absent');
  const expected = JSON.parse(fs.readFileSync(process.env.XTEND_CORE_EXPECTED));
  check(expected.sourceSha === sourceSha && expected.context?.runId === process.env.GITHUB_RUN_ID &&
    expected.context?.runAttempt === process.env.GITHUB_RUN_ATTEMPT, 'Core source independent identity/run/attempt mismatch');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-core-source-'));
  let loaded;
  try {
    loaded = coreSource.loadCoreSource({ archive: process.env.XTEND_CORE_ARCHIVE,
      destination: path.join(temporary, 'source'), expected });
    loaded.provider.files();
    return await action(loaded);
  } finally {
    try { if (loaded) loaded.provider.files(); }
    finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  }
}
async function consumers({ directory, candidateSha256, manifestIntegrity, outputDirectory }) {
  const sourceSha = git(['rev-parse','HEAD']);
  return withCheckedSource(sourceSha, async source => {
  check(require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(directory,'manifest.json'))) === candidateSha256,
    'Core lane received different original candidate bytes');
  const sealed = Object.hasOwn(JSON.parse(fs.readFileSync(path.join(directory,'release-manifest.json'))),'sealedAt');
  const artifact = await verifyArtifact({directory,sourceSha,rootDir,manifestIntegrity,requireCanary:sealed,phase:sealed?'sealed':'prepared'});
  check(outputDirectory && !fs.existsSync(outputDirectory), 'Core lane evidence directory must be fresh');
  fs.mkdirSync(outputDirectory,{recursive:true});
  const sourceReport=coreSource.strictSourceReport({...source,rootDir,typescript:require('typescript')});
  fs.writeFileSync(path.join(outputDirectory,'source-report.json'),JSON.stringify(sourceReport,null,2)+'\n',{flag:'wx'});
  check(sourceReport.ok === true, 'Required Core-owned strict source/schema gate failed');
  await runConsumers({artifact,rootDir,npmCli:resolveNpmCli(),executeCanary:true,outputFile:path.join(outputDirectory,'consumer.json')});
  source.provider.files();
  });
}
async function seal({ directory, manifestIntegrity, resume = false, artifactId }) {
  const sourceSha=git(['rev-parse','HEAD']);
  const artifact=await verifyArtifact({directory,manifestIntegrity,sourceSha,rootDir,requireCanary:resume,phase:resume?'sealed':'prepared'});
  const needs=JSON.parse(process.env.XTEND_RELEASE_NEEDS||'{}');verifyNeeds(needs);
  const temporary=resume?fs.mkdtempSync(path.join(os.tmpdir(),'xtend-core-resume-proof-')):null;
  const evidenceRoot=resume?temporary:directory, evidenceDirectory=path.join(evidenceRoot,'core-evidence');
  try {
    const envelope=await coreAuth.collect({directory:evidenceDirectory,artifact,needs});
    // Both raw locks and the report/source/authenticated ZIPs from EACH lane
    // reach this real seal boundary and must pass before manifest mutation.
    verifyCoreEvidenceEnvelope(artifact,envelope,{directory,evidenceDirectory:evidenceRoot});
    if(resume){
      check(/^[1-9][0-9]*$/.test(artifactId||'') && needs['release-prepare'].outputs?.artifactId===artifactId,
        'Resume requires the original authenticated artifact ID returned by current download');
      verifyCoreEvidence(artifact,{directory});
      // Fresh evidence is retained externally; original sealed bytes, original
      // reports, their sealedAt and original artifact ID are never rewritten.
      check(process.env.XTEND_CORE_RESUME_EVIDENCE && !fs.existsSync(process.env.XTEND_CORE_RESUME_EVIDENCE),
        'Fresh resume proof needs a separate new output directory');
      const destination=path.resolve(process.env.XTEND_CORE_RESUME_EVIDENCE);
      check(path.basename(destination)==='core-evidence' && !destination.startsWith(fs.realpathSync(directory)+path.sep),
        'Fresh resume proof must remain outside the original release artifact');
      fs.mkdirSync(path.dirname(destination),{recursive:true});
      fs.cpSync(evidenceDirectory,destination,{recursive:true,errorOnExist:true,force:false});
      verifyCoreEvidenceEnvelope(artifact,envelope,{directory,evidenceDirectory:path.dirname(destination)});
      return {sourceSha,manifestIntegrity,artifactId,candidateSha256:require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(directory,'manifest.json')))};
    }
    const manifest=structuredClone(artifact.manifest);manifest.sealedAt=envelope.sealedAt;
    manifest.coreEvidence={file:'core-evidence/index.json',integrity:digest(fs.readFileSync(path.join(evidenceDirectory,'index.json')))};
    manifest.canary=envelope.lanes.find(lane=>lane.node==='24.18.0').consumer;
    fs.writeFileSync(path.join(directory,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
    const finalIntegrity=digest(fs.readFileSync(path.join(directory,'release-manifest.json')));
    await verifyArtifact({directory,sourceSha,rootDir,manifestIntegrity:finalIntegrity,phase:'sealed'});
    write(directory,'gate-receipt.json',{schema:'xtend.release.gates.v1',repository:'konnilabs/xtend',workflow:'.github/workflows/xtend-default-gates.yml',
      runId:process.env.GITHUB_RUN_ID,sourceSha,manifestIntegrity:finalIntegrity,needs});
    return {sourceSha,manifestIntegrity:finalIntegrity,candidateSha256:require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(directory,'manifest.json')))};
  } finally {if(temporary)fs.rmSync(temporary,{recursive:true,force:true});}
}
async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    artifact: { type: 'string' }, groups: { type: 'string' }, packages: { type: 'string' }, 'manifest-integrity': { type: 'string' },
    'candidate-sha256': { type: 'string' }, output: { type: 'string' },
    'artifact-id': { type: 'string' }, resume: { type: 'boolean', default: false }, execute: { type: 'boolean', default: false }
  } });
  const command = positionals[0]; check(positionals.length === 1 && ['prepare', 'consumers', 'seal', 'download'].includes(command), 'Commands: prepare, consumers, seal, download');
  check(values.artifact, '--artifact is required');
  const selection = parseSelection(values);
  const releaseScope = selectRelease(loadInventory(rootDir), selection);
  const options = { directory: path.resolve(values.artifact), selection, manifestIntegrity: values['manifest-integrity'],
    candidateSha256: values['candidate-sha256'], outputDirectory: values.output, resume: values.resume, artifactId: values['artifact-id'] };
  if (!values.execute) { console.log(JSON.stringify({ mode: 'dry-run', command, ...options, releaseScope })); return; }
  let result;
  if (command === 'download') {
    const sourceSha = git(['rev-parse', 'HEAD']);
    const downloaded = await downloadSealedArtifact({ id: values['artifact-id'], directory: options.directory, sourceSha });
    result = { sourceSha, artifactId: String(downloaded.metadata.id), manifestIntegrity: downloaded.manifestIntegrity,
      candidateSha256: require('../../candidate-integrity.cjs').digest(fs.readFileSync(path.join(options.directory, 'manifest.json'))) };
    const artifact = await verifyArtifact({ directory: options.directory, manifestIntegrity: result.manifestIntegrity, sourceSha, rootDir, selection, phase: 'sealed' });
    await verifyCandidateBinding(artifact, { directory: options.directory, rootDir, requireCoreEvidence: true });
    const envelope=verifyCoreEvidence(artifact,{directory:options.directory});
    check(envelope.context.runId===String(downloaded.metadata.workflow_run.id) &&
      JSON.stringify(envelope.needs)===JSON.stringify(downloaded.receipt.needs),
      'Original Core envelope and immutable gate receipt disagree on producer run/gates');
  } else result = await ({ prepare, consumers, seal })[command](options);
  if (result && process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(''));
  if (result) console.log(JSON.stringify(result));
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { pinnedRuntime, buildCommittedSource, prepare, consumers, seal, main, assertFreshPreparation };
