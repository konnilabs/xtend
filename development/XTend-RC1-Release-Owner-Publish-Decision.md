# XTend RC1 Release Owner Publish Decision

- Schema: `xtend.rc1.release-owner-publish-decision.v1`
- Workpackage: `RC1PUB-WP-01`
- Datum: `2026-05-16`
- Quelle: `xtend.rc1.test-build-owner-acceptance.v1`
- Test-Build Acceptance: `development/XTend-RC1-Test-Build-Owner-Acceptance.md`
- Vorgeschlagener RC-Schnitt: `0.1.0-rc.1`
- Aktuelle Package-Version: `0.1.0-rc.1`
- Projektlizenz: `Apache-2.0`
- Aktuelle Publish Boundary: `private: false`
- Entscheidung: `accepted-for-publish-prep`
- Aktueller Publish-Status: `prepared-not-published`

## Zweck

Dieses Dokument ist der naechste Owner-Schritt nach dem akzeptierten RC1-Test-Build. Es ist die Stelle, an der ein spaeterer Release Owner explizit festhalten muss, ob der RC1-Schnitt published, deferred oder blockiert wird.

Der aktuelle Stand ist eine Owner-Freigabe fuer die Publish-Vorbereitung, aber kein ausgefuehrter Publish. Version, License, Audit, SBOM und Package Boundary sind akzeptiert; `npm publish` bleibt ein separater manueller Schritt.

## Aktueller Entscheid

| Feld | Wert |
|------|------|
| Owner Decision | `accepted-for-publish-prep` |
| Publish Allowed | `true` |
| Automatic Publish Approval | `false` |
| Package Private Required | `false` |
| npm Publish | `not-run` |
| npm Tag | `next` aus `publishConfig.tag` |
| Provenance | `true` aus `publishConfig.provenance` |

## Publish-Vorbedingungen und Blocker

| ID | Status | Beleg | Owner-Entscheidung |
|----|--------|-------|--------------------|
| `audit-evidence` | `accepted` | `.xtend-test-results/xtend-npm-audit-report.json` meldet `auditReportVersion: 2`, `moderate: 0`, `high: 0`, `critical: 0`, `total: 0` | keine Audit-Blockade fuer den aktuellen Owner-Publish-Entscheid |
| `sbom-evidence` | `accepted` | `.xtend-test-results/xtend-npm-sbom.json` ist CycloneDX `1.5`, erzeugt mit `npm` CLI `10.9.8`, License `Apache-2.0`, scoped Root `@ccslabs/xtend@0.1.0-rc.1`, `components: 4` | keine SBOM-Blockade fuer den aktuellen Owner-Publish-Entscheid |
| `license-decision` | `accepted` | `package.json` und `tools/rmt-editor/vscode/package.json` tragen `license: Apache-2.0`; `LICENSE` enthaelt Apache License 2.0 | keine weitere License-Blockade fuer den aktuellen Owner-Publish-Entscheid |
| `version-decision` | `accepted` | `package.json`, `package-lock.json` und `tools/rmt-editor/vscode/package.json` tragen `version: 0.1.0-rc.1` | RC1-Version ist angewendet |
| `private-boundary` | `accepted` | Root `@ccslabs/xtend` und die Teilpakete `@ccslabs/xtend-rmt`, `@ccslabs/xtend-fabric`, `@ccslabs/xtend-cli`, `@ccslabs/xtend-compiler` tragen `private: false` | Package Boundary ist fuer RC1 Publish Prep geoeffnet |
| `scoped-package-matrix` | `accepted` | Root-Workspaces und untergeordnete Manifests in `xtendrmt/`, `fabric/`, `xtend-builder/` und `tools/` bilden die installierbaren Pakete ab | Anwender koennen Gesamtpaket oder einzelne Komponenten installieren |
| `publish-command` | `pending-manual-run` | kein `npm publish` ausgefuehrt | Publish-Befehl bleibt separater manueller Owner-Schritt |

## Akzeptierte Evidence

Diese Evidence ist fuer die Owner-Entscheidung vorhanden und reviewbar:

- `development/XTend-RC1-Test-Build-Handoff.md`
- `development/XTend-RC1-Test-Build-Owner-Acceptance.md`
- `.xtend-test-results/xtend-release-gate-report.json` mit `status: passed`, `suiteCount: 175`
- `.xtend-test-results/xtend-release-report.json` mit `status: passed`, `suiteCount: 175`
- `.xtend-test-results/xtend-pr-gate-report.json` mit `status: passed`, `suiteCount: 43`
- `.xtend-test-results/xtend-type-exports-report.json` mit `status: passed`, `suiteCount: 8`
- `.xtend-test-results/xtend-pack-dry-run.json`
- `.xtend-test-results/xtend-package-export-surface-lock.json`
- `.xtend-test-results/xtend-package-export-lock-report.json` mit `ok: true`, `exportCount: 115`, `packFileCount: 664`
- `.xtend-test-results/xtend-conditional-network-evidence-report.json` mit `evidenceSummary.byStatus.executed: 2`, `deferred: []`, `publishAllowed: false`
- `.xtend-test-results/xtend-npm-audit-report.json` mit `metadata.vulnerabilities.total: 0`
- `.xtend-test-results/xtend-npm-sbom.json` mit CycloneDX `1.5`, scoped `bom-ref`/`purl`, `npm` CLI `10.9.8` und `Apache-2.0`
- `CHANGELOG.md` mit dem Abschnitt `0.1.0-rc.1 Test-Build - 2026-05-16`
- `docs/rc1-migration-notes.md`
- `docs/rc1-gate-matrix-ci-handoff.md`
- `docs/release-owner-acceptance.md`

## Entscheidungsoptionen

| Option | Bedeutung | Erlaubte Folge |
|--------|-----------|----------------|
| `accepted-for-publish-prep` | Alle in diesem Dokument genannten Vorbedingungen sind geschlossen; `npm publish` ist noch nicht gelaufen | Publish-Run darf separat vorbereitet und manuell ausgefuehrt werden |
| `accepted-for-publish` | Publish Prep ist akzeptiert und der Owner erlaubt den eigentlichen Publish-Befehl | `npm publish --tag next --provenance` darf nach finaler Kontrolle ausgefuehrt werden |
| `deferred-for-publish` | Owner verschiebt Publish trotz intern akzeptiertem Test-Build | Test-Build bleibt intern nutzbar, Publish bleibt blockiert |
| `blocked-for-publish` | Owner blockiert Publish wegen fehlender Evidence, Version, Package-Boundary oder Risiko | kein Publish, Folgepaket muss Blocker schliessen |
| `pending-owner-publish-decision` | frueherer Zustand vor Owner-Entscheid | kein Publish |

## Minimale Publish-Vorbedingungen

Vor `accepted-for-publish` muessen mindestens diese Punkte im Dokument oder in einem Folgeartefakt auf `accepted` stehen:

- Audit Evidence: `accepted`, `npm audit --audit-level=moderate --json`, 0 Vulnerabilities
- SBOM Evidence: `accepted`, `npm sbom --sbom-format=cyclonedx --json`, CycloneDX `1.5`
- License Decision: `Apache-2.0` fuer den kompletten XTend-Stack
- Version Decision: `accepted`, `0.1.0-rc.1`
- Package Boundary: `accepted`, `private: false`
- Pack Dry Run: keine unerwarteten Artefakte oder Export-Drift
- Gate Reports: Release, PR, TypeExports und RC1 Matrix gruen
- Changelog und Migration Notes: passend zum finalen RC-Schnitt

## Publish Runbook

Erst nach `accepted-for-publish`:

1. Audit/SBOM Evidence bei Bedarf erneut aktualisieren; aktueller Stand ist ausgefuehrt und akzeptiert.
2. Version `0.1.0-rc.1` und Apache-2.0 License-Flaeche unveraendert lassen.
3. `private: false` vor dem Publish final bestaetigen.
4. `npm run test:release:full:report` ausfuehren.
5. `npm run release:report` ausfuehren.
6. `npm run pack:dry-run` ausfuehren.
7. In GitHub Actions `.github/workflows/xtend-default-gates.yml` den manuellen Dispatch mit `publish_to_npm=true` starten; der Job `npm-publish-next` fuehrt `npm publish --tag next --provenance --access public` erst nach Release-, Pack-, Audit/SBOM- und Publish-Dry-Run-Gates aus.

## Handoff

Dieses Dokument macht den Owner-Publish-Entscheid auffindbar und setzt ihn auf `accepted-for-publish-prep`. Es fuehrt keinen Publish aus. Der naechste echte Arbeitsschritt ist der finale manuelle Owner-Check vor dem GitHub-Actions-Dispatch `publish_to_npm=true`.
