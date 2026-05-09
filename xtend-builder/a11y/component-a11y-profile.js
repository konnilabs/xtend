const A11Y_COMPONENT_CONTRACT_SCHEMA = 'xtend.a11y.component-contract.v1';
const A11Y_PROFILE_SCHEMA = 'xtend.a11y.profile.v1';
const A11Y_TEST_CONTRACT_SCHEMA = 'xtend.a11y.test-contract.v1';
const SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA = 'xtend.scaffold.a11y-profile-plan.v1';
const {
  SCREENREADER_SIGNALS_SCHEMA: A11Y_SCREENREADER_SIGNALS_SCHEMA,
  SCREENREADER_SIGNAL_RECORD_SCHEMA: A11Y_SCREENREADER_SIGNAL_RECORD_SCHEMA,
  createScreenreaderSignalContract
} = require('../../a11y/screenreader-signals');
const {
  MOTION_CONTRAST_POLICY_SCHEMA: A11Y_MOTION_CONTRAST_POLICY_SCHEMA,
  MOTION_POLICY_SCHEMA: A11Y_MOTION_POLICY_SCHEMA,
  CONTRAST_POLICY_SCHEMA: A11Y_CONTRAST_POLICY_SCHEMA,
  MOTION_CONTRAST_TEST_SCHEMA: A11Y_MOTION_CONTRAST_TEST_SCHEMA,
  createMotionContrastPolicy
} = require('../../a11y/motion-contrast-policy');

const PROFILE_PRIORITY = [
  'overlay',
  'form',
  'interactive',
  'routing',
  'feedback',
  'media',
  'stateful',
  'theme',
  'display'
];

