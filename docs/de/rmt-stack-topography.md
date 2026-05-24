# RMT Stack-Topographie

Die RMT Stack-Topographie erklärt, wie RMT Source, Compiler, Kernel, Fabric und UI-Schichten zusammenspielen. Sie hilft dir, XTendRMT nicht nur als Dokumentensprache zu lesen, sondern als Baustein für größere Anwendungen einzuordnen.

![RMT Stack-Topographie](../assets/rmt-stack-topography.svg)

## Schichten

Der RMT Source beschreibt App-Struktur, State, Selectors, Actions, Events, Resources, Surfaces und Scheduling-Absicht. Der Compiler übersetzt diese Beschreibung in stabile Core Records.

Der RMT Kernel verarbeitet diese Records host-neutral. Er plant Arbeit, verwaltet Runtime-State, löst Actions aus, publiziert Diagnostics und bleibt unabhängig von DOM, CSS und Frameworks.

XTend Fabric übersetzt Scheduling-Absicht in Lanes, Hydration-Entscheidungen, Telemetrie und Backpressure-Signale. Host Adapter verbinden diese Signale mit Browser, Server, Worker oder App Shell.

XTend UI, React, Vue oder VanillaJS rendern am Rand des Systems. Sie erhalten Props, Attribute, Slots, Events und Hydration-Aufträge über Adapter und bleiben dadurch austauschbar.

## Integrationsmodelle

Im XTend-only-Modell beschreibt RMT die App Shell, Fabric koordiniert die Arbeit und XTend UI rendert die sichtbaren Web Components.

Im MFE-Modell kann eine XTend Shell Surfaces für andere Teams bereitstellen. Diese Surfaces können XTend UI, React, Vue oder VanillaJS nutzen, solange sie über klare DOM- und Adapter-Grenzen angebunden werden.

Im Scheduler-Modell läuft der RMT Kernel als orchestrierende Schicht neben bestehenden Frontends. Dann nutzt die App RMT für State, Aktionen, Ressourcen und Scheduling, während die konkrete UI weiterhin in einem vorhandenen Framework entsteht.

## Nächste Schritte

- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [XTend UI Runtime-Schicht](./xtend-ui-runtime-layer.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
