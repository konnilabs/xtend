# RMT App Platform Tooling

- Schema: `xtend.epic18.rmt-app-platform-tooling.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-app-platform-tooling --json`
- Workpackage: `WP-E18-11`

WP-E18-11 verbindet Scaffold Pipeline, Linter, LSP, Diagnostics und Source Maps fuer `rmt-app-platform` Authoring.

## Diagnostics

Die Tooling-Schicht erkennt fehlende Payload Contracts, Resource Ownership, unaufgeloeste Portals und unsichere HTML-Pfade wie `innerHTML`.

## Boundary

Das Tooling hilft App-Autoren, RMT App Platform Records ohne manuelle Host-Shell und ohne HTML-Sink zu erzeugen.
