'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const zlib = require('node:zlib'), crypto = require('node:crypto');
const test = require('node:test'), assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const harness = require('./harness.cjs'), model = harness.load();
const api = require('../../../tools/schema-inventory/index.cjs');
const scanner = api.createScanner({ typescript: require('typescript'), defaultRootDir: harness.root });
const id = ['xtend', 'product-candidates', 'v1'].join('.'), family = ['xtend', 'product-candidates'].join('.');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(path.join(__dirname, 'proposed-current-five-registration.json.gz'));
assert.equal(digest(bytes), 'a99cc69a791172883e1941721a364e10a7bec96a0c10fa1162caa81b606768c8');
const proof = JSON.parse(zlib.gunzipSync(bytes));
const inventory = JSON.parse(fs.readFileSync(path.join(harness.root, 'tests/schemas/xtend-schema-inventory.json')));
const entry = doc => doc.entries.find(e => e.schemaId === id);
const scoped = (doc, scan, rootDir = harness.root) => scanner.validateInventoryDocument(doc, scan, { rootDir }).errors
  .filter(e => e.schemaId === id || e.familyId === family || e.schemaIds?.includes(id));
const bound = (doc, scan, rootDir = harness.root) => model.__testInitialAuthority(entry(doc), doc, scan, rootDir);

test('unapplied current five is exactly historical six minus one named test variant; both snapshots and authority survive', () => {
  assert.equal(proof.proposalOnly, true); assert.equal(proof.approvalApplied, false);
  const sixBytes = fs.readFileSync(path.join(__dirname, 'proposed-six-registration.json.gz'));
  const fourBytes = fs.readFileSync(path.join(__dirname, 'approved-registration.json.gz'));
  assert.equal(digest(sixBytes), 'c6ea40a991d4994e1784e638d96bbfec92319e7753da5cf2b969fa99cfb27243');
  assert.equal(digest(fourBytes), 'f674260de7daf717d52fbad0eec361abbfef8b0b9a99de47dac66e320a062b36');
  const six = JSON.parse(zlib.gunzipSync(sixBytes));
  assert.deepEqual(entry(inventory), proof.entry);
  assert.deepEqual(entry(inventory).shapePolicy.acceptedFingerprints,
    six.entry.shapePolicy.acceptedFingerprints.filter(hash => hash !== proof.removedCurrentFingerprint));
  assert.equal(entry(inventory).shapeFingerprints.length, 5);
  assert.deepEqual(entry(inventory).initialAuthorityReview, six.entry.initialAuthorityReview);
  assert.deepEqual(entry(inventory).lifecycle, { status: 'active', rollout: 'planned' });
  assert.equal(entry(inventory).releasedFingerprintSetHash, null);
  assert.equal(entry(inventory).shapePolicy.releasedFingerprintSetHash, null);
  assert.deepEqual(entry(inventory).shapePolicy.authoritativeFingerprints, six.entry.shapePolicy.authoritativeFingerprints);
  assert.deepEqual(inventory.schemaFamilies.find(f => f.familyId === family), six.family);
  assert.equal(digest(fs.readFileSync(path.join(harness.root, 'candidate-integrity.d.ts'))),
    '4b096560d425afd3c16aba9353d9a974e9e12138a5512e9941a69fa608382c47');
  assert.deepEqual(scoped(inventory, proof.observation), []);
  assert.equal(bound(inventory, proof.observation), true);
  assert.throws(() => require('../../../scripts/scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
});

test('real public scanner observes exactly the proposed current five; this is no full-schema or product acceptance', t => {
  const actual = scanner.scanSchemaInventory({ rootDir: harness.root });
  const observed = entry(actual);
  assert.equal(observed.shapeFingerprints.length, 5);
  assert.deepEqual(observed.shapeFingerprints.map(f => f.hash).sort(), proof.currentFiveFingerprints.slice().sort());
  assert.equal(bound(inventory, actual), true);
  assert.deepEqual(scoped(inventory, actual), []);
  if (process.env.XTEND_CURRENT_FIVE_OBSERVATION) fs.writeFileSync(process.env.XTEND_CURRENT_FIVE_OBSERVATION,
    JSON.stringify({ proposalOnly: true, productAcceptance: false, observation: observed,
      scopedCandidateErrors: scoped(inventory, actual), scanStats: actual.stats }, null, 2) + '\n');
  t.diagnostic('Current exact fingerprints: ' + JSON.stringify(observed.shapeFingerprints.map(f => f.hash).sort()));
});

for (const variant of ['unknown', 'reintroduced-historical']) test('real scanned ' + variant + ' expression cannot borrow the current five registration', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'current-five-foreign-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  if (variant === 'unknown') {
    fs.writeFileSync(path.join(directory, 'unknown.cjs'), 'const manifest = { schema: ' + JSON.stringify(id) + ', unreviewed: true };\n');
  } else {
    const relative = 'tests/migration/packaged-authority.test.cjs';
    const original = fs.readFileSync(path.join(harness.root, relative), 'utf8');
    assert.equal(digest(Buffer.from(original)), '5d87c31b857d8e2bb6d1ae706829b07b09335b7aba3f6cadb1af3cc44170b4c1');
    const expression = "['xtend','product-candidates','v1'].join('.')";
    assert.equal(original.split(expression).length, 2);
    const target = path.join(directory, relative); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, original.replace(expression, JSON.stringify(id)));
  }
  const foreign = entry(scanner.scanSchemaInventory({ rootDir: directory }));
  assert.ok(foreign?.shapeFingerprints.length);
  const hash = variant === 'reintroduced-historical' ? proof.removedCurrentFingerprint : foreign.shapeFingerprints[0].hash;
  const fingerprint = foreign.shapeFingerprints.find(f => f.hash === hash);
  assert.ok(fingerprint, 'Real parser must reproduce the foreign normalized fingerprint');
  assert.ok(!proof.currentFiveFingerprints.includes(hash));
  const scan = structuredClone(proof.observation); entry(scan).shapeFingerprints.push(fingerprint);
  assert.equal(bound(inventory, scan), false);
  const errors = scoped(inventory, scan);
  assert.ok(errors.some(e => e.code === 'shape-fingerprint-drift'));
  assert.ok(errors.some(e => e.code === 'released-fingerprint-drift'));
});

