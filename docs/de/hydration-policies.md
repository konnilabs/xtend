# Hydration Policies

Hydration verbindet bereits vorhandenes Markup mit State, Events und Lifecycle der XTend Runtime. Sie ist weder ein Synonym für Rendering noch für Resumability: Rendering erzeugt DOM, Hydration übernimmt vorhandenen DOM, und Resume stellt zusätzlich einen zuvor serialisierten Ausführungszustand wieder her.

In XTend triffst du deshalb drei getrennte Entscheidungen. Der **Execution Mode** bestimmt, woher das Markup kommt. Die **Fabric Policy** bestimmt, wann und auf welcher Lane die Arbeit läuft. Der **Ownership Mode** legt fest, wie weit die Runtime den vorhandenen DOM besitzen darf. Eine gute Konfiguration benennt alle drei Achsen, statt Begriffe wie `lazy` oder `server_prerender_hydrate` austauschbar zu verwenden.

## Schnellentscheidung

| Situation | Execution Mode | Fabric Policy | Warum |
| --- | --- | --- | --- |
| Rein clientseitige Surface ohne vorhandenes Markup | `runtime_render` | `visible` oder `idle` | Die Runtime muss DOM zuerst erzeugen. |
| Serverseitig oder statisch vorgerenderte, sofort sichtbare Surface | `hydrate_prerendered` oder `server_prerender_hydrate` | `visible` | Vorhandenes Markup wird zeitnah interaktiv. |
| Vorgerenderter Inhalt unterhalb des Viewports | `server_prerender_hydrate` | `lazy` | FCP bleibt unabhängig von nicht sichtbarer Interaktivität. |
| Wiederkehrende Surface mit wiederverwendbarem Zustand | passender Render-/Hydrate-Modus | `warm` | Vorbereitung erfolgt opportunistisch nach sichtbarer Arbeit. |
| Spekulative Vorbereitung für eine mögliche nächste Route | passender Render-/Hydrate-Modus | `prewarm` | Arbeit darf unter Druck reduziert oder pausiert werden. |
| Serialisierbare Vorarbeit im Worker | `worker_prerender_hydrate` | `worker_prerender_hydrate` | Worker berechnet einen Chunk; der Main Thread validiert und committed. |
| Vollständige SSR-State-Übergabe mit Event Replay | `server_prerender_resume` plus Resumability-Policy | meist `visible` | Der Client übernimmt Snapshot und Absichten statt nur Markup zu binden. |
| Statische Ausgabe ohne geplante Interaktivität | `prerender_only` | keine automatische Hydration | Der Browser erhält Markup, startet aber keine Binding Session. |

Wenn du nicht sicher bist, beginne bei sichtbarem SSR-Inhalt mit `server_prerender_hydrate` plus `visible`. Nutze Resume erst, wenn Server, Integritätsprüfung und Event-Replay-Contract gemeinsam vorhanden sind.

## Execution Modes

Der Template-Execution-Pfad und `RmtTemplateExecutionMode` definieren fünf Basismodi:

| Modus | Phasen | Standard-Ownership | Geeignet für |
| --- | --- | --- | --- |
| `runtime_render` | `main_render` | `replace_children` | Client-only UI oder fehlendes Prerender-Markup |
| `hydrate_prerendered` | `client_hydrate` | `hydrate_existing` | Bereits lokal vorhandenes, strukturell passendes Markup |
| `worker_prerender_hydrate` | Worker-Prerender, Transfer, Main-Thread-Hydration | `hydrate_existing` | Aufwendige, serialisierbare Vorbereitung ohne Worker-DOM-Ownership |
| `server_prerender_hydrate` | Server-Prerender, HTML-Übertragung, Client-Hydration | `hydrate_existing` | Klassisches SSR mit anschließender Interaktivität |
| `prerender_only` | Prerender auf dem gewählten Transport | `hydrate_existing` | Statische oder bewusst nicht interaktive Ausgabe |

`client_hydrate` ist der Name einer Runtime-Phase und kein Wert für `hydration mode`. Ein unbekannter Template-Modus fällt im Execution Path auf `runtime_render` zurück; verlasse dich deshalb nicht auf freie Bezeichner, auch wenn der übergeordnete Orchestrierungsplan zusätzliche Signale kennt.

