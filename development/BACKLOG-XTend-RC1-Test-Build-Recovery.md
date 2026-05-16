# Backlog - XTend RC1 Test-Build Recovery

- Status: `ready`
- Datum: 16. Mai 2026
- Contract: `xtend.rc1.test-build-recovery-backlog.v1`
- Zielzustand: `rc1-1-0-test-build-ready`
- Release Candidate: `RC1`
- Versionierungsziel: `0.1.0-rc.1` als technischer Vorlauf fuer `1.0`
- Anlass: lokaler RC1-Readiness-Check vom 16. Mai 2026
- Boundary: `private-true-until-release-owner-acceptance`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `no-network-required-for-local-default-gates`
- Boundary: `no-publish-from-test-build-recovery`
- Bezug:
  - `development/XTend-Epic13-RC1-Readiness-Modell.md`
  - `development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md`
  - `development/XTend-Epic13-Release-Owner-Acceptance-Contract.md`
  - `development/XTend-Epic13-Conditional-Network-Evidence-Contract.md`
  - `development/XTend-Epic13-Package-Export-Lock-Contract.md`
  - `development/XTend-Epic13-Release-Report-und-Pack-Dry-Run-Evidence.md`
  - `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md`
  - `development/XTendRMT-vNext-Release-Handoff-Contract.md`
  - `development/WP-E17-04-RMT-vNext-App-Build-Pipeline-und-1-0-Gate.md`
  - `docs/rc1-readiness.md`
  - `docs/rc1-gate-matrix-ci-handoff.md`
  - `xtendrmt/rmt-vnext-reference-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`

## Zweck

Dieses Backlog schneidet die noch offenen Schritte fuer den ersten belastbaren RC1-Test-Build. Der vNext-Reference-Pfad ist lokal gruen, aber die RC1-Release-Kette ist noch nicht test-build-ready.

Der Backlog priorisiert daher keine neuen Produktfeatures, sondern die Wiederherstellung der Release-Hygiene:

- Konfliktmarker und Demo-Drift entfernen
- RMT-Kompatibilitaet fuer die Bestcase-Demo wiederherstellen
- RC0-Handoff- und Coverage-Baseline reparieren
- Epic-13-Source-Gates wieder gruen machen
- Pack-Dry-Run, Release Report und Owner-Evidence reproduzierbar erzeugen
- finalen RC1-Test-Build-Schnitt ohne Publish freigeben

## Ausgangsbefund vom 16. Mai 2026

| Bereich | Lokales Ergebnis | Bewertung |
|---------|------------------|-----------|
| `npm run test:rmt-vnext-release` | passed | vNext Reference Demo ist releasefaehig |
| `npm run test:rmt-compatibility` | failed | Bestcase-Demo-Migration ist nicht sauber abgeschlossen |
| `npm run test:epic12-rc0-handoff` | failed | RC0-Baseline enthaelt `rc0KpiFailed = 1` |
| `npm run test:epic13-rc1-readiness` | failed | RC1-Readiness konsumiert die rote RC0-Baseline |
| `npm run test:epic13-rc1-gate-matrix-ci-handoff` | failed | Epic-13-Source-Gates validieren nicht durchgaengig |
| `npm run pack:dry-run` | report `ok: false` | Package Export Lock haengt an Conditional Network Evidence |
| `conflict-marker-scan` | Treffer in RMT-, JS- und Doku-Dateien | Release-Hygiene blockiert |
| `git status --short` | lokale Aenderung in `tools/rmt-editor/vscode/package.json` | Publisher-/License-Intent muss entschieden werden |

## Leitplanken

