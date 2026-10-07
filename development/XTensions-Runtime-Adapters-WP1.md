# XTensions runtime adapters — WP1 / Laufzeitadapter — WP1

## Deutsch

Dieser lokale Abschnitt extrahiert wiederverwendbare React-/Vue-Lifecycle-Bausteine aus dem privaten App-Switcher. Er enthält keine Veröffentlichung, neue RMT-Syntax oder neue Trust-Authority. Die bestehenden `createReactHostAdapter` / `createVueHostAdapter` behalten ihre synchronen Contracts, Defaults, Snapshots und Zusatzmethoden. Auch `createFrameworklessReactHostControllerPoc` / `createFrameworklessVueHostControllerPoc` und die ursprünglichen Contracttests bleiben erhalten.

Echte Frameworks werden ausschließlich über die additiven `createReactRuntimeAdapter` / `createVueRuntimeAdapter` aus `@ccslabs/xtend/xtensions/react-runtime-adapter` bzw. `.../vue-runtime-adapter` verwendet. Dieselben Subpaths sind in `@ccslabs/xtend-compiler` verfügbar. Ihre Lifecycle-Methoden `mount`, `update`, `suspend`, `resume`, `unmount` liefern Promises; `reportError`, `emit` und Abfragen bleiben synchron. Bestehende Hostadapter-Aufrufer müssen nicht migrieren. Ein bewusster Wechsel zur Runtime-API benötigt injizierte Peers, Komponente, Host-Container und `await`. Fehlende Peers wählen niemals automatisch einen Stub.

Die neuen Runtime-Subpaths exportieren in Node und Browser dieselben beiden Funktionen je Framework: Runtime-Factory und Peer-Normalisierung. Deklarationen passen zu diesen Exports. Die bestehenden Hostadapter-Subpaths behalten ihre vollständige API ohne Browser-Umleitung. Sie werden nicht nachträglich als schlanke Browser-Runtime ausgegeben. Frameworks werden weder importiert, nachgeladen noch im XTend-Core gebündelt. Report-Factories prüfen weiterhin deklarative Contracts; `runtimeExecutionRequired: false` bestätigt keinen ausgeführten Framework-Test.

### Host-Konfiguration und Props

```js
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { version as reactDOMVersion } from 'react-dom';
import { createReactRuntimeAdapter } from '@ccslabs/xtend/xtensions/react-runtime-adapter';

const adapter = createReactRuntimeAdapter({
  hostId: 'workspace', surfaceId: 'ledger', xtensionId: 'ledger-panel',
  container: hostAllocatedEmptyElement,
  component: LedgerPanel,
  peers: { React, ReactDOM: { ...ReactDOMClient, version: reactDOMVersion } },
  expectedVersions: { react: React.version },
  policy: {
    allowedResources: ['refresh'],
    events: { selected: 'xtend.schemas.xtension.intent.v1' },
    validateProps: props => typeof props.company === 'string',
    authorize: ({ operation }) => hostAllows(operation)
  },
  onEvent: event => hostSignalBridge(event),
  fabric: hostFabric
});
await adapter.mount(hostAllocatedEmptyElement, { company: 'ACME' });
await adapter.update({ props: { company: 'Next' } });
await adapter.suspend();
await adapter.resume();
await adapter.unmount();
```

Komponenten erhalten direkte Daten-Props plus die reservierte Capability `xtension`. Vue-Komponenten deklarieren ihre Daten-Props und `xtension` ausdrücklich als Props. Vorhandene Komponenten mit anderer Props-/Callback-Signatur werden durch einen vertrauenswürdigen Host-Wrapper angebunden; Callbacks reisen nicht als RMT-Payload. Ein Update **ersetzt** den vollständigen Props-Satz, analog zur ERP-Implementierung; fehlende Props werden entfernt. Interner Komponentenstatus und DOM bleiben bei erfolgreichen Updates/Suspend/Resume erhalten. Vue verlangt `update({ updateAdapter: 'applyPropsUpdate', props })` oder `update({ type: 'props.update', payload })`. Beliebige State-Patches und Commands aus den alten PoCs sind keine Runtime-Funktionen dieses Abschnitts.

