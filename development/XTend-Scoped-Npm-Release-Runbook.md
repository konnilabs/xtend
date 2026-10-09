# Scoped npm releases: independent review checkpoint

Status: local integration review; no merge or publication approval. The reviewed
C7 base is `cce3faf8c283af7f0732231aafc74ee9f18560d7`, followed by explicitly
reviewed Core fixes `b9fac305bba5fa57e8f9b37a1fe65bc94c8ff269` and
`74730ec0898b52c7d82769e1eb785e52f02cb4ab`. The committed Demo dependency is
`646d4a4e89e51af82bea145c2a0030bb5fefcd25`. The three approved release commits
are replayed with `cherry-pick -x`; their original hashes remain unchanged.
No package versions change. Schema governance remains pending; known baseline
failures remain blocking. Historical C6/D3 red evidence is not acceptance of any
new source. New reports bind the actual integration HEAD and committed Demo SHA.

## Inventory and version policy

`scripts/release/inventory.json` is the release inventory. `release:inventory`
compares it with root/workspace discovery, every actual `package.json`, root
`scopedPackages`, repository/provenance metadata and the legacy Core sync train.
Any missing, new, duplicated, private or misplaced public package stops the
plan. Workspace globs require an explicit discovery extension and review.

| Package | Directory | Group | Unchanged version |
| --- | --- | --- | --- |
| @ccslabs/xtend | . | core | 0.9.0 |
| @ccslabs/xtend-rmt | xtendrmt | core | 0.9.0 |
| @ccslabs/xtend-fabric | fabric | core | 0.9.0 |
| @ccslabs/xtend-cli | xtend-builder | core | 0.9.0 |
| @ccslabs/xtend-compiler | tools | core | 0.9.0 |
| @ccslabs/xtend-maraca | xtend-maraca | core | 0.9.0 |
| @ccslabs/xtend-xsurface-shard | xsurface-shard | core | 0.9.0 |
| @ccslabs/xtend-mcp | products/xtend-mcp | mcp | 0.1.0 |
| @xtend-material/core | xtend-material | material | 0.1.0 |
| @xtend-material/maraca-tailwind | xtend-maraca-css-tailwind | material | 0.1.0 |

The seven Core versions remain shared. MCP stays independent and Material keeps
its own two-package group. `SCOPED_RELEASE_PACKAGES` remains the legacy seven
package version-sync policy; `PUBLIC_RELEASE_PACKAGES` exposes all ten from the
central inventory. This does not decide ten-package lockstep.

Release **selection** is separate from inventory and version policy. Use
`release:inventory -- --groups=mcp`, `--groups=material`, `--groups=core,mcp`
or an explicit comma-separated `--packages` list to inspect the scope. Selection
never silently upgrades dependencies or changes versions. Its hard transitive
closure includes runtime dependencies and required peers; optional peer cycles
remain soft. The immutable manifest declares the selected package names. Without
a selection it represents the full ten-package release. A supplied CLI selection
must match the artifact exactly; it cannot narrow an existing ten-package artifact.

MCP-only requires one new MCP archive and verified existing RMT, Compiler and
Maraca versions. Material-only requires the two Material archives and verified
existing Maraca. Those dependencies are **not rebuilt or republished**. The
manifest pins their exact name, version, group, SHA-512 and original provenance
`sourceSha`; the current release SHA describes only newly built archives. Check
their repository identity, dependency metadata, exact registry version/integrity,
consistent packument and original provenance before any selected upload and again
before each operation and immediately before every actual upload attempt, including
each retry. Dependency identity/version/integrity drift or a transient/invalid
registry read stops before another upload; prior preflight evidence is insufficient.
Missing dependencies stop: select them in a new, reviewed
release artifact if they need publication, rather than extending scope during
resume. Their dist-tags are never changed by this release.

Exclude the private products `@xtend-products/store`,
`@ccslabs/rmt-animation-testbench-product`, `@ccslabs/xtend-material-workbench`,
`@ccslabs/xtend-llm-product`, other private products and the separate VSIX.
The replaced five-package publisher omitted Fabric, CLI, Shard and both Material packages.

