# RMT DSL Authoring Polish

Der Contract `xtend.rmt.dsl-authoring-polish.v1` bereitet eine freundlichere RMT-DSL fuer XTend Component Shells vor. Er macht RMT Authoring kuerzer, ohne XTend in den RMT Kernel einzubetten.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json
```

## Warum dieses Paket existiert

Nach `WP-E12-12` besitzt XTend ein produktives Design-Token-Vokabular. `WP-E12-13` nutzt diese Tokens, damit Shells, Slots, Styles, A11y, Events, Commands, Hydration, Fabric-Lanes und XRouter-Routen in RMT einfacher beschrieben werden koennen.

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

```json
{
  "component": "settings.shell",
  "tag": "x-section",
  "shell": {
    "slot": {
      "header": "settings.header.template",
      "feedback": "feedback.toast"
    }
  },
  "style": {
    "theme": "dark",
    "density": "comfortable",
    "token": {
      "--xtend-surface": "var(--xtend-surface)",
      "--xtend-color-primary": "var(--xtend-color-primary)"
    }
  },
  "a11y": {
    "role": "region",
    "label": "Settings"
  },
  "hydrate": {
    "policy": "visible",
    "schedule": "component.visible.mount"
  },
  "lane": {
    "lane": "visible",
    "fiber": "component.render"
  }
}
```

Der normalisierte Output wird zu `components[]`, `templates[]` und `schedules[]`. RMT beschreibt die Struktur; XTend fuehrt die Component-Hydration aus.

## Routing-Sugar

Routen koennen spaeter authoringfreundlich als `route`, `link` und `outlet` beschrieben werden:

```json
{
  "route": "/settings",
  "component": "settings.shell",
  "link": {
    "label": "Settings",
    "href": "/settings"
  },
  "outlet": "primary"
}
```

Das wird zu `routes[]`, `components[]` und `templates[]` mit Adapter `xtend.xrouter`. XRouter bleibt Host Adapter, nicht RMT-Kernel-Abhaengigkeit.

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

Damit kann XTendRMT upstream freundlichere Parserfehler und Editor-Hints bauen, ohne die XTend Runtime zu importieren.

## Artefakte

- Contract: `development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md`
- Modul: `xtend-builder/typing/rmt-dsl-authoring-polish.js`
- Fixture: `tests/fixtures/rmt-dsl-authoring-polish.rmt`
- Suite: `tests/rmt/rmt_dsl_authoring_polish_suite.js`

## RC0 Adoption Update

Seit `WP-E12-15` beschreibt der [RC0 Adoption Guide](./rc0-adoption-guide.md), wie App Authors diese DSL-Polish-Schicht fuer Shell-first XTend Apps nutzen. Die wichtigste Migrationsregel bleibt: RMT darf XTend-Komponenten, XRouter-Routen und Content Slots konstruieren und schedulen, ohne XTend-Typen in den RMT Kernel einzubetten.
