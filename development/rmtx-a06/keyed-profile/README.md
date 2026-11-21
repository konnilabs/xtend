# A06.3.2 – Bedingungen, Wiederholungen und stabile typisierte Host-Schlüssel

**Statusfortschreibung vom 21. November 2026:** A06.3 ist im separaten Source4-Profil implementiert; native Views, Lifecycleoperationen und Katalogrollen sind in den getrennten Source5–8-Profilen implementiert. [A06.5](../project-tooling/implementation.md) ist implementiert und lokal geprüft. Die gemeinsame Ziel-/Releaseabnahme [A06.6](../release-acceptance/implementation.md) einschließlich der formalen Evidenzbindung bleibt offen. Der [zentrale Arbeitsstand](../../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) führt die heutige Reihenfolge; dieser Bericht beschreibt weiter den erhaltenen Source3-Vertrag.

**Historischer Teilabschluss:** Der folgende Bericht beschreibt das damalige Source3-Profil und dessen Modulstände. Die übrigen A06.3-Verträge sind inzwischen im separaten [Source4-Orchestrierungsprofil](../orchestration-profile/README.md) implementiert; Source3 behält seine ursprünglichen Grenzen. Die bytegleiche [Vorgängerfassung](README.before-a0633.md) bleibt erhalten.

Stand des Source3-Teilabschlusses: **17. November 2026**. Das explizite Syntaxprofil **3.0.0** ergänzt verschachtelte `RMT.Repeat`-Scopes, strikt boolesche `Surface.present`-Pfade und native Eventbedingungen mit `RMT.On`. Die bestehenden Profile 1 und 2 sowie der v1-Default bleiben erhalten. Die übrigen A06.3-Verträge sind inzwischen im getrennten Source4-Profil implementiert.

## Versionierte Verträge

| Einstieg | Neues Profil / API | Erhaltener Vertrag |
| --- | --- | --- |
| Parser, Compiler, Authoring | Capability-API **3.0.0** | v1-Default sowie vollständige v1/v2-Resultate und Factorymetadaten |
| Parser-/Compilerresultat | jeweils **v3**, Daten-API **3.0.0** | v1 und v2 bleiben getrennte diskriminierte Typen |
| Operatorvertrag | neuer **v2**-Katalog / API **2.0.0** für Syntax3, 16 Operatoren | Syntax1/2 liefern bytegleiche v1-Kataloge mit API1 |
| Host-Scope-Quelldeklaration | **`xtend.rmtx.host-scopes.v1`** | eigener Source-Vertrag, kein zusätzlicher Classic-AST-Knoten |
| Selector-Dependencies | **v2** für Syntax3 | unverändertes v1-Readset für Syntax2; weiter rein statisch |
| Gemeinsames Backend | Classic **4.4.0**, vNext **1.5.0** | 122-Knoten-AST, alte SourceProfile-/Factoryverträge und Wireformen |
| Maraca-Frontendanschluss | zusätzliche Capability **`MARACA_RMTX_HOST_SCOPE_API_VERSION: 1.0.0`** | vorhandene Buildplan-/Binding-/Komponentenformate |
| XTension-Materialisierung | Binding-Artefakt **v3**, Binding **v2**, Komponentenartefakt **v8** | bestehende Key-/Presence-/Lifecycleautorität |

`RMTX_PARSER_SCHEMA`, `RMTX_COMPILE_RESULT_SCHEMA`, `RMTX_SOURCE_PROFILE` und `RMTX_SYNTAX_VERSION` bezeichnen weiterhin den v1-Default. Die neuen v3-Konstanten und `RMTX_KEYED_SOURCE_PROFILE` sind getrennt. Auch der bisherige Operator-Katalogkonstantenname bezeichnet weiterhin v1; der neue Katalog hat `RMTX_OPERATOR_PROFILE_SCHEMA_V2`. Legacy-Attributtypen und der vollständige Authoring-Namespace für Syntax2 bleiben eigene Typen.

```js
const { createRmtxCompiler } = require('@ccslabs/xtend/rmt-language/rmtx-compiler');
const compiler = createRmtxCompiler({ syntaxVersion: '3.0.0' });
const result = compiler.compileSource({ text, filePath: 'app.rmtx' }, { xtensionBindings });
```

## Wiederholungen und Presence an XTension-Hosts

