const {
  CONTRACT_V2_LANE_PRECEDENCE,
  CONTRACT_V2_LIFECYCLE_OPERATIONS,
  createComponentContractV2,
  validateComponentContractV2
} = require('../xtend-builder/typing/component-contract-v2');

const EXISTING_COMPONENT_METADATA_SCHEMA = 'xtend.epic10.existing-component-metadata.v1';
const EXISTING_COMPONENT_RECORD_SCHEMA = 'xtend.epic10.existing-component-metadata.record.v1';
const EXISTING_COMPONENT_METADATA_GATE_SCHEMA = 'xtend.epic10.existing-component-metadata-gate.v1';
const EXISTING_COMPONENT_METADATA_WORKPACKAGE = 'WP-E10-14';
const EXISTING_COMPONENT_METADATA_DOC = 'development/XTend-Existing-Component-RMT-Fabric-Metadata.md';
const EXISTING_COMPONENT_METADATA_SUITE = 'tests/components/existing_component_metadata_migration_suite.js';
const EXISTING_COMPONENT_METADATA_GATE = 'node scripts/run_xtend_tests.js existing-component-metadata --json';
const EXISTING_COMPONENT_METADATA_MODULE = 'catalog/epic10-existing-component-metadata.js';
const MIGRATION_STRATEGY = 'js-legacy-contract-overlay-no-runtime-rewrite';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
const TARGET_COMPONENTS = [
  'x-router',
  'x-link',
  'x-input',
  'x-form',
  'x-modal',
  'x-dialog',
  'x-tabs',
  'x-toast',
  'x-alert'
];

function toBasename(tag) {
  return String(tag).replace(/-/g, '');
}

