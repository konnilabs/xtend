# A03.3 – Begrenzte Arbeit und kooperative Druck-/Budgetstrategien

Stand: 2026-11-10. **A03.3 ist implementiert; A03 bleibt für weitergehende Fähigkeitsverhandlung offen.** Der Anwendungshost begrenzt ausdrücklich gewährte Geschäftsarbeit und konsumiert den Druckzustand seines realen Microkernels. Der Ausführungsweg bleibt **Host → Microkernel-Queue → Fabric → Callback**. Surface-/Kernel-Eigentum und unmittelbarer terminaler Entzug aus A03.2 gelten unverändert. RMTX und XTensions 2.0 bleiben für 0.9 `preparing`.

## Expliziter Vertrag

Die vorhandenen Kernel-Factories wählen mit der eigenen Option `workBudget` den neuen API-5.0.0-Overload. Dieser verlangt die explizite `resourceGraph`-Bindung und den vorhandenen nativen Scheduler einschließlich `snapshot()`. Ohne `workBudget` bleiben direkte v2-, Kernel-v3- und Graph-v4-Aufrufe erhalten. Der vollständige v4-Typvertrag bleibt stehen. Die Registry API 2.3.0 akzeptiert zusätzlich versionstreue v5-Hosts; Maracas bestehender Factory-Port und Idle-Barrieren schließen sie ein. Serialisierte Pläne, Bindungsdaten, Kernel-/Surface-Ports und die Paket-Export-Schlüssel ändern sich nicht.

```js
const host = createReactKernelRuntimeAdapter({
  container, component, peers: { React, ReactDOM }, fabric,
  kernelWork: {
    scheduler, rootId: 'application', scope: 'filters-incarnation-17',
    work: { scan: { lane: 'background', maxChunkMs: 8, timeoutMs: 5000 } }
  },
  resourceGraph: { kernel, surfaceGraph, surfaceController, surfaceId: 'filters' },
  workBudget: {
    schema: 'xtend.xtensions.work-budget-policy.v1',
    maxPending: 4,
    work: {
      scan: {
        maxPending: 1, overflow: 'replace-oldest',
        pressure: {
          constrained: { maxChunkMs: 2 },
          critical: { admission: 'reject', maxChunkMs: 1 }
        }
      }
    }
  }
});
```

Der Host verwendet Schema `xtend.xtensions.runtime-host-controller.v5`, React-/Vue-Adapter entsprechend v5. `workBudget` wird als geschlossenes, endliches JSON geprüft und kopiert. Die Namen unter `work` müssen genau den gewährten `kernelWork.work`-Namen entsprechen. Das globale `maxPending` liegt zwischen 1 und 128, das Limit jedes Namens zwischen 1 und dem globalen Limit. Fehlende Limits, unbekannte Felder, Druckstufen, Aktionen oder eine Chunk-Erhöhung über den ursprünglichen Grant werden abgewiesen. Explizites `workBudget: undefined` ist ebenfalls ungültig.

Die Komponente behält ausschließlich `xtension.work.schedule(name, callback)` mit genau zwei Argumenten. Sie erhält keinen Druckschreiber, Scheduler, Budget-Override oder frei wählbaren Coalescing-Key. Lifecycle-Daten und Props können die Policy nicht ändern.

## Zulassung und Überlauf

Gezählt werden alle logisch ausstehenden benannten Jobs des konkreten Hosts: queued, auf Aktivierung wartend, laufend, asynchron wartend oder yielded. Lifecycle-Jobs zählen nicht dazu und bleiben zustellbar. Abgeschlossene oder widerrufene Jobs geben ihre Kapazität unmittelbar frei; dies wartet nicht auf Promise-Beobachter. Die Limits begrenzen logische Autorität, nicht die physische Laufzeit eines nicht kooperierenden alten Callbacks.

`reject-new` ist der Standard. Bei einem erreichten globalen oder namensbezogenen Limit erzeugt ein weiterer Auftrag keinen Kernel-Job und keine Fabric-Ausführung. Sein Handle hat `jobId: null`, ein bereits abgebrochenes Signal und ein verworfenes `result`: `WorkAdmissionError`, Code `xtensions.work.admission-rejected`, Grund `pending-limit`.

`replace-oldest` darf bei Überlauf höchstens den ältesten noch ausstehenden Auftrag **desselben Namens und Hosts** widerrufen. Die Ersetzung erhält einen neuen echten Kernel-Job; sie übernimmt keinen alten Callback und startet ihn nicht automatisch neu. Fremde Grants, andere keyed Hosts und der gemeinsame Anwendungskernel werden nicht gecancelt. Wenn die globale Kapazität durch andere Namen belegt ist, wird der neue Auftrag abgewiesen. Signals/Guards des ersetzten Auftrags verlieren sofort ihre Autorität. Eine interne Kapazitätsreservierung verhindert Überbuchung durch synchrone Scheduler-Beobachter und Abort-Listener. Suspend/Dispose während dieser Listener gewinnt vor der neuen Einplanung.