- Kein Publish und keine Registry-Aktion im Recovery-Backlog.
- `package.json` ist fuer RC1-Publish-Prep auf `private: false` gesetzt; `npm publish` bleibt ein manueller Owner-Schritt.
- Netzwerk-Gates duerfen lokal deferral-faehig bleiben; fuer Publish muessen Audit/SBOM ausgefuehrt oder owner-akzeptiert deferiert sein.
- Konfliktaufloesungen muessen fachlich entschieden werden, nicht mechanisch per "ours/theirs".
- Die vNext Reference Demo bleibt Source of Truth fuer neue Syntax; die Bestcase-Demo muss kompatibel migriert werden.
- RMT Kernel, XTend UI, Fabric und Surface Runtime behalten ihre bestehenden Boundaries.
- Release-Hygiene geht vor neuen Features.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- betroffene Dateien und Gates benannt sind
- erwartetes Validierungskommando klar ist
- Konfliktmarker oder Drift reproduzierbar nachweisbar sind
- keine fremden lokalen Aenderungen ueberschrieben werden
- Release-/Publish-Boundary unveraendert bleibt

## Priorisierungslogik

- `P0`: blockiert lokale RC1-Readiness, RMT-Kompatibilitaet oder Pack-Dry-Run
- `P1`: blockiert Owner Evidence, Release Report oder CI-Handoff
- `P2`: finalisiert Handoff, Changelog, Registry und Test-Build-Notizen

## Statuslogik

- `ready`: kann sofort gestartet werden
- `next`: fachlich naechster Schritt nach einem P0-Blocker
- `planned`: Teil des Test-Build-Schnitts, aber noch nicht unmittelbar startbar
- `blocked`: wartet auf benannte Gate- oder Owner-Entscheidung
- `completed`: Zielartefakt ist erstellt und gatebar

## Naechste startbare Workpackages

| ID | Grund |
|----|-------|
| `RC1PUB-WP-01` | Owner-Publish-Entscheid ist als `accepted-for-publish-prep` dokumentiert; Audit/SBOM, License, Version und `private: false` sind akzeptiert; Publish-Befehl bleibt manuell |

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `RC1TB-WP-01` | P0 | completed | WS0 | Merge-Konflikte und Workspace-Hygiene fuer RC1 bereinigen | - |
| `RC1TB-WP-02` | P0 | completed | WS1 | Bestcase-Demo auf vNext-kompatiblen RMT/Core-Pfad stabilisieren | `RC1TB-WP-01` |
| `RC1TB-WP-03` | P0 | completed | WS2 | RC0-Handoff und Catalog Coverage wieder gruen machen | `RC1TB-WP-01` |
| `RC1TB-WP-04` | P0 | completed | WS3 | Epic-13-Readiness-Source-Gate-Kette reparieren | `RC1TB-WP-03` |
| `RC1TB-WP-05` | P1 | completed | WS4 | Conditional Network Evidence und Pack-Dry-Run Evidence finalisieren | `RC1TB-WP-04` |
| `RC1TB-WP-06` | P1 | completed | WS5 | RC1 Gate Matrix, Release Report und Type-Export-Gates durchlaufen lassen | `RC1TB-WP-04`, `RC1TB-WP-05` |
| `RC1TB-WP-07` | P2 | completed | WS6 | RC1 Test-Build-Handoff und Changelog-Schnitt schreiben | `RC1TB-WP-06` |
| `RC1TB-WP-08` | P2 | completed | WS7 | Release Owner Test-Build Acceptance vorbereiten | `RC1TB-WP-07` |
| `RC1PUB-WP-01` | P0 | ready-for-final-publish-run | WS8 | Release Owner Publish Decision abschliessen | `RC1TB-WP-08` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Repository-Hygiene, Konfliktmarker, lokale Intent-Entscheidungen |
| WS1 | RMT Bestcase-Demo, vNext-Core-Projektion und Kompatibilitaetsgate |
| WS2 | RC0-Handoff, Catalog Coverage und Baseline-Snapshots |
| WS3 | Epic-13-Source-Gates und RC1-Readiness |
| WS4 | Netzwerk-Evidence, Deferrals und Package Export Lock |
| WS5 | Release Report, Type Exports, Gate Matrix und CI-Handoff |
| WS6 | Test-Build-Dokumentation, Changelog und Referenzpfade |
| WS7 | Owner Acceptance ohne Publish |
| WS8 | Owner-Publish-Entscheid und Publish-Blocker |

