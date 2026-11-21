# A06.6.2 – Versionierter RMTX-SSR-Handoff

Stand: **21. November 2026**, Vertragsrevision **1.1.0**. Dieser Anschluss ergänzt die [Zielentscheidung A06.6.1](implementation.md). Die gemeinsame Zielmatrix, vollständige Katalogabnahme und Releasebindung bleiben unter A06.6.3–6 offen. Der konkrete Ausführungsstand steht im [Prüfbericht](ssr-execution-summary.md).

## Einstiege und Versionen

| Grenze | Neuer Vertrag | Erhaltene Grundlage |
| --- | --- | --- |
| Produktionsbuild | `buildMaracaRmtxSSRBundleAsync`, API1; `xtend.maraca.rmtx-ssr-build-options.v1` und `build-result.v1` | Projekt-API1, tatsächliche Compilerresultate und Buildpläne der Sourceprofile 1–8. |
| Node-Rendern | `renderMaracaXTensionSSR` mit expliziten `xtend.maraca.xtension-ssr-render-options.v3`; eigener Marker `RMTX_XTENSION_SSR_API_VERSION: 3.0.0` | SSR-API2 und Wire-v1/v2 behalten ihre ursprünglichen Einstiege. |
| Browser | Generiertes `createXtendRmtxSSR`; `createMaracaRmtxSSRCompositionRoot`, API1 / `rmtx-ssr-browser-root.v1` | Der eingeschlossene, sourcegetreue Browservertrag bleibt unverändert. `createXtendMaraca` erhält keine implizite SSR-Freigabe. |
| Komposition | Eigene SSR-Factories, API1 / Composition-Port11 | Manifest-/Artefaktprofile der tatsächlichen Komposition; providerseitige Interfaces und Peerpins. |
| Model-/Hostanschluss | Explizite Resume-API4 und Planruntime18 | Kanonisches Model, vorhandene Surface-/Kernel-/Fabricautorität und Host-SSR-Adapter. |
| Native DOM-Übernahme | Renderer-API2.5, `xtend.rmt.dom-ssr-shell.v1` / `xtend.rmt.dom-adoption.v1` | Derselbe Shared Renderer, dessen Preflight, Schlüssel, Besitzer und verwaltete Komponentenbridge. |

Die Versionswahl ist ausdrücklich. Ein anderes Sourceprofil, zusätzliche Daten in einem alten Snapshot oder ein direktes `adoptExisting` erzeugen keinen neuen Handoff. Die normalen CSR-Einstiege und portablen RMTX-Page-Sperren bleiben bestehen. Für reine native Source5–8-Apps gibt es ein eigenes `rmtx-ssr-native-artifact.v1`; es wird kein Legacy-XTension-Manifest fingiert.

## Getrennte native Runtimeeinstiege

Für die nativen Profile bestehen eigene öffentliche SSR-Module mit jeweils eigener API1-Kennung:

| Sourceprofil | Neuer SSR-Einstieg | Erhaltener CSR-Einstieg |
| --- | --- | --- |
| Source6 | [native-lifecycle-ssr-runtime](../../../xtend-maraca/native-lifecycle-ssr-runtime.mjs), `createMaracaRmtxSSRNativeLifecycleRuntime` | [native-lifecycle-runtime](../../../xtend-maraca/native-lifecycle-runtime.mjs), API1 |
| Source7 | [native-orchestration-ssr-runtime](../../../xtend-maraca/native-orchestration-ssr-runtime.mjs), `createMaracaRmtxSSRNativeOrchestrationRuntime` | [native-orchestration-runtime](../../../xtend-maraca/native-orchestration-runtime.mjs), API2 |
| Source8 | [native-managed-ssr-runtime](../../../xtend-maraca/native-managed-ssr-runtime.mjs), `createMaracaRmtxSSRNativeManagedRuntime` | [native-managed-runtime](../../../xtend-maraca/native-managed-runtime.mjs), API3 |