Optionales Fabric wird über die bestehende Factory injiziert. Deren breiter Rückgabetyp wird akzeptiert; die erzeugte Boundary muss zur Laufzeit `run` anbieten. Eine ungültige Boundary wird bei der Konstruktion abgelehnt. Echte Fabric-Promises und Ablehnungen werden weitergereicht, nicht durch synchrone Spies ersetzt.

Peers dürfen direkt oder über die vom Host bereitgestellte Funktion `loadRuntime({ signal })` injiziert werden. Diese Funktion wählt und verifiziert ihre Artefakte außerhalb des Adapters. Es gibt keine URL-Imports im Adapter. Die bestehenden Provider-Regeln (lokal, host-provided/external-peer, nicht gebündelt, keine Remote-Freigabe) werden wiederverwendet; Lifecycle-Payloads können sie nicht überschreiben.

- React: Namespace `{ React, ReactDOM }` oder ERP-Form `{ default: React, createRoot, reactDOMVersion }`. `React.version` und tatsächliche ReactDOM-Version sind Pflicht, ebenso `createElement`, `Component`, `useLayoutEffect`, `Suspense`, `createRoot`. Stabile Hauptversionen 18/19 müssen übereinstimmen. `flushSync` ist optional und wird für den Commit-Nachweis nicht benötigt. `react-dom@18.3.1` enthält im offiziellen Produktionsartefakt die genaue Exportkennung `18.3.1-next-f1338f8080-20240426`; ausschließlich diese bekannte Kennung wird auf 18.3.1 abgebildet. Der Snapshot bewahrt auch die rohe Exportkennung.
- Vue: Namespace `{ Vue }` oder flache Exports. Pflicht: tatsächliche stabile 3.x-Version, `createApp`, `h`, `reactive`, `nextTick`. Ein Provider, der nur die bisherigen ERP-Exports liefert, muss `version` und `nextTick` ergänzen. `Router` ist keine Voraussetzung.
- Auch `runtimeBoundary.dependencies` wird gegen die tatsächlichen Peer-Versionen geprüft. Unterstützt sind exakte Versionen, `M.x`, `M.m.x`, vollständige `^M.m.p`/`~M.m.p`, `*` und `||`; unbekannte Syntax oder nicht nachweisbare Zusatz-Peers werden gesperrt.
- `expectedVersions` ermöglicht zusätzliche exakte Host-Prüfungen gegen das zuvor verifizierte Manifest, etwa `{ vue: '3.5.22' }`. Ein Manifestwert 3.5.0 wird nicht zu einem tatsächlich geladenen 3.5.22 passend erklärt. Versionsstrings ersetzen keine Prüfung der Herkunft/Integrität vertrauenswürdiger Host-Peers.

### Kooperative Ressourcen und Grenzen

```js
// Innerhalb eines React-Effects bzw. Vue-Lifecycle-Hooks:
const unregister = xtension.resources.register('refresh', ({ signal, guard }) => {
  const refresh = guard(() => refreshLocalView());
  const timer = setInterval(refresh, 1000);
  fetch(hostApprovedURL, { signal }).then(guard(consumeResponse)).catch(guard(reportFailure));
  return () => clearInterval(timer);
});
// Effect-/Unmount-Cleanup: unregister();
xtension.emit({ type: 'selected', payload: { id: 'invoice-1' } });
```

Ressourcen-Factories und ihre Cleanup-Funktionen sind synchron; die eigentliche Arbeit darf asynchron sein und muss Signal/Generation Guard beachten. Suspension invalidiert Guards, bricht Signale ab und führt alle registrierten Cleanups in umgekehrter Reihenfolge aus. Resume startet neue Generationen derselben Registrierungen. Ohne Host-Freigabe sind Ressourcen und Events gesperrt. Eine Cleanup-Ausnahme verhindert weitere Cleanups oder Framework-Unmount nicht; sie wird diagnostiziert und niemals fälschlich als erfolgreicher Release protokolliert. Nach fehlgeschlagenem Ressourcen-Cleanup ist Resume gesperrt; nicht erfolgreich gestoppte Arbeit kann nur der verantwortliche Host aufräumen.

