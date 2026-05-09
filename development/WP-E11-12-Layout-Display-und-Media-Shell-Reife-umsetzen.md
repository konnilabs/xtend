# WP-E11-12 - Layout, Display und Media Shell-Reife umsetzen

Status: `completed`  
Schema: `xtend.epic11.wp12.layout-display-media-ux.v1`  
Contract: `xtend.component.layout-display-media-ux.v1`

## Ziel

`WP-E11-12` setzt die Shell-Reife fuer Layout-, Display- und Media-Komponenten um. Die Komponenten sollen in RMT-first Apps als sichtbare App-Shell, Content-Surface oder lazy Media-Surface planbar sein, ohne XTend in den RMT-Kernel einzubauen.

## Umgesetzte Artefakte

- Contract: `xtend-builder/typing/layout-display-media-ux-contract.js`
- Contract-Dokument: `development/XTend-Layout-Display-und-Media-Shell-Reife-Contract.md`
- RMT-Fixture: `tests/fixtures/rmt-layout-display-media-ux.rmt`
- Suite: `tests/components/layout_display_media_ux_suite.js`
- Runtime-Profile: `xtendLayoutDisplayMediaUxProfile`
- Public Types fuer `x-section`, `x-cards`, `x-header`, `x-footer`, `x-hero`, `x-type`, `x-code`, `x-masonry`, `x-summary`, `x-player`, `x-lightbox`
- Component-Fixtures und Component-Level-Suites fuer die bisherigen Display-Long-Tail-Komponenten

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

## Entscheidungen

- Layout-/Display-/Media-Reife wird als eigener Contract modelliert, nicht als Sonderfall von Overlays oder Navigation.
- `x-player` und `x-lightbox` verwenden `media.lazy.load`; User-Gesten laufen ueber `media.playback.user`.
- `x-type` nutzt nun eine Shadow-DOM-Shell, damit CSS Parts, A11y- und Snapshot-Verhalten konsistent zu den anderen Komponenten sind.
- RMT authoriert Shell, Slots, Parts, Schedules und Commands, ohne interne XTend-Klassen zu kennen.

## Akzeptanz

- `xtend.component.layout-display-media-ux.v1` validiert.
- Fixture-Referenzen loesen vollstaendig auf.
- Jede Zielkomponente stellt `xtendLayoutDisplayMediaUxProfile`, RMT-Metadaten, A11y-Profil, Performance-Profil, CSS Parts und `snapshot()` bereit.
- Package, Scaffold, Runner, Epic, Backlog, Typing-README und Referenzpfade kennen den neuen Gate.
- Catalog Coverage schliesst die Display-/Media-Luecken sichtbar.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js layout-display-media-ux --json
```

## Handoff

`WP-E11-13` ist startbereit. Der Component Lab UX Inspector kann nun Form, Feedback, Navigation, Overlay sowie Layout/Display/Media auswerten.
