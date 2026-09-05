const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  COMPONENT_UX_PERFORMANCE_BUDGET_CLASSES,
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
} = require('../../xtend-builder/performance/component-ux-performance-contract');

function runComponentUxPerformanceContractSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-ux-performance',
    label: 'XTend Component UX Performance Contract'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const contractDoc = readText('development/XTend-Component-UX-Performance-Profile.md', rootDir);
  const workpackage = readText('development/WP-E11-05-Component-Performance-Profiles-und-Budgets-erweitern.md', rootDir);
  const performanceReadme = readText('xtend-builder/performance/README.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentUxPerformanceContract;
  const overlay = createComponentUxPerformanceContract({
    tag: 'x-dialog',
    profiles: ['overlay']
  });
  const form = createComponentUxPerformanceContract({
    tag: 'x-form',
    profiles: ['form']
  });
  const routing = createComponentUxPerformanceContract({
    tag: 'x-tabs',
    profiles: ['routing', 'interactive']
  });
  const media = createComponentUxPerformanceContract({
    tag: 'x-player',
    profiles: ['media']
  });
  const feedback = createComponentUxPerformanceContract({
    tag: 'x-toast',
    profiles: ['feedback']
  });
  const validation = validateComponentUxPerformanceContract(overlay);
  const invalidValidation = validateComponentUxPerformanceContract({
    schema: COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
    tag: 'button',
    profiles: ['unknown'],
    budgetClass: 'slow',
    lane: 'hot',
    hydrationPolicy: 'always',
    budgets: {
      matrix: 'missing',
      budgetsMs: {
        hydrate: -1
      }
    },
    measurements: {
      schema: 'missing',
      criticalMeasurements: []
    },
    rmt: {
      kernelBoundary: 'xtend-imports-in-rmt-kernel'
    },
    fabric: {
      telemetryCorrelationRequired: false
    },
    compatibility: {
      performanceByDesign: false
    },
    tests: {
      requiredSuites: []
    }
  });

  context.assert(overlay.schema === COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'UX Performance factory emits UX Performance schema');
  context.assert(validation.schema === COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA, 'UX Performance validator emits report schema');
  context.assert(validation.ok, 'UX Performance validator accepts a complete overlay contract');
  context.assert(!invalidValidation.ok, 'UX Performance validator rejects invalid UX Performance contracts');
  context.assert(overlay.performancePolicy === PERFORMANCE_POLICY_SCHEMA, 'UX Performance links scaffold performance policy');
  context.assert(overlay.componentPerformanceProfile === PERFORMANCE_COMPONENT_PROFILE_SCHEMA, 'UX Performance links component performance profile');
  context.assert(overlay.budgetMatrix === PERFORMANCE_BUDGET_MATRIX_SCHEMA, 'UX Performance links budget matrix');
  context.assert(overlay.measurementContract === PERFORMANCE_MEASUREMENT_SCHEMA, 'UX Performance links measurement contract');
  context.assert(overlay.regressionGate === PERFORMANCE_REGRESSION_GATE_SCHEMA, 'UX Performance links regression gate');
  context.assert(overlay.hydrationPolicyContract === HYDRATION_POLICY_SCHEMA, 'UX Performance links hydration policy');
  context.assert(overlay.shellContract === COMPONENT_SHELL_CONTRACT_SCHEMA, 'UX Performance binds Component Shell Contract');
  context.assert(overlay.stylingContract === COMPONENT_STYLING_CONTRACT_SCHEMA, 'UX Performance binds Component Styling Contract');
  context.assert(overlay.runtimeA11yContract === RUNTIME_A11Y_CONTRACT_SCHEMA, 'UX Performance binds Runtime A11y Contract');
  context.assert(overlay.primaryProfile === 'overlay', 'Overlay contract derives overlay as primary profile');
  context.assert(overlay.budgetClass === 'critical', 'Overlay contract derives critical budget class');
  context.assert(overlay.lane === 'user-blocking', 'Overlay contract derives user-blocking lane');
  context.assert(overlay.hydrationPolicy === 'visible', 'Overlay contract derives visible hydration');
  context.assert(overlay.budgets.budgetsMs.eventAction === 16, 'Overlay contract keeps event action budget at 16 ms');
  context.assert(overlay.measurements.criticalMeasurements.includes('xtend.component.hydrate'), 'Overlay contract includes hydration measurement');
  context.assert(overlay.measurements.criticalMeasurements.includes('xtend.event.handler'), 'Overlay contract includes event handler measurement');
  context.assert(overlay.hydration.scheduleRefs.includes('component.visible.hydrate'), 'Overlay contract maps visible hydration schedule');
  context.assert(overlay.overlays.openCloseBudgetMs === 16, 'Overlay contract budgets open and close paths');
  context.assert(form.forms.inputEventBudgetMs === 16, 'Form contract budgets input events');
  context.assert(form.forms.validationMustBeIncremental === true, 'Form contract requires incremental validation');
  context.assert(routing.lane === 'transition' || routing.lane === 'user-blocking', 'Routing contract derives a high priority lane');
  context.assert(routing.routing.routeRenderMeasure === 'xtend.route.render', 'Routing contract records route render measure');
  context.assert(media.hydration.policy === 'visible-or-idle', 'Media contract keeps visible-or-idle hydration');
  context.assert(media.hydration.idleOrBackgroundAllowed === true, 'Media contract allows idle/background work');
  context.assert(feedback.lane === 'a11y', 'Feedback contract derives a11y lane');
  context.assert(feedback.a11y.requiresA11yFiber === true, 'Feedback contract requires A11y fiber');
  context.assert(overlay.rmt.schema === RMT_PERFORMANCE_AUTHORING_SCHEMA, 'UX Performance prepares RMT Performance Authoring schema');
  context.assert(overlay.rmt.kernelBoundary === KERNEL_BOUNDARY, 'UX Performance keeps RMT kernel boundary');
  context.assert(overlay.fabric.schema === FABRIC_BOUNDARY_SCHEMA, 'UX Performance binds Fabric boundary');
  context.assert(overlay.fabric.telemetryCorrelationRequired === true, 'UX Performance requires Fabric telemetry correlation');
  context.assert(overlay.compatibility.hostModes.includes('rmt-first'), 'UX Performance keeps RMT-first compatibility');
  context.assert(COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS.includes('backpressure'), 'Required domains include backpressure');
  context.assert(COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS.includes('measurements'), 'Required domains include measurements');
  context.assert(COMPONENT_UX_PERFORMANCE_PROFILES.includes('overlay'), 'UX Performance profiles include overlay');
  context.assert(COMPONENT_UX_PERFORMANCE_PROFILES.includes('theme'), 'UX Performance profiles include theme');
  context.assert(COMPONENT_UX_PERFORMANCE_PHASES.includes('hydrate'), 'UX Performance phases include hydrate');
  context.assert(COMPONENT_UX_PERFORMANCE_BUDGET_CLASSES.includes('critical'), 'UX Performance budget classes include critical');
  context.assert(COMPONENT_UX_PERFORMANCE_LANES.includes('a11y'), 'UX Performance lanes include a11y');
  context.assert(COMPONENT_UX_PERFORMANCE_HYDRATION_POLICIES.includes('lazy'), 'UX Performance hydration policies include lazy');
  context.assert(COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS.includes('telemetry-correlation'), 'UX Performance assertions include telemetry correlation');
  context.assert((typeof packageManifest.exports['./builder/performance/component-ux-performance-contract'] === 'string' ? packageManifest.exports['./builder/performance/component-ux-performance-contract'] : packageManifest.exports['./builder/performance/component-ux-performance-contract'] && packageManifest.exports['./builder/performance/component-ux-performance-contract'].default) === './xtend-builder/performance/component-ux-performance-contract.js', 'Package exports Component UX Performance Contract module');
  context.assert(packageManifest.scripts['test:component-ux-performance'] === 'node scripts/run_xtend_tests.js component-ux-performance', 'Package exposes Component UX Performance test script');
  context.assert(metadata && metadata.schema === COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Package metadata exposes Component UX Performance schema');
  context.assert(metadata.reportSchema === COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA, 'Package metadata exposes Component UX Performance report schema');
  context.assert(metadata.workpackage === COMPONENT_UX_PERFORMANCE_WORKPACKAGE, 'Package metadata exposes WP-E11-05 owner');
  context.assert(metadata.contract === 'development/XTend-Component-UX-Performance-Profile.md', 'Package metadata exposes UX Performance contract doc path');
  context.assert(metadata.module === 'xtend-builder/performance/component-ux-performance-contract.js', 'Package metadata exposes UX Performance module path');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('event-budget-bounded'), 'Package metadata exposes event budget assertion');
  context.assert(Array.isArray(metadata.requiredProfiles) && metadata.requiredProfiles.includes('media'), 'Package metadata exposes media profile');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'componentUxPerformanceContract', 'Scaffold config exposes Component UX Performance Contract section');
  context.assertIncludes(scaffoldConfig, COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Scaffold config declares Component UX Performance schema');
  context.assertIncludes(scaffoldConfig, 'component-ux-performance', 'Scaffold config references Component UX Performance gate');
  context.assert(runner.hasSuite("component-ux-performance"), 'Runner exposes Component UX Performance suite');
  context.assertIncludes(contractDoc, COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Contract document declares Component UX Performance schema');
  context.assertIncludes(contractDoc, 'XtendComponentUxPerformanceContract', 'Contract document defines the TypeScript interface name');
  context.assertIncludes(contractDoc, RMT_PERFORMANCE_AUTHORING_SCHEMA, 'Contract document declares RMT Performance Authoring handoff');
  context.assertIncludes(contractDoc, KERNEL_BOUNDARY, 'Contract document keeps RMT kernel boundary visible');
  context.assertIncludes(contractDoc, '`budget-class-derived`', 'Contract document lists Performance assertions');
  context.assertIncludes(workpackage, 'xtend.epic11.wp05.component-ux-performance-contract.v1', 'WP-E11-05 declares workpackage schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-05 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js component-ux-performance --json', 'WP-E11-05 documents local gate');
  context.assertIncludes(performanceReadme, COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Performance README documents Component UX Performance Contract');
  context.assertIncludes(epic, '| `WP-E11-05` | P0 | completed |', 'Epic 11 marks WP-E11-05 completed');
  context.assertIncludes(epic, '| `WP-E11-06` | P0 | completed |', 'Epic 11 marks WP-E11-06 completed after Component Network');
  context.assertIncludes(backlog, '| `WP-E11-05` | P0 | completed | WS3 |', 'Epic 11 backlog marks WP-E11-05 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-05', 'Epic 11 backlog documents WP-E11-05 handoff');

  return context.result({
    schema: COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
    profiles: COMPONENT_UX_PERFORMANCE_PROFILES,
    assertions: COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS
  });
}

function printComponentUxPerformanceContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component UX Performance Contract erfolgreich.',
    failureTitle: 'XTend Component UX Performance Contract fehlgeschlagen:'
  });
}

module.exports = {
  printComponentUxPerformanceContractReport,
  runComponentUxPerformanceContractSuite
};
