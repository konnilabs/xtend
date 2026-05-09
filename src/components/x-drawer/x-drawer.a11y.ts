export const xDrawerA11yProfile = {
  schema: 'xtend.a11y.profile.v1',
  componentRef: 'x-drawer',
  role: 'dialog',
  accessibleName: 'required',
  liveRegion: 'polite',
  ariaStates: ['aria-modal', 'aria-hidden', 'aria-expanded'],
  screenreader: {
    signalContract: {
      schema: 'xtend.a11y.screenreader-signals.v1',
      signals: ['drawer-open', 'drawer-close', 'route-change-announcement', 'focus-return'],
      statusRegions: ['role=status', 'aria-live=polite'],
      errorRegions: []
    }
  }
} as const;

export type XDrawerA11yProfile = typeof xDrawerA11yProfile;
