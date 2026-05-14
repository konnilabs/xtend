# EPIC 13 - RC0 zu RC1 Production Readiness und Release Owner Acceptance

- Status: Active
- Datum: 8. Mai 2026
- Contract: `xtend.epic13.rc1-production-readiness.v1`
- Vorgang: RC0 zu RC1 Transfer
- Quelle: AI-importiertes EPIC-Dokument
- Importstatus: Die importierte Datei war beim Abgleich leer (`0 Byte`). Dieses Dokument ist deshalb die bereinigte Steering-Fassung auf Basis der vorhandenen RC0-Artefakte und Gates.
- Ausgangspunkt:
  - `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md`
  - `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
  - `development/XTend-RC0-Gate-Matrix.md`
  - `development/XTend-Release-Checklist-und-SemVer-Policy.md`
  - `development/XTend-CI-Gate-Matrix.md`
  - `docs/epic12-rc0-handoff.md`
- Zielzustand: `rc1-production-candidate-ready`
- Publish Boundary: `private-until-release-owner-acceptance`
- Aktuelles Paket: `WP-E13-13` completed
- Naechstes Paket: `WP-E13-14`

## Zweck

Epic 12 hat XTend in den Status `ready-for-release-owner-review-not-publish` gebracht. Epic 13 fuehrt diesen Stand in einen echten RC1-Produktionskandidaten. Das heisst: XTend soll nicht nur lokal reviewbar sein, sondern fuer reale PROD-nahe Umgebungen belastbar vorbereitet werden.

Der Fokus liegt nicht auf einem weiteren Feature-Ausbau um seiner selbst willen. Epic 13 nimmt nur Features auf, die fuer Echtsysteme, Release Owner Acceptance oder PROD-nahe Betriebsfaehigkeit notwendig sind:

- Release Owner Acceptance muss als nachvollziehbarer Contract mit Artefakten, Entscheidungen und Deferrals vorliegen.
- Conditional Network Gates muessen entweder ausgefuehrt oder strukturiert als Owner-Deferral dokumentiert werden.
- Package-Inhalt, Exports, Dry Run und Versionierungs-/Migration-Notes muessen releasefaehig pruefbar sein.
- Die in RC0 akzeptierten Residuals muessen fuer RC1 geschlossen oder bewusst neu klassifiziert werden.
- Browser-, Visual-, Security-, RMT- und Docs-App-Pfade muessen PROD-naeher werden, ohne CDN- oder Framework-Kopplung einzufuehren.
- XTendRMT bleibt framework-agnostisch; der RMT Kernel importiert keine XTend-Typen.

## Feature-Drift-Bereinigung

Die folgenden Punkte sind bewusst **nicht** Ziel von Epic 13:

| Drift-Risiko | Entscheidung |
|--------------|--------------|
| XTend in den RMT Kernel einbetten | abgelehnt; RMT bleibt host-neutral |
| CDN-Fallbacks zurueckbringen | abgelehnt; lokale und same-origin ESM-Pfade bleiben Standard |
| neue App- oder SaaS-Features bauen | abgelehnt, ausser sie sind Gate-Fixtures fuer PROD-Readiness |
| grosse Component-Design-Refreshes starten | abgelehnt, ausser sie schliessen konkrete A11y-, Performance- oder Visual-Gate-Luecken |
| Pixel-Visuals als hartes Default-Gate erzwingen | abgelehnt fuer lokale Default-Gates; erlaubt als RC1-Artefakt mit klarer Umgebung |
| `private: true` automatisch oeffnen | abgelehnt; Publish bleibt Release-Owner-Entscheidung |

## RC0 Gate-Abgleich

| Goalpost aus RC0/RC1 | Vorhandener Gate/Artefakt | Stand | EPIC-13-Entscheidung |
|----------------------|---------------------------|-------|----------------------|
| RC0 Owner-Handoff | `npm run test:epic12-rc0-handoff` | vorhanden, gruen | als Baseline fuer RC1 uebernehmen |
| Full Release Gate | `npm run test:release:full:report` | vorhanden | als Pflichtartefakt fuer RC1 behalten |
| PR Fast Gate | `npm run test:pr:report` | vorhanden | als schnelle Regressionslinie behalten |
| RC0 Gate Matrix | `npm run test:rc0-gate-matrix` | vorhanden | zu RC1 Gate Matrix erweitern |
| Docs/Migration Notes | `npm run test:epic12-docs-adoption` | vorhanden | auf RC1-Migration Notes erweitern |
| Release Report | `npm run release:report` | vorhanden | als Release-Owner-Artefakt einfrieren |
| Package Dry Run | `npm run pack:dry-run` | vorhanden | stdout/Dateiliste maschinenlesbar pruefen |
| Manifest Security | `npm run test:manifest-policy`, `npm run test:epic13-prod-browser-csp-smoke`, `npm run test:epic13-trusted-dom-boundary` | vorhanden, PROD/CSP-Smoke und Trusted-DOM-Boundary vorbereitet | fuer RC1 beibehalten |
| Supply Chain lokal | `npm run test:supply-chain` | vorhanden | mit Network-Deferral/Execution-Log verbinden |
| Network Gates | `npm audit --audit-level=moderate`, `npm sbom --json` | conditional | fuer RC1 ausfuehren oder Owner-Deferral dokumentieren |
| Visual Snapshot DOM | `npm run test:visual-snapshots`, `npm run test:epic13-visual-owner-artifact` | vorhanden, Owner-Artefakt normalisiert | beibehalten; Screenshot-/Pixel-Artefakt bleibt optionaler Owner-/CI-Pfad |
| Design Tokens | `npm run test:design-tokens` | vorhanden | beibehalten |
| Performance Regression | `npm run test:performance` | vorhanden, Hydration-Warnung in `WP-E13-06` geschlossen | als RC1-Baseline ohne Warnungen weiterfuehren |
| Hydration Policy | `npm run test:hydration-policy` | vorhanden | beibehalten und mit PROD-Smoke verbinden |
| A11y Basis | `npm run test:a11y`, `test:screenreader-signals`, `test:motion-contrast` | vorhanden | browsernah fuer RC1 verdichten |
| Browser Smoke | `npm run test:browser`, `npm run test:epic13-prod-browser-csp-smoke`, `npm run test:epic13-trusted-dom-boundary` | vorhanden, PROD-nahe und Trusted-DOM-Fixture vorbereitet | fuer RC1 beibehalten |
| RMT Compatibility | `npm run test:rmt-compatibility`, `test:rmt-first-class-app`, `test:rmt-artifact-parity` | vorhanden | zu RC1 App Shell Readiness zusammenfuehren |
| Docs-App RMT Pilot | `npm run test:docs-rmt-pilot` | vorhanden | PROD-nahe Parsedown/RMT Shell absichern |
| Reference Registry | `npm run test:references` | vorhanden | alle EPIC-13-Artefakte registrieren |

## Offene Gate-Luecken fuer RC1

| Luecke | Warum wichtig fuer PROD | Zielpaket |
|--------|--------------------------|-----------|
| RC1 Gate Matrix fehlt | RC0 ist reviewbar, RC1 braucht finalen Acceptance-Schnitt | `WP-E13-01`, `WP-E13-13` completed |
| Release Owner Acceptance Contract ist definiert | Publish Boundary ist formalisiert, aber noch nicht geoeffnet | `WP-E13-02` completed |
| Network-Gate-Resultate sind als Evidence/Deferral vorbereitet | Audit/SBOM bleiben vor Publish owner-pflichtig | `WP-E13-03` completed |
| `npm pack --dry-run` ist als Package Export Lock vorbereitet | Paketinhalt bleibt fuer RC1 maschinenlesbar pruefbar | `WP-E13-04` completed |
| RC0-Residuals sind fuer RC1 triagiert | `xstate` und `x-utils` sind Boundary-Contracts; `xtend.component.hydrate` ist owner-frei geschlossen | `WP-E13-05`, `WP-E13-06` completed |
| PROD-nahe CSP-/Server-Smokes sind vorbereitet | `WP-E13-07` stellt same-origin Fixture, Local-Server-CSP-Header und Nonce-Smoke bereit; `WP-E13-11` beweist Trusted DOM browsernah | `WP-E13-07`, `WP-E13-11` completed |
| Screenshot-/Pixel-Artefakt ist optional normalisiert | Release Owner braucht bei UI-Frameworks sichtbare Evidenz | `WP-E13-08` completed |
| RMT-first PROD App Readiness ist als RC1-Schnitt gebuendelt | Shell-first App Shell, Routing, Components, Fabric, Lanes, Diagnostics und Artifact Parity sind zusammengefuehrt | `WP-E13-09` completed |
| Docs-App RMT Parsedown Shell ist PROD-nah gehaertet | Extension-Slots, Rich-HTML-/XPlayer-Schedules, Diagnostics, Parsedown-Host-Boundary und Trusted-DOM-Sanitizer sind stabilisiert | `WP-E13-10`, `WP-E13-11` completed |
| RC1 Migration Notes und SemVer-Entscheid sind vorbereitet | Upgrades brauchen konkrete Konsumentenkommunikation | `WP-E13-12` completed |
| RC1 finaler Handoff fehlt | RC1 darf erst nach explizitem Abschluss entscheidungsreif sein | `WP-E13-14` |

## Zielbild fuer RC1

RC1 ist erreicht, wenn:

- alle lokalen Release-Gates gruen sind
- Conditional Network Gates ausgefuehrt oder mit Release-Owner-Deferral dokumentiert sind
- `npm pack --dry-run` einen erwarteten, pruefbaren Paketinhalt zeigt
- `private: true` weiterhin aktiv ist, bis der Release Owner entscheidet
- bekannte RC0-Residuals geschlossen oder als RC1-kompatibel neu akzeptiert sind
- Browser-, A11y-, Performance-, Security-, RMT- und Docs-App-Pfade PROD-naeher geprueft sind
- `CHANGELOG.md`, README, Docs und Migration Notes den RC1-Schnitt beschreiben
- ein `xtend.epic13.rc1-handoff.v1` Report die Entscheidung `rc1-production-candidate-ready` belegt

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- die betroffene Gate-Flaeche genannt ist
- klar ist, ob ein bestehender Gate erweitert oder ein neuer Gate angelegt wird
- keine Netzwerkpflicht fuer lokale Default-Tests entsteht
- die Publish Boundary unveraendert bleibt
- RMT-Kernel-Neutralitaet gewahrt bleibt
- die erwarteten Docs-, Package- und Reference-Updates benannt sind

## Definition of Done

Ein Workpackage ist abgeschlossen, wenn:

- der Contract oder die Runtime-Aenderung als Datei vorliegt
- ein lokaler Gate oder eine begruendete Owner-Deferral existiert
- `package.json`, `xtend-builder/scaffold.config.js`, Docs und Reference Registry bei neuen Oberflaechen aktualisiert sind
- bestehende RC0-Gates nicht regressieren
- das Workpackage einen Handoff zum naechsten Paket dokumentiert

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-E13-01` | P0 | completed | WS0 | RC1 Readiness Model und Gate-Abgleich einfrieren | `WP-E12-16` |
| `WP-E13-02` | P0 | completed | WS0 | Release Owner Acceptance Contract definieren | `WP-E13-01` |
| `WP-E13-03` | P0 | completed | WS1 | Conditional Network Gate Evidence vorbereiten | `WP-E13-02` |
| `WP-E13-04` | P0 | completed | WS1 | Package Dry Run Artefakt und Export-Surface-Lock bauen | `WP-E13-02` |
| `WP-E13-05` | P0 | completed | WS2 | RC0 Known Residuals fuer RC1 triagieren | `WP-E13-01` |
| `WP-E13-06` | P0 | completed | WS2 | Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen | `WP-E13-05` |
| `WP-E13-07` | P1 | completed | WS3 | PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten | `WP-E13-03`, `WP-E13-04` |
| `WP-E13-08` | P1 | completed | WS3 | Visual Screenshot/Pixels als RC1-Artefakt normalisieren | `WP-E13-07` |
| `WP-E13-09` | P1 | completed | WS4 | RMT-first App Production Readiness Gate buendeln | `WP-E13-01`, `WP-E13-08` |
| `WP-E13-10` | P1 | completed | WS4 | Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten | `WP-E13-09` |
| `WP-E13-11` | P1 | completed | WS5 | Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen | `WP-E13-10` |
| `WP-E13-12` | P1 | completed | WS6 | RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten | `WP-E13-04`, `WP-E13-05` |
| `WP-E13-13` | P2 | completed | WS7 | RC1 Gate Matrix und CI-Handoff erstellen | `WP-E13-03` bis `WP-E13-12` |
| `WP-E13-14` | P2 | ready | WS8 | Epic-13-Abschlussreview und RC1-Handoff erstellen | `WP-E13-13` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | RC1 Readiness, Owner Acceptance und Steering |
| WS1 | Network Evidence, Package Dry Run und Export Surface |
| WS2 | Known Residuals und Performance-Warnungen |
| WS3 | PROD-nahe Browser-, CSP- und Visual-Artefakte |
| WS4 | RMT-first Production Readiness und Docs-App RMT Shell |
| WS5 | Trusted DOM, Parsedown und Runtime Security |
| WS6 | Migration Notes, SemVer, Changelog und Consumer-Kommunikation |
| WS7 | RC1 Gate Matrix und CI-Handoff |
| WS8 | RC1 Abschlussreview |

