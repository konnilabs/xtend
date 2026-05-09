# WP-E04-10 - Migrations- und Framework-Agnostik-Leitplanken dokumentieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
- Backlog: `development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md`
- Bezug:
  - `development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md`
  - `development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md`
  - `development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `docs/core-migration-guide.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E04-10` sichert die Einfuehrung von RMT-Templating ohne Bruch bestehender XTend- oder Fremd-Apps ab. Der WP-09-Pilot zeigt den Zielpfad; WP-10 beschreibt nun die Leitplanken fuer Migration, Opt-in, Parallelbetrieb und Reviews.

## Umgesetzte Artefakte

- neuer Compatibility-Guide `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
- erweiterter `docs/core-migration-guide.md` mit RMT-Templating-Opt-in-Regeln
- erweiterte `development/ADR-XTendRMT-First-Class-Fusion.md` mit Migrations- und Parallelbetriebsleitplanken
- erweiterte `development/XTend-Core-Compliance-Checklist.md` mit RMT-/Framework-Agnostik-Reviewkriterien
- Reference-Gate-Anschluss fuer WP-10, Guide, ADR, Compliance und Core Migration Guide

## Leitentscheidung

RMT-Templating ist additiv und opt-in.

| Frage | Entscheidung |
|-------|--------------|
| Bestehende XTend Apps | bleiben stabil und muessen nicht auf RMT migriert werden |
| RMT-Aktivierung | pro App, Root, Template, Component, Scheduler Endpoint oder Adapter bewusst opt-in |
| XTend First-Class Support | ueber Adapterdaten und Host Capabilities, nicht ueber Kernel-Sonderfaelle |
| Parallelbetrieb | React, Vue, Vanilla JS und Custom Hosts bleiben gleichberechtigte Host-Kandidaten |
| Bridge Runtime | bleibt `reserved-for-Epic-05` |

## Review-Checkliste

Ein RMT-kompatibler XTend-Change darf erst als migrationssicher gelten, wenn:

- bestehende XTend-Call-Sites unveraendert lauffaehig bleiben
- RMT-Dokumente keine XTend Runtime importieren
- `kernelVisible: false` fuer XTend-spezifische Adapterdaten erhalten bleibt
- XRouter nur ueber Adapter-Records vorbereitet wird
- kein React-, Vue-, Vanilla- oder Custom-Host ausgeschlossen wird
- Scheduler-Endpoints explizit benannt sind
- keine unnamespaced Global Helpers neu eingefuehrt werden
- `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` laufen

## Dokumentierte Migrationspfade

| Ausgangslage | Migrationspfad |
|--------------|----------------|
| XTend-only | RMT bleibt optional; neue Roots koennen schrittweise `.rmt` pilotieren |
| XTend + XRouter | Route-Records vorbereiten, produktive Adapterausfuehrung in Epic 05 |
| XTend neben React/Vue | RMT zuerst als Scheduler oder Template-Transport nutzen, Host Adapter trennen |
| Vanilla/Custom | eigene Scheduler-Endpoints und Capabilities deklarieren |
| Legacy-Demo | klassifizieren, nicht stillschweigend zum Produktcontract machen |

## Ergebnis fuer WP-11

`WP-E04-11` kann den upstream-Handoff ohne offene Migrationsfrage erstellen:

- RMT bleibt framework-agnostisch.
- XTend UI bleibt First-Class Host.
- Migration ist opt-in und additiv.
- Produktive Bridge, native Routes und XRouter-Ausfuehrung bleiben Epic 05.

## Lokaler Testpfad

```bash
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
npm test
```

## Ergebnis

`WP-E04-10` ist abgeschlossen. Die Migrations- und Framework-Agnostik-Leitplanken sind dokumentiert, in Core Migration Guide, ADR und Compliance-Checklist verankert und im Reference-Gate pruefbar. `WP-E04-11` kann nun die upstream-Handoff-Spezifikation vorbereiten.
