# ADR XMS-001 – Maraca AppServices als kanonische Shell-/Backend-Grenze

- Status: Accepted for MVP
- Datum: 18. Juli 2026
- Initiative: XMS-00
- Bezugsdokumente: `development/BACKLOG-XTend-Maraca-App-Services-und-TypeScript-DX.md`, `development/ADR-XTendRMT-First-Class-Fusion.md`, `development/ADR-XTend-Security-Trust-Boundaries.md`

## Kontext und Baseline

Vor XMS verdrahten größere Maraca-Produkte RMT-Host-Datasources über produktindividuelle Adapter. Die XTend-LLM-Baseline bestand aus einem 1.507 Zeilen großen Renderer-Controller, einem Switch mit 27 Host-Datasource-Fällen, manuellem `bootXtendMaraca({ dataSourceAdapters })`, eigener Run-/Stream-Korrelation und Zugriffen auf interne `window.__XTend*`-Handles. Diese Konstruktion dupliziert Lifecycle-, Concurrency- und Fehlerlogik und erschwert statische Ziel- und Secret-Prüfungen.

Die DX-Zielwerte sind:

- null produktseitige Boot-/DOM-/Adapterverdrahtung für neu generierte Apps;
- eine RMT-Deklaration plus genau eine Serviceimplementierung pro benötigtem Ziel;
- ein Buildbefehl für Browser, Node, Manifest und PHP-Validierung;
- quellgenaue Fehler vor der Bundle-Erzeugung;
- null Serverquelltext oder Secret-Werte in Browserartefakten und Reports.

## Entscheidung

Maraca AppServices werden die kanonische Grenze zwischen RMT-Shell und imperativer Geschäftslogik. Der RMT-Compiler beschreibt den Bedarf, `src/services.ts` bindet Browser- und Proxy-Services, und zielseparate Implementierungen leben in `src/server-services.ts` beziehungsweise `server/server-services.php`.

Es gelten drei bewusst getrennte Deploymentklassen:

| Klasse | Ziel | Transport/Policy | Eigentümer |
| --- | --- | --- | --- |
| In-Process AppService | `local` | direkte Registry, kein Preflight | App/Maraca |
| Backend AppService | `server` | versioniertes JSON/NDJSON, kein XScaler | App-Backend |
| Remote Surface Adapter | `remote-surface` | XScaler-Preflight, Origin, SRI, CSP und ATC | Surface Host/XScaler |

Ein lokaler oder normaler HTTP-Service darf niemals durch Remote-Surface-Preflight laufen. Umgekehrt darf Remote-Code erst nach akzeptiertem XScaler-Preflight und erfolgreicher Integritätsprüfung geladen werden.

## Verträge

- Das RMT-Bedarfsmanifest heißt `xtend.maraca.app-service-demands.v1`.
- Das vereinigte Manifest heißt `xtend.maraca.app-services-manifest.v1`.
- Deklarative Eingabegrenzen verwenden `xtend.maraca.app-service-input-policy.v1`; RMT ist dafür die einzige Source of Truth.
- Öffentliche APIs sind `defineAppServices`, `defineServerServices`, `service`, `createHttpAppServiceTransport`, `createNodeAppServiceHost` sowie der explizite Deployment-Host `createNodeAppHost`/`listenNodeAppHost`.
- Query und Stream verwenden standardmäßig `latest`, Command verwendet `serial`; `parallel` ist opt-in.
- Jede Ausführung erhält monotone Invocation-/Correlation-IDs und ein `AbortSignal`.
- Es gibt keine impliziten Retries.
- Eine deklarierte Text-Policy wird im Browser vor dem Transport und im Node-Host vor der Serviceausführung unabhängig geprüft. Das redigierte `inputPolicyVerdict` ist ExecutionContext- und Registry-Evidence; Rohinput ist kein Bestandteil des Verdicts.
- Authentifizierung, Datenzugriff und Deploymentkonfiguration bleiben außerhalb des Maraca-Kerns. Der optionale Node-App-Host stellt ausschließlich die standardisierte AppService-Route und freigegebene statische Dateien bereit.

## Buildentscheidung

Der Produktionsprovider verwendet ein vollständiges TypeScript-Programm für Diagnostik und anschließend den bestehenden Rollup-/Terser-Pfad. Browser- und Node-Graph werden getrennt geplant und gebaut. Die Providergrenze lautet `inspect → plan → build → report → dispose`.

Vite ist kein zweiter Produktionsbundler. Eine spätere Integration darf ausschließlich Dev-Server/HMR hinter derselben Providergrenze liefern und muss die Stage-A-Floor Node 24 sowie identische Strict-/Security-Diagnostik nachweisen.

## Kompatibilität

Projekte ohne Servicequellen behalten das bisherige Buildverhalten. Bestehende explizite Boot-Adapter bleiben in einem Compatibility-Modus nutzbar und gewinnen bei Kollisionen mit Warnung. Im Strict-Modus ist dieselbe Boot-Kollision ein Fehler. Neue Scaffolds verwenden ausschließlich die Service-Registry.

## Konsequenzen

- Service-IDs und Modi werden statisch zwischen RMT, Browser, Node und PHP abgeglichen.
- App-Code kann bekannte RMT-Eingabeshapes übernehmen und unbekannte Payloads über Generics konkretisieren; `any` ist kein Fallback.
- Zentraler Abort, Stale-Commit-Schutz und Stream-Terminalregeln ersetzen produktindividuelle Race-Logik.
- Maraca wird dadurch nicht zum Backend-Framework und öffnet im Core nie implizit einen Server. Nur der CLI-generierte, ausdrücklich gestartete Node-App-Host lauscht auf einem Port; Produktlogik bleibt vollständig in AppServices.
- XScaler bleibt first-class, aber auf Remote-Surface-Adapter begrenzt.

## Abnahme

Die Entscheidung gilt nur als releasefähig, wenn AppService-Runtime, TypeScript-Build, Node/PHP-Parität, Browser Source-to-Sea, XScaler Zero-Import-on-Reject, Legacy-Kompatibilität und XTend-LLM-Catfood gemeinsam grün sind. Ein ungeprüfter Dynamic-Import-Fallback ist kein zulässiger Ersatz für XScaler-Evidenz.
