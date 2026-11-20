# Manuell geprüfte Abweichungen zur Classic-Oberfläche

Die kontrollierte Source8-Oberfläche wurde gegen die tatsächlich ausgelieferten Definitionen geprüft. Der Vergleich dient als Fundliste. Er erteilt keine automatischen Freigaben für `observedAttributes`, Shadow DOM oder vorhandene Methoden.

| Befund | Source8-Vertrag | Begründung |
| --- | --- | --- |
| `busy`, `invalid`, `density` an Input, Checkbox, Radio, Select | Explizit freigegebene skalare Attribute | Tatsächliche Darstellungs- und Validierungszustände der jeweiligen Komponente. |
| `density`, `busy`, `invalid`, `disabled` an Form | Explizit freigegebene skalare Attribute | Der Form-Zustand gehört zum verwalteten Formularprofil; kein Schreiben fremder Controls. |
| `disabled` an Link; `tone`, `open`, `hidden` an Toast | Explizit freigegebene skalare Attribute | Öffentliche Zustände mit eigener beobachteter Darstellung. Die Freigabe gilt nur für diese Tags. |
| Keymap `entries` als JSON-Attribut | Durch typisierte Property `entries` ersetzt | Strukturierte Daten werden nicht durch Attribute geschleust. |
| Modal `actions` als JSON-Attribut | Durch typisierte Property `actions` ersetzt | Nur deklarierte DTO-Felder; keine Callback-Funktionen aus Classic-Konfigurationen. |
| Textarea `submit-command` | Durch lexikalisches `RMT.On` und validierte Action ersetzt | Kein zweiter, frei benennbarer Legacy-Befehlskanal. |
| Writer `storage-key`, `api`, `method`, `autosave` | An Model und explizite Writer-/State-/Scheduling-Ports delegiert | Keine implizite globale Speicherung, beliebige Netzadresse oder eigener fachlicher Timer. Diese Attribute werden im Managed-Profil nicht als funktionierende Fähigkeiten beworben. |
| Form `name` ohne ausgelieferte Form-Semantik | Keine native Freigabe | Attribute werden nicht allein deshalb erlaubt, weil HTML sie kennt. |
| Tabs/Masonry: indexbasierte lokale Auswahl und geklonte Kinder | Typisierte `items`, `selectedKey` beziehungsweise `order`, eigene Element-Refs und `layout.bind` | Schlüssel behalten String-/Number-Identität. Renderer-Leases erhalten Originalknoten und erlauben keine globale Selektorsuche. |
| Tabs-Attribut `selected` als Classic-Index | In Source8 durch die typisierte Property `selectedKey` ersetzt | Ein Index darf bei Wiederholungsänderungen keine andere fachliche Auswahl bezeichnen und beim Attributreplay keine kontrollierte Schlüsselauswahl überschreiben. Der bestehende Classic-Vertrag bleibt erhalten. |
| Surface-Region/Window/Panel: `open`, `active`, `minimized`, `collapsed`, `pinned`, Labels, Bounds und Layout als frei gesetzte Attribute | Controller-Snapshot und deklarierte Komponentenbefehle | Diese Felder gehören dem vorhandenen Surface-Controller. Ein akzeptierter, im Managed-Profil wirkungsloser Setter würde falsche Model-Kontrolle versprechen. |
| Window `draggable`/`resizable`; Panel `resizable`, `closable`, `collapsible`/`collapsable`, `pinnable` | Explizite boolesche UI-Attribute | Sie schalten tatsächlich vorhandene Bedienflächen. Fehlende Managed-Attribute aktivieren keine Classic-Defaults; Controller-Fähigkeiten bleiben unabhängig davon erhalten. |
| Manager-Layoutattribute und Router-Konfigurationsattribute | Bestehender Manager-/Router-Host | Das Managed-Profil erzeugt keine zweite Layout- oder Routing-Engine. Manager-ID und Surface-ID bleiben geprüfte Besitzeridentitäten. |
| Portal-Ziel und Policy | Exakte Assertions der kompilierten Portal-Deklaration; geprüftes `update` | Ein nativer Host darf keine fremde Portal-Region auswählen oder über eine zweite Policy-Konfiguration ersetzen. |
| Kalender-Monatsnavigation | Optionale kontrollierte `viewDate`-Property und `calendar-view-changed` | Kalendertage werden als zivile `YYYY-MM-DD`-Werte geprüft; Zeitzonen dürfen den ausgewählten Tag nicht verschieben. Ungebundene Monatsansicht bleibt flüchtiger UI-Zustand. |

