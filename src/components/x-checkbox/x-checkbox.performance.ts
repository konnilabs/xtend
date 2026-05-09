export const xCheckboxPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-checkbox',
  budgetClass: 'interactive-small',
  lane: 'user-blocking',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'event'],
  cleanup: ['xstate-subscription']
} as const;

export type XCheckboxPerformanceProfile = typeof xCheckboxPerformanceProfile;

