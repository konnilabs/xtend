# Maraca AppServices und TypeScript

Maraca AppServices verbinden deklarative RMT-Actions mit lokaler Browserlogik oder einem bestehenden Node-/PHP-Backend. Die App benötigt dafür weder einen eigenen Maraca-Bootstrap noch DOM-Wiring, `dataSourceAdapters`, `hostServiceAdapters` oder interne `window.__XTend*`-Handles.

## App erzeugen

Der provider-neutrale Einstieg verwendet freies CSS:

```sh
xt create app --runtime maraca --design-kit none --server both --out my-app --write
cd my-app
npm install
npm run build
```

`--design-kit material` legt das XTM-/Tailwind-Overlay auf denselben RMT-/TypeScript-Service-Basis-Scaffold. `--server` akzeptiert `none`, `node`, `php` oder `both`.

Die wesentlichen Quellen sind:

- `src/app.rmt`: Shell, Zustände, Actions, Service-ID, Modus und Contract
- `src/services.ts`: lokale Browserhandler und serverseitig gebundene Proxies
- `src/server-services.ts`: optionale Node-Implementierungen
- `server/server-services.php`: optionale PHP-/Laravel-Callables
- `src/app.css`: freies CSS oder der ausgewählte Design-Kit-Input

Ein Build erzeugt `xtend.maraca.mjs`, CSS, `xtend.maraca.services.json` und `xtend.maraca.services.d.ts`. Bei aktivierten Node-/PHP-Zielen kommen das importierbare Node-ESM-Bundle beziehungsweise der PHP-Validierungsreport hinzu.

Die Servicekonfiguration bleibt klein und explizit:

```json
{
  "services": {
    "clientEntry": "src/services.ts",
    "serverEntry": "src/server-services.ts",
    "phpEntry": "server/server-services.php",
    "targets": ["browser", "node", "php"],
    "strict": true,
    "budgets": { "clientBytes": 12000, "serverBytes": 30000 },
    "transport": { "kind": "http-ndjson", "basePath": "/api/xtend/services" }
  }
}
```

Fehlen alle Servicequellen oder ist `services: false` gesetzt, bleibt der bisherige Maraca-Buildpfad aktiv.

Der generierte Befehl `npm run tune` schreibt die gewählte Konfiguration mit `--write` zurück in dieselbe `maraca.config.json`, die `plan` und `build` verwenden. Dabei bleiben insbesondere Serviceziele, `strict` und CSS-/XTM-Eingaben erhalten; der nächste normale Build konsumiert die abgestimmten Config- und Servicegraph-Fingerprints.

## Service in RMT deklarieren

```rmt
datasource orders.search from host orders.search {
  mode invoke
  contract "acme.orders.search.v1"
}

action orders.runSearch {
  input query string {
    trust boundary "xtend.security.sanitizing-boundary.v1"
    sanitize text
  }
  effect fetch datasource orders.search
}
```

RMT bleibt die Source of Truth für ID, `invoke`/`stream`, Contract und aufrufende Actions. Der Compiler schreibt daraus ein Bedarfsmanifest. Nicht auflösbare Payloads bleiben in den generierten Deklarationen `unknown`; App-Code kann sie mit Service-Generics konkretisieren.

Der optionale Input-Policy-Block gehört ebenfalls ausschließlich RMT. `sanitize text` akzeptiert nur Strings, normalisiert CRLF zu LF und weist NUL sowie andere unzulässige Steuerzeichen zurück. Eine unvollständige Policy, eine unbekannte Boundary, ein anderes Sanitize-Format oder widersprüchliche Policies desselben Servicefelds stoppen den Build mit Source-Range. Bei servergerichteten Services prüft die Browser-Registry vor dem Transport; `createNodeAppServiceHost({ services, manifest })` prüft denselben Input vor dem Handler erneut. Der Handler erhält das redigierte Ergebnis als `executionContext.inputPolicyVerdict`; `registry.listInputPolicyVerdicts()` und die Registry-Historie liefern dieselbe Evidence ohne Rohinput.

## Browser- und Serverdefinitionen

```ts
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';

export default defineAppServices({
  'preferences.load': service<{ userId: string }, { theme: string }>({
    kind: 'query',
    target: 'local',
    async invoke(input, { signal }) {
      signal.throwIfAborted();
      return { theme: localStorage.getItem(`theme:${input.userId}`) ?? 'system' };
    }
  }),
  'orders.search': service({
    kind: 'query',
    target: 'server'
  })
});
```

