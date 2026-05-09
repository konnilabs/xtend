export const xDrawerPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-drawer',
  budgetClass: 'overlay-large',
  lane: 'visible',
  hydrationPolicy: 'lazy',
  criticalMeasurements: ['mount', 'hydrate', 'route'],
  cleanup: ['document-keydown', 'route-listeners']
} as const;

export type XDrawerPerformanceProfile = typeof xDrawerPerformanceProfile;
