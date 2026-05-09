const {
  createComponentCatalogCoverageReport
} = require('./component-catalog-coverage');
const {
  createComponentPerformanceProfile
} = require('../xtend-builder/performance/component-performance-profile');

const COMPONENT_REGRESSION_PRIORITY_SCHEMA = 'xtend.catalog.component-regression-priority-plan.v1';
const COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA = 'xtend.catalog.component-regression-priority-entry.v1';
const COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA = 'xtend.catalog.component-regression-priority-gate.v1';

const CORE_VIEWPORTS = Object.freeze([
  'desktop-1280',
  'mobile-390'
]);

const CORE_THEME_VARIANTS = Object.freeze([
  'light',
  'dark',
  'forced-colors',
  'reduced-motion'
]);

const PROFILE_BROWSER_SMOKES = Object.freeze({
  routing: ['route-change', 'keyboard-navigation', 'history-state', 'rmt-route-adapter'],
  form: ['input-sync', 'validation-feedback', 'keyboard-entry', 'form-associated-submit'],
  overlay: ['focus-trap', 'escape-close', 'scroll-lock', 'focus-restore'],
  feedback: ['live-region', 'dismiss-timer', 'reduced-motion'],
  interactive: ['keyboard-activation', 'focus-visible', 'mobile-tap'],
  media: ['media-controls', 'poster-load', 'fullscreen-toggle'],
  theme: ['theme-switch', 'token-contrast', 'forced-colors'],
  stateful: ['state-sync', 'derived-render-cache'],
  display: ['layout-stability', 'responsive-overflow'],
  iconography: ['layout-stability', 'theme-token-color'],
  infrastructure: ['state-api-integration'],
  utility: ['utility-integration-probe']
});

const PROFILE_VISUAL_STATES = Object.freeze({
  routing: ['initial-route', 'active-route', 'rmt-scheduled-route'],
  form: ['default', 'focus', 'invalid', 'disabled'],
  overlay: ['closed', 'open', 'focus-trapped', 'reduced-motion-open'],
  feedback: ['info', 'warning', 'error', 'dismissed'],
  interactive: ['default', 'hover', 'focus-visible', 'active', 'disabled'],
  media: ['poster', 'playing', 'controls-focus'],
  theme: ['light-theme', 'dark-theme', 'forced-colors'],
  stateful: ['initial-state', 'state-updated'],
  display: ['default-layout', 'narrow-layout'],
  iconography: ['default-layout', 'high-contrast-currentColor'],
  infrastructure: ['api-ready'],
  utility: ['helper-ready']
});

const WAVE_LABELS = Object.freeze({
  1: 'P0 browser-critical regression baseline',
  2: 'P1 visual and performance baseline',
  3: 'P2 long-tail suite and fixture completion',
  4: 'visual snapshot automation handoff'
});

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function sortEntriesByPriority(entries) {
  const priorityOrder = { P0: 0, P1: 1, P2: 2 };
  return entries.slice().sort((left, right) => {
    const priorityDiff = (priorityOrder[left.priority] || 99) - (priorityOrder[right.priority] || 99);
    if (priorityDiff !== 0) return priorityDiff;
    return left.tag.localeCompare(right.tag);
  });
}

function resolveTier(entry) {
  if (entry.priority === 'P0') return 'p0-browser-critical';
  if (entry.priority === 'P1' || entry.status === 'typed-contract-gated') return 'p1-visual-performance';
  return 'p2-long-tail';
}

function resolveWave(entry) {
  if (entry.priority === 'P0') return 1;
  if (entry.priority === 'P1') return 2;
  if (!entry.coverage.componentSuite || !entry.coverage.fixture || !entry.coverage.types) return 3;
  return 4;
}

function collectByProfiles(profiles, source) {
  return unique(profiles.flatMap((profile) => source[profile] || []));
}

