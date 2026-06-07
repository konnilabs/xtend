# SurfaceManager Workbench Fixture

Contract: `xtend.surface.workbench-fixture.v1`

Die Workbench Fixture beweist eine RMT-first Surface App mit Route, Manager, Fenstern, Side Panel und gemeinsamem Snapshot.

Gate:

```bash
node scripts/run_xtend_tests.js surface-workbench-fixture --json
```

## Zweck

Die Workbench Fixture beweist, dass eine RMT-first App mehrere Surface-Typen gemeinsam beschreiben kann, ohne die Host-Runtime zu umgehen. Eine Route bringt den Nutzer in die Workbench, der Manager registriert die Surfaces, Fenster zeigen primaere Arbeitsbereiche, ein Side Panel liefert Kontext, und ein Snapshot macht den Zustand wieder lesbar. Diese Kombination ist naeher an echten Anwendungen als ein einzelner Komponenten-Smoke, bleibt aber klein genug fuer lokale Gates.

Der Contract `xtend.surface.workbench-fixture.v1` ist dabei kein Produktlayout. Er beschreibt eine pruefbare Struktur: Route, Manager, Window, Panel, Commands und Snapshot. Teams koennen daraus ableiten, wie ihre eigenen Workbench-artigen Apps RMT einsetzen, aber sie sollen Namen, Inhalte und Domaenen selbst definieren. Die Fixture bleibt domain-neutral, damit sie nicht als CRM-, CMS- oder Admin-Vorlage missverstanden wird.

## Runtime Flow

Der Flow beginnt mit einer RMT-Quelle, die Route und Surfaces deklariert. Der Compiler erzeugt eine Struktur, die der Host in owned Komponenten uebersetzt. `x-surface-manager` bekommt die Surface-Records, `x-surface-window` rendert die Arbeitsbereiche, und `x-side-panel` zeigt sekundaeren Kontext. Der gemeinsame Snapshot ist der Beweis, dass die App nicht nur optisch funktioniert, sondern Zustand, Fokus und Aktionsergebnisse wieder zusammenfuehrt.

Wichtig ist, dass keine Stufe eine manuelle DOM-Abkuerzung nimmt. RMT liefert Descriptoren und keine HTML-Injektion. Der Host entscheidet ueber Custom Elements, Slots und erlaubte DOM-Sinks. Wenn eine Aktion in der Workbench ausgefuehrt wird, muss sie ueber den Runtime-Pfad in den Snapshot zurueckfinden. Nur dann ist die Fixture fuer Native-First- und Trusted-DOM-Gates belastbar.

## Reviewer Check

Reviewende lesen die Fixture als Integrationsbeweis. Sie pruefen, ob Route, Fenster und Side Panel dieselbe App-Instanz meinen, ob IDs stabil sind, ob der Snapshot alle sichtbaren Surfaces erfasst und ob die Kommandos keine unregistrierten Nebenwirkungen haben. Ein Fehler in diesem Gate ist oft ein Hinweis auf eine Architekturdrift: RMT beschreibt zu viel DOM, der Host registriert zu wenig Zustand, oder ein Surface-Typ ist nur als optischer Container vorhanden.

Neue Workbench-Faelle sollten nur ergaenzt werden, wenn sie eine andere Interaktion beweisen. Beispiele waeren ein Inspector, eine mehrstufige Queue oder ein resizable Workspace. Reine Textaenderungen, neue Beispielnamen oder kosmetische Spalten brauchen keine neue Fixture. Dadurch bleibt der Gate klein, aber aussagekraeftig.
