export const xRadioA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-radio',
  role: 'radio',
  accessibleName: 'required',
  focusStrategy: 'radio-group-roving-focus',
  keyboard: ['Tab', 'Space', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'],
  ariaStates: ['aria-checked', 'aria-invalid', 'aria-describedby'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['checked-state', 'radio-group-selection', 'validation-error-summary'],
      errorRegions: ['role=alert', 'aria-live=assertive']
    }
  }
} as const;

export type XRadioA11yProfile = typeof xRadioA11yProfile;

