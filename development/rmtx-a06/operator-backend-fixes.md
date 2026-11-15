# Backendkorrekturen nach dem A06 Operatoraudit

Stand: **15. November 2026**. Die im [Operatoraudit](operator-and-tsx-feasibility-assessment.md) belegten Backendverluste sind gepatcht. Der laufende MCP-Betrieb und seine Aktualisierung sind separat im [Deploymentbericht](../mcp-local-update.md) dokumentiert. Eine RMTX-Syntax wird damit nicht festgelegt.

## Wiederhergestelltes Verhalten

| Befund | Korrektur und geprüfter Rückweg |
| --- | --- |
| Event-`when` geht vor dem Router verloren | Core und AppPlatform erhalten den Condition-AST bis zum Eventbinding. Der Router prüft ihn ohne JS-Auswertung gegen einen lesenden Model-Snapshot und den Eventkontext. `false` blockiert vor Payloadmapping, Governance und Actiondispatch. Unbekannte oder ungültige Guards bleiben gesperrt. |
| Gültige Reducer-Referenzen werden zu Text | State-/Selector-/Input-/Payload-/Result-/Errorwerte werden im passenden Ausführungskontext aufgelöst. Managed Reducer lesen ein isoliertes Arbeitsmodell, sodass spätere Reducer frühere Änderungen derselben Transaktion sehen. Ein Snapshotfallback erhält den bestehenden Modelport-Vertrag ohne zusätzliche Pflichtmethode. |
| Literale und Referenzen sind mehrdeutig | Der Compiler erhält `valueKind: literal/reference/template`. `"state.original"` bleibt ein Literal; `state.original` ist eine Referenz. Verschachtelte Emit-Payloads behalten explizite Referenzblätter. Nicht markierte Legacy-Records behalten ihre bisherige Auswertung. |
| Result-Handler werden nicht ausgeführt | `success`-/`error`-Handler werden beim Build zu geschlossenen Reduce-/Emit-/Overlayrecords. Nicht unterstützte Phasen, Operationen, Referenzen oder Overlayoptionen werden diagnostiziert. Managed Handler-Reducer gehen in den jeweiligen atomaren Modelcommit ein. |
| Emit-Payloadnamen fehlen / Publikation ist wirkungslos | Das Lowering verwendet die wirklichen AST-Payloadkeys. Managed Publikationen erscheinen erst nach erfolgreichem Commit über den vorhandenen `subscribeEvents`-Kanal, Typ `emit`. Der direkte Executor verwendet den bestehenden expliziten `effectAdapter`; ohne Publikationsadapter entsteht ein Fehler. Es wird kein globaler Eventbus erfunden. |
| Skalare State-Initialwerte werden durch `{}` ersetzt | Maracas Initialstate-Erfassung erhält vorhandene JSON-Werte einschließlich `0`, `false`, Strings und `null`. |
| Result-Overlay verlässt den App-Root / verschwindet beim nächsten Commit | Die native View-/Resource-Graph-Ebene löst das deklarierte Portal eindeutig innerhalb des übergebenen Root-Handles auf. Fremde oder mehrdeutige Ziele werden abgewiesen. Der Controller führt keine DOM-Abfragen aus. Der Shared Renderer schützt tatsächlich registrierte fremde Owner-Roots über private Besitzdaten; DOM-Attribute und Deskriptormarker verleihen keine Autorität. Identität und Fokus bleiben bei weiteren Commits erhalten. |

Die bestehenden Actionphasen bleiben erhalten: Daten-/Precommit-Arbeit, Model-/Viewcommit und Präsentation sind keine imperative Quellreihenfolge. Fachliche Hostnebenwirkungen sind keine allgemeine verteilte Transaktion. Abbruch, Root-Disposal, fehlgeschlagene Model-Typeguards und ungültige Publikationsdaten dürfen keine späten Handler oder erfolgreichen Emissionen freigeben.

## Versionen und Kompatibilität

| Modul | Aktueller API-Stand |
| --- | --- |
| RMT Classic Compiler | **4.1.0** |
| Kompatibler vNext-Compiler-Einstieg | **1.2.0** |
| Event Routing | **3.0.0** |
| Action Effect Runtime | **2.0.0** |
| Surface Resource Graph | **2.1.0** |
| DOM Descriptor Renderer | **2.1.0** |

Die neuen Runtime-API-Stände sind ausdrücklich als Modulkonstanten exportiert. Die Eingabe-AST-Felder und der Classic-Compilervertrag ändern sich nicht. Die vorhandenen Ergebnis-Wireformen und Runtime-Factorymethoden bleiben erhalten; neue Sprachoperatoren werden nicht eingeführt. Die zusätzlichen Ausführungsmetadaten korrigieren die Weitergabe bereits akzeptierter Sourceverträge.

