const PERFORMANCE_POLICY_SCHEMA = 'xtend.scaffold.performance-policy.v1';
const PERFORMANCE_COMPONENT_PROFILE_SCHEMA = 'xtend.performance.component-profile.v1';
const PERFORMANCE_BUDGET_MATRIX_SCHEMA = 'xtend.performance.budget-matrix.v1';
const PERFORMANCE_MEASUREMENT_SCHEMA = 'xtend.performance.measurement.v1';
const PERFORMANCE_REGRESSION_GATE_SCHEMA = 'xtend.performance.regression-gate.v1';
const HYDRATION_POLICY_SCHEMA = 'xtend.fabric.hydration-policy.v1';

const PROFILE_PRIORITY = [
  'overlay',
  'form',
  'interactive',
  'routing',
  'media',
  'stateful',
  'feedback',
  'theme',
  'display'
];

const GLOBAL_PERFORMANCE_RULES = [
  'scoped-dom-queries',
  'no-layout-thrashing',
  'event-handler-budget',
  'shadow-dom-style-cache',
  'observer-and-timer-cleanup',
  'reduced-motion-aware-animations',
  'idle-or-background-for-non-visible-work',
  'fabric-measurement-correlation'
];

const PROFILE_PERFORMANCE_RULES = {
  display: {
    lane: 'visible',
    budgetClass: 'interactive',
    hydrationPolicy: 'visible',
    budgetsMs: {
      loadDefine: 40,
      mount: 24,
      hydrate: 32,
      renderUpdate: 24,
      eventAction: null
    },
    criticalMeasurements: [
      'xtend.loader.module',
      'xtend.component.mount',
      'xtend.component.hydrate',
      'xtend.component.render',
      'xtend.component.update'
    ],
    reviewRules: [
      'scope DOM reads to host or shadowRoot',
      'avoid full shadow rebuilds for small state changes'
    ]
  },
  interactive: {
    lane: 'user-blocking',
    budgetClass: 'critical',
    hydrationPolicy: 'visible',
    budgetsMs: {
      loadDefine: 50,
      mount: 28,
      hydrate: 36,
      renderUpdate: 28,
      eventAction: 16
    },
    criticalMeasurements: [
      'xtend.component.hydrate',
      'xtend.component.render',
      'xtend.component.update',
      'xtend.event.handler'
    ],
    reviewRules: [
      'keep event handlers under 16 ms',
      'batch DOM writes after event-derived state reads'
    ]
  },
  overlay: {
    lane: 'user-blocking',
    budgetClass: 'critical',
    hydrationPolicy: 'visible',
    budgetsMs: {
      loadDefine: 60,
      mount: 32,
      hydrate: 40,
      renderUpdate: 32,
      eventAction: 16
    },
    criticalMeasurements: [
      'xtend.component.mount',
      'xtend.component.hydrate',
      'xtend.component.render',
      'xtend.event.handler'
    ],
    reviewRules: [
      'keep open and close paths user-blocking',
      'do focus work without repeated layout reads'
    ]
  },
  routing: {
    lane: 'transition',
    budgetClass: 'interactive',
    hydrationPolicy: 'visible',
    budgetsMs: {
      loadDefine: 70,
      mount: 36,
      hydrate: 48,
      renderUpdate: 48,
      eventAction: 24
    },
    criticalMeasurements: [
      'xtend.route.navigate',
      'xtend.route.render',
      'xtend.component.hydrate',
      'xtend.event.handler'
    ],
    reviewRules: [
      'correlate navigation and render fibers',
      'avoid route-wide DOM scans outside router root'
    ]
  },
  form: {
    lane: 'user-blocking',
    budgetClass: 'critical',
    hydrationPolicy: 'visible',
    budgetsMs: {
      loadDefine: 60,
      mount: 32,
      hydrate: 44,
      renderUpdate: 36,
      eventAction: 16
    },
    criticalMeasurements: [
      'xtend.component.hydrate',
      'xtend.component.update',
      'xtend.event.handler'
    ],
    reviewRules: [
      'validate incrementally rather than by full form rescans',
      'keep input handlers synchronous and small'
    ]
  },
  media: {
    lane: 'visible',
    budgetClass: 'interactive',
    hydrationPolicy: 'visible-or-idle',
    budgetsMs: {
      loadDefine: 90,
      mount: 48,
      hydrate: 80,
      renderUpdate: 48,
      eventAction: 24
    },
    criticalMeasurements: [
      'xtend.component.mount',
      'xtend.component.hydrate',
      'xtend.component.render',
      'xtend.event.handler'
    ],
    reviewRules: [
      'defer non-visible media setup to idle',
      'avoid blocking controls on asset metadata work'
    ]
  },
  stateful: {
    lane: 'user-blocking',
    budgetClass: 'critical',
    hydrationPolicy: 'visible',
    budgetsMs: {
      stateSync: 12,
      eventAction: 16
    },
    criticalMeasurements: [
      'xtend.component.update',
      'xtend.event.handler'
    ],
    reviewRules: [
      'avoid unbounded state subscribers',
      'treat local UI state as derived render cache only'
    ]
  },
  feedback: {
    lane: 'a11y',
    budgetClass: 'critical',
    hydrationPolicy: 'visible',
    budgetsMs: {
      announcement: 16,
      renderUpdate: 24
    },
    criticalMeasurements: [
      'xtend.component.render',
      'xtend.component.update',
      'xtend.event.handler'
    ],
    reviewRules: [
      'clean up timers in disconnectedCallback',
      'do not block render on live-region announcement work'
    ]
  },
  theme: {
    lane: 'visible',
    budgetClass: 'interactive',
    hydrationPolicy: 'visible',
    budgetsMs: {
      themeApply: 24,
      renderUpdate: 24
    },
    criticalMeasurements: [
      'xtend.component.render',
      'xtend.component.update'
    ],
    reviewRules: [
      'apply theme via CSS custom properties',
      'avoid global layout-thrash loops'
    ]
  }
};