## Workpackages im Detail

### RC1TB-WP-01 - Merge-Konflikte und Workspace-Hygiene fuer RC1 bereinigen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - alle echten Conflict Marker entfernen und lokale RC1-Intent-Aenderungen sichtbar entscheiden
- Scope:
  - `xtendrmt/xtendrmt-bestcase-demo.rmt`
  - `xtendrmt/xtendrmt-bestcase-demo.js`
  - `tests/rmt/README.md`
  - `docs/xtendrmt-migration-guide.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - lokale Aenderung in `tools/rmt-editor/vscode/package.json`
- Nicht im Scope:
  - mechanisches Ruecksetzen fremder lokaler Aenderungen
  - Publish-Metadaten ohne Owner-Entscheidung
- Validierung:
  - `rg -n "\x3c{7}|\x3d{7}|\x3e{7}" xtendrmt docs development tests --glob '!components/prism.js'`
  - `git status --short --branch`
- Definition of Done:
  - keine Conflict Marker ausser bekannten Vendor-/Syntax-Fixtures
  - Publisher-/License-Aenderung der VS-Code-Bridge ist bewusst akzeptiert, angepasst oder separat geparkt
  - keine unbeabsichtigten Release-Dateien im Workspace

## Handoff nach RC1TB-WP-01

`RC1TB-WP-01` ist abgeschlossen.

Erledigt:

- echte Merge-Konfliktmarker in `xtendrmt/xtendrmt-bestcase-demo.rmt`, `xtendrmt/xtendrmt-bestcase-demo.js`, `tests/rmt/README.md`, `docs/xtendrmt-migration-guide.md` und `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` entfernt
- Bestcase-Demo fachlich auf die vNext-Seite der Konflikte aufgeloest
- Backlog-Validierung so formuliert, dass der Marker-Scan keine Dokumentationsbeispiele als False Positive findet
- lokale Publisher-/License-Aenderung in `tools/rmt-editor/vscode/package.json` bewusst separat geparkt und nicht ueberschrieben

Validierung:

- `rg -n "\x3c{7}|\x3d{7}|\x3e{7}" xtendrmt docs development tests --glob '!components/prism.js'`
- `git status --short --branch`

Zusatzpruefung:

- `git diff --check` passiert
- `npm run test:rmt-vnext-release` passiert
- `npm run test:rmt-compatibility` passiert nach der Konfliktbereinigung
- `npm run test:references` bleibt rot wegen bestehender Scaffold-/Catalog-Baseline-Themen und geht an `RC1TB-WP-03`

Naechstes primaeres Paket:

- `RC1TB-WP-03` RC0-Handoff und Catalog Coverage wieder gruen machen

### RC1TB-WP-02 - Bestcase-Demo auf vNext-kompatiblen RMT/Core-Pfad stabilisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - die alte Bestcase-Demo fachlich auf die vNext-Migration bringen, ohne den gruenen Reference-Demo-Pfad zu brechen
- Scope:
  - `.rmt`-Quelle mit vNext-Template-Syntax
  - stabile Core-Projektion oder dokumentierter Projection-Adapter
  - `DEMO_CORE_DOCUMENT_URL` und Runtime-Fallbacks in `xtendrmt-bestcase-demo.js`
  - Doku- und README-Aussagen zur Migration
- Validierung:
  - `npm run test:rmt-compatibility`
  - `npm run test:rmt-vnext-release`
  - optional browsernahes Bestcase-Demo-Smoke, falls vorhanden
- Definition of Done:
  - `rmt-compatibility` passiert
  - `rmt-vnext-release` bleibt gruen
  - Bestcase-Demo enthaelt keine Legacy-/vNext-Doppelstruktur mehr

## Handoff nach RC1TB-WP-02

`RC1TB-WP-02` ist abgeschlossen.

Erledigt:

- Bestcase-Demo nutzt nach `RC1TB-WP-01` eine reine RMT-vNext-Authoring-Quelle statt Legacy-JSON-Konfliktzustand
- Runtime-Pfad in `xtendrmt/xtendrmt-bestcase-demo.js` nutzt `DEMO_CORE_DOCUMENT_URL` und projiziert vNext-Core auf Adapter, Components, Routes und Schedules
- Doku- und Test-README-Aussagen beschreiben die vNext-Bestcase-Migration und die native Runtime-Projektion konsistent

Validierung:

- `npm run test:rmt-compatibility` passiert
- `npm run test:rmt-vnext-release` passiert
- `npm run test:browser` passiert ausserhalb der Sandbox; der erste Sandbox-Lauf blockierte nur den lokalen Testserver mit `listen EPERM`

Naechstes primaeres Paket:

- `RC1TB-WP-03` RC0-Handoff und Catalog Coverage wieder gruen machen

### RC1TB-WP-03 - RC0-Handoff und Catalog Coverage wieder gruen machen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - die RC0-Baseline wieder als gruene Quelle fuer RC1 herstellen
- Scope:
  - `catalog-contract-coverage` Failed-KPI analysieren
  - Coverage-Snapshots aktualisieren oder fehlende Artefakte nachziehen
  - Abweichungen bei Manifest Entries, Docs, Component Suites, Fixtures und Types klaeren
- Validierung:
  - `npm run test:catalog-coverage`
  - `npm run test:epic12-rc0-handoff`
  - `node scripts/run_xtend_tests.js epic12-rc0-handoff --json`
- Definition of Done:
  - `rc0KpiFailed === 0`
  - `epic12-rc0-handoff` passiert
  - RC0-Handoff bleibt `ready-for-release-owner-review-not-publish`

## Handoff nach RC1TB-WP-03

`RC1TB-WP-03` ist abgeschlossen.

Erledigt:

- `x-rmt-lifecycle-demo-build` als vollstaendigen Catalog-Eintrag geschlossen: Docs, Component-Suite, Fixture und Public Types ergaenzt
- Component Catalog Coverage von 41 auf 42 Manifest-Eintraege aktualisiert
- Catalog-, Regression-, RC0- und Reference-Snapshots auf 42 Manifest-Eintraege, 40 `enterprise-ready`, 1 `contract-gated` und 1 `typed-contract-gated` gebracht
- Scaffold-Reference-Baseline auf `dry-run-first-but-write-capable` und WritePlan-/Manifest-Patch-/Build-Report-Output aktualisiert
- bestehende lokale Publisher-/License-Aenderung in `tools/rmt-editor/vscode/package.json` weiterhin nicht veraendert

Validierung:

- `npm run test:catalog-coverage` passiert
- `npm run test:epic12-rc0-handoff` passiert
- `node scripts/run_xtend_tests.js epic12-rc0-handoff --json` passiert, `failed = 0`, `manifestEntries = 42`
- `npm run test:regression-priority` passiert
- `node scripts/run_xtend_tests.js components --json` passiert
- `npm run test:component-long-tail-migration` passiert
- `npm run test:epic11-enterprise-ux-handoff` passiert
- `npm run test:references` passiert

Naechstes primaeres Paket:

- `RC1TB-WP-04` Epic-13-Readiness-Source-Gate-Kette reparieren

### RC1TB-WP-04 - Epic-13-Readiness-Source-Gate-Kette reparieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - die von RC0 abhaengigen Epic-13-Gates wieder validierbar machen
- Scope:
  - `epic13-rc1-readiness`
  - `epic13-release-owner-acceptance`
  - `epic13-conditional-network-evidence`
  - `epic13-package-export-lock`
  - alle weiteren Source-Gates aus der RC1 Gate Matrix
- Validierung:
  - `npm run test:epic13-rc1-readiness`
  - `npm run test:epic13-release-owner-acceptance`
  - `npm run test:epic13-conditional-network-evidence`
  - `npm run test:epic13-package-export-lock`
  - `npm run test:epic13-rc1-gate-matrix-ci-handoff`
- Definition of Done:
  - Epic-13-Source-Gates validieren lokal ohne Network-Pflicht
  - Publish bleibt blockiert
  - Handoff zeigt weiterhin nach Owner Acceptance, nicht direkt zu Publish

## Handoff nach RC1TB-WP-04

`RC1TB-WP-04` ist abgeschlossen.

Erledigt:

- Epic-13-Readiness konsumiert die wieder gruene RC0-/Catalog-Baseline aus `RC1TB-WP-03`
- Release Owner Acceptance, Conditional Network Evidence, Package Export Lock und RC1 Gate Matrix validieren lokal
- alle zusaetzlichen Epic-13-Source-Gates aus der RC1 Gate Matrix direkt geprueft
- Publish-Boundary bleibt unveraendert `private-until-release-owner-acceptance`
- die beiden browsernahen lokalen Server-Probes wurden ausserhalb der Sandbox ausgefuehrt, weil die Sandbox `127.0.0.1`-Bind mit `listen EPERM` blockiert

Validierung:

- `npm run test:epic13-rc1-readiness` passiert
- `npm run test:epic13-release-owner-acceptance` passiert
- `npm run test:epic13-conditional-network-evidence` passiert
- `npm run test:epic13-package-export-lock` passiert
- `npm run test:epic13-rc1-gate-matrix-ci-handoff` passiert
- `npm run test:epic13-known-residual-triage` passiert
- `npm run test:epic13-hydration-performance-closure` passiert
- `npm run test:epic13-prod-browser-csp-smoke` passiert ausserhalb der Sandbox
- `npm run test:epic13-visual-owner-artifact` passiert
- `npm run test:epic13-rmt-production-readiness` passiert
- `npm run test:epic13-docs-rmt-production-hardening` passiert
- `npm run test:epic13-trusted-dom-boundary` passiert ausserhalb der Sandbox
- `npm run test:epic13-rc1-migration-notes` passiert

Naechstes primaeres Paket:

- `RC1TB-WP-07` RC1 Test-Build-Handoff und Changelog-Schnitt schreiben

### RC1TB-WP-05 - Conditional Network Evidence und Pack-Dry-Run Evidence finalisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Package Dry Run und Export Surface Lock als reproduzierbare RC1-Evidence bereitstellen
- Scope:
  - `.xtend-test-results/xtend-pack-dry-run.json`
  - `.xtend-test-results/xtend-package-export-surface-lock.json`
  - `.xtend-test-results/xtend-package-export-lock-report.json`
  - Audit-/SBOM-Deferral oder owner-approved Ausfuehrung; im RC1PUB-Folgepaket inzwischen ausgefuehrt und akzeptiert
- Ergebnis:
  - `npm run conditional-network:evidence` erzeugt formale Evidence-Artefakte fuer `npm-audit-moderate` und `npm-sbom-json`; aktueller RC1PUB-Stand ist `executed: 2`, `deferred: []`
  - `npm run pack:dry-run` erzeugt frische Pack-/Export-Lock-Artefakte mit `ok: true`, `exportCount: 115` und `packFileCount: 664`
  - Pack-Dateiliste ist frei von Conflict-Artefakten
- Validierung:
  - `npm run pack:dry-run`
  - `npm run test:epic13-package-export-lock`
  - `npm run test:epic13-release-report-pack-dry-run-evidence`
  - `npm run test:epic13-conditional-network-evidence`
  - `npm run test:epic13-conditional-network-evidence-ci`
  - bei Owner-Freigabe: `npm audit --audit-level=moderate --json` und `npm sbom --sbom-format=cyclonedx --json`
- Definition of Done:
  - Pack-Dry-Run-Report meldet `ok: true`
  - Conditional Network Evidence ist ausgefuehrt oder formal owner-deferred
  - Pack-Dateiliste enthaelt keine Conflict-Artefakte
- Handoff:
  - Owner-/Netzwerkpflichtige Audit- und SBOM-Laeufe sind im RC1PUB-Folgepaket ausgefuehrt und akzeptiert
  - naechstes primaeres Paket: `RC1TB-WP-06`

### RC1TB-WP-06 - RC1 Gate Matrix, Release Report und Type-Export-Gates durchlaufen lassen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - den vollen lokalen Test-Build-Schnitt mit maschinenlesbaren Reports erzeugen
- Scope:
  - RC1 Gate Matrix
  - Release Full Report
  - Type Exports Release Gate
  - RMT vNext Release Gate
  - Browser-/A11y-/Performance-/Security-Gates aus der bestehenden Matrix
- Ergebnis:
  - `components/x-rmt-lifecycle-demo.d.ts` ergaenzt, damit der TypeExports-Vendor-Gate keine Component-Declaration-Gap mehr meldet
  - `.xtend-test-results/xtend-type-exports-report.json` meldet `status: passed` fuer 8 TypeExports-Suites
  - `.xtend-test-results/xtend-release-gate-report.json` meldet `status: passed` fuer 175 Release-Suites
  - `.xtend-test-results/xtend-release-report.json` meldet `status: passed` fuer 175 Release-Suites
  - `.xtend-test-results/xtend-pr-gate-report.json` meldet `status: passed` fuer 43 PR-Suites
  - Pack-Dry-Run nach der neuen Declaration erneut ausgefuehrt; Export-Lock-Report meldet `ok: true`, `exportCount: 115`, `packFileCount: 658`
  - Pack-Dry-Run nach Apache-2.0-Lizenzdatei erneut ausgefuehrt; Export-Lock-Report meldet `ok: true`, `exportCount: 115`, `packFileCount: 659`
  - Pack-Dry-Run nach der scoped Package-Matrix erneut ausgefuehrt; Export-Lock-Report meldet `ok: true`, `exportCount: 115`, `packFileCount: 664`
- Validierung:
  - `npm run test:epic13-rc1-gate-matrix-ci-handoff`
  - `npm run test:type-exports:release`
  - `npm run test:rmt-vnext-release`
  - `npm run test:release:full:report`
  - `npm run test:pr:report`
  - `npm run release:report`
  - `npm run pack:dry-run`
  - `npm run test:epic13-release-report-pack-dry-run-evidence`
- Definition of Done:
  - lokale Reports liegen unter `.xtend-test-results/`
  - alle required Gates sind gruen oder explizit owner-deferred
  - Test-Build bleibt private und unveroeffentlicht
- Handoff:
  - lokale Browser-/Server-Gates wurden ausserhalb der Sandbox ausgefuehrt, weil die Sandbox `127.0.0.1`-Bind mit `listen EPERM` blockiert
  - Audit-/SBOM-Netzwerklaeufe sind im RC1PUB-Folgepaket ausgefuehrt und akzeptiert
  - naechstes primaeres Paket: `RC1TB-WP-07`

### RC1TB-WP-07 - RC1 Test-Build-Handoff und Changelog-Schnitt schreiben

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - den ersten RC1-Test-Build als nachvollziehbaren, nicht-publishenden Schnitt dokumentieren
- Scope:
  - Test-Build-Notiz mit Datum, Commit, Gate-Reports und offenen Owner-Entscheidungen
  - Changelog-Abschnitt fuer `0.1.0-rc.1`
  - Referenzpfade fuer RMT vNext und Bestcase-Demo
  - Hinweis auf Publish Boundary und den spaeteren Owner-Schritt
- Ergebnis:
  - `development/XTend-RC1-Test-Build-Handoff.md` unter `xtend.rc1.test-build-handoff.v1` ergaenzt
  - Handoff enthaelt Datum `2026-05-16`, Commit-Basis `4e0ae07`, Gate-Reports, Pack Dry Run Evidence, Conditional Network Evidence und offene Owner-Entscheidungen
  - `CHANGELOG.md` enthaelt den nicht publishenden Abschnitt `0.1.0-rc.1 Test-Build - 2026-05-16`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` registriert die RMT vNext Reference Demo und die XTendRMT Bestcase Demo als Test-Build-Referenzpfade
  - Publish Boundary ist im RC1PUB-Folgepaket geoeffnet: `package.json` traegt `version: 0.1.0-rc.1`, `private: false`, `publishAllowed` fuer Prep `true`
