'use strict';

const {
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  assertNoFrameworkDependencies
} = require('./host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_KERNEL_SIGNAL_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('./signal-bridge-contract');
const {
  XTENSIONS_MARACA_ARTIFACT_SCHEMA,
  XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA,
  XTENSIONS_MARACA_CONTRACT_SNAPSHOT_SCHEMA,
  XTENSIONS_MARACA_MANIFEST_SCHEMA,
  normalizeXTensionManifest,
  sha256Value
} = require('./maraca-xtension-manifest');

const XTENSIONS_STATIC_INTROSPECTION_SCHEMA = 'xtend.xtensions.static-introspection.v1';
const XTENSIONS_STATIC_CONTRACT_SCHEMA = 'xtend.xtensions.static-contract.v1';
const XTENSIONS_STATIC_CONTRACT_SOURCE_SCHEMA = 'xtend.xtensions.static-contract-source.v1';
const XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA = 'xtend.xtensions.static-contract-index.v1';
const XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA = 'xtend.xtensions.static-contract-drift-report.v1';
const XTENSIONS_STATIC_LSP_INDEX_SCHEMA = 'xtend.xtensions.static-contract-lsp-index.v1';
const XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA = 'xtend.xtensions.static-contract-devtools-panel.v1';
const XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA = 'xtend.xtensions.static-contract-ai-agent-report.v1';
const XTENSIONS_STATIC_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.static-contract-diagnostic.v1';
const XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA = 'xtend.xtensions.static-introspection-report.v1';
const XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH = 'tools/xtensions/static-contract-introspection.js';
const XTENSIONS_STATIC_INTROSPECTION_TYPES_PATH = 'tools/xtensions/static-contract-introspection.d.ts';
const XTENSIONS_STATIC_INTROSPECTION_SUITE_PATH = 'tests/xtensions/xtensions_static_introspection_suite.js';
const XTENSIONS_STATIC_INTROSPECTION_CONTRACT_PATH = 'development/XTensions-Static-Contract-Introspection-Contract.md';
const XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH = 'tests/fixtures/xtensions/static-introspection-valid.json';
const XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH = 'tests/fixtures/xtensions/static-introspection-module.mjs';
const XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH = 'tests/fixtures/xtensions/static-introspection-drift-module.mjs';
const XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH = 'tests/fixtures/xtensions/static-introspection-no-export.mjs';
const XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE = 'XTN-04';
const XTENSIONS_STATIC_INTROSPECTION_PACKAGE_SCRIPT = 'npm run test:xtensions-static-introspection';
const XTENSION_CONTRACT_EXPORT_NAME = 'XTENSION_CONTRACT';

const STATIC_CONTRACT_EXPORT_MISSING_CODE = 'xtensions.static_introspection.static_export_missing';
const STATIC_CONTRACT_PARSE_FAILED_CODE = 'xtensions.static_introspection.static_export_parse_failed';
const STATIC_CONTRACT_ACCEPTS_MISSING_CODE = 'xtensions.static_introspection.accepts_missing';
const STATIC_CONTRACT_EMITS_MISSING_CODE = 'xtensions.static_introspection.emits_missing';
const STATIC_CONTRACT_CAPABILITY_MISSING_CODE = 'xtensions.static_introspection.capability_missing';
const STATIC_CONTRACT_SCHEMA_MISSING_CODE = 'xtensions.static_introspection.schema_missing';
const STATIC_CONTRACT_RUNTIME_EXECUTION_FORBIDDEN_CODE = 'xtensions.static_introspection.runtime_execution_forbidden';
const STATIC_CONTRACT_DRIFT_DETECTED_CODE = 'xtensions.static_introspection.contract_drift_detected';
const STATIC_CONTRACT_FRAMEWORK_DEPENDENCY_CODE = 'xtensions.static_introspection.framework_dependency';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function createStaticDiagnostic(subject, code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_STATIC_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_STATIC_INTROSPECTION_SCHEMA,
    workpackage: XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE,
    severity,
    code,
    message,
    xtensionId: subject && (subject.id || subject.xtensionId) || null,
    framework: subject && subject.framework || null,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function fingerprintContractShape(contract = {}) {
  return sha256Value({
    schema: contract.schema,
    id: contract.id,
    framework: contract.framework,
    version: contract.version,
    hostControllerSchema: contract.hostControllerSchema,
    signalBridgeSchema: contract.signalBridgeSchema,
    accepts: contract.accepts || [],
    emits: contract.emits || [],
    capabilities: contract.capabilities || []
  });
}

function normalizeStaticXTensionContract(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const contract = source.contractSnapshot && source.schema === XTENSIONS_MARACA_MANIFEST_SCHEMA
    ? {
      id: source.id,
      framework: source.framework,
      version: source.version,
      ...source.contractSnapshot
    }
    : source;
  const result = {
    schema: normalizeString(contract.schema || XTENSIONS_STATIC_CONTRACT_SCHEMA),
    id: normalizeString(contract.id || contract.xtensionId),
    name: normalizeString(contract.name || contract.id || contract.xtensionId),
    framework: normalizeString(contract.framework),
    version: normalizeString(contract.version),
    hostControllerSchema: normalizeString(contract.hostControllerSchema || XTENSIONS_HOST_CONTROLLER_SCHEMA),
    signalBridgeSchema: normalizeString(contract.signalBridgeSchema || XTENSIONS_SIGNAL_BRIDGE_SCHEMA),
    kernelSignalSchema: normalizeString(contract.kernelSignalSchema || XTENSIONS_KERNEL_SIGNAL_SCHEMA),
    surfaceEventSchema: normalizeString(contract.surfaceEventSchema || XTENSIONS_SURFACE_EVENT_SCHEMA),
    accepts: toArray(contract.accepts).map(normalizeString).filter(Boolean),
    emits: toArray(contract.emits).map(normalizeString).filter(Boolean),
    capabilities: toArray(contract.capabilities).map(normalizeString).filter(Boolean),
    source: {
      schema: XTENSIONS_STATIC_CONTRACT_SOURCE_SCHEMA,
      kind: normalizeString(options.sourceKind || contract.sourceKind || 'static-export'),
      path: normalizeString(options.sourcePath || contract.sourcePath || ''),
      exportName: normalizeString(options.exportName || contract.exportName || XTENSION_CONTRACT_EXPORT_NAME),
      runtimeExecutionRequired: false
    },
    manifestFingerprint: normalizeString(contract.manifestFingerprint || ''),
    artifactFingerprint: normalizeString(contract.artifactFingerprint || ''),
    sourceFingerprint: normalizeString(contract.sourceFingerprint || ''),
    diagnostics: []
  };

  if (result.schema !== XTENSIONS_STATIC_CONTRACT_SCHEMA) {
    result.diagnostics.push(createStaticDiagnostic(
      result,
      STATIC_CONTRACT_SCHEMA_MISSING_CODE,
      `Static XTension contract must use schema "${XTENSIONS_STATIC_CONTRACT_SCHEMA}".`,
      'error',
      { field: 'schema' }
    ));
  }

  if (result.accepts.length === 0) {
    result.diagnostics.push(createStaticDiagnostic(
      result,
      STATIC_CONTRACT_ACCEPTS_MISSING_CODE,
      'Static XTension contract must declare accepts.',
      'error',
      { field: 'accepts' }
    ));
  }

  if (result.emits.length === 0) {
    result.diagnostics.push(createStaticDiagnostic(
      result,
      STATIC_CONTRACT_EMITS_MISSING_CODE,
      'Static XTension contract must declare emits.',
      'error',
      { field: 'emits' }
    ));
  }

  if (result.capabilities.length === 0) {
    result.diagnostics.push(createStaticDiagnostic(
      result,
      STATIC_CONTRACT_CAPABILITY_MISSING_CODE,
      'Static XTension contract must declare capabilities.',
      'error',
      { field: 'capabilities' }
    ));
  }

  if (result.source.runtimeExecutionRequired !== false) {
    result.diagnostics.push(createStaticDiagnostic(
      result,
      STATIC_CONTRACT_RUNTIME_EXECUTION_FORBIDDEN_CODE,
      'Static XTension introspection must not require runtime execution.',
      'error',
      { field: 'source.runtimeExecutionRequired' }
    ));
  }

  result.ok = result.diagnostics.every((diagnostic) => diagnostic.severity !== 'error');
  result.status = result.ok ? 'ready' : 'blocked';
  result.contractFingerprint = fingerprintContractShape(result);
  return result;
}

function findBalancedJsonObject(sourceText, startIndex) {
  const start = sourceText.indexOf('{', startIndex);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return sourceText.slice(start, index + 1);
    }
  }

  return null;
}

