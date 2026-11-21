# A06.4.2 – native Operatoren, Surface-Repeats und öffentliche Slots

**Statusfortschreibung vom 21. November 2026:** Source8 erweitert den hier erhaltenen Source7-Vertrag um den verwalteten nativen Katalog. [A06.5](../project-tooling/implementation.md) ist implementiert und lokal geprüft. Die gemeinsame Ziel-/Releaseabnahme [A06.6](../release-acceptance/implementation.md) ist der nächste Gesamtabschnitt; vollständige Rollenabnahme und formale Evidenzbindung bleiben offen. Maßgeblich ist der [zentrale Arbeitsstand](../../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md).

Stand: 19. November 2026. Das explizite Syntaxprofil **7.0.0** führt den nativen A06.4.2-Umfang im bestehenden Worktree fort. Default1 und Quellprofile1–6 behalten ihre geschlossenen Verträge. Auswahl: `createRmtxCompiler({syntaxVersion:'7.0.0'})` beziehungsweise Maraca `rmtxSyntaxVersion:'7.0.0'`; gespeicherte Konfigurationen verwenden Config11. [Produktive Referenz](source.rmtx).

## Operationen und Autorität

`RMT.Mount` steuert strikt boolesch die Zulassung der Inhalte. Die anderen neun Befehle wirken bei einer steigenden booleschen Flanke; initialtrue zählt als Flanke. Ohne `when` gilt true. Die geschlossenen skalaren Ausdrücke dürfen Model-, Selector- und zum Owner gehörende Itempfade lesen. Gegensätzliche gleichzeitige Befehle werden vor dem Modelcommit abgewiesen.

| Operator | Wirkung auf die Inhalte |
| --- | --- |
| Mount | Level-Admission; false entfernt zugelassene Inhalte einschließlich ihrer Provider. |
| Hydrate | CSR-Aktivierung für verwaltete Events, Provider und registrierte native Hydrationhooks; keine SSR-Adoption. Eine ausdrücklich false gesetzte Hydration hält diese Aktivitäten gesperrt. |
| Suspend / Resume | Provider und verwaltete Events pausieren beziehungsweise wieder aktivieren; native Nodes und Providerinstanzen bleiben erhalten. |
| Invalidate | Bestehende AbortBoundary invalidieren, Daten und verwaltete Aktivierung erneuern; keine automatische Neuanlage der DOM-Nodes. |
| Dispose / Recycle | Inhalte terminal stilllegen beziehungsweise ausdrücklich mit frischen Nodes und Providerinstanzen neu aufbauen. Mount alleine hebt Dispose nicht auf. |
| Detach / Reattach | Native Teilbäume einschließlich logisch zugehöriger portalisierter Providerwurzeln parken und identisch wieder einsetzen; verwaltete Aktivität pausieren beziehungsweise fortsetzen. Unabhängig detachtes Kind bleibt beim Reattach seines Parents geparkt. |
| Prewarm | Native Definitionen sowie gepinnte Provider-/Peer-Namensräume vorladen, auch bei Mountfalse; keine Providerfactory, kein Mount und keine Resourceallokation. |

Ein nativer Source7-Viewowner ohne eigenes Mount erhält vom Compiler einen regulären CSR-Mount in der visible-Lane, einschließlich AST-/SourceMap-/Core-/Lifecycleprovenienz. Ein ausdrücklich deklariertes Mount behält seine Lane und Bedingung. Implizite Controlhooks laufen innerhalb dieser echten Mountarbeit; ausdrücklich deklarierte Hydrate-Befehle behalten ihre eigene Operation. Neu erscheinende oder entfernte Controls in When-/Repeat-Inhalten bekommen jeweils ihre eigene Hook-Lifetime.

Jeder Befehl läuft über die tatsächliche Kernel-/Fabrickette. Geschlossene, minimierte, kollabierte oder zerstörte Controller und inaktive Parents werden dadurch nicht geöffnet. Solange deren Autorität gesperrt ist, werden Befehlsflanken nicht verbraucht. Asynchrone Fortsetzungen prüfen die erfasste Controllerrevision und bestehende AbortBoundary. Content-Recycle erzeugt keine zweite Controllergeneration.

