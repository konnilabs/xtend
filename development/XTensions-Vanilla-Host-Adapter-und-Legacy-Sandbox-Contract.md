# XTensions Vanilla Host Adapter und Legacy Sandbox Contract

- Contract: `xtend.xtensions.vanilla-adapter.v1`
- DOM Boundary Record: `xtend.xtensions.dom-boundary.v1`
- Legacy Sandbox Record: `xtend.xtensions.legacy-sandbox-adapter.v1`
- Workpackage: `XTN-15`
- Lokaler Gate: `node scripts/run_xtend_tests.js xtensions-vanilla-host-controller xtensions-dom-boundary xtensions-legacy-sandbox-adapter --json`

## Zweck

Der Vanilla Host Adapter beschreibt einen frameworkneutralen XTension-Adapter fuer kleine Vanilla.js Widgets und fuer kooperative Fremdframework-Wrapper. Er benutzt weiterhin den allgemeinen HostController-Vertrag mit `mount`, `update`, `suspend`, `resume`, `reportError` und `unmount`.

## Boundaries

- `shadow-root` ist nur eine kooperative DOM- und Style-Grenze. Der Contract behauptet im Same-Realm-Modus keine harte Security.
- `iframe-sandbox` ist die einzige zugelassene Boundary fuer Legacy-Code mit globalen DOM-Schreibzugriffen, globalem CSS, `window.onload`-Hooks oder navigierenden Anchor-Handlern.
- Legacy-Sandboxen nutzen `sandbox="allow-scripts"` ohne `allow-same-origin`, ohne Top-Navigation, ohne Popups und ohne Forms.
- Kommunikation zwischen Legacy-iframe und Shell laeuft nur ueber eine serialisierbare `postMessage`-Allowlist.
- Boundary-Verletzungen degradieren die betroffene XTension; die Shell bleibt lauffaehig.

## Manifest-Erweiterung

XTension-Manifeste duerfen ein `isolation`-Objekt deklarieren:

```json
{
  "runtimeClass": "legacy-global-dom",
  "domBoundary": "iframe-sandbox",
  "styleBoundary": "iframe",
  "trustBoundary": "sandboxed-adapter",
  "mutationPolicy": "blocked-by-iframe",
  "sandbox": ["allow-scripts"]
}
```

Lokale Legacy-Testartefakte werden mit `classification: "legacy-local-artifact"` modelliert. Diese Klassifikation ist nur zulaessig, wenn `domBoundary` auf `iframe-sandbox` und `trustBoundary` auf `sandboxed-adapter` steht. Sie darf keine Framework-Runtime als XTend-Paket-Dependency einschleusen.

## Nicht-Ziele

- Keine iWebKit- oder sonstige Legacy-Dependency im Upstream-Paket.
- Keine Same-Realm-Sicherheitsgarantie fuer fremden Code.
- Kein Monkey Patching globaler Shell-Dokumente durch XTensions.
- Kein zweiter Lifecycle-Vertrag neben HostController.

## Gates

- `node scripts/run_xtend_tests.js xtensions-vanilla-host-controller --json`
- `node scripts/run_xtend_tests.js xtensions-dom-boundary --json`
- `node scripts/run_xtend_tests.js xtensions-legacy-sandbox-adapter --json`
- `node scripts/run_xtend_tests.js xtensions-security-integrity-gate maraca-xtensions --json`
