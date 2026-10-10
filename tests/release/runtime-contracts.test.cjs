'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto'), Module = require('node:module');
const { execFileSync } = require('node:child_process');
const test = require('node:test'), assert = require('node:assert/strict');
const { isDeepStrictEqual } = require('node:util');
const { digest, verifyArtifact, releaseSetIntegrity, assertSealedArtifact } = require('../../scripts/release/artifact.cjs');
const { adaptCandidates } = require('../../scripts/release/candidates.cjs');
const { buildCommands, buildCanaryIntegrity, verifyBuildCommands } = require('../../scripts/release/contracts.cjs');
const { packedFixture, write } = require('./fixtures.cjs');
const root = path.resolve(__dirname, '../..');

// Execute the existing controlled miniature candidate/product fixture functions,
// not copied schema literals or a second packer. No real product acceptance is
// inferred from their placeholder PHP/runtime/ownership evidence.
function factories() {
  const file = path.join(__dirname, 'integration.test.cjs'), source = fs.readFileSync(file, 'utf8');
  const ts = require('typescript'), tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const functions = tree.statements.filter(node => ts.isFunctionDeclaration(node) &&
    ['candidateFixture', 'productFixture'].includes(node.name?.text)).map(node => node.getText(tree));
  assert.equal(functions.length, 2);
  const prelude = source.slice(0, source.indexOf('async function candidateFixture'));
  const compiled = new Module(file, module); compiled.filename = file; compiled.paths = Module._nodeModulePaths(__dirname);
  compiled._compile(prelude + '\n' + functions.join('\n') + '\nmodule.exports={candidateFixture,productFixture};', file);
  return compiled.exports;
}
async function productionFixture(t, { group, sealed = false, materialWithoutMcp = false, old = false } = {}) {
  const generatedAt = new Date(Date.now() - (old ? 86400000 : 1000)).toISOString();
  const f = await factories().productFixture(t, generatedAt);
  for (const entry of f.f.artifact.packages) f.r.installed({ ...entry, sourceSha: 'b'.repeat(40) }, 'latest');
  const build = structuredClone(f.options.buildEvidence);
  build.mcpKnowledgeGenerated = !materialWithoutMcp; build.mcpKnowledgeChecked = !materialWithoutMcp;
  build.commands = buildCommands(!materialWithoutMcp);
  const manifest = await adaptCandidates({ ...f.options, buildEvidence: build, ...(group ? { selection: { groups: [group] } } : {}) });
  manifest.preparedAt = new Date(Date.parse(generatedAt) - 1000).toISOString();
  const canary = { ...f.f.canary, tarballSetIntegrity: releaseSetIntegrity(manifest),
    buildEvidenceIntegrity: buildCanaryIntegrity(build), mcpKnowledgeGenerated: !materialWithoutMcp,
    mcpKnowledgeChecked: !materialWithoutMcp,
    packages: f.f.canary.packages.filter(p => manifest.packages.some(e => e.name === p.name)),
    registryDependencies: manifest.registryDependencies.map(e => ({ ...e, consumerInstall: true })) };
  write(path.join(f.directory, 'consumer.json'), canary);
  manifest.canary = { file: 'consumer.json', integrity: digest(fs.readFileSync(path.join(f.directory, 'consumer.json'))) };
  if (sealed) {
    manifest.sealedAt = new Date(Date.parse(generatedAt) + 1000).toISOString();
    manifest.productEvidence = [];
    for (const node of ['24.18.0', '26.5.0']) {
      const lane = path.join(f.directory, 'lanes', node); fs.mkdirSync(lane, { recursive: true });
      for (const name of ['locks', 'reports']) fs.cpSync(path.join(f.directory, name), path.join(lane, name), { recursive: true });
      const file = `lanes/${node}/product-candidate.json`;
      write(path.join(f.directory, file), { ...f.evidence, releaseRuntime: { node, npm: '11.17.0' } });
      manifest.productEvidence.push({ node, file, integrity: digest(fs.readFileSync(path.join(f.directory, file))) });
    }
  }
  const sync = () => {
    write(path.join(f.directory, 'build.json'), build);
    manifest.buildEvidence.integrity = digest(fs.readFileSync(path.join(f.directory, 'build.json')));
    write(path.join(f.directory, 'consumer.json'), canary);
    manifest.canary.integrity = digest(fs.readFileSync(path.join(f.directory, 'consumer.json')));
    write(path.join(f.directory, 'release-manifest.json'), manifest);
  };
  const verify = options => verifyArtifact({ directory: f.directory, sourceSha: f.f.sourceSha, rootDir: f.f.rootDir,
    manifestIntegrity: digest(fs.readFileSync(path.join(f.directory, 'release-manifest.json'))), ...options });
  sync();
  return { ...f, build, manifest, canary, sync, verify };
}

