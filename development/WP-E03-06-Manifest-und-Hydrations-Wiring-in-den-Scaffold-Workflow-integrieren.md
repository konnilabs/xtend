# WP-E03-06 - Manifest- und Hydrations-Wiring in den Scaffold-Workflow integrieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-05-Pflichtartefakt-Generatoren-fuer-Komponente-Doku-Tests-Fixtures-und-Types-umsetzen.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/wiring/manifest.js`
  - `xtend-builder/wiring/hydration.js`
  - `xtend-builder/wiring/README.md`
  - `xtend-builder/templates/component/source.template.js`
  - `xtend-builder/templates/component/fixture.template.html`
  - `xtend-builder/templates/component/manifest-plan.template.json`

## Ziel

`WP-E03-06` bindet scaffolded Komponenten systemkonform an Manifest und Hydration an. Das Paket bleibt bewusst dry-run-first, macht aber Manifest-Patchplan, lokale Importregel und Hydration-Mindestcontract maschinenlesbar und in Templates sichtbar.

## Umgesetzte Artefakte

- Manifest-Wiring-Modul mit Schema `xtend.scaffold.manifest-wiring.v1`
- Hydration-Wiring-Modul mit Schema `xtend.scaffold.hydration-wiring.v1`
- `component-files` Ausgabe mit `wiring.manifest` und `wiring.hydration`
- Manifest-Patch-Plan mit `importMode`, `loaderMode`, `hydrationMode`, `localImportOnly` und `cdnAllowed`
- Komponenten-Template mit `hydrate()`, `connectedCallback`, `attributeChangedCallback`, `disconnectedCallback` und `data-xtend-hydrated`
- Fixture-Template mit repo-lokalem Scriptpfad und Hydration-Ergebnisobjekt
- Dokumentierte Wiring-Grenzen unter `xtend-builder/wiring/README.md`
- Reference-Gates fuer Manifest-, Import- und Hydration-Ausgabe

## Lokaler Entry Point

```bash
node xtend-builder/scaffold.js component-files --tag x-example --profile display --json
```

Der Befehl gibt weiterhin nur Dry-Run-Daten aus. Neben `files` enthaelt die Ausgabe nun `wiring.manifest` und `wiring.hydration`.

## Manifest-Contract

| Feld | Wert |
|------|------|
| Schema | `xtend.scaffold.manifest-wiring.v1` |
| Patch-Plan | `xtend.scaffold.manifest-patch-plan.v1` |
| Ziel | `components/manifest.json` |
| Quelle | `components/<tag>.js` |
| Importmodus | `repo-local` |
| Loader | `custom-element` |
| Hydration | `custom-element` |
| CDN | `cdnAllowed: false` |

Produktive Manifest-Schreiblogik ist weiterhin nicht Teil dieses Pakets.

## Hydration-Contract

| Bereich | Mindestanforderung |
|---------|--------------------|
| Lifecycle | `connectedCallback`, `attributeChangedCallback`, `disconnectedCallback` |
| Methoden | `hydrate`, `render` |
| Marker | `data-xtend-hydrated` |
| Fixture | `window.__<ClassName>FixtureResult` |
| Import | `../../../components/<tag>.js` |

Der Rehydration-Pfad laeuft ueber `attributeChangedCallback` und fuehrt wieder durch `hydrate()`.

## Grenze

`WP-E03-06` fuehrt keine Runtime ein, schreibt keine Produktivdateien und laedt keine externen Quellen. Das Wiring ist ein Builder-Contract fuer die spaetere produktive Generate-/Verify-Stufe.

## Verifikation

- `node --check xtend-builder/wiring/manifest.js`
- `node --check xtend-builder/wiring/hydration.js`
- `node --check xtend-builder/generators/component-files.js`
- `node xtend-builder/scaffold.js component-files --tag x-example --profile display --json`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-06` ist abgeschlossen. `XTend-Scaffold` erzeugt nun reproduzierbares Manifest-Wiring, erzwingt repo-lokale Imports im Scaffold-Output und macht den Hydration-Mindestcontract in Generatorausgabe, Templates und Tests sichtbar. `WP-E03-07` kann darauf aufbauend State-, API- und Feature-Wiring-Patterns vorbereiten.
