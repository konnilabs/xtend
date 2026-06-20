# XTensions Vue HostController PoC and Explicit Update Adapter Contract

- Status: `accepted-by-XTN-07`
- Datum: 2026-06-20
- Workpackage: `XTN-07`
- PoC Schema: `xtend.xtensions.vue-host-controller-poc.v1`
- Contract Schema: `xtend.xtensions.vue-host-controller-contract.v1`
- Update Adapter Record Schema: `xtend.xtensions.vue-update-adapter-record.v1`
- Event Record Schema: `xtend.xtensions.vue-normalized-event.v1`
- Boundary Record Schema: `xtend.xtensions.vue-boundary-record.v1`
- Report Schema: `xtend.xtensions.vue-host-controller-report.v1`
- Module: `tools/xtensions/vue-host-controller-poc.js`
- Types: `tools/xtensions/vue-host-controller-poc.d.ts`
- Fixture: `tests/fixtures/xtensions/vue-host-controller-poc-valid.json`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-vue-host-controller-poc --json`
- Boundary: `vue-peer-runtime-is-external-opt-in`
- Boundary: `no-vue-imports-in-xtend-core`
- Boundary: `explicit-update-adapter-required`
- Boundary: `no-globalproperties-patch-contract`
- Boundary: `vue-proxy-store-stays-inside-host`
- Boundary: `vue-events-normalized-through-fabric`

## Zweck

XTN-07 validiert Vue als reaktive HostController-Klasse, ohne Vue in den RMT-Kernel, XTend-Core oder lokale XTensions-Gates zu ziehen.

Der PoC ist frameworkless. Er simuliert `createApp`, Mount, explizite Update-Adapter, normalisierte Events und `unmount` als Contract Stub. Ein echter Vue-Harness bleibt extern, opt-in und peer-basiert.

## Vue Peer Boundary

Vue darf in XTN-07 nur als Daten in Runtime-Adapter-Records erscheinen:

- Dependency-Klasse: `external-peer`
- Harness: `external-opt-in`
- keine Root-/Dev-/Optional-/Peer-Dependency in `package.json`
- keine vendored Vue-Bundles im Repo oder NPM-Paket
- keine lokalen Tests mit Netzwerk- oder Installationspflicht

Das lokale Modul importiert kein `vue` und keine Vue-Typen.

## Expliziter Update-Adapter

Vue `globalProperties.$patch` ist kein XTensions-Vertrag. Updates muessen ueber explizite Adapter-Funktionen laufen:

| Adapter | Zweck |
|---------|-------|
| `applyPropsUpdate` | serialisierbare Props in den HostController geben |
| `applyStatePatch` | serialisierbare State-Patches host-intern anwenden |
| `dispatchCommand` | serialisierbare Commands an den HostController geben |

Jeder Update Adapter Record enthaelt:

- `adapterFunction`
- Payload-Fingerprint
- `proxyBoundary: "internal-only"`
- `globalPropertiesPatchUsed: false`
- Diagnostics

Fehlt der explizite Adapter oder taucht `globalProperties.$patch` im Payload auf, wird die Operation blockiert.

## Vue Proxy und Store Boundary

Vue-Proxies, Refs, Stores und Instanzobjekte duerfen die XTension-Grenze nicht verlassen. Der PoC diagnostiziert Payloads mit:

- `__v_isReactive`
- `__v_isReadonly`
- `__v_isRef`
- `__v_raw`
- `_isVue`
- `$el`
- `$data`
- `$props`
- `$refs`
- `$store`
- `vuexStore`
- `pinia`
- `piniaStore`
- `reactiveState`
- `globalProperties`
- `$patch`
- nicht serialisierbaren Werten wie Funktionen, Symbols, BigInts oder Zyklen

Downstream-Signale bleiben serialisierbare Records.

## Event Normalization

Vue-Events verlassen den HostController nur als normalisierte Fabric-kompatible Records:

- `schema: "xtend.xtensions.vue-normalized-event.v1"`
- `surfaceEventSchema: "xtend.xtensions.surface-event.v1"`
- `owner`
- `direction: "upstream"`
- `lane`
- `trustBoundary: "adapter-normalized"`
- Payload-Fingerprint
- Diagnostics

Es gibt keinen impliziten globalen Eventbus.

## Runtime Registry Integration

XTN-07 erzeugt einen XTN-05-kompatiblen Runtime Adapter Record:

- `framework: "vue"`
- `vue` als `external-peer`
- host-lokale Loading Policy
- Integrity-Fakten als Daten
- native Fallback Surface
- `vue.explicit-update-adapter` als Host-Capability

Die lokale Policy-Entscheidung kann `loaded`, `degraded`, `skipped`, `failed` oder `policy-blocked` reporten, ohne Vue auszufuehren.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `xtensions.vue_poc.framework_dependency` | Vue wurde als echte Dependency oder Import erkannt |
| `xtensions.vue_poc.proxy_leak` | Vue Proxy, Ref oder Instanzobjekt wurde uebergeben |
| `xtensions.vue_poc.store_leak` | Vuex-/Pinia-/Store-Objekt wurde uebergeben |
| `xtensions.vue_poc.non_serializable_payload` | Payload ist nicht serialisierbar |
| `xtensions.vue_poc.implicit_global_patch` | Update versucht implizites `globalProperties.$patch` oder keinen expliziten Adapter |
| `xtensions.vue_poc.event_payload_invalid` | Upstream-Event-Payload verletzt Payload-Regeln |
| `xtensions.vue_poc.not_mounted` | Lifecycle-Operation wurde vor Mount ausgefuehrt |
| `xtensions.vue_poc.already_destroyed` | Lifecycle-Operation wurde nach Destroy ausgefuehrt |

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js xtensions-vue-host-controller-poc --json
```

Der Gate prueft Contract, Typen, Fixture, Package-Export, Runner-Integration, Dependency-Boundary, Runtime-Registry-Integration, explizite Update-Adapter, Proxy-/Store-Leak-Guards, Event-Normalisierung, Cleanup und stabile Report-Serialisierung.
