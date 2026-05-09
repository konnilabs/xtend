const COMPONENT_SHELL_CONTRACT_SCHEMA = 'xtend.component.shell.v1';
const COMPONENT_SHELL_REPORT_SCHEMA = 'xtend.component.shell-report.v1';
const COMPONENT_SHELL_WORKPACKAGE = 'WP-E11-02';
const COMPONENT_SHELL_CONTRACT_DOC = 'development/XTend-Component-Shell-Contract.md';
const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2';
const UX_MATURITY_MODEL_SCHEMA = 'xtend.component.ux-maturity-model.v1';
const RMT_SHELL_AUTHORING_SCHEMA = 'xtend.rmt.shell-authoring.v1';
const FABRIC_BOUNDARY_SCHEMA = 'xtend.component.fabric-boundary.v2';
const A11Y_COMPONENT_CONTRACT_SCHEMA = 'xtend.a11y.component-contract.v1';
const PERFORMANCE_COMPONENT_PROFILE_SCHEMA = 'xtend.performance.component-profile.v1';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const SHELL_REQUIRED_DOMAINS = [
  'dom',
  'states',
  'slots',
  'parts',
  'tokens',
  'focus',
  'a11y',
  'performance',
  'rmt',
  'fabric',
  'compatibility',
  'docs',
  'tests'
];

const SHELL_DOM_MODES = ['shadow', 'light', 'hybrid'];

const SHELL_REQUIRED_STATES = [
  'empty',
  'loading',
  'ready',
  'error',
  'disabled',
  'busy',
  'invalid'
];

const SHELL_DEFAULT_SLOTS = [
  'default',
  'label',
  'helper',
  'error',
  'prefix',
  'suffix'
];

const SHELL_DEFAULT_PARTS = [
  'root',
  'control',
  'label',
  'content',
  'helper',
  'error',
  'icon'
];

const SHELL_FOCUS_STRATEGIES = [
  'none',
  'host',
  'delegates-focus',
  'managed-roving',
  'trap'
];

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function unique(values) {
  return Array.from(new Set(normalizeArray(values).filter(Boolean)));
}

function toBasename(tag) {
  return String(tag || 'x-example').replace(/-/g, '');
}

function normalizeSlot(slot) {
  if (typeof slot === 'string') {
    return {
      name: slot,
      required: slot === 'default',
      accepts: 'RmtTemplateRef | string | HTMLElement'
    };
  }
  return {
    name: slot.name,
    required: Boolean(slot.required),
    accepts: slot.accepts || 'RmtTemplateRef | string | HTMLElement'
  };
}

function normalizePart(part) {
  if (typeof part === 'string') {
    return {
      name: part,
      required: part === 'root',
      purpose: part === 'root' ? 'stable shell root' : 'stable styling entry point'
    };
  }
  return {
    name: part.name,
    required: Boolean(part.required),
    purpose: part.purpose || 'stable styling entry point'
  };
}

function normalizeToken(token) {
  if (typeof token === 'string') {
    return {
      name: token,
      defaultValue: 'inherit',
      category: 'component'
    };
  }
  return {
    name: token.name,
    defaultValue: token.defaultValue || 'inherit',
    category: token.category || 'component'
  };
}

