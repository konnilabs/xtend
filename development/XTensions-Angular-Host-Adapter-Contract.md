# XTensions Angular Host Adapter Contract

- Contract: `xtend.xtensions.angular-adapter.v1`
- Zone Boundary: `xtend.xtensions.angular-zone-boundary.v1`
- Workpackage: `XTN-17`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-angular-host-controller xtensions-angular-zone-boundary --json`

## Ziel

Angular kann als produktlokale XTension in einen host-owned Container gemountet werden, ohne Angular als XTend-Root-Dependency, Workspace-Dependency oder CDN-Runtime einzufuehren. Upstream bleibt frameworkfrei und beschreibt nur Vertrag, Boundary, Manifest-Policy und Lifecycle-Gates.

## Runtime Boundary

- Angular-XTensions nutzen den normalen HostController-Vertrag: `mount`, `update`, `suspend`, `resume`, `reportError`, `unmount`, `snapshot`.
- Der produktlokale Build muss AOT erzeugen. JIT und Runtime-`@angular/compiler` sind policy-blocked, damit Hosts keine `unsafe-eval`-CSP-Lockerung brauchen.
- Same-Realm Angular ist eine kooperative Integration: `domBoundary` ist `host-owned-container`, `styleBoundary` ist `host-css-owned`, harte Security-Isolation wird nicht behauptet.
- Change Detection laeuft ueber zoneless Signals oder eine aequivalente host-gesteuerte Update-Grenze. `update()` schreibt nur in das Angular-Modell und darf andere Surfaces nicht remounten.
- `unmount()` muss die Angular ApplicationRef/ComponentRef zerstoeren und den Host-Container freigeben.

## Manifest Policy

- Zulaessige produktlokale Runtime-Abhaengigkeiten: `@angular/core`, `@angular/common`, `@angular/platform-browser`, `rxjs`.
- Zulaessige produktlokale Build-Abhaengigkeiten: `@angular/compiler`, `@angular/compiler-cli`, `typescript`.
- Runtime-Manifeste deklarieren `product-local-bundled`, `remoteArtifactsAllowed: false`, SHA-256-Integritaet und `buildMode: "aot"`.
- CDN-URLs, Remote-Loader und Runtime-Compiler-Imports degradieren oder blockieren die XTension, nicht die gesamte Shell.

## Gates

```bash
node scripts/run_xtend_tests.js xtensions-angular-host-controller xtensions-angular-zone-boundary --json
node scripts/run_xtend_tests.js xtensions-angular-host-controller xtensions-angular-zone-boundary maraca-xtensions xtensions-security-integrity-gate --json
```

## Akzeptanz

- Upstream importiert kein Angular.
- Der Security-Gate akzeptiert produktlokal gebuendelte Angular-Manifeste mit AOT-Boundary.
- Der Stub-Controller beweist Mount, Update, Suspend, Resume, Error und Destroy-Cleanup ohne Framework-Runtime.
