# Quick Start Guide

Dieser Guide bringt dich von einer lokalen XTend-Seite zu einer kleinen
RMT-vNext-App-Shell. Der schnellste Einstieg bleibt HTML mit Web Components;
der empfohlene Ausbaupfad fuer Apps ist RMT-first.

## Voraussetzungen

- Node.js 18 oder neuer
- ein lokaler Checkout des XTend-Repositories
- ein Browser mit Custom-Elements- und ES-Module-Support

Starte den lokalen Dev Server:

```bash
npm run dev:local
```

Der Server liefert die App normalerweise unter `http://127.0.0.1:4173/` aus.

## 1. Minimalen Host starten

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

Oeffne danach `http://127.0.0.1:4173/quick-start.html`.

Was passiert hier?

- `xtend-loader.js` ist der lokale Loader.
- `components/manifest.json` ist die Component Registry.
- `meta name="xtend-preload"` laedt kritische Komponenten frueh.
- `x-theme`, `x-section` und `x-button` sind normale XTend Web Components.
- `/xtend.css` ist optional und dient Host-Theming.

## 2. App Shell in RMT vNext beschreiben

Wenn aus der Seite eine App wird, soll die Shell in RMT liegen. RMT vNext
beschreibt UI-Struktur, State, Actions, Events, Surfaces und Scheduling in
einer lesbaren `.rmt` Quelle.

Lege zum Beispiel `app.rmt` an:

```rmt
template quickstart.app {
  state counter type number initial 0

  selector counterLabel from state counter {
    output text
  }

  action increment {
    input amount number
    reduce state.counter = input.amount
    emit counter.changed with action increment
  }

  portal app root "#app-root" layer surface

  surface home kind page component x-section {
    source state counter
    portal app
    key route.path

    lane visible weight 80 {
      hydrate x-section from state counter
    }

    on click target button.primary -> action increment {
      payload amount from 1
    }
  }
}
```

Dieses Dokument ist kein Runtime-Import und keine Framework-Komponente. Es ist
die App-Beschreibung: Der Compiler erzeugt daraus Core-/Kernel-Records, die
Host-Adapter mit XTend Components, XRouter und Fabric verbinden koennen.

## 3. RMT lokal pruefen

Der Standardcheck fuer ein einzelnes Dokument ist:

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

Der Agent Report enthaelt `repairPlan`, `fixOrder`, `confidence`, `impact`,
`relatedDiagnostics` und erklaerte No-Ops fuer bewusst nicht automatisierte
Reparaturen.

## 4. Editor-Unterstuetzung aktivieren

Der RMT Language Server startet lokal ueber:

```bash
node tools/rmt-language-server/server.js
```

Er liefert Diagnostics, Completion, Hover, Document Symbols, Definition und
Code Actions. VS Code, JetBrains, Neovim und Helix koennen den Server ueber
stdio anbinden. Fuer eine minimale native App-Shell kannst du in einer IDE mit
RMT Snippets den Prefix `rmt-app` nutzen; fuer vNext-Primitives ist
`rmt-vnext-primitive-shell` der schnellste Start.

## Naechste Schritte

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [XTendRMT Developer Overview](./xtendrmt-overview.md)
- [RMT Linter und AI-Agent Repair Report](./rmt-linter.md)
- [RMT Language Server und Editor Setup](./rmt-language-server.md)
- [XTend Loader](./xtend-loader.md)
- [Manifest-Format](./manifest.md)
- [Komponenten-Entwicklung](./components.md)
