# XTend RC1 Test-Build Handoff

- Schema: `xtend.rc1.test-build-handoff.v1`
- Workpackage: `RC1TB-WP-07`
- Datum: `2026-05-16`
- Commit-Basis: `4e0ae07`
- Aktuelle Package-Version: `0.1.0-rc.1`
- Vorgeschlagener RC-Schnitt: `0.1.0-rc.1`
- Status: `ready-for-release-owner-test-build-review-not-publish`

## Zweck

Dieser Handoff beschreibt den ersten lokalen RC1-Test-Build-Schnitt fuer XTend. Er ist als reproduzierbarer Owner-Review-Stand entstanden; der nachgelagerte Owner-Publish-Schritt hat Version `0.1.0-rc.1` und `private: false` gesetzt. `npm publish` wurde nicht ausgefuehrt.

## Test-Freigabe

Der RC1-Test-Build darf lokal und intern gegen die folgenden Flaechen geprueft werden:

- RMT vNext Release Gate und Reference Demo
- XTendRMT Bestcase Demo und byte-stabiler Core-Output
- Docs-App RMT Production Hardening
- Component Catalog Coverage inklusive Lifecycle Demo Build
- TypeExports Release Gate
- PR- und Release-Gate-Reports
- Package Export Lock und Pack Dry Run Evidence
- Conditional Network Evidence mit ausgefuehrter Audit-/SBOM-Evidence

Nicht freigegeben sind npm Publish, automatische Publish-Freigaben, oeffentliche SemVer-Kommunikation ohne Release-Owner-Entscheid und neue Produktversprechen ausserhalb der bereits dokumentierten RC1-Gates.

## Report-Evidence

| Artefakt | Ergebnis |
|----------|----------|
| `.xtend-test-results/xtend-release-gate-report.json` | `status: passed`, `suiteCount: 175`, `failed: 0` |
| `.xtend-test-results/xtend-release-report.json` | `status: passed`, `suiteCount: 175`, `failed: 0` |
| `.xtend-test-results/xtend-pr-gate-report.json` | `status: passed`, `suiteCount: 43`, `failed: 0` |
| `.xtend-test-results/xtend-type-exports-report.json` | `status: passed`, `suiteCount: 8`, `failed: 0` |
| `.xtend-test-results/xtend-pack-dry-run.json` | Pack Dry Run erzeugt und mit Export Lock abgeglichen |
| `.xtend-test-results/xtend-package-export-lock-report.json` | `ok: true`, `exportCount: 115`, `packFileCount: 664` |
| `.xtend-test-results/xtend-conditional-network-evidence-report.json` | `ok: true`, `executed: 2`, `deferred: []`, `publishAllowed: false` |

Die browser- und servernahen Gate-Reports wurden lokal ausserhalb der Sandbox erzeugt, weil die Sandbox den Bind auf `127.0.0.1` mit `listen EPERM` blockiert. Die daraus erzeugten Reports bleiben die relevante Evidence fuer diesen Test-Build-Schnitt.

## Gate-Schnitt

Der Test-Build-Schnitt basiert auf den folgenden zuletzt gruenen oder formal deferierten Gates:

- `npm run test:rmt-vnext-release`
- `npm run test:epic13-rc1-gate-matrix-ci-handoff`
- `npm run test:type-exports:release`
- `npm run test:release:full:report`
- `npm run test:pr:report`
- `npm run release:report`
- `npm run pack:dry-run`
- `npm run test:epic13-release-report-pack-dry-run-evidence`
- `npm run test:epic13-package-export-lock`
- `npm run conditional-network:evidence`

## Referenzpfade

| Pfad | Rolle |
|------|-------|
| `xtendrmt/rmt-vnext-reference-demo.rmt` | RMT vNext Reference Demo Source |
| `xtendrmt/rmt-vnext-reference-demo.core.json` | stabiler Core-Output fuer die RMT vNext Reference Demo |
| `xtendrmt/xtendrmt-bestcase-demo.rmt` | XTendRMT Bestcase Authoring Source |
| `xtendrmt/xtendrmt-bestcase-demo.core.json` | byte-stabiler Bestcase Core-Output |
| `xtendrmt/xtendrmt-bestcase-demo.js` | Runtime-Projektion der Bestcase Demo |
| `xtendrmt-bestcase.html` | lokaler Bestcase Host |

## Offene Owner-Entscheidungen

- Audit/SBOM sind fuer den aktuellen Owner-Publish-Entscheid ausgefuehrt und akzeptiert; vor einem spaeteren Publish kann der Owner eine Aktualisierung verlangen.
- Ob `0.1.0-rc.1` als SemVer-Schnitt fuer den spaeteren RC uebernommen wird.
- Ob der lokale Test-Build als intern akzeptiert, deferiert oder blockiert markiert wird.
- Ob zusaetzliche visuelle Owner-Artefakte fuer Screenshot-/Pixel-Evidence vor einem Publish notwendig sind.
- `private: false` ist im separaten Release-Owner-Schritt gesetzt; offen bleibt nur der finale manuelle Publish-Befehl.

## Handoff

`RC1TB-WP-08` bereitet die Release Owner Test-Build Acceptance vor. Dieser WP darf die Evidence aus diesem Dokument verwenden, muss aber die Publish Boundary weiter geschlossen halten, bis der Owner eine separate Freigabe dokumentiert.

Die vorbereitete Acceptance liegt in `development/XTend-RC1-Test-Build-Owner-Acceptance.md` unter `xtend.rc1.test-build-owner-acceptance.v1`. Sie akzeptiert den Test-Build fuer interne Nutzung; Audit/SBOM, Version und Package Boundary sind inzwischen im Owner-Publish-Schritt akzeptiert.
