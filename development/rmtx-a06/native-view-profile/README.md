# A06.4.1 – native Views und typisierte DOM-Wiederholungen

**Statusfortschreibung vom 21. November 2026:** A06.4.2 ist im Source7-Profil implementiert, Source8 ergänzt den verwalteten Katalog. [A06.5](../project-tooling/implementation.md) ist implementiert und lokal geprüft; die gemeinsame Ziel-/Releaseabnahme [A06.6](../release-acceptance/implementation.md) samt formaler Evidenzbindung bleibt offen. Der [zentrale Arbeitsstand](../../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) führt die heutige Reihenfolge. Die nachfolgenden Angaben bleiben auf den datierten Source5-Umfang begrenzt.

Stand: **18. November 2026**. Dieses Paket ergänzt den produktiven RMTX-Pfad um ein ausdrücklich gewähltes **Syntaxprofil 5.0.0**. Es verbindet native HTML-Views mit den bestehenden React-/Vue-XTensions über denselben Maraca-, Model-, Kernel-, Fabric-, Surface- und Rendererpfad. Der bisherige Default1 und die Sourceprofile1–4 bleiben eigenständig.

Dieses Source5-Profil enthält native Views und Elementwiederholungen. Ausführbare Lifecyclebedingungen, native **Surface**-Instanzierung und geprüfte öffentliche Custom-Component-/Slotverträge sind inzwischen im getrennten Source7-Anschluss A06.4.2 implementiert. Die hier implementierten Wiederholungen erzeugen weiterhin native **Elemente innerhalb einer bestehenden owning Surface** und keine neuen Surface-Lifetimes. Semantische Projekt-/Editorintegration ist in A06.5 implementiert; gemeinsame SSR-/Releaseabnahme bleibt A06.6.

## Einstieg

```tsx
import { RMT, model, item } from '@ccslabs/xtend/rmt-language/rmtx';

export default <RMT.Program id="native-products">
  <RMT.State id="catalog" type="object" initial={{
    title: 'Produkte', enabled: true,
    rows: [{ id: 1, label: 'Numerisch' }, { id: '1', label: 'Textuell' }]
  }} />
  <RMT.Surface id="products">
    <RMT.View>
      <RMT.Element tag="h1"><RMT.Text value={model.catalog.title} /></RMT.Element>
      <RMT.When test={model.catalog.enabled}>
        <RMT.Repeat from={model.catalog.rows} keyBy={item.id}>
          <RMT.Element tag="p" attributes={{ 'data-label': item.label }}>
            <RMT.Text value={item.label} />
          </RMT.Element>
        </RMT.Repeat>
      </RMT.When>
    </RMT.View>
  </RMT.Surface>
</RMT.Program>;
```

```js
const compiler = require('@ccslabs/xtend-compiler/rmt-language/rmtx-compiler')
  .createRmtxCompiler({ syntaxVersion: '5.0.0' });

const build = await require('@ccslabs/xtend-maraca').buildMaracaBundleAsync({
  source: 'app.rmtx', out: './dist', rmtxSyntaxVersion: '5.0.0',
  orchestration: 'strict', kernel: 'strict', hydration: 'off',
  validation: 'off', transitions: 'off', services: false
});
```

Die Buildkonfiguration9 speichert die explizite Sprachwahl. Auch ein expliziter Compiler5-Port bleibt möglich; Maraca kompiliert die tatsächlichen Quellbytes nochmals mit dem gewählten Profil. Provider-IDs und Bytes werden weiterhin ausschließlich über die extern gepinnten `rmtxProviders` aus dem [Source4-Vertrag](../orchestration-profile/README.md) zugelassen. Neue native Views rechtfertigen keine Binding-/Composition-Sidecars oder vom Quellprogramm wählbare Providerpfade.

## Geschlossener Viewvertrag

Eine gewöhnliche Surface enthält höchstens einen `RMT.View`. Native Views und provider-owned XTension-Inhalte dürfen nicht denselben Host besitzen. `RMT.Element` und die umgebende Source5-Surface verwenden eine geschlossene sichere HTML-Tagliste. Unbekannte Customtags, Script-/Style-/Template-/SVG-/Frame-Sinks sind in diesem Profil nicht zugelassen. Öffentliche XTend-Custom-Controls werden dadurch nicht rückwirkend als allgemeiner Slotvertrag freigegeben; bisherige Sourceprofile bleiben verfügbar.

