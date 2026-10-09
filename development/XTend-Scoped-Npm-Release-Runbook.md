# Scoped npm releases: independent review checkpoint

Status: scripts, tests and contract only; workflow integration and activation are
deferred until an explicitly reviewed safe demo-migration checkpoint. Basis:
`31d8c01f92538b55e57e741ed4e71a4e4a6604b5`. No package versions change here.
The unreviewed migration commit `58269f399d7e2f7a4f5c524ab7723a99f11aa37f`
is neither a source base nor reviewed release evidence.

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

Exclude the private products `@xtend-products/store`,
`@ccslabs/rmt-animation-testbench-product`, `@ccslabs/xtend-material-workbench`,
`@ccslabs/xtend-llm-product`, other private products and the separate VSIX.
The existing publisher omits Fabric, CLI, Shard and both Material packages.

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
provenance must bind the same source and subject.

Reject an unpublished stable version below either `latest` or any higher stable
registry version. Recheck immediately before each upload and retry. A timeout
is followed by an exact registry lookup: an identical upload is accepted, a
conflict stops, a registry error stops, and only definitive absence permits a
bounded retry of the **same archive bytes**. A successful command followed by
404 stops for uncertain visibility rather than uploading again blindly.

Postpublish checks exact name/version/integrity, the explicit tag and the registry
provenance statement's tarball subject and source commit. Sigstore signature and
certificate verification must still be connected to the existing gated release
evidence before activation; a parsed statement alone is not cryptographic proof.
The CLI keeps actual execution closed until this integration is reviewed.

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

A filesystem lock excludes concurrent local trains using the same ledger
directory. Later GitHub integration must serialize **all release refs** in one
repository-wide concurrency group with `cancel-in-progress: false`, while
preserving current CI cancellation behavior for nonrelease runs. Registry tag
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

## Contract with the migration packer (not integrated)

Do not implement another packer. The migration's current, **unreviewed** candidate
shape is `xtend.product-candidates.v1`, `coreSha`/`demoSha`, packages with
`name`, `version`, `file`, `integrity`, `sha256` and dependency metadata. No part
of that shape is accepted as reviewed evidence yet. After the safe checkpoint,
review its actual schema, packaging implementation and consumer evidence; add a
small adapter if necessary. Preserve the original candidate manifest and both
source identities. Determine explicitly which reviewed commit is the canonical
package source; do not silently map `demoSha` to `coreSha` or accept an arbitrary
unreviewed migration commit.

The release consumer requires a versioned envelope `xtend.release.artifact.v1`:

```text
sourceSha: full canonical reviewed commit SHA
toolchain: { node: exact committed .nvmrc, npm: exact packageManager version }
edges: [{ from, to, range, kind, hard }] matching actual package manifests
packages: all ten [{ name, version, group, file, size, integrity,
                    files: [{ path, size, integrity }] }]
buildEvidence: { file, integrity }
canary: { file, integrity }
```

`integrity` is SHA-512 SRI of the actual bytes. `size` is the compressed archive
size for packages and the regular file size for file inventory entries. Archive
inspection reads `.tgz` directly without extracting it and checks every file,
export target, wildcard, bin and declaration target, source package metadata,
duplicate/unsafe paths, links and archive limits. Retain and verify the candidate
`sha256` in the later adapter as well; a manifest's integrity declaration alone
is not evidence that its actual tarball was read.

The build report `xtend.release.build.v1` binds source/toolchain and successful
explicit `build:xtend-mcp-knowledge` generation plus
`node products/xtend-mcp/scripts/build-knowledge.mjs --check --quiet` **before
packing**. The consumer never relies on publish lifecycle hooks for this work.
The packer owns building once and packing once.

Consumer evidence `xtend.release.canary.v1` binds source/toolchain and
`tarballSetIntegrity` (canonical sorted-key SHA-512 of source, toolchain, edges
and package name/version/group/file/size/integrity list). It records each package's
integrity and successful clean installation, exports, types, bins, file hashes,
runtime imports and MCP checks. `consumer.cjs` installs all ten explicit local
tarball dependencies in a fresh temporary project, verifies installed file
hashes and bins, resolves exports, compiles a TypeScript consumer, and imports
the packages in a DOM host. The DOM host/compiler are test tooling; package
imports resolve only in the installed consumer. Actual product tarball canaries
remain to be run against the reviewed packer outputs, including browser-specific
semantics and MCP knowledge parity. Fixture tests do not substitute for those.

Generate the canary from a preliminary externally hashed manifest with bound
build evidence; `requireCanary: false` is available only to this consumer stage.
The reviewed packer/adapter then binds the canary hash and freezes the final
manifest/artifact. No final manifest mutation is permitted during publication.
The final manifest's expected SHA-512 must come from independently reviewed
immutable CI artifact metadata, not be recalculated from an arbitrary local file
and accepted automatically. Hashes provide integrity, not review authorization.

## Commands and future workflow activation

Defaults are read-only/dry-run with only local evidence writes:

```bash
npm run release:inventory
npm run test:release-safety
npm run test:release-safety:unit
npm run release:artifact:verify -- --artifact PATH --manifest-integrity SRI --source-sha SHA
npm run release:preflight -- --artifact PATH --manifest-integrity SRI --source-sha SHA
npm run release:publish -- --artifact PATH --manifest-integrity SRI --source-sha SHA
npm run release:canary -- --artifact PATH --manifest-integrity PRELIMINARY_SRI --source-sha SHA
```

`release:canary -- --execute --output NEW_FILE ...` explicitly installs/executes
consumers; it never publishes. Use the pinned toolchain via npm or `--npm-cli`.
`release:publish -- --execute` requires the exact workflow identity and explicit
`publish_to_npm=true` input, but activation is deliberately closed at this
checkpoint. Environment booleans are not sufficient proof of completed gates.
The reviewed activation must verify the real gate evidence and immutable artifact
identity, retain manual input default **false**, add local release-safety tests to
the proper gate profiles, and upload ledgers/evidence with **always()**.

Preserve every existing publish gate: full-release, RMT vNext / Native-First
RMT-Owned, package structure, conditional network Audit/SBOM without deferral,
native toolchain, MCP/VSIX smoke, Laravel, dependency lock alignment, publish
aggregate and existing MCP/export/pack evidence. Run all applicable existing
Node 24/26 lanes. Replace duplicate build/pack publication steps only after the
shared packer and evidence are reviewed. Remove the separate publish-cache
restore at that later integration checkpoint, not in this change.

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

## Explicitly outstanding at this checkpoint

Reviewed migration schema/adapter and SHA mapping; actual ten-package product
tarball consumers; full artifact-bound existing gate evidence; cryptographic
Sigstore verification; always-on CI ledger upload; global noncancelling release
concurrency; deferred publish-cache cleanup; final workflow activation and first
scope/name ownership/bootstrap review. Push/Draft-PR require independent review
of this local checkpoint first. npm publication, Git tag push, trust changes,
credential/proxy/security changes, merge and deployment are outside this task.