for (const mutant of ['extra-accepted', 'wrong-source', 'wrong-authority']) test('current-five registration rejects ' + mutant, () => {
  const doc = structuredClone(inventory), e = entry(doc);
  if (mutant === 'extra-accepted') e.shapePolicy.acceptedFingerprints.push(proof.removedCurrentFingerprint);
  if (mutant === 'wrong-source') e.initialAuthorityReview.sourceSha256 = '0'.repeat(64);
  if (mutant === 'wrong-authority') e.initialAuthorityReview.authoritativeFingerprint = 'sha256:' + '0'.repeat(64);
  assert.equal(bound(doc, proof.observation), false);
  assert.ok(scoped(doc, proof.observation).length);
});

test('current-five metadata leaves the actual publisher guard before every registry/backend read', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'current-five-publish-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let calls = 0; const forbidden = () => { calls++; throw Error('No registry/backend permitted'); };
  await assert.rejects(require('../../../scripts/release/publish.cjs').publishRelease({
    artifact: { order: [], packages: [], sourceSha: 'a'.repeat(40), manifestIntegrity: 'controlled-unusable', toolchain: { npm: '11.17.0' } },
    ledgerFile: path.join(directory, 'ledger.json'), publish: true,
    registry: { version: forbidden, package: forbidden }, publisher: { publish: forbidden, dryRun: forbidden }
  }), /source-level initial-authority retirement/);
  assert.equal(calls, 0);
});

for (const group of ['mcp', 'material']) test('current-five metadata leaves the real clean-shell ' + group + ' CLI guard active', () => {
  const env = { ...process.env }; delete env.npm_execpath; delete env.XTEND_NPM_CLI; delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['scripts/release/cli.cjs', 'publish', '--execute', '--groups', group],
    { cwd: harness.root, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /source-level initial-authority retirement/);
  assert.doesNotMatch(result.stderr, /Artifact|npm CLI|Publish requires/);
});
