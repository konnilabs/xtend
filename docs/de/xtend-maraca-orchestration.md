# XTend Maraca Orchestrierung

Dieser Deep-Dive beschreibt loaderlose Maraca App Bundles, die aus einer RMT Quelle nicht nur Komponenten auswählen, sondern eine lauffähige, kernel-orchestrierte Anwendung materialisieren. Die RMT Datei bleibt die Source of Truth für State, Actions, Events, Resources, Surfaces, Hydration, Validation, wiederverwendbare Animationen und Surface Transitions.

## Build-Modi

Maraca besitzt fünf unabhängige, aber aufeinander abgestimmte Orchestrierungs-Schalter. `auto` ist der kompatible Standard, `strict` ist der CI- und Produktionshärtungsmodus, `off` erhält den Legacy-Build ohne diese Schicht.

```bash
xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
xt rmt build app.rmt --bundle maraca --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
```

`orchestration` aktiviert das Artefakt `xtend.rmt.app-orchestration.v1`. `kernel` bündelt echte RMT Kernel- und Scheduler-Instanzen. `hydration` steuert runtime render, prerender/hydrate, lazy, visible, idle, manual, none und insulare Hydration über denselben Plan. `validation` konsumiert `xtend.rmt.form-validation.v1` und blockt Actions bei ungültigen Gruppen. `transitions` behält die kompatible View `xtend.rmt.surface-transitions.v1` und konsumiert zusätzlich `xtend.rmt.animation-engine.v1` für Presets, Timelines, Interrupt Policy, Reduced Motion und native-first-Ausführung.

[Hydration Policies](./hydration-policies.md) erklärt, welche dieser Werte Template-Ausführung, Fabric-Scheduling, Resumability oder Ownership steuern und wie sie im Build-Report geprüft werden.

## RMT Authoring

Validation und Transitions sind native RMT Primitives. Ein typischer Formularschritt deklariert Felder, Regeln, eine Ziel-Action und den Surface-Wechsel nach erfolgreicher Action.

```rmt
validation product.service.contact {
  mode blocking
  target action product.service.nextContact
  field product.service.name required message "Enter your full name."
  field product.service.email required email message "Enter a valid email address."
  field product.service.channel required message "Choose a support area."
}

animation product.service.stepMotion {
  effect pop
  durationMs 220
  easing "cubic-bezier(.2,.8,.2,1)"
  reducedMotion fade
}

transition product.service.contactToIssue {
  trigger action product.service.nextContact
  from surfaces [product.service.name product.service.email product.service.channel product.service.nextContact]
  to surfaces [product.service.subject product.service.priority product.service.details product.service.backContact product.service.nextIssue]
  use animation product.service.stepMotion
  effect crossfade
  durationMs 240
  easing "ease-out"
  interrupt replace
  reducedMotion fade
  lane transition
}
```

Der Compiler erzeugt daraus Action Gates, Scheduler-Ziele, Patch-Pläne und Source Maps. Strict Mode bricht ab, wenn Payload Contracts, Resource Ownership, Hydration Policy, Component Capabilities, Transition Targets oder Validation Messages fehlen.

## Runtime Graph

Der generierte Bootstrap ist nur Composition Root: Er friert Plan und Konfiguration ein, erzeugt genau eine Instanz von `createMaracaPlanRuntime()` und injiziert die typisierten Model-, View-, Event-, Surface-, Scheduler- und Host-Ports. `xtend-maraca/plan-runtime.mjs` ist der einzige Application Controller. RMT State ist die Model-Autorität; der Surface Controller ist die Lifecycle-Autorität. XState, DOM, Resource Graph und Browser-Globals sind ausschließlich Projektionen oder sichere Read Models.

Ein Command wird einmal ausgewertet, in genau einer Model-Transaktion angewandt und danach in genau einen Descriptor-/Struktur-Commit projiziert. Anschließend reconciliiert der Event Router die vom Renderer validierten Binding Records; Hydration und Post-Commit-Effects laufen jeweils einmal. State-Subscriber beobachten nur abgeschlossene Transaktionen und starten keine DOM-Arbeit.

Normale App-DOM-Schreibvorgänge laufen ausschließlich über `createRmtDomDescriptorRenderer().commit()`. Der Renderer installiert keine Application-Listener; nur der Event Router besitzt diese Listener. Es gibt keine normalen `innerHTML`-, `outerHTML`-, `insertAdjacentHTML`- oder `document.write`-Sinks und keinen Zugriff auf private ShadowRoot-Interna. Components werden nur über öffentliche Attribute, Properties, Events, Slots, CSS Parts und Design Tokens verbunden.

## Verantwortlichkeiten der Runtime-Schicht

