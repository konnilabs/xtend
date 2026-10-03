const COMPONENT_BLUEPRINT_SCHEMA = 'xtend.scaffold.component-blueprint.v1';
const TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA = 'xtend.scaffold.typescript-component-blueprint.v1';
const {
  A11Y_COMPONENT_CONTRACT_SCHEMA,
  A11Y_CONTRAST_POLICY_SCHEMA,
  A11Y_MOTION_CONTRAST_POLICY_SCHEMA,
  A11Y_MOTION_POLICY_SCHEMA,
  A11Y_PROFILE_SCHEMA,
  A11Y_SCREENREADER_SIGNALS_SCHEMA,
  A11Y_TEST_CONTRACT_SCHEMA,
  PROFILE_A11Y_RULES,
  SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA
} = require('../a11y/component-a11y-profile');
const {
  PERFORMANCE_BUDGET_MATRIX_SCHEMA,
  PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
  PERFORMANCE_MEASUREMENT_SCHEMA,
  PERFORMANCE_POLICY_SCHEMA,
  PERFORMANCE_REGRESSION_GATE_SCHEMA,
  HYDRATION_POLICY_SCHEMA,
  PROFILE_PERFORMANCE_RULES
} = require('../performance/component-performance-profile');
const {
  COMPONENT_CONTRACT_V2_SCHEMA,
  TYPESCRIPT_SOURCE_STRATEGY_SCHEMA,
  RMT_COMPONENT_CONTRACT_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  TELEMETRY_SNAPSHOT_SCHEMA,
  CONTRACT_V2_LIFECYCLE_OPERATIONS,
  CONTRACT_V2_LANE_PRECEDENCE
} = require('../typing/component-contract-v2');

const COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA = 'xtend.component.lifecycle-telemetry.v1';
const COMPONENT_FABRIC_LANE_INGESTION_SCHEMA = 'xtend.component.fabric-lane-ingestion.v2';

const NAMING_CONTRACT = {
  tagPattern: '^x-[a-z0-9]+(?:-[a-z0-9]+)*$',
  fileNameRule: 'tag without hyphens after x-prefix for current legacy-compatible component paths',
  docsNameRule: 'tag without x- prefix',
  stateKeyPrefix: 'xtend.component.<tag>.',
  eventNameRule: '<component-domain>-<past-tense-action>'
};

