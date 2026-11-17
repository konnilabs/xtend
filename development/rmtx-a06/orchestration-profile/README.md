# A06.3 – geschlossener Operator-, Ausdrucks- und Komponentenvertrag

Stand: **17. November 2026**. Das explizite Syntaxprofil **4.0.0** ergänzt die verbliebenen A06.3-Verträge: weitere Actions/Effects und Policies, ausführbare Actioninput-Prüfung sowie Inline-XTensions mit providerseitigen Schnittstellen und geschlossenen Props-Projektionen. Die bisherigen Profile **1/2/3** und der **v1-Default** bleiben erhalten. Natives UI und native DOM-Loops gehören weiterhin zu A06.4, semantische Projekt-/Editorintegration zu A06.5 und die gemeinsame Ziel-/Releaseabnahme zu A06.6.

## Einstieg und Versionsgrenzen

```js
const { createRmtxCompiler } = require('@ccslabs/xtend/rmt-language/rmtx-compiler');
const compiler = createRmtxCompiler({ syntaxVersion: '4.0.0' });
```

Dateien behalten **`.rmtx`**. TSX liefert die Grammatik, RMT die Operatorsemantik. Die Quelle wird statisch in den bestehenden **122-Knoten-Classic-AST v1** abgesenkt; sie wird nicht als React-/JavaScriptprogramm ausgeführt. Es gibt keinen Raw-AST-, Token-, Callback- oder Classic-Text-Escape.

| Vertrag | Neues Profil | Bestehende Grenze |
| --- | --- | --- |
| Parser / Compiler / Authoring | Modul-API **4.0.0**, Parser-/Compilerresultat **v4** | vollständige Ergebnisse und Factories für 1/2/3; Default 1 |
| Operatorkatalog | Schema **v3**, API **3.0.0**, Syntax **4.0.0**, **110 Tags** | Kataloge für Syntax1/2/3 unverändert |
| Backend | Classic **4.5.0**, vNext **1.6.0** | unveränderter formaler AST v1 |
| Source-Metadaten | Host-Scopes **v2**, Components **v1**, Actioninput-Regeln **v1** | Host-Scopes v1 bleibt ausschließlich Source3 |
| Abhängigkeiten | Selectorreport **v3**, Komponentenreport **v1** | statische Zusammenfassungen, keine zusätzliche Runtimeautorität |
| Actions / native Events | Orchestration **v2**, Actionplan **v2**, Native-Event-Binding **v2**, Inputcontract **v1** | Orchestration1 und alte Runtimeprofile bleiben getrennt |
| Action-/Eventruntime | Capability **3/4**, opt-in Runtime **v2/v3** | Default-Runtimeformen unverändert |
| Provider | zusätzlich Interface **v2**, Capability **2** | Interface1 und dessen Pflichtprops bleiben gültig |
| Bindings | Binding **v3**, Artefakt **v4**, Projection-Registry-API **3.0.0** | bestehender typisierter Key-/Presence-Materializer; Legacy-Registry bleibt geschlossen |
| URL-State | eigener Projection-Port **API2**, Policy/State/Restore/History **v2**, Tokenpräfix **`2.`** | unveränderter URL1-Port für die bisherigen Bindingprofile |
| Maraca | Config/Plan **v8**, Providerpins **v1**, Composition-Manifest **v8**, Artefakt/Buildreport **v9**, Build-API **13** | frühere Config-/Plan-/Compositionprofile unverändert |
| Browser / Planruntime | Browserroot **v10**, Composition-API **10**, Port **v6**, CSR-Planruntime **v13** | keine implizite Source4-SSR-/Adoptionsfreigabe |

## Operatorabdeckung

Die maschinenlesbare [Coverage](../../../tools/rmt-language/rmtx-operator-coverage.json) ordnet **alle 122 AST-Typen** zu: 99 werden durch qualifizierte Quelloperatoren erzeugt, 21 sind Hilfs-/Attributprojektionen, zwei native Surface-Repeat-/Key-Klauseln bleiben ausdrücklich A06.4. Mehrere Tags können denselben AST-Typ mit unterschiedlichen geschlossenen Klauseln erzeugen; deshalb ist die Tagzahl keine AST-Knotenzahl.

Neben State/Selector/Action/Surface werden DataSources, Status/Execution, Effects, Recipes, Emit, ResultHandler, Validation, Animation/Transition, Portal/Overlay/Resource, SearchSource, Bounds und Lifecycle-/Sicherheits-/Hydration-/Resumability-/Isolation-Policies abgebildet. RemoteSurface wird auf Dokumentebene abgesenkt. Ein Import deklariert eine Classic-Quellabhängigkeit; automatische Auflösung und gemischte Projektgraphen folgen A06.5. `Mount.when` und entsprechende Lifecyclebedingungen bleiben diagnostizierte Fehler; ihre Ausführung ist keine Fähigkeit dieses Profils.

