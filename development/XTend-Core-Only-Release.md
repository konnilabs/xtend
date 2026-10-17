# Core-only npm release

This is the current release contract for the Core 0.9 migration proposal. It is
not release acceptance. The reviewed inventory projection and Candidate v1/v2
authority decisions remain pending, and the first-release publication guard is
still active. Historical paired Core/Demo evidence cannot authorize this path.

## Ownership

The seven complete product applications belong to
[konnilabs/xtend-demos](https://github.com/konnilabs/xtend-demos). Their Electron,
model-runtime, application-browser and PHP-FPM results belong to that repository.
They are not dependencies of the Core npm publish job. An independent migration
audit may still fail on Demo evidence without changing Core release requirements.

Core keeps its published packages, XTend MCP, deterministic framework fixtures
and runnable documentation examples. Core's own runtime, browser security,
PHP/Laravel, package, type and API checks remain mandatory.

## Immutable contracts

| Concern | Contract |
| --- | --- |
| Profile | `xtend.npm.core-only.v1` |
| Candidate manifest | `xtend.product-candidates.v2` |
| Release artifact | `xtend.release.artifact.v2` |
| Installed consumer canary | `xtend.release.canary.v2` |
| Evidence envelope | `xtend.release.core-evidence.v1` |
| Producer runtime | Node `24.18.0`, npm `11.17.0` |
| Installed consumer lanes | Node `24.18.0` and `26.5.0` |
| Mandatory Core security browser lane | Node `24.18.0` |

Core contracts bind the exact Core source SHA and immutable package bytes. They
reject `demoSha`, `demoRepository`, `productEvidence` and `unionEvidence` fields.
The legacy v1 candidate manifest remains a separate paired migration-audit
contract; its Demo identity cannot be relabeled as Core v2 evidence.

`scripts/release/inventory.json` defines the ten public packages and their release
groups. Selection must preserve the exact dependency closure. Consumer evidence
must cover both the all-ten SDK and the selected release with its pinned registry
dependencies. Existing package versions, provenance checks and immutable artifact
identities remain enforced.

## Source and authority gates

`core-source-artifact` captures committed Core source and binds the source SHA,
workflow run and attempt, archive and manifest digests. The private source
provider rejects missing, extra or substituted members. Schema assertions execute
against this provider and its authenticated local dependency closure.

The following files must be independently reviewed from a fresh final capture:

- `scripts/release/core-projection-policy.json`
- `tests/schemas/core-release-inventory.json`
- `development/core-release-authority-decision.json`
- `development/core-candidate-authority.json`

Pending/null decisions are blocking. Candidate v1 must retain its genuine fixed
historical complete authority and history. Candidate v2 needs an explicit initial
unreleased registration and an explicit parallel-profile family decision. Existing
v1 contracts remain active; this migration does not deprecate them. The current
single-active-version registry cannot yet represent both active profiles, so that
review remains blocking rather than silently changing lifecycle or guards. No generated scan, historical green
report or metadata edit may invent a released fingerprint or retire the separate
first-release publication guard.

The schema scanner is private release tooling. The root package exports
`candidate-integrity` and the public runtime/tooling helpers, but does not export
`schema-inventory` or package the entire `tools` tree. Public tooling directories
are enumerated explicitly. The Demo migration audit still needs its remaining
dependency on the former public schema API reconciled; that work must not restore
a Demo dependency in the Core publish chain or silently drop audit assertions.

## Preparation, preflight and publication

Preparation requires a clean committed source, authenticated Core capture and
reviewed authority before producing release bytes. Build checks must reject stale
committed generated assets. Packing, installed consumers, raw evidence and sealing
must refer to the same immutable candidate set.

The Core default workflow retains `full-release-gates`,
`rmt-vnext-primitive-gates`, `package-structure`, `conditional-network-evidence`,
`node-native-toolchain-smoke`, `xtend-mcp-vscode-smoke` and
`laravel-release-gates`, plus authenticated Core source, installed consumers and
Core security evidence. `release-seal` binds their results to the artifact.

CLI preflight verifies Core authority before invoking npm. Direct publisher
preflight performs the same check before registry reads and retains a failure
ledger. A production prepared-plus-canary artifact can preflight without a seal,
but requires authenticated current Core source/run inputs. A sealed artifact
revalidates stored evidence at its original `sealedAt`; resuming cannot refresh
old evidence by rewriting timestamps.

Actual publication additionally requires the original sealed artifact identity,
source-level retirement of the initial-authority guard and a separately authorized
publish action. Registry collisions, dependency drift, missing provenance and
concurrent publish locks continue to fail closed. Do not bypass these controls
to finish the migration.

## Demo handoff

Demo installation can consume legacy paired v1 candidates or explicit Core v2
candidates. For v2, the Demo SHA belongs to the Demo checkout and evidence context,
not the Core manifest. Both paths verify candidate bytes and isolated installed
dependency resolution. Exact source pins must only change to real, reviewable
commits; no integration-tree hash is a commit or a valid replacement pin.

Before final acceptance, reconcile the remaining Demo schema-audit API dependency,
regenerate/check MCP knowledge, run the complete schema and mutation suites, and
produce fresh evidence on the pinned runtimes. A local syntax or fixture result
does not substitute for these gates.


## Private migration audit

The Demo repository prepares a separate, exact clean Core checkout for migration
checks. `tools/schema-inventory/source-audit.cjs` validates the committed source
and executable dependency closure before exposing the private scanner. It is not
an npm export or a runtime dependency of the products. The source audit verifies
candidate archive bytes, installed closure and resolution, 24 historical authority
sources, all 103 selected IDs and their historical governance. The independent
migration canary supplies its already pinned source checkout to the Demo tests.
Core release preparation, seals and publication do not consume this audit.

The existing Demo pin must be updated only after the audited Core commit is
reviewed and durably available. A local integration tree or local review snapshot
is not a replacement remote pin. Pending Core projection/authority decisions and
the initial-publication guard remain mandatory and unchanged.

## Compatibility preserved in the local migration

The public `interface CandidateManifest` retains the complete legacy v1 shape,
including `demoSha`. `LegacyCandidateManifest` is an alias to that interface;
`CoreCandidateManifest` is separate. Shared selectors explicitly accept the union.
The original interface remains augmentable. These API decisions do not approve
new exact declaration-byte bindings or retire the first-release guard.

Core produces and validates `xtend.release.canary.v2`, including its Core profile,
source, package/build digests and installed-consumer evidence. Historical
`xtend.release.canary.v1` evidence remains v1 and cannot authorize a Core v2 release.
Legacy candidate, artifact and canary v1 contracts are not deprecated here.

Maraca preserves historical `false`, `0` and empty-string fingerprint inputs: the
producer normalizes them to null before validating. The config loader validates
the same normalized meaning without rewriting the stored config or its digest.
Absent/null and valid lowercase SHA-256 values retain their behavior; malformed
truthy values, wrong service-source hashes and changed config fingerprints still
fail. The exact source/shape registrations remain a separate pending review.