## Workpackages im Detail

### WP-E13-01 - RC1 Readiness Model und Gate-Abgleich einfrieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - dieses Steering-Dokument in ein erstes maschinenlesbares RC1 Readiness Model ueberfuehren
- Scope:
  - RC0-Handoff aus `xtend.epic12.rc0-handoff.v1`
  - Gate-Abgleich aus diesem Dokument
  - RC1-Zielreife `rc1-production-candidate-ready`
  - Startbedingungen fuer Release Owner Acceptance
- Zielartefakte:
  - `development/RC0-RC1-transfer-EPIC13.md`
  - `development/XTend-Epic13-RC1-Readiness-Modell.md`
  - `development/WP-E13-01-RC1-Readiness-Model-und-Gate-Abgleich-einfrieren.md`
  - `catalog/epic13-rc1-readiness.js`
  - `tests/platform/epic13_rc1_readiness_suite.js`
  - `docs/rc1-readiness.md`
- Gate:
  - `node scripts/run_xtend_tests.js epic12-rc0-handoff --json`
  - `node scripts/run_xtend_tests.js rc0-gate-matrix --json`
  - `node scripts/run_xtend_tests.js references --json`
- Definition of Done:
  - RC1-Zielbild ist eindeutig
  - Gate-Luecken sind Workpackages zugeordnet
  - Feature-Drift ist abgegrenzt
  - `WP-E13-02` ist startbar

