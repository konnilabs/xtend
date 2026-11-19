# Geprüfte native Komponenten für Source7

Stand: 19. November 2026. Der Katalog1 beschreibt eine **explizit geprüfte Capability-Teilmenge** vorhandener XTend-Komponenten. Ein `ShadowRoot` oder ein statischer öffentlicher Setter reicht für die Aufnahme nicht aus. Die bisherigen Classic-Komponenten werden durch diese RMTX-Freigabe nicht verändert.

| Tag | Attribute | Properties | Native Slots |
| --- | --- | --- | --- |
| `x-button` | `disabled`, `label`, `text` | geerbtes `HTMLElement.title` | `default` |
| `x-header` | `title` | geerbtes `HTMLElement.title` | `actions`, `logo`, `nav`, `search`, `title`, `utility` |

Diese Listen sind vollständig: Es gibt weder globale HTML-Property-/Attributfreigaben noch implizites `data-*`-/`aria-*`-Fallthrough für `RMT.Component`. Das native HTML-Profil von `RMT.Element` behält seinen eigenen Vertrag. `slot` bleibt ein vom Compiler gesetzter Besitzmarker; Aufrufstellen dürfen das Attribut nicht selbst setzen.

Der Generator prüft die gewählten Attribute gegen die tatsächlich gelieferten Deklarationen, die Slots gegen den gelieferten Komponentenvertrag und die Properties gegen vorhandene Setter. Die einzige ausdrücklich geprüfte geerbte Property ist `HTMLElement.title`. Jedes Katalogrecord bindet den tatsächlichen Komponentenmodulpfad und dessen SHA-256. Neue Tags, neue beobachtete Attribute oder neue Setter werden nicht automatisch freigegeben. Eine Abweichung erfordert eine neue Prüfung und explizite Aufnahme in die Generator-Allowlist.

## Nachgewiesene Wirkung

Bei `x-button` entstehen Label und Textfallback über `textContent`; `disabled` steuert den eigenen Shadow-Button. Bei `x-header` verwendet der Titelfallback ebenfalls `textContent`. Die sechs Slots projizieren die originalen Light-DOM-Knoten in den eigenen Shadow-Baum. Headerinteraktionen lesen Slotknoten und können Fokus bewegen, ersetzen oder verschieben diese Knoten aber nicht. Die allgemeinen Headeroptionen für Logoquellen, Menüvarianten und Modalität gehören nicht zur freigegebenen Source7-Teilmenge.

Der echte DOM-Test verwendet die gelieferten Implementierungen von Header und Button. Er prüft direkte `assignedElements()` in Quellreihenfolge, den ausschließlich für benannte Textslots notwendigen Wrapper sowie HTML-ähnliche Label-/Titelwerte als unveränderten Text. Source7-Tests prüfen zusätzlich die Ablehnung nicht freigegebener Tags, Attribute, Properties und versuchter Metadatenerweiterungen. Die Lifecycleabnahme prüft Definition vor Property-Setzen, scoped Hooks und das Beibehalten nativer und fremder Instanzen.

## Gründe gegen eine automatische Shadow-DOM-Freigabe

Die erste Bestandsprüfung hat konkrete Gegenbeispiele in gelieferten Komponenten gefunden:

| Komponente | Befund |
| --- | --- |
| [`x-code`](../../../components/xcode.js) | `_render()` verschiebt Host-Kindknoten in ein neues Template und entfernt weitere Templates. |
| [`x-menu`](../../../components/xmenu.js) | Bearbeitet Light-DOM-Menüelemente und fügt ihnen verwaltete SVG-Knoten hinzu. |
| [`x-modal`](../../../components/xmodal.js), [`x-lightbox`](../../../components/xlightbox.js) | Verschieben den eigenen, vom Aufrufer angelegten Host nach `document.body`. |
| [`x-spinner`](../../../components/xspinner.js) | Verschiebt den Shadow-Inhaltscontainer samt Slot in einen Body-Overlay. |
| [`x-hero`](../../../components/xhero.js) | Ändert Klassen auf vom Aufrufer gelieferten `hero-title`-Knoten. |
| [`x-form`](../../../components/xform.js), [`x-radio`](../../../components/xradio.js) | Schreiben Werte beziehungsweise Checked-Zustand in weitere Controlinstanzen. |
| [`x-masonry`](../../../components/xmasonry.js) | Zeigt Kopien der gelieferten Inhalte statt deren ursprünglicher Knoten; deren native Identität ist damit kein Slotvertrag. |
| [`x-side-panel`](../../../components/xsidepanel.js) | Ändert Containerattribute und Styles auf Vorfahren und registriert sich bei einem umgebenden Surface-Manager. |
| [`x-tooltip`](../../../components/xtooltip.js) | Ein öffentliches `for` kann einen dokumentweit gefundenen fremden Anchor verändern. |
| [`x-alert`](../../../components/xalert.js) | `dismiss()` entfernt den vom Aufrufer angelegten Host. |
| [`x-writer`](../../../components/xwriter.js) | Die öffentliche `value`-Property schreibt HTML direkt in den Editor; ein bloßer skalarer Propertyvertrag genügt hier nicht. |

Auch für nicht in dieser Tabelle genannte Komponenten besteht keine automatische Source7-Freigabe. Sie benötigen einen eigenen überprüften Sink-, State-, Slot- und Besitzvertrag. Beispielsweise ist bei `x-player` in dieser Prüfung kein Light-DOM-Strukturschreiber gefunden worden; daraus folgt noch keine Freigabe seiner Medien-/URL-Sinks. Die gegenwärtige Teilmenge belegt den tatsächlichen nativen Slot-/Lifecyclepfad, ohne einen allgemeinen Cross-Ownership-Vertrag vorwegzunehmen.

## Runtimegrenze und Rendereranschluss

JSON-Katalog, kleiner CJS-Runtimekatalog und die generierte Tag-Typunion entstehen aus derselben expliziten Allowlist. Port3 prüft die Records auch zur Laufzeit gegen diesen Katalog: Ein strukturell korrektes Header2-Record darf weder einen anderen Tag noch einen anderen Modulhash oder zusätzliche Attribute, Properties beziehungsweise Slots behaupten.

`createNativeComponentRegistry(program, supplied)` beziehungsweise `Port3.createComponentRegistry` erzeugt daraus den unveränderlichen Renderer-Capabilityport. `resolveComponentCapability` gewährt ausschließlich die im gültigen Programm erfassten Properties. Eine vom Aufrufer gelieferte Capability- oder Descriptorauflösung wird nicht übernommen. Nur die vertrauenswürdigen operativen Methoden `ensureTags`, `hydrate`, `bindComponentInstance` und `snapshot` werden mit ihrem ursprünglichen Receiver weitergereicht; das gelieferte Registryobjekt wird nicht eingefroren.

Die Headerprüfung hat zusätzlich einen konkreten Fehler in der bisherigen globalen Modalitätsmarkierung geschlossen: Ein Header darf den Bodymarker nur löschen, wenn er selbst dessen Lease erworben hat und der Marker noch zu dieser Lease gehört. Gleiche ID-Texte oder ein inaktiver Source7-Header erteilen dafür keine Autorität. Der Fix erhält das bisherige positive Verhalten explizit modaler Legacy-Header; deren allgemeine Menü-/Modaloptionen werden dadurch nicht Teil der Source7-Freigabe.
