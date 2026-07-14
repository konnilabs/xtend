# Best Practices

Robuste XTend Apps entstehen durch klare Ownership, kleine öffentliche Verträge und überprüfbares Fehlerverhalten. Die folgenden Regeln gelten für XTend-Classic-Hosts ebenso wie für Maraca-/RMT-App-Shells.

## Öffentliche Verträge zuerst

Integriere Komponenten über die in `components/manifest.json` registrierten Tags und ihre `.d.ts`-Deklarationen. Verwende Attribute, Properties, Events, Slots, CSS Parts und Tokens; greife weder auf private Shadow-DOM-Knoten noch auf interne State-Objekte zu. Ein Wrapper darf einen Vertrag übersetzen, sollte ihn aber nicht heimlich erweitern.

Halte IDs, State-Keys und Event-Namen stabil. Änderungen an einem Schema wie `xtend.rmt.component-contract.v1` benötigen eine Migration oder eine neue Version, nicht nur einen geänderten Beispieltext.

## Arbeit dem richtigen Owner geben

Canonical State gehört der Anwendung oder dem zuständigen Controller. Fabric-Lanes planen Arbeit, besitzen aber keinen Geschäftszustand. Ein Worker darf Snapshots normalisieren oder Daten vorbereiten, jedoch weder DOM noch Host-Services übernehmen. Bei XTensions bleiben Runtime, Container und CSS im Besitz des Hosts.

## Lokal und explizit laden

Nutze [XTend Classic](./xtend-classic.md) mit `xtend-loader.js` und einem lokalen Manifest für direkt gepflegtes HTML und JavaScript. Remote Surfaces brauchen Origin-Allowlist, Integrity, Capability-Policy und einen lokalen Fallback. Dynamische Imports dürfen nur bekannte Module auflösen; eine URL aus Nutzereingaben ist keine Modulreferenz.

## Messen statt vermuten

Lege Budgets für Mount, Hydration und Interaktion fest und führe die passenden Gates aus. Die [XTend Dev Surface](./xtend-dev-surface.md) macht Performance, Kernel und Fabric sichtbar, ersetzt aber keinen reproduzierbaren CI-Report. Diagnose-Snapshots sollten Zeitbasis, Schema und Status ausdrücklich nennen.

## Fehler sichtbar degradieren

Ein optionaler Adapter darf ausfallen, ohne den Host zu zerstören. Der Fallback muss den fehlenden Funktionsumfang benennen. Security-, Integrity- und Kernel-Fehler bleiben blockierend; sie dürfen nicht in eine allgemeine Warnung umetikettiert werden.

Beginne für eine neue Integration mit dem [Quick Start](./quick-start-guide.md). Prüfe vor einer Veröffentlichung die Befehle und Reports aus [Release Verification](./release-verification.md).
