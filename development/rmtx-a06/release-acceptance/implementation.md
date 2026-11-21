# A06.6 – Gemeinsame Ziel- und Releaseabnahme

Stand: **21. November 2026**. Dokumentrevision: **1.1.0**. Implementierungsbasis: Repositorycommit `416cbdea` plus aktueller Worktree. **A06.6.1 ist als versionierter Ziel-/Policyvertrag implementiert.** Der Benutzer hat native RMTX-Inhalte und React/Vue mit CSR und synchronem Node-SSR als 0.9-Zielumfang bestätigt. Der SSR-Anschluss A06.6.2 und die gemeinsame technische Releaseabnahme bleiben offen.

Die [zentrale Bestandsaufnahme](../../XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) führt den Gesamtstand. [A06.5](../project-tooling/implementation.md) ist implementiert und lokal geprüft: gemischte Classic-/RMTX-Projekte, gemeinsame Compile-/Cacheidentität, semantischer Sprachservice, CLI, Watch, MCP, Maraca und Scaffold. Seine formale Releaseprofil-/ExecutionEvidence-Bindung bleibt offen. Beide Features stehen im [Releaseplan](../../../scripts/release/feature-scope.json) weiterhin auf `preparing`.

## 1. Bereits vorhandene Grundlage

| Bereich | Vorhandener Nachweis | Grenze für A06.6 |
| --- | --- | --- |
| Compiler und Sprache | Geschlossene Sourceprofile 1–8, v1-Default, gemeinsame Classic-Backendprüfung und erhaltene rohe Compilerresultate. | Neue Render-/Resumeziele erhalten keine Freigabe allein durch erfolgreiche Kompilierung. |
| Projekt- und Editortooling | Tatsächliche gemischte CSR-Builds, transitive Invalidierung, Providerpins, originale Ranges, Completion, Navigation und Rename. | A06.5 benötigt noch ein gebundenes Releaseprofil; seine Implementierung wird nicht erneut geplant. |
| State und Orchestrierung | Kontrollierte Props, validierte Intents, stabile typisierte Keys, URL-/History-Restore sowie Kernel/Fabric und Besitzer-/Generationsgrenzen. | CSR-Restore und fachliches Suspend/Resume belegen keine SSR-Adoption. |
| Framework-SSR | [A05](../../rmtx-a05/README.md) und [Komponenten-SSR v2](../scoped-components.md): signierter Model-Restore, echte React-/Vue-Adoption, erhaltene DOM-Knoten, Replay/Deduplizierung und begrenzter Fallback. | Die dort ausgeführten Classic-/Komponentenfixtures sind kein Nachweis für aktuelle RMTX-Quellen oder Source8. |
| Nativer Katalog | 36 UI-, sechs Plattform- und vier Servicerollen sowie eine Demo; funktionale CSR-, Cold-Registry- und Produktionsbelege. | Alle 47 Rollen bleiben in der vollständigen Abnahmematrix `pending`; einzelne erfolgreiche Fälle schließen keine ganze Fähigkeitsoberfläche. |

Die [A06.5-Ausführungsübersicht](../project-tooling/execution-summary.md) dokumentiert lokale SDK-Läufe mit je 1455 Checks auf Node 24.22.2/26.5.0, gemischte CSR-Läufe, Source7-/Source8-Retention, gepackte Consumer und den echten VS-Code-Extension-Host. Der getrennte lokale Quellenabschluss bestand je 28 Strict-Checks ohne Fehler oder Skips; 53 historische Inventarwarnungen blieben erhalten. Diese Originalbelege gelten für ihre tatsächlichen damaligen Quellenstände. Die aktuelle Dokumentationsfortschreibung ist keine neue Ausführung.

## 2. Tatsächlich gesperrte Zielkombinationen

Der ausgewählte Zielumfang ist in [Zielmatrix v1](targets.v1.json) pro Sourceprofil, Einstieg und Runtime festgelegt. Die nachstehende Übersicht erfasst die weiterhin geltenden Implementierungsgrenzen; die Zielwahl hebt sie nicht auf.

