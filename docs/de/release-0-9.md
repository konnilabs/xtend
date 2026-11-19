# XTend 0.9 – Releasevorbereitung

**RMTX und XTensions 2.0 sind verbindlicher Umfang von 0.9.0.** Beide Features befinden sich in Vorbereitung. Die Paketversion bezeichnet den Entwicklungsstand.

## Stand und Abnahme

| Baustein | Stand | Erforderliche Nachweise |
| --- | --- | --- |
| RMT Classic | Umbenennung und gemeinsamer Compilervertrag implementiert | Kompatibilität und Regressionen |
| RMTX | Default1 und opt-in Profile2–7 mit Selektoren, Hosts, nativen Views, Lifecycle und öffentlichen Slots implementiert | Semantischer Editor, gemischte Projekte und vollständige Ziel-/SSR-/Releaseabnahme |
| XTensions 2.0 | State/Actions, URL/History, Kernel/Fabric, Provider-Kette und React-/Vue-SSR/Adoption implementiert | Weitere Frameworks, Cross-Framework-Ownership und vollständige 0.9-Abnahme |

[A05](../../development/rmtx-a05/README.md) ergänzt echte Node-SSR und signierten Model-Restore vor Adoption und Intent-Replay für exklusive React-/Vue-Container. Das zusätzliche [Key-/Komponenten-SSR-Profil](../../development/rmtx-a06/scoped-components.md) unterstützt verschachtelte typisierte Schlüssel, gemeinsame Owner und getrennte Renderziele: Build-API 12, Composition-/Browser-API 9, CSR-/SSR-Plan-Runtime v11/v12 und SSR-Datenprofil v2. Die jeweiligen Vorgängerprofile einschließlich A05-SSR v1 bleiben erhalten; Classic-AST 1.0.0 und Resume-Registry 3 werden dadurch nicht umgedeutet.

[A06.2](../../development/rmtx-a06/frontend/README.md) liefert eigene Parser-/Compiler-APIs 1.0.0 und nutzt den expliziten Maraca-Compilerport. Die echte `.rmtx`-Zwei-Host-Referenz läuft über regulären Build/Boot mit React und Vue. Diese begrenzte produktive CSR-Abnahme ist keine vollständige RMTX- oder 0.9-Freigabe.

[A06.3.1](../../development/rmtx-a06/selector-profile/README.md) ergänzt Selektoren und statische Readsets. [A06.3.2](../../development/rmtx-a06/keyed-profile/README.md) verbindet verschachtelte RMTX-Repeats, boolesche Presence und stabile typisierte Keys mit den bestehenden React-/Vue-Bindings; native Eventguards erhalten explizites Payloadmapping. [A06.3](../../development/rmtx-a06/orchestration-profile/README.md) ergänzt nun explizites Syntaxprofil4 mit 110 Tags, geprüften Actioninputs, geschlossenen Props-Projektionen und gepinnten Inline-React-/Vue-Hosts. Modul-APIs7 unterstützen weiterhin Default1 und die vollständigen Profile1–6. Der geschlossene A06.3-Vertrag ist implementiert.

## Releaseprüfung

`scripts/release/feature-scope.json` verlangt beide Features. `npm run check:release-preparation` prüft Vertragsdrift, Inventar, Versionen und Plan. `release:features:check` blockiert noch. CI-Kandidaten dürfen offene Features enthalten. Versiegelung und Publish verlangen quellgebundene Feature-Nachweise und Release-Gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Nächste Schritte

[Bestandsaufnahme](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) und [Classic-Vertrag](./rmt-classic-contract.md) ordnen Umfang und Compilerbasis ein. [A06.4.1](../../development/rmtx-a06/native-view-profile/README.md) ergänzt nun opt-in Syntax5 mit nativen HTML-Views, booleschen Viewbedingungen und stabilen typisierten DOM-Loops im tatsächlichen Kernel-/Fabricpfad. Source7 ergänzt Lifecyclebedingungen, native Surfaceinstanzen und Slots A06.4.2. Als Nächstes folgen semantisches Tooling A06.5 und gemeinsame Ziel-/Releaseabnahme A06.6. Source4-/Source5-SSR/Adoption bleibt bis zur eigenen Abnahme gesperrt. Weitere Framework- und Ownership-Profile benötigen eigene Entscheidungen und Nachweise.

[A06.4.2.1](../../development/rmtx-a06/lifecycle-profile/README.md) ergänzt opt-in Syntax6: bedingtes Mount für statische native Surfaces in visible-Lanes. Der Guard steuert Inhaltszulassung und öffnet keine geschlossene Surface. Source7 ergänzt weitere Lifecycleoperationen, Surfaceinstanzen und öffentliche Slots; Source4–7-SSR/Adoption ist weiterhin gesperrt. Dies ist keine vollständige Releasefreigabe.

Das explizite [Source7-Profil](../../development/rmtx-a06/native-orchestration-profile/README.md) erweitert A06.4.2 um alle zehn nativen Contentoperationen, ganze Surface-Repeats mit stabilen typisierten Keys, vertrauenswürdige native Eventkeys und öffentliche Shadow-DOM-Komponenten mit expliziten Slots. Der produktive Einstieg erzeugt Plan11/Browser13/Runtime16 und verwendet weiterhin den tatsächlichen Kernel-/Fabric-/Ressourcenpfad. A06.5 und A06.6 bleiben offen; beide Releasefeatures bleiben `preparing`.

Die native Komponentenfreigabe ist zunächst auf die geprüften Capability-Teilmengen von `x-header` und `x-button` begrenzt. [Der Ownership- und Sinkreview](../../development/rmtx-a06/native-components/README.md) dokumentiert konkrete Gegenbeispiele und die notwendige Einzelprüfung weiterer Controls.
