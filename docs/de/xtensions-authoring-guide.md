# XTensions Authoring Guide

## Ziel

XTensions sind opt-in Surface-Adapter fuer Teams, die bestehende Framework- oder Bibliotheksinseln kontrolliert in eine XTend/RMT-Anwendung einbinden wollen. Native XTend bleibt der Default fuer neue Komponenten; eine XTension ist die Ausnahme fuer klare Integrationsfaelle.

## Authoring Boundary

Ein HostController besitzt genau ein Host-Element, einen Lifecycle und eine Cleanup-Verantwortung. Der RMT-Kernel sieht keine React-, Vue-, Three-, Leaflet- oder Chart.js-Runtime, sondern nur serialisierbare Capability-, Lifecycle-, Signal- und Diagnostic-Records.

Jede XTension liefert einen Contract und ein Maraca Manifest. Das Maraca Manifest beschreibt Identitaet, Framework-Metadaten, Version, Entry, CSP-Anforderungen, Peer-/Optional-Status, Fingerprints und Fallback. Es ist ein Build- und Provenance-Artefakt, kein Loader fuer versteckte Framework-Dependencies.

Fabric ist die einzige Bruecke fuer Cross-Surface-Kommunikation. Downstream-Signale laufen als KernelSignal ueber Fabric-Lanes; Upstream-Events laufen als SurfaceEvent mit Owner, Richtung, Payload-Schema, Trust Boundary und Backpressure-Regel.

## Projektlokales Manifest

Das project-local manifest bleibt die primaere Distribution. Es referenziert lokale oder projektkontrollierte Artefakte und die host-local Runtime Capability Registry. Ein Projekt darf einen external opt-in peer harness nutzen, um React, Vue, Three, Leaflet oder aehnliche Runtimes ausserhalb des XTend-Pakets zu testen.

## Dependency-Regel

Fuer XTend selbst gilt no framework dependency. Framework-Runtimes werden nicht in Root-Dependencies, Workspace-Dependencies, NPM-Files oder Fixtures vendored. Testkomponenten duerfen Contract-Stubs verwenden; echte Framework-Smokes gehoeren in externe opt-in Peer-Harnesses mit eigener Installation.

## Minimaler Ablauf

1. Contract schreiben: HostController, Capabilities, accepted signals, emitted events, Fallback und Cleanup definieren.
2. Maraca Manifest schreiben: Entry, Integrity, CSP, Peer-/Optional-Metadaten und Artifact-Fingerprint festhalten.
3. Runtime Capability pruefen: Host entscheidet, ob die Peer-Runtime vorhanden ist oder die XTension degraded startet.
4. Fabric-Bindings pruefen: Keine direkte Framework-zu-Framework-Kommunikation, kein globaler Eventbus.
5. Security Gate ausfuehren: Owner, Version, Contract, Integrity, CSP, Fallback und Dependency-Klassifikation muessen bereit sein.

## Fallback

Jede XTension muss einen Fallback definieren. Ein fehlender Peer, eine blockierte Policy oder ein Runtime-Fehler darf die Shell nicht blockieren. Die Surface wird degraded, diagnostiziert und bleibt ueber Fabric beobachtbar.

## XScaler-Deployment

XTensions, die Remote-Surfaces oder Framework-Inseln skalieren, können das [XScaler-Protokoll](./xscaler-protocol.md) als Deployment-Gate verwenden. Der Deployment-Record benennt XTension, Surface, Rollout-Strategie und SSR-Hydration, bevor der Host die Insel aktiviert.
