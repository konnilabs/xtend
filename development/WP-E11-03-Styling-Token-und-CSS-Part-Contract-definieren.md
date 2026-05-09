# WP-E11-03 - Styling-, Token- und CSS-Part-Contract definieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Backlog: `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Workpackage Contract: `xtend.epic11.wp03.component-styling-contract.v1`
- Ziel-Contract: `xtend.component.styling.v1`
- Report Contract: `xtend.component.styling-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js component-styling-contract --json`

## Ziel

`WP-E11-03` definiert Styling als stabile Public API fuer Enterprise-reife XTend-Komponenten. Design Tokens, CSS Custom Properties, CSS Parts, Variants, Sizes, Density, Theme Bridges, Motion und Contrast werden als Contract festgeschrieben.

Damit wird Styling nicht laenger als internes CSS-Detail behandelt, sondern als dokumentierte, versionierbare und RMT-beschreibbare Oberflaeche.

## Ausgangslage

`WP-E11-02` hat die Component Shell `xtend.component.shell.v1` akzeptiert. Dort sind Root, States, Slots, Parts und Focus-Boundaries beschrieben. Fuer die naechste Schicht fehlte ein stabiler Styling-Vertrag, der diese Shell-Zonen kontrolliert oeffnet und gleichzeitig Enterprise-Anforderungen wie High Contrast, Reduced Motion, Density und Host-Kompatibilitaet erfuellt.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Component-Styling-Token-und-Part-Contract.md` | akzeptierter Styling Contract `xtend.component.styling.v1` |
| `xtend-builder/typing/component-styling-contract.js` | maschinenlesbare Factory und Validator fuer Styling Contracts |
| `tests/components/component_styling_contract_suite.js` | lokaler Gate fuer Contract, Metadata, Scaffold und Doku |
| `scripts/run_xtend_tests.js` | Runner-Integration als Suite `component-styling-contract` |
| `package.json` | Export, Testscript, PR-Gate und XTend-Metadaten |
| `xtend-builder/scaffold.config.js` | Scaffold-Anschluss fuer Styling Contract |
| `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` | Epic-Status und Handoff aktualisiert |
| `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` | Backlog-Status und Folgepakete aktualisiert |
| `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` | Referenzpfade nachgezogen |
| `tests/references/reference_path_suite.js` | Referenz-Gate um WP-E11-03 erweitert |

## Contract-Entscheidungen

### 1. Styling erweitert Shell

Der Styling Contract referenziert `xtend.component.shell.v1`. Die Shell definiert Zonen und States; Styling definiert die stabile Anpassungs- und Skinning-Oberflaeche dieser Zonen.

### 2. Pflichtdomains sind gatebar

Pflichtdomains:

- `tokens`
- `customProperties`
- `parts`
- `variants`
- `sizes`
- `density`
- `themes`
- `motion`
- `contrast`
- `rmt`
- `fabric`
- `compatibility`
- `docs`
- `tests`

Factory und Validator pruefen diese Domains lokal.

### 3. Token-Kategorien sind Pflicht

Jede Enterprise-Komponente muss Tokens fuer diese Kategorien kennen:

- `color`
- `surface`
- `text`
- `space`
- `radius`
- `typography`
- `motion`
- `elevation`
- `state`

Token-Namen nutzen den Prefix `--xtend-`; Komponenten erhalten component-scoped Tokens wie `--xtend-button-surface`.

### 4. CSS Parts bleiben Public API

Basisparts:

- `root`
- `control`
- `label`
- `content`
- `helper`
- `error`

CSS Parts duerfen nur mit Migration Notes entfernt oder umbenannt werden.

### 5. Variants, Sizes und Density sind geschlossen

Pflichtvarianten:

- `default`
- `primary`
- `secondary`
- `success`
- `warning`
- `danger`
- `neutral`

Pflichtgroessen: `sm`, `md`, `lg`.

Pflichtdichten: `comfortable`, `compact`, `dense`.

Unbekannte Varianten werden ignoriert und diagnostiziert, nicht hart zur Laufzeit gebrochen.

### 6. Themes, Motion und Contrast sind by design

Pflichtthemes:

- `light`
- `dark`
- `high-contrast`
- `forced-colors`

Reduced Motion und High Contrast sind keine Folgeaufgabe im CSS, sondern Contract-Pflichten. Kein kritischer State darf nur ueber Farbe kommuniziert werden.

### 7. RMT Style Authoring wird vorbereitet

Der neue Handoff-Contract ist `xtend.rmt.style-authoring.v1`. RMT kann `style`, `tokens`, `parts`, `variant`, `size`, `density`, `theme`, `motion` und `contrast` deklarieren. Der XTend Component Adapter konsumiert diese Daten.

Boundary: `no-rmt-kernel-import-of-xtend-types`.

## Definition of Done

- [x] Styling Contract `xtend.component.styling.v1` ist dokumentiert
- [x] Report Contract `xtend.component.styling-report.v1` ist definiert
- [x] Factory und Validator liegen in `xtend-builder/typing/component-styling-contract.js`
- [x] lokaler Gate `component-styling-contract` ist im Runner eingebunden
- [x] Package-Export und Package-Script sind vorhanden
- [x] Scaffold-Metadaten kennen den Styling Contract
- [x] Epic 11 und Backlog markieren `WP-E11-03` als completed
- [x] `WP-E11-04` bis `WP-E11-06` bleiben startbar
- [x] `WP-E11-07` bleibt Integrationspaket fuer RMT Shell Authoring
- [x] Reference-Gate kennt alle neuen Artefakte

## Validierung

Lokale Einzelvalidierung:

```bash
node scripts/run_xtend_tests.js component-styling-contract --json
```

Referenzvalidierung:

```bash
node scripts/run_xtend_tests.js references --json
```

Gesamtvalidierung:

```bash
node scripts/run_xtend_tests.js --json
```

## Handoff nach WP-E11-03

`WP-E11-03` macht Styling als stabile API-Schicht verfuegbar. Die naechsten startbaren Foundation-Pakete sind:

- `WP-E11-04` Runtime-A11y-Contract
- `WP-E11-05` Component Performance Profiles
- `WP-E11-06` Component Network Contract

`WP-E11-07` bleibt das Integrationspaket fuer RMT Shell Authoring und soll Shell, Styling, Runtime-A11y, Performance und Component Network zusammenfuehren.
