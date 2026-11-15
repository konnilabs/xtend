# A04-Restabschnitt – Automatische Komponentenkomposition

**Aktualisierung der Folgeabschnitte:** [Key-Scopes und Komponenten-SSR v2](scoped-components.md) sind inzwischen in einem eigenen neuen Profil implementiert. Der nachfolgende Text dokumentiert den jeweiligen vorherigen, weiterhin reproduzierbaren Vertragsstand.

Stand: **15. November 2026**. Der Zwei-Host-Fall wird jetzt durch den regulären Maraca-Build und den erzeugten Browser-Einstieg ausgeführt. React-Galerie und Vue-Bewertungen besitzen getrennte Renderziele und dieselbe owning Surface `product-details`. Provider-Interfaces, Intent-Mapping und Runtime-Guards aus A06 sind Bestandteil dieses automatischen Profils. Der A05-Handoff dieses Profils bleibt offen.

## Versionierter Vertrag

| Bereich | Neuer Stand | Bisheriger Vertrag |
| --- | --- | --- |
| Kompositionsmanifest | `xtend.maraca.xtension-composition-manifest.v6` | v1–v5 verlangen weiterhin Owner = Binding-Surface |
| Kompositionsartefakt / Buildbericht | v7 / Daten-API 7.0.0 | v1–v6 bleiben eigenständige Profile |
| Kompositions-Build-API | **11.0.0** | neue Profilunterstützung; keine Umdeutung bestehender Daten |
| Kompositions-Runtime-API | **8.0.0** | unterstützt weiterhin die bisherigen Profile und SSR-Port v2 |
| Kompositionsport | `xtend.maraca.xtension-composition-port.v3` | manuell v1 beziehungsweise SSR v2 |
| Browser-Root / Instanz-API | v8 / **8.0.0** | Browser-Instanzen v6/v7 behalten API 6/7 |
| Plan-Runtime | `xtend.maraca.plan-runtime.v10` | bestehende manuelle/komponierte/SSR-Snapshots v7/v8/v9 bleiben getrennt |
| Provider-Interface / Runtime-Helfer | weiterhin v1 / **1.0.0** | geschlossene Regeln bleiben gleich |
| Interner Interface-Build-Capture | **2.0.0** | transportiert zusätzlich die tatsächlich erfassten Interface-Dateibytes |

Build-Plan und Build-Konfiguration steigen für dieses Profil auf **v6**. Die bisherigen v5-Typen und deren geschlossene Manifestmenge bleiben erhalten. Der State-Binding-Vertrag bleibt v2; die darin stehende `surface` bezeichnet weiterhin das Renderziel. Das neue Manifest beschreibt zusätzlich `targetSurface`, `ownerSurface`, Interface-Referenzen und Intent-Routen. Der Owner muss als Surface im kompilierten Programm existieren; das Renderziel muss exakt zur Binding-Deklaration passen.

Die neue Komposition ist zunächst auf **statische Deklarationen mit `keys: []` und optionale Conditional-Presence** begrenzt. Wiederholungen und konkrete Key-Scope-Materialisierung im neuen Komponentenprofil werden ausdrücklich abgewiesen. Die bisherigen A04-Profile unterstützen ihre bisherigen Wiederholungen weiter. Damit wird der nachgewiesene Zwei-Host-Fall umgesetzt; ein allgemeines RMTX-Lowering für Loops ist noch nicht eingeführt.

## Herkunft und Ausführung

Die [automatische Referenz](automatic-reference.cjs) kombiniert die bestehenden Classic-/Binding-Daten mit den unabhängig gepflegten Interface-Pins. Die Aufrufstelle definiert keine Prop-/Payload-Typen. Der Build erfasst Sidecars und Providerbytes, prüft ihre Pins und leitet die Bindings aus den Provider-Regeln erneut ab. Abweichende Props, Typen, Peer-/Code-Identitäten oder Feldmappings scheitern vor der Ausgabe des Companions. Provider-Initialisierung wird dabei nicht ausgeführt.

Die erfassten JSON-Originalbytes werden als adressierte `interfaces/<provider>-<sha256>.json`-Dateien ausgegeben. Der Companion enthält ihre geprüften Daten und Provenienz. Die Runtime verwendet diese im vertrauenswürdigen Companion transportierten Daten; sie lädt kein unvalidiertes JSON aus dem Netz nach. Ein Digest in beliebigem JSON ist keine Autorität. Die eigentliche Auslieferungsautorität kommt aus dem vorhandenen tatsächlichen Build-Capture und dem versiegelten JavaScript-/Dokumentgraphen.

Der neue Browser-Einstieg bereitet ausschließlich den Port v3 vor. Dieser prüft den Komponentenvertrag erneut und vergleicht ihn beim Host-Aufbau mit dem konkreten Registry-Binding. Jede Props-Lieferung erfüllt den geschlossenen Vertrag und gegebenenfalls zusätzlich die Anwendungspolicy. Provider-Events werden vor dem Feldmapping gegen den ursprünglichen Payload-Vertrag geprüft; die normalen Binding-/Action- und Lifetime-Prüfungen folgen danach. Vue erhält die Interface-Prop-Liste und die deaktivierte Attributvererbung aus der vorhandenen Providerimplementierung.

