'use strict';
// Additive migration source coverage; never a release inventory or runtime seal.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const {isDeepStrictEqual: equal} = require('node:util');
const source = require('./source-provider.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const dataDigest = 'c969fa411f42a232215bb76286e3998d77353c5312f59ecb383012b03b962943';
const keys = ['schemaId', 'familyId', 'version', 'kinds', 'status', 'canonicalDefinition', 'usages', 'shapeFingerprints'];
const check = (condition, message) => { if (!condition) throw Error(message); };
function readExpected() {
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'current-full-union.json.gz')));
  check(hash(bytes) === dataDigest, 'Current full-union reviewed data substituted');
  const value = JSON.parse(bytes);
  check(value.acceptedForMerge === false && value.acceptedForRelease === false, 'Source coverage cannot authorize acceptance');
  return value;
}
function observations(scan) { return scan.entries.map(entry => Object.fromEntries(keys.map(key => [key, entry[key]]))); }
// Pure comparison helper for explicitly labelled negative models. It cannot
// create source evidence; verify() owns the authenticated scan below.
function checkObservationModel(scan, expected = readExpected()) {
  check(Array.isArray(scan.entries) && new Set(scan.entries.map(e => e.schemaId)).size === scan.entries.length, 'Duplicate/missing current identifier');
  check(scan.entries.length === expected.entries.length, 'Current identifier coverage count changed');
  const actual = new Map(observations(scan).map(entry => [entry.schemaId, entry]));
  for (const entry of expected.entries) check(equal(actual.get(entry.schemaId), entry), 'Current shape/authority/source/usage changed: ' + entry.schemaId);
  check(equal(scan.excludedCandidates, expected.excludedCandidates), 'Excluded candidate disposition changed');
  check(equal(scan.duplicateAudit, expected.duplicateAudit), 'Duplicate evidence classification changed');
  for (const old of expected.historicalOnly) check(!actual.has(old.schemaId) && actual.has(old.replacedBy), 'Historical-only identifier or successor changed');
  return {kind: 'observation-comparison-model', identifiers: actual.size};
}
function verify(provider, typescript) {
  source.assertSourceProvider(provider);
  check(source.verifiedSourceProfile(provider) === 'legacy-paired-audit', 'Exact committed paired source required');
  const provenance = provider.provenance();
  check(provenance.producer.mode === 'committed', 'Uncommitted proposal cannot be current source evidence');
  for (const file of ['tools/schema-inventory/current-full-union.cjs', 'tools/schema-inventory/current-full-union.json.gz', 'tools/schema-inventory/engine.cjs']) {
    check(provider.readCurrent(file).equals(fs.readFileSync(path.resolve(__dirname, '../..', file))), 'Current verifier differs from committed source: ' + file);
  }
  source.assertImplementationBinding(provider.readCurrent('tools/schema-inventory/source-provider.cjs'), provider.readCurrent('tools/schema-inventory/source-bindings.json'));
  const expected = readExpected();
  check(hash(zlib.gunzipSync(provider.readCurrent('tools/schema-inventory/ownership-ledger.json.gz'))) === expected.historicalLedgerSha256, 'Historical ledger changed');
  check(hash(provider.readCurrent('tests/schemas/core-release-inventory.json')) === expected.coreProjectionSha256, 'Reviewed Core projection changed');
  const byPath = new Map(provenance.bindings.map(row => [row.logicalPath, row]));
  for (const [logical, guard] of Object.entries(expected.reviewedSourceHashes)) {
    const row = byPath.get(logical);
    check(row?.owner === guard.owner && row.sourcePath === guard.sourcePath && row.sha256 === guard.sha256 && hash(provider.readCurrent(logical)) === guard.sha256, 'Reviewed source binding changed: ' + logical);
  }
  const startedAt = new Date().toISOString();
  const scanner = require('./engine.cjs').createLegacyScanner({typescript});
  const scan = scanner.scanSchemaInventory({sourceProvider: provider});
  checkObservationModel(scan, expected);
  provider.files();
  return {mode: 'migration-current-full-union', coverage: {status: 'passed', currentIdentifiers: scan.entries.length,
    historicalOnly: expected.historicalOnly, historicalIdentifiersCountedAsCurrent: 0},
    expectedDataSha256: dataDigest, source: provenance, node: process.versions.node, startedAt, finishedAt: new Date().toISOString(),
    runtimeHandoffComplete: false, acceptedForMerge: false, acceptedForRelease: false};
}
module.exports = Object.freeze({verify, readExpected, checkObservationModel});