Definitionen müssen vor `createElement` und Properties geladen sein. Native Browser-Konstruktoren und private Component-Listener laufen beim Mount gemäß ihrem eigenen Vertrag; Hydratefalse kann sie nicht rückwirkend unterdrücken. Detach kann native Browser-Disconnect-/Connect-Reaktionen und Fokusverlust auslösen. Globale Custom-Element-Registrierungen lassen sich nach einem asynchronen Import nicht zurücknehmen.

## Ganze Surfaces und typisierte Schlüssel

```tsx
<RMT.Repeat from={model.rows} keyBy={item.id}>
  <RMT.Surface id="row" present={item.enabled}>
    <RMT.View><RMT.Text value={item.title}/></RMT.View>
    <RMT.On event="select" action="select" payload={{}} keys={{rowId:0}}/>
  </RMT.Surface>
</RMT.Repeat>
```

Header2.scopes erfasst die vollständige Repeat-/Presence-/Parentzuordnung. Gemeinsames `repeat-scopes`-Lowering erhält numerische und textuelle Keys, verschachtelte Pfade und stabile Identitäten bei Umsortierung. Es gibt keinen Indexfallback und keine Keykoerzierung. Source7-Surfacekennungen verwenden die geschlossene Symbolgrammatik mit optionalen Punktsegmenten; konkrete Instanznamespaces mit Doppelpunkten sind reserviert. Materialisierung ist auf10000 Instanzen und4096 Zeichen pro konkreter Kennung begrenzt; Schlüssel werden nicht gekürzt. Der optionale Graph3-Adapter materialisiert diese Zeilen im tatsächlichen Graph2 und Surfacecontroller; er führt keinen zweiten Ressourcen- oder Generationsgraphen ein. Entfernte Provider werden vor ihren nativen Ownern stillgelegt. Eigene Repeatentfernung und externer Destroy bleiben getrennte Ursachen; ein Modelupdate darf extern zerstörte Owner nicht wiederbeleben.

`On.keys` bezieht Actioninputs aus dem aktuellen vertrauenswürdigen Scope. Eventdetail, DOM-Attribute und Positionen können diese Keys nicht ersetzen. Provideradressen behalten Binding3; Bindingartefakt7 benennt zusätzlich die konkrete Host-Surface und ihren konkreten Owner. Zugehörige Providercontainer lassen ihr Childrenfeld aus, damit der gemeinsame Renderer fremd besessene Inhalte erhält.

## Komponenten und Slots

`RMT.Component` erlaubt zunächst die ausdrücklich geprüften Capability-Teilmengen von **x-header** und **x-button** aus [dem generierten Katalog](../../../tools/rmt-language/rmtx-native-components.v1.json). Modulbytes, die exakten sicheren Attribute/Properties und angebotenen Slots werden im Compiler und im Runtimeport geprüft. [Die Komponentenprüfung](../native-components/README.md) dokumentiert die Freigabe und konkrete Gegenbeispiele; ein vorhandener ShadowRoot reicht für weitere Tags nicht aus. Native HTML-Sinks behalten ihren eigenen Vertrag. Maraca besitzt die Light-DOM-Kinder; die Komponente besitzt ihren Shadow DOM.

```tsx
<RMT.Component tag="x-header">
  <RMT.Slot name="title"><RMT.Text value={model.page.title}/></RMT.Slot>
  <RMT.Slot name="actions"><RMT.Element tag="button"><RMT.Text value="Save"/></RMT.Element></RMT.Slot>
</RMT.Component>
```

Benannte Elementkinder werden unmittelbar mit einem compilerseitigen Slotattribut projiziert; dadurch bleibt beispielsweise `::slotted(button)` anwendbar. Nur benannter Text benötigt einen Span. Defaultslots benötigen keinen universellen Wrapper. Callsite-Metadaten, beliebige Tags, freies data-/aria-Fallthrough, freie Slotattribute, HTML-/Style-/Eventhandlersinks und Cross-Framework-Children sind gesperrt. Der gemeinsame Renderer erhält ausschließlich die erfassten Property-Capabilities; auch eine zusätzliche Registry kann sie nicht erweitern. React-/Vue-Children bleiben providerseitig besessen. Katalogprüfung: `node development/rmtx-a06/native-components/generate.cjs --check`.

