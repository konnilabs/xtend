const {
  createComponentCatalogCoverageReport
} = require('../../catalog/component-catalog-coverage');
const {
  EXPECTED_COMPONENT_ORDER,
  createP0ComponentWavePlan
} = require('../../catalog/epic10-p0-component-wave');

const COMPONENT_LAB_SCHEMA = 'xtend.epic10.component-lab-rmt-inspector.v1';
const COMPONENT_LAB_GATE_SCHEMA = 'xtend.epic10.component-lab-rmt-inspector-gate.v1';
const COMPONENT_LAB_FIXTURE_PATH = 'tests/fixtures/rmt-component-lab-pilot.rmt';
const COMPONENT_LAB_DOC_PATH = 'development/XTend-Component-Lab-und-RMT-Inspector-Pilot.md';
const COMPONENT_LAB_WP_PATH = 'development/WP-E10-12-Component-Lab-und-RMT-Inspector-Pilot-anlegen.md';
const COMPONENT_LAB_SUITE_PATH = 'tests/builder/component_lab_rmt_inspector_suite.js';
const COMPONENT_LAB_LOCAL_GATE = 'node scripts/run_xtend_tests.js component-lab-rmt-inspector --json';

const REQUIRED_LAB_PANELS = Object.freeze([
  'component-preview',
  'rmt-inspector',
  'telemetry',
  'a11y',
  'performance',
  'source-links'
]);

const REQUIRED_INSPECTOR_DOMAINS = Object.freeze([
  'manifest',
  'adapters',
  'components',
  'routes',
  'schedules',
  'templates',
  'diagnostics'
]);

function compactRuntimeName(tag) {
  return `${String(tag || '').replace(/^x-/u, 'x').replace(/-/gu, '')}.js`;
}

function findCatalogEntry(report, tag) {
  return (report.entries || []).find((entry) => entry.tag === tag) || null;
}

function findWaveStub(plan, tag) {
  return (plan.stubs || []).find((stub) => stub.tag === tag) || null;
}

function createPreviewTarget(tag, options = {}) {
  const coverage = options.coverage || null;
  const stub = options.stub || {};
  const sourceName = tag;
  const runtimeName = compactRuntimeName(tag);
  const componentName = runtimeName.replace(/\.js$/u, '');
  const schedule = stub.performance && stub.performance.lane === 'idle'
    ? 'component.idle.hydrate'
    : 'component.visible.mount';

  return {
    schema: 'xtend.epic10.component-lab-preview-target.v1',
    tag,
    title: stub.title || tag,
    family: stub.family || 'component',
    maturity: coverage ? coverage.status : 'unknown',
    priority: coverage ? coverage.priority : 'P1',
    profiles: Array.isArray(stub.profiles) ? stub.profiles.slice() : [],
    paths: {
      runtime: `components/${runtimeName}`,
      source: `src/components/${sourceName}/${sourceName}.ts`,
      rmtMetadata: `src/components/${sourceName}/${sourceName}.rmt.ts`,
      contract: `src/components/${sourceName}/${sourceName}.contract.ts`,
      a11y: `src/components/${sourceName}/${sourceName}.a11y.ts`,
      performance: `src/components/${sourceName}/${sourceName}.performance.ts`,
      fixtureData: `src/components/${sourceName}/${sourceName}.fixture.ts`,
      fixture: `tests/components/fixtures/${componentName}.component.html`,
      docs: `docs/components/${componentName}.md`,
      types: `components/${runtimeName.replace(/\.js$/u, '.d.ts')}`,
      suite: `tests/components/${componentName}.component_suite.js`
    },
    rmt: {
      adapter: 'xtend.component',
      componentRecord: `lab.preview.${componentName}`,
      template: `lab.preview.${componentName}.template`,
      schedule,
      hydrationPolicy: stub.performance ? stub.performance.hydrationPolicy : 'visible',
      lane: stub.performance ? stub.performance.lane : 'visible',
      eventBindingMode: 'dom-event-to-rmt-command',
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    },
    fabric: {
      api: '@xtend-fabric',
      lane: stub.performance ? stub.performance.lane : 'visible',
      fiber: schedule === 'component.idle.hydrate' ? 'component.hydrate' : 'component.mount',
      telemetry: true
    },
    telemetry: {
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry',
      backpressureAware: true
    },
    a11y: {
      role: stub.a11y ? stub.a11y.role : null,
      keyboard: stub.a11y && Array.isArray(stub.a11y.keyboard) ? stub.a11y.keyboard.slice() : [],
      screenreader: stub.a11y && Array.isArray(stub.a11y.screenreader) ? stub.a11y.screenreader.slice() : [],
      requiredAssertions: stub.a11y && Array.isArray(stub.a11y.requiredAssertions) ? stub.a11y.requiredAssertions.slice() : []
    },
    performance: {
      budgetClass: stub.performance ? stub.performance.budgetClass : 'component-default',
      criticalMeasurements: stub.performance && Array.isArray(stub.performance.criticalMeasurements)
        ? stub.performance.criticalMeasurements.slice()
        : ['mount', 'render']
    }
  };
}