const PROFILE_A11Y_RULES = {
  display: {
    role: 'region',
    focusMode: 'none',
    initialFocus: 'none',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Tab'],
    ariaStates: ['aria-label'],
    liveRegion: 'none',
    screenreaderSignals: ['semantic-region'],
    reviewChecks: ['semantic-role', 'accessible-name', 'slot-content-readable']
  },
  interactive: {
    role: 'button',
    focusMode: 'visible-control',
    initialFocus: 'host',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Enter', 'Space', 'Tab'],
    ariaStates: ['aria-label', 'aria-pressed', 'aria-disabled'],
    liveRegion: 'none',
    screenreaderSignals: ['state-change-announcement'],
    reviewChecks: ['keyboard-activation', 'focus-visible', 'accessible-name']
  },
  stateful: {
    role: 'region',
    focusMode: 'stable-host',
    initialFocus: 'none',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Tab'],
    ariaStates: ['aria-label', 'aria-busy'],
    liveRegion: 'polite',
    screenreaderSignals: ['state-change-summary'],
    reviewChecks: ['state-change-announcement', 'aria-busy-consistency', 'focus-preservation']
  },
  feedback: {
    role: 'status',
    focusMode: 'none',
    initialFocus: 'none',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Escape'],
    ariaStates: ['aria-label', 'aria-live', 'aria-busy'],
    liveRegion: 'polite',
    screenreaderSignals: ['status-announcement', 'dismissal-announcement'],
    reviewChecks: ['live-region', 'dismissal-path', 'reduced-motion']
  },
  overlay: {
    role: 'dialog',
    focusMode: 'managed-dialog',
    initialFocus: 'first-focusable',
    trapFocus: true,
    restoreFocus: true,
    keyboard: ['Escape', 'Tab', 'Shift+Tab'],
    ariaStates: ['aria-label', 'aria-labelledby', 'aria-modal', 'aria-hidden'],
    liveRegion: 'none',
    screenreaderSignals: ['dialog-context', 'focus-return'],
    reviewChecks: ['focus-trap', 'focus-return', 'aria-modal', 'escape-close']
  },
  routing: {
    role: 'navigation',
    focusMode: 'route-stable',
    initialFocus: 'active-route',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Enter', 'Tab', 'ArrowLeft', 'ArrowRight'],
    ariaStates: ['aria-label', 'aria-current', 'aria-expanded'],
    liveRegion: 'polite',
    screenreaderSignals: ['route-change-announcement'],
    reviewChecks: ['aria-current', 'route-announcement', 'keyboard-navigation']
  },
  theme: {
    role: 'region',
    focusMode: 'preserve-user-focus',
    initialFocus: 'none',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Tab'],
    ariaStates: ['aria-label'],
    liveRegion: 'none',
    screenreaderSignals: ['contrast-preservation'],
    reviewChecks: ['contrast-tokens', 'focus-visible-token', 'no-color-only-state']
  },
  form: {
    role: 'form',
    focusMode: 'field-order',
    initialFocus: 'first-invalid-or-first-field',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Enter', 'Tab', 'Shift+Tab'],
    ariaStates: ['aria-label', 'aria-invalid', 'aria-describedby', 'aria-required'],
    liveRegion: 'polite',
    screenreaderSignals: ['validation-error-summary', 'submit-status'],
    reviewChecks: ['label-association', 'validation-announcement', 'keyboard-submit']
  },
  media: {
    role: 'group',
    focusMode: 'controls',
    initialFocus: 'first-control',
    trapFocus: false,
    restoreFocus: false,
    keyboard: ['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'Tab'],
    ariaStates: ['aria-label', 'aria-busy', 'aria-valuetext'],
    liveRegion: 'polite',
    screenreaderSignals: ['loading-state', 'control-state'],
    reviewChecks: ['control-labels', 'media-keyboard', 'reduced-motion']
  }
};

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function normalizeProfiles(profiles) {
  const list = Array.isArray(profiles) && profiles.length > 0 ? profiles : ['display'];
  const normalized = unique(list.map((profile) => String(profile).trim()).filter(Boolean));
  return normalized.length > 0 ? normalized : ['display'];
}

function pickPrimaryProfile(profiles) {
  return PROFILE_PRIORITY.find((profile) => profiles.includes(profile)) || profiles[0] || 'display';
}

function getRule(profile) {
  return PROFILE_A11Y_RULES[profile] || PROFILE_A11Y_RULES.display;
}

function collectProfileRules(profiles, key) {
  return unique(profiles.flatMap((profile) => getRule(profile)[key] || []));
}

function createComponentA11yProfile(input = {}, options = {}) {
  const plan = options.plan || {};
  const planInput = plan.input || {};
  const tag = input.tag || planInput.tag || 'x-component';
  const name = input.name || planInput.name || tag.replace(/^x-/, '');
  const className = input.className || planInput.className || 'XComponent';
  const profiles = normalizeProfiles(input.profiles || planInput.profiles);
  const primaryProfile = pickPrimaryProfile(profiles);
  const primaryRule = getRule(primaryProfile);
  const keyboard = collectProfileRules(profiles, 'keyboard');
  const ariaStates = collectProfileRules(profiles, 'ariaStates');
  const reviewChecks = collectProfileRules(profiles, 'reviewChecks');
  const screenreaderSignals = collectProfileRules(profiles, 'screenreaderSignals');
  const screenreaderSignalContract = createScreenreaderSignalContract({
    componentRef: tag,
    primaryProfile,
    profile: {
      primaryProfile,
      screenreader: {
        liveRegion: primaryRule.liveRegion,
        signals: screenreaderSignals
      }
    }
  });
  const motionContrastPolicy = createMotionContrastPolicy({
    componentRef: tag,
    primaryProfile,
    profile: {
      primaryProfile
    }
  });
  const defaultText = `${className} component`;

  return {
    schema: A11Y_PROFILE_SCHEMA,
    planSchema: SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA,
    componentContract: A11Y_COMPONENT_CONTRACT_SCHEMA,
    testContract: A11Y_TEST_CONTRACT_SCHEMA,
    status: 'scaffold-a11y-required',
    mode: 'dry-run-a11y-profile',
    componentRef: tag,
    name,
    profiles,
    primaryProfile,
    role: primaryRule.role,
    accessibleName: {
      source: 'aria-label',
      required: true,
      defaultText,
      fallbackAttribute: 'aria-label'
    },
    focusStrategy: {
      mode: primaryRule.focusMode,
      initial: primaryRule.initialFocus,
      trap: primaryRule.trapFocus,
      restore: primaryRule.restoreFocus,
      focusVisible: 'required'
    },
    keyboard,
    ariaStates,
    screenreader: {
      contract: A11Y_SCREENREADER_SIGNALS_SCHEMA,
      signalRecordContract: A11Y_SCREENREADER_SIGNAL_RECORD_SCHEMA,
      liveRegion: primaryRule.liveRegion,
      signals: screenreaderSignals,
      signalContract: screenreaderSignalContract,
      statusRegions: screenreaderSignalContract.statusRegions,
      errorRegions: screenreaderSignalContract.errorRegions,
      fabric: screenreaderSignalContract.fabric,
      announcementRequired: primaryRule.liveRegion !== 'none' || screenreaderSignals.length > 0
    },
    motion: {
      contract: A11Y_MOTION_POLICY_SCHEMA,
      reducedMotion: 'required',
      mediaQuery: motionContrastPolicy.motion.mediaQuery,
      animationPolicy: motionContrastPolicy.motion.animationPolicy,
      noMotionOnlyState: true,
      requiredCss: motionContrastPolicy.motion.requiredCss
    },
    contrast: {
      contract: A11Y_CONTRAST_POLICY_SCHEMA,
      highContrast: 'required',
      mediaQuery: motionContrastPolicy.contrast.mediaQuery,
      contrastPolicy: motionContrastPolicy.contrast.contrastPolicy,
      forcedColorAdjust: motionContrastPolicy.contrast.forcedColorAdjust,
      focusVisible: 'required',
      nonColorStatus: 'required',
      tokenAware: true,
      systemColorTokens: motionContrastPolicy.contrast.systemColorTokens,
      requiredCss: motionContrastPolicy.contrast.requiredCss
    },
    motionContrast: {
      contract: A11Y_MOTION_CONTRAST_POLICY_SCHEMA,
      testContract: A11Y_MOTION_CONTRAST_TEST_SCHEMA,
      policy: motionContrastPolicy,
      fabric: motionContrastPolicy.fabric
    },
    testRefs: ['components', 'a11y-hydration', 'screenreader-signals', 'motion-contrast', 'references'],
    testPlan: {
      schema: A11Y_TEST_CONTRACT_SCHEMA,
      requiredAssertions: [
        'static-a11y-profile',
        'role-or-native-semantics',
        'accessible-name',
        'keyboard-contract',
        'focus-strategy',
        'aria-state-list',
        'screenreader-live-region-policy',
        'screenreader-signals-contract',
        'announcement-policy',
        'reduced-motion-policy',
        'motion-contrast-policy',
        'forced-colors-policy',
        'non-color-status-policy'
      ]
    },
    scaffold: {
      staticGetter: 'xtendScaffoldA11yProfile',
      manifestKey: 'a11yProfile',
      requiredFixtureAttributes: ['aria-label'],
      requiredDocsSections: ['A11y-Profil', 'Screenreader-Signale', 'Motion-und-Contrast-Policy', 'Accessibility und Hydration'],
      requiredGates: ['components', 'a11y-hydration', 'screenreader-signals', 'motion-contrast', 'references']
    },
    reviewRules: reviewChecks
  };
}

module.exports = {
  A11Y_COMPONENT_CONTRACT_SCHEMA,
  A11Y_PROFILE_SCHEMA,
  A11Y_MOTION_CONTRAST_POLICY_SCHEMA,
  A11Y_MOTION_POLICY_SCHEMA,
  A11Y_CONTRAST_POLICY_SCHEMA,
  A11Y_MOTION_CONTRAST_TEST_SCHEMA,
  A11Y_SCREENREADER_SIGNALS_SCHEMA,
  A11Y_SCREENREADER_SIGNAL_RECORD_SCHEMA,
  A11Y_TEST_CONTRACT_SCHEMA,
  PROFILE_A11Y_RULES,
  SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA,
  createComponentA11yProfile
};
