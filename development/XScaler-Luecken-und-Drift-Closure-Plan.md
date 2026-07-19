# XScaler Luecken und Drift Closure Plan

- Status: `implemented-public-runtime-closure`
- Datum: 2026-07-18
- Scope: kanonischer XScaler-Vertrag, Public Package API, Remote-Adapter-Lifecycle, AppService-Transport, PHP-Paritaet, Node/PHP-SSR-Hydration-Paritaet und harte Drift-Gates

## Ziel

XScaler wird intern kanonisiert, ohne den RMT-Kernel in Remote-Code-Ausfuehrung zu ziehen. Preflight bleibt eine Daten- und Policy-Entscheidung; ATC bleibt Handoff- und Lifecycle-Vertrag. Drifts werden direkt ueber lokale und CI/CD-Gates blockiert.

## Umsetzungspunkte

- Internes Contract-Modul `tools/rmt-language/xscaler-protocol.js` mit Typen, Schema-Konstanten, Factories und Preflight-Evaluator.
- Kanonische Preflight-Response-Shape: `accepted` ist fuehrend, `ok` bleibt Compatibility-Alias und muss identisch sein.
- Negative Fixtures fuer origin blocked, integrity missing, SSR network denied, fallback missing, XTension denied und capability mismatch.
- Testbench-Schemas werden auf die kanonische XScaler-Familie zurueckgefuehrt.
- XSurface Shard importiert die öffentliche XScaler-ATC-Konstante und Factory, emittiert den vollständigen kanonischen `XScalerAtcHandoff` mit `protocol: xscaler` und leitet seinen Handoff-Typ direkt aus `XScalerAtcHandoff` ab.
- Neues `xscaler-source-to-sea` Gate prueft Remote Manifest -> XScaler Preflight -> XSurface ATC Handoff -> Testbench-Evidence.
- PR- und Release-Gates fuehren XScaler Protocol und Source-to-Sea blockierend aus.

## Public Runtime Closure XMS-09/XMS-10

Die zweite Closure-Welle hebt XScaler aus dem internen Tooling-Vertrag auf eine paketierte, typisierte und browser-native Runtime-Oberflaeche. Der RMT-Kernel bleibt dabei weiterhin frei von Remote-Code-Ausfuehrung; externe Ausfuehrung findet nur im host-kontrollierten Remote-Surface-Adapter statt.

- `xscaler/index.js` und `xscaler/index.mjs` bilden die CommonJS-/ESM-Fassade; `xscaler/index.d.ts` ist der kanonische TypeScript-Vertrag.
- `xscaler/protocol`, `xscaler/remote-adapter-loader` und `xscaler/app-service-transport` sind stabile, separat importierbare Subpaths.
- `xscaler/schemas/*` publiziert die Draft-2020-12-Vertraege als Asset-Subpath. `xscaler/xscaler-preflight.php` liegt im Pack Root, bleibt aber bewusst ausserhalb der JavaScript-Exports.
- `xscaler/generate-esm.js --check` verhindert Drift zwischen den kanonischen Quellen und den browser-nativen ESM-Ausgaben. Das Root-ESM laesst sich ohne CommonJS-Plugin durch Rollup verarbeiten.
- Der Remote-Adapter-Loader akzeptiert nur externe HTTPS-Modulskripte mit gueltigem SRI, CSP-kompatiblen Attributen und expliziter Loader-Attestierung. `eval`, `new Function`, Blob-/Data-Module und Kernel-Remote-Execution bleiben ausgeschlossen.
- Preflight-Ablehnung, Integritaetsfehler, unsichere Loader und Session-Konflikte garantieren Null-Import und Null-Adapter-Ausfuehrung mit erhaltenem Host-Fallback.
- ATC `attach`, `invoke`/`stream`, `detach`, `cancel` und `dispose` sind race-stabil. Abort wird auf `cancel`, natuerlicher Abschluss auf `detach` abgebildet.
- Der XScaler-AppService-Transport implementiert die Maraca-Transportform und routet ausschliesslich `remote-surface`; lokale und serverseitige AppServices umgehen XScaler ohne Remote-Load.
- Der standalone PHP-Evaluator liefert fuer Acceptance und alle kanonischen Rejection-Codes byte-stabile JSON-Paritaet zur JavaScript-Preflight-Entscheidung.
- `rmt-xscaler-ssr-hydration-parity` beweist denselben versionierten `xtend.xscaler.ssr-hydration.v1`-Vertrag in Node und PHP. Accepted und valide rejected Preflights bleiben `preflight-only`; gefaelschte Protokolle, widerspruechliche ATC-/Rejection-Zustaende und `networkDuringRender=true` blockieren beide SSR-Pfade. Kein Host-Fetch und keine Remote-Modulausfuehrung sind erlaubt.

