# XTensions OpenUI5 Host Adapter Contract

Contract: `xtend.xtensions.openui5-adapter.v1`

Workpackage: `XTN-16`

## Ziel

Der OpenUI5 Host Adapter beschreibt, wie klassische OpenUI5/SAP-UI5-artige Controls als opt-in XTension in eine XTend/Maraca-Shell eingebunden werden koennen, ohne OpenUI5 in das XTend-Root-Paket oder den Core-Kernel zu vendorn.

## Boundaries

- OpenUI5 wird nur als produktlokale Dependency eines konkreten Products installiert.
- SAPUI5/OpenUI5-CDNs und remote Loader sind fuer diesen Contract policy-blocked.
- Same-Realm OpenUI5 ist eine kooperative Integration in einem host-owned Container und keine harte Security-Isolation.
- UI5-Control-Trees muessen beim `unmount` zerstoert werden.
- Updates sollen ueber UI5 `JSONModel`/Model-SetData erfolgen, nicht ueber Re-Mounts.
- SSR liefert einen nativen RMT-Fallback-Slot; der echte UI5-Control-Tree mountet lazy nach Resume.

## Capabilities

- `openui5.loader.lazy`
- `openui5.control.lifecycle`
- `openui5.model.json`
- `dom.boundary.host-owned-container`
- `style.boundary.global-theme-managed`

## Dependency Policy

OpenUI5-Pakete duerfen in Product-Manifests als `product-local-bundled` deklariert werden, wenn:

- `bundled: true`
- `packageIncluded: true`
- `security.remoteArtifactsAllowed: false`
- `policy.dependencyBoundary: "product-local-framework-dependencies"`

Diese Ausnahme gilt nicht fuer das XTend-Root-Paket und nicht fuer remote/CDN-Artefakte.

## Gates

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js xtensions-openui5-host-controller xtensions-openui5-loader-boundary --json
```

Erweiterter Gate mit Manifest und Security:

```bash
node scripts/run_xtend_tests.js xtensions-openui5-host-controller xtensions-openui5-loader-boundary maraca-xtensions xtensions-security-integrity-gate --json
```