| Eingang / Ziel | Aktueller Stand | Offene Entscheidung beziehungsweise Arbeit |
| --- | --- | --- |
| Classic und erhaltene Komponenten-SSR-Profile | Eigene versionierte Node-/Browser-Handoffs vorhanden. | Kompatibilität und Sicherheitsvertrag am gemeinsamen Freigabestand regressionssichern. |
| RMTX-Sourceprofile 1–3 | CSR-Frontend- und Frameworkbelege vorhanden. Die erhaltenen Source1-/Source2-Fixtures verwenden das SSR-gesperrte statische Komponentenprofil; Source3 verwendet die Scoped-Komposition mit eigenem bestehenden SSR-v2-Weg. | Produktive RMTX-Quellen durch die freizugebende SSR-/Restore-/Replaykette führen. Sourceversion allein bestimmt die Komposition nicht; alte Classic-SSR-Belege nicht umdeuten. |
| RMTX-Sourceprofile 4–8 | CSR vorhanden; SSR und Adoption werden ausdrücklich verweigert. | Unterstützte Kombinationen auswählen, versioniert anschließen und tatsächlich ausführen. Ausgeschlossene Kombinationen bleiben abgesichert. |
| Gemischte Classic-/RMTX-Projekte | Projekt-API1 und tatsächliche CSR-Programmverknüpfung vorhanden. | Gemeinsame Quellidentität und Providerpins durch den freizugebenden SSR-Handoff führen. |
| Portable Page-Ausgabe unter Node/PHP | Bestehende Classic-Zielverträge; `.rmtx` und effektive gemischte RMTX-Projekte werden abgewiesen. | Portable RMTX-Ausgabe ist für diesen 0.9-Umfang ausdrücklich ausgeschlossen und benötigt ein eigenes Folgeprofil. |

Die Sperren stehen tatsächlich in [Kompositionsruntime](../../../xtend-maraca/xtension-composition-runtime.mjs) (`createMaracaXTensionCompositionPort`), [Browserkomposition](../../../xtend-maraca/browser-composition-runtime.mjs), [Planruntime](../../../xtend-maraca/plan-runtime.mjs) und [Page-Build](../../../tools/rmt-language/page-build.js) (`compileDefinition`). Eine Flagänderung oder das Entfernen dieser Guards ersetzt keinen SSR-/Snapshot-/Adoptionsvertrag.

## 3. Arbeitsgliederung

Die folgenden Unterabschnitte sind Arbeitskennungen. A06.6.1 schließt die Zielwahl und deren lesende Prüfung ab; A06.6.2–6 bleiben offen. Der private Planvertrag ist keine neue produktive Compiler-/SSR-Wireversion.

| Abschnitt | Arbeit | Überprüfbares Abschlusskriterium |
| --- | --- | --- |
| **A06.6.1 – Zielmatrix und Policyumfang – implementiert** | [Zielmatrix v1](targets.v1.json), [Validator API1](target-contract.cjs) und [lesender Inspector](inspect.cjs): vier Zielfamilien, acht erhaltene Sourceprofile, sieben geschlossene Policies, elf Ausschlüsse und 53 geplante positive/negative Fälle. | Versionierte Einstiege, Source-/Kompositionspins und alle 120 ausgewählten Framework-/Source-/Projektmodus-Kombinationen besitzen Pflichtfälle. Schema-, Scope-, Policy- und Referenzdrift blockiert die vorhandenen Vorbereitungsgates. Keine Runtimeabnahme wird behauptet. |
| **A06.6.2 – Versionierter SSR-Anschluss** | Die gewählten RMTX-Ziele einschließlich gemischter Projekte an Build, native View, Providerkomposition, Snapshot, Browser-Adoption und Replay anschließen. | Ein echter vertikaler Produktionsfall besteht mit nativer View und React-/Vue-Hosts, stabilen Keys und Restore vor Adoption vor Replay; bestehende Profile bleiben unverändert nutzbar. |
| **A06.6.3 – Vollständige Rollenabnahme** | Sämtliche 47 Matrixrollen samt ihren tatsächlich angebotenen Mitgliedern und delegierten Besitzerports prüfen; bestehende Teilbelege zuordnen. | Je Rolle `acceptance: verified`, jede Kategorie vollständig `verified` oder begründet nicht anwendbar, konkrete Evidenz und geschlossene `remainingMembers`. |
| **A06.6.4 – Gemeinsame Ziel- und Qualitätsläufe** | Classic-/RMTX-Parität, CSR, freigegebene SSR-/Restore-/Replayfälle, Browser, Integrität, Ownership, Pakete und feste Größenbudgets am vorgesehenen Freigabestand ausführen. | Tatsächliche Produktionsausgaben und Host-/Browserwirkungen bestehen einschließlich der jeweiligen Negativfälle; kein Skip oder Inspector ersetzt einen geforderten Runtimefall. |
| **A06.6.5 – Releaseprofile und ExecutionEvidence** | Passende Testkatalogprofile registrieren beziehungsweise vervollständigen; beide Features, Katalog und Milestones an standardisierte Ausführungsberichte binden. | Profilauflösung, vollständige Suiteergebnisse sowie Run-, Commit-, Quellen-, Katalog- und Runtime-Provenienz bestehen die vorhandene Verifikation. Erst dann Readiness umstellen. |
| **A06.6.6 – Finaler Quellen-, Paket- und Sealabschluss** | Finalen autorisierten Quellstand erfassen, Authority-/Package-/Securitygates auf den gepinnten Lanes ausführen und den bestehenden GitHub-Versiegelungspfad verwenden. | Sämtliche vorgeschriebenen Belege gehören zu demselben finalen Commit und den exakten Kandidatenbytes. Prepare und Publish bleiben getrennte Freigaben. |

