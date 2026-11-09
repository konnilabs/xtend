# A03.2 – XTension-Hosts im Surface- und Kernel-Ressourcengraphen

Stand: 2026-11-09. **A03.2 ist implementiert; A03 bleibt in Arbeit.** Die Anwendung verbindet einen konkreten Host mit einem vorhandenen Kernel-Root und einer materialisierten, generationstreuen Surface. Sie injiziert die tatsächlichen Plattform-Ports. Es entsteht kein zweiter Graph, Scheduler oder Model-Writer.

## Vertrag und Versionen

Die vorhandenen `createReactKernelRuntimeAdapter`-/`createVueKernelRuntimeAdapter`-Factories haben einen zusätzlichen, expliziten `resourceGraph`-Overload:

```js
const host = createReactKernelRuntimeAdapter({
  container, component, peers: { React, ReactDOM }, fabric,
  kernelWork: {
    scheduler, rootId: 'application-root', scope: 'filter-incarnation-17',
    work: { scan: { lane: 'background', maxChunkMs: 2 } }
  },
  resourceGraph: {
    kernel, surfaceGraph, surfaceController,
    surfaceId: 'filters-panel'
  },
  policy: { allowedResources: ['subscription'] }
});
await host.mount(container, initialProps);
```

`kernel` ist der Ressourcen-Port der realen RMT-Instanz (`createRmtCore({scheduler}).rmt`); der Anwendungshost mountet seinen Root vorher selbst. Der vorhandene öffentliche Komponentenpfad `@ccslabs/xtend/components/xsurfacemanager-controller.js` liefert den Surface-Controller. `surfaceGraph` und `surfaceController` müssen aus derselben vertrauenswürdigen Anwendungskomposition stammen. Der Adapter prüft ihre v2-Marker, die materialisierte Surface, ihre Generation sowie das gemeinsame Kernel-/Scheduler-/Container-Eigentum. Die Komponente bekommt diese Ports nicht.

| Aufruf / Vertrag | Version |
| --- | --- |
| Direkte Factories | Unverändert API 2.0.0 / Host v2 |
| Kernel-Factories ohne `resourceGraph` | Unverändert API 3.0.0 / Host v3 |
| Kernel-Factories mit explizitem `resourceGraph` | API 4.0.0 / `xtend.xtensions.runtime-host-controller.v4`; React-/Vue-Adapter v4 |
| `snapshot().resourceGraph` | Neues Schema `xtend.xtensions.resource-graph-binding.v1` |
| Bindungs-Registry | API 2.2.0 akzeptiert versionstreue v2-, v3- und v4-Hosts |
| Kernel-, Surface-Graph-, Surface-Controller-ABI / Capability- und Work-Scope-Daten | Unverändert; es werden vorhandene Plattform-Ports konsumiert |

Die v3-Deklaration bleibt vollständig erhalten. Die neue v4-Deklaration beschreibt den Graph-Host separat. Maracas Factory-Typ akzeptiert den weiteren kompatiblen Lieferanten über Registry 2.2; Planfelder, Classic-AST, Compiler, Maraca Runtime v7 und Browser-API 5.0.0 bleiben unverändert. Es gibt keine zusätzlichen Paket-Export-Schlüssel oder Framework-Abhängigkeiten.

## Eigentum und Lebensdauer

Die Konstruktion erwirbt keine Ressourcen. Nach erfolgreicher Mount-Eingabeprüfung und vor Kernel-Zulassung registriert die Bindung genau eine echte Kernel-Ressource `xtension:<scope>` vom Typ `xtension-host`. Ihr Deskriptor verbindet Root, Scope, Host-/XTension-Identität, owning Surface und deren Generation. Das Ressourcenhandle muss tatsächlich zu dieser Registrierung gehören; ein belegter Scope wird abgewiesen. Ein fehlender Root, fremder Scheduler, fremder Container oder fehlender Surface-Owner erzeugt keinen Mount-Job.

Alle Lifecycle-/Work-Jobs tragen `metadata.kernelResourceId` und `owningSurfaceId`. Fabric enthält zusätzlich die Surface-Generation. Der Binding-Snapshot zeigt `rootId`, `scope`, `resourceId`, `surfaceId`, `surfaceGeneration`, `state` und `attached`; er enthält keine Ports, Props oder Framework-Objekte. Die vorhandene Capability-Aussage über kooperative Arbeit und autonome Framework-Interna bleibt gültig.

Der Kernel-Resource-Destroy-Hook beendet den Host synchron hinsichtlich Autorität und Cancellation. Das tatsächliche Framework-Cleanup schließt asynchron über den bestehenden sofortigen Fabric-Pfad ab. Root-Disposal, Ressourcenfreigabe und Root-Elementwechsel greifen dadurch auch bei einer blockierten Job-Queue. Manuelles Host-Unmount entfernt ausschließlich das eigene Ressourcenhandle und die eigene Surface-Subscription. Root, Scheduler, Surface und Controller bleiben im Eigentum der Anwendung.

