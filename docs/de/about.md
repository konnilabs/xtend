# Über XTend

XTend ist ein lokales, frameworkneutrales Application-Framework für Web Components, deklarative RMT-Anwendungen und kontrollierte Erweiterungen. Es richtet sich an Teams, die UI-Bausteine, Scheduling, Hydration und Diagnose nicht als voneinander getrennte Einzellösungen betreiben möchten.

## Die Schichten im Überblick

Die unterste öffentliche Schicht sind Custom Elements aus `components/manifest.json`. Sie lassen sich direkt in HTML verwenden und bleiben über Attribute, Events, Slots, CSS Parts und TypeScript-Deklarationen integrierbar. `xtend-loader.js` registriert diese Komponenten aus einem lokalen Manifest.

XTend Fabric plant Mount-, Hydration-, Interaktions- und Diagnosearbeit in Lanes und Fibers. RMT beschreibt Anwendungen als kompilierbare Dokumente; Parser und Compiler erzeugen daraus ein Core-Dokument, das Browser- und SSR-Adapter lesen können. Maraca baut auf diesem Vertrag auf und orchestriert eine auslieferbare Anwendung.

## Was stabil ist

Öffentlich sind die Exports in `package.json`, die Deklarationen wie `api.d.ts`, die Komponentenverträge und dokumentierte Schemas. Private Shadow-DOM-Knoten, interne Scheduler-Datenstrukturen und generierte Zwischenartefakte sind keine Integrationsschnittstelle.

XTensions erweitern Hosts über explizite Contracts. Die [XTend Dev Surface](./xtend-dev-surface.md) liest Diagnosewerte ausschließlich aus `window.__XTEND_DEV_API__`; sie erkennt keine fremde Seite durch Heuristiken und patcht keine Framework-Runtime.

## Typische Einstiege

- Eine bestehende HTML-Seite beginnt mit [Quick Start](./quick-start-guide.md) und einer einzelnen Komponente.
- Eine deklarative Anwendung beginnt mit [Learn RMT](./learn-rmt.md) und dem Playground.
- Ein wiederverwendbares Host-Plug-in beginnt mit dem [XTensions Authoring Guide](./xtensions-authoring-guide.md).
- Ein Team mit Release-Verantwortung nutzt [Release Verification](./release-verification.md) für Reports und Gates.

## Grenzen und Fehlerverhalten

XTend lädt keine Runtime von einem CDN und führt keine beliebigen Remote-Module aus. Import-, Capability- und Integrity-Entscheidungen gehören dem Host. Kann eine optionale Surface oder XTension nicht geladen werden, soll ein dokumentierter Fallback entstehen; ein Kernel-Panic oder ein fehlgeschlagener Integritätscheck darf nicht als erfolgreicher Zustand erscheinen.

Der sinnvollste nächste Schritt ist ein kleines lokales Beispiel. Erst wenn Loader, Manifest und eine Komponente funktionieren, lohnt sich der Wechsel zu RMT, Fabric-Lanes oder Remote-Surface-Policies.
