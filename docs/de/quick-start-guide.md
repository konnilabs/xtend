# Quick Start Guide

Starte lokal, lade Komponenten und erweitere die Seite schrittweise zu einer RMT App Shell.

## Worum es geht

Dieser Artikel ist für Entwickler geschrieben, die XTend ohne internes Vorwissen produktiv einsetzen wollen.

## Öffentliche Bausteine

- Lokale Entwicklung ohne CDN.
- Bilinguale Dokumentation.
- Stabile öffentliche Einstiegspunkte.
## Minimales HTML

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

## Empfohlener Ablauf

Starte den lokalen Server mit `npm run dev:local`, öffne eine kleine HTML-Seite und verschiebe wiederkehrende App-Struktur später in RMT.

## RMT prüfen

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
```

Nutze das Snippet `rmt-app`, wenn du eine neue Shell-Datei in deinem Editor
beginnst. Danach helfen [RMT Linter](./rmt-linter.md) und
[RMT Language Server](./rmt-language-server.md) bei Diagnose, Completion und
Code Actions.

Für serverseitiges Rendering stehen der [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md)
und der [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) bereit.

## Nächste Schritte

- [Über XTend](./about.md)
- [Enterprise Adoption](./enterprise-adoption.md)
