const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const RUNTIME_A11Y_REPORT_SCHEMA = 'xtend.component.runtime-a11y-report.v1';
const RUNTIME_A11Y_WORKPACKAGE = 'WP-E11-04';
const RUNTIME_A11Y_CONTRACT_DOC = 'development/XTend-Runtime-A11y-UX-Contract.md';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const A11Y_COMPONENT_CONTRACT_SCHEMA = 'xtend.a11y.component-contract.v1';
const SCREENREADER_SIGNALS_SCHEMA = 'xtend.a11y.screenreader-signals.v1';
const MOTION_CONTRAST_POLICY_SCHEMA = 'xtend.a11y.motion-contrast-policy.v1';
const RMT_A11Y_AUTHORING_SCHEMA = 'xtend.rmt.a11y-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const RUNTIME_A11Y_REQUIRED_DOMAINS = [
  'semantics',
  'accessibleName',
  'keyboard',
  'focus',
  'aria',
  'screenreader',
  'motion',
  'contrast',
  'states',
  'forms',
  'overlays',
  'routing',
  'rmt',
  'fabric',
  'compatibility',
  'docs',
  'tests'
];

const RUNTIME_A11Y_PROFILES = [
  'display',
  'interactive',
  'form',
  'feedback',
  'overlay',
  'routing',
  'media'
];

const RUNTIME_A11Y_REQUIRED_ASSERTIONS = [
  'semantic-role',
  'accessible-name',
  'keyboard-path',
  'focus-visible',
  'focus-order',
  'screenreader-signal',
  'reduced-motion-safe',
  'forced-colors-safe',
  'no-color-only-state'
];

const RUNTIME_A11Y_REQUIRED_STATES = [
  'disabled',
  'busy',
  'invalid',
  'error',
  'expanded',
  'selected',
  'active'
];

const RUNTIME_A11Y_KEYBOARD_KEYS = [
  'Tab',
  'Shift+Tab',
  'Enter',
  'Space',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End'
];

const RUNTIME_A11Y_FOCUS_BEHAVIORS = [
  'visible',
  'deterministic-order',
  'restore',
  'trap',
  'roving',
  'route-stable'
];

const RUNTIME_A11Y_LIVE_REGION_MODES = ['none', 'polite', 'assertive'];

const PROFILE_DEFAULTS = {
  display: {
    role: 'region',
    keyboard: ['Tab'],
    focus: ['visible'],
    signals: ['semantic-region'],
    liveRegion: 'none'
  },
  interactive: {
    role: 'button',
    keyboard: ['Tab', 'Enter', 'Space'],
    focus: ['visible', 'deterministic-order'],
    signals: ['state-change-announcement'],
    liveRegion: 'none'
  },
  form: {
    role: 'form',
    keyboard: ['Tab', 'Shift+Tab', 'Enter'],
    focus: ['visible', 'deterministic-order'],
    signals: ['validation-error-summary', 'submit-status'],
    liveRegion: 'polite'
  },
  feedback: {
    role: 'status',
    keyboard: ['Escape'],
    focus: ['visible'],
    signals: ['status-announcement', 'dismissal-announcement'],
    liveRegion: 'polite'
  },
  overlay: {
    role: 'dialog',
    keyboard: ['Tab', 'Shift+Tab', 'Escape'],
    focus: ['visible', 'trap', 'restore'],
    signals: ['dialog-context', 'focus-return'],
    liveRegion: 'none'
  },
  routing: {
    role: 'navigation',
    keyboard: ['Tab', 'Enter', 'ArrowLeft', 'ArrowRight'],
    focus: ['visible', 'route-stable', 'deterministic-order'],
    signals: ['route-change-announcement'],
    liveRegion: 'polite'
  },
  media: {
    role: 'group',
    keyboard: ['Tab', 'Enter', 'Space', 'ArrowLeft', 'ArrowRight'],
    focus: ['visible', 'deterministic-order'],
    signals: ['loading-state', 'control-state'],
    liveRegion: 'polite'
  }
};

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function normalizeProfiles(inputProfiles) {
  const profiles = unique(normalizeArray(inputProfiles).length > 0 ? inputProfiles : ['display']);
  return profiles.filter((profile) => RUNTIME_A11Y_PROFILES.includes(profile)).length > 0
    ? profiles.filter((profile) => RUNTIME_A11Y_PROFILES.includes(profile))
    : ['display'];
}

function collectProfileValue(profiles, key) {
  return unique(profiles.flatMap((profile) => PROFILE_DEFAULTS[profile][key] || []));
}

function pickPrimaryProfile(profiles) {
  return ['overlay', 'form', 'interactive', 'routing', 'feedback', 'media', 'display']
    .find((profile) => profiles.includes(profile)) || 'display';
}

