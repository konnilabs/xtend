const {
  HYDRATION_POLICY_SCHEMA,
  PERFORMANCE_BUDGET_MATRIX_SCHEMA,
  PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
  PERFORMANCE_MEASUREMENT_SCHEMA,
  PERFORMANCE_POLICY_SCHEMA,
  PERFORMANCE_REGRESSION_GATE_SCHEMA,
  PROFILE_PERFORMANCE_RULES,
  createComponentPerformanceProfile
} = require('./component-performance-profile');

const COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA = 'xtend.component.ux-performance.v1';
const COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA = 'xtend.component.ux-performance-report.v1';
const COMPONENT_UX_PERFORMANCE_WORKPACKAGE = 'WP-E11-05';
const COMPONENT_UX_PERFORMANCE_CONTRACT_DOC = 'development/XTend-Component-UX-Performance-Profile.md';
const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_STYLING_CONTRACT_SCHEMA = 'xtend.component.styling.v1';
const RUNTIME_A11Y_CONTRACT_SCHEMA = 'xtend.component.runtime-a11y.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const RMT_PERFORMANCE_AUTHORING_SCHEMA = 'xtend.rmt.performance-authoring.v1';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS = [
  'profile',
  'budgets',
  'measurements',
  'hydration',
  'lanes',
  'scheduling',
  'backpressure',
  'interaction',
  'overlays',
  'forms',
  'routing',
  'a11y',
  'styling',
  'rmt',
  'fabric',
  'compatibility',
  'docs',
  'tests'
];

const COMPONENT_UX_PERFORMANCE_PROFILES = [
  'display',
  'interactive',
  'form',
  'feedback',
  'overlay',
  'routing',
  'media',
  'stateful',
  'theme'
];

const COMPONENT_UX_PERFORMANCE_PHASES = [
  'load',
  'define',
  'mount',
  'hydrate',
  'render',
  'update',
  'event',
  'route',
  'teardown',
  'diagnostics'
];

const COMPONENT_UX_PERFORMANCE_BUDGET_CLASSES = [
  'critical',
  'interactive',
  'background',
  'diagnostics',
  'best_effort'
];

const COMPONENT_UX_PERFORMANCE_LANES = [
  'user-blocking',
  'a11y',
  'transition',
  'visible',
  'idle',
  'background',
  'diagnostics'
];

const COMPONENT_UX_PERFORMANCE_HYDRATION_POLICIES = [
  'visible',
  'idle',
  'lazy',
  'visible-or-idle'
];

const COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS = [
  'budget-class-derived',
  'lane-derived',
  'hydration-policy-derived',
  'critical-measurements-present',
  'event-budget-bounded',
  'no-layout-thrashing',
  'observer-cleanup',
  'reduced-motion-safe',
  'telemetry-correlation',
  'regression-gate-linked'
];

const MEASUREMENT_PHASES = {
  'xtend.loader.manifest': 'load',
  'xtend.loader.module': 'load',
  'xtend.component.define': 'define',
  'xtend.component.mount': 'mount',
  'xtend.component.hydrate': 'hydrate',
  'xtend.component.render': 'render',
  'xtend.component.update': 'update',
  'xtend.event.handler': 'event',
  'xtend.route.navigate': 'route',
  'xtend.route.render': 'route',
  'xtend.diagnostics.snapshot': 'diagnostics'
};

const HYDRATION_DEADLINE_MS = {
  visible: 160,
  idle: 500,
  lazy: 750,
  'visible-or-idle': 500
};

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function normalizeProfiles(profiles) {
  const list = normalizeArray(profiles).length > 0 ? profiles : ['display'];
  const normalized = unique(list.map((profile) => String(profile).trim()).filter(Boolean));
  const known = normalized.filter((profile) => COMPONENT_UX_PERFORMANCE_PROFILES.includes(profile));
  return known.length > 0 ? known : ['display'];
}

function getKnownRule(profile) {
  return PROFILE_PERFORMANCE_RULES[profile] || PROFILE_PERFORMANCE_RULES.display;
}

function resolveHydrationScheduleRefs(policy) {
  if (policy === 'visible-or-idle') {
    return ['component.visible.hydrate', 'component.idle.hydrate'];
  }
  if (policy === 'lazy') {
    return ['component.lazy.hydrate'];
  }
  if (policy === 'idle') {
    return ['component.idle.hydrate'];
  }
  return ['component.visible.hydrate'];
}

