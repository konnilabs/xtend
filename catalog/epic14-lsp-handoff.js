const EPIC14_LSP_HANDOFF_SCHEMA = 'xtend.epic14.lsp-handoff.v1';
const EPIC14_LSP_HANDOFF_REPORT_SCHEMA = 'xtend.epic14.lsp-handoff-report.v1';
const EPIC14_LSP_HANDOFF_WORKPACKAGE = 'WP-E14-16';
const EPIC14_LSP_HANDOFF_STATUS = 'accepted-epic14-closure';
const EPIC14_LSP_HANDOFF_MODULE = 'catalog/epic14-lsp-handoff.js';
const EPIC14_LSP_HANDOFF_CONTRACT = 'development/XTendRMT-Epic14-Abschluss-und-LSP-Handoff.md';
const EPIC14_LSP_HANDOFF_WORKPACKAGE_DOC = 'development/WP-E14-16-Epic-Abschlussreview-und-Upstream-Handoff-erstellen.md';
const EPIC14_LSP_HANDOFF_DOCS = 'docs/rmt-language-server.md';
const EPIC14_LSP_HANDOFF_SUITE = 'tests/platform/epic14_lsp_handoff_suite.js';
const EPIC14_LSP_HANDOFF_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic14-lsp-handoff --json';
const EPIC14_LSP_HANDOFF_PACKAGE_SCRIPT = 'npm run test:epic14-lsp-handoff';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const CAPABILITY_MATRIX = Object.freeze([
  {
    id: 'diagnostics',
    protocol: 'textDocument/publishDiagnostics',
    status: 'implemented',
    source: 'xtend.rmt.linter.rule-engine.v1',
    gate: 'rmt-linter-rules'
  },
  {
    id: 'completion',
    protocol: 'textDocument/completion',
    status: 'implemented',
    source: 'xtend.rmt.completion-provider.v1',
    gate: 'rmt-completions'
  },
  {
    id: 'hover',
    protocol: 'textDocument/hover',
    status: 'implemented',
    source: 'xtend.rmt.hover-provider.v1',
    gate: 'rmt-navigation'
  },
  {
    id: 'documentSymbols',
    protocol: 'textDocument/documentSymbol',
    status: 'implemented',
    source: 'xtend.rmt.document-symbols-provider.v1',
    gate: 'rmt-navigation'
  },
  {
    id: 'definition',
    protocol: 'textDocument/definition',
    status: 'implemented',
    source: 'xtend.rmt.definition-provider.v1',
    gate: 'rmt-navigation'
  },
  {
    id: 'codeActions',
    protocol: 'textDocument/codeAction',
    status: 'implemented',
    source: 'xtend.rmt.code-action-provider.v1',
    gate: 'rmt-code-actions'
  },
  {
    id: 'agentRepairReport',
    protocol: 'cli-agent-report',
    status: 'implemented',
    source: 'xtend.rmt.ai-agent-repair-report.v1',
    gate: 'rmt-agent-report'
  },
  {
    id: 'snippets',
    protocol: 'editor-packaging',
    status: 'implemented',
    source: 'xtend.rmt.snippet-catalog.v1',
    gate: 'rmt-editor-packaging'
  },
  {
    id: 'workspaceSymbols',
    protocol: 'workspace/symbol',
    status: 'planned',
    source: 'project-index-follow-up',
    gate: 'future'
  },
  {
    id: 'rename',
    protocol: 'textDocument/rename',
    status: 'planned',
    source: 'safe-refactor-follow-up',
    gate: 'future'
  },
  {
    id: 'references',
    protocol: 'textDocument/references',
    status: 'planned',
    source: 'project-index-follow-up',
    gate: 'future'
  },
  {
    id: 'semanticTokens',
    protocol: 'textDocument/semanticTokens',
    status: 'planned',
    source: 'syntax-highlighting-follow-up',
    gate: 'future'
  },
  {
    id: 'formatting',
    protocol: 'textDocument/formatting',
    status: 'planned',
    source: 'formatter-follow-up',
    gate: 'future'
  }
]);

