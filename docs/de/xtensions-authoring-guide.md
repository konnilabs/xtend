# XTensions Authoring Guide

Eine XTension bindet eine bestehende Framework- oder Library-Insel kontrolliert an eine XTend- oder RMT-App an. Sie ist sinnvoll, wenn ein Team eine vorhandene React-, Vue-, Three.js-, OpenUI5-, Angular- oder imperative Oberfläche weiterverwenden muss. Für neue XTend-Komponenten bleibt die native Web-Component-Oberfläche der einfachere Standard.

Der Kernel sieht dabei keine Framework-Objekte. Er arbeitet mit serialisierbaren Lifecycle-, Capability-, Signal-, Event- und Diagnostic-Records. Der HostController übersetzt zwischen diesen Records und der konkreten Runtime.

## Voraussetzungen

Bevor du einen Adapter implementierst, kläre:

- welches Host-Element und welche Surface der Adapter besitzt;
- wer die externe Runtime bereitstellt;
- welche Props oder Signale die Insel akzeptiert;
- welche Events sie nach oben meldet;
- wie Listener, Timer, Observer, Worker und Render-Loops beendet werden;
- welcher Fallback ohne Framework-Runtime sichtbar bleibt.

Framework-Pakete werden als externe oder host-provided Peers klassifiziert. Sie gehören nicht als versteckte Root-Dependency oder vendorte Kopie in XTend.

## HostController implementieren

Ein HostController stellt einen kleinen Lifecycle bereit. Das folgende Beispiel zeigt die Form, nicht eine Framework-Implementierung:

```js
const controller = {
  mount(target, initialProps) {
    return { status: 'mounted', target, initialProps };
  },
  update(signal) {
    return { status: 'updated', signal };
  },
  suspend(reason) {
    return { status: 'suspended', reason };
  },
  resume(reason) {
    return { status: 'resumed', reason };
  },
  reportError(error) {
    return { status: 'error', message: error.message };
  },
  unmount(reason) {
    return { status: 'unmounted', reason };
  },
  snapshot() {
    return { status: 'ready' };
  }
};
```

`mount()` besitzt das Host-Element ab dem erfolgreichen Mount. `unmount()` muss jeden im Lifecycle angelegten Seiteneffekt entfernen. Ein Adapter darf nicht voraussetzen, dass die Shell nach einem Fehler neu geladen wird.

## Manifest und Capabilities beschreiben

Das projektlokale Maraca-Manifest benennt Identität, Version, Entry, Integrity, Runtime-Abhängigkeiten, benötigte Host-Capabilities und Fallback. Die Runtime Capability Registry entscheidet, ob die XTension `ready`, `degraded` oder `policy-blocked` startet.

```js
const adapterRecord = {
  id: 'customer.react.dashboard',
  framework: 'react',
  version: '1.2.0',
  entry: {
    module: './customer/react-dashboard-adapter.js',
    exportName: 'createDashboardAdapter',
    dynamicImport: true
  },
  dependencies: [
    {
      name: 'react',
      versionRange: '18.x || 19.x',
      classification: 'host-provided',
      bundled: false
    }
  ],
  fallback: {
    mode: 'native-placeholder',
    message: 'Dashboard runtime unavailable'
  }
};
```

Ein Manifest ist Provenance und Policy-Eingabe. Es lädt nicht eigenmächtig eine unbekannte Runtime aus dem Netz.

## Signale und Events anbinden

Downstream-Kommunikation läuft als KernelSignal über Fabric-Lanes. Upstream-Kommunikation wird als SurfaceEvent mit Owner, Richtung, Payload-Schema und Trust Boundary veröffentlicht. Reiche keine Framework-Contexts, DOM-Events oder Klasseninstanzen über diese Grenze.

Wähle die Lane nach Nutzerwirkung. Eine sichtbare Eingabe kann `user-blocking` benötigen; Diagnoseexport oder Preload gehört in eine Hintergrund-Lane. Framework-Scheduler dürfen Hints liefern, besitzen aber nicht die Kernel-Priorität.

## Fehler und Fallback behandeln

Wenn Peer-Runtime, Capability, Integrity oder Policy fehlt, mountet der Host die Insel nicht halb. Er erzeugt einen Diagnostic Record und zeigt den deklarativen Fallback. Andere Surfaces, Navigation und Kernel-Arbeit müssen bedienbar bleiben.

Fehler innerhalb der Insel laufen über `reportError()`. Bewahre Framework-Stacks nur dort auf, wo die Redaction-Policy sie erlaubt. Der serialisierte XTend-Diagnostic enthält eine stabile Fehlerklasse, Surface, Lifecycle-Phase und Korrelation, aber keine Secrets.

## Adapter prüfen

Führe zuerst die gemeinsamen Contracts aus und danach die Suite deines Adapters:

```bash
node scripts/run_xtend_tests.js xtensions-host-controller xtensions-signal-bridge xtensions-runtime-capability-registry --json
node scripts/run_xtend_tests.js xtensions-security-integrity-gate --json
```

Für React und Vue stehen zusätzliche Host-Adapter-Suiten bereit. Imperative Canvas- oder WebGL-Hosts brauchen außerdem einen Browser-Smoke, der Render-Loop, Resize-Observer und GPU-Ressourcen nach `unmount()` als beendet nachweist.

Das erwartete Ergebnis ist ein `ready`-Adapter mit vollständigem Cleanup. Ein fehlender Peer muss reproduzierbar `degraded` oder `policy-blocked` ergeben, ohne die Shell zu blockieren.

## Fehlerbehebung

Bleibt ein Adapter `blocked`, prüfe zuerst Dependency-Klassifikation, Host-Capabilities, Integrity und Fallback. Eine Framework-Abhängigkeit mit `bundled: true` verletzt bei host-provided Runtimes die Boundary.

Bleiben Listener nach `unmount()` aktiv, führe alle Registrierungen durch einen adaptereigenen Cleanup-Stack. Verlasse dich nicht auf das Framework, wenn der Host zusätzliche Observer oder Fabric-Subscriptions angelegt hat.

Werden Events nicht empfangen, vergleiche Richtung, Owner, Payload-Schema und Lane. Ein direkter globaler Eventbus zwischen zwei Framework-Inseln gehört nicht zum XTensions-Vertrag.

## Nächste Schritte

- [XTensions Migration und Coexistence](./xtensions-migration-coexistence-guide.md)
- [XTensions Security Checklist](./xtensions-security-checklist.md)
- [XTend Fabric](./xtend-fabric.md)
- [Supply Chain Checks](./supply-chain-gates.md)
- [XScaler-Protokoll](./xscaler-protocol.md)