## Versionsgrenzen und Prüfung

| Vertrag | Source7 |
| --- | --- |
| Frontend / Backend | Parser-, Compiler-, Authoring-API7; Katalog6; Classic4.8 / vNext1.9; formaler AST1 und Action4 erhalten |
| Native View / Lifecycle | Quelle2 / Header2 / Projectionport3; Lifecyclequelle2 / Plan2 / Readsets2; Program5 |
| State / URL | Bindingartefakt7 / Registry6 / URL-Port5 / Routerhost5; Binding3 und URL2-Wires erhalten |
| Maraca / Komposition | Plan11 / Config11 / Browser13 / Runtime16; Manifest11 / Artefakt+Report12 / Port9; Loadplan3; Buildmodul16 / Runtimemodul13 |

Manuelle Integrationen verwenden `NATIVE_ORCHESTRATION_VIEW_RUNTIME`, `ORCHESTRATED_STATE_BINDING_RUNTIME`, `ORCHESTRATED_URL_STATE_RUNTIME` und `createMaracaNativeOrchestrationRuntime`. Die alten Validatoren und Einstiege akzeptieren diese neuen Verträge nicht stillschweigend. Standardrenderer und Browserintegration erhalten ihre Propertyregistry aus dem erfassten Vertrag; bei einem eigenen DOM-Renderer muss der Aufrufer `NATIVE_ORCHESTRATION_VIEW_RUNTIME.createComponentRegistry(program, registry)` ausdrücklich als Rendererregistry übergeben. Der reguläre Build liefert eigene optionale Runtimeassets.

Die [statische Inspektion](inspect.cjs) und [ausgeführte Runtimeabnahme](runtime-test.cjs) sind getrennte Prüfschritte. Runtimeabnahmen führen die produktive Quelle mit echten React-/Vue-Providern durch den regulären Produktionsbuild; die Browserlane verwendet eine versiegelte ESM-Auslieferung. Die [Abbruchdiagnose und Wiederaufnahme](crash-resumption.md) hält die OOM-Befunde getrennt von Vermutungen fest. Schwere lokale Läufe werden nach dem OOM-Abbruch einzeln mit Heaplimit, Timeout und RSS-Messung ausgeführt. Der unveränderte Legacy-Delivery-Cap beträgt240000 Runtimebytes; der Produktionsprinter kürzt private lexikalische Bindungen bei erhaltenen Funktions-/Klassen- und Propertynamen.

A06.5 (semantische Projekt-/Editorintegration) ist implementiert und lokal geprüft; seine formale Releaseevidenz bleibt gesondert zu binden. A06.6 (gemeinsame Ziel-/Releaseabnahme) bleibt offen. Source4–8-SSR/Adoption und allgemeine Cross-Ownership-Slots sind nicht freigegeben. Beide Releasefeatures bleiben `preparing`.

Der [quellgebundene Ausführungsbeleg](execution-evidence.json) enthält je10 Runtimefälle und10 tatsächlich ausgeführte Compile-Gegenproben unter Node24, Node26 und sealed Chromium. Die drei [Verifikationsdateien](verification/) binden jeweils224 Quellen. Die zusätzliche Source7-Gatesuite besteht70 Fälle je Node-Lane, einschließlich Portalretention, unabhängigem Child-Detach sowie Cleanup nach Dispose, Membership-Verlust und externem Destroy; weitere Releaseprüfungen werden gesondert gebunden.

Der [ergänzende Prüfbericht](verification/additional-checks.json) protokolliert die Vorbereitungskommandos, die erneute Legacy-Runtimeabnahme sowie die gesonderten Paket-, Typ- und bisherigen SSR-Prüfungen. Die vorhandene SSR-Abnahme erteilt Source7 keine SSR-Freigabe.
