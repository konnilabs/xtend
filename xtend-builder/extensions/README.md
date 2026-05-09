# XTend-Scaffold Extensions

Dieser Bereich enthaelt ab `WP-E03-11` die vorbereiteten Extension-Point-Contracts fuer Templating, Rendering und Root-Lifecycle.

## Contract

`xtend-builder/extensions/component-extension-points.js` erzeugt einen Dry-Run-Contract mit Schema `xtend.scaffold.component-extension-points.v1`.

Der Contract beschreibt:

- Root-Lifecycle-Hooks wie `beforeHydrate`, `afterHydrate`, `beforeRender`, `afterRender` und `onDisconnect`
- ab Epic 04 / `WP-E04-05` den Root-Handschlag `xtend.rmt.root-handshake.v1` mit Phasen `create`, `mount`, `hydrate`, `activate`, `update`, `unmount` und `diagnostics`
- ab Epic 04 / `WP-E04-06` Host Capabilities ueber `xtend.rmt.host-capabilities.v1` fuer Manifest, `xstate`, Theme, API, Hydration, Router und Diagnostics
- Template-Anschluss ueber adapterbasierte Template-Referenzen
- ab Epic 04 / `WP-E04-04` das Authoring-Modell `xtend.rmt.template-authoring.v1` fuer Template-Refs, Component-Refs, Slots und Event-Command-Bindings
- Rendering-Hints fuer `shadowRoot`, sichtbare Aktivierung und spaetere Schedule Policies
- XTendRMT Bridge-Punkte fuer `xtend.component` und `xtend.xrouter`
- ab Epic 04 / `WP-E04-07` das Binding `xtend.scaffold.rmt-compatibility-binding.v1`, das Typing, Manifest-Plan, Preview-Plan und Extension-Punkte synchron haelt
- ab Epic 04 / `WP-E04-08` den dedizierten Gate `node scripts/run_xtend_tests.js rmt-compatibility --json`
- Grenzen gegen Runtime-Imports, Router-Registrierung und produktive Schreiblogik

## Grenze

Die Extension-Module sind reine Builder-Contracts. Sie duerfen keine RMT Schedules ausfuehren, keine `.rmt` Dateien parsen, keine Routes registrieren und keine Rendering-Runtime bereitstellen. Scheduler-Handshakes bleiben Endpoint-Hints: RMT plant, der XTend Host Adapter fuehrt Root-Lifecycle, Custom-Element-Hydration, Cleanup und Diagnostics aus. Host Capabilities bleiben verhandelbare Adapterdaten; der RMT Kernel darf daraus keine XTend Runtime-Imports oder `window.XTend` Aufrufe ableiten. RMT-Kompatibilitaets-Bindings duerfen nur Dry-Run-Artefakte zusammenfuehren und keine produktive Bridge starten.

Produktive Templating-, Rendering- und Bridge-Entscheidungen bleiben Epic 04 und Epic 05 vorbehalten.
