const {
  COMPONENT_CONTRACT_V2_SCHEMA,
  CONTRACT_V2_LIFECYCLE_OPERATIONS,
  createComponentContractV2,
  validateComponentContractV2
} = require('../xtend-builder/typing/component-contract-v2');

const EPIC10_P0_COMPONENT_WAVE_SCHEMA = 'xtend.epic10.p0-component-wave.v1';
const EPIC10_P0_COMPONENT_STUB_SCHEMA = 'xtend.epic10.p0-component-contract-stub.v1';
const EPIC10_P0_COMPONENT_WAVE_GATE_SCHEMA = 'xtend.epic10.p0-component-wave-gate.v1';

const EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE = 'WP-E10-08';
const EPIC10_P0_COMPONENT_WAVE_DOC = 'development/XTend-P0-Komponentenwelle-und-Contract-Stubs.md';
const EPIC10_P0_COMPONENT_WAVE_SUITE = 'tests/components/epic10_p0_component_wave_suite.js';
const EPIC10_P0_COMPONENT_WAVE_GATE = 'node scripts/run_xtend_tests.js epic10-p0-component-wave --json';

const REQUIRED_TS_COMPONENT_ARTIFACTS = Object.freeze([
  'ts-source',
  'ts-contract',
  'ts-rmt',
  'ts-a11y',
  'ts-performance',
  'ts-fixture'
]);

const REQUIRED_RUNTIME_ARTIFACTS = Object.freeze([
  'component',
  'types',
  'manifest'
]);

const REQUIRED_COMPANION_ARTIFACTS = Object.freeze([
  'docs',
  'tests',
  'fixtures',
  'demo'
]);

const REQUIRED_LOCAL_GATES = Object.freeze([
  'component-contract-v2',
  'builder-typescript-blueprint',
  'epic10-p0-component-wave',
  'references'
]);

const EXPECTED_COMPONENT_ORDER = Object.freeze([
  'x-select',
  'x-checkbox',
  'x-radio',
  'x-textarea',
  'x-status',
  'x-progress',
  'x-tooltip',
  'x-popover',
  'x-drawer'
]);

const WORKPACKAGE_COMPONENT_MAP = Object.freeze({
  'WP-E10-09': Object.freeze(['x-select', 'x-checkbox', 'x-radio']),
  'WP-E10-10': Object.freeze(['x-textarea', 'x-status', 'x-progress']),
  'WP-E10-11': Object.freeze(['x-tooltip', 'x-popover', 'x-drawer'])
});