function extractXTensionContractFromSource(sourceText = '', options = {}) {
  const source = String(sourceText || '');
  const markerIndex = source.indexOf(XTENSION_CONTRACT_EXPORT_NAME);
  const sourcePath = normalizeString(options.sourcePath || '');
  const base = {
    schema: XTENSIONS_STATIC_CONTRACT_SOURCE_SCHEMA,
    exportName: XTENSION_CONTRACT_EXPORT_NAME,
    sourcePath,
    runtimeExecutionRequired: false,
    sourceFingerprint: sha256Value(source),
    diagnostics: []
  };

  if (markerIndex < 0) {
    const diagnostic = createStaticDiagnostic(
      { id: options.xtensionId || null },
      STATIC_CONTRACT_EXPORT_MISSING_CODE,
      `Static source must export ${XTENSION_CONTRACT_EXPORT_NAME}.`,
      'error',
      { field: XTENSION_CONTRACT_EXPORT_NAME, sourcePath }
    );
    return {
      ...base,
      ok: false,
      status: 'blocked',
      contract: null,
      diagnostics: [diagnostic]
    };
  }

  const objectText = findBalancedJsonObject(source, markerIndex);
  if (!objectText) {
    const diagnostic = createStaticDiagnostic(
      { id: options.xtensionId || null },
      STATIC_CONTRACT_PARSE_FAILED_CODE,
      `${XTENSION_CONTRACT_EXPORT_NAME} must be a JSON-compatible object literal.`,
      'error',
      { field: XTENSION_CONTRACT_EXPORT_NAME, sourcePath }
    );
    return {
      ...base,
      ok: false,
      status: 'blocked',
      contract: null,
      diagnostics: [diagnostic]
    };
  }

  try {
    const parsed = JSON.parse(objectText);
    const contract = normalizeStaticXTensionContract({
      ...parsed,
      sourcePath,
      sourceFingerprint: base.sourceFingerprint
    }, {
      sourceKind: 'module-static-export',
      sourcePath,
      exportName: XTENSION_CONTRACT_EXPORT_NAME
    });
    return {
      ...base,
      ok: contract.ok,
      status: contract.status,
      contract,
      diagnostics: contract.diagnostics.slice()
    };
  } catch (error) {
    const diagnostic = createStaticDiagnostic(
      { id: options.xtensionId || null },
      STATIC_CONTRACT_PARSE_FAILED_CODE,
      `${XTENSION_CONTRACT_EXPORT_NAME} could not be parsed without executing source.`,
      'error',
      { field: XTENSION_CONTRACT_EXPORT_NAME, sourcePath, error: error.message }
    );
    return {
      ...base,
      ok: false,
      status: 'blocked',
      contract: null,
      diagnostics: [diagnostic]
    };
  }
}