- Validierung:
  - `npm run test:references`
  - `npm run test:epic13-rc1-migration-notes`
  - `npm run test:epic13-rc1-gate-matrix-ci-handoff`
- Definition of Done:
  - Test-Build-Handoff ist im Development-Bereich dokumentiert
  - Changelog und Referenzregistry enthalten keine alten RC0-Only-Aussagen fuer den Test-Build
  - Owner sieht klar, was getestet werden darf und was noch nicht published werden darf
- Handoff:
  - Release Owner Acceptance kann auf dem dokumentierten Test-Build-Schnitt aufsetzen
  - naechstes primaeres Paket: `RC1TB-WP-08`

### RC1TB-WP-08 - Release Owner Test-Build Acceptance vorbereiten

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Release Owner kann den RC1-Test-Build akzeptieren, deferieren oder blockieren
- Abhaengigkeit:
  - `RC1TB-WP-07`
- Scope:
  - Owner Checklist
  - Gate Report Bundle
  - Network Evidence oder Deferral
  - Package Dry Run Evidence
  - SemVer- und Publish-Boundary-Entscheidung
- Ergebnis:
  - `development/XTend-RC1-Test-Build-Owner-Acceptance.md` unter `xtend.rc1.test-build-owner-acceptance.v1` ergaenzt
  - Entscheidung dokumentiert: `accepted-for-internal-test-build-not-publish`
  - interne Testnutzung fuer RMT vNext Reference Demo, XTendRMT Bestcase Demo, Gate-Reports, TypeExports und Pack Dry Run Evidence freigegeben
  - `npm-audit-moderate` und `npm-sbom-json` wurden im nachgelagerten RC1PUB-Schritt ausgefuehrt und fuer die Owner-Publish-Evidence akzeptiert
  - `docs/release-owner-acceptance.md`, `development/XTend-RC1-Test-Build-Handoff.md`, `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` und `CHANGELOG.md` referenzieren den Acceptance-Schnitt
  - Publish Boundary ist im RC1PUB-Folgepaket fuer Prep geoeffnet: `private: false`, `publishAllowed: true`, `automaticPublishApproval: false`
