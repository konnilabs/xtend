'use strict';
const fs = require('node:fs'), test = require('node:test'), assert = require('node:assert/strict');
const zlib = require('node:zlib'), crypto = require('node:crypto');
const harness = require('./harness.cjs'), scanner = harness.load();
const id = ['xtend', 'product-candidates', 'v1'].join('.');
const familyId = ['xtend', 'product-candidates'].join('.');
const current = JSON.parse(fs.readFileSync(harness.root + '/tests/schemas/xtend-schema-inventory.json'));
const scan = JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname + '/observed-source.json.gz')));
// The migration approved four registration shapes. The larger current observation
// includes release and packaged-authority fixtures; it cannot inherit that review.
const bytes = fs.readFileSync(__dirname + '/approved-registration.json.gz');
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
  'f674260de7daf717d52fbad0eec361abbfef8b0b9a99de47dac66e320a062b36');
const approved = JSON.parse(zlib.gunzipSync(bytes));
assert.equal(approved.reviewedSourceSha, '0aa3f66816194f1854009136277dfb2877fcaab6');
const doc = structuredClone(current);
doc.entries = doc.entries.map(entry => entry.schemaId === id ? approved.entry : entry);
doc.schemaFamilies = doc.schemaFamilies.map(family => family.familyId === familyId ? approved.family : family);
doc.duplicateReviews = doc.duplicateReviews.filter(review => !review.schemaIds?.includes(id)).concat(approved.duplicateReviews);
const scoped = value => scanner.validateInventoryDocument(value, scan, { rootDir: harness.root }).errors
  .filter(error => error.schemaId === id || error.familyId === familyId || error.schemaIds?.includes(id));
test('exact proposed Entry Family and duplicate register without a released hash', () => {
  assert.deepEqual(scoped(doc), []);
  assert.equal(scanner.__testInitialAuthority(doc.entries.find(entry => entry.schemaId === id), doc, scan, harness.root), true);
});
test('three exact registration-boundary mutations reject', () => {
  for (const mutation of ['missing-specific-duplicate', 'missing-family', 'extra-accepted-hash']) {
    const changed = structuredClone(doc), entry = changed.entries.find(entry => entry.schemaId === id);
    if (mutation === 'missing-specific-duplicate') changed.duplicateReviews = changed.duplicateReviews.filter(review => !review.schemaIds?.includes(id));
    if (mutation === 'missing-family') changed.schemaFamilies = changed.schemaFamilies.filter(family => family.familyId !== entry.familyId);
    if (mutation === 'extra-accepted-hash') entry.shapePolicy.acceptedFingerprints.push('sha256:' + '0'.repeat(64));
    assert.ok(scoped(changed).length, mutation);
  }
});
test('the historical four-shape registration alone cannot inherit the new six-shape observation', () => {
  const six = JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname + '/proposed-six-registration.json.gz'))).observation;
  const historicalEntry = doc.entries.find(entry => entry.schemaId === id);
  assert.equal(approved.entry.shapeFingerprints.length, 4);
  assert.equal(six.entries.find(entry => entry.schemaId === id).shapeFingerprints.length, 6);
  assert.equal(scanner.__testInitialAuthority(historicalEntry, doc, six, harness.root), false);
});