function resolveRemediation(entry) {
  const remediation = [];
  if (!entry.coverage.componentSuite || !entry.coverage.fixture) {
    remediation.push('long-tail-component-suite-and-fixture');
  }
  if (!entry.coverage.types) {
    remediation.push('public-types-long-tail');
  }
  if (!entry.coverage.a11y) {
    remediation.push('a11y-profile-remediation');
  }
  if (!entry.coverage.performance) {
    remediation.push('performance-profile-authoring');
  }
  if (entry.customElement === false) {
    remediation.push('non-custom-element-integration-probe');
  }
  return remediation;
}

function createRegressionPriorityEntry(entry) {
  const profiles = entry.profiles || ['display'];
  const performanceProfile = createComponentPerformanceProfile({
    tag: entry.tag,
    name: entry.tag.replace(/^x-/, ''),
    profiles
  });
  const tier = resolveTier(entry);
  const wave = resolveWave(entry);
  const browserSmokes = collectByProfiles(profiles, PROFILE_BROWSER_SMOKES);
  const visualStates = collectByProfiles(profiles, PROFILE_VISUAL_STATES);

  return {
    schema: COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA,
    tag: entry.tag,
    catalogStatus: entry.status,
    priority: entry.priority,
    profiles,
    tier,
    wave,
    waveLabel: WAVE_LABELS[wave],
    customElement: entry.customElement,
    viewports: CORE_VIEWPORTS.slice(),
    themeVariants: CORE_THEME_VARIANTS.slice(),
    browserSmokes,
    visualStates,
    performanceProfile: {
      schema: performanceProfile.schema,
      budgetClass: performanceProfile.budgetClass,
      lane: performanceProfile.lane,
      hydrationPolicy: performanceProfile.hydrationPolicy,
      primaryProfile: performanceProfile.primaryProfile,
      criticalMeasurements: performanceProfile.criticalMeasurements
    },
    remediation: resolveRemediation(entry),
    requiredGates: [
      'node scripts/run_xtend_tests.js browser --json',
      'node scripts/run_xtend_tests.js performance-regression --json',
      'node scripts/run_xtend_tests.js catalog-coverage --json',
      'node scripts/run_xtend_tests.js references --json'
    ],
    nextAction: wave === 1
      ? 'ER-WP-36: CI Gate fuer browserkritische Regression produktisieren'
      : 'ER-WP-36/ER-WP-38: Regression in CI und Release Checklist staffeln'
  };
}

function summarizeRegressionPriorityEntries(entries) {
  return entries.reduce((summary, entry) => {
    summary.byTier[entry.tier] = (summary.byTier[entry.tier] || 0) + 1;
    summary.byWave[String(entry.wave)] = (summary.byWave[String(entry.wave)] || 0) + 1;
    if (entry.remediation.includes('performance-profile-authoring')) {
      summary.requiresPerformanceProfile += 1;
    }
    if (entry.remediation.includes('a11y-profile-remediation')) {
      summary.requiresA11yRemediation += 1;
    }
    if (entry.remediation.includes('long-tail-component-suite-and-fixture')) {
      summary.requiresLongTailSuite += 1;
    }
    return summary;
  }, {
    componentCount: entries.length,
    byTier: {},
    byWave: {},
    requiresPerformanceProfile: 0,
    requiresA11yRemediation: 0,
    requiresLongTailSuite: 0
  });
}

function createComponentRegressionPriorityPlan(options = {}) {
  const coverageReport = options.coverageReport || createComponentCatalogCoverageReport(options);
  const entries = sortEntriesByPriority(coverageReport.entries).map(createRegressionPriorityEntry);

  return {
    schema: COMPONENT_REGRESSION_PRIORITY_SCHEMA,
    generatedAt: options.generatedAt || 'static-local',
    sourceCoverageSchema: coverageReport.schema,
    entrySchema: COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA,
    gateSchema: COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA,
    workpackage: 'ER-WP-35',
    scope: [
      'visual-snapshots',
      'browser-smokes',
      'mobile-viewports',
      'theme-variants',
      'performance-profiles',
      'long-tail-regression'
    ],
    viewports: CORE_VIEWPORTS.slice(),
    themeVariants: CORE_THEME_VARIANTS.slice(),
    waves: Object.assign({}, WAVE_LABELS),
    entries,
    summary: summarizeRegressionPriorityEntries(entries),
    gates: {
      local: 'node scripts/run_xtend_tests.js regression-priority --json',
      packageScript: 'npm run test:regression-priority',
      browser: 'node scripts/run_xtend_tests.js browser --json',
      performance: 'node scripts/run_xtend_tests.js performance-regression --json',
      references: 'node scripts/run_xtend_tests.js references --json'
    },
    handoff: {
      ci: 'ER-WP-36',
      releaseChecklist: 'ER-WP-38',
      adoptionGuide: 'ER-WP-39'
    }
  };
}

