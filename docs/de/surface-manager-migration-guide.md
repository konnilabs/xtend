# SurfaceManager Migration Guide

Dieser Leitfaden migriert ein ad-hoc Fenster, Panel oder Modal in eine verwaltete Surface. Die Umstellung bleibt schrittweise: Fachinhalt und sichtbares Design können bestehen bleiben, während Lifecycle, Fokus und Cleanup zum Controller wechseln.

## Bestehendes Verhalten erfassen

Notiere vor der Änderung Öffnen, Schließen, Fokus, Escape, Bounds, Persistenz, Router-Bezug und alle Listener oder Timer. Bestimme, ob Close nur versteckt oder endgültig zerstört. Vergib anschließend eine stabile `surface-id`; sie ersetzt keine fachliche ID, sondern identifiziert den Lifecycle-Owner.

## Host-Grenze einführen

```html
<x-surface-manager id="workspace" manager-id="product-shell">
  <x-surface-window surface-id="legacy-report" label="Report">
    <div id="legacy-report-host"></div>
  </x-surface-window>
</x-surface-manager>
```

Mounte den bestehenden Inhalt zunächst unverändert in den Host. Öffne und schließe ihn ab jetzt über `openSurface('legacy-report')` und `closeSurface('legacy-report')`. Entferne parallele globale Klick- oder Escape-Handler, sobald Stack Policy und Browser-Smoke dasselbe Verhalten belegen.

## Zustand verschieben

UI-lokaler Zustand darf im Inhalt bleiben. Sichtbarkeit, aktive Surface, Geometrie und Persistence gehören dem Manager. Kanonische Route bleibt beim Router; ein Route Adapter übersetzt Navigation in Controller-Operationen. Registriere Resource-, Chunk- und Prewarm-Handles, damit `destroySurface()` sie freigeben kann.

## Migration prüfen

```bash
node scripts/run_xtend_tests.js surface-controller surface-manager surface-manager-a11y --json
```

Teste zusätzlich wiederholtes Öffnen, Close versus Destroy, Fokuswiederherstellung, Reduced Motion, Storage-Fehler und fehlende optionale Inhalte. Entferne den alten Owner erst, wenn kein doppelter Listener, kein zweiter Z-Index-Stack und kein separater Persistence-Key übrig ist.

## Typische Fehler

- Zwei Owner schreiben gleichzeitig Sichtbarkeit oder Bounds.
- Ein Modal wird optisch geschlossen, bleibt aber im Fokus-Stack aktiv.
- Ein zufälliger ID-Suffix kaschiert eine Duplicate-Diagnose.
- Remote-Fehler entfernen den lokalen Fallback.
- Destroy lässt Netzwerk, Observer oder Timer weiterlaufen.

## Nächste Schritte

- [Authoring Guide](./surface-manager-authoring-guide.md)
- [Controller](./surface-manager-controller.md)
- [Quality Gates](./surface-manager-quality-gates.md)
