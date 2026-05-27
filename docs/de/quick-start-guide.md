# Quick Start Guide

Starte lokal, lade Komponenten und erweitere die Seite schrittweise zu einer RMT App Shell.

## Worum es geht

Dieser Artikel ist für Entwickler geschrieben, die XTend ohne internes Vorwissen produktiv einsetzen wollen.

## Öffentliche Bausteine

- Lokale Entwicklung ohne CDN.
- Bilinguale Dokumentation.
- Stabile öffentliche Einstiegspunkte.
- Maraca als späterer Bundle- und Orchestrierungspfad für echte RMT Apps.
## Minimales HTML

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

## Empfohlener Ablauf

Starte den lokalen Server mit `npm run dev:local`, öffne eine kleine HTML-Seite und verschiebe wiederkehrende App-Struktur später in RMT. Sobald State, Actions oder Surface-Wechsel Teil des Produkts werden, ist [XTend Maraca](./xtend-maraca.md) der nächste produktive Pfad: Aus `app.rmt` entsteht ein ESM-Bundle statt eine Seite, die zur Laufzeit nur über den Loader zusammengesetzt wird.

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
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestrierung](./xtend-maraca-orchestration.md)
- [Enterprise Adoption](./enterprise-adoption.md)

## Öffentlicher Vertrag

Quick Start Guide ist der öffentliche Orientierung-Vertrag für `docs/de/quick-start-guide.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: Einstiegsrouten, lokale Docs-Navigation und die kleinsten lauffähigen Befehle.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/quick-start-guide.md`
- `docs/menu.json`
- `package.json`
- `README.md`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`

Namen:
- `docs/de/quick-start-guide.md`
- `docs/menu.json`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `docs/dev-router.php`
- `docs/de/xtend-maraca.md`
- `docs/de/xtend-maraca-orchestration.md`
- `package.json`
- `README.md`
- `xtend-loader.js`
- `api.js`
- `npm run dev:local`

Befehle:
- `xt rmt lint app.rmt`
- `xt rmt lint app.rmt --json`
- `xt rmt lint app.rmt --agent`
- `node tools/rmt-language-server/server.js`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Einstiegspfade auseinanderlaufen, prüfe zuerst `docs/menu.json`, die lokalen Links und den Befehl im Prüfblock.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