- Validierung:
  - `npm run test:epic13-release-owner-acceptance`
  - `npm run test:epic13-release-report-pack-dry-run-evidence`
  - Zusatzvalidierung: `npm run test:references`
- Definition of Done:
  - Owner-Entscheidung ist dokumentiert
  - Test-Build kann intern verwendet werden
  - Publish bleibt bis zur separaten Freigabe blockiert
- Handoff:
  - RC1 Test-Build Recovery Backlog ist abgeschlossen
  - ein echter Publish braucht einen separaten Release-Owner-Publish-Entscheid; Audit/SBOM, Version, Scoped-Manifests und Package Boundary sind fuer Publish Prep akzeptiert

### RC1PUB-WP-01 - Release Owner Publish Decision abschliessen

- Prioritaet: `P0`
- Status: `ready-for-final-publish-run`
- Ziel:
  - Release Owner entscheidet explizit, ob der RC1-Schnitt published, deferred oder blockiert wird
- Bereits angelegt:
  - `development/XTend-RC1-Release-Owner-Publish-Decision.md` unter `xtend.rc1.release-owner-publish-decision.v1`
- Aktueller Entscheid:
  - `accepted-for-publish-prep`
  - `publishAllowed: true`
  - `automaticPublishApproval: false`
  - `private: false`
  - Scoped Root Package: `@ccslabs/xtend`
