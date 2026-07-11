# Conditional Network Evidence CI

Conditional Network Evidence CI beschreibt den Job, der optionale Audit- und SBOM-Nachweise in GitHub Actions sammelt. Der lokale Standard bleibt offlinefähig; dieser Artikel erklärt den zusätzlichen CI-Pfad, der Netzwerkzugang ausdrücklich aktiviert, die Ergebnisse als Artefakte speichert und eine kontrollierte Deferral-Entscheidung erlaubt.

## Zweck

Der Job läuft nicht, um lokale Entwickler zu blockieren. Er läuft, um Veröffentlichungssignale zu ergänzen, die nur mit Registry- oder Netzwerkzugriff sinnvoll sind. Dazu gehören Audit-Berichte, SBOM-Dateien und ein zusammenfassender Evidence-Report. Wenn eine Organisation solche Zugriffe nicht in jedem Pull Request erlauben möchte, bleibt der lokale Gate grün, während der CI-Job seine eigene Verantwortung trägt.

Für neue Module wie `xtend-i18n` oder `xtend-maraca` ist diese Trennung wichtig. Die Basisprüfung erkennt Manifest-Keys, Package Exports, Typziele und Loader-Grenzen ohne externe Downloads. Die Netzwerkprüfung ergänzt nur die Lieferkettenperspektive und sollte keinen lokalen Importpfad erzwingen.

## Ausführung

Der Workflow setzt einen expliziten Schalter, bevor Audit- und SBOM-Kommandos laufen. Dadurch ist der Unterschied zwischen lokaler Deferral und CI-Ausführung sichtbar. Die Reports landen unter `.xtend-test-results`, damit sie zusammen mit den übrigen Release-Artefakten hochgeladen werden können.

```txt
schema: xtend.epic13.conditional-network-evidence-ci.v1
local gate: node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json
capture command: npm run conditional-network:evidence
execute env: XTEND_CONDITIONAL_NETWORK_EXECUTE=1
audit artifact: .xtend-test-results/xtend-npm-audit-report.json
sbom artifact: .xtend-test-results/xtend-npm-sbom.json
report artifact: .xtend-test-results/xtend-conditional-network-evidence-report.json
```

Zum lokalen Erfassen der drei Reports ohne Veröffentlichung:

```bash
npm run conditional-network:evidence
```

## Artefakte

Der Audit-Report zeigt, ob bekannte Sicherheitsmeldungen im aktuellen Dependency-Graph auftauchen. Das SBOM-Artefakt beschreibt die Abhängigkeiten maschinenlesbar. Der zusammenfassende XTend-Report verbindet diese Dateien mit dem Deferral-Modell und dem Veröffentlichungspfad. Ein Release-Prozess kann damit unterscheiden, ob die Netzwerkprüfung tatsächlich ausgeführt wurde oder ob eine begründete Zurückstellung vorliegt.

Die Artefakte sollten neben Package Export Lock, TypeExports, Pack Dry Run, Maraca-Report und Browser-Smokes betrachtet werden. Ein einzelner Netzwerkbericht ersetzt keine Paketprüfung; er ergänzt sie.

## Pflegehinweise

Ändere den Job nur, wenn der lokale Pfad offlinefähig bleibt. Neue Netzwerkkommandos brauchen einen stabilen Artefaktpfad, eine Erwähnung in der Release-Checkliste und eine Aktualisierung dieser Seite. Wenn ein CI-Runner keinen Netzwerkzugang hat, sollte die Deferral sichtbar und maschinenlesbar sein, statt den lokalen Standardpfad umzudeuten.

## Weiterführend

Der Release-Ablauf erklärt, wie das CI-Artefakt zusammen mit den übrigen Release-Reports ausgewertet und aufbewahrt wird. [Verwandter Artikel](./release-verification.md)
