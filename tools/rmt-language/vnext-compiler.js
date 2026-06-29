const {
  RMT_FILE_FALLBACK_CODE,
  RMT_VNEXT_PARSER_SCHEMA,
  RMT_VNEXT_PARSER_WORKPACKAGE,
  parseRmtVNextSource
} = require('./vnext-parser');
const {
  buildRmtVNextPrimitiveSemanticGraph
} = require('./semantic-graph');

const RMT_VNEXT_CORE_SCHEMA = 'xtend.rmt.core-format.vnext.v1';
const RMT_VNEXT_COMPILER_SCHEMA = 'xtend.rmt.vnext-compiler.v1';
const RMT_VNEXT_COMPILER_REPORT_SCHEMA = 'xtend.rmt.vnext-compiler-report.v1';
const RMT_VNEXT_COMPILER_WORKPACKAGE = 'WP-E15-05';
const RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA = 'xtend.rmt.vnext.primitive-lowering.v1';
const RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE = 'RMT-VNEXT-PRIM-04';
const RMT_APP_ORCHESTRATION_SCHEMA = 'xtend.rmt.app-orchestration.v1';
const RMT_APP_ORCHESTRATION_WORKPACKAGE = 'RMT-APP-ORCH-01';
const RMT_FORM_VALIDATION_SCHEMA = 'xtend.rmt.form-validation.v1';
const RMT_SURFACE_TRANSITION_SCHEMA = 'xtend.rmt.surface-transitions.v1';
const RMT_VNEXT_COMPILER_MODULE_PATH = 'tools/rmt-language/vnext-compiler.js';
const RMT_VNEXT_COMPILER_SUITE_PATH = 'tests/rmt-language/rmt_vnext_compiler_suite.js';
const RMT_VNEXT_COMPILER_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-compiler';
const RMT_VNEXT_COMPILER_DIAGNOSTIC_CODE = 'rmt.vnext.compiler.diagnostic';
const RMT_KERNEL_RECORDS_SCHEMA = 'xtend.rmt.vnext.kernel-records.v1';
const RMT_APP_PLATFORM_RECORDS_SCHEMA = 'xtend.rmt.vnext.app-platform-records.v1';
const RMT_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-host-runtime-types';
const RMT_VNEXT_RESOURCE_OWNER_KINDS = new Set(['overlay', 'surface']);
const SURFACE_BOUNDS_GEOMETRY_FIELDS = new Set(['x', 'y', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight']);
const SURFACE_BOUNDS_MODES = new Set(['fixed', 'responsive']);
const SURFACE_BOUNDS_SCOPES = new Set(['viewport', 'container']);
const SURFACE_BOUNDS_CSS_FUNCTIONS = new Set(['calc', 'clamp', 'min', 'max']);
const SURFACE_BOUNDS_CSS_UNITS = '(?:px|rem|em|ch|ex|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|svi|svb|lvw|lvh|lvi|lvb|dvw|dvh|dvi|dvb|cqw|cqh|cqi|cqb|cqmin|cqmax|%)';
const PRIMITIVE_DECLARATION_TYPES = new Set([
  'RmtStateDeclaration',
  'RmtSelectorDeclaration',
  'RmtDataSourceDeclaration',
  'RmtActionDeclaration',
  'RmtValidationDeclaration',
  'RmtTransitionDeclaration',
  'RmtPortalDeclaration',
  'RmtOverlayDeclaration',
  'RmtResourceDeclaration'
]);
const PRIMITIVE_SURFACE_CLAUSE_TYPES = new Set([
  'RmtSurfaceSourceClause',
  'RmtSurfaceRepeatClause',
  'RmtSurfaceKeyClause',
  'RmtSurfacePortalClause',
  'RmtSurfaceBoundsClause',
  'RmtSurfacePreserveClause',
  'RmtSurfaceDestroyClause'
]);
const PRIMITIVE_SOURCE_KINDS = new Set([
  'action',
  'datasource',
  'dataSource',
  'overlay',
  'portal',
  'resource',
  'selector',
  'state',
  'surface'
]);

function lowerSurfaceKindToRuntimeType(kind, fallback = 'window') {
  const candidate = String(kind || '').trim().toLowerCase();
  if (['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host'].includes(candidate)) return 'region';
  if (['panel', 'side-panel', 'sidepanel'].includes(candidate)) return 'side-panel';
  if (['window', 'modal', 'dialog', 'drawer', 'popover', 'tooltip', 'toast', 'lightbox', 'menu'].includes(candidate)) return candidate;
  return fallback;
}

function normalizeIdSegment(value, fallback = 'unnamed') {
  const normalized = String(value || fallback)
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  return normalized || fallback;
}

function namespaceFromDocumentId(documentId) {
  return String(documentId || 'rmt').split('.')[0] || 'rmt';
}

function cloneRange(range = {}) {
  return {
    start: {
      line: range.start && Number.isInteger(range.start.line) ? range.start.line : 0,
      character: range.start && Number.isInteger(range.start.character) ? range.start.character : 0
    },
    end: {
      line: range.end && Number.isInteger(range.end.line) ? range.end.line : 0,
      character: range.end && Number.isInteger(range.end.character) ? range.end.character : 0
    },
    startOffset: Number.isInteger(range.startOffset) ? range.startOffset : 0,
    endOffset: Number.isInteger(range.endOffset) ? range.endOffset : 0
  };
}

function createCoreDocument(manifest = {}) {
  return {
    schema: RMT_VNEXT_CORE_SCHEMA,
    kind: 'rmt_document',
    version: '2.0-vnext',
    manifest: {
      documentId: manifest.documentId || 'rmt.vnext.document',
      namespace: manifest.namespace || namespaceFromDocumentId(manifest.documentId),
      sourceSyntax: 'rmt-vnext',
      contracts: [
        'xtend.rmt.vnext.grammar.v1',
        RMT_VNEXT_CORE_SCHEMA
      ]
    },
    imports: [],
    templates: [],
    surfaces: [],
    remoteSurfaces: [],
    lanes: [],
    operations: [],
    slots: [],
    events: [],
    dataSources: [],
    states: [],
    selectors: [],
    actions: [],
    effects: [],
    validations: [],
    transitions: [],
    portals: [],
    overlays: [],
    resources: [],
    securityPolicies: [],
    hydrationPolicies: [],
    sourceMap: [],
    appPlatform: null,
    kernelRecords: null
  };
}

function findFirstNamedDeclaration(ast) {
  if (!ast || !Array.isArray(ast.body)) return null;

  const template = ast.body.find((node) => node && node.type === 'RmtTemplateDeclaration' && node.name);
  if (template) return template.name;

  const surface = ast.body.find((node) => node && node.type === 'RmtSurfaceDeclaration' && node.name);
  if (surface) return surface.name;

  return null;
}

function makeSourceRef(coreId) {
  return `src:${coreId}`;
}

function addSourceMap(core, node, nodeType, corePointer, sourceRef) {
  core.sourceMap.push({
    id: sourceRef,
    nodeType,
    corePointer,
    astPointer: node && node.astPointer ? node.astPointer : null,
    range: cloneRange(node && node.range)
  });
}

function addRecord(core, domain, record, node, nodeType) {
  const index = core[domain].length;
  const corePointer = `/${domain}/${index}`;
  const sourceRef = makeSourceRef(record.id);
  const nextRecord = {
    ...record,
    sourceRef
  };

  core[domain].push(nextRecord);
  addSourceMap(core, node, nodeType, corePointer, sourceRef);

  return nextRecord;
}

function compileExpression(node) {
  if (!node) return null;

  if (node.kind === 'literal') {
    return {
      kind: 'literal',
      value: node.value
    };
  }

  if (node.kind === 'path') {
    return {
      kind: 'path',
      path: Array.isArray(node.path) ? node.path.slice() : String(node.value || '').split('.').filter(Boolean)
    };
  }

  if (node.kind === 'unary') {
    return {
      kind: 'unary',
      op: node.op,
      argument: compileExpression(node.argument)
    };
  }

  if (node.kind === 'binary' || node.kind === 'logical') {
    return {
      kind: node.kind,
      op: node.op,
      left: compileExpression(node.left),
      right: compileExpression(node.right)
    };
  }

  if (node.kind === 'group') {
    return {
      kind: 'group',
      expression: compileExpression(node.expression)
    };
  }

  return {
    kind: 'missing'
  };
}

function isTemplateNode(node) {
  return node && node.type === 'RmtTemplateDeclaration';
}

function isSurfaceNode(node) {
  return node && node.type === 'RmtSurfaceDeclaration';
}

function isRemoteSurfaceNode(node) {
  return node && node.type === 'RmtRemoteSurfaceDeclaration';
}

function isImportNode(node) {
  return node && node.type === 'RmtImportDeclaration';
}

function isLaneNode(node) {
  return node && node.type === 'RmtLaneDeclaration';
}

function isOperationNode(node) {
  return node && (node.type === 'RmtLifecycleStatement' || node.type === 'RmtStreamStatement');
}

function firstBodyNode(node, type) {
  return (Array.isArray(node && node.body) ? node.body : []).find((child) => child && child.type === type) || null;
}

function bodyNodes(node, type) {
  return (Array.isArray(node && node.body) ? node.body : []).filter((child) => child && child.type === type);
}

function inferRemoteCapabilities(exposes, emits, consumes) {
  const capabilities = [];
  if (exposes.length > 0) capabilities.push('surface.mount');
  if (emits.length > 0) capabilities.push('event.emit');
  if (consumes.length > 0) capabilities.push('event.consume');
  return Array.from(new Set(capabilities)).map((id) => ({
    id,
    mode: 'required'
  }));
}

function compileRemoteShellTarget(target) {
  if (!target) return null;
  return {
    type: target.type || null,
    ref: target.ref || target.type || null
  };
}

function eventVersionFromName(eventName) {
  const match = String(eventName || '').match(/\.v(\d+)$/);
  return match ? `v${match[1]}` : '';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function primitiveValueToCore(value) {
  if (!value || typeof value !== 'object') return null;

  if (value.kind === 'literal') {
    return value.value;
  }

  if (value.kind === 'array') {
    return toArray(value.items).map((entry) => primitiveValueToCore(entry));
  }

  if (value.kind === 'object') {
    return toArray(value.fields).reduce((objectValue, field) => {
      if (field && field.key) {
        objectValue[field.key] = primitiveValueToCore(field.value);
      }
      return objectValue;
    }, {});
  }

  if (value.kind === 'path') {
    return value.value || toArray(value.path).join('.');
  }

  if (Object.prototype.hasOwnProperty.call(value, 'value')) {
    return value.value;
  }

  return null;
}

function primitiveValueToString(value) {
  const coreValue = primitiveValueToCore(value);
  if (coreValue === null || coreValue === undefined) return '';
  return String(coreValue).trim();
}

function primitiveValueToStringList(value) {
  const coreValue = primitiveValueToCore(value);
  if (Array.isArray(coreValue)) {
    return coreValue.map((entry) => String(entry == null ? '' : entry).trim()).filter(Boolean);
  }
  const single = String(coreValue == null ? '' : coreValue).trim();
  return single ? [single] : [];
}

function primitiveExpressionTextToCore(text) {
  const expression = String(text || '').trim();
  if (!expression) return null;
  if ((expression.startsWith('"') && expression.endsWith('"')) || (expression.startsWith("'") && expression.endsWith("'"))) {
    try {
      return JSON.parse(expression.startsWith("'")
        ? `"${expression.slice(1, -1).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
        : expression);
    } catch (_) {
      return expression.slice(1, -1);
    }
  }
  if (expression === 'true') return true;
  if (expression === 'false') return false;
  if (expression === 'null') return null;
  if (/^-?\d+(?:\.\d+)?$/u.test(expression)) return Number(expression);
  return expression;
}

function primitiveRecordId(kind, name) {
  return `${kind}:${normalizeIdSegment(name)}`;
}

function getPrimitiveAttribute(node, keyword) {
  return toArray(node && node.attributes).find((attribute) => attribute && attribute.keyword === keyword) || null;
}

function getPrimitiveAttributeValue(node, keyword) {
  const attribute = getPrimitiveAttribute(node, keyword);
  return attribute ? primitiveValueToCore(attribute.value) : null;
}

function getPrimitiveHeaderValue(node, keyword) {
  const header = toArray(node && node.metadata).find((entry) => entry && entry.keyword === keyword) || null;
  return header ? primitiveValueToCore(header.value) : null;
}

function getPrimitiveBodyNode(node, type) {
  return toArray(node && node.body).find((entry) => entry && entry.type === type) || null;
}

function getPrimitiveBodyNodes(node, type) {
  return toArray(node && node.body).filter((entry) => entry && entry.type === type);
}

function compilePrimitiveSourceReference(source) {
  if (!source || typeof source !== 'object') return null;
  const kind = source.kind || null;
  const target = source.target || source.value || source.ref || null;
  if (!kind && !target) return null;

  const normalizedKind = kind === 'datasource' ? 'dataSource' : kind;
  const result = {
    kind: normalizedKind,
    target
  };

  if (target && PRIMITIVE_SOURCE_KINDS.has(kind)) {
    const refKind = kind === 'datasource' ? 'dataSource' : kind;
    result.ref = primitiveRecordId(refKind, target);
  }

  return result;
}

function compileInlinePrimitiveFields(fields) {
  return toArray(fields).reduce((result, field) => {
    if (field && field.key) {
      result[field.key] = primitiveValueToCore(field.value);
    }
    return result;
  }, {});
}

function createCompilerDiagnostic(code, message, node, severity = 'error', detail = {}) {
  return {
    code,
    severity,
    message,
    range: cloneRange(node && node.range),
    ...detail
  };
}

function isQuotedPrimitiveValue(value) {
  return Boolean(value && value.kind === 'literal' && typeof value.value === 'string');
}

function isSurfaceBoundsCssLength(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^-?\d+(?:\.\d+)?$/u.test(raw)) return true;
  if (new RegExp(`^-?\\d+(?:\\.\\d+)?${SURFACE_BOUNDS_CSS_UNITS}$`, 'u').test(raw)) return true;
  const functionMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\((.*)\)$/u);
  if (!functionMatch) return false;
  const functionName = functionMatch[1].toLowerCase();
  const body = functionMatch[2].trim();
  if (!SURFACE_BOUNDS_CSS_FUNCTIONS.has(functionName) || !body) return false;
  if (/[;{}]/u.test(body)) return false;
  if (/url\s*\(|var\s*\(|env\s*\(|attr\s*\(/iu.test(body)) return false;
  return /^[0-9A-Za-z\s.,+\-*/()%]+$/u.test(body)
    && new RegExp(`(?:\\d|${SURFACE_BOUNDS_CSS_UNITS})`, 'u').test(body);
}

function compileSurfaceBoundsClause(boundsNode, compiler = null) {
  const fields = toArray(boundsNode && boundsNode.fields);
  const raw = fields.reduce((result, field) => {
    if (field && field.key) {
      result[field.key] = {
        value: primitiveValueToCore(field.value),
        node: field.value || field.keyNode || boundsNode,
        quoted: isQuotedPrimitiveValue(field.value)
      };
    }
    return result;
  }, {});

  const mode = raw.mode ? String(raw.mode.value || '').trim() || 'fixed' : 'fixed';
  const scope = raw.scope ? String(raw.scope.value || '').trim() || 'viewport' : 'viewport';
  const responsive = mode === 'responsive';
  const bounds = {};

  function addDiagnostic(code, message, entry, detail = {}) {
    if (compiler && typeof compiler.addDiagnostic === 'function') {
      compiler.addDiagnostic(createCompilerDiagnostic(code, message, entry && entry.node || boundsNode, 'error', detail));
    }
  }

  if (!SURFACE_BOUNDS_MODES.has(mode)) {
    addDiagnostic('rmt.vnext.surface.bounds.mode_invalid', `Surface bounds mode "${mode}" is not supported.`, raw.mode, { mode });
  } else if (raw.mode) {
    bounds.mode = mode;
  }

  if (!SURFACE_BOUNDS_SCOPES.has(scope)) {
    addDiagnostic('rmt.vnext.surface.bounds.scope_invalid', `Surface bounds scope "${scope}" is not supported.`, raw.scope, { scope });
  } else if (raw.scope) {
    bounds.scope = scope;
  }

  SURFACE_BOUNDS_GEOMETRY_FIELDS.forEach((fieldName) => {
    const entry = raw[fieldName];
    if (!entry) return;
    const value = entry.value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      bounds[fieldName] = value;
      return;
    }
    if (!responsive) {
      addDiagnostic(
        'rmt.vnext.surface.bounds.fixed_requires_number',
        `Fixed surface bounds field "${fieldName}" must be numeric.`,
        entry,
        { field: fieldName }
      );
      return;
    }
    if (!entry.quoted) {
      addDiagnostic(
        'rmt.vnext.surface.bounds.css_value_unquoted',
        `Responsive surface bounds field "${fieldName}" must quote CSS length values.`,
        entry,
        { field: fieldName }
      );
      return;
    }
    if (!isSurfaceBoundsCssLength(value)) {
      addDiagnostic(
        'rmt.vnext.surface.bounds.css_value_invalid',
        `Responsive surface bounds field "${fieldName}" has an invalid CSS length value.`,
        entry,
        { field: fieldName }
      );
      return;
    }
    bounds[fieldName] = String(value).trim();
  });

  Object.keys(raw).forEach((key) => {
    if (key === 'mode' || key === 'scope' || SURFACE_BOUNDS_GEOMETRY_FIELDS.has(key)) return;
    bounds[key] = raw[key].value;
  });

  return bounds;
}

function compileInitialBlock(node) {
  const block = getPrimitiveBodyNode(node, 'RmtInitialBlock');
  if (!block) return null;
  return toArray(block.body).reduce((initial, entry) => {
    if (entry && entry.key) {
      initial[entry.key] = primitiveValueToCore(entry.value);
    }
    return initial;
  }, {});
}

function compileSelectorClause(node) {
  if (node.type === 'RmtSelectorWhereClause') {
    return {
      kind: 'where',
      text: node.text || ''
    };
  }

  if (node.type === 'RmtSelectorFindClause') {
    return {
      kind: 'find',
      text: node.text || ''
    };
  }

  if (node.type === 'RmtSelectorSortClause') {
    return {
      kind: 'sort',
      by: node.by || null,
      direction: node.direction || 'asc'
    };
  }

  if (node.type === 'RmtSelectorOutputClause') {
    return {
      kind: 'output',
      type: node.dataType && node.dataType.value || null
    };
  }

  return null;
}

function compileValidationFieldRule(rule) {
  if (!rule || !rule.kind) return null;
  const kind = rule.kind === 'minLength' ? 'minLength'
    : rule.kind === 'maxLength' ? 'maxLength'
      : rule.kind;
  return {
    kind,
    value: primitiveValueToCore(rule.value)
  };
}

function validationMessageFromRules(rules) {
  const message = toArray(rules).find((rule) => rule && rule.kind === 'message');
  const value = message ? primitiveValueToCore(message.value) : null;
  return value === null || value === undefined ? '' : String(value);
}

function compileEventPayloadContract(eventNode) {
  const mappings = toArray(eventNode && eventNode.policy && eventNode.policy.body)
    .filter((entry) => entry && entry.type === 'RmtEventPayloadMapping')
    .map((entry) => ({
      name: entry.name,
      source: entry.source
    }));

  if (mappings.length === 0) return null;

  return {
    type: 'object',
    required: mappings.map((entry) => entry.name).filter(Boolean),
    mappings
  };
}

function compileEventOptions(eventNode) {
  return toArray(eventNode && eventNode.policy && eventNode.policy.body)
    .filter((entry) => entry && entry.type === 'RmtEventOptionClause')
    .reduce((options, entry) => {
      if (entry.keyword) {
        options[entry.keyword] = primitiveValueToCore(entry.value);
      }
      return options;
    }, {});
}

function parseOwnerReference(owner) {
  const match = String(owner || '').trim().match(/^([A-Za-z][A-Za-z0-9_-]*)\.(.+)$/);
  if (!match) {
    return null;
  }
  const kind = match[1];
  if (!RMT_VNEXT_RESOURCE_OWNER_KINDS.has(kind)) {
    return null;
  }
  return {
    kind,
    id: match[2],
    ref: primitiveRecordId(kind, match[2])
  };
}

function hasPrimitiveDeclarations(ast) {
  let found = false;

  function walk(node) {
    if (found || !node || typeof node !== 'object') return;
    if (PRIMITIVE_DECLARATION_TYPES.has(node.type)) {
      found = true;
      return;
    }
    if (node.type === 'RmtSurfaceDeclaration') {
      if (toArray(node.metadata).length > 0 || toArray(node.body).some((entry) => entry && (PRIMITIVE_SURFACE_CLAUSE_TYPES.has(entry.type) || entry.type === 'RmtEventBinding'))) {
        found = true;
        return;
      }
    }
    ['body', 'attributes', 'metadata', 'payload', 'source', 'condition', 'policy', 'expression', 'left', 'right', 'argument', 'value', 'dataType', 'initial'].forEach((key) => {
      const value = node[key];
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    });
  }

  walk(ast);
  return found;
}

function hasPrimitiveCoreRecords(core) {
  return ['states', 'selectors', 'actions', 'effects', 'validations', 'transitions', 'portals', 'overlays', 'resources'].some((domain) => core[domain].length > 0)
    || core.surfaces.some((surface) => surface.primitive === true);
}

function createAppPlatformRecords(core) {
  return {
    schema: RMT_APP_PLATFORM_RECORDS_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
    sourceSyntax: 'rmt-vnext',
    state: core.states.map((record) => ({
      id: record.name,
      type: record.type,
      preserve: record.preserve,
      initial: record.initial
    })),
    selectors: core.selectors.map((record) => ({
      id: record.name,
      from: record.source && record.source.target,
      clauses: record.clauses,
      output: record.output
    })),
    dataSources: core.dataSources
      .filter((record) => record.primitive === true)
      .map((record) => ({
        id: record.name,
        kind: record.kind,
        target: record.target,
        method: record.method,
        contract: record.contract,
        result: record.result,
        fallback: record.fallback
      })),
    actions: core.actions.map((record) => ({
      id: record.name,
      inputs: record.inputs,
      status: record.status,
      reducers: record.reducers,
      emits: record.emits,
      effects: record.effectRefs
    })),
    portals: core.portals.map((record) => ({
      id: record.name,
      root: record.root,
      layer: record.layer,
      z: record.z,
      policies: record.policies
    })),
    overlays: core.overlays.map((record) => ({
      id: record.name,
      kind: record.kind,
      portal: record.portal && record.portal.target,
      policies: record.policies
    })),
    surfaces: core.surfaces
      .filter((record) => record.primitive === true)
      .map((record) => ({
        id: record.name,
        kind: record.kind,
        component: record.component,
        source: record.source && record.source.target,
        repeat: record.repeat || null,
        key: record.key || null,
        portal: record.portal && record.portal.target,
        bounds: record.bounds || null,
        resources: toArray(record.resourceRefs).map((ref) => ref.target),
        laneRefs: toArray(record.laneRefs),
        events: record.eventRefs
      })),
    overlaysByPortal: core.overlays.reduce((byPortal, overlay) => {
      const portal = overlay.portal && overlay.portal.target;
      if (portal) {
        byPortal[portal] = byPortal[portal] || [];
        byPortal[portal].push(overlay.name);
      }
      return byPortal;
    }, {}),
    resources: core.resources.map((record) => ({
      id: record.name,
      kind: record.kind,
      owner: record.owner,
      source: record.source,
      dispose: record.dispose,
      adapter: record.adapter
    })),
    validations: core.validations.map((record) => ({
      id: record.name,
      mode: record.mode,
      targets: record.targets,
      fields: record.fields,
      includes: record.includes
    })),
    transitions: core.transitions.map((record) => ({
      id: record.name,
      trigger: record.trigger,
      from: record.from,
      to: record.to,
      effect: record.effect,
      durationMs: record.durationMs,
      easing: record.easing,
      lane: record.lane,
      operation: `operation:xtend.rmt/surface-transition/${record.name}`,
      endpointName: `xtend.rmt.kernel.surface-transition.${schedulerToken(record.name)}`
    })),
    events: core.events
      .filter((record) => record.primitive === true)
      .map((record) => ({
        id: record.id,
        event: record.event,
        selector: record.selector || null,
        target: record.target || null,
        owner: record.scope && record.scope.surface || record.ownerOperation || null,
        action: record.action,
        payloadContract: record.payloadContract,
        options: record.options || {}
      }))
  };
}

function createKernelRecords(core) {
  return {
    schema: RMT_KERNEL_RECORDS_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
    boundary: RMT_KERNEL_BOUNDARY,
    schedules: core.lanes.map((lane) => ({
      id: `schedule:${lane.id.slice('lane:'.length)}`,
      lane: lane.name,
      scope: lane.scope,
      operationRefs: lane.operationRefs.slice()
    })),
    fibers: core.operations.map((operation) => ({
      id: `fiber:${operation.id.slice('operation:'.length)}`,
      lane: operation.scope && operation.scope.lane || null,
      operation: operation.id,
      kind: operation.kind,
      op: operation.op,
      target: operation.target,
      source: operation.source || null
    })),
    lifecycleRecords: core.operations.map((operation) => ({
      id: operation.id,
      kind: operation.kind,
      op: operation.op,
      scope: operation.scope,
      sourceRef: operation.sourceRef
    })),
    stateRecords: core.states.map((state) => ({
      id: state.id,
      name: state.name,
      type: state.type,
      preserve: state.preserve,
      sourceRef: state.sourceRef
    })),
    selectorRecords: core.selectors.map((selector) => ({
      id: selector.id,
      name: selector.name,
      source: selector.source,
      output: selector.output,
      sourceRef: selector.sourceRef
    })),
    actionRecords: core.actions.map((action) => ({
      id: action.id,
      name: action.name,
      inputCount: action.inputs.length,
      effectRefs: action.effectRefs.slice(),
      sourceRef: action.sourceRef
    })),
    validationRecords: core.validations.map((validation) => ({
      id: validation.id,
      name: validation.name,
      mode: validation.mode,
      targetCount: validation.targets.length,
      fieldCount: validation.fields.length,
      includeCount: validation.includes.length,
      sourceRef: validation.sourceRef
    })),
    transitionRecords: core.transitions.map((transition) => ({
      id: transition.id,
      name: transition.name,
      trigger: transition.trigger,
      fromCount: transition.from.length,
      toCount: transition.to.length,
      effect: transition.effect,
      durationMs: transition.durationMs,
      lane: transition.lane,
      sourceRef: transition.sourceRef
    })),
    dataSourceRecords: core.dataSources.map((dataSource) => ({
      id: dataSource.id,
      name: dataSource.name || dataSource.target,
      kind: dataSource.kind,
      target: dataSource.target,
      contract: dataSource.contract || null,
      sourceRef: dataSource.sourceRef
    })),
    resourceRecords: core.resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      kind: resource.kind,
      owner: resource.owner,
      source: resource.source,
      dispose: resource.dispose,
      kernelVisible: resource.kernelVisible !== false,
      sourceRef: resource.sourceRef
    })),
    hydrationPolicyRecords: core.hydrationPolicies.map((policy) => ({
      id: policy.id,
      kind: policy.kind,
      policy: policy.policy || null,
      mode: policy.mode || null,
      boundary: policy.boundary || null,
      insularHydration: policy.insularHydration === null ? null : Boolean(policy.insularHydration),
      ownerOperation: policy.ownerOperation,
      sourceRef: policy.sourceRef
    }))
  };
}

function sourceMapForOrchestration(core) {
  const supportedTypes = new Set([
    'RmtTemplateDeclaration',
    'RmtSurfaceDeclaration',
    'RmtStateDeclaration',
    'RmtSelectorDeclaration',
    'RmtDataSourceDeclaration',
    'RmtActionDeclaration',
    'RmtValidationDeclaration',
    'RmtValidationFieldClause',
    'RmtValidationTargetClause',
    'RmtTransitionDeclaration',
    'RmtTransitionTriggerClause',
    'RmtTransitionFromClause',
    'RmtTransitionToClause',
    'RmtEffectStatement',
    'RmtPortalDeclaration',
    'RmtOverlayDeclaration',
    'RmtResourceDeclaration',
    'RmtEventBinding',
    'RmtHydrationPolicy',
    'RmtIsolationPolicy'
  ]);
  return core.sourceMap.filter((entry) => supportedTypes.has(entry.nodeType));
}

function sourceMapForKernel(core) {
  const supportedTypes = new Set([
    'RmtTemplateDeclaration',
    'RmtSurfaceDeclaration',
    'RmtLaneDeclaration',
    'RmtLifecycleStatement',
    'RmtStateDeclaration',
    'RmtSelectorDeclaration',
    'RmtDataSourceDeclaration',
    'RmtActionDeclaration',
    'RmtValidationDeclaration',
    'RmtValidationFieldClause',
    'RmtValidationTargetClause',
    'RmtTransitionDeclaration',
    'RmtTransitionTriggerClause',
    'RmtTransitionFromClause',
    'RmtTransitionToClause',
    'RmtResourceDeclaration',
    'RmtEventBinding',
    'RmtHydrationPolicy',
    'RmtIsolationPolicy'
  ]);
  return core.sourceMap.filter((entry) => supportedTypes.has(entry.nodeType));
}

function cloneJson(value, fallback) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return fallback;
  }
}

function schedulerToken(value, fallback = 'default') {
  const token = String(value || fallback)
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return token || fallback;
}

function endpointNameForSchedule(schedule) {
  const lane = schedulerToken(schedule && schedule.lane, 'default');
  const surfaceScope = schedule && schedule.scope && schedule.scope.surface
    ? schedulerToken(schedule.scope.surface.replace(/^surface:/, ''), 'document')
    : 'document';
  return `xtend.maraca.kernel.${lane}.${surfaceScope}`;
}

function scopeNameForSchedule(schedule) {
  const scope = schedule && schedule.scope || {};
  if (scope.surface) return String(scope.surface);
  if (scope.template) return String(scope.template);
  return 'rmt.document';
}

function createRuntimeScheduleRecord(documentId, kind, ref, lane, sourceRef = null, options = {}) {
  const token = schedulerToken(ref, kind);
  const operation = options.operation || `operation:xtend.rmt/${kind}/${token}`;
  const endpointScope = options.scope || `orchestration:${documentId}`;
  return {
    schedule: {
      id: `schedule:${documentId}/${kind}/${token}`,
      lane,
      endpointName: `xtend.rmt.kernel.${kind}.${token}`,
      scope: endpointScope,
      scopeRecord: {
        orchestration: kind,
        ref: String(ref || token),
        template: `template:${documentId}`
      },
      operationRefs: [operation],
      sourceRefs: sourceRef ? [sourceRef] : [],
      policy: {
        lane,
        budgetClass: lane === 'idle' || lane === 'background' || lane === 'diagnostics' ? 'background' : 'interactive',
        fallback: lane === 'idle' || lane === 'background' || lane === 'diagnostics' ? 'idle-timeout' : 'microtask'
      }
    },
    fiber: {
      id: `fiber:${documentId}/${kind}/${token}`,
      kind,
      op: kind,
      lane,
      operation,
      endpointName: `xtend.rmt.kernel.${kind}.${token}`,
      target: options.target || {
        kind,
        ref: String(ref || token)
      },
      source: options.source || {
        kind: 'rmt-record',
        ref: String(ref || token)
      },
      sourceRef
    }
  };
}

function lifecycleRuntimeKind(operation) {
  if (!operation || operation.kind !== 'lifecycle') return null;
  if (operation.op === 'hydrate') return 'hydration';
  if (operation.op === 'prewarm') return 'surface.prewarm';
  if (operation.op === 'mount' || operation.op === 'resume' || operation.op === 'suspend' || operation.op === 'invalidate') return 'surface-lifecycle';
  if (operation.op === 'dispose' || operation.op === 'detach' || operation.op === 'reattach' || operation.op === 'recycle') return 'surface-lifecycle';
  return 'surface-lifecycle';
}

function createKernelSchedulerPlan(core) {
  const records = core && core.kernelRecords || null;
  if (!records) return null;
  const documentId = core && core.manifest && core.manifest.documentId || 'rmt.document';
  const operationSourceRefs = new Map(toArray(records.lifecycleRecords).map((record) => [record.id, record.sourceRef || null]));
  const scheduleByOperation = new Map();
  const schedules = toArray(records.schedules).map((schedule) => {
    const endpointName = endpointNameForSchedule(schedule);
    toArray(schedule.operationRefs).forEach((operationRef) => {
      if (operationRef) scheduleByOperation.set(operationRef, endpointName);
    });
    return {
      id: schedule.id,
      lane: schedule.lane || 'default',
      endpointName,
      scope: scopeNameForSchedule(schedule),
      scopeRecord: schedule.scope || {},
      operationRefs: toArray(schedule.operationRefs),
      sourceRefs: toArray(schedule.operationRefs).map((operationRef) => operationSourceRefs.get(operationRef)).filter(Boolean),
      policy: {
        lane: schedule.lane || 'default',
        budgetClass: schedule.lane === 'idle' ? 'background' : 'interactive',
        fallback: schedule.lane === 'idle' ? 'idle-timeout' : 'animation-frame'
      }
    };
  });
  const orchestrationSchedules = [
    {
      id: `schedule:${documentId}/orchestration/render`,
      lane: 'visible',
      endpointName: 'xtend.maraca.kernel.orchestration.render',
      scope: `orchestration:${documentId}`,
      scopeRecord: {
        orchestration: 'render',
        template: `template:${documentId}`
      },
      operationRefs: ['operation:xtend.maraca/orchestration/render'],
      sourceRefs: [],
      policy: {
        lane: 'visible',
        budgetClass: 'interactive',
        fallback: 'animation-frame'
      }
    },
    {
      id: `schedule:${documentId}/orchestration/action`,
      lane: 'user-blocking',
      endpointName: 'xtend.maraca.kernel.orchestration.action',
      scope: `orchestration:${documentId}`,
      scopeRecord: {
        orchestration: 'action',
        template: `template:${documentId}`
      },
      operationRefs: ['operation:xtend.maraca/orchestration/action'],
      sourceRefs: [],
      policy: {
        lane: 'user-blocking',
        budgetClass: 'interactive',
        fallback: 'microtask'
      }
    },
    {
      id: `schedule:${documentId}/orchestration/event`,
      lane: 'user-blocking',
      endpointName: 'xtend.maraca.kernel.orchestration.event',
      scope: `orchestration:${documentId}`,
      scopeRecord: {
        orchestration: 'event',
        template: `template:${documentId}`
      },
      operationRefs: ['operation:xtend.maraca/orchestration/event'],
      sourceRefs: [],
      policy: {
        lane: 'user-blocking',
        budgetClass: 'interactive',
        fallback: 'microtask'
      }
    },
    {
      id: `schedule:${documentId}/orchestration/state-change`,
      lane: 'visible',
      endpointName: 'xtend.maraca.kernel.orchestration.state-change',
      scope: `orchestration:${documentId}`,
      scopeRecord: {
        orchestration: 'state-change',
        template: `template:${documentId}`
      },
      operationRefs: ['operation:xtend.maraca/orchestration/state-change'],
      sourceRefs: [],
      policy: {
        lane: 'visible',
        budgetClass: 'interactive',
        fallback: 'microtask'
      }
    }
  ];
  orchestrationSchedules.forEach((schedule) => {
    toArray(schedule.operationRefs).forEach((operationRef) => {
      if (operationRef) scheduleByOperation.set(operationRef, schedule.endpointName);
    });
  });
  schedules.push(...orchestrationSchedules);

  const runtimeRecords = [];
  toArray(core.actions).forEach((action) => {
    if (!action || !action.name) return;
    runtimeRecords.push(createRuntimeScheduleRecord(documentId, 'action', action.name, 'user-blocking', action.sourceRef, {
      operation: `operation:xtend.rmt/action/${action.name}`,
      source: { kind: 'action', ref: action.name }
    }));
  });
  toArray(core.validations).forEach((validation) => {
    if (!validation || !validation.name) return;
    toArray(validation.targets).forEach((target) => {
      if (!target || target.kind !== 'action' || !target.id) return;
      runtimeRecords.push(createRuntimeScheduleRecord(documentId, 'validation', `${validation.name}.${target.id}`, 'user-blocking', validation.sourceRef, {
        operation: `operation:xtend.rmt/validation/${validation.name}/${target.id}`,
        source: { kind: 'validation', ref: validation.name },
        target: { kind: 'action', ref: target.id }
      }));
    });
  });
  toArray(core.transitions).forEach((transition) => {
    if (!transition || !transition.name) return;
    runtimeRecords.push(createRuntimeScheduleRecord(documentId, 'surface-transition', transition.name, transition.lane || 'transition', transition.sourceRef, {
      operation: `operation:xtend.rmt/surface-transition/${transition.name}`,
      source: { kind: 'transition', ref: transition.name },
      target: { kind: 'transition', ref: transition.name }
    }));
  });
  toArray(core.events).filter((event) => event && event.primitive === true).forEach((event) => {
    const ref = event.id || event.event || 'event';
    runtimeRecords.push(createRuntimeScheduleRecord(documentId, 'event', ref, 'user-blocking', event.sourceRef, {
      operation: `operation:xtend.rmt/event/${ref}`,
      source: { kind: 'event', ref }
    }));
  });
  toArray(core.resources).forEach((resource) => {
    if (!resource || !resource.name) return;
    runtimeRecords.push(createRuntimeScheduleRecord(documentId, 'resource', resource.name, 'background', resource.sourceRef, {
      operation: `operation:xtend.rmt/resource/${resource.name}`,
      source: { kind: 'resource', ref: resource.name }
    }));
  });
  toArray(core.operations).forEach((operation) => {
    const kind = lifecycleRuntimeKind(operation);
    if (!kind) return;
    const target = operation.target && operation.target.ref || operation.id;
    const laneId = operation.scope && operation.scope.lane;
    const lane = toArray(core.lanes).find((entry) => entry.id === laneId);
    runtimeRecords.push(createRuntimeScheduleRecord(documentId, kind, `${target}.${operation.op}`, lane && lane.name || (operation.op === 'prewarm' ? 'background' : (kind === 'hydration' ? 'visible' : 'transition')), operation.sourceRef, {
      operation: operation.id,
      scope: scopeNameForSchedule({
        scope: operation.scope || {}
      }),
      source: operation.source || { kind: 'lifecycle', ref: operation.id }
    }));
  });
  ['hydration', 'render-patch', 'state-patch', 'telemetry'].forEach((kind) => {
    const lane = kind === 'telemetry' ? 'diagnostics' : 'visible';
    runtimeRecords.push(createRuntimeScheduleRecord(documentId, kind, 'document', lane, null, {
      operation: `operation:xtend.rmt/${kind}/document`,
      source: { kind: 'runtime', ref: `xtend.${kind}` }
    }));
  });
  runtimeRecords.forEach((record) => {
    if (!record || !record.schedule) return;
    schedules.push(record.schedule);
    toArray(record.schedule.operationRefs).forEach((operationRef) => {
      if (operationRef) scheduleByOperation.set(operationRef, record.schedule.endpointName);
    });
  });

  const fibers = toArray(records.fibers).map((fiber) => ({
    id: fiber.id,
    kind: fiber.kind || 'lifecycle',
    op: fiber.op || null,
    lane: fiber.lane || null,
    operation: fiber.operation || null,
    endpointName: scheduleByOperation.get(fiber.operation) || null,
    target: fiber.target || null,
    source: fiber.source || null,
    sourceRef: operationSourceRefs.get(fiber.operation) || null
  }));
  fibers.push(
    {
      id: `fiber:${documentId}/orchestration/render`,
      kind: 'orchestration',
      op: 'render',
      lane: 'visible',
      operation: 'operation:xtend.maraca/orchestration/render',
      endpointName: 'xtend.maraca.kernel.orchestration.render',
      target: {
        kind: 'orchestration',
        ref: 'render'
      },
      source: {
        kind: 'runtime',
        ref: 'xtend.maraca.renderer'
      },
      sourceRef: null
    },
    {
      id: `fiber:${documentId}/orchestration/action`,
      kind: 'orchestration',
      op: 'action',
      lane: 'user-blocking',
      operation: 'operation:xtend.maraca/orchestration/action',
      endpointName: 'xtend.maraca.kernel.orchestration.action',
      target: {
        kind: 'orchestration',
        ref: 'action'
      },
      source: {
        kind: 'runtime',
        ref: 'xtend.maraca.action-runtime'
      },
      sourceRef: null
    },
    {
      id: `fiber:${documentId}/orchestration/event`,
      kind: 'orchestration',
      op: 'event',
      lane: 'user-blocking',
      operation: 'operation:xtend.maraca/orchestration/event',
      endpointName: 'xtend.maraca.kernel.orchestration.event',
      target: {
        kind: 'orchestration',
        ref: 'event'
      },
      source: {
        kind: 'runtime',
        ref: 'xtend.maraca.event-runtime'
      },
      sourceRef: null
    },
    {
      id: `fiber:${documentId}/orchestration/state-change`,
      kind: 'orchestration',
      op: 'state-change',
      lane: 'visible',
      operation: 'operation:xtend.maraca/orchestration/state-change',
      endpointName: 'xtend.maraca.kernel.orchestration.state-change',
      target: {
        kind: 'orchestration',
        ref: 'state-change'
      },
      source: {
        kind: 'runtime',
        ref: 'xtend.maraca.state-runtime'
      },
      sourceRef: null
    }
  );
  runtimeRecords.forEach((record) => {
    if (record && record.fiber) fibers.push(record.fiber);
  });

  return {
    schema: 'xtend.rmt.kernel-scheduler-plan.v1',
    schedules,
    fibers,
    lanePolicies: Array.from(new Set(schedules.map((schedule) => schedule.lane))).sort().map((lane) => ({
      lane,
      queue: lane === 'idle' || lane === 'diagnostics' ? 'idle' : 'frame',
      fallback: lane === 'idle' || lane === 'diagnostics' ? 'timeout' : 'microtask'
    }))
  };
}

function createKernelOrchestrationArtifact(core) {
  if (!core || !core.kernelRecords) return null;
  const scheduler = createKernelSchedulerPlan(core);
  return {
    schema: 'xtend.rmt.kernel-orchestration.v1',
    records: cloneJson(core.kernelRecords, {
      schema: RMT_KERNEL_RECORDS_SCHEMA,
      schedules: [],
      fibers: []
    }),
    scheduler,
    diagnostics: [],
    sourceMap: sourceMapForKernel(core)
  };
}

function normalizeSelectorForStateRuntime(selector) {
  const from = selector && selector.from ? String(selector.from) : '';
  return {
    id: selector.id,
    from: from.startsWith('state.') || from.startsWith('selector.') ? from : `state.${from}`,
    clauses: selector.clauses,
    output: selector.output
  };
}

const UNSAFE_STATE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

function hasUnsafeStatePathSegment(path) {
  return String(path || '').split('.').filter(Boolean).some((part) => UNSAFE_STATE_PATH_SEGMENTS.has(part));
}

function statePathForReducer(target, states) {
  const expression = String(target || '').trim();
  const statePrefix = expression.startsWith('state.') ? expression.slice(6) : expression;
  const state = states
    .map((entry) => entry.id)
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .find((id) => statePrefix === id || statePrefix.startsWith(`${id}.`));

  if (!state) {
    return {
      state: null,
      path: '',
      target: expression
    };
  }

  const path = statePrefix === state ? '' : statePrefix.slice(state.length + 1);
  if (hasUnsafeStatePathSegment(path)) {
    return {
      state: null,
      path: '',
      target: expression
    };
  }

  return {
    state,
    path,
    target: expression
  };
}

function createActionReducerRecords(appPlatform) {
  const states = toArray(appPlatform && appPlatform.state);
  return toArray(appPlatform && appPlatform.actions).flatMap((action) => toArray(action.reducers).map((reducer, index) => {
    const target = statePathForReducer(reducer && reducer.target, states);
    const isRecipe = reducer && reducer.recipe;
    return {
      id: `reducer:${normalizeIdSegment(action.id)}/${index}`,
      action: action.id,
      target: target.target,
      state: target.state,
      path: target.path,
      recipe: isRecipe ? reducer.recipe : null,
      value: reducer && Object.prototype.hasOwnProperty.call(reducer, 'value') ? reducer.value : null,
      mode: isRecipe ? 'recipe' : target.path ? 'patch-path' : 'set-state'
    };
  }));
}

function eventActionToken(event) {
  const selector = String(event && (event.selector || event.target) || '');
  const match = selector.match(/\[data-action=(?:"([^"]+)"|'([^']+)'|([^\]]+))\]/u);
  if (match) return match[1] || match[2] || match[3] || '';
  const action = String(event && event.action || '').split('.').filter(Boolean).pop();
  return action || '';
}

function eventPayloadExpression(source) {
  const expression = String(source || '').trim();
  if (!expression) return '$detail';
  if (expression.startsWith('target.')) return `$target.${expression.slice(7)}`;
  if (expression.startsWith('currentTarget.')) return `$currentTarget.${expression.slice(14)}`;
  if (expression.startsWith('source.')) return `$source.${expression.slice(7)}`;
  if (expression.startsWith('detail.')) return `$detail.${expression.slice(7)}`;
  if (expression.startsWith('event.')) return `$event.${expression.slice(6)}`;
  if (expression.startsWith('surface.')) return `$metadata.${expression}`;
  return expression;
}

function eventPayloadBinding(event) {
  const mappings = toArray(event && event.payloadContract && event.payloadContract.mappings);
  if (mappings.length === 0) return '$detail';
  return mappings.reduce((payload, mapping) => {
    if (mapping && mapping.name) {
      payload[mapping.name] = eventPayloadExpression(mapping.source);
    }
    return payload;
  }, {});
}

function createEventBindingRecords(appPlatform) {
  const surfaceByEvent = new Map();
  toArray(appPlatform && appPlatform.surfaces).forEach((surface) => {
    toArray(surface.events).forEach((eventId) => {
      surfaceByEvent.set(eventId, surface);
    });
  });

  return toArray(appPlatform && appPlatform.events).map((event) => {
    const surface = surfaceByEvent.get(event.id) || null;
    const shouldDelegateCommand = event.event === 'xtend-command' && (event.target || event.selector);
    return {
      id: event.id,
      kind: 'dom',
      event: event.event,
      target: event.target || event.selector || '',
      closest: shouldDelegateCommand ? event.target || event.selector || null : null,
      component: surface && surface.component || '',
      surface: surface && surface.id || null,
      owner: event.owner || surface && surface.id || event.id,
      action: event.action,
      payload: eventPayloadBinding(event),
      payloadContract: event.payloadContract || null,
      governance: {
        capture: Boolean(event.options && event.options.capture),
        passive: Boolean(event.options && event.options.passive),
        once: Boolean(event.options && event.options.once),
        preventDefault: Boolean(event.options && event.options.preventDefault),
        stopPropagation: Boolean(event.options && event.options.stopPropagation),
        retarget: event.options && event.options.retarget || 'target'
      }
    };
  });
}

function createResourceRecords(appPlatform) {
  return toArray(appPlatform && appPlatform.resources).map((resource) => ({
    id: resource.id,
    kind: resource.kind,
    owner: resource.owner && (resource.owner.ref || resource.owner.id) || '',
    source: resource.source && (resource.source.target || resource.source.ref || resource.source) || null,
    importId: resource.adapter && resource.adapter.import || '',
    dispose: resource.dispose || null,
    adapter: resource.adapter || null
  }));
}

function createDataSourceRecords(appPlatform) {
  return toArray(appPlatform && appPlatform.dataSources).map((source) => ({
    id: source.id,
    kind: source.kind === 'endpoint' ? 'rest' : source.kind || 'host',
    endpoint: source.target || '',
    method: source.method || 'GET',
    adapter: source.kind === 'host' ? 'host' : '',
    contract: source.contract || null,
    resultPath: source.result || '',
    fallback: source.fallback || null
  }));
}

function firstSurfaceEvent(surface, eventBindings) {
  const eventIds = new Set(toArray(surface && surface.events));
  return eventBindings.find((event) => eventIds.has(event.id)) || null;
}

function cloneDescriptorValue(value) {
  if (Array.isArray(value)) return value.map((entry) => cloneDescriptorValue(entry));
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((record, [key, entry]) => {
      record[key] = cloneDescriptorValue(entry);
      return record;
    }, {});
  }
  return value;
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function hasOwn(record, field) {
  return Object.prototype.hasOwnProperty.call(record || {}, field);
}

function mergeDescriptorClasses(baseClass, extraClass) {
  if (typeof extraClass === 'undefined') return baseClass;
  if (typeof baseClass === 'undefined') return cloneDescriptorValue(extraClass);
  const classArray = (value) => Array.isArray(value)
    ? value
    : (typeof value === 'undefined' || value === null || value === '' ? [] : [value]);
  return [
    ...classArray(baseClass),
    ...classArray(extraClass)
  ];
}

function createChoiceMenuDescriptorChildren(template) {
  const modelSource = String(template.modelSource || template.source || '$model.choiceMenu').trim() || '$model.choiceMenu';
  const statePath = (field) => template[`${field}Source`] || `${modelSource}.${field}`;
  const selectPayloadField = String(template.selectPayloadField || template.payloadField || 'value').trim() || 'value';
  return [
    {
      type: 'element',
      tag: 'button',
      class: template.buttonClass || template.triggerClass || 'xtend-rmt-choice-menu-button',
      attributes: {
        id: template.buttonId || template.triggerId || 'choice-menu-button',
        type: 'button',
        'aria-haspopup': template.ariaHasPopup || 'menu',
        'aria-expanded': statePath('open'),
        'aria-pressed': { op: 'not-equals', left: statePath('activeToolAttr'), right: '' },
        'data-active-tool': statePath('activeToolAttr'),
        disabled: statePath('disabled')
      },
      command: {
        command: template.toggleCommand || template.command || 'rmt.choiceMenu.toggle',
        payload: template.togglePayload || { label: template.label || 'Choice menu' }
      },
      text: statePath('activeToolLabel')
    },
    {
      type: 'element',
      tag: 'div',
      class: template.optionsClass || template.menuClass || 'xtend-rmt-choice-menu-options',
      attributes: {
        id: template.optionsId || template.menuId || 'choice-menu-options',
        role: template.optionsRole || 'menu',
        hidden: { op: 'not', source: statePath('open') }
      },
      children: [
        {
          type: 'repeat',
          source: template.itemsSource || statePath('items'),
          key: template.itemKey || 'value',
          template: {
            type: 'element',
            tag: 'button',
            class: template.itemClass || 'xtend-rmt-choice-menu-item',
            attributes: {
              type: 'button',
              role: template.itemRole || 'menuitemradio',
              'data-tool-name': '$item.value',
              'aria-checked': { op: 'equals', left: statePath('activeTool'), right: '$item.value' }
            },
            command: {
              command: template.selectCommand || 'rmt.choiceMenu.select',
              payload: { [selectPayloadField]: '$item.value' }
            },
            text: '$item.label'
          }
        }
      ]
    }
  ];
}

function applyViewTemplateToDescriptor(descriptor, viewTemplate) {
  const template = objectValue(viewTemplate);
  if (!Object.keys(template).length) return descriptor;
  const attributes = objectValue(template.attributes || template.attrs);
  const properties = objectValue(template.properties || template.props);
  const styleTokens = objectValue(template.styleTokens || template.styleToken || template['style-token']);
  const next = {
    ...descriptor,
    attributes: {
      ...(descriptor.attributes || {}),
      ...cloneDescriptorValue(attributes)
    }
  };

  if (Object.keys(properties).length > 0) {
    next.properties = {
      ...(descriptor.properties || descriptor.props || {}),
      ...cloneDescriptorValue(properties)
    };
  }
  if (Object.keys(styleTokens).length > 0) {
    next.styleTokens = {
      ...(descriptor.styleTokens || {}),
      ...cloneDescriptorValue(styleTokens)
    };
  }
  if (hasOwn(template, 'class') || hasOwn(template, 'className') || hasOwn(template, 'classes')) {
    next.class = mergeDescriptorClasses(descriptor.class || descriptor.className || descriptor.classes, template.class || template.className || template.classes);
  }
  if (hasOwn(template, 'part') || hasOwn(template, 'parts')) {
    const partArray = (value) => Array.isArray(value)
      ? value
      : (typeof value === 'undefined' || value === null || value === '' ? [] : [value]);
    next.parts = [
      ...partArray(descriptor.parts),
      ...partArray(cloneDescriptorValue(template.part || template.parts))
    ];
  }
  if (template.type === 'choice-menu' || template.kind === 'choice-menu') {
    next.primitive = 'choice-menu';
    next.children = createChoiceMenuDescriptorChildren(template);
    delete next.text;
    return next;
  }
  if (hasOwn(template, 'text')) {
    next.text = cloneDescriptorValue(template.text);
  }
  if (hasOwn(template, 'children') || hasOwn(template, 'nodes') || hasOwn(template, 'content')) {
    next.children = toArray(cloneDescriptorValue(template.children || template.nodes || template.content));
    delete next.text;
  }
  if (hasOwn(template, 'child') || hasOwn(template, 'root')) {
    next.children = toArray(cloneDescriptorValue(template.child || template.root));
    delete next.text;
  }
  return next;
}

function createRenderDescriptor(surface, eventBindings, initialStates = new Map()) {
  const component = surface.component || 'section';
  const event = firstSurfaceEvent(surface, eventBindings);
  const actionToken = eventActionToken(event);
  const literal = (value) => ({ op: 'literal', value });
  const initialState = initialStates.get(surface.source) || {};
  const hasStateField = (field) => Object.prototype.hasOwnProperty.call(initialState, field);
  const bindStateField = (field) => `$model.${surface.source}.${field}`;
  const statePath = (field) => `$model.${surface.source}.${field}`;
  const itemPath = (field) => `$item.${field}`;
  const itemText = (...fields) => fields
    .filter(Boolean)
    .reduceRight((fallback, field) => ({
      op: 'fallback',
      source: itemPath(field),
      fallback
    }), '');
  const createTextSpan = (className, field, fallbackFields = []) => ({
    type: 'element',
    tag: 'span',
    class: className,
    text: fallbackFields.length > 0 ? itemText(field, ...fallbackFields) : itemPath(field)
  });
  const createRepeatedItemTemplate = () => ({
    type: 'element',
    tag: 'button',
    attributes: {
      type: literal('button'),
      'data-action': itemText('action'),
      'data-record-id': itemText('id'),
      'data-id': itemText('id'),
      'data-kind': itemText('kind'),
      'aria-selected': itemPath('selected')
    },
    class: ['xtend-maraca-item', {
      'is-selected': '$item.selected',
      'is-active': '$item.active',
      'is-muted': '$item.muted'
    }],
    children: [
      {
        type: 'component',
        tag: 'x-icon',
        component: 'x-icon',
        class: 'xtend-maraca-item-icon',
        attributes: {
          name: itemText('icon', 'kind'),
          decorative: literal(true),
          size: literal('1rem')
        }
      },
      createTextSpan('xtend-maraca-item-title', 'title', ['name', 'label']),
      createTextSpan('xtend-maraca-item-subtitle', 'subtitle', ['description', 'kind'])
    ]
  });
  const createRepeatedActionTemplate = () => ({
    type: 'element',
    tag: 'button',
    attributes: {
      type: literal('button'),
      'data-action': itemText('action', 'id'),
      'data-id': itemText('id'),
      'data-record-id': itemText('recordId')
    },
    class: ['xtend-maraca-action', {
      'is-primary': '$item.primary',
      'is-danger': '$item.danger',
      'is-disabled': '$item.disabled'
    }],
    children: [
      {
        type: 'component',
        tag: 'x-icon',
        component: 'x-icon',
        class: 'xtend-maraca-action-icon',
        attributes: {
          name: itemText('icon', 'action', 'id'),
          decorative: literal(true),
          size: literal('1rem')
        }
      },
      createTextSpan('xtend-maraca-action-label', 'label', ['title', 'id'])
    ]
  });
  const createRepeatedRecordTemplate = (collectionName = 'records') => ({
    type: 'element',
    tag: collectionName === 'messages' ? 'article' : 'div',
    attributes: {
      'data-id': itemText('id', 'title', 'label'),
      'data-role': itemText('role', 'kind')
    },
    class: ['xtend-maraca-record', `xtend-maraca-${collectionName}-record`, {
      'is-selected': '$item.selected',
      'is-active': '$item.active',
      'is-streaming': '$item.streaming',
      'is-error': '$item.error'
    }],
    children: [
      createTextSpan('xtend-maraca-record-title', 'title', ['label', 'name', 'role']),
      {
        type: 'when',
        when: '$item.segments',
        then: {
          type: 'rich-text',
          source: '$item.segments'
        },
        else: createTextSpan('xtend-maraca-record-text', 'text', ['body', 'content', 'snippet'])
      }
    ]
  });
  const attributes = {
    'data-maraca-surface': literal(surface.id),
    'data-rmt-surface': literal(surface.id),
    'data-rmt-component': literal(component),
    'data-maraca-kind': literal(surface.kind || 'surface'),
    id: surface.source ? `$model.${surface.source}.id` : undefined,
    tone: surface.source ? `$model.${surface.source}.tone` : undefined
  };

  if (component === 'x-status' && surface.source) attributes.type = `$model.${surface.source}.tone`;
  if (component === 'x-button' && surface.source) attributes.variant = `$model.${surface.source}.tone`;
  if (component === 'x-status' && surface.source) attributes.message = `$model.${surface.source}.text`;
  if (component === 'x-status' && surface.source) attributes.state = `$model.${surface.source}.tone`;
  if (component === 'x-button' && surface.source) attributes.label = `$model.${surface.source}.text`;

  [
    'hidden',
    'name',
    'value',
    'placeholder',
    'label',
    'required',
    'disabled',
    'invalid',
    'rows',
    'density',
    'width',
    'height',
    'src',
    'poster',
    'title',
    'subtitle',
    'kind',
    'count',
    'selected',
    'controls',
    'open',
    'accept',
    'multiple',
    'active',
    'minimized',
    'maximized',
    'resizable',
    'draggable',
    'modal',
    'pinned',
    'collapsed',
    'collapsible',
    'collapsable',
    'closable',
    'pinnable',
    'placement',
    'mode',
    'layout',
    'command'
  ].forEach((field) => {
    if (surface.source && hasStateField(field)) attributes[field] = bindStateField(field);
  });
  const mappedStateAttributes = {
    surfaceId: 'surface-id',
    managerId: 'manager-id',
    stateKey: 'state-key',
    restoreKey: 'restore-key',
    persistenceMode: 'persistence-mode',
    restorePolicy: 'restore-policy',
    surfaceLoadingPolicy: 'surface-loading-policy',
    surfaceSkeleton: 'surface-skeleton',
    surfaceHydrationTimeout: 'surface-hydration-timeout',
    routeLifecyclePolicy: 'route-lifecycle-policy',
    modalPolicy: 'modal-policy',
    layoutEngine: 'layout-engine',
    surfaceLayoutGap: 'surface-layout-gap',
    surfaceLayoutSnap: 'surface-layout-snap',
    ariaLabel: 'aria-label',
    ariaBusy: 'aria-busy',
    iconName: 'icon-name',
    iconPack: 'icon-pack',
    initialX: 'initial-x',
    initialY: 'initial-y',
    initialWidth: 'initial-width',
    initialHeight: 'initial-height',
    boundsMode: 'bounds-mode',
    boundsScope: 'bounds-scope',
    responsiveMode: 'responsive-mode',
    submitCommand: 'submit-command',
    submitOnEnter: 'submit-on-enter'
  };
  Object.entries(mappedStateAttributes).forEach(([field, attribute]) => {
    if (surface.source && hasStateField(field)) attributes[attribute] = bindStateField(field);
  });
  if ((component === 'x-surface-window' || component === 'x-side-panel' || component === 'x-surface-region') && !attributes['surface-id']) {
    attributes['surface-id'] = literal(surface.id);
  }
  if (component === 'x-surface-window' || component === 'x-side-panel' || component === 'x-surface-region') {
    attributes['data-surface-id'] = literal(surface.id);
  }
  if ((component === 'x-surface-window' || component === 'x-side-panel' || component === 'x-surface-region') && surface.bounds) {
    if (!attributes['initial-x'] && surface.bounds.x !== undefined) attributes['initial-x'] = literal(surface.bounds.x);
    if (!attributes['initial-y'] && surface.bounds.y !== undefined) attributes['initial-y'] = literal(surface.bounds.y);
    if (!attributes['initial-width'] && surface.bounds.width !== undefined) attributes['initial-width'] = literal(surface.bounds.width);
    if (!attributes['initial-height'] && surface.bounds.height !== undefined) attributes['initial-height'] = literal(surface.bounds.height);
    if (!attributes['initial-min-width'] && surface.bounds.minWidth !== undefined) attributes['initial-min-width'] = literal(surface.bounds.minWidth);
    if (!attributes['initial-min-height'] && surface.bounds.minHeight !== undefined) attributes['initial-min-height'] = literal(surface.bounds.minHeight);
    if (!attributes['initial-max-width'] && surface.bounds.maxWidth !== undefined) attributes['initial-max-width'] = literal(surface.bounds.maxWidth);
    if (!attributes['initial-max-height'] && surface.bounds.maxHeight !== undefined) attributes['initial-max-height'] = literal(surface.bounds.maxHeight);
    if (!attributes['bounds-mode'] && surface.bounds.mode) attributes['bounds-mode'] = literal(surface.bounds.mode);
    if (!attributes['bounds-scope'] && surface.bounds.scope) attributes['bounds-scope'] = literal(surface.bounds.scope);
  }
  if (component === 'x-surface-window' && surface.bounds) {
    if (!attributes.draggable) attributes.draggable = literal(true);
    if (!attributes.resizable) attributes.resizable = literal(true);
  }
  if (component === 'x-side-panel') {
    if (!attributes.placement) attributes.placement = literal(surface.placement || 'right');
    if (!attributes.mode) attributes.mode = literal(surface.mode || 'docked');
    if (!attributes.resizable) attributes.resizable = literal(true);
  }
  if (surface.source && hasStateField('minLength')) attributes.minlength = bindStateField('minLength');
  if (surface.source && hasStateField('maxLength')) attributes.maxlength = bindStateField('maxLength');
  if (surface.source && hasStateField('field')) attributes['data-field'] = bindStateField('field');
  if (surface.source && hasStateField('inputType')) attributes.type = bindStateField('inputType');
  if (surface.source && hasStateField('mediaType')) attributes.type = bindStateField('mediaType');

  if (actionToken) {
    attributes['data-action'] = actionToken;
    attributes['data-label'] = component === 'x-button' && surface.source && hasStateField('text')
      ? bindStateField('text')
      : actionToken;
    if (!attributes.command && event && event.event === 'xtend-command') {
      attributes.command = actionToken;
    }
  }

  const children = [];
  if (surface.source && hasStateField('label')) {
    children.push({
      type: 'element',
      tag: 'span',
      attributes: {
        slot: literal('label')
      },
      text: bindStateField('label')
    });
  }
  if (component === 'x-select' && surface.source && Array.isArray(initialState.options)) {
    children.push({
      type: 'repeat',
      source: `$model.${surface.source}.options`,
      key: '$item',
      template: {
        type: 'element',
        tag: 'option',
        attributes: {
          value: '$item'
        },
        text: '$item'
      }
    });
  }
  if (surface.source && Array.isArray(initialState.stats)) {
    children.push({
      type: 'element',
      tag: 'div',
      class: 'xtend-maraca-stats',
      children: [{
        type: 'repeat',
        source: statePath('stats'),
        key: itemText('id', 'label', 'name'),
        template: {
          type: 'element',
          tag: 'span',
          class: 'xtend-maraca-stat',
          attributes: {
            'data-id': itemText('id', 'label', 'name')
          },
          children: [
            createTextSpan('xtend-maraca-stat-value', 'value', ['count']),
            createTextSpan('xtend-maraca-stat-label', 'label', ['name'])
          ]
        }
      }]
    });
  }
  if (surface.source && Array.isArray(initialState.items)) {
    children.push({
      type: 'repeat',
      source: statePath('items'),
      key: itemText('id', 'title', 'label'),
      template: createRepeatedItemTemplate()
    });
  }
  if (surface.source && Array.isArray(initialState.metadata)) {
    children.push({
      type: 'element',
      tag: 'dl',
      class: 'xtend-maraca-metadata',
      children: [{
        type: 'repeat',
        source: statePath('metadata'),
        key: itemText('id', 'name', 'label'),
        template: {
          type: 'fragment',
          children: [
            {
              type: 'element',
              tag: 'dt',
              class: 'xtend-maraca-metadata-label',
              text: itemText('label', 'name', 'id')
            },
            {
              type: 'element',
              tag: 'dd',
              class: 'xtend-maraca-metadata-value',
              text: itemText('value', 'text')
            }
          ]
        }
      }]
    });
  }
  if (surface.source && Array.isArray(initialState.actions)) {
    children.push({
      type: 'element',
      tag: 'div',
      class: 'xtend-maraca-actions',
      children: [{
        type: 'repeat',
        source: statePath('actions'),
        key: itemText('id', 'action', 'label'),
        template: createRepeatedActionTemplate()
      }]
    });
  }
  ['messages', 'conversations', 'sources', 'entries', 'rows'].forEach((field) => {
    if (!surface.source || !Array.isArray(initialState[field])) return;
    children.push({
      type: 'repeat',
      source: statePath(field),
      key: itemText('id', 'title', 'label'),
      template: createRepeatedRecordTemplate(field)
    });
  });
  if (surface.source && Array.isArray(initialState.segments)) {
    children.push({
      type: 'rich-text',
      source: statePath('segments')
    });
  }
  if (component === 'x-surface-window' && surface.kind === 'player' && surface.source && hasStateField('src')) {
    children.unshift({
      type: 'component',
      tag: 'x-player',
      component: 'x-player',
      class: 'xtend-maraca-managed-player',
      attributes: {
        src: statePath('src'),
        poster: statePath('poster'),
        title: statePath('title'),
        subtitle: statePath('subtitle'),
        kind: statePath('kind'),
        type: statePath('mediaType'),
        controls: statePath('controls')
      }
    });
  }

  const descriptor = {
    type: 'component',
    id: `surface:${surface.id}`,
    surface: surface.id,
    component,
    tag: component,
    key: surface.key || surface.id,
    attributes,
    parts: ['surface', surface.kind || 'surface'],
    styleTokens: {
      surface: literal(surface.id),
      portal: literal(surface.portal || 'portal.app')
    },
    bindings: toArray(surface.events),
    ...(children.length > 0 ? { children } : {})
  };
  if (children.length === 0 && surface.source && hasStateField('text')) {
    descriptor.text = bindStateField('text');
  }
  return applyViewTemplateToDescriptor(descriptor, initialState.viewTemplate || initialState.view || initialState.template);
}

function createCssPlan(appPlatform) {
  return {
    mode: 'layout-tokens',
    tokenPrefix: '--xtend',
    themeGeneration: false,
    surfaces: toArray(appPlatform && appPlatform.surfaces).map((surface) => ({
      id: surface.id,
      component: surface.component || null,
      portal: surface.portal || null,
      bounds: surface.bounds || null,
      tokens: {
        surface: surface.id,
        kind: surface.kind || 'surface'
      }
    }))
  };
}

const SUPPORTED_ORCHESTRATION_HYDRATION_MODES = Object.freeze([
  'runtime_render',
  'hydrate_prerendered',
  'server_prerender_hydrate',
  'server_prerender_resume',
  'worker_prerender_hydrate',
  'worker_prerender_resume',
  'warm',
  'prewarm',
  'visible',
  'idle',
  'lazy',
  'eager',
  'open',
  'route',
  'managed_subtree',
  'observe_only',
  'manual',
  'none',
  'insular'
]);

function laneNameForOperation(core, operation) {
  const laneId = operation && operation.scope && operation.scope.lane;
  const lane = toArray(core && core.lanes).find((entry) => entry.id === laneId);
  return lane && lane.name || null;
}

function operationPolicies(core, operationId) {
  return toArray(core && core.hydrationPolicies).filter((policy) => policy.ownerOperation === operationId);
}

function derivedHydrationPolicy(core, operation, policies) {
  const explicit = policies.find((policy) => policy.kind === 'hydration' && (policy.policy || policy.mode || policy.insularHydration !== null));
  if (explicit && explicit.policy) return explicit.policy;
  const lane = laneNameForOperation(core, operation);
  if (lane && ['visible', 'idle', 'lazy', 'eager', 'open', 'route'].includes(lane)) return lane;
  if (operation && operation.op === 'prewarm') return 'prewarm';
  if (operation && operation.op === 'hydrate') return 'visible';
  if (operation && operation.op === 'mount') return 'managed_subtree';
  return 'manual';
}

function derivedHydrationMode(operation, policies) {
  const resumability = policies.find((policy) => policy.kind === 'resumability' && policy.mode);
  if (resumability && resumability.mode) return resumability.mode;
  const explicit = policies.find((policy) => policy.kind === 'hydration' && policy.mode);
  if (explicit && explicit.mode) return explicit.mode;
  if (operation && operation.op === 'prewarm') return 'prewarm';
  if (operation && operation.op === 'resume') return 'server_prerender_resume';
  if (operation && operation.op === 'hydrate') return 'hydrate_prerendered';
  if (operation && operation.op === 'mount') return 'runtime_render';
  return 'manual';
}

function isWorkerPrerenderHydrationMode(modeOrPolicy) {
  const signal = String(modeOrPolicy || '').trim();
  return signal === 'worker_prerender_hydrate' || signal === 'worker_prerender_resume';
}

function isUiCoprocessorHydrationSignal(modeOrPolicy, operation) {
  const signal = String(modeOrPolicy || '').trim();
  return signal === 'worker_prerender_hydrate'
    || signal === 'prewarm'
    || signal === 'warm'
    || signal === 'idle'
    || Boolean(operation && operation.op === 'prewarm');
}

function isClientDeterminedCoprocessorSource(operation) {
  const sourceKind = String(operation && operation.source && operation.source.kind || '').trim().toLowerCase();
  const sourceRef = String(operation && operation.sourceRef || operation && operation.source && operation.source.ref || '').trim().toLowerCase();
  if (!sourceKind && !sourceRef) return true;
  if (['server', 'http', 'endpoint', 'ssr', 'host-effect', 'effect', 'action'].includes(sourceKind)) return false;
  if (/^(server|ssr|http|https|endpoint|host-effect|effect|action)[.:/]/u.test(sourceRef)) return false;
  return true;
}

function createUiCoprocessorFabricSchedule(operation, mode, policy, workerPrerenderRequested) {
  const metadata = {
    uiCoprocessor: true,
    hydrationKey: `operation:${operation.id}`,
    generation: `operation:${operation.id}:client`,
    clientDetermined: true
  };
  if (workerPrerenderRequested) {
    return {
      lane: 'background',
      fiberKind: 'component.worker_prerender_hydrate',
      scheduleRef: 'component.worker_prerender_hydrate',
      endpointName: 'xtendrmt.component.worker_prerender_hydrate',
      metadata
    };
  }
  if ((operation && operation.op === 'prewarm') || mode === 'prewarm' || policy === 'prewarm') {
    return {
      lane: 'background',
      fiberKind: 'component.prewarm',
      scheduleRef: 'component.prewarm.prepare',
      endpointName: 'xtendrmt.component.prewarm',
      metadata
    };
  }
  if (mode === 'warm' || policy === 'warm' || mode === 'idle' || policy === 'idle') {
    return {
      lane: 'idle',
      fiberKind: 'component.prewarm',
      scheduleRef: 'component.warm.reentry',
      endpointName: 'xtendrmt.component.prewarm',
      metadata
    };
  }
  return null;
}

function createWorkerPrerenderCapability(records) {
  const workerRecords = toArray(records).filter((record) => record && record.workerPrerender && record.workerPrerender.requested === true);
  return {
    schema: 'xtend.rmt.app-hydration-capability.v1',
    id: 'workerPrerender',
    mode: 'worker_prerender_hydrate',
    supported: true,
    degraded: false,
    status: workerRecords.length > 0 ? 'supported' : 'available',
    requested: workerRecords.length > 0,
    recordCount: workerRecords.length,
    runtimeHooks: [
      'createRmtWorkerPrerenderRuntime',
      'hydrateResponse',
      'commitTrustedHtml'
    ],
    fabric: {
      lane: 'background',
      fiberKind: 'component.worker_prerender_hydrate',
      scheduleRef: 'component.worker_prerender_hydrate',
      endpointName: 'xtendrmt.component.worker_prerender_hydrate'
    },
    validation: {
      generationRequired: true,
      staleResponses: 'discard',
      hostServices: 'blocked-in-worker-path',
      trustedDomCommit: 'main-thread'
    }
  };
}

function createUiCoprocessorCapability(records) {
  const eligibleRecords = toArray(records).filter((record) => record && record.uiCoprocessorEligible === true);
  return {
    schema: 'xtend.rmt.app-hydration-capability.v1',
    id: 'uiCoprocessor',
    mode: 'ui_compute',
    supported: true,
    degraded: false,
    status: eligibleRecords.length > 0 ? 'available' : 'not_requested',
    requested: eligibleRecords.length > 0,
    recordCount: eligibleRecords.length,
    runtimeHooks: [
      'requestUiCompute',
      'dispatchUiComputeEnvelope',
      'hydrateResponse'
    ],
    fabric: {
      lanes: ['background', 'idle'],
      scheduleRefs: ['component.worker_prerender_hydrate', 'component.prewarm.prepare', 'component.warm.reentry', 'diagnostics.snapshot']
    },
    validation: {
      generationRequired: true,
      staleResponses: 'discard',
      hostServices: 'blocked-in-worker-path',
      trustedDomCommit: 'main-thread',
      stateOwnership: 'main-thread',
      ssrRoundtripCount: 0
    }
  };
}

function createHydrationPlan(core, appPlatform) {
  const surfaceByCoreId = new Map(toArray(core && core.surfaces)
    .filter((surface) => surface && surface.primitive === true)
    .map((surface) => [surface.id, surface]));
  const appSurfaceByCoreId = new Map(toArray(core && core.surfaces)
    .filter((surface) => surface && surface.primitive === true)
    .map((surface) => [surface.id, toArray(appPlatform && appPlatform.surfaces).find((entry) => entry.id === surface.name) || null]));
  const records = [];
  const diagnostics = [];
  const insularIslands = [];

  toArray(core && core.operations).forEach((operation) => {
    if (!operation || operation.kind !== 'lifecycle') return;
    const coreSurface = surfaceByCoreId.get(operation.scope && operation.scope.surface);
    const appSurface = appSurfaceByCoreId.get(operation.scope && operation.scope.surface);
    if (!coreSurface || !appSurface) return;
    const policies = operationPolicies(core, operation.id);
    const isolation = policies.find((policy) => policy.kind === 'isolation') || null;
    const hydrationPolicy = policies.find((policy) => policy.kind === 'hydration') || null;
    const insular = policies.some((policy) => policy.kind === 'hydration' && policy.insularHydration === true);
    const mode = derivedHydrationMode(operation, policies);
    const workerPrerenderRequested = isWorkerPrerenderHydrationMode(mode)
      || policies.some((policyRecord) => policyRecord.kind === 'hydration' && isWorkerPrerenderHydrationMode(policyRecord.policy));
    const policy = workerPrerenderRequested
      ? 'worker_prerender_hydrate'
      : derivedHydrationPolicy(core, operation, policies);
    const clientDetermined = isClientDeterminedCoprocessorSource(operation);
    const uiCoprocessorEligible = clientDetermined && (
      isUiCoprocessorHydrationSignal(mode, operation)
      || isUiCoprocessorHydrationSignal(policy, operation)
      || policies.some((policyRecord) => policyRecord.kind === 'hydration' && (
        isUiCoprocessorHydrationSignal(policyRecord.policy, operation)
        || isUiCoprocessorHydrationSignal(policyRecord.mode, operation)
      ))
    );
    const fabricSchedule = uiCoprocessorEligible
      ? createUiCoprocessorFabricSchedule(operation, mode, policy, workerPrerenderRequested)
      : null;
    const record = {
      id: `hydration:${normalizeIdSegment(appSurface.id)}/${normalizeIdSegment(operation.op)}`,
      surface: appSurface.id,
      component: appSurface.component || null,
      operation: operation.id,
      op: operation.op,
      lane: fabricSchedule ? fabricSchedule.lane : (laneNameForOperation(core, operation) || (operation.op === 'prewarm' ? 'background' : 'visible')),
      policy,
      mode,
      scheduleRef: `operation:${operation.id.slice('operation:'.length)}`,
      fabricSchedule,
      endpointName: `xtend.rmt.kernel.${lifecycleRuntimeKind(operation) || 'surface-lifecycle'}.${schedulerToken(`${operation.target && operation.target.ref || appSurface.id}.${operation.op}`)}`,
      target: operation.target || null,
      source: operation.source || null,
      clientDetermined,
      uiCoprocessorEligible,
      explicitPolicy: Boolean(hydrationPolicy || isolation),
      insularHydration: insular,
      workerPrerender: {
        schema: 'xtend.rmt.app-hydration-worker-prerender.v1',
        requested: workerPrerenderRequested,
        supported: true,
        degraded: false,
        status: workerPrerenderRequested ? 'supported' : 'not_requested',
        mode: 'worker_prerender_hydrate',
        runtimeHook: 'hydrateResponse',
        trustedDomCommit: 'main-thread',
        staleResponses: 'discard-by-generation',
        hostServices: 'blocked-in-worker-path',
        fabric: fabricSchedule
      },
      uiCoprocessor: {
        schema: 'xtend.rmt.app-hydration-ui-coprocessor.v1',
        eligible: uiCoprocessorEligible,
        supported: true,
        status: uiCoprocessorEligible ? 'eligible' : 'not_eligible',
        mode: 'ui_compute',
        runtimeHook: 'requestUiCompute',
        trustedDomCommit: 'main-thread',
        stateOwnership: 'main-thread',
        staleResponses: 'discard-by-generation',
        ssrRoundtripCount: 0,
        clientDetermined,
        fabric: fabricSchedule,
        pwaAttachment: {
          manifestRef: null,
          cacheMode: 'attachment-point-only',
          serviceWorkerControlled: false,
          offlineEligible: false
        }
      },
      isolation: {
        boundary: isolation && isolation.boundary || 'public-contract-only',
        mode: isolation && isolation.mode || 'public-contract-only',
        channels: ['attributes', 'properties', 'events', 'slots', 'css-parts', 'css-tokens'],
        shadowRootAccess: false
      },
      sourceRefs: [operation.sourceRef].concat(policies.map((policyRecord) => policyRecord.sourceRef)).filter(Boolean)
    };
    records.push(record);
    if (insular) {
      insularIslands.push({
        id: `island:${normalizeIdSegment(appSurface.id)}`,
        surface: appSurface.id,
        component: appSurface.component || null,
        rootId: appSurface.key || appSurface.id,
        hydrationRecord: record.id,
        schedulerLane: record.lane,
        ownershipMode: 'hydrate_existing',
        isolation: record.isolation
      });
    }
  });

  toArray(appPlatform && appPlatform.surfaces).forEach((surface) => {
    if (!records.some((record) => record.surface === surface.id)) {
      diagnostics.push({
        code: 'rmt.app_orchestration.hydration_policy_missing',
        severity: 'warning',
        message: `Surface ${surface.id} has no explicit lifecycle hydration record; runtime will use component lazy loading policy.`,
        surface: surface.id
      });
    }
  });

  return {
    schema: 'xtend.rmt.app-hydration-plan.v1',
    supportedModes: SUPPORTED_ORCHESTRATION_HYDRATION_MODES.slice(),
    defaultMode: 'runtime_render',
    records,
    capabilities: [
      createWorkerPrerenderCapability(records),
      createUiCoprocessorCapability(records)
    ],
    workerPrerender: createWorkerPrerenderCapability(records),
    uiCoprocessor: createUiCoprocessorCapability(records),
    insularIslands,
    diagnostics,
    security: {
      componentIsolation: 'public-contract-only',
      shadowRootAccess: false,
      trustedDomBoundaryRequired: true
    }
  };
}

const VALIDATION_CAPABLE_COMPONENTS = new Set(['x-input', 'x-select', 'x-textarea', 'x-form']);
const SUPPORTED_SURFACE_TRANSITION_EFFECTS = Object.freeze([
  'fade',
  'crossfade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'scale',
  'none'
]);

function createValidationSurfaceIndex(appPlatform) {
  const selectorToState = new Map(toArray(appPlatform && appPlatform.selectors).map((selector) => [selector.id, selector.from]));
  const byState = new Map();
  toArray(appPlatform && appPlatform.surfaces).forEach((surface) => {
    if (!surface || !surface.source) return;
    const stateId = selectorToState.get(surface.source);
    if (!stateId) return;
    byState.set(stateId, surface);
  });
  return byState;
}

function createValidationPlan(core, appPlatform) {
  const validations = toArray(appPlatform && appPlatform.validations);
  const stateIds = new Set(toArray(appPlatform && appPlatform.state).map((state) => state.id));
  const actionIds = new Set(toArray(appPlatform && appPlatform.actions).map((action) => action.id));
  const validationIds = new Set(validations.map((validation) => validation.id));
  const surfaceByState = createValidationSurfaceIndex(appPlatform);
  const diagnostics = [];
  const groups = validations.map((validation) => {
    const fields = toArray(validation.fields).map((field) => {
      const surface = surfaceByState.get(field.state) || null;
      if (!stateIds.has(field.state)) {
        diagnostics.push({
          code: 'rmt.form_validation.field_state_missing',
          severity: 'warning',
          message: `Validation ${validation.id} references unknown state ${field.state}.`,
          validation: validation.id,
          field: field.state
        });
      }
      if (!field.message) {
        diagnostics.push({
          code: 'rmt.form_validation.message_missing',
          severity: 'warning',
          message: `Validation field ${field.state} needs a user-safe message.`,
          validation: validation.id,
          field: field.state
        });
      }
      if (!surface || !VALIDATION_CAPABLE_COMPONENTS.has(surface.component)) {
        diagnostics.push({
          code: 'rmt.form_validation.component_capability_missing',
          severity: 'warning',
          message: `Validation field ${field.state} has no known public validity-capable component surface.`,
          validation: validation.id,
          field: field.state,
          component: surface && surface.component || null
        });
      }
      return {
        state: field.state,
        ref: field.ref,
        surface: surface && surface.id || null,
        component: surface && surface.component || null,
        rules: toArray(field.rules),
        message: field.message || ''
      };
    });
    toArray(validation.targets).forEach((target) => {
      if (target.kind === 'action' && !actionIds.has(target.id)) {
        diagnostics.push({
          code: 'rmt.form_validation.target_action_missing',
          severity: 'warning',
          message: `Validation ${validation.id} references unknown action ${target.id}.`,
          validation: validation.id,
          action: target.id
        });
      }
    });
    toArray(validation.includes).forEach((include) => {
      if (!validationIds.has(include)) {
        diagnostics.push({
          code: 'rmt.form_validation.include_missing',
          severity: 'warning',
          message: `Validation ${validation.id} includes unknown validation group ${include}.`,
          validation: validation.id,
          include
        });
      }
    });
    const sourceRecord = toArray(core && core.validations).find((entry) => (
      entry.name === validation.id || entry.id === primitiveRecordId('validation', validation.id)
    ));
    return {
      id: validation.id,
      name: validation.id,
      mode: validation.mode || 'blocking',
      fields,
      includes: toArray(validation.includes),
      targets: toArray(validation.targets),
      sourceRef: sourceRecord && sourceRecord.sourceRef ? sourceRecord.sourceRef : null
    };
  });

  const statePatches = [];
  const actionGates = [];
  groups.forEach((group) => {
    group.targets.forEach((target) => {
      if (!target || target.kind !== 'action' || !target.id) return;
      const commandState = stateIds.has(target.id) ? target.id : null;
      if (!commandState) {
        diagnostics.push({
          code: 'rmt.form_validation.command_state_missing',
          severity: 'warning',
          message: `Validation target action ${target.id} has no matching command state for disabled-state patching.`,
          validation: group.id,
          action: target.id
        });
      } else {
        statePatches.push({
          id: `validation-patch:${normalizeIdSegment(group.id)}/${normalizeIdSegment(target.id)}/disabled`,
          group: group.id,
          targetState: commandState,
          path: 'disabled',
          invalidValue: true,
          validValue: false,
          strategy: 'attribute-sync'
        });
      }
      actionGates.push({
        id: `validation-gate:${normalizeIdSegment(group.id)}/${normalizeIdSegment(target.id)}`,
        group: group.id,
        action: target.id,
        mode: group.mode || 'blocking',
        commandState,
        operation: `operation:xtend.rmt/validation/${group.id}/${target.id}`,
        endpointName: `xtend.rmt.kernel.validation.${schedulerToken(`${group.id}.${target.id}`)}`
      });
    });
  });

  return {
    schema: RMT_FORM_VALIDATION_SCHEMA,
    defaultMode: 'blocking',
    supportedRules: ['required', 'email', 'minLength', 'maxLength', 'pattern'],
    groups,
    fields: groups.flatMap((group) => group.fields.map((field) => ({ ...field, group: group.id }))),
    actionGates,
    statePatches,
    schedulerTargets: actionGates.map((gate) => ({
      id: `validation-scheduler:${normalizeIdSegment(gate.group)}/${normalizeIdSegment(gate.action)}`,
      kind: 'validation',
      operation: gate.operation,
      endpointName: gate.endpointName,
      group: gate.group,
      target: {
        kind: 'action',
        ref: gate.action
      }
    })),
    diagnostics,
    telemetry: {
      trace: 'dom-event -> validation-action-gate -> action',
      customEvents: [
        'xtend-maraca:validation-boot',
        'xtend-maraca:validation-change',
        'xtend-maraca:validation-blocked',
        'xtend-maraca:validation-error'
      ]
    },
    security: {
      componentIsolation: 'public-contract-only',
      shadowRootAccess: false,
      htmlSinks: 'forbidden'
    },
    sourceMap: core.sourceMap.filter((entry) => [
      'RmtValidationDeclaration',
      'RmtValidationFieldClause',
      'RmtValidationTargetClause'
    ].includes(entry.nodeType))
  };
}

function createSurfaceTransitionPlan(core, appPlatform) {
  const transitions = toArray(appPlatform && appPlatform.transitions);
  const actionIds = new Set(toArray(appPlatform && appPlatform.actions).map((action) => action.id));
  const surfaceIds = new Set(toArray(appPlatform && appPlatform.surfaces).map((surface) => surface.id));
  const supportedEffects = new Set(SUPPORTED_SURFACE_TRANSITION_EFFECTS);
  const diagnostics = [];
  const records = transitions.map((transition) => {
    const trigger = transition.trigger || { kind: 'action', id: '' };
    const effect = transition.effect || 'fade';
    const durationMs = Number.isFinite(Number(transition.durationMs))
      ? Math.max(0, Math.min(Math.round(Number(transition.durationMs)), 3000))
      : 240;
    if (!trigger.id || trigger.kind !== 'action' || !actionIds.has(trigger.id)) {
      diagnostics.push({
        code: 'rmt.surface_transition.trigger_action_missing',
        severity: 'warning',
        message: `Transition ${transition.id} references unknown trigger action ${trigger.id || '(missing)'}.`,
        transition: transition.id,
        action: trigger.id || ''
      });
    }
    if (!supportedEffects.has(effect)) {
      diagnostics.push({
        code: 'rmt.surface_transition.effect_unknown',
        severity: 'warning',
        message: `Transition ${transition.id} uses unsupported effect ${effect}.`,
        transition: transition.id,
        effect
      });
    }
    if (!Number.isFinite(Number(transition.durationMs)) || Number(transition.durationMs) < 0 || Number(transition.durationMs) > 3000) {
      diagnostics.push({
        code: 'rmt.surface_transition.duration_invalid',
        severity: 'warning',
        message: `Transition ${transition.id} has an invalid durationMs value.`,
        transition: transition.id,
        durationMs: transition.durationMs
      });
    }
    toArray(transition.from).concat(toArray(transition.to)).forEach((surfaceId) => {
      if (!surfaceIds.has(surfaceId)) {
        diagnostics.push({
          code: 'rmt.surface_transition.surface_missing',
          severity: 'warning',
          message: `Transition ${transition.id} references unknown surface ${surfaceId}.`,
          transition: transition.id,
          surface: surfaceId
        });
      }
    });
    const sourceRecord = toArray(core && core.transitions).find((entry) => (
      entry.name === transition.id || entry.id === primitiveRecordId('transition', transition.id)
    ));
    return {
      id: transition.id,
      name: transition.id,
      trigger: {
        kind: trigger.kind || 'action',
        id: trigger.id || '',
        ref: trigger.ref || (trigger.id ? primitiveRecordId(trigger.kind || 'action', trigger.id) : '')
      },
      from: toArray(transition.from),
      to: toArray(transition.to),
      effect,
      durationMs,
      easing: transition.easing || 'ease',
      lane: transition.lane || 'transition',
      operation: transition.operation || `operation:xtend.rmt/surface-transition/${transition.id}`,
      endpointName: transition.endpointName || `xtend.rmt.kernel.surface-transition.${schedulerToken(transition.id)}`,
      sourceRef: sourceRecord && sourceRecord.sourceRef ? sourceRecord.sourceRef : null,
      isolation: {
        componentIsolation: 'public-contract-only',
        shadowRootAccess: false,
        channels: ['attributes', 'properties', 'events', 'slots', 'css-parts', 'css-tokens']
      }
    };
  });

  return {
    schema: RMT_SURFACE_TRANSITION_SCHEMA,
    supportedEffects: SUPPORTED_SURFACE_TRANSITION_EFFECTS.slice(),
    defaultEffect: 'fade',
    transitions: records,
    effectCounts: records.reduce((counts, transition) => {
      counts[transition.effect] = (counts[transition.effect] || 0) + 1;
      return counts;
    }, {}),
    durationRange: {
      min: records.length ? Math.min(...records.map((transition) => transition.durationMs)) : 0,
      max: records.length ? Math.max(...records.map((transition) => transition.durationMs)) : 0
    },
    schedulerTargets: records.map((transition) => ({
      id: `surface-transition-scheduler:${normalizeIdSegment(transition.id)}`,
      kind: 'surface-transition',
      operation: transition.operation,
      endpointName: transition.endpointName,
      transition: transition.id,
      lane: transition.lane,
      target: {
        kind: 'transition',
        ref: transition.id
      }
    })),
    telemetry: {
      trace: 'action -> reducer -> state-patch -> surface-transition -> render-patch',
      customEvents: [
        'xtend-maraca:surface-transition-start',
        'xtend-maraca:surface-transition-complete',
        'xtend-maraca:surface-transition-cancel',
        'xtend-maraca:surface-transition-fallback',
        'xtend-maraca:surface-transition-error'
      ]
    },
    security: {
      componentIsolation: 'public-contract-only',
      shadowRootAccess: false,
      htmlSinks: 'forbidden'
    },
    diagnostics,
    sourceMap: core.sourceMap.filter((entry) => [
      'RmtTransitionDeclaration',
      'RmtTransitionTriggerClause',
      'RmtTransitionFromClause',
      'RmtTransitionToClause'
    ].includes(entry.nodeType))
  };
}

function createRuntimeGraph(core, appPlatform, eventBindings, resources, validationPlan = null, transitionPlan = null) {
  const nodes = [];
  const edges = [];
  toArray(appPlatform && appPlatform.state).forEach((state) => nodes.push({ id: `state:${state.id}`, kind: 'state', ref: state.id }));
  toArray(appPlatform && appPlatform.selectors).forEach((selector) => {
    nodes.push({ id: `selector:${selector.id}`, kind: 'selector', ref: selector.id });
    if (selector.from) edges.push({ from: `state:${selector.from}`, to: `selector:${selector.id}`, kind: 'state-selector' });
  });
  toArray(appPlatform && appPlatform.surfaces).forEach((surface) => {
    nodes.push({ id: `surface:${surface.id}`, kind: 'surface', ref: surface.id, component: surface.component || null });
    if (surface.source) edges.push({ from: `selector:${surface.source}`, to: `surface:${surface.id}`, kind: 'selector-surface' });
  });
  toArray(appPlatform && appPlatform.actions).forEach((action) => nodes.push({ id: `action:${action.id}`, kind: 'action', ref: action.id }));
  eventBindings.forEach((event) => {
    nodes.push({ id: `event:${event.id}`, kind: 'event', ref: event.id, target: event.target || null });
    if (event.action) edges.push({ from: `event:${event.id}`, to: `action:${event.action}`, kind: 'event-action' });
    if (event.surface) edges.push({ from: `surface:${event.surface}`, to: `event:${event.id}`, kind: 'surface-event' });
  });
  toArray(validationPlan && validationPlan.groups).forEach((group) => {
    nodes.push({ id: `validation:${group.id}`, kind: 'validation', ref: group.id });
    toArray(group.fields).forEach((field) => {
      if (field.state) edges.push({ from: `state:${field.state}`, to: `validation:${group.id}`, kind: 'state-validation' });
    });
    toArray(group.targets).forEach((target) => {
      if (target && target.kind === 'action' && target.id) edges.push({ from: `validation:${group.id}`, to: `action:${target.id}`, kind: 'validation-action-gate' });
    });
  });
  toArray(transitionPlan && transitionPlan.transitions).forEach((transition) => {
    nodes.push({ id: `transition:${transition.id}`, kind: 'surface-transition', ref: transition.id, effect: transition.effect });
    if (transition.trigger && transition.trigger.kind === 'action' && transition.trigger.id) {
      edges.push({ from: `action:${transition.trigger.id}`, to: `transition:${transition.id}`, kind: 'action-transition-trigger' });
    }
    toArray(transition.from).forEach((surfaceId) => {
      edges.push({ from: `surface:${surfaceId}`, to: `transition:${transition.id}`, kind: 'transition-exit-surface' });
    });
    toArray(transition.to).forEach((surfaceId) => {
      edges.push({ from: `transition:${transition.id}`, to: `surface:${surfaceId}`, kind: 'transition-enter-surface' });
    });
  });
  resources.forEach((resource) => {
    nodes.push({ id: `resource:${resource.id}`, kind: 'resource', ref: resource.id, owner: resource.owner || null });
    if (resource.owner) edges.push({ from: resource.owner, to: `resource:${resource.id}`, kind: 'owner-resource' });
  });
  return {
    schema: 'xtend.rmt.app-runtime-graph.v1',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  };
}

function createPatchPlan(appPlatform, reducers, renderDescriptors, validationPlan = null, transitionPlan = null) {
  const surfaceBySource = new Map(toArray(appPlatform && appPlatform.surfaces).map((surface) => [surface.source, surface]));
  const descriptorBySurface = new Map(toArray(renderDescriptors).map((descriptor) => [descriptor.surface, descriptor]));
  const transitionsByAction = new Map();
  toArray(transitionPlan && transitionPlan.transitions).forEach((transition) => {
    const actionId = transition.trigger && transition.trigger.kind === 'action' ? transition.trigger.id : '';
    if (!actionId) return;
    if (!transitionsByAction.has(actionId)) transitionsByAction.set(actionId, []);
    transitionsByAction.get(actionId).push(transition);
  });
  const plan = {
    schema: 'xtend.rmt.app-patch-plan.v1',
    defaultStrategy: 'attribute-sync',
    strategies: ['attribute-sync', 'property-sync', 'slot-patch', 'css-token-sync', 'surface-transition', 'structured-rerender'],
    reducers: reducers.map((reducer) => {
      const surface = surfaceBySource.get(reducer.state) || null;
      const descriptor = surface ? descriptorBySurface.get(surface.id) : null;
      const transitions = toArray(transitionsByAction.get(reducer.action)).filter((transition) => {
        const surfaceId = surface && surface.id;
        return reducer.path === 'hidden' && surfaceId && (toArray(transition.from).includes(surfaceId) || toArray(transition.to).includes(surfaceId));
      });
      return {
        reducer: reducer.id,
        action: reducer.action,
        state: reducer.state,
        path: reducer.path || '',
        surface: surface && surface.id || null,
        component: surface && surface.component || null,
        descriptor: descriptor && descriptor.id || null,
        strategy: transitions.length > 0 ? 'surface-transition' : (surface ? 'attribute-sync' : 'structured-rerender'),
        transition: transitions[0] && transitions[0].id || null,
        isolation: 'public-contract-only'
      };
    })
  };
  plan.validation = toArray(validationPlan && validationPlan.statePatches).map((patch) => ({
    ...patch,
    isolation: 'public-contract-only'
  }));
  plan.transitions = toArray(transitionPlan && transitionPlan.transitions).map((transition) => ({
    id: `transition-patch:${normalizeIdSegment(transition.id)}`,
    transition: transition.id,
    trigger: transition.trigger,
    from: toArray(transition.from),
    to: toArray(transition.to),
    strategy: 'surface-transition',
    operation: transition.operation,
    endpointName: transition.endpointName,
    isolation: 'public-contract-only'
  }));
  return plan;
}

function surfaceManagerIdFromPortalRoot(root) {
  const text = String(root || '');
  const dataSurfaceMatch = text.match(/data-maraca-surface\s*=\s*(?:"([^"]+)"|'([^']+)')/u);
  if (dataSurfaceMatch) return dataSurfaceMatch[1] || dataSurfaceMatch[2] || '';
  return '';
}

function managerSlotForSurface(surface) {
  const component = String(surface && surface.component || '').toLowerCase();
  const kind = String(surface && surface.kind || '').toLowerCase();
  if (component === 'x-side-panel' || kind === 'side-panel' || kind === 'panel') return 'panels';
  if (kind === 'overlay' || kind === 'lightbox' || kind === 'toast' || kind === 'popover') return 'overlays';
  return 'windows';
}

function withManagerSlot(descriptor, surface) {
  return {
    ...descriptor,
    attributes: {
      ...(descriptor.attributes || {}),
      slot: { op: 'literal', value: managerSlotForSurface(surface) }
    }
  };
}

function createRenderRoot(appPlatform, renderDescriptors) {
  const surfaces = toArray(appPlatform && appPlatform.surfaces);
  const surfaceById = new Map(surfaces.map((surface) => [surface.id, surface]));
  const managerSurfaces = surfaces.filter((surface) => surface && surface.component === 'x-surface-manager');
  if (managerSurfaces.length === 0) {
    return {
      type: 'fragment',
      children: renderDescriptors
    };
  }

  const managerIds = new Set(managerSurfaces.map((surface) => surface.id));
  const managerByPortal = new Map();
  toArray(appPlatform && appPlatform.portals).forEach((portal) => {
    const managerId = surfaceManagerIdFromPortalRoot(portal && portal.root);
    if (managerId && managerIds.has(managerId)) managerByPortal.set(portal.id, managerId);
  });

  if (managerByPortal.size === 0) {
    return {
      type: 'fragment',
      children: renderDescriptors
    };
  }

  const descriptorBySurface = new Map(renderDescriptors.map((descriptor) => [descriptor.surface, descriptor]));
  const managedChildren = new Map();
  const managedSurfaceIds = new Set();
  renderDescriptors.forEach((descriptor) => {
    const surface = surfaceById.get(descriptor.surface);
    const managerId = surface && managerByPortal.get(surface.portal);
    if (!surface || !managerId || managerId === surface.id) return;
    const list = managedChildren.get(managerId) || [];
    list.push(withManagerSlot(descriptor, surface));
    managedChildren.set(managerId, list);
    managedSurfaceIds.add(surface.id);
  });

  return {
    type: 'fragment',
    children: renderDescriptors
      .filter((descriptor) => !managedSurfaceIds.has(descriptor.surface))
      .map((descriptor) => {
        const children = managedChildren.get(descriptor.surface);
        if (!children || children.length === 0) return descriptor;
        return {
          ...descriptor,
          children: [
            ...toArray(descriptor.children),
            ...children
          ]
        };
      })
      .filter((descriptor) => descriptorBySurface.has(descriptor.surface))
  };
}

function createHostContracts() {
  return {
    schema: 'xtend.rmt.app-host-contracts.v1',
    requiredCapabilities: [
      'scheduler.scheduleEndpoint',
      'dom.resolveTarget',
      'component.ensure',
      'formValidation.evaluate',
      'component.checkValidity',
      'component.reportValidity',
      'surfaceTransition.run',
      'xstate.write',
      'uiEffects.resolve',
      'telemetry.publish',
      'diagnostics.redact'
    ],
    adapters: {
      browser: 'xtend.maraca.browser-host-adapter.v1',
      server: 'xtend.rmt.server-host-adapter.v1',
      worker: 'xtend.rmt.worker-host-adapter.v1',
      mfe: 'xtend.rmt.mfe-host-adapter.v1'
    },
    security: {
      componentIsolation: 'public-contract-only',
      privateInternals: false,
      shadowRootAccess: false
    }
  };
}

function createTelemetryPlan() {
  return {
    schema: 'xtend.rmt.app-telemetry-plan.v1',
    correlation: {
      idFormat: 'xtend-trace:<document>:<flow>:<counter>',
      propagatesThrough: ['event', 'action', 'resource', 'reducer', 'state-patch', 'render-patch', 'hydration', 'surface-transition']
    },
    customEvents: [
      'xtend-maraca:kernel-boot',
      'xtend-maraca:kernel-schedule',
      'xtend-maraca:kernel-fiber',
      'xtend-maraca:kernel-error',
      'xtend-maraca:hydration-start',
      'xtend-maraca:hydration-complete',
      'xtend-maraca:hydration-error',
      'xtend-maraca:insular-hydration',
      'xtend-maraca:render-patch',
      'xtend-maraca:state-change',
      'xtend-maraca:validation-boot',
      'xtend-maraca:validation-change',
      'xtend-maraca:validation-blocked',
      'xtend-maraca:validation-error',
      'xtend-maraca:surface-transition-start',
      'xtend-maraca:surface-transition-complete',
      'xtend-maraca:surface-transition-cancel',
      'xtend-maraca:surface-transition-fallback',
      'xtend-maraca:surface-transition-error',
      'xtend-maraca:telemetry'
    ],
    diagnostics: {
      redaction: 'payload-html-secret-token-password-stack',
      rawHtml: false,
      secrets: false
    }
  };
}

function createOrchestrationDiagnostics(appPlatform, eventBindings) {
  const diagnostics = [];
  const portalIds = new Set(toArray(appPlatform && appPlatform.portals).map((portal) => portal.id));
  const surfaceIds = new Set(toArray(appPlatform && appPlatform.surfaces).map((surface) => surface.id));

  eventBindings.forEach((event) => {
    if (!event.payloadContract || toArray(event.payloadContract.required).length === 0) {
      diagnostics.push({
        code: 'rmt.app_orchestration.event_payload_contract_missing',
        severity: 'warning',
        message: `Event ${event.id} hat keinen vollstaendigen Payload Contract.`,
        event: event.id
      });
    }
    if (!event.target) {
      diagnostics.push({
        code: 'rmt.app_orchestration.event_target_missing',
        severity: 'warning',
        message: `Event ${event.id} hat kein materialisierbares Target.`,
        event: event.id
      });
    }
  });

  toArray(appPlatform && appPlatform.resources).forEach((resource) => {
    if (!resource.owner) {
      diagnostics.push({
        code: 'rmt.app_orchestration.resource_owner_missing',
        severity: 'warning',
        message: `Resource ${resource.id} hat keinen Owner.`,
        resource: resource.id
      });
    }
  });

  toArray(appPlatform && appPlatform.surfaces).forEach((surface) => {
    if (surface.portal && !portalIds.has(surface.portal)) {
      diagnostics.push({
        code: 'rmt.app_orchestration.portal_unresolved',
        severity: 'warning',
        message: `Surface ${surface.id} referenziert ein unbekanntes Portal ${surface.portal}.`,
        surface: surface.id,
        portal: surface.portal
      });
    }
    toArray(surface.resources).forEach((resourceId) => {
      const owner = toArray(appPlatform.resources).find((resource) => resource.id === resourceId);
      const ownerRef = owner && owner.owner && (owner.owner.id || owner.owner.ref);
      if (ownerRef && owner.owner.kind === 'surface' && !surfaceIds.has(owner.owner.id)) {
        diagnostics.push({
          code: 'rmt.app_orchestration.resource_owner_unresolved',
          severity: 'warning',
          message: `Resource ${resourceId} referenziert eine unbekannte Surface ${ownerRef}.`,
          resource: resourceId
        });
      }
    });
  });

  return diagnostics;
}

function createRmtAppOrchestrationArtifacts(core) {
  if (!core || !core.appPlatform) return null;

  const appPlatform = core.appPlatform;
  const eventBindings = createEventBindingRecords(appPlatform);
  const reducers = createActionReducerRecords(appPlatform);
  const resources = createResourceRecords(appPlatform);
  const dataSources = createDataSourceRecords(appPlatform);
  const effectsByAction = new Map();
  toArray(core.effects).forEach((effect) => {
    [effect && effect.actionRef, effect && effect.action].filter(Boolean).forEach((key) => {
      const list = effectsByAction.get(key) || [];
      list.push(effect);
      effectsByAction.set(key, list);
    });
  });
  const dataSourceForAction = (action) => {
    const actionEffects = (effectsByAction.get(action.id) || []).concat(effectsByAction.get(action.name) || []);
    const fetchEffect = actionEffects.find((effect) => {
      return effect
        && (effect.kind === 'fetch' || effect.kind === 'datasource')
        && effect.source
        && effect.source.kind === 'dataSource'
        && effect.source.ref;
    });
    return fetchEffect && fetchEffect.source && (fetchEffect.source.target || String(fetchEffect.source.ref || '').replace(/^dataSource:/u, '')) || '';
  };
  const initialStates = new Map(toArray(appPlatform.state).map((state) => [state.id, state.initial || {}]));
  const renderDescriptors = toArray(appPlatform.surfaces).map((surface) => createRenderDescriptor(surface, eventBindings, initialStates));
  const renderRoot = createRenderRoot(appPlatform, renderDescriptors);
  const hydration = createHydrationPlan(core, appPlatform);
  const validation = createValidationPlan(core, appPlatform);
  const transitions = createSurfaceTransitionPlan(core, appPlatform);
  const runtimeGraph = createRuntimeGraph(core, appPlatform, eventBindings, resources, validation, transitions);
  const patchPlan = createPatchPlan(appPlatform, reducers, renderDescriptors, validation, transitions);
  const telemetry = createTelemetryPlan();

  return {
    schema: RMT_APP_ORCHESTRATION_SCHEMA,
    workpackage: RMT_APP_ORCHESTRATION_WORKPACKAGE,
    sourceSyntax: 'rmt-vnext',
    runtimeOrder: ['kernel', 'state', 'resource', 'validation', 'transition', 'action', 'event', 'surface', 'renderer'],
    kernel: createKernelOrchestrationArtifact(core),
    state: {
      states: toArray(appPlatform.state),
      selectors: toArray(appPlatform.selectors).map(normalizeSelectorForStateRuntime),
      reducers
    },
    actions: {
      actions: toArray(appPlatform.actions).map((action) => ({
        id: action.id,
        inputs: action.inputs,
        statusState: action.status && action.status.path || '',
        datasource: dataSourceForAction(action),
        reducers: action.reducers,
        emits: action.emits,
        effects: toArray(action.effects)
      })),
      dataSources,
      effects: toArray(core.effects).map((effect) => ({
        id: effect.id,
        kind: effect.kind || 'side-effect',
        action: effect.action || null,
        source: effect.source || null
      })),
      resources
    },
    resources,
    events: eventBindings,
    surfaces: toArray(appPlatform.surfaces),
    portals: toArray(appPlatform.portals),
    overlays: toArray(appPlatform.overlays),
    render: {
      mode: 'dom-descriptor',
      descriptors: renderDescriptors,
      root: renderRoot
    },
    hydration,
    validation,
    transitions,
    runtimeGraph,
    hostContracts: createHostContracts(),
    patchPlan,
    css: createCssPlan(appPlatform),
    security: {
      htmlSinks: 'forbidden',
      trustedDomBoundaryRequired: true,
      componentIsolation: 'public-contract-only',
      isolationChannels: ['attributes', 'properties', 'events', 'slots', 'css-parts', 'css-tokens'],
      shadowRootAccess: false
    },
    observability: telemetry,
    telemetry,
    diagnostics: createOrchestrationDiagnostics(appPlatform, eventBindings).concat(hydration.diagnostics).concat(validation.diagnostics).concat(transitions.diagnostics),
    sourceMap: sourceMapForOrchestration(core)
  };
}

class VNextCompiler {
  constructor(ast, options = {}) {
    this.ast = ast;
    const documentId = options.documentId || findFirstNamedDeclaration(ast) || 'rmt.vnext.document';
    this.core = createCoreDocument({
      documentId,
      namespace: options.namespace || namespaceFromDocumentId(documentId)
    });
    this.diagnostics = [];
    this.semanticGraph = options.semanticGraph || null;
  }

  addDiagnostic(diagnostic) {
    if (diagnostic && diagnostic.code) this.diagnostics.push(diagnostic);
  }

  compile() {
    const body = Array.isArray(this.ast && this.ast.body) ? this.ast.body : [];

    body.forEach((node) => {
      if (isImportNode(node)) {
        this.compileImport(node);
      } else if (isTemplateNode(node)) {
        this.compileTemplate(node);
      } else if (isRemoteSurfaceNode(node)) {
        this.compileRemoteSurface(node);
      } else if (isSurfaceNode(node)) {
        this.compileSurface(node, null);
      } else if (PRIMITIVE_DECLARATION_TYPES.has(node.type)) {
        this.compilePrimitiveDeclaration(node, null);
      }
    });

    this.finalizePrimitiveLowering();
    return this.core;
  }

  compileImport(node) {
    const id = `import:${this.core.imports.length}`;
    return addRecord(this.core, 'imports', {
      id,
      path: node.path,
      mode: node.mode || (node.path && node.path.includes('*') ? 'static_glob' : 'static_file')
    }, node, 'RmtImportDeclaration');
  }

  compileTemplate(node) {
    const name = node.name || `template.${this.core.templates.length}`;
    const normalizedName = normalizeIdSegment(name);
    const templateId = `template:${normalizedName}`;
    const surfaceRefs = [];
    const templateRecord = addRecord(this.core, 'templates', {
      id: templateId,
      name,
      mode: 'orchestration',
      surfaceRefs
    }, node, 'RmtTemplateDeclaration');

    (Array.isArray(node.body) ? node.body : []).forEach((child) => {
      if (isImportNode(child)) {
        this.compileImport(child);
      } else if (isSurfaceNode(child)) {
        const surface = this.compileSurface(child, {
          templateName: name,
          templateId,
          templatePath: normalizedName
        });
        if (surface) surfaceRefs.push(surface.id);
      } else if (PRIMITIVE_DECLARATION_TYPES.has(child.type)) {
        this.compilePrimitiveDeclaration(child, {
          templateName: name,
          templateId,
          templatePath: normalizedName
        });
      }
    });

    templateRecord.surfaceRefs = surfaceRefs;
    return templateRecord;
  }

  compileSurface(node, templateContext) {
    const name = node.name || `surface.${this.core.surfaces.length}`;
    const surfaceSegment = normalizeIdSegment(name);
    const scopePath = templateContext ? `${templateContext.templatePath}/${surfaceSegment}` : surfaceSegment;
    const surfaceId = templateContext ? `surface:${scopePath}` : `surface:${surfaceSegment}`;
    const laneRefs = [];
    const eventRefs = [];
    const primitive = this.isPrimitiveSurface(node);
    const sourceNode = getPrimitiveBodyNode(node, 'RmtSurfaceSourceClause');
    const repeatNode = getPrimitiveBodyNode(node, 'RmtSurfaceRepeatClause');
    const keyNode = getPrimitiveBodyNode(node, 'RmtSurfaceKeyClause');
    const portalNode = getPrimitiveBodyNode(node, 'RmtSurfacePortalClause');
    const boundsNode = getPrimitiveBodyNode(node, 'RmtSurfaceBoundsClause');
    const preserveNode = getPrimitiveBodyNode(node, 'RmtSurfacePreserveClause');
    const destroyNode = getPrimitiveBodyNode(node, 'RmtSurfaceDestroyClause');
    const declaredKind = primitive ? getPrimitiveHeaderValue(node, 'kind') || 'named_surface' : name === 'root' ? 'root' : 'named_surface';
    const record = {
      id: surfaceId,
      name,
      kind: declaredKind,
      type: lowerSurfaceKindToRuntimeType(declaredKind, name === 'root' ? 'region' : 'window'),
      laneRefs
    };

    if (templateContext) {
      record.scope = {
        template: templateContext.templateId
      };
    }

    if (primitive) {
      record.primitive = true;
      record.eventRefs = eventRefs;
      record.component = getPrimitiveHeaderValue(node, 'component') || null;
      record.source = sourceNode ? compilePrimitiveSourceReference({
        kind: sourceNode.kind,
        value: sourceNode.ref
      }) : null;
      record.repeat = repeatNode ? {
        source: compilePrimitiveSourceReference(repeatNode.source)
      } : null;
      record.key = keyNode ? keyNode.path || null : null;
      record.portal = portalNode ? {
        target: portalNode.path,
        ref: primitiveRecordId('portal', portalNode.path)
      } : null;
      record.bounds = boundsNode ? compileSurfaceBoundsClause(boundsNode, this) : null;
      record.preserve = preserveNode ? {
        text: preserveNode.text || '',
        tokens: toArray(preserveNode.tokens)
      } : null;
      record.resourceRefs = destroyNode ? this.compileDestroyResourceRefs(destroyNode) : [];
    }

    const surfaceRecord = addRecord(this.core, 'surfaces', record, node, 'RmtSurfaceDeclaration');

    (Array.isArray(node.body) ? node.body : []).forEach((child) => {
      if (isLaneNode(child)) {
        const lane = this.compileLane(child, {
          ...templateContext,
          surfaceName: name,
          surfaceId,
          surfacePath: scopePath
        });
        if (lane) laneRefs.push(lane.id);
        return;
      }

      if (primitive && child && child.type === 'RmtEventBinding') {
        const event = this.compileSurfaceEvent(child, {
          ...templateContext,
          surfaceName: name,
          surfaceId,
          surfacePath: scopePath
        });
        if (event) eventRefs.push(event.id);
      }
    });

    surfaceRecord.laneRefs = laneRefs;
    if (primitive) {
      surfaceRecord.eventRefs = eventRefs;
    }
    return surfaceRecord;
  }

  isPrimitiveSurface(node) {
    return toArray(node && node.metadata).length > 0
      || toArray(node && node.body).some((entry) => entry && (PRIMITIVE_SURFACE_CLAUSE_TYPES.has(entry.type) || entry.type === 'RmtEventBinding'));
  }

  compileSurfaceEvent(node, context) {
    const eventSegment = normalizeIdSegment(node.event || `event.${this.core.events.length}`);
    const eventId = `event:${context.surfacePath}/${eventSegment}/${this.core.events.length}`;
    const actionRef = node.action ? primitiveRecordId('action', node.action) : null;
    const record = {
      id: eventId,
      primitive: true,
      event: node.event,
      selector: node.selector && node.selector.value || null,
      target: node.target || null,
      action: node.action,
      actionRef,
      ownerOperation: null,
      scope: {
        surface: context.surfaceId
      },
      condition: null,
      payloadContract: compileEventPayloadContract(node),
      options: compileEventOptions(node)
    };

    if (context.templateId) {
      record.scope.template = context.templateId;
    }

    if (node.condition) {
      record.condition = {
        kind: 'condition',
        expression: compileExpression(node.condition.expression),
        sourceRef: makeSourceRef(`condition:${context.surfacePath}/event/${eventSegment}`)
      };
    }

    return addRecord(this.core, 'events', record, node, 'RmtEventBinding');
  }

  compileDestroyResourceRefs(node) {
    const tokens = toArray(node && node.tokens);
    const resourceIndex = tokens.indexOf('resource');

    if (resourceIndex === -1 || resourceIndex === tokens.length - 1) {
      return [];
    }

    const target = tokens.slice(resourceIndex + 1).join('').replace(/\s+/g, '');
    return target ? [{
      target,
      ref: primitiveRecordId('resource', target)
    }] : [];
  }

  compilePrimitiveDeclaration(node, templateContext) {
    if (node.type === 'RmtStateDeclaration') return this.compilePrimitiveState(node, templateContext);
    if (node.type === 'RmtSelectorDeclaration') return this.compilePrimitiveSelector(node, templateContext);
    if (node.type === 'RmtDataSourceDeclaration') return this.compilePrimitiveDataSource(node, templateContext);
    if (node.type === 'RmtActionDeclaration') return this.compilePrimitiveAction(node, templateContext);
    if (node.type === 'RmtValidationDeclaration') return this.compilePrimitiveValidation(node, templateContext);
    if (node.type === 'RmtTransitionDeclaration') return this.compilePrimitiveTransition(node, templateContext);
    if (node.type === 'RmtPortalDeclaration') return this.compilePrimitivePortal(node, templateContext);
    if (node.type === 'RmtOverlayDeclaration') return this.compilePrimitiveOverlay(node, templateContext);
    if (node.type === 'RmtResourceDeclaration') return this.compilePrimitiveResource(node, templateContext);
    return null;
  }

  primitiveScope(templateContext) {
    return templateContext ? {
      template: templateContext.templateId
    } : null;
  }

  compilePrimitiveState(node, templateContext) {
    const initial = node.initial ? primitiveValueToCore(node.initial) : compileInitialBlock(node);
    const record = {
      id: primitiveRecordId('state', node.name),
      name: node.name,
      primitive: true,
      type: node.dataType && node.dataType.value || null,
      preserve: node.preserve === true,
      initial
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    return addRecord(this.core, 'states', record, node, 'RmtStateDeclaration');
  }

  compilePrimitiveSelector(node, templateContext) {
    const clauses = toArray(node.body).map(compileSelectorClause).filter(Boolean);
    const outputClause = clauses.find((clause) => clause.kind === 'output') || null;
    const record = {
      id: primitiveRecordId('selector', node.name),
      name: node.name,
      primitive: true,
      source: compilePrimitiveSourceReference(node.source),
      clauses,
      output: outputClause && outputClause.type || null
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    return addRecord(this.core, 'selectors', record, node, 'RmtSelectorDeclaration');
  }

  compilePrimitiveDataSource(node, templateContext) {
    const methodNode = getPrimitiveBodyNode(node, 'RmtDataSourceMethodClause');
    const contractNode = getPrimitiveBodyNode(node, 'RmtDataSourceContractClause');
    const resultNode = getPrimitiveBodyNode(node, 'RmtDataSourceResultClause');
    const fallbackNode = getPrimitiveBodyNode(node, 'RmtDataSourceFallbackClause');
    const source = compilePrimitiveSourceReference(node.source);
    const record = {
      id: primitiveRecordId('dataSource', node.name),
      name: node.name,
      primitive: true,
      kind: source && source.kind || null,
      target: source && source.target || null,
      method: methodNode ? primitiveValueToString(methodNode.value) : null,
      contract: contractNode ? primitiveValueToString(contractNode.value) : null,
      result: resultNode ? primitiveValueToString(resultNode.value) : null,
      fallback: fallbackNode ? {
        kind: fallbackNode.kind || null,
        target: fallbackNode.value || null
      } : null,
      ownerOperation: null
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    return addRecord(this.core, 'dataSources', record, node, 'RmtDataSourceDeclaration');
  }

  compilePrimitiveAction(node, templateContext) {
    const effectRefs = [];
    const record = {
      id: primitiveRecordId('action', node.name),
      name: node.name,
      primitive: true,
      inputs: getPrimitiveBodyNodes(node, 'RmtActionInputClause').map((input) => ({
        name: input.name,
        type: input.dataType && input.dataType.value || null
      })),
      status: null,
      reducers: [],
      emits: [],
      handlers: [],
      effectRefs
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);

    toArray(node.body).forEach((child, index) => {
      if (child.type === 'RmtActionStatusClause') {
        record.status = {
          path: child.path || null
        };
      } else if (child.type === 'RmtReducerStatement') {
        record.reducers.push({
          target: child.target,
          value: child.value
            ? primitiveValueToCore(child.value)
            : primitiveExpressionTextToCore(child.expression || child.text || '')
        });
      } else if (child.type === 'RmtReducerRecipeStatement') {
        record.reducers.push({
          recipe: child.recipe ? primitiveValueToCore(child.recipe) : '',
          target: child.target,
          value: child.valueExpression
            ? primitiveExpressionTextToCore(child.valueExpression)
            : null
        });
      } else if (child.type === 'RmtEmitStatement') {
        record.emits.push({
          event: child.event,
          payload: toArray(child.payload).map((entry) => ({
            name: entry.name,
            value: primitiveValueToCore(entry.value)
          }))
        });
      } else if (child.type === 'RmtEffectStatement') {
        const effect = this.compilePrimitiveEffect(child, record, index);
        if (effect) effectRefs.push(effect.id);
      } else if (child.type === 'RmtActionResultHandler') {
        record.handlers.push({
          phase: child.phase,
          effect: child.effect || null
        });
      }
    });

    return addRecord(this.core, 'actions', record, node, 'RmtActionDeclaration');
  }

  compilePrimitiveValidation(node, templateContext) {
    const modeNode = getPrimitiveBodyNode(node, 'RmtValidationModeClause');
    const record = {
      id: primitiveRecordId('validation', node.name),
      name: node.name,
      primitive: true,
      mode: modeNode && modeNode.mode || 'blocking',
      targets: getPrimitiveBodyNodes(node, 'RmtValidationTargetClause').map((target) => ({
        kind: target.kind || 'action',
        id: target.target || '',
        ref: target.kind === 'action' || !target.kind ? primitiveRecordId('action', target.target) : primitiveRecordId(target.kind, target.target)
      })).filter((target) => target.id),
      fields: getPrimitiveBodyNodes(node, 'RmtValidationFieldClause').map((field) => {
        const rules = toArray(field.rules).map(compileValidationFieldRule).filter((rule) => rule && rule.kind && rule.kind !== 'message');
        return {
          state: field.field,
          ref: primitiveRecordId('state', field.field),
          rules,
          message: validationMessageFromRules(field.rules)
        };
      }).filter((field) => field.state),
      includes: getPrimitiveBodyNodes(node, 'RmtValidationIncludeClause').map((include) => include.ref).filter(Boolean)
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    const validationRecord = addRecord(this.core, 'validations', record, node, 'RmtValidationDeclaration');
    const validationIndex = this.core.validations.indexOf(validationRecord);
    toArray(node.body).forEach((child, index) => {
      if (!child || !child.type) return;
      const childSourceRef = makeSourceRef(`${validationRecord.id}/${index}`);
      addSourceMap(this.core, child, child.type, `/validations/${validationIndex}/body/${index}`, childSourceRef);
    });
    return validationRecord;
  }

  compilePrimitiveTransition(node, templateContext) {
    const triggerNode = getPrimitiveBodyNode(node, 'RmtTransitionTriggerClause');
    const fromNode = getPrimitiveBodyNode(node, 'RmtTransitionFromClause');
    const toNode = getPrimitiveBodyNode(node, 'RmtTransitionToClause');
    const effectNode = getPrimitiveBodyNode(node, 'RmtTransitionEffectClause');
    const durationNode = getPrimitiveBodyNode(node, 'RmtTransitionDurationClause');
    const easingNode = getPrimitiveBodyNode(node, 'RmtTransitionEasingClause');
    const laneNode = getPrimitiveBodyNode(node, 'RmtTransitionLaneClause');
    const triggerKind = triggerNode && triggerNode.kind || 'action';
    const triggerId = triggerNode && triggerNode.target || '';
    const duration = durationNode ? Number(primitiveValueToCore(durationNode.value)) : 240;
    const record = {
      id: primitiveRecordId('transition', node.name),
      name: node.name,
      primitive: true,
      trigger: {
        kind: triggerKind,
        id: triggerId,
        ref: triggerId ? primitiveRecordId(triggerKind, triggerId) : ''
      },
      from: fromNode ? primitiveValueToStringList(fromNode.value) : [],
      to: toNode ? primitiveValueToStringList(toNode.value) : [],
      effect: effectNode && effectNode.effect || 'fade',
      durationMs: Number.isFinite(duration) ? duration : 240,
      easing: easingNode ? primitiveValueToString(easingNode.value) || 'ease' : 'ease',
      lane: laneNode && laneNode.lane || 'transition'
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    const transitionRecord = addRecord(this.core, 'transitions', record, node, 'RmtTransitionDeclaration');
    const transitionIndex = this.core.transitions.indexOf(transitionRecord);
    toArray(node.body).forEach((child, index) => {
      if (!child || !child.type) return;
      const childSourceRef = makeSourceRef(`${transitionRecord.id}/${index}`);
      addSourceMap(this.core, child, child.type, `/transitions/${transitionIndex}/body/${index}`, childSourceRef);
    });
    return transitionRecord;
  }

  compilePrimitiveEffect(node, actionRecord, index) {
    const source = compilePrimitiveSourceReference(node.source);
    return addRecord(this.core, 'effects', {
      id: `effect:${normalizeIdSegment(actionRecord.name)}/${index}`,
      primitive: true,
      kind: node.effectKind || node.kind || 'fetch',
      action: actionRecord.name,
      actionRef: actionRecord.id,
      source
    }, node, 'RmtEffectStatement');
  }

  compilePrimitivePortal(node, templateContext) {
    const record = {
      id: primitiveRecordId('portal', node.name),
      name: node.name,
      primitive: true,
      root: getPrimitiveAttributeValue(node, 'root'),
      layer: getPrimitiveAttributeValue(node, 'layer'),
      z: getPrimitiveAttributeValue(node, 'z'),
      policies: toArray(node.body).map((entry) => entry.text || '').filter(Boolean)
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    return addRecord(this.core, 'portals', record, node, 'RmtPortalDeclaration');
  }

  compilePrimitiveOverlay(node, templateContext) {
    const portal = getPrimitiveAttributeValue(node, 'portal');
    const record = {
      id: primitiveRecordId('overlay', node.name),
      name: node.name,
      primitive: true,
      kind: getPrimitiveAttributeValue(node, 'kind') || 'overlay',
      portal: portal ? {
        target: portal,
        ref: primitiveRecordId('portal', portal)
      } : null,
      policies: toArray(node.body).map((entry) => entry.text || '').filter(Boolean)
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    return addRecord(this.core, 'overlays', record, node, 'RmtOverlayDeclaration');
  }

  compilePrimitiveResource(node, templateContext) {
    const owner = parseOwnerReference(getPrimitiveAttributeValue(node, 'owner'));
    const importNode = getPrimitiveBodyNode(node, 'RmtResourceImportClause');
    const sourceNode = getPrimitiveBodyNode(node, 'RmtResourceSourceClause');
    const disposeNode = getPrimitiveBodyNode(node, 'RmtResourceDisposeClause');
    const record = {
      id: primitiveRecordId('resource', node.name),
      name: node.name,
      primitive: true,
      kind: getPrimitiveAttributeValue(node, 'kind') || 'resource',
      owner: owner ? {
        kind: owner.kind,
        id: owner.id,
        ref: this.resolvePrimitiveOwnerRef(owner, templateContext)
      } : null,
      source: sourceNode ? compilePrimitiveSourceReference({
        kind: sourceNode.kind,
        value: sourceNode.ref
      }) : null,
      dispose: disposeNode ? {
        text: disposeNode.text || '',
        tokens: toArray(disposeNode.tokens)
      } : null,
      kernelVisible: importNode ? false : true,
      adapter: importNode ? {
        kind: 'host-import',
        import: primitiveValueToString(importNode.value),
        kernelVisible: false
      } : null
    };

    if (templateContext) record.scope = this.primitiveScope(templateContext);
    return addRecord(this.core, 'resources', record, node, 'RmtResourceDeclaration');
  }

  resolvePrimitiveOwnerRef(owner, templateContext) {
    if (!owner) return null;
    if (owner.kind === 'surface' && templateContext) {
      return `surface:${templateContext.templatePath}/${normalizeIdSegment(owner.id)}`;
    }
    return owner.ref;
  }

  finalizePrimitiveLowering() {
    if (!hasPrimitiveCoreRecords(this.core)) {
      return;
    }

    this.core.appPlatform = createAppPlatformRecords(this.core);
    this.core.kernelRecords = createKernelRecords(this.core);
  }

  compileRemoteSurface(node) {
    const name = node.name || `remote.surface.${this.core.remoteSurfaces.length}`;
    const surfaceSegment = normalizeIdSegment(name);
    const remoteSurfaceId = `remoteSurface:${surfaceSegment}`;
    const ownerNode = firstBodyNode(node, 'RmtRemoteOwnerClause');
    const versionNode = firstBodyNode(node, 'RmtRemoteVersionClause');
    const originNode = firstBodyNode(node, 'RmtRemoteOriginClause');
    const integrityNode = firstBodyNode(node, 'RmtRemoteIntegrityClause');
    const trustNode = firstBodyNode(node, 'RmtRemoteTrustBoundaryClause');
    const fallbackNode = firstBodyNode(node, 'RmtRemoteFallbackClause');
    const exposeNodes = bodyNodes(node, 'RmtRemoteExposeClause');
    const eventNodes = bodyNodes(node, 'RmtRemoteEventClause');
    const emits = eventNodes.filter((event) => event.kind === 'emits').map((event) => this.compileRemoteEvent(event, 'outbound'));
    const consumes = eventNodes.filter((event) => event.kind === 'consumes').map((event) => this.compileRemoteEvent(event, 'inbound'));
    const capabilities = inferRemoteCapabilities(exposeNodes, emits, consumes);
    const capabilityIds = capabilities.map((capability) => capability.id);
    const record = {
      id: remoteSurfaceId,
      manifestId: `remoteManifest:${surfaceSegment}`,
      name,
      kind: 'remote_surface',
      remote: {
        id: node.remoteId || null,
        origin: originNode && originNode.value || null,
        versionRange: versionNode && versionNode.value || null,
        integrity: {
          algorithm: integrityNode && integrityNode.algorithm || null,
          digest: integrityNode && integrityNode.digest || null
        }
      },
      owner: {
        kind: ownerNode && ownerNode.kind || 'team',
        id: ownerNode && ownerNode.id || null
      },
      security: {
        trustBoundary: trustNode && trustNode.boundary || null,
        capabilityMode: 'deny-by-default',
        sandboxRequired: true,
        cspRequired: true
      },
      exposes: exposeNodes.map((expose) => ({
        lane: expose.lane || null,
        target: compileRemoteShellTarget(expose.target),
        mode: 'mount'
      })),
      events: {
        emits,
        consumes
      },
      capabilities,
      adapterBoundary: {
        adapterId: 'xtend.remote-surface.host',
        capabilities: capabilityIds,
        hostOwned: true,
        runtimeLoader: false
      },
      fallback: {
        kind: fallbackNode && fallbackNode.kind || 'surface',
        ref: fallbackNode && fallbackNode.ref || null
      },
      runtime: {
        kernelRemoteExecution: false,
        hostAdapterRequired: true,
        networkRequiredByKernel: false
      }
    };

    const remoteRecord = addRecord(this.core, 'remoteSurfaces', record, node, 'RmtRemoteSurfaceDeclaration');
    this.addRemoteChildSourceMaps(node, remoteRecord);
    return remoteRecord;
  }

  compileRemoteEvent(node, fallbackDirection) {
    const ownerNode = firstBodyNode(node, 'RmtRemoteOwnerClause');
    const directionNode = firstBodyNode(node, 'RmtRemoteEventDirectionClause');
    const laneNode = firstBodyNode(node, 'RmtRemoteEventLaneClause');
    const fromNode = firstBodyNode(node, 'RmtRemoteEventFromClause');
    const payloadNode = firstBodyNode(node, 'RmtRemoteEventPayloadClause');
    const lane = laneNode && laneNode.lane || null;
    const scopes = [];

    if (lane) scopes.push(`lane:${lane}`);
    if (fromNode && fromNode.source && fromNode.source.ref) {
      scopes.push(fromNode.source.ref);
    }

    return {
      event: node.event || null,
      owner: {
        kind: ownerNode && ownerNode.kind || 'team',
        id: ownerNode && ownerNode.id || null
      },
      direction: directionNode && directionNode.direction || fallbackDirection,
      version: eventVersionFromName(node.event),
      lane,
      from: compileRemoteShellTarget(fromNode && fromNode.source),
      payload: {
        schema: payloadNode && payloadNode.value || null,
        shape: null
      },
      scopes
    };
  }

  addRemoteChildSourceMaps(node, record) {
    const remoteIndex = this.core.remoteSurfaces.indexOf(record);
    const pointerBase = `/remoteSurfaces/${remoteIndex}`;
    const children = Array.isArray(node.body) ? node.body : [];
    children.forEach((child, index) => {
      const childSourceRef = makeSourceRef(`${record.id}/${index}`);
      addSourceMap(this.core, child, child.type, `${pointerBase}/body/${index}`, childSourceRef);
    });
  }

  compileLane(node, scope) {
    const name = node.name || `lane.${this.core.lanes.length}`;
    const laneSegment = normalizeIdSegment(name);
    const lanePath = `${scope.surfacePath}/${laneSegment}`;
    const laneId = `lane:${lanePath}`;
    const operationRefs = [];
    const record = {
      id: laneId,
      name,
      scope: {
        surface: scope.surfaceId
      },
      operationRefs
    };

    if (scope.templateId) {
      record.scope.template = scope.templateId;
    }

    if (node.weight !== null && node.weight !== undefined) {
      record.weight = node.weight;
    }

    const laneRecord = addRecord(this.core, 'lanes', record, node, 'RmtLaneDeclaration');

    (Array.isArray(node.body) ? node.body : []).forEach((child, index) => {
      if (!isOperationNode(child)) return;
      const operation = this.compileOperation(child, {
        ...scope,
        laneName: name,
        laneId,
        lanePath,
        operationPath: `${lanePath}/${index}`
      });
      if (operation) operationRefs.push(operation.id);
    });

    laneRecord.operationRefs = operationRefs;
    return laneRecord;
  }

  compileOperation(node, context) {
    const operationId = `operation:${context.operationPath}`;
    const kind = node.type === 'RmtStreamStatement' ? 'stream' : 'lifecycle';
    const record = {
      id: operationId,
      kind,
      op: kind === 'stream' ? 'stream' : node.op,
      target: {
        kind: 'ref',
        ref: node.target && node.target.value
      },
      scope: {
        surface: context.surfaceId,
        lane: context.laneId
      }
    };

    if (context.templateId) {
      record.scope.template = context.templateId;
    }

    if (node.source) {
      if (PRIMITIVE_SOURCE_KINDS.has(node.source.kind)) {
        const primitiveSource = compilePrimitiveSourceReference(node.source);
        record.source = {
          ref: primitiveSource.ref,
          kind: primitiveSource.kind,
          id: primitiveSource.target
        };
      } else {
        const dataSource = this.compileDataSource(node.source, operationId, context.operationPath);
        record.source = {
          ref: dataSource.id,
          kind: dataSource.kind,
          id: dataSource.target
        };
      }
    }

    if (node.condition) {
      record.condition = this.compileCondition(node.condition, operationId, context.operationPath);
    }

    const operationRecord = addRecord(this.core, 'operations', record, node, node.type);
    const policyRefs = this.compilePolicyBlock(node.policy, operationRecord.id, context);

    if (policyRefs.length > 0) {
      operationRecord.policyRefs = policyRefs;
    }

    return operationRecord;
  }

  compileDataSource(node, ownerOperation, ownerPath) {
    const id = `dataSource:${ownerPath}`;
    return addRecord(this.core, 'dataSources', {
      id,
      kind: node.kind,
      target: node.target,
      ownerOperation
    }, node, 'RmtSourceClause');
  }

  compileCondition(node, ownerOperation, ownerPath) {
    const sourceRef = makeSourceRef(`condition:${ownerPath}`);
    const pointer = `/operations/${this.core.operations.length}/condition`;
    const condition = {
      kind: 'condition',
      expression: compileExpression(node.expression),
      sourceRef
    };

    addSourceMap(this.core, node, 'RmtConditionClause', pointer, sourceRef);

    return condition;
  }

  compilePolicyBlock(policy, ownerOperation, context) {
    if (!policy || !Array.isArray(policy.body)) return [];

    const refs = [];
    policy.body.forEach((item, index) => {
      if (item.type === 'RmtSlotDeclaration') {
        refs.push(this.compileSlot(item, ownerOperation, context).id);
      } else if (item.type === 'RmtEventBinding') {
        refs.push(this.compileEvent(item, ownerOperation, context.operationPath).id);
      } else if (item.type === 'RmtHydrationPolicy' || item.type === 'RmtResumabilityPolicy' || item.type === 'RmtIsolationPolicy') {
        refs.push(this.compileHydrationPolicy(item, ownerOperation, context.operationPath, index).id);
      } else if (item.type === 'RmtTrustBoundaryPolicy' || item.type === 'RmtSanitizePolicy') {
        refs.push(this.compileSecurityPolicy(item, ownerOperation, context.operationPath, index).id);
      }
    });
    return refs;
  }

  compileSlot(node, ownerOperation, context) {
    const slotSegment = normalizeIdSegment(node.name || `slot.${this.core.slots.length}`);
    const slotPath = `${context.operationPath}/${slotSegment}`;
    const slotId = `slot:${slotPath}`;
    const operationRefs = [];
    const slotRecord = addRecord(this.core, 'slots', {
      id: slotId,
      name: node.name,
      ownerOperation,
      operationRefs
    }, node, 'RmtSlotDeclaration');

    (Array.isArray(node.body) ? node.body : []).forEach((child, index) => {
      if (!isOperationNode(child)) return;
      const operation = this.compileOperation(child, {
        ...context,
        operationPath: `${slotPath}/${index}`
      });
      if (operation) operationRefs.push(operation.id);
    });

    slotRecord.operationRefs = operationRefs;
    return slotRecord;
  }

  compileEvent(node, ownerOperation, ownerPath) {
    const eventSegment = normalizeIdSegment(node.event || `event.${this.core.events.length}`);
    const id = `event:${ownerPath}/${eventSegment}`;
    const record = {
      id,
      event: node.event,
      action: node.action,
      ownerOperation,
      condition: null
    };

    if (node.condition) {
      record.condition = {
        kind: 'condition',
        expression: compileExpression(node.condition.expression),
        sourceRef: makeSourceRef(`condition:${ownerPath}/event/${eventSegment}`)
      };
    }

    return addRecord(this.core, 'events', record, node, 'RmtEventBinding');
  }

  compileSecurityPolicy(node, ownerOperation, ownerPath, policyIndex) {
    if (node.type === 'RmtTrustBoundaryPolicy') {
      return addRecord(this.core, 'securityPolicies', {
        id: `security:${ownerPath}/trustBoundary/${policyIndex}`,
        kind: 'trust_boundary',
        boundary: node.boundary,
        ownerOperation
      }, node, 'RmtTrustBoundaryPolicy');
    }

    return addRecord(this.core, 'securityPolicies', {
      id: `security:${ownerPath}/sanitize/${policyIndex}`,
      kind: 'sanitize',
      format: node.format,
      ownerOperation
    }, node, 'RmtSanitizePolicy');
  }

  compileHydrationPolicy(node, ownerOperation, ownerPath, policyIndex) {
    if (node.type === 'RmtIsolationPolicy') {
      return addRecord(this.core, 'hydrationPolicies', {
        id: `hydration:${ownerPath}/isolation/${policyIndex}`,
        kind: 'isolation',
        boundary: node.boundary || null,
        mode: node.mode || null,
        ownerOperation
      }, node, 'RmtIsolationPolicy');
    }

    if (node.type === 'RmtResumabilityPolicy') {
      return addRecord(this.core, 'hydrationPolicies', {
        id: `hydration:${ownerPath}/resumability/${policyIndex}`,
        kind: 'resumability',
        mode: node.mode || 'server_prerender_resume',
        snapshot: node.snapshot || null,
        eventReplay: node.eventReplay || null,
        integrity: node.integrity || null,
        ownerOperation
      }, node, 'RmtResumabilityPolicy');
    }

    return addRecord(this.core, 'hydrationPolicies', {
      id: `hydration:${ownerPath}/policy/${policyIndex}`,
      kind: 'hydration',
      policy: node.policy || null,
      mode: node.mode || null,
      insularHydration: node.insularHydration === null ? null : Boolean(node.insularHydration),
      ownerOperation
    }, node, 'RmtHydrationPolicy');
  }
}

function compileRmtVNextAst(ast, options = {}) {
  const compiler = new VNextCompiler(ast, options);
  return compiler.compile();
}

function coreDocumentForSerialization(coreDocument) {
  const serializable = {
    ...coreDocument
  };

  if (Array.isArray(serializable.remoteSurfaces) && serializable.remoteSurfaces.length === 0) {
    delete serializable.remoteSurfaces;
  }

  ['states', 'selectors', 'actions', 'effects', 'validations', 'transitions', 'portals', 'overlays', 'resources', 'hydrationPolicies'].forEach((domain) => {
    if (Array.isArray(serializable[domain]) && serializable[domain].length === 0) {
      delete serializable[domain];
    }
  });

  if (serializable.appPlatform === null) {
    delete serializable.appPlatform;
  }

  if (serializable.kernelRecords === null) {
    delete serializable.kernelRecords;
  }

  return serializable;
}

function serializeRmtVNextCore(coreDocument) {
  return `${JSON.stringify(coreDocumentForSerialization(coreDocument), null, 2)}\n`;
}

function compileRmtVNextSource(input = {}, options = {}) {
  const parserResult = parseRmtVNextSource(input, options);

  if (!parserResult.ok) {
    return {
      schema: RMT_VNEXT_COMPILER_SCHEMA,
      workpackage: RMT_VNEXT_COMPILER_WORKPACKAGE,
      ok: false,
      phase: parserResult.phase || 'syntax',
      status: parserResult.status || 'syntax_error',
      parserResult,
      orchestrationArtifacts: null,
      coreDocument: null,
      coreJson: null,
      diagnostics: parserResult.diagnostics,
      compilerDiagnostics: []
    };
  }

  const primitiveSemanticGraph = buildRmtVNextPrimitiveSemanticGraph(input, {
    ...options,
    parserResult
  });
  const primitiveInput = hasPrimitiveDeclarations(parserResult.ast);
  const primitiveErrors = primitiveInput
    ? primitiveSemanticGraph.listDiagnostics({ severity: 'error' })
    : [];

  if (primitiveErrors.length > 0) {
    return {
      schema: RMT_VNEXT_COMPILER_SCHEMA,
      workpackage: RMT_VNEXT_COMPILER_WORKPACKAGE,
      primitiveLoweringSchema: RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA,
      primitiveLoweringWorkpackage: RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
      ok: false,
      phase: 'semantic',
      status: 'semantic_error',
      parserResult,
      primitiveSemanticGraph,
      orchestrationArtifacts: null,
      coreDocument: null,
      coreJson: null,
      diagnostics: primitiveSemanticGraph.diagnostics,
      compilerDiagnostics: primitiveErrors
    };
  }

  const compiler = new VNextCompiler(parserResult.ast, {
    ...options,
    semanticGraph: primitiveSemanticGraph
  });
  const coreDocument = compiler.compile();
  const coreJson = serializeRmtVNextCore(coreDocument);
  const compilerDiagnostics = compiler.diagnostics.slice();
  const diagnostics = parserResult.diagnostics.concat(compilerDiagnostics);
  const primitiveArtifacts = coreDocument.appPlatform ? {
    schema: RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA,
    workpackage: RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
    appPlatform: coreDocument.appPlatform,
    kernelRecords: coreDocument.kernelRecords,
    sourceMap: coreDocument.sourceMap.filter((entry) => [
      'RmtStateDeclaration',
      'RmtSelectorDeclaration',
      'RmtDataSourceDeclaration',
      'RmtActionDeclaration',
      'RmtValidationDeclaration',
      'RmtValidationFieldClause',
      'RmtValidationTargetClause',
      'RmtTransitionDeclaration',
      'RmtTransitionTriggerClause',
      'RmtTransitionFromClause',
      'RmtTransitionToClause',
      'RmtEffectStatement',
      'RmtPortalDeclaration',
      'RmtOverlayDeclaration',
      'RmtResourceDeclaration',
      'RmtEventBinding'
    ].includes(entry.nodeType))
  } : null;
  const orchestrationArtifacts = createRmtAppOrchestrationArtifacts(coreDocument);

  return {
    schema: RMT_VNEXT_COMPILER_SCHEMA,
    workpackage: RMT_VNEXT_COMPILER_WORKPACKAGE,
    primitiveLoweringSchema: RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA,
    primitiveLoweringWorkpackage: RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
    ok: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length === 0,
    phase: 'compile',
    status: 'compiled',
    parserResult,
    primitiveSemanticGraph,
    primitiveArtifacts,
    orchestrationArtifacts,
    coreDocument,
    coreJson,
    diagnostics,
    compilerDiagnostics
  };
}

function createRmtVNextCompiler(defaultOptions = {}) {
  function compileSource(input = {}, options = {}) {
    return compileRmtVNextSource(input, {
      ...defaultOptions,
      ...options
    });
  }

  return Object.freeze({
    schema: RMT_VNEXT_COMPILER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    primitiveLoweringSchema: RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA,
    appOrchestrationSchema: RMT_APP_ORCHESTRATION_SCHEMA,
    formValidationSchema: RMT_FORM_VALIDATION_SCHEMA,
    surfaceTransitionSchema: RMT_SURFACE_TRANSITION_SCHEMA,
    parserSchema: RMT_VNEXT_PARSER_SCHEMA,
    workpackage: RMT_VNEXT_COMPILER_WORKPACKAGE,
    compileSource,
    compileAst: (ast, options = {}) => compileRmtVNextAst(ast, { ...defaultOptions, ...options }),
    serializeCore: serializeRmtVNextCore
  });
}

module.exports = {
  RMT_FILE_FALLBACK_CODE,
  RMT_VNEXT_COMPILER_DIAGNOSTIC_CODE,
  RMT_VNEXT_COMPILER_MODULE_PATH,
  RMT_VNEXT_COMPILER_PACKAGE_SCRIPT,
  RMT_VNEXT_COMPILER_REPORT_SCHEMA,
  RMT_VNEXT_COMPILER_SCHEMA,
  RMT_VNEXT_COMPILER_SUITE_PATH,
  RMT_VNEXT_COMPILER_WORKPACKAGE,
  RMT_APP_ORCHESTRATION_SCHEMA,
  RMT_APP_ORCHESTRATION_WORKPACKAGE,
  RMT_FORM_VALIDATION_SCHEMA,
  RMT_SURFACE_TRANSITION_SCHEMA,
  RMT_VNEXT_CORE_SCHEMA,
  RMT_VNEXT_PRIMITIVE_LOWERING_SCHEMA,
  RMT_VNEXT_PRIMITIVE_LOWERING_WORKPACKAGE,
  RMT_APP_PLATFORM_RECORDS_SCHEMA,
  RMT_KERNEL_BOUNDARY,
  RMT_KERNEL_RECORDS_SCHEMA,
  RMT_VNEXT_PARSER_WORKPACKAGE,
  compileRmtVNextAst,
  compileRmtVNextSource,
  createRmtVNextCompiler,
  serializeRmtVNextCore
};