Die [Regeltabelle](../../../tools/rmt-language/rmtx-operator-coverage.js) definiert Attribute und Kindkontexte. Unbekannte Attribute/Tags, unzulässige Kinder, doppelte Singletonklauseln und ungültige Werte scheitern vor dem Backend. Interne Classic-Textfelder werden ausschließlich aus geschlossenen Werten erzeugt. Backend-Symbol-, Policy- und Zielprüfungen bleiben zuständig; ein syntaktisch bekannter Operator gibt weder Hostadapter noch Berechtigungen frei.

## Actioninput und native Events

```tsx
<RMT.Action id="save">
  <RMT.Input name="name" type="string" />
  <RMT.Input name="notify" type="boolean" optional={true} default={true} />
  <RMT.Reduce state="form" value={{ name: input.name, notify: input.notify }} />
  <RMT.Emit event="saved" payload={{ name: input.name }} />
</RMT.Action>

<RMT.Surface id="save-button" kind="region" component="button">
  <RMT.On event="click" action="save"
    payload={{ name: 'detail.name' }} preventDefault={true}
    when={model.form.enabled === true} />
</RMT.Surface>
```

Inputs unterstützen die expliziten Builtins `string`, `number`, `boolean`, `json`, `object`, `array`/`collection` und rekursive `T[]`. Unaufgelöste nominale Typen erhalten keinen erfundenen Validator: sie sind in Source4 Fehler. `object` und `array` beschreiben generische JSON-Container; daraus wird kein implizites Feldschema abgeleitet. `json` umfasst JSON-null. `nullable`, `optional` und `default` sind explizite Regeln; Defaults gelten nur für fehlende Felder. Zusätzliche Felder, falsche Werte, Getter, Prototypobjekte, Zyklen, dünn besetzte Arrays und nichtendliche Zahlen werden abgewiesen.

Der Compiler bindet den vollständigen Inputvertrag an deklarierte Action-/Inputnamen und Basistypen. Die Runtime prüft und normalisiert vor Run-ID, Loading-/Statusänderung, Ressourcen oder Effects. Derselbe vertrauenswürdige Prüfport schützt native Events, Maraca-Commands und den FastPass-Eingang. Maraca verwendet normalisierte Inputs auch für eigene Modeltransaktionen, damit Defaults erhalten bleiben. Eine direkte vertrauenswürdige Effect-Hostschnittstelle ist kein vom Quellprogramm frei wählbarer Action-Eingang.

Native Eventbedingungen werden vor dem Payloadmapping geprüft; danach folgt die Inputvalidierung vor `preventDefault`, Confirmation und Dispatch. Unbenutzte Event-Detailmetadaten werden im neuen Profil nicht als Commandmetadaten ausgelesen. Actions ohne Pflichtinput können ein explizites `payload={{}}` verwenden. Falsche Maps erhalten keinen `$detail`-Fallback. Native `On`-Bindings bleiben auf XTension-Hosts gesperrt; deren Interaktion gehört in den Provider-Intentkanal.

Reducerwerte, Recipewerte und ResultHandler verwenden geschlossene skalare Werte, explizite Model-/Selector-/Input-/Result-/Error-/Payloadreferenzen sowie verschachtelte Objekt-/Array-Templates. Recipes benennen registrierte Hostimplementierungen; Quellcallbacks bleiben verboten. Freie Berechnungen in Reducern sind nicht freigegeben. Die allgemeinen geschlossenen skalaren Operatoren unten gehören zum Props-Kontext.

## Inline-XTensions und gepinnte Provider

```tsx
<RMT.Repeat from={model.catalog.groups} keyBy={item.id}>
  <RMT.Repeat from={item.products} keyBy={item.id}>
    <RMT.Surface id="gallery-host" kind="region" component="div" present={item.enabled}>
      <RMT.XTension id="gallery" provider="react-product-gallery"
        owner="product-details" lane="visible"
        props={{ images: selectors.galleryImages,
          selectedImageId: item.enabled === true ? item.selectedImageId : 'front' }}
        intents={{ selectImage: { action: 'image.select',
          payload: { imageId: 'imageId' }, keys: { groupId: 0, productId: 1 } } }} />
    </RMT.Surface>
  </RMT.Repeat>
</RMT.Repeat>
```

Die referenzierten Owner, States, Selectors und Actions müssen deklariert sein. Eine Surface enthält genau einen Provider und keine konkurrierende Lane oder native Eventroute. Der Parser erzeugt den statischen Host plus Lane/Mount; die vorhandene Materialisierung bestimmt konkrete Instanzen und Lebensdauern. Verschachtelte String-/SafeIntegerkeys bleiben typisiert, einschließlich `1` gegenüber `"1"`; es gibt keinen Positionsfallback. Presence verlangt einen tatsächlichen Boolean. Kinder und Slots bleiben provider-owned.

