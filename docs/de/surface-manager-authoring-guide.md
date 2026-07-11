# SurfaceManager Authoring Guide

Dieser Einstieg baut eine kleine Workbench mit einem verwalteten Fenster. Der SurfaceManager besitzt Registry, Fokusreihenfolge, Layout-Snapshot und Cleanup; der Inhalt der Surface bleibt Eigentum der jeweiligen Fachfunktion.

## Voraussetzungen

Lade `x-surface-manager` und `x-surface-window` über `components/manifest.json`. Jede Surface benötigt eine stabile `surface-id`, damit Controller-Records, Persistenz und Diagnostics über mehrere Renderzyklen derselben Fläche zugeordnet werden können.

## Eine Surface anlegen

```html
<x-surface-manager id="workspace" manager-id="docs-workspace">
  <x-surface-window
    surface-id="activity"
    label="Activity"
    initial-x="24"
    initial-y="24"
    initial-width="520"
    initial-height="340">
    <x-status state="ready" message="No pending work"></x-status>
  </x-surface-window>
</x-surface-manager>
```

Beim Upgrade registriert der Manager das Kind als `xtend.surface.record.v1`. `open`, `focus`, `move`, `resize`, `minimize`, `restore`, `close` und `destroy` werden über den Controller ausgeführt. Direkte Änderungen an privaten Fensterknoten umgehen Snapshot und Diagnostics und sind deshalb keine unterstützte Integration.

## Öffnen und beobachten

```js
await customElements.whenDefined('x-surface-manager');

const manager = document.querySelector('#workspace');
manager.addEventListener('surface-opened', ({ detail }) => {
  console.log(detail.surfaceId);
});

manager.openSurface('activity');
console.log(manager.snapshot());
```

`snapshot()` liefert Registry, aktive Surface, Bounds und Lifecycle-Daten. Wenn Persistenz aktiviert ist, verwende einen hosteigenen `restore-key`; behandle Storage-Fehler als Diagnose und nicht als Grund, die Surface doppelt zu registrieren.

## Fokus und Cleanup

Overlays und modale Surfaces müssen Fokus übernehmen und nach dem Schließen an den vorherigen Owner zurückgeben. Escape wird durch die Stack Policy ausgewertet. `closeSurface()` hält einen Record für spätere Wiederverwendung; `destroySurface()` entfernt ihn und gibt registrierte Prewarm-, Chunk- und Resource Handles frei.

Prüfe den öffentlichen Pfad lokal:

```bash
node scripts/run_xtend_tests.js surface-controller surface-manager --json
```

## Fehlerbehebung

- Bei `surface.duplicate` verwenden zwei Elemente dieselbe `surface-id`; vergib keinen zufälligen Ersatz, sondern kläre den Owner.
- Wenn Fokus hinter einem Overlay bleibt, prüfe Stack Policy, Modal-Flag und den vorherigen Focus Owner.
- Wenn Bounds nach Restore springen, vergleiche `bounds-mode`, `bounds-scope` und Min-/Max-Grenzen.
- Wenn nach Destroy Netzwerk oder Timer weiterlaufen, registriere die Handles beim Manager und prüfe das `surface-destroyed`-Event.

## Nächste Schritte

- [SurfaceManager Controller](./surface-manager-controller.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)
- [Remote Surfaces](./surface-manager-remote-surfaces.md)
- [Migration Guide](./surface-manager-migration-guide.md)
