# Public Component Types

- Contract: `xtend.docs.public-component-types.v1`
- Type Contract: `xtend.enterprise.er-wp-34.public-component-types.v1`
- Workpackage: `ER-WP-34`

XTend liefert fuer priorisierte Public Components lokale TypeScript-Declaration-Artefakte neben der jeweiligen Runtime-Source aus. Die Dateien liegen direkt in `components/*.d.ts` und werden ueber den Package-Export `xtend/components/*` erreichbar.

## Lokaler Contract

```text
components/xtend-public-types.d.ts
components/xalert.d.ts
components/xtoast.d.ts
components/xmodal.d.ts
components/xrouter.d.ts
components/xlink.d.ts
components/xinput.d.ts
components/xselect.d.ts
components/xcheckbox.d.ts
components/xradio.d.ts
components/xtextarea.d.ts
components/xstatus.d.ts
components/xprogress.d.ts
components/xtooltip.d.ts
components/xpopover.d.ts
components/xdrawer.d.ts
components/xform.d.ts
components/xtabs.d.ts
components/xdialog.d.ts
components/xlightbox.d.ts
components/xcalendar.d.ts
components/xwriter.d.ts
components/xtheme.d.ts
components/xbutton.d.ts
components/xspinner.d.ts
components/xmenu.d.ts
components/xsummary.d.ts
components/xplayer.d.ts
components/xsection.d.ts
components/xcards.d.ts
components/xheader.d.ts
components/xfooter.d.ts
components/xhero.d.ts
components/xtype.d.ts
components/xcode.d.ts
components/xmasonry.d.ts
components/xstate.d.ts
components/xutils.d.ts
```

Jede Komponenten-Datei beschreibt:

- Public Attribute-Namen
- Public Property- und Methodenflaechen
- Eventnamen
- `CustomEvent` Detail-Payloads
- `HTMLElementTagNameMap` fuer Custom Elements
- typed `addEventListener` Overloads fuer komponentenspezifische Events

`x-theme` ist kein Custom Element, sondern ein Core-Modul. Seine Typen beschreiben deshalb `window.XTend.theme`, `window.XTheme`, A11y-Preference-Snapshots, Motion-/Contrast-Policy, Density, Theme Context, Performance Snapshot, RMT Metadata und die Document-Events `theme-initialized`, `theme-changed`, `theme-variable-changed`, `theme-preference-changed`, `theme-a11y-announcement`, `theme-density-changed`, `theme-context-changed` und `theme-performance-measured`.

## Gate

```bash
node scripts/run_xtend_tests.js components
```

Die Component-Suite enthaelt ab `ER-WP-34` den Sub-Gate `component-public-types`. Nach `WP-SM-04` prueft er die Shared-Type-Helfer, alle 41 priorisierten `.d.ts` Dateien, Eventnamen, Detail-Typen, API-Methoden und Element-/Window-Mappings.

## Coverage-Status

Nach `WP-SM-04` stehen `types` in der Component Catalog Coverage Matrix bei `41/41`. `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-form`, `x-calendar`, `x-writer`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, `x-drawer`, `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog`, `x-alert`, `x-toast`, `x-spinner`, `x-router`, `x-link`, `x-tabs`, `x-theme`, `x-button`, `x-icon`, `x-menu`, `x-footer`, `x-lightbox`, `x-masonry`, `x-code`, `x-header`, `x-hero`, `x-type`, `x-summary`, `x-section`, `x-cards` und `x-player` sind die aktuelle `enterprise-ready` Referenzlinie mit Public Types, Component-Suite, Fixture, A11y und Performance-Profil. `xstate` besitzt Public Types fuer Boundary Contract, RMT State Adapter, Lifecycle Events und Diagnostics. `x-utils` besitzt Public Types fuer Utility Contract, Import Policy, Boundary Snapshot, Template API und das Event `xutils:import-policy-check`.

Es gibt nach `WP-E12-09` keinen verbleibenden Type-Gap. `xstate` bleibt nur noch wegen A11y-/Performance-Boundary-Entscheidungen offen; `x-utils` bleibt wegen der Performance-Boundary-Entscheidung `typed-contract-gated`.