Text wird mit `RMT.Text value=…` deklariert. Die Werte sind endliche JSON-Skalare: Strings, Zahlen, Booleans oder null; null erzeugt leeren Text. Objekt-/Arraywerte werden nicht implizit in Text umgewandelt. Literale bleiben bis zum DOM-Renderer ausdrücklich `{ op: 'literal', value }`. Ein String wie `"$model.secret"` oder `"${untrusted}"` wird deshalb nicht als zweite Bindingsprache interpretiert. Es gibt keine freien JavaScriptausdrücke, Sourcecallbacks, unqualifizierten HTML-Tags oder HTML-Strings als Ausweichpfad.

`attributes` und `properties` sind statische Feldmaps mit geschlossenen skalaren Projektionen aus `model`, `selectors` und dem jeweiligen `item`-Scope. Die Projection-IR und deren Typregeln werden vom bestehenden Props-Vertrag wiederverwendet. Native `When`-Bedingungen verlangen Booleanwerte. Numerische Vergleiche und Arithmetik koerzieren keine Strings. Beide Zweige geschlossener Conditionalausdrücke gehen in den konservativen statischen Abhängigkeitsbericht ein; eine neue Subscription-/Dirty-only-Engine ist damit nicht eingeführt.

Interne `data-rmt-*`, `data-maraca-*`, weitere Ownershipmarker, rohe `on*`-Handler, `innerHTML`, `srcdoc`, Styles und vergleichbare Sinks sind gesperrt. DOM-IDs sind statische, eindeutige, selektorsichere Tokens (`^[A-Za-z][A-Za-z0-9_-]*$`); innerhalb nativer Repeats sind sie verboten. Ein ausschließlich über `properties.id` deklariertes statisches Ziel wird vor der Portalkomposition in das kanonische `attributes.id` abgesenkt; beide ID-Kanäle zusammen sind verboten. Kompilierte Native-Deskriptoren erlauben `properties.id` nicht mehr. Properties besitzen eine eigene geschlossene Namens- und Wertdomäne. URI-/Property-/Tiefen-/Knotengrenzen prüft der tatsächliche Shared Renderer.

Native Kinder deklarieren derzeit keine eigenen `RMT.On`-Routen. Die vorhandenen Action-/Eventverträge auf der owning Surface bleiben verfügbar. Das Paket behauptet keinen neuen per-item Eventpayload- oder Formularbindingvertrag.

## Identität, Model und Portale

Innerhalb eines Views bezeichnet `RMT.Repeat` native DOM-Wiederholungen. Außerhalb bleibt derselbe Operator der bisherige explizite XTension-Hostscope. Native und XTension-Materialisierung teilen dasselbe extrahierte Scope-Primitive; es gibt keinen zweiten Schlüsselalgorithmus und keine fiktiven XTension-Bindings für HTML-Elemente.

Source5-Literale und direkte Native-Plan-/Model-/Actioneingänge müssen kanonisch darstellbare JSON-Daten sein; `-0` wird vor einer JSON-Kopie abgewiesen. Vorhandene Provider-Intenttransporte behalten ihren eigenen JSON-Vertrag und liefern bereits normalisierte Daten an die Native-Registry. Dieser Abschnitt führt keine neue Raw-Provider-Payload-API ein.

Schlüssel folgen exakt dem bestehenden Vertrag: nichtleere sichere Strings ohne Randwhitespace oder nichtnegative SafeIntegers, kein `-0` und kein Positionsfallback. Duplikate werden pro Parent-Scope abgewiesen. Die konkrete DOM-Identität ist ein JSON-Tupel aus Dokument, compilerbestimmter Knotendeklaration und typisierten Eltern-/Elementschlüsseln. Damit bleiben `1` und `"1"`, gleiche Childkeys in unterschiedlichen Parents und mehrere Kinder desselben Items verschieden. Der native Endpunkt begrenzt kodierte DOM-Keys auf 4096 UTF-16-Codeeinheiten; er kürzt keine Identität ab.

Die native Projektion erzeugt vor dem Renderer gewöhnliche literale Deskriptoren. Renderer-v2 interpretiert keine neue Repeatsemantik. Seine neue additive Capability **2.3.0** stellt denselben bereits beim Commit verwendeten Validator zusätzlich als `preflight` bereit. Vor einem echten Modelcommit wird ein prospektiver Snapshot mit der bestehenden isolierten Model-Planung erzeugt und gegen native Projektion und Renderer geprüft. Fehlerhafte Schlüssel, Bedingungen, skalare Werte oder DOM-Sinks scheitern vor dem echten Model-, Surface-, DOM- und Providercommit.

