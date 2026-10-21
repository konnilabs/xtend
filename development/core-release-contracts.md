# Core release declarations — reviewed unreleased registrations

The three draft-07 files in `contracts/release` describe complete serialized
**producer** structures. They are maintained declarations, not fixture snapshots.
Their IDs retain the existing payload discriminators. No `phase` member is added.
They are not imported by production and do not grant source, schema, FirstRelease,
seal or publication authority. A complete scanner observation is not an accepted
contract. No legacy v1 policy or public API is changed.

The exact registrations are recorded in `core-unreleased-registration.md` and
`core-release-authority-decision.json`. Reviewed registration is not FirstRelease
retirement, a release seal or publication approval.

## Existing phases

| Contract | Phase | Produced structure and existing admission boundary |
| --- | --- | --- |
| Artifact v2 | adapted | `adaptCandidates`: full candidate binding (all ten identities, size, SRI, SHA256), build raw SRI, normalized selection, edges, archive/file/metadata inventories, registry and bootstrap closures. No timestamps, canary or seal. |
| Artifact v2 | prepared | `pipeline.prepare` adds canonical `preparedAt`. Canary is optional until `requireCanary=true`; no seal fields. Prepared-plus-canary can enroll preflight only. |
| Artifact v2 | sealed | `pipeline.seal` adds `sealedAt`, bound `coreEvidence`, and the Node24 envelope consumer binding as canary. Full authenticated verification is required before enrollment. Structure alone never creates a seal. |
| Canary v2 | completed | `runConsumers` first assigns completed all-ten `candidateSDK`, then merges the independently completed selected scope. Both lock digests, all per-package checks, both timestamps and `error:null` exist. |
| Canary v2 | SDK failure | Actual catch/finally writes `ok:false`, string error, finishedAt, null SDK, empty selected arrays, false selected flags and no selected lock digest. Partial scope state is never assigned. |
| Canary v2 | selected failure | Completed SDK is retained; selected fields remain initial/empty/false and its lock digest is absent. Earlier errors before report creation produce no report. Dry-run plans have no canary schema ID. |
| CoreEvidence v1 | completed collection | `collect` writes index.json only after source authentication, both lane ZIPs/four raw members each and mandatory Node24 security ZIP/report have been added. Initial `lanes:[]` and absent security are internal construction state, never an index contract. |
| CoreEvidence v1 | sealed replay / resume | Stored envelope retains original sealedAt and original report bytes; fresh resume evidence is verified separately. No new payload variant or refreshed timestamp. |

## Field and relational bindings

JSON Schema checks structure, constants, phase membership and local cardinality.
The following existing guards remain mandatory and cannot be replaced by a
schema, a synthetic fixture, a successful schema test or a self-asserted flag.