Destroy, verschwundene Surface oder geänderte Surface-Generation sind terminal. Eine mit gleicher Kennung neu erzeugte Surface kann den alten Host nicht reaktivieren. Ein neuer Host benötigt einen neuen konkreten Scope beziehungsweise eine neue Registry-Inkarnation. Altes idempotentes Host-Cleanup entfernt keine Ressourcen einer späteren Inkarnation.

## Close, Minimize und Resume

Surface-Controller-Snapshots sind die Lifecycle-Autorität. Close, Minimize und Collapse entziehen benannter Arbeit und registrierten kooperativen Ressourcen synchron ihre aktuelle Generation. Diese Revokation wartet nicht auf Kernel-Zulassung. Der Ressourcen-Stopp wird durch Fabric beobachtet; Instrumentierungsfehler dürfen die Revokation nicht verzögern. Dieser sofortige Entzug ist kein vorgetäuschter Kernel-Job. Reguläre Host-Lifecycle-Operationen und die Wiederaufnahme laufen weiter als echte Kernel-Jobs über Fabric.

Bereits gemountete Framework-Roots bleiben erhalten. Inaktive v4-Hosts akzeptieren neue kontrollierte Props als gestagte Lieferung (`status: "ok"`, Metadatum `deferred: "surface-inactive"`). Model und XTend State können normal weiterlaufen. Erst die erfolgreiche Surface-Wiederaufnahme rendert die neuesten Props und startet danach Ressourcen und eine neue Work-Generation. Die Registry darf die kontrollierte Lieferung damit übernehmen, ohne einen sichtbaren Framework-Commit zu behaupten. `snapshot().props` zeigt die neueste übernommene kontrollierte Ersetzung.

Eine explizite Host-/Registry-Suspension ist ein zusätzlicher Grund: Surface-Öffnen hebt sie nicht auf. Explizites Resume bei noch geschlossener Surface kann Props übernehmen, startet aber keine Arbeit. Überholte Open-/Close-Folgen und Reentranz während des Ressourcenstarts können keine alte Work-Generation aktivieren.

Ein initial geschlossener Owner blockiert den Boot-Abschluss nicht: Der leere, kontrollierte Host darf als inaktiver Framework-Root mounten; kooperative Ressourcen und benannte Arbeit bleiben gestoppt. Verlässt eine zunächst aktive Surface dagegen einen noch laufenden Mount/Provider, endet dieser teilweise gelieferte Host terminal. Ein später eintreffender Provider kann keinen Root erzeugen. Private Framework-Updates werden weiterhin nicht präemptiv unterbrochen.

`host.whenIdle()` schließt auch die durch Surface-Änderungen ausgelöste Lifecycle-Auslieferung und terminales Cleanup ein; benannte Geschäftsarbeit gehört nicht zu dieser Barriere. Registry `flush()`/`whenIdle()` und Maracas `whenXTensionsIdle()` schließen diese v4-Barriere ein. `surfaceGraph.openSurface()` allein beschreibt weiterhin den Surface-Vertrag.

## Integration und Nachweise

Der Maraca-Nachweis komponiert drei echte keyed React-Hosts mit demselben Anwendungsscheduler, dem realen Kernel-Ressourcenregister und derselben vom Plan Runtime erzeugten Surface Graph Runtime. Die Anwendung stellt den Surface-Controller explizit bereit und erhält den Graph über ihre injizierte Runtime-Factory. Der Plan Runtime erhält damit keine zusätzlichen veränderlichen öffentlichen Handles. Eine gemeinsame owning Surface kann mehrere konkrete Host-Lebensdauern umfassen. Automatische Provider-/Build-/Host-Komposition und die automatische Wahl der owning Surface beziehungsweise ihrer Elternkette bleiben A04 vorbehalten.

[`graph-inspect.cjs`](graph-inspect.cjs) prüft 19 native Surface-/Kernel-Vertragsfälle und bindet die Quellen in [`graph-evidence.json`](graph-evidence.json). Der blockierende Release-Vorbereitungs-Gate führt `--check` aus. Framework-Ausführung bleibt ausdrücklich den Runtime-Gates vorbehalten: **32 A03.2-Fälle** in jsdom und Chromium, zusätzlich zu sämtlichen **184 bisherigen Fällen**, also **216 pro Umgebung**, sowie unverändert 88 Compilerprüfungen. Die gepackten Root-/Compiler-Consumer führen v2, v3 und v4 mit injizierten externen React-/Vue-Peers und den tatsächlichen öffentlichen Plattform-Modulen aus. Typprüfungen sichern die Overloads und die Maraca-/Registry-Anbindung.

Druck-/Budgetstrategien und weitergehende Fähigkeitsverhandlung bleiben die nächsten A03-Abschnitte. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`.