- Ausstehend:
  - kein `npm publish` ausgefuehrt; der Publish-Befehl bleibt ein separater manueller Owner-Schritt
- Bereits entschieden:
  - `npm-audit-moderate` ist ausgefuehrt und meldet 0 Vulnerabilities
  - `npm-sbom-json` ist als CycloneDX `1.5` mit `Apache-2.0` License Evidence erzeugt
  - `package.json` und `tools/rmt-editor/vscode/package.json` tragen `license: Apache-2.0`
  - `xtendrmt/package.json`, `fabric/package.json`, `xtend-builder/package.json` und `tools/package.json` bilden die Teilpakete `@ccslabs/xtend-rmt`, `@ccslabs/xtend-fabric`, `@ccslabs/xtend-cli` und `@ccslabs/xtend-compiler` ab
  - `LICENSE` enthaelt Apache License 2.0
- Validierung vor einer Publish-Freigabe:
  - `npm run test:release:full:report`
  - `npm run release:report`
  - `npm run pack:dry-run`
  - `npm audit --audit-level=moderate --json` bei Bedarf erneut aktualisieren
  - `npm sbom --sbom-format=cyclonedx --json` bei Bedarf erneut aktualisieren
- Definition of Done:
  - Owner-Entscheid steht auf `accepted-for-publish-prep`
  - Version, License, Audit/SBOM, Scoped-Manifests und Package Boundary sind akzeptiert
  - Publish-Befehl bleibt bis zum finalen manuellen Owner-Check verboten