**Kooperative Suspension ist keine Sandbox.** Gewöhnliche React-Effekte, Vue-Watcher und beliebige direkte Timer/Requests laufen weiter, sofern sie nicht im Scope registriert sind. Komponenten dürfen ihre eigene Arbeit nur über bereitgestellte Capabilities koordinieren; vertrauenswürdiger Same-Realm-Code besitzt technisch weiterhin Browserzugriff. Dieser Adapter kann bösartige JavaScript-Komponenten, Portals/Teleport oder direktes `document`-Schreiben nicht sicher isolieren. Solcher Code benötigt weiterhin die vorhandenen isolierten Host-/Sandbox-Pfade. Der Adapter hebt DOMTrustBoundary, Payloadguards, Provider- oder Integritätsregeln nicht auf und führt keine privilegierten RMT-DOM-Commits aus.

Erlaubte Aufrufe benötigen den exakt bei der Konstruktion zugeordneten, zunächst leeren DOM-Container. Zwei Controller können ihn nicht gleichzeitig reservieren. Fremde Container, `body`, belegter SSR-DOM, DOM-/Framework-Objekte, Funktionen, Accessors, Zyklen, Proxy/Ref-Marker und reservierte DOM-Props werden gesperrt. Komponenten erhalten weder Container noch Policy-/Lifecycle-Steuerung als Capability. Es gibt keine Abschaltoption für diese festen Grenzen. Host-Callbacks dürfen zusätzlich einschränken; Eventnamen, Payload-Schemareferenzen und Ressourcennamen stammen aus kopierter Host-Konfiguration. Payload-Schemareferenzen werden normalisiert; fachliche Schema-/Delivery-/Rate-Prüfung bleibt Aufgabe des Host-Signalbridges.

`mount/mount` teilt einen In-flight-Vorgang; erster Container/Props-Satz gewinnt. Bei Suspension liefern Updates `skipped` ohne Pufferung. React-Mount bestätigt den Root-Commit einschließlich möglichem Suspense-Fallback, nicht aufgelöste Suspense-Daten oder bereits gelaufene passive Effects. Vue-Updates warten auf `nextTick`.

`unmount` ist terminal und idempotent. Es setzt sofort `disposed=true`, Phase `destroying`, invalidiert Guards und bricht Loader-/Render-Wartevorgänge ab. Framework-Teardown wartet nicht hinter der Lifecycle-Queue auf ein Update. Bereits laufende Updates werden bei Host-Dispose mit `skipped` abgeschlossen; später eintreffende Updates mit `failed`. Nach dem Teardown gilt `phase=destroyed`, `mounted=false`, `resources.disposed=true`. Fehlgeschlagener Mount und Runtimefehler benötigen eine neue Adapterinstanz. Bei werfendem Root-Cleanup bleibt die Containerreservierung vorsichtshalber bestehen.

Alle vom React-Renderer gemeldeten Fehler (ErrorBoundary, `onUncaughtError`, auch `onRecoverableError`) und alle von Vue `app.config.errorHandler` gemeldeten Fehler sind in WP1 fatal. Das schließt interne Vue-Render-, Watcher- und Eventhandlerfehler ein. `reportError` liefert synchron einen kanonischen `failed`-Record und startet automatisch den terminalen Shutdown; `unmount()` liefert dessen awaitbaren Abschluss. Ein laufender Mount/Update mit Frameworkfehler liefert `failed`, der terminale Unmount wegen des Fehlers `degraded`. Reacts gelatchte ErrorBoundary wird nicht wiederverwendet; ihre offenen Render-Promises werden verworfen oder beim Dispose abgebrochen. React-Eventhandlerfehler und beliebige asynchrone Arbeit außerhalb der Framework-Fehlerhooks sind damit nicht global abgefangen: Der Host muss solche Fehler selbst behandeln oder über `reportError` melden.

