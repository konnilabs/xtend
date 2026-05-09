# WP-E02-05 - Browser-Smoke-Harness fuer Custom Elements

- Status: Completed
- Datum: 3. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage etabliert den ersten browsernahen Smoke-Test-Pfad fuer XTend Custom Elements. Der Harness soll eine echte Fixture-Seite besitzen, Custom-Element-Registrierung und sichtbare Runtime-Aktivierung pruefbar machen und spaeter als Basis fuer Loader-, Router-, Theme- und Overlay-Smokes dienen.

## Umgesetzter Abschluss

- `tests/browser/fixtures/custom-elements-smoke.html` als erste Browser-Smoke-Fixture angelegt
- Fixture nutzt `x-alert` als erstes stabiles Custom-Element-Ziel
- Fixture setzt einen lokalen `window.xstate` Stub, damit `x-alert` ohne Netzwerkimport laeuft
- Fixture prueft in der Seite:
  - `customElements.whenDefined('x-alert')`
  - vorhandenes Fixture-Element
  - gerendertes Shadow DOM
  - sichtbaren Body-Zustand
  - State-Synchronisierung ueber den `xstate` Stub
- `tests/browser/browser_smoke_suite.js` als Browser-Smoke-Suite angelegt
- `scripts/run_xtend_tests.js` um die Suite `browser` erweitert
- Default-Lauf validiert Fixture, Harness und `x-alert`-Source-Contract ohne externe Browser-Abhaengigkeit
- optionaler Safari-WebDriver-Pfad ueber `XTEND_BROWSER_SMOKE_DRIVER=safari` vorbereitet
- Safari-WebDriver ist als optionale Diagnose eingestuft und nicht blockierend fuer den WP-Abschluss

## Lokale Entry-Points

Default-Harness ohne externe Browser-Automation:

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

Der Safari-WebDriver-Lauf setzt lokal aktivierte Safari Remote Automation voraus.

## Alternative Abnahme

Die echte Safari-WebDriver-Automation konnte in dieser Umgebung wegen externer Faktoren nicht stabil abgenommen werden:

- Sandbox-Lauf: `safaridriver did not become ready`
- Eskalierter Lauf: `safaridriver did not create a session`

Der WP-Abschluss erfolgt daher ueber die alternative, deterministische Default-Abnahme:

- die Fixture ist selbstverifizierend und prueft Registrierung, Shadow DOM, sichtbaren Body-Zustand und `xstate`-Synchronisierung
- die Browser-Smoke-Suite prueft die Fixture-Struktur und den produktiven `x-alert`-Source-Contract
- der lokale Suite-Lauf ist ohne externe Browser- oder OS-Automationsvoraussetzungen reproduzierbar
- Safari-WebDriver bleibt als zusaetzlicher, optionaler Diagnosepfad erhalten

## Abgrenzung zu Folgepaketen

`WP-05` legt den Harness und die erste Fixture an. Noch nicht enthalten sind:

- Core-Browser-Fluesse fuer Loader, Router, Theme und Overlays (`WP-06`)
- Component-Level-Teststandard (`WP-07`)
- Accessibility- und Hydration-Checks in der Breite (`WP-09`)
- Reporting-/CI-Vorbereitung (`WP-12`)

## Betroffene Dateien

- `tests/browser/browser_smoke_suite.js`
- `tests/browser/fixtures/custom-elements-smoke.html`
- `tests/browser/README.md`
- `tests/README.md`
- `scripts/run_xtend_tests.js`
- `tests/utils/assertions.js`
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

`WP-E02-05` ist abgeschlossen. Der Browser-Smoke-Harness, die Fixture und die Suite-Integration sind vorhanden; die Default-Abnahme ist deterministisch reproduzierbar. Der Safari-WebDriver-Pfad bleibt bewusst optional, weil er von lokaler OS- und Browser-Konfiguration abhaengt.