const P0_COMPONENT_WAVE_DEFINITIONS = Object.freeze([
  {
    tag: 'x-select',
    title: 'Select Control',
    family: 'form-selection',
    wave: 'form-selection-controls',
    implementationWorkpackage: 'WP-E10-09',
    implementationOrder: 1,
    profiles: ['form', 'interactive', 'stateful'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'closes the largest form gap after x-input and x-form and becomes the reference for option slots and value events',
    appSurfaces: ['forms', 'filters', 'settings', 'rmt-first-apps'],
    attributes: ['name', 'value', 'disabled', 'required', 'multiple', 'placeholder', 'label'],
    properties: ['options: XtendSelectOption[]', 'selectedOptions: XtendSelectOption[]'],
    slots: ['default', 'option', 'label', 'hint', 'error'],
    events: ['select-changed', 'select-invalid'],
    methods: ['focus(): void', 'reset(): void', 'validate(): boolean'],
    a11y: {
      role: 'combobox',
      keyboard: ['Tab', 'ArrowDown', 'ArrowUp', 'Enter', 'Escape'],
      screenreader: ['accessible-name-required', 'expanded-state', 'selected-option-announcement'],
      focusStrategy: 'roving-option-focus',
      requiredAssertions: ['labelled-control', 'keyboard-option-selection', 'error-region-reference']
    },
    performance: {
      budgetClass: 'interactive-medium',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event']
    },
    dependencies: ['x-input', 'x-form', 'screenreader-signals']
  },
  {
    tag: 'x-checkbox',
    title: 'Checkbox Control',
    family: 'form-selection',
    wave: 'form-selection-controls',
    implementationWorkpackage: 'WP-E10-09',
    implementationOrder: 2,
    profiles: ['form', 'interactive'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'adds the smallest stable binary input and anchors checked, indeterminate and form-value contracts',
    appSurfaces: ['forms', 'tables', 'settings', 'bulk-actions'],
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'indeterminate', 'label'],
    properties: ['checked: boolean', 'indeterminate: boolean'],
    slots: ['default', 'label', 'hint', 'error'],
    events: ['checkbox-changed', 'checkbox-invalid'],
    methods: ['focus(): void', 'toggle(): void', 'validate(): boolean'],
    a11y: {
      role: 'checkbox',
      keyboard: ['Tab', 'Space'],
      screenreader: ['checked-state', 'indeterminate-state', 'error-announcement'],
      focusStrategy: 'native-control-focus',
      requiredAssertions: ['space-toggle', 'aria-checked-reflection', 'label-association']
    },
    performance: {
      budgetClass: 'interactive-small',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'event']
    },
    dependencies: ['x-form', 'screenreader-signals']
  },
  {
    tag: 'x-radio',
    title: 'Radio Control',
    family: 'form-selection',
    wave: 'form-selection-controls',
    implementationWorkpackage: 'WP-E10-09',
    implementationOrder: 3,
    profiles: ['form', 'interactive'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'completes the first selection-control set and defines group coordination for RMT-authored forms',
    appSurfaces: ['forms', 'settings', 'wizard-steps', 'filters'],
    attributes: ['name', 'value', 'checked', 'disabled', 'required', 'label'],
    properties: ['checked: boolean', 'groupValue: string | null'],
    slots: ['default', 'label', 'hint', 'error'],
    events: ['radio-changed', 'radio-invalid'],
    methods: ['focus(): void', 'check(): void', 'validate(): boolean'],
    a11y: {
      role: 'radio',
      keyboard: ['Tab', 'Space', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'],
      screenreader: ['checked-state', 'group-position', 'error-announcement'],
      focusStrategy: 'radio-group-roving-focus',
      requiredAssertions: ['group-name-required', 'arrow-group-navigation', 'exclusive-selection']
    },
    performance: {
      budgetClass: 'interactive-small',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'event']
    },
    dependencies: ['x-form', 'screenreader-signals']
  },
  {
    tag: 'x-textarea',
    title: 'Textarea Control',
    family: 'form-input',
    wave: 'form-feedback-controls',
    implementationWorkpackage: 'WP-E10-10',
    implementationOrder: 4,
    profiles: ['form', 'stateful'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'extends x-input for long-form input, validation and character-count telemetry',
    appSurfaces: ['forms', 'comments', 'settings', 'support-flows'],
    attributes: ['name', 'value', 'placeholder', 'required', 'disabled', 'rows', 'maxlength', 'label'],
    properties: ['value: string', 'dirty: boolean', 'validity: ValidityState | null'],
    slots: ['label', 'hint', 'error', 'counter'],
    events: ['textarea-changed', 'textarea-invalid', 'textarea-committed'],
    methods: ['focus(): void', 'reset(): void', 'validate(): boolean'],
    a11y: {
      role: 'textbox',
      keyboard: ['Tab', 'Enter', 'Escape'],
      screenreader: ['multiline-state', 'description-reference', 'character-count-announcement'],
      focusStrategy: 'native-control-focus',
      requiredAssertions: ['labelled-control', 'aria-multiline', 'maxlength-feedback']
    },
    performance: {
      budgetClass: 'interactive-medium',
      lane: 'visible',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'update']
    },
    dependencies: ['x-input', 'x-form', 'screenreader-signals']
  },
  {
    tag: 'x-status',
    title: 'Status Region',
    family: 'feedback',
    wave: 'form-feedback-controls',
    implementationWorkpackage: 'WP-E10-10',
    implementationOrder: 5,
    profiles: ['feedback', 'display'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'provides a stable semantic status surface for async, validation and scheduler feedback',
    appSurfaces: ['forms', 'dashboards', 'rmt-diagnostics', 'settings'],
    attributes: ['type', 'tone', 'live', 'dismissible', 'label'],
    properties: ['message: string', 'details: string | null'],
    slots: ['default', 'icon', 'actions'],
    events: ['status-dismissed', 'status-announced'],
    methods: ['announce(message: string): void', 'dismiss(): void'],
    a11y: {
      role: 'status',
      keyboard: ['Tab', 'Enter', 'Escape'],
      screenreader: ['live-region', 'polite-vs-assertive', 'non-color-status'],
      focusStrategy: 'message-then-action-focus',
      requiredAssertions: ['aria-live-mode', 'dismiss-action-name', 'non-color-icon-label']
    },
    performance: {
      budgetClass: 'feedback-small',
      lane: 'a11y',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['render', 'event']
    },
    dependencies: ['screenreader-signals', 'motion-contrast-policy']
  },
  {
    tag: 'x-progress',
    title: 'Progress Indicator',
    family: 'feedback',
    wave: 'form-feedback-controls',
    implementationWorkpackage: 'WP-E10-10',
    implementationOrder: 6,
    profiles: ['feedback', 'display'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'creates a deterministic progress contract for scheduled async work and long-running component hydration',
    appSurfaces: ['uploads', 'data-loading', 'rmt-schedules', 'dashboards'],
    attributes: ['value', 'max', 'label', 'indeterminate', 'tone'],
    properties: ['value: number | null', 'max: number'],
    slots: ['label', 'description'],
    events: ['progress-completed', 'progress-cancelled'],
    methods: ['setValue(value: number): void', 'complete(): void'],
    a11y: {
      role: 'progressbar',
      keyboard: ['Tab'],
      screenreader: ['valuemin-valuemax-valuenow', 'indeterminate-announcement'],
      focusStrategy: 'non-interactive-status-focus',
      requiredAssertions: ['aria-valuenow-policy', 'label-required', 'reduced-motion-animation']
    },
    performance: {
      budgetClass: 'feedback-small',
      lane: 'idle',
      hydrationPolicy: 'lazy',
      criticalMeasurements: ['render', 'update']
    },
    dependencies: ['motion-contrast-policy', 'performance-regression']
  },
  {
    tag: 'x-tooltip',
    title: 'Tooltip',
    family: 'overlay-feedback',
    wave: 'overlay-navigation-controls',
    implementationWorkpackage: 'WP-E10-11',
    implementationOrder: 7,
    profiles: ['overlay', 'feedback'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'adds lightweight contextual help without making overlay primitives depend on a larger popover implementation',
    appSurfaces: ['forms', 'toolbars', 'dashboards', 'component-lab'],
    attributes: ['for', 'placement', 'open', 'delay', 'label'],
    properties: ['anchor: HTMLElement | null', 'open: boolean'],
    slots: ['default'],
    events: ['tooltip-opened', 'tooltip-closed'],
    methods: ['show(): void', 'hide(): void', 'toggle(): void'],
    a11y: {
      role: 'tooltip',
      keyboard: ['Focus', 'Blur', 'Escape'],
      screenreader: ['describedby-link', 'dismiss-on-escape'],
      focusStrategy: 'anchor-retains-focus',
      requiredAssertions: ['aria-describedby', 'hover-and-focus-open', 'escape-close']
    },
    performance: {
      budgetClass: 'overlay-small',
      lane: 'visible',
      hydrationPolicy: 'idle',
      criticalMeasurements: ['mount', 'event']
    },
    dependencies: ['motion-contrast-policy', 'screenreader-signals']
  },
  {
    tag: 'x-popover',
    title: 'Popover',
    family: 'overlay-interactive',
    wave: 'overlay-navigation-controls',
    implementationWorkpackage: 'WP-E10-11',
    implementationOrder: 8,
    profiles: ['overlay', 'interactive'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'provides an interactive anchored overlay for menus, filters and contextual actions',
    appSurfaces: ['filters', 'menus', 'toolbars', 'component-lab'],
    attributes: ['open', 'placement', 'modal', 'anchor', 'label'],
    properties: ['anchor: HTMLElement | null', 'open: boolean', 'modal: boolean'],
    slots: ['default', 'trigger', 'actions'],
    events: ['popover-opened', 'popover-closed'],
    methods: ['show(): void', 'hide(): void', 'toggle(): void'],
    a11y: {
      role: 'dialog',
      keyboard: ['Tab', 'Shift+Tab', 'Escape'],
      screenreader: ['accessible-name-required', 'focus-return', 'modal-state'],
      focusStrategy: 'contained-focus-when-modal',
      requiredAssertions: ['escape-close', 'outside-click-close', 'focus-return']
    },
    performance: {
      budgetClass: 'overlay-medium',
      lane: 'user-blocking',
      hydrationPolicy: 'visible',
      criticalMeasurements: ['mount', 'hydrate', 'event']
    },
    dependencies: ['x-tooltip', 'motion-contrast-policy']
  },
  {
    tag: 'x-drawer',
    title: 'Drawer',
    family: 'overlay-navigation',
    wave: 'overlay-navigation-controls',
    implementationWorkpackage: 'WP-E10-11',
    implementationOrder: 9,
    profiles: ['overlay', 'routing'],
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    minimumMaturity: 'stable',
    rationale: 'adds route-aware navigation and task panels for RMT-first app shells',
    appSurfaces: ['app-shell', 'navigation', 'settings', 'side-panels'],
    attributes: ['open', 'placement', 'modal', 'label', 'route-aware'],
    properties: ['open: boolean', 'routeRef: string | null', 'modal: boolean'],
    slots: ['header', 'default', 'footer', 'trigger'],
    events: ['drawer-opened', 'drawer-closed', 'drawer-route-selected'],
    methods: ['openDrawer(): void', 'closeDrawer(): void', 'toggle(): void'],
    a11y: {
      role: 'dialog',
      keyboard: ['Tab', 'Shift+Tab', 'Escape'],
      screenreader: ['accessible-name-required', 'route-change-announcement'],
      focusStrategy: 'focus-trap-with-return',
      requiredAssertions: ['aria-modal-when-modal', 'escape-close', 'route-focus-sync']
    },
    performance: {
      budgetClass: 'overlay-large',
      lane: 'visible',
      hydrationPolicy: 'lazy',
      criticalMeasurements: ['mount', 'hydrate', 'route']
    },
    dependencies: ['x-router', 'x-link', 'motion-contrast-policy']
  }
]);

function unique(values) {
  return Array.from(new Set(values));
}

function toClassName(tag) {
  return String(tag)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function createRmtMetadata(definition) {
  const schedules = unique([
    'component.visible.mount',
    definition.performance.hydrationPolicy === 'lazy' ? 'component.lazy.hydrate' : 'component.idle.hydrate',
    definition.performance.lane === 'user-blocking' ? 'ui.user-blocking.input' : null,
    definition.performance.lane === 'a11y' ? 'a11y.user-blocking.announce' : null,
    'diagnostics.snapshot'
  ].filter(Boolean));

  return {
    adapter: 'xtend.component',
    componentRecordKind: 'custom_element',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
    schedules,
    templateMode: 'dom_descriptor',
    eventBindingMode: 'dom-event-to-rmt-command',
    hydration: {
      policy: definition.performance.hydrationPolicy,
      lane: definition.performance.lane,
      visibleFirst: definition.performance.hydrationPolicy === 'visible'
    },
    fields: ['id', 'tag', 'props', 'attributes', 'slots', 'events', 'schedule', 'hydration', 'fabric', 'a11y', 'performance']
  };
}

function createFabricMetadata(definition) {
  return {
    api: '@xtend-fabric',
    boundary: 'xtend.component.fabric-boundary.v2',
    defaultLane: definition.performance.lane,
    operations: CONTRACT_V2_LIFECYCLE_OPERATIONS.slice(),
    ingest: {
      fabricContext: true,
      lane: true,
      fiberHints: true,
      telemetry: true
    },
    diagnostics: ['component', 'phase', 'fiberId', 'lane', 'severity', 'cause']
  };
}

function createArtifactPlan(definition, componentContract) {
  return {
    required: REQUIRED_TS_COMPONENT_ARTIFACTS.slice(),
    runtime: REQUIRED_RUNTIME_ARTIFACTS.slice(),
    companion: REQUIRED_COMPANION_ARTIFACTS.slice(),
    sourcePaths: {
      source: componentContract.source.sourcePath,
      contract: componentContract.source.contractPath,
      rmt: componentContract.source.rmtMetadataPath,
      a11y: componentContract.source.a11yProfilePath,
      performance: componentContract.source.performanceProfilePath,
      fixture: componentContract.source.fixtureDataPath
    },
    outputPaths: {
      runtime: componentContract.runtime.artifact,
      declaration: componentContract.runtime.declaration,
      docs: componentContract.docs.componentGuide,
      fixture: `tests/components/fixtures/${definition.tag.replace(/-/g, '')}.component.html`,
      suite: `tests/components/${definition.tag.replace(/-/g, '')}.component_suite.js`
    }
  };
}

function createP0ComponentContractStub(definition) {
  const componentContract = createComponentContractV2({
    tag: definition.tag,
    className: toClassName(definition.tag),
    maturity: definition.targetMaturity,
    sourceState: definition.sourceState,
    defaultLane: definition.performance.lane,
    attributes: definition.attributes,
    properties: definition.properties,
    slots: definition.slots,
    events: definition.events,
    methods: definition.methods
  });
  const validation = validateComponentContractV2(componentContract);

  return {
    schema: EPIC10_P0_COMPONENT_STUB_SCHEMA,
    tag: definition.tag,
    title: definition.title,
    family: definition.family,
    wave: definition.wave,
    implementationWorkpackage: definition.implementationWorkpackage,
    implementationOrder: definition.implementationOrder,
    profiles: definition.profiles.slice(),
    sourceState: definition.sourceState,
    targetMaturity: definition.targetMaturity,
    minimumMaturity: definition.minimumMaturity,
    rationale: definition.rationale,
    appSurfaces: definition.appSurfaces.slice(),
    dependencies: definition.dependencies.slice(),
    publicApi: {
      attributes: definition.attributes.slice(),
      properties: definition.properties.slice(),
      slots: definition.slots.slice(),
      events: definition.events.slice(),
      methods: definition.methods.slice()
    },
    componentContract,
    componentContractValidation: validation,
    rmt: createRmtMetadata(definition),
    fabric: createFabricMetadata(definition),
    telemetry: {
      snapshot: 'xtend.fabric.telemetry-snapshot.v1',
      operations: CONTRACT_V2_LIFECYCLE_OPERATIONS.slice(),
      requiredCorrelation: ['componentId', 'rmtComponentId', 'scheduleRef', 'fabricLane', 'fiberKind'],
      backpressureAware: true
    },
    lanes: {
      default: definition.performance.lane,
      hydrationPolicy: definition.performance.hydrationPolicy,
      precedence: componentContract.lanes.precedence.slice()
    },
    a11y: Object.assign({
      contract: 'xtend.a11y.component-contract.v1'
    }, definition.a11y),
    performance: Object.assign({
      contract: 'xtend.performance.component-profile.v1'
    }, definition.performance),
    artifactPlan: createArtifactPlan(definition, componentContract),
    gates: REQUIRED_LOCAL_GATES.slice(),
    handoff: {
      from: EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE,
      to: definition.implementationWorkpackage,
      acceptanceGate: EPIC10_P0_COMPONENT_WAVE_GATE
    }
  };
}

function summarizeStubs(stubs) {
  return {
    total: stubs.length,
    byWorkpackage: stubs.reduce((accumulator, stub) => {
      accumulator[stub.implementationWorkpackage] = (accumulator[stub.implementationWorkpackage] || 0) + 1;
      return accumulator;
    }, {}),
    byFamily: stubs.reduce((accumulator, stub) => {
      accumulator[stub.family] = (accumulator[stub.family] || 0) + 1;
      return accumulator;
    }, {}),
    byWave: stubs.reduce((accumulator, stub) => {
      accumulator[stub.wave] = (accumulator[stub.wave] || 0) + 1;
      return accumulator;
    }, {}),
    implementationOrder: stubs
      .slice()
      .sort((left, right) => left.implementationOrder - right.implementationOrder)
      .map((stub) => stub.tag)
  };
}

function createP0ComponentWavePlan(options = {}) {
  const definitions = options.definitions || P0_COMPONENT_WAVE_DEFINITIONS;
  const stubs = definitions
    .map(createP0ComponentContractStub)
    .sort((left, right) => left.implementationOrder - right.implementationOrder);

  return {
    schema: EPIC10_P0_COMPONENT_WAVE_SCHEMA,
    status: 'accepted-contract',
    workpackage: EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE,
    contract: EPIC10_P0_COMPONENT_WAVE_DOC,
    suite: EPIC10_P0_COMPONENT_WAVE_SUITE,
    localGate: EPIC10_P0_COMPONENT_WAVE_GATE,
    sourceStrategy: 'xtend.typescript.component-source-strategy.v1',
    componentContract: COMPONENT_CONTRACT_V2_SCHEMA,
    maturityModel: 'xtend.component.maturity-model.v2',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types',
    sourceState: 'ts-planned',
    targetMaturity: 'stable',
    componentCount: stubs.length,
    expectedTags: EXPECTED_COMPONENT_ORDER.slice(),
    workpackageMap: Object.entries(WORKPACKAGE_COMPONENT_MAP).reduce((accumulator, [workpackage, tags]) => {
      accumulator[workpackage] = tags.slice();
      return accumulator;
    }, {}),
    requiredArtifacts: {
      sourceOfTruth: REQUIRED_TS_COMPONENT_ARTIFACTS.slice(),
      runtime: REQUIRED_RUNTIME_ARTIFACTS.slice(),
      companion: REQUIRED_COMPANION_ARTIFACTS.slice()
    },
    gates: REQUIRED_LOCAL_GATES.slice(),
    summary: summarizeStubs(stubs),
    stubs,
    followUps: ['WP-E10-09', 'WP-E10-10', 'WP-E10-11', 'WP-E10-15']
  };
}

function validateP0ComponentWavePlan(plan = {}) {
  const errors = [];

  if (plan.schema !== EPIC10_P0_COMPONENT_WAVE_SCHEMA) {
    errors.push(`schema must be ${EPIC10_P0_COMPONENT_WAVE_SCHEMA}`);
  }
  if (plan.workpackage !== EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE) {
    errors.push(`workpackage must be ${EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE}`);
  }
  if (plan.kernelBoundary !== 'no-rmt-kernel-import-of-xtend-types') {
    errors.push('kernelBoundary must keep the RMT kernel decoupled from XTend types');
  }

  const stubs = Array.isArray(plan.stubs) ? plan.stubs : [];
  const tags = stubs.map((stub) => stub.tag);
  const uniqueTags = unique(tags);

  if (stubs.length !== EXPECTED_COMPONENT_ORDER.length) {
    errors.push(`stubs must contain ${EXPECTED_COMPONENT_ORDER.length} components`);
  }
  if (uniqueTags.length !== tags.length) {
    errors.push('component tags must be unique');
  }
  EXPECTED_COMPONENT_ORDER.forEach((tag, index) => {
    if (tags[index] !== tag) {
      errors.push(`implementation order index ${index + 1} must be ${tag}`);
    }
  });

  Object.entries(WORKPACKAGE_COMPONENT_MAP).forEach(([workpackage, expectedTags]) => {
    const actualTags = stubs
      .filter((stub) => stub.implementationWorkpackage === workpackage)
      .map((stub) => stub.tag);
    expectedTags.forEach((tag) => {
      if (!actualTags.includes(tag)) {
        errors.push(`${workpackage} must include ${tag}`);
      }
    });
  });

  stubs.forEach((stub) => {
    if (stub.schema !== EPIC10_P0_COMPONENT_STUB_SCHEMA) {
      errors.push(`${stub.tag || 'unknown'} stub schema must be ${EPIC10_P0_COMPONENT_STUB_SCHEMA}`);
    }
    if (!stub.componentContract || stub.componentContract.schema !== COMPONENT_CONTRACT_V2_SCHEMA) {
      errors.push(`${stub.tag || 'unknown'} must expose Component Contract v2`);
    }
    if (!stub.componentContractValidation || stub.componentContractValidation.ok !== true) {
      errors.push(`${stub.tag || 'unknown'} Component Contract v2 validation must pass`);
    }
    if (stub.sourceState !== 'ts-planned') {
      errors.push(`${stub.tag || 'unknown'} sourceState must be ts-planned`);
    }
    if (stub.targetMaturity !== 'stable') {
      errors.push(`${stub.tag || 'unknown'} targetMaturity must be stable`);
    }
    if (!stub.rmt || stub.rmt.adapter !== 'xtend.component') {
      errors.push(`${stub.tag || 'unknown'} must use the xtend.component RMT adapter`);
    }
    if (!stub.rmt || stub.rmt.kernelBoundary !== 'no-rmt-kernel-import-of-xtend-types') {
      errors.push(`${stub.tag || 'unknown'} must keep the RMT kernel boundary`);
    }
    if (!stub.fabric || stub.fabric.api !== '@xtend-fabric') {
      errors.push(`${stub.tag || 'unknown'} must bind to @xtend-fabric`);
    }
    if (!stub.telemetry || stub.telemetry.backpressureAware !== true) {
      errors.push(`${stub.tag || 'unknown'} must be telemetry/backpressure-aware`);
    }
    REQUIRED_TS_COMPONENT_ARTIFACTS.forEach((artifact) => {
      if (!stub.artifactPlan || !stub.artifactPlan.required.includes(artifact)) {
        errors.push(`${stub.tag || 'unknown'} artifact plan must require ${artifact}`);
      }
    });
    REQUIRED_LOCAL_GATES.forEach((gate) => {
      if (!stub.gates || !stub.gates.includes(gate)) {
        errors.push(`${stub.tag || 'unknown'} gates must include ${gate}`);
      }
    });
  });

  return {
    schema: EPIC10_P0_COMPONENT_WAVE_GATE_SCHEMA,
    ok: errors.length === 0,
    errors,
    checkedComponents: stubs.length,
    expectedComponents: EXPECTED_COMPONENT_ORDER.slice()
  };
}

function createP0ComponentWaveGate(options = {}) {
  const plan = options.plan || createP0ComponentWavePlan(options);
  const report = validateP0ComponentWavePlan(plan);

  return Object.assign({}, report, {
    planSchema: plan.schema,
    workpackage: plan.workpackage,
    localGate: plan.localGate,
    componentCount: plan.componentCount,
    implementationOrder: plan.summary.implementationOrder.slice()
  });
}

module.exports = {
  EPIC10_P0_COMPONENT_WAVE_SCHEMA,
  EPIC10_P0_COMPONENT_STUB_SCHEMA,
  EPIC10_P0_COMPONENT_WAVE_GATE_SCHEMA,
  EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE,
  EPIC10_P0_COMPONENT_WAVE_DOC,
  EPIC10_P0_COMPONENT_WAVE_SUITE,
  EPIC10_P0_COMPONENT_WAVE_GATE,
  REQUIRED_TS_COMPONENT_ARTIFACTS,
  REQUIRED_RUNTIME_ARTIFACTS,
  REQUIRED_COMPANION_ARTIFACTS,
  REQUIRED_LOCAL_GATES,
  EXPECTED_COMPONENT_ORDER,
  WORKPACKAGE_COMPONENT_MAP,
  P0_COMPONENT_WAVE_DEFINITIONS,
  createP0ComponentContractStub,
  createP0ComponentWavePlan,
  validateP0ComponentWavePlan,
  createP0ComponentWaveGate
};
