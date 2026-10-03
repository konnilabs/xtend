# ADR: XTend 0.9 renderer, SSR diagnostics and initial resume transport

Status: accepted. Target package release: 0.9.0. Decisions approved on 2026-10-03.

## Problem

Nightly 145 fails in both supported Node lanes because shipped KernelLab and MCP
artifacts differ from their canonical sources and the schema inventory is stale.
The affected code also changes attribute interpretation and removes required HTML
fields under existing response types. Regeneration alone would preserve those
ambiguous contracts. Package minors and schema majors are separate version axes.

## Contract graph and decisions

| Producer / consumer | Canonical contract | Compatibility and reason |
| --- | --- | --- |
| DOM renderer factory and explicit attribute resolver | `xtend.epic18.rmt-dom-descriptor-renderer.v2` | v1 is selected explicitly and retains scalar implicit model bindings. v2 strings remain literal; explicit paths, interpolation and expression records bind values. Validation rejects structured native/ARIA attributes in both versions. |
| Page compiler → Node/PHP portable projectors | `xtend.rmt.portable-render.v2` | v2 records the required renderer v2 ID. Existing v1 artifacts select renderer v1 and retain their binding intent. Unknown/mixed renderer IDs fail closed. |
| Page build → Node/Laravel hosts | `xtend.page-manifest.v2` | v1 hosts write page-response v1 and accept portable v1 artifacts. A v2 manifest records `initialResumeSchema` only for a matching rebuilt client. v2 manifests can consume legacy portable artifacts during migration; those keep the full initial transport. |
| Node/Laravel page and redirect APIs → page client | `xtend.page-response.v2` | v1 remains readable and prohibits v2 portable artifacts. The new artifact contract changes the containing contract; the old response is not redefined. Full API responses keep their SSR markup. |
| Lossless response-local reference codec | `xtend.page-wire.v2` | v1 reconstructs response v1; v2 reconstructs response v2. Cross-version pairs and initial envelopes are rejected. Limits on depth, table size and expansion remain enforced. |
| Initial portable resume document → initial reader | `xtend.page-initial-resume.v1` | A separate envelope carries page data without `ssr`, a signed resume envelope, and reduced descriptor chunks. Its SSR/chunk records omit general-response `kind`/`version` tags and HTML/textContent. Generic responses never masquerade as reduced records. |
| SSR render result → telemetry accessor | `xtend.rmt.ssr-coverage.v1`, inside `xtend.rmt.node-ssr-fabric-telemetry-hints.v2` | Counts descriptor elements and emitted markers, not successful browser resumes. The telemetry container needs v2 because it gains a required coverage record. |
| SSR hydration and outer render result | Existing hydration v1 and render-result v1 | Hydration receives no coverage extension. Render-result already has an extensible telemetry field; its structural contract stays unchanged. Partial runtime/fixture fingerprints are reviewed separately from released authoritative evidence. |

The public declarations define the API graph. Packaged JSON Schemas in
`xtendrmt/contracts/` define the serializable canonical records, including the
complete initial envelope and signed resume payload. They do not reinterpret
DOM API objects as JSON. Descriptor extension fields and general host metadata
remain extensible. No exact-fingerprint consolidation is inferred from partial
fixtures or generated bundles.

## Initial document and integrity

Node and PHP use the same projection. The signed envelope, snapshot state,
descriptor recovery, expiration and digest inputs remain unchanged. Initial
readers dispatch on the envelope ID before mutating client state or DOM. Existing
signature/digest/version/expiration checks and their single hydration recovery
remain owned by the resume runtime. General adapter, HTML-only, hydration and
subsequent Page API responses retain complete markup.

The build/manifest chooses the initial contract with the shipped client assets;
an initial request cannot prove browser capability. Keeping a v1 manifest is the
compatibility option for an old client. Rebuild the manifest and client together
before opting into the reduced envelope. Unsupported initial IDs are rejected.

## Diagnostics

`getRmtSsrCoverage(result)` returns a validated copy of the standalone telemetry
record, or null when it is absent. Counts are nonnegative safe integers; marked
and component counts cannot exceed descriptor elements, and missing capabilities
cannot exceed components. The ratio is null for zero elements, otherwise marked
divided by elements. Opaque raw HTML inner nodes are excluded. Missing markers
do not automatically make a render fail. Browser adoption/recovery diagnostics
remain separate. Streaming consumers must use an explicitly defined diagnostic
transport if coverage is added there later; no new hydration field is emitted.

Legacy DOM attribute resolutions publish
`rmt.dom.attribute.implicit-binding-deprecated` with the renderer source and an
explicit `$model` migration suggestion. Portable legacy artifacts preserve their
semantics; migrate source bindings and rebuild rather than relabeling artifacts.

## Compatibility window and release evidence

All legacy renderer, portable, manifest, response and wire contracts remain
supported throughout **at least 0.9 and 0.10**. Removal is possible only in 1.0
or a later major, after a documented migration. A 0.11 minor is not an automatic
sunset. Deprecated inventory entries retain their historical released hashes;
new canonical definitions receive their own IDs and reviewed fingerprint sets.

The blocking Nightly catalog includes canonical/legacy contract checks, the
resume runtime, Node/PHP parity, packaged Laravel 12/13 integration and Chromium
resumes, and the missing XTensions host gates. Locked fixture preparation is a
blocking phase with its own artifact. Both Node 24.18.0 and 26.5.0 run the same
catalog. Kernel and MCP generation must be idempotent; package/lock alignment,
prepack and bounded Nightly acceptance must pass. Publishing npm or Packagist
packages and merging this implementation PR remain separate release actions.
