# XScaler Implementierungsstand Bestandsaufnahme

- Status: `inventory`
- Datum: 2026-07-07
- Zweck: Arbeitsgrundlage fuer gezielte XScaler-Weiterentwicklung
- Scope: Protokoll, Fixtures, Test-Gates, Demo-Integration, angrenzende Remote-Surface- und ATC-Pfade

## Kurzfazit

XScaler ist in der Codebase aktuell als Protokoll- und Gate-Schicht vorhanden, nicht als eigenstaendiges Runtime- oder Package-Modul. Die kanonische Definition liegt in Docs und Fixtures. Ein lokales Gate prueft Schema-Namen, Fixture-Kohaerenz, Docs-Anker und Runner-/Package-/Workflow-Registrierung. Eine produktnahe Demo nutzt XScaler-Preflight bereits praktisch fuer Lazy-Surface-Navigation. XSurface Shard liefert ausserdem XScaler-ATC-kompatible Handoff-Records.

Der RMT-Kernel und die Surface-Runtime besitzen starke Remote-Surface-, Policy-, Trust- und Event-Governance-Faehigkeiten. Sie nennen XScaler aber nicht direkt. Die Grenze ist derzeit bewusst: XScaler prueft und orchestriert vor beziehungsweise neben der Runtime; der RMT-Kernel fuehrt keinen Remote-Code aus.

## Reifegrad

| Bereich | Stand | Bewertung |
| --- | --- | --- |
| Protokolldokumentation | `docs/en/xscaler-protocol.md`, `docs/de/xscaler-protocol.md` | vorhanden, aber knapp |
| Schema-Familie | vier Fixture-Schemas unter `tests/rmt/fixtures/xscaler/` | benannt und gatebar, keine separaten JSON-Schema-Dateien |
| Preflight-Gate | `tests/rmt/xscaler_protocol_suite.js` | vorhanden, prueft Docs, Fixtures, Registrierung |
| CI/Release-Verdrahtung | `package.json`, `.github/workflows/xtend-default-gates.yml` | vorhanden |
| Demo-Preflight | `products/rmt-animation-testbench/...` | praktisch implementiert, aber mit eigener Shape |
| ATC-Handoff | `xsurface-shard/index.js`, `xsurface-shard/index.d.ts` | XScaler-kompatibel markiert, kein gemeinsames XScaler-ATC-Modul |
| Kernel-Integration | `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-core.esm.js` | Remote-Surface-Policy vorhanden, keine `xscaler`-API |
| Typed Public API | keine dedizierte XScaler `.d.ts` oder Package-Export | offen |

## Beteilige Dateien

### Kanonisches XScaler-Protokoll

| Datei | Rolle |
| --- | --- |
| `docs/en/xscaler-protocol.md` | Englische Protokollbeschreibung: Preflight, ATC, Schemas, SSR, XTensions |
| `docs/de/xscaler-protocol.md` | Deutsche Protokollbeschreibung |
| `docs/menu.json` | Doc-Menue-Eintrag `xscaler-protocol` unter Remote Surfaces |
| `docs/en/rmt-reference-remote-surfaces.md` | Querverweis auf XScaler als Preflight fuer Remote Surfaces |
| `docs/de/rmt-reference-remote-surfaces.md` | Deutscher Querverweis |
| `docs/en/rmt-node-ssr-adapter.md` | SSR-Kompatibilitaet verweist auf XScaler |
| `docs/de/rmt-php-ssr-adapter.md` | SSR-Kompatibilitaet verweist auf XScaler |
| `docs/de/xtensions-authoring-guide.md` | XTensions Deployment Gate ueber XScaler |
| `docs/en/rmt-vnext-remote-surfaces.md`, `docs/de/rmt-vnext-remote-surfaces.md` | Remote-Surface-Architektur trennt XScaler Preflight und ATC |
| `docs/en/xtend-maraca-orchestration.md`, `docs/de/xtend-maraca-orchestration.md` | Maraca verarbeitet nur bereits akzeptierte Streams/Plans |

### Fixtures und Gate

