# WP-E03-09 - Typisierungsstrategie und Template-/RMT-Anschluss vorbereiten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-08-Lokale-Developer-Workflows-und-Verifikation-standardisieren.md`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/lib/cli.js`

## Ziel

`WP-E03-09` standardisiert Typ-Artefakte fuer scaffolded Komponenten und bereitet den spaeteren Template-/XTendRMT-Anschluss vor. Das Paket fuehrt keine Runtime-Bridge ein, sondern schafft einen stabilen, pruefbaren Type- und Adapter-Contract.

## Umgesetzte Artefakte

- Typing-Modul mit Schema `xtend.scaffold.component-typing.v1`
- RMT-Anschluss-Metadaten mit Schema `xtend.scaffold.rmt-attachment.v1`
- CLI-Command:
  - `node xtend-builder/scaffold.js typing --tag x-example --profile display --feature state --json`
- NPM-Script:
  - `npm run scaffold:typing`
- `component-files` Ausgabe mit `wiring.typing`
- erweitertes `.d.ts` Template fuer Event-, Attribute-, Property-, Element- und RMT-Attachment-Typen
- Manifest-Patch-Plan mit `typing` Block
- Scaffold-Dokumentation fuer `xtend-builder/typing/`
- Reference-Gates fuer Typing-Contract, CLI, Config und Template-Ausgabe

## Typisierungsstrategie

| Bereich | Contract |
|---------|----------|
| Artefakt | `components/<tag>.d.ts` |
| Runtime-Grenze | `types-only-no-runtime-imports` |
| Events | Event-Name-Union plus Event-Detail-Interface |
| Attribute | explizite Attribute-Map fuer oeffentliche Attribute |
| Properties | explizite Property-Map statt implizitem `any` |
| Element | HTMLElementTagNameMap-Erweiterung fuer den Custom Element Tag |
| Wiring | Scaffold-Wiring-Interface fuer State-, Event- und API-Signale |

Typfreie Komponenten bleiben nur mit dokumentierter Ausnahme erlaubt. Undokumentierte Typ-Luecken, implizite `any` Public APIs und Runtime-Imports aus `.d.ts` Dateien sind verboten.

## Template- und XTendRMT-Anschluss

Der vorbereitete Anschluss beschreibt nur Adapter- und DSL-Erwartungen:

- Component-Adapter: `xtend.component`
- Router-Adapter: `xtend.xrouter`
- RMT-Domains: `adapters`, `components`, `routes`, `templates`, `schedules`, `actions`, `data`
- RMT-Kernel-Grenze: Der Kernel darf keine XTend-Komponententypen importieren.

Damit bleibt Epic 03 framework-agnostisch genug, um Epic 04 und Epic 05 anzuschliessen, ohne die produktive Bridge im Scaffold vorwegzunehmen.

## Grenze

`WP-E03-09` erzeugt Type-Contracts und RMT-Anschluss-Metadaten im Dry-Run. Es schreibt keine Produktivdateien, erweitert kein `rmt.schema.json`, implementiert keinen XTendRMT Adapter und registriert keine Routes.

## Verifikation

- `node --check xtend-builder/typing/component-types.js`
- `node --check xtend-builder/generators/component-files.js`
- `node --check xtend-builder/lib/cli.js`
- `node xtend-builder/scaffold.js typing --tag x-example --profile display --feature state --json`
- `node xtend-builder/scaffold.js component-files --tag x-example --profile routing --feature state --json`
- `npm run scaffold:typing`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-09` ist abgeschlossen. `XTend-Scaffold` besitzt nun einen maschinenlesbaren Typing-Contract, rendert erweiterte `.d.ts` Artefakte und haelt den XTendRMT-Anschluss als Adapter-Metadaten bereit. `WP-E03-10` kann darauf aufbauend Demo-/Preview- und Referenzpfade an die Test-Suite anbinden.
