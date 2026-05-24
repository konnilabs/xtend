# XTend Developer Center

Willkommen im XTend Developer Center. Diese Dokumentation erklärt XTend für Entwickler, die Web Components, RMT App Shells, lokale Module und SSR in eigenen Produkten einsetzen möchten.

## Lernpfade

| Ziel | Start |
| --- | --- |
| Erste lokale Seite | [Quick Start Guide](./quick-start-guide.md) |
| RMT verstehen | [XTendRMT Überblick](./xtendrmt-overview.md) |
| Komponenten nutzen | [Komponenten-Entwicklung](./components.md) |
| SSR anbinden | [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md), [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) |
| Editor und Linting | [RMT Linter](./rmt-linter.md), [RMT Language Server](./rmt-language-server.md) |

## Produktmodell

XTend UI liefert die sichtbaren Web Components. XTendRMT beschreibt App Shells, State, Actions, Events und Surfaces. Fabric koordiniert Runtime-Arbeit, Lanes und Telemetrie. Der Loader verbindet alles lokal und ohne CDN.

## Tooling

```bash
npm run dev:local
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-tooling-docs --json
```

Der Tooling-Pfad verwendet das öffentliche Schema `xtend.rmt.tooling-docs.v1`.

## Nächste Schritte

- [Quick Start Guide](./quick-start-guide.md)
- [Best Practices](./best-practices.md)
- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Changelog](./changelog.md)