const ARTIFACT_MATRIX = [
  {
    id: 'component',
    pathTemplate: 'components/<tag>.js',
    required: true,
    mode: 'write-new',
    purpose: 'Productive Custom Element or XTend-near module source.',
    minimumContract: ['syntax-check', 'registration-or-module-export', 'lifecycle-boundary', 'static-a11y-profile', 'static-performance-profile']
  },
  {
    id: 'docs',
    pathTemplate: 'docs/components/<name>.md',
    required: true,
    mode: 'write-new',
    purpose: 'Public component contract with attributes, slots, events, state and examples.',
    minimumContract: ['public-contract', 'usage-example', 'a11y-profile', 'screenreader-signal-contract', 'motion-contrast-policy', 'performance-profile', 'accessibility-and-hydration-notes']
  },
  {
    id: 'tests',
    pathTemplate: 'tests/components/<tag>.component_suite.js',
    required: true,
    mode: 'write-new',
    purpose: 'Component-level suite with real assertions for the selected profiles.',
    minimumContract: ['source-contract', 'profile-checks', 'a11y-profile-contract', 'screenreader-signal-contract', 'motion-contrast-policy-contract', 'performance-profile-contract', 'no-placeholder-tests']
  },
  {
    id: 'fixtures',
    pathTemplate: 'tests/components/fixtures/<tag>.component.html',
    required: true,
    mode: 'write-new-or-documented-exception',
    purpose: 'Repo-local DOM and hydration fixture for visible Custom Elements.',
    minimumContract: ['repo-local-imports', 'component-markup', 'hydration-result-object', 'a11y-fixture-attributes', 'screenreader-signal-result', 'motion-contrast-result']
  },
  {
    id: 'types',
    pathTemplate: 'components/<tag>.d.ts',
    required: true,
    mode: 'write-new-or-documented-exception',
    purpose: 'Public TypeScript contract for JS API, attributes and Custom Events.',
    minimumContract: ['public-api-types', 'event-detail-types', 'a11y-profile-types', 'screenreader-signal-types', 'motion-contrast-policy-types', 'performance-profile-types']
  },
  {
    id: 'manifest',
    pathTemplate: 'components/manifest.json',
    required: true,
    mode: 'patch-plan',
    purpose: 'Loader and hydration participation as deterministic manifest patch plan.',
    minimumContract: ['tag-entry', 'repo-local-source', 'a11y-profile-plan', 'screenreader-signals-plan', 'motion-contrast-policy-plan', 'performance-profile-plan', 'manifest-review-step']
  },
  {
    id: 'demo',
    pathTemplate: 'docs/previews/<name>.preview.md',
    required: 'conditional',
    mode: 'reference-plan',
    purpose: 'Visible or workflow-relevant reference path once the component has a bestcase.',
    minimumContract: ['reference-registry-entry', 'local-assets-or-documented-exception']
  },
  {
    id: 'ts-source',
    pathTemplate: 'src/components/<tag>/<tag>.ts',
    required: true,
    mode: 'write-new',
    purpose: 'TypeScript-first Custom Element source for new components.',
    minimumContract: ['typescript-source', 'component-contract-v2', 'esm-output-plan', 'static-rmt-metadata', 'fabric-lifecycle-boundary', 'lifecycle-telemetry', 'static-a11y-profile', 'static-performance-profile']
  },
  {
    id: 'ts-contract',
    pathTemplate: 'src/components/<tag>/<tag>.contract.ts',
    required: true,
    mode: 'write-new',
    purpose: 'Machine-readable Component Contract v2 source artifact.',
    minimumContract: ['xtend.component.contract.v2', 'public-api', 'rmt-adapter-metadata', 'fabric-boundary', 'telemetry-contract', 'lane-precedence', 'a11y-performance-contracts']
  },
  {
    id: 'ts-rmt',
    pathTemplate: 'src/components/<tag>/<tag>.rmt.ts',
    required: true,
    mode: 'write-new',
    purpose: 'RMT component metadata without importing XTend into the RMT kernel.',
    minimumContract: ['xtend.rmt.component-contract.v1', 'xtend.component-adapter-ref', 'schedule-hints', 'hydration-policy', 'fabric-lane-ingestion', 'no-rmt-kernel-import-of-xtend-types']
  },
  {
    id: 'ts-a11y',
    pathTemplate: 'src/components/<tag>/<tag>.a11y.ts',
    required: true,
    mode: 'write-new',
    purpose: 'A11y profile source artifact for screenreader, keyboard, motion and contrast defaults.',
    minimumContract: ['xtend.a11y.component-contract.v1', 'xtend.a11y.profile.v1', 'screenreader-signals', 'motion-contrast-policy', 'fixture-attributes']
  },
  {
    id: 'ts-performance',
    pathTemplate: 'src/components/<tag>/<tag>.performance.ts',
    required: true,
    mode: 'write-new',
    purpose: 'Performance profile source artifact with budget, lane and hydration policy.',
    minimumContract: ['xtend.performance.component-profile.v1', 'budget-class', 'lane', 'hydration-policy', 'critical-measurements', 'cleanup-policy']
  },
  {
    id: 'ts-fixture',
    pathTemplate: 'src/components/<tag>/<tag>.fixture.ts',
    required: true,
    mode: 'write-new',
    purpose: 'Typed fixture data for component suites, RMT previews and Component Lab imports.',
    minimumContract: ['typed-fixture-data', 'repo-local-imports', 'rmt-metadata-fixture', 'a11y-fixture-attributes', 'telemetry-expectations']
  }
];

