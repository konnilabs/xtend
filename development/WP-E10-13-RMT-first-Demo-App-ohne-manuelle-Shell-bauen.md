# WP-E10-13 - RMT-first Demo-App ohne manuelle Shell bauen

Status: `completed`

Epic: `EPIC-10`

Contract: `xtend.epic10.rmt-first-demo-app.v1`

## Ziel

Eine produktive Demo-App zeigt, dass XTend Apps vollstaendig aus einer `.rmt` App-Struktur entstehen koennen. Die Hostseite darf keine manuelle App-Shell enthalten; RMT rendert Shell, Routes, Templates, Schedules und Komponentenzuordnung.

## Umsetzung

- `xtendrmt/rmt-first-demo-app.rmt` definiert App Shell, Routen, Templates, Schedules, Adapter und Fabric/Lane-Metadaten.
- `xtendrmt-rmt-first-demo.html` stellt nur einen RMT Root und lokale Runtime-Artefakte bereit.
- `xtendrmt/rmt-first-demo-app.js` rendert generisch `dom_descriptor` Templates aus RMT Records und vermeidet `innerHTML`.
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html` validiert den Shell-first Pfad browsernah.
- `tests/rmt/rmt_first_demo_app_suite.js` prueft den kompletten Contract statisch und ueber RMT Runtime-Normalisierung.
- `docs/rmt-first-demo-app.md` dokumentiert den Entwicklerpfad.

## Akzeptanzkriterien

- Die Demo-App rendert aus `app.shell.template`.
- Der Host enthaelt keine statischen `x-section` oder `x-router` Shell-Elemente.
- Die Runtime materialisiert DOM ueber `document.createElement`, `replaceChildren` und Records, nicht ueber String-HTML.
- Routen werden aus RMT `routes` abgeleitet.
- Fabric Lane und Schedule Metadata sind im DOM sichtbar.
- Alle neun neuen P0-Komponenten aus Epic 10 sind in der Demo referenziert.
- Der Browser-Smoke enthaelt den Contract `xtend.epic10.rmt-first-demo-app.browser-smoke.v1`.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

## Ergebnis

WP-E10-13 ist abgeschlossen. Die Demo belegt den ersten vollstaendigen RMT-first XTend App-Pfad ohne manuelle Shell-Sonderlogik. `WP-E10-14` kann nun bestehende priorisierte Komponenten in dieselbe RMT/Fabric-Metadata-Linie migrieren.
