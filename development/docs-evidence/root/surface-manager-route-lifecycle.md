# SurfaceManager Route Lifecycle

Schema: `xtend.surface.route-lifecycle.v1`

SurfaceManager route lifecycle binds route-aware surfaces to XRouter state without creating competing owners. `route-aware` enables the manager-owned lifecycle, while XRouter bleibt Route-State-Quelle.

SurfaceManager bleibt Lifecycle-Quelle for surface visibility and hydration decisions. Policies include `global`, `open-close`, `open-collapse`, `open-minimize`, `open-keep`, `hydrate-only`, and `manual`.

Global surfaces stay stable across route changes. Surface-specific route metadata is read from `data-surface-route` and `data-surface-route-policy`, and route hydration flows through `hydrateSurfaceContent` when a route policy needs it.

The boundary is explicit: globale Surfaces are preserved, route state remains owned by XRouter, and there are keine konkurrierenden Lifecycle-Quellen or second registries.