Der App-Orchestrierungscompiler akzeptiert außerdem `server_prerender_resume`, `worker_prerender_resume`, `warm`, `prewarm`, `visible`, `idle`, `lazy`, `eager`, `open`, `route`, `manual`, `none` und `insular`. Diese Werte gehören nicht alle zur gleichen Runtime-Ebene. `visible` bis `prewarm` sind Scheduling-Signale, `manual`, `open` und `route` beschreiben Host-Trigger, und `insular` ist eine Lifecycle-Grenze. `worker_prerender_resume` ist derzeit im Compiler- und Tooling-Katalog vorhanden, besitzt aber keinen gleichwertig belegten Produktpfad wie `server_prerender_resume`; verwende ihn nicht als Produktionsstandard ohne eigenen Runtime-Smoke.

## Policy und Mode gemeinsam deklarieren

Das folgende Dokument zeigt zwei unabhängige Kombinationen. Die Summary übernimmt bereits vorhandenes Markup sofort. Die Insights-Surface kommt aus dem Serverpfad, bleibt aber bis Sichtbarkeit oder Idle zurückgestellt.

```rmt
template docs.hydrationDashboard {
  state docs.hydrationSummary type object preserve {
    initial {
      id "summary"
      text "Ready"
    }
  }

  selector docs.hydrationSummary from state docs.hydrationSummary {
    output HydrationSummary
  }

  selector docs.hydrationInsights from state docs.hydrationSummary {
    output HydrationInsights
  }

  surface docs.hydrationSummary kind card component x-section {
    source selector docs.hydrationSummary
    lane visible weight 80 {
      hydrate dashboard-summary from selector docs.hydrationSummary {
        hydration policy visible
        hydration mode hydrate_prerendered
        hydration insular true
      }
    }
  }

  surface docs.hydrationInsights kind panel component x-section {
    source selector docs.hydrationInsights
    lane idle weight 30 {
      hydrate dashboard-insights from selector docs.hydrationInsights {
        hydration policy lazy
        hydration mode server_prerender_hydrate
        hydration insular true
      }
    }
  }
}
```

`hydration insular true` gibt jeder Surface einen eigenen Hydration-Lifecycle. Es erzeugt keine Sicherheits-Sandbox und überträgt kein Canonical-State-Ownership an die Insel. Öffentliche Component-Verträge, Trusted-DOM-Regeln und der Host bleiben maßgeblich.

## Fabric Policies im Detail

`fabric/hydration-policy.js` stellt sechs kanonische Policies bereit. Deadlines sind Framework-Defaults und können durch eine explizite Host-Policy überschrieben werden.

| Policy | Trigger | Lane | Deadline | Budgetklasse | Verhalten |
| --- | --- | --- | ---: | --- | --- |
| `visible` | `immediate-visible` | `visible` | 160 ms | `interactive` | Für sichtbare, fokusrelevante oder A11y-kritische Arbeit; bevorzugt kein Idle. |
| `idle` | `idle-callback` | `idle` | 500 ms | `background` | Standard für nicht kritische Hydration ohne anderes Signal. |
| `lazy` | `visible-or-idle` | `idle` | 750 ms | `background` | Wartet auf Sichtbarkeit oder einen Idle-Slot und blockiert keine Eingabe. |
| `warm` | `warm-reentry` | `idle` | 900 ms | `opportunistic` | Bereitet wiederverwendbaren Zustand für eine Rückkehr vor. |
| `prewarm` | `prewarm-opportunity` | `background` | 1200 ms | `best_effort` | Spekulative Vorbereitung, die unter Last entfallen darf. |
| `worker_prerender_hydrate` | `worker-prerender-response` | `background` | 1200 ms | `best_effort` | Verarbeitet validierte Worker-Ausgabe und committed nur auf dem Main Thread. |

Ohne explizite Policy wählt der Resolver `visible` für sichtbare, fokuspflichtige, kritische oder A11y-reparierende Arbeit. `loading: "lazy"`, eine nicht sichtbare Surface oder `deferUntilVisible` wählen `lazy`; andernfalls gilt `idle`. Eine explizite gültige Policy gewinnt vor dieser Ableitung.

