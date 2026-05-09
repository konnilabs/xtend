# WP-SM-06 - Overlay-Kompatibilitaet und Stack-Bridge vorbereiten

Status: completed
Local Gate: `node scripts/run_xtend_tests.js surface-overlay-bridge --json`
Contract: `development/XTend-SurfaceManager-Overlay-Stack-Bridge-Contract.md`

## Ziel

Bestehende Overlay-Komponenten sollen optional am Surface Stack teilnehmen, ohne dass ihre Legacy-APIs ersetzt werden. `x-modal`, `x-dialog` und `x-drawer` bleiben normale XTend-Komponenten und koennen im `overlays` Slot eines `x-surface-manager` als `modal`, `dialog` oder `drawer` Surface registriert werden.

## Umsetzung

- `components/xsurfaceoverlay-bridge.js` erzeugt `xtend.surface.record.v1` Records fuer `x-modal`, `x-dialog` und `x-drawer`.
- `components/xsurfaceoverlay-bridge.d.ts` beschreibt die Bridge-API und das Compatibility Profile.
- `components/xsurfacemanager.js` erkennt kompatible Overlays, verarbeitet `surface-overlay-command` und uebersetzt Legacy Lifecycle Events in Controller-Operationen.
- `components/xmodal.js`, `components/xdialog.js` und `components/xdrawer.js` deklarieren `xtendSurfaceOverlayCompatibilityProfile`.
- Die Overlay-z-Order kann ueber `--surface-overlay-z` und `--surface-overlay-backdrop-z` aus dem Surface Snapshot gesteuert werden.
- `tests/components/fixtures/xsurfaceoverlaybridge.component.html` bildet Modal, Dialog und Drawer im `overlays` Slot ab.

## Done Criteria

- `x-modal`, `x-dialog` und `x-drawer` koennen ohne Breaking Change optional registriert werden.
- Legacy Events bleiben sichtbar und werden nicht vom Manager verschluckt.
- Der Surface Controller aus `WP-SM-02` bleibt die einzige Registry.
- Legacy Keys `modal-open-<id>`, `dialog-open-<id>` und `xdrawer-open-<id>` bleiben dokumentiert.
- Package-, Scaffold-, Docs- und Runner-Metadaten enthalten `surface-overlay-bridge`.
- Der lokale Gate `node scripts/run_xtend_tests.js surface-overlay-bridge --json` ist gruen.

## Handoff

`WP-SM-07` sollte die vorbereiteten Browser-, A11y-, Performance- und Visual-Gates aktivieren. Besonders wichtig sind Fokus-Rueckgabe, Escape-Topmost-Verhalten, mobile Drawer/Panel Ueberlagerung und Stack-Screenshots mit gemischten Windows, SidePanels und Overlays.