```ts
import { defineServerServices, service } from '@ccslabs/xtend-maraca/server-services';

export default defineServerServices({
  'orders.search': service({
    kind: 'query',
    async invoke(input, { signal, correlationId }) {
      signal.throwIfAborted();
      return existingOrdersBackend.search(input, { signal, correlationId });
    }
  })
});
```

`query` verwendet standardmäßig `latest`, `command` verwendet `serial`, `stream` verwendet `latest`. `parallel` muss explizit gesetzt werden. Abbruchsignale, monotone Invocation-/Correlation-IDs, veraltete Commit-Unterdrückung, Stream-Deduplizierung und genau ein Terminalframe (`complete`, `error` oder `cancelled`) werden von der Registry verwaltet. Automatische Retries gibt es nicht.

## Backend anbinden

Der Browser sendet JSON beziehungsweise NDJSON standardmäßig per `POST /api/xtend/services/:serviceId`. URL, Header, Auth-Kontext und Routing bleiben Eigentum des Hosts.

Für eine vorhandene HTTP-Schicht importiert Node `dist/server/xtend.maraca.services.mjs` und übergibt die Definition an `createNodeAppServiceHost({ services })` aus `@ccslabs/xtend-maraca/node-app-service-host`. Diese Low-Level-API öffnet keinen Port.

CLI-generierte Node-Apps verwenden stattdessen den expliziten Einstieg `server/index.mjs`. Er ruft `listenNodeAppHost(...)` aus `@ccslabs/xtend-maraca/node-app-host` auf, lädt das generierte Service-Manifest, liefert ausschließlich freigegebene Browserartefakte aus und delegiert `/api/xtend/services/:serviceId` an denselben Low-Level-Host. Source Maps, TypeScript-Quellen und -Deklarationen, Server-/Testverzeichnisse sowie Build-/Size-Reports werden auch unterhalb eines freigegebenen Verzeichnisses verweigert. Die generierten `start`- und `serve`-Abläufe bauen beide zuerst und führen danach ausschließlich diesen Host aus. Standard ist `127.0.0.1:4173`; `XTEND_MARACA_HOST` und `XTEND_MARACA_PORT` sind die einzigen generierten Bind-Overrides, wobei Port `0` für Tests erlaubt ist. Beim Start wird genau eine JSON-Zeile mit Schema `xtend.maraca.node-app-host-startup.v1` und `origin` geschrieben. `SIGINT` und `SIGTERM` schließen HTTP und AppServices gemeinsam. Das ist ein ausdrücklich gestarteter Deployment-Host, kein implizites Maraca-Core-Listening und kein produktlokaler Controller.

PHP lädt den Paketexport `@ccslabs/xtend-rmt/php-app-service-adapter.php`, übergibt dasselbe JSON-Manifest und die Callable-Registry an `createRmtPhpAppServiceAdapter(...)` und bindet `handleHttpRequest(...)` in die vorhandene Laravel-/PHP-Route ein. PHP führt kein TypeScript aus.

## Strict-Diagnosen und Kompatibilität

`services.strict: true` blockiert fehlende IDs, Modusfehler, Client-/Server-Kollisionen, fehlende Zielimplementierungen sowie serverseitige Abhängigkeiten und Host-Environment-Zugriffe im gesamten auflösbaren Browsergraph. Dazu gehören `node:`-/Server-Entry-Imports sowie `process.env`, `Deno.env`, `Bun.env` und `import.meta.env`. Öffentliche Konfiguration wird stattdessen explizit vom App-Host übergeben. Zusätzliche Handler sind Warnungen. Projekte ohne Service-Dateien behalten das bisherige Buildverhalten.

Bestehende manuelle Adapter bleiben im Compatibility-Modus verwendbar. Bei einer Kollision gewinnt der explizite Boot-Adapter mit Warnung; im Strict-Modus ist dieselbe Kollision ein Fehler.

## XScaler

`target: 'remote-surface'` ist ausschließlich für XScaler-Surface-/XTension-Adapter vorgesehen. Der XScaler-Transport führt Preflight vor jedem Remote-Code aus, prüft Origin und SRI und aktiviert bei Ablehnung den deklarierten Surface-Fallback. Normale lokale und HTTP-AppServices durchlaufen keinen XScaler-Preflight. SSR validiert nur den Vertrag und führt weder Netzwerkzugriffe noch Remote-Module aus.

Der öffentliche Einstieg ist `@ccslabs/xtend/xscaler`; der Adapter für die Registry ist `createXScalerAppServiceTransport(...)`. Ein abgelehnter Preflight oder eine fehlerhafte Integrität beendet den Pfad vor Import und Ausführung des Remote-Moduls. `dispose` bricht aktive ATC-/Servicearbeit ab und verhindert weitere Operationen.

