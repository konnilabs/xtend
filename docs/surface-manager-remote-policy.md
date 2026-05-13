# SurfaceManager Remote Policy Bridge

`WP-SM-17` bindet E16 Remote-Surface-Records an die XTend-UI-Surface-Runtime an. Der Contract `xtend.surface.remote-policy-bridge.v1` gehoert zum `x-surface-manager`; der RMT Kernel bleibt deklarativ und fuehrt keine Remote Runtime aus.

## Entscheidungen

Remote Surfaces werden hostseitig in genau eine Entscheidung ueberfuehrt. Die akzeptierte Trust Boundary lautet `xtend.security.remote-surface.v1`.

- `mounted`: Owner, Version, Origin, Integrity, Trust Boundary, Capabilities, Sandbox/CSP und Event-Governance sind passend.
- `degraded`: eine Policy-Verletzung liegt vor, aber ein expliziter Fallback ist verfuegbar.
- `refused`: die Surface darf nicht registriert werden, weil eine harte Policy-Verletzung ohne Fallback vorliegt.

Der SurfaceController bleibt die einzige Registry. Die Policy Bridge legt keine zweite Registry an; sie fuehrt nur Host-Entscheidungen, Diagnostics und Fallback-Mapping.

## Manager API

- `evaluateRemoteSurfacePolicy(record, options)` prueft einen Remote Surface Record ohne Commit.
- `applyRemoteSurfacePolicy(record, options)` prueft und registriert bei `commit: true` eine gemountete oder degradierte Surface.
- `registerRemoteSurface(record, options)` ist der produktive Mount-Pfad fuer `xtend.surface`.
- `snapshotRemoteSurfacePolicy()` liefert `xtend.surface.remote-policy-report.v1`.
- `governRemoteSurfaceEvent(event, payload, options)` prueft Cross-Surface Events ohne impliziten globalen Event-Bus.

Wichtige Host-Attribute:

- `remote-surface-policy="strict|audit|off"`
- `remote-origin-allowlist="https://cdn.example"`
- `remote-capabilities="surface.mount,event.emit,event.consume"`

## Adapter Boundary

Der `xtend.surface` Adapter konsumiert E16 Remote-Surface-Records, normalisiert sie als Surface-Intent und reicht sie an den SurfaceManager weiter. Er materialisiert hoechstens eine lokale Shell oder einen Fallback. Er laedt keine Remote Bundles, startet kein `import()` und fuehrt kein Remote Runtime Loading im RMT Kernel aus.

## Diagnostics

Policy-Verletzungen sind diagnostizierbar, darunter:

- `xtend.surface.remote-policy.owner-missing`
- `xtend.surface.remote-policy.version-missing`
- `xtend.surface.remote-policy.origin-not-allowed`
- `xtend.surface.remote-policy.integrity-missing`
- `xtend.surface.remote-policy.trust-boundary-refused`
- `xtend.surface.remote-policy.capability-refused`
- `xtend.surface.remote-policy.event-payload-missing`
- `xtend.surface.remote-policy.event-scope-refused`
- `xtend.surface.remote-policy.degradation-blocked`
- `xtend.surface.remote-policy.fallback-missing`

## Gate

```bash
node scripts/run_xtend_tests.js surface-remote-policy --json
```

Der Gate prueft Runtime-Methoden, Public Types, RMT-Adapter-Anbindung, Enterprise-MFE-Fixture, Degradation/Fallback, Event-Governance, Package-Metadaten und die Boundaries `keine zweite Registry` sowie `kein Remote Runtime Loading im RMT Kernel`.
