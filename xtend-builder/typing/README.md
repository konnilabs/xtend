# XTend-Scaffold Typing

Dieser Bereich enthaelt ab `WP-E03-09` den Typisierungs-Contract fuer scaffolded Komponenten.

`xtend-builder/typing/component-types.js` stellt das Schema `xtend.scaffold.component-typing.v1` bereit. Das Modul erzeugt keine Runtime und schreibt keine Dateien. Es leitet aus Component-Plan und Feature-Wiring einen reviewbaren Contract fuer `.d.ts`-Artefakte ab.

```bash
node xtend-builder/scaffold.js typing --tag x-example --profile display --feature state --json
```

## Contract

Der Typing-Contract umfasst:

- Zielpfad `components/<tag>.d.ts`
- Event-Name-Union und Event-Detail-Interface
- Attribute-Map fuer oeffentliche Attribute
- Property-Map fuer spaetere explizite Properties
- HTMLElementTagNameMap-Erweiterung
- ab Epic 10 / `WP-E10-03` den Component Contract v2 `xtend.component.contract.v2` fuer TypeScript Source, Public API, RMT, Fabric, Telemetry, Lanes, A11y, Performance, Tests, Docs und Maturity
- Scaffold-Wiring-Interface fuer State-, Event- und API-Signale
- vorbereitete XTendRMT-Anschluss-Typen fuer `xtend.component` und `xtend.xrouter`
- ab Epic 04 / `WP-E04-03` den Component Contract `xtend.rmt.component-contract.v1` mit Manifest Lookup, Attributes, Hydration, Diagnostics und Kernel-Grenzen
- ab Epic 04 / `WP-E04-04` den Template Authoring Contract `xtend.rmt.template-authoring.v1` mit Template-Refs, Component-Refs, Slots, Events, Hydration und Adapter-Grenzen
- ab Epic 04 / `WP-E04-05` den Root Handshake Contract `xtend.rmt.root-handshake.v1` mit Root-Refs, Lifecycle-Phasen, Scheduler-Endpoint-Hints und Digital-Twin-State-Policy
- ab Epic 04 / `WP-E04-06` den Host Capability Contract `xtend.rmt.host-capabilities.v1` fuer Manifest, Custom Elements, `xtend-state`, Hydration, Scheduler-Endpoints, Theme, API, Router und Diagnostics
- ab Epic 04 / `WP-E04-07` das RMT Compatibility Binding `xtend.scaffold.rmt-compatibility-binding.v1`, das Typing, Manifest-Plan, Preview-Plan und Extension-Punkte zusammenfuehrt
- ab Epic 04 / `WP-E04-08` den dedizierten Gate `node scripts/run_xtend_tests.js rmt-compatibility --json`

## XTendRMT-Grenze

Der RMT-Anschluss ist ein Typ- und Adapter-Contract. Er implementiert keine Bridge, erweitert keinen RMT-Kernel und schreibt keine `.rmt` Dateien. Ab `WP-E04-03` beschreibt er explizit, welche Felder der neutrale RMT Component Record besitzt und welche Arbeit beim XTend Host Adapter bleibt. Ab `WP-E04-04` beschreibt er zusaetzlich, wie RMT Templates XTend-Komponenten ueber `xtend.template`, `componentRef`, `slots` und `events` authoren koennen. Ab `WP-E04-05` beschreibt er, wie der RMT Scheduler Root-Phasen plant, ohne Custom-Element-Lifecycle, `xtendState` oder Host Cleanup selbst auszufuehren. Ab `WP-E04-06` beschreibt er, welche XTend Host Capabilities als Adapterdaten verhandelbar sind. Ab `WP-E04-07` bindet er diese Vertrage in einen gemeinsamen Dry-Run-Contract fuer Typing, Manifest, Preview und Extensions. Ab `WP-E04-08` prueft `rmt-compatibility` diesen Contract als eigenen Runner-Gate. Die produktive Bridge bleibt Epic 05 vorbehalten.

## Component Contract v2

`component-contract-v2.js` stellt ab `WP-E10-03` den Contract `xtend.component.contract.v2` bereit. Das Modul erzeugt einen reviewbaren Contract fuer neue TypeScript-first Komponenten und bietet einen Validator fuer Pflichtdomains, ESM-Runtime, RMT-Kernel-Boundary und Public-API-Form.

```bash
node scripts/run_xtend_tests.js component-contract-v2 --json
```

Der Contract ist generator-only. Er fuehrt keine Runtime-Imports, keine XTendRMT-Kernel-Imports und keine produktiven Writes aus.

## Component Network Contract

`component-network-contract.js` stellt ab `WP-E11-06` den Contract `xtend.component.network.v1` bereit. Das Modul modelliert Events, Commands, Contexts, Forms, Validation, Feedback, Overlays, Routing, Theme, State, RMT Authoring und Fabric Diagnostics fuer vernetzbare Enterprise-Komponenten.

```bash
node scripts/run_xtend_tests.js component-network-contract --json
```

Der Contract ist generator-only. Er beschreibt Adapterdaten fuer RMT ueber `xtend.rmt.component-network-authoring.v1`, importiert aber keine XTend-Typen in den RMT Kernel.

## RMT Shell Authoring Contract

`rmt-shell-authoring-contract.js` stellt ab `WP-E11-07` den Contract `xtend.rmt.shell-authoring.v1` bereit. Das Modul fuehrt Shell, Styling, Runtime-A11y, UX-Performance und Component Network in ein RMT-first Authoring-Modell fuer sichtbare Component UX zusammen.

```bash
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
```