Die Abnahmematrix muss diese Unterschiede durch konkrete Rollenprüfungen belegen. Die Delegation von Writer-I/O und Scheduling benötigt insbesondere erfolgreiche RMT-/Host-Port-Integration; ein passiver Mount des Editors genügt dafür nicht.

## Prüfung der tatsächlichen Capability-Aufrufe

`matrix-capabilities.cjs` enthält die manuell geprüften Request-Pfade aller 47 Rollen. Sie ist eine Regressionsliste und wird vom Kataloggenerator nicht als Freigabequelle verwendet. Geprüft wurden die generischen Fokusbefehle, die Aufrufstellen der gemeinsamen Overlay-Lease, Header-Menüfokus, Keymap-Aktivierung, Lightbox-Fokusrestore, Tooltip-Anker, Menu-Tastaturfokus, Hero-Scrolling sowie Writer-, Media-, Clipboard-, Highlighting-, HTML- und Collection-Ports. Die dynamischen Resource-Attributtabellen und die sechs Plattform-Bindingnamen sind darin ihren tatsächlichen Besitzertags zugeordnet. `file.read` erfasst auch die private File-Handle-Aufnahme von Input und Form.

Dabei fehlte `focus.request` für Header, Keymap und Lightbox; diese drei expliziten Grants wurden ergänzt. Die übrigen geprüften Request-Pfade besitzen ihren jeweiligen Grant. Der Vertragstest prüft jede Zuordnung gegen authored und generierten Katalog und verlangt, dass ein unbekannter Request den Host-Port überhaupt nicht erreicht. Neue literale Portnamen in Definitionen oder gemeinsamen Native-Helfern erfordern eine erneute manuelle Klassifikation; der Test erteilt dadurch keine neuen Rechte.

Eigene Shadow-Controls wie die fest benannten `x-icon`-Kinder von Kalender, Hero, Status, Popover, Window und Panel verwenden die lokale eingebaute Icon-Definition. Sie erhalten keine eigenständige Autorität und keine zusätzliche Freigabe allein aufgrund ihrer Verschachtelung. Sollte ein fremd registrierter Pack diese festen Namen auf URL-Ressourcen umlenken, muss weiterhin der konkrete Parent die nötige Resource-Freigabe besitzen. Fehlt sie, verweigert der Besitzer die Anfrage. Der deklarierte Button-Icon-Pfad und das eigenständige `x-icon` besitzen dagegen ihre ausdrücklich kuratierte `resource.icon`-Fähigkeit.

## Lokale Funktionsbelege vom 20. November 2026

Die [Matrix](matrix.v2.json) enthält für jede der 47 Rollen den aktuellen Implementierungsstand, konkrete Berichtspfade und die Namen der tatsächlich ausgeführten Fälle. Die referenzierten Berichte sind zusätzlich durch SHA-256 gebunden. Der [aktuelle Chromium-Bericht](verification/catalog-browser-final.json) enthält 86 erfolgreiche Fälle: 61 UI-, acht Renderer-, einen Demo-, neun Plattform- und sieben Service-Fälle. Die [Cold-Registry-Prüfung](verification/catalog-cold-browser-final.json) ergänzt 38 ursprüngliche Fälle in 36 voneinander unabhängigen Browserkontexten. Sie prüft die jeweilige echte Definition und ihre statischen Abhängigkeiten ohne vorregistrierten vollständigen Katalog. Beim Eintragen der Matrix stimmten sämtliche 317 Quellenpins der gemeinsamen Browsersuiten und sämtliche 1196 Pins der Cold-Kontexte mit den aktuellen Dateien überein.

`verification: verified` bezeichnet hier ausschließlich den jeweils dokumentierten lokalen Prüfumfang. Die Definitionen der 46 produktiven Rollen wurden tatsächlich importiert und verwendet; die Demo bleibt eine Classic-CSR-Referenz und erhält keinen produktiven Native-Grant. Für UI-Komponenten sind gemeinsame Konstruktoridentität mit Classic und Suspend/Resume/Dispose in den benannten funktionalen Fällen belegt. Daraus folgt keine pauschale Freigabe aller Classic-Konfigurationen. Dienste besitzen keinen Custom-Element-Lebenszyklus; ihre tatsächlichen Besitz- und Dispose-Prüfungen stehen bei den Service-Fällen.

