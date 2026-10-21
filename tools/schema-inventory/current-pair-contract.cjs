'use strict';
// Private migration audit: current observations are separate from immutable history.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const decision = require('./current-pair-decision.json');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const equal = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
const decisionDigest = '0eca33166f32caf6790347e685ee9ea85b48db1a9ebd08cdcedd81f48377a86e';
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
  const t = assertDecision().transition;
  if (old.schemaId !== t.schemaId) return historical;
  if (!historical.includes(t.historicalHash) || historical.includes(t.current.hash)) throw Error('Current pair historical transition mismatch');
  return historical.filter(h => h !== t.historicalHash).concat(t.current.hash).sort();
}
function checkShape(id, f, owner) {
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
    scope: 'Current 103-ID ownership only; full Demo runtime handoff and residual ownership disposition are separate.',
    acceptedForMerge: false, acceptedForRelease: false };
}
function assertFacts(value) { if (!equal(value, facts())) throw Error('Current pair evidence decision/history/acceptance mismatch'); }
module.exports = { assertDecision, readProjection, expectedHashes, checkShape, facts, assertFacts };