## Handoff nach WP-E13-01

`WP-E13-01` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.rc1-production-readiness.v1`.

Erledigt:

- `development/XTend-Epic13-RC1-Readiness-Modell.md` friert den RC1 Readiness Contract ein
- `catalog/epic13-rc1-readiness.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_rc1_readiness_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry und Gate-Abgleich
- `docs/rc1-readiness.md` macht den RC1-Schnitt in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13Rc1Readiness`
- `WP-E13-02` ist abgeschlossen und `WP-E13-03` ist `ready`

Naechstes Paket:

- `WP-E13-03` Conditional Network Gate Evidence vorbereiten

### WP-E13-02 - Release Owner Acceptance Contract definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Publish Boundary, Owner-Entscheidungen, Deferrals und Artefakte formal beschreiben
- Bestehende Gates:
  - `npm run test:epic12-rc0-handoff`
  - `npm run release:report`
- Neue Arbeit:
  - Contract `xtend.epic13.release-owner-acceptance.v1`
  - Owner Review Checklist mit Statuswerten `accepted`, `deferred`, `blocked`
  - keine automatische Publish-Freigabe
- Zielartefakte:
  - `development/XTend-Epic13-Release-Owner-Acceptance-Contract.md`
  - `development/WP-E13-02-Release-Owner-Acceptance-Contract-definieren.md`
  - `catalog/epic13-release-owner-acceptance.js`
  - `tests/platform/epic13_release_owner_acceptance_suite.js`
  - `docs/release-owner-acceptance.md`
- Gate:
  - `node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json`
- Definition of Done:
  - Owner-Checklist und Statuswerte sind maschinenlesbar
  - `automatic-publish-approval` ist `blocked`
  - Deferrals verweisen auf konkrete Folgepakete
  - `WP-E13-03` ist startbar

## Handoff nach WP-E13-02

`WP-E13-02` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.release-owner-acceptance.v1`.