function createComponentShellContract(input = {}, options = {}) {
  const tag = input.tag || 'x-example';
  const basename = input.basename || toBasename(tag);
  const domInput = input.dom || {};
  const focusInput = input.focus || {};
  const a11yInput = input.a11y || {};
  const performanceInput = input.performance || {};
  const slots = normalizeArray(input.slots).length > 0
    ? normalizeArray(input.slots).map(normalizeSlot)
    : SHELL_DEFAULT_SLOTS.map(normalizeSlot);
  const parts = normalizeArray(input.parts).length > 0
    ? normalizeArray(input.parts).map(normalizePart)
    : SHELL_DEFAULT_PARTS.map(normalizePart);
  const tokens = normalizeArray(input.tokens).length > 0
    ? normalizeArray(input.tokens).map(normalizeToken)
    : [
      `--xtend-${basename}-color`,
      `--xtend-${basename}-surface`,
      `--xtend-${basename}-radius`,
      `--xtend-${basename}-gap`,
      `--xtend-${basename}-motion-duration`
    ].map(normalizeToken);
  const states = unique(SHELL_REQUIRED_STATES.concat(normalizeArray(input.states)));

  return {
    schema: COMPONENT_SHELL_CONTRACT_SCHEMA,
    status: 'contract-draft',
    workpackage: COMPONENT_SHELL_WORKPACKAGE,
    componentContract: COMPONENT_CONTRACT_V2_SCHEMA,
    uxMaturityModel: UX_MATURITY_MODEL_SCHEMA,
    tag,
    dom: {
      mode: domInput.mode || input.domMode || 'shadow',
      delegatesFocus: Boolean(domInput.delegatesFocus),
      formAssociated: Boolean(domInput.formAssociated),
      rootPart: domInput.rootPart || 'root',
      attributeStatePrefix: domInput.attributeStatePrefix || 'data-xtend-state'
    },
    states,
    slots,
    parts,
    tokens,
    focus: {
      strategy: focusInput.strategy || 'host',
      visibleFocusRequired: focusInput.visibleFocusRequired !== false,
      keyboardRequired: focusInput.keyboardRequired !== false,
      restoreOnRouteChange: Boolean(focusInput.restoreOnRouteChange)
    },
    a11y: {
      schema: A11Y_COMPONENT_CONTRACT_SCHEMA,
      runtimeBehaviorRequired: true,
      requiredSignals: a11yInput.requiredSignals || ['role', 'name', 'state', 'keyboard', 'screenreader'],
      ariaOnlyWhenNativeSemanticsAreInsufficient: a11yInput.ariaOnlyWhenNativeSemanticsAreInsufficient !== false,
      reducedMotionSafe: a11yInput.reducedMotionSafe !== false,
      forcedColorsSafe: a11yInput.forcedColorsSafe !== false
    },
    performance: {
      schema: PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
      mountBudgetMs: performanceInput.mountBudgetMs || options.mountBudgetMs || 16,
      hydrateBudgetMs: performanceInput.hydrateBudgetMs || options.hydrateBudgetMs || 24,
      eventBudgetMs: performanceInput.eventBudgetMs || options.eventBudgetMs || 8,
      noLayoutThrashing: performanceInput.noLayoutThrashing !== false,
      cleanupRequired: performanceInput.cleanupRequired !== false
    },
    rmt: {
      schema: RMT_SHELL_AUTHORING_SCHEMA,
      adapter: 'xtend.component',
      templateMode: input.templateMode || 'dom_descriptor',
      fields: ['shell', 'style', 'a11y', 'commands', 'events', 'variants', 'density', 'hydration', 'schedule', 'fabric'],
      kernelBoundary: KERNEL_BOUNDARY
    },
    fabric: {
      schema: FABRIC_BOUNDARY_SCHEMA,
      api: '@xtend-fabric',
      laneIngestion: true,
      fiberHints: ['component.mount', 'component.hydrate', 'component.render', 'component.event'],
      errorBoundaryRequired: true
    },
    compatibility: {
      hostModes: ['xtend-only', 'rmt-first', 'vanilla', 'react', 'vue', 'custom-shell'],
      nativeCustomElementRequired: true,
      noGlobalMagicState: true,
      noRuntimeDependenciesAllowed: true
    },
    docs: {
      contract: COMPONENT_SHELL_CONTRACT_DOC,
      componentGuide: `docs/components/${tag.replace(/^x-/, '')}.md`,
      requiredSections: ['Shell', 'States', 'Slots', 'Parts', 'Focus', 'A11y', 'Performance', 'RMT Authoring']
    },
    tests: {
      requiredSuites: ['component-shell-contract', 'components', 'a11y-hydration', 'performance-regression', 'references'],
      fixtureRequired: true,
      browserSmokeRequiredForInteractiveShells: true
    }
  };
}

