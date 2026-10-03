export const xProgressPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-progress',
  budgetClass: 'feedback-small',
  lane: 'background',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'hydrate', 'event'],
  cleanup: ['xtendState-subscription']
} as const;

export type XProgressPerformanceProfile = typeof xProgressPerformanceProfile;