Die drei ursprünglichen Module behalten exakt ihren API-Marker, ihre CSR-Factory und ihren Default-Export. Die neue SSR-Factory und `createMaracaRmtxSSRModelSnapshot` werden dort nicht nachträglich ergänzt. Jedes eigene SSR-Modul exportiert seinen API1-Marker, die passende SSR-Factory, die reine Model-Vorschau und zusätzlich dieselbe weiterhin gegatete CSR-Factory, damit die generierte gemeinsame Ausgabedatei beide ausdrücklich getrennten Aufrufe bedienen kann.

Beide Wege verwenden dieselben privaten Profil-/Integrationsports und die vorhandene Planruntime. Die privaten Integrationshooks werden nicht über die öffentlichen Einstiege exportiert. Die Buildauswahl verwendet die neuen SSR-Ausgabemodule nur für einen tatsächlich registrierten SSR-Buildkontext; serialisierte Flags oder ein alter CSR-Aufruf ersetzen weder diesen Kontext noch die vorbereitete SSR-v3-Session.

## Build und Quellidentität

Der neue Buildaufruf umschließt den regulären Maraca-/Projekteingang:

```js
const result = await maraca.buildMaracaRmtxSSRBundleAsync({
  schema: 'xtend.maraca.rmtx-ssr-build-options.v1',
  input: {
    source: 'app.rmtx', rmtxSyntaxVersion: '8.0.0', out: 'dist',
    profile: 'production', orchestration: 'strict', kernel: 'strict',
    lazy: 'none', services: false, pwa: false,
    hydration: 'off', validation: 'off', transitions: 'off'
  }
}, { rootDir });
```

Der echte Projektcompiler erfasst auch importierte Classic-Actions, den effektiven RMTX-Eingang und Providerabhängigkeiten. Seine privaten Compiler-/Planregistrierungen binden den erzeugten Einstieg an `rmtx-ssr-source-identity.v1`: Sourceprofil, Sourcehash sowie Projekt-API, Projektidentität und tatsächliche Einstiegssyntax. Absolute Quellpfade werden nicht in den Browservertrag kopiert. Ein serialisierter Plan oder nachgereichter Hash ersetzt diese Registrierung nicht. Fehlgeschlagene Builds werden abgewiesen; die Buildregistrierung prüft das vollständige erfasste Ausgabeinventar. Beim Node-Rendern werden dessen JavaScript-Modulbytes erneut geprüft.

Server und Browser beziehen ihre Quellidentität unabhängig aus demselben erzeugten Code. Die signierte Wire-v3-Payload enthält diese Identität zusätzlich zum Kompositionsdigest, Root, Ablauf, State, Hosts und Shell. Der Sourcehash allein genügt bei gemischten Projekten nicht. Provider-, Interface-, Artefakt-, typisierte Adress- und konkrete Besitzerpins bleiben getrennte Prüfungen.

Der neue Build verlangt Produktion, `lazy:none`, strikten Kernel und strikte Orchestrierung. PWA/AppServices, Streaming und portable RMTX-Ausgabe sind weiterhin eigene Profile. Die festen Byte- und relativen Produktionsbudgets werden auf den tatsächlichen Dateien geprüft; sie werden nicht angehoben. Der neue SSR-Pfad darf private lexikalische Funktionsnamen komprimieren; öffentliche Exporte und Propertynamen bleiben erhalten. Die bisherigen CSR-Minifierprofile bleiben erhalten.

## Verifikation, Restore, Adoption und Replay

Der Node-Aufruf erhält den erfolgreichen inneren `result.build`, einen frischen vertrauenswürdigen Dokumentroot, reale Fabricports, explizite Grants/Peers und den Signierer. Der Browser erhält den erzeugten `createXtendRmtxSSR`-Einstieg und `xtend.maraca.xtension-ssr-options.v3` mit Snapshot und Verifizierer. Für native-only gibt es keine Providergrants oder Peers, die zusätzliche Rechte erteilen könnten.

