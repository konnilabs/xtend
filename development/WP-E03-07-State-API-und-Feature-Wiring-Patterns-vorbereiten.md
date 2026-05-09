# WP-E03-07 - State-, API- und Feature-Wiring-Patterns vorbereiten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-06-Manifest-und-Hydrations-Wiring-in-den-Scaffold-Workflow-integrieren.md`
  - `development/XTend-Architecture-Gate-Regeln.md`
  - `docs/api.md`
  - `docs/components/xstate.md`
  - `xtend-builder/wiring/features.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/templates/component/source.template.js`
  - `xtend-builder/templates/component/docs.template.md`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/templates/component/manifest-plan.template.json`

## Ziel

`WP-E03-07` bereitet haeufige XTend-Integrationen als Scaffold-Patterns vor. Das Paket fuehrt keinen produktiven Runtime-Code ein, sondern macht State-, Event- und API-Anbindung profilbasiert, maschinenlesbar und reviewbar.

## Umgesetzte Artefakte

- Feature-Wiring-Modul mit Schema `xtend.scaffold.feature-wiring.v1`
- Profilregeln fuer `display`, `interactive`, `stateful`, `feedback`, `overlay`, `routing`, `theme`, `form` und `media`
- `component-files` Ausgabe mit `wiring.features`
- Komponenten-Template mit statischer `xtendScaffoldWiring` Metadata
- Doku-Template mit State-, Event-, API- und Review-Regel-Tabellen
- Type-Template mit Event-Name-, Event-Detail- und Scaffold-Wiring-Typen
- Manifest-Patch-Plan mit `featureWiring`
- Reference-Gates gegen Legacy-State-Fassaden, neue globale Helper und nichtkanonische State-Ausgaben

## State-Contract

| Bereich | Contract |
|---------|----------|
| Prefix | `xtend.component.<tag>.<id>.` |
| Lesen | `xstate.get(key)` |
| Schreiben | `xstate.set(key, value)` |
| Subscription | `xstate.subscribe(fn, keyFilter?)` |
| Verboten | `xstate.on`, `xstate.off` |
| Lokale UI-Felder | `derived-render-cache-only` |

Profiluebergreifende Core-Keys wie `xtend.router.*` und `xtend.theme.*` bleiben erlaubt, wenn das Profil `routing` oder `theme` dies verlangt.

## Event- und API-Contract

Custom Events folgen dem Muster `<domain>-<action>` und muessen `bubbles: true` sowie `composed: true` verwenden, sobald sie produktiv implementiert werden.

API-Hinweise bevorzugen `window.XTend.*`. Neue unnamespaced Helper wie `window.showXExample` sind im Scaffold-Contract ausdruecklich verboten.

## Profilsteuerung

Feature-Wiring bleibt profilgesteuert:

- `stateful` erzeugt kanonische Component-State-Keys und `changed` Event-Pattern.
- `feedback` bereitet `shown` und `dismissed` plus `window.XTend.alert` / `window.XTend.toast` vor.
- `overlay` bereitet `open` State, `opened` / `closed` Events und Overlay-API-Namespace-Hinweise vor.
- `routing` nutzt `xtend.router.*` und Router-Events.
- `theme` nutzt `xtend.theme.*`, `theme-changed` und `window.XTend.theme`.

## Grenze

`WP-E03-07` erzeugt Patterns und Metadata. Es schreibt keine Produktivdateien, registriert keine API und fuehrt keine Runtime-Feature-Implementierung ein. Die eigentliche Generate-/Verify-Ergonomie folgt in `WP-E03-08`.

## Verifikation

- `node --check xtend-builder/wiring/features.js`
- `node --check xtend-builder/generators/component-files.js`
- `node xtend-builder/scaffold.js component-files --tag x-example --profile stateful --feature events --json`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-07` ist abgeschlossen. `XTend-Scaffold` kann nun State-, Event- und API-Wiring als profilbasierte Dry-Run-Patterns ausgeben und schuetzt den Output gegen Legacy-State-Fassaden, lokale UI-Wahrheiten und neue globale Helper. `WP-E03-08` kann darauf aufbauend lokale Developer-Workflows und Verifikation standardisieren.
