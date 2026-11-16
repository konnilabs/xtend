# A06.2 – Produktiver RMTX-Frontendeinstieg

Stand: **16. November 2026**. Das erste geschlossene produktive Syntaxprofil **1.0.0** ist implementiert. Es parst `.rmtx` als TSX, senkt direkt in den validierten gemeinsamen Classic-AST ab und nutzt dieselbe semantische Prüfung und Artefaktgenerierung. Es erzeugt keinen Classic-Quelltext und führt weder Quellimporte noch Templateausdrücke als JavaScript aus.

Die [Syntaxentscheidung](../syntax-decision.md) bleibt verbindlich. Dieses Profil implementiert einen begrenzten Teil davon. Der [zentrale Arbeitsplan](../../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) führt A06.3–A06.6 für den Sprach-/UI-/Toolingausbau und die vollständige 0.9-Abnahme weiter. Beide Features bleiben `preparing`.

## Öffentliche Einstiege und Versionen

Die folgenden Subpfade stehen sowohl unter `@ccslabs/xtend` als auch unter `@ccslabs/xtend-compiler` zur Verfügung:

| Subpfad | Vertrag |
| --- | --- |
| `rmt-language/rmtx-parser` | `parseRmtxSource`, Parser-API **1.0.0**, eigenständiges Parserresultat **v1** |
| `rmt-language/rmtx-compiler` | `compileRmtxSource`, `createRmtxCompiler`, Compiler-API **1.0.0**, eigenständiges Compilerresultat **v1** |
| `rmt-language/rmtx` | Statische Authoringmarker `RMT`, `model`, `input`; kein JSX-Runtimehost |

Beide Resultate tragen `sourceProfile: { syntax: 'rmtx', version: '1.0.0' }`. Die Option `syntaxVersion` akzeptiert nur `1.0.0`; unbekannte Versionen werden diagnostiziert. Als Quelldokument sind Text, Dateipfad/URI und Dokumentversion möglich. Eine Quelle ohne Dateipfad und URI erhält eine `untitled:`-URI. Ein ausdrücklich angegebener Dateipfad muss `.rmtx` verwenden. Eine Stringeingabe ist ebenfalls möglich.

Der gemeinsame Backend-Eingang wurde um **`compileRmtClassicAstResult()`** und **`compileRmtVNextAstResult()`** ergänzt. Die Modul-APIs steigen dafür auf **4.2.0 / 1.3.0**. Die freien Funktionen liefern das vollständige Ergebnis der bestehenden geprüften Pipeline; die bisherigen Factorymethoden und der Core-only-Rückgabevertrag der alten AST-Einstiege bleiben erhalten. Nur der neue Eingang akzeptiert das geschlossene RMTX-Quellprofil. Vorhandene AST-/Core-Wireformen werden nicht umgedeutet.

RMTX-Herkunft wird vor der Serialisierung in Core-Manifest, AppPlatform und Orchestrierung übernommen. Quellbereiche beziehen sich auf den ursprünglichen `.rmtx`-Text mit den UTF-16-Offsets der Tooling-API. Fehler aus dem gemeinsamen Backend behalten ihre fachlichen Codes und erhalten RMTX als Diagnosesource. Fehlerhafte Resultate enthalten keine ausführbaren Core-/Orchestrierungsartefakte.

TypeScript **5.9.3** ist eine explizite gepinnte Parser-Laufzeitabhängigkeit der Pakete. Frameworks werden dadurch nicht zu Compilerabhängigkeiten. Der Aufruf einer Authoring-Operatorfunktion ohne vorherige RMTX-Kompilierung schlägt ausdrücklich fehl.

Der tatsächliche Compiler-Tarball wurde zusammen mit seinem bereits deklarierten Maraca-Peer geprüft. Das bisherige Backend lädt dessen FastPass-Vertrag beim Modulimport; ein eigenständiges Compilerpaket ohne diesen optional deklarierten Peer gehört deshalb nicht zum hier abgenommenen Profil. Die Paketprüfung verwendet drei wirkliche Tarballs und keine nachgebauten Peerdateien.

## Geschlossene Quellstruktur