function contractFromMaracaManifest(manifestInput, options = {}) {
  const manifest = manifestInput && manifestInput.schema === XTENSIONS_MARACA_MANIFEST_SCHEMA
    ? manifestInput
    : normalizeXTensionManifest(manifestInput, options);
  const snapshot = manifest.contractSnapshot || {};
  return normalizeStaticXTensionContract({
    schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    id: manifest.id,
    name: manifest.name,
    framework: manifest.framework,
    version: manifest.version,
    hostControllerSchema: snapshot.hostControllerSchema,
    signalBridgeSchema: snapshot.signalBridgeSchema,
    kernelSignalSchema: snapshot.kernelSignalSchema,
    surfaceEventSchema: snapshot.surfaceEventSchema,
    accepts: snapshot.accepts,
    emits: snapshot.emits,
    capabilities: manifest.capabilities || snapshot.capabilities,
    manifestFingerprint: manifest.manifestFingerprint,
    artifactFingerprint: manifest.artifactFingerprint
  }, {
    sourceKind: options.sourceKind || 'maraca-manifest',
    sourcePath: options.sourcePath || ''
  });
}

function contractFromMaracaArtifact(artifact = {}, options = {}) {
  const snapshot = artifact.contractSnapshot || {};
  return normalizeStaticXTensionContract({
    schema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    id: artifact.xtensionId,
    framework: artifact.framework,
    version: artifact.version,
    hostControllerSchema: snapshot.hostControllerSchema,
    signalBridgeSchema: snapshot.signalBridgeSchema,
    kernelSignalSchema: snapshot.kernelSignalSchema,
    surfaceEventSchema: snapshot.surfaceEventSchema,
    accepts: snapshot.accepts,
    emits: snapshot.emits,
    capabilities: snapshot.capabilities,
    manifestFingerprint: artifact.manifestFingerprint,
    artifactFingerprint: artifact.artifactFingerprint
  }, {
    sourceKind: options.sourceKind || 'maraca-artifact',
    sourcePath: options.sourcePath || ''
  });
}

