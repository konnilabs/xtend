# A06.6.1 – Lokaler Prüfstand des Ziel-/Policyvertrags

Stand: **21. November 2026**, Dokumentrevision **1.1.0**. Basis: Commit `416cbdea` plus aktueller, nicht committeter Worktree. Dieser Bericht beschreibt die tatsächlich ausgeführte Plan-/Gateprüfung; die 53 in der [Zielmatrix v1](targets.v1.json) benannten Runtimefälle bleiben `planned`.

**Historischer A06.6.1-Nachweis.** Der spätere produktive SSR-Anschluss A06.6.2 und seine tatsächlichen Läufe werden im eigenen [SSR-Prüfstand](ssr-execution-summary.md) geführt. Die folgenden Ergebnisse und damaligen Grenzen werden nicht auf dessen Quellenstand umdatiert.

Der bestätigte 0.9-Umfang umfasst native RMTX-Inhalte und React/Vue für CSR sowie synchrones Node-SSR. Die [Arbeitsgliederung](implementation.md) führt A06.6.1 als implementiert und A06.6.2–6 weiterhin offen. Native SSR meint Light-DOM und stabile verwaltete Host-Shells mit clientseitigen Internas. Weitere Adapter, Streaming und portable RMTX-Page-Ausgabe unter Node/PHP sind ausgeschlossen.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| `inspect.cjs --check` | `valid: true`, vier Zielfamilien, acht Sourceprofile, 53 geplante Pflichtfälle, `acceptedForRelease: false`. |
| Framework-/Source-/Projektmodus-Coverage | 120 ausgewählte Kombinationen sind an benannte geplante Fälle gebunden; keine Behauptung ihrer bereits erfolgreichen Runtimeausführung. |
| Vertrags-/CLI-, Vorbereitungs- und Feature-Scope-Tests | **20/20 bestanden**, null Fehler, Skips oder Abbrüche. Mutationsfixtures werden vor jeder Änderung als gültig geprüft. |
| Readiness v2 | Plan gültig, `ready: false`; weiterhin 52 Blockereinträge für Rollen, Features, Katalogbindung und Milestones. |

Ausgeführter Testbefehl unter **Node 24.22.2**, seriell und mit 256 MiB Heapgrenze:

```sh
node --max-old-space-size=256 --test --test-concurrency=1 \
  tests/release/rmtx-target-contract.test.cjs \
  tests/release/preparation-gates.test.cjs \
  tests/release/feature-scope.test.cjs
```

Der gemessene Lauf benötigte rund 0,64 Sekunden und maximal **95 768 KiB RSS**. Der positive CLI-Tempfixture-Lauf vergleicht sämtliche enthaltenen Datei-Bytes vor und nach der Prüfung; negative Fixtures prüfen unter anderem fehlende Dateien und einen aus dem Fixture führenden Symlink. Policies benötigen ihre jeweiligen benannten positiven und negativen Fälle; ein Austausch gegen beliebige gleichartige Fälle wird abgewiesen.

Die [zentrale Vorbereitungsliste](../../../scripts/check_release_preparation.cjs) enthält jetzt den fokussierten Vertragstest und den lesenden Inspector unmittelbar vor dem vorhandenen Featureplancheck. Die bestehenden GitHub-/Nightly-Aufrufer übernehmen diese Befehle. Ihre Verdrahtung und Fehlerweitergabe sind getestet; die gesamte Vorbereitungsliste wurde in diesem Abschnitt nicht erneut ausgeführt.

Keine produktive Compiler-, Model-, Kernel-, Fabric-, Framework- oder SSR-Runtime wurde geändert. Die bisherigen SSR-/Adoptions-/Page-Build-Sperren, Sourceprofile 1–8 und bestehenden Wireversionen bleiben erhalten. Feature-Scope-/Readiness-v2, Katalogabnahme und historische A06.5-Receipts wurden nicht umgeschrieben.

Dieser lokale Lauf ist keine Ausführung auf der exakten Paketlane Node 24.18.0 und kein Node-26-, Browser-, Produktionsbuild-, Strict-, Package- oder Sealnachweis. Die private Matrix/API1 und der Prüfbericht v1 erzeugen keine Releaseautorität oder standardisierte ExecutionEvidence. Der spätere Quellen-/Inventarabschluss muss die neuen Dateien und die fortgeschriebenen Dokumente frisch erfassen. Nächster Implementierungsschritt: **A06.6.2 – versionierter SSR-Anschluss**.
