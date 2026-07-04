const {
  COMPONENT_LAB_UX_FAMILY_IDS,
  COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH,
  COMPONENT_LAB_UX_INSPECTOR_SCHEMA,
  COMPONENT_LAB_UX_NEXT_WORKPACKAGE,
  createComponentLabUxInspectorPlan
} = require('../../xtend-builder/preview/component-lab-ux-inspector');

const COMPONENT_UX_BROWSER_SMOKE_SCHEMA = 'xtend.epic11.component-ux-browser-smokes.v1';
const COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA = 'xtend.epic11.component-ux-browser-smokes-report.v1';
const COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE = 'WP-E11-14';
const COMPONENT_UX_BROWSER_SMOKE_NEXT_WORKPACKAGE = 'WP-E11-15';
const COMPONENT_UX_BROWSER_SMOKE_DOC_PATH = 'development/XTend-Epic11-Browsernahe-UX-Smoke-Matrix.md';
const COMPONENT_UX_BROWSER_SMOKE_WP_PATH = 'development/WP-E11-14-Browsernahe-UX-und-Kompatibilitaets-Smokes-erweitern.md';
const COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH = 'tests/browser/fixtures/epic11-ux-compatibility-smoke.html';
const COMPONENT_UX_BROWSER_SMOKE_SUITE_PATH = 'tests/browser/component_ux_browser_smoke_suite.js';
const COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE = 'node scripts/run_xtend_tests.js component-ux-browser-smokes --json';
const COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY = '__xtendEpic11UxSmokeResult';
const COMPONENT_UX_BROWSER_SMOKE_CONTRACT_META = 'xtend.epic11.component-ux-browser-smokes.v1';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const COMPONENT_UX_BROWSER_SMOKE_FLOWS = Object.freeze([
  {
    id: 'form-validation-journey',
    family: 'form-controls',
    components: ['x-form', 'x-input', 'x-select', 'x-checkbox', 'x-toggle'],
    verifies: ['delegated-focus', 'input-state-sync', 'form-data-aggregation', 'validation-feedback'],
    fixtureChecks: [
      'form input synchronized state',
      'form data aggregation visible',
      'form validation feedback surfaced'
    ]
  },
  {
    id: 'feedback-status-journey',
    family: 'feedback-status',
    components: ['x-alert', 'x-toast', 'x-status', 'x-progress'],
    verifies: ['live-region', 'status-semantics', 'progress-state', 'dismiss-contract'],
    fixtureChecks: [
      'feedback live region components rendered',
      'feedback progress state visible',
      'toast api rendered ux notification'
    ]
  },
  {
    id: 'navigation-routing-journey',
    family: 'navigation-routing',
    components: ['x-router', 'x-link', 'x-tabs'],
    verifies: ['keyboard-navigation', 'route-render', 'active-state', 'route-announcement', 'tablist-a11y', 'roving-tabindex'],
    fixtureChecks: [
      'navigation enter key rendered detail route',
      'navigation active state synchronized',
      'route announcement state visible',
      'tabs arrow key selected next tab',
      'tabs home end keys preserve roving focus',
      'tabs aria controls visible panel'
    ]
  },
  {
    id: 'overlay-focus-journey',
    family: 'overlay-interaction',
    components: ['x-modal', 'x-drawer'],
    verifies: ['initial-focus', 'focus-trap', 'escape-close', 'focus-restore'],
    fixtureChecks: [
      'overlay modal moved focus inside',
      'overlay escape restored focus',
      'drawer custom element available'
    ]
  },
  {
    id: 'layout-display-media-journey',
    family: 'layout-display-media',
    components: ['x-section', 'x-cards', 'x-code', 'x-player'],
    verifies: ['shell-render', 'responsive-container', 'code-display', 'lazy-media-shell'],
    fixtureChecks: [
      'layout shell components available',
      'layout display surface rendered',
      'media shell remains lazy-loadable'
    ]
  }
]);

