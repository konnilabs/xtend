export const xPopoverA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-popover',
  role: 'dialog',
  accessibleName: 'required',
  liveRegion: 'none',
  ariaStates: ['aria-expanded', 'aria-controls', 'aria-modal'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['accessible-name-required', 'focus-return', 'modal-state'],
      statusRegions: ['role=dialog'],
      errorRegions: []
    }
  }
} as const;

export type XPopoverA11yProfile = typeof xPopoverA11yProfile;
