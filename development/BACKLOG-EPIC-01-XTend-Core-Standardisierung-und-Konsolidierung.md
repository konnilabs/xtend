# Backlog zu Epic 01 - XTend Core-Standardisierung und Konsolidierung

- Status: Completed
- Datum: 24. Maerz 2026
- Bezug:
  - `development/EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`
  - `docs/XTend-ADR.md`
  - `compliance/digital-twin-principle.md`
  - `compliance/update-instructions.md`

## Zweck

Dieses Dokument zerlegt Epic 01 in konkrete Workpackages, die unmittelbar geplant und umgesetzt werden koennen. Der Backlog priorisiert zuerst Vertragsklarheit und Core-Stabilisierung, danach die technische Konsolidierung und zuletzt Test-/Doku-Haertung.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- Ziel, Scope und Zielartefakte klar sind
- die benoetigten Vorgaenger erledigt oder bewusst entkoppelt sind
- die betroffenen Kern-Dateien bekannt sind
- ein pruefbares Definition-of-Done vorliegt

## Priorisierungslogik

- `P0`: Blockiert den Epic-Fortschritt oder behebt Core-Vertragsbrueche
- `P1`: Stellt Kernfunktion oder Plattformkonsistenz her
- `P2`: Haertet, dokumentiert oder migriert bestehende Standards

## Statuslogik

- `ready`: kann sofort gestartet werden
- `in_progress`: ist fachlich und technisch in Bearbeitung
- `completed`: Zielartefakt ist erstellt und fuer den Epic wirksam
- `next`: ist als naechstes fachlich sinnvoll, braucht aber einen kurzen Vorgaenger
- `blocked`: sollte erst nach den benannten Abhaengigkeiten gestartet werden

## Naechste startbare Workpackages

- keine offenen Workpackages mehr in Epic 01