`warm` und `prewarm` sind keine alternativen DOM-Renderer. Sie bereiten Ressourcen, Templates oder serialisierbare Daten vor. Die spätere sichtbare Hydration bleibt ein eigener, kontrollierter Schritt.

## SSR Hydration und Resume

`server_prerender_hydrate` liefert Markup und ein Hydration Envelope. Der Client führt anschließend eine normale Binding Session aus. `server_prerender_resume` geht weiter: Snapshot, Event-Replay-Strategie und Integritätsnachweis werden als eigener Resumability-Contract kompiliert.

```rmt
template docs.hydrationResume {
  state docs.hydrationStatus type object preserve {
    initial {
      text "Ready"
    }
  }

  selector docs.hydrationStatus from state docs.hydrationStatus {
    output HydrationStatus
  }

  surface docs.hydrationShell kind page component x-section {
    source selector docs.hydrationStatus
    lane visible weight 80 {
      hydrate hydration-shell from selector docs.hydrationStatus {
        hydration mode server_prerender_resume
        resumability mode server_prerender_resume
        resumability snapshot surface_state
        resumability event replay intent_queue
        resumability integrity signed_manifest
      }
      resume hydration-shell {
        resumability mode server_prerender_resume
      }
    }
  }
}
```

Wähle diesen Pfad nur, wenn der Server den Snapshot erzeugt, der Client dessen Schema versteht und die Integritätsprüfung vor dem Resume erfolgreich ist. Resume Tokens gehören redigiert in Telemetrie; rohe Tokens, Nutzdaten oder Credentials dürfen nicht im DEV-API-Snapshot landen.

## Worker-Prerender und Prewarm

Ein Worker darf serialisierbare Chunks vorbereiten, aber weder DOM noch Host Services oder Canonical State besitzen. Generationen schützen vor veralteten Antworten; der Trusted-DOM-Commit findet auf dem Main Thread statt.

```rmt
template docs.hydrationWorker {
  state docs.hydrationPreview type object preserve {
    initial {
      id "preview"
      text "Prepared"
    }
  }

  selector docs.hydrationPreview from state docs.hydrationPreview {
    output HydrationPreview
  }

  surface docs.hydrationPreview kind panel component x-section {
    source selector docs.hydrationPreview
    lane idle weight 30 {
      hydrate hydration-preview from selector docs.hydrationPreview {
        hydration policy worker_prerender_hydrate
        hydration mode worker_prerender_hydrate
        hydration insular true
      }
      prewarm hydration-preview from worker docs.prepareHydration
    }
  }
}
```

Der Compiler erzeugt dafür die Fabric-Lane `background`, den Fiber-Kind `component.worker_prerender_hydrate` und den Schedule `component.worker_prerender_hydrate`. Fehlt die Worker-Fähigkeit im Host, muss der Build oder Runtime-Report sichtbar degradieren; ein stiller Remote-Code-Fallback ist nicht zulässig.

## Policies direkt aus JavaScript nutzen

Host-Adapter können dieselben Entscheidungen ohne parallele Scheduling-Logik verwenden:

```js
const {
  createHydrationPolicyController,
  resolveHydrationPolicy
} = require('@ccslabs/xtend/fabric/hydration-policy');

const visible = resolveHydrationPolicy({
  componentRef: 'x-order-summary',
  isVisible: true
});

const deferred = resolveHydrationPolicy({
  componentRef: 'x-recommendations',
  loading: 'lazy',
  streamPressureLevel: 'high'
});

console.log(visible.policy, visible.lane, visible.scheduleRef);
// visible visible component.visible.hydrate

console.log(deferred.policy, deferred.status, deferred.scheduleRef);
// lazy throttled component.lazy.hydrate

const controller = createHydrationPolicyController('x-recommendations', {
  loading: 'lazy'
});
```

`controller.hydrate()` erwartet die Component-Fiber-Instrumentierung. Dadurch erscheinen Lane, Schedule, Deadline und Diagnostics in derselben Fabric-Telemetrie wie andere RMT-Arbeit.

## Backpressure und Priorität

Hohe allgemeine oder Stream-Backpressure verschiebt eine neutrale Entscheidung zu `lazy`. Lazy-Arbeit erhält dann den Status `throttled` und bleibt hinter sichtbarer Arbeit. `warm`, `prewarm` und Worker-Prerender werden bei hohem Druck `reduced`; kritischer Druck pausiert `prewarm` und Worker-Prerender vollständig und lenkt den Schedule auf `diagnostics.snapshot`.

