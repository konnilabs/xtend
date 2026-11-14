# A06.1b – Providerseitige Komponentenschnittstelle

Stand: **14. November 2026**. Der providerseitige Vertrag, seine Byte-Erfassung, die Binding-Absenkung, Runtime-Guards und die generierte Provider-Typmap sind implementiert und in die explizite A06-Referenz eingebunden. Die automatische A04-Komposition, deren neue Owner-/Renderziel-Zuordnung und der A05-Handoff dieses Profils bleiben eigene Folgeabschnitte. RMTX-Syntax und 0.9-Feature-Abnahme bleiben offen.

## Versionen und Abgrenzung

| Bereich | Stand |
| --- | --- |
| Neuer interner Interface-Datentyp | `xtend.xtensions.component-interface.v1`; [formales Schema](../../tools/xtensions/component-interface.v1.schema.json) |
| Neuer Runtime-/Build-Helfer | API **1.0.0**; [Runtime](../../tools/xtensions/component-interface.js), [Typen](../../tools/xtensions/component-interface.d.ts), [Build-Capture](../../tools/xtensions/component-interface-build.js) |
| Provider-Interface-Versionen | Jeweils **1.0.0**, erstmals unabhängig von der Aufrufstelle definiert |
| Referenz-Provider | Komponenten **2.0.0**: zusätzlicher Interface-Kontext; Vue emittiert `order`, das auf Action-Parameter `sort` abgebildet wird |
| A06-Fall und Referenz-API | **2.0.0**, `format: 2`; [Aufrufstellenvertrag](two-host.contract.json) |
| Vorheriger Stand | [Case v1](two-host.contract.v1.json), [Contract-Nachweis v1](two-host-evidence.v1.json), [Laufzeitnachweis v1](two-host-runtime-evidence.v1.json) bleiben historische Artefakte des Commits `57d5dc8925a568cd7c8be43b0cc760a6a7bbc36b`. Die neue Absenkung interpretiert sie nicht still als v2. |

Die bestehenden Classic-, State-Binding-, Host-, Maraca- und statischen Introspektionsverträge werden nicht in-place erweitert. Das bisherige statische Introspektionsformat beschreibt akzeptierte/emittierte Kennungen; es wird nicht still zum neuen geschlossenen Props-/Payload-Vertrag umgedeutet. Die neuen Helfer sind in diesem Abschnitt interne Module und noch keine zusätzlichen Paket-Export-Einstiege oder ein vollständiges RMTX-SDK.

## Eigentümer und Datenfluss

Der Provider besitzt [react.interface.json](providers/react.interface.json) beziehungsweise [vue.interface.json](providers/vue.interface.json). Dort stehen Provider-ID, Interface-/Komponentenversion, Framework-/Peer-Versionen, der Code-Einstieg mit SHA-256, die vollständigen Prop-Regeln, die Intent-Felder und die Ownership-Policy. Alle Props sind in diesem ersten Profil erforderlich; `nullable` muss ausdrücklich erlaubt werden. Die vorhandenen geschlossenen Value-Regeln für Primitive, Objekte, Arrays und JSON werden wiederverwendet.

Die vertrauenswürdige Build-Konfiguration verwendet den [Provider-Katalog](providers/catalog.json), der die Interface-Dateien über ihre tatsächlichen Byte-Hashes pinnt. Der Aufrufer wählt einen Provider und referenziert Interface-Version, Interface-Hash und Komponentenversion. Er definiert nur:

- deklarative Model-Pfade für die vom Provider verlangten Props;
- seine konkrete Binding-/Surface-Identität, Presence und die angefragte Lane;
- die Zuordnung deklarierter Provider-Events zu eigenen Business-Actions und gegebenenfalls ein ausdrückliches Payload-Feldmapping.

Der Aufrufer kann weder zusätzliche Props noch eigene Prop-/Payload-Typen in diesen Vertrag einschleusen. Framework, Peer-Versionen und ausführbarer Einstieg stammen ebenfalls aus dem Provider-Katalog. Provider-Metadaten erteilen keine Host-Grants.