const BUDGET_CLASS_PRIORITY = {
  critical: 4,
  interactive: 3,
  background: 2,
  diagnostics: 1,
  best_effort: 0
};

const LANE_PRIORITY = {
  'user-blocking': 5,
  a11y: 4,
  transition: 3,
  visible: 2,
  background: 1,
  diagnostics: 0
};

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function normalizeProfiles(profiles) {
  const list = Array.isArray(profiles) && profiles.length > 0 ? profiles : ['display'];
  const normalized = unique(list.map((profile) => String(profile).trim()).filter(Boolean));
  return normalized.length > 0 ? normalized : ['display'];
}

function getRule(profile) {
  return PROFILE_PERFORMANCE_RULES[profile] || PROFILE_PERFORMANCE_RULES.display;
}

function pickPrimaryProfile(profiles) {
  return PROFILE_PRIORITY.find((profile) => profiles.includes(profile)) || profiles[0] || 'display';
}

function pickHighest(profiles, key, priorityMap) {
  return profiles
    .map((profile) => getRule(profile)[key])
    .filter(Boolean)
    .sort((left, right) => (priorityMap[right] || 0) - (priorityMap[left] || 0))[0];
}

function collectMeasurements(profiles) {
  return unique(profiles.flatMap((profile) => getRule(profile).criticalMeasurements || []));
}

function collectReviewRules(profiles) {
  return unique(GLOBAL_PERFORMANCE_RULES.concat(profiles.flatMap((profile) => getRule(profile).reviewRules || [])));
}

function collectBudgets(profiles) {
  return profiles.reduce((budgets, profile) => {
    const ruleBudgets = getRule(profile).budgetsMs || {};
    Object.keys(ruleBudgets).forEach((key) => {
      const value = ruleBudgets[key];
      if (typeof value !== 'number') {
        return;
      }
      if (typeof budgets[key] !== 'number' || value < budgets[key]) {
        budgets[key] = value;
      }
    });
    return budgets;
  }, {});
}

function createComponentPerformanceProfile(input = {}, options = {}) {
  const plan = options.plan || {};
  const planInput = plan.input || {};
  const tag = input.tag || planInput.tag || 'x-component';
  const name = input.name || planInput.name || tag.replace(/^x-/, '');
  const className = input.className || planInput.className || 'XComponent';
  const profiles = normalizeProfiles(input.profiles || planInput.profiles);
  const primaryProfile = pickPrimaryProfile(profiles);
  const primaryRule = getRule(primaryProfile);
  const budgetClass = pickHighest(profiles, 'budgetClass', BUDGET_CLASS_PRIORITY) || primaryRule.budgetClass;
  const lane = pickHighest(profiles, 'lane', LANE_PRIORITY) || primaryRule.lane;
  const hydrationPolicy = profiles.some((profile) => getRule(profile).hydrationPolicy === 'visible-or-idle')
    ? 'visible-or-idle'
    : primaryRule.hydrationPolicy;

  return {
    schema: PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
    policySchema: PERFORMANCE_POLICY_SCHEMA,
    budgetMatrix: PERFORMANCE_BUDGET_MATRIX_SCHEMA,
    measurementContract: PERFORMANCE_MEASUREMENT_SCHEMA,
    regressionGate: PERFORMANCE_REGRESSION_GATE_SCHEMA,
    hydrationPolicyContract: HYDRATION_POLICY_SCHEMA,
    status: 'scaffold-performance-required',
    mode: 'dry-run-performance-profile',
    componentRef: tag,
    name,
    className,
    profiles,
    primaryProfile,
    budgetClass,
    lane,
    hydrationPolicy,
    budgetsMs: collectBudgets(profiles),
    criticalMeasurements: collectMeasurements(profiles),
    idleOrBackgroundAllowed: hydrationPolicy === 'visible-or-idle' || lane === 'background',
    requiresA11yFiber: profiles.includes('feedback') || lane === 'a11y',
    scaffold: {
      staticGetter: 'xtendScaffoldPerformanceProfile',
      manifestKey: 'performanceProfile',
      authorGuide: 'docs/performance.md',
      budgetMatrix: 'development/XTend-Performance-Budget-Matrix.md',
      requiredDocsSections: ['Performance-Profil', 'Performance-Regeln'],
      requiredGates: [
        'fabric-performance-measurements',
        'performance-regression',
        'hydration-policy',
        'references'
      ]
    },
    reviewRules: collectReviewRules(profiles)
  };
}

module.exports = {
  GLOBAL_PERFORMANCE_RULES,
  HYDRATION_POLICY_SCHEMA,
  PERFORMANCE_BUDGET_MATRIX_SCHEMA,
  PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
  PERFORMANCE_MEASUREMENT_SCHEMA,
  PERFORMANCE_POLICY_SCHEMA,
  PERFORMANCE_REGRESSION_GATE_SCHEMA,
  PROFILE_PERFORMANCE_RULES,
  createComponentPerformanceProfile
};
