# ER-WP-23 - Scaffold-Blueprints um A11y-Pflichten erweitern

- Status: `completed`
- Datum: 5. Mai 2026
- Contract: `xtend.enterprise.er-wp-23.scaffold-a11y-profile.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Scaffold-Plan: `development/XTend-Scaffold-A11y-Profile-Plan.md`
- Abhaengigkeit: `ER-WP-22`

## Ziel

Neue XTend-Komponenten muessen A11y-by-design bereits im Scaffold-Dry-Run erhalten. Das Paket bindet den A11y Component Contract an Blueprint, Plan, Templates, Fixtures, Typen, Manifest und Reference-Gates.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| A11y Plan | `xtend-builder/a11y/component-a11y-profile.js` mit `xtend.scaffold.a11y-profile-plan.v1` |
| Blueprint | `xtend-builder/blueprints/component-blueprint.contract.js` verlangt A11y-Profil, Test Contract und Fixture-Pflichten |
| Component Plan | `xtend-builder/generators/component-plan.js` gibt `a11yProfile` aus |
| Component Files | `xtend-builder/generators/component-files.js` reicht `wiring.a11y` in alle Templates durch |
| Source Template | `xtendScaffoldA11yProfile`, `aria-label`, Rolle und Fokus-Outline |
| Docs Template | Abschnitt `A11y-Profil`, Keyboard, ARIA-State, Screenreader, Motion, Contrast und Gates |
| Test Template | Assertions fuer Profil, Rolle, Name, Test Contract und A11y-Hydration |
| Fixture Template | `aria-label` sowie Rollen-/Name-/Profil-Ergebnis |
| Types Template | `X<Component>A11yProfile` und A11y-Key-Unionen |
| Manifest Template | `a11yProfile` im Patch-Plan |

## Contract IDs

- `xtend.a11y.component-contract.v1`
- `xtend.a11y.profile.v1`
- `xtend.a11y.test-contract.v1`
- `xtend.scaffold.a11y-profile-plan.v1`
- `xtend.enterprise.er-wp-23.scaffold-a11y-profile.v1`

## Definition of Done

- Scaffold-Dry-Runs erzeugen ein A11y-Profil.
- Component Source enthaelt `xtendScaffoldA11yProfile`.
- Docs enthalten den Abschnitt `A11y-Profil`.
- Fixtures enthalten `aria-label` und melden A11y-Daten im Hydration-Ergebnis.
- Tests referenzieren `xtend.a11y.test-contract.v1`.
- Manifest-Patch-Plan enthaelt `a11yProfile`.
- Reference-Gates pruefen A11y-Scaffold-Pflichten.

## Validierung

```bash
node xtend-builder/scaffold.js component-files --tag x-example --profile display --feature state --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Handoff

`ER-WP-24` ist nach Abschluss dieses Pakets startbereit. Dort werden browsernahe Fokus- und Keyboard-Smokes ausgebaut, die auf den hier generierten A11y-Profilen aufsetzen.