| Fields or raw members | Producer | Existing validator / relation |
| --- | --- | --- |
| artifact sourceSha, toolchain | adapter/build | artifact.verifyArtifact: exact committed .nvmrc/packageManager, build source/toolchain equality. Current producer pins Node24.18.0/npm11.17.0; consumer runtime independently allows both committed lanes. |
| packages, files, dependencies, optionalDependencies, peerDependencies, peerDependenciesMeta | inspectCandidates / inspectTarball | Exact source metadata, original candidate membership, no duplicate names/archive paths, size/SRI/SHA256 and all file bytes. `candidateBinding.allPackages` exactly matches original manifest, not merely length ten. |
| selection, edges, bootstrapPackages, registryDependencies | adapter/selection/bootstrap | Normalized selected order and exact inventory edges/closure; bootstrap is unique selected subset. Registry identities are closed five-field objects; extra `security` is rejected. |
| raw manifest/build/canary/coreEvidence bindings | pipeline/adapter | SHA512 of original file bytes; external reviewed manifest SRI. `artifactFile` verifies safe regular-file paths. |
| tarballSetIntegrity | artifact.releaseSetIntegrity | Canonical selected-set digest includes profile/source/toolchain/edges/selection/registry/candidateBinding and selected package name/version/group/file/size/integrity. |
| buildEvidenceIntegrity | consumer/buildCanaryIntegrity | SHA512 of compact JSON.stringify(parsedBuild), not raw build.json SRI and not key-sorted JSON. Exact ordered build/MCP commands remain checked. |
| candidateSDK, selected packages and registry dependencies | two runInstalledScope calls | core-evidence.verifyConsumer plus candidate-integrity.verifyInstalledClosure/verifyResolution: ten exact SDK archives with no registry packages; separate selected archives plus exact pinned registry closure. Every package's install/exports/types/bin/files/resolution and runtime imports pass. SDK requires both MCP flags; selected requires them when MCP is selected. |
| lockIntegrity and candidateSDK.lockIntegrity | completed installed scopes | SHA512 of compact JSON.stringify(parsed npm lock). Raw `consumer-lock.json` / `candidate-sdk-lock.json` bytes have separate lane SRIs and ZIP-member equality. npm lock root dependencies, versions, resolutions, integrity, all dependency metadata, transitive namespace/link exclusions and exact closure remain validated by the generic candidate validator. This is not a new npm lock format. |
| startedAt, finishedAt, preparedAt, sealedAt | prepare/consumer/collect/seal | canonical artifact times, ordered preparation/consumer/seal window, max one-hour consumer/source freshness at original seal time, future tolerance 1s; runtime Date.parse semantics are retained. |
| source.expected / provenance / candidateAuthority / inventorySha256 / policySha256 | committed source provider | exact Core source/run/attempt/producer archive+manifest, every Git blob/SHA256/logical path, zero historical productive files, full scanner and exact reviewed authority checks. Controlled test doubles never satisfy the production provider brand or authority gate. |
| needs and requiredGates | trusted workflow context | mandatory individual successful gates; prepare manifest SRI/candidate SHA; source SHA/artifact ID/archive+manifest SHA; exact security artifact output ID. Extra needs entries are allowed; requiredGates is closed. |
| run / workflowMetadata / jobsEndpoint / jobs | authenticated Actions API | exact repository/main/workflow_dispatch/SHA/run/attempt/workflow identity, authenticated attempts endpoint, exactly one required successful source/security/job per lane. Optional job run_attempt is checked when present. Unrelated jobs retain raw API fields/statuses. |
| source/lane/security metadata and archives | core-auth.collect | immutable artifact ID/name/non-expiry/SHA256 digest/run/SHA, bounded authenticated HTTPS download with no token forwarded to storage, exact allowed ZIP members. All downloaded bytes are replayed, never trusted by status alone. |
| lanes[24.18.0,26.5.0].consumer/lock/candidateSDKLock/sourceReport | collect | exactly two distinct lanes; exact raw member paths, SRI and equality to authenticated ZIP members; full schemaSuite with no failures/skips, exact inventory/policy/provenance/authority and freshness. |
| security.node/job/metadata/archive/report | collect after both lanes | single Node24 core-security-browser job; `core-evidence/security.zip` and `core-evidence/security/security-execution.json`; output ID, ZIP digest, report SRI and byte equality are independently checked. Security cannot replace either package lane. |
| bound security-execution.json | existing test execution report producer | core-security.verifyCoreSecurityReport: existing execution schema, exact source/run/catalog/source-file hashes, Linux x64 Node24; one completed successful sanitizer suite, no skips/infra errors, valid process cleanup; pinned Chrome archive/executable/version, browser argv/identity and Linux namespace/seccomp/sandbox/renderer proof and freshness. The envelope binds this existing report; it does not redefine or flatten its separate schema. |

## Open boundaries and confirmed admission differences

Additional JSON properties are intentionally open wherever production currently
ignores them, including raw GitHub metadata and `security` extensions. Such fields
have **no authenticated meaning**. Core root `demoSha`, `demoRepository`,
`productEvidence`, `unionEvidence`, candidateBinding.demoSha and closed registry
identities remain rejected. Tests exercise missing, wrong and additional security
fields in both directions; they do not claim all extra fields are rejected.

The producer declaration and existing admission language are not identical:

1. Prepared artifact validation accepts a smaller canary than Seal's
   `verifyConsumer`. SDK, runtime lane, lock and freshness become mandatory there.
   A historical partial fixture is accepted only at the weaker boundary, fails
   the full producer schema and fails Seal consumer validation.
2. `verifyConsumer` does not inspect `error`; it accepts a structurally complete
   successful proof with missing or non-null error. Producer success always writes
   null. Artifact validation with `requireCanary=false` does not inspect a present
   canary binding. Canonical producer timestamps are narrower than Date.parse.
3. Relational changes that remain structurally valid (another positive run ID,
   attempt, valid digest or SHA) require actual runtime comparison. A schema pass
   does not authenticate values.

