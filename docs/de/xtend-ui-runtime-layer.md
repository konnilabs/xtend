# XTend UI Runtime-Schicht

Die XTend UI Runtime-Schicht ist der sichtbare Rand des XTend Stacks. Sie liefert framework-neutrale Web Components, SurfaceManager, DOM Descriptor Rendering und Manifest-basierte Komponentenauflösung.

## Was diese Schicht ist

XTend UI rendert konkrete UI. Die Schicht nimmt Component- und Surface-Records aus RMT-Adaptern entgegen und materialisiert sie als Custom Elements, Surface Windows, Side Panels, Portale oder DOM Descriptor Previews.

## Was diese Schicht weiß

XTend UI kennt Custom-Element-Tags, Attribute, Properties, Slots, Events, Component-Manifeste, Surface-Zustände, Theme Tokens, Hydration-Status und DOM-Grenzen.

Der SurfaceManager kennt offene, minimierte, geschlossene und fokussierte Surfaces. Komponenten kennen ihre öffentlichen Attribute, Events und Hydration-Aufrufe.

## Was sie nicht weiß

XTend UI kennt nicht die vollständige RMT-Programmlogik, globale Scheduler-Entscheidungen, fremde MFE-Framework-Interna oder die fachliche Bedeutung aller State-Records.

Eine XTend Komponente sollte nicht direkt vom RMT Kernel abhängen. Sie empfängt Daten über Adapter und publiziert Events zurück an den Host.

## Schnittstellen

```js
import '@ccslabs/xtend/components/xsurfacemanager.js';
import '@ccslabs/xtend/components/xsurfacewindow.js';
import '@ccslabs/xtend/components/xstatus.js';
import { createRmtXtendComponentAdapter, createRmtSurfaceAdapter } from '@ccslabs/xtend/rmt';
```

Die wichtigsten öffentlichen Einstiege sind Komponentenimporte, `components/manifest.json`, `x-surface-manager`, `x-surface-window`, DOM Descriptor Renderer, `createRmtXtendComponentAdapter` und `createRmtSurfaceAdapter`.

## Kommunikation mit anderen Schichten

RMT beschreibt Surfaces und Komponenten. Der Kernel hält diese Records host-neutral. Fabric liefert Scheduling- und Hydration-Kontext. XTend UI materialisiert die sichtbaren Elemente und sendet DOM Events zurück an den Adapter.

In MFE-Systemen kann die gleiche Grenze auch React, Vue oder VanillaJS aufnehmen. Wichtig ist, dass jedes Framework über einen Host Adapter angebunden wird und der Kernel keine Framework-Details importiert.

## Nächste Schritte

- [RMT Stack-Topographie](./rmt-stack-topography.md)
- [RMT Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)
- [Komponenten-Entwicklung](./components.md)
