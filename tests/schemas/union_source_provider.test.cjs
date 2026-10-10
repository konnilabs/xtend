'use strict';
const rawTest = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const events = [];
function test(name, callback) { return rawTest(name, () => { try { callback(); events.push({name, outcome: 'passed'}); } catch (error) { events.push({name, outcome: 'failed', error: error.message}); throw error; } }); }
test.before = rawTest.before; test.after = rawTest.after;
const api = require('../../tools/schema-inventory/index.cjs');
const archive = process.env.XTEND_UNION_ARCHIVE, receipt = process.env.XTEND_UNION_EXPECTED;
const scanner = api.createScanner({ typescript: require('typescript') });
const id = ['xtend', 'surface', 'controller', 'v2'].join('.');
let base, expected, baseline;
function materialize(artifact = archive, expectation = expected) {
  const destination = path.join(base, 'extracted-' + crypto.randomUUID());
  return api.createSourceProvider({ archive: artifact, destination, expected: expectation });
}
const crypto = require('node:crypto');
function mutated(name) {
  const directory = path.join(base, name);
  const command = spawnSync('python3', [path.join(__dirname, 'union_artifact_mutation.py'), archive, receipt, directory, name], { encoding: 'utf8' });
  assert.equal(command.status, 0, command.stderr);
  return [path.join(directory, 'sources.tar.gz'), JSON.parse(fs.readFileSync(path.join(directory, 'expected.json')))];
}
function scan(provider) {
  const observed = scanner.scanSchemaInventory({ rootDir: base, sourceProvider: provider });
  const inventory = JSON.parse(provider.readCurrent('tests/schemas/xtend-schema-inventory.json'));
  return { observed, inventory, validation: scanner.validateInventoryDocument(inventory, observed, { sourceProvider: provider }) };
}
test.before(() => {
  assert.ok(archive && receipt, 'Actual pinned artifact and authenticated expected receipt are required; do not skip');
  expected = JSON.parse(fs.readFileSync(receipt)); base = fs.mkdtempSync(path.join(os.tmpdir(), 'union-provider-tests-'));
});
test.after(() => { const output = process.env.XTEND_UNION_TEST_REPORT; if (output && fs.existsSync(output)) { const report = JSON.parse(fs.readFileSync(output)); report.portableTests = events; fs.writeFileSync(output, JSON.stringify(report, null, 2)); } if (base) fs.rmSync(base, { recursive: true, force: true }); });
test('local productive full-source path, both owners, zero historical observations; full reds remain red', () => {
  const provider = materialize(); baseline = scan(provider); baseline.provider = provider;
  assert.ok(baseline.observed.sourceProvenance.bindings.some(row => row.owner === 'core'));
  assert.ok(baseline.observed.sourceProvenance.bindings.some(row => row.owner === 'demo'));
  assert.equal(baseline.observed.sourceProvenance.historicalProductiveFiles, 0);
  assert.ok(baseline.observed.files.every(name => !name.startsWith('evidence/historical/')));
  assert.equal(baseline.validation.valid, baseline.validation.errors.length === 0);
  assert.throws(() => scanner.validateInventoryDocument(baseline.inventory, baseline.observed), /requires its verified/);
  const output = process.env.XTEND_UNION_TEST_REPORT;
  if (output) { fs.mkdirSync(path.dirname(output), {recursive: true}); fs.writeFileSync(output, JSON.stringify({ localProductivePath: true, hostedP01: 'pending', stats: baseline.observed.stats,
    validation: baseline.validation, provenance: provider.provenance() }, null, 2)); }
});
for (const [name, change, message] of [
  ['wrong Core head', e => e.coreSha = '0'.repeat(40), /repository identity/],
  ['wrong Demo head', e => e.demoSha = '0'.repeat(40), /repository identity/],
  ['wrong run', e => e.context.runId += '-other', /run\/repository/],
  ['wrong attempt', e => e.context.runAttempt += '-other', /run\/repository/],
  ['wrong archive digest', e => e.archiveSha256 = '0'.repeat(64), /Archive digest/],
  ['wrong manifest digest', e => e.manifestSha256 = '0'.repeat(64), /Manifest digest/]
]) test(name, () => { const e = structuredClone(expected); change(e); assert.throws(() => materialize(archive, e), message); });
for (const name of ['historical-tamper', 'historical-missing', 'current-missing', 'current-tamper', 'extra-member', 'link', 'traversal', 'duplicate', 'wrong-mode', 'incomplete-tree', 'pin', 'ambiguous-owner']) {
  test('reject controlled artifact mutation: ' + name, () => assert.throws(() => materialize(...mutated(name))));
}
test('new unscoped ID never becomes success through focused reporting', () => {
  const result = scan(materialize(...mutated('new-id')));
  assert.equal(result.validation.valid, false);
  assert.ok(result.validation.errors.some(error => error.code === 'coverage-missing-schema' && error.schemaId === ['xtend', 'unreviewed-union-contract', 'v1'].join('.')));
});
test('extra unscoped authoritative declaration retains strict drift failure', () => {
  const result = scan(materialize(...mutated('extra-authority'))), observed = result.observed.entries.find(entry => entry.schemaId === id);
  assert.ok(observed.shapeFingerprints.some(shape => shape.authoritative && shape.sourcePaths.includes('unscoped-extra-authority.d.ts')));
  assert.equal(result.validation.valid, false);
  assert.ok(result.validation.errors.some(error => error.schemaId === id && error.code === 'shape-fingerprint-drift'));
});
test('other unscoped source coverage remains a failure', () => {
  const result = scan(materialize(...mutated('unscoped-usage')));
  assert.ok(result.validation.errors.some(error => error.code === 'coverage-missing-source' && error.path === 'unscoped-new-usage.mjs'));
  assert.equal(result.validation.valid, false);
});
test('verified provider brand cannot be forged with arbitrary hooks', () => assert.throws(() => scanner.scanSchemaInventory({ sourceProvider: { files: () => [] } }), /Verified manifest/));
test('materialized current files cannot be tampered after verification', () => {
  const provider = materialize(), file = provider.files()[0]; fs.appendFileSync(file.absolutePath, ' ');
  assert.throws(() => provider.files(), /Materialized source changed/);
});
test('single-root default and explicit undefined-provider behavior remain identical', () => {
  const fixture = path.join(base, 'single-root'); fs.mkdirSync(fixture);
  fs.writeFileSync(path.join(fixture, 'contract.mjs'), `export const SCHEMA = ${JSON.stringify(id)};\nexport const record = {schema: SCHEMA, value: 1};\n`);
  // This comparison can run in repository CI without a second extractor:
  // identical default and explicit undefined-provider routes must agree.
  assert.deepEqual(scanner.scanSchemaInventory({ rootDir: fixture }), scanner.scanSchemaInventory({ rootDir: fixture, sourceProvider: undefined }));
});
test('historical duplicate-review membership is not cleared or narrowed', () => {
  for (const prefix of ['shape-collision-ab2d575d65f5', 'shape-collision-d8432951a7d4']) {
    const review = baseline.observed.duplicateReviews.find(row => row.reviewId === prefix);
    assert.ok(review && review.schemaIds.length === 3, prefix);
    const changed = structuredClone(baseline.inventory);
    const stored = changed.duplicateReviews.find(row => row.reviewId === prefix);
    assert.ok(stored); stored.schemaIds = stored.schemaIds.slice(0, 2);
    const result = scanner.validateInventoryDocument(changed, baseline.observed, { sourceProvider: baseline.provider });
    assert.ok(result.errors.some(error => error.code === 'unregistered-duplicate-review' && error.reviewId === prefix));
  }
});