Eine unsichtbare oder nicht sichtbarkeitskritische Surface darf keine `user-blocking` Lane erzwingen. Der Resolver fällt auf die Policy-Lane zurück und meldet `xtend.fabric.hydration_policy.user_blocking_refused`. Sichtbare Hydration bleibt auf der `visible` Lane, darf aber ebenfalls keine private Kernel-Priorität umgehen.

## Build und Report prüfen

Kompiliere die RMT-Quelle zuerst ohne Ausgabe und baue anschließend mit strikter Hydration:

```bash
xt rmt lint app.rmt --json
xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --json
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --out dist --json
node scripts/run_xtend_tests.js hydration-policy --json
```

Der Plan muss `xtend.rmt.app-hydration-plan.v1` enthalten. Prüfe pro Record `policy`, `mode`, `lane`, `fabricSchedule`, `insularHydration` und `workerPrerender`. Im Maraca-Report sind außerdem `hydrationPolicyCount`, `insularIslandCount`, `strictViolations` und redigierte Diagnostics relevant.

Zur Laufzeit liefern Maraca und die optionale XTend DEV API zwei unterschiedliche Sichten:

```js
const runtime = window.XTendMaraca?.hydration?.snapshot();
const devtools = window.__XTEND_DEV_API__?.getHydrationSnapshot?.();

console.table(runtime?.records || []);
console.table(devtools?.surfaces || []);
console.log(devtools?.strategy, devtools?.timing, devtools?.xscaler);
```

Der Maraca-Snapshot zeigt Plan-Records und Hydration-History. Der DEV-API-Snapshot ergänzt Strategie, Resume-Timing, XScaler und Surface-Status für die XTend Dev Surface. Zeitfelder müssen verstrichene Dauern enthalten, keine absoluten `performance.now()`-Zeitpunkte.

## Fehlerbehebung

| Diagnostic oder Signal | Ursache | Behebung |
| --- | --- | --- |
| `rmt.app_orchestration.hydration_policy_missing` | Eine Surface besitzt keinen Lifecycle-Hydration-Record. | Deklariere `hydrate`, `mount` oder `prewarm` mit passender Policy und prüfe den Plan erneut. |
| `xtend.fabric.hydration_policy.user_blocking_refused` | Nicht sichtbare Hydration fordert `user-blocking` an. | Nutze `visible` nur für tatsächlich sichtbare Arbeit, sonst `idle` oder `lazy`. |
| `xtend.fabric.hydration_policy.backpressure_deferred` | Hoher Druck verschiebt neutrale Hydration. | Behandle `lazy` als erwartete Degradation und entferne keine sichtbaren Prioritäten. |
| `xtend.fabric.hydration_policy.stream_pressure_deferred` | Ein Stream steht unter hohem Druck. | Reduziere Stream-Produktion oder lasse die Surface bis Sichtbarkeit warten. |
| `xtend.fabric.hydration_policy.lazy_stream_pressure_throttled` | Lazy-Arbeit wartet hinter sichtbarer Arbeit. | Nicht aggressiv neu planen; Status und Lane in Fabric beobachten. |
| `xtend.fabric.hydration_policy.prewarm_paused` | Kritische Backpressure pausiert Best-Effort-Arbeit. | Prewarm auslassen und nach Entlastung neu bewerten. |
| `xtend.fabric.hydration_policy.worker_prerender_paused` | Worker-Prerender ist unter kritischem Druck pausiert. | Main-Thread-Hydration nicht durch einen unvalidierten Worker-Fallback ersetzen. |
| `xtend.maraca.hydration_error` | Component-Laden oder Hydration ist zur Laufzeit fehlgeschlagen. | Maraca-Diagnostics, Component-Export und den betroffenen Hydration-Record prüfen. |

## Weiterführend

- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [XTend Maraca Orchestrierung](./xtend-maraca-orchestration.md)
- [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md)
- [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md)
- [XScaler-Protokoll](./xscaler-protocol.md)
- [XTend DEV API](./xtend-dev-api.md)
- [XTend Dev Surface](./xtend-dev-surface.md)
