# x-rmt-lifecycle-demo-build - XTend Komponente

## Uebersicht

`<x-rmt-lifecycle-demo-build>` ist die aus `xtendrmt/rmt-lifecycle-demo.rmt` erzeugte RC1-Test-Build-Komponente. Sie dient als lokaler, manifestierter Nachweis fuer den RMT-vNext-App-Build-Pfad und verbindet Root-Lifecycle, Template-Extension, Scheduler-Handschlag, A11y-Profil und Performance-Profil in einem Custom Element.

## Verwendung

```html
<x-rmt-lifecycle-demo-build
  variant="rc1"
  aria-label="RMT Lifecycle Demo Build">
  Lifecycle Demo
</x-rmt-lifecycle-demo-build>
<script type="module" src="/components/x-rmt-lifecycle-demo-build.js"></script>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `variant` | String | Markiert die lokale Demo-Variante fuer Fixtures und Browser-Smokes. |
| `aria-label` | String | Pflichtname fuer die semantische `region` im Shadow DOM. |

## Scaffold Contracts

Die generierte Komponente exposes folgende statische Contracts:

- `xtendScaffoldWiring` mit `xtend.scaffold.feature-wiring.v1`
- `xtendScaffoldExtensionPoints` mit `xtend.scaffold.component-extension-points.v1`
- `xtendScaffoldA11yProfile` mit `xtend.a11y.profile.v1`
- `xtendScaffoldPerformanceProfile` mit `xtend.performance.component-profile.v1`

Der Root-Lifecycle nutzt `xtend.rmt.root-handshake.v1` und bleibt ueber Scheduler Endpoint Hints an den XTend Host Adapter gekoppelt. Der RMT Kernel liest die XTend-Komponente nicht direkt, sondern behandelt Component Refs, Templates und Events als Daten.

## Events

| Event | Beschreibung |
|-------|--------------|
| `rmt-lifecycle-demo-build-ready` | im Scaffold-Wiring deklarierter Ready-Kanal fuer Host-Adapter. |
| `rmt-lifecycle-demo-build-changed` | im Scaffold-Wiring deklarierter State-Change-Kanal fuer Host-Adapter. |

## A11y-Profil

Das A11y-Profil setzt `role="region"`, verlangt ein `aria-label`, beschreibt Screenreader-Signale fuer semantische Region und Statusaenderungen und fuehrt Reduced-Motion-/Forced-Colors-Regeln im Shadow DOM.

## Performance-Profil

Das Performance-Profil nutzt `xtend.performance.component-profile.v1`, `budgetClass: critical`, `lane: user-blocking` und `hydrationPolicy: visible`. Kritische Messpunkte sind Loader, Mount, Hydration, Render, Update, State-Sync und Event-Action.

## RC1 Build Boundary

Die Komponente ist absichtlich ein Build-Artefakt aus dem RMT-vNext-Pfad:

- Source: `xtendrmt/rmt-lifecycle-demo.rmt`
- Generator: `xtend-builder/generators/rmt-build.js`
- Build-Komponente: `components/x-rmt-lifecycle-demo-build.js`
- Browser Smoke: `tests/browser/fixtures/rmt-lifecycle-demo-rmt-build-smoke.html`

Damit ist sie Teil der RC1-Test-Build-Recovery: Manifest, Docs, Suite, Fixture und Public Types bleiben im Component Catalog sichtbar.
