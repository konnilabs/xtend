# ER-WP-25 - Screenreader-Signal-Contracts einfuehren

- Status: `completed`
- Contract: `xtend.enterprise.er-wp-25.screenreader-signals.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Architekturcontract: `development/XTend-Screenreader-Signal-Contract.md`
- Gate: `npm run test:screenreader-signals`

## Ziel

Screenreader-relevante UI-Signale werden als eigener Contract pruefbar. Feedback-, Form- und Overlay-Komponenten deklarieren dadurch explizit, welche Status-, Fehler- und Kontextsignale fuer Assistive Technology sichtbar sein muessen.

## Umgesetzte Artefakte

- `a11y/screenreader-signals.js`
- `tests/a11y/screenreader_signal_suite.js`
- `docs/screenreader-signals.md`
- `development/XTend-Screenreader-Signal-Contract.md`
- `xtend-builder/a11y/component-a11y-profile.js`
- `xtend-builder/templates/component/*`
- `components/xalert.js`
- `components/xtoast.js`
- `components/xmodal.js`
- `components/xdialog.js`
- `components/xform.js`
- `components/xinput.js`

## Implementierung

Der neue Contract `xtend.a11y.screenreader-signals.v1` erzeugt Signal Records unter `xtend.a11y.screenreader-signal.v1`. Er normalisiert Live-Regionen, leitet Status- und Errorregionen ab, validiert die Fabric-Mapping-Pflicht und bindet Announcements an:

- Lane: `a11y`
- Fiber: `a11y.announce`
- Schedule: `a11y.user-blocking.announce`

XTend-Scaffold generiert den Contract nun in Source, Manifest, Fixture, Docs und Types. Reale Feedback-, Form- und Overlay-Komponenten deklarieren statisch `xtendScreenreaderSignals`.

## Validierung

```bash
node scripts/run_xtend_tests.js screenreader-signals --json
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Ergebnis

`ER-WP-25` ist abgeschlossen. Screenreader-Signale sind ab sofort Bestandteil der A11y-by-design-Oberflaeche fuer XTend-Komponenten.

## Handoff

| Paket | Status | Grund |
|-------|--------|-------|
| `ER-WP-26` | completed | Reduced-Motion und High-Contrast setzen als A11y-Gate auf den Profil- und Screenreader-Contracts auf |
| `ER-WP-31` | next | Catalog Coverage kann Screenreader-Signal-Contract als Coverage-Dimension auswerten |
