# XTend-Scaffold Preview

Dieser Bereich enthaelt ab `WP-E03-10` den Preview- und Referenzpfad-Contract fuer scaffolded Komponenten.

`xtend-builder/preview/component-preview.js` stellt das Schema `xtend.scaffold.component-preview.v1` bereit. Das Modul schreibt keine Dateien und startet keinen Browser. Es erzeugt einen maschinenlesbaren Plan, wie ein scaffolded Component-Preview lokal, dokumentiert und ueber den Reference-Gate pruefbar registriert wird.

```bash
node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json
```

## Contract

Der Preview-Contract umfasst:

- Zielpfad `docs/previews/<name>.preview.md`
- lokale Component-, Docs-, Fixture-, Types- und Manifest-Referenzen
- Registry-Zeile fuer `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- `externalNetworkAllowed: false`
- Verifikationspfade fuer `references`, Component-/Hydration-Gates und `npm test`
- ab Epic 04 / `WP-E04-07` das RMT Compatibility Binding `xtend.scaffold.rmt-compatibility-binding.v1`, damit Preview-Plaene denselben RMT-Vertrag wie Typing, Manifest und Extensions referenzieren
- ab Epic 04 / `WP-E04-08` den dedizierten Gate `node scripts/run_xtend_tests.js rmt-compatibility --json`

## Grenze

`WP-E03-10` erzeugt nur Preview-Plaene. Produktive Schreibpfade, Browser-Automation fuer jeden scaffolded Preview und XTendRMT Bridge-Code bleiben spaeteren Paketen vorbehalten. Das RMT-Kompatibilitaets-Binding ist ebenfalls nur Metadaten- und Review-Contract.

## Component Lab und RMT Inspector

Ab `WP-E10-12` existiert zusaetzlich der Pilot `xtend.epic10.component-lab-rmt-inspector.v1`.

`xtend-builder/preview/component-lab.js` erzeugt einen lokalen Shell-first Plan fuer:

- neun `enterprise-ready` Preview Targets aus der ersten Epic-10-Komponentenwelle
- RMT Inspector Domains `manifest`, `adapters`, `components`, `routes`, `schedules`, `templates` und `diagnostics`
- Telemetry Panel fuer `snapshot.componentTelemetry`
- A11y-, Performance- und Source-Link-Panels
- RMT Fixture `tests/fixtures/rmt-component-lab-pilot.rmt`

Der Pilot bleibt lokal und host-neutral. Der RMT-Kernel importiert keine XTend-Komponenten oder XTend-Typen.

```bash
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
```

## Component Lab UX Inspector

Ab `WP-E11-13` existiert die Epic-11-Erweiterung `xtend.epic11.component-lab-ux-inspector.v1`.

`xtend-builder/preview/component-lab-ux-inspector.js` erzeugt einen Shell-first Plan fuer die sichtbare UX-Reifematrix:

- 31 `enterprise-ready` Preview Targets
- fuenf UX-Familien: Form Controls, Feedback/Status, Navigation/Routing, Overlay/Interaction und Layout/Display/Media
- Panels fuer Family Matrix, Component Preview, RMT, State, Styling, A11y, Performance, Component Network, Telemetry und Source Links
- Inspector-Domains `shell`, `style`, `a11y`, `performance`, `state`, `componentNetwork`, `rmtAuthoring`, `fabricTelemetry`, `diagnostics` und `sourceLinks`
- RMT Fixture `tests/fixtures/rmt-component-lab-ux-inspector.rmt`

Der UX Inspector ersetzt den Epic-10-Pilot nicht; er setzt als breitere Produktreife-Schicht daneben an.

```bash
node scripts/run_xtend_tests.js component-lab-ux-inspector --json
```
