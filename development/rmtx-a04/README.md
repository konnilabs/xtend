# A04 – Manifest, Build, Provider und Host

Stand: 2026-11-10. **A04.1, A04.2, [A04.3.1](provider-graphs.md) und [A04.3.2](loading.md) sind implementiert.** [A04.2](integration.md) integriert den Begleiter in den regulären asynchronen Build und automatischen Browser-Boot. Die folgenden Abschnitte dokumentieren den weiterhin unterstützten expliziten A04.1-Einstieg. Er verbindet ein kompiliertes Maraca-Programm, die A02-Bindungen, verifizierte lokale Provider-Dateien und reale API-6-Hosts für React und Vue. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`. A04.3.1 ergänzt gepinnte lokale statische Providergraphen; weitere Lade-/Auslieferungsentscheidungen bleiben für A04.3 offen.

## Vertrag und Versionen

| Einstieg / Datenvertrag | Version |
| --- | --- |
| `@ccslabs/xtend-maraca/xtension-composition`: `buildMaracaXTensionComposition` | Build-API `4.0.0` (Artefakt v1 für Plan v4) |
| `@ccslabs/xtend-maraca/xtension-composition-runtime`: `createMaracaXTensionHostFactory` | Runtime-API `4.0.0` (Artefakt v1 weiter unterstützt) |
| Kompositionsmanifest | `xtend.maraca.xtension-composition-manifest.v1` |
| Gebauter Kompositionsartefakt | `xtend.maraca.xtension-composition-artifact.v1` |
| Build-Bericht | `xtend.maraca.xtension-composition-build-report.v1` |
| Tatsächlich erzeugter Host | API `6.0.0`, Capability-Bericht v2 |

Beide Einstiege sind auch unter `@ccslabs/xtend/maraca/…` verfügbar. Die bisherige Root-Exportfolge mit 212 Schlüsseln bleibt vollständig erhalten und wird auf **214** erweitert. Der neue Fingerprint lautet `8a443b512c6993227950c2393eaa722ded512ea4f2243d4c09f527aaf3605924`. Maracas bestehende Build-/Config-v4-, Plan-Runtime-v7-, Browser-API-5-, Classic-AST- und A02-Sidecar-Verträge bleiben unverändert. Die neuen APIs und Datenfamilien besitzen eigene explizite Versionen.

Die älteren `xtension-manifest.v1`-/Capability-Registry-Verträge bleiben statische Planungs- und Ladeentscheidungsberichte. Sie sind keine ausführbaren Kompositionsmanifeste. Es gibt keine stille Konvertierung ihrer Host-v1-Claims in verifizierte API-6-Provider.

## Geschlossener erster Pfad

1. Der Build validiert den vorhandenen Maraca-v4-Plan und seine Bindungen erneut mit State-Binding-API 2.4. Das Kompositionsartefakt bindet Source-Hash, das vollständige kompilierte Orchestrierungsprogramm und den Bindungsvertrag. Ein veränderter Plan oder Bindungsvertrag wird beim Aufbau der Host-Factory zurückgewiesen.
2. Jede Deklarations-ID benötigt genau eine Provider-Zuordnung und als `ownerSurface` genau ihre deklarierte Surface. Alle Provider müssen verwendet werden. Verschachtelte Wiederholungen erzeugen weiterhin konkrete keyed Instanzen aus derselben Deklaration. Deren Signal-/Container-Identität wird nicht mit der gemeinsamen owning Surface verwechselt.
3. Provider deklarieren ID, Framework, eigene Version, lokale ESM-Datei, benannten Komponentenfactory-Export, SHA-256 und exakte externe Peer-Versionen. Alle Bytes werden vor der ersten Ausgabemutation gelesen und geprüft. Absolute/Remote-Pfade und Symlink-Ausbrüche aus dem Projekt werden abgewiesen.
4. Der Build übernimmt genau diese geprüften Bytes in inhaltsadressierte `providers/*.mjs`-Dateien. Ein generierter ESM-Einstieg importiert sie unmittelbar und exportiert den tief eingefrorenen `artifact` sowie `createHostFactory(ports)`. Nachträgliche Änderungen der ursprünglichen Provider-Datei ändern diesen Graphen nicht. Bereits existierende Ausgabedateien dürfen nur bei identischen Bytes wiederverwendet werden.
5. Die generierte Factory übernimmt die gemeinsamen Plattform-Ports einmal und erzeugt anschließend den passenden React-/Vue-Host pro Registry-Kontext. Scope, Host-ID, Instanz-ID und Event-Schemata kommen aus der Registry. Komponenten und Provider erhalten keine Kernel-/Surface-Administrationsports.
6. Der tatsächliche Adapter vergleicht die Manifest-Anforderungen mit den separat von der Anwendung gewährten Rechten. Ein Pflichtdefizit blockiert vor Queue, Peer-Lader, Providerfactory, Framework-Root und Ressourcenlease. Optionale Defizite bleiben im bestehenden A03.4-Bericht sichtbar.
7. Der externe Peer-Lader und anschließend die synchrone Komponentenfactory laufen im zugelassenen Mount-Job: **Host → echter Microkernel → Fabric → Peer-Lader/Factory → Framework-Lieferung**. Die echten Peer-Versionen werden vor der Factory geprüft. Terminaler Entzug fängt auch einen erst später aufgelösten Peer-Lader ab.
8. Der vorhandene A02-/A03-Pfad übernimmt kontrollierte Props, typed Intents, Work-Budgets, Surface-Suspend/Resume, keyed Reinkarnation und Cleanup. Ein späteres Cleanup der alten Instanz kann weder Geschwister noch eine neue Inkarnation desselben Schlüssels entfernen.

## Verwendung

[`reference.cjs`](reference.cjs) baut das tatsächlich kompilierte A02-Beispiel mit [`React`](providers/react-panel.mjs) oder [`Vue`](providers/vue-panel.mjs). Die Provider enthalten ausschließlich vorkompilierte Komponentenfactorys; ihre Frameworks werden extern injiziert.

```js
const { buildMaracaXTensionComposition } = require('@ccslabs/xtend-maraca/xtension-composition');
const report = await buildMaracaXTensionComposition({
  plan, manifest, bindingsRuntime, rootDir: projectRoot, outputDir: companionDirectory
});
// Im Anwendungseintritt: statischer Import des erzeugten ESM-Einstiegs.
// sharedPorts umfasst plan, bindingsRuntime, compositionRuntime, adapters,
// loadPeers, fabric, kernelWork, resourceGraph und explizite grants.
const createXTensionHost = generatedCompanion.createHostFactory(sharedPorts);
// Als bisherigen Maraca-Factory-Port einsetzen; pro Instanz kein Adapterbau mehr.
```

`grants[declarationId]` ist eine kopierte Anwendungspolicy mit `lifecycle`, `work`, `allowedResources`, optional `workBudget`, `authorize` und `validateProps`. Das Manifest kann diese Rechte weder erzeugen noch erweitern. Die bestehenden Schema-/Policy-Prüfungen der tatsächlichen Adapter bleiben verbindlich. `loadPeers({ provider, signal })` ist ein vertrauenswürdiger Anwendungslader. Der Host wartet bei Dispose nicht auf dessen Promise; der Lader kann sein Signal zusätzlich zur eigenen Netzwerkbereinigung verwenden.

Der Browser-Composer nimmt vertrauenswürdig geladene Provider-Namespaces an. Ein an ihn übergebener JSON-Hash beweist keine Laufzeitbytes. Der neue Build belegt die Kopie und Importreferenzen seiner Ausgabe; Browser-/HTTP-Auslieferung, CSP und Integrität nach einem weiteren Bundle-Schritt benötigen ihren eigenen späteren Nachweis. Beide Build-Berichte führen deshalb `runtimeExecutionVerified: false`.

## Bewusste A04.1-Grenzen

Lokale Provider bestehen aus synchronen benannten Funktionsdeklarationen. Imports, Reexports, dynamische Imports, `require`, Top-Level-Initialisierer/-Ausführung, asynchrone Factorys und ungültiges JavaScript werden abgewiesen. Die Komponentenfactory bekommt nur ihre Framework-Peers und gibt synchron eine vorkompilierte Komponente zurück. Das ist ein begrenzter Build-Graph für vertrauenswürdigen Anwendungscode, keine JavaScript-Sandbox. Private Framework-Scheduler, SSR, Adoption und Präemption werden weiterhin nicht behauptet.

Der gemeinsame native Root, Scheduler, Fabric und die von Maraca tatsächlich verwendeten Surface-Ports werden in diesem Abschnitt ausdrücklich injiziert. Die automatische Auswahl über neue Plan-/Config-/Boot-Versionen ist in [A04.2](integration.md) implementiert. Der explizite Manifest-v1-Einstieg bleibt importfrei. [Manifest v2 / API 3](provider-graphs.md) ergänzt lokale statische Provider-Abhängigkeitsauflösung und transformierte Datei-Provenienz. Offen bleiben Remote-Provider, SemVer-Bereichsauflösung, Peer-Deduplizierung, Lazy-/CSP-Auslieferung oder Auswahl einer abweichenden übergeordneten owning Surface.

## Nachweise und nächste Schritte

[`inspect.cjs`](inspect.cjs) prüft **36** Build-/Datenfälle einschließlich fehlerhafter Zuordnung, Integrität, Importen, Ausbrüchen, Änderungen der Originaldatei und gebundenem Programm. [`evidence.json`](evidence.json) bindet die geprüften Quellen per SHA-256. Die Prüfung ist Teil des blockierenden 0.9-Vorbereitungs-Gates; sie führt keine Frameworks aus.

[`composition-maraca-acceptance.js`](../../tests/xtensions/composition-maraca-acceptance.js) führt **14** zusätzliche reale Fälle in jsdom und Chromium aus: pro Framework sieben Fälle für generierte Provider-Graphen, typed Model-Intents, tatsächliche Kernel-/Fabric-Zulassung, getrennte Rechte, Peer-Versionen, verspäteten Cleanup, Surface-Lifecycle und keyed Reinkarnation. Der Gesamt-Gate verlangt seit A04.2 **300 Fälle pro Umgebung** und weiterhin **88 Compilerprüfungen**. Gepackte Root-/Compiler-/Maraca-Consumer bauen und importieren den Begleiter, mounten tatsächliche React-/Vue-Hosts und prüfen Typen sowie den Browser-Bundle-Abschluss ohne implizite Framework-Abhängigkeiten.

[A04.2](integration.md) ergänzt 27 Build-/Vertragsfälle und 17 tatsächliche Laufzeitfälle für den regulären Build und Browser-Boot. Der [integrierte Größenbericht v2](integration.md#größenbudget-v2) und die fehlende Minifizierung sind umgesetzt; Production-/Max-Referenzen bestehen strikte Gesamt- und XTension-Budgets. [A04.3.1](provider-graphs.md) ergänzt lokale transitive Providergraphen. [A04.3.2](loading.md) ergänzt einen expliziten Ladeplan und Provider-Importe im zugelassenen Mount. Als Nächstes folgen gemeinsame Peer-/CSP-/Auslieferungsentscheidungen. A05/A06 und die vollständige 0.9-Feature-Abnahme bleiben eigenständig.
