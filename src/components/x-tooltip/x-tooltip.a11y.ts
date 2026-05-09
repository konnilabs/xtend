export const xTooltipA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-tooltip',
  role: 'tooltip',
  accessibleName: 'required',
  liveRegion: 'none',
  ariaStates: ['aria-describedby', 'aria-hidden'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['describedby-link', 'tooltip-context', 'dismiss-on-escape'],
      statusRegions: ['role=tooltip'],
      errorRegions: []
    }
  }
} as const;

export type XTooltipA11yProfile = typeof xTooltipA11yProfile;