function toClassName(tag) {
  return String(tag)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function createRuntimePaths(tag) {
  const basename = toBasename(tag);
  return {
    artifact: `components/${basename}.js`,
    declaration: `components/${basename}.d.ts`,
    docs: `docs/components/${basename}.md`,
    suite: `tests/components/${basename}.component_suite.js`,
    fixture: `tests/components/fixtures/${basename}.component.html`
  };
}

const COMPONENT_DEFINITIONS = [
  {
    tag: 'x-router',
    family: 'routing',
    priority: 'P0',
    profiles: ['routing', 'stateful'],
    lane: 'visible',
    hydrationPolicy: 'visible',
    attributes: ['mode', 'routesrc'],
    slots: ['default', 'route'],
    events: ['route-changed', 'routechange', 'xrouter-routes-registered'],
    methods: ['registerRoutes(routes, options): void', 'navigate(path): void', 'renderRouteToString(path, routes): object'],
    schedules: ['app.shell.render', 'route.visible.render', 'route.transition.render', 'component.visible.mount', 'diagnostics.snapshot'],
    routeAdapter: 'xtend.xrouter',
    rmtCapabilities: ['routeRecords', 'runtimeRouteRegistration', 'scheduleRefs', 'metadataForwarding'],
    a11yRole: 'navigation',
    budgetClass: 'routing-critical'
  },
  {
    tag: 'x-link',
    family: 'routing',
    priority: 'P0',
    profiles: ['routing', 'interactive'],
    lane: 'user-blocking',
    hydrationPolicy: 'visible',
    attributes: ['href', 'target', 'rel', 'disabled', 'active'],
    slots: ['default'],
    events: ['before-navigate', 'after-navigate', 'x-navigate'],
    methods: ['click(): void', 'focus(): void'],
    schedules: ['route.transition.render', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    routeAdapter: 'xtend.xrouter',
    rmtCapabilities: ['routeActivation', 'navigationEvents', 'scheduleRefs', 'ariaCurrentSync'],
    a11yRole: 'link',
    budgetClass: 'interactive-small'
  },
  {
    tag: 'x-input',
    family: 'form',
    priority: 'P0',
    profiles: ['form', 'interactive', 'stateful'],
    lane: 'user-blocking',
    hydrationPolicy: 'visible',
    attributes: ['type', 'name', 'value', 'placeholder', 'required', 'disabled'],
    slots: ['label', 'hint', 'error'],
    events: ['input-changed', 'validation-failed'],
    methods: ['focus(): void', 'reset(): void', 'reportValidity(): boolean'],
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    rmtCapabilities: ['formValue', 'validation', 'eventCommands', 'stateSync'],
    a11yRole: 'textbox',
    budgetClass: 'interactive-medium'
  },
  {
    tag: 'x-form',
    family: 'form',
    priority: 'P0',
    profiles: ['form', 'stateful'],
    lane: 'user-blocking',
    hydrationPolicy: 'visible',
    attributes: ['action', 'method', 'name', 'novalidate'],
    slots: ['default', 'actions', 'status', 'error'],
    events: ['submit', 'invalid', 'reset'],
    methods: ['getFormData(): object', 'reset(): void', 'validate(): boolean'],
    schedules: ['component.visible.mount', 'component.idle.hydrate', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    rmtCapabilities: ['formAggregation', 'childControlDiscovery', 'eventCommands', 'validationSummary'],
    a11yRole: 'form',
    budgetClass: 'interactive-medium'
  },
  {
    tag: 'x-modal',
    family: 'overlay',
    priority: 'P0',
    profiles: ['overlay', 'stateful'],
    lane: 'user-blocking',
    hydrationPolicy: 'visible',
    attributes: ['open', 'overlay', 'title', 'content', 'actions'],
    slots: ['default', 'actions'],
    events: ['modal-opened', 'modal-closed', 'modal-action'],
    methods: ['open(): void', 'close(): void', 'toggle(): void'],
    schedules: ['overlay.visible.mount', 'component.visible.mount', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    rmtCapabilities: ['overlayState', 'focusTrap', 'eventCommands', 'modalActions'],
    a11yRole: 'dialog',
    budgetClass: 'overlay-critical'
  },
  {
    tag: 'x-dialog',
    family: 'overlay',
    priority: 'P0',
    profiles: ['overlay', 'stateful'],
    lane: 'user-blocking',
    hydrationPolicy: 'visible',
    attributes: ['open', 'overlay', 'title', 'width', 'height'],
    slots: ['default', 'footer'],
    events: ['dialog-opened', 'dialog-closed'],
    methods: ['openDialog(): void', 'closeDialog(): void'],
    schedules: ['overlay.visible.mount', 'component.visible.mount', 'ui.user-blocking.input', 'diagnostics.snapshot'],
    rmtCapabilities: ['overlayState', 'focusTrap', 'eventCommands', 'sizeHints'],
    a11yRole: 'dialog',
    budgetClass: 'overlay-critical'
  },
  {
    tag: 'x-tabs',
    family: 'interactive-navigation',
    priority: 'P0',
    profiles: ['interactive', 'routing'],
    lane: 'user-blocking',
    hydrationPolicy: 'visible',
    attributes: ['selected', 'text-color', 'orientation'],
    slots: ['default', 'tab'],
    events: ['tab-selected'],
    methods: ['selectTab(index): void', 'focus(): void'],
    schedules: ['component.visible.mount', 'ui.user-blocking.input', 'route.transition.render', 'diagnostics.snapshot'],
    rmtCapabilities: ['tabRecords', 'keyboardSelection', 'routePanelMapping', 'eventCommands'],
    a11yRole: 'tablist',
    budgetClass: 'interactive-medium'
  },
  {
    tag: 'x-toast',
    family: 'feedback',
    priority: 'P1',
    profiles: ['feedback'],
    lane: 'visible',
    hydrationPolicy: 'visible',
    attributes: ['type', 'duration'],
    slots: ['default'],
    events: ['toast-shown', 'toast-dismissed'],
    methods: ['show(): void', 'dismiss(): void'],
    schedules: ['component.visible.mount', 'diagnostics.snapshot'],
    rmtCapabilities: ['feedbackStatus', 'dismissalCommand', 'timerPolicy', 'liveRegion'],
    a11yRole: 'status',
    budgetClass: 'feedback-small'
  },
  {
    tag: 'x-alert',
    family: 'feedback',
    priority: 'P1',
    profiles: ['feedback', 'stateful'],
    lane: 'visible',
    hydrationPolicy: 'visible',
    attributes: ['type', 'closable', 'duration', 'overlay', 'aria-label'],
    slots: ['default'],
    events: ['alert-shown', 'alert-dismissed'],
    methods: ['show(): void', 'dismiss(): void'],
    schedules: ['component.visible.mount', 'diagnostics.snapshot'],
    rmtCapabilities: ['feedbackStatus', 'dismissalCommand', 'stateSync', 'liveRegion'],
    a11yRole: 'alert',
    budgetClass: 'feedback-small'
  }
];

function createRmtMetadata(definition) {
  return {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    routeAdapter: definition.routeAdapter || null,
    componentRecordKind: 'custom_element',
    kernelBoundary: KERNEL_BOUNDARY,
    templateMode: 'dom_descriptor',
    eventBindingMode: 'dom-event-to-rmt-command',
    schedules: unique(definition.schedules),
    capabilities: definition.rmtCapabilities.slice(),
    hydration: {
      policy: definition.hydrationPolicy,
      lane: definition.lane,
      visibleFirst: definition.hydrationPolicy === 'visible'
    },
    fields: ['id', 'kind', 'adapter', 'tag', 'props', 'attributes', 'slots', 'events', 'schedule', 'hydration', 'fabric', 'a11y', 'performance']
  };
}

function createFabricMetadata(definition) {
  return {
    schema: 'xtend.component.fabric-boundary.v2',
    api: '@xtend-fabric',
    defaultLane: definition.lane,
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

function createLegacyComponentContract(definition, paths) {
  const contract = createComponentContractV2({
    tag: definition.tag,
    className: toClassName(definition.tag),
    maturity: 'stable',
    sourceState: 'js-legacy',
    typescript: false,
    defaultLane: definition.lane,
    routeAdapter: definition.routeAdapter || null,
    attributes: definition.attributes,
    slots: definition.slots,
    events: definition.events,
    methods: definition.methods
  });

  return {
    ...contract,
    status: 'accepted-metadata-overlay',
    workpackage: EXISTING_COMPONENT_METADATA_WORKPACKAGE,
    source: {
      ...contract.source,
      state: 'js-legacy',
      sourcePath: paths.artifact,
      contractPath: EXISTING_COMPONENT_METADATA_MODULE,
      rmtMetadataPath: EXISTING_COMPONENT_METADATA_MODULE,
      a11yProfilePath: EXISTING_COMPONENT_METADATA_MODULE,
      performanceProfilePath: EXISTING_COMPONENT_METADATA_MODULE,
      fixtureDataPath: paths.fixture
    },
    runtime: {
      ...contract.runtime,
      artifact: paths.artifact,
      declaration: paths.declaration,
      localOnly: true,
      cdnAllowed: false,
      newRuntimeDependenciesAllowed: false
    },
    rmt: createRmtMetadata(definition),
    fabric: createFabricMetadata(definition),
    telemetry: {
      ...contract.telemetry,
      schema: 'xtend.fabric.telemetry-snapshot.v1',
      requiredOperations: CONTRACT_V2_LIFECYCLE_OPERATIONS.slice(),
      backpressureAware: true
    },
    lanes: {
      precedence: CONTRACT_V2_LANE_PRECEDENCE.slice(),
      defaultLane: definition.lane,
      diagnosticsOnConflict: true
    },
    a11y: {
      ...contract.a11y,
      schema: 'xtend.a11y.component-contract.v1',
      role: definition.a11yRole
    },
    performance: {
      ...contract.performance,
      schema: 'xtend.performance.component-profile.v1',
      budgetClass: definition.budgetClass,
      lane: definition.lane,
      hydrationPolicy: definition.hydrationPolicy
    },
    tests: {
      ...contract.tests,
      componentSuite: paths.suite,
      fixture: paths.fixture
    },
    docs: {
      ...contract.docs,
      componentGuide: paths.docs
    }
  };
}

function createExistingComponentRecord(definition) {
  const paths = createRuntimePaths(definition.tag);
  const componentContract = createLegacyComponentContract(definition, paths);
  const validation = validateComponentContractV2(componentContract);

  return {
    schema: EXISTING_COMPONENT_RECORD_SCHEMA,
    tag: definition.tag,
    family: definition.family,
    priority: definition.priority,
    workpackage: EXISTING_COMPONENT_METADATA_WORKPACKAGE,
    status: 'metadata-migrated',
    sourceState: 'js-legacy',
    migrationStrategy: MIGRATION_STRATEGY,
    noBigBangTypeScriptMigration: true,
    runtimeRewriteRequired: false,
    profiles: definition.profiles.slice(),
    paths,
    publicApi: {
      attributes: definition.attributes.slice(),
      slots: definition.slots.slice(),
      events: definition.events.slice(),
      methods: definition.methods.slice()
    },
    componentContract,
    componentContractValidation: validation,
    rmt: createRmtMetadata(definition),
    fabric: createFabricMetadata(definition),
    telemetry: {
      schema: 'xtend.fabric.telemetry-snapshot.v1',
      operations: CONTRACT_V2_LIFECYCLE_OPERATIONS.slice(),
      requiredCorrelation: ['componentId', 'rmtComponentId', 'scheduleRef', 'fabricLane', 'fiberKind'],
      backpressureAware: true
    },
    lanes: {
      default: definition.lane,
      hydrationPolicy: definition.hydrationPolicy,
      precedence: CONTRACT_V2_LANE_PRECEDENCE.slice()
    },
    a11y: {
      schema: 'xtend.a11y.component-contract.v1',
      role: definition.a11yRole
    },
    performance: {
      schema: 'xtend.performance.component-profile.v1',
      budgetClass: definition.budgetClass,
      lane: definition.lane,
      hydrationPolicy: definition.hydrationPolicy
    }
  };
}

function summarizeRecords(records) {
  return {
    total: records.length,
    byFamily: records.reduce((accumulator, record) => {
      accumulator[record.family] = (accumulator[record.family] || 0) + 1;
      return accumulator;
    }, {}),
    byPriority: records.reduce((accumulator, record) => {
      accumulator[record.priority] = (accumulator[record.priority] || 0) + 1;
      return accumulator;
    }, {}),
    byLane: records.reduce((accumulator, record) => {
      accumulator[record.lanes.default] = (accumulator[record.lanes.default] || 0) + 1;
      return accumulator;
    }, {}),
    tags: records.map((record) => record.tag)
  };
}

function createExistingComponentMetadataPlan(options = {}) {
  const definitions = options.definitions || COMPONENT_DEFINITIONS;
  const records = definitions.map(createExistingComponentRecord);

  return {
    schema: EXISTING_COMPONENT_METADATA_SCHEMA,
    status: 'accepted-migration',
    workpackage: EXISTING_COMPONENT_METADATA_WORKPACKAGE,
    contract: EXISTING_COMPONENT_METADATA_DOC,
    module: EXISTING_COMPONENT_METADATA_MODULE,
    suite: EXISTING_COMPONENT_METADATA_SUITE,
    localGate: EXISTING_COMPONENT_METADATA_GATE,
    migrationStrategy: MIGRATION_STRATEGY,
    kernelBoundary: KERNEL_BOUNDARY,
    componentContract: 'xtend.component.contract.v2',
    rmtContract: 'xtend.rmt.component-contract.v1',
    fabricContract: 'xtend.component.fabric-boundary.v2',
    telemetryContract: 'xtend.fabric.telemetry-snapshot.v1',
    sourceState: 'js-legacy',
    noBigBangTypeScriptMigration: true,
    runtimeRewriteRequired: false,
    targetComponents: TARGET_COMPONENTS.slice(),
    records,
    summary: summarizeRecords(records),
    handoff: {
      from: 'WP-E10-13',
      to: 'WP-E10-15',
      acceptanceGate: EXISTING_COMPONENT_METADATA_GATE
    }
  };
}

function validateExistingComponentMetadataPlan(plan = createExistingComponentMetadataPlan()) {
  const errors = [];

  if (plan.schema !== EXISTING_COMPONENT_METADATA_SCHEMA) {
    errors.push(`schema must be ${EXISTING_COMPONENT_METADATA_SCHEMA}`);
  }
  if (plan.status !== 'accepted-migration') {
    errors.push('status must be accepted-migration');
  }
  if (plan.workpackage !== EXISTING_COMPONENT_METADATA_WORKPACKAGE) {
    errors.push(`workpackage must be ${EXISTING_COMPONENT_METADATA_WORKPACKAGE}`);
  }
  if (plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('kernel boundary must remain decoupled');
  }
  if (plan.migrationStrategy !== MIGRATION_STRATEGY) {
    errors.push(`migration strategy must be ${MIGRATION_STRATEGY}`);
  }
  if (plan.runtimeRewriteRequired !== false || plan.noBigBangTypeScriptMigration !== true) {
    errors.push('plan must avoid runtime rewrite and big-bang TypeScript migration');
  }
  if (JSON.stringify(plan.targetComponents || []) !== JSON.stringify(TARGET_COMPONENTS)) {
    errors.push('target component order must be stable');
  }

  const seenTags = new Set();
  (plan.records || []).forEach((record) => {
    if (record.schema !== EXISTING_COMPONENT_RECORD_SCHEMA) {
      errors.push(`${record.tag || 'unknown'} must declare record schema`);
    }
    if (!TARGET_COMPONENTS.includes(record.tag)) {
      errors.push(`${record.tag || 'unknown'} is not part of WP-E10-14 target components`);
    }
    if (seenTags.has(record.tag)) {
      errors.push(`${record.tag} is duplicated`);
    }
    seenTags.add(record.tag);
    if (record.sourceState !== 'js-legacy') {
      errors.push(`${record.tag} must remain js-legacy`);
    }
    if (record.runtimeRewriteRequired !== false || record.noBigBangTypeScriptMigration !== true) {
      errors.push(`${record.tag} must avoid runtime rewrite and big-bang migration`);
    }
    if (!record.componentContractValidation || record.componentContractValidation.ok !== true) {
      errors.push(`${record.tag} Component Contract v2 validation failed`);
    }
    if (!record.rmt || record.rmt.adapter !== 'xtend.component') {
      errors.push(`${record.tag} must use xtend.component adapter`);
    }
    if (!record.rmt || record.rmt.kernelBoundary !== KERNEL_BOUNDARY) {
      errors.push(`${record.tag} must keep RMT kernel boundary`);
    }
    if (!record.rmt || record.rmt.templateMode !== 'dom_descriptor') {
      errors.push(`${record.tag} must use dom_descriptor templates`);
    }
    if (!record.rmt || record.rmt.eventBindingMode !== 'dom-event-to-rmt-command') {
      errors.push(`${record.tag} must use command event binding`);
    }
    if (!record.rmt || !Array.isArray(record.rmt.schedules) || !record.rmt.schedules.includes('diagnostics.snapshot')) {
      errors.push(`${record.tag} must expose diagnostics snapshot schedule`);
    }
    if (!record.fabric || record.fabric.api !== '@xtend-fabric') {
      errors.push(`${record.tag} must bind Fabric API`);
    }
    if (!record.telemetry || record.telemetry.schema !== 'xtend.fabric.telemetry-snapshot.v1') {
      errors.push(`${record.tag} must bind Fabric telemetry snapshot`);
    }
    if (!record.lanes || !CONTRACT_V2_LANE_PRECEDENCE.every((entry) => record.lanes.precedence.includes(entry))) {
      errors.push(`${record.tag} must expose lane precedence`);
    }
  });

  if (seenTags.size !== TARGET_COMPONENTS.length) {
    errors.push('all WP-E10-14 target components must have records');
  }

  return {
    schema: EXISTING_COMPONENT_METADATA_GATE_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createExistingComponentMetadataGate(options = {}) {
  const plan = options.plan || createExistingComponentMetadataPlan();
  const validation = validateExistingComponentMetadataPlan(plan);

  return {
    schema: EXISTING_COMPONENT_METADATA_GATE_SCHEMA,
    ok: validation.ok,
    localGate: EXISTING_COMPONENT_METADATA_GATE,
    componentCount: plan.records.length,
    targetComponents: plan.targetComponents.slice(),
    migrationStrategy: plan.migrationStrategy,
    summary: plan.summary,
    errors: validation.errors
  };
}

module.exports = {
  COMPONENT_DEFINITIONS,
  EXISTING_COMPONENT_METADATA_DOC,
  EXISTING_COMPONENT_METADATA_GATE,
  EXISTING_COMPONENT_METADATA_GATE_SCHEMA,
  EXISTING_COMPONENT_METADATA_MODULE,
  EXISTING_COMPONENT_METADATA_SCHEMA,
  EXISTING_COMPONENT_METADATA_SUITE,
  EXISTING_COMPONENT_METADATA_WORKPACKAGE,
  EXISTING_COMPONENT_RECORD_SCHEMA,
  KERNEL_BOUNDARY,
  MIGRATION_STRATEGY,
  TARGET_COMPONENTS,
  createExistingComponentMetadataGate,
  createExistingComponentMetadataPlan,
  validateExistingComponentMetadataPlan
};