## Diagnose

Prüfe zuerst `dist/xtend.maraca.services.json` und `dist/xtend.maraca.report.json`. TypeScript-Diagnosen enthalten Datei, Zeile und Spalte; RMT-Diagnosen zeigen auf die deklarierende Source Range. Ein Secret aus `server-services.ts` oder PHP darf nie im Browserbundle, in Client-Sourcemaps oder Reports erscheinen.

| Code | Bedeutung und Abhilfe |
| --- | --- |
| `xtend.maraca.services.missing_client_binding` | Eine RMT-Service-ID fehlt in `services.ts`. |
| `xtend.maraca.services.mode_mismatch` | `invoke`/`stream` in RMT und `query|command|stream` in TypeScript passen nicht zusammen. |
| `xtend.maraca.services.missing_node_implementation` / `missing_php_implementation` | Für ein aktiviertes Serverziel fehlt der Handler. |
| `xtend.maraca.services.target_collision` | Ein lokaler Service besitzt zugleich eine Serverimplementierung. |
| `xtend.maraca.services.node_import_in_browser` / `server_import_in_browser` | Der Browsergraph referenziert Servercode. |
| `xtend.maraca.services.environment_access_in_browser` | Browsercode liest eine nicht freigegebene Host-Environment-API. Übergib öffentliche Konfiguration explizit. |
| `xtend.maraca.services.input_policy_invalid` / `input_policy_conflict` | Die RMT-Input-Policy ist unbekannt, unvollständig oder zwischen Actions widersprüchlich. |
| `xtend.maraca.services.typescript_<code>` | Vollständige TypeScript-Programmdiagnose; Datei, Zeile und Spalte stehen im Report. |
| `xtend.maraca.app-service.stale` / `cancelled` / `timeout` | Die Registry hat einen überholten, abgebrochenen oder zeitüberschrittenen Lauf beendet. |
| `xtend.maraca.app-service.stream_protocol` | Sequenz, Duplikat oder Terminalzustand verletzt den NDJSON-Streamvertrag. |
| `xtend.maraca.app-service.input_policy_blocked` / `input_policy_mismatch` | Browser oder Server hat AppService-Input vor Handler/Transport abgewiesen. Verdict und Fehlerdetails enthalten keinen Rohinput. |
| `xtend.maraca.app_services.manual_adapter_collision` | Ein Legacy-Boot-Adapter kollidiert mit der generierten Registry; Strict macht daraus einen Fehler. |

Siehe auch [XTend Maraca](./xtend-maraca.md), [Maraca-Orchestrierung](./xtend-maraca-orchestration.md) und [RMT Actions und Events](./learn-rmt-actions-events.md).

## Requestbezogene Laravel-Bridge und progressive Controls

`Ccslabs\XTend\AppServiceHost` verbindet ein vorgebautes AppService-Manifest mit einer PHP-Callable-Registry und dem aktuellen Laravel-Request. Die Web-Route behält Session und CSRF. Handler erhalten den Request als `context["laravelRequest"]`; RMT-Input-Policies werden vor dem Handler ausgeführt. Laravel-Validierungsfehler werden als HTTP 422 mit Feldfehlern und Error-Bag an die RMT-Validation-Group zurückgegeben. Eine negative Prüfung wird nicht als erfolgreicher Aufruf gemeldet.

Mit `viewTemplate.progressive: true` verwenden unterstützte XTend-Formcontrols eine native SSR-Projektion und werden anschließend vom gemeinsamen Renderer adoptiert. Unterstützt sind Input, Button, Form, Select, Textarea, Checkbox und Radio. Native Namen, Labels, Wertbindungen und Validitätsmeldungen bleiben erhalten. Die deklarierte Komponentenidentität steht in `data-xtend-component`; es entsteht kein zweites Control.

`@ccslabs/xtend/maraca/remote-surface` verbindet deklarierte RMT-Zustände mit einem XScaler-Plan. Ein separat gebauter Adapter wird erst nach Preflight, Integritätsprüfung und ATC-Attach geladen. PHP verwendet `XScalerPhpFragmentAdapter` aus dem gebauten Laravel-Paket. Er akzeptiert Daten für explizit freigegebene Zustandsziele, erhält Fehler und liefert nach Cleanup genau einen Terminalzustand. Host und I/O müssen die 30-Sekunden-Deadline beachten; Cleanup hat höchstens fünf Sekunden. Remote-Code wird nicht im RMT-Kernel ausgeführt.
