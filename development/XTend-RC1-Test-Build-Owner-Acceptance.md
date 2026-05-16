# XTend RC1 Test-Build Owner Acceptance

- Schema: `xtend.rc1.test-build-owner-acceptance.v1`
- Workpackage: `RC1TB-WP-08`
- Datum: `2026-05-16`
- Quelle: `xtend.rc1.test-build-handoff.v1`
- Handoff: `development/XTend-RC1-Test-Build-Handoff.md`
- Aktuelle Package-Version: `0.0.0-enterprise-readiness`
- Vorgeschlagener RC-Schnitt: `0.1.0-rc.1`
- Entscheidung: `accepted-for-internal-test-build-not-publish`
- Publish Boundary: `private: true`, `publishAllowed: false`, `automaticPublishApproval: false`

## Entscheidung

Der lokale RC1-Test-Build-Schnitt aus `RC1TB-WP-07` ist fuer interne Tests akzeptiert. Diese Acceptance erlaubt Review, lokale Integration, Demo-Pruefung und Gate-Reproduktion gegen die dokumentierten Artefakte.

Diese Acceptance ist keine npm-Publish-Freigabe. Sie hebt `private: true` nicht auf, setzt keinen oeffentlichen SemVer-Release und ersetzt keine netzwerkpflichtige Audit-/SBOM-Entscheidung.

## Owner Checklist

| ID | Entscheidung | Evidence | Grenze |
|----|--------------|----------|--------|
| `rc1-test-build-handoff` | `accepted` | `development/XTend-RC1-Test-Build-Handoff.md` | Test-Build-Schnitt ist nachvollziehbar |
| `release-gate-report` | `accepted` | `.xtend-test-results/xtend-release-gate-report.json` meldet `status: passed`, `suiteCount: 175` | lokal erzeugte Evidence |
| `release-report` | `accepted` | `.xtend-test-results/xtend-release-report.json` meldet `status: passed`, `suiteCount: 175` | lokal erzeugte Evidence |
| `pr-gate-report` | `accepted` | `.xtend-test-results/xtend-pr-gate-report.json` meldet `status: passed`, `suiteCount: 43` | lokal erzeugte Evidence |
| `type-exports-release` | `accepted` | `.xtend-test-results/xtend-type-exports-report.json` meldet `status: passed`, `suiteCount: 8` | Export-Typflaeche ist pruefbar |
| `package-dry-run-evidence` | `accepted` | `.xtend-test-results/xtend-package-export-lock-report.json` meldet `ok: true`, `exportCount: 115`, `packFileCount: 658` | Pack bleibt Dry Run, kein Publish |
| `conditional-network-evidence` | `deferred` | `.xtend-test-results/xtend-npm-audit-report.json`, `.xtend-test-results/xtend-npm-sbom.json` | beide Deferrals bleiben publish-blocking |
| `semver-rc-label` | `accepted-for-test-build` | `0.1.0-rc.1` im Changelog und Handoff | keine oeffentliche Version ohne separaten Owner-Entscheid |
| `publish-boundary` | `blocked` | `package.json` bleibt `private: true`; `publishAllowed` bleibt `false` | npm Publish ist nicht freigegeben |

## Gate Report Bundle

| Artefakt | Producer | Owner-Nutzung |
|----------|----------|---------------|
| `.xtend-test-results/xtend-release-gate-report.json` | `npm run test:release:full:report` | vollstaendiger lokaler Gate-Schnitt |
| `.xtend-test-results/xtend-release-report.json` | `npm run release:report` | reproduzierbarer Release Report |
| `.xtend-test-results/xtend-pr-gate-report.json` | `npm run test:pr:report` | schneller PR-Gate-Schnitt |
| `.xtend-test-results/xtend-type-exports-report.json` | `npm run test:type-exports:release` | TypeExports Release Evidence |
| `.xtend-test-results/xtend-pack-dry-run.json` | `npm run pack:dry-run` | Pack-Dateiliste und Dry-Run-Metadaten |
| `.xtend-test-results/xtend-package-export-surface-lock.json` | `npm run pack:dry-run` | exportierte Package-Oberflaeche |
| `.xtend-test-results/xtend-package-export-lock-report.json` | `npm run pack:dry-run` | Export-Lock-Status |
| `.xtend-test-results/xtend-conditional-network-evidence-report.json` | `npm run conditional-network:evidence` | Audit-/SBOM-Status oder Owner-Deferral |

## Interne Testnutzung

Freigegeben fuer interne Tests sind:

- RMT vNext Reference Demo: `xtendrmt/rmt-vnext-reference-demo.rmt`
- RMT vNext Core Output: `xtendrmt/rmt-vnext-reference-demo.core.json`
- XTendRMT Bestcase Demo: `xtendrmt/xtendrmt-bestcase-demo.rmt`
- XTendRMT Bestcase Core Output: `xtendrmt/xtendrmt-bestcase-demo.core.json`
- XTendRMT Bestcase Runtime: `xtendrmt/xtendrmt-bestcase-demo.js`
- lokaler Bestcase Host: `xtendrmt-bestcase.html`
- lokale Gate-Wiederholung ueber die im Handoff dokumentierte Gate Ladder

Nicht freigegeben sind:

- `npm publish`
- Entfernen von `private: true`
- Umbenennen der Package-Version auf `0.1.0-rc.1` ohne separaten Release-Owner-Schritt
- automatische Publish-Freigaben aus gruenen Gates
- Ueberspringen der Audit-/SBOM-Entscheidung vor einem echten Publish

## Network Evidence Decision

`npm-audit-moderate` und `npm-sbom-json` sind fuer den lokalen Test-Build formal deferred. Die Deferrals sind fuer lokale Testnutzung nicht blockierend, bleiben aber fuer Publish blockierend.

Ein echter Publish darf erst vorbereitet werden, wenn entweder:

- `npm audit --audit-level=moderate --json` und `npm sbom --json` ausgefuehrt und akzeptiert wurden, oder
- der Release Owner eine explizite, publish-taugliche Deferral-Entscheidung dokumentiert.

## SemVer und Publish

`0.1.0-rc.1` ist fuer diesen WP ein Changelog- und Handoff-Schnitt. Die Package-Version bleibt `0.0.0-enterprise-readiness`. Ein spaeterer RC-Publish braucht einen separaten Owner-Entscheid zu SemVer, License, Audit/SBOM und `private: true`.

## Handoff

Dieser Decision Record schliesst `RC1TB-WP-08` als vorbereitete Test-Build Acceptance. Der Test-Build kann intern verwendet werden; Publish bleibt bis zur separaten Freigabe blockiert.
