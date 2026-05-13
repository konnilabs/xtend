# Quick Start Guide

Dieser Guide bringt eine minimale XTend-App lokal zum Laufen. Ziel ist ein kleiner, nachvollziehbarer Startpunkt ohne CDN, ohne Build-Schritt und ohne Framework-Zwang.

## Voraussetzungen

- Node.js 18 oder neuer
- ein lokaler Checkout des XTend-Repositories
- ein Browser mit Custom-Elements- und ES-Module-Support

XTend laeuft im Kern als lokales ES-Module- und Web-Component-Framework. Fuer Entwicklung und Tests wird der lokale Dev Server genutzt.

```bash
npm run dev:local
```

Der Server liefert die App normalerweise unter `http://127.0.0.1:4173/` aus.

## Minimaler Host

Lege im Projekt eine HTML-Datei an, zum Beispiel `quick-start.html`:

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="xtend-preload" content="x-theme,x-section,x-button">
  <title>XTend Quick Start</title>
  <script
    type="module"
    src="/xtend-loader.js"
    data-manifest="/components/manifest.json">
  </script>
</head>
<body>
  <x-theme></x-theme>

  <main>
    <x-section layout="column" label="Quick Start">
      <h1>Hallo XTend</h1>
      <p>Diese App laeuft mit lokalen Web Components.</p>
      <x-button variant="primary">Loslegen</x-button>
    </x-section>
  </main>
</body>
</html>
```

Danach oeffnest du `http://127.0.0.1:4173/quick-start.html`.

## Was passiert hier?

- `xtend-loader.js` ist der kanonische lokale Loader.
- `components/manifest.json` ist die lokale Component Registry.
- Die Loader-StyleRegistry bringt Runtime-Critical CSS fuer Tokens, Skeletons und FOUC-Schutz selbst mit.
- `meta name="xtend-preload"` laedt die kritischen Komponenten frueh.
- `x-theme` initialisiert Theme-Unterstuetzung.
- `x-section` und `x-button` sind normale XTend Web Components.

Die App bleibt Vanilla HTML. XTend uebernimmt nur Loader, Komponenten, Styling- und Runtime-Kontrakte.

`/xtend.css` ist optional. Der Dateiname bleibt der kanonische XTend-Standard fuer Host-Theming und gezielte 3rd-Party-Anpassungen, ist aber nicht noetig, damit der Loader ohne ungestyltes Pop-In bootet.

## Optional: Routing

Wenn du eine SPA brauchst, fuegst du `x-router` und `x-link` hinzu:

```html
<meta name="xtend-preload" content="x-theme,x-link,x-router,x-section">

<nav>
  <x-link href="/home">Home</x-link>
  <x-link href="/about">About</x-link>
</nav>

<x-router mode="hash" document-title-template="{{title}} | Quick Start">
  <x-route path="/" component="x-section" title="Home"></x-route>
  <x-route path="/home" component="x-section" title="Home"></x-route>
  <x-route path="/about" component="x-section" title="About"></x-route>
</x-router>
```

Der Router schreibt pro Route den Seitentitel. Fuer SEO-nahe Apps koennen Titel und Meta-Daten auch aus RMT Route Records kommen.

## Optional: RMT-first denken

Fuer groessere Apps empfiehlt sich der RMT-first Pfad: Die Shell, Routes, Schedules und spaeter Komponentenbindungen werden deklarativ in einem `.rmt` Dokument beschrieben. XTend bleibt dann der UI-Adapter, XRouter der Routing-Adapter und XTendRMT der Scheduler.

Der lokale XTend-Dev-Server liefert `.rmt` mit dem nativen MIME-Type `application/vnd.xtendrmt.rmt+json` aus. Neue Apps sollten deshalb direkt `.rmt` verwenden; JSON-Endungen sind nur noch ein Kompatibilitaetsfallback fuer Hosts ohne eigene MIME-Konfiguration.

Minimaler Route Record:

```json
{
  "id": "home",
  "path": "/home",
  "router": "xtend.xrouter",
  "component": "page.home",
  "title": "Home",
  "documentTitle": "Home | Quick Start",
  "template": "home.shell",
  "schedule": "route.visible.render"
}
```

Fuer eine minimale native App-Shell kannst du in einer IDE mit RMT Snippets den Prefix `rmt-app` nutzen. Der Snippet-Katalog liegt in `tools/rmt-language/snippets/` und erzeugt direkt `.rmt` Authoring-Strukturen.

## RMT lokal pruefen

Der Standard-Gate fuer ein einzelnes Dokument ist:

```bash
xt rmt lint app.rmt
```

Fuer CI oder maschinenlesbare Auswertung:

```bash
xt rmt lint app.rmt --json
```

AI-Agenten koennen den Repair Report nutzen:

```bash
xt rmt lint app.rmt --agent
```

Der Agent Report enthaelt `repairPlan`, `fixOrder`, `confidence`, `impact`, `relatedDiagnostics` und erklaerte No-Ops fuer bewusst nicht automatisierte Reparaturen.

## Editor-Unterstuetzung

Der RMT Language Server startet lokal ueber:

```bash
node tools/rmt-language-server/server.js
```

Er liefert Diagnostics, Completion, Hover, Document Symbols, Definition und Code Actions. VS Code, JetBrains, Neovim und Helix koennen den Server ueber stdio anbinden. Die Setup-Hinweise stehen in [RMT Language Server und Editor Setup](./rmt-language-server.md).

Fuer den ersten Einstieg reicht die HTML-Variante. Sobald Routing, Scheduling, Hydration oder mehrere Frameworks zusammenspielen, ist `.rmt` mit Linter und LSP der stabilere Ausbaupfad.

## Naechste Schritte

- [XTend Loader](./xtend-loader.md)
- [Manifest-Format](./manifest.md)
- [Komponenten-Entwicklung](./components.md)
- [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md)
- [RMT-first XTend Apps](./rmt-first-xtend-apps.md)
- [RMT Linter und AI-Agent Repair Report](./rmt-linter.md)
- [RMT Language Server und Editor Setup](./rmt-language-server.md)
