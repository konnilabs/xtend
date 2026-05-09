# WP-E02-06 - Core-Browser-Smokes fuer Loader, API, Router, Theme und Overlays

- Status: Completed
- Datum: 4. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage erweitert den in `WP-E02-05` angelegten Browser-Smoke-Harness um priorisierte XTend-Core-Fluesse. Ziel ist eine browsernahe Fixture, die Loader, API-Initialisierung, Router-Navigation, Theme-Wechsel sowie Overlay- und Feedback-Komponenten als zusammenhaengenden Runtime-Pfad pruefbar macht.

## Umgesetzter Abschluss

- `tests/browser/fixtures/core-flows-smoke.html` als zweite selbstverifizierende Browser-Fixture angelegt
- `tests/browser/fixtures/components/manifest.json` als fixture-lokales Manifest angelegt
- Core-Fixture nutzt den echten `xtend-dev.js` Loader-Pfad
- Core-Fixture nutzt ein Import-Map-Mapping fuer lokale `xstate`-Imports
- Core-Fixture prueft in der Seite:
  - Loader stellt Body-Sichtbarkeit wieder her
  - API initialisiert Compliance- und UI-State-Vertraege
  - `x-router` rendert eine per `xstate` angestossene Route
  - `x-theme` synchronisiert Theme-Attribut und State
  - `XToast` rendert ein sichtbares Feedback-Element
  - `XAlert` rendert ein sichtbares Feedback-Element und synchronisiert State
  - `XDialog` rendert ein Overlay und synchronisiert kanonischen Open-State
  - `XModal` rendert ein Overlay und synchronisiert kanonischen Open-State
- `tests/browser/browser_smoke_suite.js` validiert nun beide Browser-Fixtures und deren Source-/Manifest-Vertraege
- optionaler Safari-WebDriver-Pfad kann beide Fixtures ausfuehren, bleibt aber wegen externer OS-/Browser-Abhaengigkeit diagnostisch

## Lokale Entry-Points

Browser-Harness fuer Custom-Element- und Core-Flows:

```bash
node scripts/run_xtend_tests.js browser
```

Vollstaendige Suite:

```bash
node scripts/run_xtend_tests.js
```

Optionaler Safari-WebDriver-Lauf:

```bash
XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js browser
```

Der Safari-WebDriver-Lauf setzt lokal aktivierte Safari Remote Automation voraus und ist nicht Teil der deterministischen Default-Abnahme.

## Abnahme

Der Workpackage-Abschluss erfolgt ueber die deterministische Browser-Fixture-Contract-Abnahme:

- die Core-Fixture ist so aufgebaut, dass sie im echten Browser selbst `window.__xtendCoreSmokeResult` schreibt
- die Suite prueft Fixture-Struktur, lokales Manifest und die produktiven Source-Vertraege fuer Loader, API, Router, Theme, Dialog, Modal und Toast
- der lokale Default-Lauf benoetigt keinen externen Browser und keinen Netzwerkzugriff
- der optionale WebDriver-Lauf bleibt als Zusatzbeweis fuer Umgebungen mit stabiler Browser-Automation verfuegbar

## Abgrenzung zu Folgepaketen

`WP-06` legt priorisierte Core-Browser-Smokes an. Noch nicht enthalten sind:

- Component-Level-Teststandard (`WP-07`)
- Pilot-Komponenten mit Component-Level-Tests (`WP-08`)
- Accessibility- und Hydration-Checks in der Breite (`WP-09`)
- Doku-/Demo-Referenzpfade (`WP-11`)
- Reporting-/CI-Vorbereitung (`WP-12`)

## Betroffene Dateien

- `tests/browser/browser_smoke_suite.js`
- `tests/browser/fixtures/core-flows-smoke.html`
- `tests/browser/fixtures/components/manifest.json`
- `tests/browser/README.md`
- `tests/README.md`
- `scripts/run_xtend_tests.js`
- `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`

## Verifikation

Erfolgreich:

- `node --check tests/browser/browser_smoke_suite.js`
- `node --check scripts/run_xtend_tests.js`
- `node scripts/run_xtend_tests.js browser`
- `node tests/browser/browser_smoke_suite.js`
- `node scripts/run_xtend_tests.js`
- `node scripts/verify_xtend_core_contracts.js`

Optional, wegen externer Safari-Abhaengigkeit nicht blockierend:

- `XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js browser`

## Ergebnis

`WP-E02-06` ist abgeschlossen. Der Browser-Smoke-Harness deckt nun neben der ersten Custom-Element-Fixture auch priorisierte Core-Fluesse fuer Loader, API, Router, Theme sowie Overlay- und Feedback-Runtimes ab.
