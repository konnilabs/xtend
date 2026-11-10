# A03 – Tatsächliche Orchestrierungsgranularität

Stand: 2026-11-10. **A03.1 bis A03.4 sind implementiert; der explizite React-/Vue-Pfad ist abgedeckt.** Dieser erste Abschnitt verbindet echte XTension-Hosts und ausdrücklich deklarierte kooperative Arbeit mit dem RMT-Microkernel. Fabric ist für diesen neuen Pfad verbindlich. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`.

## 1. Ausführungsweg und Eigentümer

Der Anwendungshost injiziert den vorhandenen RMT-Scheduler und Fabric. Die neuen Factories heißen `createReactKernelRuntimeAdapter` und `createVueKernelRuntimeAdapter`; Root- und Compilerpaket exportieren sie über die vorhandenen `./xtensions/*-runtime-adapter`-Einstiege. Der Pfad lautet:

**XTension-Host → echte Microkernel-Queue → Fabric-Boundary → Framework beziehungsweise freigegebener Work-Callback.**

Die tatsächliche Einplanung übernimmt der Microkernel. Fabric bleibt die Boundary-/Lifecycle-Schicht beim Start und während des asynchronen Abschlusses. Der Adapter erzeugt keine eigene Warteschlange als Ersatz für den Kernel. `boundary.run()` allein ist weiterhin keine Kernel-Einplanung. Fabric ist in A03.1 noch nicht der allgemeine Scheduling-Eingang; der Host übergibt die Arbeit dem injizierten Kernel-Port und tritt nach dessen Zulassung in die Fabric-Boundary ein.

`mount`, kontrolliertes `update`, `suspend` und `resume` sind beobachtbare Kernel-Jobs. Jeder Job erhält Root, Instanz-Scope, Lane und Budgethinweise vom vertrauenswürdigen Host. Die Fabric-Aufzeichnung verwendet dieselbe effektive Lane und denselben Scope; `metadata.kernelJobId` verweist auf den tatsächlichen Kernel-Job. Props gelangen nicht in Request-Metadaten. Lifecycle-Promises schließen die tatsächliche Framework-Lieferung ein. Die Kernel-Queue darf während eines asynchron wartenden Jobs andere Jobs ausführen.

Die terminale Bereinigung entzieht sofort die Autorität und cancelt sämtliche vom Host gehaltenen Jobs. Sie wartet nicht auf Kernel-Zulassung, einen Provider oder einen blockierten Render und läuft weiterhin durch Fabric. Dadurch bleibt Cleanup auch bei Panic oder einem bereits geschlossenen Scheduler möglich. Synchron laufendes JavaScript kann dabei nicht präemptiv unterbrochen werden.

## 2. Explizite Grants und kooperative Arbeit

```js
import { createReactKernelRuntimeAdapter }
  from '@ccslabs/xtend/xtensions/react-runtime-adapter';

const adapter = createReactKernelRuntimeAdapter({
  container, component, peers: { React, ReactDOM }, fabric,
  kernelWork: {
    scheduler,
    rootId: 'orders-model-session',
    scope: 'order-panel-lifetime-17',
    lifecycle: { lane: 'visible', maxChunkMs: 4 },
    work: {
      filter: { lane: 'background', maxChunkMs: 2, timeoutMs: 5000 }
    }
  },
  policy: {
    events: { selection: 'xtend.schemas.xtension.intent.v1' },
    allowedResources: ['subscription']
  }
});
await adapter.mount(container, { title: 'Orders' });
```

Ohne gültige Fabric-Boundary und den expliziten Scheduler-Port `xtend.rmt.kernel-scheduler.v1` wird die v3-Konstruktion abgewiesen. Grant-Namen, Lanes, Priorität (0–100), positive Chunk-Hinweise, nichtnegative Timeouts und Budgetklasse werden geprüft und kopiert. Root, Scope, zusätzliche Request-Optionen und Coalescing können nicht aus Komponenten- oder Lifecycle-Daten gewählt werden. Der Host wählt einen Scope pro konkreter Instanzlebensdauer; seine Registry-/Session-Komposition ist weiterhin ausdrücklich.

Die Komponente erhält `xtension.work.schedule(name, callback)`. Ausschließlich vom Host gewährte Namen sind zulässig. Es gibt keine frei wählbaren Request-Optionen und keinen Scheduler-Port im Komponenten-Facade. Der Callback startet erst nach abgeschlossenem Mount beziehungsweise Resume und weiterhin gültiger Host-Policy. `policy.authorize` wird mit `operation: "work:<name>"` und den aktuell committeten Props geprüft; Reentranz in Dispose wird danach erneut eingezäunt.

```js
// Beispielsweise innerhalb eines Framework-Effekts:
const job = xtension.work.schedule('filter', async context => {
  const results = [];
  for (const item of items) {
    if (!context.isCurrent()) return;
    results.push(transform(item));
    if (context.shouldYield()) await context.yield('filter-chunk');
  }
  context.guard(() => setLocalResults(results))();
});
// Im Cleanup des Effekts:
const stop = () => job.cancel('effect-replaced');
```

Das Handle bietet `jobId`, `signal`, `result` und `cancel()`. `context.signal`, `isCurrent()`, `guard()`, `shouldYield()` und `yield()` gelten für diesen Job und seine Host-Generation. Sie sind keine Model-Revisionsprüfung. Bei veränderten Props/Abhängigkeiten cancelt der Effekt seinen alten Auftrag selbst. Ein Work-Ergebnis schreibt keinen RMT-State; kontrollierte Änderungen laufen weiter als deklarierte Intents/Actions durch den Model-Writer.

Suspend beendet die aktuelle Work-Generation und die vorhandenen kooperativen Ressourcen. Ihre alten Signals/Guards werden auch nach Resume nicht wieder gültig. Neue Aufträge während Suspend oder terminalem Shutdown erzeugen keinen Kernel-Job: `jobId` ist `null`, `result` wird mit `AbortError` abgewiesen. Unbekannte Namen und Request-Optionen sind dagegen Eingabefehler. Während Mount/Resume angemeldete Arbeit wartet bis zur bestätigten Aktivierung. Ein Fehler eines benannten Auftrags wird in Kernel, Fabric und Host-Diagnostik sichtbar; er erzeugt keinen automatischen Model-Commit und keinen behaupteten Framework-Abbruch.

## 3. Fähigkeiten und Grenzen

`adapter.getCapabilities()` liefert unveränderliche Daten mit Schema `xtend.xtensions.runtime-capabilities.v1`:

| Fähigkeit | Nachgewiesene Bedeutung |
| --- | --- |
| `lifecycle: "kernel-jobs"` | Die vier retained Lifecycle-Operationen werden tatsächlich eingeplant. |
| `fabricBoundary: true` | Fabric ist für jeden zugelassenen Lifecycle-/Work-Aufruf verbindlich. |
| `namedWork` | Statisch gewährte Namen; aktuelle Host-Policy bleibt zusätzlich maßgeblich. |
| `cooperativeResources: true` | Vorhandene Ressourcenregistrierung mit synchronem Cleanup bleibt nutzbar. |
| `cooperativeCancellation: true` | Eigene Signals und Generationsprüfung widerrufen kooperierende Arbeit. |
| `budgets: "cooperative"` | Chunk-Budgets sind Hinweise für `shouldYield()`/`yield()`, keine harte Laufzeitpräemption. |
| `frameworkInternalScheduling: false`, `preemption: false` | Private Framework-Scheduler, autonome Render-/Watch-/Effect-Schritte und nicht kooperierende Callbacks werden nicht granular gesteuert. |
| `terminalCleanup: "immediate"` | Terminaler Entzug/Cleanup umgeht die Job-Zulassung. |

Die realen React-/Vue-Tests zeigen ausdrücklich, dass frameworklokaler State auch während kooperativer Suspension aktualisiert werden kann, ohne einen Kernel-Job vorzutäuschen. Eine Fabric-/Kernel-Aufzeichnung über den Host-Aufruf macht daraus keine Aufzeichnung jedes privaten Framework-Schritts.

`snapshot().kernelWork` verwendet `xtend.xtensions.kernel-work-scope.v1`: Phase, Generation, noch gehaltene Jobs und die letzten 32 abgeschlossenen Job-Datensätze. Aufträge anderer Hosts oder des gemeinsamen Anwendungskernels werden nicht gecancelt. Der Scheduler bleibt Eigentum des Anwendungshosts.

## 4. A03.1-Verträge und aktuelle A02-Anbindung

| Vertrag | Stand |
| --- | --- |
| Vorhandene direkte Runtime-Factories | API `2.0.0`, Host `xtend.xtensions.runtime-host-controller.v2`; unveränderter v2-Typvertrag und tatsächliche Legacy-Regressionen |
| Neue Kernel-Factories | API `3.0.0`, Host `xtend.xtensions.runtime-host-controller.v3`, Adapter `xtend.xtensions.react-runtime-adapter.v3` beziehungsweise `xtend.xtensions.vue-runtime-adapter.v3` |
| Capability-Bericht | Neues Schema `xtend.xtensions.runtime-capabilities.v1` |
| Scope-Aufzeichnung | Neues Schema `xtend.xtensions.kernel-work-scope.v1` |
| Bindungs-Registry | API `2.4.0`: akzeptiert versionstreue v2- bis v6-Host-Ports |
| Bindungsdaten / Sidecar / Compiler / Classic-AST | Unveränderte Datenformen v2 / v3 / API 4.0.0 / 1.0.0 |

Die bisherigen Factory-Namen erzeugen weiterhin ausdrücklich direkte v2-Hosts; die neuen Namen verlangen die v3-Ports. Der Paket-Export-Lock bleibt bei 212 geordneten Einstiegsschlüsseln; die Value-Exports der beiden bestehenden Runtime-Adaptermodule werden additiv erweitert. TypeScript deklariert die neue Factory und den neuen v3-Host separat. Maracas bestehender Factory-Port akzeptiert nun den kompatiblen zusätzlichen Host-Typ über Registry API 2.4; es gibt keine neuen serialisierten Maraca-Planfelder oder Runtime-Mitglieder.

Der Integrationsnachweis verwendet das tatsächlich kompilierte A02.4-Programm: drei keyed React-Hosts am gemeinsamen Maraca-Scheduler, dieselben Fabric-/Kernel-Scopes, echte Actions und Model-/XTend-State-/Props-Auslieferung. Entfernen eines Schlüssels cancelt dessen Arbeit. Ein später wieder hinzugefügter gleicher Schlüssel erhält einen neuen Host und kann alte Callbacks nicht übernehmen. Die Auswahl der v3-Factory und das Setzen ihrer Scope-/Grant-Daten erfolgen bisher ausdrücklich im Anwendungshost.

## 5. A03.1-Nachweise

[`inspect.cjs`](inspect.cjs) führt 20 Framework-unabhängige Vertragsprüfungen mit echtem RMT-Scheduler und Fabric aus. Er prüft Grants, Versionen, tatsächliches Yielding, Job-/Fabric-Korrelation sowie Suspend-/Dispose-Fences und bindet Quellen/Typen an [SHA-256-Nachweise](evidence.json). `frameworkExecutionInPreparationCheck: false` trennt diese Prüfung von der eigentlichen Framework-Abnahme. Der blockierende Releasevorbereitungs-Gate führt ihn mit `--check` aus.

Die A03.1-Abnahme umfasst **26 A03.1-Fälle** in jsdom und Chromium: React und Vue, echte Queue-Zulassung vor Fabric, asynchrone Mount-/Props-Abschlüsse, freigegebene Arbeit, höhere Priorität beim Yield, Scope-/Policy-Prüfungen, Cancellation, Panic-/Cleanup, autonome Framework-Grenzen und kompilierte Maraca-Hosts. Dieser Abschnitt liefert **184 Basisfälle pro Umgebung** sowie 88 Compilerprüfungen. Der aktuelle Gesamtumfang mit A03.2 folgt in Abschnitt 6. Gepackte Root-/Compiler-Consumer führen beide v3-Factories einschließlich ihrer privaten Scope-Abhängigkeiten aus; Node-/Browser-Exports und strikte Typen werden geprüft.

## 6. A03.2–A03.4 und nächste Abschnitte

A03.1 liefert den ersten expliziten Kernel-/Fabric-Pfad. [A03.2](resource-graph.md) verbindet konkrete Hosts mit dem Surface-/Kernel-Ressourcengraphen über den expliziten API-4.0.0-Overload und Registry 2.4.0. [A03.3](work-budgets.md) ergänzt API-5.0.0-Hosts mit begrenzter benannter Arbeit, explizitem Überlauf und kooperativen Druck-/Chunk-Budgets. [A03.4](capability-negotiation.md) ergänzt Host-API 6.0.0, Capability-Bericht v2 und den expliziten Pflicht-/Optional-Abgleich pro tatsächlichem Adapter. Der aktuelle Gesamt-Gate verlangt 269 Runtime-Fälle pro Umgebung, davon 32 für A03.2, 26 für A03.3 und 27 für A03.4. Der ausdrücklich komponierte React-/Vue-Pfad ist damit implementiert; vollständige Frameworkbreite und 0.9-Abnahme werden nicht behauptet. Es gibt keine automatische Wiederholung abgebrochener Arbeit und keine Steuerung beliebiger Framework-Interna.

Automatische Manifest-/Provider-/Build-/Host-Verkettung folgt A04, SSR/Adoption A05 und RMTX-Syntax/DX A06. Dieser Entwicklungsnachweis ersetzt keine vollständige 0.9-Feature-Abnahme.
