const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const COMPONENT_CONTRACT_REPORT_V2_SCHEMA = 'xtend.component.contract-report.v2';
const COMPONENT_CONTRACT_V2_WORKPACKAGE = 'WP-E10-03';
const COMPONENT_CONTRACT_V2_DOC = 'development/XTend-Component-Contract-v2.md';
const TYPESCRIPT_SOURCE_STRATEGY_SCHEMA = 'xtend.typescript.component-source-strategy.v1';
const RMT_COMPONENT_CONTRACT_SCHEMA = 'xtend.rmt.component-contract.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const A11Y_COMPONENT_CONTRACT_SCHEMA = 'xtend.a11y.component-contract.v1';
const PERFORMANCE_COMPONENT_PROFILE_SCHEMA = 'xtend.performance.component-profile.v1';
const TELEMETRY_SNAPSHOT_SCHEMA = 'xtend.fabric.telemetry-snapshot.v1';

const CONTRACT_V2_REQUIRED_DOMAINS = [
  'source',
  'runtime',
  'publicApi',
  'rmt',
  'fabric',
  'telemetry',
  'lanes',
  'a11y',
  'performance',
  'tests',
  'docs',
  'maturity'
];

const CONTRACT_V2_LIFECYCLE_OPERATIONS = [
  'mount',
  'hydrate',
  'render',
  'update',
  'event',
  'error',
  'unmount'
];

const CONTRACT_V2_LANE_PRECEDENCE = [
  'rmt.schedule-record',
  'rmt.component-metadata',
  'fabric.runtime-override',
  'component.static-contract',
  'scaffold.blueprint-default'
];

function toBasename(tag) {
  return String(tag || 'x-example').replace(/-/g, '');
}