Erledigt:

- `development/XTend-Epic13-Release-Owner-Acceptance-Contract.md` beschreibt Publish Boundary, Owner Inputs, Checklist-Statuswerte und Deferral-Regeln
- `catalog/epic13-release-owner-acceptance.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_release_owner_acceptance_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry und Publish Boundary
- `docs/release-owner-acceptance.md` macht den Owner-Acceptance-Schnitt in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13ReleaseOwnerAcceptance`
- `WP-E13-03`, `WP-E13-04`, `WP-E13-05`, `WP-E13-06`, `WP-E13-07` und `WP-E13-08` sind abgeschlossen; `WP-E13-09` ist `ready`

Naechstes Paket:

- `WP-E13-09` RMT-first App Production Readiness Gate buendeln

### WP-E13-03 - Conditional Network Gate Evidence vorbereiten

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `npm audit --audit-level=moderate` und `npm sbom --json` als RC1-Evidence erfassbar machen
- Bestehende Gates:
  - `npm run test:supply-chain`
  - `npm run supply-chain:verify`
- Neue Arbeit:
  - Ergebnisdateien unter `.xtend-test-results/`
  - Deferral-Format fuer Offline-/Sandbox-Laeufe
  - klare Regel: lokal optional, vor Publish owner-pflichtig
- Zielartefakte:
  - `development/XTend-Epic13-Conditional-Network-Evidence-Contract.md`
  - `development/WP-E13-03-Conditional-Network-Gate-Evidence-vorbereiten.md`
  - `catalog/epic13-conditional-network-evidence.js`
  - `tests/platform/epic13_conditional_network_evidence_suite.js`
  - `docs/conditional-network-evidence.md`
- Gate:
  - `node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json`
- Definition of Done:
  - `npm audit --audit-level=moderate` und `npm sbom --json` haben erwartete Artefaktpfade
  - Offline-/Sandbox-Laeufe erzeugen strukturierte Deferral-Records
  - lokale Default-Gates bleiben netzwerkfrei
  - `WP-E13-04` ist startbar

## Handoff nach WP-E13-03

`WP-E13-03` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.conditional-network-evidence.v1`.

Erledigt:

- `development/XTend-Epic13-Conditional-Network-Evidence-Contract.md` beschreibt Commands, Artefaktpfade und Deferral-Regeln
- `catalog/epic13-conditional-network-evidence.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_conditional_network_evidence_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry und Publish Boundary
- `docs/conditional-network-evidence.md` macht den Evidence-/Deferral-Schnitt in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13ConditionalNetworkEvidence`
- `WP-E13-04`, `WP-E13-05`, `WP-E13-06`, `WP-E13-07` und `WP-E13-08` sind abgeschlossen; `WP-E13-09` ist `ready`

Naechstes Paket:

- `WP-E13-09` RMT-first App Production Readiness Gate buendeln

### WP-E13-04 - Package Dry Run Artefakt und Export-Surface-Lock bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `npm run pack:dry-run` nicht nur ausfuehren, sondern erwartete Paketoberflaeche pruefen
- Bestehende Gates:
  - `npm run pack:dry-run`
  - `npm run release:check`
- Neue Arbeit:
  - Pack-Dry-Run-Ausgabe als pruefbares Artefakt
  - Export-Surface-Snapshot fuer Loader, Components, Fabric, XTendRMT, Builder, Docs
  - Drift-Check gegen `package.json#exports`
- Zielartefakte:
  - `development/XTend-Epic13-Package-Export-Lock-Contract.md`
  - `development/WP-E13-04-Package-Dry-Run-Artefakt-und-Export-Surface-Lock-bauen.md`
  - `catalog/epic13-package-export-lock.js`
  - `tests/platform/epic13_package_export_lock_suite.js`
  - `scripts/capture_pack_dry_run.js`
  - `docs/package-export-lock.md`
  - `.xtend-test-results/xtend-pack-dry-run.json`
  - `.xtend-test-results/xtend-package-export-surface-lock.json`
  - `.xtend-test-results/xtend-package-export-lock-report.json`
- Gate:
  - `node scripts/run_xtend_tests.js epic13-package-export-lock --json`
  - `npm run pack:dry-run:report`
- Definition of Done:
  - Package Export Surface ist auf 54 erwartete Exports gelockt
  - `files` enthaelt die required Roots fuer Loader, Components, Fabric, XTendRMT, Builder, Docs, Security und Catalog
  - Export Targets liegen innerhalb der Package-Files und enthalten keine externen CDN-/HTTP-Ziele
  - `private: true` bleibt Pflicht
  - `WP-E13-05` ist abgeschlossen und `WP-E13-06` ist startbar

## Handoff nach WP-E13-04

