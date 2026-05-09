# XTend Component Shell Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.shell.v1`
- Report Contract: `xtend.component.shell-report.v1`
- Workpackage: `WP-E11-02`
- Bezug:
  - `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/WP-E11-02-Component-Shell-Contract-spezifizieren.md`
  - `development/XTend-Component-UX-Reifegradmodell.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `xtend-builder/typing/component-shell-contract.js`
  - `tests/components/component_shell_contract_suite.js`

## Zweck

Der Component Shell Contract macht die sichtbare Oberflaeche einer XTend-Komponente zur stabilen Public API. Eine Enterprise-reife Komponente ist damit nicht nur ein Custom Element mit Eigenschaften und Events, sondern besitzt eine vorhersagbare Shell fuer DOM-Modus, States, Slots, CSS Parts, Tokens, Focus, Runtime-A11y, Performance, RMT Authoring, Fabric und Host-Kompatibilitaet.

Der Contract erweitert `xtend.component.contract.v2` und nutzt das UX-Reifegradmodell `xtend.component.ux-maturity-model.v1`. Er ist bewusst framework-agnostisch: XTend-Komponenten koennen in XTend-only, RMT-first, Vanilla, React, Vue und Custom-Host-Apps laufen. RMT konsumiert Shell-Daten ueber Adapterrecords; der RMT Kernel importiert keine XTend-Typen.

## Leitentscheidung

Component Shell ist Produkt- und Contract-Oberflaeche.

Ab Epic 11 gilt:

- Shell-Zonen sind stabil benannt.
- sichtbare States sind Teil des Contracts.
- Slots und CSS Parts duerfen nicht zufaellig entstehen.
- Focus und Keyboard-Verhalten gehoeren zur Shell.
- A11y ist Runtime-Verhalten, keine reine Metadatenpflicht.
- Performance-Budgets werden an Shell-Operationen gebunden.
- RMT Shell Authoring beschreibt Shell, Style, A11y, Events und Fabric-Hints als Daten.
- Fabric darf Shell-Operationen messen und absichern.
- Der Boundary Marker bleibt `no-rmt-kernel-import-of-xtend-types`.

## Interface

```ts
export interface XtendComponentShellContract {
  schema: 'xtend.component.shell.v1';
  status: 'contract-draft' | 'accepted' | 'deprecated';
  workpackage: 'WP-E11-02';
  componentContract: 'xtend.component.contract.v2';
  uxMaturityModel: 'xtend.component.ux-maturity-model.v1';
  tag: string;
  dom: XtendComponentShellDomContract;
  states: XtendComponentShellState[];
  slots: XtendComponentShellSlotContract[];
  parts: XtendComponentShellPartContract[];
  tokens: XtendComponentShellTokenContract[];
  focus: XtendComponentShellFocusContract;
  a11y: XtendComponentShellA11yContract;
  performance: XtendComponentShellPerformanceContract;
  rmt: XtendComponentShellRmtContract;
  fabric: XtendComponentShellFabricContract;
  compatibility: XtendComponentShellCompatibilityContract;
  docs: XtendComponentShellDocsContract;
  tests: XtendComponentShellTestContract;
}
```

## Pflichtdomains

| Domain | Pflicht |
|--------|---------|
| `dom` | DOM-Modus, Root-Part, Focus-Delegation, Form-Association und State-Attributstrategie |
| `states` | definierte Shell-States fuer Rendering, A11y, Styling und RMT |
| `slots` | stabile Content-Projektion fuer Labels, Help, Error und Inhalte |
| `parts` | CSS-Part-Oberflaeche fuer gezieltes Styling |
| `tokens` | lokale Shell-Tokens mit Defaults und Kategorien |
| `focus` | Focus-Strategie, sichtbarer Fokus, Keyboard-Pflicht und Route-Restore |
| `a11y` | echte Runtime-A11y, Screenreader-Signale, Reduced Motion und Forced Colors |
| `performance` | Mount-, Hydration- und Event-Budgets sowie Cleanup-Regeln |
| `rmt` | Adapterdaten fuer `xtend.rmt.shell-authoring.v1` |
| `fabric` | Fabric-Lane-, Fiber- und Error-Boundary-Anschluss |
| `compatibility` | Host-Modi, native Custom-Element-Pflicht und keine globale Magic-State-Kopplung |
| `docs` | Authoring- und Component-Doku-Pflichten |
| `tests` | lokale Gates, Fixtures und browsernahe Folgepflichten |

## DOM-Modi

Zulaessige DOM-Modi:

| Modus | Einsatz |
|-------|---------|
| `shadow` | bevorzugter Standard fuer gekapselte Enterprise-Komponenten |
| `light` | Komponenten, die native Semantik, Form-Integration oder Host-Styles direkt brauchen |
| `hybrid` | Migrations- oder Kompositionsmodus mit klar benannter Shell-Grenze |

Die Shell muss immer einen stabilen Root-Part besitzen. Standard ist `part="root"`.

## Pflichtstates

Jede Shell muss die States `empty`, `loading`, `ready`, `error`, `disabled`, `busy`, `invalid` beschreiben.

Kurzform fuer Gates und Doku: `empty`, `loading`, `ready`, `error`, `disabled`, `busy`, `invalid`.

States duerfen um komponentenspezifische Zustaende wie `open`, `selected`, `checked`, `active` oder `expanded` erweitert werden. Die Pflichtstates bleiben erhalten und muessen fuer Styling, A11y und RMT stabil interpretierbar sein.

## Slots

Empfohlene Basisslots:

| Slot | Zweck |
|------|-------|
| `default` | Hauptinhalt oder Control Content |
| `label` | sichtbares Label oder Label-Bridge |
| `helper` | Hilfetext |
| `error` | Fehlermeldung |
| `prefix` | fuehrendes Icon, Text oder Add-on |
| `suffix` | folgendes Icon, Text oder Add-on |

Slots sind RMT-beschreibbar. RMT soll strukturiertes Markup ueber `dom_descriptor` oder sichere Text-/Template-Records liefern, nicht durch unkontrollierte HTML-Sinks.

## CSS Parts

Empfohlene Basisparts:

| Part | Zweck |
|------|-------|
| `root` | stabile Shell-Wurzel |
| `control` | interaktiver Kern |
| `label` | Label-Oberflaeche |
| `content` | Content-Projektion |
| `helper` | Help-Region |
| `error` | Error-Region |
| `icon` | Icon-Region |

Komponenten duerfen weitere Parts wie `overlay`, `backdrop`, `listbox`, `option`, `thumb`, `track` oder `panel` definieren. CSS Parts sind Public API und duerfen nur mit Migrationshinweis entfernt oder umbenannt werden.

## Tokens

Shell-Tokens sind lokale Design Tokens mit stabilem Namen, Default und Kategorie. Sie duerfen globale Theme Tokens referenzieren.

Beispiele:

```css
--xtend-select-color: var(--xtend-color-text);
--xtend-select-surface: var(--xtend-color-surface);
--xtend-select-radius: var(--xtend-radius-sm);
--xtend-select-gap: var(--xtend-space-2);
--xtend-select-motion-duration: var(--xtend-motion-duration-fast);
```

Der Styling-Detailcontract folgt in `WP-E11-03`. Dieser Shell Contract legt nur fest, dass Tokens zur Shell gehoeren und von Component Lab, RMT und Doku gesehen werden muessen.

## Focus

Zulaessige Focus-Strategien:

| Strategie | Einsatz |
|-----------|---------|
| `none` | rein dekorative oder nicht interaktive Shell |
| `host` | Host-Element ist fokussierbar |
| `delegates-focus` | Shadow DOM delegiert Fokus an internen Control |
| `managed-roving` | komplexe Menues, Tabs, Listen oder Optionengruppen |
| `trap` | Dialoge, Modals und blockierende Overlays |

Sichtbarer Fokus ist Pflicht. Keyboard-Bedienbarkeit ist fuer alle interaktiven Shells Pflicht.

## Runtime-A11y

Die Shell bindet `xtend.a11y.component-contract.v1` ein, macht aber Runtime-Verhalten sichtbar. Eine Shell gilt erst als reif, wenn sie im Browser bedienbar und wahrnehmbar ist.

Pflichten:

- Rolle, Name und Zustand sind korrekt ableitbar.
- ARIA wird nur eingesetzt, wenn native Semantik nicht reicht.
- Screenreader-Signale fuer Status, Fehler und dynamische Inhalte sind vorbereitet.
- Reduced Motion verursacht keinen Funktionsverlust.
- Forced Colors und High Contrast behalten sichtbare Focus- und Statussignale.
- `disabled`, `busy`, `invalid` und `error` sind nicht nur visuelle Klassen.

## Performance

Die Shell bindet `xtend.performance.component-profile.v1` ein und legt Basispflichten fest:

| Budget | Default |
|--------|---------|
| `mountBudgetMs` | `16` |
| `hydrateBudgetMs` | `24` |
| `eventBudgetMs` | `8` |

Zusatzregeln:

- keine unkontrollierten Layout Thrashes
- Cleanup fuer Observer, Timer und globale Event Listener
- Hydration Policy sichtbar
- Shell-Operationen muessen fuer Fabric messbar bleiben

## RMT Shell Authoring

Die Shell bereitet den Contract `xtend.rmt.shell-authoring.v1` vor.

RMT darf folgende Shell-Daten deklarieren:

- `shell`
- `style`
- `a11y`
- `commands`
- `events`
- `variants`
- `density`
- `hydration`
- `schedule`
- `fabric`

Beispiel:

```json
{
  "id": "settings.submit",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-button",
  "slots": {
    "default": "Save settings"
  },
  "shell": {
    "state": "ready",
    "density": "compact"
  },
  "style": {
    "parts": {
      "control": ["enterprise-action"]
    }
  },
  "a11y": {
    "name": "Save settings",
    "keyboard": "button"
  },
  "schedule": "component.visible.hydrate",
  "fabric": {
    "lane": "user-blocking",
    "fiber": "component.interaction"
  }
}
```

RMT bleibt neutral. Der XTend Component Adapter interpretiert diese Daten. Der RMT Kernel kennt keine XTend-Klassen, keine XTend-Komponentenmodule und keine XTend-Typen.

Boundary: `no-rmt-kernel-import-of-xtend-types`.

## Fabric-Anschluss

Jede Enterprise-Shell muss fuer `@xtend-fabric` vorbereitet sein:

- Lane Ingestion
- Fiber Hints fuer `component.mount`, `component.hydrate`, `component.render`, `component.event`
- Lifecycle Error Boundary
- Telemetry- und Performance-Snapshots
- Diagnosefelder fuer Component, Phase, Fiber, Lane, Severity und Cause

Fabric ist Sicherheits- und Beobachtungsschicht, nicht UI-Frameworkersatz.

## Kompatibilitaet

Pflicht-Hostmodi:

- `xtend-only`
- `rmt-first`
- `vanilla`
- `react`
- `vue`
- `custom-shell`

Komponenten bleiben native Custom Elements. Kommunikation laeuft ueber Attribute, Properties, DOM Events, Slots, Commands, Form Association, Fabric und RMT Adapterdaten. Undokumentierter globaler Magic State ist nicht Teil des Shell Contracts.

## UX-Reifegrad-Mapping

| Reifegrad | Shell-Erwartung |
|-----------|-----------------|
| `ux-baseline` | Shell identifiziert Root, States und Mindestslots |
| `ux-ready` | Shell, Slots, Parts, Focus, A11y-Profile und Performance-Basis sind dokumentiert |
| `ux-stable` | Browsernahe Bedienung, RMT Authoring und Fabric-Telemetry sind gatebar |
| `ux-core` | Shell ist fuer P0-Komponenten produktreif, vernetzt, performant und a11y-stabil |

## Gate

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js component-shell-contract --json
```

Package Script:

```bash
npm run test:component-shell-contract
```

Die Suite validiert Factory, Validator, Package-Metadaten, Scaffold-Anschluss, Runner, Epic-/Backlog-Status und Doku.

## Handoff

`WP-E11-02` ist Grundlage fuer:

- `WP-E11-03` Styling-, Token- und CSS-Part-Contract
- `WP-E11-04` Runtime-A11y-Contract
- `WP-E11-05` Component Performance Profiles
- `WP-E11-06` Component Network Contract
- `WP-E11-07` RMT Shell Authoring
- `WP-E11-08` bis `WP-E11-12` Komponentenfamilien-Umsetzung