function validateComponentShellContract(contract = {}) {
  const errors = [];

  if (contract.schema !== COMPONENT_SHELL_CONTRACT_SCHEMA) {
    errors.push(`schema must be ${COMPONENT_SHELL_CONTRACT_SCHEMA}`);
  }
  if (!/^x-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(contract.tag || ''))) {
    errors.push('tag must be a valid XTend custom element tag');
  }

  SHELL_REQUIRED_DOMAINS.forEach((domain) => {
    if (!contract[domain]) {
      errors.push(`missing domain: ${domain}`);
    }
  });

  if (contract.dom && !SHELL_DOM_MODES.includes(contract.dom.mode)) {
    errors.push(`dom.mode must be one of: ${SHELL_DOM_MODES.join(', ')}`);
  }
  if (!Array.isArray(contract.states)) {
    errors.push('states must be an array');
  } else {
    SHELL_REQUIRED_STATES.forEach((state) => {
      if (!contract.states.includes(state)) {
        errors.push(`states must include ${state}`);
      }
    });
  }
  if (!Array.isArray(contract.slots) || !contract.slots.some((slot) => slot && slot.name === 'default')) {
    errors.push('slots must include a default slot');
  }
  if (!Array.isArray(contract.parts) || !contract.parts.some((part) => part && part.name === 'root')) {
    errors.push('parts must include a root part');
  }
  if (!Array.isArray(contract.tokens) || contract.tokens.length === 0) {
    errors.push('tokens must include at least one design token');
  }
  if (contract.focus && !SHELL_FOCUS_STRATEGIES.includes(contract.focus.strategy)) {
    errors.push(`focus.strategy must be one of: ${SHELL_FOCUS_STRATEGIES.join(', ')}`);
  }
  if (contract.focus && contract.focus.visibleFocusRequired !== true) {
    errors.push('focus.visibleFocusRequired must be true');
  }
  if (contract.a11y && contract.a11y.runtimeBehaviorRequired !== true) {
    errors.push('a11y.runtimeBehaviorRequired must be true');
  }
  if (contract.performance) {
    ['mountBudgetMs', 'hydrateBudgetMs', 'eventBudgetMs'].forEach((field) => {
      if (typeof contract.performance[field] !== 'number' || contract.performance[field] <= 0) {
        errors.push(`performance.${field} must be a positive number`);
      }
    });
  }
  if (contract.rmt && contract.rmt.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('rmt.kernelBoundary must keep the RMT kernel decoupled from XTend types');
  }
  if (contract.fabric && contract.fabric.api !== '@xtend-fabric') {
    errors.push('fabric.api must be @xtend-fabric');
  }
  if (contract.compatibility && !normalizeArray(contract.compatibility.hostModes).includes('rmt-first')) {
    errors.push('compatibility.hostModes must include rmt-first');
  }

  return {
    schema: COMPONENT_SHELL_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  COMPONENT_SHELL_CONTRACT_SCHEMA,
  COMPONENT_SHELL_REPORT_SCHEMA,
  COMPONENT_SHELL_WORKPACKAGE,
  COMPONENT_SHELL_CONTRACT_DOC,
  COMPONENT_CONTRACT_V2_SCHEMA,
  UX_MATURITY_MODEL_SCHEMA,
  RMT_SHELL_AUTHORING_SCHEMA,
  FABRIC_BOUNDARY_SCHEMA,
  A11Y_COMPONENT_CONTRACT_SCHEMA,
  PERFORMANCE_COMPONENT_PROFILE_SCHEMA,
  KERNEL_BOUNDARY,
  SHELL_REQUIRED_DOMAINS,
  SHELL_DOM_MODES,
  SHELL_REQUIRED_STATES,
  SHELL_DEFAULT_SLOTS,
  SHELL_DEFAULT_PARTS,
  SHELL_FOCUS_STRATEGIES,
  createComponentShellContract,
  validateComponentShellContract
};