The stable topological order currently is RMT, Fabric, Root, Compiler, Maraca,
CLI, Shard, Material core, Material Tailwind, MCP. Hard internal edges come from
runtime dependencies and required peers. MCP requires exactly RMT, Compiler
and Maraca; Material Tailwind requires exactly Material core and has a required
Maraca peer. Optional peers, including the Compiler/Maraca cycle, are recorded
but do not create hard cycles. Optional dependencies are also recorded as soft
edges. All internal ranges, including soft edges, must satisfy artifact versions
using standard SemVer. Dev dependencies do not define publish order.

## Default path and immutable recovery

The standard release path works with Node **24.18.0 / npm 11.17.0**. Publish
the already validated tarballs sequentially, with explicit `--access=public`,
`--provenance`, `--ignore-scripts` and **`--tag=latest` for stable versions,
`--tag=next` for prereleases**. Explicit CLI tags take precedence over packed
`publishConfig.tag`. No workspace/folder publication or automatic rebuild occurs.
The upload adapter seals a byte-for-byte copy of the verified archive in a fresh
directory. It never packs source files. Different release groups need not have
the same version; each package's version determines its stable/prerelease tag.

Before the first upload, check every exact version and the package's registry
metadata. The adapter queries exact public registry HTTP endpoints through the
inherited proxy; only an actual HTTP 404 with the expected registry absence
response means absent. npm's locally synthesized version-selection `E404` is
not accepted as an HTTP status. Authentication, DNS, timeout, transport, 429, 5xx, malformed output and
ambiguous errors stop the train. Absent package names require a reviewed
ownership/bootstrap plan. Existing identical name/version/SHA-512 is reverified
and skipped; conflicting integrity stops the entire preflight. Existing
provenance must bind the archive's source and subject. Needed registry dependencies
instead bind their pinned original source. The production adapter cryptographically verifies both with npm 11.17’s bundled
Sigstore verifier and TUF-authenticated roots, including transparency and
certificate identity for the exact trusted workflow on main.

After the complete preflight, every pending selected tarball must pass an npm
publish dry-run using its sealed bytes and explicit public/provenance/tag flags,
with lifecycle scripts disabled. All these dry-runs precede the first upload;
a failure preserves the ledger and stops every upload. Registry-verified existing
versions are skipped. The default read-only CLI preflight invokes no npm publish,
including no publish dry-run. Dry-run success does not prove OIDC publication.

Reject an unpublished stable version below either `latest` or any higher stable
registry version. Recheck immediately before each upload and retry. A timeout
is followed by an exact registry lookup: an identical upload is accepted, a
conflict stops, a registry error stops, and only definitive absence permits a
bounded retry of the **same archive bytes**. A successful command followed by
404 stops for uncertain visibility rather than uploading again blindly.

Postpublish checks exact name/version/integrity, the explicit tag and the registry
provenance statement's tarball subject and source commit. The production registry adapter verifies the DSSE signature, certificate chain,
issuer, trusted main-workflow identity and transparency evidence before exposing
any provenance statement. No malformed/unverified fallback is accepted. Test-only
registry mocks do not constitute real npm/OIDC publication evidence.

The local always-on JSON ledger records `published`, `verified-existing`,
`failed`, `pending`, channel-tag state, source SHA and the reviewed manifest hash.
It is saved after each transition and error. Never treat it as proof of registry
state: recovery queries npm again. Preserve/download the exact immutable artifact
and original manifest digest. A changed artifact is refused even if versions are
unchanged. Never rebuild an already attempted version; never unpublish as an
automatic rollback. Retain old ledgers as run evidence before starting a new
artifact in a separate ledger file.

npm is **not atomic**: a failure on package three can leave packages one and two
public and tagged while others remain pending. Recovery skips verified identical
versions. If an already existing version has a missing/older tag, report
`tag-repair-required`; republishing that version cannot repair it. An independent
authorized maintainer repair is needed. If `latest` is newer than an existing
identical version, preserve the newer tag; recovery must never move it backwards.
Missing/malformed packuments, inconsistent exact-version presence and malformed
tags always stop further uploads. Only a missing/older channel tag on an otherwise
valid, consistent packument can produce repair status.

A filesystem lock excludes concurrent local trains using the same ledger
directory. The workflow serializes every publish dispatch in one repository-wide group
`xtend-npm-publish-global`; publish runs are never cancelled by newer releases.
PR cancellation behavior is preserved for other CI groups. Registry tag
updates have no compare-and-swap transaction: the direct path's monotonicity
also requires all publishers to participate in this serialization. An unrelated
external/manual publisher racing between the last lookup and upload can defeat
a read-before-write guard; do not claim the scripts alone eliminate that race.

