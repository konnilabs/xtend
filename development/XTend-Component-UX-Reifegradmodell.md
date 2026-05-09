# XTend Component UX-Reifegradmodell

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.ux-maturity-model.v1`
- Workpackage: `WP-E11-01`
- Bezug:
  - `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTend-Fabric-Component-Compatibility-v2.md`
  - `docs/component-platform.md`
  - `components/manifest.json`

## Zweck

Dieses Modell definiert die sichtbare UX-Reife von XTend-Komponenten ab Epic 11. Es erweitert `xtend.component.maturity-model.v2` um jene Qualitaeten, die Endnutzer und App-Autoren direkt erleben: Shell, Styling, Runtime-A11y, Performance, Interaktion und Cross-Component-Kompatibilitaet.

Eine Komponente kann technisch `stable` sein und trotzdem UX-Luecken besitzen. Epic 11 schliesst diese Luecke. Eine enterprise-reife XTend-Komponente muss nicht nur rendern, typisiert sein und RMT/Fabric-Metadaten besitzen, sondern in realen UI-Journeys konsistent, barrierearm, performant und vernetzbar funktionieren.

## Reifegrade

| UX-Reife | Bedeutung | Einsatz |
|----------|-----------|---------|
| `ux-unclassified` | keine bewertete UX-Reife | Legacy oder Infrastruktur ohne sichtbare UI |
| `ux-baseline` | Grunddarstellung vorhanden, aber Shell, Styling und A11y nicht vollstaendig gatebar | Bestand, einfache Demos |
| `ux-ready` | definierte Shell, Styling-Oberflaeche, Grund-A11y und bekannte Performance-Erwartungen | kontrollierte App-Integration |
| `ux-stable` | produktive UI-Komponente mit getesteter Shell, Styling API, Runtime-A11y, Performance-Profil und RMT/Fabric-Kompatibilitaet | Enterprise-App-Default |
| `ux-core` | kritische, breit genutzte Komponente mit verschaerften Browser-, Compatibility-, A11y- und Performance-Gates | Forms, Router, Overlays, Shell, Feedback |
| `ux-deprecated` | abgeloeste UX-Oberflaeche mit Migrationspfad | Bestandsschutz |

## Bewertungsdimensionen

| Dimension | Pflichtfrage |
|-----------|--------------|
| Shell | Hat die Komponente definierte Root-, DOM-, Slot-, State-, Focus- und Lifecycle-Regeln? |
| Styling | Sind Tokens, Custom Properties, Parts, Variants, Sizes und Density dokumentiert und stabil? |
| Runtime-A11y | Funktioniert die Komponente mit Keyboard, Fokus, Namen, Rollen, States, Screenreader, Contrast und Reduced Motion? |
| Performance | Gibt es Budgets und Messpunkte fuer Mount, Hydration, Render, Update und Interaktion? |
| Compatibility | Arbeitet die Komponente mit Forms, Router, Overlays, Feedback, Theme, Fabric und RMT zusammen? |
| RMT Authoring | Kann die sichtbare UX ueber RMT beschrieben werden, ohne Kernel-Kopplung zu erzeugen? |
| Fabric | Sind Fehler, Diagnostics, Telemetry, Lanes und Fibers an der UI-Boundary sichtbar? |
| Visual Regression | Sind relevante Themes, Density-Profile, Viewports und States testbar? |
| Docs | Sind Komponentenautoren und App-Autoren ueber UX-API, A11y, Styling und RMT informiert? |

## Mindestanforderungen je Reifegrad

| Dimension | `ux-baseline` | `ux-ready` | `ux-stable` | `ux-core` |
|-----------|---------------|------------|-------------|-----------|
| Shell | sichtbare Darstellung | Shell Contract Stub | vollstaendiger Shell Contract | Shell Contract plus Compatibility Policy |
| Styling | Default CSS | Tokens oder Custom Properties dokumentiert | Tokens, Parts, Variants, Size und Density stabil | Theme Matrix und Breaking-Change-Policy |
| Runtime-A11y | keine harte Garantie | Grundsemantik dokumentiert | Keyboard, Focus, ARIA/Native Semantik und Screenreader-Verhalten getestet | browsernahe A11y-Regression in Kernflows |
| Performance | keine Garantie | Profilklasse bekannt | Budget und Messpunkte vorhanden | Budget in Fast-/Release-Gate relevant |
| Compatibility | isolierte Nutzung | bekannte Integrationspunkte | Events, Commands, Form/Router/Overlay/Fabric/RMT kompatibel | Cross-Component-Journeys gatebar |
| RMT | optional | Component Record vorhanden | Shell, Style, A11y, Events und Commands authorbar | App-/Route-/Shell-Kontext authorbar |
| Fabric | optional | Boundary geplant | Lifecycle, Errors und Telemetry angebunden | Diagnostics, Backpressure und Lanes regression-gatebar |
| Visual | manuelle Sichtung | Fixture vorhanden | Theme/Viewport/State Matrix geplant oder vorhanden | priorisierte visuelle Regression |
| Docs | Basisdoku | API und Slots | UX, Styling, A11y, Events, RMT und Performance | Migration und Enterprise Pattern |

## Pflichtartefakte fuer `ux-stable`

Eine `ux-stable` Komponente benoetigt:

- Component Shell Contract oder akzeptierten Shell-Migrationsvertrag
- dokumentierte Slots, States und Focus-Regeln
- Styling Contract mit Tokens, CSS Custom Properties und CSS Parts
- Variant-, Size- und Density-Regeln, sofern fachlich sinnvoll
- Runtime-A11y-Abnahme fuer Keyboard, Fokus, Semantik und Screenreader-Signale
- Reduced-Motion- und High-Contrast-kompatible Defaults
- Performance-Profil fuer relevante Lifecycle- und Interaction-Phasen
- RMT UX Metadata fuer Shell, Style, A11y, Events und Commands
- Fabric Boundary fuer Lifecycle, Errors, Telemetry, Lanes und Fibers
- Component-Level Suite und Fixture
- Browser- oder Compatibility-Smoke fuer kritische Journeys
- Docs unter `docs/components/` mit UX-, Styling-, A11y-, RMT- und Performance-Abschnitten

## Pflichtartefakte fuer `ux-core`

Eine `ux-core` Komponente erfuellt alle `ux-stable` Anforderungen und zusaetzlich:

- dokumentierte Compatibility Policy
- Cross-Component-Journey im lokalen Gate
- explizite Breaking-Change-Regeln fuer Styling API und Events
- browsernahe A11y-Regression fuer kritische Interaktionen
- Performance-Budget fuer kritische Interaktionspfade
- RMT-first App Authoring Beispiel
- Fabric Diagnostics fuer Fehler- und Backpressure-Faelle
- Visual Regression fuer zentrale States, Themes und Viewports

## P0-Komponentenziele fuer Epic 11

| Familie | Komponenten | UX-Ziel |
|---------|-------------|---------|
| Forms | `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-calendar`, `x-form`, `x-writer` | `ux-core` fuer `x-form`, `ux-stable` fuer Controls |
| Feedback | `x-alert`, `x-toast`, `x-status`, `x-progress`, `x-spinner`, `x-summary` | `ux-stable`, `ux-core` fuer Feedback-Journeys |
| Navigation | `x-router`, `x-link`, `x-tabs`, `x-menu` | `ux-core` fuer `x-router`/`x-link`, `ux-stable` fuer Navigationselemente |
| Overlays | `x-modal`, `x-dialog`, `x-popover`, `x-tooltip`, `x-drawer`, `x-lightbox` | `ux-core` fuer Overlay Stack und Focus, `ux-stable` pro Komponente |
| Layout/Media | `x-section`, `x-cards`, `x-header`, `x-footer`, `x-hero`, `x-type`, `x-code`, `x-masonry`, `x-player` | `ux-ready` bis `ux-stable`, nach Sichtbarkeit priorisiert |
| Infrastructure | `x-theme`, `xstate`, `x-utils` | klare Integrationserwartungen statt UI-Shell-Pflicht |

## Reifegrenzen

Die UX-Reife wird durch die niedrigste kritische Pflichtdimension begrenzt.

Beispiele:

- Eine visuell gute Komponente ohne Keyboard-Pfad ist hoechstens `ux-ready`.
- Eine Komponente ohne definierte Styling API ist hoechstens `ux-ready`.
- Eine Form-Komponente ohne Label-, Error- und Required-Verhalten ist nicht `ux-stable`.
- Eine Overlay-Komponente ohne Focus Trap, Escape und Inert-Strategie ist nicht `ux-stable`.
- Eine Router-Komponente ohne Focus Restore und Route Announcement ist nicht `ux-core`.
- Eine RMT-first-kompatible Komponente ohne Shell-/Style-Metadaten bleibt hoechstens `ux-ready`.

## Abnahmeformat

Perspektivisches maschinenlesbares Ergebnis:

```json
{
  "schema": "xtend.component.ux-maturity-report.v1",
  "tag": "x-select",
  "uxMaturity": "ux-stable",
  "shell": {
    "contract": true,
    "states": ["ready", "disabled", "invalid", "busy"],
    "focus": true,
    "slots": true
  },
  "styling": {
    "tokens": true,
    "parts": true,
    "variants": true,
    "density": true
  },
  "a11y": {
    "keyboard": true,
    "focusVisible": true,
    "screenreader": true,
    "highContrast": true,
    "reducedMotion": true
  },
  "performance": {
    "profile": "form",
    "mountBudget": true,
    "interactionBudget": true
  },
  "compatibility": {
    "form": true,
    "rmt": true,
    "fabric": true,
    "theme": true
  }
}
```

## Startsequenz

`WP-E11-02` bis `WP-E11-06` sind Foundation-Pakete. Sie duerfen nach `WP-E11-01` starten.

Empfohlene Reihenfolge:

1. `WP-E11-02` Component Shell Contract
2. `WP-E11-03` Styling Contract
3. `WP-E11-04` Runtime-A11y Contract
4. `WP-E11-05` Performance Profiles
5. `WP-E11-06` Component Network Contract
6. `WP-E11-07` RMT Shell Authoring als Zusammenfuehrung

Danach beginnt die breite Umsetzung nach Komponentenfamilien.

## Verifikation

Initiale Gates fuer dieses Modell:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
```

Spaetere Workpackages sollen daraus dedizierte Gates ableiten:

- `component-shell-contract`
- `component-styling-contract`
- `runtime-a11y-ux`
- `component-ux-performance`
- `component-network-compatibility`
- `rmt-shell-authoring`
- `component-ux-regression`

## Handoff

Dieses Modell ist Startcontract fuer:

- `WP-E11-02` Component Shell Contract
- `WP-E11-03` Styling-, Token- und CSS-Part-Contract
- `WP-E11-04` Runtime-A11y-Contract
- `WP-E11-05` Component Performance Profiles
- `WP-E11-06` Component Network Contract
- `WP-E11-07` RMT Shell Authoring fuer Component UX
