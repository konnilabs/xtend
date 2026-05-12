# WP-E16-08: Parser, Compiler und Core-Erweiterungen fuer Remote Surfaces integrieren

- Status: `completed`
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-compiler --json`

## Ergebnis

WP-E16-08 fuehrt die deklarative Authoring-Syntax `remote surface ... from remote ...`
in Parser und Compiler ein. Die Syntax bleibt nah an JSON, mappt aber direkt auf
die Enterprise-Bausteine aus WP-E16-02 bis WP-E16-07.

## Implementierung

- Parser: `tools/rmt-language/vnext-parser.js`
  - Top-Level `remote surface` AST-Knoten.
  - Klauseln fuer `owner`, `version`, `origin`, `integrity`, `trust boundary`,
    `fallback`, `exposes`, `emits` und `consumes`.
- Core Compiler: `tools/rmt-language/vnext-compiler.js`
  - `coreDocument.remoteSurfaces[]` mit Source-Map-Eintraegen.
  - Deterministische Records fuer Remote, Owner, Security, Exposes, Events,
    Capabilities, Adapter Boundary, Fallback und Runtime-Boundary.
- Remote Compiler: `tools/rmt-language/vnext-remote-compiler.js`
  - Remote Manifest, Enterprise Registry, Cross-Surface-Events, Governance und
    Degradation werden aus dem Authoring-Core abgeleitet.
  - Host-Shell-Bindings bleiben explizit gescoped und kernel-neutral.

## Nachweis

- Valid Fixture: `tests/rmt-language/fixtures/vnext-remote-compiler-valid.rmt`
- Negative Fixture: `tests/rmt-language/fixtures/vnext-remote-compiler-invalid.rmt`
- Golden Projection: `tests/rmt-language/fixtures/vnext-remote-compiler-valid.core.json`
- Suite: `tests/rmt-language/rmt_vnext_remote_compiler_suite.js`

`WP-E16-08` ist abgeschlossen, wenn der Remote-Compiler-Gate, die bestehende
E15-Compiler-Fixture und die E16-Chain gruen sind.
