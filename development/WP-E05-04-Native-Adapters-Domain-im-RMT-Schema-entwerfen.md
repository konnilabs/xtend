# WP-E05-04 - Native `adapters` Domain im RMT Schema entwerfen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md`
  - `development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md`
  - `development/WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E05-04` macht `adapters` zu einer nativen, optionalen Top-Level-Domain in `.rmt` Dokumenten. Die Domain beschreibt Adapter-Records fuer Host-, Component-, Router-, State- und Scheduler-Arbeit, ohne dass der RMT Kernel daraus Framework-Imports ableitet.

Damit wandert Adapter-Authoring aus `manifest.metadata`-Ausweichpfaden in eine klare DSL-Oberflaeche. Bestehende Template-only-Dokumente bleiben gueltig, weil `adapters` optional ist und nicht in `required` aufgenommen wird.

## Leitentscheidung

`adapters` ist eine deklarative Domain, keine Runtime-Instanzliste.

RMT darf Adapter Records parsen, normalisieren, registrieren und gegen Capability Requests pruefen. Die eigentliche Ausfuehrung bleibt bei den Adaptern aus `WP-E05-02`; Auswahl und Pruefung folgen dem Registry-/Negotiation-Contract aus `WP-E05-03`.

Der Kernel darf nicht:

- aus `adapter.id` oder `adapter.kind` Host-spezifische Imports ableiten
- `xtend.component`, `xtend.template` oder `xtend.xrouter` als Pflicht-Adapter behandeln
- XTend Manifest Lookup, XRouter Setup oder `xstate` Writes uebernehmen

## Native Domain Shape

Die Domain ist ein optionales Array auf Dokumentebene:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "manifest": {
    "documentId": "app.shell"
  },
  "adapters": [],
  "templates": []
}
```

Ein Adapter Record besitzt mindestens:

| Feld | Pflicht | Bedeutung |
|------|---------|-----------|
| `id` | ja | stabile Adapter-ID |
| `kind` | ja | `host_adapter`, `component_adapter`, `router_adapter`, `state_adapter` oder `scheduler_adapter` |
| `version` | nein | Adapter- oder Contract-Version |
| `package` / `moduleRef` | nein | Paket-, Modul- oder Source-Referenz |
| `runtimeSurface` | nein | erlaubte Surfaces wie `esm`, `browser_classic`, `worker`, `server` |
| `providedCapabilities` | nein | angebotene Capabilities |
| `requiredCapabilities` | nein | harte Anforderungen des Adapters |
| `preferredCapabilities` | nein | weiche Anforderungen des Adapters |
| `lifecycleContract` | nein | z. B. `xtend.rmt.host-adapter-lifecycle.v1` |
| `kernelVisible` | nein | fuer Host-spezifische Adapterdaten standardmaessig `false` |
| `status` | nein | `registered`, `available`, `degraded`, `missing`, `failed` |
| `diagnostics` | nein | strukturierte Diagnostics |
| `metadata` | nein | host-neutrale Zusatzdaten |

## XTend-Beispiel

```json
{
  "id": "xtend.component",
  "kind": "component_adapter",
  "version": "1.0.0",
  "moduleRef": "@xtend/rmt-adapter-xtend/component",
  "runtimeSurface": ["esm", "browser_classic"],
  "providedCapabilities": [
    "customElements",
    "hydration",
    "slots",
    "events"
  ],
  "requiredCapabilities": [
    "manifest",
    "customElements"
  ],
  "preferredCapabilities": [
    "stateBridge",
    "diagnostics"
  ],
  "lifecycleContract": "xtend.rmt.host-adapter-lifecycle.v1",
  "kernelVisible": false
}
```

## Nicht-XTend-Beispiel

`custom.router` steht hier exemplarisch fuer einen nicht-XTend Router Adapter.

```json
{
  "id": "custom.router",
  "kind": "router_adapter",
  "version": "1.0.0",
  "moduleRef": "./adapters/custom-router.js",
  "runtimeSurface": ["esm"],
  "providedCapabilities": [
    "routes",
    "navigation",
    "params",
    "query"
  ],
  "requiredCapabilities": [],
  "preferredCapabilities": [
    "diagnostics"
  ],
  "lifecycleContract": "xtend.rmt.host-adapter-lifecycle.v1",
  "kernelVisible": false
}
```

## Backward Compatibility

Die Domain ist additiv:

- Dokumente ohne `adapters` bleiben gueltig.
- `templates` bleibt weiterhin die einzige fachliche Inhaltsdomain, die in alten Dokumenten gebraucht wird.
- Adapterdaten in `manifest.metadata` koennen als Legacy-/Pilotdaten bestehen bleiben, sollen aber bei produktiver DSL-Arbeit in `adapters` migriert werden.
- Ein leeres `adapters: []` ist gueltig und bedeutet: keine expliziten Adapter-Anforderungen.

## Schema-Entscheidung

`xtendrmt/rmt.schema.json` wird bewusst synchronisiert:

- Top-Level-Property `adapters` referenziert `#/$defs/adapters`.
- `#/$defs/adapter` beschreibt native Adapter Records.
- `#/$defs/adapterKind`, `#/$defs/runtimeSurface`, `#/$defs/capabilityList`, `#/$defs/diagnostic` und `#/$defs/adapterStatus` werden als wiederverwendbare Schema-Bausteine eingefuehrt.
- `x-xtendrmt.nativeDomainContracts` dokumentiert `xtend.rmt.adapters-domain.v1` als WP-04-Artefakt-Referenz.

## Anschluss fuer Folgepakete

- `WP-05` kann `components[*].adapter` gegen `adapters[*].id` und Capabilities referenzieren.
- `WP-06` kann `routes[*].router` gegen `router_adapter` Records referenzieren.
- `WP-07` kann Schedule Policies fuer Adapter-Operationen anbinden.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `adapters` ist additiv beschreibbar | erfuellt: Top-Level-Property ist optional und defaultet auf `[]` |
| `xtend.component`, `xtend.template` und `xtend.xrouter` sind valide Adapter-IDs | erfuellt: IDs sind normale String-Werte und in `x-xtendrmt.nativeDomainContracts` als stabile Beispiel-IDs dokumentiert |
| alte Dokumente ohne `adapters` bleiben gueltig | erfuellt: `adapters` ist nicht Teil von `required` |

## Verifikation

Mindestgate fuer diese Entscheidung:

```bash
node -e "JSON.parse(require('fs').readFileSync('xtendrmt/rmt.schema.json','utf8'))"
node --check tests/rmt/rmt_compatibility_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`WP-E05-04` ist abgeschlossen. Die native `adapters` Domain ist im RMT Schema additiv modelliert, in den Typ-Artefakten sichtbar und bereitet `components`, `routes` und `schedules` auf referenzierbare Adapter-Records vor.
