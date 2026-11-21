# A06.4.2.1 – bedingte native Mount-Zulassung

**Statusfortschreibung vom 21. November 2026:** Der weitere native Lifecycleumfang einschließlich Surface-Repeats und geprüfter öffentlicher Slots ist inzwischen in [Source7](../native-orchestration-profile/README.md) implementiert; Source8 ergänzt den verwalteten Katalog. [A06.5](../project-tooling/implementation.md) ist implementiert und lokal geprüft. Nächster Gesamtabschnitt ist die gemeinsame Ziel-/Releaseabnahme [A06.6](../release-acceptance/implementation.md); formale Releasebelege bleiben offen. Maßgeblich ist der [zentrale Arbeitsstand](../../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md). Dieser Bericht behält den geschlossenen Source6-Umfang.

Stand des Source6-Vertrags: **19. November 2026**. Das explizite **Syntaxprofil6** ergänzt bedingtes `RMT.Mount` für statische native Surfaces. Dies ist der erste implementierte Teil von A06.4.2. Weitere Lifecycleoperationen, native Surface-Wiederholungen und geprüfte öffentliche Komponenten-/Slotverträge sind inzwischen im getrennten Source7-Profil implementiert und erweitern Source6 nicht rückwirkend.

```tsx
import { RMT, model } from '@ccslabs/xtend/rmt-language/rmtx';

export default <RMT.Program id="conditional-details">
  <RMT.State id="ui" type="object" initial={{ ready: false }} />
  <RMT.Surface id="details">
    <RMT.Lane name="visible">
      <RMT.Mount target="details" when={model.ui.ready} />
    </RMT.Lane>
    <RMT.View><RMT.Text value="Details" /></RMT.View>
  </RMT.Surface>
</RMT.Program>;
```

Der reguläre Maraca-Build wählt das Profil mit `rmtxSyntaxVersion: '6.0.0'`; eine gespeicherte Konfiguration verwendet `xtend.maraca.build-config.v10`. Der Compilerport lautet `createRmtxCompiler({ syntaxVersion: '6.0.0' })`. Default1 und die vollständigen Quellprofile1–5 bleiben erhalten. Dateien behalten `.rmtx`; die bestehenden Action4- und View5-Unterprofile werden ausdrücklich weiterverwendet.

## Geltungsbereich und Wirkung

Pro owning Surface ist höchstens ein bedingtes Mount erlaubt. Sein Ziel muss genau diese gewöhnliche, statische Surface mit eigenem `RMT.View` sein; die Lane muss `visible` heißen. Source-/Policyziele, provider-owned oder wiederholte Surfaceinstanzen und andere bedingte Lifecycleoperationen werden abgewiesen. `RMT.When` innerhalb eines Views behält seine bisherige Bedeutung.

Der Guard ist eine strikt boolesche, geschlossene skalare Projektion aus Model und Selektoren. Er entscheidet bei Boot und den folgenden View-/Modelarbeiten über die Zulassung der Inhalte. Bei initialfalse darf der gemeinsame Surfacecontroller die statische Surfacehülle registrieren. Native Inhaltsknoten, zugehörige Events und Providerarbeit entstehen erst bei zulässiger Admission. Deshalb bedeutet initialfalse ausdrücklich nicht, dass keinerlei Controllerregistrierung stattfindet.

Bei true→false werden untergeordnete XTension-Hosts vor dem Entfernen ihrer nativen DOM-Owner stillgelegt und bestehende AbortBoundary-Tokens ungültig. Bei erneutem true können neue Inhaltsknoten und Providerinkarnationen innerhalb derselben Controllergeneration entstehen. Ein Guard ruft weder Open noch Destroy auf. Eine geschlossene, minimierte, kollabierte oder zerstörte Surface und ein inaktiver Parent werden durch einen wahren Guard nicht wieder geöffnet. Explizites Resume/Recreate bleibt vertrauenswürdige Controllerautorität. Bereits montierte Inhalte behalten beim normalen Close das bestehende Retentionsverhalten.

Alle Guards werden vor Mutationen geprüft, auch unter einem gesperrten Parent. Fehlende Pfade und nichtboolesche Ergebnisse sind Fehler. Getter, fremde Klassen, Zyklen und nichtkanonische Werte werden vor dem Lesen beziehungsweise vor einem tatsächlichen Modelcommit abgewiesen. Der vorhandene prospektive Modelpfad prüft neue Snapshots isoliert. Die Ausführung verwendet weiterhin tatsächliche Kernel→Fabric-Jobs, autoritative Controllergenerationen, AbortBoundaries und `shellEpoch`; auch nach asynchroner Providerstilllegung muss die erfasste Autorität noch gültig sein.

Statische Parent- und Portalzuordnungen werden in die Admission einbezogen. Ein Portalprovider darf nicht unter einem entfernten nativen Owner aktiv bleiben. Der Vertrag führt keinen zweiten Renderer, keine neue Surfacegeneration und keinen weiteren Schlüsselalgorithmus ein.

