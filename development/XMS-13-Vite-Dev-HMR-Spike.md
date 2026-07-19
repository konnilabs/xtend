# XMS-13 – Vite Dev-/HMR-Provider-Spike

- Status: Deferred P1
- Voraussetzung: XMS-01 bis XMS-12 releasefähig; unterstützte Node-Mindestversion entschieden
- Produktionsbundler: unverändert TypeScript-Program + Rollup/Terser
- Nicht im Scope: Vite als Produktionsbundler, ein weiteres Node-Upgrade über die Stage-A-Floor `>=24`, Änderung des Service-/Wire-Vertrags

## Hypothese

Ein optionaler Vite-Provider kann den lokalen Feedbackzyklus für `app.rmt`, `services.ts` und CSS verkürzen, wenn er ausschließlich Dev-Server/HMR bereitstellt und dieselben Inspect-, Strict-, Zielgraph- und Secret-Barrieren wie der eingebaute TypeScript-Provider verwendet.

Vite 7 bleibt außerhalb des MVP, obwohl die Stage-A-Floor nun Node 24 ist. Der Spike darf diese Mindestversion weder weiter erhöhen noch Vite in den produktiven Pfad ziehen.

## Zu klärende Fragen

1. Kann der Provider die Lifecycle-Grenze `inspect → plan → build → report → dispose` ohne Sonderpfad implementieren?
2. Welche Änderungen können sicher hot-reloaded werden: CSS, lokale Handler, Server-Proxies, RMT-Verträge oder nur ein Full Reload?
3. Bleiben Browser- und Server-Modulgraph strikt getrennt, einschließlich `node:`-, Server-Entry- und Environment-Barrieren?
4. Wie werden laufende Invocations und Streams vor einem HMR-Swap abgebrochen und wie wird ein doppelter Handler verhindert?
5. Sind Diagnostikcodes, Source Ranges, Manifestfingerprints und Secret-Redaktion bitgleich beziehungsweise semantisch gleichwertig zum Produktionsprovider?

## Versuchsaufbau

- Eine generierte neutrale RMT-App mit lokalem Query, serverseitigem Command und Stream.
- Änderungen an CSS, Handlerimplementierung, Service-ID, Modus und RMT-Contract.
- Laufender Stream während Module-Swap und Full Reload.
- Negative Browserimporte aus `node:` und `server-services.ts` sowie ein Sentinel-Secret.
- Messung von Cold Start, Warm Rebuild, HMR-Latenz, vollständigem Reload und Dispose-Zeit.

## Harte Gates

- Vite startet nur über einen expliziten Dev-Provider; `maraca build` bleibt Rollup/Terser.
- RMT-/TypeScript-Contractänderungen erzwingen vor Aktivierung eine erneute Manifestvalidierung.
- Jede ersetzte Registry wird vollständig disposed; keine alte Invocation darf danach committen.
- Der Sentinel erscheint weder im Browsergraph noch in HMR-Payloads, Sourcemaps oder Diagnoseberichten.
- Ein Projekt ohne Vite-Abhängigkeit baut und testet unverändert.
- Der Spike liefert eine dokumentierte Node-Kompatibilitätsmatrix und eine Go/No-Go-Entscheidung; er ändert die Node-Floor nicht implizit.

## Exit

`go` ist nur zulässig, wenn der Dev-Provider messbar schneller ist, keine zweite Produktionssemantik einführt und alle Security-/Lifecycle-Gates wiederverwendet. Andernfalls bleibt der eingebaute Watch-/Buildpfad kanonisch und der Spike wird ohne Runtime-Schulden geschlossen.
