export const xRadioPerformanceProfile = {
  schema: 'xtend.performance.component-profile.v1',
  componentRef: 'x-radio',
  budgetClass: 'interactive-small',
  lane: 'user-blocking',
  hydrationPolicy: 'visible',
  criticalMeasurements: ['mount', 'event'],
  cleanup: ['xtendState-subscription', 'group-keyboard-navigation']
} as const;

export type XRadioPerformanceProfile = typeof xRadioPerformanceProfile;

