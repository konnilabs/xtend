# XTend Scaffold Performance Profile

Seit `ER-WP-21` erzeugt der Scaffold fuer neue Komponenten ein Performance-Profil nach `xtend.performance.component-profile.v1`. `WP-E11-05` hebt diese Profile zusaetzlich in den Component-UX-Performance-Contract `xtend.component.ux-performance.v1`, damit Shell, Hydration, Interaktion, A11y, Styling, RMT und Fabric dieselbe Budgetsprache nutzen.

## Artefakte

| Artefakt | Contract |
|----------|----------|
| `component-performance-profile.js` | `xtend.performance.component-profile.v1` |
| `component-ux-performance-contract.js` | `xtend.component.ux-performance.v1` |
| Scaffold Policy | `xtend.scaffold.performance-policy.v1` |
| Budget Matrix | `xtend.performance.budget-matrix.v1` |
| Measurement Contract | `xtend.performance.measurement.v1` |
| Regression Gate | `xtend.performance.regression-gate.v1` |
| Hydration Policy | `xtend.fabric.hydration-policy.v1` |

## Scaffold-Bindung

Der Generator liefert `xtendScaffoldPerformanceProfile` fuer Source, `X<Component>PerformanceProfile` fuer Types, `performanceProfile` im Manifest-Patch-Plan sowie die Docs-Abschnitte `Performance-Profil` und `Performance-Regeln`.

Die offizielle Autorenregel liegt in `docs/performance.md`.

## UX-Performance-Bindung

Der Epic-11-Contract liegt in `development/XTend-Component-UX-Performance-Profile.md`. Die lokale Suite ist:

```bash
node scripts/run_xtend_tests.js component-ux-performance --json
```

Der Contract dupliziert keine Messlogik. Er verbindet `xtend.performance.component-profile.v1`, `xtend.performance.budget-matrix.v1`, `xtend.performance.measurement.v1`, `xtend.performance.regression-gate.v1` und `xtend.fabric.hydration-policy.v1` zu einer Component-UX-Pflicht.
