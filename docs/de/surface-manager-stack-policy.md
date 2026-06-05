# SurfaceManager Stack Policy

Contract: `xtend.surface.stack-policy.v1`

Die Stack Policy gehört dem `x-surface-manager`. Sie koordiniert Modalität, Focus Restore, Inert, Escape, Scroll Lock und Layer Tokens für Fenster, Panels und Overlays.

## Policy

- `modal-policy` entscheidet, ob nur die oberste Surface oder mehrere Surfaces modal wirken.
- Focus Restore bringt Fokus nach dem Schließen zur vorherigen Quelle zurück.
- Inert und `aria-hidden` isolieren Hintergrund-Surfaces.
- Escape wirkt topmost und schließt nicht versehentlich tiefere Surfaces.
- Scroll Lock ist an aktive modale Surfaces gebunden.
- Die Runtime erstellt keine zweite Registry.

## Gate

```bash
node scripts/run_xtend_tests.js surface-stack-policy --json
```
