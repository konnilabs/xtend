(function attachXtendA11yMotionContrastPolicy(globalTarget, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendA11yMotionContrastPolicy = Object.freeze({
      schema: api.MOTION_CONTRAST_POLICY_SCHEMA,
      contracts: api.CONTRACTS,
      createMotionContrastPolicy: api.createMotionContrastPolicy,
      normalizeMotionContrastPolicy: api.normalizeMotionContrastPolicy,
      validateMotionContrastPolicy: api.validateMotionContrastPolicy
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXtendA11yMotionContrastPolicyModule() {
  const CONTRACTS = Object.freeze({
    motionContrast: 'xtend.a11y.motion-contrast-policy.v1',
    motion: 'xtend.a11y.motion-policy.v1',
    contrast: 'xtend.a11y.contrast-policy.v1',
    test: 'xtend.a11y.motion-contrast-test.v1',
    fabricLaneMapping: 'xtend.fabric.rmt-lane-mapping.v1'
  });

  const MOTION_CONTRAST_POLICY_SCHEMA = CONTRACTS.motionContrast;
  const MOTION_POLICY_SCHEMA = CONTRACTS.motion;
  const CONTRAST_POLICY_SCHEMA = CONTRACTS.contrast;
  const MOTION_CONTRAST_TEST_SCHEMA = CONTRACTS.test;

  const MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';
  const CONTRAST_MEDIA_QUERY = '(forced-colors: active)';

  const PROFILE_POLICY_DEFAULTS = Object.freeze({
    display: Object.freeze({
      animationPolicy: 'none-or-instant-state',
      contrastPolicy: 'semantic-surface-and-focus'
    }),
    interactive: Object.freeze({
      animationPolicy: 'no-essential-motion',
      contrastPolicy: 'focus-visible-and-state-without-color'
    }),
    stateful: Object.freeze({
      animationPolicy: 'state-change-without-motion-only-feedback',
      contrastPolicy: 'non-color-state-and-focus'
    }),
    feedback: Object.freeze({
      animationPolicy: 'announcement-without-motion-dependency',
      contrastPolicy: 'status-not-color-only'
    }),
    overlay: Object.freeze({
      animationPolicy: 'instant-open-close-allowed',
      contrastPolicy: 'dialog-boundary-and-focus'
    }),
    routing: Object.freeze({
      animationPolicy: 'route-change-without-motion-dependency',
      contrastPolicy: 'active-route-not-color-only'
    }),
    theme: Object.freeze({
      animationPolicy: 'token-change-without-motion-dependency',
      contrastPolicy: 'theme-tokens-map-to-system-colors'
    }),
    form: Object.freeze({
      animationPolicy: 'validation-without-motion-only-feedback',
      contrastPolicy: 'error-and-required-not-color-only'
    }),
    media: Object.freeze({
      animationPolicy: 'controls-stay-readable-without-motion',
      contrastPolicy: 'controls-and-progress-not-color-only'
    })
  });

  const SYSTEM_COLOR_TOKENS = Object.freeze({
    text: 'CanvasText',
    surface: 'Canvas',
    border: 'CanvasText',
    focus: 'Highlight',
    focusText: 'HighlightText',
    status: 'CanvasText',
    error: 'Mark',
    errorText: 'MarkText'
  });

  const FABRIC_A11Y_PREFERENCE = Object.freeze({
    lane: 'a11y',
    fiberKind: 'a11y.preference',
    scheduleRef: 'a11y.user-blocking.preference',
    scheduleContract: CONTRACTS.fabricLaneMapping,
    boundary: 'fabric-adapter-observes-preferences-rmt-kernel-remains-framework-agnostic'
  });

  function normalizeProfile(profile) {
    const normalized = String(profile || 'display').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(PROFILE_POLICY_DEFAULTS, normalized)
      ? normalized
      : 'display';
  }

  function unique(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function createMotionPolicy(input = {}) {
    const profile = normalizeProfile(input.primaryProfile || input.profile);
    const defaults = PROFILE_POLICY_DEFAULTS[profile] || PROFILE_POLICY_DEFAULTS.display;
    const motion = input.motion || {};

    return {
      schema: MOTION_POLICY_SCHEMA,
      reducedMotion: motion.reducedMotion || 'required',
      mediaQuery: motion.mediaQuery || MOTION_MEDIA_QUERY,
      animationPolicy: motion.animationPolicy || defaults.animationPolicy,
      disableAnimations: motion.disableAnimations !== false,
      disableTransitions: motion.disableTransitions !== false,
      noMotionOnlyState: motion.noMotionOnlyState !== false,
      allowedAnimatedProperties: unique(motion.allowedAnimatedProperties || ['opacity', 'transform']),
      requiredCss: unique(motion.requiredCss || [
        '@media (prefers-reduced-motion: reduce)',
        'animation: none',
        'transition: none'
      ])
    };
  }

  function createContrastPolicy(input = {}) {
    const profile = normalizeProfile(input.primaryProfile || input.profile);
    const defaults = PROFILE_POLICY_DEFAULTS[profile] || PROFILE_POLICY_DEFAULTS.display;
    const contrast = input.contrast || {};

    return {
      schema: CONTRAST_POLICY_SCHEMA,
      highContrast: contrast.highContrast || 'required',
      mediaQuery: contrast.mediaQuery || CONTRAST_MEDIA_QUERY,
      contrastPolicy: contrast.contrastPolicy || defaults.contrastPolicy,
      forcedColorAdjust: contrast.forcedColorAdjust || 'auto',
      focusVisible: contrast.focusVisible || 'required',
      nonColorStatus: contrast.nonColorStatus || 'required',
      tokenAware: contrast.tokenAware !== false,
      systemColorTokens: Object.assign({}, SYSTEM_COLOR_TOKENS, contrast.systemColorTokens || {}),
      requiredCss: unique(contrast.requiredCss || [
        '@media (forced-colors: active)',
        'forced-color-adjust',
        'CanvasText',
        'Highlight'
      ])
    };
  }

  function resolveComponentRef(input = {}) {
    return input.componentRef || input.tag || (input.profile && input.profile.componentRef) || 'x-component';
  }

  function createMotionContrastPolicy(input = {}) {
    const primaryProfile = normalizeProfile(input.primaryProfile || (input.profile && input.profile.primaryProfile));
    const motion = createMotionPolicy({
      primaryProfile,
      motion: input.motion || (input.profile && input.profile.motion)
    });
    const contrast = createContrastPolicy({
      primaryProfile,
      contrast: input.contrast || (input.profile && input.profile.contrast)
    });

    return {
      schema: MOTION_CONTRAST_POLICY_SCHEMA,
      componentRef: resolveComponentRef(input),
      primaryProfile,
      motion,
      contrast,
      fabric: Object.assign({}, FABRIC_A11Y_PREFERENCE),
      testPlan: {
        schema: MOTION_CONTRAST_TEST_SCHEMA,
        requiredAssertions: [
          'prefers-reduced-motion-css',
          'forced-colors-css',
          'focus-visible-preserved',
          'non-color-status',
          'theme-token-system-colors'
        ]
      },
      requiredCss: unique(motion.requiredCss.concat(contrast.requiredCss)),
      testRefs: ['motion-contrast', 'a11y-hydration', 'references'],
      boundaries: {
        runtimeAgnostic: true,
        noRmtKernelImport: true,
        noMotionOnlyState: motion.noMotionOnlyState === true
      }
    };
  }

  function normalizeMotionContrastPolicy(input = {}) {
    if (input && input.schema === MOTION_CONTRAST_POLICY_SCHEMA) {
      return Object.assign(createMotionContrastPolicy(input), input, {
        motion: Object.assign(createMotionPolicy(input), input.motion || {}),
        contrast: Object.assign(createContrastPolicy(input), input.contrast || {})
      });
    }

    return createMotionContrastPolicy(input);
  }

  function validateMotionContrastPolicy(input = {}) {
    const policy = normalizeMotionContrastPolicy(input);
    const errors = [];

    if (policy.schema !== MOTION_CONTRAST_POLICY_SCHEMA) {
      errors.push('schema must be xtend.a11y.motion-contrast-policy.v1');
    }
    if (!policy.componentRef || typeof policy.componentRef !== 'string') {
      errors.push('componentRef must be a non-empty string');
    }
    if (!policy.motion || policy.motion.schema !== MOTION_POLICY_SCHEMA) {
      errors.push('motion schema must be xtend.a11y.motion-policy.v1');
    }
    if (!policy.contrast || policy.contrast.schema !== CONTRAST_POLICY_SCHEMA) {
      errors.push('contrast schema must be xtend.a11y.contrast-policy.v1');
    }
    if (policy.motion && policy.motion.mediaQuery !== MOTION_MEDIA_QUERY) {
      errors.push('motion mediaQuery must be prefers-reduced-motion reduce');
    }
    if (policy.contrast && policy.contrast.mediaQuery !== CONTRAST_MEDIA_QUERY) {
      errors.push('contrast mediaQuery must be forced-colors active');
    }
    if (policy.motion && policy.motion.noMotionOnlyState !== true) {
      errors.push('motion noMotionOnlyState must be true');
    }
    if (policy.contrast && policy.contrast.focusVisible !== 'required') {
      errors.push('contrast focusVisible must be required');
    }
    if (policy.contrast && policy.contrast.nonColorStatus !== 'required') {
      errors.push('contrast nonColorStatus must be required');
    }
    if (!policy.fabric || policy.fabric.lane !== 'a11y' || policy.fabric.fiberKind !== 'a11y.preference') {
      errors.push('fabric mapping must use a11y lane and a11y.preference fiber');
    }

    return {
      ok: errors.length === 0,
      schema: MOTION_CONTRAST_TEST_SCHEMA,
      contract: MOTION_CONTRAST_POLICY_SCHEMA,
      errors,
      policy
    };
  }

  return Object.freeze({
    CONTRACTS,
    MOTION_CONTRAST_POLICY_SCHEMA,
    MOTION_POLICY_SCHEMA,
    CONTRAST_POLICY_SCHEMA,
    MOTION_CONTRAST_TEST_SCHEMA,
    MOTION_MEDIA_QUERY,
    CONTRAST_MEDIA_QUERY,
    PROFILE_POLICY_DEFAULTS,
    SYSTEM_COLOR_TOKENS,
    FABRIC_A11Y_PREFERENCE,
    createMotionContrastPolicy,
    normalizeMotionContrastPolicy,
    validateMotionContrastPolicy
  });
});
