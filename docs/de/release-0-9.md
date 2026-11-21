# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features stehen weiterhin auf `preparing`; die Paketversion bezeichnet den Entwicklungsstand, keine abgeschlossene Releaseabnahme.

## Implementierter Stand

| Baustein | Vorhanden | Noch abzunehmen |
| --- | --- | --- |
| RMT Classic | Umbenennung, gemeinsamer Compiler und erhaltene `.rmt`-Verträge | Kompatibilität am finalen Freigabestand |
| RMTX | Rohe Sourceprofile 1–8, native Views und verwalteter Katalog, gemischte Projekte sowie semantisches CLI-/MCP-/Editortooling | Vollständige Rollen- und Zielmatrix, gemeinsame Releasebindung |
| XTensions 2.0 | Kontrollierter State/Actions, URL/History, Kernel/Fabric, Providerkette, React-/Vue-SSR und neuer ausdrücklicher RMTX-Handoff | Vollständige gemeinsame 0.9-Abnahme |

Die [Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) führt den Gesamtstand. [A06.5](../../development/rmtx-a06/project-tooling/implementation.md) ist implementiert und lokal geprüft. Die bestätigte [A06.6-Zielentscheidung](../../development/rmtx-a06/release-acceptance/implementation.md) wählt native RMTX-Inhalte und React/Vue mit CSR und synchronem Node-SSR für 0.9.

[A06.6.2](../../development/rmtx-a06/release-acceptance/rmtx-ssr-contract.md) ergänzt einen eigenen SSR-Build-/Browser-Einstieg API1, signierte Quell-/Projektidentität, SSR-Wire3, Resume4, Composition-Port11, Planruntime18 und Renderer2.5. Tatsächliche Source8-/Classic-Produktionsfälle mit nativen Inhalten und React-/Vue-Hosts sowie native-only Apps bestehen zusammen 50 Prüfungen je Lane unter Node 24.18.0/26.5.0 und Chromium. Restore geschieht vor Adoption und validiertem Providerintentreplay; typisierte Keys, Besitzer, Integrität, Fallback und Cancellation bleiben geprüft. [Ausführungsstand](../../development/rmtx-a06/release-acceptance/ssr-execution-summary.md).

Die erhaltenen CSR-Einstiege erhalten dadurch keine implizite SSR-Freigabe. [A05-SSR v1](../../development/rmtx-a05/README.md) und [Scoped-/Komponenten-SSR v2](../../development/rmtx-a06/scoped-components.md) behalten ihre eigenen Verträge. Native SSR erzeugt Light-DOM und stabile verwaltete Host-Shells; Komponenteninternas und Ressourcenaktivierung bleiben clientseitig. Externe Assets benötigen im neuen Node-Aufruf die konfigurierte tatsächliche Entry-URL `moduleBaseURL`.

Native Source6-/Source7-/Source8-Laufzeiten besitzen eigene API1-Module `@ccslabs/xtend-maraca/native-lifecycle-ssr-runtime`, `native-orchestration-ssr-runtime` und `native-managed-ssr-runtime`. Die bisherigen CSR-Module behalten ihre API-Versionen und exakt ihre bisherigen Exporte; private Integrationsports werden gemeinsam verwendet. [Modulgrenze](../../development/rmtx-a06/release-acceptance/rmtx-ssr-contract.md#getrennte-native-runtimeeinstiege).

Portable RMTX-Page-Ausgabe unter Node/PHP, weitere Frameworks, Streaming, Cross-Ownership-Portale und universelles natives DOM-Eventreplay sind eigene Folgeprofile. Container und Styles liegen beim Author; Lanes und Bytebudgets sind keine Layoutgarantie. Der neue Handoff erweitert weder die `.rmtx`-Grammatik noch die v1-Defaultwahl des rohen Compilers.

## Releaseprüfung und nächste Schritte

A06.6.3 prüft als Nächstes sämtliche 47 Katalogrollen. A06.6.4 vervollständigt die 120 ausgewählten Framework-/Source-/Projektmoduskombinationen und Qualitätsläufe. Profil-/ExecutionEvidence-Bindung, finaler Quellen-/Paket-/Authorityabschluss und Seal folgen unter A06.6.5/6. Einzelne grüne Vertikalfälle schließen diese Pflichten nicht.

`scripts/release/feature-scope.json` verlangt beide Features. Das Vorbereitungsgate prüft Verträge und enthält die neuen fokussierten SSR-Prüfungen; der tatsächliche XTensions-Runtimegate-Besitzer führt den v3-Browserfall zusätzlich getrennt aus. Feature-Readiness bleibt gesperrt, bis die gebundenen vollständigen Nachweise vorliegen. Prepare und Publish sind getrennte Freigaben.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```
