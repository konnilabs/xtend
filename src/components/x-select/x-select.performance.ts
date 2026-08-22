export const xSelectPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-select',
  budgetClass: 'interactive-medium',
  lane: 'user-blocking',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'hydrate', 'event'],
  cleanup: ['option-mutation-observer', 'xtendState-subscription']
} as const;

export type XSelectPerformanceProfile = typeof xSelectPerformanceProfile;

