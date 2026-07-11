# Release Acceptance

Release Acceptance beschreibt, welche maschinenlesbaren Nachweise vor einer Veröffentlichung sichtbar sein müssen. Der öffentliche Text konzentriert sich auf die Entscheidungskriterien: Welche lokalen Checks sind grün, welche Artefakte wurden geschrieben, welche Paketgrenzen bleiben gesperrt und welche Nachweise kann ein externer Entwickler nachvollziehen?

## Entscheidungssignale

Die wichtigsten Zustände sind angenommen, zurückgestellt und blockiert. Angenommene Punkte besitzen konkrete Evidenz, zum Beispiel erfolgreiche Browser-Smokes, einen aktuellen Package Export Lock oder ein konsistentes TypeExports-Ergebnis. Zurückgestellte Punkte sind bekannt, aber nicht kritisch für den nächsten Paketstand. Blockierte Punkte verhindern automatische Veröffentlichung, besonders wenn ein Artefakt fehlt oder eine Paketgrenze noch bewusst geschlossen bleiben soll.

Diese Einteilung ist kein Ersatz für menschliche Verantwortung. Sie macht aber sichtbar, warum ein Build weiterlaufen darf oder warum ein Veröffentlichungsweg gestoppt wird. Externe Teams können dieselben Artefakte lesen, ohne interne Meetings oder private Tracking-Systeme zu kennen.

## Öffentliche Paketgrenze

XTend behandelt Veröffentlichung als explizite Grenze. Ein neuer Export reicht nicht aus, wenn Deklarationen, Pack Dry Run und Dokumentation ihn nicht ebenfalls kennen. Ebenso reicht ein neues Dokument nicht aus, wenn das Paket den dazugehörigen Einstiegspunkt nicht enthält. Die Acceptance-Seite verbindet diese Signale und verweist auf Package Export Lock, Conditional Network Evidence und Hydration-Nachweise.

```txt
schema: xtend.epic13.release-owner-acceptance.v1
local gate: node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json
source: xtend.epic13.rc1-production-readiness.v1
Release Owner Acceptance
accepted
deferred
blocked
automatic-publish-approval
publish boundary: private-until-release-owner-acceptance
browser evidence: xtend.epic13.prod-browser-csp-smoke.v1
package evidence: xtend.epic13.package-export-lock.v1
network evidence: xtend.epic13.conditional-network-evidence.v1
WP-E13-03
WP-E13-09
./prod-browser-csp-smokes.md
./package-export-lock.md
./hydration-performance-closure.md
```

## Lokale Nutzung

Nutze diese Seite, wenn ein Build zwar technisch erfolgreich ist, aber noch eine Veröffentlichungsentscheidung braucht. Prüfe zuerst, ob die lokalen Gates die gleiche Paketoberfläche melden. Danach prüfe, ob Nightly-Artefakte, Workspace-Dry-Runs und optionale Netzwerk-Evidenz aktuell sind. Erst dann ist klar, ob ein Status angenommen, zurückgestellt oder blockiert werden sollte.

Für `xtend-i18n` bedeutet das: Das Modul muss als nicht-visuelle Infrastruktur erkannt werden, XState- und XRouter-Adapter müssen getestet sein, und die Bestandskomponenten dürfen explizite Host-Labels nicht überschreiben. Für Maraca bedeutet es: Workspace Pack Dry Run, Maraca Report und Größenreport müssen im Nightly-Artefakt sichtbar sein.

## Pflegehinweise

Halte sichtbaren Text auf Nutzer- und Paketentscheidungen fokussiert. Interne Bezeichner bleiben im maschinenlesbaren Block, damit Suiten sie prüfen können. Wenn ein neues Artefakt verpflichtend wird, ergänze den lokalen Befehl, den Report-Pfad und die Stelle, an der GitHub Actions das Artefakt hochlädt.