const PROFILE_CHECKS = [
  {
    profile: 'display',
    requiredChecks: ['registration', 'manifest', 'attributes', 'slots', 'visible-dom', 'hydration-baseline'],
    a11y: PROFILE_A11Y_RULES.display,
    performance: PROFILE_PERFORMANCE_RULES.display
  },
  {
    profile: 'interactive',
    requiredChecks: ['display-baseline', 'events', 'keyboard', 'focus', 'labels', 'rehydration-listeners'],
    a11y: PROFILE_A11Y_RULES.interactive,
    performance: PROFILE_PERFORMANCE_RULES.interactive
  },
  {
    profile: 'stateful',
    requiredChecks: ['canonical-state-key', 'external-state-change', 'cleanup', 'ssot-boundary'],
    a11y: PROFILE_A11Y_RULES.stateful,
    performance: PROFILE_PERFORMANCE_RULES.stateful
  },
  {
    profile: 'feedback',
    requiredChecks: ['live-region', 'dismissal', 'event-contract', 'timer-cleanup', 'reduced-motion'],
    a11y: PROFILE_A11Y_RULES.feedback,
    performance: PROFILE_PERFORMANCE_RULES.feedback
  },
  {
    profile: 'overlay',
    requiredChecks: ['open-state', 'focus-target', 'escape-close', 'focus-return', 'aria-modal'],
    a11y: PROFILE_A11Y_RULES.overlay,
    performance: PROFILE_PERFORMANCE_RULES.overlay
  },
  {
    profile: 'routing',
    requiredChecks: ['navigation', 'params-query', 'state-projection', 'route-events', 'local-link-contract'],
    a11y: PROFILE_A11Y_RULES.routing,
    performance: PROFILE_PERFORMANCE_RULES.routing
  },
  {
    profile: 'theme',
    requiredChecks: ['theme-state', 'css-custom-properties', 'theme-event', 'legacy-facade-boundary'],
    a11y: PROFILE_A11Y_RULES.theme,
    performance: PROFILE_PERFORMANCE_RULES.theme
  },
  {
    profile: 'form',
    requiredChecks: ['value-contract', 'validation', 'labels', 'error-message', 'submit-change-events'],
    a11y: PROFILE_A11Y_RULES.form,
    performance: PROFILE_PERFORMANCE_RULES.form
  },
  {
    profile: 'media',
    requiredChecks: ['loading-state', 'controls', 'keyboard', 'fallbacks', 'reduced-motion'],
    a11y: PROFILE_A11Y_RULES.media,
    performance: PROFILE_PERFORMANCE_RULES.media
  }
];

const A11Y_PROFILE_REQUIREMENTS = {
  componentContract: A11Y_COMPONENT_CONTRACT_SCHEMA,
  profileContract: A11Y_PROFILE_SCHEMA,
  screenreaderSignalsContract: A11Y_SCREENREADER_SIGNALS_SCHEMA,
  motionContrastContract: A11Y_MOTION_CONTRAST_POLICY_SCHEMA,
  motionPolicyContract: A11Y_MOTION_POLICY_SCHEMA,
  contrastPolicyContract: A11Y_CONTRAST_POLICY_SCHEMA,
  testContract: A11Y_TEST_CONTRACT_SCHEMA,
  scaffoldPlan: SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA,
  sourceStaticGetter: 'xtendScaffoldA11yProfile',
  manifestKey: 'a11yProfile',
  requiredFixtureAttributes: ['aria-label'],
  requiredDocsSections: ['A11y-Profil', 'Screenreader-Signale', 'Motion-und-Contrast-Policy', 'Accessibility und Hydration'],
  requiredGates: ['components', 'a11y-hydration', 'screenreader-signals', 'motion-contrast', 'references'],
  requiredFields: [
    'role',
    'accessibleName',
    'focusStrategy',
    'keyboard',
    'ariaStates',
    'screenreader',
    'motion',
    'contrast',
    'motionContrast',
    'testPlan'
  ]
};

const PERFORMANCE_POLICY_REQUIREMENTS = {
  policyContract: PERFORMANCE_POLICY_SCHEMA,
  componentProfileContract: PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
  budgetMatrix: PERFORMANCE_BUDGET_MATRIX_SCHEMA,
  measurementContract: PERFORMANCE_MEASUREMENT_SCHEMA,
  regressionGate: PERFORMANCE_REGRESSION_GATE_SCHEMA,
  hydrationPolicyContract: HYDRATION_POLICY_SCHEMA,
  sourceStaticGetter: 'xtendScaffoldPerformanceProfile',
  manifestKey: 'performanceProfile',
  authorGuide: 'docs/performance.md',
  requiredDocsSections: ['Performance-Profil', 'Performance-Regeln'],
  requiredGates: ['fabric-performance-measurements', 'performance-regression', 'hydration-policy', 'references'],
  requiredFields: [
    'performanceProfile',
    'budgetClass',
    'lane',
    'hydrationPolicy',
    'criticalMeasurements',
    'idleOrBackgroundAllowed'
  ]
};

