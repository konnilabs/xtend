# RMT vNext Migration Notes

Diese Notizen helfen Teams, vorhandene XTendRMT JSON-Dokumente in die additive vNext-Syntax zu überführen, ohne den produktiven Host zu destabilisieren. Der Fokus liegt auf nachvollziehbaren Zwischenergebnissen: erst analysieren, dann eine Vorschau erzeugen, danach manuell entscheiden, welche Records wirklich in `.rmt` Quellen wandern.

## Wann diese Seite relevant ist

Nutze diese Seite, wenn ein Projekt bereits klassische RMT-Dokumente, `docs/xtendrmt-docs-shell-vnext.rmt` Beispiele oder Host-Adapter besitzt und den neuen Authoring-Pfad prüfen will. Migration bedeutet hier nicht, dass der Runtime-Adapter gewechselt wird. Der Compiler erzeugt weiterhin Core Records, Source Maps und Diagnostics; die Entscheidung über produktive Adapter bleibt beim Host.

Der öffentliche Vertrag ist bewusst defensiv:

- Bestehende JSON-Quellen bleiben gültig, solange der Host sie weiter akzeptiert.
- vNext-Quellen sind additiv und können parallel als `preview` geführt werden.
- Automatische Migration darf keine lossy Domains stillschweigend verschlucken.
- Der Kernel bleibt frei von Host-Imports und UI-Komponenten-Typen.

## Kompatibilitätsmatrix

Die Kompatibilitätsprüfung wird durch `tools/rmt-language/vnext-compatibility.js` beschrieben und meldet das Schema `xtend.rmt.vnext-compatibility-matrix.v1`. Sie trennt drei Fragen, die bei Drittentwicklern oft vermischt werden: Kann die Quelle gelesen werden, kann sie semantisch als vNext abgebildet werden, und ist der Roundtrip zur bisherigen Core-Form stabil genug für einen Review?

Wichtige Anker:

- `tools/rmt-language/vnext-compatibility.js`
- `tests/rmt-language/rmt_vnext_compatibility_suite.js`
- `demos/xtendrmt/fixtures/vnext-reference/source.rmt`
- `demos/xtendrmt/fixtures/vnext-reference/generated/core.json`
- `docs/de/rmt-vnext-authoring.md`
- `docs/de/rmt-vnext-migration-notes.md`

Die Matrix ist kein Formatter. Sie ist ein Audit-Artefakt, das Integratoren in Pull Requests lesen können. Wenn die Matrix `warning` oder `error` meldet, muss die Migration als technische Entscheidung behandelt werden, nicht als mechanisches Umschreiben.

## report-only als sicherer Start

Der erste Lauf sollte immer `report-only` sein. In diesem Modus erzeugt das Tool Diagnostics, eine Domain-Zuordnung und eine Vorschau auf die Zielsyntax, schreibt aber keine Arbeitsdateien um. Das ist besonders wichtig, wenn ein Projekt eigene Adapter, historische Schedule-Namen oder noch nicht normalisierte Manifest-Keys verwendet.

```bash
node scripts/run_xtend_tests.js rmt-vnext-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-regression --json
```

Ein grünes Signal bedeutet: Parser, Compiler, Compatibility-Matrix und Regression-Gate können die referenzierten Quellen lesen. Es bedeutet nicht, dass jede produktive App automatisch auf vNext wechseln sollte. Prüfe danach die Source Maps und die diagnostizierten Domains in der Review.

## preview und Apply-Plan

Ein `preview` ist der richtige nächste Schritt, wenn die Matrix keine blockierenden Domains meldet. Die Vorschau zeigt, welche `template`, `surface`, `lane`, `slot`, `when`, `trust boundary`, `sanitize`, `stream` und `on ... -> action` Records aus der Legacy-Struktur entstehen würden. Der Apply-Plan darf erst dann produktiv werden, wenn ein Entwickler die Domain-Zuordnung bestätigt hat.

Kopierbare Zielstruktur:

```rmt
template xtend.vnext.reference {
  surface root {
    lane critical weight 10 {
      hydrate app-shell
      hydrate hero-panel when route.visible == true
    }
  }
}
```

Wenn ein Host bereits Maraca nutzt, bleibt diese Preview trotzdem eine Sprachmigration. Das Bundle entsteht weiterhin über `xt maraca build app.rmt --orchestration strict --kernel strict --transitions strict --json`; die Migration entscheidet nur, ob die Quelle als vNext Authoring-Dokument taugt. Bestehende `transition`-Blöcke bleiben kompatibel. `animation`-Presets, `use animation`, `interrupt`, `reducedMotion`, `timeline` und `layoutKey` können schrittweise ergänzt werden, wenn eine App reichere Motion braucht.

## Verlustbehaftete Domains

Die wichtigste Warnung ist `rmt.vnext.migration.lossy_domain`. Sie erscheint, wenn ein Legacy-Domainbereich zwar lesbar ist, aber nicht ohne Bedeutungsverlust in vNext ausgedrückt werden kann. Typische Ursachen sind freie Host-Erweiterungen, implizite Adapter-Konventionen, unbenannte Schedule-Endpunkte oder Records, die erst durch Anwendungscode Sinn bekommen.

Behandle diese Warnung als Review-Blocker für automatische Änderungen:

- Dokumentiere die Domain, die Bedeutung verlieren würde.
- Entscheide, ob der Host eine explizite vNext-Erweiterung braucht.
- Ergänze fehlende Payload Contracts oder Resource Ownership, bevor ein Build strict wird.
- Halte die Legacy-Quelle so lange als Source of Truth, bis die neue `.rmt` Quelle denselben Core-Output erklärt.

## Minimaler Prüfpfad

Für eine Migration reichen lokale, netzwerkfreie Gates:

```bash
node scripts/run_xtend_tests.js rmt-vnext-parser rmt-vnext-compiler rmt-vnext-compatibility rmt-vnext-regression --json
node scripts/run_xtend_tests.js rmt-vnext-release --json
```

Der Release-Gate-Lauf prüft zusätzlich, dass die Migrationsnotizen, der Authoring Guide und der Releasevertrag zusammenpassen. Wenn nur dieser Artikel geändert wird, ist `rmt-vnext-release` der kürzeste Beweis, dass die öffentlichen Begriffe nicht auseinanderlaufen.

## Spezifische Fehlerbilder

- Wenn `rmt.document.extension.fallback-used` auftaucht, wurde vermutlich eine `.rmt.json` Quelle gelesen. Das ist erlaubt, sollte aber nicht als Zielpfad dokumentiert werden.
- Wenn `rmt.vnext.migration.opt_in_required` auftaucht, fehlt die ausdrückliche Entscheidung, eine Preview oder Migration zu erzeugen.
- Wenn `rmt.vnext.migration.lossy_domain` auftaucht, ist ein automatischer Apply nicht reviewbar.
- Wenn der Core-Output von `demos/xtendrmt/fixtures/vnext-reference/generated/core.json` driftet, muss die Compiler-Änderung zuerst erklärt werden; danach werden Docs und Golden Output gemeinsam aktualisiert.

## Weiterführend

Der Authoring Guide zeigt die Zielsprache für jeden Migrationsschritt dieser Seite. [Verwandter Artikel](./rmt-vnext-authoring.md)
