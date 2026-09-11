# Maraca: FastPass und Präsentations-Lebensdauer (0.8.0)

Maraca verwendet weiterhin genau eine RMT-Scheduler-Autorität. Auf Paint, Idle oder `scheduler.postTask` wartende Jobs halten keinen Ausführungsplatz mehr. Bereite Jobs durchlaufen erneut die Prioritätsauswahl. Browser-Prioritäten, kooperatives `yield()`, Timeouts und Cancellation bleiben wirksam.

## Diagnosen nach Bedarf

`runtime.subscribe(listener)` liefert weiterhin vollständige, unveränderliche Runtime-Snapshots. Pro Publikation entsteht höchstens ein Vollsnapshot, gemeinsam für die vorhandenen Vollsnapshot-Abonnenten. `runtime.subscribeEvents(listener)` liefert stattdessen ein unveränderliches Ereignis mit `type` und `generation` sowie den zum Ereignis gehörenden Feldern. Es liefert **keinen** Snapshot-Wrapper. `runtime.snapshot()` bleibt ein synchroner, vollständiger Einzelabruf.

Ohne Vollsnapshot-Abonnenten werden keine automatischen Vollsnapshots erzeugt. Fehler, Recovery-Daten, Zähler und `lastEvent` bleiben erhalten. Die bloße Installation der DEV API aktiviert keine Vollsnapshot-Beobachtung. Die Maraca-Browser-Bridge und die Material-Scaffold-DEV-API verwenden Ereignisse; Diagnosewerkzeuge können daraufhin explizit aktuelle Snapshots abrufen. Unsubscribe, spätes Verbinden und Wiederverbinden benötigen keinen Runtime-Neustart.

```js
const stop = runtime.subscribeEvents(event => {
  if (event.type === 'diagnostic') console.log(runtime.snapshot());
});
stop();
```

## Shell-Aktionen mit FastPass

```rmt
action showReports {
  execution fastpass
  effect navigation "#reports"
}
action dismissPanel {
  execution fastpass
  effect close surface panel
}
action focusNavigation {
  execution fastpass
  effect focus surface navigation
}
```

Navigation akzeptiert auch eine deklarierte Eingabe, z. B. `input path string` mit `effect navigation input.path`. Fokus und Close benötigen eine benannte Surface. Die vorhandenen Event-Bindings und `dispatchCommand()` erkennen FastPass automatisch; der Promise-Vertrag von `dispatchCommand()` bleibt erhalten.

Programmatische Deklarationen werden beim Erstellen der Runtime über `fastPassActions` registriert:

```js
const runtime = createMaracaPlanRuntime({
  ...ports,
  fastPassActions: [{
    id: 'shell.navigate', scope: 'main',
    effects: [{ kind: 'navigation', path: { kind: 'reference', path: 'input.path' } }]
  }]
});
await runtime.boot();
const job = runtime.dispatchFastPass('shell.navigate', { path: '#reports' });
// job.cancel('cancelled-by-user');
const result = await job.result;
```

Der Scheduler-Handle ist abbrechbar; Cancellation verwirft sein Promise wie bei anderen RMT-Jobs. Das erfolgreiche Ergebnis enthält den angewendeten Shell-Intent. Es wartet weder auf geladene Inhalte noch auf Animationen. Navigation/Fokus nutzen die vorhandenen `navigationAdapter.navigate`-/`focusAdapter.focus`-Ports. Close validiert zuerst den Surface Controller und übergibt die sichtbare Änderung an den PresentationEffectPort. Ein eigener PresentationEffectPort benötigt für FastPass Close zusätzlich `setSurfaceHidden(id, hidden)`.

FastPass nutzt `user-blocking` und wartet nicht auf die fachliche Command-Kette. Navigation wird pro `scope`, Fokus pro `scope` zusammengeführt; ohne Scope gilt der Runtime-Bereich. Wiederholtes Schließen ist idempotent. Ein verdrängter Scheduler-Auftrag wird abgebrochen und niemals als normaler Command wiederholt. Ältere Commands dürfen ihre geordneten Modelltransaktionen abschließen; ihre veralteten Präsentations-Commits und Navigation-/Fokus-Effekte werden verworfen.

Compiler und Runtime verwenden dieselbe Validierung: Reducer, Status-/Result-State, Datenquellen, Services, Streams, Ressourcen, Custom-Effekte und verkettete fachliche Commands sind nicht erlaubt. FastPass ist kein allgemeiner Weg zur Beschleunigung von Modelltransaktionen. Synchrone Arbeit bleibt kooperativ; Überschreitungen des Standardbudgets von 8 ms erzeugen eine Diagnose.