Optional SHA upload tags plus promotion exist only in the library's explicitly
selected staged mode. They are not the default or required for normal releases.
OIDC `dist-tag` requires npm **>=11.21 on v11**, or **>=12.2 on v12**, plus
separately allowed dist-tag permission. The npm-11.17 standard path runs no
`dist-tag` commands. Promotion checks capability before any staged upload.
An npm upgrade, trust permission or staged-mode activation requires its own
review; none is changed here.

## Reviewed migration packer and adapter

`pipeline.cjs` calls the original C7 `packCandidates()` function unchanged.
Its canonical source SHA-256 is
`c9b1a8a0a78112de934a67bfcc62d45f7de80be3ad016f605593e3d1ccdbfa45`.
There is one production npm packer: it packs a `git archive` snapshot and derives
PHP/Laravel packaging from the same SHA. The wrapper's isolated build regenerates
components, RMT ESM entrypoints, sanitizer and MCP knowledge once, checks knowledge,
and rejects any change to committed generated bytes. Commit reviewed regeneration
first; dirty or stale generated artifacts never become publish candidates.

The original `xtend.product-candidates.v1` manifest stays intact with `coreSha`,
`demoSha`, all ten archive names/versions/SHA-512/SHA-256 and dependency metadata.
The release adapter inspects the actual archives, adds compressed sizes and full
file inventories, and binds that original manifest and all ten byte identities.
The migration consumer tests use this entire candidate bundle; publication uses
only the selected Core/MCP/Material group. Unselected required registry dependencies
are pinned to their real previously published identity/integrity/provenance SHA.
Fresh unselected archives are candidate evidence, never replacements for those
registry identities and never uploaded by a partial release.

Both Node lanes consume the same prepared archive bytes. The original reviewed
Demo installer uses `selectCandidateClosure()` per app, then validates dependency
metadata and package locks after install, clean ci, and offline ci. The existing
17 required product commands, reports, PHP/browser/FPM/Electron checks and eight
installation locks remain mandatory. Missing or red product evidence blocks seal.
The wrapper adds the actually verified Node/npm lane identity without changing
original package hashes or claiming synthetic success.

The release consumer requires a versioned envelope `xtend.release.artifact.v1`:

```text
sourceSha: full canonical reviewed commit SHA
toolchain: { node: exact committed .nvmrc, npm: exact packageManager version }
edges: [{ from, to, range, kind, hard }] matching actual package manifests
selection: { packages: [explicit selected names in dependency order] }
packages: selected [{ name, version, group, file, size, integrity,
                      files: [{ path, size, integrity }] }]
registryDependencies: unselected hard closure [{ name, version, group,
                      integrity, sourceSha: original dependency build SHA }]
buildEvidence: { file, integrity }
canary: { file, integrity }
candidateBinding: { file, integrity, demoSha, allPackages: ten original byte identities }
productEvidence: [{ node: pinned consumer lane, file, integrity }]
preparedAt / sealedAt: actual producer timestamps
```

`integrity` is SHA-512 SRI of the actual bytes. `size` is the compressed archive
size for packages and the regular file size for file inventory entries. Archive
inspection reads `.tgz` directly without extracting it and checks every file,
export target, wildcard, bin and declaration target, source package metadata,
duplicate/unsafe paths, links and archive limits. The adapter retains and verifies candidate
`sha256` as well; a manifest's integrity declaration alone
is not evidence that its actual tarball was read.

The build report `xtend.release.build.v1` binds source/toolchain and successful
explicit `build:xtend-mcp-knowledge` generation plus
`node products/xtend-mcp/scripts/build-knowledge.mjs --check --quiet` **before
packing**. The consumer never relies on publish lifecycle hooks for this work.
MCP generation/check is required when MCP is selected. A Material-only release
does not invent MCP build evidence for an unrelated package.
The wrapper owns the isolated build once; the canonical packer owns packing once.

