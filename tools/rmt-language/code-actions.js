const {
  buildSemanticGraph
} = require('./semantic-graph');
const {
  lintRmtSource
} = require('./diagnostics');

const RMT_CODE_ACTION_PROVIDER_SCHEMA = 'xtend.rmt.code-action-provider.v1';
const RMT_CODE_ACTION_REPORT_SCHEMA = 'xtend.rmt.code-action-report.v1';
const RMT_CODE_ACTION_SCHEMA = 'xtend.rmt.code-action.v1';
const RMT_WORKSPACE_EDIT_SCHEMA = 'xtend.rmt.workspace-edit.v1';
const RMT_CODE_ACTION_WORKPACKAGE = 'WP-E14-10';
const RMT_CODE_ACTION_MODULE_PATH = 'tools/rmt-language/code-actions.js';
const RMT_CODE_ACTION_SUITE_PATH = 'tests/rmt-language/rmt_code_actions_suite.js';
const RMT_CODE_ACTION_PACKAGE_SCRIPT = 'npm run test:rmt-code-actions';

const SAFE_LANE_FALLBACK = 'visible';
const SAFE_HYDRATION_POLICY_FALLBACK = 'runtime_render';
const SAFE_ANIMATION_EFFECT_FALLBACK = 'fade';
const SAFE_ANIMATION_REDUCED_MOTION_FALLBACK = 'fade';
const SAFE_ANIMATION_INTERRUPT_FALLBACK = 'replace';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function decodePointerSegment(segment) {
  return String(segment).replace(/~1/g, '/').replace(/~0/g, '~');
}

function parsePointer(pointer) {
  const safePointer = normalizeString(pointer);

  if (!safePointer) {
    return [];
  }

  if (!safePointer.startsWith('/')) {
    return null;
  }

  return safePointer.slice(1).split('/').map(decodePointerSegment);
}

function getPointerValue(document, pointer) {
  const segments = parsePointer(pointer);

  if (!segments) {
    return undefined;
  }

  let node = document;

  for (const segment of segments) {
    if (node === null || node === undefined) {
      return undefined;
    }

    if (Array.isArray(node)) {
      if (!/^(0|[1-9]\d*)$/.test(segment)) {
        return undefined;
      }
      node = node[Number(segment)];
      continue;
    }

    if (typeof node === 'object') {
      node = node[segment];
      continue;
    }

    return undefined;
  }

  return node;
}

function escapeJsonString(value) {
  return JSON.stringify(String(value));
}

function indentText(text, spaces) {
  const prefix = ' '.repeat(spaces);

  return String(text)
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function createRangeAtOffset(sourceModel, offset) {
  return sourceModel.rangeForOffsets(offset, offset);
}

function rangeForPointer(sourceModel, pointer, target = 'value') {
  if (!sourceModel || !pointer || typeof sourceModel.findJsonPointerRange !== 'function') {
    return null;
  }

  const pointerRange = sourceModel.findJsonPointerRange(pointer, { target });

  return pointerRange ? pointerRange.range : null;
}

function createTextEdit(range, newText, annotationId = null) {
  return {
    range,
    newText,
    annotationId
  };
}

function createWorkspaceEdit(uri, edits, metadata = {}) {
  return {
    schema: RMT_WORKSPACE_EDIT_SCHEMA,
    changes: {
      [uri]: edits
    },
    metadata
  };
}

function createCodeAction(input = {}) {
  return {
    schema: RMT_CODE_ACTION_SCHEMA,
    title: input.title,
    kind: input.kind || 'quickfix',
    diagnosticCode: input.diagnosticCode || null,
    pointer: input.pointer || null,
    safe: input.safe !== false,
    confidence: input.confidence || 'high',
    source: input.source || 'rmt-code-actions',
    diagnostics: toArray(input.diagnostics),
    edit: input.edit || null,
    command: input.command || null,
    isPreferred: !!input.isPreferred,
    workpackage: RMT_CODE_ACTION_WORKPACKAGE
  };
}

function createReplaceValueAction(graph, diagnostic, value, title, options = {}) {
  const sourceModel = graph.sourceModel;
  const pointer = normalizeString(diagnostic.pointer);
  const range = rangeForPointer(sourceModel, pointer);

  if (!range) {
    return null;
  }

  return createCodeAction({
    title,
    diagnosticCode: diagnostic.code,
    pointer,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(range, JSON.stringify(value), `replace-${diagnostic.code}`)
    ], {
      repairKind: options.repairKind || 'replace-field-value'
    }),
    isPreferred: options.isPreferred !== false
  });
}

