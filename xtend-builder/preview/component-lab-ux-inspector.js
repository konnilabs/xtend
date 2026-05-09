const {
  createComponentCatalogCoverageReport
} = require('../../catalog/component-catalog-coverage');
const {
  FORM_CONTROLS_UX_FIXTURE,
  FORM_CONTROLS_UX_SCHEMA,
  FORM_CONTROL_PROFILES,
  FORM_CONTROL_TARGETS
} = require('../typing/form-controls-ux-contract');
const {
  FEEDBACK_STATUS_PROFILES,
  FEEDBACK_STATUS_TARGETS,
  FEEDBACK_STATUS_UX_FIXTURE,
  FEEDBACK_STATUS_UX_SCHEMA
} = require('../typing/feedback-status-ux-contract');
const {
  NAVIGATION_ROUTING_PROFILES,
  NAVIGATION_ROUTING_TARGETS,
  NAVIGATION_ROUTING_UX_FIXTURE,
  NAVIGATION_ROUTING_UX_SCHEMA
} = require('../typing/navigation-routing-ux-contract');
const {
  OVERLAY_INTERACTION_PROFILES,
  OVERLAY_INTERACTION_TARGETS,
  OVERLAY_INTERACTION_UX_FIXTURE,
  OVERLAY_INTERACTION_UX_SCHEMA
} = require('../typing/overlay-interaction-ux-contract');
const {
  LAYOUT_DISPLAY_MEDIA_PROFILES,
  LAYOUT_DISPLAY_MEDIA_TARGETS,
  LAYOUT_DISPLAY_MEDIA_UX_FIXTURE,
  LAYOUT_DISPLAY_MEDIA_UX_SCHEMA
} = require('../typing/layout-display-media-ux-contract');

const COMPONENT_LAB_UX_INSPECTOR_SCHEMA = 'xtend.epic11.component-lab-ux-inspector.v1';
const COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA = 'xtend.epic11.component-lab-ux-inspector-report.v1';
const COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH = 'tests/fixtures/rmt-component-lab-ux-inspector.rmt';
const COMPONENT_LAB_UX_INSPECTOR_DOC_PATH = 'development/XTend-Component-Lab-UX-Inspector.md';
const COMPONENT_LAB_UX_INSPECTOR_WP_PATH = 'development/WP-E11-13-Component-Lab-UX-Inspector-erweitern.md';
const COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH = 'tests/builder/component_lab_ux_inspector_suite.js';
const COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE = 'node scripts/run_xtend_tests.js component-lab-ux-inspector --json';
const COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE = 'WP-E11-13';
const COMPONENT_LAB_UX_NEXT_WORKPACKAGE = 'WP-E11-14';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const COMPONENT_LAB_UX_FAMILY_IDS = Object.freeze([
  'form-controls',
  'feedback-status',
  'navigation-routing',
  'overlay-interaction',
  'layout-display-media'
]);

const COMPONENT_LAB_UX_REQUIRED_PANELS = Object.freeze([
  'ux-family-matrix',
  'component-preview',
  'rmt-inspector',
  'state',
  'styling',
  'a11y',
  'performance',
  'component-network',
  'telemetry',
  'source-links'
]);

const COMPONENT_LAB_UX_INSPECTOR_DOMAINS = Object.freeze([
  'shell',
  'style',
  'a11y',
  'performance',
  'state',
  'componentNetwork',
  'rmtAuthoring',
  'fabricTelemetry',
  'diagnostics',
  'sourceLinks'
]);

const COMPONENT_LAB_UX_TARGET_DIMENSIONS = Object.freeze([
  'shell',
  'styling',
  'a11y',
  'performance',
  'state',
  'componentNetwork',
  'rmtAuthoring',
  'fabricTelemetry',
  'sourceLinks'
]);

