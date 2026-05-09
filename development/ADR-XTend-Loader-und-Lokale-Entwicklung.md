# ADR - XTend Loader und lokale Entwicklung

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.loader.local-development.adr.v1`
- Roadmap-Paket: `ER-WP-01`
- Bezug:
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Produktreife-Checkpoint-nach-Epic-05.md`
  - `tests/browser/browser_smoke_suite.js`
  - `xtend-dev.js`

## Kontext

XTend besitzt aktuell einen funktionalen Loader unter `xtend-dev.js`. Dieser Name ist fuer ein Enterprise-faehiges Framework jedoch falsch gesetzt: Er beschreibt eine Entwicklungsdatei, waehrend dieselbe Oberflaeche in Demos und Tests bereits als zentrale Runtime-Loader-Schicht genutzt wird.

Zusaetzlich existieren noch CDN-Annahmen in historischen Demos und einzelnen Core-Pfaden. Fuer reproduzierbare Entwicklung, Tests, Security und spaetere Distribution darf CDN nicht der Default- oder Testpfad bleiben.

`ER-WP-01` entscheidet deshalb zuerst ueber Loader-Name, lokale Entwicklung, ESM-Policy und Legacy-Strategie, bevor `ER-WP-02` produktiv Dateien einfuehrt oder migriert.

## Entscheidung

XTend fuehrt `xtend-loader.js` als kanonischen Loader-Namen ein.

`xtend-dev.js` wird nicht als dauerhafte Produktoberflaeche weitergefuehrt. Es darf nur noch waehrend einer kurzen Migrationsphase als Legacy-Kompatibilitaet existieren und darf in keinem Default-Demo-, Docs-, Scaffold- oder Testpfad als kanonische Referenz verwendet werden.

Die kanonische Loader-Einbindung lautet:

```html
<script type="module" src="./xtend-loader.js"></script>
```

ES6-/ESM-Module bleiben die Basistechnologie fuer Loader, Komponenten, XTendRMT-Bridge-Artefakte und zukuenftige Runtime-Module.

CDN ist kein Default- oder Testpfad. XTend-Entwicklung, Demos und Browser-Smokes muessen ueber lokale Dateien und einen lokalen Server laufen.

## Zieloberflaeche

### Loader-Dateien

| Datei | Rolle | Status nach Migration |
|-------|-------|-----------------------|
| `xtend-loader.js` | kanonischer lokaler ESM-Loader | produktiv |
| `xtend-loader.esm.js` | optionaler spaeterer Package-/Export-Entry | reserviert |
| `xtend-dev.js` | historischer Loader-Name | Legacy, nicht kanonisch |

`xtend-loader.esm.js` wird erst benoetigt, wenn `ER-WP-06` die Package-Export- und Release-Strategie konkretisiert. Bis dahin bleibt `xtend-loader.js` der einzige neue Pflicht-Entry.

### Loader-Konfiguration

Der Loader muss mindestens folgende lokale Konfigurationen unterstuetzen:

- Default-Manifest: `components/manifest.json`
- optionales Script-Attribut: `data-manifest`
- bestehender Preload-Hinweis: `meta[name="xtend-preload"]`
- lokale Component URLs aus dem Manifest
- lokale API-Initialisierung ueber `api.js`

Beispiel:

```html
<script
  type="module"
  src="./xtend-loader.js"
  data-manifest="./components/manifest.json">
</script>
```

Die bestehende Preload-Konvention bleibt erhalten:

```html
<meta name="xtend-preload" content="xstate,x-theme,x-router">
```

### Lokaler Server

Der offizielle Entwicklungs- und Testpfad ist ein repo-lokaler HTTP-Server.

Ziel-Entry-Points ab `ER-WP-04`:

```bash
npm run dev:local
npm run test:browser:local
node scripts/serve_xtend_dev.js
```

Pflichten:

- Auslieferung aus dem Repo-Root
- lokale URLs
- kein CDN-Fallback
- korrekte MIME Types fuer `.html`, `.js`, `.mjs`, `.css`, `.json`, `.wasm`
- konfigurierbarer Port fuer Menschen
- Port `0` fuer automatisierte Browser-Smokes

## Loader-Contract

Der Loader-Contract heisst `xtend.loader.contract.v1`.

Mindestpflichten:

- Manifest lokal laden und gegen die Manifest-Basis-URL normalisieren.
- Core-Module wie `xstate` und `x-theme` lokal aus dem Manifest laden.
- Preload-Komponenten ueber `meta[name="xtend-preload"]` laden.
- DOM-verwendete XTend-Tags erkennen.
- sichtbare Komponenten bevorzugt laden und nicht sichtbare Komponenten lazy vorbereiten.
- `api.initXTendAPI(manifest)` nach Loader-Abschluss lokal initialisieren.
- Body-Sichtbarkeit auch im Fehlerfall wiederherstellen.
- Fehler strukturiert loggen und spaeter an XTend-Fabric weiterreichen koennen.
- keine externen Netzwerkpfade als stillen Fallback verwenden.

## CDN-Policy

CDN-Pfade sind nur noch erlaubt, wenn sie explizit als Legacy-/Manual-Referenz klassifiziert sind.

Nicht erlaubt in Default-Pfaden:

- `index.html`
- browsernahe Default-Fixtures
- Scaffold-Dry-Runs
- `api.js`
- Core-Komponenten
- XTendRMT-Bestcase-Demo
- offizielle Docs-Beispiele

Noch zu migrierende Iststellen werden in `ER-WP-03` bearbeitet. Dazu gehoeren insbesondere:

- `api.js`
- `components/xplayer.js`
- `xstatetest.html`
- `masonry.html`
- `hero.html`
- `xplayerdemo.html`

## Legacy-Strategie fuer `xtend-dev.js`

Die Migration verlaeuft in drei Schritten:

1. `ER-WP-02` fuehrt `xtend-loader.js` ein.
2. `ER-WP-05` stellt Default-Demos, Browser-Fixtures, Docs und Tests auf `xtend-loader.js` um.
3. Danach darf `xtend-dev.js` nur noch als Legacy-Stub oder manuelle historische Referenz existieren.

Ein temporaerer Legacy-Stub darf nur:

- auf `xtend-loader.js` weiterleiten
- eine sichtbare Deprecation-Warnung ausgeben
- keine eigene, abweichende Loader-Logik behalten
- nicht mehr in Default-Gates referenziert werden

## Test- und Reference-Gate-Erwartungen

Ab `ER-WP-02` muessen Tests neue Loader-Arbeit gegen `xtend-loader.js` vorbereiten. Ab `ER-WP-05` gilt:

- `tests/browser/browser_smoke_suite.js` assertiert auf `xtend-loader.js`, nicht auf `xtend-dev.js`.
- `tests/browser/fixtures/core-flows-smoke.html` laedt `xtend-loader.js`.
- `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` klassifiziert `xtend-dev.js` nur noch als Legacy, falls es weiterhin existiert.
- Reference-Gates pruefen, dass lokale Loader- und Server-Konventionen dokumentiert sind.

Mindestgates:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
npm test
```

## Konsequenzen

### Positive Folgen

- XTend erhaelt einen produktneutralen Loader-Namen.
- Entwicklung und Tests werden reproduzierbarer.
- CDN-Entkopplung wird explizit Teil von Security und Release Readiness.
- ESM bleibt die Basistechnologie.
- XTend-Fabric kann spaeter an denselben Loader- und Error-Boundary-Pfad andocken.

### Kosten

- Demos und Browser-Fixtures muessen migriert werden.
- Bestehende Tests, die `xtend-dev.js` erwarten, muessen umgestellt werden.
- Legacy-Demos mit CDN-Annahmen brauchen eine bewusste Klassifikation oder Migration.

### Nicht entschieden

Nicht Teil von `ER-WP-01`:

- produktive Implementierung von `xtend-loader.js`
- Entfernung aller CDN-Pfade
- lokaler Server-Code
- Package-Exports und Release-Artefakte
- XTend-Fabric Runtime

Diese Punkte starten in `ER-WP-02`, `ER-WP-03`, `ER-WP-04`, `ER-WP-06` und `ER-WP-07`.

## Ergebnis

Die Entscheidung ist akzeptiert. `xtend-loader.js` ist der kanonische Loader-Zielname. `xtend-dev.js` ist Legacy. Lokale Entwicklung und lokale Browser-Smokes sind Pflicht. CDN ist kein Default- oder Testpfad. `ER-WP-02` kann die Loader-Datei einfuehren, `ER-WP-04` kann den lokalen Server produktisieren.