function createComponentUxBrowserSmokePlan(options = {}) {
  const rootDir = options.rootDir;
  const inspectorPlan = options.inspectorPlan || createComponentLabUxInspectorPlan({ rootDir });
  const familyMap = new Map((inspectorPlan.uxFamilies || []).map((family) => [family.id, family]));
  const flows = COMPONENT_UX_BROWSER_SMOKE_FLOWS.map((flow) => {
    const family = familyMap.get(flow.family) || {};
    return {
      schema: 'xtend.epic11.component-ux-browser-smoke-flow.v1',
      id: flow.id,
      family: flow.family,
      familySchema: family.schema || null,
      sourceFixture: family.fixture || null,
      sourceSuite: family.suite || null,
      components: flow.components.slice(),
      verifies: flow.verifies.slice(),
      fixtureChecks: flow.fixtureChecks.slice(),
      resultKey: COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY,
      status: 'accepted'
    };
  });

  return {
    schema: COMPONENT_UX_BROWSER_SMOKE_SCHEMA,
    reportSchema: COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA,
    status: 'accepted-smoke-plan',
    workpackage: COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE,
    contract: COMPONENT_UX_BROWSER_SMOKE_DOC_PATH,
    workpackageDocument: COMPONENT_UX_BROWSER_SMOKE_WP_PATH,
    fixture: COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH,
    suite: COMPONENT_UX_BROWSER_SMOKE_SUITE_PATH,
    localGate: COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE,
    resultKey: COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY,
    contractMeta: COMPONENT_UX_BROWSER_SMOKE_CONTRACT_META,
    renderMode: 'shell-first',
    localOnly: true,
    externalNetworkAllowed: false,
    browserHarness: {
      defaultMode: 'self-checking-fixture-contract',
      optionalDriver: 'XTEND_BROWSER_SMOKE_DRIVER=safari',
      suite: 'browser',
      fixturePath: COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH,
      resultKey: COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY
    },
    sourceInspector: {
      schema: COMPONENT_LAB_UX_INSPECTOR_SCHEMA,
      fixture: COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH,
      workpackage: COMPONENT_LAB_UX_NEXT_WORKPACKAGE,
      targetCount: inspectorPlan.coverageSummary && inspectorPlan.coverageSummary.targetCount,
      familyCount: inspectorPlan.coverageSummary && inspectorPlan.coverageSummary.familyCount
    },
    uxFamilies: COMPONENT_LAB_UX_FAMILY_IDS.slice(),
    flows,
    coverage: {
      flowCount: flows.length,
      componentCount: Array.from(new Set(flows.flatMap((flow) => flow.components))).length,
      familyCount: COMPONENT_LAB_UX_FAMILY_IDS.length
    },
    gates: [
      'component-ux-browser-smokes',
      'browser',
      'component-lab-ux-inspector',
      'form-controls-ux',
      'feedback-status-ux',
      'navigation-routing-ux',
      'overlay-interaction-ux',
      'layout-display-media-ux',
      'references'
    ],
    handoff: {
      nextWorkpackage: COMPONENT_UX_BROWSER_SMOKE_NEXT_WORKPACKAGE,
      reason: 'Die UX-Journeys koennen nun als Basis fuer Visual Regression und Theme Matrix dienen.'
    },
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function validateComponentUxBrowserSmokePlan(plan) {
  const errors = [];
  const flows = plan && Array.isArray(plan.flows) ? plan.flows : [];

  if (!plan || plan.schema !== COMPONENT_UX_BROWSER_SMOKE_SCHEMA) {
    errors.push('plan schema must be xtend.epic11.component-ux-browser-smokes.v1');
  }
  if (!plan || plan.workpackage !== COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE) {
    errors.push('plan workpackage must be WP-E11-14');
  }
  if (!plan || plan.fixture !== COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH) {
    errors.push('plan fixture path must point to the Epic 11 UX smoke fixture');
  }
  if (!plan || plan.resultKey !== COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY) {
    errors.push('plan result key must expose the Epic 11 UX smoke result');
  }
  if (!plan || plan.localOnly !== true || plan.externalNetworkAllowed !== false) {
    errors.push('browser smokes must be local-only and reject external network dependencies');
  }
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('browser smokes must preserve the RMT kernel boundary');
  }
  if (flows.length !== COMPONENT_UX_BROWSER_SMOKE_FLOWS.length) {
    errors.push('plan must expose five browser-near UX journeys');
  }
  COMPONENT_LAB_UX_FAMILY_IDS.forEach((familyId) => {
    if (!flows.some((flow) => flow.family === familyId)) {
      errors.push(`missing browser UX flow for family ${familyId}`);
    }
  });
  flows.forEach((flow) => {
    if (!flow.familySchema || !flow.sourceFixture || !flow.sourceSuite) {
      errors.push(`${flow.id}: flow must link family schema, fixture and suite`);
    }
    if (!Array.isArray(flow.components) || flow.components.length < 2) {
      errors.push(`${flow.id}: flow must cover at least two components`);
    }
    if (!Array.isArray(flow.fixtureChecks) || flow.fixtureChecks.length < 3) {
      errors.push(`${flow.id}: flow must expose at least three fixture checks`);
    }
    if (flow.resultKey !== COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY) {
      errors.push(`${flow.id}: flow result key must match fixture result key`);
    }
  });

  return {
    schema: COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createComponentUxBrowserSmokeGate(options = {}) {
  const plan = options.plan || createComponentUxBrowserSmokePlan(options);
  const validation = validateComponentUxBrowserSmokePlan(plan);
  return {
    schema: COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA,
    ok: validation.ok,
    plan,
    errors: validation.errors,
    warnings: []
  };
}

module.exports = {
  COMPONENT_UX_BROWSER_SMOKE_CONTRACT_META,
  COMPONENT_UX_BROWSER_SMOKE_DOC_PATH,
  COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH,
  COMPONENT_UX_BROWSER_SMOKE_FLOWS,
  COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE,
  COMPONENT_UX_BROWSER_SMOKE_NEXT_WORKPACKAGE,
  COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA,
  COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY,
  COMPONENT_UX_BROWSER_SMOKE_SCHEMA,
  COMPONENT_UX_BROWSER_SMOKE_SUITE_PATH,
  COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE,
  COMPONENT_UX_BROWSER_SMOKE_WP_PATH,
  KERNEL_BOUNDARY,
  createComponentUxBrowserSmokeGate,
  createComponentUxBrowserSmokePlan,
  validateComponentUxBrowserSmokePlan
};
