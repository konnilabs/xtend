# A06: Syntaxentscheidung für RMTX

**Status: angenommen. Entscheidungsversion: 1.0.0. Datum: 15. November 2026.** Die Plattformentscheidung wurde nach dem [Two-Host-Vergleich](syntax-comparison/README.md) ausdrücklich durch den Nutzer bestätigt. Sie legt das Authoringziel fest; sie behauptet keine bereits vollständige produktive RMTX-Implementierung.

## Verbindliche Entscheidung

RMTX wird ein **statisches, deklaratives Orchestrierungsfrontend mit TSX-kompatibler Grammatik**. Seine öffentliche Dateiendung ist **`.rmtx`**. Die TSX-Grammatik wird für Parsing, strukturelle Syntax und wiederverwendbare TypeScript-Werkzeuge genutzt. Daraus folgen keine React-Laufzeit und keine Ausführung beliebigen TypeScript-Codes beim Build oder im Browser.

Die kanonische Operatorform verwendet **qualifizierte `RMT.<Operator>`-Elemente mit JSX-Attributen und gegebenenfalls Kindern**. Die beiden zulässigen strukturellen JSX-Formen sind:

```tsx
<RMT.Foo prop="bar" />

<RMT.Foo prop="bar">
  <RMT.Bar value={model.product.id} />
</RMT.Foo>
```

`Foo` und `Bar` sind hier Grammatikplatzhalter, keine neu freigegebenen Operatoren. Ein selbstschließendes Element hat keinen zusätzlichen Endtag; ein Element mit Kindern hat einen passenden Endtag. Attribute, Namensauflösung und Kinder müssen darüber hinaus dem jeweiligen versionierten Operatorvertrag entsprechen.

RMT-Operatoren werden durch ihre tatsächliche Compiler-/Symbolidentität erkannt. Ein gleichnamiges fremdes Objekt oder eine beliebige Komponente erhält dadurch keine native Orchestrierungsbedeutung. Der Compiler muss das gesamte Modul vor Backendabsenkung und Auslieferung auf seine deklarative Zulässigkeit prüfen; die Authoring-Source wird dabei nicht ausgeführt. Eine gewöhnliche JSX-Factory genügt nicht als RMTX-Compiler.

**RMT Classic bleibt die bestehende `.rmt`-Sprache.** `.tsx` bleibt für reguläre TSX-/Framework-Provider und gegebenenfalls ausdrücklich profilierte Views verfügbar. `.rmtx.tsx` bleibt ein historischer Vergleichs-/möglicher Migrationsweg, ist keine zweite öffentliche RMTX-Standardendung. Die Byte-identischen Kontrollfixtures des Vergleichs werden als Experiment beibehalten.

## Architekturgrenzen

Model, Actions, Provider-Bindings, Surfaces, Lifecycle, Scheduling und Ressourcenbesitz müssen in den vorhandenen validierten Backend-/Maraca-/Kernel-Verträgen erhalten bleiben. Die Wahl von TSX ändert weder den RMT-Microkernel noch die Vermittlung über Fabric oder die Autorität von Surface-/Kernel-Ressourcenleases.

Providerinterfaces und Payloadschemata bleiben providerseitig deklariert und unabhängig erfasst. RMTX-Aufrufstellen liefern geprüfte Referenzen, Props-Bindings und Intent-/Actionkanten; ein Dateiname oder JSX-Attribut erzeugt keine zusätzlichen Hostcapabilities oder Admission-Grants.

Die im Vergleich verwendete freie Schreibweise `<ProductHeader ... />` ist ein geschlossenes natives UI-Experiment. Sie definiert keine zweite unqualifizierte Grammatik für Orchestrierungsoperatoren. Das allgemeine native UI-/Komponentenprofil und dessen Abbildung auf Renderdeskriptoren werden gesondert implementiert und geprüft.

## Verpflichtender Toolingumfang

Die VS-Code-Erweiterung erhält `.rmtx`-Erkennung, einen eigenen RMTX-Sprachmodus, TSX-gerechtes Syntax Highlighting sowie passende Sprachkonfiguration und Snippets. Die installierte Erweiterung dieser lokalen Instanz wird mit dem gebauten Paket aktualisiert; Paketversion und tatsächlicher Installationsstand werden im [Updatebericht](vscode-rmtx-update.md) festgehalten.

RMTX-Dateien dürfen nicht als Classic-Source an den vorhandenen Classic-Language-Server oder Classic-Build-/Lintpfad delegiert werden. Highlighting und Sprachregistrierung sind getrennt von einer noch zu implementierenden vollständigen RMTX-Typ-, Diagnose-, Completion- und Renameintegration auszuweisen. Diese muss auch im CLI-/Buildpfad gelten; eine reine Editorkonfiguration ersetzt den Compiler nicht.

Für `.rmtx` muss die künftige Toolchain ausdrücklich Discovery, Sourceprofil und Syntaxversion, virtuelle TypeScript-Dateien, Diagnoserückabbildung, Importgraphen, Watch-/Cacheinvalidierung sowie CLI-/MCP-Einstiege unterstützen. Der [Dateiendungsversuch](syntax-comparison/extension-assessment.md) belegt den kleinen virtuellen TSX-Anfangsschritt und dokumentiert die verbleibenden Integrationsarbeiten.

## Abnahme und Folgeschritte

Die **native Headerprüfung im tatsächlichen Two-Host-/Maraca-Ausführungspfad** ist der nächste konkrete Gate vor der produktiven Frontendimplementierung. Sie muss insbesondere initiales Rendering, Modelupdates, sichere Textdarstellung, Erhalt fremder Providerroots sowie Cleanup über den vorhandenen Lifecycle prüfen. Ein isolierter Rendererbeweis allein ersetzt diesen Lauf nicht.

Die [tatsächliche native Headerprüfung](native-header-check.md) ist inzwischen ausgeführt: je Variante bestehen **13 von 17 Erwartungen** unter Node 24, Node 26 und Chromium. Vier Lifecycle-/Boundary-Erwartungen sind noch offen. Damit ist die Syntaxentscheidung angenommen, die vollständige native Lifecycle-Abnahme vor der produktiven Frontendimplementierung aber noch nicht erteilt.

Die Syntaxrichtung und Endung sind mit dieser Entscheidung festgelegt. Noch auszuarbeiten sind der konkrete Operatorenkatalog, zulässige Ausdrucksformen und Scopes, versionierte UI-/IR-Abbildung, Source-Mappings und die vollständigen Profilgrenzen. Die weiteren Gegenfälle aus dem [Operatoraudit](operator-and-tsx-feasibility-assessment.md) bleiben Implementierungs- und Abnahmeanforderungen: große Actions/Policies, Selector-Präzedenz, verschachtelte Key-Hosts, SSR/Adoption, Ownership, Abbruch und ungültige Sourceeffekte.

Die bisherigen Vergleichsnachweise bleiben beobachtete Experimente ihres jeweiligen Quellstands. Ihre damaligen Felder wie `syntaxDecisionMade: false` werden nicht nachträglich als neue Laufzeitergebnisse umgeschrieben. Diese ADR ist die maßgebliche nachfolgende Plattformentscheidung.