const KNOWN_LIMITATIONS = Object.freeze([
  {
    id: 'json-based-dsl',
    status: 'accepted-for-mvp',
    followUp: 'friendlier-rmt-syntax',
    note: 'RMT bleibt vorerst JSON-basiert; eine lesbarere DSL-Syntax wird als Folge-Epic geplant.'
  },
  {
    id: 'formatter-not-released',
    status: 'planned',
    followUp: 'rmt-formatter',
    note: 'Formatierung ist vorbereitet, aber nicht produktiv freigegeben.'
  },
  {
    id: 'file-local-index',
    status: 'accepted-for-mvp',
    followUp: 'workspace-project-index',
    note: 'Der MVP indexiert einzelne Dokumente stabil; projektweite Symbolsuche folgt separat.'
  },
  {
    id: 'editor-marketplace-packaging',
    status: 'planned',
    followUp: 'editor-marketplace-packaging',
    note: 'VS-Code-Bridge und generische LSP-Setups sind vorhanden; Marketplace-Publishing ist nicht Teil von Epic 14.'
  },
  {
    id: 'no-runtime-execution',
    status: 'intentional-boundary',
    followUp: 'none',
    note: 'Tooling fuehrt keine XTend-Komponenten aus und startet keinen XRouter.'
  },
  {
    id: 'legacy-rmt-json-fallback',
    status: 'warning-only',
    followUp: 'migration-assist',
    note: '.rmt.json bleibt lesbar, wird aber per Linter als Fallback markiert.'
  }
]);

const FOLLOW_UP_EPIC_CANDIDATES = Object.freeze([
  {
    id: 'rmt-dsl-syntax-and-formatter',
    title: 'RMT DSL Syntax, Formatter und Writer API',
    goal: 'RMT von JSON-kompatiblem Authoring zu einer lesbareren DSL mit stabiler Formatierung weiterentwickeln.'
  },
  {
    id: 'rmt-project-index-and-refactors',
    title: 'RMT Project Index, Rename und References',
    goal: 'Workspace-weite Navigation, Rename, References und Symbolsuche aufbauen.'
  },
  {
    id: 'rmt-editor-packages',
    title: 'Editor Packages und Marketplace Distribution',
    goal: 'VS Code, JetBrains, Neovim und Helix Packaging von der generischen LSP-Anbindung in installierbare Pakete ueberfuehren.'
  }
]);

function summarizeCapabilities(capabilities) {
  return capabilities.reduce((summary, capability) => {
    summary.byStatus[capability.status] = (summary.byStatus[capability.status] || 0) + 1;
    return summary;
  }, {
    count: capabilities.length,
    byStatus: {}
  });
}

function createEpic14LspHandoffPlan(options = {}) {
  const capabilities = (options.capabilities || CAPABILITY_MATRIX).map((capability) => ({ ...capability }));
  const limitations = (options.limitations || KNOWN_LIMITATIONS).map((limitation) => ({ ...limitation }));
  const followUps = (options.followUps || FOLLOW_UP_EPIC_CANDIDATES).map((entry) => ({ ...entry }));

  return {
    schema: EPIC14_LSP_HANDOFF_SCHEMA,
    reportSchema: EPIC14_LSP_HANDOFF_REPORT_SCHEMA,
    workpackage: EPIC14_LSP_HANDOFF_WORKPACKAGE,
    status: EPIC14_LSP_HANDOFF_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC14_LSP_HANDOFF_MODULE,
    contract: EPIC14_LSP_HANDOFF_CONTRACT,
    workpackageDocument: EPIC14_LSP_HANDOFF_WORKPACKAGE_DOC,
    docs: EPIC14_LSP_HANDOFF_DOCS,
    suite: EPIC14_LSP_HANDOFF_SUITE,
    localGate: EPIC14_LSP_HANDOFF_LOCAL_GATE,
    packageScript: EPIC14_LSP_HANDOFF_PACKAGE_SCRIPT,
    toolingGate: 'npm run test:rmt-tooling',
    releaseGate: 'npm run test:release:full:report',
    completionState: 'rmt-authoring-tooling-ready',
    acceptedContracts: [
      'xtend.rmt.source-model.v1',
      'xtend.rmt.parser.v1',
      'xtend.rmt.format-adapter.v1',
      'xtend.rmt.semantic-graph.v1',
      'xtend.rmt.linter.rule-engine.v1',
      'xtend.rmt.linter.cli.v1',
      'xtend.rmt.completion-provider.v1',
      'xtend.rmt.navigation-provider.v1',
      'xtend.rmt.language-server.v1',
      'xtend.rmt.code-action-provider.v1',
      'xtend.rmt.ai-agent-repair-report.v1',
      'xtend.rmt.editor-packaging.v1',
      'xtend.rmt.language-regression.v1',
      'xtend.rmt.tooling-docs.v1',
      'xtend.epic14.rmt-tooling.v1'
    ],
    capabilities,
    knownLimitations: limitations,
    followUpEpicCandidates: followUps,
    summary: {
      capabilities: summarizeCapabilities(capabilities),
      knownLimitations: limitations.length,
      followUpEpicCandidates: followUps.length
    },
    kernelBoundary: KERNEL_BOUNDARY,
    networkRequired: false,
    handoffTo: 'next-rmt-dsl-syntax-formatter-project-index-epic'
  };
}

