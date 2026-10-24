'use strict';
const { check } = require('./inventory.cjs');
const { PROFILE, ARTIFACT, coreContract } = require('./profile.cjs');
// Dispatch by immutable contract identity, never by a caller-selected fallback.
function evidenceContract(artifact) {
  const manifest = artifact?.manifest;
  if (manifest?.schema === ARTIFACT) {
    coreContract(manifest, ARTIFACT);
    check(manifest.candidateBinding?.profile === PROFILE &&
      !['demoSha', 'demoRepository', 'productEvidence', 'unionEvidence'].some(key => Object.hasOwn(manifest.candidateBinding, key)),
      'Mixed or relabeled Core candidate binding');
    return PROFILE;
  }
  check(manifest?.schema === 'xtend.release.artifact.v1' &&
    !Object.hasOwn(manifest, 'profile') && !Object.hasOwn(manifest, 'coreEvidence') &&
    manifest.candidateBinding && !Object.hasOwn(manifest.candidateBinding, 'profile') &&
    /^[a-f0-9]{40}$/.test(manifest.candidateBinding.demoSha || '') && manifest.unionEvidence,
    'Unknown, mixed or relabeled release evidence contract');
  return 'legacy-union';
}
function verifyStoredReleaseEvidence(artifact, { directory }) {
  if (evidenceContract(artifact) === PROFILE)
    return require('./core-evidence.cjs').verifyCoreEvidence(artifact, { directory });
  // Retain the original legacy source/union boundary, including original seal time.
  return require('./union.cjs').verifyStoredUnion({ directory, artifact });
}
async function verifyPreflightAuthority(artifact) {
  const contract = evidenceContract(artifact);
  if (contract !== PROFILE) return; // Legacy publication retains its original union boundary.
  const binding = await require('./artifact.cjs').assertPreflightArtifact(artifact);
  if (binding.phase === 'sealed') {
    // Existing sealed CLI authentication remains valid, with original sealedAt.
    return verifyStoredReleaseEvidence(artifact, { directory: binding.directory });
  }
  // A prepared canary need not be sealed, but cannot perform registry/npm work
  // without the authenticated current Core source, projection and authority.
  const source = require('./core-source.cjs');
  return source.withCoreSourceEnvironment({ rootDir: binding.rootDir, typescript: require('typescript') }, context => {
    check(context.provider.provenance().coreSha === artifact.sourceSha, 'Prepared preflight source differs from verified artifact');
    return source.validateCoreAuthority(context);
  });
}
async function verifyPublicationEvidence(artifact) {
  evidenceContract(artifact);
  require('../scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease();
  const sealed = await require('./artifact.cjs').assertSealedArtifact(artifact);
  verifyStoredReleaseEvidence(artifact, { directory: sealed.directory });
  return sealed;
}
module.exports = { evidenceContract, verifyStoredReleaseEvidence, verifyPublicationEvidence, verifyPreflightAuthority };
