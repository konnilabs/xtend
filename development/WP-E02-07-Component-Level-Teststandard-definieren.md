# WP-E02-07 - Component-Level-Teststandard definieren

- Status: Completed
- Datum: 4. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage definiert den verbindlichen Component-Level-Teststandard fuer XTend. Der Standard soll neue und modernisierte Komponenten pruefbar machen, die Arbeit aus `WP-08` vorbereiten und `XTend-Scaffold` einen belastbaren Blueprint fuer Test-, Doku-, Fixture- und Typ-Artefakte geben.

## Umgesetzter Abschluss

- `development/XTend-Component-Level-Teststandard.md` als zentraler Standard angelegt
- Komponentenprofile fuer Display, Interactive, Stateful, Feedback, Overlay, Routing, Theme, Form und Media definiert
- Pflichtchecks fuer Registrierung, Attribute, Properties, Slots, Events, State-Sync, Accessibility und Hydration festgelegt
- optionale Checks fuer visuelle Regression, Performance, Observer, externe Daten, SSR und Typisierung abgegrenzt
- Dateikonvention fuer `tests/components/<tag>.component_suite.js` und `tests/components/fixtures/<tag>.component.html` festgelegt
- Definition of Done fuer Component-Level-Tests dokumentiert
- Checkliste fuer neue und modernisierte Komponenten angelegt
- Mapping zu `XTend-Scaffold` dokumentiert
- Pilot-Vorschlag fuer `WP-08` abgeleitet
- `tests/components/README.md` als Einstieg fuer Component-Test-Arbeit aktualisiert

## Standard-Entscheidungen

Component-Level-Tests pruefen den oeffentlichen Vertrag einer Komponente. Sie duerfen Implementation Details nur dann pruefen, wenn diese Teil des XTend-Contracts sind, etwa:

- kanonische `xstate` Keys
- dokumentierte Custom Events
- Rollen und ARIA-Attribute
- dokumentierte Slots
- dokumentierte CSS Custom Properties
- Loader- oder Manifest-Anbindung

Der Standard trennt Pflichtchecks von optionalen Checks. Dadurch koennen einfache Komponenten leichtgewichtig getestet werden, waehrend Core-nahe Komponenten wie `x-router`, `x-modal`, `x-alert` oder `x-theme` strengere Profilchecks erhalten.

## Lokale Entry-Points

Der aktuelle Epic-02-Runner bleibt unveraendert:

```bash
node scripts/run_xtend_tests.js
```

Pilot-Component-Suites werden in `WP-08` an diesen Runner angeschlossen. Bis dahin ist `WP-07` ein Standard- und Checklistenpaket ohne neue ausfuehrbare Component-Suite.

## Abgrenzung zu Folgepaketen

`WP-07` definiert den Standard. Noch nicht enthalten sind:

- echte Component-Suites fuer Pilot-Komponenten (`WP-08`)
- breite Accessibility- und Hydration-Automation (`WP-09`)
- SSOT-/Digital-Twin-Gates als automatisierte Querschnittsregeln (`WP-10`)
- Scaffold-Generatoren, die diesen Standard ausgeben (`EPIC-03`)

## Betroffene Dateien

- `development/XTend-Component-Level-Teststandard.md`
- `development/WP-E02-07-Component-Level-Teststandard-definieren.md`
- `tests/components/README.md`
- `tests/components/fixtures/README.md`
- `tests/README.md`
- `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`

## Verifikation

Erfolgreich:

- `node scripts/run_xtend_tests.js`
- `node scripts/verify_xtend_core_contracts.js`
- Konsistenzsuche nach `WP-07` Status und Standard-Verweisen
- ASCII-Check der neu angelegten und geaenderten WP-07-Dateien

## Ergebnis

`WP-E02-07` ist abgeschlossen. XTend besitzt nun einen verbindlichen Component-Level-Teststandard mit Checkliste und Scaffold-Mapping. `WP-08` kann darauf aufbauend die ersten Pilot-Komponenten absichern.
