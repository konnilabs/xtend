# WP-E15-14 - Streaming und Incremental Rendering Contract vorbereiten

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS4`
- Prioritaet: `P1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-streaming --json`
- Contract: `xtend.rmt.vnext-streaming-contract.v1`

## Ziel

WP-E15-14 integriert Streaming, Chunked Hydration und Incremental Rendering als eigene Contract-Schicht ueber dem vNext Core. Stream Operationen behalten den deklarativen Charakter der Sprache und machen Scheduler-, Data-Source- und Security-Fakten explizit.

## Umgesetzte Artefakte

- `tools/rmt-language/vnext-streaming.js`
  - Streaming Contract
  - Stream Operation Records
  - Capability Mapping fuer SSR, SSE, Worker und Hydration
  - Chunk-Metadaten aus Scheduler Lanes
  - Backpressure-, Completion- und Error-Path-Fakten
  - Security-Posture-Snapshot pro Stream Record
  - host-neutrale Runtime Probe
- `tests/rmt-language/fixtures/vnext-streaming-progressive.rmt`
  - progressive Composition mit SSR-, SSE-, Worker- und Chunked-Hydration-Pfaden
- `tests/rmt-language/rmt_vnext_streaming_suite.js`
  - Contract-, Fixture-, Negativ- und Runtime-Probe-Tests
- `development/XTendRMT-vNext-Streaming-Contract.md`

## Contract-Entscheidungen

- `stream ... from endpoint ...` wird als SSR/Incremental-Rendering-Variante modelliert.
- `stream ... from sse ...` nutzt die Capability `stream.sse.incremental`.
- `stream ... from worker ...` nutzt die Capability `stream.worker.incremental`.
- `hydrate ... from ...` erzeugt Chunked-Hydration-Records, wenn eine Data Source vorhanden ist.
- Chunking und Backpressure werden aus dem Scheduler Contract gelesen und nicht im Stream Contract neu erfunden.
- Unsichere Stream Records muessen eine sichtbare Security Posture aus dem Security Policy Contract tragen.
- Completion-Signale und Fehlerpfade sind pro Variante Pflicht.
- Die Runtime Probe bleibt host-neutral und DOM-unabhaengig.

## Definition of Done

- Streaming ist deklarativ beschreibbar.
- Backpressure bleibt pro Stream Record sichtbar.
- Security Policy bleibt pro unsicherem Stream Record sichtbar.
- SSR-, SSE-, Worker- und Hydration-Varianten sind als Capabilities pruefbar.
- `package.json` exportiert `./rmt-language/vnext-streaming` und `npm run test:rmt-vnext-streaming`.
- `scripts/run_xtend_tests.js` kennt `rmt-vnext-streaming`.
- Der Gate prueft positive Contract-Ausgabe, fehlende Quellen, fehlende Data Sources, unsupported Kinds, Scheduler-Mapping, Backpressure, Security, Completion, Error Paths, Capabilities und Host-Neutralitaet.

## Gate-Ergebnis

Bestanden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-streaming --json
```

- Ergebnis: `passed`
- Checks: `86`
- Suiten: `1`
