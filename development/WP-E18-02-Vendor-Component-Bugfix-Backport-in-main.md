# WP-E18-02 - Vendor Component Bugfix Backport in main

- Status: `completed`
- Datum: 2026-05-19
- Epic Docs: `docs/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Depends on: `WP-E18-01`
- WP Contract: `xtend.epic18.wp02.vendor-component-bugfix-backport.v1`
- Zielzustand: `vendor-component-bugfixes-backported`
- Boundary: `no-unreviewed-vendor-directory-copy`
- Boundary: `no-media-manager-product-workarounds`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js components surface-controller overlay-interaction-ux layout-display-media-ux references --json`
  - Ergebnis 2026-05-19: `passed` mit 5/5 Suites, 11124 Assertions, 0 Failures, 0 Warnings

## Ziel

`WP-E18-02` uebernimmt die im Media-Manager-Vendor-Snapshot enthaltenen
Komponenten-Bugfixes gezielt in XTend main. Der Backport bleibt eng: Nur die
fuenf dokumentierten Komponenten-Deltas aus `WP-E18-01` werden uebernommen.

## Geaenderte Komponenten

| Datei | Backport |
|-------|----------|
| `components/xtooltip.js` | Tooltip-Overlay nutzt nun `viewport-fixed-layer`, repositioniert bei Scroll/Resize per RAF und wird nicht mehr durch lokale Surface-Container geclippt. |
| `components/xplayer.js` | Behebt Module-Scope-`this.shadowRoot`, macht `customElements.define` idempotent, haertet Host-/Player-Containment, Titel-Ellipsis, Volume-Hover, ResizeObserver und native Playback-Events. |
| `components/xsurfacewindow.js` | Content-Region scrollt vertikal und unterbindet horizontale Surface-Scrollbars. |
| `components/xsidepanel.js` | Content-Region unterbindet horizontale Scrollbars; Collapse-Icon folgt Placement und Collapsed-State. |
| `components/xsurfacemanager-controller.js` | Re-Register bewahrt Runtime-Bounds, Previous Bounds, Status, Z-Order, Minimize/Maximize, Pin/Collapse, Placement und Mode. |

## Nicht uebernommen

- keine Dateien ausserhalb der fuenf Komponenten
- keine `.DS_Store`-Artefakte aus Vendor-Vergleichen
- keine Media-Manager-Theme- oder Shadow-DOM-Monkeypatches
- keine Produkt-Surface-Taxonomie oder MediaRecord-Pflicht

## Paritaetscheck

Nach dem Backport ist der Komponentenbaum gegen den Vendor-Snapshot deckungsgleich:

```bash
diff -qr components /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/components
```

Ergebnis:

```text
no differences
```

Die geplante Delta-Statistik ist damit vollstaendig umgesetzt:

```text
5 files changed, 241 insertions(+), 41 deletions(-)
```

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Alle fuenf Komponenten-Deltas sind in main uebernommen | erfuellt |
| Keine ungezielte Vendor-Komplettkopie | erfuellt |
| Keine Media-Manager-Produkt-Workarounds | erfuellt |
| Component-Paritaet gegen Vendor-Snapshot | erfuellt |
| Lokaler Gate laeuft gruen | erfuellt |
| `WP-E18-03` kann Regression-Smokes bauen | erfuellt |

## Handoff

`WP-E18-02` ist abgeschlossen. `WP-E18-03` kann jetzt die Regression-Smokes fuer
Tooltip-Clipping, XPlayer-Import/Resize/Events, Surface-Scrollbar-Grenzen und
Surface-Controller-Re-Register-Preserve bauen.
