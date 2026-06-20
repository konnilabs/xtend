# XTensions Multi-Framework Dashboard Fixture and Browser Smokes Contract

- Workpackage: `XTN-12`
- Status: `accepted-by-XTN-12`
- Dashboard Schema: `xtend.xtensions.multi-framework-dashboard.v1`
- Surface Schema: `xtend.xtensions.dashboard-surface.v1`
- Event Flow Schema: `xtend.xtensions.dashboard-event-flow.v1`
- Browser Smoke Schema: `xtend.xtensions.dashboard-browser-smoke.v1`
- Report Schema: `xtend.xtensions.dashboard-report.v1`
- Diagnostic Schema: `xtend.xtensions.dashboard-diagnostic.v1`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-multi-framework-dashboard --json`

## Ziel

XTN-12 fuehrt eine realistische Multi-Framework-Dashboard-Fixture ein. Die Fixture kombiniert eine native XTend Shell mit React-, Vue-, Chart.js-, Leaflet- und Three.js-aehnlichen XTension-Surfaces, ohne diese Frameworks zu installieren, zu importieren oder in XTend-Package-Artefakte zu vendoren.

Die Fixture ist ein Contract- und Smoke-Evidence-Layer. Sie beweist die Orchestrierung ueber native XTend-Technologien: Maraca-Manifeste, Runtime Capability Registry, Fabric Signal Bridge, Security Gate, Diagnostic Records und Host/Fiber-gesteuerte Browser-Smoke-Probes.

## Surface-Modell

Die Dashboard-Fixture enthaelt sechs Rollen:

- `native-shell`
- `react-panel`
- `vue-panel`
- `chart`
- `map`
- `three-scene`

Nur die native Shell ist keine XTension. Alle anderen Surfaces besitzen ein Maraca-kompatibles Manifest mit Owner, Version, Contract Snapshot, Integrity, CSP, Fallback und Peer-Dependency-Klassifikation.

## Cross-Surface Event Flow

Der Referenzflow ist:

1. Leaflet-aehnliche Map Surface emittiert `map.selection.changed`.
2. Fabric normalisiert das Ereignis als SurfaceEvent.
3. Fabric routet KernelSignals an Chart, React Panel und Vue Panel.
4. Chart aktualisiert eine Series ueber einen HostController-Adapter.
5. React Panel erhaelt ein Scheduling-Hint-Update.
6. Vue Panel kann degraded sein; dann bleibt der Signalpfad sichtbar und der native Fallback wird angezeigt.

Direkte Framework-zu-Framework-Kopplung ist nicht erlaubt. Kein React-Panel spricht direkt mit Vue, Chart, Leaflet oder Three.js.

## Browser-Smoke Evidence

Die lokalen Smokes sind frameworkfreie Evidence Records:

- `mount`
- `interaction`
- `lazy-load`
- `suspend`
- `teardown`
- `canvas-pixel`
- `webgl-pixel`

Canvas- und WebGL-Smokes verlangen Nonblank-Pixel-Evidence. Teardown verlangt Cleanup-Evidence. Lazy-Load und Suspend muessen explizit nachweisen, dass die Host-Policy gegriffen hat. Der lokale Gate startet keinen Browser und installiert kein Playwright; echte Browser-Harnesses koennen spaeter extern opt-in angebunden werden.

## Degradation

Die Fixture modelliert eine fehlende Vue Peer-Runtime. Die Runtime-Registry meldet die Vue Surface als `degraded`, aber die App Shell bleibt responsive. Das ist Absicht: Eine XTension darf ausfallen oder fehlen, ohne die native Shell oder andere XTensions zu blockieren.

## Dependency Boundary

React, Vue, Chart.js, Leaflet und Three.js erscheinen nur als `external-peer`-Daten in Manifesten. Der XTend-Root bleibt ohne `dependencies`, `devDependencies`, `peerDependencies` und `optionalDependencies`. Lokale Fixtures benoetigen kein CDN und keinen Netzwerkzugriff.

## Artefakte

- `tools/xtensions/multi-framework-dashboard-fixture.js`
- `tools/xtensions/multi-framework-dashboard-fixture.d.ts`
- `tests/fixtures/xtensions/multi-framework-dashboard-valid.json`
- `tests/xtensions/xtensions_multi_framework_dashboard_suite.js`

## Definition of Done

- Fixture laeuft lokal ohne Netzwerk.
- Interaktionen erzeugen Fabric Diagnostics und Cross-Surface Records.
- Shell bleibt bedienbar, wenn eine XTension degraded.
- Canvas/WebGL-Smokes liefern Nonblank- und Cleanup-Evidence.
- Keine Drittframeworks werden in XTend importiert, installiert oder vendored.
