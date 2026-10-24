'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const contract = require('../../tools/schema-inventory/current-full-union.cjs');
const pair = require('../../tools/schema-inventory/current-pair-contract.cjs');
function fixture() { const data = contract.readExpected(); return {entries: data.entries, excludedCandidates: data.excludedCandidates, duplicateAudit: data.duplicateAudit}; }
test('full expected observations retain all current identifiers and separate historical-only successors', () => {
  const expected = contract.readExpected(), result = contract.checkObservationModel(fixture());
  assert.equal(result.kind, 'observation-comparison-model'); assert.equal(result.identifiers, 2229);
  assert.equal(expected.historicalOnly.length, 2); assert.equal(expected.acceptedForMerge, false); assert.equal(expected.acceptedForRelease, false);
  assert.ok(!Object.hasOwn(result, 'source')); assert.ok(!Object.hasOwn(result, 'ok'));
});
for (const kind of ['missing', 'duplicate', 'foreign-id', 'changed-shape', 'same-hash-shape', 'authority', 'source', 'usage', 'canonical', 'completeness', 'historical-as-current', 'excluded', 'duplicate-audit']) test('full observation comparison rejects ' + kind, () => {
  const scan = fixture(), entry = scan.entries.find(e => e.shapeFingerprints.length), f = entry.shapeFingerprints[0];
  if (kind === 'missing') scan.entries.pop();
  if (kind === 'duplicate') scan.entries[1] = scan.entries[0];
  if (kind === 'foreign-id') scan.entries[0].schemaId = 'foreign-' + scan.entries[0].schemaId;
  if (kind === 'changed-shape') f.hash = 'sha256:' + '0'.repeat(64);
  if (kind === 'same-hash-shape') f.shape.unapproved = true;
  if (kind === 'authority') f.authoritative = !f.authoritative;
  if (kind === 'source') f.sourcePaths = ['foreign.js'];
  if (kind === 'usage') entry.usages = [];
  if (kind === 'canonical') entry.canonicalDefinition = null;
  if (kind === 'completeness') f.completeness = 'forged';
  if (kind === 'historical-as-current') scan.entries[0].schemaId = contract.readExpected().historicalOnly[0].schemaId;
  if (kind === 'excluded') scan.excludedCandidates = [];
  if (kind === 'duplicate-audit') scan.duplicateAudit = {};
  assert.throws(() => contract.checkObservationModel(scan));
});
test('a model provider cannot mint committed full-union evidence', () => assert.throws(() => contract.verify({provenance: () => ({producer: {mode: 'committed'}})}, {}), /Verified manifest/));
test('generated mirror changes retain exact non-authoritative Demo source and normalized shape', () => {
  for (const row of pair.generatedMirrors().entries) for (const variant of row.variants) {
    assert.equal(variant.authoritative, false); assert.equal(pair.checkShape(row.schemaId, variant, 'demo'), true);
    for (const kind of ['owner', 'authority', 'source', 'shape', 'evidence']) {
      const f = structuredClone(variant);
      if (kind === 'authority') f.authoritative = true;
      if (kind === 'source') f.sourcePaths = ['foreign.js'];
      if (kind === 'shape') f.shape.unapproved = true;
      if (kind === 'evidence') f.evidence = [];
      assert.throws(() => pair.checkShape(row.schemaId, f, kind === 'owner' ? 'core' : 'demo'));
    }
  }
});

test('generated mirror source binding rejects modified bytes, absent files and symlinks', t => {
  const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-source-negative-'));
  t.after(() => fs.rmSync(temp, {recursive: true, force: true}));
  const source = Object.keys(pair.generatedMirrors().sourceHashes)[0];
  const file = path.join(temp, source); fs.mkdirSync(path.dirname(file), {recursive: true});
  assert.throws(() => pair.assertGeneratedSources(temp));
  fs.writeFileSync(file, 'unreviewed generated source');
  assert.throws(() => pair.assertGeneratedSources(temp), /source changed/);
  fs.unlinkSync(file); fs.symlinkSync(__filename, file);
  assert.throws(() => pair.assertGeneratedSources(temp), /source changed/);
});
