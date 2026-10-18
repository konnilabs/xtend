# Private first-release contract registration

Artifact v2, Canary v2 and CoreEvidence v1 may retain a null release hash only
after the verified Core source decision explicitly registers all three. The
decision's `unreleasedContracts` block is pending in production. Its registrations
are empty; no source, authority or publication approval is included in this patch.

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

After source review, each registration would contain `schemaId`, `familyId`,
`version`, `status: reviewed-current-source`, `canonicalDefinition`, exact sorted
`sources: [{path, sha256}]`, `observedFingerprints`, `acceptedFingerprints`,
`authoritativeFingerprints`, and `releasedFingerprintSetHash: null`. The enclosing
block must have format 1, status `reviewed-unreleased-contract-registration` and
`publicationGuardRetired: false`. These values describe a future reviewed record;
the implementation does not populate or approve it. Other inventory validations,
duplicate reviews and all release admission/authentication checks still apply.

Run `tests/schemas/core_unreleased_registration.test.cjs` with Node's test runner
on both supported Node versions. Set `XTEND_UNRELEASED_SOURCE_CAPTURE` to a fresh
capture directory containing `observation.json` from the real scanner and
`source-capture/{sources.tar.gz,producer-receipt.json}` from the real clean-commit
producer. No missing-input skip is allowed. The tests construct clearly labelled
controlled Git-object transports with a separate Git index. Reviewed flags exist
only inside temporary fixtures; production files, branches and guards are not
changed. Positive tests use the provider-bound Core context and full inventory
validation. Negative tests cover authenticated but substituted metadata, sources,
forms and release facts, as well as forged providers, changed scans and changed
materialized bytes. No network or publishing backend is used.