const FAMILY_DEFINITIONS = Object.freeze([
  {
    id: 'form-controls',
    title: 'Form Controls',
    schema: FORM_CONTROLS_UX_SCHEMA,
    fixture: FORM_CONTROLS_UX_FIXTURE,
    suite: 'form-controls-ux',
    targets: FORM_CONTROL_TARGETS,
    profiles: FORM_CONTROL_PROFILES,
    inspectorFocus: ['validation', 'formAssociation', 'state', 'a11y', 'rmt']
  },
  {
    id: 'feedback-status',
    title: 'Feedback und Status',
    schema: FEEDBACK_STATUS_UX_SCHEMA,
    fixture: FEEDBACK_STATUS_UX_FIXTURE,
    suite: 'feedback-status-ux',
    targets: FEEDBACK_STATUS_TARGETS,
    profiles: FEEDBACK_STATUS_PROFILES,
    inspectorFocus: ['liveRegion', 'statusSemantics', 'timeout', 'dismiss', 'a11y']
  },
  {
    id: 'navigation-routing',
    title: 'Navigation und Routing',
    schema: NAVIGATION_ROUTING_UX_SCHEMA,
    fixture: NAVIGATION_ROUTING_UX_FIXTURE,
    suite: 'navigation-routing-ux',
    targets: NAVIGATION_ROUTING_TARGETS,
    profiles: NAVIGATION_ROUTING_PROFILES,
    inspectorFocus: ['activeState', 'focusRestore', 'routeAnnouncements', 'xrouter', 'rmt']
  },
  {
    id: 'overlay-interaction',
    title: 'Overlay und Interaction',
    schema: OVERLAY_INTERACTION_UX_SCHEMA,
    fixture: OVERLAY_INTERACTION_UX_FIXTURE,
    suite: 'overlay-interaction-ux',
    targets: OVERLAY_INTERACTION_TARGETS,
    profiles: OVERLAY_INTERACTION_PROFILES,
    inspectorFocus: ['overlayStack', 'focusTrap', 'inert', 'scrollLock', 'portal']
  },
  {
    id: 'layout-display-media',
    title: 'Layout, Display und Media',
    schema: LAYOUT_DISPLAY_MEDIA_UX_SCHEMA,
    fixture: LAYOUT_DISPLAY_MEDIA_UX_FIXTURE,
    suite: 'layout-display-media-ux',
    targets: LAYOUT_DISPLAY_MEDIA_TARGETS,
    profiles: LAYOUT_DISPLAY_MEDIA_PROFILES,
    inspectorFocus: ['responsiveLayout', 'contentProjection', 'lazyLoading', 'mediaLifecycle', 'performance']
  }
]);