```tsx
import { RMT, model, item } from '@ccslabs/xtend/rmt-language/rmtx';

export default (
  <RMT.Program id="catalog">
    <RMT.State id="products" type="object" initial={{ groups: [] }} />
    <RMT.Repeat from={model.products.groups} keyBy={item.id}>
      <RMT.Repeat from={item.products} keyBy={item.id}>
        <RMT.Surface id="gallery-host" component="div" present={item.enabled}>
          <RMT.Lane name="visible"><RMT.Mount target="gallery" /></RMT.Lane>
        </RMT.Surface>
      </RMT.Repeat>
    </RMT.Repeat>
  </RMT.Program>
);
```

Dieses Beispiel benötigt ein passendes explizites Binding-Artefakt v3. Provider, Interfaces, Props und Intentfelder bleiben dort beziehungsweise im vorhandenen Komponentenmanifest deklariert. Das Profil führt keine vollständige Inline-Provider-/Props-Syntax ein.

- Die äußerste Quelle ist ein direkter `model`-Pfad; weitere Repeatquellen sind direkte Pfade des aktuellen `item`. State-Namen werden über den längsten deklarierten Symbolpräfix aufgelöst. Whole-State-Arrays sind möglich.
- `keyBy` ist immer ein expliziter nichtleerer `item`-Feldpfad. Freie Calls, `.map`, berechnete/optionale Pfade und Index-Fallbacks sind Fehler.
- Die bestehende Materialisierung akzeptiert sichere nichtleere ungepolsterte Strings oder nichtnegative SafeIntegers einschließlich `0`, jedoch kein `-0`. `1` und `"1"` bleiben verschieden. Gleiche Keys in unterschiedlichen Elternscopes bleiben getrennt; doppelte Geschwisterkeys sind Fehler.
- `present` ist ein direkter Model-/Item-Pfad auf einen **tatsächlichen Boolean**. Es ist keine Truthiness-Konvertierung und kein allgemeines Prädikatfeld. Ohne Repeat darf es nur auf `model` zeigen. Fehlende oder nichtboolesche Werte scheitern am bestehenden Bindingvertrag.
- Leere Kollektionen behalten ihre Deklarations-/Providerprüfung, materialisieren aber keine Hosts. Invalidierte Keys oder Presencewerte werden auch bei späteren Modeländerungen vom vorhandenen Materializer geprüft.

Der Parser liefert statische Surface-ASTs und die versionierte `parserResult.hostScopes`-Quelldeklaration. Der Compiler projiziert daraus `repeat`/`presence` in das **bestehende** Sidecar und lässt es vollständig validieren. Jede scoped Surface verlangt genau ein passendes Binding. Bereits vorhandene Sidecar-Scopes müssen inhaltlich übereinstimmen; Widersprüche werden abgewiesen. Eingaben werden dabei nicht mutiert und rohe numerische Werte nicht vor ihrer Prüfung umkloniert.

Maraca reparst für dieses ausdrücklich gewählte v3-Resultat die tatsächliche Quelldatei, projiziert die Scopes erneut aus dieser Quelle und revalidiert gegen das kompilierte Programm. Ein vom Compiler-Callback behaupteter Report oder ein umgeleitetes Sidecar erhält dadurch keine zusätzliche Autorität. Die vorhandene Instanzmaterialisierung, Kernel-/Fabric-Delegation und Surface-Ressourcenverwaltung bleiben zuständig.

`RMT.Repeat` ist hier ein **XTension-Host-Scope**, kein allgemeiner nativer DOM-Loop. Die nativen Repeat-/Key-AST-Klauseln allein erzeugen noch keine entsprechend typisierten DOM-Instanzen; sie werden hierfür nicht benutzt. Ein Repeat ohne geeignetes Binding scheitert vor dem Build.

## Ausführbare Eventbedingungen

```tsx
<RMT.Surface id="button-host" component="button">
  <RMT.On event="click" action="product.select"
    payload={{ productId: 'detail.productId' }}
    when={model.app.ready === true && !(model.app.blocked === true)} />
</RMT.Surface>
```

