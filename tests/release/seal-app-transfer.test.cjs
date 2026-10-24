'use strict';
// Legacy v1 audit suite; frozen release envelope code, current shared verifiers.
// Current Core v2 boundaries are covered separately in core-contracts.test.cjs.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const { execFileSync } = require('node:child_process');
const { digest, verifyArtifact } = require('./legacy-runtime.cjs').load('scripts/release/artifact.cjs');
const { write } = require('./legacy-runtime.cjs').load('tests/release/fixtures.cjs');
const product = require('../../scripts/product-candidate-evidence.cjs');
const { fixture: unionFixture } = require('./union-fixture.cjs');
const root = path.resolve(__dirname, '../..');
const lanes = ['24.18.0', '26.5.0'];
const rawFiles = ['electron-sandbox-attestation.json', 'electron-app-attestation-consumer.json'];
const sha = require('../../candidate-integrity.cjs').digest;

// Reuse actual adapter/artifact miniature factories. This is runtime unit evidence,
// not an application run, canonical production pack or acceptance of red Union gates.
const file = path.join(__dirname, 'runtime-contracts.test.cjs');
const source = fs.readFileSync(file, 'utf8'), ts = require('typescript');
const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const functions = tree.statements.filter(n => ts.isFunctionDeclaration(n) &&
  ['factories', 'productionFixture'].includes(n.name?.text)).map(n => n.getText(tree));
assert.equal(functions.length, 2);
const compiled = new Module(file, module); compiled.filename = file; compiled.paths = Module._nodeModulePaths(__dirname);
compiled._compile(source.slice(0, source.indexOf('function factories')) + functions.join('\n') +
  '\nmodule.exports={productionFixture};', file);
const { productionFixture } = compiled.exports;

