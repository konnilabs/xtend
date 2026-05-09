export const xProgressA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-progress',
  role: 'progressbar',
  accessibleName: 'required',
  liveRegion: 'polite',
  ariaStates: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext', 'aria-busy'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['progress-update', 'progress-complete', 'scheduler-feedback'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: []
    }
  }
} as const;

export type XProgressA11yProfile = typeof xProgressA11yProfile;