Shutdown erfolgt in zwei Phasen: Der Scope stoppt aktive Ressourcen und sperrt neue Aktivierung (`closing=true`). Beim anschließenden Framework-Unmount dürfen noch ausstehende passive Effects erlaubte Ressourcen inert registrieren und wieder abmelden; diese Factories starten nicht. Im `finally` wird der Scope endgültig geschlossen, auch bei Cleanup-Ausnahmen. Eine Registrierung nach endgültigem Dispose bleibt ein Fehler. Selbst-Unregister während einer synchronen Ressourcen-Factory invalidiert deren Aktivierung sofort; das erst danach zurückgegebene Cleanup wird genau einmal ausgeführt. Ein Release wird erst nach tatsächlichem Cleanup gemeldet, eine noch nicht bereinigte Aktivierung bleibt im Snapshot sichtbar.

Mount und Resume prüfen unmittelbar nach Ressourcenaktivierung erneut fatalen Fehler, Dispose, Controller-Generation und neu entstandene Cleanup-Fehler. Reentrantes `reportError` oder werfendes Cleanup führt zu `failed` mit abgeschlossenem terminalem Teardown; reentrantes `unmount` führt zu `skipped`. Kein solcher Pfad darf anschließend `ready`/`active` oder `ok` protokollieren. Erfolgreiches Selbst-Unregister bleibt zulässig und beendet die Komponente nicht.

Lifecycle-Ergebnisse verwenden die bestehenden HostController-Schemas; Ereignisse durchlaufen `createSurfaceEvent` mit Host-identischem Owner/Source und `same-origin-adapter`. Cleanup-Records verwenden das bestehende spezialisierte HostResource-Schema einschließlich `xtensionId`. `normalizeHostResourceCleanupRecord(input, { xtensionId })` akzeptiert auch den generischen Record aus dem Testprodukt, verlangt eine vertrauenswürdige fehlende Identität und akzeptiert ausschließlich erfolgreiche Releases.

SSR/Hydration/Adoption, Router, globales Switching, LRU, Demo-UI und feste Metriken bleiben außerhalb WP1. Die ERP-Adapter mit ihren bestehenden Adoption-Pfaden werden nicht ersetzt. Die historischen 38/38 Testprodukt-Szenarien sind kein neu ausgeführter Beleg dieses Patches; die neue Acceptance-Suite prüft die extrahierten Adapter gesondert.

## English

WP1 extracts retained framework instances, Fabric-observed lifecycles, reverse cleanup, abort signals and generation guards. Existing `createReactHostAdapter` / `createVueHostAdapter` keep their synchronous contracts, defaults, snapshots and extra methods. Their original contract tests and explicit frameworkless controller factories remain available. No migration is required for existing callers.

Use the additive `createReactRuntimeAdapter` / `createVueRuntimeAdapter` factories from `@ccslabs/xtend/xtensions/react-runtime-adapter` / `vue-runtime-adapter` (also exported by `@ccslabs/xtend-compiler`). Their five lifecycle methods return promises. A deliberate migration supplies a trusted component, injected peers and a container, and awaits lifecycle results. Missing peers never select a stub. Node/browser runtime value exports and declarations match. Existing host-adapter subpaths retain their complete API without a browser redirect. Framework packages are not core dependencies. Shared guards and scheduler lane definitions avoid compiler/Node-crypto imports in runtime browser code without weakening their rules.

The host supplies a trusted component, an exact empty container, peers or `loadRuntime({ signal })`, optional `expectedVersions`, optional Fabric, and policy. React accepts `{ React, ReactDOM }` or `{ default: React, createRoot, reactDOMVersion }`; stable React/ReactDOM 18 or 19 versions must match. The exact official ReactDOM 18.3.1 production build identifier is normalized, with its raw value retained in snapshots. Vue accepts `{ Vue }` or flat `createApp`, `h`, `reactive`, `nextTick`, `version` exports from stable Vue 3. Routers and `flushSync` are not required. Declared dependency ranges also check actual peers (exact, major/minor wildcard, full caret/tilde, `*`, `||`; unknown syntax or unverifiable extra peers fail closed). Expected versions are exact host assertions; a 3.5.0 manifest does not validate a 3.5.22 runtime. Peer identity and integrity remain host responsibilities.

