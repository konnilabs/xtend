const {
  createComponentCatalogCoverageReport
} = require('./component-catalog-coverage');
const {
  createComponentRegressionPriorityPlan
} = require('./component-regression-priority');

const COMPONENT_LONG_TAIL_MIGRATION_SCHEMA = 'xtend.epic11.legacy-long-tail-migration.v1';
const COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA = 'xtend.epic11.legacy-long-tail-migration-entry.v1';
const COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA = 'xtend.epic11.legacy-long-tail-migration-gate.v1';

const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const WAVE_DEFINITIONS = Object.freeze({
  'wave-1-p0-routing-interaction': {
    label: 'P0 routing and interaction closure',
    goal: 'P0 controls reach ux-stable without broad runtime rewrites.',
    components: ['x-tabs']
  },
  'wave-2-p1-theme-and-interaction': {
    label: 'P1 theme and interaction hardening',
    goal: 'P1 interactive and theme primitives receive explicit A11y and performance profiles.',
    components: ['x-theme', 'x-button', 'x-menu']
  },
  'wave-3-infrastructure-and-utility-probes': {
    label: 'Infrastructure and utility boundary probes',
    goal: 'Non-visual helper surfaces get suites, types and adapter-boundary probes instead of forced visual shells.',
    components: ['xstate', 'x-utils']
  }
});

const REQUIRED_SOURCE_GATES = Object.freeze([
  'catalog-coverage',
  'regression-priority',
  'component-ux-authoring-docs',
  'component-ux-browser-smokes',
  'component-shell-theme-matrix',
  'references'
]);

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function sortMigrationEntries(entries) {
  const waveOrder = Object.keys(WAVE_DEFINITIONS);
  const priorityOrder = { P0: 0, P1: 1, P2: 2 };
  return entries.slice().sort((left, right) => {
    const waveDiff = waveOrder.indexOf(left.wave) - waveOrder.indexOf(right.wave);
    if (waveDiff !== 0) return waveDiff;
    const priorityDiff = (priorityOrder[left.priority] || 99) - (priorityOrder[right.priority] || 99);
    if (priorityDiff !== 0) return priorityDiff;
    return left.tag.localeCompare(right.tag);
  });
}

function resolveWave(tag) {
  return Object.entries(WAVE_DEFINITIONS).find(([, definition]) => definition.components.includes(tag))?.[0]
    || 'wave-3-infrastructure-and-utility-probes';
}

function resolveMissingDimensions(coverage) {
  return Object.entries(coverage || {})
    .filter(([, covered]) => covered !== true)
    .map(([dimension]) => dimension);
}

function resolveTargetMaturity(entry) {
  if ((entry.profiles || []).includes('infrastructure') || (entry.profiles || []).includes('utility')) {
    return 'ux-baseline-probe';
  }
  if (entry.priority === 'P0') return 'ux-stable';
  if (entry.priority === 'P1') return 'ux-ready';
  return entry.customElement === false ? 'ux-baseline-probe' : 'ux-ready';
}

function resolveMigrationKind(entry, missingDimensions) {
  if (entry.customElement === false) {
    return 'adapter-boundary-probe';
  }
  if (missingDimensions.length === 1 && missingDimensions.includes('performance')) {
    return 'profile-completion';
  }
  return 'component-hardening';
}

function resolveRequiredActions(entry, missingDimensions) {
  const actions = [];
  if (missingDimensions.includes('componentSuite')) actions.push('component-suite-authoring');
  if (missingDimensions.includes('fixture')) actions.push('fixture-authoring');
  if (missingDimensions.includes('types')) actions.push('public-types-authoring');
  if (missingDimensions.includes('a11y')) actions.push('runtime-a11y-profile');
  if (missingDimensions.includes('performance')) actions.push('performance-profile');
  if (entry.customElement === false) actions.push('non-custom-element-integration-probe');
  if (entry.customElement === true) actions.push('browser-smoke-and-theme-matrix-coverage');
  return unique(actions);
}