test('deliberate negative public-version literal remains an error, never registration', () => {
  const fake = ['xtend', 'product-candidates', 'v2'].join('.');
  assert.ok(baseline.validation.errors.some(error => error.code === 'coverage-missing-schema' && error.schemaId === fake));
  assert.ok(!baseline.inventory.entries.some(entry => entry.schemaId === fake));
});
test('current source path operates without a Demo dependency installation', () => {
  assert.ok(baseline.observed.sourceProvenance.bindings.every(row => !row.sourcePath.split('/').includes('node_modules')));
  assert.ok(baseline.observed.files.some(file => file.startsWith('products/')));
});
test('missing artifact cannot become empty success', () => assert.throws(() => materialize(path.join(base, 'absent.tar.gz'))));

test('cloned or forged provider observations cannot be validated', () => {
  const clone = structuredClone(baseline.observed);
  assert.throws(() => scanner.validateInventoryDocument(baseline.inventory, clone, {sourceProvider: baseline.provider}), /unmodified verified extraction/);
  const entry = clone.entries.find(row => row.shapeFingerprints.some(shape => !shape.authoritative));
  const fingerprint = entry.shapeFingerprints.find(shape => !shape.authoritative);
  fingerprint.authoritative = true;
  assert.throws(() => scanner.validateInventoryDocument(baseline.inventory, clone, {sourceProvider: baseline.provider}), /cloned or mutated/);
});
test('in-place observation mutation is rejected even with matching provider identity', () => {
  const original = baseline.observed.stats.schemaIdentifiers;
  try {
    baseline.observed.stats.schemaIdentifiers++;
    assert.throws(() => scanner.validateInventoryDocument(baseline.inventory, baseline.observed, {sourceProvider: baseline.provider}), /cloned or mutated/);
  } finally { baseline.observed.stats.schemaIdentifiers = original; }
  assert.deepEqual(scanner.validateInventoryDocument(baseline.inventory, baseline.observed, {sourceProvider: baseline.provider}).errors, baseline.validation.errors);
});
test('real current declaration with an old runtime hash is rejected as unaccepted authority', () => {
  const result = scan(materialize(...mutated('same-hash-declaration')));
  const schemaId = ['xtend','utility','ui-transition-result','v1'].join('.');
  const hash = 'sha256:19b97518f78ebfced8b99f8a72f8b277e44d1fbb7ed27138dcf3811ed9c09d39';
  const stored = baseline.inventory.entries.find(entry => entry.schemaId === schemaId);
  const observed = result.observed.entries.find(entry => entry.schemaId === schemaId);
  assert.ok(stored.shapeFingerprints.some(shape => shape.hash === hash && !shape.authoritative));
  assert.ok(!stored.shapePolicy.authoritativeFingerprints.includes(hash));
  const current = observed.shapeFingerprints.find(shape => shape.hash === hash);
  assert.ok(current?.evidence.some(evidence => evidence.authoritative && evidence.type === 'declared-type'
    && evidence.completeness === 'complete' && evidence.path === 'unreviewed-same-hash-authority.d.ts'));
  assert.ok(result.validation.errors.some(error => error.code === 'provider-unaccepted-authority-hash'
    && error.schemaId === schemaId && error.fingerprint === hash));
  assert.equal(result.validation.valid, false);
  recordProof('same-hash-declaration', result, schemaId, hash);
});
test('real copied accepted authority cannot inherit an unrecognized source binding', () => {
  const result = scan(materialize(...mutated('copied-authority')));
  const schemaId = ['xtend','product-candidates','v1'].join('.');
  const hash = 'sha256:9e5c32f5a6256cefd292cd5a4073baf1af4369eb01e878566ab10a8c976d20d9';
  const stored = baseline.inventory.entries.find(entry => entry.schemaId === schemaId);
  assert.ok(stored.shapePolicy.authoritativeFingerprints.includes(hash));
  assert.ok(result.observed.entries.find(entry => entry.schemaId === schemaId).shapeFingerprints.find(shape => shape.hash === hash)
    .evidence.some(evidence => evidence.authoritative && evidence.path === 'unreviewed-authority-copy.d.ts'));
  assert.ok(result.validation.errors.some(error => error.code === 'provider-unaccepted-authority-provenance'
    && error.schemaId === schemaId && error.fingerprint === hash && error.path === 'unreviewed-authority-copy.d.ts'));
  assert.equal(result.validation.valid, false);
  recordProof('copied-authority', result, schemaId, hash);
});
function recordProof(name, result, schemaId, hash) {
  const output = process.env.XTEND_UNION_TEST_REPORT;
  if (output) fs.writeFileSync(output + '.' + name + '.json', JSON.stringify({
    kind: 'actual controlled current-source artifact and public extraction; no scan mutation',
    sourceIdentity: result.observed.sourceProvenance, schemaId, hash,
    observedFingerprint: result.observed.entries.find(entry => entry.schemaId === schemaId).shapeFingerprints.find(shape => shape.hash === hash),
    storedAuthority: baseline.inventory.entries.find(entry => entry.schemaId === schemaId).shapePolicy,
    validation: result.validation, hostedP01: 'pending'
  }, null, 2));
}

