# XTend-Scaffold Wiring

Dieser Bereich enthaelt ab `WP-E03-06` die repo-lokalen Wiring-Contracts fuer Manifest und Hydration.

## Manifest-Wiring

`xtend-builder/wiring/manifest.js` erzeugt einen deterministischen Patch-Plan mit Schema `xtend.scaffold.manifest-wiring.v1`.

Der Patch-Plan bleibt in Epic 03 dry-run-first:

- Ziel ist `components/manifest.json`
- Quellen werden als repo-relative Pfade wie `components/x-example.js` ausgegeben
- `localImportOnly` ist `true`
- `cdnAllowed` ist `false`
- produktive Manifest-Schreiblogik bleibt einem spaeteren Workpackage vorbehalten

## Hydration-Wiring

`xtend-builder/wiring/hydration.js` erzeugt den Mindestcontract mit Schema `xtend.scaffold.hydration-wiring.v1`.

Der Contract verlangt:

- `connectedCallback`
- `attributeChangedCallback`
- `disconnectedCallback`
- einen expliziten `hydrate()`-Pfad
- ein Fixture-Ergebnisobjekt mit `defined`, `hasElement`, `hasShadowRoot` und `hydrated`

## Feature-Wiring

`xtend-builder/wiring/features.js` erzeugt profilbasierte State-, Event- und API-Patterns mit Schema `xtend.scaffold.feature-wiring.v1`.

Der Contract verlangt:

- kanonische State-Keys unter `xtend.component.<tag>.<id>.` oder bestehenden Core-Namespaces wie `xtend.router.*`
- `xtendState.subscribe(fn, keyFilter?)` als kanonischen Subscription-Pfad
- `xtendState.set(key, value)` als Schreibpfad
- Custom Events mit lesbaren `<domain>-<action>` Namen
- bevorzugte API-Hinweise unter `window.XTend.*`
- keine direkten `xtendState.on/off` Aufrufe in generierten Patterns
- keine neuen unnamespaced `window.show*` Helper
- lokale UI-Felder nur als abgeleitete Render-Caches

## Grenze

Die Wiring-Module sind reine Builder-Contracts. Sie duerfen keine Runtime registrieren, keine Produktivdateien schreiben und keine externen Quellen laden.
