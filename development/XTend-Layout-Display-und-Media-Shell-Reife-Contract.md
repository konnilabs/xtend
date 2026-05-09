# XTend Layout, Display und Media Shell-Reife Contract

Status: `accepted`  
Schema: `xtend.component.layout-display-media-ux.v1`  
Report-Schema: `xtend.component.layout-display-media-ux-report.v1`  
Owner: `WP-E11-12`

## Ziel

Dieser Contract hebt Layout-, Display- und Media-Komponenten auf die Epic-11-Shell-Reife. Die Komponenten bleiben native Web Components, koennen aber in RMT-first Apps shell-first geplant, sichtbar gemountet, idle hydriert oder fuer Media lazy geladen werden.

Der RMT-Kernel bleibt framework-agnostisch. XTend-spezifische Details werden nur ueber Adapter-, Profil- und Schedule-Metadaten sichtbar. Die Grenze bleibt `no-rmt-kernel-import-of-xtend-types`.

## Zielkomponenten

- `x-section`
- `x-cards`
- `x-header`
- `x-footer`
- `x-hero`
- `x-type`
- `x-code`
- `x-masonry`
- `x-summary`
- `x-player`
- `x-lightbox`

## Runtime-Profil

Jede Zielkomponente stellt `xtendLayoutDisplayMediaUxProfile` bereit.

```js
{
  schema: "xtend.component.layout-display-media-ux-profile.v1",
  componentRef: "x-player",
  family: "media-player",
  schedule: "media.lazy.load",
  stateKey: "xplayer-state-<id>",
  fabric: { lane: "media", api: "@xtend-fabric" },
  rmt: {
    adapter: "xtend.component",
    kernelBoundary: "no-rmt-kernel-import-of-xtend-types"
  }
}
```

## Responsive Shell

Layout- und Display-Komponenten muessen Viewport-Overflow lokal halten. `x-section`, `x-cards`, `x-header`, `x-footer`, `x-hero` und `x-masonry` stellen CSS Parts und responsive Shell-Strategien bereit, damit RMT Shells ohne DOM-Wissen planen koennen.

## Slots

Die Familie nutzt stabile Slots fuer Projektion:

- `default`
- `header`
- `footer`
- `media`
- `actions`
- komponentenspezifische Slots wie `hero-title`, `nav`, `utility`, `title`, `extra`

## CSS Parts

Komponenten muessen mindestens Root-/Container-/Content-Parts oder passende Media-/Control-Parts bereitstellen. Dadurch koennen App-Shells und Docs-Shells gestylt werden, ohne interne DOM-Struktur zu kopieren.

## Lazy Media

`x-player` und `x-lightbox` werden mit `media.lazy.load` vorbereitet und wechseln fuer Nutzereingaben in `media.playback.user`. Media darf nicht als Voraussetzung fuer initiales Shell-Rendering gelten.

## RMT

Die Referenz-Fixture `tests/fixtures/rmt-layout-display-media-ux.rmt` beschreibt eine Shell-first Docs-App-Struktur mit `rmt.layout-host`, `rmt.media-host`, `xtend.component` und `rmt.state-scheduler-diagnostics`.

Pflicht-Schedules:

- `component.shell.render`
- `component.visible.mount`
- `component.idle.hydrate`
- `component.lazy.hydrate`
- `layout.measure`
- `layout.reflow.commit`
- `media.lazy.load`
- `media.playback.user`
- `a11y.announce`
- `diagnostics.snapshot`

## Fabric

Die Komponenten deklarieren Fabric-Lanes fuer `visible`, `idle`, `media`, `a11y` und `diagnostics`. Die Runtime importiert Fabric nicht hart, sondern bleibt fuer `@xtend-fabric` Adapter anschlussfaehig.

## Testing

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js layout-display-media-ux --json
```

Pflichtassertions:

- `responsive-overflow-safe`
- `css-parts-present`
- `slot-contract-stable`
- `lazy-media-scheduled`
- `aspect-ratio-stable`
- `reduced-motion-safe`
- `forced-colors-safe`
- `docs-app-compatible`
- `fabric-lane-profile`
- `kernel-boundary-preserved`
