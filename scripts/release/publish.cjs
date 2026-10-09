'use strict';
const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');
const { check, readJson } = require('./inventory.cjs');
const { digest } = require('./artifact.cjs');
const { isDeepStrictEqual } = require('node:util');
function channelTag(version, prereleaseTag = 'next') {
  check(semver.valid(version), `Invalid release version: ${version}`);
  check(['next', 'beta', 'rc', 'canary'].includes(prereleaseTag), 'Explicit prerelease tag must be next/beta/rc/canary');
  return semver.prerelease(version) ? prereleaseTag : 'latest';
}
function promotionSupported(npmVersion, authorized) {
  check(semver.valid(npmVersion) && ((semver.major(npmVersion) === 11 && semver.gte(npmVersion, '11.21.0')) ||
    (semver.major(npmVersion) === 12 && semver.gte(npmVersion, '12.2.0'))), 'OIDC dist-tag requires npm >=11.21 on v11 or >=12.2 on v12; npm 11.17 cannot promote');
  check(authorized === true, 'Separate reviewed npm dist-tag permission required');
}
function classifyVersion(entry, result) {
  if (result === null) return 'pending';
  check(result.name === entry.name && result.version === entry.version && result.dist?.integrity === entry.integrity,
    `Existing version/integrity conflict: ${entry.name}@${entry.version}`);
  return 'verified-existing';
}
function validatePackument(entry, packument, exists) {
  check(packument && packument.name === entry.name && Array.isArray(packument.versions) &&
    new Set(packument.versions).size === packument.versions.length && packument.versions.every(version => semver.valid(version) === version) &&
    packument['dist-tags'] && typeof packument['dist-tags'] === 'object' && !Array.isArray(packument['dist-tags']) &&
    Object.values(packument['dist-tags']).every(version => semver.valid(version) === version && packument.versions.includes(version)),
    `Invalid registry metadata: ${entry.name}`);
  check(exists === undefined || packument.versions.includes(entry.version) === exists,
    `Inconsistent registry version presence: ${entry.name}@${entry.version}`);
  return packument;
}
function assertNotStale(entry, packument, tag) {
  if (packument === null) return;
  validatePackument(entry, packument);
  const current = packument['dist-tags'][tag];
  if (current !== undefined) {
    check(semver.valid(current), `Invalid registry tag: ${entry.name}:${tag}`);
    check(!semver.gt(current, entry.version), `Stale ${tag}: ${entry.name}@${entry.version} behind ${current}`);
  }
  if (tag === 'latest') {
    check(!semver.prerelease(entry.version), 'Prerelease may not use latest');
    for (const version of packument.versions) {
      check(semver.valid(version), `Invalid registry version: ${version}`);
      check(semver.prerelease(version) || !semver.gt(version, entry.version), `Stale stable version: ${entry.name}@${entry.version} behind ${version}`);
    }
  }
}
function sourceRepository(uri) {
  if (typeof uri !== 'string' || /[\\\s%?]/.test(uri)) return null;
  const normalized = uri.replace(/^git\+/, '');
  // Check the raw authority too: URL normalizes explicit default ports away.
  if (!/^https:\/\/github\.com\//i.test(normalized)) return null;
  let url;
  try { url = new URL(normalized); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port || url.search) return null;
  if (url.pathname !== normalized.slice(normalized.indexOf('/', 8)).split('#')[0]) return null;
  const ref = '(?:refs/(?:heads|tags)/[A-Za-z0-9._/-]+|[a-f0-9]{40})';
  const match = new RegExp(`^/konnilabs/xtend(?:\\.git)?(?:@(${ref}))?$`).exec(url.pathname);
  if (!match || url.hash && !new RegExp(`^#${ref}$`).test(url.hash) || match[1] && url.hash) return null;
  return 'https://github.com/konnilabs/xtend';
}
function assertProvenance(entry, result, sourceSha) {
  check(result.dist?.attestations?.url && result.dist?.attestations?.provenance?.predicateType,
    `Provenance metadata missing: ${entry.name}`);
  // The adapter retrieves the registry attestation; source and subject are checked
  // here. Cryptographic Sigstore verification is a separate integration gate.
  const statements = result.provenanceStatements;
  check(Array.isArray(statements) && statements.some(statement => {
    const subject = statement.subject?.some(item => item.digest?.sha512 === Buffer.from(entry.integrity.slice(7), 'base64').toString('hex'));
    const dependencies = statement.predicate?.buildDefinition?.resolvedDependencies || statement.predicate?.materials || [];
    const source = dependencies.some(item => sourceRepository(item.uri) === 'https://github.com/konnilabs/xtend' &&
      [item.digest?.gitCommit, item.digest?.sha1].includes(sourceSha));
    return subject && source;
  }), `Provenance source/subject mismatch: ${entry.name}`);
}
async function verifyRegistryDependency(artifact, entry, registry) {
  const existing = await registry.version(entry);
  check(classifyVersion(entry, existing) === 'verified-existing', `Required registry dependency absent: ${entry.name}@${entry.version}`);
  validatePackument(entry, await registry.package(entry), true);
  const expected = artifact.inventory.packages.find(item => item.name === entry.name).manifest;
  check(sourceRepository(existing.repository?.url) === 'https://github.com/konnilabs/xtend' &&
    existing.repository?.type === 'git' && existing.repository?.directory === expected.repository.directory,
    `Registry dependency repository mismatch: ${entry.name}`);
  for (const key of ['dependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta']) {
    check(isDeepStrictEqual(existing[key] || {}, expected[key] || {}), `Registry dependency metadata mismatch: ${entry.name}:${key}`);
  }
  // This is the dependency's recorded original build, never the release's SHA.
  assertProvenance(entry, existing, entry.sourceSha);
}
function existingTagState(entry, observed, tag) {
  validatePackument(entry, observed, true);
  const tagged = observed['dist-tags'][tag];
  return tagged === entry.version ? 'verified' : semver.valid(tagged) && semver.gt(tagged, entry.version) ? 'preserved-newer' : 'repair-required';
}
function pendingPackument(entry, observed, tag, bootstrapPackages) {
  if (observed === null) check(bootstrapPackages.includes(entry.name), `First publish requires reviewed ownership/bootstrap plan: ${entry.name}`);
  else validatePackument(entry, observed, false);
  assertNotStale(entry, observed, tag);
}
function writeLedger(file, ledger) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(ledger, null, 2)}\n`);
  fs.renameSync(temporary, file);
}
async function publishRelease({ artifact, registry, publisher, ledgerFile, lockFile = path.join(path.dirname(ledgerFile), 'npm-release.lock'),
  publish = false, staged = false, promote = false, npmVersion = artifact.toolchain.npm, distTagsAuthorized = false,
  prereleaseTag = 'next', maxAttempts = 2, bootstrapPackages = [], onLedger = () => {} }) {
  check(Number.isInteger(maxAttempts) && maxAttempts >= 1 && maxAttempts <= 3, 'Publish attempts must be 1..3');
  check(!promote || publish && staged, 'Promotion requires explicit staged publish');
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  // Never remove a foreign/stale lock automatically. Recovery requires review.
  const lock = fs.openSync(lockFile, 'wx');
  let ledger, current;
  function save() { writeLedger(ledgerFile, ledger); onLedger(structuredClone(ledger)); }
  try {
    const entries = artifact.order.map(name => artifact.packages.find(entry => entry.name === name));
    check(entries.every(Boolean) && entries.length === artifact.packages.length && new Set(artifact.order).size === entries.length,
      'Publish order differs from artifact');
    if (fs.existsSync(ledgerFile)) {
      const previous = readJson(ledgerFile);
      check(previous.schema === 'xtend.release.ledger.v1' && previous.manifestIntegrity === artifact.manifestIntegrity &&
        previous.sourceSha === artifact.sourceSha, 'Resume refused: ledger belongs to another immutable artifact');
    }
    ledger = { schema: 'xtend.release.ledger.v1', manifestIntegrity: artifact.manifestIntegrity, sourceSha: artifact.sourceSha,
      mode: publish ? (staged ? 'staged-publish' : 'direct-publish') : 'dry-run', status: 'pending', packages: entries.map(entry => ({ name: entry.name,
        version: entry.version, integrity: entry.integrity, state: 'pending', tag: channelTag(entry.version, prereleaseTag) })),
      registryDependencies: (artifact.registryDependencies || []).map(entry => ({ ...entry, state: 'pending' })) };
    save();
    if (promote) promotionSupported(npmVersion, distTagsAuthorized); // before first upload
    // Complete preflight before the first irreversible operation.
    for (const dependency of artifact.registryDependencies || []) {
      current = ledger.registryDependencies.find(item => item.name === dependency.name);
      await verifyRegistryDependency(artifact, dependency, registry);
      current.state = 'verified-existing'; save();
    }
    for (const entry of entries) {
      current = ledger.packages.find(item => item.name === entry.name);
      const existing = await registry.version(entry);
      current.state = classifyVersion(entry, existing);
      if (existing) {
        assertProvenance(entry, existing, artifact.sourceSha);
        const observed = await registry.package(entry);
        current.tagState = existingTagState(entry, observed, current.tag);
      } else {
        const packument = await registry.package(entry);
        pendingPackument(entry, packument, current.tag, bootstrapPackages);
      }
      save();
    }
    if (!publish) { ledger.status = 'dry-run'; save(); return ledger; }
    for (const entry of entries) {
      for (const dependency of artifact.registryDependencies || []) {
        current = ledger.registryDependencies.find(item => item.name === dependency.name);
        await verifyRegistryDependency(artifact, dependency, registry);
      }
      current = ledger.packages.find(item => item.name === entry.name);
      // Requery even preflight-existing versions; never trust a previous ledger.
      let existing = await registry.version(entry);
      if (classifyVersion(entry, existing) === 'verified-existing') {
        assertProvenance(entry, existing, artifact.sourceSha);
        const observed = await registry.package(entry);
        current.tagState = existingTagState(entry, observed, current.tag);
        current.state = 'verified-existing'; save(); continue;
      }
      pendingPackument(entry, await registry.package(entry), current.tag, bootstrapPackages);
      const uploadTag = staged ? `${semver.prerelease(entry.version) ? 'prerelease' : 'stable'}-${artifact.sourceSha}` : current.tag;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const bytes = fs.readFileSync(entry.absoluteFile);
        check(bytes.length === entry.size && digest(bytes) === entry.integrity, 'Artifact changed before upload');
        current.uploadAttempted = true; current.attempt = attempt; save();
        let uploadError;
        try { await publisher.publish(entry, uploadTag); } catch (error) { uploadError = error; }
        // Always check registry after return/timeout, before retry. Query errors
        // stop the train; only a definitive 404 permits retry of the same bytes.
        existing = await registry.version(entry);
        if (classifyVersion(entry, existing) === 'verified-existing') {
          assertProvenance(entry, existing, artifact.sourceSha);
          const observed = await registry.package(entry);
          validatePackument(entry, observed, true);
          check(observed['dist-tags'][uploadTag] === entry.version, `Postpublish upload tag mismatch: ${entry.name}`);
          if (!staged) current.tagState = 'verified';
          current.state = 'published'; current.uploadTag = uploadTag; save(); break;
        }
        check(uploadError?.retryable === true && attempt < maxAttempts,
          `Publish failed or visibility uncertain: ${entry.name}; retain artifact and resume after review`);
        pendingPackument(entry, await registry.package(entry), current.tag, bootstrapPackages);
      }
    }
    // Optional staging/promotion is capability gated. The default publishes
    // directly with explicit latest/next on npm 11.17; there is no tag command.
    if (promote) for (const entry of entries) {
      current = ledger.packages.find(item => item.name === entry.name);
      const observed = validatePackument(entry, await registry.package(entry), true), tagged = observed['dist-tags'][current.tag];
      if (tagged && semver.valid(tagged) && semver.gte(tagged, entry.version)) {
        current.tagState = tagged === entry.version ? 'verified' : 'preserved-newer'; save(); continue;
      }
      assertNotStale(entry, observed, current.tag);
      const existing = await registry.version(entry);
      classifyVersion(entry, existing); check(existing, 'Promotion version disappeared');
      assertProvenance(entry, existing, artifact.sourceSha);
      await publisher.tag(entry, current.tag);
      check(validatePackument(entry, await registry.package(entry), true)['dist-tags'][current.tag] === entry.version, `Postpublish channel tag mismatch: ${entry.name}`);
      current.tagState = 'verified'; save();
    }
    ledger.status = staged && !promote ? 'uploaded-awaiting-promotion' :
      ledger.packages.some(entry => entry.tagState === 'repair-required') ? 'tag-repair-required' : 'complete';
    save(); return ledger;
  } catch (error) {
    if (ledger) {
      if (current) { current.previousState = current.state; current.state = 'failed'; current.error = error.message; }
      ledger.status = 'failed'; ledger.error = error.message; save();
    }
    throw error;
  } finally { fs.closeSync(lock); fs.unlinkSync(lockFile); }
}
module.exports = { channelTag, promotionSupported, classifyVersion, validatePackument, sourceRepository,
  assertNotStale, assertProvenance, verifyRegistryDependency, publishRelease };
