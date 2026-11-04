# Private first-release contract registration

Artifact v2, Canary v2 and CoreEvidence v1 may retain a null release hash only
after the verified Core source decision explicitly registers all three. The
decision's `unreleasedContracts` block now registers the exact three reviewed
contracts. Konni approved groups A–D for source
`610499fc2c9f8ee5242837a2951e12b73794d698` and the complete binding annex with
SHA256 `632c42a46099b7b5f62c6f24585a65313b15ce4a0d00fb4cefad09c2e4e05c7d`.
The decision records that explicit source approval; publication is still blocked.

The existing reviewed projection binds the decision, complete inventory and Core
source membership. Registration additionally requires the original provider and
unmodified extraction, fixed formal declaration locations, complete declaration
authority, exact observed and accepted fingerprint sets, and exact hashes for all
observed source paths and the named Producer/Admission validators. Partial runtime
or fixture observations cannot become authority. Registration cannot cover other
IDs, profiles, declaration sources, aliases, replacements or released contracts.
The immutable historical inventory and legacy Artifact/Canary release facts must
remain unchanged. Candidate registration and its historical continuity use their
existing separate code path. The FirstRelease publication guard remains active.

Each reviewed registration contains `schemaId`, `familyId`,
`version`, `status: reviewed-current-source`, `canonicalDefinition`, exact sorted
`sources: [{path, sha256}]`, `observedFingerprints`, `acceptedFingerprints`,
`authoritativeFingerprints`, and `releasedFingerprintSetHash: null`. The enclosing
block must have format 1, status `reviewed-unreleased-contract-registration` and
`publicationGuardRetired: false`. Registration does not retire FirstRelease or
invent released hashes. Other inventory validations,
duplicate reviews and all release admission/authentication checks still apply.

Run `tests/schemas/core_unreleased_registration.test.cjs` with Node's test runner
on both supported Node versions. Set `XTEND_UNRELEASED_SOURCE_CAPTURE` to a fresh
capture directory containing `observation.json` from the real scanner and
`source-capture/{sources.tar.gz,producer-receipt.json}` from the real clean-commit
producer. No missing-input skip is allowed. The tests construct clearly labelled
controlled Git-object transports with a separate Git index. Test mutations exist
only inside temporary fixtures; production files, branches and guards are not
changed by tests. Positive tests cover the actual approved capture as well as
the provider-bound Core context and full inventory
validation. Negative tests cover authenticated but substituted metadata, sources,
forms and release facts, as well as forged providers, changed scans and changed
materialized bytes. No network or publishing backend is used.

## Publish-free preparation interface

The bounded interface adjustment was authorized on 2026-11-02 at 14:01:54 UTC
(conversation reference `Sentinel_5f1b390b7c0c8191b1ae5b7f88404960`). This authorizes
local implementation, the required source binding update and independent review;
it does not authorize publication, a workflow dispatch, a push or guard retirement.
The separate `preparationInterfaceReview` decision record describes the current
technical review. Earlier approval records retain their original meaning.

For a future authorized manual workflow run on main, `prepare_release: true`
with `publish_to_npm: false` enables the existing Laravel gate and artifact seal.
Collection requires that explicit mode, the exact trusted repository, source,
workflow, run and attempt, successful mandatory jobs, authenticated source bytes,
both installed-consumer lanes and mandatory native browser/security evidence.
No candidate is repacked during sealing. The source and immutable proof checks
are the same as those used by the publication path. The preparation path never
enters the npm publish job and has no OIDC write permission.

`npm run test:ci-prepare` retains the resolved technical suite set and additional
checks of `test:ci-publish`, replacing only its publication evidence suite with
`core-preparation-evidence`. That distinct, non-aliased suite verifies fully sealed
Core bytes and stored authority without requiring FirstRelease retirement. A
preparation report cannot supply the missing publication evidence suite when
projected as `ci-publish`. `release:verify-preparation-evidence` exposes the same
read-only evidence check. The publish profile, publication APIs, FirstRelease
retirement check, environment protection and npm permissions remain unchanged.
If both workflow inputs are true, the guarded publication path is selected.

Only the Core authentication validator source digest in the CoreEvidence
registration changes, followed by the decision digest in the projection policy.
Declarations, observed and authoritative fingerprints, source membership,
candidate authority and released hashes are unchanged. The separate source
retirement decision remains necessary. An artifact prepared while FirstRelease
is active cannot become publishable at that SHA by switching a workflow input:
final release artifacts must be prepared again from the final authorized source.

Controlled protocol tests exercise sealing, tamper rejection and report isolation
using explicit source-authority/native-security doubles. They provide no hosted
workflow acceptance or product browser evidence. The clean committed source
capture, strict scanner and both Node registration suites above are additionally
required to validate the changed binding. Hosted acceptance and the currently
infrastructure-blocked strict browser gate remain separate evidence requirements.
