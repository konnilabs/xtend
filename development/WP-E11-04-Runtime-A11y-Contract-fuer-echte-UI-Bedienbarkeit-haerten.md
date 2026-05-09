# WP-E11-04 - Runtime-A11y-Contract fuer echte UI-Bedienbarkeit haerten

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Backlog: `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Workpackage Contract: `xtend.epic11.wp04.runtime-a11y-contract.v1`
- Ziel-Contract: `xtend.component.runtime-a11y.v1`
- Report Contract: `xtend.component.runtime-a11y-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js runtime-a11y-contract --json`

## Ziel

`WP-E11-04` erweitert A11y von Contract-Metadaten auf echtes UI-Verhalten. Keyboard, Focus, ARIA, Screenreader-Signale, Reduced Motion, High Contrast, Form Validation, Overlay-Focus und Routing-A11y werden als Runtime-Contract festgelegt.

Damit ist A11y kein Dokumentationsfeld mehr, sondern ein pruefbarer Bestandteil der Component Experience.

## Ausgangslage

`WP-E11-02` hat die Component Shell akzeptiert. `WP-E11-03` hat Styling, Tokens, CSS Parts, Motion und Contrast als Public API festgelegt. Bestehende Enterprise-Artefakte liefern bereits `xtend.a11y.component-contract.v1`, `xtend.a11y.screenreader-signals.v1` und `xtend.a11y.motion-contrast-policy.v1`.

Die offene Luecke war die explizite Runtime-Schicht: Welche Browser-Verhaltenserwartungen muessen Komponenten wirklich erfuellen, damit A11y nicht nur metadata-complete, sondern nutzbar ist?

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Runtime-A11y-UX-Contract.md` | akzeptierter Runtime A11y Contract `xtend.component.runtime-a11y.v1` |
| `a11y/runtime-a11y-contract.js` | maschinenlesbare Factory und Validator fuer Runtime A11y |
| `tests/a11y/runtime_a11y_contract_suite.js` | lokaler Gate fuer Contract, Metadata, Scaffold und Doku |
| `scripts/run_xtend_tests.js` | Runner-Integration als Suite `runtime-a11y-contract` |
| `package.json` | Export, Testscript, PR-Gate und XTend-Metadaten |
| `xtend-builder/scaffold.config.js` | Scaffold-Anschluss fuer Runtime A11y |
| `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` | Epic-Status und Handoff aktualisiert |
| `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` | Backlog-Status und Folgepakete aktualisiert |
| `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` | Referenzpfade nachgezogen |
| `tests/references/reference_path_suite.js` | Referenz-Gate um WP-E11-04 erweitert |

## Contract-Entscheidungen

### 1. Runtime-A11y erweitert Shell und Styling

Der neue Contract referenziert `xtend.component.shell.v1` und `xtend.component.styling.v1`. Shell stellt Zonen und States bereit; Styling stellt Fokus, Contrast, Motion und visuelle Zustandsoberflaechen bereit; Runtime-A11y definiert das tatsächliche Verhalten.

### 2. Pflichtdomains sind gatebar

Pflichtdomains:

- `semantics`
- `accessibleName`
- `keyboard`
- `focus`
- `aria`
- `screenreader`
- `motion`
- `contrast`
- `states`
- `forms`
- `overlays`
- `routing`
- `rmt`
- `fabric`
- `compatibility`
- `docs`
- `tests`

### 3. Browser-Verhalten ist Abnahmebasis

Pflichtassertions:

- `semantic-role`
- `accessible-name`
- `keyboard-path`
- `focus-visible`
- `focus-order`
- `screenreader-signal`
- `reduced-motion-safe`
- `forced-colors-safe`
- `no-color-only-state`

### 4. Runtime-Profile bleiben komponentennah

Unterstuetzte Profile:

- `display`
- `interactive`
- `form`
- `feedback`
- `overlay`
- `routing`
- `media`

Profile liefern Defaults, aber keine Ausrede gegen komponentenspezifische Tests.

### 5. RMT A11y Authoring wird vorbereitet

Der Handoff-Contract ist `xtend.rmt.a11y-authoring.v1`. RMT kann `a11y`, `role`, `name`, `description`, `keyboard`, `focus`, `aria`, `screenreader`, `motion` und `contrast` deklarieren.

Boundary: `no-rmt-kernel-import-of-xtend-types`.

### 6. Fabric bekommt A11y Lane und Fibers

Runtime-A11y mappt auf Lane `a11y` und Fibers `a11y.keyboard`, `a11y.focus`, `a11y.announce`, `a11y.preference`.

## Definition of Done

- [x] Runtime A11y Contract `xtend.component.runtime-a11y.v1` ist dokumentiert
- [x] Report Contract `xtend.component.runtime-a11y-report.v1` ist definiert
- [x] Factory und Validator liegen in `a11y/runtime-a11y-contract.js`
- [x] lokaler Gate `runtime-a11y-contract` ist im Runner eingebunden
- [x] Package-Export und Package-Script sind vorhanden
- [x] Scaffold-Metadaten kennen den Runtime A11y Contract
- [x] Epic 11 und Backlog markieren `WP-E11-04` als completed
- [x] `WP-E11-06` bleibt startbar
- [x] `WP-E11-07` bleibt Integrationspaket fuer RMT Shell Authoring
- [x] Reference-Gate kennt alle neuen Artefakte

## Validierung

Lokale Einzelvalidierung:

```bash
node scripts/run_xtend_tests.js runtime-a11y-contract --json
```

Referenzvalidierung:

```bash
node scripts/run_xtend_tests.js references --json
```

Gesamtvalidierung:

```bash
node scripts/run_xtend_tests.js --json
```

## Handoff nach WP-E11-04

`WP-E11-04` macht Runtime-A11y als echte UI-Verhaltenserwartung verfuegbar. Die naechsten startbaren Foundation-Pakete sind:

- `WP-E11-05` Component Performance Profiles
- `WP-E11-06` Component Network Contract

`WP-E11-07` bleibt das Integrationspaket fuer RMT Shell Authoring und soll Shell, Styling, Runtime-A11y, Performance und Component Network zusammenfuehren.