## Abort Boundary

`runtime.getSurfaceBoundary(id)` liefert die automatisch verwaltete Präsentations-Boundary. Ohne ID wird die Root-Boundary geliefert. Für externe Renderer steht `createMaracaAbortBoundary({ id, parent })` aus `@ccslabs/xtend/maraca/plan-runtime` bereit.

- `capture()` erzeugt einen Token; `isCurrent(token)` prüft ihn.
- `invalidate(reason)` beendet die bisherige Epoche und bricht deren Signal ab.
- `setActive(false)` sperrt auch neue Präsentationsarbeit, bis `setActive(true)` eine neue Epoche eröffnet.
- `dispose()` beendet die Boundary einschließlich ihrer Kinder endgültig.
- `run(work, token)` beendet verworfene Arbeit kontrolliert mit `{ ok: false, status: 'superseded' }`.
- `commit(work, token)` prüft direkt vor einer synchronen Mutation.
- `scheduleCommit(scheduler, work, token, request)` prüft auch nach dem Scheduler-Warten und entfernt bei Invalidierung den wartenden Job.

Tokens bleiben auf dem Main Thread. Sie sind keine Worker-Payload, Datenversion oder Ersatz für bestehende Anfragegenerationen.

```js
const boundary = runtime.getSurfaceBoundary('panel');
const token = boundary.capture();
const response = await kernel.runtime.requestUiCompute(envelope, {
  abortBoundary: boundary, presentationToken: token
});
if (response.status === 'superseded') return;
await boundary.scheduleCommit(kernel.scheduler, () => {
  renderer.commit(buildCommit(response));
}, token);
```

Prüfungen nach der Antwort **und unmittelbar vor dem Commit** verhindern verspäteten DOM-Aufbau oder Chart-Start. Ein `superseded`-Ergebnis darf keinen synchronen Rendering-Fallback auslösen. Externe Adapter verwenden die gleiche Boundary auch für ihre eigenen Fehler- und Fallback-Pfade.

Verwaltete Surfaces invalidieren Präsentationsarbeit bei Close, Hide, Minimize/Collapse, Route-Verlassen, Zielersetzung, Datenneuprojektion und Dispose. Neue Surface-Instanzen mit gleicher ID besitzen eine neue Identität. Fehlgeschlagene atomare Lifecycle-Operationen ändern die Boundary nicht. Hydration erhält `metadata.surfaces` mit `id`, `boundary`, `token`, `signal` und `isCurrent()` sowie einen Root-Guard. Eigene Hydratoren müssen diese Guards an asynchronen Übergängen und vor Ressourcen-/DOM-Commits beachten.

Gemeinsames Prewarming darf Module und gültige Daten weiter in den Cache laden. Imports und Services behalten ihre eigenen Besitzer. Cancellation entfernt nur die betroffene UI-Worker-Anfrage; sie beendet nicht den gemeinsamen Worker. Bereits laufendes synchrones JavaScript oder ein externer Adapter, der seine Guards ignoriert, kann nicht nachträglich präemptiert werden.

## Beispiel und Prüfung

Das native Beispiel liegt in `demos/xtendrmt/maraca-fastpass/`. `maraca-responsiveness` prüft die neuen Verträge deterministisch; `rmt-kernel-scheduler` hält Host-Callbacks gezielt zurück. Ergänzend prüfen die Maraca-Integrity-Fixture und Browser-Gegenchecks sichtbare Shell-Reaktionen. Gemessene Zeiten gelten für die jeweilige Testumgebung, nicht als universelles Latenzversprechen.

Die erweiterten öffentlichen Verträge verwenden gemäß der Major-only-Schemaregel `xtend.maraca.plan-runtime.v3` und `xtend.rmt.presentation-effect-adapter.v2`. Bestehende Methoden behalten ihr Verhalten. Der zusätzliche Authoring-Vertrag liegt in `xtend-maraca/fastpass.schema.json`; das veröffentlichte RMT-v2-Dokumentschema bleibt unverändert.

## Weiterführend

- [Maraca-Orchestrierung](./xtend-maraca-orchestration.md)
- [Actions und Events](./rmt-reference-actions-events.md)
- [Hydration Policies](./hydration-policies.md)
- [XTend DEV API](./xtend-dev-api.md)
