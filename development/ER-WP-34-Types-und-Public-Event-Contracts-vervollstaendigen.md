# ER-WP-34 - Types und Public Event Contracts vervollstaendigen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-34.public-component-types.v1`
- Coverage Matrix: `xtend.catalog.component-coverage-matrix.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`

## Ziel

ER-WP-34 vervollstaendigt die Public Types und Event Contracts fuer die priorisierten Komponenten aus `ER-WP-33`. Die Component-Suites und Fixtures haben bereits die Runtime-Oberflaechen sichtbar gemacht; dieses Paket macht dieselben Oberflaechen fuer TypeScript-, Editor- und Enterprise-Integrationskontexte greifbar.

## Scope

- Public `.d.ts` Dateien fuer die 18 priorisierten P0/P1- und Pilot-Komponenten anlegen
- Eventnamen und `CustomEvent` Detail-Payloads typisieren
- Attribute, Properties und wichtige Methoden typisieren
- Custom Elements ueber `HTMLElementTagNameMap` sichtbar machen
- `x-theme` als Core-Modul ueber `window.XTend.theme`, `window.XTheme` und Document-Events typisieren
- Component-Suite um einen Public-Type-Gate erweitern
- Scaffold-Type-Template fuer neue Komponenten um den Public-Event-Contract ergaenzen
- Component Catalog Coverage, Roadmap und Docs auf den neuen Stand ziehen

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `components/xtend-public-types.d.ts` | gemeinsamer Public-Type- und Event-Contract-Baustein |
| `components/xalert.d.ts` | Alert Attribute, Events und Detail Payloads |
| `components/xtoast.d.ts` | Toast Events und Dismiss-Details |
| `components/xmodal.d.ts` | Modal Lifecycle- und Action-Events |
| `components/xrouter.d.ts` | XRouter Route-, RMT-Route- und Registration-Events |
| `components/xlink.d.ts` | Navigation Events und Router-Signal-Details |
| `components/xinput.d.ts` | Form-associated Input Events und Validierungs-API |
| `components/xform.d.ts` | Submit-, Invalid-, Reset- und FormData-Contracts |
| `components/xtabs.d.ts` | Tab-Selection und `x-tab`/`x-tabs` Tag-Mapping |
| `components/xdialog.d.ts` | Dialog Lifecycle-Events und Open/Close API |
| `components/xlightbox.d.ts` | Lightbox Open/Close Events und Helper API |
| `components/xcalendar.d.ts` | Date-Select Event und Value API |
| `components/xwriter.d.ts` | Writer Change/Save/Error/Autosave/Export Events |
| `components/xtheme.d.ts` | Theme Manager, Document Events und Window-Facades |
| `components/xbutton.d.ts` | Button Loading- und Forwarded-Event-Contracts |
| `components/xspinner.d.ts` | Spinner Started/Stopped/Pause/Resume Events |
| `components/xmenu.d.ts` | Menu Item Event Contract |
| `components/xsummary.d.ts` | Summary Open/Close Events und Toggle API |
| `components/xplayer.d.ts` | Player Playback-, Fullscreen-, PIP-, Caption- und Mute-Events |
| `tests/components/component_public_types_suite.js` | Gate fuer Public Types, Eventnamen, Detail-Typen, Attribute und Mappings |
| `xtend-builder/templates/component/types.template.d.ts` | Scaffold-Template erzeugt kuenftig Public Event Contract Typen |
| `docs/public-component-types.md` | Entwicklerdokumentation fuer Public Types |
| `package.json` | Package-Metadaten fuer `componentPublicTypes` |

## Ergebnis

Aktueller Snapshot nach ER-WP-34:

| Dimension | Covered | Missing |
|-----------|---------|---------|
| `source` | 28 | 0 |
| `docs` | 28 | 0 |
| `componentSuite` | 18 | 10 |
| `fixture` | 18 | 10 |
| `types` | 18 | 10 |
| `a11y` | 24 | 4 |
| `performance` | 0 | 28 |

Statusverteilung:

| Status | Anzahl |
|--------|--------|
| `documented` | 10 |
| `contract-gated` | 2 |
| `typed-contract-gated` | 16 |

Die 16 priorisierten Komponenten mit A11y-Erkennung sind nun `typed-contract-gated`. `x-theme` und `x-writer` besitzen ebenfalls Public Types, bleiben aber wegen offener A11y-Erkennung `contract-gated`. Die verbleibenden Type-Gaps liegen bei Long-Tail-/Utility-/Infrastructure-Komponenten und werden zusammen mit Browser- und Performance-Regression an `ER-WP-35` uebergeben.

## Validierung

```bash
node scripts/run_xtend_tests.js components
node scripts/run_xtend_tests.js catalog-coverage
node scripts/run_xtend_tests.js references
npm test
```

## Handoff

| Paket | Status nach ER-WP-34 | Aufgabe |
|-------|----------------------|---------|
| `ER-WP-35` | `completed` | Long-Tail-Suites, visuelle/browsernahe Regression, A11y-Nacharbeit und Performance-Profile priorisieren |
| `ER-WP-36` | `completed` | CI Workflow fuer Default Gates anlegen |
| `ER-WP-37` | `completed` | schnelle PR-Gates und volle Release-Gates trennen |
| `ER-WP-38` | `completed` | Release Checklist und SemVer Policy nach CI-Gate vorbereitet |
| `ER-WP-39` | `completed` | Enterprise Adoption Guide nimmt Types und Event Contracts als Betriebsstandard auf |
| `ER-WP-40` | `completed` | Docs-App RMT Pilot nutzt Types/Event Contracts fuer Runtime-Beispiele |

## Abschlussnotiz

`ER-WP-34` ist abgeschlossen. XTend hat fuer die priorisierten Runtime-Oberflaechen nun nicht nur lokale Component-Suites und Fixtures, sondern auch explizite Public Types und Event-Detail-Contracts. Der naechste Produktreife-Schritt verschiebt sich damit auf sichtbare Regression, Long-Tail-Abdeckung, A11y-Nacharbeit fuer `x-theme`/`x-writer` und Performance-Profile.
