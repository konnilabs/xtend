# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features befinden sich in Vorbereitung. Die Paketversion bezeichnet den Entwicklungszweig, keine abgeschlossene Feature-Abnahme.

## Stand und Abnahme

| Baustein | Stand | Erforderliche Nachweise |
| --- | --- | --- |
| RMT Classic | Umbenennung und gemeinsamer Compilervertrag implementiert | Kompatibilität und Regressionen |
| RMTX | Backend vorbereitet; Syntax und Frontend offen | Parser/Lowering, Editor, gemischte Projekte, Browser/SSR |
| XTensions 2.0 | Instanz-/State-/Action-Anbindung sowie bedingte und wiederholte Hosts implementiert | Kernel-Jobs, automatische Provider-/Host-Kette und SSR/Resume offen |

A02.5.2 verbindet den [URL-/History-Vertrag](../../development/rmtx-a02/url-history/README.md) mit Router und Maraca. Versionen: URL-API 1.0.0, Runtime v7, Browser-API 5.0.0. Bindung v2, Sidecar v3, Maraca-Plan v4, Compiler 4.0.0 und Classic-AST 1.0.0 bleiben gültig.

## Releaseprüfung

`scripts/release/feature-scope.json` verlangt beide Features. `npm run check:release-preparation` prüft in PR-, Push- und Nightly-Gates Vertragsdrift, Inventar, Paketversionen und Plan. `release:features:check` blockiert derzeit erwartungsgemäß. CI-Kandidaten dürfen offene Features enthalten. Versiegelung und Publish verlangen quellgebundene Feature-Nachweise und die bestehenden Release-Gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Nächste Schritte

Schritte und Grenzen: [Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md). [Classic-Vertrag](./rmt-classic-contract.md): gemeinsame Compilerbasis. RMTX-Syntax und weitere Adapterfähigkeiten sind offen.