Der nächste Einstieg ist **A06.6.2**: eine gemischte `.rmt`-/`.rmtx`-App mit nativer View, React-/Vue-Hosts, importierter Classic-Action und typisierten Keys. Damit werden Projektgraph, RMTX-Lowering, Model, Kernel/Fabric und SSR-/Replaykette gemeinsam geprüft. Anschließend müssen die übrigen ausgewählten Source-/Projektkombinationen dieselbe Abnahme durchlaufen; der vertikale Source8-Fall allein schließt die Matrix nicht.

### Ziel- und Policyentscheidung

| Ausgewähltes Ziel | Sourceprofile | Implementierungsgrenze |
| --- | --- | --- |
| React/Vue CSR | 1–8 | Vorhandener CSR-Pfad; gemeinsame Releaseabnahme offen. |
| Native RMTX-CSR | 5–8 | Vorhandene native View und verwaltete Clientaktivierung; Katalogabnahme offen. |
| React/Vue synchrones Node-SSR | 1–8 | Neuer versionierter RMTX-Handoff unter A06.6.2 erforderlich. Erhaltene SSR-API2 gilt weiterhin nur für ihre Legacy-/Scoped-Kompositionen. |
| Native Light-DOM-SSR und stabile verwaltete Host-Shells | 5–8 | Neuer Anschluss unter A06.6.2; native Komponenteninternas bleiben clientseitig. Keine serverseitige Custom-Element-/Shadow-DOM-/Serviceausführung. |

Alle vier Ziele gelten für Standalone, RMTX-Projekteinstieg und Classic-Projekteinstieg mit effektivem RMTX-Profil. Geplante Coverage bindet jede Kombination an einen benannten Sourcefall; die gemischten Import-/Actionfälle bleiben zusätzliche Pflichten.

Die Policies sind geschlossen: Lanes bezeichnen Kernelpriorität, die Dispatchstrategie bleibt getrennt. Source6-Mount behält `visible`; Source7/8 reichen alle sechs vorhandenen Lanes weiter. Laden erfolgt im vorhandenen On-Mount-Profil nach tatsächlicher Kernelzulassung über Fabric. Ohne Admission bleibt der Host ungemountet. Abbruch widerruft Fortsetzungsrechte, nicht bereits laufende native ESM-Übertragung. Nur explizite `timeoutMs` gelten; ein neuer Versuch braucht neue Autorisierung. Es entsteht keine automatische Fehler-/Timeout-/Retrydarstellung. Providerinternes CSR-UI und lokaler Frameworkstate unter der Host-Lifetime bleiben möglich; kontrollierter fachlicher State gehört dem Model und Deep Links XTend State.

