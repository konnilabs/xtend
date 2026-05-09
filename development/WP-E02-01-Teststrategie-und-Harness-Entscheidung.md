# WP-E02-01 - Teststrategie und Harness-Entscheidung

- Status: Completed
- Datum: 3. Mai 2026
- Epic: `EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`
- Backlog: `BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren`

## Ziel

Dieses Workpackage legt die Teststrategie fuer Epic 02 fest und entscheidet, wie der bestehende Core-Verify-Pfad zu einem abgestuften Test-Harness ausgebaut wird. Die Strategie muss leicht genug bleiben, um im aktuellen Repo sofort nutzbar zu sein, aber stabil genug, um spaeter Browser-, Component-, Accessibility-, Hydration-, Scaffold- und XTendRMT-Tests aufzunehmen.

## Ausgangspunkt

Epic 01 hat mit `scripts/verify_xtend_core_contracts.js` einen ersten repo-lokalen Regression- und Contract-Check geschaffen. Dieser Script ist bewusst klein, schnell und ohne externe Toolchain lauffaehig. Epic 02 darf diesen Pfad nicht ersetzen, bevor ein belastbarer neuer Harness existiert.

Aktuelle Baseline:

- `node scripts/verify_xtend_core_contracts.js` ist der verbindliche Core-Regression-Startpunkt.
- Es gibt noch keine standardisierte `tests/` Struktur.
- Es gibt noch keine Component-Level-Tests.
- Es gibt noch keinen Browser-/E2E-Harness.
- Es gibt noch keine operationalisierten A11y-, Hydration- oder Digital-Twin-Gates ausserhalb einzelner Core-Checks.

## Entscheidung

XTend nutzt fuer Epic 02 einen stufenweisen Harness-Aufbau:

1. **Node-basierter Contract Harness als Basis**
   - keine neue externe Pflicht-Dependency im ersten Schritt
   - bestehender Verify-Script bleibt lauffaehig
   - Core-, Manifest-, Doku- und statische Contract-Checks werden zuerst modularisiert

2. **Browser-Smoke Harness als zweite Stufe**
   - fuer echte Custom Elements, Hydration, Sichtbarkeit, Navigation und DOM-Lifecycle
   - erst nach dokumentierter Teststruktur und lokalen Entry-Points
   - bevorzugt mit schlankem Playwright- oder aequivalentem Browser-Runner, sobald die Tooling-Entscheidung in `WP-05` konkret umgesetzt wird

3. **Component-Level Harness als dritte Stufe**
   - fuer Attribute, Properties, Events, Slots, Accessibility und State-Sync
   - nutzt gemeinsame Fixtures und Assertions
   - liefert spaeter den Standard, den `XTend-Scaffold` fuer neue Komponenten wiederverwenden soll

4. **Compliance Gates als Querschnitt**
   - SSOT, Digital Twin Principle und Anti-Technical-Debt-Regeln werden nicht als separater Nachgedanke behandelt
   - sie werden in Contract-, Component- und Browser-Tests eingebettet
   - nicht automatisierbare Regeln werden als Review-Gates dokumentiert

## Testebenen

### T1 - Static Contract Tests

Ziel: schnelle, deterministische Checks ohne Browser und ohne DOM-Runtime.

Typische Pruefungen:

- Manifest-Eintraege und Pfade
- Doku-Menue-Referenzen
- vorhandene TypeScript-Definitionen
- Export-/Namespace-Erwartungen
- Syntax-Checks fuer Core-Dateien
- Namens- und Event-Contract-Fragmente

Primaerer Runner:

- Node.js
- bestehender Verify-Pfad
- spaeter modularisierte Test-Utilities

### T2 - Runtime Contract Tests

Ziel: Core-Module importieren und Laufzeitvertraege pruefen, ohne bereits echte Nutzerflows im Browser zu simulieren.

Typische Pruefungen:

- idempotente API-Initialisierung
- `xstate` Subscription-Vertrag
- Theme-API und Token-Zugriff
- Router-Methoden und State-Bridge
- Dialog-/Modal-/Toast-/Alert-Contracts

Primaerer Runner:

- Node.js, wo moeglich
- Browser-Harness, wo Custom-Element-Lifecycle zwingend ist

### T3 - Browser Smoke Tests

Ziel: echte DOM- und Custom-Element-Fluesse absichern.

Typische Pruefungen:

- Loader-Hydration
- Seite wird nach Bootstrap sichtbar
- Router navigiert deklarativ und programmatisch
- Theme-Wechsel wirkt im DOM
- Dialog/Modal/Toast/Alert reagieren sichtbar und eventgetrieben
- prefers-reduced-motion wird respektiert

Primaerer Runner:

- Browser-Smoke-Harness aus `WP-05`
- lokale Fixture-Seiten
- spaeter CI-faehig

### T4 - Component-Level Tests

Ziel: einzelne XTend-Komponenten gegen ihren oeffentlichen Vertrag pruefen.

Typische Pruefungen:

- Attribute und Properties
- Slots und Shadow-/Light-DOM-Verhalten
- Custom Events
- Accessibility-Basis
- State-Sync mit `xstate`
- Hydration und Rehydration

Primaerer Runner:

- Component-Teststandard aus `WP-07`
- Pilot-Komponenten aus `WP-08`

