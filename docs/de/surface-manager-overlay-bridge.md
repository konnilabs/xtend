# SurfaceManager Overlay Bridge

Contract: `xtend.surface.overlay-stack-bridge.v1`

Die SurfaceManager Overlay Bridge verbindet bestehende Overlay-Komponenten mit dem gemeinsamen Surface Stack. Sie bewahrt die Legacy-Komponenten und führt sie optional als Surface Records.

## Komponenten

- `x-modal`
- `x-dialog`
- `x-drawer`
- `x-popover`
- `x-tooltip`
- `x-toast`
- `x-lightbox`
- `x-menu`

## Laufzeit

`components/xsurfaceoverlay-bridge.js` erzeugt Surface Records für Overlays, setzt Stack-Z-Werte und reagiert auf `surface-overlay-command`.

Die Bridge ist ein Surface Stack Adapter. Sie ersetzt keine Komponente, erstellt keine zweite Registry und behält bestehende Lifecycle Events.

## Gate

```bash
node scripts/run_xtend_tests.js surface-overlay-bridge --json
```

## Bridge Vertrag

Die Bridge existiert, weil XTend bereits reife Overlay-Komponenten besitzt und der Surface Stack trotzdem einen gemeinsamen Blick auf aktive Ebenen braucht. `x-modal`, `x-dialog`, `x-drawer`, `x-popover`, `x-tooltip`, `x-toast`, `x-lightbox` und `x-menu` behalten ihre eigenen Contracts. Die Bridge liest oder erzeugt Surface Records für diese Komponenten, damit Stack-Reihenfolge, Z-Werte und topmost-Verhalten gemeinsam bewertet werden können. Sie ersetzt die Komponenten nicht und macht aus einem Tooltip kein Fenster.

Der Contract `xtend.surface.overlay-stack-bridge.v1` beschreibt eine Adaptergrenze. Auf der einen Seite stehen Legacy- und owned Overlay-Komponenten mit bestehenden Events. Auf der anderen Seite steht der Surface Manager mit Records, Stack Policy und Snapshot. Die Bridge übersetzt zwischen beiden Seiten, ohne eine zweite Registry zu bauen. Wenn ein Overlay schon registriert ist, wird der Record synchronisiert. Wenn ein Host ein Surface-Record für ein Overlay bereitstellt, wird die bestehende Komponente weiterverwendet.

## Laufzeitregeln

`components/xsurfaceoverlay-bridge.js` darf Stack-Z-Werte setzen und auf `surface-overlay-command` reagieren, aber es darf keine Komponente vollständig neu rendern. Der Fokuspfad bleibt bei der jeweiligen Komponente und der Stack Policy. Die Bridge koordiniert nur, welche Surface oben liegt, welcher Record sichtbar ist und welche Kommandos an die bestehende Overlay-Instanz gehen. Dadurch bleiben alte Integrationen funktionsfähig und neue Surface-Features können trotzdem zentral ausgewertet werden.

Besonders wichtig sind kurze Overlays wie Tooltip und Toast. Sie dürfen nicht die gleiche Modalität wie Dialog oder Modal bekommen. Die Bridge muss also zwischen informativen, nicht-modalen und blockierenden Overlays unterscheiden. Wenn ein Overlay geschlossen wird, muss der Record verschwinden oder inaktiv werden, ohne dass verwaiste Stack-Einträge bleiben. Der lokale Gate prüft diese Fälle als Integrationsverhalten.

## Release Hinweise

Akzeptiert sind Änderungen, die die Uebersetzung klarer, beobachtbarer oder stabiler machen. Geblockt sind Änderungen, die Events still umbenennen, eine zweite Overlay-Registry einführen, `innerHTML` als Renderer benutzen oder globale Helfer ausserhalb des XTend-Namespace erzeugen. Bei Unsicherheit hat die bestehende Komponente Vorrang: Die Bridge darf ihre Lifecycle-Semantik nicht brechen, nur damit der Surface Stack vollständiger aussieht.

## Weiterführend

Die Stack Policy erklärt Fokus, Escape-Verhalten und Wiederherstellung nach dem Schließen eines Overlays. [Verwandter Artikel](./surface-manager-stack-policy.md)
