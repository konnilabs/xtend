# XTensions Chart.js and Leaflet Imperative Host PoCs Contract

Status: `accepted-by-XTN-08`
Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`
Gate: `node scripts/run_xtend_tests.js xtensions-imperative-host-pocs --json`

## Zweck

XTN-08 validiert imperative Dritt-Frameworks als XTension-Klasse, ohne Chart.js oder Leaflet in XTend selbst zu importieren, zu installieren oder zu vendoren. Die PoCs sind frameworklose Contract-Stubs. Echte Runtime-Adapter duerfen spaeter nur ueber externe opt-in Peer-Harnesses geladen werden.

## Contract Shapes

- PoC Schema: `xtend.xtensions.imperative-host-pocs.v1`
- Contract Schema: `xtend.xtensions.imperative-host-contract.v1`
- Chart Update Record: `xtend.xtensions.chart-update-record.v1`
- Leaflet Event Record: `xtend.xtensions.leaflet-normalized-event.v1`
- Resize Record: `xtend.xtensions.imperative-resize-record.v1`
- Visibility Record: `xtend.xtensions.imperative-visibility-record.v1`
- Report Schema: `xtend.xtensions.imperative-host-report.v1`

## Host Boundary

- Chart.js und Leaflet sind nur deklarierte `external-peer` Dependencies.
- Package-, Dev-, Peer- und Optional-Dependencies von XTend duerfen keine Framework-Runtime aufnehmen.
- Keine Chart.js-/Leaflet-Instanz, kein Canvas/Map/Layer/Marker/Popup-Objekt und kein DOM/native Event verlaesst den HostController.
- Imperative APIs werden ausschliesslich ueber HostController-Methoden modelliert: `mount`, `update`/`emit`, `resize`, `setVisibility`, `unmount`.
- RMT-Kernel, Fabric Lanes, Signals und Reactivity sehen nur serialisierbare Records.

## Chart.js PoC

Der Chart-PoC modelliert Chart.js als datengetriebene, imperative XTension:

- `active` bedeutet: Animation darf als Host-Policy-Hint genutzt werden, wenn Budget vorhanden ist.
- `none` bedeutet: Fast Path ohne Animation.
- Der Update-Modus ist ein Record-Feld, keine direkte Chart.js-API-Freigabe.
- Selection-, Dataset- und Render-Payloads muessen serialisierbar sein.
- Cleanup gibt Chart-Stub, Canvas, Listener, Resize Observer und Tooltip State frei.

## Leaflet PoC

Der Leaflet-PoC normalisiert event-reiche Map-Interaktionen:

- `pan` und `zoom` erzeugen Viewport Events.
- `layer.click` erzeugt Layer-/Selection Events.
- `marker.drag` erzeugt Marker-Drag Events.
- `popup.open` erzeugt Popup Events.
- Event-Flut bleibt rate-limitierbar und erzeugt Diagnostics, ohne den Host direkt zu blockieren, solange keine Fehler-Diagnostics entstehen.
- Cleanup gibt Map-Stub, Container, Listener, Layers, Marker, Popups und Resize Observer frei.

## Runtime Registry

Die Runtime Capability Registry muss fuer beide Adapter `loading.dynamic-import` und die jeweiligen Host Capabilities sehen:

- Chart.js: `chart.update.policy`, `imperative.resize`, `imperative.visibility`
- Leaflet: `leaflet.event-normalization`, `event.rate-limit`, `imperative.resize`, `imperative.visibility`

Die Adapter sind nur bereit, wenn der Host die Capabilities anbietet und das Framework im externen Peer-Harness verfuegbar ist.

## Diagnostics

Blockierende Diagnostics:

- `xtensions.imperative_poc.framework_dependency`
- `xtensions.imperative_poc.non_serializable_payload`
- `xtensions.imperative_poc.api_leak`
- `xtensions.imperative_poc.not_mounted`
- `xtensions.imperative_poc.already_destroyed`
- `xtensions.chart_poc.update_mode_unsupported`
- `xtensions.leaflet_poc.event_unsupported`
- `xtensions.imperative_poc.resize_invalid`
- `xtensions.imperative_poc.visibility_invalid`

Warnende Diagnostics:

- `xtensions.leaflet_poc.event_rate_limited`

## Definition Of Done

- `tools/xtensions/imperative-host-pocs.js` stellt Contract, Adapter Records, HostController-Stubs und Report-Serialisierung bereit.
- `tools/xtensions/imperative-host-pocs.d.ts` exportiert die Contract-Oberflaeche fuer Tooling.
- `tests/fixtures/xtensions/imperative-host-pocs-valid.json` beschreibt Chart.js und Leaflet nur als externe Peers.
- `tests/xtensions/xtensions_imperative_host_pocs_suite.js` prueft Boundary, Lifecycle, Update Policy, Event Normalization, Rate Limit Diagnostics, Resize/Visibility und Cleanup.
- `package.json` exportiert nur die Contract-Helfer, nicht die Frameworks.
- Der lokale Gate `node scripts/run_xtend_tests.js xtensions-imperative-host-pocs --json` bleibt ohne neue Dependencies gruen.