## Versionsgrenzen

| Vertrag | Neues Profil | Erhaltener Teilvertrag |
| --- | --- | --- |
| Parser / Compiler / Authoring | Modul-API6, Resultate6, Operatorkatalog5 | Quellprofile1–5 bytegleich; Classic-AST1 |
| Backend | Classic4.7 / vNext1.8 | Action4 / View5 ausdrücklich benannt |
| Lifecycle | Quelle `xtend.rmtx.native-lifecycle.v1`, Plan `xtend.rmt.native-lifecycle-plan.v1`, Readsets1 | Zuordnung AST-Pointer → SourceMap → Core-Operation-ID |
| Orchestrierung / Native View | Program4, expliziter Projectionport API2 | Native-View-Header1, Scalar-IR3; API1 bleibt Program3 |
| Bindings / Registry | Artefakt6, neuer Validator und Registry-API5 | Binding3, Komponenteninterface2; alte Validatoren bleiben geschlossen |
| Maraca | Plan10 / Config10 / Browser12 / Runtime15 | Source5 bleibt Plan9 / Browser11 / Runtime14 |
| Providerkomposition | Manifest10 / Artefakt+Report11 / Port8 | Modul-Capabilities Build15 / Runtime12 |
| URL / Router | expliziter Lifecycle-URL-Port4 / Routerhost4 | URL-Wire2 und Token2 unverändert |

Manuelle Integrationen verwenden den eigenen Einstieg `createMaracaNativeLifecycleRuntime` aus `@ccslabs/xtend-maraca/native-lifecycle-runtime` und `NATIVE_LIFECYCLE_VIEW_RUNTIME`. Der generische ältere Runtimeeinstieg erschließt Source6 nicht automatisch. Die produktive Buildausgabe enthält den zusätzlichen Lifecycleadapter als eigenes ESM-Asset; ältere Bundles benötigen ihn nicht.

## Nachweise und Restumfang

Die Compiler-, Protokoll-, Kompositions- und Laufzeittests prüfen geschlossene Versionen, Guardvalidierung, tatsächliche Model-/Surface-/Eventarbeit, unveränderte Controllergenerationen, Close/Resume, verspätete Jobs sowie Destroy/Kompaktion/Recreate. Der zugehörige Versuchsaufbau prüft den regulären Build und die Providergrenze. Statische Inspektion und ausgeführte Laufzeitbelege werden getrennt geführt.

**Nicht im Source6-Vertrag freigegeben:** weitere bedingte Lifecycleoperationen und Lanes, native Surface-Repeats/Keys sowie allgemeine Slots/Customkomponenten. Source4–6-SSR/Adoption bleibt gesperrt. Die inzwischen implementierte semantische Projekt-/Editorintegration A06.5 ist ein eigener äußerer Vertrag; sie erteilt keine zusätzliche SSR-Freigabe. Die gemeinsame Releaseabnahme A06.6 bleibt offen. RMTX und XTensions2.0 bleiben Releasefeatures in Vorbereitung.

Die ausgeführten, quellgebundenen [Node24](verification/runtime-node24.json)-, [Node26](verification/runtime-node26.json)- und [Chromium](verification/runtime-browser.json)-Belege enthalten jeweils191 Quellfingerabdrücke. [Die vollständige Ergebniszuordnung](execution-evidence.json) trennt diese Ausführung von der statischen Inspektion. Die zusätzliche Runtimeregression deckt auch legale Surface-IDs wie `undefined` und fehlende optionale Ownerreferenzen ab.

Die erhaltenen Legacybudgets bleiben unverändert: Source3-Runtime273586/280000 Bytes, gemischte Delivery-Runtime238924/240000 Bytes und gemischte SSR-Runtime239518/240000 Bytes. Der Produktionsprinter für kopierte Runtimeassets kürzt zusätzlich boolesche Ausdrücke mit Terser (`booleans: true`); übrige Kompressionspässe bleiben deaktiviert, `join_vars` bleibt aktiv und Namen werden nicht gemangelt. Die echte bisherige SSR-/Adoptionabnahme besteht84 Fälle. Für weitere gemeinsame Runtimeänderungen bleiben im SSRprofil482 Bytes Reserve; weitere profilgebundene Logik sollte deshalb in dem optionalen Lifecycleasset verbleiben.

Der nachfolgende [Source7-Vertrag](../native-orchestration-profile/README.md) implementiert weitere native Operationen, Surfaceinstanzen und öffentliche Slots. Die oben beschriebenen Grenzen und datierten Ausführungsbelege bleiben der unveränderte Source6-Vertrag. Der aktuelle Produktionsprinter kürzt inzwischen private lexikalische Bindungen bei erhaltenen Funktions-/Klassen-/Propertynamen; die oben genannten Bytewerte dokumentieren den vorherigen Source6-Prüfstand.
