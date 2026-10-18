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