SSR bleibt synchron und vorkompiliert. Asynchrone Provider-/Peerloader sind damit vereinbar; Streaming und asynchrones Komponenten-/Render-/Adoptionsverhalten sind eigene Folgeprofile. Die Prüfung bekannter Root-/Suspense-/Teleportformen ist keine vollständige Analyse beliebiger vertrauenswürdiger Providerprogramme. Fallback ist standardmäßig `reject`; explizites `mount` darf ausschließlich einen abweichenden Frameworkunterbaum bei gültiger Autorität ersetzen. Ein tatsächlicher Hydrationsfehler bleibt ein Fehler ohne Replay. Container und Styles liegen beim Author; weder Lanes noch Bytebudgets garantieren Layoutreservierung oder CLS.

Ausgeschlossen sind portable RMTX-Page-Ausgabe unter Node/PHP, weitere Frameworkadapter, Streaming-/Async-SSR, Cross-Ownership-Slots/Portale, isolierte Fremdcodehosts, automatische Deploymentmigration, beliebige SSR-/PWA-/AppServices-Kombinationen, universelles natives DOM-Eventreplay, automatische Plattformfehlerdarstellung, pauschale Layoutgarantien und serverseitige Managed-Internas. Die zugeordneten Negativfälle erhalten diese Grenzen. Vorhandene Classic-Ausgabe und providerinterne UI werden dadurch nicht eingeschränkt.

### Maschinenprüfung von A06.6.1

```sh
node development/rmtx-a06/release-acceptance/inspect.cjs --check
node --test --test-concurrency=1 tests/release/rmtx-target-contract.test.cjs tests/release/preparation-gates.test.cjs
```

Plan-, API- und Prüfberichtkennung beginnen ausdrücklich mit v1/1.0.0. Der Inspector liest ausschließlich Quellen und schreibt keine Reports, Pins oder Freigaben. Er prüft die fünf tatsächlichen versionierten Einstiege ohne deren Module auszuführen, enthaltene vorhandene Quellpfade, geschlossene Ziel-/Policyfelder, Pflichtfallverweise und jede ausgewählte Coveragekombination. Ungültige Versionen, unbekannte Felder, fehlende Profile/Pflichtfälle, Traversal und aus dem Repository führende Symlinks scheitern. Die Tests prüfen diese Fehler durch Mutationen einer vorher gültigen Matrix.

Die beiden neuen Befehle laufen blockierend über die bestehende [Vorbereitungsliste](../../../scripts/check_release_preparation.cjs) und damit deren bestehende GitHub-/Nightly-Aufrufer. Feature-Scope-/Readiness-v2 und die drei vorhandenen Core-Authorityregistrierungen bleiben unverändert. `valid: true` bedeutet hier ausschließlich einen konsistenten Plan; `acceptedForRelease` bleibt `false`, alle 53 Runtimefälle bleiben `planned`, `executionEvidence` bleibt `null`. Referenzdateien sind Ausgangspunkte für spätere echte Läufe.

### SSR-, Restore- und Replayabnahme

Der vorhandene A05-Vertrag bleibt Ausgangspunkt: gültige Signatur und Herkunft, Provider-/Interface-/Artefaktpins, Owner und Generation sowie die erwartete Shell sind vor Restore und Adoption zu prüfen. Der neue Pfad muss tatsächliche DOM-Identität, typisierte und verschachtelte Keys, Reordering/Reinkarnation, gehaltene Intents, Deduplizierung, ungültige Replay-Batches, Cancellation und ausdrücklichen Fallback abdecken. Das betrifft die freigegebene Intent-/Replayoberfläche; universelles DOM-Event-Replay ist dadurch nicht zugesagt.

Ein frischer Mount ist nur innerhalb des ausdrücklich freigegebenen Fallbackvertrags zulässig und wird als solcher berichtet. Er darf ungültige Signaturen, fremde Besitzer oder unpassende Provider-/Stateidentitäten nicht heilen. Source7-`Hydrate` als fachliche Contentoperation bleibt von SSR-Adoption unterschieden. Neue Datenformen und Fähigkeiten benötigen passende neue Vertragsversionen; bestehende SSR-v1/v2-Daten dürfen nicht still erweitert werden.

## 4. Noch offene Katalogabnahme