const TYPESCRIPT_BLUEPRINT_REQUIREMENTS = {
  schema: TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA,
  status: 'accepted-WP-E10-07',
  workpackage: 'development/WP-E10-07-xtend-builder-TypeScript-Blueprint-vorbereiten.md',
  contract: 'development/XTend-TypeScript-Component-Blueprint.md',
  localGate: 'node scripts/run_xtend_tests.js builder-typescript-blueprint --json',
  sourceStrategy: TYPESCRIPT_SOURCE_STRATEGY_SCHEMA,
  componentContract: COMPONENT_CONTRACT_V2_SCHEMA,
  rmtComponentContract: RMT_COMPONENT_CONTRACT_SCHEMA,
  fabricBoundary: FABRIC_BOUNDARY_SCHEMA,
  fabricLaneIngestion: COMPONENT_FABRIC_LANE_INGESTION_SCHEMA,
  lifecycleTelemetry: COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA,
  telemetrySnapshot: TELEMETRY_SNAPSHOT_SCHEMA,
  sourceRoot: 'src/components/',
  runtimeOutputRoot: 'components/',
  declarationOutputRoot: 'components/',
  requiredArtifacts: ['ts-source', 'ts-contract', 'ts-rmt', 'ts-a11y', 'ts-performance', 'ts-fixture'],
  runtimeArtifacts: ['component', 'types', 'manifest'],
  companionArtifacts: ['docs', 'tests', 'fixtures', 'demo'],
  lifecycleOperations: CONTRACT_V2_LIFECYCLE_OPERATIONS,
  lanePrecedence: CONTRACT_V2_LANE_PRECEDENCE,
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
  noRuntimeImports: true,
  noProductiveWrites: true,
  compilerIntroduced: false,
  templateIds: [
    'component.ts-source',
    'component.ts-contract',
    'component.ts-rmt',
    'component.ts-a11y',
    'component.ts-performance',
    'component.ts-fixture'
  ]
};

const EXCEPTION_POLICY = {
  mode: 'documented-exception-required',
  allowedFor: ['fixtures', 'types', 'manifest', 'demo'],
  minimumReason: 'The generated worklog, component docs or test suite must name why the artifact is not applicable.',
  forbidden: ['empty-test-file', 'silent-manifest-skip', 'undocumented-type-gap']
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getComponentBlueprintContract() {
  return clone({
    schema: COMPONENT_BLUEPRINT_SCHEMA,
    status: 'binding-from-WP-E03-03',
    naming: NAMING_CONTRACT,
    artifacts: ARTIFACT_MATRIX,
    profiles: PROFILE_CHECKS,
    typescriptBlueprint: TYPESCRIPT_BLUEPRINT_REQUIREMENTS,
    a11yProfile: A11Y_PROFILE_REQUIREMENTS,
    performancePolicy: PERFORMANCE_POLICY_REQUIREMENTS,
    exceptionPolicy: EXCEPTION_POLICY
  });
}

function getArtifactContract(id) {
  const artifact = ARTIFACT_MATRIX.find((entry) => entry.id === id);
  return artifact ? clone(artifact) : null;
}

function getProfileContract(profile) {
  const contract = PROFILE_CHECKS.find((entry) => entry.profile === profile);
  return contract ? clone(contract) : null;
}

module.exports = {
  ARTIFACT_MATRIX,
  A11Y_PROFILE_REQUIREMENTS,
  COMPONENT_BLUEPRINT_SCHEMA,
  TYPESCRIPT_BLUEPRINT_REQUIREMENTS,
  TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA,
  COMPONENT_FABRIC_LANE_INGESTION_SCHEMA,
  COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA,
  EXCEPTION_POLICY,
  NAMING_CONTRACT,
  PERFORMANCE_POLICY_REQUIREMENTS,
  PROFILE_CHECKS,
  getArtifactContract,
  getComponentBlueprintContract,
  getProfileContract
};
