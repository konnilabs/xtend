# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features befinden sich in Vorbereitung. Die Paketversion bezeichnet den Entwicklungszweig, keine abgeschlossene Feature-Abnahme.

## Stand und Abnahme

| Baustein | Stand | Erforderliche Nachweise |
| --- | --- | --- |
| RMT Classic | Umbenennung und gemeinsamer Compilervertrag implementiert | Kompatibilität und Regressionen |
| RMTX | Backend vorbereitet; Syntax und Frontend offen | Parser/Lowering, Editor, gemischte Projekte, Browser/SSR |
| XTensions 2.0 | Instanz-/State-/Action-Anbindung und bedingte Hosts implementiert | Wiederholte Hosts, URL/History, kooperative Kernel-Jobs, automatische Adapter-/Provider-/Host-Kette und SSR/Resume bleiben offen |

A02.3 ergänzt bedingte Host-Lebensdauern. Aktuell: Sidecar v2, Maraca-Plan/-Konfiguration v3, Runtime v5, Browser-/Compiler-API 3.0.0, Host-API 2.0.0. Der Classic-AST bleibt 1.0.0. [Vertrag und Nachweise](../../development/rmtx-a02/README.md).

## Releaseprüfung

`scripts/release/feature-scope.json` verlangt beide Features. `npm run check:release-preparation` prüft in PR-, Push- und Nightly-Gates Vertragsdrift, Inventar, Paketversionen und Plan. `release:features:check` blockiert derzeit erwartungsgemäß. CI-Kandidaten dürfen offene Features enthalten. Versiegelung und Publish verlangen quellgebundene Feature-Nachweise und die bestehenden Release-Gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Nächste Schritte

Die nächsten Schritte und Grenzen beschreibt die [Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md). Der [Classic-Vertrag](./rmt-classic-contract.md) ist die gemeinsame Compilerbasis. RMTX-Syntax und weitere Adapterfähigkeiten sind offen.