Die [Matrixbewertung](../native-component-catalog/matrix-review.md) und [Matrixdaten](../native-component-catalog/matrix.v2.json) sind maßgeblich. Für den ausgewerteten Stand gelten:

| Kategorie | Lokal verifiziert | Weiter offen | Nicht anwendbar |
| --- | ---: | ---: | ---: |
| Metadata2 einschließlich abschließender Pure-/Typprüfung | 0 | 47 | 0 |
| Definition beziehungsweise pure Service-Factory | 46 | 0 | 1 |
| Vollständige Attributoberfläche | 1 | 40 | 6 |
| Vollständige Propertyoberfläche | 2 | 22 | 23 |
| Vollständige Eventoberfläche | 1 | 45 | 1 |
| Vollständige Commandoberfläche | 10 | 36 | 1 |
| State-Vertrag | 0 | 46 | 1 |
| Slots und Ownership | 3 | 44 | 0 |
| Ressourcen und delegierte Fähigkeiten | 1 | 45 | 1 |
| Begrenzte Classic-Kompatibilität | 37 | 10 | 0 |
| Browser-Lebenszyklus | 43 | 0 | 4 |

`pending` bezeichnet hier eine noch nicht vollständige Abnahme. Die Metadataimplementierung und Pure-/Typprüfungen sind vorhanden; deren finaler gebundener und rollenbezogener Abschluss fehlt. Die Zahl offener Kategorien oder Mitglieder ist keine Zahl unabhängiger Implementierungsfehler.

UI-, Renderer-, Plattform-, Service- und I/O-Rollen lassen sich als getrennte Abnahmepakete bearbeiten. Besonders Writer-Save/-Export/-Storage und Bildressourcen, Router-/Controllerbefehle sowie State-/I18n-/Theme-/Utils-Delegation benötigen ihre echten Besitzerports. Positive Wirkung, Argument-/DTO-Prüfung, kontrollierter Modelrückweg, fremde Owner, alte Generationen, gehaltene/verspätete Arbeit und Dispose sind rollenbezogen nachzuweisen. Ein Mount oder Change-Event genügt für diese Oberflächen nicht. Leere `remainingMembers` delegierter Dienste sind keine automatische Verifikation; eine tatsächlich nicht anwendbare Kategorie muss begründet sein.

## 5. Formale Freigabe und Evidenz

Der lesende [Readiness-Check](../../../scripts/release/feature-scope.cjs) findet am ausgewerteten Stand einen gültigen Plan, aber `ready: false` mit 52 Blockereinträgen: 47 Rollen, zwei Features, eine fehlende Katalogprofilbindung und zwei Milestones. Diese Einträge sind Abnahmebedingungen, keine 52 neuen Codefehler. Der Ziel-/Policyvertrag A06.6.1 ändert daran nichts.

| Bindung | Noch erforderlich |
| --- | --- |
| RMTX und XTensions 2.0 | Jeweils `ready` mit tatsächlichem `testProfile` und `executionEvidence`. Beide stehen weiterhin auf `preparing`; die Bindungen sind `null`. |
| Nativer Katalog | Alle Rollen und Kategorien abgenommen; die aktuell noch fehlenden Matrix-Rootfelder `testProfile` und `executionEvidence` mit echten Nachweisen versehen. |
| A06.5 und A06.6 | Jeweils `verified` mit Profil und Evidence. A06.5 bleibt bis dahin im Releaseplan `implemented`, ohne dass seine bereits vorhandene Implementierung erneut erforderlich wird. |

Das Featuregate schreibt keinen besonderen A06.6-Profilnamen vor. Verwendet werden müssen tatsächlich registrierte Profile des [Testkatalogs](../../../scripts/test-runner/catalog.json). Erwartet werden standardisierte ExecutionReports mit vollständigen Suiteergebnissen; ihre [Verifikation](../../../scripts/test-runner/executor.js) bindet Run, Commit, Quellfingerprint, Katalogfingerprint und Runtime. Die lokalen A06.5-Receipts sind zusätzliche Originalbelege und können nicht unverändert als dieser Berichtstyp eingetragen werden. Reportfelder oder Quellhashes werden nicht nachträglich auf einen anderen Stand umgeschrieben.

