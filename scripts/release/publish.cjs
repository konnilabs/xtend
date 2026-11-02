'use strict';
const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');
const { check, readJson } = require('./inventory.cjs');
const { digest } = require('./artifact.cjs');
const { isDeepStrictEqual } = require('node:util');
const { safeDiagnostic, redact } = require('./npm.cjs');
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
  // The production adapter verifies the Sigstore bundle with npm's verifier
  // before exposing these statements. Here source and tarball subject are bound.
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
  prereleaseTag = 'next', maxAttempts = 2, bootstrapPackages = [], onLedger = () => {}, priorLedgers = [], loadPriorLedgers = async () => [],
  visibilityAttempts = 4, visibilityDelayMs = 5000, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  require('./release-evidence.cjs').evidenceContract(artifact);
  check(Number.isInteger(maxAttempts) && maxAttempts >= 1 && maxAttempts <= 3, 'Publish attempts must be 1..3');
  check(Number.isInteger(visibilityAttempts) && visibilityAttempts >= 1 && visibilityAttempts <= 10, 'Visibility attempts must be 1..10');
  check(Number.isInteger(visibilityDelayMs) && visibilityDelayMs >= 0 && visibilityDelayMs <= 10000, 'Visibility delay must be 0..10000ms');
  // maxAttempts remains accepted for old callers, but never permits upload retries.
  check(!promote || publish && staged, 'Promotion requires explicit staged publish');
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  // Never remove a foreign/stale lock automatically. Recovery requires review.
  const lock = fs.openSync(lockFile, 'wx');
  let ledger, current, writable = false;
  function save() { writeLedger(ledgerFile, ledger); onLedger(structuredClone(ledger)); }
  try {
    const entries = artifact.order.map(name => artifact.packages.find(entry => entry.name === name));
    check(entries.every(Boolean) && entries.length === artifact.packages.length && new Set(artifact.order).size === entries.length,
      'Publish order differs from artifact');
    check(Array.isArray(priorLedgers), 'Authenticated upload history must be an array');
    let history = [...priorLedgers];
    if (fs.existsSync(ledgerFile)) history.push(readJson(ledgerFile));
    ledger = { schema: 'xtend.release.ledger.v1', manifestIntegrity: artifact.manifestIntegrity, sourceSha: artifact.sourceSha,
      mode: publish ? (staged ? 'staged-publish' : 'direct-publish') : 'dry-run', status: 'pending', packages: entries.map(entry => ({ name: entry.name,
        version: entry.version, integrity: entry.integrity, state: 'pending', tag: channelTag(entry.version, prereleaseTag) })),
      registryDependencies: (artifact.registryDependencies || []).map(entry => ({ ...entry, state: 'pending' })) };
    // Save validated local markers before any fallible hosted history read. A
    // transient API error then leaves an honest no-new-upload snapshot, while
    // every older attempt is still mandatory on the next invocation.
    for (let phase = 0; phase < 2; phase++) {
      for (const previous of history) {
        check(previous?.schema === ledger.schema && previous.manifestIntegrity === artifact.manifestIntegrity &&
          previous.sourceSha === artifact.sourceSha, 'Resume refused: ledger belongs to another immutable artifact');
        check(Array.isArray(previous.packages) && previous.packages.length === ledger.packages.length &&
          previous.packages.every((item, index) => ['name', 'version', 'integrity', 'tag'].every(key => item[key] === ledger.packages[index][key])),
          'Resume refused: package/order/channel identity differs from immutable artifact');
        for (const [index, item] of previous.packages.entries()) {
          check(item.attempt === undefined || Number.isInteger(item.attempt) && item.attempt >= 1 && item.attempt <= 3, 'Invalid prior upload attempt');
          if (item.uploadAttempted !== undefined) check(typeof item.uploadAttempted === 'boolean', 'Invalid prior upload marker');
          if (item.uploadAttempted || item.attempt > 0 || ['published', 'pending-verification'].includes(item.state)) {
            const target = ledger.packages[index];
            target.uploadAttempted = true; target.attempt = item.attempt || 1;
            target.uploadTag = item.uploadTag || (previous.mode === 'staged-publish' ?
              `${semver.prerelease(target.version) ? 'prerelease' : 'stable'}-${artifact.sourceSha}` : target.tag);
            check(target.uploadTag === (staged ? `${semver.prerelease(target.version) ? 'prerelease' : 'stable'}-${artifact.sourceSha}` : target.tag),
              'Resume refused: upload channel differs from prior attempt');
            if (item.publishDiagnostic) target.publishDiagnostic = safeDiagnostic(item.publishDiagnostic);
          }
        }
      }
      writable = true; save();
      if (phase === 0) {
        if (publish) require('../scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease();
        await require('./release-evidence.cjs').verifyPreflightAuthority(artifact);
        if (publish) await require('./release-evidence.cjs').verifyPublicationEvidence(artifact);
        history = await loadPriorLedgers();
        check(Array.isArray(history), 'Authenticated upload history must be an array');
      }
    }
    if (promote) promotionSupported(npmVersion, distTagsAuthorized); // before first upload
    // Complete preflight before the first irreversible operation.
    for (const dependency of artifact.registryDependencies || []) {
      current = ledger.registryDependencies.find(item => item.name === dependency.name);
      await verifyRegistryDependency(artifact, dependency, registry);
      current.state = 'verified-existing'; save();
    }
    async function verifyAttempt(entry, target) {
      // The write-ahead marker means absence can NEVER authorize another upload.
      target.state = 'pending-verification'; save();
      for (let poll = 1; poll <= visibilityAttempts; poll++) {
        for (const dependency of artifact.registryDependencies || []) await verifyRegistryDependency(artifact, dependency, registry);
        target.verificationChecks = (target.verificationChecks || 0) + 1;
        let existing, observed, readFailed = false;
        try { existing = await registry.version(entry); }
        catch (error) { target.verificationError = redact(error.message); readFailed = true; }
        if (!readFailed && classifyVersion(entry, existing) === 'verified-existing') {
          assertProvenance(entry, existing, artifact.sourceSha);
          try { observed = await registry.package(entry); }
          catch (error) { target.verificationError = redact(error.message); readFailed = true; }
          if (!readFailed && observed !== null) {
            // Validate shape and integrity immediately; only eventual presence/tag
            // convergence is polled, never a conflicting immutable version.
            validatePackument(entry, observed);
            const uploadTagState = observed.versions.includes(entry.version) ? existingTagState(entry, observed, target.uploadTag) : 'repair-required';
            if (uploadTagState === 'verified' || target.uploadTag === target.tag && uploadTagState === 'preserved-newer') {
              target.state = 'published';
              target.tagState = existingTagState(entry, observed, target.tag);
              delete target.verificationError; save(); return true;
            }
          }
        }
        save();
        if (poll < visibilityAttempts) await wait(visibilityDelayMs);
      }
      return false;
    }
    // Reconcile ALL earlier requests before dry-runs or any new upload, including
    // when called in read-only mode. A later dry-run cannot erase upload history.
    for (const entry of entries) {
      current = ledger.packages.find(item => item.name === entry.name);
      if (current.uploadAttempted) {
        if (!await verifyAttempt(entry, current)) { ledger.status = 'pending-verification'; save(); return ledger; }
        continue;
      }
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
    // Preserve the publish dry-run gate using the actual checked .tgz bytes.
    // Run every pending package before the first upload; existing versions are
    // verified through the registry instead. This does not test OIDC trust.
    if (publisher.dryRun) for (const entry of entries) {
      current = ledger.packages.find(item => item.name === entry.name);
      if (current.state !== 'pending') continue;
      await publisher.dryRun(entry, staged ? `${semver.prerelease(entry.version) ? 'prerelease' : 'stable'}-${artifact.sourceSha}` : current.tag);
      current.publishDryRun = 'passed'; save();
    }
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
      check(!current.uploadAttempted, 'Previously attempted version disappeared; never upload again');
      const bytes = fs.readFileSync(entry.absoluteFile);
      check(bytes.length === entry.size && digest(bytes) === entry.integrity, 'Artifact changed before upload');
      for (const dependency of artifact.registryDependencies || []) {
        await verifyRegistryDependency(artifact, dependency, registry);
      }
      // Persist before invoking npm, including a crash/timeout during the request.
      current.uploadAttempted = true; current.attempt = 1; current.uploadTag = uploadTag;
      current.state = 'pending-verification'; save();
      try { await publisher.publish(entry, uploadTag); }
      catch (error) {
        // npm output and arbitrary adapter exceptions are untrusted. Keep only a
        // recognized code and its static actionable explanation.
        current.publishDiagnostic = safeDiagnostic(error.diagnostic);
        save();
      }
      if (!await verifyAttempt(entry, current)) {
        ledger.status = 'pending-verification'; save(); return ledger;
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
    if (ledger && writable) {
      if (current) { current.previousState = current.state; current.state = 'failed'; current.error = redact(error.message); }
      ledger.status = 'failed'; ledger.error = redact(error.message); save();
    }
    throw Error(redact(error.message));
  } finally { fs.closeSync(lock); fs.unlinkSync(lockFile); }
}
module.exports = { channelTag, promotionSupported, classifyVersion, validatePackument, sourceRepository,
  assertNotStale, assertProvenance, verifyRegistryDependency, publishRelease };
