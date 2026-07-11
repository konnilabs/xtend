# Fabric RMT Lane Mapping

How RMT scheduling intent maps to Fabric lanes.

## What it covers

Lane mapping translates RMT scheduling intent into canonical Fabric lanes. The RMT record states priority and purpose; Fabric decides execution, telemetry, and backpressure for the current platform.

## Public building blocks

- `fabric/rmt-lane-mapping.js` normalizes lanes and schedules.
- `fabric/rmt-lane-mapping.d.ts` types resolutions, diagnostics, and mapping.
- `fabric/xtend-fabric.js` runs the resulting fiber.

## Recommended workflow

`critical`, `visible`, `transition`, `idle`, and `diagnostics` resolve through defined profiles. An unknown lane yields a diagnostic and documented default, not a new global priority class. Review [Scheduling and Lanes](./learn-rmt-scheduling-lanes.md) before a host introduces custom names.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
