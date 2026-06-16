# SurfaceManager Side Panel Runtime

Contract: `xtend.surface.side-panel-runtime.v1`

`x-side-panel` ist die owned Surface-Komponente für docked, overlay, pinned, collapsed, fullscreen und floating Panel-Modi.

Gate:

```bash
node scripts/run_xtend_tests.js surface-side-panel --json
```

## Runtime Vertrag

`x-side-panel` ist die Surface fuer Aufgaben, die dauerhaft neben oder ueber einer Hauptsurface leben koennen. Die Modi `docked`, `overlay`, `pinned`, `collapsed`, `fullscreen` und `floating` beschreiben nicht nur Styling, sondern auch Interaktion. Ein angedocktes Panel teilt sich Platz mit dem Inhalt, ein Overlay-Panel braucht Stack- und Fokusregeln, ein gepinntes Panel bleibt ueber Navigation hinweg sichtbar, und ein collapsed Panel muss seinen Zustand klar an Assistive Technology und Host-Logik melden.

Der Contract `xtend.surface.side-panel-runtime.v1` sorgt dafuer, dass diese Modi nicht als beliebige CSS-Varianten auseinanderlaufen. Der Host gibt einen Panel-Record an die Runtime, und die Runtime spiegelt Zustand, Ereignisse und Sichtbarkeit zurueck. RMT kann ein Panel deklarieren, aber es importiert keine Panel-Klasse und keine XTend-spezifischen Typen. Dadurch bleibt die DSL beschreibend und der Host traegt die Verantwortung fuer DOM, Fokus und Accessibility.

Die Panel-Chrome ist ueber `collapsible`, `closable` und `pinnable` konfigurierbar. Die Komponente spiegelt diese Flags in die sichtbaren Header-Controls und in die erzeugten Surface-Record-Capabilities, sodass eine Produktshell nur Collapse/Expand anbieten und Close- oder Pin-Aktionen an der SurfaceManager-Grenze ablehnen kann.

## Authoring Regeln

Ein Side Panel braucht einen Zweck. Gute Beispiele sind Filter, Inspector, Detailvorschau, Eigenschaften, Log oder sekundaere Navigation. Schlechte Beispiele sind unspezifische Container, die nur Layout-Luecken fuellen. Der Panel-Record sollte Titel, Modus, initiale Sichtbarkeit, bevorzugte Breite und erlaubte Aktionen beschreiben. Aktionen wie `open`, `close`, `pin`, `collapse` und `resize` werden als Ereignisse behandelt und muessen den Runtime-Zustand aktualisieren.

Bei `overlay` und `fullscreen` muss das Panel mit der Stack Policy zusammenspielen. Es darf nicht alleine `aria-hidden`, Scroll Lock oder globale Escape-Logik setzen. Bei `docked` und `pinned` muss der Host stabile Layout-Slots bereitstellen, damit Inhalt nicht springt. Bei `collapsed` muss der sichtbare Trigger eindeutig bleiben. Diese Regeln halten Panel-Verhalten vorhersehbar, auch wenn Fenster, Modals und Overlays gleichzeitig aktiv sind.

## Evidence und Review

Der Gate `surface-side-panel` prueft die Modi als Runtime-Vertrag. Reviewende achten auf Statusuebergaenge, Event-Namen, Fokuspfade und Snapshot-Kompatibilitaet. Ein Fehler ist kritisch, wenn ein Panel sichtbar anders reagiert als sein Record, wenn ein Modus nur per CSS existiert oder wenn eine Aktion nicht in den Manager-Zustand zurueckgeschrieben wird. Ein akzeptierter Fix macht diese Kette expliziter.

Neue Panel-Faehigkeiten brauchen eigene Evidence. Ein neues Mode-Label ohne Fixture ist kein Release-Signal. Eine Aenderung an Layout oder Animation muss weiterhin Reduced-Motion, Keyboard-Navigation und klare Host-Grenzen respektieren. So bleibt `x-side-panel` eine owned Surface-Komponente und kein versteckter Framework-Drawer.

Handoff: `WP-SM-05`.
