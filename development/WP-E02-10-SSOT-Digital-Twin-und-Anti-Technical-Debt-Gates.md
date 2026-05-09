# WP-E02-10 - SSOT-, Digital-Twin- und Anti-Technical-Debt-Gates

- Status: completed
- Datum: 4. Mai 2026
- Epic: `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- Backlog: `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- Bezug:
  - `development/XTend-Architecture-Gate-Regeln.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `docs/XTend-ADR.md`
  - `compliance/digital-twin-principle.md`
  - `tests/core/architecture_gate_suite.js`
  - `scripts/run_xtend_tests.js`

## Ziel

`WP-E02-10` uebersetzt SSOT, Digital Twin Principle und Anti-Technical-Debt-Regeln aus ADR und Compliance in einen eigenen lokalen Gate. Damit wird Architekturqualitaet nicht nur als Review-Hinweis gefuehrt, sondern im Epic-02-Harness als pruefbarer Standard sichtbar.

## Umgesetzter Scope

- Single Source of Truth fuer Runtime-, Doku- und Migrationsvertraege
- Digital Twin Principle fuer State-getriebene UI-Fluesse
- kanonische XTend-State-Keys plus dokumentierte Legacy-Fassaden
- Verbot direkter `xstate.on/off` Nutzung in priorisiertem Runtime-Code
- Verbot unnamespaced globaler Helper in Komponenten
- Timer-Workaround-Gate fuer Overlay-Open-State
- Anti-Technical-Debt-Gate gegen offene `TODO`, `FIXME` und `HACK` Marker im priorisierten Core

## Zielartefakte

- `development/XTend-Architecture-Gate-Regeln.md`
  - beschreibt SSOT-Regeln
  - beschreibt Digital-Twin-Regeln
  - beschreibt Anti-Technical-Debt-Regeln
  - dokumentiert die lokalen Gate-Befehle
- `tests/core/architecture_gate_suite.js`
  - prueft ADR, Digital-Twin-Compliance, Core-Checklist und Gate-Regeln
  - prueft Runtime-Compliance-Metadaten in `api.js`
  - prueft `xstate` Legacy-Fassade gegen kanonischen `subscribe`-Contract
  - prueft State-Key-Vertraege fuer Dialog, Modal, Alert, Theme und Router
  - prueft Anti-Pattern-Grenzen fuer priorisierte Core-Dateien
- `scripts/run_xtend_tests.js`
  - stellt den neuen Runner-Einstieg `architecture` bereit

## Implementierungsnotizen

Der Gate bleibt bewusst statisch und contract-basiert. Er soll Drift frueh sichtbar machen und lokale Entwicklung nicht von externem CI, Browsern oder Netzwerken abhaengig machen.

Die Suite behandelt Legacy-Pfade nicht als Fehler, solange sie dokumentiert und an kanonische XTend-Pfade gekoppelt sind. Das ist wichtig fuer rueckwaertskompatible Modernisierung: bestehende Integrationen duerfen weiter funktionieren, neue Arbeit soll aber den namespaced Contract bevorzugen.

## Lokaler Testpfad

Einzelner Gate:

```bash
node scripts/run_xtend_tests.js architecture
```

Gesamtsuite:

```bash
node scripts/run_xtend_tests.js
```

Rueckwaertskompatibler Core-Verify:

```bash
node scripts/verify_xtend_core_contracts.js
```

## Definition of Done

- zentrale Architekturprinzipien sind als konkrete Regeln beschrieben
- mindestens ein automatisierter Architecture-Gate laeuft lokal
- neue Component-Arbeit kann gegen SSOT, Digital Twin und Anti-Technical-Debt-Regeln bewertet werden
- Backlog und Epic-Status spiegeln den Abschluss von `WP-E02-10`
- lokale Suite und Legacy-Verify bleiben gruene Verifikationspfade

## Abschluss

`WP-E02-10` ist abgeschlossen. Der naechste startbare Schritt ist `WP-E02-11`, um Dokumentations- und Demo-Referenzpfade pruefbar zu machen.
