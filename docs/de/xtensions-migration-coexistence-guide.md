# XTensions Migration and Coexistence Guide

## Leitlinie

XTensions sind opt-in coexistence. Es gibt no forced migration fuer bestehende React-, Vue-, native XTend- oder Custom Hosts-Anwendungen. Teams koennen einzelne Oberflaechen als XTension kapseln, waehrend bestehende Apps unveraendert weiterlaufen.

## Coexistence-Modell

React und Vue werden als Framework-Metadaten und Peer-Runtimes beschrieben, nicht als XTend-Core-Abhaengigkeit. Native XTend bleibt fuer neue Produktoberflaechen der bevorzugte Weg. Custom Hosts duerfen denselben HostController-Vertrag nutzen, wenn sie Lifecycle, Cleanup, Fallback, Fabric-Events und Capability-Checks liefern.

Die host-local Runtime Capability Registry entscheidet zur Laufzeit, ob eine XTension bereit, degraded oder policy-blocked ist. Diese Registry ist die Runtime-Wahrheit; Registry- und Marketplace-Daten bleiben Index- oder Release-Metadaten.

## Migrationspfade

Ein Team kann eine bestehende React-Surface zuerst als Contract-Stubs beschreiben, dann ein project-local manifest anlegen und erst danach einen externen Peer-Harness fuer echte Framework-Smokes verbinden. Dasselbe Muster gilt fuer Vue, imperative Libraries, native XTend-Surfaces und eigene Custom Hosts.

Fuer native XTend-Komponenten ist keine Migration noetig. Sie koennen direkt ueber RMT/Fabric laufen und XTensions nur fuer externe Inseln nutzen.

## Betriebsregeln

Cross-Surface-Events laufen ueber Fabric und niemals direkt von React nach Vue oder von einer Map in ein Chart. Wenn eine Peer-Runtime fehlt, bleibt die betroffene XTension degraded, und die Shell, Navigation und anderen Surfaces bleiben bedienbar.

## Entscheidungsmatrix

- Native XTend: neue Owned Components, hohe Kontrolle, keine externe Runtime.
- React oder Vue XTension: vorhandener Fachbereich, klarer Owner, externer Peer-Harness, Fallback vorhanden.
- Custom Hosts: Spezialruntime mit explizitem HostController und Security Gate.
- Remote Artefakt: nur mit zusaetzlicher E16-Policy, Integrity und Fallback.
