# RMT vNext Enterprise MFE Vertrag

Dieser Vertrag schließt den Enterprise-MFE-Pfad für RMT vNext ab. Er verbindet Remote Surface Manifeste, Enterprise Surface Registry, Degradation, Remote Security, Cross-Surface Events, Remote Tooling und die offline prüfbare Browser-Smoke-Fixture.

## Status und Schema

Der stabile Vertrag ist `xtend.rmt.vnext-enterprise-release-handoff.v1`. Die Matrix nutzt `xtend.rmt.vnext-enterprise-release-gate-matrix.v1`; der Report nutzt `xtend.rmt.vnext-enterprise-release-handoff-report.v1`. Der Zielzustand ist `rmt-vnext-enterprise-mfe-ready`.

Der lokale Abschluss-Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Dieser Befehl prüft nicht nur Textanker. Er erstellt auch den Enterprise-Report, validiert Fixture, Core Output und Browser-Smoke und stellt sicher, dass die Release-Gate-Matrix in `package.json` auffindbar bleibt.

## Release Assets

Die Release-Artefakte sind:

- `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`
- `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json`
- `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html`
- `tests/rmt-language/fixtures/vnext-enterprise-mfe-fixture-matrix.json`

Die Browser-Smoke-Datei ist absichtlich offline. Sie darf keine Netzwerkaufrufe und keine dynamischen Imports benoetigen, damit CI und lokale Reviews dieselbe Evidence sehen.

## Gate matrix

```bash
npm run test:rmt-vnext-remote-manifest
npm run test:rmt-vnext-enterprise-registry
npm run test:rmt-vnext-degradation
npm run test:rmt-vnext-remote-security
npm run test:rmt-vnext-cross-surface-events
npm run test:rmt-vnext-event-governance
npm run test:rmt-vnext-remote-compiler
npm run test:rmt-vnext-remote-tooling
npm run test:rmt-vnext-remote-compatibility
npm run test:rmt-vnext-enterprise-fixtures
npm run test:rmt-vnext-enterprise-release
npm run test:browser
npm run test:references
```

Ein einzelner Artikel- oder Menüwechsel muss nicht jedes Einzelgate separat starten, aber `node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json` muss gruen bleiben, weil er die Matrix und die Doku-Anker zusammenzieht.

## Betriebsgrenzen

Der Vertrag akzeptiert drei harte Grenzen:

- `no-remote-runtime-execution-in-rmt-kernel`
- `no-implicit-global-event-bus`
- `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`

Diese Grenzen verhindern, dass ein Remote-MFE-Konzept unbemerkt zur unkontrollierten Runtime-Ladung wird. Der Kernel kennt Surface Records, Policies und Telemetrie, aber nicht den produktiven Loader eines Fremdbundles.

## Accepted Residuals

Akzeptierte Folgearbeiten sind produktive Remote Runtime Loader, netzwerkgestuetzte MFE-End-to-End-Gates und host-spezifische Loader-Distribution. Sie blockieren `rmt-vnext-enterprise-mfe-ready` nicht, weil der aktuelle Vertrag nur den lokalen Sprach-, Registry- und Evidence-Layer freigibt.

## Spezifische Fehlerbilder

- Fehlendes Vertragsdokument: `docs/menu.json` und beide Locale-Dateien prüfen.
- Offline-Smoke ruft `fetch(` auf: Browser-Fixture wieder auf lokale Daten umstellen.
- Core Output driftet: `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json` mit Quelle und Fixture Matrix aktualisieren.
- Release-Gate fehlt in `package.json`: `xtend.releaseGates`, `xtend.rmtVNextEnterpriseReleaseHandoff.releaseGateMatrix` und diesen Vertrag gemeinsam prüfen.
