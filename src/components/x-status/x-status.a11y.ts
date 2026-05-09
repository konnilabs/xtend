export const xStatusA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-status',
  role: 'status',
  accessibleName: 'optional',
  liveRegion: 'polite',
  ariaStates: ['aria-live', 'aria-busy'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['status-update', 'validation-feedback', 'scheduler-feedback'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: ['role=alert', 'aria-live=assertive']
    }
  }
} as const;

export type XStatusA11yProfile = typeof xStatusA11yProfile;
