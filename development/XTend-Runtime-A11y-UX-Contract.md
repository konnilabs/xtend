# XTend Runtime A11y UX Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.runtime-a11y.v1`
- Report Contract: `xtend.component.runtime-a11y-report.v1`
- Workpackage: `WP-E11-04`
- Bezug:
  - `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/WP-E11-04-Runtime-A11y-Contract-fuer-echte-UI-Bedienbarkeit-haerten.md`
  - `development/XTend-Component-Shell-Contract.md`
  - `development/XTend-Component-Styling-Token-und-Part-Contract.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Screenreader-Signal-Contract.md`
  - `development/XTend-Motion-und-Contrast-Policy.md`
  - `a11y/runtime-a11y-contract.js`
  - `tests/a11y/runtime_a11y_contract_suite.js`

## Zweck

Der Runtime A11y UX Contract macht Barrierefreiheit zu echtem UI-Verhalten. A11y gilt nicht als abgeschlossen, wenn Metadaten existieren; sie gilt erst als stabil, wenn Komponenten im Browser per Keyboard, Focus, Screenreader, Motion-Preference und Contrast-Mode bedienbar und wahrnehmbar sind.

Der Contract baut auf `xtend.component.shell.v1`, `xtend.component.styling.v1`, `xtend.a11y.component-contract.v1`, `xtend.a11y.screenreader-signals.v1` und `xtend.a11y.motion-contrast-policy.v1` auf.

## Leitentscheidung

A11y ist Runtime-Verhalten.

Ab Epic 11 gilt:

- Native Semantik hat Vorrang vor ARIA.
- Jede interaktive Komponente braucht einen Keyboard-Pfad.
- Sichtbarer Fokus ist Pflicht.
- Focus-Reihenfolge ist deterministisch.
- Dialoge und blockierende Overlays brauchen Focus Trap und Focus Return.
- Formfehler brauchen sichtbare und screenreader-taugliche Zuordnung.
- Route- und Tab-Wechsel brauchen aktive Zustands- und Announcement-Regeln.
- Reduced Motion und Forced Colors sind keine optionalen Themes.
- RMT kann A11y-Daten deklarieren, ohne XTend in den RMT Kernel einzubetten.

## Interface

```ts
export interface XtendRuntimeA11yContract {
  schema: 'xtend.component.runtime-a11y.v1';
  status: 'contract-draft' | 'accepted' | 'deprecated';
  workpackage: 'WP-E11-04';
  componentA11yContract: 'xtend.a11y.component-contract.v1';
  shellContract: 'xtend.component.shell.v1';
  stylingContract: 'xtend.component.styling.v1';
  tag: string;
  profiles: XtendRuntimeA11yProfile[];
  primaryProfile: XtendRuntimeA11yProfile;
  semantics: XtendRuntimeSemanticsContract;
  accessibleName: XtendAccessibleNameContract;
  keyboard: XtendKeyboardBehaviorContract;
  focus: XtendFocusBehaviorContract;
  aria: XtendAriaBehaviorContract;
  screenreader: XtendRuntimeScreenreaderContract;
  motion: XtendRuntimeMotionContract;
  contrast: XtendRuntimeContrastContract;
  states: XtendRuntimeStateA11yContract;
  forms: XtendFormA11yContract;
  overlays: XtendOverlayA11yContract;
  routing: XtendRoutingA11yContract;
  rmt: XtendRmtA11yAuthoringContract;
  fabric: XtendRuntimeA11yFabricContract;
  compatibility: XtendRuntimeA11yCompatibilityContract;
  docs: XtendRuntimeA11yDocsContract;
  tests: XtendRuntimeA11yTestContract;
}
```

## Pflichtdomains

| Domain | Pflicht |
|--------|---------|
| `semantics` | native-first Rolle, Landmarks und ARIA-Grenzen |
| `accessibleName` | Name-Quellen und Fallback-Policy |
| `keyboard` | erreichbare Tastaturpfade |
| `focus` | sichtbarer Fokus, Reihenfolge, Trap, Restore und Route-Fokus |
| `aria` | Role/Name/State Konsistenz |
| `screenreader` | Signale, Live Regions, Status- und Errorregionen |
| `motion` | Reduced Motion und Bewegung ohne Funktionszwang |
| `contrast` | High Contrast, Forced Colors, Focus und Nicht-Farbstatus |
| `states` | A11y-Verhalten fuer disabled, busy, invalid, error, expanded, selected, active |
| `forms` | Labels, Help/Error-Zuordnung, Validation und first-invalid Focus |
| `overlays` | Dialogrolle, aria-modal, inert, Escape, Focus Trap und Focus Return |
| `routing` | aria-current, Route Announcement, Focus Restore und Active Route Focus |
| `rmt` | Adapterdaten fuer `xtend.rmt.a11y-authoring.v1` |
| `fabric` | Lane, Fiber und Diagnostics fuer Runtime-A11y |
| `compatibility` | Browser- und Host-Kompatibilitaet |
| `docs` | Autoren- und App-Doku |
| `tests` | lokale Gates und browsernahe Assertions |

## Profile

Unterstuetzte Profile:

- `display`
- `interactive`
- `form`
- `feedback`
- `overlay`
- `routing`
- `media`

Profile liefern Default-Erwartungen, ersetzen aber keine komponentenspezifische Pruefung.

## Browser-Verhalten

Pflichtassertions fuer Runtime-A11y:

- `semantic-role`
- `accessible-name`
- `keyboard-path`
- `focus-visible`
- `focus-order`
- `screenreader-signal`
- `reduced-motion-safe`
- `forced-colors-safe`
- `no-color-only-state`

Kurzform fuer Gates und Doku: `keyboard-path`, `focus-visible`, `screenreader-signal`.

## Keyboard

Bekannte Keyboard-Tasten:

- `Tab`
- `Shift+Tab`
- `Enter`
- `Space`
- `Escape`
- `ArrowLeft`
- `ArrowRight`
- `ArrowUp`
- `ArrowDown`
- `Home`
- `End`

Pflichten:

- Alle interaktiven Controls sind per `Tab` erreichbar oder bewusst roving organisiert.
- Aktivierung laeuft ueber `Enter` und/oder `Space`.
- Dismissible UI hat `Escape`.
- Komplexe Menues, Tabs, Listen oder Combobox-nahe Controls dokumentieren Arrow-Key-Verhalten.

## Focus

Focus-Verhalten:

- `visible`
- `deterministic-order`
- `restore`
- `trap`
- `roving`
- `route-stable`

Sichtbarer Fokus ist Pflicht. Overlays duerfen Fokus nicht verlieren. Routing-Komponenten duerfen Nutzerfokus nicht unvorhersehbar verschieben.

## Screenreader

Der Contract nutzt `xtend.a11y.screenreader-signals.v1`.

Live Region Modes:

- `none`
- `polite`
- `assertive`

Regeln:

- Feedback- und Form-Komponenten brauchen Status- oder Errorregionen.
- Validation Errors werden assertiv oder eindeutig zugeordnet angesagt.
- Overlays erfinden keine Live Region, wenn Semantik und Fokuskontext reichen.
- Routing braucht Route Announcement und aktive Zustandsinformation.

## Motion und Contrast

Der Contract nutzt `xtend.a11y.motion-contrast-policy.v1`.

Motion:

- Reduced Motion ist Pflicht.
- Keine Kernfunktion darf von Motion abhaengen.
- Animationen duerfen Focus, Announcements oder Hit Targets nicht verdecken.

Contrast:

- Forced Colors ist Pflicht.
- High Contrast ist Pflicht.
- Focus bleibt sichtbar.
- Status darf nicht nur farblich kommuniziert werden.

## Zustandsverhalten

Pflichtstates:

- `disabled`
- `busy`
- `invalid`
- `error`
- `expanded`
- `selected`
- `active`

Beispiele:

- `disabled`: native disabled wenn moeglich, sonst `aria-disabled` plus Keyboard-Blockade
- `busy`: `aria-busy` plus Statussignal
- `invalid`: `aria-invalid`, Error-Zuordnung und Screenreader-Signal
- `active`: `aria-current`, `aria-selected` oder passende native Semantik

## Forms

Form-Komponenten muessen:

- Labels eindeutig zuordnen
- Help- und Errortexte ueber `aria-describedby` oder native Mechanismen verbinden
- Validation-Feedback ansagen
- ersten invaliden Fokuspunkt oder Error Summary definieren
- Required/Invalid/Busy nicht nur visuell darstellen

## Overlays

Overlay-Komponenten muessen:

- Dialogrolle oder passende native Semantik besitzen
- `aria-modal` fuer modale Dialoge setzen
- Hintergrund inert oder funktional gleichwertig blockieren
- Escape-Verhalten definieren
- Focus Trap und Focus Return umsetzen

## Routing

Routing- und Navigationskomponenten muessen:

- aktive Ziele ueber `aria-current`, `aria-selected` oder passende Semantik markieren
- Route-Wechsel ansagen, wenn sich Hauptinhalt aendert
- Fokus stabil halten oder bewusst wiederherstellen
- Keyboard-Navigation dokumentieren

## RMT A11y Authoring

Der Handoff-Contract ist `xtend.rmt.a11y-authoring.v1`.

RMT darf folgende Felder deklarieren:

- `a11y`
- `role`
- `name`
- `description`
- `keyboard`
- `focus`
- `aria`
- `screenreader`
- `motion`
- `contrast`

RMT bleibt host-neutral. Der XTend Component Adapter konsumiert diese Daten. Boundary: `no-rmt-kernel-import-of-xtend-types`.

## Fabric

Runtime-A11y mappt auf:

- Lane: `a11y`
- Fibers: `a11y.keyboard`, `a11y.focus`, `a11y.announce`, `a11y.preference`
- Diagnostics: `a11y.name.missing`, `a11y.focus.invisible`, `a11y.keyboard.unreachable`, `a11y.aria.invalid`

## Gate

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js runtime-a11y-contract --json
```

Package Script:

```bash
npm run test:runtime-a11y-contract
```

## Handoff

`WP-E11-04` ist Grundlage fuer:

- `WP-E11-05` Component Performance Profiles, weil A11y-Verhalten messbare Focus-, Announcement- und Preference-Kosten hat
- `WP-E11-06` Component Network, weil Forms, Overlays, Router und Feedback gemeinsame A11y-Flows brauchen
- `WP-E11-07` RMT Shell Authoring, weil A11y-Daten deklarierbar sein sollen
- `WP-E11-08` bis `WP-E11-12`, weil Komponentenfamilien echte Runtime-A11y erreichen muessen
- `WP-E11-14` Browsernahe UX- und Kompatibilitaets-Smokes
