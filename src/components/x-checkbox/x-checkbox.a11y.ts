export const xCheckboxA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-checkbox',
  role: 'checkbox',
  accessibleName: 'required',
  focusStrategy: 'native-control-focus',
  keyboard: ['Tab', 'Space'],
  ariaStates: ['aria-checked', 'aria-invalid', 'aria-describedby'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['checked-state', 'indeterminate-state', 'validation-error-summary'],
      errorRegions: ['role=alert', 'aria-live=assertive']
    }
  }
} as const;

export type XCheckboxA11yProfile = typeof xCheckboxA11yProfile;

