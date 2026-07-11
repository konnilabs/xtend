# Parsedown mit RMT koordinieren

Die XTend Docs zeigen einen Produktionspfad, bei dem PHP Markdown rendert, während RMT und AppRuntime Navigation, Scheduling und Hydration besitzen. Diese Trennung ist wichtig: RMT erhält strukturierte Zustände und Lifecycle-Signale, aber weder PHP-Ausführung noch ungeprüftes HTML.

## Zuständigkeiten

| Ebene | Aufgabe | Öffentliche Grenze |
| --- | --- | --- |
| PHP und Parsedown | Locale auflösen, Markdown im Safe Mode parsen, Payload ausliefern | `docs/index.php?xtend-docs-page={slug}&locale={locale}` |
| RMT | Shell, Surfaces, Lanes, Actions und Data Sources deklarieren | `docs/xtendrmt-docs-shell-vnext.rmt` |
| AppRuntime | Commands, Navigation, Suche und Fabric-Telemetrie koordinieren | `docs/utils/docs-shell-runtime.mjs` |
| Trusted-DOM-Host | Parsedown-HTML sanitizen und als `html_fragment` committen | `docs/utils/trusted-dom-host.mjs` |
| XRouter und SkeletonLoader | Route wiederverwenden und stabile Ladegeometrie zeigen | `skeleton-profile="docs-article"` |

Der Kernel trifft keine Sanitizer-Entscheidung. Der Host übergibt das Fragment erst nach erfolgreicher Prüfung an `createRmtTemplateRuntimeRenderer()`. Script-Tags, Inline-Handler und aktive URL-Schemata werden dadurch nicht zu erlaubtem RMT-Inhalt.

## Datenfluss einer Route

1. PHP rendert Header, Hero, aktiven Trunk, den aktuellen `<x-route>`-Record und die reservierte Artikelgeometrie. Der vollständige zweisprachige Artikelbestand liegt nicht im Initial-HTML.
2. `xtend-doc-page` fordert den aktuellen Parsedown-Payload vom same-origin Endpunkt an. Die Antwort enthält HTML, Locale-Auflösung und kompakte Seitenmetadaten.
3. Der Host sanitizt das Fragment und commitet es über die Trusted-DOM-Runtime in `#md-content`.
4. AppRuntime zeichnet `docs.content.ready` auf der sichtbaren Lane auf. Syntaxhervorhebung, verwandte Links und eingebettete Experiences folgen auf Idle-Lanes.
5. Bei einer weiteren Navigation ersetzt XRouter keinen Shell-Owner. Er verwendet dieselbe Page-Komponente, verwirft geplante Arbeit der alten Route und lädt nur den neuen Payload.

Die vollständige Route-Tabelle wird erst nach dem Content-Commit oder bei der ersten Navigation über `x-router.registerRoutes()` registriert. Das hält den SSR-Pfad klein, ohne URLs oder Tastaturzugriff einzuschränken.

## RMT-Deklaration

Der relevante Teil der Shell bindet den Payload-Endpunkt als Data Source. Der Parser bleibt außerhalb der DSL:

```rmt
datasource docs.page.payload from endpoint "index.php?xtend-docs-page={slug}&locale={locale}" {
  method GET
  contract DocsParsedownPagePayload
  result html
  fallback fixture docs.page.initial
}

surface docs.page kind page component x-section {
  lane visible weight 82 {
    mount docs-page from datasource docs.page.payload
  }

  lane idle weight 18 {
    hydrate docs-page-content from datasource docs.page.payload
  }
}
```

Der AOT-Compiler prüft diese Records vor dem Build. Die Laufzeit kompiliert keine freie RMT-Eingabe und konstruiert keinen zweiten Markdown-Parser im Browser.

## Suche und Ladezustände

Die Docs-Suche verwendet zwei deklarierte `searchsource`-Records, jeweils mit kompaktem und lazy geladenem Volltextindex. Titel, Aliase, Keywords, Überschriften, Summary und Body besitzen getrennte Gewichte. Ein Tippfehler wie `hydratoin` kann deshalb `Hydration Policies` finden, ohne alle Artikel in das Initial-Bundle zu legen.

Skeletons kommen aus `XTendSkeletonLoader.registerProfile()`. Das Profil beschreibt Zeilen, Tracks, Wiederholungen und responsive Mindesthöhen als Daten. Reduced Motion stoppt den Shimmer, verändert aber nicht die reservierte Geometrie.

## Telemetrie prüfen

Die Docs installieren `window.__XTEND_DEV_API__` vor dem vollständigen Runtime-Boot. Anfangs liefern die synchronen Methoden gültige `degraded`-Snapshots; nach der Hydration wechseln Performance, Kernel, Fabric und Hydration auf den aktuellen AppRuntime-Zustand. Damit kannst du die Docs selbst in der [XTend Dev Surface](./xtend-dev-surface.md) untersuchen.

Führe die lokalen Verträge gemeinsam aus:

```bash
node scripts/run_xtend_tests.js docs-rmt-pilot docs-shell-catfooding docs-php-ssr-prehydration docs-php-ssr-performance-budget docs-php-ssr-cls-budget --json
node scripts/smoke_docs_shell_catfooding.mjs
```

Der Browser-Smoke prüft beide Sprachen, Light/Dark, Desktop/Mobil, Tastaturfokus, Drawer, Route-Cleanup, DEV API, CLS sowie FCP- und Transferregression.

## Fehlerverhalten

Schlägt der Payload-Request fehl, bleibt die Shell bedienbar und nur der Artikel zeigt einen lokalen Fehlerzustand. Ein Sanitizer-Fehler blockiert den Fragment-Commit; er darf nicht durch `innerHTML` umgangen werden. Fehlt der Search Worker, verarbeitet die Main-Thread-Runtime denselben serialisierbaren Index in begrenzter Arbeit. Ein unbekanntes Skeleton-Profil fällt auf das eingebaute Route-Profil zurück.

Bei falscher Sprache prüfst du zuerst URL, `xtend.docs.locale` und die Felder `requestedLocale` sowie `resolvedLocale` im Payload. Bei Layoutverschiebungen vergleichst du `data-xtend-cls-anchor`, das aktive Skeleton-Profil und die reservierten Blockgrößen, bevor du Zeitmessungen interpretierst.

## Weiterführend

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Hydration Policies](./hydration-policies.md)
- [XTend Dev Surface](./xtend-dev-surface.md)