| Kategorie | Lokal verifiziert | Weiter offen | Nicht anwendbar |
| --- | ---: | ---: | ---: |
| Metadata2 einschließlich abschließender Pure-/Typprüfung | 0 | 47 | 0 |
| Definition beziehungsweise pure Service-Factory | 46 | 0 | 1 |
| Vollständige Attributoberfläche | 1 | 40 | 6 |
| Vollständige Property-Oberfläche | 2 | 22 | 23 |
| Vollständige Event-Oberfläche | 1 | 45 | 1 |
| Vollständige Command-Oberfläche | 10 | 36 | 1 |
| State-Vertrag | 0 | 46 | 1 |
| Slots und Ownership | 3 | 44 | 0 |
| Ressourcen und delegierte Fähigkeiten | 1 | 45 | 1 |
| Begrenzter Classic-Kompatibilitätsnachweis | 37 | 10 | 0 |
| Browser-Lebenszyklus | 43 | 0 | 4 |

Die offenen Attribut-, Property-, Event-, Command- und Ressourcen-Kategorien führen ihre noch nicht vollständig abgenommenen Mitglieder unter `remainingMembers` auf. Einzelne bereits beobachtete Verhaltensweisen ersetzen deren vollständigen Nachweis nicht. Beispielsweise sind ein Editor-Mount und sein Change-Event kein Nachweis für alle Writer-I/O-Pfade; ein Surface-Snapshot allein belegt keine vollständige Command-Matrix. Die erfolgreiche Utils-Transition wird dagegen durch den tatsächlichen Renderer-/Transition-Port, Fremdzielablehnung vor Dispatch sowie Widerruf gehaltener und verspäteter Arbeit nach Dispose belegt.

Alle 47 `acceptance`-Felder bleiben `pending`. Die Implementierung des Katalogs ist vorhanden; die vollständige Abnahme aller Fähigkeiten ist weiterhin offen. A06.5 für Tooling/Integration und A06.6 für die gemeinsame Zielabnahme von RMTX und XTensions 2.0 sind verpflichtende nächste Abschnitte. Dazu gehören die vollständige Rollenabnahme sowie ein zum finalen Quellenstand passender Ausführungsbericht des Release-Testprofils. `matrix.testProfile` und `matrix.executionEvidence` bleiben bis zu diesem echten Nachweis unbesetzt. Die 0.9-Freigabe bleibt `preparing`; die vorliegenden CSR-Browserfälle belegen keine Source8-SSR-/Resume-Abnahme.

## Begrenzte Text-, CSS- und Ressourcen-Sinks

Der manuelle Review der tatsächlich freigegebenen String-Attribute fand konkrete Managed-Sinks in Hero, Modal, Dialog, Section und Spinner. Die vier zusätzlichen Prüffälle stehen namentlich in `presentationSinkEvidence` der betroffenen Matrixrollen und sind im aktuellen Chromium-Bericht grün:

- Modal-Titel werden als Textknoten gesetzt. Richtext-Inhalt bleibt an der bestehenden DOMPurify-Grenze.
- Dialog-Breite und -Höhe werden vor dem ersten Attribut-/Property-Setter als einzelne CSSOM-Dimensionen validiert und angewendet. Stylesheet-Deklarationen, Markup, zusätzliche Regeln und URL-Funktionen werden vor Writes und Host-I/O abgewiesen.
- Hero-Farbwerte bleiben Farben. Hintergrundbilder bestehen aus genau einer geprüften HTTP(S)- oder Blob-URL und benötigen vor Browserzuweisung den vorhandenen Besitzer-Port. Alternative CSS-Bildfunktionen erhalten dadurch keine Freigabe.
- Section- und Spinner-Farben werden als `background-color` konsumiert; der vollständige Hintergrund wird zurückgesetzt. Auch `var(...)` kann daher keine URL über einen zuvor offenen `background`-Shorthand aktivieren.

Diese Korrekturen erweitern keine Fähigkeiten und führen keinen generellen Attribut-Fallthrough ein. Die bisherigen Classic-Pfade bleiben erhalten. Header-Enums sind normalisiert; die übrigen geprüften Label-, Input-, Type-, Progress-, Layout- und Icon-Farbpfade nutzen begrenzte DOM-/CSSOM-Werte beziehungsweise die vorhandene Ressourcenadmission. Die Matrix leitet aus diesen gezielten Regressionen keine vollständige Verifikation aller Attribute ab.
