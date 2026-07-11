# WP-E11-01 - Epic-11-Backlog und UX-Reifegradmodell anlegen

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Backlog: `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Contract: `xtend.epic11.wp01.backlog-and-ux-maturity.v1`
- Bezug:
  - `development/XTend-Component-UX-Reifegradmodell.md`
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTend-Fabric-Component-Compatibility-v2.md`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`
  - `development/docs-evidence/root/component-platform.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E11-01` macht Epic 11 operativ startbar. Das Paket zerlegt den Epic in konkrete Workpackages und legt ein UX-Reifegradmodell fest, das als gemeinsame Abnahmebasis fuer Component Shells, Styling, Runtime-A11y, Performance, Component Networking und RMT Shell Authoring dient.

Das Paket erzeugt bewusst noch keine neue UI-Implementierung. Es verhindert, dass die naechste UX-Welle als Sammlung uneinheitlicher Einzelkorrekturen startet.

## Ausgangslage

Epic 10 hat die technische Component Platform abgeschlossen:

- TypeScript-first Source und lokales ESM sind etabliert.
- Component Contract v2, RMT-first App Authoring, Fabric/Lane Ingestion und Lifecycle Telemetry sind vorhanden.
- P0/P1-Komponenten besitzen erste TypeScript-, RMT-, Fabric- und Testabdeckung.
- Browser-, A11y-, Performance-, Visual- und Reference-Gates existieren.
- Epic 10 Release Handoff markiert die Plattform als fachlich abnahmefaehig.

Die offene Produktluecke liegt nun in der sichtbaren Enterprise-Experience:

- Shell-Verhalten ist noch nicht ueber alle Komponentenfamilien standardisiert.
- Styling ist noch nicht konsequent als Public API modelliert.
- A11y muss staerker als echtes Runtime-Verhalten nachgewiesen werden.
- Performance-Budgets muessen auf UI-Shells und Interaktionen erweitert werden.
- Komponenten muessen in Forms, Overlays, Routing, Feedback und Theme-Kontexten als Netzwerk funktionieren.

## Backlog-Entscheidung

Epic 11 wird in 18 Workpackages zerlegt.

Die Startlogik lautet:

- `WP-E11-02` bis `WP-E11-06` sind Foundation-Pakete und duerfen nach `WP-E11-01` starten.
- `WP-E11-07` fuehrt diese Foundation-Contracts in RMT Shell Authoring zusammen.
- `WP-E11-08` bis `WP-E11-12` setzen die Komponentengruppen um.
- `WP-E11-13` bis `WP-E11-15` bauen Inspector, Browser-Smokes und Visual-Gates aus.
- `WP-E11-16` bis `WP-E11-18` finalisieren Docs, Long-Tail-Planung und Handoff.

Damit bleibt der Epic phasenfaehig:

| Phase | Zweck |
|-------|-------|
| WS0 | Backlog und UX-Reifegradmodell |
| WS1 | Shell und Styling API |
| WS2 | Runtime-A11y |
| WS3 | Performance-by-design |
| WS4 | Component Network Compatibility |
| WS5 | RMT Shell Authoring |
| WS6 | Komponentenfamilien |
| WS7 | Component Lab UX Inspector |
| WS8 | Browser-, Visual- und UX-Gates |
| WS9 | Docs und Authoring Guides |
| WS10 | Legacy Long-Tail |
| WS11 | Abschlussreview und Handoff |

## UX-Reifegrad-Entscheidung

Das neue Modell `xtend.component.ux-maturity-model.v1` wird akzeptiert.

Die UX-Reifegrade sind:

- `ux-unclassified`
- `ux-baseline`
- `ux-ready`
- `ux-stable`
- `ux-core`
- `ux-deprecated`

Wichtige Entscheidung:

Eine Komponente ist ab Epic 11 nicht mehr allein dadurch enterprise-reif, dass sie TypeScript, Types, RMT Metadata, Fabric und Tests besitzt. `ux-stable` setzt zusaetzlich eine sichtbare Shell, stabile Styling API, echte Runtime-A11y, Performance-Profile, RMT Shell Authoring, Fabric Boundary und relevante Compatibility-Smokes voraus.

`ux-core` verschaerft diese Anforderungen fuer Forms, Router, Overlays, Feedback und andere breit genutzte Shell-/Interaction-Pfade.

## Startbare Folgepakete

### WP-E11-02

`WP-E11-02` darf sofort starten und spezifiziert den Component Shell Contract `xtend.component.shell.v1`.

### WP-E11-03

`WP-E11-03` darf sofort starten und definiert Styling, Tokens, CSS Custom Properties, CSS Parts, Variants, Size und Density als Public API.

### WP-E11-04

`WP-E11-04` darf sofort starten und haertet echte Runtime-A11y fuer Keyboard, Focus, Screenreader, ARIA, High Contrast und Reduced Motion.

### WP-E11-05

`WP-E11-05` darf sofort starten und erweitert Performance-Profile fuer Shell, Hydration, Interaction, Overlay, Form Groups und Route-nahe UI.

### WP-E11-06

`WP-E11-06` darf sofort starten und definiert Component Network Compatibility fuer Forms, Overlays, Router, Feedback, Theme, Fabric und RMT.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Backlog liegt vor | erfuellt: `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md` |
| UX-Reifegradmodell liegt vor | erfuellt: `development/XTend-Component-UX-Reifegradmodell.md` |
| Workpackages sind priorisiert | erfuellt: `WP-E11-01` bis `WP-E11-18` mit P0/P1/P2 |
| naechste Pakete sind startbar | erfuellt: `WP-E11-02` bis `WP-E11-06` |
| RMT/Fabric/A11y/Performance/Compatibility-Grenzen sind sichtbar | erfuellt |
| keine RMT-Kernelkopplung an XTend | erfuellt: RMT Shell Authoring bleibt Adapter-/Metadata-Pfad |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E11-01` ist abgeschlossen. Epic 11 besitzt ein startbares Backlog, ein akzeptiertes UX-Reifegradmodell und eine klare Folge-Sequenz fuer Component Shell, Styling API, Runtime-A11y, Performance Profiles und Component Network Compatibility.