function createContractDriftReport(left, right, options = {}) {
  const leftContract = normalizeStaticXTensionContract(left || {}, { sourceKind: options.leftSourceKind || 'left' });
  const rightContract = normalizeStaticXTensionContract(right || {}, { sourceKind: options.rightSourceKind || 'right' });
  const fields = ['accepts', 'emits', 'capabilities'];
  const drift = [];

  fields.forEach((field) => {
    const leftValues = leftContract[field] || [];
    const rightValues = rightContract[field] || [];
    const missingInRight = leftValues.filter((value) => !rightValues.includes(value));
    const missingInLeft = rightValues.filter((value) => !leftValues.includes(value));
    if (missingInRight.length > 0 || missingInLeft.length > 0) {
      drift.push({
        field,
        missingInRight,
        missingInLeft
      });
    }
  });

  const diagnostics = drift.map((entry) => createStaticDiagnostic(
    leftContract,
    STATIC_CONTRACT_DRIFT_DETECTED_CODE,
    `Static contract drift detected for ${entry.field}.`,
    'error',
    { field: entry.field, missingInRight: entry.missingInRight, missingInLeft: entry.missingInLeft }
  ));

  return {
    schema: XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA,
    workpackage: XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE,
    ok: diagnostics.length === 0,
    status: diagnostics.length === 0 ? 'ready' : 'blocked',
    leftFingerprint: leftContract.contractFingerprint,
    rightFingerprint: rightContract.contractFingerprint,
    driftCount: drift.length,
    drift,
    diagnostics
  };
}