Providerimports bleiben explizite native ESM-Imports aus dem tatsächlichen Capture. Import, Peer-Auflösung und Factory-Aufruf laufen über die bestehende zugelassene Mount-Arbeit und Fabric. Der Host registriert seine Ressourcen beim gemeinsamen Owner, während die Registry die unabhängigen Renderziele und Inkarnationen verwaltet. Die Owner-Zuordnung ist eine Lifecycle-/Ressourcenbeziehung; sie behauptet keine neue DOM-Elternstruktur.

Der Größenbericht v2 rechnet die tatsächlichen Interface-Bytes, den Companion und die zusätzlichen Runtime-Quellen mit ein. Das relative Produktionsbudget bleibt strikt. Das neue Profil hat für diese Referenz zusätzlich eine eigene Obergrenze von **280.000 Bytes XTension-Laufzeitdateien** und **2.200.000 Bytes Framework-Anteil**. Der erste Stand benötigt rund 251 KB für seine XTension-Dateien einschließlich Metadaten/Sidecars. Die bestehenden A04-Referenzlimits von 240.000 Bytes werden nicht angehoben. Die zusätzliche Herkunfts-/Vertragsprüfung darf weder ungenutzte Dateien noch Metadaten aus der Rechnung verschwinden lassen.

## Nachweise

- [16 Vertrags-/Typ-/Negativtests](../../tests/xtensions/component-composition.test.cjs): Owner/Renderziel, Legacy-Abgrenzung, Interface-Pins, zusätzliche Props, Feldmapping, Metadaten, Artefakt-Replay und ESM-Brücke.
- [6 reguläre Buildprüfungen](automatic-inspect.cjs): Versionen, tatsächlich erfasste Bytes, Zuordnung, Budget, geschlossener Plattformgraph und ausdrückliche A05-Abweisung.
- [8 echte Framework-Fälle](automatic-acceptance.mjs): native Imports nach Kernel/Fabric-Zulassung, Model-/State-Rückweg, gemeinsame Suspension, unabhängige Reinkarnation, Runtime-Guards, gemeinsame Destroy-/Work-Cancellation sowie verspätete Provider bei Destroy und Dispose.
- [Deterministischer Nachweis](automatic-evidence.json) und [Laufzeitnachweis](automatic-runtime-evidence.json) binden Ergebnisse an die geprüften Quellen. Die statischen Prüfungen sind im blockierenden Vorbereitungsgate registriert.

```sh
node development/rmtx-a06/automatic-inspect.cjs --check
node --test tests/xtensions/component-composition.test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness node development/rmtx-a06/automatic-test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/automatic-test.cjs --browser
```

Die Framework-Fälle wurden unter Node 24.18.0 und 26.5.0 als native Dateimodule sowie in Chromium 155.0.8059.79 über den tatsächlichen versiegelten HTTP-/SRI-/CSP-Pfad ausgeführt. Die Toolchain verwendet TypeScript 5.9.3, Rollup 4.60.4, Terser 5.48.0 und esbuild 0.28.2. Fehlende Voraussetzungen sind Fehler, keine Skips. Reine Buildnachweise behaupten keine Framework-Ausführung.

## Anschluss

Der nächste Abschnitt ist der **versionierte A05-Handoff für dieses Profil**: Interface-Herkunft und getrennte Owner-/Renderziel-Zuordnung müssen in Snapshot, Composition-Digest, SSR-Shell, Adoption und Replay nachgewiesen werden. Ein SSR-Aufruf am neuen Browser-/Kompositionsprofil wird bis dahin ausdrücklich abgewiesen. Bestehendes A05-SSR wird dadurch nicht erweitert oder als Nachweis für diesen Fall ausgegeben.

Danach folgen Key-Scope-Unterstützung dieses Profils und das tatsächliche RMTX-Frontend. RMTX-Grammatik, plattformweite Lade-/Fallback-/Layoutpolicy, Deployment-Migration und die vollständige 0.9-Feature-Abnahme bleiben offen. Die bisherigen expliziten A06-Dateien bleiben als eigenständige Referenz erhalten.

## Schema-Governance

Das Core-Inventar führt je Familie genau eine aktuelle Version. Die acht neuen Versionen sind deshalb die aktuellen Einträge; die vorherigen aktuellen Versionen erhalten den Metadatenstatus `deprecated` bei unverändertem Rollout-Stand. Ihre Runtime-/Leseprofile bleiben unterstützt und werden nicht entfernt, umgedeutet oder automatisch migriert. Insbesondere bleibt das bisherige A05-SSR-Profil eigenständig verfügbar. Die aktualisierte A01-Bestandsaufnahme ändert außerdem ihre exakte Quellenbindung im unveränderten Classic-AST-Vertrag; dessen Schema, Fingerprints und unveröffentlichter Status bleiben erhalten.
