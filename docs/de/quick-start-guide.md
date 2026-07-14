# Quick Start Guide

Starte lokal mit XTend Classic, lade Komponenten und wähle Maraca erst dann, wenn die Delivery-Anforderungen eine kompilierte RMT-App verlangen.

## Worum es geht

Dieser Artikel ist für Entwickler geschrieben, die XTend ohne internes Vorwissen produktiv einsetzen wollen.

## Öffentliche Bausteine

- Lokale Entwicklung ohne CDN.
- Bilinguale Dokumentation.
- Stabile öffentliche Einstiegspunkte.
- XTend Classic als unterstützter HTML-/JavaScript-first-Delivery-Pfad.
- Maraca als paralleler kompilierter Pfad für RMT, SSR/Hydration, PWA-Ausgabe und Build-Nachweise.
## Minimales HTML

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

## Empfohlener Ablauf

Starte den lokalen Server mit `npm run dev:local` und öffne eine kleine XTend-Classic-HTML-Seite. Classic verlangt keinen XTend-Application-Build, kann aber mit einem Host-Bundler, TypeScript, einem lokalen Server oder optionalem CLI-Tooling kombiniert werden. Wähle [XTend Maraca](./xtend-maraca.md), wenn aus `.rmt`-Quelltext ein optimiertes ESM-Bundle mit SSR/Hydration, PWA-Policy oder prüfbaren Build-Nachweisen werden soll – nicht allein, weil die Seite wächst.

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
- [XTend Classic](./xtend-classic.md)
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestrierung](./xtend-maraca-orchestration.md)
- [Enterprise Adoption](./enterprise-adoption.md)