function createXTensionsStaticContractIndex(input = {}, options = {}) {
  const contracts = [];
  const diagnostics = [];

  toArray(input.contracts).forEach((contract) => {
    const normalized = normalizeStaticXTensionContract(contract, { sourceKind: 'inline-contract' });
    contracts.push(normalized);
    diagnostics.push(...normalized.diagnostics);
  });

  toArray(input.manifests).forEach((manifest) => {
    const normalized = contractFromMaracaManifest(manifest, { sourceKind: 'maraca-manifest' });
    contracts.push(normalized);
    diagnostics.push(...normalized.diagnostics);
  });

  toArray(input.artifacts).forEach((artifact) => {
    const normalized = contractFromMaracaArtifact(artifact, { sourceKind: 'maraca-artifact' });
    contracts.push(normalized);
    diagnostics.push(...normalized.diagnostics);
  });

  toArray(input.sourceModules).forEach((sourceModule) => {
    const extracted = extractXTensionContractFromSource(sourceModule.text || '', {
      sourcePath: sourceModule.path || sourceModule.sourcePath || '',
      xtensionId: sourceModule.xtensionId
    });
    if (extracted.contract) contracts.push(extracted.contract);
    diagnostics.push(...extracted.diagnostics);
  });

  const uniqueById = new Map();
  contracts.forEach((contract) => {
    if (!contract.id || !uniqueById.has(contract.id)) {
      uniqueById.set(contract.id || `anonymous:${uniqueById.size}`, contract);
    }
  });
  const indexedContracts = Array.from(uniqueById.values());
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA,
    introspectionSchema: XTENSIONS_STATIC_INTROSPECTION_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    maracaManifestSchema: XTENSIONS_MARACA_MANIFEST_SCHEMA,
    maracaArtifactSchema: XTENSIONS_MARACA_ARTIFACT_SCHEMA,
    maracaBundleReportSchema: XTENSIONS_MARACA_BUNDLE_REPORT_SCHEMA,
    workpackage: XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    runtimeExecutionRequired: false,
    contractCount: indexedContracts.length,
    contracts: indexedContracts,
    diagnostics,
    indexes: {
      byFramework: indexedContracts.reduce((result, contract) => {
        const key = contract.framework || 'unknown';
        result[key] = result[key] || [];
        result[key].push(contract.id);
        return result;
      }, {}),
      accepts: indexedContracts.reduce((result, contract) => {
        contract.accepts.forEach((entry) => {
          result[entry] = result[entry] || [];
          result[entry].push(contract.id);
        });
        return result;
      }, {}),
      emits: indexedContracts.reduce((result, contract) => {
        contract.emits.forEach((entry) => {
          result[entry] = result[entry] || [];
          result[entry].push(contract.id);
        });
        return result;
      }, {}),
      capabilities: indexedContracts.reduce((result, contract) => {
        contract.capabilities.forEach((entry) => {
          result[entry] = result[entry] || [];
          result[entry].push(contract.id);
        });
        return result;
      }, {})
    },
    indexFingerprint: sha256Value(indexedContracts.map((contract) => ({
      id: contract.id,
      contractFingerprint: contract.contractFingerprint
    })))
  };
}

function createXTensionsLspIndex(indexOrInput = {}, options = {}) {
  const index = indexOrInput.schema === XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA
    ? indexOrInput
    : createXTensionsStaticContractIndex(indexOrInput, options);
  const completions = [];
  const symbols = [];

  index.contracts.forEach((contract) => {
    symbols.push({
      name: contract.id,
      kind: 'interface',
      detail: `${contract.framework} XTension contract`,
      source: contract.source
    });
    contract.accepts.forEach((entry) => completions.push({
      label: entry,
      kind: 'event',
      detail: `accepted signal for ${contract.id}`,
      data: { xtensionId: contract.id, domain: 'accepts' }
    }));
    contract.emits.forEach((entry) => completions.push({
      label: entry,
      kind: 'event',
      detail: `emitted event for ${contract.id}`,
      data: { xtensionId: contract.id, domain: 'emits' }
    }));
    contract.capabilities.forEach((entry) => completions.push({
      label: entry,
      kind: 'value',
      detail: `capability for ${contract.id}`,
      data: { xtensionId: contract.id, domain: 'capabilities' }
    }));
  });

  return {
    schema: XTENSIONS_STATIC_LSP_INDEX_SCHEMA,
    indexSchema: XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA,
    ok: index.ok,
    runtimeExecutionRequired: false,
    completionCount: completions.length,
    symbolCount: symbols.length,
    completions,
    symbols,
    diagnostics: index.diagnostics.map(cloneJson)
  };
}

