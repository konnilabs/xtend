export const xStatusPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-status',
  budgetClass: 'feedback-small',
  lane: 'feedback',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'hydrate', 'event'],
  cleanup: ['xstate-subscription']
} as const;

export type XStatusPerformanceProfile = typeof xStatusPerformanceProfile;
