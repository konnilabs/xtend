'use strict';
// Fixture-only module loader. Production has no injectable retirement option.
// The scanner dependency is a temporary source-retired copy of the real engine.
// The actual publisher state machine runs with a scoped release-evidence seam:
// controlled mode tests registry transitions, real mode verifies Core evidence
// or the explicit historical v1 audit envelope plus today's Union verifier.
// This cannot publish: callers supply in-memory publishers. No acceptance is
// inferred for the production source, which remains pending and guarded.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
function loadPublisher(retired = true, { sealedBoundary = 'controlled' } = {}) {
  const file = path.resolve(__dirname, '../../scripts/release/publish.cjs');
  const scanner = require('../migration/manifest-initial-authority/harness.cjs').load(retired);
  const fixture = new Module(file, module), realRequire = Module.createRequire(file);
  fixture.filename = file;
  fixture.require = name => {
    if (name === '../scan_schema_inventory') return scanner;
    if (name === './release-evidence.cjs') {
      const evidence = realRequire(name);
      return {
        evidenceContract(artifact) {
          // Legacy archive/registry primitives have no production candidate seal.
          // This scoped unit backend does not enroll them for real publishing.
          if (artifact.manifest.schema === ['xtend','release','artifact','v1'].join('.')) {
            require('node:assert/strict').ok(!Object.hasOwn(artifact.manifest,'profile'));
            return 'legacy-unit-audit';
          }
          return evidence.evidenceContract(artifact);
        },
        async verifyPreflightAuthority(artifact) {
          if (sealedBoundary !== 'controlled' && artifact.manifest.profile)
            return evidence.verifyPreflightAuthority(artifact);
        },
        async verifyPublicationEvidence(artifact) {
          scanner.assertCandidateInitialAuthorityRetiredForRelease();
          if (sealedBoundary === 'controlled') return;
          if (artifact.manifest.profile) return evidence.verifyPublicationEvidence(artifact);
          const sealed = await require('./legacy-runtime.cjs').load('scripts/release/artifact.cjs').assertSealedArtifact(artifact);
          realRequire('./union.cjs').verifyStoredUnion({directory:sealed.directory,artifact});
          return sealed;
        }
      };
    }
    return realRequire(name);
  };
  fixture._compile(fs.readFileSync(file, 'utf8'), file);
  return fixture.exports;
}
module.exports = { loadPublisher };