| Datei | Rolle |
| --- | --- |
| `tests/rmt/fixtures/xscaler/xscaler-preflight-request.json` | Host-Capability-Request mit `remote-surface-plan`, `ssr-compatible`, `xtension-deployment` |
| `tests/rmt/fixtures/xscaler/xscaler-preflight-response.json` | Accepted-Response mit SSR-/Remote-Surface-/XTension-Kompatibilitaet |
| `tests/rmt/fixtures/xscaler/xscaler-remote-surface-plan.json` | Remote-Surface-Plan mit Owner, Origin, Integrity, Fallback, Lane, SSR-Policy |
| `tests/rmt/fixtures/xscaler/xscaler-xtension-deployment.json` | Gated XTension Deployment mit Rollout und SSR-Hydration |
| `tests/rmt/xscaler_protocol_suite.js` | Validiert Fixture-Schemas, Request/Response-Korrelation, SSR-No-Network, Docs-Anker, Package/Workflow-Registrierung |
| `scripts/run_xtend_tests.js` | Registriert Suite-ID `xscaler-protocol` |
| `package.json` | Scripts `test:xscaler-protocol`, `test:xscaler-protocol:report`, Release-Gate-Eintrag |
| `.github/workflows/xtend-default-gates.yml` | Fuehrt XScaler Protocol Gate in Default Gates aus |

### Demo- und Produktnahe Integration

| Datei | Rolle |
| --- | --- |
| `products/rmt-animation-testbench/src/shared/testbench-data.mjs` | Definiert die produktnahe XScaler-Preflight-/ATC-Shape und `createXScalerPreflight()` |
| `products/rmt-animation-testbench/server/index.mjs` | Endpoint `/api/xscaler/preflight`, Lazy-Surface-Endpoint fuegt Preflight-Evidence bei |
| `products/rmt-animation-testbench/src/client/testbench-controller.mjs` | `ensureSurface()` ruft Preflight vor Lazy-Surface-Load ab und blockt bei `ok !== true` oder `networkDuringRender !== false` |
| `products/rmt-animation-testbench/scripts/verify.mjs` | Verifiziert Preflight, `networkDuringRender: false`, ATC-Shape und Lazy-Surface-Evidence |
| `products/rmt-animation-testbench/scripts/browser-smoke.mjs` | Erwartet beobachtete XScaler-Preflight-Counts im Browser-Smoke |
| `products/rmt-animation-testbench/README.md` | Nennt XScaler v1 Protocol Lazy Preflight |
| `products/rmt-animation-testbench/src/assets/motion-map.svg` | Visualisiert XScaler Preflight im Testbench-Asset |

### Angrenzende Remote-Surface- und ATC-Pfade

| Datei | Rolle |
| --- | --- |
| `tools/rmt-language/vnext-remote-manifest.js` | Erstellt `xtend.rmt.vnext-remote-surface.v1` Records und Manifeste; Runtime Boundary setzt `kernelRemoteExecution: false` |
| `tools/rmt-language/vnext-remote-compiler.js` | Leitet Remote-Manifeste aus Core-Remote-Surface-Records ab |
| `tools/rmt-language/vnext-enterprise-registry.js` | Normalisiert Remote-Manifeste fuer Enterprise Surface Registry |
| `tests/rmt-language/rmt_vnext_remote_manifest_suite.js` | Testet Remote-Surface-Pflichtfakten und Kernel-No-Remote-Execution |
| `xtendrmt/rmt-runtime.esm.js` | Remote-Surface-Policy-Bridge: `applyRemoteSurfacePolicy`, `registerRemoteSurface`, `governRemoteSurfaceEvent` |
| `xtendrmt/rmt-core.esm.js` | Gleicher Remote-Surface-Policy-Pfad im Core-Bundle |
| `xsurface-shard/index.js` | Server-seitige Shard-Orchestration und ATC-kompatibles Handoff |
| `xsurface-shard/index.d.ts` | Typisiert `atc.protocol: "xscaler-atc-compatible"` |
| `xsurface-shard/README.md` | Beschreibt XScaler-ATC-kompatible Handoff-Records und No-Remote-Execution-Boundary |
| `tests/xsurface/xsurface_shard_suite.js` | Gate fuer Shard-Plan, Lifecycle, ATC-Handoff und Package-Export |

## Aktueller Implementierungsstand

### 1. Protokoll ist dokumentiert

XScaler ist als oeffentlicher Preflight-Vertrag beschrieben. Die Docs trennen klar:

- `XScaler Preflight`: statische Accept/Reject-Entscheidung vor Remote Bundle, SSR-Adapter-Erweiterung oder XTension-Code.
- `XScaler ATC`: Runtime-Flight-Session nach akzeptiertem Preflight, inklusive Handoff, Lifecycle, Fallback und Diagnostics.

Die Docs betonen, dass Maraca, XSurface Shard, RMT Kernel und Fabric nachgelagerte Schichten bleiben. Der Kernel fuehrt weiterhin keinen privaten Remote-Code aus.

### 2. Schema-Familie existiert als Fixtures

Die kanonische XScaler-Fixture-Familie umfasst:

| Schema | Fixture |
| --- | --- |
| `xtend.xscaler.preflight-request.v1` | `xscaler-preflight-request.json` |
| `xtend.xscaler.preflight-response.v1` | `xscaler-preflight-response.json` |
| `xtend.xscaler.remote-surface-plan.v1` | `xscaler-remote-surface-plan.json` |
| `xtend.xscaler.xtension-deployment.v1` | `xscaler-xtension-deployment.json` |

Es gibt aktuell keine separaten JSON-Schema-Dateien fuer XScaler. Die Schemas sind durch Fixture-Shape, Docs und Tests abgesichert.

### 3. Gate ist lokal und in CI verdrahtet

`tests/rmt/xscaler_protocol_suite.js` prueft:

- alle vier Fixture-Dateien existieren
- jedes Fixture deklariert das erwartete Schema und `protocol: "xscaler"`
- Request und Response teilen dieselbe `requestId`
- Request fordert Remote-Surface-Plan, SSR-Kompatibilitaet und XTension-Deployment an
- Response markiert SSR als compatible
- Remote-Surface-Plan setzt `ssr.networkDuringRender: false`
- Deployment hydriert nach Preflight und benoetigt kein DOM im SSR-Pfad
- englische und deutsche Docs nennen die Schemas und erwarteten Anker
- Docs-Menue, Runner, Package Script, Release Gates und Workflow sind verdrahtet

Lokale Befehle:

```bash
npm run test:xscaler-protocol
npm run test:xscaler-protocol:report
```

### 4. Testbench nutzt Preflight praktisch

Die RMT Animation Testbench hat einen funktionalen XScaler-Pfad:

- Server liefert `/api/xscaler/preflight`.
- `createXScalerPreflight(surfaceId, reason)` gibt eine akzeptierte Preflight-Antwort mit `networkDuringRender: false`, Cache-Key und ATC-Block zurueck.
- Client ruft Preflight in `ensureSurface()` vor dem Lazy-Surface-Request ab.
- Browser-Smoke zaehlt beobachtete Preflight-Aufrufe.
- Verify-Script prueft Preflight, ATC-Mode `protocol-lazy` und Lazy-Surface-Evidence.

Das ist der konkreteste laufende XScaler-Use-Case in der Codebase.

### 5. XSurface Shard ist ATC-kompatibel

`xsurface-shard` ist eine eigene Serverbibliothek fuer Remote-Surface-Sharding. Sie konsumiert Remote-Surface-, Registry-, Degradation- und Security-Reports, partitioniert akzeptierte Surfaces und liefert Handoff-Records mit:

```json
{
  "atc": {
    "protocol": "xscaler-atc-compatible"
  }
}
```

Wichtig: XSurface Shard ist kompatibel zu XScaler ATC, aber nicht die XScaler-ATC-Referenzimplementierung selbst. Die gemeinsame ATC-Contract-Schicht fehlt noch.

### 6. RMT Remote-Surface-Runtime ist vorhanden, aber XScaler-neutral

`xtendrmt/rmt-runtime.esm.js` und `xtendrmt/rmt-core.esm.js` enthalten Remote-Surface-Policy-Bridges:

- `applyRemoteSurfacePolicy()`
- `registerRemoteSurface()`
- `governRemoteSurfaceEvent()`

Diese Pfade normalisieren Remote-Surface-Records, delegieren an `x-surface-manager` und schreiben Diagnostics fuer blockierte oder degradierte Remote Surfaces. Die Metadaten setzen `remoteRuntimeExecution: false`.

Ein direkter `xscaler`-Import, Export oder String existiert in `xtendrmt/` derzeit nicht. XScaler sitzt damit ausserhalb des Kernels und nutzt angrenzende Remote-Surface-Fakten.

## Auffaellige Drifts und Luecken

