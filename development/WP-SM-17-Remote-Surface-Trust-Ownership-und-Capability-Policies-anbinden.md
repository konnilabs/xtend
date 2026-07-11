# WP-SM-17 - Remote Surface Trust, Ownership und Capability Policies anbinden

- Status: `completed`
- Workstream: `WS8`
- Prioritaet: `P1`
- Schema: `xtend.surface.remote-policy-bridge.v1`
- Report Schema: `xtend.surface.remote-policy-report.v1`
- Diagnostic Schema: `xtend.surface.remote-policy-diagnostic.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js surface-remote-policy --json`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `no-second-surface-registry`

## Ergebnis

`x-surface-manager` besitzt nun eine Host-Policy-Bridge fuer E16 Remote-Surface-Records. Remote Surfaces koennen sicher `mounted`, `degraded` oder `refused` werden. Alle Entscheidungen erzeugen diagnostizierbare Policy-Ergebnisse; der SurfaceController bleibt die einzige Runtime-Registry.

## Umgesetzt

- Owner-, Version-, Integrity-, Origin-, Trust-Boundary- und Capability-Pruefung
- Enterprise Surface Registry Lookup ueber Host-Optionen oder Manager-Hook
- Sandbox/CSP- und Adapter-Boundary-Entscheidungen als Host-Verantwortung
- Degradation auf explizite Fallback Surfaces
- Refusal bei harten Policy-Verletzungen ohne Fallback
- Cross-Surface Event Governance ohne globalen Event-Bus
- `xtend.surface` Adapter leitet Remote-Records an die Manager-Bridge weiter
- Enterprise-MFE-Fixture und lokaler Security-/Degradation-Smoke

## Artefakte

- `components/xsurfacemanager.js`
- `components/xsurfacemanager.d.ts`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `catalog/surface-manager-remote-policy.js`
- `tests/components/surface_manager_remote_policy_suite.js`
- `tests/components/fixtures/xsurfacemanager-remote-policy.component.html`
- `development/docs-evidence/root/surface-manager-remote-policy.md`

## Definition of Done

- Remote Surface Records koennen sicher abgelehnt, degradiert oder gemountet werden.
- Alle Entscheidungen sind diagnostizierbar.
- Der RMT Kernel bleibt deklarativ und remote-runtime-frei.
- `xtend.surface` ersetzt weder Fabric noch den RMT Kernel und baut keine parallele Surface-Registry.