function createXTensionsDevToolsPanel(indexOrInput = {}, options = {}) {
  const index = indexOrInput.schema === XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA
    ? indexOrInput
    : createXTensionsStaticContractIndex(indexOrInput, options);
  return {
    schema: XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA,
    indexSchema: XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA,
    ok: index.ok,
    runtimeExecutionRequired: false,
    summary: {
      contractCount: index.contractCount,
      frameworks: Object.keys(index.indexes.byFramework).sort(),
      diagnosticCount: index.diagnostics.length
    },
    rows: index.contracts.map((contract) => ({
      xtensionId: contract.id,
      framework: contract.framework,
      version: contract.version,
      acceptsCount: contract.accepts.length,
      emitsCount: contract.emits.length,
      capabilityCount: contract.capabilities.length,
      contractFingerprint: contract.contractFingerprint,
      sourceKind: contract.source.kind
    })),
    diagnostics: index.diagnostics.map(cloneJson)
  };
}

function repairHintForDiagnostic(diagnostic) {
  const hints = {
    [STATIC_CONTRACT_ACCEPTS_MISSING_CODE]: 'Add an accepts array to XTENSION_CONTRACT and mirror it in the Maraca contract snapshot.',
    [STATIC_CONTRACT_EMITS_MISSING_CODE]: 'Add an emits array to XTENSION_CONTRACT and the Signal Bridge governance records.',
    [STATIC_CONTRACT_CAPABILITY_MISSING_CODE]: 'Add capabilities that describe HostController, signal and event support.',
    [STATIC_CONTRACT_EXPORT_MISSING_CODE]: `Export ${XTENSION_CONTRACT_EXPORT_NAME} as a JSON-compatible static object.`,
    [STATIC_CONTRACT_DRIFT_DETECTED_CODE]: 'Synchronize source XTENSION_CONTRACT with the Maraca manifest contract snapshot.',
    [STATIC_CONTRACT_FRAMEWORK_DEPENDENCY_CODE]: 'Remove real framework imports from static contract sources; keep framework names as data only.'
  };
  return hints[diagnostic.code] || 'Review the static XTension contract and update source or build artifact.';
}

function createXTensionsAiAgentReport(input = {}, options = {}) {
  const index = input.index && input.index.schema === XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA
    ? input.index
    : createXTensionsStaticContractIndex(input, options);
  const driftReports = toArray(input.driftPairs).map((pair) => createContractDriftReport(pair.left, pair.right, options));
  const diagnostics = index.diagnostics.concat(driftReports.flatMap((report) => report.diagnostics));
  const repairActions = diagnostics.map((diagnostic, order) => ({
    schema: 'xtend.xtensions.static-contract-ai-repair-action.v1',
    order,
    diagnosticCode: diagnostic.code,
    xtensionId: diagnostic.xtensionId,
    safe: true,
    title: repairHintForDiagnostic(diagnostic),
    targetField: diagnostic.field,
    source: 'static-introspection'
  }));

  return {
    schema: XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA,
    indexSchema: XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA,
    driftSchema: XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA,
    ok: diagnostics.length === 0,
    status: diagnostics.length === 0 ? 'ready' : 'repair-required',
    runtimeExecutionRequired: false,
    contractCount: index.contractCount,
    diagnosticCount: diagnostics.length,
    repairActionCount: repairActions.length,
    diagnostics: diagnostics.map(cloneJson),
    driftReports,
    repairActions,
    guidance: [
      `Read ${XTENSION_CONTRACT_EXPORT_NAME} statically; do not import or execute framework hosts.`,
      'Keep accepts, emits and capabilities aligned with Maraca manifest snapshots.',
      'Re-run xtensions-static-introspection after any repair.'
    ]
  };
}

function assertStaticIntrospectionDependencyBoundary(input = {}) {
  const dependencyCheck = assertNoFrameworkDependencies(input);
  return {
    ok: dependencyCheck.ok,
    diagnostics: dependencyCheck.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      code: STATIC_CONTRACT_FRAMEWORK_DEPENDENCY_CODE
    })),
    forbiddenFrameworkDependencies: dependencyCheck.forbiddenFrameworkDependencies
  };
}

