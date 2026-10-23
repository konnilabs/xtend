'use strict';
// Private migration audit: current observations are separate from immutable history.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const decision = require('./current-pair-decision.json');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const equal = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
const decisionDigest = '617629667e80fe9d67ceb994affa6e1120f403bf9e20ae39cdbeea511fbd37bd';
const generatedDigest = '972b6c5331119713cc1409e0bc88a4e58a277eae4a71facea10383b02ad9644e';
function generatedMirrors() {
  const bytes = require('node:zlib').gunzipSync(fs.readFileSync(path.join(__dirname, 'current-generated-mirrors.json.gz')));
  if (digest(bytes) !== generatedDigest) throw Error('Reviewed generated mirror transition substituted');
  return JSON.parse(bytes);
}
function assertGeneratedSources(ownerRoot) {
  for (const [source, expected] of Object.entries(generatedMirrors().sourceHashes)) {
    const file = path.resolve(ownerRoot, source);
    if (!file.startsWith(path.resolve(ownerRoot) + path.sep) || fs.realpathSync(file) !== file || digest(fs.readFileSync(file)) !== expected)
      throw Error('Reviewed generated mirror source changed');
  }
}
function assertOverlaySources(ownerRoot, overlays) {
  const sources = generatedMirrors().sourceHashes;
  for (const overlay of overlays) {
    const expected = sources[overlay.sourcePath];
    const file = path.resolve(ownerRoot, overlay.sourcePath);
    if (!/^[a-f0-9]{64}$/.test(expected || '') || !file.startsWith(path.resolve(ownerRoot) + path.sep)
      || fs.realpathSync(file) !== file || digest(fs.readFileSync(file)) !== expected)
      throw Error('Exact current regenerated command/form artifact digest required');
  }
}
function assertDecision() {
  const bytes = fs.readFileSync(path.join(__dirname, 'current-pair-decision.json'));
  if (digest(bytes) !== decisionDigest || !equal(JSON.parse(bytes), decision)) throw Error('Current pair decision substituted');
  return decision;
}
function readProjection(coreRoot) {
  const d = assertDecision(), bytes = fs.readFileSync(path.join(coreRoot, d.coreInventoryFile));
  if (digest(bytes) !== d.coreInventorySha256) throw Error('Current pair reviewed Core projection changed');
  if (digest(fs.readFileSync(path.join(coreRoot, d.transition.sourcePath))) !== d.transition.sourceSha256) throw Error('Current pair transition source changed');
  return JSON.parse(bytes);
}
function expectedHashes(old, historical) {
  const generated = generatedMirrors().entries.find(row => row.schemaId === old.schemaId);
  if (generated) {
    if (!generated.historicalOnly.every(hash => historical.includes(hash))) throw Error('Generated mirror historical transition mismatch');
    const result = [...new Set(historical.filter(hash => !generated.historicalOnly.includes(hash)).concat(generated.variants.map(f => f.hash)))].sort();
    if (!equal(result, generated.expectedUnion)) throw Error('Generated mirror expected union mismatch');
    return result;
  }
  const t = assertDecision().transition;
  if (old.schemaId !== t.schemaId) return historical;
  if (!historical.includes(t.historicalHash) || historical.includes(t.current.hash)) throw Error('Current pair historical transition mismatch');
  return historical.filter(h => h !== t.historicalHash).concat(t.current.hash).sort();
}
function checkShape(id, f, owner) {
  const generated = generatedMirrors().entries.find(row => row.schemaId === id)?.variants.find(row => row.hash === f.hash);
  if (generated) {
    if (owner !== 'demo' || f.authoritative !== false || !equal(generated, f)) throw Error('Generated mirror owner/shape/source/evidence mismatch');
    return true;
  }
  const t = assertDecision().transition;
  if (id !== t.schemaId || f.hash !== t.current.hash) return false;
  const { shapeSha256, ...metadata } = t.current;
  const { shape, ...actual } = f;
  if (owner !== 'core' || !equal(metadata, actual) || digest(Buffer.from(JSON.stringify(stable(shape)))) !== shapeSha256)
    throw Error('Current pair transition owner/shape/source/evidence mismatch');
  return true;
}
function facts() {
  const d = assertDecision(), t = d.transition;
  return { mode: d.mode, decisionSha256: decisionDigest, coreInventorySha256: d.coreInventorySha256,
    historical: { ledgerSha256: d.historicalLedgerSha256, selectionCount: 103, residualCountAtHistoricalCheckpoint: 21 },
    transitions: [{ schemaId: t.schemaId, owner: t.owner, historicalOnlyHash: t.historicalHash, observedCurrentHash: t.current.hash,
      sourcePath: t.sourcePath, sourceSha256: t.sourceSha256 }],
    generatedMirrors: { decisionSha256: generatedDigest, identifiers: generatedMirrors().entries.length, variants: generatedMirrors().entries.reduce((n, row) => n + row.variants.length, 0) },
    scope: 'Current 103-ID ownership only; full Demo runtime handoff and residual ownership disposition are separate.',
    acceptedForMerge: false, acceptedForRelease: false };
}
function assertFacts(value) { if (!equal(value, facts())) throw Error('Current pair evidence decision/history/acceptance mismatch'); }
module.exports = { assertDecision, readProjection, expectedHashes, checkShape, facts, assertFacts, generatedMirrors, assertGeneratedSources, assertOverlaySources };