## RC1 Test-Build Gate Ladder

Die Gates sollten in dieser Reihenfolge laufen, damit Fehlerquellen nicht verdeckt werden:

1. `rg -n "\x3c{7}|\x3d{7}|\x3e{7}" xtendrmt docs development tests --glob '!components/prism.js'`
2. `npm run test:rmt-vnext-release`
3. `npm run test:rmt-compatibility`
4. `npm run test:catalog-coverage`
5. `npm run test:epic12-rc0-handoff`
6. `npm run test:epic13-rc1-readiness`
7. `npm run test:epic13-release-owner-acceptance`
8. `npm run test:epic13-conditional-network-evidence`
9. `npm run test:epic13-package-export-lock`
10. `npm run pack:dry-run`
11. `npm run test:epic13-rc1-gate-matrix-ci-handoff`
12. `npm run test:type-exports:release`
13. `npm run test:release:full:report`

## Test-Build Definition of Done

Der erste RC1-Test-Build ist bereit, wenn:

- keine echten Merge-Konfliktmarker im Release-Scope existieren
- `rmt-vnext-release` und `rmt-compatibility` gruen sind
- `epic12-rc0-handoff` wieder `rc0KpiFailed === 0` meldet
- `epic13-rc1-readiness` und `epic13-rc1-gate-matrix-ci-handoff` gruen sind
- `pack:dry-run` einen `ok: true` Export-Lock-Report erzeugt
- Release Report, Type Exports und References gruen sind
- Conditional Network Evidence ausgefuehrt oder owner-akzeptiert deferiert ist; aktueller RC1PUB-Stand ist ausgefuehrt und akzeptiert
- `package.json` fuer RC1-Publish-Prep `private: false` traegt
- Release Owner Acceptance den Test-Build erlaubt, aber Publish nicht automatisch oeffnet

## Nicht-Ziele

- keine Version `1.0.0` ohne separaten Release Owner Beschluss
- kein npm Publish
- keine neue RMT-vNext-Featurearbeit
- keine neue Surface-/Remote-Surface-Produktlinie
- keine Umgehung der Conditional Network Evidence