`WP-E13-04` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.package-export-lock.v1`.

Erledigt:

- `development/XTend-Epic13-Package-Export-Lock-Contract.md` beschreibt Dry-Run-Artefakte, Surface Groups und Lock-Regeln
- `catalog/epic13-package-export-lock.js` stellt Factory, Validator, Surface Snapshot und Dry-Run-Artefakt-Parser bereit
- `tests/platform/epic13_package_export_lock_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry und Publish Boundary
- `scripts/capture_pack_dry_run.js` schreibt die RC1-Artefakte unter `.xtend-test-results/`
- `docs/package-export-lock.md` macht den Package Export Lock in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13PackageExportLock`
- `WP-E13-05`, `WP-E13-06`, `WP-E13-07` und `WP-E13-08` sind abgeschlossen; `WP-E13-09` ist `ready`

Naechstes Paket:

- `WP-E13-09` RMT-first App Production Readiness Gate buendeln

### WP-E13-05 - RC0 Known Residuals fuer RC1 triagieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `xstate`, `x-utils` und `xtend.component.hydrate` fuer RC1 neu bewerten
- Bestehende Gates:
  - `npm run test:catalog-coverage`
  - `npm run test:performance`
  - `npm run test:component-long-tail-migration`
- Neue Arbeit:
  - Residual-Entscheidmatrix fuer RC1
  - Owner-freie Schliessung bevorzugt
  - falls Residual bleibt: explizite RC1-Begruendung
- Zielartefakte:
  - `development/XTend-Epic13-Known-Residual-Triage-Contract.md`
  - `development/WP-E13-05-RC0-Known-Residuals-fuer-RC1-triagieren.md`
  - `catalog/epic13-known-residual-triage.js`
  - `tests/platform/epic13_known_residual_triage_suite.js`
  - `docs/known-residual-triage.md`
  - `.xtend-test-results/xtend-known-residual-triage-report.json`
- Gate:
  - `node scripts/run_xtend_tests.js epic13-known-residual-triage --json`
- Definition of Done:
  - `xstate` ist als `closed-as-runtime-boundary` klassifiziert
  - `x-utils` ist als `closed-as-utility-boundary` klassifiziert
  - `xtend.component.hydrate` bleibt als `rc1-watchpoint` fuer `WP-E13-06` sichtbar
  - `private: true` bleibt Pflicht
  - `WP-E13-06` ist startbar

## Handoff nach WP-E13-05

`WP-E13-05` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.known-residual-triage.v1`.

Erledigt:

- `development/XTend-Epic13-Known-Residual-Triage-Contract.md` beschreibt die RC1-Entscheidmatrix fuer `xstate`, `x-utils` und `xtend.component.hydrate`
- `catalog/epic13-known-residual-triage.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_known_residual_triage_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry und Publish Boundary
- `docs/known-residual-triage.md` macht die Residual-Triage in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13KnownResidualTriage`
- `xstate` und `x-utils` blockieren RC1 nicht mehr als Residuals
- `xtend.component.hydrate` ging als einziger publish-blocking Watchpoint nach `WP-E13-06` und wurde dort owner-frei geschlossen

Naechstes Paket:

- `WP-E13-09` RMT-first App Production Readiness Gate buendeln

### WP-E13-06 - Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - die aktuelle Warnung `xtend.component.hydrate` unter Budget bringen oder als RC1-Watchpoint neu akzeptieren
- Bestehende Gates:
  - `npm run test:performance`
  - `npm run test:hydration-policy`
  - `npm run test:fabric-performance`
- Neue Arbeit:
  - Budgetanalyse abgeschlossen
  - Hydration-Policy-Review abgeschlossen
  - keine Senkung von Qualitaetsanspruch nur zum Gruenfaerben
- Zielartefakte:
  - `development/XTend-Epic13-Hydration-Performance-Closure-Contract.md`
  - `development/WP-E13-06-Hydration-Performance-Warning-schliessen.md`
  - `catalog/epic13-hydration-performance-closure.js`
  - `tests/platform/epic13_hydration_performance_closure_suite.js`
  - `docs/hydration-performance-closure.md`
  - `.xtend-test-results/xtend-hydration-performance-closure-report.json`
- Gate:
  - `node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json`
- Ergebnis:
  - `xtend.component.hydrate` liegt mit `31ms` unter dem unveraenderten `32ms` Budget
  - Closure Mode: `owner-free-closure`
  - `performance-regression` erwartet fuer RC1 `warnCount === 0`
  - es bleibt kein Hydration Owner-Residual uebrig
  - `private: true` bleibt Pflicht
  - `WP-E13-07` und `WP-E13-08` sind abgeschlossen; `WP-E13-09` ist startbar

## Handoff nach WP-E13-06