function normalizeBudgets(budgets = {}) {
  return Object.keys(budgets).reduce((normalized, key) => {
    const value = Number(budgets[key]);
    if (Number.isFinite(value) && value > 0) {
      normalized[key] = value;
    }
    return normalized;
  }, {});
}

function createComponentUxPerformanceContract(input = {}) {
  const performanceProfile = input.performanceProfile || createComponentPerformanceProfile(input);
  const tag = input.tag || performanceProfile.componentRef || 'x-example';
  const profiles = normalizeProfiles(input.profiles || performanceProfile.profiles);
  const primaryProfile = input.primaryProfile || performanceProfile.primaryProfile || profiles[0] || 'display';
  const budgetClass = input.budgetClass || performanceProfile.budgetClass || getKnownRule(primaryProfile).budgetClass;
  const lane = input.lane || performanceProfile.lane || getKnownRule(primaryProfile).lane;
  const hydrationPolicy = input.hydrationPolicy || performanceProfile.hydrationPolicy || getKnownRule(primaryProfile).hydrationPolicy;
  const budgetsMs = normalizeBudgets({
    ...(performanceProfile.budgetsMs || {}),
    ...(input.budgetsMs || {})
  });
  const criticalMeasurements = unique((performanceProfile.criticalMeasurements || []).concat(normalizeArray(input.criticalMeasurements)));
  const measurementPhases = unique(criticalMeasurements.map((measurement) => MEASUREMENT_PHASES[measurement] || 'runtime')
    .filter((phase) => phase !== 'runtime')
    .concat(normalizeArray(input.measurementPhases)));
  const scheduleRefs = unique(resolveHydrationScheduleRefs(hydrationPolicy).concat(normalizeArray(input.scheduleRefs)));
  const eventActionBudgetMs = typeof budgetsMs.eventAction === 'number' ? budgetsMs.eventAction : null;

  return {
    schema: COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
    status: 'contract-draft',
    workpackage: COMPONENT_UX_PERFORMANCE_WORKPACKAGE,
    performancePolicy: PERFORMANCE_POLICY_SCHEMA,
    componentPerformanceProfile: PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
    budgetMatrix: PERFORMANCE_BUDGET_MATRIX_SCHEMA,
    measurementContract: PERFORMANCE_MEASUREMENT_SCHEMA,
    regressionGate: PERFORMANCE_REGRESSION_GATE_SCHEMA,
    hydrationPolicyContract: HYDRATION_POLICY_SCHEMA,
    shellContract: COMPONENT_SHELL_CONTRACT_SCHEMA,
    stylingContract: COMPONENT_STYLING_CONTRACT_SCHEMA,
    runtimeA11yContract: RUNTIME_A11Y_CONTRACT_SCHEMA,
    tag,
    profiles,
    primaryProfile,
    budgetClass,
    lane,
    hydrationPolicy,
    profile: {
      sourceSchema: PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
      allowedProfiles: COMPONENT_UX_PERFORMANCE_PROFILES.slice(),
      selected: profiles,
      primary: primaryProfile,
      scaffoldStatus: performanceProfile.status || 'scaffold-performance-required'
    },
    budgets: {
      matrix: PERFORMANCE_BUDGET_MATRIX_SCHEMA,
      budgetClass,
      budgetsMs,
      budgetKeys: Object.keys(budgetsMs),
      warningPolicy: 'warn-before-fail',
      failMultiplier: 1.5,
      eventActionBudgetMs,
      shellBudgetKeys: ['loadDefine', 'mount', 'hydrate', 'renderUpdate']
    },
    measurements: {
      schema: PERFORMANCE_MEASUREMENT_SCHEMA,
      phases: unique(COMPONENT_UX_PERFORMANCE_PHASES.concat(measurementPhases)),
      criticalMeasurements,
      requiredCorrelationFields: ['componentRef', 'fiberId', 'lane', 'phase', 'durationMs', 'budgetMs'],
      telemetrySnapshotRequired: true
    },
    hydration: {
      schema: HYDRATION_POLICY_SCHEMA,
      policy: hydrationPolicy,
      scheduleRefs,
      deadlineMs: HYDRATION_DEADLINE_MS[hydrationPolicy] || 500,
      idleOrBackgroundAllowed: Boolean(performanceProfile.idleOrBackgroundAllowed || hydrationPolicy !== 'visible'),
      visibleWorkMustStayBounded: true
    },
    lanes: {
      allowed: COMPONENT_UX_PERFORMANCE_LANES.slice(),
      selected: lane,
      rmtMappingRequired: true,
      nonVisibleUserBlockingRefused: true
    },
    scheduling: {
      rmtAuthoring: RMT_PERFORMANCE_AUTHORING_SCHEMA,
      scheduleRefs,
      endpointHints: ['xtendrmt.component.hydrate', 'xtendrmt.component.render', 'xtendrmt.route.render'],
      coalescingRequiredForRepeatedWork: true,
      preferIdleAllowed: hydrationPolicy !== 'visible'
    },
    backpressure: {
      levels: ['none', 'low', 'medium', 'high', 'critical'],
      highDefersNeutralHydration: true,
      criticalKeepsUserInputAndA11y: true,
      diagnosticsRequired: true
    },
    interaction: {
      eventActionBudgetMs,
      userInputLane: 'user-blocking',
      synchronousHandlerMaxMs: eventActionBudgetMs || 16,
      highFrequencyEventsMustCoalesce: true
    },
    overlays: {
      openCloseBudgetMs: profiles.includes('overlay') ? (eventActionBudgetMs || 16) : null,
      focusWorkBudgeted: true,
      scrollLockMustNotForceLayoutLoop: true
    },
    forms: {
      inputEventBudgetMs: profiles.includes('form') ? (eventActionBudgetMs || 16) : null,
      validationMustBeIncremental: true,
      firstInvalidFocusBudgeted: true
    },
    routing: {
      routeNavigateMeasure: 'xtend.route.navigate',
      routeRenderMeasure: 'xtend.route.render',
      routeRenderBudgetMs: typeof budgetsMs.renderUpdate === 'number' ? budgetsMs.renderUpdate : null,
      focusRestoreCorrelated: true
    },
    a11y: {
      runtimeContract: RUNTIME_A11Y_CONTRACT_SCHEMA,
      requiresA11yFiber: Boolean(performanceProfile.requiresA11yFiber || lane === 'a11y'),
      announcementBudgetMs: typeof budgetsMs.announcement === 'number' ? budgetsMs.announcement : 16,
      reducedMotionSafe: true
    },
    styling: {
      stylingContract: COMPONENT_STYLING_CONTRACT_SCHEMA,
      themeApplyBudgetMs: typeof budgetsMs.themeApply === 'number' ? budgetsMs.themeApply : 24,
      tokenUpdatesMustAvoidLayoutThrashing: true
    },
    rmt: {
      schema: RMT_PERFORMANCE_AUTHORING_SCHEMA,
      adapter: 'xtend.component',
      fields: ['performance', 'budgetClass', 'lane', 'hydrationPolicy', 'scheduleRef', 'deadlineMs', 'preferIdle', 'coalesceKey'],
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      schema: FABRIC_BOUNDARY_SCHEMA,
      telemetryCorrelationRequired: true,
      fiberKinds: ['component.mount', 'component.hydrate', 'component.render', 'component.update', 'event.handler', 'route.render'],
      diagnostics: ['performance.budget.warn', 'performance.budget.fail', 'performance.layout.thrash', 'performance.cleanup.missing']
    },
    compatibility: {
      hostModes: ['xtend-only', 'rmt-first', 'vanilla', 'react', 'vue', 'custom-shell'],
      performanceByDesign: true,
      noFrameworkSpecificWrapperRequired: true,
      noCdnDependency: true
    },
    docs: {
      contract: COMPONENT_UX_PERFORMANCE_CONTRACT_DOC,
      authorGuide: 'docs/performance.md',
      budgetMatrix: 'development/XTend-Performance-Budget-Matrix.md',
      requiredSections: ['Performance-Profil', 'Budgets', 'Messpunkte', 'Hydration', 'Lanes', 'Backpressure', 'RMT Authoring']
    },
    tests: {
      requiredSuites: ['component-ux-performance', 'fabric-performance-measurements', 'performance-regression', 'hydration-policy', 'references'],
      assertions: COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS.slice(),
      regressionGateRequired: true,
      browserSmokeRequiredForP0: true
    }
  };
}