function snapshot(directory) {
  const result = {};
  function visit(dir) { for (const name of fs.readdirSync(dir)) {
    const target = path.join(dir, name), stat = fs.lstatSync(target);
    if (stat.isDirectory()) visit(target);
    else result[path.relative(directory, target)] = stat.isSymbolicLink() ? 'symlink:' + fs.readlinkSync(target) : sha(fs.readFileSync(target));
  } }
  visit(directory); return result;
}
function restoreEnvironment(t, env) {
  const saved = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => { for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  } });
}
function actualPipeline(f, trusted) {
  const file = path.join(root, 'scripts/release/pipeline.cjs'), real = require('./legacy-runtime.cjs').requireFrom('scripts/release/pipeline.cjs');
  const compiled = new Module(file, module); compiled.filename = file;
  compiled.require = name => name === 'node:child_process' ? {
    execFileSync(program, args) { assert.equal(program, 'git'); assert.deepEqual(args, ['rev-parse', 'HEAD']); return f.f.sourceSha; },
    spawnSync() { throw Error('No npm/build/product process allowed'); }
  } : name === './union.cjs' ? {
    // Only actual-source scanner acceptance is controlled here: it is genuinely
    // red in this proposal. Source/main/run/attempt/job policies below are real.
    verifyStoredUnion() {},
    verifyFreshUnion({ directory, sourceSha, demoSha }) {
      const api = real(name), env = process.env;
      const bound = api.expectedContext({ sourceSha, demoSha, env, needs: trusted.needs });
      const context = { ...bound.expected.context, sourceSha };
      api.checkRun(trusted.run, trusted.workflow, context);
      for (const name of ['Verify pinned union source artifact', ...lanes.map(node => 'Full release gates (Node ' + node + ')')]) api.checkJob(trusted.jobs, name, context);
      fs.mkdirSync(directory); write(path.join(directory, 'index.json'), { controlledUnitOnly: true });
    }
  } : real(name);
  const bytes = require('./legacy-runtime.cjs').source('scripts/release/pipeline.cjs'), needle = "const rootDir = path.resolve(__dirname, '../..');";
  assert.equal(bytes.split(needle).length, 2);
  compiled._compile(bytes.replace(needle, 'const rootDir = ' + JSON.stringify(f.f.rootDir) + ';'), file);
  return compiled.exports;
}
async function sealFixture(t, { sealed = false, old = false } = {}) {
  const f = await productionFixture(t, { sealed, old }), trusted = unionFixture(t);
  assert.equal(f.f.sourceSha, trusted.expected.coreSha); assert.equal(f.demoSha, trusted.expected.demoSha);
  restoreEnvironment(t, { ...trusted.env, XTEND_RELEASE_NEEDS: JSON.stringify(trusted.needs) });
  const lanesDirectory = path.join(f.f.directory, 'actual-seal-inputs'), byNode = {};
  for (const [node, suffix] of [['24.18.0', 'node-24-lts'], ['26.5.0', 'node-26-current']]) {
    const incoming = path.join(lanesDirectory, 'product-candidate-evidence-' + suffix);
    fs.mkdirSync(incoming, { recursive: true });
    const directory = path.join(incoming, 'product-candidates'); fs.cpSync(f.directory, directory, { recursive: true });
    const evidence = { ...structuredClone(f.evidence), releaseRuntime: { node, npm: '11.17.0' } };
    write(path.join(incoming, 'product-candidate.json'), evidence);
    byNode[node] = { incoming, directory, evidence };
  }
  const api = actualPipeline(f, trusted), integrity = () => digest(fs.readFileSync(path.join(f.directory, 'release-manifest.json')));
  return { ...f, trusted, api, byNode, lanesDirectory, integrity,
    seal: () => api.seal({ directory: f.directory, manifestIntegrity: integrity(), lanesDirectory, resume: sealed }) };
}
function reportMutation(directory, evidence, mutate) {
  const report = evidence.reports.find(r => r.id === 'electron-actual-app-attestation');
  const target = path.join(directory, report.file), suite = JSON.parse(fs.readFileSync(target));
  const app = JSON.parse(fs.readFileSync(path.join(directory, rawFiles[0])));
  const consumer = JSON.parse(fs.readFileSync(path.join(directory, rawFiles[1])));
  mutate({ app, consumer, suite, report });
  write(path.join(directory, rawFiles[0]), app); suite.attestation.app.sha256 = sha(fs.readFileSync(path.join(directory, rawFiles[0])));
  consumer.reportSha256 = suite.attestation.app.sha256;
  write(path.join(directory, rawFiles[1]), consumer); suite.attestation.consumer.sha256 = sha(fs.readFileSync(path.join(directory, rawFiles[1])));
  write(target, suite); report.sha256 = sha(fs.readFileSync(target));
}
function storedLane(f, node) {
  const lane = f.manifest.productEvidence.find(l => l.node === node), file = path.join(f.directory, lane.file);
  return { lane, file, directory: path.dirname(file), evidence: JSON.parse(fs.readFileSync(file)) };
}
function rebindStored(f, entry) {
  write(entry.file, entry.evidence); entry.lane.integrity = digest(fs.readFileSync(entry.file)); f.sync();
}
for (const resume of [false, true]) test('actual pipeline.seal ' + (resume ? 'resume' : 'fresh') + ' transfers both exact raw reports for both lanes', async t => {
  const f = await sealFixture(t, { sealed: resume }), before = snapshot(f.directory), original = f.integrity();
  const result = await f.seal();
  if (resume) { assert.equal(result.manifestIntegrity, original); assert.deepEqual(snapshot(f.directory), before); }
  else {
    const sealed = await verifyArtifact({ directory: f.directory, manifestIntegrity: result.manifestIntegrity,
      sourceSha: f.f.sourceSha, rootDir: f.f.rootDir, phase: 'sealed' });
    for (const lane of sealed.manifest.productEvidence) for (const file of rawFiles) {
      assert.equal(fs.readFileSync(path.join(f.directory, path.dirname(lane.file), file)).equals(
        fs.readFileSync(path.join(f.byNode[lane.node].directory, file))), true);
    }
  }
});
for (const mode of ['fresh', 'resume-input', 'stored']) for (const node of lanes) for (const file of rawFiles) for (const damage of ['missing', 'substituted', 'symlink']) {
  test(`${mode} actual Seal/verification rejects ${node} ${file} ${damage}`, async t => {
    const f = await sealFixture(t, { sealed: mode !== 'fresh' });
    const directory = mode === 'stored' ? storedLane(f, node).directory : f.byNode[node].directory;
    const target = path.join(directory, file);
    if (damage === 'missing') fs.unlinkSync(target);
    if (damage === 'substituted') fs.appendFileSync(target, ' ');
    if (damage === 'symlink') { const original = target + '.outside'; fs.renameSync(target, original); fs.symlinkSync(original, target); }
    const before = snapshot(f.directory);
    await assert.rejects(f.seal(), /ENOENT|digest mismatch|Invalid actual application/);
    if (mode !== 'fresh') assert.deepEqual(snapshot(f.directory), before);
    else assert.equal(fs.existsSync(path.join(f.directory, 'gate-receipt.json')), false);
  });
}
for (const mode of ['fresh', 'resume-input', 'stored']) for (const node of lanes) for (const damage of ['suite-digest', 'report-digest', 'stale', 'future', 'source']) {
  test(`${mode} actual Seal/verification rejects ${node} ${damage}`, async t => {
    const f = await sealFixture(t, { sealed: mode !== 'fresh' });
    const entry = mode === 'stored' ? storedLane(f, node) : f.byNode[node];
    if (damage === 'report-digest') entry.evidence.reports.find(r => r.id === 'electron-actual-app-attestation').sha256 = '0'.repeat(64);
    else if (damage === 'suite-digest') {
      const r = entry.evidence.reports.find(r => r.id === 'electron-actual-app-attestation');
      fs.appendFileSync(path.join(entry.directory, r.file), ' ');
    } else reportMutation(entry.directory, entry.evidence, ({ app, consumer }) => {
      if (damage === 'source') app.coreSha = 'e'.repeat(40);
      else app.generatedAt = consumer.generatedAt = new Date(Date.now() + (damage === 'future' ? 60000 : -3601000)).toISOString();
    });
    if (mode === 'stored') rebindStored(f, entry); else write(path.join(entry.incoming, 'product-candidate.json'), entry.evidence);
    const before = snapshot(f.directory);
    await assert.rejects(f.seal(), /digest mismatch|identity|Stale|stale/);
    if (mode === 'stored') assert.deepEqual(snapshot(f.directory), before);
    assert.equal(fs.existsSync(path.join(f.directory, 'gate-receipt.json')), false);
  });
}
for (const node of lanes) for (const damage of ['selection102', 'residual24', 'authorities21']) test(`actual Seal rejects independent ${node} ownership ${damage}`, async t => {
  const f = await sealFixture(t), entry = f.byNode[node], report = entry.evidence.reports.find(r => r.id === 'schema-ownership-103');
  const file = path.join(entry.directory, report.file), value = JSON.parse(fs.readFileSync(file));
  if (damage === 'selection102') value.selection.pop();
  if (damage === 'residual24') value.remainingOwnershipIds = 24;
  if (damage === 'authorities21') value.authorities.splice(21);
  write(file, value); report.sha256 = sha(fs.readFileSync(file)); write(path.join(entry.incoming, 'product-candidate.json'), entry.evidence);
  await assert.rejects(f.seal(), /103-ID selection|candidate identity|authority evidence/);
  assert.equal(fs.existsSync(path.join(f.directory, 'gate-receipt.json')), false);
});
test('stored raw App and ownership receipts stay valid at original sealedAt after wall-clock advances, never refreshed', async t => {
  const f = await sealFixture(t, { sealed: true, old: true }), before = snapshot(f.directory);
  const verify = now => verifyArtifact({ directory: f.directory, sourceSha: f.f.sourceSha, rootDir: f.f.rootDir,
    manifestIntegrity: f.integrity(), phase: 'sealed', ...(now === undefined ? {} : { now }) });
  await verify(); assert.deepEqual(snapshot(f.directory), before);
  await assert.rejects(verify(Date.now()), /Stale actual application raw evidence/);
  // Fresh incoming reports are separately checked at real current now; only
  // the original immutable bytes are checked at their original sealing time.
  for (const entry of Object.values(f.byNode)) {
    const now = new Date().toISOString();
    reportMutation(entry.directory, entry.evidence, ({ app, consumer }) => { app.generatedAt = consumer.generatedAt = now; });
    const report = entry.evidence.reports.find(r => r.id === 'schema-ownership-103'), file = path.join(entry.directory, report.file);
    const value = JSON.parse(fs.readFileSync(file)); value.generatedAt = now; write(file, value); report.sha256 = sha(fs.readFileSync(file));
    entry.evidence.generatedAt = now; write(path.join(entry.incoming, 'product-candidate.json'), entry.evidence);
  }
  const integrity = f.integrity(), result = await f.seal(); assert.equal(result.manifestIntegrity, integrity);
  assert.deepEqual(snapshot(f.directory), before);
});
test('migration ownership verification and actual App verification consume the same explicit old verification time', async t => {
  const f = await productionFixture(t, { old: true }), api = require('../../tools/schema-inventory/index.cjs');
  const original = api.verifyMigrationOwnershipEvidence, now = Date.parse(f.evidence.generatedAt) + 1000; let observed;
  api.verifyMigrationOwnershipEvidence = (binding, options) => { observed = options.now; return original(binding, options); };
  t.after(() => { api.verifyMigrationOwnershipEvidence = original; });
  assert.equal(product.verifyReportFiles(f.evidence.reports, { directory: f.directory, coreSha: f.f.sourceSha,
    demoSha: f.demoSha, manifest: f.manifest, now }), true);
  assert.equal(observed, now);
  // Ownership is fresh here; stale App-only bytes independently reject at current time.
  const appReport = f.evidence.reports.filter(r => r.id === 'electron-actual-app-attestation');
  assert.throws(() => product.verifyReportFiles(appReport, { directory: f.directory, coreSha: f.f.sourceSha,
    demoSha: f.demoSha, now: Date.now() }), /Stale actual application/);
});
for (const mutation of ['source', 'main', 'run', 'attempt']) test('actual Seal transfer keeps real Union ' + mutation + ' identity guard before writes', async t => {
  const f = await sealFixture(t), before = snapshot(f.directory);
  if (mutation === 'source') f.trusted.needs['union-source-artifact'].outputs['core-sha'] = 'e'.repeat(40);
  if (mutation === 'main') process.env.GITHUB_REF = 'refs/heads/foreign';
  if (mutation === 'run') f.trusted.run.id++;
  if (mutation === 'attempt') f.trusted.run.run_attempt++;
  await assert.rejects(f.seal(), /identity|source\/pin|trusted main|workflow run\/attempt|actual source head, never PR merge\/target execution/);
  assert.deepEqual(snapshot(f.directory), before);
});
test('Core workflow excludes Demo hydration; legacy transfer preserves exact raw bytes and digests', async t => {
  const f=await productionFixture(t),workflow=fs.readFileSync(path.join(root,'.github/workflows/xtend-default-gates.yml'),'utf8');
  assert.ok(!workflow.includes('copyActualAppFiles'));assert.ok(!workflow.includes('product-candidate-canary:'));assert.match(workflow,/core-installed-consumers:/);
  const isolated = path.join(f.f.directory, 'yaml-hydration'); fs.mkdirSync(isolated);
  fs.symlinkSync(path.join(root, 'scripts'), path.join(isolated, 'scripts'), 'dir');
  const incoming = path.join(isolated, '.xtend-test-results/product-lanes/product-candidate-evidence-node-24-lts/product-candidates');
  fs.mkdirSync(incoming, { recursive: true });
  for (const name of ['locks', 'reports', ...rawFiles]) fs.cpSync(path.join(f.directory, name), path.join(incoming, name), { recursive: true });
  const destination = path.join(isolated, '.xtend-test-results/product-candidates'); fs.mkdirSync(destination);
  fs.copyFileSync(path.join(f.directory, 'manifest.json'), path.join(destination, 'manifest.json'));
  write(path.join(isolated, '.xtend-test-results/product-lanes/product-candidate-evidence-node-24-lts/product-candidate.json'), f.evidence);
  write(path.join(incoming, 'installation.json'), { results: f.evidence.installation }); write(path.join(incoming, 'reports.json'), f.evidence.reports);
  product.copyActualAppFiles(f.evidence.reports,{directory:incoming,destination,coreSha:f.f.sourceSha,demoSha:f.demoSha});
  for (const name of rawFiles) assert.equal(fs.readFileSync(path.join(destination, name)).equals(fs.readFileSync(path.join(incoming, name))), true);
  for (const name of rawFiles) {
    fs.unlinkSync(path.join(destination, name)); fs.appendFileSync(path.join(incoming, name), ' ');
    assert.throws(() => product.copyActualAppFiles(f.evidence.reports, { directory: incoming, destination,
      coreSha: f.f.sourceSha, demoSha: f.demoSha }), /digest mismatch/);
  }
});
