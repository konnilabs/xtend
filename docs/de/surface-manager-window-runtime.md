# SurfaceManager Window Runtime

Contract: `xtend.surface.window-runtime.v1`

`x-surface-manager` und `x-surface-window` bilden die owned Multi-Window Surface Runtime für XTend App Shells.

Gate:

```bash
node scripts/run_xtend_tests.js surface-manager --json
```

## Runtime Vertrag

Die Window Runtime ist die owned Schicht fuer frei positionierbare Surfaces in einer XTend App Shell. `x-surface-manager` verwaltet Registrierung, aktives Fenster, Stack-Reihenfolge, Fokusuebergabe und Snapshot. `x-surface-window` stellt den sichtbaren Rahmen bereit: Titel, Region, Slot-Inhalt, Zustand, Resize- und Move-Signale. Beide Komponenten gehoeren zusammen. Ein Fenster ohne Manager verliert seine Orchestrierung, und ein Manager ohne Window-Records kann keine nutzbare Multi-Window-App beweisen.

Der Contract `xtend.surface.window-runtime.v1` trennt Authoring von Laufzeit. RMT beschreibt, dass eine Surface existiert, welche Ressource sie zeigt und welche Aktionen erlaubt sind. Die Runtime entscheidet, wie Fenster registriert, aktiviert, minimiert, wiederhergestellt oder geschlossen werden. Diese Trennung ist wichtig, weil RMT keine DOM-Klassen und keine XTend-Typen importieren soll. Der Host bleibt der Besitzer der konkreten Custom Elements.

## Authoring Regeln

Ein Window-Record braucht eine stabile ID, einen lesbaren Titel, einen Surface-Typ und einen Zustand, der in den Manager-Snapshot passt. Aktionen wie `activate`, `close`, `focus` oder `restore` werden als Ereignisse behandelt, nicht als direkte DOM-Manipulation. Wenn ein Host ein Fenster aus RMT erzeugt, sollte er den Record zuerst validieren und danach an `x-surface-manager` uebergeben. Der Manager kann daraus Stack-Werte, aktive Surface und Fokusziel ableiten.

Fenster duerfen nicht als allgemeine Overlay-Loesung missbraucht werden. Modalitaet, Hintergrund-Inertness und Escape-Policy liegen in der Stack Policy, nicht in einzelnen Windows. Ein Fenster darf einen internen Fokuspfad haben, aber es entscheidet nicht alleine, ob der Rest der App inert wird. Diese Grenze verhindert Konflikte mit `x-modal`, `x-dialog`, Side Panels und Overlay Bridge.

## Evidence und Fehlerbilder

Der Gate `surface-manager` prueft, dass Window-Records registriert werden, dass Aktivierung beobachtbar ist und dass Snapshot-Daten stabil bleiben. Typische Fehler sind doppelte IDs, ein Fenster ohne Titel, ein verlorenes Focus-Restore-Ziel oder eine Aktion, die nur im DOM wirkt und nicht im Manager-Zustand ankommt. Solche Fehler sind release-relevant, weil Multi-Window-Apps sonst schwer reproduzierbar werden.

Eine Aenderung an `x-surface-window` ist akzeptiert, wenn sie den Manager-Record staerker macht und keine neue Registry einfuehrt. Geblockt sind manuelle HTML-Renderer, unnamespaced globale Helfer und framework-spezifische Shortcuts. Die Window Runtime bleibt eine Native-First-Oberflaeche, die von RMT beschrieben, aber vom XTend Host ausgefuehrt wird.