The user approved **separate producer and per-boundary admission contracts** on
2026-10-17 while preserving existing runtime behavior. The declarative
`contracts/release/admission-phases.json` accounts for every producer root field
at all seven production admission boundaries and names the existing relational
validators. It records ignored fields and conditional obligations explicitly; it
is not a replacement runtime validator. Tests cover missing/non-null error,
noncanonical but fresh Date.parse inputs, and malformed uninspected canary
bindings. No validator tightening is included. Final exact Source/Authority
binding and FirstRelease retirement remain separately unapproved. Partial
reports cannot borrow complete producer or sealed authority.

## Maraca: existing phases and the remaining semantic conflict

`createMaracaTuneConfig` is a permissive exported factory. It copies source,
sourceFingerprint, output, selected, locked, options, toolchain and
candidateMatrixFingerprint without validating them. It normalizes absent/null and
legacy false/0/empty serviceGraphFingerprint to null, rejects other non-SHA256
values, adds the existing schema and configFingerprint over stableJson(base).
Missing copied values exist as undefined in JS and disappear when serialized.
Calling it with `{}` produces only schema, serviceGraphFingerprint and
configFingerprint in JSON. The public declaration nevertheless promises a complete
`MaracaBuildConfig`. Tightening that factory or changing its return signature would
change existing runtime/API semantics; this part remains explicitly undecided.

The strict tune path supplies those fields after deterministic candidate selection:
selected is {profile: production|max, lazy: route|component|none, css: inline|external};
toolchain is {rollup: string|null, terser: string|null, mode: rollup-terser}.
Locked captures the existing 21 MARACA_TUNE_SEMANTIC_KEYS; options contains source,
out, selected profile/lazy/css, sizeBudget:strict, and the same semantic options:
services, orchestration, kernel, kernelBootMode, hydration, validation, transitions,
componentMode, stackMode, enablePrewarmWorker, enableUiCoprocessor, enablePwa,
enableServiceWorker, enableWebAppManifest, allowDynamicComponents, cssProvider,
cssInput, cssSources, cssPreflight, cssBudget and cssProviderFallback. Existing
services/provider configuration, diagnostics extension fields and JS factory input
remain explicit opaque boundaries, not newly inferred closed JSON payloads.

`tuneMaracaBuild` has these existing report phases:

- Early blocked: schema, ok:false, status:blocked, configPath, empty candidates,
  diagnostics. No source/selection/config/final-build fields.
- Full planned/checked/written: schema, ok, status, source, sourceFingerprint,
  configPath, reportPath, output, candidateMatrixFingerprint, candidateCount,
  acceptedCandidateCount, candidates, selected, config, configMatches, finalBuild,
  diagnostics. Full blocked reports retain the same fields with selected/config
  null if no candidate, or selected/config present on check drift or failed final
  reproduction. finalBuild is null or {status,bytes,entry,toolchain}.
- Only successful written mode writes the final report file. A returned blocked
  report is not evidence that a report file was produced.

Each of twelve candidates contains id/profile/lazy/css, accepted/status/reason,
**declaredPolicyPreserved and declaredDeferredPolicyCount** (present in runtime,
absent from the public MaracaTuneCandidate interface), metrics, toolchain,
warningCount/diagnosticCount/errorCount. Metrics comprise frameworkBytes,
appServiceBytes, serverAppServiceBytes, eagerBytes, totalBytes, cssBytes,
eagerRequests and chunkCount. Selection copies id/profile/lazy/css/metrics.
Reasons are the existing ordered toolchain, closure, size, lazy-policy, diagnostics
or accepted classifications. No new statuses or successful variants are invented.

Stored configs keep original bytes. Loading checks the schema, optional normalized
service graph fingerprint, config hash when nonempty, source hash and service graph
source drift under existing conditions. It is not a complete required-field
validator for the factory's declared TypeScript return type.

Concrete alternatives for a later decision: preserve the permissive factory and
explicitly separate its partial JS/serialized result from a complete tune-produced
config; or require complete factory input and update compatibility/API contracts.
The user keeps this older public factory type correction separate. There is no
new full-factory Maraca authority; the complete tune-produced phase and permissive
factory must remain distinct. Full phase and
field documentation and existing absent/null/hash/falsy compatibility tests can
proceed independently.

## Verification boundary

`declarative-contract-checker.cjs` is a test-only, fail-closed draft-07 subset. It
rejects unsupported keywords/unresolved refs and is not a production schema engine.
Tests bind real adapter and consumer outputs (including two real offline miniature
installations); miniature MCP knowledge files are expressly fixtures. CoreEvidence
protocol tests exercise real collector/ZIP/digest/authentication/lock/lane code
with explicitly scoped source-authority and native Linux security doubles; the
same controlled source is rejected by unmodified production authentication.
No hosted security or release acceptance is claimed.
