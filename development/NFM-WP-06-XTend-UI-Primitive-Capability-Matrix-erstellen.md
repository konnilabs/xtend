# NFM-WP-06 - XTend UI Primitive Capability Matrix erstellen

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Mission Contract: `xtend.native-first.mission-source-of-truth.v1`
- Capability Contract: `xtend.native-first.ui-primitive-capability.v1`
- Matrix Contract: `xtend.native-first.ui-primitive-capability-matrix.v1`
- Contract-Dokument: `development/XTend-Native-First-UI-Primitive-Capability-Contract.md`
- Matrix: `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md`
- Browser Primitive Radar: `xtend.native-first.browser-primitive-radar.v1`
- Component Contract: `xtend.component.contract.v2`
- Component Maturity Model: `xtend.component.maturity-model.v2`
- Dependency Diet Policy: `xtend.native-first.dependency-diet-policy.v1`
- Boundary: `owned-ui-primitive-before-framework-dependency`
- Boundary: `capability-claim-requires-contract-and-gate`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `ui-primitive-capability-matrix-accepted`
- Gate: lokale Referenzpfad-, Supply-Chain- und ASCII-Pruefung

## Ziel

`NFM-WP-06` macht sichtbar, welche UI-Faehigkeiten XTend bereits als eigene Framework-Primitives besitzt und welche fuer Framework-Paritaet ohne externe UI-Framework-Abhaengigkeit fehlen. Das Paket uebersetzt Component Contract v2, Maturity-Modell, Design Tokens, A11y, Performance, RMT Metadata, Fabric-Anbindung, Browser Primitive Radar und Vendor-/Dependency-Grenzen in eine Native-First Capability Matrix.

## Umgesetzt

- `development/XTend-Native-First-UI-Primitive-Capability-Contract.md` angelegt
- Contract `xtend.native-first.ui-primitive-capability.v1` akzeptiert
- `development/XTend-Native-First-UI-Primitive-Capability-Matrix.md` angelegt
- Matrix Contract `xtend.native-first.ui-primitive-capability-matrix.v1` akzeptiert
- Capability-Klassen `owned`, `owned-native-backed`, `owned-vendor-adapter`, `vendor-backed`, `legacy`, `contract-only`, `missing` und `tooling-only` definiert
- 18 Capabilities `NFM-CAP-01` bis `NFM-CAP-18` klassifiziert
- P0/P1/P2-Schnitt fuer Capabilities festgelegt
- Owned-Primitive-Pakete `NFM-OP-01` bis `NFM-OP-07` abgeleitet
- blockierende Luecken fuer Data Display, Native Overlay Evidence, RMT Maximality, Vendor Utilities und State-Hebel dokumentiert
- Handoff an `NFM-WP-07`, `NFM-WP-08`, `NFM-WP-09`, `NFM-WP-10`, `NFM-WP-14`, `NFM-WP-18`, `NFM-WP-19` und `NFM-WP-21` beschrieben

## Lokale Faktenbasis

| Quelle | Ergebnis |
|--------|----------|
| `components/manifest.json` | 45 lokale Component-Eintraege |
| `development/XTend-Component-Catalog-Coverage-Matrix.md` | 42 `enterprise-ready`, 2 `typed-contract-gated`, 1 `contract-gated` |
| `development/XTend-Component-Contract-v2.md` | Component Surface, RMT, Fabric, Telemetry, A11y, Performance, Tests und Docs als Pflichtdomains |
| `development/XTend-Component-Maturity-Modell-v2.md` | Maturity begrenzt Capability-Claims durch niedrigste kritische Pflichtdimension |
| `development/XTend-Native-First-Browser-Primitive-Radar.md` | Radar-Refs fuer DOM, Components, Forms, Layout, Navigation, Animation, Scheduling, Observability, Storage, Security, Network, Media und Accessibility |
| `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md` | Vendor-, Legacy- und accepted residuals fuer Prism, Turndown, Legacy Loader und x-icon |
| `xtend-builder/scaffold.config.js` | etablierte Capability-Gruppen fuer Forms, Feedback, Navigation, Overlays, Layout/Media, Surfaces und RMT Authoring |