test('real adapter-produced prepared and sealed miniature envelopes pass full production verification', async t => {
  for (const sealed of [false, true]) {
    const f = await productionFixture(t, { sealed });
    const artifact = await f.verify();
    assert.equal(artifact.packages.length, 10);
    assert.equal(artifact.manifest.candidateBinding.allPackages.length, 10);
    if (sealed) await assertSealedArtifact(artifact);
    else await assert.rejects(assertSealedArtifact(artifact), /fully verified sealed/);
  }
});

test('primitive archive fixture is explicitly limited and rejected as a production or publish artifact', async t => {
  const f = await packedFixture(t);
  await assert.rejects(f.verify({ phase: undefined }), /complete original candidate byte binding/);
  await assert.rejects(f.verify({ phase: 'sealed' }), /complete original candidate byte binding/);
  await assert.rejects(assertSealedArtifact(f.artifact), /fully verified sealed/);
});

for (const problem of ['missing-commands', 'missing-build', 'wrong-order', 'extra-command', 'wrong-knowledge-command', 'wrong-flags']) {
  test(`production build contract rejects ${problem} after refreshing external SRIs`, async t => {
    const f = await productionFixture(t);
    if (problem === 'missing-commands') delete f.build.commands;
    if (problem === 'missing-build') f.build.commands.splice(1, 1);
    if (problem === 'wrong-order') f.build.commands.reverse();
    if (problem === 'extra-command') f.build.commands.push(['scripts', 'publish']);
    if (problem === 'wrong-knowledge-command') f.build.commands.at(-1).pop();
    if (problem === 'wrong-flags') f.build.mcpKnowledgeChecked = false;
    f.canary.buildEvidenceIntegrity = buildCanaryIntegrity(f.build); f.sync();
    await assert.rejects(f.verify(), /build commands|knowledge flags|MCP knowledge/);
  });
}

test('raw build.json SRI and compact parsed-build canary digest are distinct and both explicitly validated', async t => {
  const f = await productionFixture(t);
  assert.notEqual(f.manifest.buildEvidence.integrity, f.canary.buildEvidenceIntegrity);
  assert.equal(f.manifest.buildEvidence.integrity, digest(fs.readFileSync(path.join(f.directory, 'build.json'))));
  assert.equal(f.canary.buildEvidenceIntegrity, buildCanaryIntegrity(f.build));
  await f.verify();
});
for (const problem of ['missing', 'wrong-compact', 'raw-instead-of-compact']) test(`canary build link rejects ${problem} with otherwise valid manifest hashes`, async t => {
  const f = await productionFixture(t);
  if (problem === 'missing') delete f.canary.buildEvidenceIntegrity;
  if (problem === 'wrong-compact') f.canary.buildEvidenceIntegrity = digest('wrong');
  if (problem === 'raw-instead-of-compact') f.canary.buildEvidenceIntegrity = f.manifest.buildEvidence.integrity;
  f.sync(); await assert.rejects(f.verify(), /compact-build digest/);
});
test('changed parsed build object cannot reuse a stale compact digest even with a newly bound raw SRI', async t => {
  const f = await productionFixture(t, { group: 'material' });
  f.build.mcpKnowledgeGenerated = false; f.build.mcpKnowledgeChecked = false; f.build.commands = buildCommands(false);
  f.canary.mcpKnowledgeGenerated = false; f.canary.mcpKnowledgeChecked = false;
  f.sync(); await assert.rejects(f.verify(), /compact-build digest/);
});

for (const problem of ['missing-prepared', 'invalid-prepared', 'future-prepared', 'incomplete-sealed', 'swapped-lanes', 'one-lane', 'pre-sealed', 'false-canary-downgrade', 'missing-sha256', 'wrong-original-binding']) {
  test(`production phase and source binding rejects ${problem}`, async t => {
    const f = await productionFixture(t, { sealed: true });
    if (problem === 'missing-prepared') delete f.manifest.preparedAt;
    if (problem === 'invalid-prepared') f.manifest.preparedAt = 'not-a-time';
    if (problem === 'future-prepared') f.manifest.preparedAt = new Date(Date.now() + 3600000).toISOString();
    if (problem === 'incomplete-sealed') delete f.manifest.sealedAt;
    if (problem === 'swapped-lanes') f.manifest.productEvidence[1].node = f.manifest.productEvidence[0].node;
    if (problem === 'one-lane') f.manifest.productEvidence.pop();
    if (problem === 'pre-sealed') f.manifest.sealedAt = new Date(Date.parse(f.manifest.preparedAt) - 1).toISOString();
    if (problem === 'missing-sha256') delete f.manifest.packages[0].sha256;
    if (problem === 'wrong-original-binding') f.manifest.candidateBinding.allPackages[0].sha256 = '0'.repeat(64);
    f.sync(); await assert.rejects(f.verify(problem === 'false-canary-downgrade' ? { requireCanary: false } : {}));
  });
}
test('adapted/pre-consumer production cannot become sealed without bound consumer/product phases', async t => {
  const f = await productionFixture(t);
  delete f.manifest.canary; delete f.manifest.preparedAt;
  write(path.join(f.directory, 'release-manifest.json'), f.manifest);
  await f.verify({ phase: 'adapted', requireCanary: false });
  await assert.rejects(f.verify({ phase: 'sealed' }), /producer timestamp/);
  f.manifest.preparedAt = new Date().toISOString(); write(path.join(f.directory, 'release-manifest.json'), f.manifest);
  await f.verify({ phase: 'prepared', requireCanary: false });
  await assert.rejects(f.verify({ phase: 'prepared' }), /bound canary/);
});

