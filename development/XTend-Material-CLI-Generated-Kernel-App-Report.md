# XTM-14: CLI-generierte Kernel-/Material-App

Stand: 16. Juli 2026  
Status: `completed`  
Owner: CCS Labs (`ccslabs`)

## Ergebnis des Source-to-Sea-Runs

Der produktive Kernpfad ist bestanden. Der Gate erzeugt eine frische App ausschließlich über `xtend-builder/bin/xt.js`, plant, baut und tuned sie über öffentliche Maraca-Kommandos und entfernt den temporären Workspace anschließend vollständig. Weder Generator- noch Compiler- oder Provider-Interna werden als Acceptance-Pfad aufgerufen.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js xtend-material-cli-generated-app --json
```

Letztes Ergebnis: `12/12 passed`, Laufzeit `78.937 s`.

## Belegte Contracts

- Acht Generator-Artefakte bleiben vom Scaffold bis nach Browser-Boot byte-identisch.
- Der Plan enthält 14 Surfaces, 14 Kernel-Schedules und 14 Fibers.
- Orchestration, Kernel, Hydration, Validation und Transitions laufen im Modus `strict`.
- Tailwind `4.3.2` läuft lokal, air-gapped, mit deaktiviertem Preflight und ohne Browser-Runtime.
- Zwei aufeinanderfolgende Builds erzeugen byte-identische CSS-, ESM-, Chunk- und Runtime-Fingerprints.
- Die Tune-Matrix bewertet zwölf Kandidaten und schreibt ausschließlich die deklarierte Tune-Config und Build-Ausgaben.
- Light/Desktop, Dark/Compact und High-Contrast/Desktop booten per direktem Route-Reload 14 echte Maraca-Surfaces mit persistenter Navigation, aktiver Route, ohne horizontales Overflow oder Remote-Assets.
- Der generierte Runtime-Host stellt die vollständige, synchron serialisierbare `xtend.devsurface.dev-api.v1` bereit.
- Eine browsergesteuerte CDP-Zelle befüllt das Pflichtfeld, beobachtet den Validation-Wechsel von disabled zu enabled, fokussiert den Review-Command und öffnet die Confirmation-Surface mit Focus-Übergabe.
- Console Exceptions, Console Errors, fehlgeschlagene Requests und HTTP-Status ab 400 sind blocking; der Abschlusslauf meldet jeweils null Befunde.
- Hash-Drift, freie Tailwind-Utility, fehlender Provider, Remote-CSS, aktiviertes Preflight und deaktivierter Kernel werden als Negativfälle erkannt.

Die maschinenlesbare Evidence liegt in `.xtend-test-results/xtend-material-cli-generated-app-report.json` und `.xtend-test-results/xtend-material-cli-generated-app/`.

## Abschlussentscheidung

XTM-14 ist abgeschlossen. Der Gate belegt den unveränderten CLI-generierten Pfad einschließlich direkter Route-Reloads, persistenter Navigation, Theme-Zellen, Validation, Focus, Confirmation und Browser-Fehlertelemetrie. Der bestehende Supportstatus bleibt `supported-opt-in`; eine Änderung des Framework-Defaults ist nicht Bestandteil dieses Tickets.

## Aufgedeckte Framework-Kante

Der Negativlauf zeigte, dass Remote-`cssInput` zuvor im Maraca-Plan normalisiert, aber nicht fail-closed abgewiesen wurde. Der generische CSS-Request-Contract blockiert Remote-Inputs und Remote-Sources nun mit `xtend.maraca.css_provider.source_blocked`. Der Tailwind-Pfad blockiert außerdem jedes Preflight-Level außer `disabled`. Die bestehenden Provider-, Tailwind- und Scaffold-Gates bleiben grün.

Der interaktive Browserlauf deckte zusätzlich einen impliziten `/favicon.ico`-Request mit 404 auf. Der generierte Host besitzt nun ein eingebettetes Data-URI-App-Icon und erzeugt dadurch weder Netzwerkzugriff noch Console-Fehler.
