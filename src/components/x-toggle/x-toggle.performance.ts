export const xTogglePerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-toggle',
  budgetClass: 'interactive-small',
  lane: 'user-blocking',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'event', 'keyboard', 'state-sync'],
  budgetsMs: {
    mount: 18,
    hydrate: 22,
    renderUpdate: 10,
    eventAction: 8,
    keyboardAction: 8,
    stateSync: 6
  },
  cleanup: ['toggle-event-listeners', 'xtendState-subscription'],
  rmt: {
    scheduleRefs: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  }
} as const;

export type XTogglePerformanceProfile = typeof xTogglePerformanceProfile;

