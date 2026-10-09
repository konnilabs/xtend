# Local release integration provenance

No push, Draft-PR, publication, trust change, merge or deployment is authorized
by this checkpoint. Independent source review precedes push/Draft-PR. Schema
governance remains pending and every red gate stays blocking.

## Verified normal remote refs

| Repository / branch | Explicitly reviewed source |
| --- | --- |
| konnilabs/xtend / feat/product-demos-extraction | C7 cce3faf8c283af7f0732231aafc74ee9f18560d7 |
| same branch, first narrow successor | b9fac305bba5fa57e8f9b37a1fe65bc94c8ff269 |
| same branch, installed FPM discovery successor | 74730ec0898b52c7d82769e1eb785e52f02cb4ab |
| konnilabs/xtend-demos / feat/product-demos-migration | D3 f6c2d9097a70449d3dd2420aaf8881304a79a512 |
| same branch, first CI successor | 586eb6ca060b6fd612bb114c24235b992a52b635 |
| same branch, installed FPM / actual Illuminate closure | 646d4a4e89e51af82bea145c2a0030bb5fefcd25 |

All full SHAs were checked against fetched normal branch refs before use. Demos
has a separate own clone, checked out at its exact SHA; no migration worktree is
shared or edited. The integration owns a separate worktree and branch
`feat/scoped-npm-release-integration` starting at C7.

## Local replay, with unchanged original commits

| Approved original | Local cherry-pick with -x |
| --- | --- |
| a8db5c10f4262bb70d5a8bca5fdf79043bcdf3d8 | b5ce82145ffffd7e7953207274c863623631265f |
| 6f7cec618a9de22f5f7df079e8186c42c89a9a3f | 3a82eeb34bcb436e1a12ef0ac844a382838c09ba |
| dd6bdc369745f81f6e17d3d1694d3948096c2e26 | d60454696379e5613af24f10a479133adf6f3ef3 |
| b9fac305bba5fa57e8f9b37a1fe65bc94c8ff269 | cd7e8aa865e9f8fc2c48a0628bbd6479dc51f4ca |
| 74730ec0898b52c7d82769e1eb785e52f02cb4ab | ebea6ff94d16e486b6b90d96831000daead3d5f2 |

The first replay conflicted only in package scripts, test catalog and handler
registration. Resolution retained every C7 migration script/handler/suite and
added the release scripts/handler/suite; it did not restore removed private
product workspaces. Both test sets remain present. Later release replays applied
without conflict and retain the prior Core/MCP/Material version policy.

Before the FPM successor, only the own in-progress default workflow was saved
locally. Its exact source was retained in the review scratch export. The narrow
successor was committed first, then the release workflow was reapplied and both
FPM provisioning blocks were routed through its canonical
`scripts/provision_product_fpm.cjs`. The old publisher's redundant product build
is removed; new preparation uses the same reviewed FPM detector. No competing
FPM detector, Composer pin, MCP generator or Demo workflow was introduced.

## Canonical API and historical evidence

`scripts/product-candidate-canary.cjs#packCandidates` is unchanged from C7;
function-source SHA-256:
`c9b1a8a0a78112de934a67bfcc62d45f7de80be3ad016f605593e3d1ccdbfa45`.
Only CLI orchestration gains an authenticated existing-candidate branch. The
release adapter verifies `xtend.product-candidates.v1`, original package bytes,
both source identities, all dependency fields, all ten inventory entries and
selected release/registry closure. The canonical public consumer APIs remain
`verifyCandidates`, `selectCandidateClosure`, `verifyInstalledClosure` and
`verifyResolution`; the reviewed Demo installer uses them per application.

The old product pin's `implementationCoreSha` is historical C6, and the prior
full C6/D3 candidate evidence was red. Updating the current `demoSha` does not
rewrite that history or assert acceptance. New artifacts use actual integration
HEAD as `coreSha/sourceSha` and current committed Demo SHA as `demoSha`.
`mergeBlocked: true` and pending schema governance remain unchanged.

## Evidence limits

Local fixture publish tests use an in-memory registry and cannot publish npm.
Node/npm pins are 24.18.0 and 26.5.0 with npm 11.17.0. Report every baseline,
integration, tarball, product and hosted check with its real source/runtime.
Focused green tests are not full aggregate or product acceptance. The complete
review export records running and not-yet-run checks separately. Longer runs may
finish after the immutable source checkpoint; append a separate evidence export,
never amend its source or relabel earlier results.

