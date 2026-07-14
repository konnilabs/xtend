# Fabric RMT Lane Mapping

Wie RMT Scheduling-Absichten auf Fabric Lanes abgebildet werden.

## Worum es geht

Das Lane Mapping übersetzt RMT Scheduling-Absicht in die kanonischen Fabric-Lanes. Der RMT Record beschreibt Priorität und Grund; Fabric entscheidet über Ausführung, Telemetrie und Backpressure auf der aktuellen Plattform.

## Öffentliche Bausteine

- `fabric/rmt-lane-mapping.js` normalisiert Lane und Schedule.
- `fabric/rmt-lane-mapping.d.ts` typisiert Resolution, Diagnostics und Mapping.
- `fabric/xtend-fabric.js` führt den resultierenden Fiber aus.

## Empfohlener Ablauf

`critical`, `visible`, `transition`, `idle` und `diagnostics` werden über definierte Profile aufgelöst. Eine unbekannte Lane erzeugt eine Diagnose und einen dokumentierten Default, keine neue globale Prioritätsklasse. Prüfe das Mapping mit [Scheduling und Lanes](./learn-rmt-scheduling-lanes.md), bevor ein Host eigene Namen einführt.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Classic](./xtend-classic.md)
- [Design Tokens](./design-tokens.md)