function validateEpic14LspHandoffPlan(plan) {
  const failures = [];
  const capabilityIds = new Set((plan && plan.capabilities || []).map((capability) => capability.id));
  const limitationIds = new Set((plan && plan.knownLimitations || []).map((limitation) => limitation.id));

  if (!plan || plan.schema !== EPIC14_LSP_HANDOFF_SCHEMA) {
    failures.push('schema');
  }
  if (plan && plan.workpackage !== EPIC14_LSP_HANDOFF_WORKPACKAGE) {
    failures.push('workpackage');
  }
  if (plan && plan.status !== EPIC14_LSP_HANDOFF_STATUS) {
    failures.push('status');
  }
  if (plan && plan.kernelBoundary !== KERNEL_BOUNDARY) {
    failures.push('kernelBoundary');
  }
  if (!plan || plan.networkRequired !== false) {
    failures.push('networkRequired');
  }
  ['diagnostics', 'completion', 'hover', 'documentSymbols', 'definition', 'codeActions', 'agentRepairReport', 'snippets'].forEach((capability) => {
    if (!capabilityIds.has(capability)) {
      failures.push(`capability:${capability}`);
    }
  });
  ['workspaceSymbols', 'rename', 'references', 'semanticTokens', 'formatting'].forEach((capability) => {
    const entry = (plan && plan.capabilities || []).find((candidate) => candidate.id === capability);
    if (!entry || entry.status !== 'planned') {
      failures.push(`plannedCapability:${capability}`);
    }
  });
  ['json-based-dsl', 'formatter-not-released', 'file-local-index', 'editor-marketplace-packaging', 'no-runtime-execution'].forEach((limitation) => {
    if (!limitationIds.has(limitation)) {
      failures.push(`limitation:${limitation}`);
    }
  });
  if (!plan || !Array.isArray(plan.followUpEpicCandidates) || plan.followUpEpicCandidates.length < 2) {
    failures.push('followUpEpicCandidates');
  }

  return {
    schema: EPIC14_LSP_HANDOFF_REPORT_SCHEMA,
    ok: failures.length === 0,
    failures
  };
}

function createEpic14LspHandoffReport(options = {}) {
  const plan = options.plan || createEpic14LspHandoffPlan(options);
  const validation = validateEpic14LspHandoffPlan(plan);

  return {
    schema: EPIC14_LSP_HANDOFF_REPORT_SCHEMA,
    ok: validation.ok,
    workpackage: EPIC14_LSP_HANDOFF_WORKPACKAGE,
    status: validation.ok ? 'passed' : 'failed',
    localGate: EPIC14_LSP_HANDOFF_LOCAL_GATE,
    completionState: plan.completionState,
    implementedCapabilities: plan.capabilities.filter((capability) => capability.status === 'implemented').map((capability) => capability.id),
    plannedCapabilities: plan.capabilities.filter((capability) => capability.status === 'planned').map((capability) => capability.id),
    knownLimitations: plan.knownLimitations.map((limitation) => limitation.id),
    followUpEpicCandidates: plan.followUpEpicCandidates.map((entry) => entry.id),
    failures: validation.failures
  };
}

module.exports = {
  CAPABILITY_MATRIX,
  EPIC14_LSP_HANDOFF_CONTRACT,
  EPIC14_LSP_HANDOFF_DOCS,
  EPIC14_LSP_HANDOFF_LOCAL_GATE,
  EPIC14_LSP_HANDOFF_MODULE,
  EPIC14_LSP_HANDOFF_PACKAGE_SCRIPT,
  EPIC14_LSP_HANDOFF_REPORT_SCHEMA,
  EPIC14_LSP_HANDOFF_SCHEMA,
  EPIC14_LSP_HANDOFF_STATUS,
  EPIC14_LSP_HANDOFF_SUITE,
  EPIC14_LSP_HANDOFF_WORKPACKAGE,
  EPIC14_LSP_HANDOFF_WORKPACKAGE_DOC,
  FOLLOW_UP_EPIC_CANDIDATES,
  KERNEL_BOUNDARY,
  KNOWN_LIMITATIONS,
  createEpic14LspHandoffPlan,
  createEpic14LspHandoffReport,
  validateEpic14LspHandoffPlan
};