The existing Fabric factory type is accepted without changing its declarations. Its returned boundary must expose `run`; invalid boundaries fail at construction. Tests cover the real asynchronous Fabric implementation and its public TypeScript API.

Components receive ordinary JSON props plus the reserved `xtension` capability shown above. Vue components declare those data props and `xtension`; trusted host wrappers adapt existing component/callback signatures without passing functions through RMT payloads. Updates replace the complete props object and retain component state. Vue requires `applyPropsUpdate` or `props.update`. Scope factories and cleanup functions are synchronous; asynchronous work must use the supplied AbortSignal and guarded callbacks. Suspend stops only registered cooperative work; resume creates fresh generations. Throwing cleanup is recorded, other cleanup continues, and a failed release is never labelled `released`. Resume is denied after a scope cleanup failure.

**Cooperative suspension is not a sandbox.** Ordinary React effects, Vue watchers, direct timers and network work can continue. Trusted same-realm components can still access global DOM or use portals/Teleport; untrusted code requires existing isolated hosts. DOMTrustBoundary remains intact. No component or RMT payload can grant itself runtime, policy, resource or event authority. Resources and events default to denied. Host policy can restrict behavior further; fixed container, JSON, framework-payload and local-provider checks cannot be disabled. Event schema references are normalized; the host bridge still owns domain schema validation, delivery and rate controls.

Mount is single-flight. Suspended updates return `skipped` without buffering. React readiness confirms a root commit, including a possible Suspense fallback, but does not promise passive effects have run or Suspense data has resolved. Vue waits for `nextTick`.

Disposal immediately marks the controller disposed/`destroying`, aborts pending loads/renders and bypasses blocked lifecycle work. In-flight updates interrupted by host disposal return `skipped`; later updates fail. Completed teardown leaves `destroyed`, `mounted=false` and a disposed scope. Failed mounts and runtime errors require a fresh adapter. A failed root cleanup retains the container reservation.

All React renderer callbacks handled by this adapter (including recoverable errors) and Vue `app.config.errorHandler` failures are fatal. Vue render, watcher and event-handler failures follow the same tested terminal path. `reportError` synchronously returns a canonical failed result and starts shutdown; `unmount()` awaits it. A failing mount/update returns `failed`; the terminal unmount reports `degraded`. React's failed ErrorBoundary cannot accept another render, and pending render promises settle or cancel. React event-handler errors and arbitrary asynchronous work outside framework error hooks are not globally intercepted; the host must handle them or call `reportError`.

Shutdown first stops cooperative work and prevents new activation. Pending passive effects may still register allowed resources while the root unmounts; those registrations remain inert. Final scope disposal runs in `finally`. Self-unregister during a synchronous factory defers its release record until the returned cleanup runs exactly once. Pending cleanup remains observable. Cleanup exceptions never prevent remaining teardown and never count as successful releases.

Mount and resume recheck fatal errors, disposal, controller generation and newly recorded cleanup failures immediately after resource activation. Reentrant `reportError` or throwing cleanup returns `failed` after terminal teardown; reentrant `unmount` returns `skipped`. These paths cannot subsequently record `ready`/`active` or `ok`. Successful self-unregister remains valid and preserves the component.

Existing lifecycle/event schemas are reused. Generic legacy cleanup records require a host-supplied missing `xtensionId` before canonical normalization. SSR/adoption, demo UI/router, global switching and LRU remain outside WP1; ERP adoption paths are unchanged.

## Provenance / Herkunft

| Source | Revision / role |
| --- | --- |
| `konnilabs/xtend` main | `96e6d174218767c362bc5547561348e606692f10`, Apache-2.0 |
| Private `konnilabs/xtend-tests` main | `52b7b456c144c1cf7a1d8c99a27f91ff608950cc`, read-only reference |
| Test product original | `49421a72da2c72ee2115694a1b1f369bdf4b6700`, declared by `GITHUB-RECOVERY.md` |
| Test product upstream base | `44dc96c1e7db6344dc2b8fd88c8f62aefd07e4a2`, declared by recovery document |
| Reused reference files | `src/controller.js`, `src/resources.js`, `src/fixtures/react.js`, `src/fixtures/vue.js` |
| Existing ERP reference | `products/resumability-maraca-erp-demo/src/xtensions/react-ledger-panel/index.js`, `vue-process-sidebar/index.js` |

