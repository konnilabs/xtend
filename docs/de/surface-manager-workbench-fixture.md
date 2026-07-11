# SurfaceManager Workbench Fixture

Contract: `xtend.surface.workbench-fixture.v1`

Die Workbench Fixture beweist eine RMT-first Surface App mit Route, Manager, Fenstern, Side Panel und gemeinsamem Snapshot.

Gate:

```bash
node scripts/run_xtend_tests.js surface-workbench-fixture --json
```

## Zweck

Die Workbench Fixture beweist, dass eine RMT-first App mehrere Surface-Typen gemeinsam beschreiben kann, ohne die Host-Runtime zu umgehen. Eine Route bringt den Nutzer in die Workbench, der Manager registriert die Surfaces, Fenster zeigen primäre Arbeitsbereiche, ein Side Panel liefert Kontext, und ein Snapshot macht den Zustand wieder lesbar. Diese Kombination ist näher an echten Anwendungen als ein einzelner Komponenten-Smoke, bleibt aber klein genug für lokale Gates.

Der Contract `xtend.surface.workbench-fixture.v1` ist dabei kein Produktlayout. Er beschreibt eine prüfbare Struktur: Route, Manager, Window, Panel, Commands und Snapshot. Teams können daraus ableiten, wie ihre eigenen Workbench-artigen Apps RMT einsetzen, aber sie sollen Namen, Inhalte und Domänen selbst definieren. Die Fixture bleibt domain-neutral, damit sie nicht als CRM-, CMS- oder Admin-Vorlage missverstanden wird.

## Runtime Flow

Der Flow beginnt mit einer RMT-Quelle, die Route und Surfaces deklariert. Der Compiler erzeugt eine Struktur, die der Host in owned Komponenten übersetzt. `x-surface-manager` bekommt die Surface-Records, `x-surface-window` rendert die Arbeitsbereiche, und `x-side-panel` zeigt sekundären Kontext. Der gemeinsame Snapshot ist der Beweis, dass die App nicht nur optisch funktioniert, sondern Zustand, Fokus und Aktionsergebnisse wieder zusammenführt.

Wichtig ist, dass keine Stufe eine manuelle DOM-Abkuerzung nimmt. RMT liefert Descriptoren und keine HTML-Injektion. Der Host entscheidet über Custom Elements, Slots und erlaubte DOM-Sinks. Wenn eine Aktion in der Workbench ausgeführt wird, muss sie über den Runtime-Pfad in den Snapshot zurueckfinden. Nur dann ist die Fixture für Native-First- und Trusted-DOM-Gates belastbar.

## Reviewer Check

Reviewende lesen die Fixture als Integrationsbeweis. Sie prüfen, ob Route, Fenster und Side Panel dieselbe App-Instanz meinen, ob IDs stabil sind, ob der Snapshot alle sichtbaren Surfaces erfasst und ob die Kommandos keine unregistrierten Nebenwirkungen haben. Ein Fehler in diesem Gate ist oft ein Hinweis auf eine Architekturdrift: RMT beschreibt zu viel DOM, der Host registriert zu wenig Zustand, oder ein Surface-Typ ist nur als optischer Container vorhanden.

Neue Workbench-Fälle sollten nur ergänzt werden, wenn sie eine andere Interaktion beweisen. Beispiele waeren ein Inspector, eine mehrstufige Queue oder ein resizable Workspace. Reine Textaenderungen, neue Beispielnamen oder kosmetische Spalten brauchen keine neue Fixture. Dadurch bleibt der Gate klein, aber aussagekraeftig.

## Weiterführend

Der Authoring Guide erklärt die Surface Records des Workbench-Fixtures. [Verwandter Artikel](./surface-manager-authoring-guide.md)