Die Maraca Runtime ist die clientseitige Controller-Fassade der Architektur. Sie erhält nur Streams und Pläne, die bereits XScaler Preflight und, falls vorhanden, die XScaler-ATC-Übergabe passiert haben. Anwendungskommandos laufen über `dispatchCommand()`, Stream-Änderungen über `dispatchStreamPatch()`. Das unveränderliche Model ist über `runtime.model` lesbar; Renderer-, Validation-, Transition-, Event-, Surface- und Resource-Handles werden nicht veröffentlicht.

Maraca trifft nicht die statische Annahme-/Ablehnungsentscheidung, besitzt keine serverseitige Remote-Surface-Orchestrierung und stellt keine generischen Server-Endpunkte bereit. Wenn eine Remote Surface von einem XSurface Shard Server gestützt wird, konsumiert Maraca den übergebenen Client-Stream und Lifecycle-Signale. Wenn der Server nur generische Endpunkte anbietet, behandelt Maraca sie als Fallback-Daten-/Action-Endpunkte ohne Remote-Surface-Orchestrierungssemantik. Scheduling, Lanes, Diagnostics und Policy-Auswertung werden an RMT-Kernel-/Fabric-Signale delegiert; private Remote-Ausführung bleibt außerhalb des Kernels.

## Reports und Bridges

`xtend.maraca.report.json` enthält Abschnitte für `orchestration`, `kernel`, `hydration`, `validation` und `transitions`. Wichtige Felder sind `planStatus`, `runtimeExpectedStatus`, `fallbackCount`, `scheduledEndpointCount`, `strictViolations`, `hydrationPolicyCount`, `insularIslandCount`, `effectCounts`, `durationRange`, `animationEngineSchema`, `animationCount`, `timelineCount`, `runtimeModules` und redigierte `diagnostics`.

Im Browser steht dieselbe sichere Runtime-Fassade bereit, die der Bootstrap intern verwendet:

```js
const runtime = window.XTendMaraca.orchestration;
runtime.snapshot();
runtime.model.getState("product.service.form");
runtime.subscribe((snapshot) => console.debug(snapshot));
await runtime.dispatchCommand({ command: "product.service.nextContact", payload: {} });

window.XTendMaraca.kernel.snapshot();
window.XTendMaraca.hydration.snapshot();
```

`stateRuntime` und `actionRuntime` bleiben in 0.6 diagnostizierte Kompatibilitätsaliase; mutable Raw-Adapter sind nicht Teil der Fassade. Die wichtigsten Custom Events sind `xtend-maraca:orchestration-boot`, `xtend-maraca:kernel-boot`, `xtend-maraca:kernel-schedule`, `xtend-maraca:state-change`, `xtend-maraca:dom-commit`, `xtend-maraca:validation-boot`, `xtend-maraca:validation-change`, `xtend-maraca:validation-blocked`, `xtend-rmt:animation-start`, `xtend-rmt:animation-phase`, `xtend-rmt:animation-interrupt`, `xtend-rmt:animation-complete`, `xtend-maraca:surface-transition-start`, `xtend-maraca:surface-transition-complete`, `xtend-maraca:surface-transition-cancel` und `xtend-maraca:surface-transition-error`.

## Effects und Motion Policy

Surface Transitions unterstützen `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale`, `pop`, `zoom`, `flip`, `rotate`, `expand`, `collapse`, `fade-blur`, `shared-element`, `layout-flip` und `none`. Die Dauer kommt aus `durationMs`, kann aber durch Host-Policy begrenzt werden. `xt-ui-effects="none"` auf `body` und `prefers-reduced-motion` gewinnen vor der RMT Dauer und nutzen die deklarierte `reducedMotion` Policy.

Die AnimationEngine nutzt zuerst WAAPI und danach CSS-/Instant-Fallback. `crossfade` überlappt Exit- und Enter-Phase; serielle Transitions warten weiter auf den Exit-Abschluss, bevor die eingehende Surface materialisiert wird. Custom Keyframes sind auf `opacity` und `transform` begrenzt; `filter` ist nur per explizitem Opt-in zulässig.

## Demo und lokale Prüfung

Die Realsystem-Demo liegt unter `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`. Sie modelliert ein mehrstufiges Kundenservice-Formular mit `x-input`, `x-select`, `x-textarea`, `x-button`, Validation Gates, Kernel Scheduling und Surface Transitions.

```bash
xt maraca build products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt --out products/rmt-maraca-kernel-orchestration/dist --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
node scripts/run_xtend_tests.js maraca-orchestration maraca-kernel-orchestration maraca-validation maraca-transitions --json
```

Nutze diese Seite zusammen mit [XTend Maraca](./xtend-maraca.md), [RMT Authoring Guide](./rmt-vnext-authoring.md) und [RMT Language Server](./rmt-language-server.md).