1. Der Server verwendet ausschließlich die tatsächlich erfasste geschlossene ESM-Ausgabe. Verzögerte Module behalten ihren Ausführungszeitpunkt; Browserklassen werden beim Node-Import nicht durch künstliche DOM-Globals aktiviert.
2. Der Browser prüft Wireform, Quell-/Projekt-/Kompositionsidentität, Signatur, Ablauf, Stateform, konkrete Hosts und Shell vor Providerarbeit oder nativer Aktivierung.
3. Der bestehende Modelruntime berechnet aus dem signierten State auch die Selektoren. Diese reine Vorschau erstellt weder Actions noch einen zweiten Scheduler. Danach restauriert der tatsächliche Runtime-Modelbesitzer denselben State vor Surface-/Repeat-/Hostarbeit.
4. Der Shared Renderer übernimmt die geprüfte native Light-DOM-Struktur. Framework-Hosts übernehmen ihre tatsächlichen exklusiven Container. Erst vollständig übernommene Hosts erlauben den Providerintentreplay.
5. Der komplette Replaybatch wird vor dem ersten Modelkommando validiert. Payloadmapping, typisierte Keys, Generation, Deduplizierung, Konfliktprüfung und gehaltene Liveintents bleiben an die erfassten Providerinterfaces gebunden.

Der Signierer/Verifizierer bleibt ein vertrauenswürdiger Hostport. Ein gültiger älterer Snapshot wird nicht pauschal durch einen erfundenen globalen Latest-Snapshot-Schutz abgewiesen. Host-/Intentgeneration, Ablauf und gegebenenfalls zusätzliche Session-/Benutzerbindung des Verifizierers sind die tatsächlichen Grenzen.

## Native Inhalte und Lifecycle

Serverseitig entstehen native Light-DOM-Inhalte und stabile verwaltete Host-Shells. Komponenteninternas, Shadow-DOM-Initialisierung, Dienste und Ressourcenaktivierung gehören dem Client. Ein Pendingmarker unterdrückt vorzeitige Classic-Initialisierung; er erteilt weder Model-, Komponenten- noch Surfaceautorität. Die bestehende gepinnte Komponentenbridge prüft Klasse, Fähigkeiten und reale Besitzergeneration, bevor sie kontrollierte Werte und aktive Interaktion verbindet.

Benachbarte und leere native Textknoten erhalten eigene begrenzte SSR-Schlüsselmarker. Bei der Übernahme prüft der Renderer zunächst die ganze Struktur, erfasst ihre tatsächlichen Schlüssel und entfernt ausschließlich seine Marker. Frameworkcontainer bleiben für diese native Prüfung opaque; deren Inhalt prüft der Framework-SSR-Vertrag. Falsche Attribute, Textwerte, Schlüssel oder fremde Rendererbesitzer scheitern vor Übernahmewirkungen.

Source7/8 stellen beim SSR-Anschluss den anfänglichen Lifecyclezustand aus demselben kompilierten Programm und restaurierten Model her. Bereits im serverseitigen Anfangsbild berücksichtigte Dispose-/Detach-/Recycle-Flanken werden im Browser nicht zerstörerisch gegen die gerade übernommenen Knoten wiederholt. Spätere echte Flanken nutzen weiterhin die bestehenden Kernel-/Fabricoperationen. `Hydrate` bleibt fachliche Clientaktivierung und wird nicht zur SSR-Adoption umgedeutet. Verwaltete native Aktivierung wird bis zum erfolgreichen gemeinsamen Handoff zurückgehalten.

## Fallback, Abbruch und Grenzen

Standard bleibt `reject`. `mount` ist ausdrücklich erlaubt, wenn allein der Frameworkunterbaum bei sonst gültiger Identität und unveränderter Shell abweicht. Er wird als `fallback-mounted` berichtet und behauptet keine erhaltene DOM-Identität. Eine falsche Signatur, ein anderer Quell-/Projekt-/Providerpin, fremde Owner oder tatsächlich fehlgeschlagene Hydration erlauben keinen solchen Erfolgsbericht und keinen Replay.

