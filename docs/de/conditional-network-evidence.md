# Conditional Network Evidence

Conditional Network Evidence trennt optionale Netzwerkprüfungen von den lokalen Standard-Gates. XTend soll in einer Sandbox, in Pull Requests und auf Entwicklerrechnern ohne externe Downloads prüfbar bleiben. Audit- und SBOM-Läufe sind trotzdem wichtig, gehören aber in Jobs, die Netzwerkzugang ausdrücklich erlauben und ihre Artefakte klar ablegen.

## Lokaler Standard

Der lokale Standard ist offlinefähig. Package Export Lock, TypeExports, i18n-Komponentenprüfung, Manifest-Policy und Maraca-Paketprüfung dürfen nicht davon abhängen, dass `npm audit`, Registry-Zugriffe oder externe SBOM-Generatoren verfügbar sind. Dadurch können Drittanbieter dieselben Kernprüfungen in restriktiven Umgebungen ausführen.

Wenn eine lokale Prüfung rot wird, liegt die Ursache also in der Repository-Oberfläche: ein Export fehlt, ein Manifest-Key ist falsch, ein Typziel wurde nicht klassifiziert oder ein Bootstrap-Modul wird wie eine visuelle Komponente behandelt. Netzwerkfehler sollten diesen Pfad nicht verdecken.

## Bedingte Evidenz

Netzwerk-Evidenz wird in Nightly- oder manuellen Workflows gesammelt. Diese Jobs dürfen Audit-Reports und SBOM-Dateien schreiben, solange die Ergebnisse von den lokalen Gates getrennt bleiben. Ein fehlender Netzwerkbericht blockiert dann nicht automatisch jede lokale Entwicklung, bleibt aber als Veröffentlichungssignal sichtbar.

```txt
schema: xtend.epic13.conditional-network-evidence.v1
local gate: node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json
ci schema: xtend.epic13.conditional-network-evidence-ci.v1
ci command: npm run conditional-network:evidence
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
network-restricted-local-default
publish boundary: private-until-release-owner-acceptance
Package Export Lock Workpackage: WP-E13-04
Release Handoff: WP-E13-09
Package Export Lock Docs: ./package-export-lock.md
```

## CI-Regel

Standard-Gates verwenden die lokalen Befehle und schreiben schnelle JSON-Reports. Nightly darf zusätzliche Evidence sammeln und mit den Paket-Artefakten hochladen. Für neue Module wie `xtend-i18n` und `xtend-maraca` heißt das: Die Kernprüfung muss ohne Netzwerk laufen, während breitere Sicherheits- und Lieferketteninformationen in eigenen Jobs entstehen.

Diese Trennung ist besonders wichtig, wenn eine Organisation private Registries, eingeschränkte Runner oder reproduzierbare Builds nutzt. Der lokale Pfad bleibt deterministisch; der Netzwerkpfad liefert zusätzliche Sicherheit, wenn die Umgebung dafür bereit ist.

## Pflegehinweise

Dokumentiere neue Netzwerkkommandos nur, wenn klar ist, welcher Job sie ausführt und wo das Artefakt landet. Ergänze keine Registry- oder Audit-Abhängigkeit in einer Standard-Suite, wenn dieselbe Aussage durch lokale Dateien geprüft werden kann. So bleiben schnelle CI-Gates zuverlässig und Nightly behält die größere Supply-Chain-Sicht.

## Weiterführend

Der CI-Leitfaden macht aus einem lokalen Conditional-Network-Record ein reproduzierbares Gate-Ergebnis. [Verwandter Artikel](./conditional-network-evidence-ci.md)
