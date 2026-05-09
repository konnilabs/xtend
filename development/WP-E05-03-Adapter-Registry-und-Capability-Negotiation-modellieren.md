# WP-E05-03 - Adapter Registry und Capability Negotiation modellieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md`
  - `development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E05-03` modelliert Adapter Registry und Capability Negotiation als host-neutrale Schicht zwischen RMT-Dokumenten, normalisierten DSL-Records und konkreten Host-Adaptern.

Nach `WP-E05-02` existiert der Lifecycle Contract. Dieses Paket legt nun fest, wie Adapter in eine Registry aufgenommen werden, wie `.rmt` Dokumente required und preferred Capabilities deklarieren koennen und wie fehlende Capabilities als Diagnostics sichtbar werden, statt erst beim Mounting, Hydration oder Routing zu scheitern.

## Leitentscheidung

Adapter Registry und Capability Negotiation sind Kernel-nahe Contracts, aber keine Framework-Integration.

RMT darf:

- Adapter-Records registrieren
- Capabilities strukturiert vergleichen
- Requirements aus `.rmt` Dokumenten, Components, Routes, Templates oder Schedules sammeln
- Negotiation Results erzeugen
- Diagnostics fuer fehlende, degradierte oder widerspruechliche Capabilities emittieren

RMT darf nicht:

- XTend Manifeste lesen
- XRouter Instanzen erzeugen
- `xstate` direkt beschreiben
- Adapter-spezifische Fallbacks hart codieren
- Framework-spezifische Imports in den Kernel ziehen

## Adapter Registry Contract

Die Registry fuehrt Adapter Records, nicht Runtime-Instanzen als Kernelwissen.

| Feld | Bedeutung |
|------|-----------|
| `id` | stabile Adapter-ID, z. B. `xtend.component`, `xtend.xrouter`, `react-router` |
| `kind` | `host_adapter`, `component_adapter`, `router_adapter`, `state_adapter` oder `scheduler_adapter` |
| `version` | Adapter-Version oder Contract-Version |
| `package` / `moduleRef` | optionaler Quell- oder Paketverweis fuer den Adapter |
| `runtimeSurface` | `esm`, `browser_classic`, `worker`, `server` oder Custom Surface |
| `providedCapabilities` | vom Adapter angebotene Capabilities |
| `requiredCapabilities` | Capabilities, die der Adapter selbst benoetigt |
| `preferredCapabilities` | Capabilities, die bessere Qualitaet erlauben |
| `lifecycleContract` | referenziertes Lifecycle-Contract-Id, initial `xtend.rmt.host-adapter-lifecycle.v1` |
| `kernelVisible` | fuer Host-spezifische Adapterdaten standardmaessig `false` |
| `status` | `registered`, `available`, `degraded`, `missing`, `failed` |
| `diagnostics` | strukturierte Diagnostics fuer den Adapter |
| `metadata` | host-neutrale Zusatzdaten |

Die Registry darf mehrere Adapter desselben `kind` enthalten. Auswahl und Priorisierung gehoeren in Capability Negotiation und spaetere Domain-Records, nicht in harte Kernel-Sonderfaelle.

## Capability Request Contract

RMT-Dokumente und normalisierte Records duerfen Anforderungen deklarieren:

| Feld | Bedeutung |
|------|-----------|
| `scope` | Geltungsbereich, z. B. `document`, `route`, `component`, `template`, `schedule` |
| `adapterKind` | benoetigte Adapterklasse |
| `adapterId` | optional konkret gewuenschter Adapter |
| `requiredCapabilities` | harte Anforderungen |
| `preferredCapabilities` | weiche Anforderungen |
| `runtimeSurface` | benoetigte Surface |
| `fallbackPolicy` | `fail`, `degrade`, `skip` oder `diagnose_only` |
| `metadata` | host-neutrale Zusatzdaten |

Ein Template-only-`.rmt` Dokument ohne Adapter-Anforderungen bleibt gueltig. In diesem Fall erzeugt die Normalisierung eine leere oder implizit kompatible Request-Liste, aber keinen Zwang zu XTend-, XRouter- oder anderen Host-Adaptern.

## Negotiation Flow

Capability Negotiation laeuft deterministisch in Phasen:

| Phase | Zweck |
|-------|-------|
| `collect` | Adapter Records und Capability Requests sammeln |
| `normalize` | IDs, Kinds, Surfaces und Capabilities normalisieren |
| `match` | passende Adapter pro Request suchen |
| `validate` | required Capabilities, Surface und Version pruefen |
| `select` | passenden Adapter waehlen oder mehrere Kandidaten markieren |
| `degrade` | fehlende preferred Capabilities als degradierte Ergebnisse markieren |
| `diagnose` | Diagnostics fuer missing/degraded/conflicting Capabilities emittieren |
| `finalize` | Negotiation Result erzeugen |

## Negotiation Result

Jedes Negotiation Result ist serialisierbar:

| Feld | Bedeutung |
|------|-----------|
| `ok` | true, wenn keine harte Anforderung fehlt |
| `status` | `accepted`, `degraded`, `failed` oder `skipped` |
| `scope` | verhandelter Scope |
| `adapterId` | gewaehlter Adapter oder leer bei Failure |
| `adapterKind` | Adapterklasse |
| `acceptedCapabilities` | erfolgreich erfuellte Capabilities |
| `missingRequiredCapabilities` | harte fehlende Capabilities |
| `missingPreferredCapabilities` | weiche fehlende Capabilities |
| `degradedCapabilities` | Capabilities mit Fallback |
| `diagnostics` | strukturierte Diagnostic Events |
| `metadata` | host-neutrale Zusatzdaten |

Regel:

- Fehlt eine `requiredCapability`, ist das Result `failed`.
- Fehlt nur eine `preferredCapability`, ist das Result `degraded`.
- Fehlt eine passende `runtimeSurface`, ist das Result `failed`, wenn die Surface required ist.
- Gibt es mehrere passende Adapter, darf `select` nach dokumentierter Prioritaet waehlen; die Alternative muss diagnostic-freundlich nachvollziehbar bleiben.

## Diagnostics-Codes

Mindestcodes fuer WP-03:

| Code | Level | Bedeutung |
|------|-------|-----------|
| `rmt.adapter.missing` | `error` | kein Adapter fuer `adapterId` oder `adapterKind` gefunden |
| `rmt.capability.required_missing` | `error` | required Capability fehlt |
| `rmt.capability.preferred_missing` | `warn` | preferred Capability fehlt |
| `rmt.adapter.surface_mismatch` | `error` | benoetigte Runtime-Surface fehlt |
| `rmt.adapter.version_mismatch` | `warn` oder `error` | Version passt nicht zur Policy |
| `rmt.adapter.conflict` | `warn` | mehrere Adapter konkurrieren ohne klare Prioritaet |
| `rmt.adapter.degraded` | `warn` | Adapter ist nutzbar, aber mit Fallback |
| `rmt.adapter.negotiation.skipped` | `info` | Request wurde bewusst uebersprungen |

Diagnostics duerfen Host-Details im Payload tragen, aber der Kernel darf daraus kein XTend-, XRouter- oder `xstate`-Wissen ableiten.

## Erste stabile Adapter-IDs

Diese IDs bleiben fuer Epic 05 stabil:

| Adapter-ID | Kind | Status |
|------------|------|--------|
| `xtend` | `host_adapter` | first-class Host, optional |
| `xtend.component` | `component_adapter` | XTend Custom Elements und Component-Hydration |
| `xtend.template` | `component_adapter` / Template-Ausfuehrung | vorbereiteter Template-Adapter |
| `xtend.xrouter` | `router_adapter` | erster produktiver Router Adapter |
| `host-adapter-contract` | Contract-Ref | Handoff-/Kompatibilitaetsanker |

Andere Hosts duerfen eigene Adapter-IDs registrieren. React, Vue, Vanilla JS und Custom Hosts bleiben gleichberechtigt.

## Anschluss fuer native Domains

`WP-03` macht die Basis-Domains startbereit:

- `WP-04` kann `adapters` als native Top-Level-Domain modellieren.
- `WP-05` kann `components` an Adapter- und Capability-Requirements anbinden.
- `WP-06` kann `routes` an Router Adapter und Navigation Capabilities anbinden.

Die Domains duerfen Capability Requirements referenzieren oder inline deklarieren, sollen aber dieselbe Negotiation-Semantik verwenden.

## Synchronisierte Artefakte

Diese Entscheidung wird bewusst gespiegelt:

- `xtendrmt/rmt.schema.json` fuehrt `xtend.rmt.adapter-registry.v1` als `adapterRegistryContracts` unter `x-xtendrmt`.
- `xtendrmt/rmt-core.d.ts` deklariert Registry-, Capability-Request- und Negotiation-Result-Typen.

Die Source-of-Truth bleibt upstream RMT Source beziehungsweise dieses Workpackage, bis `WP-13` Build-Pipeline und Artefakt-Paritaet absichert.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `.rmt` Dokumente koennen Adapter- und Capability-Anforderungen deklarieren | erfuellt: Capability Request Contract definiert Scope, Adapter, required/preferred Capabilities und Runtime Surface |
| fehlende Capabilities erzeugen Diagnostics statt stiller Runtime-Fehler | erfuellt: Negotiation Result und Diagnostic Codes definieren failed/degraded/skipped Zustaende |
| `WP-04`, `WP-05` und `WP-06` koennen native Domains daran anbinden | erfuellt: Anschlussregeln fuer `adapters`, `components` und `routes` sind definiert |

## Verifikation

Mindestgate fuer diese Entscheidung:

```bash
node --check tests/rmt/rmt_compatibility_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E05-03` ist abgeschlossen. Adapter Registry und Capability Negotiation sind als host-neutrale Contracts modelliert, in Schema- und Typ-Artefakte gespiegelt und machen die nativen Domains `adapters`, `components` und `routes` startbereit.
