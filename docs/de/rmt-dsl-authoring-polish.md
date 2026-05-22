# RMT DSL Authoring Polish

Der Contract `xtend.rmt.dsl-authoring-polish.v1` bereitet eine freundlichere
RMT-DSL fuer XTend Component Shells vor. Er macht RMT Authoring kuerzer, ohne
XTend in den RMT Kernel einzubetten.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json
```

## Warum dieses Paket existiert

Nach `WP-E12-12` besitzt XTend ein produktives Design-Token-Vokabular.
`WP-E12-13` nutzt diese Tokens, damit Shells, Slots, Styles, A11y, Events,
Commands, Hydration, Fabric-Lanes und XRouter-Routen in RMT einfacher
beschrieben werden koennen.

RMT bleibt dabei host-neutral:

- `xtend.component` rendert und hydriert Components im Host.
- `xtend.xrouter` verbindet Route Records mit XRouter.
- `xtend.fabric` und Telemetry bleiben Adapter-/Hostdaten.
- `no-rmt-kernel-import-of-xtend-types` bleibt Pflicht.

## Authoring-Aliase

| Alias | Ziel |
|-------|------|
| `component` | XTend Component Record |
| `shell` | Shell-Zustand, Slots, Parts und Fokus |
| `slot` | Template-, Component- oder Text-Slots |
| `style` | Variant, Theme, Density, Tokens und Parts |
| `token` | produktive `--xtend-*` Tokens |
| `theme` | Theme Pack |
| `density` | Density Pack |
| `a11y` | Role, Label, Live Region, Keyboard und Announcements |
| `on` | Event zu Command |
| `command` | Command zu Schedule |
| `hydrate` | Hydration Policy |
| `lane` | Fabric Lane und Fiber |
| `route` | XRouter Route |
| `link` | XLink-kompatibler Link |
| `outlet` | Route Outlet im Template |

## Beispiel

```rmt
template settings.shell {
  state settings.theme type string initial "dark"
  state settings.density type string initial "comfortable"

  portal surface.root root "#settings-root" layer surface

  surface settings.shell kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-header {
        slot header hydrate settings.header.template
      }

      hydrate feedback-toast from endpoint xtendrmt.component.hydrate {
        slot feedback hydrate feedback.toast
      }
    }

    lane idle weight 20 {
      hydrate settings-shell-style from endpoint xtendrmt.component.hydrate {
        trust boundary "xtend.security.sanitizing-boundary.v1"
      }
    }
  }
}
```

Token-Aliase bleiben Teil des Contracts: produktive Styles referenzieren
weiterhin stabile Custom Properties wie `--xtend-surface` und
`--xtend-color-primary`, waehrend vNext die Struktur, Slots und Hydration
beschreibt.

Der normalisierte Output wird zu `components[]`, `templates[]` und
`schedules[]`. RMT beschreibt die Struktur; XTend fuehrt die
Component-Hydration aus.

## Routing-Sugar

Routen koennen authoringfreundlich als Surface-, Link- und Outlet-Struktur
beschrieben werden:

```rmt
template settings.routing {
  portal surface.root root "#app-root" layer surface

  surface settings.route kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-shell from endpoint xtendrmt.route.render
      hydrate settings-link from endpoint xtendrmt.component.hydrate
      slot outlet hydrate primary
    }

    on click target settings-link -> action route.navigate {
      payload href from "/settings"
    }
  }
}
```

Das wird zu `routes[]`, `components[]` und `templates[]` mit Adapter
`xtend.xrouter`. XRouter bleibt Host Adapter, nicht RMT-Kernel-Abhaengigkeit.

## Diagnostik

Der Polish-Plan definiert diese Diagnosecodes:

- `rmt.dsl.alias.unknown`
- `rmt.dsl.alias.required-field-missing`
- `rmt.dsl.token.unknown`
- `rmt.dsl.route.target-unresolved`
- `rmt.dsl.link.route-unresolved`
- `rmt.dsl.slot.target-unresolved`
- `rmt.dsl.schedule.unresolved`
- `rmt.dsl.inline-runtime-code-refused`
- `rmt.dsl.kernel-boundary.refused`

Damit kann XTendRMT upstream freundlichere Parserfehler und Editor-Hints bauen,
ohne die XTend Runtime zu importieren.

## Artefakte

- Contract: `development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md`
- Modul: `xtend-builder/typing/rmt-dsl-authoring-polish.js`
- Fixture: `tests/fixtures/rmt-dsl-authoring-polish.rmt`
- Suite: `tests/rmt/rmt_dsl_authoring_polish_suite.js`

## RC0 Adoption Update

Seit `WP-E12-15` beschreibt der [RC0 Adoption Guide](./rc0-adoption-guide.md),
wie App Authors diese DSL-Polish-Schicht fuer Shell-first XTend Apps nutzen.
Die wichtigste Migrationsregel bleibt: RMT darf XTend-Komponenten,
XRouter-Routen und Content Slots konstruieren und schedulen, ohne XTend-Typen
in den RMT Kernel einzubetten.
