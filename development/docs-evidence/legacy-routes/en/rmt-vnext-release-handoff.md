# RMT vNext Release Contract

This release contract states what is accepted as `rmt-vnext-release-ready` and which boundaries are intentionally handed to follow-up work. It is written for third-party developers who need to know which local gates protect the language layer and which artifacts they can compare during review.

## Status and contract

The stable contract is `xtend.rmt.vnext-release-handoff.v1`. The report uses `xtend.rmt.vnext-release-handoff-report.v1`, and the matrix uses `xtend.rmt.vnext-release-gate-matrix.v1`. The check runs through `tools/rmt-language/vnext-release.js` plus `tests/rmt-language/rmt_vnext_release_handoff_suite.js`.

Public anchors:

- `docs/en/rmt-vnext-authoring.md`
- `docs/en/rmt-vnext-migration-notes.md`
- `docs/en/rmt-vnext-migration-notes.md`
- `xtendrmt/rmt-vnext-reference-demo.rmt`
- `xtendrmt/rmt-vnext-reference-demo.core.json`

The release decision is: the vNext language layer is source-ready, documented and locally gateable. A production runtime release or public package publish decision remains owned by a follow-up epic with a runtime owner.

## Reference demo

The reference demo `xtendrmt/rmt-vnext-reference-demo.rmt` is the smallest complete source for release review. It covers `template`, `surface`, `lane`, `when`, `slot`, `stream`, `trust boundary`, `sanitize html` and `on submit -> action ...`. The expected compiler output lives in `xtendrmt/rmt-vnext-reference-demo.core.json` and must remain byte-stable unless an intentional compiler change is documented.

```rmt
import "./shared/*.rmt"

template xtend.vnext.reference {
  surface root {
    lane critical weight 10 {
      hydrate app-shell
      hydrate hero-panel when route.visible == true
    }
  }
}
```

If this example drifts, check the compiler and source maps first. Then update the golden output, authoring guide and release handoff together.

## Required gate matrix

The local release matrix is network-free and covers the language layer, Core output, compatibility and references:

```bash
npm run test:rmt-vnext-parser
npm run test:rmt-semantic-graph
npm run test:rmt-vnext-compiler
npm run test:rmt-vnext-lifecycle
npm run test:rmt-vnext-scheduler
npm run test:rmt-vnext-surfaces
npm run test:rmt-vnext-conditions
npm run test:rmt-vnext-composition
npm run test:rmt-vnext-imports
npm run test:rmt-vnext-events
npm run test:rmt-vnext-security
npm run test:rmt-vnext-streaming
npm run test:rmt-vnext-tooling
npm run test:rmt-vnext-compatibility
npm run test:rmt-vnext-primitives:report
npm run test:rmt-vnext-regression
npm run test:browser
npm run test:references
```

The shortest aggregate command for this handoff is:

```bash
node scripts/run_xtend_tests.js rmt-vnext-release --json
```

## Optional browser evidence

The source-to-sea gates are optional because they need a browser and driver environment. They still provide valuable evidence when a release candidate needs to show the full path from `.rmt` source to browser probe.

```bash
npm run test:rmt-vnext-source-to-sea
npm run test:rmt-vnext-source-to-sea:evidence
npm run test:rmt-vnext-source-to-sea:chromedriver
npm run test:rmt-vnext-source-to-sea:firefox
npm run test:rmt-vnext-source-to-sea:validate-artifact
```

A missing optional browser run does not block the language layer. A failing optional run should be triaged before a production runtime adapter epic.

## Accepted residuals

These residuals are accepted and intentionally outside the language-layer closure:

- `rmt-vnext-runtime-adapters`: bind vNext Core to production runtime adapters.
- `rmt-vnext-formatter-writer`: productize format-preserving edits, writer API and LSP formatting.
- `rmt-vnext-project-index`: workspace index, rename and references across multiple files.
- `rmt-vnext-editor-distribution`: ship VS Code, JetBrains, Neovim and Helix packages.

They are not hidden defects in the handoff. They mark the boundary between a complete language contract and a production runtime that has not been released yet.

## Minimal verification path

For changes to this document or to the release matrix, run:

```bash
node scripts/run_xtend_tests.js rmt-vnext-release --json
npm run test:rmt-vnext-primitives:report
```

If the change also touches global navigation or the Developer Center, add `npm run test:pr:report`. That checks docs link quality, reference paths, architecture anchors and Maraca docs together.

## Specific failure modes

- If `rmt-vnext-release` reports a missing document, check `docs/menu.json` and both locale files.
- If the reference demo compiles but the Core output drifts, compare `tools/rmt-language/vnext-compiler.js` with the golden output.
- If a gate is missing from the matrix, update `tools/rmt-language/vnext-release.js`, `package.json` and this handoff together.
- If runtime adapter questions appear, they belong in `rmt-vnext-runtime-adapters`, not in the language-layer closure decision.
