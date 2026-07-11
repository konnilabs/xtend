# RMT App Platform Fixture

- Schema: `xtend.epic18.rmt-app-platform-fixture.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`

Die Fixture belegt `generic-catalog`, `admin-queue` und `content-board` als domain-neutrale RMT App Platform Varianten ohne manuelle `innerHTML`-Hosts.

## Zweck

Die RMT App Platform Fixture zeigt, wie XTend eine App-Struktur prüft, ohne sich auf eine konkrete Branche oder ein spezielles Produktbild festzulegen. `generic-catalog`, `admin-queue` und `content-board` sind absichtlich generische Varianten. Sie enthalten typische App-Bausteine wie Listen, Aktionen, Statusbereiche, Navigation und leere Zustände, aber keine Kundendomain, die später als Produktstandard missverstanden werden könnte. So kann der Gate App-Platform-Verhalten prüfen, während die eigentliche Produktsemantik frei bleibt.

Der zweite Zweck ist die Trusted-DOM-Grenze. Die Fixture darf keine manuellen `innerHTML`-Hosts benötigen, weil RMT-Quellen deklarativ bleiben sollen. Wenn eine Surface, Collection oder Aktion gerendert wird, geschieht das über Descriptoren, Loader und owned Komponenten. Dadurch kann der Host kontrollieren, welche DOM-Sinks erlaubt sind, und die App bleibt mit Native-First- und Trusted-DOM-Policies vereinbar.

## Varianten

`generic-catalog` prüft eine lesende App mit Sammlung, Detailbereich und leichten Filteraktionen. Diese Variante ist gut für Teams, die wissen wollen, ob Ressourcen, Selektoren und Oberflächen sauber zusammenfinden. `admin-queue` legt den Schwerpunkt auf Aufgaben, Statuswechsel und auslösbare Aktionen. Hier sieht man, ob ein Command eindeutig an eine RMT-Action gebunden ist und ob der resultierende Zustand wieder in die Surface zurückfließt. `content-board` prüft eine redaktionelle Sicht mit gruppierten Karten, Vorschau und leerem Zustand, ohne daraus ein fertiges CMS zu machen.

Alle drei Varianten teilen denselben Beweisstil: Quelle lesen, RMT kompilieren, Runtime-Shape auswerten und die Host-Grenzen bestätigen. Eine Erweiterung sollte erst dann in die Fixture, wenn sie eine neue App-Platform-Fähigkeit beweist. Reine Text- oder Farbänderungen gehören in Docs oder visuelle Beispiele, nicht in diese Gate-Fixture.

## Erweiterung

Wer eine neue Variante ergänzt, benennt zuerst das Verhalten, nicht die Domain. Gute Namen beschreiben die Struktur, etwa Queue, Board, Catalog oder Review, und bleiben frei von Kundenvokabular. Danach wird festgelegt, welche Resource, Surface, Action und welches Event den neuen Fall beweisen. Der lokale Gate `rmt-app-platform-fixture` muss den Fall ohne Netzwerk, ohne externen Renderer und ohne versteckte Build-Voraussetzung ausführen können. Erst dann zählt die Variante als Release-Evidence.

## Weiterführend

Der Tooling-Leitfaden zeigt, wie das Fixture vor Browser-Checks gelintet und kompiliert wird. [Verwandter Artikel](./rmt-app-platform-tooling.md)

## Fixture ausführen

```bash
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
```

Lies bei einem Fehler zuerst Suite, Diagnostic-Code und betroffene Variante im JSON-Report. Ändere danach `tests/fixtures/rmt-app-platform-fixture.rmt`; das Core-JSON wird nur aus einer beabsichtigten Source-Änderung neu erzeugt.
