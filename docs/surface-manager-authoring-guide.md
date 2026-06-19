# SurfaceManager Authoring Guide

WP-SM-19 makes `xtend.surface.runtime-release-handoff.v1` the authoring baseline for productive SurfaceManager apps.

Use `native-surfaces-preferred` as the default: declare surfaces in RMT, keep component metadata compatible, and let the produktive `xtend.surface` Adapter Runtime materialize manager-owned surfaces.

Before release, run:

```bash
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

The SurfaceController remains the only registry; host apps should not create parallel registries for managed surfaces.