`WP-E13-06` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.hydration-performance-closure.v1`.

Erledigt:

- `development/XTend-Epic13-Hydration-Performance-Closure-Contract.md` beschreibt die owner-freie Schliessung von `xtend.component.hydrate` als `owner-free-closure`
- `catalog/epic13-hydration-performance-closure.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_hydration_performance_closure_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry und Performance-Baseline
- `docs/hydration-performance-closure.md` macht die Closure in der Docs-App sichtbar
- `tests/performance/baselines/local-performance-baseline.json` fuehrt `xtend.component.hydrate` mit `31ms`
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13HydrationPerformanceClosure`
- `WP-E13-07` und `WP-E13-08` sind `completed`; `WP-E13-09` ist `ready`

Naechstes Paket:

- `WP-E13-09` RMT-first App Production Readiness Gate buendeln

### WP-E13-07 - PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - lokale Browser-Smokes naeher an Live-Systeme bringen
- Bestehende Gates:
  - `npm run test:browser`
  - `npm run dev:local`
  - `npm run test:manifest-policy`
- Neue Arbeit:
  - CSP-/Nonce-/same-origin-Smoke
  - Loader Boot Promise und Manifest Policy in PROD-nahem HTML
  - keine externen CDN- oder Manifest-Pfade
- Zielartefakte:
  - `development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md`
  - `development/WP-E13-07-PROD-nahe-Browser-Local-Server-und-CSP-Smokes-vorbereiten.md`
  - `catalog/epic13-prod-browser-csp-smoke.js`
  - `tests/platform/epic13_prod_browser_csp_smoke_suite.js`
  - `tests/browser/fixtures/epic13-prod-csp-smoke.html`
  - `docs/prod-browser-csp-smokes.md`
- Gate:
  - `node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json`
  - `npm run test:epic13-prod-browser-csp-smoke`
  - `npm run dev:local:csp`
- Ergebnis:
  - Contract `xtend.epic13.prod-browser-csp-smoke.v1` ist akzeptiert
  - Fixture `xtend.epic13.prod-browser-csp-smoke-fixture.v1` laedt den Root-Loader same-origin mit Nonce
  - `scripts/serve_xtend_dev.js` kann einen PROD-aehnlichen CSP Header ausliefern
  - lokale Default-Gates bleiben browser-driver-frei und netzwerkfrei
  - `private: true` bleibt Pflicht
  - `WP-E13-08` ist abgeschlossen und `WP-E13-09` ist startbar

## Handoff nach WP-E13-07

`WP-E13-07` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.prod-browser-csp-smoke.v1`.

Handoff-Entscheidung: `rmt-first-production-readiness-bundling`.

Erledigt:

- `development/XTend-Epic13-PROD-Browser-CSP-Smoke-Contract.md` beschreibt CSP Header/Meta, Nonce, same-origin Manifest und Local-Server-Verhalten
- `catalog/epic13-prod-browser-csp-smoke.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_prod_browser_csp_smoke_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry, Fixture und Local-Server-CSP-Header
- `tests/browser/fixtures/epic13-prod-csp-smoke.html` bildet den PROD-nahen Shell-first Smoke ohne CDN und Importmap ab
- `scripts/serve_xtend_dev.js` unterstuetzt `--prod-csp` und `--csp <policy>`
- `docs/prod-browser-csp-smokes.md` macht den Smoke-Schnitt in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13ProdBrowserCspSmoke`
- `WP-E13-08` ist `completed`; `WP-E13-09` ist `ready`

Naechstes Paket:

- `WP-E13-09` RMT-first App Production Readiness Gate buendeln

### WP-E13-08 - Visual Screenshot/Pixels als RC1-Artefakt normalisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - DOM-first Snapshot Gate um optionales, reproduzierbares Screenshot-Artefakt fuer Release Owner ergaenzen
- Bestehende Gates:
  - `npm run test:visual-snapshots`
  - `npm run test:visual-snapshot-automation`
  - `npm run test:component-shell-theme-matrix`
- Neue Arbeit:
  - deterministische Viewports
  - Artefaktpfad und Naming
  - Pixel-Diff bleibt nicht Teil lokaler Default-Pflicht, bis Umgebung stabil ist
- Zielartefakte:
  - `development/XTend-Epic13-Visual-Owner-Artifact-Contract.md`
  - `development/WP-E13-08-Visual-Screenshot-Pixels-als-RC1-Artefakt-normalisieren.md`
  - `catalog/epic13-visual-owner-artifact.js`
  - `tests/platform/epic13_visual_owner_artifact_suite.js`
  - `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json`
  - `docs/visual-owner-artifacts.md`
- Gate:
  - `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json`
  - `npm run test:epic13-visual-owner-artifact`
- Ergebnis:
  - Contract `xtend.epic13.visual-owner-artifact.v1` ist akzeptiert
  - Manifest `xtend.epic13.visual-owner-artifact-manifest.v1` normalisiert Artifact Root, Report-Pfad, Screenshot-Template und Viewports
  - lokaler Gate bleibt `static-artifact-manifest-plus-dom-snapshot-gate`
  - Pixel-Diff und Screenshot-Erzeugung bleiben `optional-browser-driver-or-ci-artifact`
  - `private: true` bleibt Pflicht
  - `WP-E13-09` ist startbar

## Handoff nach WP-E13-08

`WP-E13-08` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.visual-owner-artifact.v1`.

Handoff-Entscheidung: `rmt-first-production-readiness-bundling`.

Erledigt:

- `development/XTend-Epic13-Visual-Owner-Artifact-Contract.md` beschreibt Manifest, Viewports, Artifact Root und optionale Screenshot-/Pixel-Erzeugung
- `catalog/epic13-visual-owner-artifact.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_visual_owner_artifact_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Steering, Registry und Manifest
- `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json` normalisiert die RC1-Artefaktpfade
- `docs/visual-owner-artifacts.md` macht den Owner-Artefakt-Schnitt in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13VisualOwnerArtifact`
- `WP-E13-09` ist `completed`

Naechstes Paket:

- `WP-E13-09` RMT-first App Production Readiness Gate buendeln

### WP-E13-09 - RMT-first App Production Readiness Gate buendeln

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - alle RMT-first App-Faehigkeiten in einen RC1-Gate-Schnitt bringen
- Bestehende Gates:
  - `npm run test:rmt-compatibility`
  - `npm run test:rmt-first-class-app`
  - `npm run test:rmt-first-demo-app`
  - `npm run test:rmt-artifact-parity`
  - `npm run test:rmt-component-fabric-ingestion`
  - `npm run test:rmt-component-lifecycle-telemetry`
- Neue Arbeit:
  - RC1 Report fuer App Shell, Routing, Components, Fabric, Lanes und Diagnostics
  - keine XTend-Typimporte in den RMT Kernel
- Akzeptierter Contract:
  - `xtend.epic13.rmt-production-readiness.v1`
- Artefakte:
  - `development/XTend-Epic13-RMT-Production-Readiness-Contract.md`
  - `development/WP-E13-09-RMT-first-App-Production-Readiness-Gate-buendeln.md`
  - `catalog/epic13-rmt-production-readiness.js`
  - `tests/platform/epic13_rmt_production_readiness_suite.js`
  - `docs/rmt-production-readiness.md`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json`
