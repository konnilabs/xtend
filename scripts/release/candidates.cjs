'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const { check, loadInventory } = require('./inventory.cjs');
const { selectRelease } = require('./selection.cjs');
const { digest, objectDigest, artifactFile, inspectTarball, checkEntrypoints } = require('./artifact.cjs');
const candidates = require('../../candidate-integrity.cjs');
const product = require('../product-candidate-evidence.cjs');
const { sourceRepository, verifyRegistryDependency } = require('./publish.cjs');
const dependencyKeys = ['dependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta'];
const write = (directory, file, value) => fs.writeFileSync(path.join(directory, file), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
async function inspectCandidates({ directory, sourceSha, demoSha, rootDir }) {
  const manifestBytes = fs.readFileSync(artifactFile(directory, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  check(manifest.development === false, 'Only committed production candidates may enter release');
  candidates.verifyCandidates(manifest, { directory, coreSha: sourceSha, demoSha });
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
      integrity: entry.integrity, sha256: entry.sha256, size: fs.statSync(absoluteFile).size, files: content.files });
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
async function adaptCandidates({ directory, sourceSha, demoSha, rootDir, selection, registry, buildEvidence }) {
  const original = await inspectCandidates({ directory, sourceSha, demoSha, rootDir });
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
  const manifest = { schema: 'xtend.release.artifact.v1', sourceSha, toolchain: buildEvidence.toolchain,
    selection: scope.selection, edges: original.inventory.edges, registryDependencies,
    bootstrapPackages: bootstrap.packages.filter(entry => scope.order.includes(entry.name)).map(entry => entry.name),
    packages: original.packages.filter(entry => scope.order.includes(entry.name)),
    buildEvidence: { file: 'build.json', integrity: digest(fs.readFileSync(path.join(directory, 'build.json'))) },
    candidateBinding: { file: 'manifest.json', integrity: digest(original.manifestBytes), demoSha,
      allPackages: original.packages.map(({ name, version, file, integrity, sha256, size }) => ({ name, version, file, integrity, sha256, size })) } };
  write(directory, 'release-manifest.json', manifest);
  return manifest;
}
async function verifyCandidateBinding(artifact, { directory, rootDir, requireProductEvidence = false, now } = {}) {
  const binding = artifact.manifest.candidateBinding;
  check(binding?.file === 'manifest.json' && /^[a-f0-9]{40}$/.test(binding.demoSha || ''), 'Reviewed candidate adapter binding required');
  const pin = JSON.parse(fs.readFileSync(path.join(rootDir, 'product-demos.lock.json')));
  check(binding.demoSha === pin.demoSha, 'Candidate Demo SHA differs from committed pin');
  const original = await inspectCandidates({ directory, rootDir, sourceSha: artifact.sourceSha, demoSha: binding.demoSha });
  check(digest(original.manifestBytes) === binding.integrity && isDeepStrictEqual(binding.allPackages,
    original.packages.map(({ name, version, file, integrity, sha256, size }) => ({ name, version, file, integrity, sha256, size }))), 'Original candidate byte binding mismatch');
  for (const entry of artifact.packages) check(isDeepStrictEqual(entry.files, original.packages.find(p => p.name === entry.name)?.files) &&
    original.packages.some(p => p.name === entry.name && p.file === entry.file && p.integrity === entry.integrity && p.sha256 === entry.sha256 && p.size === entry.size), 'Selected release bytes differ from original candidates');
  if (!requireProductEvidence) return original;
  const prepared = Date.parse(artifact.manifest.preparedAt), sealed = Date.parse(artifact.manifest.sealedAt);
  check(Number.isFinite(prepared) && Number.isFinite(sealed) && sealed >= prepared && sealed <= (now ?? Date.now()) + 1000,
    'Invalid producer/sealing timestamps');
  const lanes = artifact.manifest.productEvidence;
  check(Array.isArray(lanes) && lanes.length === 2 && new Set(lanes.map(lane => lane.node)).size === 2 &&
    lanes.some(lane => lane.node === '24.18.0') && lanes.some(lane => lane.node === '26.5.0'), 'Both pinned product consumer lanes required');
  for (const lane of lanes) {
    const bytes = fs.readFileSync(artifactFile(directory, lane.file));
    check(digest(bytes) === lane.integrity, 'Product evidence integrity mismatch');
    const evidence = JSON.parse(bytes), laneDirectory = path.dirname(path.join(directory, lane.file));
    product.verifyReportFiles(evidence.reports, { directory: laneDirectory, coreSha: artifact.sourceSha, demoSha: binding.demoSha,
      manifest: original.manifest, startedAt: artifact.manifest.preparedAt, now: now ?? sealed });
    product.verifyInstallationFiles(evidence.installation, { directory: laneDirectory, manifest: original.manifest });
    // Original fresh reports are authenticated by immutable producer metadata.
    // On resume retain their timestamp; do not manufacture fresh acceptance.
    product.verifyEvidence(evidence, { coreSha: artifact.sourceSha, demoSha: binding.demoSha, packages: original.manifest.packages,
      php: original.manifest.php, installation: evidence.installation, reports: evidence.reports,
      now: now ?? sealed, startedAt: artifact.manifest.preparedAt });
    check(lane.node === evidence.releaseRuntime?.node && evidence.releaseRuntime?.npm === artifact.toolchain.npm, 'Product evidence runtime lane mismatch');
  }
  return original;
}
module.exports = { write, inspectCandidates, originalSource, adaptCandidates, verifyCandidateBinding };