## Capture und Herkunft

`captureComponentInterfaces()` liest deklarative Interface-JSON-Dateien, prüft deren Katalog-Pins, validiert das geschlossene Interface und vergleicht den angegebenen Code-Hash mit den tatsächlichen Bytes. Es nutzt den vorhandenen Provider-Graph-Capture. Das neue Build-Profil v1 unterstützt bewusst je Provider ein eigenständiges, synchrones Funktionsmodul ohne weitere Imports. Das größere A04-Graph-Profil bleibt unverändert.

Beim Capture wird kein Provider initialisiert. Für die Node-Referenz lädt `loadFactories()` ausschließlich die bereits erfassten Modulbytes; ein nachträglicher Dateiaustausch ändert die geladene Factory nicht. Der Browser-Test bündelt über `capturedComponentPlugin()` ebenfalls nur diese Bytes. Der Plugin-Einstieg akzeptiert nur ein tatsächliches Capture-Objekt, keinen deserialisierten Build-Bericht.

Das sind Build-/Test-Transportwege dieses expliziten Profils. Der Node-Datenmodul-Import ist keine neue Browser-Delivery-Policy. Eine Produktionsintegration muss Interface- und Code-Dateien zusätzlich durch die vorhandenen A04-Delivery-/Integritäts-/Cache-Verträge führen. Ein Hash in beliebigem JSON ist weder Vertrauensbeweis noch Ausführungsautorität. Catalog- und Factory-Ports bleiben vertrauenswürdige Host-Eingaben; Same-Realm-Code erhält dadurch keine harte Sicherheits-Sandbox.

## Compile-Time-Verbindung

`resolveComponentBinding()` gleicht die Aufrufstelle mit dem Provider-Interface ab und erzeugt bestehende State-Binding-Daten. Die Regeln kommen ausschließlich vom Provider. Der bestehende Classic-/Binding-Validator vergleicht die daraus gewonnenen Action-Feldnamen und Typen mit den tatsächlich deklarierten RMT-Actions.

Die [generierten Deklarationen](two-host.types.d.ts) enthalten:

- eine Provider-ID→Props-Map und eine Provider-ID→Intent-Payload-Map;
- die zugehörigen Interface-/Code-Versionen und Hashes;
- typisierte Provider-`emit`-Signaturen;
- eine diskriminierte `ComponentCall`-Union für JSX-Aufrufstellen mit Provider-String-Literalen.

Dadurch scheitern falsche Prop-Typen, unbekannte Props, unbekannte Events und unbekannte Quellfelder im Payload-Mapping schon im Typecheck. Die tatsächlichen Provider sowie der tatsächliche TSX-Kandidat werden dagegen geprüft. Die dafür benötigten Model-/Sprachhost-Deklarationen sind als [Fixture](../../tests/types/xtensions_component_candidate.d.ts) gekennzeichnet; sie implementieren weder eine allgemeine RMTX-Symbolauflösung noch ein Sprach-SDK. Action-Symbole und die Vollständigkeit eines Feldmappings prüft weiterhin die RMT-/Interface-Absenkung.

## Intent-Mapping

Der Vue-Provider deklariert und emittiert:

```json
{ "type": "changeSort", "payload": { "order": "rating" } }
```

Seine Aufrufstelle bindet dieses Event an eine bestehende Action:

```json
{ "command": "product.changeSort", "payload": { "sort": "order" } }
```

Der Mapping-Schlüssel bezeichnet einen Action-Parameter, der Wert ein Provider-Payload-Feld. Ohne Mapping gilt die identische Feldzuordnung. Profil v1 verlangt eine vollständige eindeutige Zuordnung aller Provider-Felder: kein stilles Weglassen, kein mehrfach verwendetes Quellfeld und keine ausführbaren Transformationen. Vertrauenswürdige `keyFields` bleiben ein separater vorhandener Binding-Mechanismus.