test('generated formal Demo paths keep owner classification after logical mapping', () => {
  const result = scan(materialize(...mutated('generated-formal')));
  const entry = result.observed.entries.find(row => row.schemaId === ['xtend','unreviewed-generated-formal','v1'].join('.'));
  assert.ok(entry); assert.equal(entry.canonicalDefinition, null); assert.equal(entry.status, 'generated-mirror');
  assert.ok(entry.shapeFingerprints.every(shape => !shape.authoritative));
  assert.equal(result.validation.valid, false, 'The controlled new ID is not accepted');
});

test('symlinked existing destination ancestor is rejected before any outside write', () => {
  const outside = path.join(base, 'outside'); fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'marker'), 'unchanged');
  const link = path.join(base, 'linked-ancestor'); fs.symlinkSync(outside, link, 'dir');
  assert.throws(() => api.createSourceProvider({ archive, expected, destination: path.join(link, 'never-created', 'extraction') }), /Symlinked artifact destination ancestor/);
  assert.deepEqual(fs.readdirSync(outside), ['marker']);
  assert.equal(fs.readFileSync(path.join(outside, 'marker'), 'utf8'), 'unchanged');
});
test('local proposal artifact cannot impersonate committed hosted evidence', () => {
  if (expected.producerMode === 'local-uncommitted-proposal') {
    assert.throws(() => materialize(archive, { ...expected, producerMode: 'committed' }), /Producer trust mode mismatch/);
  } else {
    assert.equal(baseline.provider.provenance().producer.mode, 'committed');
  }
});
test('committed producer verifies expected Git objects and rejects dirty or substituted tooling', () => {
  const command = spawnSync('python3', [path.join(__dirname, 'union_producer_tooling_negative.py')], {encoding: 'utf8'});
  assert.equal(command.status, 0, command.stderr + command.stdout);
  assert.equal((command.stdout.match(/^PASS /gm) || []).length, 5);
  assert.match(command.stdout, /COMMAND PASS actual dirty producer command rejected before output writes/);
  const output = process.env.XTEND_UNION_TEST_REPORT;
  if (output) fs.writeFileSync(output + '.producer-tooling.txt', command.stdout);
});

test('validation rejects a changed extracted file even when its scan is unchanged', () => {
  const file = baseline.provider.files()[0], bytes = fs.readFileSync(file.absolutePath);
  try {
    fs.appendFileSync(file.absolutePath, ' ');
    assert.throws(() => scanner.validateInventoryDocument(baseline.inventory, baseline.observed, {sourceProvider: baseline.provider}), /Materialized source changed/);
  } finally { fs.writeFileSync(file.absolutePath, bytes); }
});
