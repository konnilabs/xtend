const {
  XTEND_DESIGN_TOKEN_SCHEMA,
  tokenNames
} = require('../../design-tokens/xtend-design-tokens');

const RMT_DSL_AUTHORING_POLISH_SCHEMA = 'xtend.rmt.dsl-authoring-polish.v1';
const RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA = 'xtend.rmt.dsl-authoring-polish-report.v1';
const RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA = 'xtend.rmt.dsl-authoring-polish-fixture.v1';
const RMT_DSL_AUTHORING_POLISH_WORKPACKAGE = 'WP-E12-13';
const RMT_DSL_AUTHORING_POLISH_MODULE_PATH = 'xtend-builder/typing/rmt-dsl-authoring-polish.js';
const RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH = 'tests/fixtures/rmt-dsl-authoring-polish.rmt';
const RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH = 'development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md';
const RMT_DSL_AUTHORING_POLISH_DOC_PATH = 'docs/rmt-dsl-authoring-polish.md';
const RMT_DSL_AUTHORING_POLISH_SUITE_PATH = 'tests/rmt/rmt_dsl_authoring_polish_suite.js';
const RMT_DSL_AUTHORING_POLISH_WP_PATH = 'development/WP-E12-13-RMT-DSL-Authoring-Polish-fuer-Component-Shells-vorbereiten.md';
const RMT_DSL_AUTHORING_POLISH_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json';
const RMT_DSL_AUTHORING_POLISH_PACKAGE_SCRIPT = 'npm run test:rmt-dsl-authoring-polish';
const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const RMT_STYLE_AUTHORING_SCHEMA = 'xtend.rmt.style-authoring.v1';
const RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA = 'xtend.rmt.first-class-app-authoring.v1';
const RMT_XROUTER_ADAPTER_SCHEMA = 'xtend.rmt.xrouter-adapter.v1';
const COMPONENT_NETWORK_SCHEMA = 'xtend.component.network.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const DSL_ALIAS_NAMES = Object.freeze([
  'component',
  'shell',
  'slot',
  'style',
  'token',
  'theme',
  'density',
  'a11y',
  'on',
  'command',
  'hydrate',
  'lane',
  'route',
  'link',
  'outlet'
]);

const DIAGNOSTIC_CODES = Object.freeze([
  'rmt.dsl.alias.unknown',
  'rmt.dsl.alias.required-field-missing',
  'rmt.dsl.token.unknown',
  'rmt.dsl.route.target-unresolved',
  'rmt.dsl.link.route-unresolved',
  'rmt.dsl.slot.target-unresolved',
  'rmt.dsl.schedule.unresolved',
  'rmt.dsl.inline-runtime-code-refused',
  'rmt.dsl.kernel-boundary.refused'
]);

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function createAlias(alias, expandsTo, fields, options = {}) {
  return {
    alias,
    expandsTo,
    fields: normalizeArray(fields),
    adapter: options.adapter || null,
    sourceContract: options.sourceContract || RMT_SHELL_AUTHORING_SCHEMA,
    kernelVisible: options.kernelVisible === true,
    sugarOnly: options.sugarOnly !== false,
    diagnostics: normalizeArray(options.diagnostics),
    example: options.example || alias
  };
}

function createDiagnostic(code, severity, message, options = {}) {
  return {
    code,
    severity,
    message,
    appliesTo: normalizeArray(options.appliesTo),
    repairHint: options.repairHint || null,
    upstreamSafe: options.upstreamSafe !== false
  };
}