function createRuntimeA11yContract(input = {}) {
  const tag = input.tag || 'x-example';
  const profiles = normalizeProfiles(input.profiles || input.profile ? normalizeArray(input.profiles || [input.profile]) : ['display']);
  const primaryProfile = input.primaryProfile || pickPrimaryProfile(profiles);
  const role = input.role || PROFILE_DEFAULTS[primaryProfile].role;
  const keyboardKeys = unique(RUNTIME_A11Y_KEYBOARD_KEYS.concat(collectProfileValue(profiles, 'keyboard'), normalizeArray(input.keyboardKeys)));
  const focusBehaviors = unique(RUNTIME_A11Y_FOCUS_BEHAVIORS.concat(collectProfileValue(profiles, 'focus'), normalizeArray(input.focusBehaviors)));
  const signals = unique(collectProfileValue(profiles, 'signals').concat(normalizeArray(input.screenreaderSignals)));
  const liveRegion = input.liveRegion || PROFILE_DEFAULTS[primaryProfile].liveRegion;

  return {
    schema: RUNTIME_A11Y_CONTRACT_SCHEMA,
    status: 'contract-draft',
    workpackage: RUNTIME_A11Y_WORKPACKAGE,
    componentA11yContract: A11Y_COMPONENT_CONTRACT_SCHEMA,
    shellContract: COMPONENT_SHELL_CONTRACT_SCHEMA,
    stylingContract: COMPONENT_STYLING_CONTRACT_SCHEMA,
    tag,
    profiles,
    primaryProfile,
    semantics: {
      role,
      nativeFirst: true,
      ariaOnlyWhenNativeSemanticsAreInsufficient: true,
      landmarkAllowed: ['region', 'navigation', 'form', 'dialog', 'status', 'group']
    },
    accessibleName: {
      required: true,
      sources: ['aria-label', 'aria-labelledby', 'label-slot', 'visible-text', 'host-label'],
      fallbackAllowed: false
    },
    keyboard: {
      required: true,
      keys: keyboardKeys,
      activation: ['Enter', 'Space'],
      escapeBehaviorRequiredForDismissible: true,
      rovingTabindexAllowed: true
    },
    focus: {
      behaviors: focusBehaviors,
      visibleRequired: true,
      deterministicOrderRequired: true,
      restoreRequiredForOverlays: profiles.includes('overlay'),
      trapRequiredForModalOverlays: profiles.includes('overlay'),
      routeFocusRequired: profiles.includes('routing')
    },
    aria: {
      requiredStates: ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-disabled', 'aria-busy', 'aria-invalid', 'aria-required', 'aria-current', 'aria-expanded'],
      invalidAriaPolicy: 'diagnose-and-fail-gate',
      mirrorVisualStates: true
    },
    screenreader: {
      schema: SCREENREADER_SIGNALS_SCHEMA,
      signals,
      liveRegion,
      liveRegionModes: RUNTIME_A11Y_LIVE_REGION_MODES.slice(),
      statusRegionsRequired: profiles.includes('feedback') || profiles.includes('form') || profiles.includes('routing'),
      errorRegionsRequired: profiles.includes('form')
    },
    motion: {
      schema: MOTION_CONTRAST_POLICY_SCHEMA,
      reducedMotionSafe: true,
      noMotionRequiredForCoreFunction: true,
      preferenceMediaQuery: 'prefers-reduced-motion'
    },
    contrast: {
      schema: MOTION_CONTRAST_POLICY_SCHEMA,
      highContrastRequired: true,
      forcedColorsRequired: true,
      focusVisibleRequired: true,
      noColorOnlyState: true
    },
    states: {
      requiredBehavior: RUNTIME_A11Y_REQUIRED_STATES.slice(),
      disabled: ['aria-disabled', 'native-disabled-if-available', 'keyboard-blocked'],
      busy: ['aria-busy', 'screenreader-status'],
      invalid: ['aria-invalid', 'describedby-error', 'assertive-error-region'],
      error: ['role-alert-or-associated-error'],
      active: ['aria-current-or-selected']
    },
    forms: {
      labelsRequired: true,
      describedByRequiredForHelpAndError: true,
      validationAnnouncementRequired: true,
      firstInvalidFocusPolicy: 'first-invalid-or-summary'
    },
    overlays: {
      dialogRoleRequired: true,
      ariaModalRequired: true,
      inertBackgroundRequired: true,
      escapeCloseRequired: true,
      focusTrapRequired: profiles.includes('overlay'),
      focusReturnRequired: profiles.includes('overlay')
    },
    routing: {
      ariaCurrentRequired: true,
      routeAnnouncementRequired: profiles.includes('routing'),
      focusRestoreRequired: true,
      activeRouteFocusRequired: profiles.includes('routing')
    },
    rmt: {
      schema: RMT_A11Y_AUTHORING_SCHEMA,
      adapter: 'xtend.component',
      fields: ['a11y', 'role', 'name', 'description', 'keyboard', 'focus', 'aria', 'screenreader', 'motion', 'contrast'],
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      schema: FABRIC_BOUNDARY_SCHEMA,
      lane: 'a11y',
      fiberKinds: ['a11y.keyboard', 'a11y.focus', 'a11y.announce', 'a11y.preference'],
      diagnostics: ['a11y.name.missing', 'a11y.focus.invisible', 'a11y.keyboard.unreachable', 'a11y.aria.invalid']
    },
    compatibility: {
      hostModes: ['xtend-only', 'rmt-first', 'vanilla', 'react', 'vue', 'custom-shell'],
      browserBehaviorRequired: true,
      noFrameworkSpecificWrapperRequired: true,
      noCdnDependency: true
    },
    docs: {
      contract: RUNTIME_A11Y_CONTRACT_DOC,
      requiredSections: ['Semantics', 'Accessible Name', 'Keyboard', 'Focus', 'ARIA', 'Screenreader', 'Motion', 'Contrast', 'States', 'RMT Authoring']
    },
    tests: {
      requiredSuites: ['runtime-a11y-contract', 'a11y-hydration', 'screenreader-signals', 'motion-contrast', 'references'],
      assertions: RUNTIME_A11Y_REQUIRED_ASSERTIONS.slice(),
      browserSmokeRequiredForInteractiveShells: true
    }
  };
}

