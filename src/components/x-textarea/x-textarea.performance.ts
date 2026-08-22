export const xTextareaPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-textarea',
  budgetClass: 'interactive-medium',
  lane: 'user-blocking',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'hydrate', 'event'],
  cleanup: ['xtendState-subscription', 'input-listeners']
} as const;

export type XTextareaPerformanceProfile = typeof xTextareaPerformanceProfile;