test('independent Material-only production permits truthful three-command/no-MCP evidence; MCP-only rejects it', async t => {
  const material = await productionFixture(t, { group: 'material', materialWithoutMcp: true });
  assert.equal((await material.verify()).packages.length, 2);
  const mcp = await productionFixture(t, { group: 'mcp', materialWithoutMcp: true });
  await assert.rejects(mcp.verify(), /MCP knowledge/);
});
test('original sealed resume validates old receipts at original seal time without changing any original bytes', async t => {
  const f = await productionFixture(t, { sealed: true, old: true });
  const files = [];
  function visit(dir) { for (const name of fs.readdirSync(dir)) { const p = path.join(dir, name); if (fs.statSync(p).isDirectory()) visit(p); else files.push(p); } }
  visit(f.directory);
  const hashes = new Map(files.map(file => [file, digest(fs.readFileSync(file))]));
  const artifact = await f.verify({ phase: 'sealed' });
  await assertSealedArtifact(artifact);
  for (const [file, hash] of hashes) assert.equal(digest(fs.readFileSync(file)), hash, file);
  await assert.rejects(f.verify({ phase: 'sealed', now: Date.now() }), /Stale ownership evidence/);
});
function pipelineForFixture(rootDir, sourceSha) {
  const file = path.join(root, 'scripts/release/pipeline.cjs'), realRequire = Module.createRequire(file);
  const compiled = new Module(file, module); compiled.filename = file;
  compiled.require = name => name === 'node:child_process' ? {
    execFileSync(program, args) {
      assert.equal(program, 'git'); assert.deepEqual(args, ['rev-parse', 'HEAD']); return sourceSha;
    }, spawnSync() { throw Error('No build/npm/product process may run in seal/resume verification'); }
  } : realRequire(name);
  const source = fs.readFileSync(file, 'utf8');
  // Only the temporary fixture root/backend is substituted. Seal/resume body,
  // contracts and all candidate/product validation are the actual proposal.
  const needle = "const rootDir = path.resolve(__dirname, '../..');";
  assert.equal(source.split(needle).length, 2);
  compiled._compile(source.replace(needle, 'const rootDir = ' + JSON.stringify(rootDir) + ';'), file);
  return compiled.exports;
}
test('actual seal --resume verifies supplied lanes yet returns the original manifest digest and leaves original bytes unchanged', async t => {
  const f = await productionFixture(t, { sealed: true });
  const lanesDirectory = path.join(f.f.directory, 'new-controlled-consumer-lanes');
  for (const [node, suffix] of [['24.18.0', 'node-24-lts'], ['26.5.0', 'node-26-current']]) {
    const lane = path.join(lanesDirectory, 'product-candidate-evidence-' + suffix);
    fs.mkdirSync(lane, { recursive: true });
    fs.cpSync(f.directory, path.join(lane, 'product-candidates'), { recursive: true });
    write(path.join(lane, 'product-candidate.json'), { ...f.evidence, releaseRuntime: { node, npm: '11.17.0' } });
  }
  const files = [];
  function visit(dir) { for (const name of fs.readdirSync(dir)) { const file = path.join(dir, name); if (fs.statSync(file).isDirectory()) visit(file); else files.push(file); } }
  visit(f.directory);
  const before = new Map(files.map(file => [file, digest(fs.readFileSync(file))]));
  const manifestIntegrity = digest(fs.readFileSync(path.join(f.directory, 'release-manifest.json')));
  const api = pipelineForFixture(f.f.rootDir, f.f.sourceSha);
  const result = await api.seal({ directory: f.directory, manifestIntegrity, lanesDirectory, resume: true });
  assert.equal(result.manifestIntegrity, manifestIntegrity);
  for (const [file, hash] of before) assert.equal(digest(fs.readFileSync(file)), hash, file);
});
test('actual seal --resume refuses a merely prepared artifact before looking for incoming lanes', async t => {
  const f = await productionFixture(t);
  const api = pipelineForFixture(f.f.rootDir, f.f.sourceSha);
  await assert.rejects(api.seal({ directory: f.directory,
    manifestIntegrity: digest(fs.readFileSync(path.join(f.directory, 'release-manifest.json'))),
    lanesDirectory: '/nonexistent/must-not-read', resume: true }), /Sealed artifact phase/);
});
test('sealed enrollment cannot be forged by cloning a primitive artifact; real library stops before registry', async t => {
  const f = await packedFixture(t);
  let calls = 0; const forbidden = () => { calls++; throw Error('Registry backend reached'); };
  const strict = require('./authority-fixture.cjs').loadPublisher(true, { sealedBoundary: 'real' });
  await assert.rejects(strict.publishRelease({ artifact: { ...f.artifact }, ledgerFile: f.ledgerFile, publish: true,
    registry: { version: forbidden, package: forbidden }, publisher: { publish: forbidden } }), /fully verified sealed/);
  assert.equal(calls, 0);
});
test('real sealed validation boundary reaches only in-memory sequential publishing under a source-retired test loader', async t => {
  const f = await productionFixture(t, { sealed: true, group: 'mcp' });
  const artifact = await f.verify({ phase: 'sealed' });
  for (const entry of artifact.packages) {
    f.r.versions.delete(entry.name); f.r.packages.get(entry.name).versions = []; f.r.packages.get(entry.name)['dist-tags'] = {};
  }
  const strict = require('./authority-fixture.cjs').loadPublisher(true, { sealedBoundary: 'real' });
  const ledger = await strict.publishRelease({ artifact, ledgerFile: f.f.ledgerFile, ...f.r, publish: true });
  assert.equal(ledger.status, 'complete'); assert.equal(f.r.calls.filter(c => c[0] === 'publish').length, 1);
  assert.throws(() => require('../../scripts/scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
});
test('sealed file tampering or mutation after verification stops before registry', async t => {
  const f = await productionFixture(t, { sealed: true });
  const artifact = await f.verify({ phase: 'sealed' });
  fs.appendFileSync(path.join(f.directory, 'build.json'), ' ');
  await assert.rejects(assertSealedArtifact(artifact), /Build evidence integrity mismatch/);
});

// Run the actual producer function with controlled child commands. This proves
// its assignments/order/failure behavior, not an actual MCP or product build.
function producer(t, fault) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'producer-command-contract-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'sentinel.txt'), 'controlled source\n');
  const archive = execFileSync('tar', ['-cf', '-', '-C', directory, 'sentinel.txt']);
  const seen = [], npmCli = process.env.XTEND_RELEASE_TEST_NPM_CLI;
  const file = path.join(root, 'scripts/release/pipeline.cjs');
  const realRequire = Module.createRequire(file), compiled = new Module(file, module);
  compiled.filename = file;
  compiled.require = name => {
    if (name === './toolchain.cjs') return { resolveNpmCli: () => npmCli };
    if (name !== 'node:child_process') return realRequire(name);
    return { spawnSync: require('node:child_process').spawnSync, execFileSync(program, args, options) {
      if (program === 'git' && args[0] === 'archive') { assert.equal(args.at(-1), 'a'.repeat(40)); return archive; }
      if (program === 'git' && args[0] === 'ls-files') return 'sentinel.txt\0';
      if (program === 'tar') return execFileSync(program, args, options);
      assert.equal(program, process.execPath); seen.push(args);
      if (fault === 'command-failure' && args.includes('--check')) throw Error('controlled knowledge check failure');
      if (fault === 'stale-source') fs.appendFileSync(path.join(options.cwd, 'sentinel.txt'), 'changed');
      return Buffer.alloc(0);
    } };
  };
  compiled._compile(fs.readFileSync(file, 'utf8'), file);
  return { run: () => compiled.exports.buildCommittedSource('a'.repeat(40)), seen, npmCli };
}
test('actual producer returns the exact five-command receipt only after all controlled commands succeed', t => {
  const f = producer(t), receipt = f.run();
  verifyBuildCommands(receipt, { mcpSelected: true });
  assert.deepEqual(receipt.commands, buildCommands());
  assert.deepEqual(f.seen, buildCommands().map(c => c[0] === 'scripts' ? [f.npmCli, 'run', c[1]] : c.slice(1)));
  assert.equal(receipt.mcpKnowledgeGenerated, true); assert.equal(receipt.mcpKnowledgeChecked, true);
});
for (const problem of ['command-failure', 'stale-source']) test(`actual producer never returns acceptance flags for ${problem}`, t => {
  assert.throws(producer(t, problem).run, /controlled knowledge check failure|Committed generated artifacts are stale/);
});
