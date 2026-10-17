'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const zlib = require('node:zlib'), crypto = require('node:crypto');
const test = require('node:test'), assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const harness = require('./harness.cjs'), scanner = harness.load();
const id = ['xtend', 'product-candidates', 'v1'].join('.');
const familyId = ['xtend', 'product-candidates'].join('.');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const proofBytes = fs.readFileSync(path.join(__dirname, 'proposed-six-registration.json.gz'));
assert.equal(sha(proofBytes), 'c6ea40a991d4994e1784e638d96bbfec92319e7753da5cf2b969fa99cfb27243');
const proof = JSON.parse(zlib.gunzipSync(proofBytes));
// Historical six-shape model: never asserted to be the current source inventory.
const current = JSON.parse(fs.readFileSync(path.join(harness.root, 'tests/schemas/xtend-schema-inventory.json')));
current.entries = current.entries.map(e => e.schemaId === id ? structuredClone(proof.entry) : e);
current.schemaFamilies = current.schemaFamilies.map(f => f.familyId === familyId ? structuredClone(proof.family) : f);
current.duplicateReviews = current.duplicateReviews.filter(r => !r.schemaIds?.includes(id)).concat(structuredClone(proof.duplicateReviews));
const entry = value => value.entries.find(e => e.schemaId === id);
const errors = (doc = current, scan = proof.observation, rootDir = harness.historicalRoot) =>
  scanner.validateInventoryDocument(doc, scan, { rootDir }).errors
    .filter(e => e.schemaId === id || e.familyId === familyId || e.schemaIds?.includes(id));
const bound = (doc = current, scan = proof.observation, rootDir = harness.historicalRoot) =>
  scanner.__testInitialAuthority(entry(doc), doc, scan, rootDir);

test('historical exact six-shape model preserves the four-shape snapshot and sole initial authority', () => {
  assert.equal(proof.proposalOnly, true);
  assert.equal(proof.sourceHead, 'b29b7816fe82b9b725f6321628054e7081551698');
  const oldBytes = fs.readFileSync(path.join(__dirname, 'approved-registration.json.gz'));
  assert.equal(sha(oldBytes), 'f674260de7daf717d52fbad0eec361abbfef8b0b9a99de47dac66e320a062b36');
  const old = JSON.parse(zlib.gunzipSync(oldBytes));
  assert.deepEqual(proof.historicalFingerprints, old.duplicateReviews[0].resolution.fingerprints);
  assert.deepEqual(entry(current).shapePolicy.acceptedFingerprints,
    [...proof.historicalFingerprints, ...proof.addedFixtureFingerprints]);
  assert.equal(proof.addedFixtureFingerprints.length, 2);
  assert.deepEqual(entry(current), proof.entry);
  assert.deepEqual(entry(current).initialAuthorityReview, old.entry.initialAuthorityReview);
  assert.deepEqual(entry(current).lifecycle, { status: 'active', rollout: 'planned' });
  assert.equal(entry(current).releasedFingerprintSetHash, null);
  assert.equal(entry(current).shapePolicy.releasedFingerprintSetHash, null);
  assert.deepEqual(entry(current).shapePolicy.authoritativeFingerprints,
    ['sha256:9e5c32f5a6256cefd292cd5a4073baf1af4369eb01e878566ab10a8c976d20d9']);
  assert.equal(sha(fs.readFileSync(path.join(harness.historicalRoot, 'candidate-integrity.d.ts'))),
    '4b096560d425afd3c16aba9353d9a974e9e12138a5512e9941a69fa608382c47');
  assert.deepEqual(errors(), []);
  assert.equal(bound(), true);
  assert.throws(() => scanner.assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
});

test('historical six observation is frozen evidence, not the current five registration', () => {
  const live = JSON.parse(fs.readFileSync(path.join(harness.root, 'tests/schemas/xtend-schema-inventory.json')));
  assert.equal(entry(current).shapeFingerprints.length, 6);
  assert.equal(entry(live).shapeFingerprints.length, 5);
  assert.equal(bound(live, proof.observation), false);
  assert.ok(errors(live, proof.observation).some(e => e.code === 'released-fingerprint-drift'));
});

for (const mutant of ['extra-accepted', 'seventh-observed', 'wrong-source-review', 'wrong-authority-review', 'wrong-authority-set']) {
  test(`exact six-shape registration rejects ${mutant}`, () => {
    const doc = structuredClone(current), scan = structuredClone(proof.observation), e = entry(doc);
    if (mutant === 'extra-accepted') e.shapePolicy.acceptedFingerprints.push('sha256:' + '0'.repeat(64));
    if (mutant === 'seventh-observed') {
      const seventh = structuredClone(scan.entries[0].shapeFingerprints[0]);
      seventh.hash = 'sha256:' + '0'.repeat(64);
      scan.entries[0].shapeFingerprints.push(seventh);
    }
    if (mutant === 'wrong-source-review') e.initialAuthorityReview.sourceSha256 = '0'.repeat(64);
    if (mutant === 'wrong-authority-review') e.initialAuthorityReview.authoritativeFingerprint = 'sha256:' + '0'.repeat(64);
    if (mutant === 'wrong-authority-set') e.shapePolicy.authoritativeFingerprints = ['sha256:' + '0'.repeat(64)];
    assert.equal(bound(doc, scan), false);
    assert.ok(errors(doc, scan).length > 0);
  });
}

test('changed declaration bytes cannot borrow the six-shape initial registration', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'six-authority-mutant-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'candidate-integrity.d.ts'),
    fs.readFileSync(path.join(harness.root, 'candidate-integrity.d.ts')) + '\n// controlled source mutant\n');
  assert.equal(bound(current, proof.observation, directory), false);
  assert.ok(errors(current, proof.observation, directory).some(e => e.code === 'released-fingerprint-drift'));
});

test('six-shape metadata never authorizes the actual publisher library before registry access', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'six-publish-guard-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let calls = 0;
  const forbidden = () => { calls++; throw Error('Registry/backend must not be reached'); };
  const publish = require('../../../scripts/release/publish.cjs').publishRelease;
  await assert.rejects(publish({ artifact: { manifest: { schema: ['xtend', 'release', 'artifact', 'v1'].join('.'), candidateBinding: { demoSha: 'b'.repeat(40) }, unionEvidence: {} }, order: [], packages: [], sourceSha: 'a'.repeat(40),
    manifestIntegrity: 'controlled-unusable', toolchain: { npm: '11.17.0' } },
    ledgerFile: path.join(directory, 'ledger.json'), publish: true,
    registry: { version: forbidden, package: forbidden }, publisher: { publish: forbidden, dryRun: forbidden } }), /source-level/);
  assert.equal(calls, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'ledger.json'))).status, 'failed');
});

for (const group of ['mcp', 'material']) test(`real clean-shell ${group} CLI still blocks before artifact/registry/toolchain`, () => {
  const env = { ...process.env }; delete env.npm_execpath; delete env.XTEND_NPM_CLI; delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['scripts/release/cli.cjs', 'publish', '--execute', '--groups', group],
    { cwd: harness.root, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /source-level initial-authority retirement/);
  assert.doesNotMatch(result.stderr, /Artifact|npm CLI|Publish requires/);
});
