# XScaler Luecken und Drift Closure Plan

- Status: `implemented-plan-target`
- Datum: 2026-07-07
- Scope: erste interne XScaler-Contract-Welle, harte Drift-Gates, keine Public Package API

## Ziel

XScaler wird intern kanonisiert, ohne den RMT-Kernel in Remote-Code-Ausfuehrung zu ziehen. Preflight bleibt eine Daten- und Policy-Entscheidung; ATC bleibt Handoff- und Lifecycle-Vertrag. Drifts werden direkt ueber lokale und CI/CD-Gates blockiert.

## Umsetzungspunkte

- Internes Contract-Modul `tools/rmt-language/xscaler-protocol.js` mit Typen, Schema-Konstanten, Factories und Preflight-Evaluator.
- Kanonische Preflight-Response-Shape: `accepted` ist fuehrend, `ok` bleibt Compatibility-Alias und muss identisch sein.
- Negative Fixtures fuer origin blocked, integrity missing, SSR network denied, fallback missing, XTension denied und capability mismatch.
- Testbench-Schemas werden auf die kanonische XScaler-Familie zurueckgefuehrt.
- XSurface Shard bleibt `xscaler-atc-compatible`, deklariert aber die gemeinsame XScaler-ATC-Handoff-Schema-Referenz.
- Neues `xscaler-source-to-sea` Gate prueft Remote Manifest -> XScaler Preflight -> XSurface ATC Handoff -> Testbench-Evidence.
- PR- und Release-Gates fuehren XScaler Protocol und Source-to-Sea blockierend aus.

## Acceptance

- `npm run test:xscaler-protocol` prueft Modul, Typen, Fixtures, Docs, Testbench-Drift und CI-Registrierung.
- `npm run test:xscaler-source-to-sea` prueft den deterministischen End-to-End-Vertrag ohne Browserpflicht.
- `npm run test:xsurface-shard` bestaetigt ATC-Kompatibilitaet und Kernel-No-Remote-Execution.
- Alte Testbench-Schema-Strings fuer `protocol-lazy-preflight` und `atc-lazy-surface` duerfen nicht mehr vorkommen.
