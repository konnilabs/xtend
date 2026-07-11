# XTensions Migration und Coexistence

XTensions erlauben eine schrittweise Integration bestehender UI-Inseln. Eine Anwendung muss nicht vollständig von React, Vue oder einer imperativen Library zu XTend migrieren, bevor RMT, Fabric oder die XTend-Shell genutzt werden können.

Das Ziel ist keine zweite App-Runtime. Jede Insel erhält eine klar begrenzte HostController-Verantwortung, während Navigation, Cross-Surface-Kommunikation, Policies und Diagnosen außerhalb des Frameworks bleiben.
Der ausführbare Vertrag liegt in `tools/xtensions/host-controller-contract.js`; Adapter implementieren diese Grenze, statt eigene Lifecycle-Namen zu erfinden.

## Das Coexistence-Modell

Native XTend-Komponenten, Framework-XTensions und eigene Custom Hosts können in derselben Shell leben. Die Grenzen unterscheiden sich:

| Oberfläche | Runtime-Besitz | Geeigneter Einsatz |
| --- | --- | --- |
| Native XTend | Host und XTend Web Components | Neue, langfristig kontrollierte Produktoberfläche |
| Framework-XTension | Host stellt Peer-Runtime, Adapter besitzt eine Insel | Bestehender Fachbereich mit klarem Owner und Fallback |
| Custom Host | Integrator implementiert den HostController | Spezialruntime wie Canvas, Map oder proprietäres SDK |
| Remote XTension | Host-Policy plus Integrity und Fallback | Kontrolliert ausgeliefertes, separat versioniertes Artefakt |

Fabric ist die gemeinsame Kommunikationsgrenze. Zwei Inseln rufen sich nicht direkt über Framework-Contexts oder globale Eventbusse auf.

## Eine Migrationsfläche auswählen

Beginne mit einer Surface, die einen eindeutigen fachlichen Owner, wenige Cross-Surface-Abhängigkeiten und einen sichtbaren Fallback besitzt. Vermeide als Pilot die globale Navigation, Authentifizierung oder einen Bereich, der viele untypisierte globale Zustände liest.

Erfasse vor der Änderung:

- Mount- und Unmount-Zeitpunkt;
- eingehende Props, Signale und Ressourcen;
- ausgehende Events;
- globale Listener, Timer, Observer und Netzwerkzugriffe;
- öffentliche URL- und Fokusverantwortung;
- Verhalten, wenn die Peer-Runtime fehlt.

Diese Liste bildet den Contract des ersten Adapters und verhindert, dass versteckte Seiteneffekte beim Verschieben der Surface verloren gehen.

## Schrittweise migrieren

1. Kapsle die bestehende Surface hinter einem Host-Element, ohne ihr Verhalten zu verändern.
2. Beschreibe Lifecycle, Capabilities, Signale, Events, Cleanup und Fallback als HostController-Vertrag.
3. Registriere ein projektlokales Manifest mit Version, Entry, Integrity und Peer-Klassifikation.
4. Route Cross-Surface-Nachrichten über Fabric.
5. Prüfe `ready`, `degraded`, Fehler und Unmount in lokalen Suiten und einem Browser-Smoke.
6. Verschiebe erst danach weitere Zustands- oder Navigationsverantwortung aus der Insel in die Shell.

Ein React-Beispiel beginnt daher nicht mit einem Rewrite. Der Host kann die vorhandene Root-Komponente zunächst in `mount()` erzeugen, Props in `update()` weiterreichen und sie in `unmount()` vollständig entfernen. Später können einzelne Fachkomponenten nativ werden, ohne dass sich der Fabric-Vertrag ändert.

## Zustand und Routing trennen

Framework-interner UI-Zustand darf in der Insel bleiben. Zustand, den mehrere Surfaces, Deep Links oder serverseitige Resume-Payloads benötigen, gehört in die explizite XTend-/RMT-Grenze.

Dasselbe gilt für Routing: Eine Insel kann interne Tabs verwalten. Änderungen an der kanonischen App-Route müssen jedoch als Host-Ereignis oder Action sichtbar sein, damit Browser-History, Fokus und andere Surfaces konsistent bleiben.

## Erfolg messen

Eine Coexistence-Migration ist erfolgreich, wenn:

- die Surface mit und ohne Peer-Runtime deterministisch startet;
- fehlende Capabilities nur die betroffene Insel degradieren;
- kein Listener oder Render-Loop nach `unmount()` weiterläuft;
- Events und Signale serialisierbar und einem Owner zugeordnet sind;
- Performance-, Kernel- und Fabric-Diagnosen die Insel eindeutig benennen;
- der Fallback ohne Framework-Code gerendert werden kann.

Prüfe die gemeinsamen Verträge mit:

```bash
node scripts/run_xtend_tests.js xtensions-host-controller xtensions-signal-bridge xtensions-runtime-capability-registry --json
```

## Typische Fehlentscheidungen

Eine XTension ist kein Grund, neue Fachlogik in ein fremdes Framework zu verschieben. Nutze sie für bestehende oder spezialisierte Inseln und bevorzuge für neue Owned Components die native Oberfläche.

Verstecke eine Peer-Runtime nicht im Adapter-Bundle. Der Host muss Version und Verfügbarkeit prüfen können, bevor `mount()` läuft.

Teile keine Framework-Contexts zwischen Inseln. Das koppelt Lifecycle und Versionen und umgeht Fabric-Diagnosen, Backpressure und Security-Policies.

## Nächste Schritte

- [XTensions Authoring Guide](./xtensions-authoring-guide.md)
- [XTensions Security Checklist](./xtensions-security-checklist.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [XTend Fabric](./xtend-fabric.md)
