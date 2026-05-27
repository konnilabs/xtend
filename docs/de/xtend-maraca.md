# XTend Maraca

XTend Maraca ist der moderne ESM-Bundle-Pfad für RMT-first XTend Anwendungen. Maraca liest eine `.rmt` Quelle, leitet die tatsächlich referenzierten XTend Komponenten und RMT Runtime-Module ab und schreibt anschließend ein loaderloses Bundle mit statischer Inline-Registry statt `components/manifest.json` im Browser zu laden.

## Was es löst

Nutze Maraca, wenn ein Drittanbieter-Team eine fokussierte XTend Anwendung ausliefern möchte, nicht den gesamten Entwicklungsstack. Der klassische Loader bleibt der Kompatibilitätspfad für manifestbasierte Hosts: Er lädt eine Component Registry, löst Einträge zur Laufzeit auf und hält spätes Laden flexibel. Maraca verschiebt diese Entscheidung in den Buildschritt. Der Buildplan weiß, welche Surfaces `x-button`, `x-status`, `x-form` oder andere Tags referenzieren, behält nur diese Module im Rollup Graphen und schreibt einen Report, der erklärt, was in das Bundle gelangt ist.

Das Ergebnis eignet sich für produktspezifische Checkouts, eingebettete Dashboards, Kundenportale und RMT-autorisierte Shells, bei denen der ausgelieferte Code zum Dokument passen soll statt zum breiten Component Catalog. Maraca ändert keine Component APIs. Attribute, Events, Slots, CSS Parts, Design Tokens und RMT Schema-Namen bleiben öffentliche Namen und werden während der Minifizierung reserviert.

## Wann du es einsetzt

Wähle Maraca für produktionsorientierte RMT Apps, die aus `.rmt` Dateien entstehen und als modernes ESM laufen sollen. Es passt am besten, wenn der Host den Buildbefehl kontrolliert, Artefakte in ein `dist`- oder `products`-Verzeichnis schreiben kann und nachvollziehbare Größenreports benötigt. Es ist auch der richtige Pfad, wenn ein Team lazy Component Chunks ohne externen JSON Manifest Fetch möchte.

Bleibe bei `xtend-loader.js`, wenn der Host Manifest-Austausch zur Laufzeit, dynamische Component Catalogs, ältere Browser-Ziele oder ein Debugging-Setup braucht, in dem jede Komponente ohne Neubuild verfügbar sein soll. Beide Pfade können nebeneinander bestehen: Nutze den Loader für breite Kompatibilität und Maraca für optimierte Application Bundles.

## Build Flow