Die [Releasepolicy](../../../scripts/release/profile.cjs) pinnt die Paketlanes auf **Node 24.18.0 und 26.5.0**. Lokale A06.5-Ausführungen unter 24.22.2/26.5.0 bleiben davon getrennt. Finale Größen-, Artefakt-, Quellen-, Schema-/Authority-, Consumerpaket- und Browser-/Securityprüfungen müssen den tatsächlichen Freigabecommit und seine exakten Kandidatenbytes binden. Die bisherigen festen Grenzen von 240000 Runtime-, 280000 Komponenten- und 2200000 Frameworkbytes sowie die jeweiligen relativen Produktionsgrenzen bleiben bestehen.

Der [Core-Seal](../../../scripts/release/core-auth.cjs) erfordert den vertrauenswürdigen GitHub-Workflow auf `main`, `workflow_dispatch`, den genauen Commit, Run und Attempt sowie erfolgreiche Pflichtjobs und unveränderte Artefaktbytes. Einzelne lokale Tests ersetzen diese Authentifizierung nicht. Der [Workflow](../../../.github/workflows/xtend-default-gates.yml) trennt die bestehenden Prepare- und Publishmodi.

Die [Consumer-Evidenz](../../../scripts/release/core-evidence.cjs) verlangt auf beiden Paketlanes zwei tatsächliche Installationen: alle zehn SDK-Kandidaten sowie den gewählten Releasescope mit exakter Abhängigkeitsclosure. Nachzuweisen sind insbesondere Entrypoints, Typen, Binärpfade, Dateien, reale Auflösung und Runtimeimporte sowie MCP-Knowledge-Generierung und deren Check. Hinzu kommen die vollständigen Strict-Quellenberichte beider Lanes und ein eigener [Security-Browsernachweis unter Node 24.18.0](../../../scripts/release/core-security.cjs). Die Consumer-, Strict- und Security-Rohbelege unterliegen dem bestehenden Ein-Stunden-Freshnessfenster bei ihrer ursprünglichen Versiegelung. Die Reihenfolge des finalen Runs muss dieses Zeitfenster einhalten; alte lokale Erfolge werden dafür nicht neu datiert.

Der aktive [FirstRelease-Authority-Guard](../../../tools/schema-inventory/engine.cjs) ist zusätzlich eine Publikationsgrenze. Seine gesondert autorisierte sourcegebundene Ablösung wird hier weder vorgenommen noch genehmigt. Eine vorbereitete Versiegelung ist bereits ohne Publishfreigabe möglich; nach einem späteren autorisierten Quellenabschluss müssen endgültige Releaseartefakte und ihre Evidenz vom finalen SHA neu erzeugt werden. [Unreleased-/Prepare-Vertrag](../../core-unreleased-registration.md).

## 6. Pflege und Grenzen dieser Fortschreibung

Die neue Matrix, der Validator und diese Fortschreibung gehören nicht zum historischen A06.5-Quellenarchiv. Der spätere Inventar-/Authority- und Quellenabschluss muss sie frisch erfassen. A06.6.1 erzeugt keine neue Strict-, Paket-, Browser- oder standardisierte ExecutionEvidence und lockert keine vorhandene SSR-/Adoptionssperre. Die lokale fokussierte Prüfung wird im [Ausführungsstand](execution-summary.md) getrennt von der noch ausstehenden Runtimeabnahme dokumentiert.

Frühere Detaildokumente und Analysen behalten ihre datierten Profilverträge und originalen Belege. Hinweise auf dort damalige Folgearbeiten sind anhand des aktuellen Gesamtstands zu lesen. A06.5 ist als Implementierung abgeschlossen; seine formale Releasebindung und die A06.6-Ziele bleiben getrennt sichtbar.

Diese Fortschreibung ändert ausschließlich Markdown-Dokumente. Sie setzt keine Matrixrolle auf `verified`, ändert keinen Releaseplan oder Guard und erzeugt keine neue Runtime-, Browser-, Package- oder Strict-Evidenz. Historische Captures und ihre Membership-/Bytepins bleiben erhalten. Der spätere vollständige Source-/Authorityabschluss muss auch den dann gültigen Dokumentenstand binden.
