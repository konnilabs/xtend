# Docs-Suchindex: Budget- und Freshness-Bugfix

Stand: **16. November 2026**, nach dem A06.3.1-Teilabschluss. Der dort belegte Suchindexfehler ist mit diesem Folgepatch behoben. Die früheren Ausführungsberichte bleiben unverändert als historische Nachweise erhalten; dies ist keine gemeinsame 0.9-Releaseabnahme.

## Ursache und Korrektur

Der deutsche Volltextindex überschritt mit **156.241 Bytes** das unveränderte Gzip-Budget von **153.600 Bytes**. Der Generator brach deshalb vor dem Schreiben aller vier Artefakte ab; die gespeicherten Indizes waren gegenüber den aktuellen Artikeln veraltet.

Der [Generator](../scripts/build_docs_search_indexes.js) übergibt den Body jetzt nach der bisherigen Auswahl an die vorhandene Funktion `normalizeSearchText` aus der [RMT-Suchruntime](../xtendrmt/rmt-app-runtime.js). Diese Funktion wird dynamisch importiert, nicht separat nachimplementiert. Die Runtime normalisiert Suchfelder bereits vor der Bewertung; der Producer überträgt nun direkt dieselbe kanonische Zeichenfolge.

Die Reihenfolge ist entscheidend: zuerst die bisherigen maximal **520 verschiedenen Quelltokens in Auftretensreihenfolge**, danach die Runtime-Normalisierung. Es gibt weder Sortierung noch eine weitere Deduplizierung. Beispielsweise bleiben die nach Normalisierung gleichen Tokens `straße` und `strasse` an ihren bisherigen Positionen erhalten. Präfix-/Phrasenscores und die ursprüngliche Auswahlgrenze bleiben damit identisch.

`body` war bereits ein begrenzter Suchstring und kein Artikelvolltext für die Anzeige. Envelope, Entry-Felder, Datentypen und Suchsemantik bleiben unverändert. Die beiden bestehenden **v1-Schemata** und Runtime-APIs bleiben deshalb erhalten. Budgets, Artikel, Menü, Gewichtung und Suchruntime wurden durch diesen Bugfix nicht geändert.

## Tatsächlich erzeugte Artefakte

Gemessen mit Node **24.22.2** und **26.5.0**, jeweils Gzip-Level 9:

| Artefakt | Gzip-Bytes | Unverändertes Budget |
| --- | ---: | ---: |
| DE compact | 24.313 | 25.600 |
| DE fulltext | **149.475** | 153.600 |
| EN compact | 23.009 | 25.600 |
| EN fulltext | **122.059** | 153.600 |

Alle vier JSON-Dateien wurden mit dem offiziellen `--write` neu erzeugt. Anschließend bestand `--check` unter beiden unterstützten Node-Lanes. Für sämtliche **178 Artikel je Sprache** gilt exakt `normalizeSearchText(alterBody) === normalizeSearchText(neuerBody)`. Metadaten, Reihenfolge, Source-Fingerprints und kompakte Indexdaten stimmen zwischen altem und korrigiertem Producer für denselben aktuellen Artikelstand überein.

## Regression und Nachweise

Die [Regressionen](../tests/docs/docs_shell_catfooding_suite.js) sind in der bereits verpflichtenden Suite `rmt-search-runtime` enthalten. **37 neue Assertions** prüfen beide vollständigen Korpora, die Reihenfolge und Normalisierungskollisionen, den ursprünglichen 520-Token-Cutoff, den Präfixscore `0,94`, Scores und Ergebnisreihenfolge für zehn Korpusqueries sowie acht synthetische Queries. Die synthetischen Fälle laufen zusätzlich im tatsächlich generierten Worker über eine VM.

Unter **beiden Node-Lanes** bestanden jeweils **196 Assertions ohne Fehler oder Skips**:

| Suite | Assertions je Lane |
| --- | ---: |
| `rmt-search-runtime` | 53 |
| `docs-shell-catfooding` | 100 |
| `docs-related-recommendations` | 36 |
| `rmt-prewarm-worker-search` | 7 |

Der [maschinenlesbare Ausführungsnachweis](docs-search-index-budget-fix.json) bindet die aktuellen Quellen, Artefakte, Korpusmessungen und tatsächlichen Testberichte. Die vollständige Browser-/Repository-/Releaseabnahme wird daraus nicht abgeleitet. Die gemeinsame RMTX-/XTensions-Abnahme bleibt weiterhin ein eigener Arbeitsschritt.

```sh
node scripts/build_docs_search_indexes.js --write
node scripts/build_docs_search_indexes.js --check
node scripts/run_xtend_tests.js rmt-search-runtime docs-shell-catfooding \
  docs-related-recommendations rmt-prewarm-worker-search --json
```

Die früheren Budgetwarnungen im [A06.3.1-Ausführungsbeleg](rmtx-a06/selector-profile/execution-evidence.json) beschreiben dessen damaligen Stand korrekt. Dieser Folgebeleg dokumentiert die spätere Behebung; alte Runtimeberichte und Ausführungshashes wurden nicht rückwirkend geändert.