The first immutable integration checkpoint is
`1713d821db3fb70daa046b0c44dda0c292f1ea23`; its complete source export is retained.
The subsequent own branch `feat/scoped-npm-release-integration-followup` fixes
consumer validation for an explicitly supplied artifact directory, preserves the
actual tarball publish dry-run gate, provisions the reviewed browser/FPM runtime
for the unchanged publish aggregate, and projects all ten packages into root
publish metadata. Regression contracts now assert immutable artifact publication
and permit only the deliberately removed publisher cache restore; they retain
every original prerequisite and all other cache checks. Schema governance and
unrelated baseline failures remain blocking. No original checkpoint is amended.

Independent review identified three execution-path defects in 1713d82: plain Node
steps had no persistent npm CLI path; groups-only/packages-only shell arguments
contained an empty counterpart; and the npm-bundled Sigstore SAN matcher interpreted
the unescaped identity as a regex. The follow-up exports a verified absolute CLI
through GITHUB_ENV, omits/normalizes only empty selection inputs, and applies an
escaped fully anchored SAN policy. npm11.17.0 bundles sigstore4.1.1 and
@sigstore/verify3.1.1; its createVerificationPolicy forwards certificateIdentityURI
to subjectAlternativeName and policy.js calls signerIdentity.match(policyIdentity).
certificateIssuer maps to extensions.issuer, compared by strict equality;
ctLogThreshold and tlogThreshold are the actual supported threshold option names.
Tests exercise the bundled Verifier.verifyPolicy and policy.js directly, as well
as clean shells with no lifecycle variable and the actual workflow selection block.
These are policy-path regression tests, not a claim of live hosted OIDC publishing.

## PR109 local reconciliation (no push before review)

The published, independently source-reviewed head remains
`184434747245c02012824b120105f762f072f20d`. An own worktree and branch
`feat/scoped-npm-release-reconciliation` preserves it as an ancestor. Normal
remote refs were fetched and checked at Core
`0aa3f66816194f1854009136277dfb2877fcaab6`, Demos
`59130fdf1160f79ba5de3e4ccd2d92cba7bfde1c`, and main
`d4912deb30fe8d85d8e442e34d74ec6050f0fe09`. Main's exact parents are
`31d8c01f92538b55e57e741ed4e71a4e4a6604b5` and
`168733ed12170950faa13e053e949dc44c3146dc`. Its two-file runtime-peer Vue
3.5.22 to 3.5.43 patch was read and preserved in a normal local merge
`351c5726c5a80d69aa789374fafd877fae57926c`; no Demos Vue update was made.

The subsequent normal merge of the exact Core ref has three textual conflicts.
The workflow retains the reviewed immutable-artifact publisher instead of
reintroducing publisher-side build/cache/provision steps; preparation and sealing
keep all prerequisite and product gates. The Demo pin uses the exact reviewed
59130fdf source while retaining the historical C6 implementation/evidence chain
and mergeBlocked flag. The inventory is merged by schema identity, preserving
all disjoint migration governance changes and release entries/pending reviews.
The one jointly edited CandidateManifest retains the migration's canonical
declaration and source-level review provenance, but the larger actual six-shape
observation has review-required policy with empty acceptance. No four-shape approval
is extended to it. Only affected release observation metadata is refreshed.

The real publish CLI and publisher now call the unchanged canonical scanner
wrapper's initial-authority retirement assertion. Its active source capability
blocks first publish and resume before registry reads or upload. Mock-publisher
tests use only a temporary source-retired copy of the real engine; production
has no injected bypass. The twelve portable migration authority cases retain
the exact approved four-shape registration in a digest-bound 0aa3f668 fixture,
and an extra negative case rejects the larger pending current observation.

The release adapter consumes public ownership evidence bound to the original
candidate manifest/tarballs and both exact source SHAs. The immutable report's
time is checked against preparation and authenticated sealing; resume keeps the
original evidence. The scanner engine, public ownership implementation and
canonical packCandidates function remain those of the reviewed migration.
Prior 6ae0faf tarballs and 203/212-test evidence are historical; they are never
relabeled as evidence for this merge. Pending governance and baseline failures
remain blocking. No original source checkpoint or review export is amended.
