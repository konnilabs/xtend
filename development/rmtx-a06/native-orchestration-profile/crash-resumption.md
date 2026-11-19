# Wiederaufnahme nach Speicherabbruch am 19. November 2026

Die lokalen Journale belegen einen Abbruch durch `systemd-oomd`, keinen nachgewiesenen Segmentation Fault. Um18:43:20 Uhr Europe/Berlin beendete der Speicherwächter die VS-Code-Prozessgruppe; das Userjournal meldet deren Ende um18:43:22 mit `oom-kill`. Die erfasste Spitze betrug25,5GiB RAM und3,2GiB Swap. Der beobachtete Speicherdruck lag58,92% über der konfigurierten50%-Schwelle über20 Sekunden. Zuvor wurde Brave wegen Speicherdruck beendet.

Der XTend-MCP-Container war bei der Prüfung weiterhin healthy, mit `RestartCount=0` und `OOMKilled=false`. Aus diesen Befunden folgt kein Docker- oder RMT-Kernelabsturz. Welcher einzelne Editor-, Codex- oder Testprozess das Wachstum verursachte, lässt sich rückwirkend aus den verfügbaren Aufzeichnungen nicht belegen.

Die Worktreeänderungen und bereits geschriebenen Ergebnisdateien blieben erhalten. Laufende Prüfungen wurden abgebrochen und gelten ohne vollständigen erfolgreichen Ergebnisbeleg nicht als bestanden. Vor der Wiederaufnahme wurden ein Binärdiff und die unversionierten Dateien nach `/tmp/xtend-rmtx-a0643` gesichert.

Die Wiederaufnahme begrenzt schwere Prüfungen auf einen gleichzeitigen Lauf, setzt für Runtime-/Buildtests `NODE_OPTIONS=--max-old-space-size=1024`, verwendet externe Zeitlimits und erfasst den tatsächlichen RSS mit `/usr/bin/time -v`. Gezielt begrenzte Scope-/Graphprüfungen verwenden512MiB. Governanceerfassungen laufen getrennt und seriell mit eigener Ressourcenmessung. Schutzschwellen und Produktgrößenbudgets werden nicht angehoben.

Neue DOM-Identitätsassertionen vergleichen boolesche Identitäten mit kurzen Meldungen. So muss eine fehlgeschlagene Assertion keine großen zyklischen jsdom-/React-Objektgraphen formatieren. Dies ist eine vorsorgliche Begrenzung; eine solche Formatierung ist als rückwirkende Einzelursache nicht bewiesen.
