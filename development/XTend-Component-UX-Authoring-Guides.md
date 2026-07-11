# XTend Component UX Authoring Guides

Schema: `xtend.epic11.component-ux-authoring-docs.v1`

Status: `accepted-docs`

Workpackage: `WP-E11-16`

## Ziel

`WP-E11-16` ueberfuehrt die Epic-11-Contracts in nutzbare Entwicklerdokumentation. Die Guides sollen Komponentenautorinnen, Komponentenautoren und App-Autorinnen klar zeigen, wie XTend-Komponenten enterprise-reif gebaut, in RMT-first Apps verwendet und lokal gatebar gehalten werden.

## Kanonische Docs

| Dokument | Contract | Zielgruppe |
| --- | --- | --- |
| `docs/component-ux-authoring.md` | `xtend.docs.component-ux-authoring.v1` | Komponentenautorinnen und Komponentenautoren |
| `docs/component-ux-app-authoring.md` | `xtend.docs.component-ux-app-authoring.v1` | App-Autorinnen und App-Autoren |
| `development/docs-evidence/root/component-ux-gates.md` | `xtend.docs.component-ux-gates.v1` | Teams, Reviewer und CI-Verantwortliche |

## Verbindliche Quellen

- `xtend.component.shell.v1`
- `xtend.component.styling.v1`
- `xtend.component.runtime-a11y.v1`
- `xtend.component.ux-performance.v1`
- `xtend.component.network.v1`
- `xtend.rmt.shell-authoring.v1`
- `xtend.epic11.component-lab-ux-inspector.v1`
- `xtend.epic11.component-ux-browser-smokes.v1`
- `xtend.epic11.component-shell-theme-matrix.v1`

Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs --json
```

Der Gate validiert:

- Docs-Dateien, Docs-Menue und Docs-README
- Package- und Scaffold-Metadaten
- Runner-Integration
- Epic-/Backlog-Handoff auf `WP-E11-17` als Long-Tail-Migrationspaket
- Referenzpfade
- Verlinkung zu Browser-Smokes und Theme-Matrix

## Handoff

`WP-E11-17` hat die Legacy Long-Tail Migration inzwischen anhand der Component-UX-Gates und der Component Shell Theme Matrix geplant. Der Folgehandoff liegt bei `WP-E11-18`.
