# Epic18 Vendor Bugfixes

Epic18 haelt die generische RMT App Platform von frueheren Vendor- und Produktannahmen getrennt. Die Bugfix-Evidence bestaetigt, dass bestehende Komponenten stabilisiert werden, ohne neue Runtime-Kopplung in den RMT-Kernel einzufuehren.

## Komponenten

| Komponente | Handoff |
|------------|---------|
| `x-tooltip` | Overlay- und Focus-Verhalten bleibt stabil |
| `x-player` | Media Shell bleibt Host-Fall, nicht RMT-Kernel-Abhaengigkeit |
| `x-surface-window` | Surface Window bleibt owned Component |
| `x-side-panel` | Side Panel bleibt Shell-/Workspace-Primitive |
| `x-surface-manager-controller` | Controller bleibt Host-Adapter und nicht Kernel-Typ |

## Gate

```bash
node scripts/run_xtend_tests.js epic18-vendor-bugfix-smokes --json
```

Das Gate `epic18-vendor-bugfix-smokes` bleibt Teil des Epic18 Release Handoffs.
