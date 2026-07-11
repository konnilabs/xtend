# Scheduling and Lanes

Lanes let an RMT document separate urgent UI work from visible hydration and background tasks. XTend Fabric can map those lane names and weights into runtime scheduling.

## Lane Priority

Use high weights for immediate interaction surfaces, medium weights for visible content and low weights for optional work. `tools/rmt-language/vnext-scheduler.js` translates the declared lane into an inspectable scheduling record.

```rmt
template learn.rmt.scheduling {
  surface dashboard.card kind card component x-status {
    lane critical weight 100 {
      mount dashboard-shell
    }

    lane visible weight 85 {
      hydrate dashboard-summary
    }

    lane idle weight 5 {
      hydrate analytics-panel
    }
  }
}
```

## Design Rule

Treat lanes as user experience intent. The lane says why work matters; the runtime decides how to execute it on the current platform.

## Maraca Kernel Path

In the loaderless Maraca path, lanes become scheduler entries in the bundle. `critical`, `visible`, `idle` and `transition` do not stay loose host strings; they are lowered into kernel and fiber plans. Use [Maraca Orchestration](./xtend-maraca-orchestration.md) when you need to inspect which endpoints the build creates for hydration, actions and surface transitions.

## Next Step

Before previewing arbitrary source, read [Security and Preview](./learn-rmt-security-preview.md).