function createAppendPropertyAction(graph, diagnostic, objectPointer, propertyName, value, title, options = {}) {
  const sourceModel = graph.sourceModel;
  const objectRange = rangeForPointer(sourceModel, objectPointer);

  if (!objectRange || !Number.isInteger(objectRange.endOffset)) {
    return null;
  }

  const closingOffset = Math.max(objectRange.startOffset, objectRange.endOffset - 1);
  const closingLine = sourceModel.positionAt(closingOffset).line;
  const closingIndent = (sourceModel.lineText(closingLine).match(/^\s*/) || [''])[0];
  const propertyIndent = `${closingIndent}  `;
  const range = createRangeAtOffset(sourceModel, closingOffset);
  const newText = `,\n${propertyIndent}${escapeJsonString(propertyName)}: ${JSON.stringify(value)}\n${closingIndent}`;

  return createCodeAction({
    title,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || objectPointer,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(sourceModel.uri, [
      createTextEdit(range, newText, `append-${propertyName}`)
    ], {
      repairKind: options.repairKind || 'append-property',
      objectPointer,
      propertyName
    }),
    isPreferred: options.isPreferred !== false
  });
}

function createArrayInsertAction(graph, diagnostic, domain, record, title, options = {}) {
  const sourceModel = graph.sourceModel;
  const document = graph.sourceDocument || {};
  const uri = sourceModel.uri;
  const domainPointer = `/${domain}`;
  const existingRecords = toArray(document[domain]);
  const domainRange = rangeForPointer(sourceModel, domainPointer);
  const recordText = indentText(JSON.stringify(record, null, 2), 4);
  let edit = null;

  if (domainRange && Number.isInteger(domainRange.endOffset)) {
    if (existingRecords.length === 0) {
      edit = createTextEdit(domainRange, `[\n${recordText}\n  ]`, `insert-${domain}`);
    } else {
      const insertOffset = Math.max(domainRange.startOffset, domainRange.endOffset - 1);
      edit = createTextEdit(
        createRangeAtOffset(sourceModel, insertOffset),
        `,\n${recordText}\n  `,
        `insert-${domain}`
      );
    }
  } else {
    const rootRange = rangeForPointer(sourceModel, '');

    if (!rootRange || !Number.isInteger(rootRange.endOffset)) {
      return null;
    }

    const insertOffset = Math.max(rootRange.startOffset, rootRange.endOffset - 1);
    edit = createTextEdit(
      createRangeAtOffset(sourceModel, insertOffset),
      `,\n  ${escapeJsonString(domain)}: [\n${recordText}\n  ]\n`,
      `insert-${domain}`
    );
  }

  return createCodeAction({
    title,
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    edit: createWorkspaceEdit(uri, [edit], {
      repairKind: options.repairKind || `create-${domain.slice(0, -1)}`,
      targetDomain: domain,
      targetId: record.id || null
    }),
    isPreferred: options.isPreferred !== false
  });
}

function inferLaneFromId(id) {
  const value = normalizeString(id).toLowerCase();

  if (value.includes('idle')) {
    return 'idle';
  }

  if (value.includes('transition') || value.includes('input') || value.includes('blocking')) {
    return 'user-blocking';
  }

  if (value.includes('diagnostic') || value.includes('telemetry')) {
    return 'diagnostics';
  }

  if (value.includes('background')) {
    return 'background';
  }

  return SAFE_LANE_FALLBACK;
}