Der Contract ist generator-only. RMT deklariert `shell`, `style`, `a11y`, `commands`, `events`, `variants`, `density`, `hydration`, `schedule` und `fabric`; XTend-Komponentenausfuehrung, XRouter, Fabric und DOM-Materialisierung bleiben Host-Adapterarbeit.

## RMT DSL Authoring Polish

`rmt-dsl-authoring-polish.js` stellt ab `WP-E12-13` den Contract `xtend.rmt.dsl-authoring-polish.v1` bereit. Das Modul beschreibt Alias-Sugar, Diagnostik, Token Bridge und XRouter-/XLink-Routing-Sugar fuer Component Shells, damit XTendRMT upstream die DSL benutzerfreundlicher machen kann.

```bash
node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json
```

Der Contract ist generator-only und upstream-orientiert. Er normalisiert keine produktiven `.rmt` Dateien selbst und haelt `no-rmt-kernel-import-of-xtend-types` als harte Grenze sichtbar.

## Form Controls UX Contract

`form-controls-ux-contract.js` stellt ab `WP-E11-08` den Contract `xtend.component.form-controls-ux.v1` bereit. Das Modul beschreibt die UX-Reife der Form-Control-Familie, das Runtime-Profil `xtendFormControlUxProfile`, RMT Shell-first Authoring, Validation, A11y, Fabric-Lanes und die Zielkomponenten `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-calendar`, `x-form` und `x-writer`.

```bash
node scripts/run_xtend_tests.js form-controls-ux --json
```

Der Contract ist generator-only. Die produktive UI bleibt in den Komponenten; RMT beschreibt Shell, Events, Commands und Schedules ueber `xtend.component`.

## Feedback Status UX Contract

`feedback-status-ux-contract.js` stellt ab `WP-E11-09` den Contract `xtend.component.feedback-status-ux.v1` bereit. Das Modul beschreibt die UX-Reife der Feedback- und Status-Familie, das Runtime-Profil `xtendFeedbackStatusUxProfile`, RMT Shell-first Authoring, Live Regions, Dismiss/Timeout, Motion Safety, Fabric-Lanes und die Zielkomponenten `x-alert`, `x-toast`, `x-status`, `x-progress` und `x-spinner`.

```bash
node scripts/run_xtend_tests.js feedback-status-ux --json
```

Der Contract ist generator-only. RMT beschreibt Shell, A11y, Events, Commands und Schedules ueber `xtend.component`; XTend rendert und hydriert die Custom Elements im Host.

## Navigation Routing UX Contract

`navigation-routing-ux-contract.js` stellt ab `WP-E11-10` den Contract `xtend.component.navigation-routing-ux.v1` bereit. Das Modul beschreibt die UX-Reife der Navigation- und Routing-Familie, das Runtime-Profil `xtendNavigationRoutingUxProfile`, RMT Shell-first Authoring, Active State, Focus Restore, Route Announcements, Keyboard Navigation, Fabric-Lanes und die Zielkomponenten `x-router` und `x-link`.

```bash
node scripts/run_xtend_tests.js navigation-routing-ux --json
```

Der Contract ist generator-only. RMT beschreibt Route Context, Links, Events, Commands und Schedules ueber `xtend.xrouter` und `xtend.component`; XTend rendert, fokussiert, announced und hydriert die Custom Elements im Host.

## Overlay Interaction UX Contract

`overlay-interaction-ux-contract.js` stellt ab `WP-E11-11` den Contract `xtend.component.overlay-interaction-ux.v1` bereit. Das Modul beschreibt die UX-Reife der Overlay- und Interaction-Familie, das Runtime-Profil `xtendOverlayInteractionUxProfile`, RMT Shell-first Authoring, Overlay Stack, Focus Trap, Inert, Scroll Lock, Escape, Portal-Semantik, Fabric-Lanes und die Zielkomponenten `x-modal`, `x-dialog`, `x-popover`, `x-tooltip` und `x-drawer`.

```bash
node scripts/run_xtend_tests.js overlay-interaction-ux --json
```

Der Contract ist generator-only. RMT beschreibt Overlay-Shells, Events, Commands und Schedules ueber `xtend.component` und `rmt.overlay-stack`; XTend rendert, trappt Fokus, verwaltet Rueckfokus und DOM-nahe Inert-/Scroll-Lock-Regeln im Host.

## Layout Display Media UX Contract

`layout-display-media-ux-contract.js` stellt ab `WP-E11-12` den Contract `xtend.component.layout-display-media-ux.v1` bereit. Das Modul beschreibt die UX-Reife der Layout-, Display- und Media-Familie, das Runtime-Profil `xtendLayoutDisplayMediaUxProfile`, RMT Shell-first Authoring, Responsive Slots, CSS Parts, Lazy Media, Fabric-Lanes und die Zielkomponenten `x-section`, `x-cards`, `x-header`, `x-footer`, `x-hero`, `x-type`, `x-code`, `x-masonry`, `x-summary`, `x-player` und `x-lightbox`.

```bash
node scripts/run_xtend_tests.js layout-display-media-ux --json
```

Der Contract ist generator-only. RMT beschreibt Shell, Layout, Media-Lifecycle, Events, Commands und Schedules ueber `xtend.component`, `rmt.layout-host` und `rmt.media-host`; XTend rendert, misst, hydriert und bedient Media im Host.

## Ausnahmeprozess

Typfreie Komponenten sind nur mit dokumentierter Ausnahme erlaubt. Verboten bleiben:

- undokumentierte Typ-Luecken
- implizites `any` fuer oeffentliche APIs
- Runtime-Imports aus `.d.ts` Artefakten
