# WP-E10-08 - P0-Komponentenwelle priorisieren und Contracts anlegen

- Status: `completed`
- Prioritaet: `P1`
- Epic: `EPIC-10`
- Workstream: `WS4`
- Contract: `xtend.epic10.wp08.p0-component-wave.v1`
- Primaerartefakt: `development/XTend-P0-Komponentenwelle-und-Contract-Stubs.md`
- Maschinenlesbarer Contract: `catalog/epic10-p0-component-wave.js`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic10-p0-component-wave --json`

## Ziel

WP-E10-08 legt die erste P0-Komponentenwelle fuer die TypeScript-, RMT- und Fabric-faehige Component Platform fest. Das Paket implementiert die Komponenten noch nicht, sondern erzeugt die fachliche und technische Schnittlinie fuer `WP-E10-09`, `WP-E10-10` und `WP-E10-11`.

## Durchgefuehrte Arbeit

- bestehende Catalog-Prioritaeten gegen Enterprise-Blind-Spots abgeglichen
- Form-, Feedback- und Overlay-Luecken als erste P0-Welle geschnitten
- neun Komponenten in eine deterministische Implementierungsreihenfolge gebracht
- Contract-Stubs fuer `xtend.component.contract.v2`, RMT, Fabric, Telemetry, Lanes, A11y und Performance angelegt
- Package-, Scaffold- und Reference-Metadaten vorbereitet
- dedizierten Gate `epic10-p0-component-wave` eingehangen

## Ergebnis

Die P0-Welle lautet:

1. `x-select`
2. `x-checkbox`
3. `x-radio`
4. `x-textarea`
5. `x-status`
6. `x-progress`
7. `x-tooltip`
8. `x-popover`
9. `x-drawer`

`WP-E10-09` uebernimmt `x-select`, `x-checkbox` und `x-radio`.

`WP-E10-10` uebernimmt `x-textarea`, `x-status` und `x-progress`.

`WP-E10-11` uebernimmt `x-tooltip`, `x-popover` und `x-drawer`.

## Abnahme

- `catalog/epic10-p0-component-wave.js` erzeugt `xtend.epic10.p0-component-wave.v1`
- alle Stubs sind `ts-planned` und zielen auf `stable`
- alle Stubs nutzen `xtend.component` und halten `no-rmt-kernel-import-of-xtend-types`
- alle Stubs verlangen `ts-source`, `ts-contract`, `ts-rmt`, `ts-a11y`, `ts-performance` und `ts-fixture`
- `docs/component-platform.md` dokumentiert die Welle fuer Komponentenautoren
- `WP-E10-09` ist nach Abschluss dieses Pakets `ready`

## Verifikation

```bash
node scripts/run_xtend_tests.js epic10-p0-component-wave --json
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

Der naechste operative Schritt ist `WP-E10-09`: `x-select`, `x-checkbox` und `x-radio` TypeScript-first implementieren.