## Druck und Zeitbudgets

Die Autorität ist `scheduler.snapshot().pressureLevel` mit den vorhandenen Werten `idle`, `normal`, `elevated`, `constrained`, `critical`. Der Adapter schreibt den gemeinsamen Druckzustand nicht. Die Anwendung koppelt vorhandene Fabric-/Plattform-Signale an ihren Scheduler; ein Fabric-Callback allein ist weiterhin keine Kernel-Zulassung. Ein fehlender oder ungültiger Snapshot-Port wird vor dem Mount abgewiesen, spätere ungültige Snapshots führen zu einem Fehler statt stiller Freigabe.

Jede Druckstufe ist ein eigenständiger optionaler Override; es gibt keine vererbten Schwellen. Ohne Override gelten `admission: "allow"` und die ursprüngliche Chunk-Grenze. `admission: "reject"` verweigert neue Arbeit mit Grund `kernel-pressure`. Bereits queued zugelassene Arbeit prüft den aktuellen Druck nach bestätigter Host-Aktivierung und vor Eintritt in Fabric erneut. Eine zwischenzeitlich abgewiesene Zulassung bleibt ein tatsächlicher fehlgeschlagener Kernel-Job. Nach Host-Autorisierung wird vor dem Callback nochmals geprüft; erwartete Zulassungsablehnung wird nicht als Framework-Fehler diagnostiziert.

Ein neuer Job erhält den zum Zulassungszeitpunkt reduzierten `maxChunkMs`-Hinweis. Laufende Arbeit prüft in `shouldYield()` zusätzlich die aktuelle kleinere Grenze gegen die native monotone Kernel-Uhr; `yield()` läuft tatsächlich durch den Kernel und setzt nach Wiederzulassung den lokalen Chunk-Anfang zurück. Native Hinweise auf höhere Priorität bleiben wirksam. Ein bereits erzeugter nativer Request wird nicht nachträglich verändert; sein engerer Hinweis kann nach Druckentlastung bestehen bleiben. Lane, Priorität, Root, Scope, Timeout und Budgetklasse stammen weiterhin aus dem ursprünglichen Grant.

Ein Druckwechsel allein stoppt keine bereits laufende Geschäftsarbeit und löst keine automatische Wiederholung aus. Diese Arbeit muss weiter kooperativ prüfen/yielden; Host-/Surface-Suspend, Ersetzung, Komponenten-Cancel und native Timeouts widerrufen ihre Signals/Guards. `timeoutMs` ist der vorhandene native logische Timeout ab Einplanung einschließlich Wartezeit, keine harte JavaScript-Unterbrechung. Private Framework-Renderings und synchron nicht kooperierendes JavaScript bleiben außerhalb dieser Steuerung; der unveränderte Capability-Vertrag v1 behauptet weiterhin `preemption: false` und `frameworkInternalScheduling: false`.

## Beobachtung und Nachweise

`snapshot().workBudget` ist ein portfreier DTO mit Schema `xtend.xtensions.work-budget-state.v1`: aktueller Kernel-Druck, globales Limit, aktuelle Zahl ausstehender Arbeit, kumulierte Ablehnungen/Ersetzungen und die letzte solche Entscheidung mit Name, Grund und Druckstufe. Er enthält keine Props, Geschäftsresultate, Callbacks oder Framework-Handles. Der vorhandene Work-Scope-Snapshot v1 behält seine Datenform.

[`budget-inspect.cjs`](budget-inspect.cjs) führt native Kernel-/Fabric-Vertragsprüfungen aus und bindet produktive Quellen, Typen und Gates in [`budget-evidence.json`](budget-evidence.json). Der blockierende Releasevorbereitungs-Gate führt `--check` aus. Die tatsächliche Framework-Abnahme umfasst **26 neue Fälle**: zwölf je React/Vue und zwei kompilierte keyed Maraca-Fälle. Alle **216 bisherigen Fälle** bleiben erforderlich, insgesamt **242 je jsdom/Chromium** sowie 88 Compilerprüfungen. Gepackte Root-/Compiler-Consumer führen v2–v5 mit expliziten externen Peers aus; strikte Typprüfungen schützen Overloads, Graph-Eigentum und Registry-/Maraca-Anbindung.

Weitergehende Anforderung-/Fähigkeitsverhandlung pro Adapter folgt als nächster A03-Abschnitt. Automatische Manifest-/Provider-/Build-Komposition bleibt A04, SSR/Adoption A05 und endgültige RMTX-Syntax/DX A06. Dieser Zwischenstand ist keine vollständige 0.9-Feature-Abnahme.
