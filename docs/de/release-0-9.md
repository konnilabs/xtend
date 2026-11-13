# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features befinden sich in Vorbereitung. Die Paketversion bezeichnet den Entwicklungsstand.

## Stand und Abnahme

| Baustein | Stand | Erforderliche Nachweise |
| --- | --- | --- |
| RMT Classic | Umbenennung und gemeinsamer Compilervertrag implementiert | Kompatibilität und Regressionen |
| RMTX | Backend vorbereitet; Syntax und Frontend offen | Parser/Lowering, Editor, gemischte Projekte, Browser/SSR |
| XTensions 2.0 | State/Actions, URL/History, Kernel/Fabric, Provider-Kette und React-/Vue-SSR/Adoption implementiert | Weitere Frameworks, Cross-Framework-Ownership und vollständige 0.9-Abnahme |

[A05](../../development/rmtx-a05/README.md) ergänzt echte Node-SSR und signierten Model-Restore vor Adoption und Intent-Replay für exklusive React-/Vue-Container. Build-API 10; Composition-/Browser-/Host-API 7; SSR-Plan-Runtime v9 und Resume-Registry 3. Bisherige Verträge bleiben erhalten. Die reguläre Komposition verwendet weiterhin Plan-Runtime v8 und Registry 2.4.0; Classic-AST 1.0.0 bleibt unverändert.

## Releaseprüfung

`scripts/release/feature-scope.json` verlangt beide Features. `npm run check:release-preparation` prüft Vertragsdrift, Inventar, Versionen und Plan. `release:features:check` blockiert noch. CI-Kandidaten dürfen offene Features enthalten. Versiegelung und Publish verlangen quellgebundene Feature-Nachweise und Release-Gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Nächste Schritte

[Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md). [Classic-Vertrag](./rmt-classic-contract.md): Compilerbasis. A06 adressiert als Nächstes RMTX-Syntax und DX; weitere Framework- und Ownership-Profile benötigen eigene Nachweise.