`On` richtet sich an die besitzende Surface. Das erforderliche nichtleere `payload`-Objekt bildet Actionfelder auf explizite sichere `detail`-/`target`-Pfadstrings ab. Es enthält weder Callbacks noch ausführbare Ausdrücke. Das v3-Frontend verlangt genau die deklarierten Actioninputnamen im Mapping; unbekannte, zusätzliche oder fehlende Felder sind Fehler. Actions ohne Input werden in diesem begrenzten nichtleeren Mappingprofil nicht geroutet. **Native Eventwerte erhalten dadurch noch keine allgemeine dynamische Actioninput-Typvalidierung.** Die vorhandene Native-Event-/Businessgrenze bleibt bestehen; `input id string` ist dort kein automatisch ausgeführter Payload-Typeguard. Validierung solcher fachlichen Werte muss der Businesspfad übernehmen. Dies ist getrennt von den bereits geschlossenen und dynamisch validierten Provider-Intent-Schemata. Provider-Intents wiederholter Hosts bleiben im vorhandenen validierten Intentkanal; native `On`-Bindings sind auf allen hier deklarierten Repeat-/Presence-Hosts gesperrt. Sie gehören auf gewöhnliche Owner-Surfaces; Providerinteraktion bleibt im geprüften Intentkanal.

`when` verwendet einen eigenen geschlossenen Conditionkontext: Boolean-Literale, direkte `model`-Pfade als Vergleichsoperanden, `===`/`!==`, Ordnungsvergleiche, boolesches `&&`/`||` und ausdrücklich geklammertes `!(Prädikat)`. Bare-path Truthiness, `item`, `input`, `params`, `selectors`, `contains` und freie Calls sind in diesem Kontext nicht freigegeben. Alle Modelreferenzen werden vor der Backend-Absenkung auf deklarierte States geprüft, einschließlich statisch kurzgeschlossener Zweige. Die inzwischen implementierte semantische Modellfeldprüfung aus A06.5 ist ein eigener Toolingvertrag und erweitert diese Source3-Ausdrucksgrammatik nicht.

Die bestehenden Eventguards lesen den lebenden Model-Snapshot und prüfen die Bedingung vor Payloadmapping und Commanddispatch. `Mount.when` wird in diesem Source3-Profil weiterhin **abgewiesen**. Die inzwischen implementierte native Admission-/Lifecycleausführung gehört zu den getrennten Source6-/Source7-Verträgen und erweitert Source3 nicht rückwirkend.

## Abnahme und verbleibender Umfang

Die echte [RMTX-Fixture](source.rmtx), der [reguläre Build](reference.cjs), der [Inspector](inspect.cjs) und der [Runtime-Runner](runtime-test.cjs) prüfen den Dateipfad bis zu sechs getrennten React-/Vue-Roots. Repeat und Presence stammen aus RMTX; das Eingabesidecar enthält diese Felder ausdrücklich noch nicht.

Neun echte Frameworkfälle prüfen typisierte Key-/Elternidentität, validierte Provider-Intents über Actions bis Model/XTend State, Reordering mit erhaltener DOM-Identität, gezielte Props-/Presenceänderungen, Reinkarnation mit gesperrten alten Callbacks, Keywechsel, gemeinsame Suspension/Resume, leere Kollektionen und Destroy. Die Referenz-Actions erfassen vertrauenswürdige Adresskeys in eigenen Modelzuständen; die kontrollierte Katalogaktualisierung erfolgt explizit über `catalog.replace`. Eine außerhalb dieses Source3-Profils liegende Datasource-/Effect-Syntax wird dafür nicht nachgebildet; Source4 beschreibt ihren eigenen späteren Operatorumfang.

[Statischer Nachweis](evidence.json), [Runtimebeleg](runtime-evidence.json) und [Ausführungs-/Regressionsnachweis](execution-evidence.json) binden Ergebnisse und Quellstand. Die neuen Source-/Typ-/Payload-/Negativprüfungen und der Inspector sind im Vorbereitungsgate enthalten; die native Frameworkabnahme ist im verpflichtenden Runtimegate und den drei GitHub-Reportpfaden registriert.

Für das v3-Quellprofil erklärt dieser datierte Teilabschluss keine eigene SSR-/Adoptionsabnahme. Die anschließend in Source4 implementierten Actioninput-, Effect-, Policy-, Props- und Inline-Providerverträge sowie die nativen Source5–8-Profile und A06.5 bleiben getrennte Verträge. Die gemeinsame Ziel-/Releaseabnahme ist [A06.6](../release-acceptance/implementation.md); beide 0.9-Features bleiben `preparing`.

Der frühere Docs-Suchindexfehler wurde bereits durch den [separaten Bugfix](../../docs-search-index-budget-fix.md) behoben. Historische A06.3.1-Berichte behalten ihre damals zutreffenden Budgetwarnungen; sie werden nicht auf diesen neuen Ausführungsstand umgeschrieben.