Provider-IDs wählen ausschließlich aus einer extern gepinnten Registry. Die Quelle kann keine Modulpfade, Hashes, Schnittstellen, Defaults oder Grants definieren. Der reguläre [Build](reference.cjs) verwendet:

```js
{
  source: 'app.rmtx',
  orchestration: 'strict', kernel: 'strict',
  rmtxProviders: {
    schema: 'xtend.maraca.rmtx-providers.v1',
    interfaces: [{ file: './providers/gallery.interface.json', sha256: '<exact hash>' }]
  }
}
```

Maraca erfasst zunächst Interface- und Modulbytes ohne Ausführung, kompiliert die tatsächliche Quelle erneut und führt anschließend den bestehenden Graph-/Integritäts-/Bundlepfad aus. Callbackreports ersetzen diese Prüfung nicht. Zusätzliche Binding- oder Composition-Sidecars sind in Source4 Fehler. Config8 bewahrt diese Entscheidung auch auf dem gespeicherten Buildpfad.

Interface1 behält exakt seine bisherigen Pflichtprops. Interface2 ergänzt providerseitige `optionalProps` und `defaults`: ein ausgelassener optionaler Prop bleibt ausgelassen oder erhält den gepinnten Default. Explizites null ersetzt einen Default nicht. Ein fehlender Modelpfad erhält keinen Default. Unbekannte Props, `children`/`slots` und nichtdeklarierte Vue-Fallthroughattribute bleiben gesperrt. Die neuen Verträge verwenden weiterhin die vorhandenen React-/Vue-Adapter; zusätzliche Angular-/Vanillaadapter sind damit nicht behauptet.

Provider-Payloads werden vollständig gegen ihr Schema geprüft, bevor Mapping und Actiondispatch erfolgen. `keys` bezeichnet ausschließlich vertrauenswürdige Adresspositionen; Providerdaten dürfen diese Felder nicht ersetzen. Pflichtinputs, optionale Inputs und rekursive Arraytypen werden gegen den Actioninputvertrag abgeglichen. Die Action prüft den resultierenden Payload nochmals am gemeinsamen Eingang.

## Props-Projektionen und Abhängigkeiten

Erlaubt sind JSON-Literale, direkte `model`-/`selectors`-/`item`-Pfade, geschlossene Objekte und Arrays, `test ? then : else`, `!`/`+`/`-`, strikte Vergleiche, boolesche `&&`/`||` und endliche skalare Arithmetik. Bedingungen verlangen Booleanwerte; Arithmetik verlangt Zahlen, Stringaddition zwei Strings. Es gibt keine JS-Koerzierung, Methodenaufrufe, berechneten/optionalen Pfade, Spreads oder frei ausführbare Funktionen.

`item` wird einmal statisch in bestehende Repeatplatzhalter abgesenkt. Der bestehende Keymaterializer ersetzt diese durch vertrauenswürdige typisierte Keyselektoren. Die Props-Auswertung erfolgt aus dem vorhandenen unveränderlichen Model-/Selectorsnapshot, ohne zweite Selectorengine und ohne zusätzliche Hostmaterialisierung.

Deep Links verwenden für Source4 den ausdrücklich gewählten `PROJECTION_URL_STATE_RUNTIME`-Port und eine öffentliche URL-Policy v2. `x-router.connectURLState` wählt dafür den versionierten Route-Host v2; ein ausdrücklicher Routencontroller verwendet `createXRouterProjectionURLStateHost`. Als Schreibziel sind nur skalare direkte State-Pfadprojektionen zulässig. Selectors, berechnete Ausdrücke, Literale und Providerdefaults verleihen keine URL-Schreibautorität. Codec, atomare Restoreplanung, typisierte Keyadressierung und History-/Viewbarriere teilen dieselbe bestehende Engine; die bisherigen v1-Schemata, Hosts und Tokens bleiben unverändert und werden nicht still nach v2 umgedeutet.

Der Komponentenreport enthält alle syntaktischen Reads einschließlich beider Conditional-/Kurzschlusszweige und die transitiven State-Reads referenzierter Selectors. Das ist ein konservativer statischer Bericht. Er schaltet keine neue Subscriptionoptimierung, Laufzeit-Dependencyerfassung oder Dirty-only-Selectorberechnung ein. Compilerseitig werden Symbole, IR, Regeln und verfügbare initiale Modelwerte geprüft; konkrete Selectorwerte werden erst am vorhandenen Runtime-Propsvertrag geprüft, bevor Laden/Mounten/Updates stattfinden. Hierfür werden keine fiktiven initialen Selectorwerte erzeugt.

## Abnahme und nächster Abschnitt

