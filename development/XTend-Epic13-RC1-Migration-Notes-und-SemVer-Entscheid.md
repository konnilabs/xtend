# XTend Epic 13 RC1 Migration Notes und SemVer-Entscheid

- Contract: `xtend.epic13.rc1-migration-notes-semver.v1`
- Workpackage: `WP-E13-12`
- Status: completed
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json`
- Report-Artefakt: `.xtend-test-results/xtend-epic13-rc1-migration-notes-report.json`

## Ziel

`WP-E13-12` macht die RC1-Konsumentenkommunikation maschinenlesbar. Nach den Gates aus RC0, RMT-Production, Docs-RMT-Hardening und Trusted DOM Boundary gibt es jetzt einen stabilen SemVer- und Migration-Notes-Schnitt fuer App-Autoren, Komponenten-Autoren, Release Owner, Security Reviewer und CI-Maintainer.

Der Entscheid bleibt bewusst konservativ: XTend traegt den RC1-Stand `0.1.0-rc.1`, ist fuer Publish Prep auf `private: false` geoeffnet, und der eigentliche Publish-Befehl bleibt ein separater manueller Owner-Schritt.

## SemVer-Entscheid

| Feld | Wert |
| --- | --- |
| Current Version | `0.1.0-rc.1` |
| Proposed RC Version | `0.1.0-rc.1` |
| Phase | `pre-1.0-enterprise-rc` |
| Classification | `minor-pre-1.0-release-candidate` |
| Public Surface Changed | ja |
| Migration Notes Required | ja |
| Changelog Required | ja |
| Publish Allowed | nein |
| Package Private Required | ja |

Die Public Surface hat sich bewusst erweitert: Package Export Lock, RMT-first App Authoring, Fabric/Lanes, Trusted DOM, Component `.d.ts`, Docs RMT Shell und Release-Gates sind nun explizite Vertragsflaechen.

## Migration Notes

| Section | Owner | Handlung |
| --- | --- | --- |
| `loader-local-esm-cdn-free` | Loader | Lokale ESM-Loader-Pfade nutzen, keine deprecated CDN-Bootstraps. |
| `package-export-surface` | Package | Nur dokumentierte Exports konsumieren; Catalog-Gates sind explizite Tooling-Exports. |
| `rmt-first-app-authoring` | XTendRMT | App Shells in RMT templaten, XTend ueber Adapter anbinden. |
| `docs-rmt-parsedown-shell` | Docs | Parsedown als von RMT orchestrierte Komponente behandeln. |
| `trusted-dom-boundary` | Security | `dom_descriptor` bevorzugen, `html_fragment` und Parsedown HTML sanitizen. |
| `fabric-lanes-telemetry` | Fabric | Fabric Adapter und RMT Lane Mapping statt komponentenlokaler Scheduler-Annahmen nutzen. |
| `component-typescript-and-dts` | Components | Generierte `.d.ts` und Component Metadata als Public Contract behandeln. |
| `known-residuals-and-watchpoints` | Release Owner | `xstate` und `x-utils` bleiben Boundary Contracts; Hydration Watchpoints beobachten. |
| `visual-owner-artifacts` | Quality | CI-Screenshots oder Owner-Artefakte vor Publish-Freigabe bereitstellen. |
| `conditional-network-evidence` | Supply Chain | Audit/SBOM ausfuehren oder explizit deferred owner-entscheiden. |
| `publish-boundary` | Release Owner | `private: false` ist fuer RC1-Publish-Prep gesetzt; `npm publish` bleibt manuell. |

## Changelog-Pflichtfelder

RC1-Changelog-Eintraege muessen mindestens diese Abschnitte tragen:

- `Added`
- `Changed`
- `Security`
- `Migration Notes`
- `SemVer Decision`
- `Known Residuals`
- `Release Gates`

## Handoff

`WP-E13-12` ist abgeschlossen. `WP-E13-13` hat die finale RC1 Gate Matrix sowie den CI-Handoff unter `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` abgeschlossen und uebergibt an `WP-E13-14`.
