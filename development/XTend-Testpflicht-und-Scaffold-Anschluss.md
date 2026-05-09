# XTend Testpflicht und Scaffold-Anschluss

- Status: Verbindlich ab Epic 02 / WP-13
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `xtend-builder/scaffold.config.js`

## Zweck

Dieses Dokument macht die Testpflicht fuer neue, modernisierte und scaffolded XTend-Komponenten verbindlich. Es uebersetzt den Component-Level-Teststandard in einen Review- und Scaffold-Vertrag, damit kuenftige Komponenten nicht ohne Doku-, Test-, Demo- und Typ-Pfad entstehen.

Der Anschluss ist absichtlich framework- und tooling-arm gehalten. `XTend-Scaffold` soll diese Regeln spaeter als Blueprint ausgeben, ohne die Epic-02-Test-Suite neu zu erfinden.

## Geltungsbereich

Die Testpflicht gilt fuer:

- neue XTend Custom Elements unter `components/`
- modernisierte Bestandskomponenten
- scaffolded Komponenten und XTend-nahe Module aus `XTend-Scaffold`
- Core-nahe Erweiterungen mit Manifest-, Router-, Theme-, State-, API- oder Hydration-Bezug

Nicht jede Komponente braucht dieselbe Testtiefe. Entscheidend ist das Profil aus `development/XTend-Component-Level-Teststandard.md`.

## Mindestartefakte

Jede neue oder modernisierte Komponente muss die folgenden Artefakte besitzen oder im Workpackage begruendet ausnehmen:

| Artefakt | Zielpfad | Pflicht |
|----------|----------|---------|
| `component` | `components/<tag>.js` | produktiver Custom-Element- oder Modul-Code |
| `docs` | `docs/components/<name>.md` | oeffentlicher Contract, Beispiele, Accessibility-/Hydration-Grenzen |
| `tests` | `tests/components/<tag>.component_suite.js` | Component-Level-Contract nach Profil |
| `fixtures` | `tests/components/fixtures/<tag>.component.html` | lokale DOM-/Hydration-Fixture, falls die Komponente UI rendert |
| `types` | `components/<tag>.d.ts` oder dokumentierter Typ-Pfad | Pflicht bei oeffentlicher JS-API oder komplexen Events |
| `manifest` | `components/manifest.json` | Pflicht fuer runtime-ladbare Komponenten |
| `demo` | Demo-/Preview- oder Referenzpfad | Pflicht, sobald ein sichtbarer oder workflowrelevanter Bestcase existiert |

Platzhalter ohne pruefbare Assertion zaehlen nicht als erfuellte Testpflicht.

## Mindesttests nach Profil

| Profil | Mindesttests |
|--------|--------------|
| `display` | Registrierung, Manifest, Attribute, Slots, sichtbarer DOM-Vertrag |
| `interactive` | Display-Basis plus Events, Tastaturpfade, Fokus und Labels |
| `stateful` | Interactive- oder Display-Basis plus kanonischer `xstate` Sync, externe State-Aenderung und Cleanup |
| `feedback` | sichtbare Live-Region, Dismissal, Event-Contract, Timer-Cleanup |
| `overlay` | Open-State, Fokusziel, Escape, Fokus-Rueckgabe, `aria-modal` |
| `routing` | Navigation, Params/Query, `xstate` Bridge, Route-Events |
| `theme` | Theme-State, CSS Custom Properties, Event-Contract |
| `form` | Value/Validation, Labels, Fehlermeldungen, Submit-/Change-Events |
| `media` | Ladezustand, Controls, Tastatur, Fallbacks |

Komponenten mit mehreren Profilen muessen die Vereinigungsmenge der relevanten Mindesttests abdecken.

## Scaffold-Vertrag

`XTend-Scaffold` muss beim Erzeugen einer Komponente mindestens folgende Entscheidungen abfragen oder ableiten:

- Tag-Name und Dateiname
- Komponentenprofil oder Profilkombination
- Manifest-Teilnahme
- State-Teilnahme und kanonische `xstate` Keys
- oeffentliche Attribute, Properties und Events
- Slots und Fallbacks
- Accessibility- und Hydration-Grenzen
- Typisierungsbedarf
- Demo-/Preview-Bedarf

Der Scaffold-Output muss danach mindestens diese Pfade anlegen oder als bewusst ausgelassen dokumentieren:

```text
components/<tag>.js
docs/components/<name>.md
tests/components/<tag>.component_suite.js
tests/components/fixtures/<tag>.component.html
components/<tag>.d.ts
components/manifest.json
```

Wenn eine Komponente keine Fixture, keine Typdefinition oder keinen Manifest-Eintrag braucht, muss der generierte Worklog oder die Doku die Ausnahme benennen.

## Lokale Pflichtbefehle

Vor Abschluss einer Komponentenarbeit muessen mindestens die passenden lokalen Gates laufen:

```bash
node scripts/run_xtend_tests.js components
node scripts/run_xtend_tests.js a11y-hydration
node scripts/run_xtend_tests.js references
```

Bei Core-, Router-, Theme-, State- oder API-Bezug muss zusaetzlich laufen:

```bash
node scripts/run_xtend_tests.js core architecture browser
```

Fuer maschinenlesbare Abnahme kann der Runner so ausgefuehrt werden:

```bash
node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json
```

## Review-Kriterien

Menschen und AI-Agenten duerfen eine neue oder modernisierte Komponente nur als abgeschlossen markieren, wenn:

- das Komponentenprofil im Workpackage oder in der Suite genannt ist
- die Mindestartefakte vorhanden oder begruendet nicht anwendbar sind
- die Component-Suite echte Assertions enthaelt
- die Fixture repo-lokale Komponenten laedt und kein CDN benoetigt
- dokumentierte Attribute, Slots, Events und State-Keys getestet werden
- Accessibility- und Hydration-Regeln abgedeckt oder begruendet ausgenommen sind
- die lokalen Pflichtbefehle ausgefuehrt und dokumentiert wurden
- Doku-Beispiele und Test-Contracts denselben oeffentlichen Contract beschreiben

AI-Agenten muessen ausserdem geaenderte Artefakte im Abschluss nennen und duerfen offene Testpflichten nicht stillschweigend als erledigt behandeln.

## Ausnahmeprozess

Eine Ausnahme ist erlaubt, wenn eine Komponente bewusst:

- kein Custom Element ist
- keine sichtbare UI rendert
- nicht ueber das Manifest geladen wird
- keine oeffentliche JS-API besitzt
- keinen Browser-/Hydration-Pfad hat

Die Ausnahme muss im Workpackage, in der Komponentendoku oder direkt in der Suite als `skip` oder explizite Begruendung stehen.

## Anschluss an Epic 03

Epic 03 uebernimmt dieses Dokument als verbindlichen Input fuer `XTend-Scaffold`. Die Scaffold-Config spiegelt die Mindestartefakte und lokalen Gates, damit Generatoren spaeter Doku, Tests, Fixtures, Typisierung und Manifest-Anbindung standardisiert ausgeben koennen.