function createRmtDslAuthoringPolishPlan(input = {}) {
  const productTokens = tokenNames();
  const aliasPlan = [
    createAlias('component', 'components[]', ['id', 'tag', 'template', 'shell', 'style', 'a11y', 'events', 'commands', 'hydration', 'fabric'], {
      adapter: 'xtend.component',
      example: 'component settings.shell uses x-section'
    }),
    createAlias('shell', 'components[].shell', ['state', 'slots', 'parts', 'focus', 'attributes'], {
      example: 'shell ready slots header/content'
    }),
    createAlias('slot', 'components[].shell.slots', ['name', 'template', 'component', 'text'], {
      example: 'slot feedback component feedback.toast'
    }),
    createAlias('style', 'components[].style', ['variant', 'size', 'density', 'theme', 'tokens', 'parts'], {
      sourceContract: RMT_STYLE_AUTHORING_SCHEMA,
      example: 'style primary dense theme dark'
    }),
    createAlias('token', 'components[].style.tokens', ['name', 'value'], {
      sourceContract: XTEND_DESIGN_TOKEN_SCHEMA,
      example: 'token --xtend-surface var(--xtend-surface)'
    }),
    createAlias('theme', 'components[].style.theme', ['name'], {
      sourceContract: XTEND_DESIGN_TOKEN_SCHEMA,
      example: 'theme high-contrast'
    }),
    createAlias('density', 'components[].style.density', ['name'], {
      sourceContract: XTEND_DESIGN_TOKEN_SCHEMA,
      example: 'density compact'
    }),
    createAlias('a11y', 'components[].a11y', ['role', 'label', 'description', 'live', 'keyboard', 'focus', 'announcements'], {
      example: 'a11y region label Settings'
    }),
    createAlias('on', 'components[].events', ['event', 'command', 'bubbles', 'composed'], {
      sourceContract: COMPONENT_NETWORK_SCHEMA,
      example: 'on xtend:route-change command route.navigate'
    }),
    createAlias('command', 'components[].commands', ['name', 'schedule', 'payload'], {
      sourceContract: COMPONENT_NETWORK_SCHEMA,
      example: 'command validate schedule ui.user-blocking.input'
    }),
    createAlias('hydrate', 'components[].hydration', ['policy', 'schedule', 'ownershipMode'], {
      example: 'hydrate visible schedule component.visible.mount'
    }),
    createAlias('lane', 'components[].fabric.lane', ['lane', 'fiber', 'telemetry'], {
      sourceContract: FABRIC_BOUNDARY_SCHEMA,
      example: 'lane user-blocking fiber component.event'
    }),
    createAlias('route', 'routes[]', ['path', 'component', 'template', 'schedule', 'announce'], {
      adapter: 'xtend.xrouter',
      sourceContract: RMT_XROUTER_ADAPTER_SCHEMA,
      example: 'route /settings component settings.shell'
    }),
    createAlias('link', 'components[] + routes[]', ['href', 'label', 'route', 'active', 'focusRestore'], {
      adapter: 'xtend.component',
      sourceContract: RMT_XROUTER_ADAPTER_SCHEMA,
      example: 'link Settings to /settings'
    }),
    createAlias('outlet', 'templates[].nodes[]', ['route', 'slot', 'fallback'], {
      sourceContract: RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA,
      example: 'outlet primary route current'
    })
  ].concat(normalizeArray(input.aliasPlan));

  const diagnostics = [
    createDiagnostic('rmt.dsl.alias.unknown', 'error', 'The alias is not part of the accepted RMT DSL polish plan.', {
      appliesTo: ['aliasPlan'],
      repairHint: 'Use one of component, shell, slot, style, token, theme, density, a11y, on, command, hydrate, lane, route, link or outlet.'
    }),
    createDiagnostic('rmt.dsl.alias.required-field-missing', 'error', 'A DSL alias is missing a required field for normalized RMT output.', {
      appliesTo: ['component', 'route', 'link'],
      repairHint: 'Add the required normalized field before passing the record to the RMT runtime.'
    }),
    createDiagnostic('rmt.dsl.token.unknown', 'warning', 'A token name is not part of xtend.design-tokens.product-contract.v1.', {
      appliesTo: ['token', 'style'],
      repairHint: 'Use a documented --xtend-* product token or register an app-local token pack.'
    }),
    createDiagnostic('rmt.dsl.route.target-unresolved', 'error', 'A route points to an unknown component or template.', {
      appliesTo: ['route'],
      repairHint: 'Declare the component/template before the route or use a stable reference id.'
    }),
    createDiagnostic('rmt.dsl.link.route-unresolved', 'error', 'A link points to an unknown route path.', {
      appliesTo: ['link'],
      repairHint: 'Create a matching route alias record.'
    }),
    createDiagnostic('rmt.dsl.slot.target-unresolved', 'error', 'A slot points to an unknown template or component.', {
      appliesTo: ['slot'],
      repairHint: 'Bind slots only to declared templates, components or static text.'
    }),
    createDiagnostic('rmt.dsl.schedule.unresolved', 'error', 'An alias references a schedule that is not declared in the RMT document.', {
      appliesTo: ['command', 'hydrate', 'route'],
      repairHint: 'Use an existing schedule id or add a schedule alias.'
    }),
    createDiagnostic('rmt.dsl.inline-runtime-code-refused', 'error', 'Inline runtime code is not allowed in DSL-polished RMT records.', {
      appliesTo: ['on', 'command', 'template'],
      repairHint: 'Bind commands to host adapters instead of embedding JavaScript.'
    }),
    createDiagnostic('rmt.dsl.kernel-boundary.refused', 'error', 'The DSL polish layer must not introduce XTend imports into the RMT kernel.', {
      appliesTo: ['adapters', 'components', 'routes'],
      repairHint: `Keep ${KERNEL_BOUNDARY}.`
    })
  ];

  const examples = [
    {
      id: 'settings-shell',
      aliases: ['component', 'shell', 'slot', 'style', 'token', 'a11y', 'hydrate', 'lane'],
      normalizedRecords: ['components[]', 'templates[]', 'schedules[]'],
      purpose: 'Shell-first component with tokenized style and visible hydration.'
    },
    {
      id: 'settings-route-link',
      aliases: ['route', 'link', 'on', 'command'],
      normalizedRecords: ['routes[]', 'components[]', 'commands[]'],
      purpose: 'XRouter/XLink sugar without embedding XRouter in the RMT kernel.'
    },
    {
      id: 'feedback-slot',
      aliases: ['slot', 'component', 'a11y', 'command'],
      normalizedRecords: ['components[]', 'templates[]'],
      purpose: 'Feedback component in a named shell slot with a11y announcement schedule.'
    },
    {
      id: 'theme-density-pack',
      aliases: ['theme', 'density', 'token'],
      normalizedRecords: ['components[].style', 'themePacks[]', 'densityPacks[]'],
      purpose: 'Theme and density authoring using product tokens from WP-E12-12.'
    }
  ];

  return {
    schema: RMT_DSL_AUTHORING_POLISH_SCHEMA,
    reportSchema: RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA,
    fixtureSchema: RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA,
    status: 'accepted-polish-plan',
    workpackage: RMT_DSL_AUTHORING_POLISH_WORKPACKAGE,
    sourceContracts: [
      RMT_SHELL_AUTHORING_SCHEMA,
      RMT_STYLE_AUTHORING_SCHEMA,
      RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA,
      RMT_XROUTER_ADAPTER_SCHEMA,
      COMPONENT_NETWORK_SCHEMA,
      XTEND_DESIGN_TOKEN_SCHEMA
    ],
    productSurface: {
      purpose: 'authoring-sugar-and-validation-handoff',
      runtimeExecution: 'host-adapter-only',
      kernelBoundary: KERNEL_BOUNDARY,
      noXtendKernelImports: true,
      noInlineRuntimeCode: true,
      localOnly: true,
      externalNetworkAllowed: false
    },
    aliasPlan,
    diagnostics,
    routingSugar: {
      routerAdapter: 'xtend.xrouter',
      routeAlias: 'route',
      linkAlias: 'link',
      outletAlias: 'outlet',
      activeState: ['aria-current', 'data-active-route'],
      focusRestore: true,
      announcements: 'a11y.announce'
    },
    tokenBridge: {
      schema: XTEND_DESIGN_TOKEN_SCHEMA,
      requiredTokens: ['--xtend-surface', '--xtend-text', '--xtend-color-primary', '--xtend-density-spacing', '--xtend-radius'],
      availableTokens: productTokens,
      themePacks: ['light', 'dark', 'high-contrast', 'forced-colors'],
      densityPacks: ['comfortable', 'compact', 'dense']
    },
    validation: {
      normalizeBeforeRuntime: true,
      diagnosticsFirst: true,
      requiredAliases: DSL_ALIAS_NAMES.slice(),
      requiredDiagnostics: DIAGNOSTIC_CODES.slice(),
      refuseScriptNodes: true,
      refuseInlineHandlers: true,
      rejectUnknownRouteTargets: true,
      rejectUnknownScheduleRefs: true
    },
    templateExamples: examples,
    upstreamHandoff: {
      target: 'XTendRMT upstream',
      expectedWork: ['syntax-normalization', 'friendly-parser-errors', 'editor-snippets', 'schema-autocomplete'],
      stableInputs: ['aliasPlan', 'diagnostics', 'tokenBridge', 'routingSugar'],
      nonGoals: ['import XTend component classes in the RMT kernel', 'execute DOM event handlers in RMT', 'replace host adapters']
    },
    docs: {
      contract: RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH,
      guide: RMT_DSL_AUTHORING_POLISH_DOC_PATH,
      fixture: RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH
    },
    tests: {
      suite: RMT_DSL_AUTHORING_POLISH_SUITE_PATH,
      localGate: RMT_DSL_AUTHORING_POLISH_LOCAL_GATE,
      packageScript: RMT_DSL_AUTHORING_POLISH_PACKAGE_SCRIPT,
      requiredSuites: ['rmt-dsl-authoring-polish', 'rmt-shell-authoring-ux', 'design-tokens', 'references']
    }
  };
}

