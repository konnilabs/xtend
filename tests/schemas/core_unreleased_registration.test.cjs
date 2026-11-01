'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const fixture = require('./unreleased-contract-fixture.cjs');
const {ids, candidateIds, entry} = fixture;
const registration = value => value.decision.unreleasedContracts;
test('authenticated pending policy retains all release drift diagnostics and the publication guard', t => {
  const f = fixture.create(t, undefined, {pending: true});
  assert.throws(() => f.engine.assertCoreUnreleasedContracts(f.inventory, f.scan, f.provider), /pending/);
  const validation = f.engine.validateInventoryDocument(f.inventory, f.scan, {sourceProvider: f.provider});
  for (const id of ids) assert.ok(validation.errors.some(row => row.code === 'released-fingerprint-drift' && row.schemaId === id));
  assert.throws(() => f.engine.assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
});
test('real captured approved source validates exact registration while FirstRelease remains active', t => {
  const f = fixture.create(t, undefined, {current: true});
  const core = require('../../scripts/release/core-source.cjs');
  const validation = f.engine.validateInventoryDocument(f.inventory, f.scan, {sourceProvider:f.provider});
  assert.deepEqual(validation.errors, []);
  assert.equal(core.validateCoreAuthority({provider:f.provider,inventory:f.inventory,rootDir:f.root,typescript:require('typescript')}).publicationGuardRetired,false);
  for (const id of [...ids, ...candidateIds]) assert.equal(entry(f.inventory,id).releasedFingerprintSetHash,null);
  assert.throws(() => f.engine.assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
});
test('reviewed fixture permits exactly three null-release contracts through the provider-bound Core context', t => {
  const f = fixture.create(t);
  const core = require('../../scripts/release/core-source.cjs');
  const context = core.createCoreSchemaContext({provider: f.provider, inventory: f.inventory, rootDir: f.root, typescript: require('typescript')});
  const result = context.scanner.assertCoreUnreleasedContracts(context.inventory, context.scan, context.provider);
  assert.deepEqual(result.schemaIds, ids);
  assert.equal(result.released, false);
  assert.equal(result.publicationGuardRetired, false);
  const validation = context.scanner.validateInventoryDocument(context.inventory, context.scan, {sourceProvider: context.provider});
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.valid, true);
  assert.equal(core.validateCoreAuthority({provider: f.provider, inventory: f.inventory, rootDir: f.root, typescript: require('typescript')}).publicationGuardRetired, false);
  for (const id of [...ids, ...candidateIds]) assert.equal(entry(context.inventory, id).releasedFingerprintSetHash, null);
  assert.throws(() => context.scanner.assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
  for (const provider of [undefined, {}, {...f.provider}, {provenance: () => ({profile: fixture.profile})}])
    assert.throws(() => f.engine.assertCoreUnreleasedContracts(f.inventory, f.scan, provider), /Verified manifest/);
  for (const scan of [structuredClone(f.scan), {...f.scan}])
    assert.throws(() => f.engine.assertCoreUnreleasedContracts(f.inventory, scan, f.provider), /unmodified Core scan/);
  const bytes = JSON.stringify(f.scan); f.scan.stats.injected = true;
  assert.throws(() => f.engine.assertCoreUnreleasedContracts(f.inventory, f.scan, f.provider), /unmodified Core scan/);
  delete f.scan.stats.injected; assert.equal(JSON.stringify(f.scan), bytes);
  const row = f.provider.files().find(item => item.logicalPath === 'contracts/release/artifact-v2.schema.json');
  const original = fs.readFileSync(row.absolutePath);
  try { fs.appendFileSync(row.absolutePath, '\n'); assert.throws(() => f.engine.assertCoreUnreleasedContracts(f.inventory, f.scan, f.provider), /changed|mismatch/); }
  finally { fs.writeFileSync(row.absolutePath, original); }
});
const cases = [
  ['missing review', value => delete value.decision.unreleasedContracts],
  ['pending review', value => registration(value).status = 'pending'],
  ['retirement flag', value => registration(value).publicationGuardRetired = true],
  ['unknown review field', value => registration(value).allowAnyUnreleased = true],
  ['missing contract', value => registration(value).registrations.pop()],
  ['duplicate contract', value => registration(value).registrations.push(structuredClone(registration(value).registrations[0]))],
  ['unknown contract ID', value => registration(value).registrations[0].schemaId = ['outside', 'contract', 'v1'].join('.')],
  ['different registration order', value => registration(value).registrations.reverse()],
  ['unknown source path', value => registration(value).registrations[0].sources[0].path = 'unreviewed-source.cjs'],
  ['missing validator source', value => registration(value).registrations[0].sources.pop()],
  ['unknown source hash', value => registration(value).registrations[0].sources[0].sha256 = '0'.repeat(64)],
  ['unknown observed form', value => registration(value).registrations[0].observedFingerprints.push('sha256:' + '0'.repeat(64))],
  ['partial form promoted to authority', value => {
    const row = registration(value).registrations[0]; row.authoritativeFingerprints = row.observedFingerprints;
    entry(value.inventory, ids[0]).shapePolicy.authoritativeFingerprints = row.observedFingerprints;
  }],
  ['unknown profile decision', value => value.decision.profile = 'untrusted-profile'],
  ['wrong profile family', value => value.decision.profileRegistry.families[1].profileCurrents[1].schemaId = ids[1]],
  ['invented legacy release hash', value => entry(value.inventory, ['xtend', 'release', 'artifact', 'v1'].join('.')).releasedFingerprintSetHash = 'sha256:' + '0'.repeat(64)],
  ['invented legacy release history', value => entry(value.inventory, ['xtend', 'release', 'canary', 'v1'].join('.')).releaseHistory = [{version: 1}]],
  ['historical audit replacement', value => value.overrides['tests/schemas/xtend-schema-inventory.json'] = '{}\n'],
  ['same-shape declaration with unknown bytes', value => {
    const file = 'contracts/release/artifact-v2.schema.json'; value.overrides[file] = fs.readFileSync(path.join(fixture.root, file), 'utf8') + '\n';
  }],
  ['changed declaration shape', value => {
    const file = 'contracts/release/canary-v2.schema.json', schema = JSON.parse(fs.readFileSync(path.join(fixture.root, file)));
    schema.properties.fixtureOnly = {type: 'string'}; value.overrides[file] = fixture.data(schema);
  }],
  ['additional declaration source', value => {
    value.overrides['contracts/release/zz-shadow.schema.json'] = fs.readFileSync(path.join(fixture.root, 'contracts/release/artifact-v2.schema.json'), 'utf8');
  }]
];
for (const [index, id] of ids.entries()) {
  cases.push(['released hash for contract ' + index, value => entry(value.inventory, id).releasedFingerprintSetHash = 'sha256:' + '1'.repeat(64)]);
  cases.push(['invented history for contract ' + index, value => entry(value.inventory, id).history = [{}]]);
  cases.push(['malformed history for contract ' + index, value => entry(value.inventory, id).history = {}]);
  cases.push(['alias for contract ' + index, value => entry(value.inventory, id).aliasOf = candidateIds[0]]);
  cases.push(['partial authority for contract ' + index, value => entry(value.inventory, id).shapePolicy.authoritativeFingerprints = []]);
}
for (const [name, mutate] of cases) test('authenticated fixture rejects ' + name, t => {
  const f = fixture.create(t, mutate);
  assert.throws(() => f.engine.assertCoreUnreleasedContracts(f.inventory, f.scan, f.provider));
  const validation = f.engine.validateInventoryDocument(f.inventory, f.scan, {sourceProvider: f.provider});
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(row => row.code === 'core-unreleased-contract-registration'));
});