function resolveRequiredGates(entry, migrationKind) {
  const gates = [
    'node scripts/run_xtend_tests.js catalog-coverage --json',
    'node scripts/run_xtend_tests.js regression-priority --json',
    'node scripts/run_xtend_tests.js references --json'
  ];
  if (migrationKind !== 'adapter-boundary-probe') {
    gates.push('node scripts/run_xtend_tests.js component-ux-browser-smokes --json');
    gates.push('node scripts/run_xtend_tests.js component-shell-theme-matrix --json');
  }
  if (entry.priority === 'P0') {
    gates.push('node scripts/run_xtend_tests.js browser --json');
  }
  return unique(gates);
}

function createMigrationEntry(catalogEntry, regressionEntry) {
  const missingDimensions = resolveMissingDimensions(catalogEntry.coverage);
  const wave = resolveWave(catalogEntry.tag);
  const migrationKind = resolveMigrationKind(catalogEntry, missingDimensions);
  return {
    schema: COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA,
    tag: catalogEntry.tag,
    status: catalogEntry.status,
    priority: catalogEntry.priority,
    profiles: catalogEntry.profiles.slice(),
    wave,
    waveLabel: WAVE_DEFINITIONS[wave].label,
    targetMaturity: resolveTargetMaturity(catalogEntry),
    migrationKind,
    customElement: catalogEntry.customElement,
    missingDimensions,
    requiredActions: resolveRequiredActions(catalogEntry, missingDimensions),
    regressionTier: regressionEntry ? regressionEntry.tier : 'unclassified',
    browserSmokes: regressionEntry ? regressionEntry.browserSmokes.slice() : [],
    visualStates: regressionEntry ? regressionEntry.visualStates.slice() : [],
    requiredGates: resolveRequiredGates(catalogEntry, migrationKind),
    kernelBoundary: KERNEL_BOUNDARY
  };
}

function summarizeMigrationEntries(entries) {
  return entries.reduce((summary, entry) => {
    summary.byWave[entry.wave] = (summary.byWave[entry.wave] || 0) + 1;
    summary.byMigrationKind[entry.migrationKind] = (summary.byMigrationKind[entry.migrationKind] || 0) + 1;
    summary.byTargetMaturity[entry.targetMaturity] = (summary.byTargetMaturity[entry.targetMaturity] || 0) + 1;
    entry.missingDimensions.forEach((dimension) => {
      summary.missingByDimension[dimension] = summary.missingByDimension[dimension] || [];
      summary.missingByDimension[dimension].push(entry.tag);
    });
    if (entry.customElement) {
      summary.customElementCount += 1;
    } else {
      summary.boundaryProbeCount += 1;
    }
    return summary;
  }, {
    componentCount: entries.length,
    byWave: {},
    byMigrationKind: {},
    byTargetMaturity: {},
    missingByDimension: {},
    customElementCount: 0,
    boundaryProbeCount: 0
  });
}

function createComponentLongTailMigrationPlan(options = {}) {
  const coverageReport = options.coverageReport || createComponentCatalogCoverageReport(options);
  const regressionPlan = options.regressionPlan || createComponentRegressionPriorityPlan({
    rootDir: options.rootDir,
    coverageReport
  });
  const regressionByTag = new Map(regressionPlan.entries.map((entry) => [entry.tag, entry]));
  const entries = sortMigrationEntries(
    coverageReport.entries
      .filter((entry) => entry.status !== 'enterprise-ready')
      .map((entry) => createMigrationEntry(entry, regressionByTag.get(entry.tag)))
  );
  const waves = Object.entries(WAVE_DEFINITIONS).map(([id, definition]) => ({
    id,
    label: definition.label,
    goal: definition.goal,
    components: definition.components.slice()
  }));

  return {
    schema: COMPONENT_LONG_TAIL_MIGRATION_SCHEMA,
    entrySchema: COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA,
    gateSchema: COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA,
    generatedAt: options.generatedAt || 'static-local',
    workpackage: 'WP-E11-17',
    status: 'accepted-migration-plan',
    sourceSchemas: [
      coverageReport.schema,
      regressionPlan.schema,
      'xtend.epic11.component-ux-authoring-docs.v1',
      'xtend.epic11.component-ux-browser-smokes.v1',
      'xtend.epic11.component-shell-theme-matrix.v1'
    ],
    strategy: 'incremental-no-big-bang',
    kernelBoundary: KERNEL_BOUNDARY,
    gates: {
      local: 'node scripts/run_xtend_tests.js component-long-tail-migration --json',
      packageScript: 'npm run test:component-long-tail-migration',
      source: REQUIRED_SOURCE_GATES.slice()
    },
    waves,
    entries,
    summary: summarizeMigrationEntries(entries),
    handoff: {
      nextWorkpackage: 'WP-E11-18',
      nextTitle: 'Epic-11-Abschlussreview und Enterprise UX Handoff',
      releaseReadinessGate: 'npm test'
    }
  };
}