function validateRmtDslAuthoringPolishPlan(plan = createRmtDslAuthoringPolishPlan()) {
  const errors = [];
  const aliases = normalizeArray(plan.aliasPlan);
  const aliasNames = aliases.map((entry) => entry.alias);
  const diagnostics = normalizeArray(plan.diagnostics);
  const diagnosticCodes = diagnostics.map((entry) => entry.code);

  if (!plan || plan.schema !== RMT_DSL_AUTHORING_POLISH_SCHEMA) {
    errors.push(`schema must be ${RMT_DSL_AUTHORING_POLISH_SCHEMA}`);
  }
  if (!plan || plan.workpackage !== RMT_DSL_AUTHORING_POLISH_WORKPACKAGE) {
    errors.push(`workpackage must be ${RMT_DSL_AUTHORING_POLISH_WORKPACKAGE}`);
  }
  if (!plan.productSurface || plan.productSurface.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  }
  if (!plan.productSurface || plan.productSurface.noXtendKernelImports !== true || plan.productSurface.noInlineRuntimeCode !== true) {
    errors.push('productSurface must forbid XTend kernel imports and inline runtime code');
  }

  DSL_ALIAS_NAMES.forEach((alias) => {
    if (!aliasNames.includes(alias)) errors.push(`missing alias: ${alias}`);
  });
  aliases.forEach((alias) => {
    if (!alias.expandsTo || !Array.isArray(alias.fields) || alias.fields.length === 0) {
      errors.push(`alias ${alias.alias} must define expansion target and fields`);
    }
    if (alias.kernelVisible !== false) {
      errors.push(`alias ${alias.alias} must remain kernel-invisible sugar`);
    }
  });
  DIAGNOSTIC_CODES.forEach((code) => {
    if (!diagnosticCodes.includes(code)) errors.push(`missing diagnostic: ${code}`);
  });
  ['route', 'link', 'outlet'].forEach((alias) => {
    if (!plan.routingSugar || plan.routingSugar[`${alias}Alias`] !== alias) {
      errors.push(`routingSugar must expose ${alias} alias`);
    }
  });
  ['--xtend-surface', '--xtend-color-primary', '--xtend-density-spacing'].forEach((tokenName) => {
    if (!plan.tokenBridge || !normalizeArray(plan.tokenBridge.availableTokens).includes(tokenName)) {
      errors.push(`tokenBridge missing ${tokenName}`);
    }
  });
  if (!plan.validation || plan.validation.normalizeBeforeRuntime !== true || plan.validation.diagnosticsFirst !== true) {
    errors.push('validation must normalize before runtime and remain diagnostics-first');
  }
  if (!plan.upstreamHandoff || !normalizeArray(plan.upstreamHandoff.nonGoals).some((entry) => entry.includes('RMT kernel'))) {
    errors.push('upstream handoff must keep kernel non-goals visible');
  }

  return {
    schema: RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function validateRmtDslAuthoringPolishFixture(fixture = {}, plan = createRmtDslAuthoringPolishPlan()) {
  const errors = [];
  const aliases = normalizeArray(fixture.dslAliases).map((entry) => entry.alias);
  const examples = normalizeArray(fixture.authoringExamples);
  const diagnostics = normalizeArray(fixture.diagnosticFixtures).map((entry) => entry.code);

  if (fixture.schema !== RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA) {
    errors.push(`fixture schema must be ${RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA}`);
  }
  if (fixture.contract !== RMT_DSL_AUTHORING_POLISH_SCHEMA) {
    errors.push(`fixture contract must be ${RMT_DSL_AUTHORING_POLISH_SCHEMA}`);
  }
  if (fixture.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push(`fixture kernelBoundary must be ${KERNEL_BOUNDARY}`);
  }
  normalizeArray(plan.validation && plan.validation.requiredAliases).forEach((alias) => {
    if (!aliases.includes(alias)) errors.push(`fixture missing alias: ${alias}`);
  });
  normalizeArray(plan.validation && plan.validation.requiredDiagnostics).forEach((code) => {
    if (!diagnostics.includes(code)) errors.push(`fixture missing diagnostic: ${code}`);
  });
  if (examples.length < 4) errors.push('fixture must contain at least four authoring examples');
  examples.forEach((example) => {
    if (!example.normalized || !Array.isArray(example.aliases) || example.aliases.length === 0) {
      errors.push(`example ${example.id || 'unknown'} must expose aliases and normalized output`);
    }
    if (JSON.stringify(example).includes('function(') || JSON.stringify(example).includes('=>')) {
      errors.push(`example ${example.id || 'unknown'} must not contain inline runtime code`);
    }
  });

  return {
    schema: RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_NETWORK_SCHEMA,
  DIAGNOSTIC_CODES,
  DSL_ALIAS_NAMES,
  FABRIC_BOUNDARY_SCHEMA,
  KERNEL_BOUNDARY,
  RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH,
  RMT_DSL_AUTHORING_POLISH_DOC_PATH,
  RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH,
  RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA,
  RMT_DSL_AUTHORING_POLISH_LOCAL_GATE,
  RMT_DSL_AUTHORING_POLISH_MODULE_PATH,
  RMT_DSL_AUTHORING_POLISH_PACKAGE_SCRIPT,
  RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA,
  RMT_DSL_AUTHORING_POLISH_SCHEMA,
  RMT_DSL_AUTHORING_POLISH_SUITE_PATH,
  RMT_DSL_AUTHORING_POLISH_WORKPACKAGE,
  RMT_DSL_AUTHORING_POLISH_WP_PATH,
  RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA,
  RMT_SHELL_AUTHORING_SCHEMA,
  RMT_STYLE_AUTHORING_SCHEMA,
  RMT_XROUTER_ADAPTER_SCHEMA,
  XTEND_DESIGN_TOKEN_SCHEMA,
  createRmtDslAuthoringPolishPlan,
  validateRmtDslAuthoringPolishFixture,
  validateRmtDslAuthoringPolishPlan
};