Maraca hat zwei öffentliche Einstiege. `xt maraca plan` erzeugt einen Buildplan, ohne ein Bundle zu schreiben. `xt maraca build` schreibt Bundle und Reports. Der RMT One-Step-Befehl nutzt dieselbe Pipeline und ist der bevorzugte Pfad, wenn der Entwickler mit einem RMT Dokument beginnt.

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy component --css external --json
xt rmt build app.rmt --bundle maraca --out dist --profile production --lazy component --css external --json
```

Der generierte Output enthält normalerweise `xtend.maraca.mjs`, optional `xtend.maraca.css`, dynamische `chunks/*.mjs`, `xtend.maraca.report.json` und `xtend.maraca.size.json`. Der Report ist das Audit-Artefakt: Er dokumentiert ausgewählte Komponenten, Runtime-Module, Lazy Imports, verbotene Loader-Abhängigkeiten und den Status des Größenbudgets.

## Orchestrierte App Bundles

Für RMT Apps mit State, Actions, Validation, Hydration und Surface Transitions kann Maraca die compiler-gesteuerte Orchestrierung direkt in das Bundle schreiben. `auto` bleibt kompatibel, `strict` erzwingt vollständige Contracts und `off` hält den Legacy-Pfad offen. Der vollständige Deep-Dive liegt in [Maraca Orchestrierung](./xtend-maraca-orchestration.md).

```bash
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
```

Strict Builds erwarten bekannte Komponenten, typisierte Events, Resource Ownership, auflösbare Targets/Portals, Validation Messages und schedulbare Transition-/Hydration-Fibers. Der Bundle-Report enthält dafür eigene Abschnitte für `orchestration`, `kernel`, `hydration`, `validation` und `transitions`.

## Minimales RMT Beispiel

Diese kleine Quelle referenziert nur drei Komponenten. Ein Maraca Build sollte deshalb diese Tags auswählen und nicht das vollständige Manifest.

```rmt
template demo.maraca {
  state demo.maraca.status type object preserve {
    initial {
      id "maraca-status"
      text "Ready"
      tone "success"
    }
  }

  selector demo.maraca.status from state demo.maraca.status {
    output MaracaStatus
  }

  action demo.maraca.save {
    input label string optional
    reduce state.demo.maraca.status.text = "Saved"
    emit demo.maraca.saved with label input.label
  }

  portal surface.root root "#xtend-maraca-root" layer surface

  surface demo.maraca.status kind card component x-status {
    source selector demo.maraca.status
    portal surface.root
    key status.id
    bounds x 16 y 16 width 360 height 88
    lane visible weight 80 {
      hydrate maraca-status from selector demo.maraca.status
    }
  }

  surface demo.maraca.form kind card component x-form {
    portal surface.root
    key "profile-form"
    bounds x 16 y 120 width 360 height 120
    lane idle weight 40 {
      mount profile-form
    }
  }

  surface demo.maraca.button kind action component x-button {
    portal surface.root
    key "save-button"
    bounds x 16 y 260 width 220 height 56
    lane visible weight 90 {
      mount save-button
    }
    on click "[data-action='save']" -> action demo.maraca.save {
      payload label "Save"
    }
  }
}
```

Der wichtige Vertrag ist der `component` Wert an jeder Surface. Maraca akzeptiert bekannte XTend Component Tags aus der Component Registry und lässt unbekannte Tags standardmäßig fehlschlagen. Wenn eine Anwendung wirklich dynamische Tags braucht, behandle das als explizite Host-Policy-Entscheidung statt als stillen Fallback.

## Runtime Integration

Ein Maraca Bundle stellt eine kleine Browser Bridge bereit. `bootXtendMaraca()` montiert die generierten Surfaces in `data-maraca-root`, `#xtend-maraca-root` oder `document.body`. `ensureMaracaComponent(tag)` lädt eine ausgewählte Komponente. Lazy Component Mode erzeugt dynamische Imports und nutzt viewportgetriebenes Laden, wenn `IntersectionObserver` verfügbar ist.

```html
<main id="xtend-maraca-root" data-maraca-root></main>
<script type="module">
  import { bootXtendMaraca } from "./dist/xtend.maraca.mjs";

  bootXtendMaraca({
    root: document.querySelector("[data-maraca-root]"),
    lazyStrategy: "viewport"
  });
</script>
```

Nutze `lazyStrategy: "eager"`, wenn der Host alle ausgewählten Komponenten sofort laden soll. Nutze komponentenweises Lazy Loading, wenn die Anwendung Surfaces unterhalb des ersten Viewports oder routenartige Bereiche hat, die die initiale Parse-Zeit nicht vergrößern sollen.

## Profile und Optionen

`debug` schreibt lesbares ESM mit Source Maps und ohne Mangling. Es eignet sich für die Diagnose von Buildplänen und Component Selection. `production` aktiviert Rollup Tree-Shaking und Terser Minifizierung mit reservierten öffentlichen Namen. `max` ergänzt optionales Private Property Mangling nur für interne Namen und persistiert einen Name Cache im Ausgabeverzeichnis.

`--lazy component` erzeugt nach Möglichkeit einen Lazy Entry pro ausgewählter Komponente. `--lazy none` zieht ausgewählte Komponenten in den Entry und ist einfacher für Single-File Deployments. `--css external` schreibt `xtend.maraca.css`; `--css inline` injiziert das kleine generierte Layout CSS aus dem Entry. Für Vendor Builds wählt `--vendor xtend` bewusst das vollständige Component Set und Stack Module; für App Builds lässt du das Vendor Flag weg, damit das RMT Dokument den Graphen kontrolliert.

## Reports und Größenbudgets

Lies `xtend.maraca.report.json` nach jedem Production Build. Die wichtigsten Felder sind `components.selected`, `runtimeModules`, `bundleFiles`, `loader`, `forbiddenRuntimeDependencies` und `toolchain`. Ein gesunder App Build sollte `loader.usesExternalManifest: false`, `loader.usesXtendLoader: false` und keine verbotene Runtime-Abhängigkeit auf `components/manifest.json` zeigen.

`xtend.maraca.size.json` vergleicht das moderne Bundle mit einer Baseline aus Legacy Loader plus ausgewählten Component Modulen. Das ist kein generischer Web Performance Score, sondern eine lokale Leitplanke, die beweist, dass Maraca für das gewählte Dokument weiterhin einen kleineren modernen ESM Graphen erzeugt.

## Fehlerbehebung

Wenn ein Build mit einer Unknown-Component-Diagnose scheitert, prüfe den exakten Tag in der RMT Surface und vergleiche ihn mit `components/manifest.json`. Wenn das Bundle größer als erwartet ist, prüfe zuerst `components.selected`; eine breite RMT Fixture wählt eventuell mehr Komponenten aus, als die Seite braucht. Wenn Lazy Chunks im Browser nicht laden, stelle sicher, dass das Ausgabeverzeichnis als Dateien ausgeliefert wird und nicht ohne den `chunks` Ordner kopiert wurde.

Wenn der Output weiterhin `xtend-loader.js`, `data-manifest` oder `components/manifest.json` referenziert, behandle den Report als Blocker. Maraca App Bundles sollten eine Inline Registry verwenden. Wenn du zur Laufzeit ein Manifest brauchst, wähle bewusst den Loader-Pfad, statt Maraca in diese Richtung umzubauen.

## Lokale Prüfungen

Nutze die Maraca Suites, wenn du CLI-Verdrahtung, Package Exports, Bundle-Erzeugung oder RMT Source-to-Bundle-Verhalten änderst.

```bash
node scripts/run_xtend_tests.js maraca-plan maraca-bundle maraca-rmt-source-to-bundle maraca-orchestration maraca-kernel-orchestration maraca-validation maraca-transitions maraca-package-exports maraca-size-budget --json
npm run test:maraca
npm run pack:dry-run
```

Für angrenzende Themen lies weiter bei [RMT App Platform Tooling](./rmt-app-platform-tooling.md), [XTend Loader](./xtend-loader.md) und [RMT-first XTend Apps](./rmt-first-xtend-apps.md).