Frische Compilerartefakte unterscheiden Literale und Referenzen eindeutig. Alte, bereits erzeugte JavaScript-/JSON-Captures werden dadurch nicht nachträglich umgeschrieben. Apps sollen mit dem aktuellen Compiler neu gebaut werden; vorhandene Byte-/Interface-/Snapshotpins behalten ihre strikten Identitätsprüfungen.

Result-Overlays unterstützen `info`, `success`, `warning`, `error` und die vorhandenen Designaliases `neutral`, `primary`, `secondary`, `danger`. Für Toastdarstellung werden `danger` zu `error` und die neutralen Designaliases zu `info` normalisiert; `data-tone` bewahrt den gewählten Wert. Dynamische Tones werden vor einer nativen Lifecycle-/DOM-Mutation geprüft.

## Architektur- und Auslieferungsprüfung

Der Eventrouter deklariert den vorhandenen **RmtModelReader** und ausschließlich **state.read**. Die Kernel-MVC-Prüfung bleibt blockierend; es gibt keine neue Schreibcapability und keinen Policywaiver. Portalauflösung bleibt Viewarbeit. Native Kernel-, Fabric-, Surface- und Controllergrenzen bleiben bestehen.

Die offizielle Kernel-Lab-Pipeline wurde mit `kernel-lab build --profile clean --version 0.9.0 --write` ausgeführt. Sie aktualisiert die betroffenen ESM-/Browser-Bundles, die generierten Core-Typen und das Modulmanifest. Standalone-Module werden nicht manuell in zusätzliche Targets eingebettet. Die Auslieferungsparität wird gegen die echten Quellen und Outputs geprüft.

Die neuen Regressionen sind im blockierenden `check:release-preparation` registriert:

- [Compiler-/Lowering-Vertrag](../../tests/rmt-language/action-execution-lowering.test.cjs): geschlossene Handler, Payloadnamen, Literal-/Referenz-/Templateunterscheidung, unbekannte/unsichere Formen und nicht endliche Zahlen.
- [Eventguards und Kerneldeklaration](../../tests/rmt-language/event-condition-guards.test.cjs): echter Compiler-/Model-Rückweg, DOM-Eventeingaben, Kurzschlusslogik, Classic-Präzedenz, ungültige ASTs und fehlende Read-Capability.
- [Native Action-/Model-/Overlay-Integration](../../tests/rmt-language/action-backend-regressions.test.cjs): State/Selector, atomare Phasen, Fehler/Abbruch, Emitadapter, Legacy-Dialekte, Portalgrenzen und wiederholte Overlays mit Fokus.
- [Renderer-Ownership](../../tests/rmt/renderer-structural-ownership.test.cjs): kein Detach fremder Owner-Roots, keine Autorität aus Attributen, keine Keyübernahme, Same-Owner-Cleanup und Dispose.

Die ursprünglichen Fehlerbeobachtungen bleiben im [Before-Fix-Nachweis](operator-runtime-evidence.before-fix.json). Die [aktuellen Probes](operator-runtime-probes.cjs) und ihr [Nachweis](operator-runtime-evidence.json) prüfen das gewünschte Verhalten. Der historische Audittext ist deshalb keine Liste weiterhin offener Fehler.

Die abschließende Prüfung ist grün: je **57 gezielte Tests** und **20 Operatorsuiten mit 2961 Assertions** unter Node 24 und 26, außerdem native React-/Vue-Läufe für CSR, SSR, statische und wiederholte Hosts sowie Chromium. Kernel-MVC prüft 79 Module ohne Verletzung; Kernel-Lab, Artefaktparität und das vollständige Release-Preparation-Gate bestehen. Die zugehörigen Hashes und Laufdetails stehen im [Patchnachweis](operator-backend-fix-evidence.json).

## Reproduktion

Mit installierter Projekttoolchain und Node 24 oder 26:

```sh
node --test tests/rmt-language/action-execution-lowering.test.cjs \
  tests/rmt-language/event-condition-guards.test.cjs \
  tests/rmt-language/action-backend-regressions.test.cjs \
  tests/rmt/renderer-structural-ownership.test.cjs
node development/rmtx-a06/operator-runtime-probes.cjs --check
npm run check:release-preparation
node scripts/verify_xtendrmt_artifact_parity.js --json
```

Der [zusammengeführte Patchnachweis](operator-backend-fix-evidence.json) erfasst die ausgeführten Node-/Browser-/SSR-Prüfungen und die zugehörigen Quellen. Die Größenbudgets bleiben unverändert. Das [MCP-Update](../mcp-local-update.md) bindet anschließend genau den aktualisierten Code-/Dokumentstand als ausdrücklich lokalen Worktree-Snapshot.
