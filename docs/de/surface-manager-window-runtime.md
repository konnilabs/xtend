# SurfaceManager Window Runtime

Contract: `xtend.surface.window-runtime.v1`

`x-surface-manager` und `x-surface-window` bilden die owned Multi-Window Surface Runtime für XTend App Shells.

Gate:

```bash
node scripts/run_xtend_tests.js surface-manager --json
```

## Runtime Vertrag

Die Window Runtime ist die owned Schicht für frei positionierbare Surfaces in einer XTend App Shell. `x-surface-manager` verwaltet Registrierung, aktives Fenster, Stack-Reihenfolge, Fokusübergabe und Snapshot. `x-surface-window` stellt den sichtbaren Rahmen bereit: Titel, Region, Slot-Inhalt, Zustand, Resize- und Move-Signale. Beide Komponenten gehören zusammen. Ein Fenster ohne Manager verliert seine Orchestrierung, und ein Manager ohne Window-Records kann keine nutzbare Multi-Window-App beweisen.

Der Contract `xtend.surface.window-runtime.v1` trennt Authoring von Laufzeit. RMT beschreibt, dass eine Surface existiert, welche Ressource sie zeigt und welche Aktionen erlaubt sind. Die Runtime entscheidet, wie Fenster registriert, aktiviert, minimiert, wiederhergestellt oder geschlossen werden. Diese Trennung ist wichtig, weil RMT keine DOM-Klassen und keine XTend-Typen importieren soll. Der Host bleibt der Besitzer der konkreten Custom Elements.

Die Window Chrome sendet Nutzerabsichten über `surface-window-command` und verändert die Registry nicht direkt. `destroySurface()` beendet die aktuelle Generation: Der Manager bricht owned Loading- und Hydration-Arbeit ab, entfernt materialisiertes DOM, emittiert `surface-destroyed` und bewahrt einen `xtend.surface.tombstone.v1` Record nur für Diagnostics auf. Verwende Close für wiederverwendbare Surfaces und Destroy, wenn Ressourcen freigegeben werden müssen.

## Authoring Regeln

Ein Window-Record braucht eine stabile ID, einen lesbaren Titel, einen Surface-Typ und einen Zustand, der in den Manager-Snapshot passt. Aktionen wie `activate`, `close`, `focus` oder `restore` werden als Ereignisse behandelt, nicht als direkte DOM-Manipulation. Wenn ein Host ein Fenster aus RMT erzeugt, sollte er den Record zuerst validieren und danach an `x-surface-manager` übergeben. Der Manager kann daraus Stack-Werte, aktive Surface und Fokusziel ableiten.

Fenster dürfen nicht als allgemeine Overlay-Lösung missbraucht werden. Modalität, Hintergrund-Inertness und Escape-Policy liegen in der Stack Policy, nicht in einzelnen Windows. Ein Fenster darf einen internen Fokuspfad haben, aber es entscheidet nicht alleine, ob der Rest der App inert wird. Diese Grenze verhindert Konflikte mit `x-modal`, `x-dialog`, Side Panels und Overlay Bridge.

## Evidence und Fehlerbilder

Der Gate `surface-manager` prüft, dass Window-Records registriert werden, dass Aktivierung beobachtbar ist und dass Snapshot-Daten stabil bleiben. Typische Fehler sind doppelte IDs, ein Fenster ohne Titel, ein verlorenes Focus-Restore-Ziel oder eine Aktion, die nur im DOM wirkt und nicht im Manager-Zustand ankommt. Solche Fehler sind release-relevant, weil Multi-Window-Apps sonst schwer reproduzierbar werden.

Eine Änderung an `x-surface-window` ist akzeptiert, wenn sie den Manager-Record stärker macht und keine neue Registry einführt. Geblockt sind manuelle HTML-Renderer, unnamespaced globale Helfer und framework-spezifische Shortcuts. Die Window Runtime bleibt eine Native-First-Oberfläche, die von RMT beschrieben, aber vom XTend Host ausgeführt wird.

## Weiterführend

Der Controller-Vertrag definiert die Commands und Snapshots für Window Surfaces. [Verwandter Artikel](./surface-manager-controller.md)
