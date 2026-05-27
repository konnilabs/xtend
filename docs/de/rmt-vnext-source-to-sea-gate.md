# RMT vNext Source-to-Sea

Die Source-to-Sea-Prüfung verbindet eine `.rmt` Quelle mit Compiler-Core, Kernel-Schedules, Fabric-Fasern, Host-Adapter, XTend UI und Browser-Evidenz. Sie ist absichtlich kein Default-CI-Pfad, weil der Browser-Driver lokal und in GitHub Actions eine eigene Umgebung braucht. Für Release-Kandidaten ist sie trotzdem die dichteste Beweiskette: Ein Drittentwickler sieht nicht nur, dass der Compiler JSON erzeugt, sondern dass Route-Wechsel, Cross-Primitive-Events und Ressourcen-Cleanup im Browser korrelieren.

## Öffentlicher Vertrag

Der Vertrag lebt in `tools/rmt-language/vnext-source-to-sea.js` und nutzt `tests/rmt-language/fixtures/vnext-source-to-sea.rmt` als kopierbare Referenz. Die erwartete Kette lautet `source -> kernel -> Fabric -> UI -> Browser`. Das Browser-Resultat wird unter `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json` abgelegt und trägt diese Schemata:

```text
xtend.rmt.vnext.source-to-sea-evidence.v1
xtend.rmt.vnext.source-to-sea-evidence-report.v1
xtend.rmt.vnext.source-to-sea-object-matrix.v1
xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1
xtend.rmt.vnext.source-to-sea-browser-result-validation.v1
```

Die Fixture deckt vier sichtbare Objekte ab: `demo.feedback.panel`, `demo.feedback.toast`, `demo.feedback.detail` und `demo.feedback.audit`. Der Nachweis enthält deshalb `"objectCount": 4`; wenn diese Zahl driftet, ist entweder die `.rmt` Quelle, das Browser-HTML oder der Objekt-Mapper auseinander gelaufen.

## Minimaler lokaler Lauf

Für einen schnellen Node-Lauf ohne externen Browser reicht die Suite im Test-Runner. Für Browser-Evidenz nutzt der lokale Pfad den Capture-Helper, der ChromeDriver, Firefox oder eine vorhandene WebDriver-Session ansprechen kann.

```bash
node scripts/run_xtend_tests.js rmt-vnext-source-to-sea --json
npm run test:rmt-vnext-source-to-sea:evidence
npm run test:rmt-vnext-source-to-sea:chromedriver
npm run test:rmt-vnext-source-to-sea:validate-artifact
```

Der Replay-Schritt ist bewusst separat: `test:rmt-vnext-source-to-sea:validate-artifact` ruft denselben Validator mit `--validate-artifact` auf, den CI nach dem Upload nutzt. Dadurch lässt sich ein fehlgeschlagener Browser-Lauf ohne erneute Browser-Session analysieren.

## Event- und Lifecycle-Evidenz

Die Kernstrecke prüft Cross-Primitive-Events, Route-Ziele und Cleanup als zusammenhängenden Ablauf. Der wichtige Event-Slice ist `demo.feedback.detail.ack -> demo.feedback.audit`: Ein Event aus `demo.feedback.detail` erreicht `demo.feedback.audit`, aktualisiert dort State und bleibt an die Transition-Lane gebunden. Die Browser-Drift-Guards heißen wörtlich `browser execution cross-primitive events pass`, `browser execution route switches pass`, `browser execution route lifecycle cycles pass` und `browser execution object matrix passes`.

Der Audit-Zweig enthält zusätzlich `demo.feedback.auditSubscription`. Die Lifecycle-Evidenz verlangt `countsMatch`, damit Unmount und Remount nicht nur sichtbar passieren, sondern auch dieselbe Ressourcenmenge freigeben und wieder binden. Der Guard `cross event route-target state belongs to target primitive` schützt gegen falsche Ziel-Primitive, wenn mehrere Route-Ziele parallel im Smoke-HTML stehen.

## Fehlerbilder und Fixtures

Die negative Fixture `vnext-source-to-sea-cleanup-owner-invalid.rmt` erzeugt `rmt.vnext.source_to_sea.cleanup_owner_mismatch`, wenn ein Cleanup-Resource dem falschen Surface-Owner gehört. `vnext-source-to-sea-cleanup-resource-missing.rmt` erzeugt `rmt.vnext.source_to_sea.cleanup_resource_missing`, wenn `demo.feedback.audit` ohne erwartete Timer-Resource validiert wird. `vnext-source-to-sea-cleanup-kind-invalid.rmt` erzeugt `rmt.vnext.source_to_sea.cleanup_kind_mismatch`, wenn `demo.feedback.auditSubscription` nicht als `subscription` modelliert ist.

Für Browser-Drift gibt es `rmt-vnext-source-to-sea-cross-route-invalid.html`. Diese Fixture beweist, dass Cross-Route-Events nicht nur nach Event-Namen ausgewertet werden, sondern Ziel-Primitive, Lane und sichtbaren DOM-Zustand zusammen betrachten.

## Status und Betrieb

| Slice | Priorität | Status | Nachweis |
| --- | --- | --- | --- |
| `RMT-VNEXT-PRIM-05` | P0 | completed | Primitive Compiler, Core-JSON und Kernel Records |
| `RMT-VNEXT-PRIM-06` | P0 | completed | Source-to-Sea Browser Evidence |

In GitHub Actions ist der Browserpfad über `run_source_to_sea` manuell aktivierbar. Der Default-PR-Gate bleibt schnell und nutzt `npm run test:rmt-vnext-primitives:report`; Source-to-Sea ergänzt ihn bei Bedarf um Browser-Evidenz. Der Capture-Helper protokolliert `ChromeDriver-Auto-Cleanup`, damit nach einem Lauf keine WebDriver-Prozesse hängen bleiben.
