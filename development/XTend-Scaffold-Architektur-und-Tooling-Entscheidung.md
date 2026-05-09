# XTend-Scaffold Architektur und Tooling-Entscheidung

- Status: Verbindliche Architekturentscheidung ab Epic 03 / WP-01
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `xtend-builder/scaffold.config.js`

## Zweck

Dieses Dokument friert Rolle, Scope, Grenzen und Minimal-Tooling von `XTend-Scaffold` ein. Es ist der fachliche Startpunkt fuer `WP-02`, damit Projektlayout und CLI-Entry-Points ohne spaeteren Grundlagenbruch angelegt werden koennen.

## Architekturrolle

`XTend-Scaffold` ist ein repo-lokales Build-Environment fuer XTend-Artefakte. Es erzeugt oder plant Artefakte fuer neue und modernisierte Komponenten, aber es ist keine Runtime, kein Bundler, kein Framework-Layer und keine Templating-Engine.

Die Rolle im Produktmodell:

- `XTend-Core` liefert Loader, Manifest, `xstate`, API, Router, Theme und Core-Komponenten
- `Epic 02` liefert Testpflicht, Test-Harness, Reporting und Qualitaetsgates
- `XTend-Scaffold` erzeugt konsistente Artefakte entlang dieser Contracts
- Epic 04 und Epic 05 koennen spaeter auf die Scaffold-Boilerplate aufsetzen, ohne Generatoren neu zu bauen

## In Scope fuer XTend-Scaffold

- Komponenten- und XTend-nahe Modul-Blueprints
- Generatoren fuer Komponente, Doku, Tests, Fixtures, Types, Manifest-Patch-Plan und Demo-/Preview-Artefakte
- Eingabevalidierung fuer Tag, Profil, Features, Manifest-Teilnahme und oeffentliche API
- trockener Lauf mit Plan-Ausgabe vor Schreibzugriffen
- lokale CLI-/Script-Entry-Points
- Anschluss an `node scripts/run_xtend_tests.js`
- Nutzung von `xtend-builder/scaffold.config.js` als zentrale Konfiguration
- vorbereitete Extension-Punkte fuer spaetere Template-, RMT- und Root-Lifecycle-Artefakte

## Out of Scope fuer XTend-Scaffold

- Produktiv-Bundling oder Packaging
- CDN-/Publishing-Prozess
- vollstaendige RMT- oder Rendering-Runtime
- automatische Refactors bestehender Komponenten ohne expliziten Workpackage-Scope
- Generator-Magie, die Contracts erraten statt deklarieren muss
- visuelle Design-Entscheidungen ausserhalb der bestehenden XTend-Guidelines

## Minimal-Tooling-Entscheidung

`XTend-Scaffold` nutzt vorerst repo-lokales Node.js mit CommonJS-Modulen.

Begruendung:

- der bestehende Test-Harness und `scaffold.config.js` sind bereits CommonJS
- keine neue Build-Abhaengigkeit ist fuer WP-01 bis WP-04 noetig
- lokale Ausfuehrung bleibt leicht, schnell und CI-faehig
- Generatoren koennen spaeter ohne Tooling-Bruch modularisiert werden

Vorlaeufige Entry-Point-Strategie:

```bash
node xtend-builder/scaffold.js --help
node xtend-builder/scaffold.js component --name x-example --profile display --dry-run
node xtend-builder/scaffold.js component --name x-example --profile display --write
```

Der konkrete CLI-Entry-Point wurde in `WP-02` unter `xtend-builder/scaffold.js` angelegt. Der maschinenlesbare Layout-Contract liegt unter `xtend-builder/lib/layout.js`; echte Generatoren bleiben fuer `WP-E03-04` reserviert.

## Generatorgrenzen

Generatoren duerfen:

- geplante Artefakte auflisten
- neue Dateien in definierten Zielpfaden erzeugen
- Manifest-Aenderungen als Patch-Plan vorbereiten
- Test-, Doku- und Typ-Artefakte aus Profilen ableiten
- Ausnahmen explizit dokumentieren

Generatoren duerfen nicht:

- bestehende Produktivdateien stillschweigend ueberschreiben
- Tests als leere Platzhalter erzeugen
- lokale UI-Flags als zweite Wahrheitsquelle generieren
- Runtime-Initialisierung veraendern, ohne Core-Gates auszufuehren
- RMT-/Rendering-Entscheidungen vorwegnehmen, die in Epic 04 oder Epic 05 gehoeren

## Config-Bewertung

`xtend-builder/scaffold.config.js` ist der aktuelle technische Anker und wird weiterverwendet.

Der bestehende Config-Contract ist fachlich passend, weil er bereits enthaelt:

- Zielverzeichnisse fuer Komponenten, Tests, Docs, Templates und Plugins
- Pflichtartefakte aus Epic 02
- Component-Testprofile
- Testpflicht mit lokalen Runner-Suites
- Artefaktpfade fuer Komponenten, Docs, Tests, Fixtures, Types und Manifest

WP-01 haertet die Config nur auf Architektur-/Scope-Ebene. Projektlayout und echte CLI-Dateien folgen in `WP-02`.

## Schnittstellen

| Schnittstelle | Richtung | Contract |
|---------------|----------|----------|
| `components/manifest.json` | Scaffold zu Loader | Patch-Plan oder spaeter sichere Aktualisierung |
| `components/*.js` | Scaffold zu Runtime | Custom Element oder XTend-nahes Modul |
| `docs/components/*.md` | Scaffold zu Doku | oeffentlicher Contract und Beispiele |
| `tests/components/*.component_suite.js` | Scaffold zu Test-Suite | echte Assertions nach Profil |
| `tests/components/fixtures/*.component.html` | Scaffold zu Browser-/Hydration-Pfad | lokale Fixture ohne CDN-Pflicht |
| `components/*.d.ts` | Scaffold zu Typisierung | oeffentliche API und Event-Details |
| `scripts/run_xtend_tests.js` | Scaffold zu Verifikation | lokale Gates und Reporting |

## Risiken und Gegenmassnahmen

| Risiko | Gegenmassnahme |
|--------|----------------|
| Scaffold wird zu gross und schwer verstaendlich | kleine Generatoren, klare Profile, Dry-Run zuerst |
| Generator erzeugt Technical Debt | Epic-02-Testpflicht und Architecture-Gates bleiben verbindlich |
| Ausgaben ueberschreiben Nutzerarbeit | WP-02 muss sichere Schreibstrategie und Konfliktverhalten definieren |
| Templating/RMT wird zu frueh festgelegt | Extension-Punkte dokumentieren, Runtime-Entscheidung in Epic 04/05 belassen |
| Tests werden nur Platzhalter | Config und Testpflicht verbieten leere Testdateien |

## Entscheidung

`XTend-Scaffold` wird als leichtes, repo-lokales Node/CommonJS-Build-Environment gestartet. Es bleibt framework- und runtime-agnostisch, folgt der Epic-02-Testpflicht und erzeugt zunaechst kontrollierte Artefakte fuer XTend-Komponenten. WP-02 darf darauf aufbauend Projektlayout, Modulgrenzen und lokale CLI-Entry-Points anlegen.