[Quellfixture](source.rmtx), [Inspector](inspect.cjs), [Runtime-Runner](runtime-test.cjs) und [Abnahmelogik](runtime-acceptance.mjs) verwenden den regulären Compiler-/Maraca-/Kernel-/Fabricpfad. Sechs getrennte React-/Vue-Roots erhalten Inline-Bindings mit typisierten Eltern-/Kindschlüsseln. Die zusätzlichen Fälle prüfen echte Selector- und Objekt-/Array-Props, gepinnte Providerdefaults und ausgelassene optionale Felder. Reordering, Intent-Rückweg, Presence, Reinkarnation, Close/Resume, leere Kollektionen und Destroy verwenden dieselbe Verhaltensabnahme wie das erhaltene Hostprofil.

Der [statische Nachweis](evidence.json), der [Runtimebeleg](runtime-evidence.json) und die [Ausführungsquittung](execution-evidence.json) benennen die tatsächlich geprüften Lanes und Quellpins. Historische A06.3.1-/A06.3.2-Runtimeberichte werden nicht nachträglich umgeschrieben.

| Prüfung am finalen Implementierungsstand | Ergebnis |
| --- | --- |
| Regulärer Build/Boot mit React, Vue, nativen Events, URL2 und XRouter2 | Je 12 Laufzeitfälle und 10 Compilechecks unter Node 24, Node 26 und Chromium; alle 133 Quellpins zwischen den Läufen identisch und danach erneut geprüft. |
| Vorhandene Framework-/Lifecycle-Regressionen | Je 341 Laufzeitfälle und 88 Compilerchecks unter Node 24 und 26 bestanden. |
| Provider-, Projektions- und URL-/Routergrenzen | Je 63 gezielte Fälle unter Node 24 und 26 bestanden. |
| Tatsächlich gepackte und installierte SDKs | Je 9 Consumerfälle unter Node 24 und 26 bestanden, einschließlich allein installiertem Compiler und strikter Typprüfung. |
| Erhaltene Sourceprofile 1/2/3 | Je 35 vollständige Parse-/Compile-/Factory-/Katalogfälle bytegleich zur gesicherten Ausgangsbaseline. |
| Vollständiges Vorbereitungsgate | Alle 38 Kommandos einschließlich 25 frischer Inspectorprüfungen bestanden; 133 Quellpins vor/nach dem Lauf identisch. |

Die unveränderten Rohquittungen und Logs liegen im [Belegarchiv](verification/README.md). Der vollständige Vorbereitungslauf und seine Prozessquittung sind zusätzlich im Ausführungsbeleg verknüpft. Diese Prüfungen ersetzen nicht die noch ausstehende gemeinsame Releaseabnahme.

Die Regressionen schließen außerdem den allein installierbaren Compiler, unveränderte Legacy-Größenkappen und den Selbstabbau eines emittierenden Hosts ein. Der Compiler enthält eine bytegleich synchronisierte FastPass-Vertragskopie. Legacy-Manifeste1–7 exportieren keine Projection3-Fähigkeit und erhalten dafür einen kleinen internen Sperrport; Manifest8 und das SDK verwenden den echten Evaluator. Manifeste1–5 bündeln außerdem keinen ungenutzten Komponentenvalidator; Profile6/7 behalten ihn vollständig, Profil8 ergänzt den Projektionsevaluator. Ein bereits akzeptierter Modelcommit bleibt Eigentum des nativen Controllers: Verschwindet der auslösende Host durch diesen Commit, werden View, Props und Ersatzhosts trotzdem vollständig projiziert. Nachgelagerte Caller-Effekte behalten ihre ursprüngliche Lease-Sperre.

Source4 verweigert SSR-/Adoptionsboot ausdrücklich. Die früheren separat akzeptierten SSRprofile bleiben verfügbar; daraus folgt keine Source4-Parität. Lane benennt die bestehende Kernel-Scheduling-/Lifecycleentscheidung und keine neu erfundene IntersectionObserver-, Timeout-, Fallback- oder Layoutgarantie. Solche zusätzlichen Provider-/Deliverypolicies erhalten eigene Verträge. Beide 0.9-Features bleiben **`preparing`**. Der nächste Implementierungseinstieg ist **A06.4: natives Viewprofil, native typisierte DOM-Loops und ausführbare Lifecyclebedingungen**.

Eine konkrete native A06.4-Kante wurde beim Laufzeittest erfasst: Die implizite Classic-Surfaceart `named_surface` kann einen vom DOM-Renderer abgewiesenen `part`-Wert erzeugen. Die ausführbaren Referenzen setzen deshalb `kind="region"` ausdrücklich. Dieser Default-/Rendervertrag benötigt eine eigene Native-View-Korrektur; die erhaltenen Classic-Ausgaben werden hierfür nicht nebenbei verändert.