function validateComponentRegressionPriorityPlan(plan) {
  const errors = [];
  if (!plan || plan.schema !== COMPONENT_REGRESSION_PRIORITY_SCHEMA) {
    errors.push('plan schema must be xtend.catalog.component-regression-priority-plan.v1');
  }
  if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) {
    errors.push('plan entries must be a non-empty array');
  }

  (plan && plan.entries || []).forEach((entry) => {
    if (entry.schema !== COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA) {
      errors.push(`${entry.tag || '<unknown>'}: entry schema must be xtend.catalog.component-regression-priority-entry.v1`);
    }
    if (!Array.isArray(entry.viewports) || !entry.viewports.includes('desktop-1280') || !entry.viewports.includes('mobile-390')) {
      errors.push(`${entry.tag}: desktop and mobile viewport coverage must be planned`);
    }
    if (!Array.isArray(entry.themeVariants) || !entry.themeVariants.includes('light') || !entry.themeVariants.includes('dark')) {
      errors.push(`${entry.tag}: light and dark theme variants must be planned`);
    }
    if (!entry.performanceProfile || entry.performanceProfile.schema !== 'xtend.performance.component-profile.v1') {
      errors.push(`${entry.tag}: performance profile plan must be derived`);
    }
    if (entry.priority === 'P0' && entry.tier !== 'p0-browser-critical') {
      errors.push(`${entry.tag}: P0 component must be browser-critical`);
    }
    if (entry.customElement !== false && (!Array.isArray(entry.visualStates) || entry.visualStates.length === 0)) {
      errors.push(`${entry.tag}: custom element must define visual states`);
    }
  });

  return {
    schema: COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createComponentRegressionPriorityGate(options = {}) {
  const plan = createComponentRegressionPriorityPlan(options);
  const validation = validateComponentRegressionPriorityPlan(plan);
  const warnings = [];

  if (plan.summary.requiresPerformanceProfile > 0) {
    warnings.push({
      dimension: 'performance',
      count: plan.summary.requiresPerformanceProfile,
      message: `${plan.summary.requiresPerformanceProfile} component performance profiles still need runtime/source authoring`
    });
  }
  if (plan.summary.requiresA11yRemediation > 0) {
    warnings.push({
      dimension: 'a11y',
      count: plan.summary.requiresA11yRemediation,
      message: `${plan.summary.requiresA11yRemediation} components need A11y remediation before enterprise-ready classification`
    });
  }
  if (plan.summary.requiresLongTailSuite > 0) {
    warnings.push({
      dimension: 'long-tail',
      count: plan.summary.requiresLongTailSuite,
      message: `${plan.summary.requiresLongTailSuite} long-tail components still need suite and fixture coverage`
    });
  }

  return {
    schema: COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA,
    ok: validation.ok,
    plan,
    errors: validation.errors,
    warnings
  };
}

module.exports = {
  COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA,
  COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA,
  COMPONENT_REGRESSION_PRIORITY_SCHEMA,
  CORE_THEME_VARIANTS,
  CORE_VIEWPORTS,
  PROFILE_BROWSER_SMOKES,
  PROFILE_VISUAL_STATES,
  createComponentRegressionPriorityGate,
  createComponentRegressionPriorityPlan,
  validateComponentRegressionPriorityPlan
};