function createXTensionsStaticIntrospectionReport(input = {}, options = {}) {
  const index = createXTensionsStaticContractIndex(input, options);
  const lspIndex = createXTensionsLspIndex(index, options);
  const devtoolsPanel = createXTensionsDevToolsPanel(index, options);
  const aiAgentReport = createXTensionsAiAgentReport({
    index,
    driftPairs: input.driftPairs || []
  }, options);
  const dependencyBoundary = assertStaticIntrospectionDependencyBoundary(input);
  const diagnostics = index.diagnostics
    .concat(aiAgentReport.diagnostics)
    .concat(dependencyBoundary.diagnostics);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA,
    introspectionSchema: XTENSIONS_STATIC_INTROSPECTION_SCHEMA,
    staticContractSchema: XTENSIONS_STATIC_CONTRACT_SCHEMA,
    indexSchema: XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA,
    lspIndexSchema: XTENSIONS_STATIC_LSP_INDEX_SCHEMA,
    devtoolsPanelSchema: XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA,
    aiAgentReportSchema: XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA,
    workpackage: XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    runtimeExecutionRequired: false,
    index,
    lspIndex,
    devtoolsPanel,
    aiAgentReport,
    dependencyBoundary,
    diagnostics,
    timestamp: timestampFromOptions(options)
  };
}

function serializeStaticIntrospectionReport(report) {
  return `${JSON.stringify(stableSort(report), null, 2)}\n`;
}

module.exports = {
  STATIC_CONTRACT_ACCEPTS_MISSING_CODE,
  STATIC_CONTRACT_CAPABILITY_MISSING_CODE,
  STATIC_CONTRACT_DRIFT_DETECTED_CODE,
  STATIC_CONTRACT_EMITS_MISSING_CODE,
  STATIC_CONTRACT_EXPORT_MISSING_CODE,
  STATIC_CONTRACT_FRAMEWORK_DEPENDENCY_CODE,
  STATIC_CONTRACT_PARSE_FAILED_CODE,
  STATIC_CONTRACT_RUNTIME_EXECUTION_FORBIDDEN_CODE,
  STATIC_CONTRACT_SCHEMA_MISSING_CODE,
  XTENSION_CONTRACT_EXPORT_NAME,
  XTENSIONS_STATIC_AI_AGENT_REPORT_SCHEMA,
  XTENSIONS_STATIC_CONTRACT_DRIFT_SCHEMA,
  XTENSIONS_STATIC_CONTRACT_INDEX_SCHEMA,
  XTENSIONS_STATIC_CONTRACT_SCHEMA,
  XTENSIONS_STATIC_CONTRACT_SOURCE_SCHEMA,
  XTENSIONS_STATIC_DEVTOOLS_PANEL_SCHEMA,
  XTENSIONS_STATIC_DIAGNOSTIC_SCHEMA,
  XTENSIONS_STATIC_INTROSPECTION_CONTRACT_PATH,
  XTENSIONS_STATIC_INTROSPECTION_DRIFT_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_MODULE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_NO_EXPORT_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_PACKAGE_SCRIPT,
  XTENSIONS_STATIC_INTROSPECTION_REPORT_SCHEMA,
  XTENSIONS_STATIC_INTROSPECTION_SCHEMA,
  XTENSIONS_STATIC_INTROSPECTION_SOURCE_FIXTURE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_SUITE_PATH,
  XTENSIONS_STATIC_INTROSPECTION_TYPES_PATH,
  XTENSIONS_STATIC_INTROSPECTION_WORKPACKAGE,
  XTENSIONS_STATIC_LSP_INDEX_SCHEMA,
  assertStaticIntrospectionDependencyBoundary,
  createContractDriftReport,
  createStaticDiagnostic,
  createXTensionsAiAgentReport,
  createXTensionsDevToolsPanel,
  createXTensionsLspIndex,
  createXTensionsStaticContractIndex,
  createXTensionsStaticIntrospectionReport,
  extractXTensionContractFromSource,
  normalizeStaticXTensionContract,
  serializeStaticIntrospectionReport
};