function inferEndpointNameFromId(id) {
  const normalized = normalizeString(id);

  if (!normalized) {
    return 'xtendrmt.generated.endpoint';
  }

  return normalized.startsWith('xtendrmt.')
    ? normalized
    : `xtendrmt.${normalized.replace(/[^a-zA-Z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}`;
}

function createScheduleStub(id) {
  return {
    id,
    endpointName: inferEndpointNameFromId(id),
    lane: inferLaneFromId(id),
    fiber: id.includes('route') ? 'route.render' : 'component.render',
    priority: 50,
    budgetMs: 24
  };
}

function createTemplateStub(id) {
  return {
    id,
    mode: 'dom_descriptor',
    nodes: []
  };
}

function titleizeRoute(route, fallback = 'Route') {
  const raw = normalizeString(route && (route.id || route.path)) || fallback;
  const cleaned = raw
    .replace(/^#?\//, '')
    .replace(/[-_.]+/g, ' ')
    .trim();

  if (!cleaned) {
    return 'Home';
  }

  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

function createRenameFallbackAction(graph, diagnostic) {
  const sourceModel = graph.sourceModel;
  const uri = diagnostic.uri || (sourceModel && sourceModel.uri) || null;
  const filePath = diagnostic.file || (sourceModel && sourceModel.filePath) || null;
  const nextPath = filePath && filePath.endsWith('.rmt.json')
    ? filePath.replace(/\.rmt\.json$/i, '.rmt')
    : filePath && filePath.endsWith('.json')
      ? filePath.replace(/\.json$/i, '.rmt')
      : null;

  return createCodeAction({
    title: 'Datei nach .rmt umbenennen',
    diagnosticCode: diagnostic.code,
    pointer: diagnostic.pointer || null,
    diagnostics: [diagnostic],
    command: {
      title: 'Datei nach .rmt umbenennen',
      command: 'xtend.rmt.renameFileExtension',
      arguments: [{
        uri,
        from: filePath,
        to: nextPath,
        safe: !!nextPath
      }]
    },
    confidence: nextPath ? 'high' : 'medium',
    isPreferred: true
  });
}

function createActionForDiagnostic(graph, diagnostic) {
  const pointer = normalizeString(diagnostic.pointer);
  const reference = pointer && graph.findReferenceAtPointer ? graph.findReferenceAtPointer(pointer) : null;

  if (diagnostic.code === 'rmt.document.extension.fallback-used') {
    return createRenameFallbackAction(graph, diagnostic);
  }

  if (diagnostic.code === 'rmt.ref.schedule.unresolved' && reference && reference.targetId) {
    return createArrayInsertAction(
      graph,
      diagnostic,
      'schedules',
      createScheduleStub(reference.targetId),
      `Schedule "${reference.targetId}" anlegen`,
      { repairKind: 'create-schedule' }
    );
  }

  if (diagnostic.code === 'rmt.ref.template.unresolved' && reference && reference.targetId) {
    return createArrayInsertAction(
      graph,
      diagnostic,
      'templates',
      createTemplateStub(reference.targetId),
      `Template "${reference.targetId}" anlegen`,
      { repairKind: 'create-template-stub' }
    );
  }

  if (diagnostic.code === 'rmt.fabric.lane.unknown') {
    return createReplaceValueAction(
      graph,
      diagnostic,
      SAFE_LANE_FALLBACK,
      `Fabric/RMT Lane auf "${SAFE_LANE_FALLBACK}" setzen`,
      { repairKind: 'replace-field-value' }
    );
  }

  if (diagnostic.code === 'rmt.hydration.policy.unknown') {
    return createReplaceValueAction(
      graph,
      diagnostic,
      SAFE_HYDRATION_POLICY_FALLBACK,
      `Hydration Policy auf "${SAFE_HYDRATION_POLICY_FALLBACK}" setzen`,
      { repairKind: 'replace-field-value' }
    );
  }

  if ([
    'rmt.animation.effect_unknown',
    'rmt.animation.transition_effect_unknown',
    'rmt.surface_transition.effect_unknown',
    'xtend.maraca.transitions_effect_unknown'
  ].includes(diagnostic.code)) {
    return createReplaceValueAction(
      graph,
      diagnostic,
      SAFE_ANIMATION_EFFECT_FALLBACK,
      `Animation Effect auf "${SAFE_ANIMATION_EFFECT_FALLBACK}" setzen`,
      { repairKind: 'replace-animation-effect' }
    );
  }

  if ([
    'rmt.animation.reduced_motion_invalid',
    'rmt.animation.transition_reduced_motion_invalid'
  ].includes(diagnostic.code)) {
    return createReplaceValueAction(
      graph,
      diagnostic,
      SAFE_ANIMATION_REDUCED_MOTION_FALLBACK,
      `Reduced-Motion Policy auf "${SAFE_ANIMATION_REDUCED_MOTION_FALLBACK}" setzen`,
      { repairKind: 'replace-reduced-motion-policy' }
    );
  }

  if (diagnostic.code === 'rmt.animation.interrupt_invalid') {
    return createReplaceValueAction(
      graph,
      diagnostic,
      SAFE_ANIMATION_INTERRUPT_FALLBACK,
      `Interrupt Policy auf "${SAFE_ANIMATION_INTERRUPT_FALLBACK}" setzen`,
      { repairKind: 'replace-interrupt-policy' }
    );
  }

  if (diagnostic.code === 'rmt.animation.reduced_motion_missing' && pointer) {
    return createAppendPropertyAction(
      graph,
      diagnostic,
      pointer,
      'reducedMotion',
      SAFE_ANIMATION_REDUCED_MOTION_FALLBACK,
      'Reduced-Motion Policy ergaenzen',
      { repairKind: 'add-reduced-motion-policy' }
    );
  }

  if (diagnostic.code === 'rmt.animation.layout_key_missing' && pointer) {
    return createAppendPropertyAction(
      graph,
      diagnostic,
      pointer,
      'layoutKey',
      'shared-element',
      'layoutKey ergaenzen',
      { repairKind: 'add-layout-key' }
    );
  }

  if (diagnostic.code === 'rmt.route.document-title.missing' && pointer) {
    const route = getPointerValue(graph.sourceDocument, pointer);

    return createAppendPropertyAction(
      graph,
      diagnostic,
      pointer,
      'documentTitle',
      titleizeRoute(route),
      'Route documentTitle ergaenzen',
      { repairKind: 'add-route-title' }
    );
  }

  if (diagnostic.code === 'rmt.schedule.endpoint.missing' && pointer) {
    const schedule = toPlainObject(getPointerValue(graph.sourceDocument, pointer));
    const endpointName = inferEndpointNameFromId(schedule.id || 'generated.schedule');

    return createAppendPropertyAction(
      graph,
      diagnostic,
      pointer,
      'endpointName',
      endpointName,
      'Schedule endpointName ergaenzen',
      { repairKind: 'create-schedule' }
    );
  }

  return null;
}

function actionKey(action) {
  if (!action) {
    return '';
  }

  const edit = action.edit ? JSON.stringify(action.edit) : '';
  const command = action.command ? JSON.stringify(action.command) : '';

  return `${action.title}:${action.diagnosticCode}:${edit}:${command}`;
}

function uniqueAndSortActions(actions) {
  const seen = new Set();
  const result = [];

  actions.filter(Boolean).forEach((action) => {
    const key = actionKey(action);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(action);
  });

  return result.sort((a, b) => {
    const codeDiff = String(a.diagnosticCode || '').localeCompare(String(b.diagnosticCode || ''));

    if (codeDiff !== 0) {
      return codeDiff;
    }

    const pointerDiff = String(a.pointer || '').localeCompare(String(b.pointer || ''));

    if (pointerDiff !== 0) {
      return pointerDiff;
    }

    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

function shouldIncludeDiagnostic(diagnostic, filters) {
  if (filters.length === 0) {
    return true;
  }

  return filters.some((filter) => {
    const codeMatches = !filter.code || filter.code === diagnostic.code;
    const pointerMatches = !filter.pointer || filter.pointer === diagnostic.pointer;

    return codeMatches && pointerMatches;
  });
}

function normalizeDiagnosticFilters(diagnostics) {
  return toArray(diagnostics).map((diagnostic) => ({
    code: diagnostic.code || null,
    pointer: diagnostic.pointer || (diagnostic.data && diagnostic.data.pointer) || null
  }));
}

function createRmtCodeActionProvider(defaultOptions = {}) {
  function codeActions(input = {}, options = {}) {
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };
    const graph = mergedOptions.graph || buildSemanticGraph(input, mergedOptions);

    if (!graph || graph.status === 'source_unavailable') {
      return {
        schema: RMT_CODE_ACTION_REPORT_SCHEMA,
        providerSchema: RMT_CODE_ACTION_PROVIDER_SCHEMA,
        actionSchema: RMT_CODE_ACTION_SCHEMA,
        editSchema: RMT_WORKSPACE_EDIT_SCHEMA,
        workpackage: RMT_CODE_ACTION_WORKPACKAGE,
        status: 'source_unavailable',
        ok: false,
        actionCount: 0,
        actions: [],
        graphStatus: graph ? graph.status : null
      };
    }

    const lintReport = mergedOptions.lintReport || lintRmtSource(input, {
      ...mergedOptions,
      graph
    });
    const filters = normalizeDiagnosticFilters(mergedOptions.diagnostics || mergedOptions.contextDiagnostics);
    const diagnostics = toArray(lintReport.diagnostics).filter((diagnostic) => shouldIncludeDiagnostic(diagnostic, filters));
    const actions = uniqueAndSortActions(diagnostics.map((diagnostic) => createActionForDiagnostic(graph, diagnostic)));

    return {
      schema: RMT_CODE_ACTION_REPORT_SCHEMA,
      providerSchema: RMT_CODE_ACTION_PROVIDER_SCHEMA,
      actionSchema: RMT_CODE_ACTION_SCHEMA,
      editSchema: RMT_WORKSPACE_EDIT_SCHEMA,
      workpackage: RMT_CODE_ACTION_WORKPACKAGE,
      status: 'completed',
      ok: true,
      actionCount: actions.length,
      actions,
      graphStatus: graph.status,
      diagnosticCount: diagnostics.length,
      manifestHints: graph.manifestHints || {},
      catalogHints: graph.catalogHints || {}
    };
  }

  return Object.freeze({
    schema: RMT_CODE_ACTION_PROVIDER_SCHEMA,
    reportSchema: RMT_CODE_ACTION_REPORT_SCHEMA,
    actionSchema: RMT_CODE_ACTION_SCHEMA,
    editSchema: RMT_WORKSPACE_EDIT_SCHEMA,
    workpackage: RMT_CODE_ACTION_WORKPACKAGE,
    codeActions
  });
}

function getRmtCodeActions(input = {}, options = {}) {
  return createRmtCodeActionProvider(options).codeActions(input, options);
}

module.exports = {
  RMT_CODE_ACTION_MODULE_PATH,
  RMT_CODE_ACTION_PACKAGE_SCRIPT,
  RMT_CODE_ACTION_PROVIDER_SCHEMA,
  RMT_CODE_ACTION_REPORT_SCHEMA,
  RMT_CODE_ACTION_SCHEMA,
  RMT_CODE_ACTION_SUITE_PATH,
  RMT_CODE_ACTION_WORKPACKAGE,
  RMT_WORKSPACE_EDIT_SCHEMA,
  createCodeAction,
  createRmtCodeActionProvider,
  getRmtCodeActions
};
