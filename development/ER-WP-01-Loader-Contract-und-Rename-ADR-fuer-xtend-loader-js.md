# ER-WP-01 - Loader-Contract und Rename-ADR fuer `xtend-loader.js`

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-01.loader-contract.v1`
- ADR: `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
- Bezug:
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Produktreife-Checkpoint-nach-Epic-05.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`
  - `tests/browser/browser_smoke_suite.js`
  - `xtend-dev.js`

## Ziel

`ER-WP-01` legt den verbindlichen Loader-Zielnamen, die Legacy-Strategie fuer `xtend-dev.js`, die lokale Entwicklungsrichtung und die Test-/Reference-Gate-Erwartungen fest.

Das Paket implementiert noch keinen neuen Loader. Es verhindert bewusst, dass `ER-WP-02` mit unklarer Dateibenennung oder impliziten CDN-Annahmen startet.

## Entscheidung

Die Architekturentscheidung liegt in `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`.

Kernentscheidungen:

- `xtend-loader.js` wird kanonischer Loader-Name.
- `xtend-dev.js` ist Legacy und darf nicht dauerhafte Produktoberflaeche bleiben.
- ESM/ES6 bleibt Basistechnologie fuer Loader, Komponenten, XTendRMT und zukuenftige Runtime-Module.
- CDN ist kein Default- oder Testpfad.
- Entwicklung und Browser-Smokes laufen ueber lokale Dateien und einen lokalen Server.
- `xtend-loader.esm.js` bleibt optional fuer spaetere Package-/Export-Strategie.

## Loader-Contract

Der Loader-Contract heisst `xtend.loader.contract.v1`.

Mindestpflichten fuer `ER-WP-02`:

- Default-Manifest `components/manifest.json` laden.
- optionales Script-Attribut `data-manifest` unterstuetzen.
- Manifest URLs relativ zur Manifest-Basis normalisieren.
- `xstate` und `x-theme` als Core-Module lokal laden, wenn im Manifest vorhanden.
- `meta[name="xtend-preload"]` weiter unterstuetzen.
- im DOM verwendete XTend-Komponenten erkennen und lokal laden.
- sichtbare Komponenten bevorzugt laden.
- nicht sichtbare Komponenten lazy vorbereiten.
- Body-Sichtbarkeit nach Erfolg oder Fehler wiederherstellen.
- lokale `api.js` initialisieren.
- keine CDN-Fallbacks verwenden.

## Legacy-Strategie

`xtend-dev.js` darf waehrend der Migration nur noch diese Rollen haben:

- historischer Pfad fuer manuelle Legacy-Demos
- temporaerer Stub, der auf `xtend-loader.js` delegiert
- explizit klassifizierte Nicht-Default-Referenz

Nicht erlaubt:

- eigenstaendige Weiterentwicklung von Loader-Logik in `xtend-dev.js`
- Default-Fixtures mit `/xtend-dev.js`
- offizielle Docs-Beispiele mit `xtend-dev.js`
- Scaffold-Ausgaben mit `xtend-dev.js`

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-01 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-02` | ready | `xtend-loader.js` kann als kanonischer ESM-Loader eingefuehrt werden |
| `ER-WP-03` | next | CDN-Fallbacks koennen entfernt werden, sobald der neue Loader lauffaehig ist |
| `ER-WP-04` | ready | lokaler Dev-/Test-Server kann produktisiert werden |
| `ER-WP-05` | blocked | Demo-/Fixture-Migration wartet auf Loader und Server |
| `ER-WP-06` | blocked | Package-Export-Strategie wartet auf kanonischen Loaderpfad |

## Betroffene Pfade fuer ER-WP-02 bis ER-WP-05

| Pfad | Erwartete Folgearbeit |
|------|-----------------------|
| `xtend-dev.js` | nach `xtend-loader.js` migrieren oder Legacy-Stub daraus machen |
| `index.html` | auf `xtend-loader.js` umstellen |
| `tests/browser/fixtures/core-flows-smoke.html` | auf `xtend-loader.js` umstellen |
| `tests/browser/browser_smoke_suite.js` | Assertions auf neuen Loaderpfad aktualisieren |
| `api.js` | CDN-Import/Fallback entfernen |
| `components/xplayer.js` | CDN-Import entfernen |
| historische Root-HTML-Demos | dekommissionieren; neue HTML-Smokes unter `tests/browser/fixtures/` fuehren |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `xtend-loader.js` ist als Zielname verbindlich | erfuellt: ADR akzeptiert und Contract dokumentiert |
| Legacy-Strategie fuer `xtend-dev.js` ist dokumentiert | erfuellt: Legacy-Stub oder manual-legacy, kein Default-Pfad |
| ESM-/ES6-Modulpolicy ist festgelegt | erfuellt: ESM bleibt Basistechnologie |
| CDN ist als Nicht-Default-Policy dokumentiert | erfuellt: keine Default- oder Testpfade mit CDN |
| lokaler Server ist als Zielpfad festgelegt | erfuellt: `ER-WP-04` Handoff definiert |
| `ER-WP-02` kann ohne Namensunklarheit starten | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-01` ist abgeschlossen. Die Loader- und Local-Development-Entscheidung ist getroffen, `ER-WP-02` und `ER-WP-04` sind startbereit, und die weiteren CDN-/Demo-/Packaging-Arbeiten haben klare Abhaengigkeiten.
