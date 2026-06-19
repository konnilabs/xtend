# SurfaceManager Migration Guide

WP-SM-19 introduces `xtend.surface.runtime-migration-notes.v1` for the productive runtime migration.

Migration targets:

- `surface-adapter-runtime`
- `surface-native-materialization`
- `surface-runtime-release-handoff`
- `components[*].metadata.surface`

Move legacy hand-authored host wiring into RMT surface metadata where possible, then let the productive adapter and materialization path create native surfaces.
