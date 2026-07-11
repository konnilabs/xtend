# XTend Dev Surface

Chromium DevTools Extension fuer XTend Runtime-, Fabric-, Kernel- und Gate-Diagnostics.

Oeffentliche Anleitungen: `docs/de/xtend-dev-surface.md` und `docs/en/xtend-dev-surface.md`.

## Handoff

```bash
node tools/xtend-dev-surface/build.js
node scripts/run_xtend_tests.js xtend-dev-surface --json
npm run test:xtend-dev-surface
```

Der Build schreibt die ladbare Extension nach `tools/xtend-dev-surface/dist/` und erzeugt:

- `dist/build-report.json`
- `dist/handoff.json`
- `dist/manifest.json`
- `dist/panel.html`, `dist/panel.js`, `dist/panel.css`
- `dist/runtime-bridge.js`
- `dist/prewarm-worker.js`
- `dist/service-worker.js`

## Extension Laden

1. `node tools/xtend-dev-surface/build.js` ausfuehren.
2. In Chromium, Chrome, Edge oder einem Chromium-nahen Browser `chrome://extensions` oeffnen.
3. Developer Mode aktivieren.
4. `tools/xtend-dev-surface/dist/` als unpacked Extension laden.
5. DevTools in einer XTend-App oeffnen.
6. Das Panel `XTend` auswaehlen.

Wenn keine XTend DEV API vorhanden ist, zeigt die Extension einen sichtbaren englischen Blocking State `No XTend app detected` statt Heuristiken oder Platzhalter-Telemetrie zu verwenden.

## DEV API

Die inspizierte App muss explizit `window.__XTEND_DEV_API__` bereitstellen. Die Extension liest nur diese API und patcht keine Browser- oder App-Runtime.

Der Runtime Bridge Reader liegt in `src/runtime-bridge.js` und wird nach `dist/runtime-bridge.js` kopiert. Er liest im inspizierten Page-Kontext nur `version`, `getPerformanceSnapshot()`, `getFabricTelemetrySnapshot()`, `getKernelSnapshot()` und optional `getHydrationSnapshot()` sowie die `subscribe`-Faehigkeit.

Minimaler Mock fuer lokale Browser-Smokes:

```js
window.__XTEND_DEV_API__ = {
  version: '1.0.0',
  getPerformanceSnapshot() {
    return { measurements: [] };
  },
  getHydrationSnapshot() {
    return {
      strategy: 'server_prerender_resume',
      status: 'resumed',
      resumeToken: 'app-provided-token',
      xscaler: { mode: 'protocol-lazy', preflightCount: 0 }
    };
  },
  getFabricTelemetrySnapshot() {
    return { lanes: {} };
  },
  getKernelSnapshot() {
    return { state: 'none' };
  },
  subscribe() {}
};
```

## Companion

Der lokale Companion ist optional:

```bash
XTEND_DEV_SURFACE_TOKEN=dev node tools/xtend-dev-surface/companion.js
```

Im DevTools-Panel den Tab `Gates` oeffnen, den Token im Companion-Bereich eintragen und `Check` ausfuehren. Der Token wird lokal im Extension-Panel gespeichert und nur an den lokalen Companion gesendet.

Nur allowlistete Gates werden gestartet. Freie Shell-Kommandos sind nicht Teil des Contracts.

Der Companion bietet `POST /handshake`, `POST /gate-runs`, `GET /gate-runs`, `GET /gate-runs/events` und allowlistete `/artifacts/:path`. Alle Gate-, Stream- und Artifact-Routen erwarten den Header `x-xtend-dev-surface-token`.

## Boundaries

- Keine Remote Scripts, kein CDN, kein `eval` fuer Extension-UI.
- Kein Monkeypatching von `fetch`, `history`, `performance`, `customElements` oder Frameworks.
- Runtime Reads laufen nur ueber `window.__XTEND_DEV_API__`.
- Der Prewarm Worker normalisiert nur Snapshots und erzeugt Chart-Daten.
- Der Worker besitzt kein DOM, keine Host Services und keinen Canonical State.
- Der Companion startet nur allowlistete Gates.

## Troubleshooting

- Panel zeigt `No XTend app detected`: Die inspizierte Seite stellt `window.__XTEND_DEV_API__` nicht bereit; die Telemetrie-Tabs werden blockiert, lokale Gates bleiben ueber den Gates-Tab erreichbar.
- Panel zeigt degraded: `window.__XTEND_DEV_API__` ist vorhanden, aber eine Pflichtmethode fehlt oder ein Snapshot ist nicht synchron serialisierbar.
- Gates bleiben blocked: Companion nicht gestartet, Token fehlt oder Gate-ID ist nicht allowlisted.
- Extension laedt nicht: `node tools/xtend-dev-surface/build.js` erneut ausfuehren und `tools/xtend-dev-surface/dist/` neu laden.
- Source/Dist drift: `npm run test:xtend-dev-surface` ausfuehren; die Suite prueft Paritaet und Manifest V3.