Native-only Apps verwenden für den ersten Viewcommit und Folgearbeiten den tatsächlichen Kernel-/Fabricpfad. Ein freier Scheduler- oder Fabric-Fallback wird für Source5 nicht angenommen. Close/Resume und Destroy/Recreate behalten die vorhandenen Controller-, Generationen- und Parentgrenzen. Ein Viewausdruck kann keine geschlossene oder zerstörte Surface wiederbeleben.

Statische native ID-Ziele werden **vor** der bestehenden Portal-Rootkomposition erzeugt. Deshalb können getrennte leere XTension-Surfaces in solche nativen Ziele eingesetzt werden, ohne einen neuen Slot-/Ownershipmechanismus einzuführen. Unter nativen `When`-/`Repeat`-Knoten sind unabhängig orchestrierte Surfacehosts gesperrt: Ein entfernter Viewzweig darf keine weiterhin als präsent geltende Provider-Lifetime verstecken.

Source5 verwendet die eigene compilergebundene Native-View-Quelle. Mutable Modeldaten namens `viewTemplate`, `view` oder `template` werden nicht mehr als Renderdeskriptoren interpretiert. Die ältere Classic-Funktion bleibt in den früheren Profilen erhalten.

## Versionsgrenzen

| Vertrag | Native Profilversion | Erhaltener Vertrag |
| --- | --- | --- |
| Parser / Compiler / Authoring | API5; Parser-/Compilerresultat5; Katalog4/API4 | Default1 und vollständige Profile1–4 |
| Backend | Classic4.6 / vNext1.7; formaler AST1 unverändert | Keine neuen AST-Nativ-Surface-Repeats vorgetäuscht |
| Native Quelle / kompilierter View / Runtimeport | `xtend.rmtx.native-view.v1` / `xtend.rmt.native-view.v1` / API1 | Klassische Renderdeskriptoren bleiben Renderer-v2-Daten |
| Actionunterprofil | ausdrücklich delegiertes Source4-Actionprofil | InputRules1, InputContract1, Actionplan2, Eventbinding2 unverändert |
| Orchestration / Komponentenquelle | Program3 / Components2 | Program2 / Components1 bleiben Source4 |
| Bindings / Registry | Artefakt5, neue Registry-API4 | Binding3 und Interface2 unverändert; Registry3 bleibt Program2/Artefakt4 |
| Maraca | Plan9 / Config9 / Browser11 / CSR-Runtime14 | Alte Profile getrennt; SSR/Adoption für Source5 gesperrt |
| Providerkomposition | Manifest9 / Artefakt+Report10 / Port7; Build-API14 / Runtime-API11 | Frühere Manifest-/Artefakt-/Portformen unverändert |
| Deep Links | expliziter Native-URL-Port API3 und Routerhost3 | Dieselben URL2-Wireformen/Token2, alte Ports1/2 bleiben geschlossen |

Der Actionvertrag wird als benanntes Unterprofil4 wiederverwendet. Parserresultat5 weist deshalb sowohl das tatsächliche äußere Sourceprofil5 als auch `actionProfile4` aus. Ein fremder Source5-Vertrag wird nicht still in ein älteres Gesamtprogramm umgedeutet.

## Abnahme und weitere Arbeit

Die ausführbaren [Quellen und Referenz](reference.cjs) verwenden den regulären Build. [Runtimeabnahme](runtime-acceptance.mjs) und deren Runner dokumentieren die tatsächlich ausgeführten Lanes und Pinbindungen. Vorhandene A06.3-Ausführungsberichte bleiben historische Belege ihres jeweiligen Quellstands; ihre Hashes werden nicht als neue Ausführung umgeschrieben.

Die [Ausführungsnachweise](execution-evidence.json) binden echte Node24-/Node26-/Chromiumläufe mit jeweils20 Runtimefällen und12 Compileprüfungen, tatsächlichen React-/Vue-Roots, Paket-/Typprüfungen und unveränderten Größenbudgets. Die86 Native-Runtimefälle je Node-Lane prüfen zusätzlich Daten-/Projektions- und Registrygrenzen; die TypeScriptprüfungen verwenden echte Paket-Entrypoints. Die Vorbereitungskette und die Schema-/Authorityaufnahme sind im selben Beleg separat ausgewiesen. Der spätere Source7-Vertrag belegt seinen eigenen Lifecycle-/Surfaceumfang; Source8 ergänzt den verwalteten Katalog. Source5-SSR/Adoption sowie die gemeinsame 0.9-Releasefreigabe werden erst unter A06.6 bewertet. Beide Features bleiben `preparing`.
