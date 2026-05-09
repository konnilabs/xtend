# WP-E11-02 - Component Shell Contract spezifizieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Backlog: `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Workpackage Contract: `xtend.epic11.wp02.component-shell-contract.v1`
- Ziel-Contract: `xtend.component.shell.v1`
- Report Contract: `xtend.component.shell-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js component-shell-contract --json`

## Ziel

`WP-E11-02` definiert die stabile Component Shell als sichtbare Public API fuer Enterprise-reife XTend-Komponenten. Root, DOM-Modus, States, Slots, CSS Parts, Tokens, Focus, Runtime-A11y, Performance, RMT Authoring, Fabric und Host-Kompatibilitaet werden als Contract festgeschrieben.

Damit ist die Shell nicht laenger implizites internes Markup, sondern ein pruefbares Produktversprechen fuer Entwickler, Hosts und RMT-first Apps.

## Ausgangslage

`WP-E11-01` hat Epic 11 in Workpackages zerlegt und das UX-Reifegradmodell `xtend.component.ux-maturity-model.v1` akzeptiert. Epic 10 hat bereits Component Contract v2, RMT-first App Authoring, Fabric, Telemetry, Lanes und TypeScript-first Komponenten bereitgestellt.

Die offene Luecke war die sichtbare Shell-Ebene: Komponenten hatten bereits Contracts, Types und Tests, aber noch keinen gemeinsamen Vertrag fuer UI-Shell, States, Parts, Focus und RMT-beschreibbare Shell-Daten.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Component-Shell-Contract.md` | akzeptierter Shell Contract `xtend.component.shell.v1` |
| `xtend-builder/typing/component-shell-contract.js` | maschinenlesbare Factory und Validator fuer Shell Contracts |
| `tests/components/component_shell_contract_suite.js` | lokaler Gate fuer Contract, Metadata, Scaffold und Doku |
| `scripts/run_xtend_tests.js` | Runner-Integration als Suite `component-shell-contract` |
| `package.json` | Export, Testscript, PR-Gate und XTend-Metadaten |
| `xtend-builder/scaffold.config.js` | Scaffold-Anschluss fuer Shell Contract |
| `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` | Epic-Status und Handoff aktualisiert |
| `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` | Backlog-Status und Folgepakete aktualisiert |
| `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` | Referenzpfade nachgezogen |
| `tests/references/reference_path_suite.js` | Referenz-Gate um WP-E11-02 erweitert |

## Contract-Entscheidungen

### 1. Shell erweitert Component Contract v2

Der neue Contract referenziert `xtend.component.contract.v2`, ersetzt diesen aber nicht. Component Contract v2 bleibt die Plattformoberflaeche fuer Source, Runtime, Public API, RMT, Fabric, Telemetry, A11y, Performance, Tests und Docs. Der Shell Contract fokussiert die sichtbare UI-Schicht.

### 2. Pflichtdomains sind gatebar

Pflichtdomains:

- `dom`
- `states`
- `slots`
- `parts`
- `tokens`
- `focus`
- `a11y`
- `performance`
- `rmt`
- `fabric`
- `compatibility`
- `docs`
- `tests`

Die Factory erzeugt diese Domains fuer neue Shells. Der Validator lehnt unvollstaendige Contracts ab.

### 3. Pflichtstates sind stabil

Jede Shell muss `empty`, `loading`, `ready`, `error`, `disabled`, `busy`, `invalid` kennen. Komponentenspezifische States duerfen hinzukommen, aber diese Basis bleibt fuer Styling, A11y, RMT und Tests stabil.

### 4. Slots und Parts sind Public API

Basisslots:

- `default`
- `label`
- `helper`
- `error`
- `prefix`
- `suffix`

Basisparts:

- `root`
- `control`
- `label`
- `content`
- `helper`
- `error`
- `icon`

Diese Namen bilden die Bruecke zu Styling, Component Lab und RMT Authoring.

### 5. Focus und A11y sind Runtime-Verhalten

Zulaessige Focus-Strategien:

- `none`
- `host`
- `delegates-focus`
- `managed-roving`
- `trap`

Sichtbarer Fokus und Keyboard-Bedienbarkeit sind fuer interaktive Shells Pflicht. Der Shell Contract bindet `xtend.a11y.component-contract.v1`, verschiebt die Abnahme aber bewusst in echtes UI-Verhalten.

### 6. RMT bleibt host-neutral

Der Shell Contract fuehrt `xtend.rmt.shell-authoring.v1` als Handoff-Contract ein. RMT darf Shell-, Style-, A11y-, Command-, Event-, Variant-, Density-, Hydration-, Schedule- und Fabric-Daten deklarieren. Die Ausfuehrung bleibt Aufgabe des XTend Component Adapters.

Boundary: `no-rmt-kernel-import-of-xtend-types`.

### 7. Fabric wird zur Shell-Sicherheits- und Telemetrie-Schicht

Shells muessen fuer `@xtend-fabric`, Lane Ingestion, Fiber Hints, Error Boundaries und Telemetry vorbereitet sein. Fabric bleibt Wrapper- und Beobachtungsschicht, kein zweiter UI-Kernel.

## Definition of Done

- [x] Shell Contract `xtend.component.shell.v1` ist dokumentiert
- [x] Report Contract `xtend.component.shell-report.v1` ist definiert
- [x] Factory und Validator liegen in `xtend-builder/typing/component-shell-contract.js`
- [x] lokaler Gate `component-shell-contract` ist im Runner eingebunden
- [x] Package-Export und Package-Script sind vorhanden
- [x] Scaffold-Metadaten kennen den Shell Contract
- [x] Epic 11 und Backlog markieren `WP-E11-02` als completed
- [x] `WP-E11-03` bis `WP-E11-06` bleiben startbar
- [x] `WP-E11-07` bleibt Integrationspaket fuer RMT Shell Authoring
- [x] Reference-Gate kennt alle neuen Artefakte

## Validierung

Lokale Einzelvalidierung:

```bash
node scripts/run_xtend_tests.js component-shell-contract --json
```

Referenzvalidierung:

```bash
node scripts/run_xtend_tests.js references --json
```

Gesamtvalidierung:

```bash
node scripts/run_xtend_tests.js --json
```

## Handoff nach WP-E11-02

`WP-E11-02` macht die Shell als stabile Oberflaeche verfuegbar. Die naechsten startbaren Foundation-Pakete sind:

- `WP-E11-03` Styling-, Token- und CSS-Part-Contract
- `WP-E11-04` Runtime-A11y-Contract
- `WP-E11-05` Component Performance Profiles
- `WP-E11-06` Component Network Contract

`WP-E11-07` bleibt das Integrationspaket fuer RMT Shell Authoring und soll Shell, Styling, Runtime-A11y, Performance und Component Network zusammenfuehren.