function createComponentLabPlan(options = {}) {
  const rootDir = options.rootDir;
  const wavePlan = options.wavePlan || createP0ComponentWavePlan();
  const coverageReport = options.coverageReport || createComponentCatalogCoverageReport({ rootDir });
  const targets = EXPECTED_COMPONENT_ORDER.map((tag) => createPreviewTarget(tag, {
    coverage: findCatalogEntry(coverageReport, tag),
    stub: findWaveStub(wavePlan, tag)
  }));

  return {
    schema: COMPONENT_LAB_SCHEMA,
    status: 'accepted-pilot',
    workpackage: 'WP-E10-12',
    contract: COMPONENT_LAB_DOC_PATH,
    workpackageDocument: COMPONENT_LAB_WP_PATH,
    fixture: COMPONENT_LAB_FIXTURE_PATH,
    suite: COMPONENT_LAB_SUITE_PATH,
    localGate: COMPONENT_LAB_LOCAL_GATE,
    renderMode: 'shell-first',
    localOnly: true,
    externalNetworkAllowed: false,
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
    lab: {
      shellComponent: 'lab.shell',
      routeMode: 'hash',
      previewHost: 'lab.preview.host',
      previewTargets: targets,
      requiredPanels: REQUIRED_LAB_PANELS.slice(),
      panels: REQUIRED_LAB_PANELS.map((id) => ({
        id,
        status: 'pilot',
        rmtComponent: `lab.panel.${id.replace(/-/gu, '.')}`
      }))
    },
    inspector: {
      schema: 'xtend.epic10.rmt-inspector-panel.v1',
      documentRef: COMPONENT_LAB_FIXTURE_PATH,
      domains: REQUIRED_INSPECTOR_DOMAINS.slice(),
      selectedRouteRef: 'lab.component.preview',
      selectedScheduleRef: 'component.visible.mount',
      diagnostics: {
        adapter: 'rmt.state-scheduler-diagnostics',
        panel: 'lab.panel.rmt.inspector',
        redaction: 'xtend.fabric.diagnostic-redaction.v1'
      }
    },
    telemetryPanel: {
      schema: 'xtend.epic10.component-lab-telemetry-panel.v1',
      sources: [
        'xtend.component.lifecycle-telemetry.v1',
        'xtend.fabric.telemetry-snapshot.v1',
        'xtend.performance.regression-report.v1'
      ],
      operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount'],
      snapshotPath: 'snapshot.componentTelemetry'
    },
    gates: [
      'component-lab-rmt-inspector',
      'rmt-first-class-app',
      'rmt-component-fabric-ingestion',
      'rmt-component-lifecycle-telemetry',
      'epic10-p0-component-wave',
      'references'
    ],
    handoff: {
      nextWorkpackage: 'WP-E10-13',
      reason: 'Component Lab and RMT Inspector can now inspect RMT-first app fixtures before the full demo app is built.'
    }
  };
}

function validateComponentLabPlan(plan) {
  const errors = [];
  const targetTags = plan && plan.lab && Array.isArray(plan.lab.previewTargets)
    ? plan.lab.previewTargets.map((target) => target.tag)
    : [];

  if (!plan || plan.schema !== COMPONENT_LAB_SCHEMA) {
    errors.push('plan schema must be xtend.epic10.component-lab-rmt-inspector.v1');
  }
  if (!plan || plan.workpackage !== 'WP-E10-12') {
    errors.push('plan workpackage must be WP-E10-12');
  }
  if (!plan || plan.renderMode !== 'shell-first') {
    errors.push('plan renderMode must be shell-first');
  }
  if (!plan || plan.externalNetworkAllowed !== false) {
    errors.push('Component Lab must reject external network dependencies');
  }
  if (!plan || plan.kernelBoundary !== 'no-rmt-kernel-import-of-xtend-types') {
    errors.push('Component Lab must keep RMT kernel boundary');
  }
  if (JSON.stringify(targetTags) !== JSON.stringify(EXPECTED_COMPONENT_ORDER)) {
    errors.push('preview targets must match the Epic 10 P0 component order');
  }
  (plan && plan.lab && plan.lab.previewTargets || []).forEach((target) => {
    if (target.maturity !== 'enterprise-ready') {
      errors.push(`${target.tag}: preview target must be enterprise-ready`);
    }
    if (!target.rmt || target.rmt.adapter !== 'xtend.component') {
      errors.push(`${target.tag}: preview target must use xtend.component adapter`);
    }
    if (!target.fabric || target.fabric.api !== '@xtend-fabric') {
      errors.push(`${target.tag}: preview target must expose @xtend-fabric`);
    }
    if (!target.telemetry || target.telemetry.snapshotPath !== 'snapshot.componentTelemetry') {
      errors.push(`${target.tag}: preview target must bind component telemetry snapshot`);
    }
  });
  REQUIRED_LAB_PANELS.forEach((panel) => {
    if (!plan || !plan.lab || !Array.isArray(plan.lab.requiredPanels) || !plan.lab.requiredPanels.includes(panel)) {
      errors.push(`missing lab panel ${panel}`);
    }
  });
  REQUIRED_INSPECTOR_DOMAINS.forEach((domain) => {
    if (!plan || !plan.inspector || !Array.isArray(plan.inspector.domains) || !plan.inspector.domains.includes(domain)) {
      errors.push(`missing inspector domain ${domain}`);
    }
  });

  return {
    schema: COMPONENT_LAB_GATE_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createComponentLabGate(options = {}) {
  const plan = options.plan || createComponentLabPlan(options);
  const validation = validateComponentLabPlan(plan);
  return {
    schema: COMPONENT_LAB_GATE_SCHEMA,
    ok: validation.ok,
    plan,
    errors: validation.errors,
    warnings: []
  };
}

module.exports = {
  COMPONENT_LAB_DOC_PATH,
  COMPONENT_LAB_FIXTURE_PATH,
  COMPONENT_LAB_GATE_SCHEMA,
  COMPONENT_LAB_LOCAL_GATE,
  COMPONENT_LAB_SCHEMA,
  COMPONENT_LAB_SUITE_PATH,
  COMPONENT_LAB_WP_PATH,
  REQUIRED_INSPECTOR_DOMAINS,
  REQUIRED_LAB_PANELS,
  createComponentLabGate,
  createComponentLabPlan,
  validateComponentLabPlan
};
