# A03.4 – Fähigkeitsverhandlung für tatsächliche Runtime-Adapter

Stand: 2026-11-10. **A03.4 ist implementiert.** A03.1–A03.4 decken damit den ausdrücklich komponierten React-/Vue-Pfad einschließlich Kernel/Fabric, Graph-Eigentum, kooperativer Budgets und Capability-Abgleich ab. Die automatische Manifest-/Provider-/Build-/Host-Kette folgt A04. RMTX und XTensions 2.0 bleiben bis zur vollständigen 0.9-Abnahme `preparing`; Angular-/Vanilla-Ausführung, SSR/Adoption und private Framework-Steuerung werden hier nicht als umgesetzt ausgegeben.

## Anforderungen und Versionen

Die eigene Option `capabilityRequirements` wählt bei `createReactKernelRuntimeAdapter` beziehungsweise `createVueKernelRuntimeAdapter` den neuen **Host-/Adapter-Vertrag v6 mit API 6.0.0**. Er ist ausdrücklich für alle vorhandenen Kernel-, Graph- und Budgetprofile verfügbar. `workBudget` verlangt weiterhin reale Graph-Ports. Ohne diese neue Option bleiben v2–v5 mit ihren vollständigen Deklarationen und dem Capability-Bericht v1 erhalten. Die Registry API **2.4.0** akzeptiert zusätzlich versionstreue v6-Hosts und ihre Idle-Barriere. Serialisierte Maraca-Pläne, Bindungsdaten, Classic-AST und die nativen Plattform-ABIs ändern sich nicht.

```js
const host = createReactKernelRuntimeAdapter({
  container, component, peers: { React, ReactDOM }, fabric,
  kernelWork: {
    scheduler, rootId: 'application', scope: 'filters-incarnation-17',
    work: { scan: { lane: 'background', maxChunkMs: 4 } }
  },
  policy: {
    allowedResources: ['subscription'],
    events: { selection: 'xtend.schemas.xtension.intent.v1' }
  },
  capabilityRequirements: {
    schema: 'xtend.xtensions.host-capability-requirements.v1',
    framework: 'react',
    required: {
      features: ['kernel.lifecycle', 'fabric.boundary', 'props.controlled'],
      work: ['scan'], resources: ['subscription'], events: ['selection']
    },
    optional: { features: ['render.ssr'] }
  }
});

const decision = host.getCapabilityNegotiation();
if (decision.ok) await host.mount(container, initialProps);
// Die Anwendung kann bei blocked ausdrücklich einen anderen Host/Fallback wählen.
```

Das neue Anforderungsschema ist geschlossenes, endliches JSON. `required` ist auch für eine leere Pflichtmenge ausdrücklich anzugeben; `optional` darf fehlen. Beide Abschnitte kennen ausschließlich `features`, `work`, `resources`, `events`. Fehlende Listen werden leer, vorhandene Listen werden kopiert und sortiert. Duplikate, Überschneidungen zwischen Pflicht und Optional, unbekannte Features, unsichere Namen, Accessors, unbekannte Felder und mehr als 32 Work- beziehungsweise 64 sonstige Namen pro Liste werden abgewiesen. Explizites `capabilityRequirements: undefined` ist ungültig. `framework` kann `react`, `vue`, `angular` oder `vanilla` verlangen; die aktuelle Implementierung stellt ausschließlich echte React-/Vue-Adapter bereit.

## Tatsächliche Fähigkeiten und Grants

Nur v6 liefert `getCapabilities()` mit dem neuen Schema **`xtend.xtensions.runtime-capabilities.v2`**. `framework` stammt vom konkreten Runtime-Driver, `profile` aus den tatsächlich konfigurierten und geprüften Ports: `kernel`, `graph` oder `budget`. Es gibt keine vom Aufrufer bereitgestellte Fähigkeitsmatrix und keinen impliziten Profilwechsel.

| Feature | React / Vue im Kernelprofil | Zusätzlich im Graphprofil | Zusätzlich im Budgetprofil |
| --- | --- | --- | --- |
| `kernel.lifecycle`, `fabric.boundary`, `props.controlled` | unterstützt | unterstützt | unterstützt |
| `work.named`, `resources.cooperative`, `cancellation.cooperative` | unterstützt | unterstützt | unterstützt |
| `surface.lifecycle` | nicht verfügbar | unterstützt | unterstützt |
| `work.bounded`, `work.pressure-budgets` | nicht verfügbar | nicht verfügbar | unterstützt |
| `framework.internal-scheduling`, `execution.preemption` | nicht verfügbar | nicht verfügbar | nicht verfügbar |
| `render.ssr`, `render.adoption` | nicht verfügbar | nicht verfügbar | nicht verfügbar |

`features` beschreibt die unterstützten Mechanismen, `grants` die separat gewährten Namen für Work, kooperative Ressourcen und Events. Ein implementierter Mechanismus erzeugt keine konkreten Grants. Ein erforderlicher Work-Name muss beispielsweise in `kernelWork.work` stehen, ein Ressourcenname in `policy.allowedResources` und ein Event in `policy.events`. V6 verlangt eindeutige, sichere String-Namen und höchstens 64 Ressourcen-/Event-Grants. Die payloadbezogenen Event-/Intent-Verträge bleiben bei A02 und der jeweiligen Host-Policy; ein Namensabgleich ersetzt keine Payloadprüfung.