```tsx
import { RMT, input } from '@ccslabs/xtend/rmt-language/rmtx';

export default (
  <RMT.Program id="product.details">
    <RMT.State id="product" type="object" preserve initial={{ title: 'old' }} />
    <RMT.Action id="product.rename">
      <RMT.Input name="title" type="string" />
      <RMT.Reduce state="product" path="title" value={input.title} />
    </RMT.Action>
    <RMT.Portal id="root" root="#app" layer="surface" />
    <RMT.Surface id="panel" kind="region" component="section" portal="root">
      <RMT.Lane name="visible"><RMT.Mount target="panel" /></RMT.Lane>
    </RMT.Surface>
  </RMT.Program>
);
```

Es gibt genau einen Default-Export mit `RMT.Program`. Darüber hinaus sind ausschließlich benannte Importe aus einem der beiden öffentlichen RMTX-Authoringmodule erlaubt. Importaliase werden tatsächlich auf diese Bindungen aufgelöst; ein frei erfundenes gleichnamiges Objekt oder ein Import aus einem anderen Modul erhält keine Operatoridentität. Default-/Namespace-/Type-only-Importe, frei ausführbare Deklarationen, Funktionen und zusätzliche Statements gehören nicht zu diesem Profil.

| Operator | Attribute | Zulässige Kinder |
| --- | --- | --- |
| `Program` | `id` erforderlich; bildet den Classic-Templatenamen | `State`, `Action`, `Portal`, `Surface` |
| `State` | `id`, `type`, `initial` erforderlich; `preserve` optional und boolesch | keine |
| `Action` | `id` erforderlich | `Input`, `Reduce` |
| `Input` | `name`, `type` erforderlich | keine |
| `Reduce` | `state`, `value` erforderlich; `path` optional | keine |
| `Portal` | `id` erforderlich; `root`, `layer` optional nach Backendvertrag | keine |
| `Surface` | `id` erforderlich; `kind`, `component`, `portal` optional | `Lane` |
| `Lane` | `name` erforderlich | `Mount` |
| `Mount` | `target` erforderlich | keine |

Unbekannte oder doppelte Attribute, Spreadattribute, JSX-Typargumente, unzulässige Kindkontexte und unbekannte Operatoren sind Fehler. Die erste Profilversion benutzt ausdrücklich `Lane`-/`Mount`-Kinder; Surface-Kurzattribute `lane`/`mount` sind nicht eingeführt. Ein `component`-Attribut benutzt den vorhandenen Backend-/Rendervertrag und führt kein freies natives JSX-UI-Profil ein.

Symbol-/Pfadsegmente sind im ersten Profil ASCII-Identifier mit optionalen Bindestrichen; qualifizierte Namen werden durch Punkte getrennt. Unsichere Prototypsegmente sind gesperrt. Die Prüfung von Typen, Referenzen, Identitätskollisionen und ausführbaren Zielprofilen übernimmt zusätzlich das gemeinsame Backend.

## Literale und Ausdrücke

State-Initialwerte sind statische JSON-Literale: endliche Zahlen, Strings, Boolesche Werte, `null`, dichte Arrays und explizite Objektfelder. Doppelte/unsichere Schlüssel, Shorthand, Spreads, Methoden, Getter und berechnete Felder werden abgewiesen. JSX-Stringattribute unterstützen die fünf XML-Grundentities und gültige numerische Unicode-Entities; andere benannte Entities verlangen eine ausdrückliche Stringexpression. JavaScript-Stringliterale in `{ ... }` behalten ihre String-Escapes.

Reducer akzeptieren skalare Literale oder direkte Punktepfade des importierten `model` beziehungsweise `input`. `model` wird auf den bestehenden `state`-Namensraum abgebildet. Der Compiler erhält Literal-/Referenzherkunft: `value="input.title"` ist ein Stringliteral, `value={input.title}` eine Referenz. Dynamische Computed-/Optionalpfade, Calls, Operatorausdrücke, Funktionen, dynamische Imports und frei ausführbares TypeScript werden abgewiesen. Allgemeine Prop-Ausdrucksprojektionen, Selektoren und weitere Operatorfamilien folgen A06.3.

Die Quelle ist auf 1 MiB UTF-8 begrenzt; Literal-/Operatorverschachtelungen auf 64 Ebenen und erzeugte deklarative Knoten auf 50.000. Diese Grenzen definieren keinen universellen Timeout für beliebige Compilerarbeit.

## Maraca und XTensions 2.0

