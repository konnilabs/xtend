# RMT App Platform Migration Guide

Dieser Guide beschreibt die Migration weg von manuellen HTML-Hosts hin zur generischen RMT App Platform.

## Zielpfad

| Altpfad | Zielpfad |
|---------|----------|
| manuelles `innerHTML` | DOM Descriptor Records |
| implizite Host-Payloads | deklarativer `payloadContract` |
| ad hoc Ressourcen | `resource` Owner, Cleanup und Diagnostics |
| produktspezifische Shell | `rmt-app-platform-fixture` als generische Referenz |

## Regeln

- DOM Descriptor ist der Standardpfad fuer Template-, Slot-, Repeat- und Condition-Materialisierung.
- `payloadContract` beschreibt Event- und Action-Payloads, bevor Host-Adapter sie ausfuehren.
- Jede `resource` benoetigt Owner, Lifecycle, Cleanup und Fehlerdiagnostik.
- `rmt-app-platform-fixture` bleibt domain-neutral und darf keine produktgebundene Shell voraussetzen.

## Gate

```bash
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
```