## Ergebnis

XTend besitzt bereits eine breite owned UI-Primitive-Basis:

- Web-Component Runtime und Shell
- Theme/Design Tokens/Density
- Controls, Feedback, Forms, Overlays, Navigation, Layout, Media und Surfaces
- RMT Component Authoring und DOM Descriptor Rendering
- State-, Event-, Command-, Scheduler- und Fabric-Hebel

Die wichtigsten Luecken sind nicht "mehr UI-Framework importieren", sondern:

- Data Display und Collection Controls als owned Primitives schneiden
- Native Overlay-/Focus-/Popover-/Anchor-Entscheidungen per Radar/ADR haerten
- RMT UI Maximality quantifizieren
- Vendor Utility Residuals kontrolliert reduzieren
- State/Event/Scheduler-Hebel als Framework-Layer produktisieren

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Component Contract v2 ist angebunden | erfuellt |
| Maturity-Modell ist angebunden | erfuellt |
| Design Tokens, A11y, Performance, RMT Metadata und Fabric-Anbindung sind beruecksichtigt | erfuellt |
| Capability-Klassen Controls, Forms, Overlay, Navigation, Layout, Data Display, Feedback, Media und Surface Runtime sind bewertet | erfuellt |
| Trennung von `owned`, `contract-only`, `legacy`, `vendor-backed` und `missing` ist vorhanden | erfuellt |
| naechste Owned-Primitive-Pakete sind benannt | erfuellt |
| Framework-Claims ohne Contracts werden vermieden | erfuellt |

## Verifikation

`NFM-WP-06` ist ein Dokumentations-, Scope- und Capability-Gate. Es nutzt lokale Manifest-, Component-Catalog-, Radar-, Supply-Chain- und Referenzpfad-Evidence.

Lokale Gates:

```bash
node scripts/run_xtend_tests.js catalog-coverage --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

Ergebnis am 3. Juni 2026:

- `catalog-coverage`: `passed` mit 226 Checks, 0 Failures, 0 Suite-Warnings
- `references`: `passed` mit 2073 Referenzpfad-Checks, 0 Failures, 0 Warnings
- `supply-chain`: `passed` mit 67 Checks, 0 Failures, 0 Warnings
- ASCII-Check fuer WP-06-, Roadmap-, Mission-, Radar-, WP-01-, WP-02-, WP-05- und Replacement-Dateien: sauber

## Handoff

`NFM-WP-06` ist abgeschlossen. Die UI Primitive Capability Matrix und die Owned-Primitive-Pakete sind akzeptiert.

Naechste Folgearbeit:

- `NFM-WP-07` hat `NFM-OP-01` Overlay, Focus, Inert, Keyboard und Surface Stack gehaertet.
- `NFM-WP-08` hat `NFM-OP-02` und `NFM-OP-04` Forms, Navigation, list-like Layout und Media gehaertet.
- `NFM-WP-09` hat `NFM-OP-05` Theme, State, Events, Slots und Scheduler als Framework-Hebel geschnitten.
- `NFM-WP-10` hat `NFM-OP-06` Data Display und Collection Controls sowie Command/Search-Patterns gegen Marktpattern priorisiert.
- `NFM-WP-14` kann RMT UI Primitive Gap Analysis auf die Capability-IDs mappen.
- `NFM-WP-18` kann DOM Descriptor, Trusted DOM und Renderer-Proofs gegen `NFM-CAP-12` und `NFM-CAP-14` priorisieren.
- `NFM-WP-21` kann Vendor-/Legacy-Residuals aus `NFM-OP-07` migrieren oder deprecaten.
