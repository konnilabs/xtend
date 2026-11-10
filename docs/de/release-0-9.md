# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features befinden sich in Vorbereitung. Die Paketversion bezeichnet den Entwicklungsstand.

## Stand und Abnahme

| Baustein | Stand | Erforderliche Nachweise |
| --- | --- | --- |
| RMT Classic | Umbenennung und gemeinsamer Compilervertrag implementiert | Kompatibilität und Regressionen |
| RMTX | Backend vorbereitet; Syntax und Frontend offen | Parser/Lowering, Editor, gemischte Projekte, Browser/SSR |
| XTensions 2.0 | State/Actions, bedingte/wiederholte Hosts und URL/History; Kernel-Adapter begonnen | Kernel-Anbindung vertiefen; Provider-/Host-Kette und SSR/Resume offen |

A03.4 ergänzt Fähigkeitsverhandlung (Host-API 6.0.0) über Kernel/Fabric. [Vertrag und Nachweise](../../development/rmtx-a03/README.md). Registry 2.4.0; Maraca v7; Browser-API 5.0.0; Classic-AST 1.0.0.

## Releaseprüfung

`scripts/release/feature-scope.json` verlangt beide Features. `npm run check:release-preparation` prüft Vertragsdrift, Inventar, Versionen und Plan. `release:features:check` blockiert noch. CI-Kandidaten dürfen offene Features enthalten. Versiegelung und Publish verlangen quellgebundene Feature-Nachweise und Release-Gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Nächste Schritte

[Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md). [Classic-Vertrag](./rmt-classic-contract.md): Compilerbasis. Syntax und Adapterfähigkeiten sind offen.
