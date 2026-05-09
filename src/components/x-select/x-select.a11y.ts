export const xSelectA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-select',
  role: 'combobox',
  accessibleName: 'required',
  focusStrategy: 'native-select-focus',
  keyboard: ['Tab', 'ArrowDown', 'ArrowUp', 'Enter', 'Escape'],
  ariaStates: ['aria-expanded', 'aria-invalid', 'aria-describedby'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['selected-option-announcement', 'validation-error-summary'],
      errorRegions: ['role=alert', 'aria-live=assertive']
    }
  }
} as const;

export type XSelectA11yProfile = typeof xSelectA11yProfile;

