# XTend Maraca

XTend Maraca ist der moderne ESM-Bundle-Pfad für RMT-first XTend Anwendungen. Maraca liest eine `.rmt` Quelle, leitet die tatsächlich referenzierten XTend Komponenten und RMT Runtime-Module ab und schreibt anschließend ein loaderloses Bundle mit statischer Inline-Registry statt `components/manifest.json` im Browser zu laden.

## Was es löst

Nutze Maraca, wenn aus RMT-Quelltext ein vom Compiler ausgewähltes XTend-App-Bundle mit prüfbaren Build-Nachweisen werden soll. [XTend Classic](./xtend-classic.md) ist der gleichwertig unterstützte Pfad für manifestbasierte HTML- und JavaScript-Hosts: Er lädt eine Component Registry, löst Einträge zur Laufzeit auf und hält spätes Laden flexibel. Maraca verschiebt diese Auswahl in den Buildschritt. Der Buildplan weiß, welche Surfaces `x-button`, `x-status`, `x-form` oder andere Tags referenzieren, behält nur diese Module im Rollup Graphen und schreibt einen Report, der erklärt, was in das Bundle gelangt ist.

Das Ergebnis eignet sich für produktspezifische Checkouts, eingebettete Dashboards, Kundenportale und RMT-autorisierte Shells, bei denen der ausgelieferte Code zum Dokument passen soll statt zum breiten Component Catalog. Maraca ändert keine Component APIs. Attribute, Events, Slots, CSS Parts, Design Tokens und RMT Schema-Namen bleiben öffentliche Namen und werden während der Minifizierung reserviert.

## Wann du es einsetzt

Wähle Maraca für RMT-first-Apps, die als generiertes Modern ESM laufen und optimierte App-Graphen, SSR/Hydration, PWA-Ausgabe oder Produktionsreports benötigen. Der Pfad passt, wenn der Host den Buildbefehl kontrolliert, Artefakte in ein `dist`- oder `products`-Verzeichnis schreiben kann und nachvollziehbare Nachweise wünscht.

Wähle XTend Classic, wenn der Host direkt gepflegtes HTML und JavaScript, Manifest-Austausch zur Laufzeit, dynamische Component Catalogs oder Progressive Enhancement ohne einen von XTend verlangten Application-Build benötigt. Beide Pfade können nebeneinander bestehen und werden für Produktion unterstützt; die Projektgröße allein entscheidet nicht zwischen ihnen.

## Build Flow