function validateRuntimeA11yContract(contract = {}) {
  const errors = [];

  if (contract.schema !== RUNTIME_A11Y_CONTRACT_SCHEMA) {
    errors.push(`schema must be ${RUNTIME_A11Y_CONTRACT_SCHEMA}`);
  }
  if (!/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(contract.tag || ''))) {
    errors.push('tag must be a valid XTend custom element tag');
  }

  RUNTIME_A11Y_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) {
      errors.push(`missing domain: ${domain}`);
    }
  });

  if (!Array.isArray(contract.profiles) || contract.profiles.some((profile) => !RUNTIME_A11Y_PROFILES.includes(profile))) {
    errors.push(`profiles must use known values: ${RUNTIME_A11Y_PROFILES.join(', ')}`);
  }
  if (contract.semantics && contract.semantics.nativeFirst !== true) {
    errors.push('semantics.nativeFirst must be true');
  }
  if (contract.accessibleName && contract.accessibleName.required !== true) {
    errors.push('accessibleName.required must be true');
  }
  if (!contract.keyboard || contract.keyboard.required !== true || !normalizeArray(contract.keyboard.keys).includes('Tab')) {
    errors.push('keyboard must be required and include Tab');
  }
  if (!contract.focus || contract.focus.visibleRequired !== true || contract.focus.deterministicOrderRequired !== true) {
    errors.push('focus must require visible focus and deterministic order');
  }
  if (!contract.aria || contract.aria.mirrorVisualStates !== true) {
    errors.push('aria.mirrorVisualStates must be true');
  }
  if (!contract.screenreader || contract.screenreader.schema !== SCREENREADER_SIGNALS_SCHEMA) {
    errors.push(`screenreader.schema must be ${SCREENREADER_SIGNALS_SCHEMA}`);
  }
  if (contract.screenreader && !RUNTIME_A11Y_LIVE_REGION_MODES.includes(contract.screenreader.liveRegion)) {
    errors.push(`screenreader.liveRegion must be one of: ${RUNTIME_A11Y_LIVE_REGION_MODES.join(', ')}`);
  }
  if (contract.motion && contract.motion.reducedMotionSafe !== true) {
    errors.push('motion.reducedMotionSafe must be true');
  }
  if (contract.contrast && contract.contrast.noColorOnlyState !== true) {
    errors.push('contrast.noColorOnlyState must be true');
  }
  if (contract.states && !RUNTIME_A11Y_REQUIRED_STATES.every((state) => normalizeArray(contract.states.requiredBehavior).includes(state))) {
    errors.push(`states.requiredBehavior must include ${RUNTIME_A11Y_REQUIRED_STATES.join(', ')}`);
  }
  if (contract.rmt && contract.rmt.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('rmt.kernelBoundary must keep the RMT kernel decoupled from XTend types');
  }
  if (contract.fabric && contract.fabric.lane !== 'a11y') {
    errors.push('fabric.lane must be a11y');
  }
  if (contract.compatibility && contract.compatibility.browserBehaviorRequired !== true) {
    errors.push('compatibility.browserBehaviorRequired must be true');
  }

  return {
    schema: RUNTIME_A11Y_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  RUNTIME_A11Y_REPORT_SCHEMA,
  RUNTIME_A11Y_WORKPACKAGE,
  RUNTIME_A11Y_CONTRACT_DOC,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  A11Y_COMPONENT_CONTRACT_SCHEMA,
  SCREENREADER_SIGNALS_SCHEMA,
  MOTION_CONTRAST_POLICY_SCHEMA,
  RMT_A11Y_AUTHORING_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  KERNEL_BOUNDARY,
  RUNTIME_A11Y_REQUIRED_DOMAINS,
  RUNTIME_A11Y_PROFILES,
  RUNTIME_A11Y_REQUIRED_ASSERTIONS,
  RUNTIME_A11Y_REQUIRED_STATES,
  RUNTIME_A11Y_KEYBOARD_KEYS,
  RUNTIME_A11Y_FOCUS_BEHAVIORS,
  RUNTIME_A11Y_LIVE_REGION_MODES,
  createRuntimeA11yContract,
  validateRuntimeA11yContract
};