Epic 01 ist abgeschlossen. Compliance, Test-Harness, Migrationspfad und Abschlussreview sind dokumentiert und formal abgenommen.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-01` | P0 | completed | WS1 | Core-Contract-Freeze | – |
| `WP-02` | P0 | completed | WS1 | Hydrations- und URL-Aufloesungsstrategie | – |
| `WP-03` | P0 | completed | WS2 | Naming- und Contract-Matrix | `WP-01` |
| `WP-04` | P0 | completed | WS1 | Loader- und Manifest-Contract haerten | `WP-01`, `WP-02`, `WP-03` |
| `WP-05` | P0 | completed | WS2 | XState-Core-Contract vereinheitlichen | `WP-01`, `WP-03` |
| `WP-06` | P0 | completed | WS2 | XTend-API idempotent und contract-safe machen | `WP-03`, `WP-05` |
| `WP-07` | P0 | completed | WS3 | Dialog- und Modal-Contract konsolidieren | `WP-05`, `WP-06` |
| `WP-08` | P1 | completed | WS3 | Toast- und Alert-Contract konsolidieren | `WP-05`, `WP-06` |
| `WP-09` | P0 | completed | WS3 | Router- und Link-Contract haerten | `WP-03`, `WP-05` |
| `WP-10` | P1 | completed | WS3 | Theme-Contract und Lifecycle konsolidieren | `WP-02`, `WP-03`, `WP-05` |
| `WP-11` | P1 | completed | WS4 | Compliance-Haertung im Core verankern | `WP-04`, `WP-07`, `WP-08`, `WP-09`, `WP-10` |
| `WP-12` | P1 | completed | WS5 | Core-Smoke- und Contract-Tests aufbauen | `WP-04`, `WP-06`, `WP-07`, `WP-09`, `WP-10` |
| `WP-13` | P2 | completed | WS5 | Dokumentation und Migrationshinweise aktualisieren | `WP-04`, `WP-06`, `WP-07`, `WP-08`, `WP-09`, `WP-10` |
| `WP-14` | P2 | completed | WS5 | Epic-Abschlussreview und KPI-Abnahme | `WP-11`, `WP-12`, `WP-13` |

## Workpackages im Detail

### WP-01 - Core-Contract-Freeze

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - den kanonischen Core-Contract fuer Loader, Manifest, `xstate`, `xtheme`, Router und API festschreiben
- Scope:
  - Rollen, Verantwortung, Initialisierungsreihenfolge, oeffentliche Schnittstellen
- Zielartefakte:
  - Architektur-/Contract-Dokument im `development`-Ordner
  - abgestimmte Liste kanonischer Core-Module
  - siehe `development/WP-01-Core-Contract-Freeze.md`
- Betroffene Dateien:
  - `xtend-dev.js`
  - `api.js`
  - `components/xstate.js`
  - `components/xtheme.js`
  - `components/xrouter.js`
  - `components/xlink.js`
  - `components/manifest.json`
- Definition of Done:
  - Bootstrap-Reihenfolge ist schriftlich definiert
  - Verantwortlichkeiten je Modul sind eindeutig beschrieben
  - oeffentliche Contracts sind von internen Hilfsmechanismen getrennt

### WP-02 - Hydrations- und URL-Aufloesungsstrategie

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - den kuenftigen Standard fuer Modulaufloesung und Hydration festlegen
- Scope:
  - `cdn`, `local` oder aequivalentes Modell
  - Regeln fuer Manifest-Eintraege und ES-Modul-Laden
- Zielartefakte:
  - Entscheidungsdokument fuer URL-Aufloesung
  - Migrationsregeln fuer bestehende CDN-gebundene Imports
  - siehe `development/WP-02-Hydrations-und-URL-Aufloesungsstrategie.md`
- Betroffene Dateien:
  - `components/manifest.json`
  - `xtend-dev.js`
  - `api.js`
  - `components/*.js` im Core
- Definition of Done:
  - der Hydrationsmodus ist entschieden und dokumentiert
  - die Gruende fuer bestehende CDN-Nutzung sind explizit beruecksichtigt
  - es gibt klare Regeln fuer neue Core-Module

### WP-03 - Naming- und Contract-Matrix

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Benennung fuer Tags, Module, State-Keys, Events und globale APIs vereinheitlichen
- Scope:
  - hyphenated Tag-Namen
  - State-Key-Schema
  - Event-Schema
  - API-Methodennamen
- Zielartefakte:
  - Matrix oder Mapping-Dokument mit Alt-/Neu-Contract
  - siehe `development/WP-03-Naming-und-Contract-Matrix.md`
- Betroffene Dateien:
  - `docs/XTend-ADR.md`
  - `api.js`
  - `components/xstate.js`
  - `components/xrouter.js`
  - `components/xdialog.js`
  - `components/xmodal.js`
  - `components/xtoast.js`
  - `components/xalert.js`
- Definition of Done:
  - fuer alle Core-Contracts existiert eine kanonische Benennung
  - Legacy-Bezeichnungen sind identifiziert
  - Migrationsbedarf ist markiert

### WP-04 - Loader- und Manifest-Contract haerten

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Loader und Manifest auf den entschiedenen Core-Contract bringen
- Scope:
  - Manifest-Spezifikation
  - Bootstrap-Reihenfolge
  - Preload-, Lazy- und Core-Ladepfade
- Zielartefakte:
  - bereinigter Loader
  - bereinigtes Manifest
  - aktualisierte Loader-/Manifest-Doku
  - siehe `development/WP-04-Loader-und-Manifest-Contract-Haertung.md`
- Betroffene Dateien:
  - `xtend-dev.js`
  - `components/manifest.json`
  - `docs/manifest.md`
  - `docs/xtend-loader.md`
- Definition of Done:
  - Loader und Manifest folgen dem dokumentierten Contract
  - Core-Module werden in definierter Reihenfolge geladen
  - Manifest-Inhalte sind konsistent zum Laufzeitverhalten

### WP-05 - XState-Core-Contract vereinheitlichen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `xstate` als belastbare zentrale State-Schnittstelle normieren
- Scope:
  - abonnieren, unsubscriben, optionale Event-Helfer, State-Key-Richtlinien
- Zielartefakte:
  - vereinheitlichte `xstate`-API
  - dokumentierter Subscriptions-Contract
  - siehe `development/WP-05-XState-Core-Contract-Vereinheitlichung.md`
- Betroffene Dateien:
  - `components/xstate.js`
  - `components/xrouter.js`
  - `components/xdialog.js`
  - `api.js`
- Definition of Done:
  - alle Core-Module nutzen denselben Subscription-Contract
  - keine stillen Erwartungsbrueche mehr zwischen `xstate` und Call-Sites
  - State-Verhalten ist deterministisch dokumentiert

### WP-06 - XTend-API idempotent und contract-safe machen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `api.js` zu einer sicheren, wiederholbar initialisierbaren Orchestrierungsschicht machen
- Scope:
  - Idempotenz
  - State-Initialisierung
  - globale Helper-Vertraege
  - Modul-Ladeverhalten
- Zielartefakte:
  - konsolidierte XTend-API
  - aktualisierte API-Doku
  - siehe `development/WP-06-XTend-API-idempotent-und-contract-safe.md`
- Betroffene Dateien:
  - `api.js`
  - `docs/api.md`
- Definition of Done:
  - Mehrfachinitialisierung zerstoert keinen bestehenden UI-State
  - globale Helper passen zu den realen Komponenten-Contracts
  - API und Komponenten verwenden dieselben State-Keys

### WP-07 - Dialog- und Modal-Contract konsolidieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Dialoge und Modals auf einen state-getriebenen Overlay-Contract bringen
- Scope:
  - State-Keys
  - open/close-Lifecycle
  - API-Integration
  - Accessibility
  - Entfernen von lokalen Workarounds
- Zielartefakte:
  - vereinheitlichte Dialog-/Modal-Schicht
  - siehe `development/WP-07-Dialog-und-Modal-Contract-Konsolidierung.md`
- Betroffene Dateien:
  - `components/xdialog.js`
  - `components/xmodal.js`
  - `api.js`
  - ggf. `components/xplayer.js` wegen Dialog-Nutzung
- Definition of Done:
  - Dialog und Modal folgen dem Digital Twin Principle
  - API und Komponenten sprechen dieselben Keys und Events
  - keine versteckten lokalen Open-Flags als Wahrheitsquelle

### WP-08 - Toast- und Alert-Contract konsolidieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Feedback-Komponenten semantisch und technisch klar abgrenzen
- Scope:
  - Rolle von Toast vs. Alert
  - Auto-Close
  - Events
  - State-Abbildung
  - Accessibility
- Zielartefakte:
  - saubere Feedback-Contracts
  - siehe `development/WP-08-Toast-und-Alert-Contract-Konsolidierung.md`
- Betroffene Dateien:
  - `components/xtoast.js`
  - `components/xalert.js`
  - `api.js`
- Definition of Done:
  - Event-Namen und State-Verhalten sind vereinheitlicht
  - keine verdeckten Doppelpfade zwischen API und Komponente
  - semantische Abgrenzung ist dokumentiert

### WP-09 - Router- und Link-Contract haerten

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Navigation fuer deklarative und programmatische Fluesse konsistent machen
- Scope:
  - xstate-Navigation
  - Nested Routes
  - History/Hash-Mode
  - Active-Link-Verhalten
  - Route Guards
- Zielartefakte:
  - geharteter Router-/Link-Contract
  - siehe `development/WP-09-Router-und-Link-Contract-Haertung.md`
- Betroffene Dateien:
  - `components/xrouter.js`
  - `components/xlink.js`
  - `docs/components/xrouter.md`
  - `docs/components/xlink.md`
- Definition of Done:
  - Router funktioniert fuer deklarative und programmatische Navigation
  - Nested Routes matchen korrekt
  - `x-link` und `x-router` nutzen denselben Navigationsvertrag

### WP-10 - Theme-Contract und Lifecycle konsolidieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Theme-API, Theme-Lifecycle und Theme-Registry auf einen klaren Standard bringen
- Scope:
  - Theme-Umschaltung
  - externe Themes
  - State-Sync
  - Runtime-API vs. Doku
- Zielartefakte:
  - vereinheitlichte Theme-Dokumentation
  - konsolidierter Theme-Lifecycle
  - siehe `development/WP-10-Theme-Contract-und-Lifecycle-Konsolidierung.md`
- Betroffene Dateien:
  - `components/xtheme.js`
  - `api.js`
  - `docs/components/xtheme.md`
  - `docs/index.php`
- Definition of Done:
  - Theme-Wechsel und Theme-Registrierung verhalten sich konsistent
  - Doku und Runtime beschreiben dieselbe API
  - Theme-State ist nachvollziehbar und testbar

### WP-11 - Compliance-Haertung im Core verankern

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Compliance-Regeln in konkrete Core-Standards und Review-Kriterien ueberfuehren
- Scope:
  - Digital Twin Principle
  - Accessibility
  - Defensive Checks
  - reduzierte Workarounds
- Zielartefakte:
  - Compliance-Checklist fuer Core-Reviews
  - technische Leitplanken fuer neue Core-Aenderungen
  - siehe `development/WP-11-Compliance-Haertung-im-Core-verankern.md`
- Betroffene Dateien:
  - `compliance/*.md`
  - `development/*.md`
  - Core-Doku
- Definition of Done:
  - Core-Review kann gegen konkrete Compliance-Kriterien erfolgen
  - Workarounds und lokale UI-Flags sind als Anti-Pattern dokumentiert

### WP-12 - Core-Smoke- und Contract-Tests aufbauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - minimale, aber belastbare Regressionstests fuer den Core schaffen
- Scope:
  - Bootstrap
  - Router
  - Dialog/Modal
  - Theme
  - API-Init
- Zielartefakte:
  - Test-Harness oder Test-Setup
  - erste Smoke-/Contract-Tests
  - siehe `development/WP-12-Core-Smoke-und-Contract-Tests-aufbauen.md`
- Betroffene Dateien:
  - neues Test-Setup im Projekt
  - Core-Dateien je nach Testbedarf
- Definition of Done:
  - priorisierte Kernfluesse sind reproduzierbar pruefbar
  - mindestens ein Smoke-Test pro priorisiertem Kernfluss existiert

### WP-13 - Dokumentation und Migrationshinweise aktualisieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - die Core-Doku auf den tatsaechlichen, neuen Vertrag bringen
- Scope:
  - API
  - Manifest
  - Loader
  - Theme
  - Router
  - ADR-Folgepflege
- Zielartefakte:
  - aktualisierte Core-Dokumentation
  - Migrationshinweise fuer Legacy-Vertraege
  - siehe `development/WP-13-Dokumentation-und-Migrationshinweise-aktualisieren.md`
- Betroffene Dateien:
  - `docs/*.md`
  - `docs/components/*.md`
  - `development/*.md`
- Definition of Done:
  - Dokumentation ist konsistent zum implementierten Core
  - Legacy-Verhalten und Migrationspfade sind beschrieben

### WP-14 - Epic-Abschlussreview und KPI-Abnahme

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic-Ergebnisse gegen KPI, ADR und Compliance final abnehmen
- Scope:
  - Review
  - KPI-Check
  - Restpunkte
  - Entscheidung ueber naechsten Epic oder Katalogarbeit
- Zielartefakte:
  - Abschlussprotokoll
  - aktualisierte KPI-Bewertung
  - siehe `development/WP-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
- Betroffene Dateien:
  - `development/*.md`
  - relevante Doku- und Core-Dateien
- Definition of Done:
  - High-Severity-Contract-Breaks sind geschlossen oder bewusst dokumentiert
  - KPI-Ziele sind gemessen
  - naechster Umsetzungsschritt ist entscheidbar

## Epic-Abschluss

Epic 01 ist formal geschlossen. Der naechste operative Schritt kann jetzt ausserhalb dieses Backlogs geplant werden.