Die Runtime prüft zuerst die ursprüngliche Provider-Payload gegen dessen geschlossene Felder und Typen. Erst danach entsteht die Action-Payload. Diese läuft über denselben Host-Event-Port, dieselbe Binding-Registry und die normale RMT-Action-/Model-Kette. Quelle und Lifetime werden dabei weiterhin geprüft. Das Interface wählt keine Actions aus und schreibt keinen Model-State. Fachliche Regeln, etwa ob eine Bild-ID zum aktuellen Produkt gehört, bleiben ausdrücklich Aufgabe der Business-Action.

## Laufzeit und Vue-Fallthrough

Die Runtime löst den gepinnten Provider erneut aus dem unabhängig injizierten Catalog auf. Sie erzeugt die erwartete Binding-Form nochmals und vergleicht sie mit dem konkreten Maraca-Binding. Manipulierte serialisierte Aufrufstellen können dadurch die Compile-Time-Prüfung nicht einfach ersetzen. `assertComponentProps()` ist außerdem als Host-Policy bei Mount und jeder weiteren Props-Lieferung aktiv.

Der Vue-Provider erzeugt seine Runtime-Prop-Deklaration aus den providerseitigen Prop-Namen und ergänzt nur die vom Host injizierte `xtension`-Fassade. Er setzt `inheritAttrs:false`. So werden weder eine getrennte handgepflegte Props-Liste noch ein implizites Attribut-Fallthrough zur zweiten Schnittstellenquelle.

Der frühere `title`-Gegenfall wird an drei Stellen geprüft: Erweiterung der Aufrufstelle scheitert bei der Absenkung; manipulierte Plan-Daten scheitern vor dem Factory-Aufruf; eine direkte unbekannte Runtime-Prop-Lieferung erreicht das Framework nicht. Ein zusätzlicher direkter Vue-Test prüft die abgeschaltete Vererbung am Provider selbst.

Die Policy bleibt **deklarierte Props, provider-eigene Children/Slots**. Native RMTX-Children beziehungsweise Cross-Ownership-Slots sind damit nicht eingeführt. Lokaler Framework-State bleibt erlaubt; kontrollierte Felder behalten ihre Model-Autorität. Kernel, Fabric, gemeinsame Surface-Lifetime und unabhängige Host-Inkarnationen bleiben der bestehende Ausführungsweg.

## Prüfen und Weiterarbeiten

```sh
node development/rmtx-a06/two-host-inspect.cjs --check
node --test tests/xtensions/component-interface.test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness node development/rmtx-a06/two-host-test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/two-host-test.cjs --browser
```

Die zwei statischen Prüfungen sind zusätzlich im blockierenden `check:release-preparation` eingetragen. Die echten Framework-Läufe verwenden den bisherigen separaten Peer-Harness und liefern mit `--output` ihre beobachteten Ergebnisse. Fehlende Voraussetzungen sind Fehler, keine stillen Skips. Der [Contract-Nachweis](two-host-evidence.json) bindet die neuen Module, Providerdateien, Typen und Tests; der [Runtime-Nachweis](two-host-runtime-evidence.json) bezieht seine Ergebnisse auf genau diesen Stand.

Nach Änderungen werden zuerst Provider-Code und -Interface samt Versionierung geprüft, dann die Katalog-Pins sowie die Aufrufstellen-Pins bewusst aktualisiert. `two-host-inspect.cjs --write` erzeugt die abgeleiteten Typen und Quellenbindung neu; es erfindet keine neuen Provider-Schnittstellen und keine neuen Runtime-Ergebnisse.

Als Nächstes kann die automatische Owner-/Renderziel-Abbildung diesen Interface-Capture übernehmen und bis A05 weiterreichen. Neue Importgraphen, optionale Props/Defaults, öffentliche Paket-Einstiege, allgemeine RMTX-Referenzauflösung und kompatible Deployment-Migration benötigen eigene Verträge und Nachweise. Der aktuelle Schritt entscheidet die RMTX-Grammatik nicht vorab und ersetzt keine vollständige XTend-0.9-Feature-Abnahme.
