# SurfaceManager Lazy Hydration

Schema: `xtend.surface.loading-policy.v1`

SurfaceManager lazy hydration is the shell-first loading path for managed surfaces. The manager keeps the SurfaceController as registry truth, shows SkeletonLoader placeholders, and hydrates content through `XTendLoader.ensureComponent` and `hydrateTree` only when the configured policy allows it.

Supported policies are `eager`, `visible`, `open`, `idle`, and `route`. The runtime exposes `surface-loading-policy`, `surface-skeleton`, `surface-hydration-timeout`, `snapshotSurfaceLoading()` and `hydrateSurfaceContent(surfaceRef, options)`.

The loading boundary is deliberately conservative: SkeletonLoader protects users from unstyled content, Parsedown content stays behind the same component hydration path, and failed hydration keeps the skeleton active for diagnostics instead of producing a half-styled surface.

The docs app must use the framework-native XTendLoader path. There is kein Monkeypatch for component loading, style registration, skeleton display, or hydration. SurfaceManager also creates no second registry.