Consumer evidence `xtend.release.canary.v1` binds source/toolchain and
`tarballSetIntegrity` (canonical sorted-key SHA-512 of source, toolchain, edges,
selection, registry closure and package name/version/group/file/size/integrity
list). It records each package's
integrity and successful clean installation, exports, types, bins, file hashes,
runtime imports and applicable MCP checks. `consumer.cjs` installs selected local
tarballs and exact registry closure in a fresh temporary project, verifies installed file
hashes and bins, resolves exports, compiles a TypeScript consumer, and imports
the packages in a DOM host. The DOM host/compiler are test tooling; package
imports resolve only in the installed consumer. Registry dependencies are
preflight-verified against their pinned original provenance and metadata. Their
installed lockfile version, SHA-512 and public-registry URL must match; npm checks
downloaded bytes against the SRI. Evidence retains their original source identities
and records successful installation. Runtime/type checks cover selected packages
and their hard closure. The selected release consumer does not publish unrelated inventory packages.
All ten original candidates remain present and verified for the migration’s full
product canaries. Fixture tests do not substitute for actual consumer runs.

Generate the canary from a preliminary externally hashed manifest with bound
build evidence; `requireCanary: false` is available only to this consumer stage.
The reviewed packer/adapter then binds the canary hash and freezes the final
manifest/artifact. No final manifest mutation is permitted during publication.
The final manifest's expected SHA-512 must come from independently reviewed
immutable CI artifact metadata, not be recalculated from an arbitrary local file
and accepted automatically. Hashes provide integrity, not review authorization.

## Workflow, defaults and immutable resume

Inventory, artifact verification, preflight, publish and pipeline commands default
to read-only/dry-run. `pipeline.cjs prepare|consumers|seal|download --execute`
explicitly generates or verifies artifacts; none publishes npm packages.
`cli.cjs publish --execute` requires all of: dispatch input `publish_to_npm=true`,
repository `konnilabs/xtend`, main ref, unchanged trusted entry point
`.github/workflows/xtend-default-gates.yml`, `npm-publish` environment, actual
OIDC availability, successful current prerequisite results, matching source HEAD,
verified immutable artifact and complete original producer gate receipt.

The workflow performs prepare → both pinned product consumer lanes → seal →
publish. The existing seven prerequisite jobs, product candidate job, publish
aggregate, MCP report, export/pack dry-run evidence and nondeferred Audit/SBOM are
retained. Their failures keep publish closed. `release-safety` is added to the
aggregate profiles. The separate publish cache restore is removed. The publish
job neither builds nor packs, even for resume; it downloads the exact sealed
artifact ID and checks the GitHub archive SHA-256 before safe extraction, then
rechecks manifest SHA-512, all ten original archive hashes and selected file hashes.

Each of the four release jobs discovers the installed `npm` executable immediately
after the npm 11.17 global pin, resolves its real absolute `npm-cli.js`, checks
package identity/version and executes that exact CLI with the current Node.
The dependency-free discovery step writes `XTEND_NPM_CLI` to `GITHUB_ENV` before
dependency installation. Plain Node release steps consume this explicit path;
they do not depend on `npm_execpath`, which exists only in npm lifecycle shells.
Local commands may supply an explicit installed CLI or resolve an actual CLI
symlink on PATH; arbitrary shell shims and mismatched pins fail closed.

Dispatch fields `release_groups` and `release_packages` select the scope, empty
means all ten. For MCP-only use `release_groups=mcp`; Material-only uses
`release_groups=material`. The selection is frozen into the artifact. On resume
supply the original `resume_artifact_id`; never narrow or regenerate its scope.
An explicit selection must match it.
Empty input arguments are omitted by the workflow. CLI parsing treats empty
counterpart inputs as empty arrays; nonempty invalid or duplicated entries still
fail. Groups-only, packages-only, combined and full selections apply equally to
initial preparation and artifact resume.
Download validates producer repository,
main branch, dispatch event, workflow ID/path, source SHA and expiration. Restore
requires the same source SHA as the workflow run. After main advances, rerun the
original failed run at its original SHA; a new dispatch at another SHA is refused.
Artifact retention/expiration limits recovery, so archive original sealed bytes
and metadata before expiration; do not rebuild an attempted version.
Preparation rejects a complete workflow rerun without an original sealed artifact
ID. Rerun only the failed publish job (which retains its seal dependency output),
or dispatch an explicit same-source artifact resume. Never rerun all jobs to
recreate attempted package versions.

