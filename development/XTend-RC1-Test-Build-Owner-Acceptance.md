# XTend RC1 Test-Build Owner Acceptance

- Schema: `xtend.rc1.test-build-owner-acceptance.v1`
- Workpackage: `RC1TB-WP-08`
- Datum: `2026-05-16`
- Quelle: `xtend.rc1.test-build-handoff.v1`
- Handoff: `development/XTend-RC1-Test-Build-Handoff.md`
- Aktuelle Package-Version: `0.1.0-rc.1`
- Vorgeschlagener RC-Schnitt: `0.1.0-rc.1`
- Entscheidung: `accepted-for-internal-test-build-not-publish`
- Publish Boundary: `private: false`, `publishAllowed: true`, `automaticPublishApproval: false`

## Entscheidung

Der lokale RC1-Test-Build-Schnitt aus `RC1TB-WP-07` ist fuer interne Tests akzeptiert. Diese Acceptance erlaubt Review, lokale Integration, Demo-Pruefung und Gate-Reproduktion gegen die dokumentierten Artefakte.

Diese Acceptance war keine npm-Publish-Freigabe. Die nachgelagerte Owner-Publish-Evidence hat Audit, SBOM, Version und Package Boundary inzwischen akzeptiert; `npm publish` bleibt trotzdem ein separater manueller Owner-Schritt.

## Owner Checklist

| ID | Entscheidung | Evidence | Grenze |
|----|--------------|----------|--------|
| `rc1-test-build-handoff` | `accepted` | `development/XTend-RC1-Test-Build-Handoff.md` | Test-Build-Schnitt ist nachvollziehbar |
| `release-gate-report` | `accepted` | `.xtend-test-results/xtend-release-gate-report.json` meldet `status: passed`, `suiteCount: 175` | lokal erzeugte Evidence |
| `release-report` | `accepted` | `.xtend-test-results/xtend-release-report.json` meldet `status: passed`, `suiteCount: 175` | lokal erzeugte Evidence |
| `pr-gate-report` | `accepted` | `.xtend-test-results/xtend-pr-gate-report.json` meldet `status: passed`, `suiteCount: 43` | lokal erzeugte Evidence |
| `type-exports-release` | `accepted` | `.xtend-test-results/xtend-type-exports-report.json` meldet `status: passed`, `suiteCount: 8` | Export-Typflaeche ist pruefbar |
| `package-dry-run-evidence` | `accepted` | `.xtend-test-results/xtend-package-export-lock-report.json` meldet `ok: true`, `exportCount: 115`, `packFileCount: 664` | Pack bleibt Dry Run, kein Publish |
| `conditional-network-evidence` | `accepted` | `.xtend-test-results/xtend-npm-audit-report.json` meldet 0 Vulnerabilities; `.xtend-test-results/xtend-npm-sbom.json` ist CycloneDX `1.5` | offene Audit/SBOM-Blocker sind geschlossen; Evidence bleibt publish-required |
| `semver-rc-label` | `accepted-for-test-build` | `0.1.0-rc.1` im Changelog und Handoff | keine oeffentliche Version ohne separaten Owner-Entscheid |
| `publish-boundary` | `accepted-for-publish-prep` | `package.json` und VS-Code-Bridge tragen `private: false`; `publishAllowed` ist fuer Prep `true` | npm Publish wurde nicht ausgefuehrt |

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
| `.xtend-test-results/xtend-conditional-network-evidence-report.json` | `XTEND_CONDITIONAL_NETWORK_EXECUTE=1 XTEND_CONDITIONAL_NETWORK_USE_NPX_NPM10=1 npm run conditional-network:evidence` | Audit-/SBOM-Status `executed: 2`, `deferred: []` |

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

- `npm publish` ohne finalen manuellen Owner-Check
- automatische Publish-Freigaben aus gruenen Gates
- Ueberspringen der Version- und Package-Boundary-Entscheidung vor einem echten Publish

## Network Evidence Decision

`npm-audit-moderate` und `npm-sbom-json` sind im nachgelagerten Owner-Publish-Schritt ausgefuehrt und akzeptiert. `.xtend-test-results/xtend-conditional-network-evidence-report.json` meldet `executed: 2` und `deferred: []`; das Audit meldet 0 Vulnerabilities, das SBOM liegt als CycloneDX `1.5` vor.

## SemVer und Publish

`0.1.0-rc.1` ist jetzt die angewendete Package-Version. License, Audit, SBOM und `private: false` sind fuer den aktuellen Entscheid akzeptiert; der eigentliche Publish-Befehl bleibt separat.

## Handoff

Dieser Decision Record schliesst `RC1TB-WP-08` als vorbereitete Test-Build Acceptance. Der Test-Build kann intern verwendet werden; Publish bleibt bis zur separaten Freigabe blockiert.

Der separate Owner-Publish-Entscheid liegt in `development/XTend-RC1-Release-Owner-Publish-Decision.md` unter `xtend.rc1.release-owner-publish-decision.v1`. Er steht auf `accepted-for-publish-prep`; Version, `private: false`, License, Audit und SBOM sind akzeptiert. `npm publish` wurde nicht ausgefuehrt.
