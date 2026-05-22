# Best Practices für XTend

Diese Empfehlungen helfen dir, XTend-Projekte robust, performant und wartbar zu gestalten – sowohl für menschliche Entwickler als auch für AI-Coding-Agenten.

---

## Komponenten-Nutzung
- **Deklarativ bevorzugen:** Nutze XTend-Komponenten möglichst direkt im HTML, nicht nur dynamisch per JS.
- **Lazy Loading:** Baue Seiten so, dass Komponenten erst geladen werden, wenn sie gebraucht werden (Viewport, User-Interaktion).
- **Shadow DOM:** Verwende Shadow DOM für Style-Kapselung und Konfliktvermeidung.
- **Slots & Attribute:** Nutze Slots und Attribute für flexible, wiederverwendbare Komponenten.

---

## State-Management
- **xstate nutzen:** Teile globalen und lokalen Zustand über das zentrale State-Management-Modul.
- **Abonnements:** Reagiere auf State-Änderungen mit `xstate.subscribe` statt aufwändiger DOM-Queries.

---

## Theming & Styling
- **CSS Custom Properties:** Verwende Variablen für Farben, Abstände, etc. – so bleibt das Design flexibel.
- **xtheme nutzen:** Setze globale Styles und Theme-Änderungen zentral über das Theme-Modul.
- **Dark/Light-Mode:** Unterstütze beide Modi und respektiere Systempräferenzen.

---

## Barrierefreiheit (Accessibility)
- **ARIA-Rollen:** Setze sinnvolle ARIA-Attribute und Rollen.
- **Keyboard-Navigation:** Stelle sicher, dass alle interaktiven Komponenten per Tastatur bedienbar sind.
- **Fokus-Management:** Dialoge, Modals und Menüs sollten den Fokus korrekt setzen und zurückgeben.

---

## Performance
- **Minimiertes Manifest:** Entferne ungenutzte Komponenten aus dem Manifest für Produktions-Builds.
- **Kleine Bundles:** Halte Komponenten modular und klein, um Ladezeiten zu optimieren.
- **IntersectionObserver:** Nutze Lazy Loading für große oder selten genutzte Komponenten.

---

## Entwicklung & Wartung
- **Dokumentation:** Jede Komponente sollte eine eigene, aktuelle MD-Dokumentation besitzen.
- **Namenskonventionen:** Halte dich an das `x`-Prefix und sprechende Namen.
- **Testing:** Teste Komponenten isoliert und im Zusammenspiel.
- **Querverweise:** Pflege Querverweise in der Doku für bessere Orientierung.

---

## Testpflicht fuer neue Komponenten
- **Profil festlegen:** Ordne jede neue oder modernisierte Komponente einem Profil aus `development/XTend-Component-Level-Teststandard.md` zu.
- **Artefakte vollständig halten:** Komponente, Doku, Component-Suite, Fixture, Typdefinition und Manifest-Eintrag sind Pflicht, sofern nicht explizit begründet ausgenommen.
- **Scaffold als Standardpfad:** `XTend-Scaffold` muss die Testpflicht aus `development/XTend-Testpflicht-und-Scaffold-Anschluss.md` als Blueprint verwenden.
- **Lokale Gates ausführen:** Nutze mindestens `node scripts/run_xtend_tests.js components`, `a11y-hydration`, `references` und bei RMT-kompatiblen Scaffold-Artefakten `rmt-compatibility`; bei Core-Bezug zusätzlich `core`, `architecture` und `browser`.
- **Keine Platzhaltertests:** Testdateien ohne echte Assertions erfüllen die Testpflicht nicht.

## XTendRMT-kompatible Entwicklung

- **Native Domains bevorzugen:** Neue RMT-nahe Arbeit nutzt `adapters`, `components`, `routes`, `schedules` und `templates` statt operativer `manifest.metadata`-Bloecke.
- **Kernel-Grenze halten:** XTend, XRouter, DOM, `window.XTend` und `xstate` gehoeren in Adapter oder Host-Code, nicht in den RMT Kernel.
- **Produktive Factories nutzen:** Verwende `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` und `createRmtStateSchedulerDiagnosticsBridge` statt privater Demo-Brueckenlogik.
- **Multi-Host pruefen:** XTend ist First-Class Host, aber nicht Pflicht-Host. Ein nicht-XTend Pfad wie `vanilla.component` sollte bei Framework-nahen Aenderungen mitgedacht werden.
- **Trusted DOM respektieren:** RMT `dom_descriptor` ist bevorzugt. RMT `html_fragment` und Parsedown HTML brauchen `xtend.security.sanitizing-boundary.v1`; rohe `innerHTML`-Sinks gehoeren nicht in Komponenten oder Adapter.
- **Docs-App respektieren:** Die offizielle Dokumentation nutzt Parsedown als Parser-Host, rendert ihre Shell aber Shell-first ueber RMT. Neue Docs-Komfortfunktionen sollen `docs/xtendrmt-parsedown-scheduling.md`, `docs.app.shell` und die vorhandenen RMT-Schedules nutzen, statt neben dem Host-Adapter eine zweite SPA-Schicht aufzubauen.
- **Gates ausfuehren:** Fuer RMT-nahe Aenderungen mindestens `node scripts/run_xtend_tests.js rmt-compatibility --json`, `node scripts/run_xtend_tests.js references --json` und bei Browserpfad `node scripts/run_xtend_tests.js browser --json`.

---

## AI-Optimierung
- **Konsistente API:** Halte Methoden und Attribute konsistent und sprechend.
- **Beispielcode:** Ergänze jede Doku um konkrete Codebeispiele.
- **Semantische Struktur:** Nutze klare Überschriften, Tabellen und Listen für AI-Parsing.

---

*Letzte Aktualisierung: 5. Mai 2026*
