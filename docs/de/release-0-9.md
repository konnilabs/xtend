# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features befinden sich in Vorbereitung. Die Paketversion bezeichnet den Entwicklungsstand.

## Stand und Abnahme

| Baustein | Stand | Erforderliche Nachweise |
| --- | --- | --- |
| RMT Classic | Umbenennung und gemeinsamer Compilervertrag implementiert | Kompatibilität und Regressionen |
| RMTX | A06.2-v1-Default und opt-in A06.3.1-Selektorprofil v2 implementiert | Weitere Operatoren/Ausdrücke, native UI, semantischer Editor, gemischte Projekte und vollständige Browser-/SSR-Abnahme |
| XTensions 2.0 | State/Actions, URL/History, Kernel/Fabric, Provider-Kette und React-/Vue-SSR/Adoption implementiert | Weitere Frameworks, Cross-Framework-Ownership und vollständige 0.9-Abnahme |

[A05](../../development/rmtx-a05/README.md) ergänzt echte Node-SSR und signierten Model-Restore vor Adoption und Intent-Replay für exklusive React-/Vue-Container. Das zusätzliche [Key-/Komponenten-SSR-Profil](../../development/rmtx-a06/scoped-components.md) unterstützt verschachtelte typisierte Schlüssel, gemeinsame Owner und getrennte Renderziele: Build-API 12, Composition-/Browser-API 9, CSR-/SSR-Plan-Runtime v11/v12 und SSR-Datenprofil v2. Die jeweiligen Vorgängerprofile einschließlich A05-SSR v1 bleiben erhalten; Classic-AST 1.0.0 und Resume-Registry 3 werden dadurch nicht umgedeutet.

[A06.2](../../development/rmtx-a06/frontend/README.md) liefert eigene Parser-/Compiler-APIs 1.0.0 und nutzt den expliziten Maraca-Compilerport. Die echte `.rmtx`-Zwei-Host-Referenz läuft über regulären Build/Boot mit React und Vue. Diese begrenzte produktive CSR-Abnahme ist keine vollständige RMTX- oder 0.9-Freigabe.

[A06.3.1](../../development/rmtx-a06/selector-profile/README.md) ergänzt fünf Selectoroperatoren, ein geschlossen boolesches Ausdrucksprofil und statische Abhängigkeitsberichte. Modul-APIs 2.0.0 unterstützen v1 weiterhin als Default; Syntaxprofil 2.0.0 ist explizit wählbar. Dies ist keine inkrementelle Selector-Runtime und keine vollständige A06.3-Abnahme.

## Releaseprüfung

`scripts/release/feature-scope.json` verlangt beide Features. `npm run check:release-preparation` prüft Vertragsdrift, Inventar, Versionen und Plan. `release:features:check` blockiert noch. CI-Kandidaten dürfen offene Features enthalten. Versiegelung und Publish verlangen quellgebundene Feature-Nachweise und Release-Gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Nächste Schritte

[Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) und [Classic-Vertrag](./rmt-classic-contract.md) ordnen Umfang und Compilerbasis ein. A06.3 bleibt nach dem Selektor-/Readset-Teilabschluss in Arbeit; als nächster zusammenhängender Abschnitt folgen Bedingungen, Wiederholungen und typisierte Keys; native UI, Tooling und gemeinsame Releaseabnahme folgen A06.4–A06.6. Weitere Framework- und Ownership-Profile benötigen eigene Entscheidungen und Nachweise.