- Handoff:
  - `WP-E13-10` ist `ready`
  - Handoff-Entscheidung: `docs-app-rmt-parsedown-production-hardening`

### WP-E13-10 - Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Docs-App als echte Shell-first RMT-App weiter stabilisieren
- Bestehende Gates:
  - `npm run test:docs-rmt-pilot`
  - `npm run test:browser`
- Neue Arbeit:
  - Parsedown bleibt orchestrierte Komponente
  - Rich HTML und spaetere Medien-Slots bleiben RMT-schedulbar
  - keine Vermischung von Parsedown-Templating und RMT-Kernel
- Artefakte:
  - `development/XTend-Epic13-Docs-RMT-Production-Hardening-Contract.md`
  - `development/WP-E13-10-Docs-App-RMT-Parsedown-Shell-fuer-PROD-nahe-Erweiterungen-haerten.md`
  - `catalog/epic13-docs-rmt-production-hardening.js`
  - `tests/platform/epic13_docs_rmt_production_hardening_suite.js`
  - `docs/docs-rmt-production-hardening.md`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`
- Handoff:
  - `WP-E13-11` ist `completed`
  - `WP-E13-12` ist `completed`
  - `WP-E13-13` ist `ready`
  - Handoff-Entscheidung: `rc1-gate-matrix-ci-handoff`

### WP-E13-11 - Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Sanitizing-, Trusted-DOM- und RMT-HTML-Fragment-Regeln PROD-nah pruefen
- Bestehende Gates:
  - `npm run test:manifest-policy`
  - `npm run test:docs-rmt-pilot`
  - `npm run test:browser`
- Neue Arbeit:
  - Browser-Smoke fuer untrusted Parsedown/RMT HTML
  - keine Event-Handler- oder Script-Injektion ueber Content
- Artefakte:
  - `development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md`
  - `development/WP-E13-11-Trusted-DOM-Parsedown-und-RMT-HTML-Boundary-browsernah-pruefen.md`
  - `catalog/epic13-trusted-dom-boundary.js`
  - `tests/platform/epic13_trusted_dom_boundary_suite.js`
  - `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`
  - `docs/trusted-dom-boundary-browser-proof.md`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`
- Contract:
  - `xtend.epic13.trusted-dom-boundary.v1`
- Handoff:
  - `WP-E13-12` ist `completed`
  - `WP-E13-13` ist `ready`
  - Handoff-Entscheidung: `rc1-gate-matrix-ci-handoff`

### WP-E13-12 - RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Konsumentenkommunikation fuer RC1 vorbereiten
- Bestehende Artefakte:
  - `CHANGELOG.md`
  - `README.md`
  - `development/XTend-Release-Checklist-und-SemVer-Policy.md`
  - `docs/enterprise-adoption.md`
- Neue Arbeit:
  - RC1-Migration Notes
  - SemVer-Klassifizierung
  - Breaking-/Non-Breaking-Entscheidung pro geaenderter Public Surface
- Artefakte:
  - `development/XTend-Epic13-RC1-Migration-Notes-und-SemVer-Entscheid.md`
  - `development/WP-E13-12-RC1-Migration-Notes-SemVer-Entscheid-und-Changelog-vorbereiten.md`
  - `catalog/epic13-rc1-migration-notes.js`
  - `tests/platform/epic13_rc1_migration_notes_suite.js`
  - `docs/rc1-migration-notes.md`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json`
- Contract:
  - `xtend.epic13.rc1-migration-notes-semver.v1`
- Handoff:
  - `WP-E13-13` ist `ready`
  - Handoff-Entscheidung: `rc1-gate-matrix-ci-handoff`

### WP-E13-13 - RC1 Gate Matrix und CI-Handoff erstellen

- Prioritaet: `P2`
- Status: `ready`
- Ziel:
  - die RC0 Matrix zu einer RC1 Matrix erweitern
- Bestehende Gates:
  - `npm run test:rc0-gate-matrix`
  - `npm run test:release:full:report`
  - `npm run test:pr:report`
- Neue Arbeit:
  - Contract `xtend.epic13.rc1-gate-matrix.v1`
  - RC1 Pflicht-, Conditional- und Owner-Gates
  - CI-Handoff fuer PR, Full Release, Nightly und Release Owner Review

### WP-E13-14 - Epic-13-Abschlussreview und RC1-Handoff erstellen

- Prioritaet: `P2`
- Status: `planned`
- Ziel:
  - Epic 13 fachlich abschliessen und RC1 entscheidungsreif machen
- Neue Arbeit:
  - Contract `xtend.epic13.rc1-handoff.v1`
  - Report `xtend.epic13.rc1-handoff-report.v1`
  - Entscheidung `rc1-production-candidate-ready`
  - Publish Boundary bleibt bis zur Owner Acceptance geschlossen

## Naechster Schritt

## Handoff nach WP-E13-09

`WP-E13-09` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.rmt-production-readiness.v1`.

