export const xPopoverPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-popover',
  budgetClass: 'overlay-medium',
  lane: 'user-blocking',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'hydrate', 'event'],
  cleanup: ['document-click', 'document-keydown']
} as const;

export type XPopoverPerformanceProfile = typeof xPopoverPerformanceProfile;
