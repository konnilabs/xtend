# WP-E13-12A - x-icon Universal Icon Adapter und lokale Lucide Bridge

- Status: Completed
- Datum: 8. Mai 2026
- Contract: `xtend.component.x-icon.iconography-adapter.v1`
- Einordnung: Additives RC1-Produktreife-Workpackage zwischen `WP-E13-12` und dem geplanten `WP-E13-13` Gate-Matrix-Handoff

## Ziel

XTend erhaelt mit `<x-icon>` eine normale, manifestbasierte Web Component fuer Ikonographie. Die Komponente ist framework-agnostisch, RMT-kompatibel, TypeScript-typisiert und bietet eine universelle Adapter-Schnittstelle fuer mehrere Icon-Quellen.

## Umgesetzt

| Artefakt | Ergebnis |
|----------|----------|
| `components/xicon.js` | Custom Element `x-icon` mit Registry, A11y-Modus, RMT-Metadata, Performance-Profil und xstate-Snapshot |
| `components/xicon.d.ts` | Public Types fuer Attribute, Events, Icon Packs, Registry und Element API |
| `components/icon-packs/core.js` | lokales XTend Core Icon Pack fuer Basis-Shells und Statussymbole |
| `components/icon-packs/lucide.js` | lokaler Lucide-kompatibler Adapter als Superset ohne CDN |
| `components/manifest.json` | Manifest-Key `x-icon` |
| `tests/components/xicon.component_suite.js` | Component-Level Contract Suite |
| `tests/components/fixtures/xicon.component.html` | Fixture mit lokalem Lucide-Pack, Custom-Pack und State-Sync |
| `docs/components/xicon.md` | Entwicklerdokumentation fuer Nutzung, Packs, API, RMT und A11y |
| `docs/index.php`, `docs/utils/pageloader.js` | Docs-App nutzt `x-icon` fuer Menu-Ikonographie |
| `docs/menu.json` | Docs-Menue enthaelt `components-xicon` |

## Architekturentscheidung

- Das interne `core` Pack bleibt klein, stabil und mit XTend gebundled.
- Der `lucide` Adapter ist ein lokaler Pack-Adapter und keine Runtime-CDN-Integration.
- Externe Quellen sind moeglich, aber nur als bewusst gesetztes `src` oder Host-registriertes Pack. XTend selbst fuehrt keinen Remote-Fetch als Default ein.
- RMT sieht `x-icon` als normales Custom Element mit `templateMode: 'dom_descriptor'`; der RMT Kernel importiert keine XTend- oder Icon-Vendor-Typen.
- Corporate-Designs koennen eigene Packs via `window.XTend.icons.register(pack)` oder `element.registerPack(pack)` registrieren.

## Akzeptanz

- `x-icon` ist in der Component Catalog Coverage `enterprise-ready`.
- Source, Docs, Component-Suite, Fixture, Public Types, A11y und Performance-Profil sind vorhanden.
- Die Docs-App gewinnt Ikonographie ohne Sonderlogik oder Monkeypatching.
- CDN-Abhaengigkeiten bleiben ausgeschlossen.

## Handoff

Das geplante `WP-E13-13` bleibt inhaltlich der RC1 Gate Matrix und dem CI-Handoff vorbehalten. Dieses Add-on-Paket erweitert nur die sichtbare Produktreife und muss in `WP-E13-13` als bereits erledigte Component-Coverage mitbewertet werden.
