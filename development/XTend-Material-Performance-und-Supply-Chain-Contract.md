# XTend Material Performance und Supply-Chain Contract

Status: `accepted`  
Ticket: `XTM-11`  
Report: `xtend.material.performance-report.v1`

## Qualitätsziel

Dieser Contract haertet die erlebte Qualitaet von XTend Material gegen CSS-Wachstum, versteckte Runtime-Kosten, Build-Drift und Integrationen ausserhalb der oeffentlichen XTend-Vertraege. Budgets sind blockierende Produktgrenzen und keine unverbindlichen Telemetrieziele.

## Fixture-basierte Budgets

Die Grenzwerte wurden aus den Referenz-Apps `utility-app` und `enterprise-workspace` abgeleitet und mit bewusstem, kleinem Umgebungspuffer eingefroren:

| Signal | Blockierender Grenzwert |
|---|---:|
| CSS raw | 16 KiB je Referenz-App |
| CSS gzip | 4 KiB je Referenz-App |
| Cold Build | 1500 ms |
| Incremental Build | 500 ms |
| Tailwind Runtime | 0 Bytes |
| Unused Recipe Ratio Utility App | 82 % |
| Unused Recipe Ratio Enterprise Workspace | 55 % |

Die Recipe Ratio ist eine transparente Inventur des vollstaendigen semantischen Kit-Fallbacks. Sie darf nicht durch freie Utility-Klassen oder eine zweite Stylesheet-Wahrheit kaschiert werden. Eine spaetere Budget-Aenderung benoetigt neue Mess-Evidence und Review.

## Anti-Monkeypatching

`xtend.material.quality-policy.v1` erlaubt ausschliesslich oeffentliche XTend-, Component-, RMT- und Maraca-Contracts. Blockiert werden insbesondere:

- Mutationen von Plattform-, Component- oder Registry-Prototypen;
- Ersatz von `customElements`-Methoden;
- Zugriff auf private Shadow Roots;
- ungepruefte HTML-Sinks und globale Runtime-Style-Injection;
- Tailwind-Imports im Browser Runtime Graph;
- Writes in Component-, RMT- oder Provider-Ownership-Bereiche waehrend des Builds;
- automatische Source Discovery, Remote Sources und unkontrollierte Plugins.

Die negativen Fixtures sind Teil des Gates. Eine Regel gilt nur dann als aktiv, wenn die zugehoerige Verletzung nachweislich blockiert wird.

## Reproduzierbarkeit und Cleanup

Jede Referenz-App wird zweimal mit identischen Inputs gebaut. CSS-Inhalt und Output-Fingerprint muessen byte-identisch sein. Der Adapter bleibt memory-only; `dispose()` muss null Temp-Dateien und null persistente Cache-Eintraege reporten. Das Gate prueft ausserdem, dass Business-/Component-/RMT-Dateien durch den Build nicht veraendert werden.

## Supply Chain und Package Surface

Der Report fuehrt Adapter-, Tailwind- und Node-API-Version, Lockfile-Hash, npm Integrity, Lizenz und Provenance. `@xtend-material/core` und `@xtend-material/maraca-tailwind` werden lokal gegen ihre expliziten `files`-Contracts geprueft: jede deklarierte Datei muss existieren, verbotene Pfade duerfen nicht Teil der Paketoberflaeche sein. Tests, Development-Artefakte, Build-Caches und Node Modules sind im Paket blockiert; der Gate benoetigt weder einen npm-Subprozess noch Netzwerkzugriff.

## Provider Exit

Der Tailwind Adapter ist austauschbar. Der Exit-Test baut die semantischen `xtm-*` Styles ueber `maraca-native`, ohne Tailwind-Import und ohne Aenderung der RMT Business Records. Ein Fehlschlag blockiert den Fast Path.

## Gate

```bash
node scripts/run_xtend_tests.js xtend-material-performance maraca-size-budget supply-chain pack-dry-run --json
```

Mit bestandenem Gate ist `XTM-12` fuer das Catfooding einer nicht-kritischen XTend-nahen Maraca App startbar.