function validateComponentUxPerformanceContract(contract = {}) {
  const errors = [];

  if (contract.schema !== COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA) {
    errors.push(`schema must be ${COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA}`);
  }
  if (!/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(contract.tag || ''))) {
    errors.push('tag must be a valid XTend custom element tag');
  }

  COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) {
      errors.push(`missing domain: ${domain}`);
    }
  });

  if (!Array.isArray(contract.profiles) || contract.profiles.some((profile) => !COMPONENT_UX_PERFORMANCE_PROFILES.includes(profile))) {
    errors.push(`profiles must use known values: ${COMPONENT_UX_PERFORMANCE_PROFILES.join(', ')}`);
  }
  if (!COMPONENT_UX_PERFORMANCE_BUDGET_CLASSES.includes(contract.budgetClass)) {
    errors.push(`budgetClass must be one of: ${COMPONENT_UX_PERFORMANCE_BUDGET_CLASSES.join(', ')}`);
  }
  if (!COMPONENT_UX_PERFORMANCE_LANES.includes(contract.lane)) {
    errors.push(`lane must be one of: ${COMPONENT_UX_PERFORMANCE_LANES.join(', ')}`);
  }
  if (!COMPONENT_UX_PERFORMANCE_HYDRATION_POLICIES.includes(contract.hydrationPolicy)) {
    errors.push(`hydrationPolicy must be one of: ${COMPONENT_UX_PERFORMANCE_HYDRATION_POLICIES.join(', ')}`);
  }
  if (!contract.budgets || contract.budgets.matrix !== PERFORMANCE_BUDGET_MATRIX_SCHEMA) {
    errors.push(`budgets.matrix must be ${PERFORMANCE_BUDGET_MATRIX_SCHEMA}`);
  }
  if (!contract.budgets || !contract.budgets.budgetsMs || Object.keys(contract.budgets.budgetsMs).length === 0) {
    errors.push('budgets.budgetsMs must include at least one budget');
  }
  if (contract.budgets && contract.budgets.budgetsMs) {
    Object.keys(contract.budgets.budgetsMs).forEach((key) => {
      if (!(Number(contract.budgets.budgetsMs[key]) > 0)) {
        errors.push(`budget ${key} must be a positive number`);
      }
    });
  }
  if (!contract.measurements || contract.measurements.schema !== PERFORMANCE_MEASUREMENT_SCHEMA) {
    errors.push(`measurements.schema must be ${PERFORMANCE_MEASUREMENT_SCHEMA}`);
  }
  if (!contract.measurements || !Array.isArray(contract.measurements.criticalMeasurements) || contract.measurements.criticalMeasurements.length === 0) {
    errors.push('measurements.criticalMeasurements must not be empty');
  }
  if (contract.hydration && !Array.isArray(contract.hydration.scheduleRefs)) {
    errors.push('hydration.scheduleRefs must be present');
  }
  if (contract.rmt && contract.rmt.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('rmt.kernelBoundary must keep the RMT kernel decoupled from XTend types');
  }
  if (contract.fabric && contract.fabric.telemetryCorrelationRequired !== true) {
    errors.push('fabric.telemetryCorrelationRequired must be true');
  }
  if (contract.compatibility && contract.compatibility.performanceByDesign !== true) {
    errors.push('compatibility.performanceByDesign must be true');
  }
  if (!contract.tests || !normalizeArray(contract.tests.requiredSuites).includes('component-ux-performance')) {
    errors.push('tests.requiredSuites must include component-ux-performance');
  }
  if (!contract.tests || !normalizeArray(contract.tests.requiredSuites).includes('performance-regression')) {
    errors.push('tests.requiredSuites must include performance-regression');
  }

  return {
    schema: COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_UX_PERFORMANCE_BUDGET_CLASSES,
  COMPONENT_UX_PERFORMANCE_CONTRACT_DOC,
  COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
  COMPONENT_UX_PERFORMANCE_HYDRATION_POLICIES,
  COMPONENT_UX_PERFORMANCE_LANES,
  COMPONENT_UX_PERFORMANCE_PHASES,
  COMPONENT_UX_PERFORMANCE_PROFILES,
  COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA,
  COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS,
  COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS,
  COMPONENT_UX_PERFORMANCE_WORKPACKAGE,
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_STYLING_CONTRACT_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  HYDRATION_POLICY_SCHEMA,
  KERNEL_BOUNDARY,
  PERFORMANCE_BUDGET_MATRIX_SCHEMA,
  PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
  PERFORMANCE_MEASUREMENT_SCHEMA,
  PERFORMANCE_POLICY_SCHEMA,
  PERFORMANCE_REGRESSION_GATE_SCHEMA,
  RMT_PERFORMANCE_AUTHORING_SCHEMA,
  RUNTIME_A11Y_CONTRACT_SCHEMA,
  createComponentUxPerformanceContract,
  validateComponentUxPerformanceContract
};
