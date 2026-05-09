# XTend Component Lab UX Inspector

Schema: `xtend.epic11.component-lab-ux-inspector.v1`  
Report-Schema: `xtend.epic11.component-lab-ux-inspector-report.v1`  
Workpackage: `WP-E11-13`

## Zweck

Der Component Lab UX Inspector erweitert den Epic-10-Pilot zu einer Epic-11-Produktionsschicht fuer UX-Reife. Er macht Shell, Styling, A11y, Performance, State, Component Network, RMT Authoring, Fabric Telemetry, Diagnostics und Source Links gemeinsam inspizierbar.

RMT beschreibt dabei die Lab-Shell, Routen, Panels, Templates und Schedules. XTend-Komponenten werden ausschliesslich ueber Adapter gemountet. Der RMT-Kernel importiert keine XTend-Klassen und keine XTend-Typen; die Grenze bleibt `no-rmt-kernel-import-of-xtend-types`.

## UX-Familien

Der Inspector fasst die fuenf Epic-11-Komponentenlinien zusammen:

| Familie | Schema | Fixture | Gate |
|---------|--------|---------|------|
| Form Controls | `xtend.component.form-controls-ux.v1` | `tests/fixtures/rmt-form-controls-ux.rmt` | `form-controls-ux` |
| Feedback und Status | `xtend.component.feedback-status-ux.v1` | `tests/fixtures/rmt-feedback-status-ux.rmt` | `feedback-status-ux` |
| Navigation und Routing | `xtend.component.navigation-routing-ux.v1` | `tests/fixtures/rmt-navigation-routing-ux.rmt` | `navigation-routing-ux` |
| Overlay und Interaction | `xtend.component.overlay-interaction-ux.v1` | `tests/fixtures/rmt-overlay-interaction-ux.rmt` | `overlay-interaction-ux` |
| Layout, Display und Media | `xtend.component.layout-display-media-ux.v1` | `tests/fixtures/rmt-layout-display-media-ux.rmt` | `layout-display-media-ux` |

Zusammen ergeben diese Familien 31 `enterprise-ready` Preview Targets.

## Panels

| Panel | Zweck |
|-------|-------|
| `ux-family-matrix` | Familien, Reifestatus, Zielkomponenten und Coverage anzeigen |
| `component-preview` | konkrete XTend-Komponente ueber `xtend.component` inspizieren |
| `rmt-inspector` | RMT-Dokument, Routes, Templates, Schedules und Adapter sehen |
| `state` | State-Key, Snapshot-Pfade und Zustandskontrakte sichtbar machen |
| `styling` | Tokens, CSS Parts, Variants, Size und Density pruefen |
| `a11y` | Rollen, Fokus, Keyboard, Live Regions und Screenreader-Hinweise anzeigen |
| `performance` | Lane, Fiber, Hydration Policy, Budget und Messpunkte sehen |
| `component-network` | Events, Commands, Form/Overlay/Router/Feedback-Verbindungen inspizieren |
| `telemetry` | Fabric- und Component-Telemetry-Snapshots korrelieren |
| `source-links` | Runtime, Docs, Types, Fixtures und Suites verlinken |

## RMT Fixture

Das Referenzfixture liegt in `tests/fixtures/rmt-component-lab-ux-inspector.rmt`.

Es beschreibt:

- `lab.ux.shell` als Shell-first App Surface
- `lab.ux.router` im Hash-Modus
- Routen fuer Overview, Familien, Komponenten, RMT, Telemetry und Component Network
- Schedules fuer Shell Render, Route Render, Visible/Idle/Lazy Hydration, Inspector-Snapshots und Diagnostics
- Adapter `xtend.component`, `xtend.xrouter`, `rmt.state-scheduler-diagnostics`, `xtend.fabric-telemetry` und `xtend.component-lab-ux-inspector`

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js component-lab-ux-inspector --json
```

Der Gate validiert Plan, Fixture, 31 Targets, fuenf Familien, zehn Panels, zehn Inspector-Domains, Package-Metadaten, Scaffold-Metadaten, Runner-Registrierung und Referenzpfade.

## Handoff

`WP-E11-14` kann auf dem Inspector aufbauen und browsernahe UX-Smokes entlang echter Journeys definieren. Der Inspector liefert dafuer die Matrix, welche Komponentenfamilie ueber welchen RMT-Schedule, welche Fabric-Lane und welche UX-Domain verifiziert werden soll.
