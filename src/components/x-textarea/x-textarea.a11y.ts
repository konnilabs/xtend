export const xTextareaA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-textarea',
  role: 'textbox',
  accessibleName: 'required',
  focusStrategy: 'native-textarea-focus',
  keyboard: ['Tab', 'Shift+Tab', 'Enter'],
  ariaStates: ['aria-invalid', 'aria-describedby'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['validation-error-summary', 'character-count-announcement'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: ['role=alert', 'aria-live=assertive']
    }
  }
} as const;

export type XTextareaA11yProfile = typeof xTextareaA11yProfile;