function validateComponentLongTailMigrationPlan(plan) {
  const errors = [];
  if (!plan || plan.schema !== COMPONENT_LONG_TAIL_MIGRATION_SCHEMA) {
    errors.push('plan schema must be xtend.epic11.legacy-long-tail-migration.v1');
  }
  if (!plan || plan.entrySchema !== COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA) {
    errors.push('entry schema must be xtend.epic11.legacy-long-tail-migration-entry.v1');
  }
  if (!plan || !Array.isArray(plan.entries) || plan.entries.length === 0) {
    errors.push('plan entries must be a non-empty array');
  }
  if (!plan || plan.strategy !== 'incremental-no-big-bang') {
    errors.push('migration strategy must avoid a big-bang rewrite');
  }
  if (!plan || plan.kernelBoundary !== KERNEL_BOUNDARY) {
    errors.push('RMT kernel boundary must stay visible');
  }

  (plan && plan.entries || []).forEach((entry) => {
    if (entry.schema !== COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA) {
      errors.push(`${entry.tag || '<unknown>'}: entry schema must match`);
    }
    if (!entry.tag || entry.status === 'enterprise-ready') {
      errors.push(`${entry.tag || '<unknown>'}: only non-enterprise-ready entries are part of the long-tail plan`);
    }
    if (!Array.isArray(entry.missingDimensions) || entry.missingDimensions.length === 0) {
      errors.push(`${entry.tag}: missing dimensions must be explicit`);
    }
    if (!Array.isArray(entry.requiredActions) || entry.requiredActions.length === 0) {
      errors.push(`${entry.tag}: required actions must be explicit`);
    }
    if (!Array.isArray(entry.requiredGates) || !entry.requiredGates.some((gate) => gate.includes('catalog-coverage'))) {
      errors.push(`${entry.tag}: catalog-coverage gate must remain required`);
    }
    if (entry.customElement === false && !entry.requiredActions.includes('non-custom-element-integration-probe')) {
      errors.push(`${entry.tag}: non-custom elements require an integration probe`);
    }
    if (entry.priority === 'P0' && entry.targetMaturity !== 'ux-stable') {
      errors.push(`${entry.tag}: P0 long-tail entries must target ux-stable`);
    }
  });

  return {
    schema: COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createMarkdownMatrix(plan) {
  const rows = [
    '| Tag | Wave | Current | Target | Missing | Actions |',
    '|-----|------|---------|--------|---------|---------|'
  ];
  plan.entries.forEach((entry) => {
    rows.push([
      `| \`${entry.tag}\``,
      `\`${entry.wave}\``,
      `\`${entry.status}\``,
      `\`${entry.targetMaturity}\``,
      `\`${entry.missingDimensions.join(', ')}\``,
      `\`${entry.requiredActions.join(', ')}\` |`
    ].join(' | '));
  });
  return rows.join('\n');
}

function createComponentLongTailMigrationGate(options = {}) {
  const plan = createComponentLongTailMigrationPlan(options);
  const validation = validateComponentLongTailMigrationPlan(plan);
  return {
    schema: COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA,
    ok: validation.ok,
    plan,
    errors: validation.errors,
    warnings: []
  };
}

module.exports = {
  COMPONENT_LONG_TAIL_MIGRATION_SCHEMA,
  COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA,
  COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA,
  KERNEL_BOUNDARY,
  createComponentLongTailMigrationGate,
  createComponentLongTailMigrationPlan,
  createMarkdownMatrix,
  validateComponentLongTailMigrationPlan
};
