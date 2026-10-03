# Quick Start Guide

Starte mit benannten ESM-Imports, nutze XTend Classic für buildloses HTML und wähle Maraca, wenn die Delivery-Anforderungen eine kompilierte RMT-App verlangen.

## Worum es geht

Dieser Artikel ist für Entwickler geschrieben, die XTend ohne internes Vorwissen produktiv einsetzen wollen.

## Öffentliche Bausteine

- Lokale Entwicklung ohne CDN.
- Bilinguale Dokumentation.
- Stabile öffentliche Einstiegspunkte.
- Die ESM-Registry am Paket-Root für Browser-, Bundler- und SSR-Apps.
- XTend Classic als unterstützter HTML-/JavaScript-first-Delivery-Pfad.
- Maraca als paralleler kompilierter Pfad für RMT, SSR/Hydration, PWA-Ausgabe und Build-Nachweise.
## Minimale ESM-App

```js
import { readyXTend, schedule, render, createApp } from '@ccslabs/xtend';

await readyXTend();
const app = createApp();
schedule(() => render(document.querySelector('#app'), {
  type: 'element',
  tag: 'h1',
  children: [{ type: 'text', text: 'Hello XTend' }]
}));
```

Der Paket-Root-Import ist side-effect-kontrolliert und bootet den Classic-Loader nicht. Die [ESM-Registry](./esm-registry.md) beschreibt Lifecycle-Konfiguration, SSR und alle Aliase.

## Minimales Classic-HTML

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

## Empfohlener Ablauf

Nutze die ESM-Registry, wenn deine App bereits einen JavaScript- oder TypeScript-Modulgraphen besitzt. Starte den lokalen Server mit `npm run dev:local` und nutze XTend Classic, wenn der Host buildlos und HTML-first bleiben soll. Wähle [XTend Maraca](./xtend-maraca.md), wenn aus `.rmt`-Quelltext ein optimiertes ESM-Bundle mit SSR/Hydration, PWA-Policy oder prüfbaren Build-Nachweisen werden soll – nicht allein, weil die Seite wächst.

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
- [ESM-Registry](./esm-registry.md)
- [XTend Classic](./xtend-classic.md)
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestrierung](./xtend-maraca-orchestration.md)
- [Enterprise Adoption](./enterprise-adoption.md)

## 0.8.0: lokale Maraca-App und Seitenhosts

Node >=24 ist die Paketvoraussetzung. Im Framework-Checkout startet das native Beispiel ohne SSR oder Resumability über einen lokalen HTTP-Server:

```sh
node xtend-builder/bin/xt maraca build demos/xtendrmt/maraca-fastpass/app.rmt --out .xtend-build/maraca/fastpass --orchestration strict --kernel strict --hydration auto --css external
node xtend-builder/bin/xt serve --root .xtend-build/maraca/fastpass
```

[FastPass](./maraca-fastpass-abort-boundary.md) priorisiert Shell-Aktionen. Für serverseitige Seiten, Formulare und persistente Layouts nutze die [Node-/Laravel-Seitenlaufzeit](./ssr-pages.md). Beim Upgrade zuerst die [0.8-Migration](./rmt-kernel-0-8-migration.md) prüfen und vorhandene Bundles neu bauen.