## Package- und Gate-Verdrahtung

| Surface | Export / Gate | Drift-Schutz |
| --- | --- | --- |
| Public API | `@ccslabs/xtend/xscaler` | `types`, `browser`/`import`, `require` und `default` sind explizit |
| Protocol | `@ccslabs/xtend/xscaler/protocol` | CJS-/ESM-Output-Paritaet und starke Deklarationen |
| Loader | `@ccslabs/xtend/xscaler/remote-adapter-loader` | CSP-, SRI-, Lifecycle- und Zero-Load-Gates |
| AppServices | `@ccslabs/xtend/xscaler/app-service-transport` | Maraca-Registry-Integration, Invoke/Stream/Abort |
| Schemas | `@ccslabs/xtend/xscaler/schemas/*` | JSON-Schema-2020-12- und Fixture-Validierung |
| PHP | Pack Root `xscaler/xscaler-preflight.php` | Syntax- und byte-stabile JS/PHP-Paritaet |
| SSR Hydration | Node-/PHP-RMT-Adapter | Hydration-Shape-, Head-Hint-, Diagnose- und Zero-Network-Paritaet |

Die Root-`files`, der Epic-13-Package-Export-Lock und TypeExports klassifizieren `xscaler` als eigene Surface Group. Die gleichzeitig eingefuehrten Maraca-AppServices-Subpaths sind im selben Lock-Update enthalten, damit kein bereits vorhandener Public Export als unerwarteter Drift verbleibt.

Blockierende Gate-IDs:

- `xscaler-protocol`
- `xscaler-public-api`
- `xscaler-php-preflight-parity`
- `rmt-xscaler-ssr-hydration-parity`
- `xscaler-source-to-sea`
- `xsurface-shard`

`test:pr`, `test:release:full`, die `ciGateMatrix`, die Release-Gates und die Default-/Nightly-Workflows fuehren Public API, PHP-Preflight-Paritaet und Node/PHP-SSR-Hydration-Paritaet mit eigenen JSON-Reports. Der Package-Dry-Run muss CJS, ESM, Deklarationen, Schemas und den standalone PHP-Evaluator im Root-Archiv nachweisen.

## Acceptance

- `npm run test:xscaler-protocol` prueft Modul, Typen, Fixtures, Docs, Testbench-Drift und CI-Registrierung.
- `npm run test:xscaler-source-to-sea` prueft den deterministischen End-to-End-Vertrag ohne Browserpflicht.
- `npm run test:xscaler-public-api` prueft Package-Exports, native ESM-Paritaet, pluginfreies Bundling, CSP/SRI, Lifecycle und Maraca-AppService-Routing.
- `npm run test:xscaler-php-preflight-parity` prueft PHP-Syntax und alle byte-stabilen JS/PHP-Entscheidungsfaelle.
- `npm run test:rmt-xscaler-ssr-hydration-parity` prueft identische Node/PHP-Hydration, blockierende Network-Diagnostik und Null-Fetch/Null-Remote-Ausfuehrung waehrend SSR.
- `npm run test:xsurface-shard` bestaetigt ATC-Kompatibilitaet und Kernel-No-Remote-Execution.
- `node scripts/run_xtend_tests.js type-exports epic13-package-export-lock --json` bestaetigt eine vollstaendig klassifizierte und gepackte Public Surface.
- `npm run pack:dry-run` enthaelt den vollstaendigen `xscaler` Pack Root einschliesslich `.js`, `.mjs`, `.d.ts`, JSON-Schemas und PHP-Evaluator.
- Alte Testbench-Schema-Strings fuer `protocol-lazy-preflight` und `atc-lazy-surface` duerfen nicht mehr vorkommen.