### T5 - Integration und Demo Reference Tests

Ziel: reale Beispiel- und Integrationspfade als Regression-Referenz nutzen.

Typische Pruefungen:

- `index.html`
- `xstatetest.html`
- `x-grid-test.html`
- `xtendrmt-bestcase.html`
- Doku-Beispiele und Komponenten-Demos

Primaerer Runner:

- Browser-Smoke-Harness
- dokumentierte Referenzliste aus `WP-11`

## Harness-Richtung

Der Harness wird in drei Schichten aufgebaut:

### 1. `scripts/` bleibt der stabile Einstieg

Kurzfristig bleiben Node-basierte Verifikationen unter `scripts/` erreichbar. Der bestehende Befehl bleibt gueltig:

```bash
node scripts/verify_xtend_core_contracts.js
```

Spaeter kann ein uebergeordneter Runner ergaenzt werden, der diesen Script aufruft, ohne bestehende Workflows zu brechen.

### 2. `tests/` wird die fachliche Teststruktur

Die neue Suite soll eine klare Struktur erhalten:

```text
tests/
  core/
  components/
  browser/
  fixtures/
  utils/
```

Die genaue Anlage erfolgt in `WP-02`. Diese Struktur trennt Testarten nach Verantwortung, nicht nach zufaelligem Implementierungsort.

### 3. Browser-Runner wird spaeter additiv eingefuehrt

Epic 02 soll im ersten Schritt nicht an einem schwergewichtigen Tooling-Setup haengen. Sobald `WP-05` startet, wird ein schlanker Browser-Runner entschieden und dokumentiert. Playwright ist der bevorzugte Kandidat, weil XTend echte Custom Elements, Navigation und sichtbare UI-Aktivierung testen muss. Die Entscheidung bleibt aber an `WP-05` gebunden, damit `WP-01` keine externe Installation erzwingt.

## Einordnung des bestehenden Verify-Scripts

`scripts/verify_xtend_core_contracts.js` bleibt:

- verbindlicher Regression-Startpunkt fuer den Core
- Kompatibilitaetsanker fuer Epic 01
- Input fuer `WP-03`
- nicht die finale Test-Suite

Der Script soll in Epic 02 nicht abrupt ersetzt werden. Er wird schrittweise in einen groesseren Harness eingeordnet:

1. unveraendert weiter lauffaehig halten
2. gemeinsame Assertion-/Fixture-Helfer vorbereiten
3. bestehende Checks in Core-Testgruppen ueberfuehren
4. Browser- und Component-Tests daneben aufbauen
5. spaeter einen gemeinsamen lokalen Runner bereitstellen

## Mapping auf Epic-02-Workpackages

| Workpackage | Testebene | Rolle |
|-------------|-----------|-------|
| `WP-01` | Strategie | Testebenen, Harness-Richtung und Scope festlegen |
| `WP-02` | Struktur | `tests/` Struktur und lokale Entry-Points anlegen |
| `WP-03` | T1/T2 | Core-Verify in Harness ueberfuehren |
| `WP-04` | T1/T2/T4 | Assertions, Fixtures und Utilities schaffen |
| `WP-05` | T3 | Browser-Smoke-Harness einfuehren |
| `WP-06` | T3 | priorisierte Core-Browser-Fluesse absichern |
| `WP-07` | T4 | Component-Level-Standard definieren |
| `WP-08` | T4 | Pilot-Komponenten testen |
| `WP-09` | T3/T4 | A11y- und Hydration-Checks verankern |
| `WP-10` | Querschnitt | SSOT, Digital Twin und Technical-Debt-Gates |
| `WP-11` | T5 | Demos und Doku als Referenzpfade pruefen |
| `WP-12` | Workflow | Reporting, Befehle und CI-Vorbereitung |
| `WP-13` | Workflow | Testpflicht und Scaffold-Anschluss |
| `WP-14` | Review | KPI- und Abschlussabnahme |

## Mindestregeln fuer neue Tests

Neue Tests in Epic 02 muessen:

- lokal reproduzierbar sein
- klare Exit-Codes liefern
- keine versteckte Netzwerkabhaengigkeit haben
- Testdaten von produktivem Code trennen
- reale XTend-Contracts pruefen statt nur Implementation Details
- bestehende Epic-01-Verifikation nicht brechen
- bei Browser-Tests sichtbares Verhalten oder DOM-Zustand pruefen, nicht nur Import-Erfolg

## Nicht-Ziele fuer WP-01

- keine Anlage der vollstaendigen Teststruktur
- keine Migration des Verify-Scripts
- keine Browser-Runner-Installation
- keine Component-Level-Testimplementierung
- keine CI-Einfuehrung

Diese Punkte sind bewusst nachgelagerte Workpackages.

## Betroffene Dateien

- `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
- `scripts/verify_xtend_core_contracts.js`

## Verifikation

- `node scripts/verify_xtend_core_contracts.js`

## Ergebnis

`WP-E02-01` ist abgeschlossen. Epic 02 besitzt jetzt eine verbindliche Teststrategie und eine klare Harness-Richtung: zuerst den bestehenden Node-basierten Core-Verify stabil einordnen, danach Teststruktur und lokale Runner anlegen, anschliessend Browser-, Component-, A11y-, Hydration- und Compliance-Gates stufenweise aufbauen.
