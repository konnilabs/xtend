# ER-WP-02 - `xtend-loader.js` als kanonischen ESM-Loader einfuehren

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-02.canonical-loader.v1`
- Loader Contract: `xtend.loader.contract.v1`
- Loader Entry: `xtend-loader.js`
- Legacy Entry: `xtend-dev.js`
- Bezug:
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `development/ER-WP-01-Loader-Contract-und-Rename-ADR-fuer-xtend-loader-js.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/browser/browser_smoke_suite.js`
  - `tests/browser/fixtures/core-flows-smoke.html`

## Ziel

`ER-WP-02` fuehrt den in `ER-WP-01` entschiedenen kanonischen Loader technisch ein.

Das Paket ueberfuehrt die bisherige Laufzeitlogik aus `xtend-dev.js` in `xtend-loader.js`, haelt ESM als Loader-Basistechnologie fest, unterstuetzt `data-manifest`, erhaelt `meta[name="xtend-preload"]` und stellt `xtend-dev.js` als Legacy-Stub zurueck.

## Ergebnisartefakte

| Artefakt | Status | Rolle |
|----------|--------|-------|
| `xtend-loader.js` | produktiv | kanonischer lokaler ESM-Loader |
| `xtend-dev.js` | Legacy-Stub | Kompatibilitaet fuer historische Pfade, delegiert an `xtend-loader.js` |
| `index.html` | migriert | Default-Demo nutzt `xtend-loader.js` |
| `tests/browser/fixtures/core-flows-smoke.html` | migriert | Browser-Smoke nutzt `xtend-loader.js` mit lokalem `data-manifest` |
| `docs/xtend-loader.md` | aktualisiert | offizielle Loader-Dokumentation beschreibt den neuen Entry |

## Loader-Oberflaeche

Der Runtime-Contract lautet:

```text
xtend.loader.contract.v1
```

Browsernah sind diese Oberflaechen verfuegbar:

```js
window.XTendLoader
window.__XTendLoaderBootPromise
```

`window.XTendLoader` enthaelt:

- `schema: "xtend.loader.contract.v1"`
- `initiateXTend(options)`

## Umgesetzte Loader-Pflichten

| Pflicht | Ergebnis |
|---------|----------|
| Manifest lokal laden | `xtend-loader.js` nutzt `components/manifest.json` als Default |
| Manifest Override | `data-manifest` wird vom Loader-Script gelesen |
| Manifest URLs normalisieren | URLs werden relativ zur Manifest-URL aufgeloest |
| Core laden | `xstate` und `x-theme` werden vor DOM-Komponenten geladen |
| Preload erhalten | `meta[name="xtend-preload"]` wird weiter unterstuetzt |
| DOM-Komponenten erkennen | verwendete `x*` Tags werden gegen das Manifest gematcht |
| sichtbare Komponenten bevorzugen | Viewport-Komponenten werden sofort geladen |
| Lazy Loading erhalten | nicht sichtbare Komponenten werden per `IntersectionObserver` geladen |
| API lokal initialisieren | `api.js` wird relativ zu `xtend-loader.js` importiert |
| Fehler sichtbar machen | Loader-Diagnostics werden als `xtend-loader-diagnostic` Event emittiert |

## Legacy-Strategie

`xtend-dev.js` enthaelt keine eigene Loader-Logik mehr.

Der Legacy-Stub:

- gibt eine Deprecation-Warnung aus
- importiert `./xtend-loader.js`
- bleibt fuer manuelle historische Demos nutzbar
- ist kein kanonischer Default-Pfad mehr

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-02 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-03` | ready | CDN-Fallbacks koennen aus Core-Pfaden entfernt werden |
| `ER-WP-04` | ready | lokaler Dev-/Test-Server bleibt startbereit und kann den neuen Loader als Default bedienen |
| `ER-WP-05` | blocked | Demo-/Fixture-Migration wartet weiter auf `ER-WP-03` und `ER-WP-04` |
| `ER-WP-18` | completed | Loader- und Hydration-Messpunkte sind auf `xtend-loader.js` gesetzt |
| `ER-WP-28` | next | Manifest-/Dynamic-Import-Policy wartet weiter auf CDN-Entfernung aus `ER-WP-03` |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `xtend-loader.js` existiert als kanonischer ESM-Loader | erfuellt |
| `xtend-dev.js` ist Legacy-Stub ohne eigene Loader-Logik | erfuellt |
| Default-Demo laedt `xtend-loader.js` | erfuellt: `index.html` |
| Browser-Smoke-Fixture laedt `xtend-loader.js` | erfuellt: `tests/browser/fixtures/core-flows-smoke.html` |
| Loader unterstuetzt `data-manifest` | erfuellt |
| Loader initialisiert `api.initXTendAPI(manifest)` | erfuellt |
| Browser-Gate ist auf neuen Loader vorbereitet | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check xtend-loader.js
node --check xtend-dev.js
node --check tests/browser/browser_smoke_suite.js
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-02` ist abgeschlossen. XTend besitzt mit `xtend-loader.js` einen kanonischen lokalen ESM-Loader. `xtend-dev.js` ist Legacy-Stub, die Default-Demo und der Core-Browser-Smoke nutzen den neuen Loaderpfad, und `ER-WP-03` sowie `ER-WP-18` sind startbereit.
