# RC1 Migration Notes

Contract: `xtend.epic13.rc1-migration-notes-semver.v1`

WP-E13-12 prepares consumer communication for the first RC1 candidate. The applied state is `0.1.0-rc.1`; the package boundary is opened to `private: false` for RC1 publish prep. The actual publish command remains a separate manual owner step.

## SemVer

| Field | Value |
| --- | --- |
| Current Version | `0.1.0-rc.1` |
| Proposed Version | `0.1.0-rc.1` |
| Classification | `minor-pre-1.0-release-candidate` |
| Publish | prepared, `private: false`; `npm publish` not executed |

## Migration Sections

### loader-local-esm-cdn-free

XTend apps should use local ESM loader paths. Deprecated CDN bootstraps, especially old `xstate` references, do not belong in RC1-close apps.

### package-export-surface

The Package Export Lock is the binding public surface. New tooling exports, including `./catalog/epic13-rc1-migration-notes`, must appear in the export lock, README, changelog and release gates.

### rmt-first-app-authoring

RMT is the shell-first app authoring path. XTend components are connected through adapters; the RMT kernel imports no XTend types.

### docs-rmt-parsedown-shell

Parsedown is a schedulable docs component inside the RMT shell. Rich HTML or multimedia slots can later be orchestrated alongside it.

### trusted-dom-boundary

`dom_descriptor` remains preferred. `html_fragment` and Parsedown HTML must pass through `xtend.security.trusted-dom-sanitizer.v1` before DOM sinks.

### fabric-lanes-telemetry

Fabric, lanes and RMT lane mapping are the preferred bridge for telemetry and scheduler signals in components.

### component-typescript-and-dts

Component types and `.d.ts` files are part of the consumer contract. App code should consume these types instead of implicit DOM conventions.

### known-residuals-and-watchpoints

`xstate` and `x-utils` remain boundary contracts. The old hydration watchpoint is closed, but should remain visible in RC1 gates.

### visual-owner-artifacts

Visual proofs remain owner-reviewable. Local gates may remain static; CI or release owners can provide screenshots as artifacts.

### conditional-network-evidence

Audit and SBOM are either executed or explicitly owner-deferred. Without evidence or deferral, there is no publish approval.

### publish-boundary

`private: false` is set for RC1 publish prep. Automatic publish remains blocked; the final `npm publish` still requires the manual owner command.

## Local Gate

```bash
node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json
npm run test:epic13-rc1-migration-notes
```

The direct handoff from this package was `WP-E13-13` with `rc1-gate-matrix-ci-handoff`; the corresponding gate matrix is now documented under [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md).