Handoff-Entscheidung: `docs-app-rmt-parsedown-production-hardening`.

Erledigt:

- `development/XTend-Epic13-RMT-Production-Readiness-Contract.md` beschreibt das RC1-Buendel aus App Shell, Routing, Components, Fabric, Lanes, Diagnostics und Artifact Parity
- `catalog/epic13-rmt-production-readiness.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_rmt_production_readiness_suite.js` prueft Contract, Package, Scaffold, Runner, RMT-Fixtures, Docs, Steering und Kernel Boundary
- `docs/rmt-production-readiness.md` macht den RMT-first PROD-Pfad in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13RmtProductionReadiness`
- `WP-E13-10` ist `ready`

Naechstes Paket:

- `WP-E13-10` Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten

## Handoff nach WP-E13-10

`WP-E13-10` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.docs-rmt-production-hardening.v1`.

Handoff-Entscheidung: `trusted-dom-parsedown-rmt-html-boundary-browser-proof`.

Erledigt:

- `development/XTend-Epic13-Docs-RMT-Production-Hardening-Contract.md` beschreibt Extension-Slots, Schedules, Parsedown-Host-Boundary und Diagnostics
- `catalog/epic13-docs-rmt-production-hardening.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_docs_rmt_production_hardening_suite.js` prueft Contract, Package, Scaffold, Runner, RMT-Dokument, Docs Host, PageLoader, Docs und Steering
- `docs/xtendrmt-parsedown-docs.rmt` enthaelt `productionHardening`, `extensionSlots` und den Diagnostics-Slot
- `docs/utils/pageloader.js` erzeugt `window.xtendDocsRmtProductionLastRender`
- `docs/docs-rmt-production-hardening.md` macht den PROD-nahen Docs-App-Pfad in der Docs-App sichtbar
- `WP-E13-11` ist `completed`
- `WP-E13-12` ist `completed`
- `WP-E13-13` ist `completed`
- `WP-E13-14` ist `ready`

Naechstes Paket:

- `WP-E13-14` Epic-13-Abschlussreview und RC1-Handoff erstellen

## Handoff nach WP-E13-11

`WP-E13-11` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.trusted-dom-boundary.v1`.

Handoff-Entscheidung: `rc1-migration-notes-semver-changelog`.

Erledigt:

- `development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md` beschreibt Parsedown HTML, RMT HTML-Fragmente, Sanitizer, Fixture, CSP-Anschluss und Kernel Boundary
- `catalog/epic13-trusted-dom-boundary.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_trusted_dom_boundary_suite.js` prueft Contract, Package, Scaffold, Runner, Docs Host, PageLoader, Browser-Fixture, Docs und Steering
- `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html` prueft Script-, Handler-, URL- und `srcdoc`-Payloads gegen den Docs-Content-Sink
- `docs/trusted-dom-boundary-browser-proof.md` macht den Trusted-DOM-Beweis in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13TrustedDomBoundary`
- `WP-E13-12` ist `completed`
- `WP-E13-13` ist `completed`
- `WP-E13-14` ist `ready`

Naechstes Paket:

- `WP-E13-14` Epic-13-Abschlussreview und RC1-Handoff erstellen

## Handoff nach WP-E13-12

`WP-E13-12` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.rc1-migration-notes-semver.v1`.

Handoff-Entscheidung: `rc1-gate-matrix-ci-handoff`.

Erledigt:

- `development/XTend-Epic13-RC1-Migration-Notes-und-SemVer-Entscheid.md` beschreibt SemVer-Entscheid, Migration Sections, Changelog-Pflichten und Publish Boundary
- `catalog/epic13-rc1-migration-notes.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_rc1_migration_notes_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Changelog, CI Matrix und Handoff
- `docs/rc1-migration-notes.md` macht die RC1 Migration Notes in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13Rc1MigrationNotes`
- `./design-tokens/xtheme-token-alias-layer`, `./catalog/epic13-rc1-migration-notes`, `./catalog/epic13-rc1-gate-matrix-ci-handoff`, `./catalog/epic13-release-report-pack-dry-run-evidence`, `./catalog/epic13-conditional-network-evidence-ci`, `./rmt-language/kernel-trust-authority`, `./rmt-language/kernel-security-regression`, `./catalog/epic14-rmt-tooling`, `./catalog/epic14-lsp-handoff` und die RMT/vNext-Tooling-Surface sind im Package Export Lock enthalten; expectedExportCount ist `115`
- `WP-E13-13` ist `completed`
- `WP-E13-14` ist `ready`

Naechstes Paket:

- `WP-E13-14` Epic-13-Abschlussreview und RC1-Handoff erstellen

## Handoff nach WP-E13-13

`WP-E13-13` ist abgeschlossen und akzeptiert den Contract `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`.

Handoff-Entscheidung: `epic13-final-rc1-handoff`.

Erledigt:

- `development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md` beschreibt Source Gates, CI Lanes, Report-Artefakte, Referenzpfade und Publish Boundary
- `catalog/epic13-rc1-gate-matrix-ci-handoff.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic13_rc1_gate_matrix_ci_handoff_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Changelog, CI Matrix, TypeExports und Handoff
- `node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json` ist der lokale Gate
- `docs/rc1-gate-matrix-ci-handoff.md` macht die RC1 Gate Matrix in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `epic13Rc1GateMatrixCiHandoff`
- `WP-E13-14` ist `ready`

Naechstes Paket:

- `WP-E13-14` Epic-13-Abschlussreview und RC1-Handoff erstellen
