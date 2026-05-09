export const xTooltipPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-tooltip',
  budgetClass: 'overlay-small',
  lane: 'visible',
  hydrationPolicy: 'idle',
  criticalMeasurements: ['mount', 'event'],
  cleanup: ['anchor-listeners', 'document-keydown']
} as const;

export type XTooltipPerformanceProfile = typeof xTooltipPerformanceProfile;