Abbruch widerruft wartende Fortsetzungen und deren Besitzerrechte. Native ESM-Übertragung selbst wird dadurch nicht rückwirkend beendet. Das neue Node-Laden verwendet je echtem Build einen geschlossenen Modulnamespace wieder. Jede Anfrage erhält ein neues App-/Model-/Controllerobjekt; vor jedem Namespacecachezugriff werden sämtliche erfassten `.js`-/`.mjs`-Modulbytes des geschlossenen SSR-JavaScript-Inventars erneut geprüft. Dadurch entstehen nicht pro Anfrage zusätzliche dauerhaft gecachte Data-URLs. Vertrauenswürdiger Modulglobalzustand unterliegt weiterhin gewöhnlicher ESM-Semantik und ist keine Request-Sandbox. Unbekannte, externe oder nicht literale Modulziele sind keine erlaubten Nachladungen.

HTML muss den Browserparser ohne Strukturänderung überstehen. Beispielsweise können nicht kanonische Tabellenverschachtelungen oder parsernormalisierte Textformen eine Übernahme zurückweisen. Der Handoff behauptet weder beliebige HTML-Normalisierung noch universelles DOM-Eventreplay, asynchrone Frameworkadoption, Cross-Ownership-Portale, zusätzliche Adapter oder eine Layout-/CLS-Garantie.

## Externe Assets und Paketgrenzen

Bei externem CSS oder anderem tatsächlichem `import.meta` im erfassten Graph benötigt der neue Node-Aufruf `moduleBaseURL`: die vertrauenswürdig konfigurierte HTTP(S)-URL des wirklich ausgelieferten Entrymoduls. Es wird keine synthetische Origin aus Dokument- oder Dateipfaden geraten. Der Server ordnet die ursprünglichen erfassten Modulpfade dieser URL zu; ein durch Code-Splitting anders benannter Serverchunk verschiebt keine Provider-Assetverzeichnisse. Die URL ist ohne Zugangsdaten, Query oder Fragment an den jeweiligen Build gebunden. Ein späterer Aufruf desselben Buildobjekts mit anderer Basis wird abgewiesen. Für eine andere Basis ist ein eigener Buildkontext erforderlich.

Der Node-SSR-Loader liest oder prüft dabei keine CSS-, JSON- oder HTML-Assetbytes erneut; Nicht-JavaScript-Module gehören nicht zu seiner erlaubten Importclosure. Die vollständige erfasste Deliverydateiintegrität einschließlich solcher Assets wird separat beim Sealing und beim Laden des gepinnten Deploymentmanifests geprüft. Die browserseitige ESM-Integritätsgrenze nutzt den vorhandenen SRI-/Importmap-Vertrag; daraus folgt keine pauschale Browser-Integritätsgarantie für sämtliche Assetarten.

Der Compiler veröffentlicht `@ccslabs/xtend-compiler/xtensions/state-binding-resume` als API4. Der Root-SDK-Exportkatalog bleibt bei 241 Einträgen. Maracas explizite Paketdateiliste enthält die neuen Build-/Identitäts- und geschlossenen Serverloaderdateien; die interne Bootstrapbrücke hängt nicht von einer zufälligen Workspaceinstallation ab.

Die [Zielmatrix v1](targets.v1.json) bleibt die datierte Scope-/Bestandsbaseline aus A06.6.1. Ihre 53 geplanten Fälle und 120 Kombinationen sind kein Fortschrittsbericht dieses vertikalen Anschlusses. Der vorliegende Handoff ist ein eigener neuer Vertrag; die vorhandenen Source-/Kompositions-Wireformen werden nicht rückwirkend erweitert. Die vollständige targetbezogene Ausführung und Evidence-Bindung folgt unter A06.6.4/5.
