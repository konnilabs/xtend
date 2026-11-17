# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features befinden sich in Vorbereitung. Die Paketversion bezeichnet den Entwicklungsstand.

## Stand und Abnahme

| Baustein | Stand | Erforderliche Nachweise |
| --- | --- | --- |
| RMT Classic | Umbenennung und gemeinsamer Compilervertrag implementiert | Kompatibilität und Regressionen |
| RMTX | A06.2-v1-Default sowie opt-in Selektor-v2- und Host-Scope-v3-Profile implementiert | Weitere Operatoren/Ausdrücke, native UI, semantischer Editor, gemischte Projekte und vollständige Browser-/SSR-Abnahme |
| XTensions 2.0 | State/Actions, URL/History, Kernel/Fabric, Provider-Kette und React-/Vue-SSR/Adoption implementiert | Weitere Frameworks, Cross-Framework-Ownership und vollständige 0.9-Abnahme |

[A05](../../development/rmtx-a05/README.md) ergänzt echte Node-SSR und signierten Model-Restore vor Adoption und Intent-Replay für exklusive React-/Vue-Container. Das zusätzliche [Key-/Komponenten-SSR-Profil](../../development/rmtx-a06/scoped-components.md) unterstützt verschachtelte typisierte Schlüssel, gemeinsame Owner und getrennte Renderziele: Build-API 12, Composition-/Browser-API 9, CSR-/SSR-Plan-Runtime v11/v12 und SSR-Datenprofil v2. Die jeweiligen Vorgängerprofile einschließlich A05-SSR v1 bleiben erhalten; Classic-AST 1.0.0 und Resume-Registry 3 werden dadurch nicht umgedeutet.

[A06.2](../../development/rmtx-a06/frontend/README.md) liefert eigene Parser-/Compiler-APIs 1.0.0 und nutzt den expliziten Maraca-Compilerport. Die echte `.rmtx`-Zwei-Host-Referenz läuft über regulären Build/Boot mit React und Vue. Diese begrenzte produktive CSR-Abnahme ist keine vollständige RMTX- oder 0.9-Freigabe.

[A06.3.1](../../development/rmtx-a06/selector-profile/README.md) ergänzt Selektoren und statische Readsets. [A06.3.2](../../development/rmtx-a06/keyed-profile/README.md) verbindet verschachtelte RMTX-Repeats, boolesche Presence und stabile typisierte Keys mit den bestehenden React-/Vue-Bindings; native Eventguards erhalten explizites Payloadmapping. [A06.3](../../development/rmtx-a06/orchestration-profile/README.md) ergänzt nun explizites Syntaxprofil4 mit 110 Tags, geprüften Actioninputs, geschlossenen Props-Projektionen und gepinnten Inline-React-/Vue-Hosts. Modul-APIs4 unterstützen weiterhin Default1 und die unveränderten Profile1/2/3. Der geschlossene A06.3-Vertrag ist implementiert.

## Releaseprüfung

`scripts/release/feature-scope.json` verlangt beide Features. `npm run check:release-preparation` prüft Vertragsdrift, Inventar, Versionen und Plan. `release:features:check` blockiert noch. CI-Kandidaten dürfen offene Features enthalten. Versiegelung und Publish verlangen quellgebundene Feature-Nachweise und Release-Gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Nächste Schritte

[Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) und [Classic-Vertrag](./rmt-classic-contract.md) ordnen Umfang und Compilerbasis ein. Nach A06.3 folgen natives UI einschließlich nativer typisierter DOM-Loops und Lifecyclebedingungen, semantisches Tooling und gemeinsame Ziel-/Releaseabnahme in A06.4–A06.6. Source4-SSR/Adoption ist bis zur eigenen Abnahme ausdrücklich gesperrt. Weitere Framework- und Ownership-Profile benötigen eigene Entscheidungen und Nachweise.
