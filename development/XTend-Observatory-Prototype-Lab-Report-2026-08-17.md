# XTend Observatory Prototype Lab Report — 17. August 2026

- Schema: `xtend.native-first.observatory-lab-report.v1`
- Status: `lab-fixtures-ready-browser-evidence-insufficient`
- Intakes: `NFM-OBS-2026-08-09`, `NFM-OBS-2026-08-17`
- Reviews: `NFM-OBS-REVIEW-2026-08-17`, `NFM-OBS-REVIEW-2026-08-17-R2`
- Adoption ADR: `development/ADR-XTend-Observatory-Adoption-2026-08-17.md`
- Browser Evidence: `tests/fixtures/native-first/observatory-adoption-lab-fixtures.json`
- ERM Browser Evidence: `tests/fixtures/native-first/observatory-erm-browser-evidence-chromium-151.json`

## Evidence-Grenze

Die Node-Labs sind reproduzierbare Contract- und Strategieproben, keine echte Browser-Performance-Messung. Fuer Chromium 151.0.7922.108 liegt unter `tests/fixtures/native-first/observatory-browser-evidence-chromium-151.json` ein an den Harness-SHA gebundenes lokales Lab-Artefakt vor. Firefox und WebKit besitzen keine versionsgebundenen Laufergebnisse und bleiben `insufficient-evidence`; damit bleibt Adoption blockiert. Das einzelne Chromium-Artefakt ist ausdruecklich `single-local-lab-not-shipping-support`.

## Wave 1: Overlay und Anchor

Das Lab trennt drei Ownership-Pfade:

- `x-dialog`: nativer Dialog nur capability-gated; Surface-Record, oeffentliche Events, Focus Return und Scroll-Lock-Policy bleiben bei XTend.
- non-modales `x-popover` und `x-tooltip`: Popover Top Layer/Light Dismiss und CSS Anchor Positioning duerfen einzeln aktiviert werden; der bestehende JS-Messpfad bleibt Fallback.
- modales `x-popover`: bleibt vollstaendig owned. Es erfolgt keine Migration auf ein nicht-modales Browser-Popover.

Die Browser-Fixture deckt Capability Detection, `closedby`, Popover, CSS Anchor Positioning und reduzierte Bewegung ab. Vor Adoption fehlen noch echte Keyboard-, Focus Return-, Escape-, Light-Dismiss-, Nested-, RTL-, Zoom-, Scroll/Resize- und A11y-Tree-Laeufe je Engine.

## Wave 1: Scheduler

Das deterministische Modell plant 500 Units bei 0,25 ms Modellkosten in maximal 4-ms-Scheiben. Es vergleicht `scheduler.yield()`, `requestIdleCallback` und Timer, haelt die Unit-Reihenfolge stabil und laesst Cancellation sowie Backpressure bei den RMT-Lanes. Die Modellwerte bleiben unter 50 ms Long-Task-, 32 ms Standard-Hydration- und 5 Prozent Durchsatz-Regression-Grenze. Der Chromium-Lauf materialisierte 500 Units in 10 Scheiben, rief `scheduler.yield()` neunmal auf, hielt die Reihenfolge stabil und meldete maximal rund 0,3 ms pro Scheibe. Reale p95-Input-Delay-, Vergleichs- und weitere Engine-Messungen fehlen weiterhin.

## Wave 1: Scoped Registry Readiness

| Komponente/Pfad | Global Self-Registration | Constructor Export | Scope-Residual |
|-----------------|--------------------------|--------------------|----------------|
| `components/xtooltip.js` | ja, `customElements.define('x-tooltip', XTooltip)` | nein | nicht scope-faehig ohne side-effect-freien Entry und Export |
| `components/xpopover.js` | ja, `customElements.define('x-popover', XPopover)` | nein | nicht scope-faehig ohne side-effect-freien Entry und Export |
| `components/xdialog.js` | ja, IIFE mit globalem `customElements.define` | nein | nicht scope-faehig ohne side-effect-freien Entry und Export |
| `components/xsurfacewindow.js` | ja, globales `customElements.define` | ja | Konstruktor ist nutzbar, Import loest aber weiterhin globale Registrierung aus |
| `xtendrmt/kernel/modules/rmt-xtend-component-adapter.js` | Registry wird nicht definiert | injizierbar ueber `options.customElements` | guter Adapter-Seam; kein Beleg fuer vollstaendige Lifecycle-/Hydration-Paritaet |

Das Lab modelliert zwei Registry-Scope-Hosts mit identischem Tag und unterschiedlichen Konstruktoren sowie einen expliziten globalen Fallback. Die Browser-Fixture versucht denselben Pfad capability-basiert und faellt ohne API ohne Produktwirkung aus.

## Wave 2

Das Navigation-Modell aktiviert die Navigation API nur bei Opt-in plus Capability und mappt ausschliesslich auf bestehende `xrouter-before-navigate`-/`xrouter-after-navigate`-Vertraege. History/Hash, Fokus, Announcement und Scroll Restore bleiben bei `x-router`.

Cross-document View Transitions besitzen eine gleich-originige Zwei-Dokument-Fixture. Sie ist bewusst nicht in die Docs-App eingebaut; ein Docs-Pilot bleibt bis zu einem echten MPA-Navigationspfad gesperrt.

## Wochenlauf: Explicit Resource Management

Das testinterne Lifecycle-Lab vergleicht den manuellen XTend-Fallback mit `DisposableStack`. Scheduler-Cancel, Worker-Termination und Surface-Release laufen in LIFO-Reihenfolge und genau einmal bei normalem Abschluss, Throw und Abort. Mehrere Cleanup-Fehler werden als `SuppressedError` sichtbar. Die Browser-Fixture laedt `using` und `await using` ausschliesslich ueber ein dynamisches Modul, damit ein nicht unterstuetzender Parser den capability-gated Fallback-Harness nicht unbrauchbar macht.

Chromium 151.0.7922.108 hat den capability-gated Harness und das dynamische Modul lokal ausgefuehrt; `using` und `await using` wurden geparst und ihre synchronen beziehungsweise asynchronen Dispose-Pfade materialisiert. Das Artefakt bindet Harness und Modul per SHA-256. Firefox und WebKit bleiben fuer dieses Lab `insufficient-evidence`; der einzelne Chromium-Lauf ist `single-local-lab-not-shipping-support`.

Die Evidence autorisiert keine `[Symbol.dispose]`-Methoden in produktiven Komponenten, keine Package-Exports und keine Runtime-Dependency. Die vorhandenen idempotenten `dispose()`-Vertraege bleiben Owner. Das Adoption-Outcome ist `defer-with-watch`, bis Safari stabil ist und versionsgebundene Artefakte fuer die vollstaendige Zielbrowser-Matrix vorliegen.

## Watchpoints ohne Prototyp

- Accessibility Testing: auf veroeffentlichte WPT-/Automation-Infrastruktur warten und danach Name, Role, State, Focus und Hydration mappen.
- JSPI: auf Safari 27 stable und einen konkreten Wasm-Import warten, der Promise-Suspension benoetigt.
- `shadowrootslotassignment`: auf einen akzeptierten XTend-DSD-SSR-Contract oder eine zweite ausliefernde Zielengine warten.
- Fetch Request Streaming: auf einen requestseitigen Maraca-Streaming-Contract und einen HTTP/2-/HTTP/3-End-to-End-Test warten; gepufferte JSON-Requests bleiben Default.
