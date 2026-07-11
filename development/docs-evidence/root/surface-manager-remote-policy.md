# SurfaceManager Remote Policy Bridge

`xtend.surface.remote-policy-bridge.v1` binds E16 Remote Surface records to the
host-owned `x-surface-manager` policy bridge. The bridge lets a host decide
whether a remote surface is `mounted`, `degraded` or `refused` without creating
keine zweite Registry and without weakening `xtend.security.remote-surface.v1`.

The manager validates owner, version, origin, integrity, trust boundary and
capability facts before a remote surface becomes visible. Degradation uses an
explicit fallback surface; hard policy violations are refused. Cross-surface
events are governed through explicit payload and owner records, not through an
implicit global event bus.

The boundary remains strict: kein Remote Runtime Loading im RMT Kernel. The RMT
kernel observes records, policies and diagnostics only. Loading, isolation,
fallback activation and host telemetry stay host-owned.
