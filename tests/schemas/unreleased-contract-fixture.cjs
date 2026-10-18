'use strict';
// Review flags below are controlled test data, never written to the checkout.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto'), {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const capture = process.env.XTEND_UNRELEASED_SOURCE_CAPTURE;
assert.ok(capture, 'A fresh real committed-source capture is mandatory; no skipped fallback');
const scan = JSON.parse(fs.readFileSync(path.join(capture, 'observation.json')));
const profile = ['xtend', 'npm', 'core-only', 'v1'].join('.');
const ids = ['artifact.v2', 'canary.v2', 'core-evidence.v1'].map(name => ['xtend', 'release', name].join('.'));
const candidateIds = [1, 2].map(version => ['xtend', 'product-candidates', 'v' + version].join('.'));
const maracaIds = ['build-config', 'tune-report'].map(name => ['xtend', 'maraca', name, 'v1'].join('.'));
const inventoryFile = 'tests/schemas/core-release-inventory.json';
const policyFile = 'scripts/release/core-projection-policy.json';
const decisionFile = 'development/core-release-authority-decision.json';
const candidateFile = 'development/core-candidate-authority.json';
const data = value => JSON.stringify(value, null, 2) + '\n';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file)));
const unique = values => [...new Set(values)].sort();
const entry = (document, id) => document.entries.find(row => row.schemaId === id);
const validators = [
  ['candidate-integrity.cjs', 'scripts/release/artifact.cjs', 'scripts/release/candidates.cjs', 'scripts/release/contracts.cjs', 'scripts/release/pipeline.cjs', 'scripts/release/profile.cjs'],
  ['scripts/release/artifact.cjs', 'scripts/release/consumer.cjs', 'scripts/release/contracts.cjs', 'scripts/release/core-evidence.cjs', 'scripts/release/profile.cjs'],
  ['scripts/release/artifact.cjs', 'scripts/release/core-auth.cjs', 'scripts/release/core-evidence.cjs', 'scripts/release/core-security.cjs', 'scripts/release/core-source.cjs', 'scripts/release/github.cjs', 'scripts/release/profile.cjs']
];
function reviewedFixtureData() {
  const inventory = read(inventoryFile), candidate = read(candidateFile), decision = read(decisionFile), policy = read(policyFile);
  for (const id of [...candidateIds, ...ids, ...maracaIds]) {
    const target = entry(inventory, id), observed = entry(scan, id);
    target.shapeFingerprints = structuredClone(observed.shapeFingerprints);
    target.canonicalDefinition = structuredClone(observed.canonicalDefinition);
    target.shapePolicy.acceptedFingerprints = unique(observed.shapeFingerprints.map(row => row.hash));
    target.shapePolicy.authoritativeFingerprints = unique(observed.shapeFingerprints.filter(row => row.authoritative).map(row => row.hash));
    if (observed.shapeFingerprints.length > 1) target.shapePolicy.decision = 'controlled-test-only-reviewed-forms';
  }
  for (const review of inventory.duplicateReviews) if (review.schemaIds.some(id => [...candidateIds, ...ids].includes(id))) {
    review.baselineAccepted = true;
    review.status = 'reviewed';
    review.resolution = {kind: 'controlled-test-only', rationale: 'Fixture registration only; no productive authority grant.'};
  }
  candidate.status = 'reviewed-core-candidate-registration';
  candidate.firstRelease.status = 'reviewed-unreleased-registration';
  candidate.coexistence.status = 'reviewed-profile-coexistence';
  for (const row of candidate.registrations) {
    const current = entry(inventory, row.schemaId);
    row.status = 'reviewed-current-source';
    row.acceptedFingerprints = current.shapePolicy.acceptedFingerprints;
    row.authoritativeFingerprints = current.shapePolicy.authoritativeFingerprints;
    row.observedFingerprints = row.acceptedFingerprints;
    row.observedAuthorityFingerprints = row.authoritativeFingerprints;
    current.currentAuthorityRegistration = structuredClone(row);
  }
  decision.status = policy.status = 'reviewed-core-owned-projection';
  decision.profileRegistry.status = 'reviewed-exact-profile-registry';
  decision.unreleasedContracts = {format: 1, status: 'reviewed-unreleased-contract-registration', publicationGuardRetired: false,
    registrations: ids.map((id, index) => {
      const observed = entry(scan, id), current = entry(inventory, id);
      const files = unique([...observed.usages.flatMap(row => row.sourcePaths), ...observed.shapeFingerprints.flatMap(row => row.sourcePaths),
        ...validators[index], 'contracts/release/admission-phases.json', 'development/core-release-contracts.md']);
      return {schemaId: id, familyId: current.familyId, version: current.version, status: 'reviewed-current-source',
        canonicalDefinition: observed.canonicalDefinition,
        sources: files.map(file => ({path: file, sha256: hash(fs.readFileSync(path.join(root, file)))})),
        observedFingerprints: current.shapePolicy.acceptedFingerprints,
        acceptedFingerprints: current.shapePolicy.acceptedFingerprints,
        authoritativeFingerprints: current.shapePolicy.authoritativeFingerprints,
        releasedFingerprintSetHash: null};
    })};
  return {inventory, candidate, decision, policy, overrides: {}};
}
function create(t, mutate = () => {}, {pending = false} = {}) {
  const folder = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'core-unreleased-contract-')));
  t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
  const sources = require('../../tools/schema-inventory/source-provider.cjs');
  let archive = path.join(capture, 'source-capture/sources.tar.gz');
  let expected = JSON.parse(fs.readFileSync(path.join(capture, 'source-capture/producer-receipt.json')));
  if (!pending) {
    const fixture = reviewedFixtureData();
    mutate(fixture);
    const paths = unique([...scan.sourceProvenance.bindings.map(row => row.logicalPath), ...Object.keys(fixture.overrides)]);
    fixture.policy.productivePaths = paths;
    fixture.policy.inventorySha256 = fixture.decision.inventorySha256 = hash(data(fixture.inventory));
    fixture.policy.coreCandidateAuthoritySha256 = hash(data(fixture.candidate));
    fixture.decision.sourceMembershipSha256 = hash(JSON.stringify(paths));
    fixture.policy.authorityDecisionSha256 = hash(data(fixture.decision));
    const overrides = {...fixture.overrides, [inventoryFile]: data(fixture.inventory), [candidateFile]: data(fixture.candidate),
      [decisionFile]: data(fixture.decision), [policyFile]: data(fixture.policy)};
    const output = path.join(folder, 'capture');
    expected = JSON.parse(execFileSync('python3', [path.join(__dirname, 'unreleased-contract-fixture.py')], {
      input: JSON.stringify({repo: root, output, archive, overrides}), encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 180000
    }));
    archive = path.join(output, 'sources.tar.gz');
  }
  const provider = sources.createCoreReleaseProvider({archive, expected, destination: path.join(folder, 'materialized')});
  const engine = require('../../tools/schema-inventory/engine.cjs').createLegacyScanner({typescript: require('typescript'), defaultRootDir: root});
  const actualScan = engine.scanSchemaInventory({rootDir: root, sourceProvider: provider});
  const inventory = JSON.parse(provider.readCurrent(inventoryFile));
  return {provider, scan: actualScan, inventory, engine, root};
}
module.exports = {create, ids, candidateIds, profile, entry, hash, data, root};
