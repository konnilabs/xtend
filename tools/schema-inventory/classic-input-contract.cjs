'use strict';
const crypto = require('node:crypto');
const { isDeepStrictEqual: equal } = require('node:util');
const sources = require('./source-provider.cjs');
const profiles = require('./profile-registry.cjs');
const ID = 'xtend.rmt.vnext.ast.v1';
const DECLARATION = 'tools/rmt-language/contracts/classic-ast.v1.schema.json';
const HISTORICAL = '0c1ca03e989f4c1cfa5e07b2296e163ddda0090fd138677bc410feafce9661f3';
const VALIDATORS = [
  'scripts/generate_rmt_classic_contract.js', 'tools/rmt-language/classic-ast-rules.js',
  'tools/rmt-language/classic-ast-contract.js', 'tools/rmt-language/classic-semantic-rules.js',
  'tools/rmt-language/classic-ast-types.d.ts', 'tools/rmt-language/classic-compiler.js',
  'tools/rmt-language/classic-compiler.d.ts', 'tools/rmt-language/classic-parser.js',
  'tools/rmt-language/classic-parser.d.ts', 'tools/rmt-language/vnext-compiler.js',
  'tools/rmt-language/vnext-parser.js', 'tools/rmt-language/semantic-graph.js',
  'tests/rmt-language/rmt_classic_contract_checks.js',
  'tests/rmt-language/fixtures/classic-contract-consumer.ts',
  'tools/schema-inventory/classic-input-contract.cjs'
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sorted = values => [...new Set(values)].sort();
const demand = (ok, message) => { if (!ok) throw Error('Classic input registration: ' + message); };

// This is one first formal authority, not a general unreleased-schema waiver.
// The caller additionally authenticates the scan's private identity and bytes.
function assertClassicInputContract(inventory, scan, provider) {
  sources.assertSourceProvider(provider);
  demand(sources.verifiedSourceProfile(provider) === profiles.CORE, 'authenticated Core source required');
  const reviewed = profiles.assertReviewedProfileRegistry(provider);
  demand(equal(inventory, reviewed.inventory), 'inventory differs from reviewed Core bytes');
  const decision = JSON.parse(provider.readCurrent('development/core-release-authority-decision.json'));
  const review = decision.classicInputContractReview;
  demand(review && equal(Object.keys(review).sort(), ['format', 'publicationGuardRetired', 'registration', 'released', 'status'])
    && review.format === 1 && review.status === 'reviewed-unreleased-classic-input'
    && review.released === false && review.publicationGuardRetired === false, 'exact unreleased review required');
  const historicalBytes = provider.readCurrent('tests/schemas/xtend-schema-inventory.json');
  demand(hash(historicalBytes) === HISTORICAL, 'historical inventory changed');
  const historical = JSON.parse(historicalBytes);
  const previous = historical.entries.find(entry => entry.schemaId === ID);
  demand(previous && previous.releasedFingerprintSetHash === null
    && !previous.shapeFingerprints.some(shape => shape.authoritative)
    && !(previous.history || []).length && !(previous.releaseHistory || []).length
    && !(historical.releaseRecords || []).some(record => record.schemaId === ID), 'a previously released authority cannot be registered here');
  const matches = inventory.entries.filter(entry => entry.schemaId === ID);
  const observed = scan.entries.filter(entry => entry.schemaId === ID);
  demand(matches.length === 1 && observed.length === 1, 'one exact AST entry and extraction required');
  const entry = matches[0], current = observed[0];
  const canonical = { path: DECLARATION, symbol: null, definitionType: 'json-schema', role: 'definition', visibility: 'internal' };
  demand(entry.familyId === previous.familyId && entry.version === 1 && entry.status === 'active'
    && equal(entry.lifecycle, { status: 'active', rollout: 'planned' })
    && entry.aliasOf === null && entry.replacedBy === null
    && entry.releasedFingerprintSetHash === null && entry.shapePolicy.releasedFingerprintSetHash === null
    && !(entry.history || []).length && !(entry.releaseHistory || []).length
    && !(inventory.releaseRecords || []).some(record => record.schemaId === ID)
    && !inventory.entries.some(record => record.aliasOf === ID), 'AST must remain genuinely unreleased and unaliased');
  const authority = current.shapeFingerprints.filter(shape => shape.authoritative);
  demand(equal(entry.canonicalDefinition, canonical) && equal(current.canonicalDefinition, canonical)
    && equal(entry.shapeFingerprints, current.shapeFingerprints)
    && authority.length === 1 && authority[0].completeness === 'complete'
    && equal(authority[0].sourcePaths, [DECLARATION])
    && equal(authority[0].evidence, [{ authoritative: true, completeness: 'complete', path: DECLARATION,
      symbol: null, type: 'formal-schema' }]), 'complete formal AST authority required');
  const schema = JSON.parse(provider.readCurrent(DECLARATION));
  demand(schema.$id === ID && schema.definitions?.RmtVNextDocument?.properties.schema.const === ID
    && Object.keys(schema.definitions).filter(key => key.startsWith('Rmt')).length === 122, 'Classic v1 declaration identity changed');
  const paths = sorted([...current.usages.flatMap(usage => usage.sourcePaths), DECLARATION, ...VALIDATORS]);
  const fingerprints = sorted(current.shapeFingerprints.map(shape => shape.hash));
  const expected = { schemaId: ID, familyId: entry.familyId, version: 1, status: 'reviewed-current-source',
    canonicalDefinition: canonical, historicalInventorySha256: HISTORICAL,
    sources: paths.map(path => ({ path, sha256: hash(provider.readCurrent(path)) })),
    observedFingerprints: fingerprints, acceptedFingerprints: fingerprints,
    authoritativeFingerprints: authority.map(shape => shape.hash), releasedFingerprintSetHash: null };
  demand(equal(review.registration, expected) && equal(entry.currentAuthorityRegistration, expected)
    && equal(entry.shapePolicy.acceptedFingerprints, fingerprints)
    && equal(entry.shapePolicy.authoritativeFingerprints, expected.authoritativeFingerprints), 'source/authority/observation binding differs');
  return Object.freeze({ schemaId: ID, released: false, publicationGuardRetired: false });
}
module.exports = Object.freeze({ assertClassicInputContract });