Both repositories were accessible at the pinned revisions. Current upstream Main `86b1403f43d0f0532334cdd5243b3e0ae50fe6c2` (including PRs #101/#103) was integrated without conflicts for the P2 follow-up. No applicable `AGENTS.md` or local `.agents`/`.codex` skill instructions were present. The private test product has no standalone license for its own source; its vendored XTend license does not establish one for the whole product. On 2026-10-07 at 19:43 UTC the user explicitly authorized placing their own derived fragments under XTend's Apache-2.0 license and publishing a reviewed adapter patch as a Draft PR. Push awaits the independent review continuation; merge and release are not authorized. The reference checkout is unchanged.

React, ReactDOM and Vue remain third-party code under their own MIT licenses. [XTensions NOTICE](../tools/xtensions/NOTICE) identifies the derived files and upstream sources and accompanies unchanged license texts for tested React/ReactDOM 18.3.1 and 19.3.0 and Vue 3.5.22. These notices ship with the runtime adapter files in both XTend and the compiler package; no framework implementation is bundled. DE: Die Nutzerfreigabe gilt für eigene abgeleitete Fragmente unter Apache-2.0, nicht für eine Umlizenzierung von React/Vue oder der gesamten privaten Testquelle.

## Reproduction / Reproduktion

Use Node 24/26 and the repository-pinned npm. Install the committed test-only lock in a separate directory; it is outside workspaces and the published XTend package:

```sh
mkdir -p /tmp/xtensions-peers
cp tests/xtensions/runtime-peers/package*.json /tmp/xtensions-peers/
npm ci --prefix /tmp/xtensions-peers --registry https://registry.npmjs.org
export XTENSIONS_TEST_PEERS=/tmp/xtensions-peers
npm run test:xtensions-runtime
CHROME_BIN=/usr/bin/chromium npm run test:xtensions-runtime:browser
```

The browser harness uses esbuild and Playwright with an installed Chromium. It tests actual React roots and Vue apps, props/event updates, retained draft/scroll/DOM/state across 50 cycles per framework, cooperative guards, lifecycle races, errors, peer exports/versions and denied access. No plain-object mount can satisfy these tests. React 19 may be tested in a second isolated peer installation; it does not change the committed React 18/Vue reference versions. Reports can be written with `--report /absolute/path.json`. The declaration fixture is checked with `tsc --strict --noEmit --skipLibCheck --lib es2022,dom --module node16 --moduleResolution node16 tests/types/xtensions_runtime_adapters.ts`.

## Following RMT EPIC proposal / Vorschlag für anschließendes RMT-EPIC

Only a proposal, not an implementation authorization:

1. Define host-owned component registrations: verified runtime identity, props schema, allowed event schema, named cooperative resources, DOM ownership and configurable restrictions. RMT references registration IDs; components/RMT cannot edit registrations or expand grants.
2. Lower granular props bindings and explicit lifecycle intents into the existing KernelSignal/HostController/Fabric path. Define batching, ordering, acknowledgement and stale-generation semantics before adding syntax.
3. Decide whether suspended props are rejected, buffered or coalesced; specify error recovery and Suspense readiness independently of root commit. Keep router and cache policy in the host.
4. Add traceable policy profiles that restrict existing boundaries. Any future relaxation requires an explicit trusted host decision, separate threat model and negative tests. Cooperative suspension must never be described as isolation.
5. Address SSR/adoption in a separate section with signed resume context, node identity and existing trust-authority gates. Validate against the unchanged ERP adoption matrix.

Open design decisions before that EPIC: exact RMT props/lifecycle syntax, event schema execution and delivery ownership, policy revocation for active instances, async resource factory/cleanup contracts, buffering/backpressure, React scheduling/Suspense acknowledgement, Vue state/command adapters, hard-isolation transport, SSR adoption and versioning of the additive Runtime API.