Maraca hat zwei öffentliche Einstiege. `xt maraca plan` erzeugt einen Buildplan, ohne ein Bundle zu schreiben. `xt maraca build` schreibt Bundle und Reports. Der RMT One-Step-Befehl nutzt dieselbe Pipeline und ist der bevorzugte Pfad, wenn der Entwickler mit einem RMT Dokument beginnt.

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy component --css external --json
xt rmt build app.rmt --bundle maraca --out dist --profile production --lazy component --css external --json
```

Der generierte Output enthält normalerweise `xtend.maraca.mjs`, optional `xtend.maraca.css`, dynamische `chunks/*.mjs`, `xtend.maraca.report.json` und `xtend.maraca.size.json`. Wenn der Mobile-Manifest- oder PWA-Assistant aktiviert ist, kann dasselbe Ausgabeverzeichnis zusätzlich `xtend.webmanifest`, `icons/`, `xtend.webmanifest.report.json`, `xtend.service-worker.js`, `xtend.offline.html` und `xtend.pwa.report.json` enthalten. Der Report ist das Audit-Artefakt: Er dokumentiert ausgewählte Komponenten, Runtime-Module, Lazy Imports, verbotene Loader-Abhängigkeiten, PWA-Anschlussdaten und den Status des Größenbudgets.

## Orchestrierte App Bundles

Für RMT Apps mit State, Actions, Validation, Hydration und Surface Transitions kann Maraca die compiler-gesteuerte Orchestrierung direkt in das Bundle schreiben. `auto` bleibt kompatibel, `strict` erzwingt vollständige Contracts und `off` hält den Legacy-Pfad offen. Der vollständige Deep-Dive liegt in [Maraca Orchestrierung](./xtend-maraca-orchestration.md).

```bash
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
```

Strict Builds erwarten bekannte Komponenten, typisierte Events, Resource Ownership, auflösbare Targets/Portals, Validation Messages und schedulbare Transition-/Hydration-Fibers. Der Bundle-Report enthält dafür eigene Abschnitte für `orchestration`, `kernel`, `hydration`, `validation` und `transitions`.

## Mobile Web App Manifest

Der Web App Manifest Assistant ist opt-in und unabhängig vom Service-Worker-Pfad nutzbar. Er schreibt `xtend.webmanifest`, legt ein `icons/` Verzeichnis im Maraca-Output an und kopiert die XTend Standard-Logo-Assets aus dem Repo-Root. V1 skaliert keine Bilder und erfindet kein echtes Branding. Der Assistant kopiert vorhandene Dateien, damit App-Entwickler sie im Output durch produktspezifische Icons ersetzen können.

```bash
xt maraca build app.rmt --out dist --web-app-manifest --json
xt maraca build app.rmt --out dist --manifest --json
```

Das generierte Manifest verwendet als Defaults `name: "XTend Maraca App"`, `short_name: "XTend"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `background_color: "#ffffff"` und `theme_color: "#1f6f78"`. Manifest-Icons verweisen nur auf die mobilen App Icons: `icons/android-chrome-192x192.png` und `icons/android-chrome-512x512.png`, jeweils mit `purpose: "any"`. Apple Touch Icons und Favicons werden kopiert und in `xtend.webmanifest.report.json` als `htmlLinkHints` aufgeführt; sie werden nicht fälschlich als Web-App-Manifest-Icons deklariert.

Die stabilen Report-Schemas sind `xtend.maraca.web-app-manifest-plan.v1` und `xtend.maraca.web-app-manifest-report.v1`. Der Bundle-Report stellt dieselbe Evidence unter `webAppManifest` bereit, und der generierte Browser-Entry exponiert sie als `XTendMaraca.webAppManifest`.

## PWA Service Worker Assistant

Der PWA Service Worker Assistant ist ebenfalls opt-in. Er ist Low-Code, nicht NoCode: Maraca generiert sichere Framework-Flächen für App-Shell-Caching, versioniertes Cache-Cleanup, Registrierungsdaten und Offline-Fallback; app-spezifische Netzwerk- oder Business-Logik bleibt über einen expliziten Import-Hook angebunden.

```bash
xt maraca build app.rmt --out dist --pwa --json
xt maraca build app.rmt --out dist --enable-service-worker --json
```

`pwa: true` aktiviert automatisch den Web App Manifest Assistant. Der Service-Worker-Plan konsumiert diesen Manifest-Plan für `manifestRef`, Icon-Dateien und Precache-URLs, statt Manifest-Erzeugung selbst zu besitzen. Generierte Artefakte sind `xtend.service-worker.js`, bei aktiviertem Offline-Fallback `xtend.offline.html` und `xtend.pwa.report.json`.

Der generierte Service Worker cached standardmäßig nur sichere same-origin `GET` App-Shell- und Asset-Requests. Die Runtime-Cache-Policy erlaubt statische Assets mit `cache-first`, Navigation-Fallback mit `network-first` und optionale Images/Fonts mit `stale-while-revalidate`. Geblockt bleiben non-GET Requests, Auth-/Cookie-sensitive Requests, personalisierte SSR-Fragmente, API Responses ohne explizite App-Policy, Background Sync, Push und Offline-Mutationslogik. Für lokale Business-Regeln konfigurierst du einen Service-Worker-Business-Logic-Import; die generierte Datei enthält den Kommentarblock `XTEND SERVICE WORKER BUSINESS LOGIC HOOK` und importiert dieses Skript, ohne dass Entwickler die generierte Datei direkt bearbeiten müssen.

Die stabilen Report-Schemas sind `xtend.maraca.pwa-service-worker-plan.v1` und `xtend.maraca.pwa-service-worker-report.v1`. Der Bundle-Report stellt die Evidence unter `pwa` bereit; die Browser Bridge exponiert Plan und Registrierungssnapshot über `XTendMaraca.pwa`, `window.__XTendMaracaPwaRegistration` und den Telemetrie-Snapshot. RMT Kernel und UI Coprocessor konsumieren nur PWA-Statusdaten wie `serviceWorkerControlled`, `cacheMode`, `offlineEligible`, `manifestRef` und `cacheVersion`; Service Worker übernehmen keine UI-Compute-, SSR- oder DOM-Verantwortung.

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

Nutze `--web-app-manifest` oder `--manifest`, wenn die App auf mobilen Geräten installierbar sein soll, ohne bereits einen Service Worker zu aktivieren. Nutze `--pwa` oder `--enable-service-worker`, wenn Maraca zusätzlich Service-Worker-Registrierung, Cache-Policy und Offline-Fallback erzeugen soll. `--pwa` schließt den Manifest Assistant automatisch ein.

## Reports und Größenbudgets

Lies `xtend.maraca.report.json` nach jedem Production Build. Die wichtigsten Felder sind `components.selected`, `runtimeModules`, `bundleFiles`, `loader`, `forbiddenRuntimeDependencies`, `webAppManifest`, `pwa` und `toolchain`. Ein gesunder App Build sollte `loader.usesExternalManifest: false`, `loader.usesXtendLoader: false` und keine verbotene Runtime-Abhängigkeit auf `components/manifest.json` zeigen.

Für kernel-orchestrierte Production Bundles solltest du zusätzlich `productionClosure` und `kernelFeatureAdoptionClosure` prüfen. Diese Abschnitte beantworten jede Runtime Capability mit `supported`, `active`, `degraded`, `blocked`, `runtimeExpectedStatus` und Diagnostics. Dieselbe Matrix verbindet Lifecycle, Telemetry, Performance, Policy Parity, Warm Reentry, Prewarm Worker und Prerender Status mit RMT Source-Fingerprint, Bundle-Fingerprints und Release-Tests.

`xtend.maraca.size.json` vergleicht das moderne Bundle mit einer Baseline aus Legacy Loader plus ausgewählten Component Modulen. Das ist kein generischer Web Performance Score, sondern eine lokale Leitplanke, die beweist, dass Maraca für das gewählte Dokument weiterhin einen kleineren modernen ESM Graphen erzeugt.

## Fehlerbehebung

Wenn ein Build mit einer Unknown-Component-Diagnose scheitert, prüfe den exakten Tag in der RMT Surface und vergleiche ihn mit `components/manifest.json`. Wenn das Bundle größer als erwartet ist, prüfe zuerst `components.selected`; eine breite RMT Fixture wählt eventuell mehr Komponenten aus, als die Seite braucht. Wenn Lazy Chunks im Browser nicht laden, stelle sicher, dass das Ausgabeverzeichnis als Dateien ausgeliefert wird und nicht ohne den `chunks` Ordner kopiert wurde.

Wenn der Output weiterhin `xtend-loader.js`, `data-manifest` oder `components/manifest.json` referenziert, behandle den Report als Blocker. Maraca App Bundles sollten eine Inline Registry verwenden. Wenn du zur Laufzeit ein Manifest brauchst, wähle bewusst den Loader-Pfad, statt Maraca in diese Richtung umzubauen.

Wenn kein mobiler Install Prompt erscheint, prüfe, ob `xtend.webmanifest` als `application/manifest+json` ausgeliefert wird und ob `icons/android-chrome-192x192.png` sowie `icons/android-chrome-512x512.png` im Output-`icons/` Verzeichnis existieren. Wenn Offline-Verhalten fehlt, prüfe, ob die Seite über einen Origin läuft, der Service Worker erlaubt, ob `xtend.service-worker.js` als JavaScript ausgeliefert wird und ob `xtend.pwa.report.json` die erwarteten Precache-URLs enthält.

## Lokale Prüfungen

Nutze die Maraca Suites, wenn du CLI-Verdrahtung, Package Exports, Bundle-Erzeugung oder RMT Source-to-Bundle-Verhalten änderst.

```bash
node scripts/run_xtend_tests.js maraca-plan maraca-bundle maraca-rmt-source-to-bundle maraca-orchestration maraca-kernel-orchestration maraca-validation maraca-transitions maraca-package-exports maraca-size-budget maraca-web-app-manifest maraca-pwa-service-worker --json
npm run test:maraca-web-app-manifest
npm run test:maraca-pwa-service-worker
npm run test:maraca
npm run pack:dry-run
```

Für angrenzende Themen lies weiter bei [RMT App Platform Tooling](./rmt-app-platform-tooling.md), [XTend Classic](./xtend-classic.md) und [RMT-first XTend Apps](./rmt-first-xtend-apps.md).