| Thema | Beobachtung | Risiko |
| --- | --- | --- |
| Response-Shape | Fixture nutzt `accepted: true`, Testbench nutzt `ok: true` | Consumer koennen unterschiedliche Preflight-Responses erwarten |
| Schema-Familien | Kanonische Fixtures und Testbench muessen dieselbe `xtend.xscaler.*.v1` Schema-Familie nutzen | Demo-Schemas koennen sonst am XScaler-Gate vorbeidriften |
| Keine Schema-Dateien | `rg --files` zeigt keine dedizierten XScaler JSON-Schemas ausser Fixtures | Validierung bleibt implizit und testgetrieben |
| Kein Preflight-Evaluator | Es gibt keine Funktion, die Request, Remote-Surface-Manifest, Security, Degradation, Host-Capabilities und Policy zu einer Response auswertet | Aktuell kein echter Accept/Reject-Pfad ausser Demo-Stub |
| Keine Negative Fixtures | Fixture-Familie beschreibt nur akzeptierten Happy Path | Ablehnungsgruende, Diagnostics und Fallback-Anker sind nicht stabilisiert |
| Kein gemeinsamer ATC-Contract | XSurface Shard markiert Kompatibilitaet, Testbench hat eigene ATC-Shape | Session-, Lifecycle- und Handoff-Semantik koennen auseinanderlaufen |
| Keine Public API | Kein `xscaler/` Package, kein Root-Export, keine `.d.ts` fuer XScaler | Externe Nutzung ist nur ueber Docs/Fixtures moeglich |
| CI-Abdeckung begrenzt | Gate prueft Docs/Fixtures/Registrierung, nicht Runtime-End-to-End von Manifest zu Preflight zu ATC-Handoff | Integrationsdrift bleibt moeglich |

## Anschlussfaehige Architekturentscheidung

Der vorhandene Remote-Surface-Stack sollte nicht neu gebaut werden. XScaler kann als duenne Orchestrierungs- und Contract-Schicht auf diesen vorhandenen Fakten aufsetzen:

- Remote Surface Manifest: `tools/rmt-language/vnext-remote-manifest.js`
- Enterprise Surface Registry: `tools/rmt-language/vnext-enterprise-registry.js`
- Remote Security und Degradation Reports: bestehende Epic-16-Pfade
- SurfaceManager Policy Bridge: `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-core.esm.js`
- XSurface Shard Handoff: `xsurface-shard/index.js`
- Testbench als browsernahes Proving Ground

Die Kernregel bleibt: XScaler darf Remote-Code nicht im RMT-Kernel ausfuehren. Preflight ist eine Daten- und Policy-Entscheidung; ATC orchestriert Handoff und Lifecycle.

## Empfohlene naechste Ausbauschritte

1. Kanonisches XScaler-Contract-Modul anlegen, zum Beispiel `tools/rmt-language/xscaler-protocol.js`, mit Factories fuer Request, Response, Remote-Surface-Plan und XTension-Deployment.
2. Response-Shape normalisieren: entweder `accepted` als kanonisches Feld behalten und `ok` ableiten, oder `ok` kanonisieren und Fixture/Docs migrieren.
3. Negative Fixtures ergaenzen: origin blocked, integrity missing, SSR network denied, fallback missing, XTension denied, capability mismatch.
4. Preflight-Evaluator bauen: Input sind Host-Capabilities, Remote-Surface-Manifest, Remote-Security-Report, Degradation-Report, optional Enterprise Registry.
5. Testbench auf das kanonische Modul umstellen, damit Demo-Schemas nicht neben den Gate-Schemas driften.
6. ATC-Contract konkretisieren: Session-ID, handoff signal, lifecycle state, fallback activation, cancel/detach semantics, diagnostics.
7. XSurface Shard an den gemeinsamen ATC-Contract ankoppeln, statt nur `xscaler-atc-compatible` als String zu tragen.
8. Public API und Types definieren, falls XScaler extern nutzbar werden soll: Package Export, `.d.ts`, Root Package Export Lock, Test-Gate.
9. End-to-End-Gate ergaenzen: Remote Manifest -> XScaler Preflight -> XSurface ATC Handoff -> Lazy Surface/Fragment Evidence.

## Verifikationsmatrix fuer den naechsten Schritt

| Ziel | Bestehender Befehl | Erwartung |
| --- | --- | --- |
| XScaler Protocol Gate | `npm run test:xscaler-protocol` | Docs/Fixtures/Registrierung bleiben gruen |
| XSurface ATC-Handoff | `npm run test:xsurface-shard` | ATC-kompatibles Handoff bleibt stabil |
| Remote-Surface Manifest | `node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json` | Manifest-Fakten und Kernel-Boundary bleiben stabil |
| Testbench Verify | `npm --workspace products/rmt-animation-testbench run verify` | Preflight, ATC-Shape und Lazy-Surface-Evidence bleiben browsernah pruefbar |

## Arbeitsnotiz

Fuer gezielte Weiterentwicklung sollte der naechste Schritt nicht mit Runtime-Code in `xtendrmt/` beginnen. Der bessere Hebel ist zuerst ein kanonischer XScaler-Contract/Evaluator, der die vorhandenen Remote-Surface-Fakten auswertet und danach Testbench und XSurface Shard vereinheitlicht. Erst wenn diese Shape stabil ist, lohnt sich eine oeffentliche API oder tiefere Runtime-Anbindung.