function compactRuntimeName(tag) {
  return `${String(tag || '').replace(/^x-/u, 'x').replace(/-/gu, '')}.js`;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function createCoverageIndex(report) {
  return new Map((report.entries || []).map((entry) => [entry.tag, entry]));
}

function findProfile(family, tag) {
  return (family.profiles || []).find((profile) => profile.tag === tag) || {};
}

function createComponentLabUxFamily(family, coverageIndex) {
  const targets = family.targets.map((tag) => {
    const coverage = coverageIndex.get(tag) || null;
    return {
      tag,
      maturity: coverage ? coverage.status : 'unknown',
      priority: coverage ? coverage.priority : 'P2',
      coverage: coverage ? Object.assign({}, coverage.coverage) : {}
    };
  });

  return {
    id: family.id,
    title: family.title,
    schema: family.schema,
    fixture: family.fixture,
    suite: family.suite,
    targetCount: family.targets.length,
    targets: family.targets.slice(),
    inspectorFocus: family.inspectorFocus.slice(),
    coverage: {
      enterpriseReady: targets.filter((target) => target.maturity === 'enterprise-ready').length,
      targets
    }
  };
}

function createComponentLabUxInspectorTarget(tag, family, coverageIndex) {
  const coverage = coverageIndex.get(tag) || {};
  const profile = findProfile(family, tag);
  const runtimeName = compactRuntimeName(tag);
  const componentName = runtimeName.replace(/\.js$/u, '');
  const paths = coverage.paths || {};
  const schedule = profile.schedule || 'component.visible.mount';
  const familyRef = {
    id: family.id,
    title: family.title,
    schema: family.schema,
    fixture: family.fixture,
    suite: family.suite
  };

  return {
    schema: 'xtend.epic11.component-lab-ux-target.v1',
    tag,
    title: tag,
    family: familyRef,
    maturity: coverage.status || 'unknown',
    priority: coverage.priority || 'P2',
    profiles: normalizeArray(coverage.profiles),
    role: profile.role || null,
    stateKey: profile.stateKey || `${componentName}-state-<id>`,
    schedule,
    paths: {
      runtime: paths.source || `components/${runtimeName}`,
      docs: paths.docs || `docs/components/${componentName}.md`,
      types: paths.types || `components/${componentName}.d.ts`,
      fixture: paths.fixture || `tests/components/fixtures/${componentName}.component.html`,
      suite: paths.componentSuite || `tests/components/${componentName}.component_suite.js`,
      uxContract: family.schema,
      uxFixture: family.fixture
    },
    coverage: Object.assign({
      source: false,
      docs: false,
      componentSuite: false,
      fixture: false,
      types: false,
      a11y: false,
      performance: false
    }, coverage.coverage || {}),
    inspector: {
      dimensions: COMPONENT_LAB_UX_TARGET_DIMENSIONS.slice(),
      panels: COMPONENT_LAB_UX_REQUIRED_PANELS.slice(),
      familyFocus: family.inspectorFocus.slice(),
      stateSnapshot: `snapshot.componentState.${componentName}`,
      styleSnapshot: `snapshot.componentStyle.${componentName}`,
      a11ySnapshot: `snapshot.componentA11y.${componentName}`,
      performanceSnapshot: `snapshot.componentPerformance.${componentName}`,
      networkSnapshot: `snapshot.componentNetwork.${componentName}`
    },
    rmt: {
      adapter: 'xtend.component',
      componentRecord: `lab.ux.preview.${componentName}`,
      template: `lab.ux.preview.${componentName}.template`,
      schedule,
      eventBindingMode: 'dom-event-to-rmt-command',
      shellFirst: true,
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      api: '@xtend-fabric',
      lane: schedule.includes('user-blocking') ? 'user-blocking' : schedule.split('.')[0],
      fiber: schedule.includes('hydrate') ? 'component.hydrate' : 'component.inspect',
      telemetry: true,
      laneIngestRequired: true
    },
    telemetry: {
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry',
      correlatedWithRmtSchedule: true
    }
  };
}

function createComponentLabUxInspectorPlan(options = {}) {
  const rootDir = options.rootDir;
  const coverageReport = options.coverageReport || createComponentCatalogCoverageReport({ rootDir });
  const coverageIndex = createCoverageIndex(coverageReport);
  const uxFamilies = FAMILY_DEFINITIONS.map((family) => createComponentLabUxFamily(family, coverageIndex));
  const previewTargets = FAMILY_DEFINITIONS.flatMap((family) => (
    family.targets.map((tag) => createComponentLabUxInspectorTarget(tag, family, coverageIndex))
  ));

  return {
    schema: COMPONENT_LAB_UX_INSPECTOR_SCHEMA,
    status: 'accepted-inspector',
    workpackage: COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE,
    contract: COMPONENT_LAB_UX_INSPECTOR_DOC_PATH,
    workpackageDocument: COMPONENT_LAB_UX_INSPECTOR_WP_PATH,
    fixture: COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH,
    suite: COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH,
    localGate: COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE,
    renderMode: 'shell-first',
    localOnly: true,
    externalNetworkAllowed: false,
    kernelBoundary: KERNEL_BOUNDARY,
    lab: {
      shellComponent: 'lab.ux.shell',
      routeMode: 'hash',
      previewHost: 'lab.ux.preview.host',
      requiredPanels: COMPONENT_LAB_UX_REQUIRED_PANELS.slice(),
      panels: COMPONENT_LAB_UX_REQUIRED_PANELS.map((id) => ({
        id,
        status: 'accepted',
        rmtComponent: `lab.ux.panel.${id.replace(/-/gu, '.')}`
      }))
    },
    inspector: {
      schema: 'xtend.epic11.component-lab-ux-inspector-panel.v1',
      documentRef: COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH,
      domains: COMPONENT_LAB_UX_INSPECTOR_DOMAINS.slice(),
      selectedFamilyRef: 'lab.ux.family.matrix',
      selectedComponentRef: 'lab.ux.component.preview',
      diagnostics: {
        adapter: 'rmt.state-scheduler-diagnostics',
        panel: 'lab.ux.panel.diagnostics',
        redaction: 'xtend.fabric.diagnostic-redaction.v1'
      }
    },
    uxFamilies,
    previewTargets,
    coverageSummary: {
      targetCount: previewTargets.length,
      familyCount: uxFamilies.length,
      enterpriseReadyTargets: previewTargets.filter((target) => target.maturity === 'enterprise-ready').length,
      requiredPanels: COMPONENT_LAB_UX_REQUIRED_PANELS.length,
      inspectorDomains: COMPONENT_LAB_UX_INSPECTOR_DOMAINS.length
    },
    gates: [
      'component-lab-ux-inspector',
      'component-lab-rmt-inspector',
      'form-controls-ux',
      'feedback-status-ux',
      'navigation-routing-ux',
      'overlay-interaction-ux',
      'layout-display-media-ux',
      'references'
    ],
    handoff: {
      nextWorkpackage: COMPONENT_LAB_UX_NEXT_WORKPACKAGE,
      reason: 'Browsernahe UX-Smokes koennen den Lab-Inspector nun als Matrix fuer echte Journeys verwenden.'
    }
  };
}

function validateComponentLabUxInspectorPlan(plan) {
  const errors = [];
  const families = plan && Array.isArray(plan.uxFamilies) ? plan.uxFamilies : [];
  const targets = plan && Array.isArray(plan.previewTargets) ? plan.previewTargets : [];

  if (!plan || plan.schema !== COMPONENT_LAB_UX_INSPECTOR_SCHEMA) {
    errors.push('plan schema must be xtend.epic11.component-lab-ux-inspector.v1');
  }
  if (!plan || plan.workpackage !== COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE) {
    errors.push('plan workpackage must be WP-E11-13');
  }
  if (!plan || plan.renderMode !== 'shell-first') {
    errors.push('plan renderMode must be shell-first');
  }
  if (!plan || plan.externalNetworkAllowed !== false) {
    errors.push('Component Lab UX Inspector must reject external network dependencies');
  }
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('Component Lab UX Inspector must keep RMT kernel boundary');
  }
  if (families.length !== COMPONENT_LAB_UX_FAMILY_IDS.length) {
    errors.push('Component Lab UX Inspector must expose five UX families');
  }
  COMPONENT_LAB_UX_FAMILY_IDS.forEach((familyId) => {
    if (!families.some((family) => family.id === familyId)) {
      errors.push(`missing UX family ${familyId}`);
    }
  });
  if (targets.length !== 31) {
    errors.push('Component Lab UX Inspector must expose 31 preview targets');
  }
  COMPONENT_LAB_UX_REQUIRED_PANELS.forEach((panel) => {
    if (!plan || !plan.lab || !Array.isArray(plan.lab.requiredPanels) || !plan.lab.requiredPanels.includes(panel)) {
      errors.push(`missing lab panel ${panel}`);
    }
  });
  COMPONENT_LAB_UX_INSPECTOR_DOMAINS.forEach((domain) => {
    if (!plan || !plan.inspector || !Array.isArray(plan.inspector.domains) || !plan.inspector.domains.includes(domain)) {
      errors.push(`missing inspector domain ${domain}`);
    }
  });
  families.forEach((family) => {
    if (!family.schema || !family.fixture || !family.suite || !Array.isArray(family.targets) || family.targets.length === 0) {
      errors.push(`${family.id || '<unknown>'}: family metadata incomplete`);
    }
  });
  targets.forEach((target) => {
    if (target.maturity !== 'enterprise-ready') {
      errors.push(`${target.tag}: target must be enterprise-ready`);
    }
    if (!target.coverage || target.coverage.types !== true || target.coverage.a11y !== true || target.coverage.performance !== true) {
      errors.push(`${target.tag}: target must expose type, a11y and performance coverage`);
    }
    if (!target.rmt || target.rmt.adapter !== 'xtend.component' || target.rmt.kernelBoundary !== KERNEL_BOUNDARY) {
      errors.push(`${target.tag}: target must use xtend.component adapter and preserve kernel boundary`);
    }
    if (!target.fabric || target.fabric.api !== '@xtend-fabric' || target.fabric.laneIngestRequired !== true) {
      errors.push(`${target.tag}: target must ingest Fabric lane metadata`);
    }
    COMPONENT_LAB_UX_TARGET_DIMENSIONS.forEach((dimension) => {
      if (!target.inspector || !Array.isArray(target.inspector.dimensions) || !target.inspector.dimensions.includes(dimension)) {
        errors.push(`${target.tag}: missing inspector dimension ${dimension}`);
      }
    });
  });

  return {
    schema: COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createComponentLabUxInspectorGate(options = {}) {
  const plan = options.plan || createComponentLabUxInspectorPlan(options);
  const validation = validateComponentLabUxInspectorPlan(plan);
  return {
    schema: COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA,
    ok: validation.ok,
    plan,
    errors: validation.errors,
    warnings: []
  };
}

module.exports = {
  COMPONENT_LAB_UX_FAMILY_IDS,
  COMPONENT_LAB_UX_INSPECTOR_DOC_PATH,
  COMPONENT_LAB_UX_INSPECTOR_DOMAINS,
  COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH,
  COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE,
  COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA,
  COMPONENT_LAB_UX_INSPECTOR_SCHEMA,
  COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH,
  COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE,
  COMPONENT_LAB_UX_INSPECTOR_WP_PATH,
  COMPONENT_LAB_UX_NEXT_WORKPACKAGE,
  COMPONENT_LAB_UX_REQUIRED_PANELS,
  COMPONENT_LAB_UX_TARGET_DIMENSIONS,
  FAMILY_DEFINITIONS,
  KERNEL_BOUNDARY,
  createComponentLabUxInspectorGate,
  createComponentLabUxInspectorPlan,
  validateComponentLabUxInspectorPlan
};