function toClassName(tag) {
  return String(tag || 'x-example')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function createAttributeContract(attributes = []) {
  const normalized = attributes.length > 0 ? attributes : ['variant'];
  return normalized.map((name) => ({
    name,
    type: 'string | null',
    reflects: true,
    required: false,
    source: 'observedAttributes'
  }));
}

function createEventContract(events = [], className) {
  return normalizeArray(events).map((name) => ({
    name,
    typeName: `${className}EventDetail`,
    eventType: `CustomEvent<${className}EventDetail>`,
    bubbles: true,
    composed: true,
    detailShape: {
      id: 'string',
      source: 'string',
      value: 'unknown'
    }
  }));
}

function createComponentContractV2(input = {}, options = {}) {
  const tag = input.tag || 'x-example';
  const basename = input.basename || toBasename(tag);
  const className = input.className || toClassName(tag);
  const sourceRoot = options.sourceRoot || 'src/components/';
  const runtimeOutputRoot = options.runtimeOutputRoot || 'components/';
  const declarationOutputRoot = options.declarationOutputRoot || 'components/';
  const maturity = input.maturity || 'preview';
  const sourceState = input.sourceState || (input.typescript === false ? 'js-legacy' : 'ts-source');
  const attributes = createAttributeContract(normalizeArray(input.attributes));
  const events = createEventContract(normalizeArray(input.events), className);
  const slots = normalizeArray(input.slots).length > 0
    ? normalizeArray(input.slots).map((name) => ({ name, required: false, content: 'RmtTemplateRef | string | HTMLElement' }))
    : [{ name: 'default', required: false, content: 'RmtTemplateRef | string | HTMLElement' }];

  return {
    schema: COMPONENT_CONTRACT_V2_SCHEMA,
    status: 'contract-draft',
    workpackage: COMPONENT_CONTRACT_V2_WORKPACKAGE,
    tag,
    className,
    maturity,
    source: {
      strategy: TYPESCRIPT_SOURCE_STRATEGY_SCHEMA,
      state: sourceState,
      sourceRoot,
      sourcePath: `${sourceRoot}${tag}/${tag}.ts`,
      contractPath: `${sourceRoot}${tag}/${tag}.contract.ts`,
      rmtMetadataPath: `${sourceRoot}${tag}/${tag}.rmt.ts`,
      a11yProfilePath: `${sourceRoot}${tag}/${tag}.a11y.ts`,
      performanceProfilePath: `${sourceRoot}${tag}/${tag}.performance.ts`,
      fixtureDataPath: `${sourceRoot}${tag}/${tag}.fixture.ts`,
      migrationAllowedStates: ['js-legacy', 'ts-planned', 'ts-source', 'ts-generated-esm', 'contract-only']
    },
    runtime: {
      format: 'esm',
      loader: 'xtend-loader.js',
      manifest: 'components/manifest.json',
      artifact: `${runtimeOutputRoot}${basename}.js`,
      declaration: `${declarationOutputRoot}${basename}.d.ts`,
      localOnly: true,
      cdnAllowed: false,
      newRuntimeDependenciesAllowed: false
    },
    publicApi: {
      attributes,
      properties: normalizeArray(input.properties),
      slots,
      events,
      methods: normalizeArray(input.methods),
      state: normalizeArray(input.state),
      theme: normalizeArray(input.theme),
      typeExports: [`${className}Element`, `${className}EventName`, `${className}EventDetail`]
    },
    rmt: {
      schema: RMT_COMPONENT_CONTRACT_SCHEMA,
      adapter: 'xtend.component',
      componentRecordKind: 'custom_element',
      fields: ['id', 'kind', 'adapter', 'tag', 'props', 'attributes', 'slots', 'events', 'schedule', 'hydration', 'fabric', 'a11y', 'performance'],
      routeAdapter: input.routeAdapter || null,
      kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    },
    fabric: {
      schema: FABRIC_BOUNDARY_SCHEMA,
      api: '@xtend-fabric',
      operations: CONTRACT_V2_LIFECYCLE_OPERATIONS.slice(),
      boundaryRequired: true,
      diagnosticFields: ['component', 'phase', 'fiberId', 'lane', 'severity', 'cause']
    },
    telemetry: {
      schema: TELEMETRY_SNAPSHOT_SCHEMA,
      requiredOperations: CONTRACT_V2_LIFECYCLE_OPERATIONS.slice(),
      requiredFields: ['componentId', 'routeId', 'rmtId', 'scheduleId', 'fiberId', 'lane', 'durationMs', 'status'],
      backpressureAware: true
    },
    lanes: {
      precedence: CONTRACT_V2_LANE_PRECEDENCE.slice(),
      defaultLane: input.defaultLane || 'visible',
      diagnosticsOnConflict: true
    },
    a11y: {
      schema: A11Y_COMPONENT_CONTRACT_SCHEMA,
      requiredProfile: true,
      requiredFields: ['role', 'accessibleName', 'focusStrategy', 'keyboard', 'ariaStates', 'screenreader', 'motion', 'contrast']
    },
    performance: {
      schema: PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
      budgetMatrix: 'development/XTend-Performance-Budget-Matrix.md',
      requiredProfile: true,
      requiredFields: ['budgetClass', 'lane', 'hydrationPolicy', 'criticalMeasurements', 'cleanup']
    },
    tests: {
      requiredSuites: ['components', 'a11y-hydration', 'rmt-compatibility', 'references'],
      futureSuites: ['component-contract-v2', 'performance-regression', 'browser'],
      fixtureRequired: true
    },
    docs: {
      componentGuide: `docs/components/${tag.replace(/^x-/, '')}.md`,
      requiredSections: ['API', 'Events', 'RMT Authoring', 'Fabric', 'A11y', 'Performance']
    },
    maturity: {
      model: 'xtend.component.maturity-model.v2',
      target: maturity,
      stableRequires: ['publicApi', 'rmt', 'fabric', 'telemetry', 'lanes', 'a11y', 'performance', 'tests', 'docs']
    }
  };
}

function validateComponentContractV2(contract = {}) {
  const errors = [];

  if (contract.schema !== COMPONENT_CONTRACT_V2_SCHEMA) {
    errors.push(`schema must be ${COMPONENT_CONTRACT_V2_SCHEMA}`);
  }
  if (!/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(contract.tag || ''))) {
    errors.push('tag must be a valid XTend custom element tag');
  }

  CONTRACT_V2_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) {
      errors.push(`missing domain: ${domain}`);
    }
  });

  if (contract.runtime && contract.runtime.format !== 'esm') {
    errors.push('runtime.format must be esm');
  }
  if (contract.runtime && contract.runtime.cdnAllowed !== false) {
    errors.push('runtime.cdnAllowed must be false');
  }
  if (contract.rmt && contract.rmt.kernelBoundary !== 'no-rmt-kernel-import-of-xtend-types') {
    errors.push('rmt.kernelBoundary must keep the RMT kernel decoupled from XTend types');
  }
  if (contract.fabric && !Array.isArray(contract.fabric.operations)) {
    errors.push('fabric.operations must be an array');
  }
  if (contract.publicApi && !Array.isArray(contract.publicApi.events)) {
    errors.push('publicApi.events must be an array');
  }

  return {
    schema: COMPONENT_CONTRACT_REPORT_V2_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_CONTRACT_V2_SCHEMA,
  COMPONENT_CONTRACT_REPORT_V2_SCHEMA,
  COMPONENT_CONTRACT_V2_WORKPACKAGE,
  COMPONENT_CONTRACT_V2_DOC,
  TYPESCRIPT_SOURCE_STRATEGY_SCHEMA,
  RMT_COMPONENT_CONTRACT_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  TELEMETRY_SNAPSHOT_SCHEMA,
  CONTRACT_V2_REQUIRED_DOMAINS,
  CONTRACT_V2_LIFECYCLE_OPERATIONS,
  CONTRACT_V2_LANE_PRECEDENCE,
  createComponentContractV2,
  validateComponentContractV2
};
