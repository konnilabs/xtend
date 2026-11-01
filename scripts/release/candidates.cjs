'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const { check, loadInventory } = require('./inventory.cjs');
const { selectRelease } = require('./selection.cjs');
const { digest, objectDigest, artifactFile, inspectTarball, checkEntrypoints } = require('./artifact.cjs');
const candidates = require('../../candidate-integrity.cjs');
const { PROFILE, CANDIDATES, ARTIFACT, coreContract } = require('./profile.cjs');
const { sourceRepository, verifyRegistryDependency } = require('./publish.cjs');
const dependencyKeys = ['dependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta'];
const write = (directory, file, value) => fs.writeFileSync(path.join(directory, file), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
async function inspectCandidates({ directory, sourceSha, rootDir }) {
  const manifestBytes = fs.readFileSync(artifactFile(directory, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  coreContract(manifest, CANDIDATES);
  check(manifest.development === false, 'Only committed production candidates may enter release');
  candidates.verifyCandidates(manifest, { directory, coreSha: sourceSha, profile: PROFILE });
  const inventory = loadInventory(rootDir);
  check(manifest.packages.length === inventory.packages.length && inventory.packages.every(entry =>
    manifest.packages.some(candidate => candidate.name === entry.name && candidate.version === entry.version)), 'Candidate inventory must contain all ten public packages');
  const inspected = [];
  for (const entry of manifest.packages) {
    const expected = inventory.packages.find(item => item.name === entry.name);
    const absoluteFile = artifactFile(directory, entry.file), content = await inspectTarball(absoluteFile);
    check(isDeepStrictEqual(content.manifest, expected.manifest), `Candidate metadata differs from committed source: ${entry.name}`);
    for (const key of dependencyKeys) check(isDeepStrictEqual(entry[key] || {}, expected.manifest[key] || {}), `Candidate dependency metadata mismatch: ${entry.name}:${key}`);
    checkEntrypoints(content.manifest, content.files);
    inspected.push({ name: entry.name, version: entry.version, group: expected.group, file: entry.file,
      integrity: entry.integrity, sha256: entry.sha256, size: fs.statSync(absoluteFile).size, files: content.files,
      ...Object.fromEntries(dependencyKeys.filter(key => expected.manifest[key]).map(key => [key, expected.manifest[key]])) });
  }
  return { manifest, manifestBytes, inventory, packages: inspected };
}
function originalSource(result) {
  const shas = new Set((result.provenanceStatements || []).flatMap(statement =>
    (statement.predicate?.buildDefinition?.resolvedDependencies || statement.predicate?.materials || [])
      .filter(entry => sourceRepository(entry.uri) === 'https://github.com/konnilabs/xtend')
      .map(entry => entry.digest?.gitCommit || entry.digest?.sha1).filter(value => /^[a-f0-9]{40}$/.test(value || ''))));
  check(shas.size === 1, 'Registry dependency needs one verified original source SHA');
  return [...shas][0];
}
async function adaptCandidates({ directory, sourceSha, rootDir, selection, registry, buildEvidence }) {
  const original = await inspectCandidates({ directory, sourceSha, rootDir });
  const scope = selectRelease(original.inventory, selection), registryDependencies = [];
  const bootstrap = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/release/bootstrap-plan.json')));
  check(bootstrap.schema === 'xtend.release.bootstrap.v1' && bootstrap.repository === 'konnilabs/xtend' && Array.isArray(bootstrap.packages) &&
    new Set(bootstrap.packages.map(entry => entry.name)).size === bootstrap.packages.length && bootstrap.packages.every(entry =>
      original.inventory.packages.some(pkg => pkg.name === entry.name) && entry.directPublishAllowed === true &&
      entry.ownershipVerified === true && typeof entry.approvedPlan === 'string' && entry.approvedPlan.length > 0), 'Invalid reviewed first-publish bootstrap plan');
  for (const name of scope.registryDependencyNames) {
    const expected = original.inventory.packages.find(entry => entry.name === name);
    const observed = await registry.version(expected);
    check(observed?.name === name && observed.version === expected.version, `Registry dependency unavailable: ${name}`);
    const entry = { name, version: expected.version, group: expected.group, integrity: observed.dist?.integrity, sourceSha: originalSource(observed) };
    await verifyRegistryDependency({ inventory: original.inventory }, entry, registry);
    registryDependencies.push(entry);
  }
  write(directory, 'build.json', buildEvidence);
  const manifest = { schema: ARTIFACT, profile: PROFILE, sourceSha, toolchain: buildEvidence.toolchain,
    selection: scope.selection, edges: original.inventory.edges, registryDependencies,
    bootstrapPackages: bootstrap.packages.filter(entry => scope.order.includes(entry.name)).map(entry => entry.name),
    packages: original.packages.filter(entry => scope.order.includes(entry.name)),
    buildEvidence: { file: 'build.json', integrity: digest(fs.readFileSync(path.join(directory, 'build.json'))) },
    candidateBinding: { file: 'manifest.json', integrity: digest(original.manifestBytes), profile: PROFILE,
      allPackages: original.packages.map(({ name, version, file, integrity, sha256, size }) => ({ name, version, file, integrity, sha256, size })) } };
  write(directory, 'release-manifest.json', manifest);
  return manifest;
}
async function verifyCandidateBinding(artifact, { directory, rootDir, requireCoreEvidence = false, now } = {}) {
  const binding = artifact.manifest.candidateBinding;
  coreContract(artifact.manifest, ARTIFACT);
  check(binding?.file === 'manifest.json' && binding.profile === PROFILE && !Object.hasOwn(binding,'demoSha'),
    'Exact Core candidate adapter binding required');
  const original = await inspectCandidates({ directory, rootDir, sourceSha: artifact.sourceSha });
  check(digest(original.manifestBytes) === binding.integrity && isDeepStrictEqual(binding.allPackages,
    original.packages.map(({ name, version, file, integrity, sha256, size }) => ({ name, version, file, integrity, sha256, size }))), 'Original candidate byte binding mismatch');
  for (const entry of artifact.packages) check(isDeepStrictEqual(entry.files, original.packages.find(p => p.name === entry.name)?.files) &&
    original.packages.some(p => p.name === entry.name && p.file === entry.file && p.integrity === entry.integrity && p.sha256 === entry.sha256 && p.size === entry.size), 'Selected release bytes differ from original candidates');
  if (requireCoreEvidence) require('./core-evidence.cjs').verifyCoreEvidence(artifact, {directory,now});
  return original;
}
// Two independent installations use the SAME generic candidate integrity
// primitives. SDK coverage always consumes all ten archives; publication scope
// consumes selected archives plus the separately verified registry identities.
function consumerScopes(artifact, original) {
  const entries = original.packages.map(entry => {
    const expected = artifact.inventory.packages.find(item => item.name === entry.name);
    check(expected && entry.version === expected.version, 'Consumer candidate outside committed inventory');
    for (const key of dependencyKeys) check(isDeepStrictEqual(entry[key] || {}, expected.manifest[key] || {}),
      'Consumer candidate metadata mismatch: ' + entry.name + ':' + key);
    return entry;
  });
  check(entries.length === 10 && new Set(entries.map(entry => entry.name)).size === entries.length &&
    entries.length === artifact.inventory.packages.length, 'All ten SDK candidate archives required');
  const selected = artifact.packages.map(entry => {
    const originalEntry = entries.find(item => item.name === entry.name);
    check(originalEntry && entry.version === originalEntry.version && entry.file === originalEntry.file &&
      entry.integrity === originalEntry.integrity, 'Consumer selection differs from original candidate archives');
    return { ...originalEntry, ...entry };
  });
  const registryPackages = artifact.registryDependencies.map(entry => {
    const expected = artifact.inventory.packages.find(item => item.name === entry.name);
    check(expected && entry.version === expected.version && !selected.some(item => item.name === entry.name),
      'Consumer registry closure overlaps or differs from committed inventory');
    return { ...entry, ...Object.fromEntries(dependencyKeys.filter(key => expected.manifest[key])
      .map(key => [key, expected.manifest[key]])) };
  });
  return [{ id: 'candidate-sdk', packages: entries, registryPackages: [] },
    { id: 'selected-release', packages: selected, registryPackages }].map(scope => ({ ...scope,
      manifest: { packages: [...scope.packages, ...scope.registryPackages] },
      app: { dependencies: Object.fromEntries([...scope.packages, ...scope.registryPackages].map(entry => [entry.name, entry.version])) }
    }));
}
module.exports = { write, inspectCandidates, originalSource, adaptCandidates, verifyCandidateBinding, consumerScopes };