Die Matrix beschreibt die Implementierung und konfigurierte Ports, keine aktuelle Sichtbarkeit, Root-Gesundheit oder Ausführungserlaubnis. Mount prüft weiterhin reale Root-/Surface-/Container-Eigentümer und Provider-/Peer-Versionen. `policy.authorize`, Suspend/Resume, Surface-Lebensdauer, Generationen, Budgetzulassung und terminale Revokation gelten zusätzlich. Ein weiterhin `matched` gemeldeter, suspendierter Host darf deshalb keine neue benannte Arbeit starten.

## Entscheidung vor dem Mount

`getCapabilityNegotiation()` liefert unveränderliche Daten mit Schema **`xtend.xtensions.host-capability-negotiation.v1`**:

- `matched`: Framework und sämtliche Pflicht-/Optionalanforderungen erfüllt; `ok: true`.
- `degraded`: sämtliche Pflichten erfüllt, mindestens ein optionaler Wunsch fehlt; `ok: true`.
- `blocked`: Pflichtfeature, Pflichtgrant oder verlangtes Framework fehlt; `ok: false`.

Der Report enthält das tatsächliche Framework, das verlangte Framework beziehungsweise `null`, `frameworkMatched`, die normalisierten Anforderungen, die Capability-Matrix sowie `missingRequired` und `missingOptional`, jeweils nach Feature-/Work-/Ressourcen-/Event-Namen aufgeteilt. Get-Methoden liefern tief eingefrorene Daten; `snapshot()` enthält unabhängige JSON-Kopien unter `capabilities` und `capabilityNegotiation`. Es werden keine Props, Provider, Scheduler-, DOM- oder Framework-Handles veröffentlicht.

Ein gültiger, aber unerfüllter Pflichtvertrag wirft bei der Konstruktion nicht: Die Anwendung kann die konkrete Entscheidung lesen und einen Fallback auswählen. Mount sowie retained Update/Suspend/Resume geben `policy-blocked` mit Grund `capability-requirements-unsatisfied` und dem Report zurück. Das geschieht **vor Kernel-Einplanung, Fabric-Ausführung, Provider-Aufruf, DOM-Ownership und Kernel-Ressourcenakquisition**. Terminales Cleanup und lesbare Berichte bleiben verfügbar. Ein blockierter Host belegt keinen Container und sein späteres Cleanup darf einen ausdrücklich neu gewählten Ersatz nicht berühren.

Optionale Wünsche schalten keine Fähigkeiten oder Grants frei. Es gibt keinen automatischen Adaptertausch, keine neue Framework-Installation und keinen impliziten Fallback. Nur die vertrauenswürdige Anwendung komponiert einen anderen konkreten Host. Auch die erfolgreiche Entscheidung ersetzt keine tatsächliche Runtime-Prüfung: `stage: "preflight"` und `runtimeExecutionVerified: false` bleiben ausdrücklich stehen. Ungültige tatsächliche Peers oder erwartete Versionen schlagen beim Mount weiterhin fehl. V6 erhält diesen Fehler als `failed`, auch wenn das notwendige Cleanup den eigenen Kernel-Lifecycle-Job cancelt. Ein ausdrücklich vom Host abgebrochener Provider bleibt dagegen eine `skipped`-Lieferung.

Die Komponente erhält weiterhin ausschließlich Emit-, Resource- und Named-Work-Facades. Props, Lifecycle-Envelopes und zusätzliche Work-Argumente können Anforderungen oder Angebote nicht umschreiben. Für neue Anforderungen wird ein neuer konkreter Host komponiert; es gibt keinen veränderlichen Negotiation-Setter.

## Abgrenzung zum bestehenden Registry-/Build-Pfad

`runtime-capability-registry` und seine vorhandenen v1-Verträge beschreiben statische Manifest-, Build- und Ladeentscheidungen. Sie bleiben unverändert. Ihre Framework-/Capability-Behauptungen werden weder als tatsächlicher Runtime-Nachweis übernommen noch mit dem neuen Host-Negotiation-Schema gleichgesetzt. A03.4 liefert weder eine Ladefreigabe noch einen Integrity-Nachweis. Die zuständige Anwendung muss Lade- und Boundary-Policies weiterhin anwenden. Ihre automatische Verkettung mit Manifesten, Providern und Maraca-Builds ist A04.

## Nachweise und verbleibender Umfang

[`capability-inspect.cjs`](capability-inspect.cjs) prüft **19 native Vertragsfälle** mit realen Kernel-/Fabric-/Surface-Ports und bindet Quellen, Deklarationen und Gates in [`capability-evidence.json`](capability-evidence.json). Er führt ausdrücklich keine Framework-Roots aus und ist im blockierenden Releasevorbereitungs-Gate enthalten.

Die tatsächlichen jsdom-/Chromium-Gates führen **27 neue Fälle** aus: zwölf je React/Vue und drei kompilierte keyed Maraca-Referenzen. Sie decken alle drei Profile, Pflicht-/Optional-Abgleich, unveränderliche Grants, Provider-/Versionsfehler, expliziten Fallback, Autorisierung und Surface-/Key-Lebensdauern ab. Insgesamt sind **269 Fälle je Umgebung**, alle bisherigen Regressionen sowie 88 Compilerprüfungen erforderlich. Gepackte Root-/Compiler-Consumer führen v2–v6 mit extern injizierten Peers aus. Strikte TypeScript-Consumer schützen neue und alte Overloads sowie Registry-/Maraca-Komposition.

Die automatische Plattform-Komposition folgt A04, SSR/Adoption A05, die endgültige RMTX-Syntax und DX A06. Breitere Framework-Unterstützung benötigt jeweils eigene Runtime-Implementierungen und tatsächliche Nachweise. Weder diese Vorprüfung noch die hier beschriebene React-/Vue-Abnahme ersetzt die vollständige 0.9-Feature-Abnahme oder hebt Publish-Gates auf.