Resume reruns current prerequisite/product checks against the original bytes;
fresh acceptance is recorded separately. It preserves the original release
manifest, producer timestamps and artifact ID. It does not manufacture fresh old
reports. The original reports are checked as of their real sealing time, with
current gates required separately. The result ledger always re-queries registry
state and skips only cryptographically verified identical versions. Download or
setup failure also leaves a workflow attempt ledger; both ledgers upload with
`always()`.

```bash
npm run release:inventory -- --groups=mcp
npm run test:release-safety:unit
node scripts/release/pipeline.cjs prepare --artifact NEW_DIRECTORY
npm run release:preflight -- --artifact SEALED_DIRECTORY --manifest-integrity SRI --source-sha SHA
npm run release:publish -- --artifact SEALED_DIRECTORY --manifest-integrity SRI --source-sha SHA
```

First publication of an absent name requires an independently approved bootstrap
plan committed in `scripts/release/bootstrap-plan.json`: exact package name,
`ownershipVerified: true`, `directPublishAllowed: true`, and `approvedPlan` pointing
to concrete maintainer-approved evidence. The default list is empty and grants
nothing. Review both npm scopes and permissions before filling it. The artifact
freezes only the selected approved bootstrap names. This configuration does not
create trust or credentials.

## One-time npm trust per package and first releases

Official documentation checked **2026-10-09**:
[Trusted publishers](https://docs.npmjs.com/trusted-publishers/),
[npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/),
[scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/),
[provenance](https://docs.npmjs.com/generating-provenance-statements/).

For **each of the ten packages in the inventory**, an authorized package
maintainer configures GitHub Actions trusted publishing once with these exact,
case-sensitive values:

| npm setting | Exact value |
| --- | --- |
| Organization or user (GitHub) | `konnilabs` |
| Repository | `xtend` |
| Workflow filename (filename only) | `xtend-default-gates.yml` |
| Environment | `npm-publish` |
| Allowed direct publishing | `npm publish` explicitly allowed |

The GitHub organization value is not the npm scope. Confirm ownership and
maintainer rights separately for **both `@ccslabs` and `@xtend-material`** and
every package name. Trusted publishing requires Node >=22.14 and npm >=11.5.1
on supported hosted runners; the current pins meet these requirements. The
existing workflow filename, `npm-publish` environment and OIDC permissions
remain unchanged. Introduce no token secret or alternative authentication.

A new trust must complete its first successful publish within **two days** or it
expires. Direct publishing and dist-tag rights are independent. New trusts can
default to staged publication; explicitly check direct `npm publish` permission.
Do not set up trust long before the authorized first release is ready. A
`whoami` result does not test OIDC trust, and `--dry-run` does not prove an OIDC
publication. Package repository metadata must match the public GitHub repository.

Before the initial 1.0 release, query package existence and ownership under both
scopes and record a bootstrap decision for every missing name. The documented
trust UI operates on package settings: do not assume a nonexistent name is
already configured for OIDC. An authorized owner must select and review the
supported first-publication/bootstrap route, ensure scope/name rights, public
access, 2FA/required permissions, establish the package if needed, and configure
trust. This task performs none of those account or publication operations and
does not introduce credentials. Check current official npm guidance again at
that first-release decision.

Prepare 1.0 versions and internal dependency ranges in a **separate authorized
version change**, preserving the decided Core/MCP/Material group policy. Build
once, pack once, run actual consumers and all release gates, approve the immutable
artifact, then use the direct path. Later 1.1, 1.2 and other 1.x minors follow the
same inventory and workflow identity without repeat trust configuration or
version-specific script edits. Preleases use `next`; a later stable version is
published directly with `latest`. There is no implicit tag promotion in this
normal release sequence.

## Review and operational limits

Schema governance remains pending, aggregate and product baseline failures must
be fixed through their own reviewed work, and real hosted OIDC publication is not
proven by local tests. Every current gate must pass before any future publication.
Record executed, failed, unavailable and running checks with their exact source
SHAs; never claim a fixture or older report proves a new integration commit.

Push/Draft-PR require independent review of the immutable local checkpoint first.
This task performs no npm publication, release tag push, trust creation, credential,
proxy or security configuration change, merge or deployment. First scope/name
ownership/bootstrap approval remains an operational prerequisite.