Der vorhandene explizite Compilerport ist der produktive Anschluss:

```js
const { compileRmtxSource } = require('@ccslabs/xtend/rmt-language/rmtx-compiler');
const { createMaracaBuildPlan } = require('@ccslabs/xtend/maraca');

const plan = createMaracaBuildPlan({
  source: 'app.rmtx',
  orchestration: 'strict',
  // xtensionBindings und xtensionComposition bleiben die bestehenden,
  // unabhängig validierten Sidecar-/Providerverträge.
}, { rootDir: process.cwd(), compileSource: compileRmtxSource });
```

Auch Source-Text plus `virtualSourcePath` funktioniert. Maraca bewahrt das RMTX-Resultschema beim zusätzlichen Bindingabgleich. Der reguläre asynchrone Build und der erzeugte Browser-Boot verwenden die bestehenden Provider-/Kernel-/Fabric-/Surfacepfade.

Die [RMTX-Referenz](two-host.rmtx) und ihr [Classic-Gegenstück](two-host.rmt) beschreiben dieselben States, Actions und Surfaces. Der neue [Runtime-Runner](runtime-test.cjs) baut tatsächlich die `.rmtx`-Datei über diesen Compilerport und die automatische Komponentenkomposition. Er verwendet die vorhandenen unabhängig erfassten Providerinterfaces und validierten Binding-Sidecars. Die unveränderte reale React-/Vue-Abnahmesuite prüft Kernel/Fabric, Events/Model/XTend State, gemeinsame Owner, getrennte Renderziele, Close/Resume, Presence/Reinkarnation, ungültige Props/Payloads und Cleanup/Cancellation.

Inline-`RMT.XTension`-Deklarationen, automatische `.rmtx`-Discovery im Classic-CLI, gemischte Importgraphen, Native-UI-/Slotgrammatik, neue Editorsemantik, MCP-Quellrouting und ein neuer installierter VSIX sind damit noch nicht eingeführt. Sie bleiben den nachfolgenden Abschnitten zugeordnet. Der vorhandene native Header-/Lifecyclefall bleibt ein separater Regressionsanker; seine fallspezifische Headerabsenkung wird erst in A06.4 durch das allgemeine UI-Profil ersetzt.

## Prüfung und Nachweise

```sh
node --test tests/rmt-language/backend-ast-result.test.cjs \
  tests/rmt-language/rmtx-frontend.test.cjs \
  tests/rmt-language/rmtx-maraca-integration.test.cjs
node development/rmtx-a06/frontend/inspect.cjs --check
XTENSIONS_TEST_PEERS=/pfad/zum/harness node development/rmtx-a06/frontend/runtime-test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/frontend/runtime-test.cjs --browser
npm run check:release-preparation
```

Die Node-Vertrags-, echten Tarball-/Typ- und Inspectorprüfungen sind blockierend im Vorbereitungsgate. Die neue Runtimeabnahme ist im verpflichtenden XTensions-Runtimegate und den zugehörigen CI-Reportpfaden eingetragen; fehlende Peers oder Browser dürfen nicht als erfolgreicher Skip zählen.

[Der statische Nachweis](evidence.json) ist reproduzierbar aus dem Inspector erzeugt. [Der Ausführungsnachweis](execution-evidence.json) bindet die tatsächlich ausgeführten unterstützten Node-/Browserläufe und die geprüften Quellen. Eine grüne Referenz oder ein Inspectorlauf allein setzt keinen der beiden 0.9-Featurestatus auf releasebereit.

Ein separater Docs-Suchindexfehler besteht bereits im Ausgangsstand: Der unveränderte DE-Fulltextproducer erzeugt dort **155.634** gzip-Bytes bei **153.600** erlaubten Bytes; mit den vier aktualisierten öffentlichen Seiten sind es **155.993** Bytes. Die Indexregeneration bleibt deshalb blockiert. Vorbereitungsgate, RMTX-Abnahmen, AI-Kit, MCP-Knowledge und öffentliche Inhaltsprüfung bestehen; eine vollständig grüne Repository-CI wird daraus nicht abgeleitet. Budget, Suchinhalt und Ranking wurden nicht verändert. Der Ausführungsbeleg enthält die isolierte Baseline-Reproduktion und die geprüften Kompressionsvarianten; die Behebung bleibt ein eigener Docs-Suchindexabschnitt.
