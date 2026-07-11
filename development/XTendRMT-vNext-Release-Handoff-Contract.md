# XTend RMT vNext Release Handoff Contract

- Schema: `xtend.rmt.vnext-release-handoff.v1`
- Report Schema: `xtend.rmt.vnext-release-handoff-report.v1`
- Gate Matrix Schema: `xtend.rmt.vnext-release-gate-matrix.v1`
- Workpackage: `WP-E15-18`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-release --json`
- Package Script: `npm run test:rmt-vnext-release`
- Zielzustand: `rmt-vnext-release-ready`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`

## Abschlussbewertung

Epic 15 ist als vNext Syntax-Epic abgeschlossen. Die Sprache besitzt nun einen additiven Authoring-Pfad, der in ein JSON-kompatibles Core-Format kompiliert und ueber lokale Gates abgesichert wird.

Akzeptiert sind:

- Scope und Source-of-Truth
- Grammar MVP
- Core Format vNext
- Lexer/Parser
- Compiler zu Core mit Source Maps
- Lifecycle, Scheduler, Surfaces, Conditions, Composition, Imports, Events, Security und Streaming
- Tooling Adapter fuer Linter, LSP, Formatter-Preview, Snippets und Agent Reports
- Compatibility und Migration fuer Legacy JSON
- Fixture Regression Gate mit Golden-Hashes, Fuzzing und Browser-Probe
- Docs, Reference Demo und Release-Handoff

## Referenzartefakte

| Artefakt | Pfad |
| --- | --- |
| Authoring Guide | `docs/rmt-vnext-authoring.md` |
| Migration Notes | `docs/rmt-vnext-migration-notes.md` |
| Release Handoff | `development/docs-evidence/legacy-routes/en/rmt-vnext-release-handoff.md` |
| Reference Demo | `xtendrmt/rmt-vnext-reference-demo.rmt` |
| Reference Core Output | `xtendrmt/rmt-vnext-reference-demo.core.json` |
| Browser Probe | `tests/browser/fixtures/rmt-vnext-reference-smoke.html` |
| Release Modul | `tools/rmt-language/vnext-release.js` |
| Release Suite | `tests/rmt-language/rmt_vnext_release_handoff_suite.js` |

## Release Gate Matrix

Der Abschluss-Gate prueft, dass folgende Gate-Befehle als lokale Release-Matrix dokumentiert und package-seitig auffindbar sind:

```bash
npm run test:rmt-vnext-parser
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
npm run test:rmt-vnext-regression
npm run test:browser
npm run test:references
```

## Accepted Residuals

| Residual | Entscheidung | Folgepfad |
| --- | --- | --- |
| produktive Runtime-Adapter fuer vNext Core | nicht Teil von Epic 15 | `rmt-vnext-runtime-adapters` |
| Formatter und Writer API | geplant, aber nicht Release-Blocker | `rmt-vnext-formatter-writer` |
| Workspace Project Index, Rename und References | bewusst getrennt | `rmt-vnext-project-index` |
| Editor Marketplace Distribution | nach Language-Layer-Stabilisierung | `rmt-vnext-editor-distribution` |

## Abschlussentscheidung

RMT vNext ist source-ready, dokumentiert und gatebar. Eine produktive Runtime-Freigabe oder Public-Package-Publish-Entscheidung bleibt einem Folge-Epic mit Runtime-Owner vorbehalten.
