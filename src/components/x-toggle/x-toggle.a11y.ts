export const xToggleA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-toggle',
  role: 'switch',
  accessibleName: 'required',
  focusStrategy: 'native-control-focus',
  keyboard: ['Tab', 'Space'],
  ariaStates: ['aria-checked', 'aria-invalid', 'aria-describedby', 'aria-required', 'aria-disabled', 'aria-busy'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      liveRegion: 'polite',
      signals: ['checked-state', 'validation-error-summary'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: ['role=alert', 'aria-live=assertive']
    }
  },
  motionContrast: {
    schema: 'xtend.a11y.motion-contrast-policy.v1',
    motion: {
      mediaQuery: '(prefers-reduced-motion: reduce)',
      reducedMotion: 'required',
      animationPolicy: 'state-change-without-motion-only-feedback'
    },
    contrast: {
      mediaQuery: '(forced-colors: active)',
      highContrast: 'required',
      focusVisible: 'required',
      nonColorStatus: 'required'
    }
  }
} as const;

export type XToggleA11yProfile = typeof xToggleA11yProfile;

