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
const RMT_VNEXT_COMPILER_MODULE_PATH = 'tools/rmt-language/vnext-compiler.js';
const RMT_VNEXT_COMPILER_SUITE_PATH = 'tests/rmt-language/rmt_vnext_compiler_suite.js';
const RMT_VNEXT_COMPILER_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-compiler';
const RMT_VNEXT_COMPILER_DIAGNOSTIC_CODE = 'rmt.vnext.compiler.diagnostic';
const RMT_KERNEL_RECORDS_SCHEMA = 'xtend.rmt.vnext.kernel-records.v1';
const RMT_APP_PLATFORM_RECORDS_SCHEMA = 'xtend.rmt.vnext.app-platform-records.v1';
const RMT_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-host-runtime-types';
const PRIMITIVE_DECLARATION_TYPES = new Set([
  'RmtStateDeclaration',
  'RmtSelectorDeclaration',
  'RmtDataSourceDeclaration',
  'RmtActionDeclaration',
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
    portals: [],
    overlays: [],
    resources: [],
    securityPolicies: [],
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
  return {
    kind: match[1],
    id: match[2],
    ref: primitiveRecordId(match[1], match[2])
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
  return ['states', 'selectors', 'actions', 'effects', 'portals', 'overlays', 'resources'].some((domain) => core[domain].length > 0)
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
    }))
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
      record.bounds = boundsNode ? compileInlinePrimitiveFields(boundsNode.fields) : null;
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
          value: child.value ? primitiveValueToCore(child.value) : child.text || null
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

  compilePrimitiveEffect(node, actionRecord, index) {
    const source = compilePrimitiveSourceReference(node.source);
    return addRecord(this.core, 'effects', {
      id: `effect:${normalizeIdSegment(actionRecord.name)}/${index}`,
      primitive: true,
      kind: node.kind || 'fetch',
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

  ['states', 'selectors', 'actions', 'effects', 'portals', 'overlays', 'resources'].forEach((domain) => {
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
      coreDocument: null,
      coreJson: null,
      diagnostics: primitiveSemanticGraph.diagnostics,
      compilerDiagnostics: primitiveErrors
    };
  }

  const coreDocument = compileRmtVNextAst(parserResult.ast, {
    ...options,
    semanticGraph: primitiveSemanticGraph
  });
  const coreJson = serializeRmtVNextCore(coreDocument);
  const diagnostics = parserResult.diagnostics.slice();
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
      'RmtEffectStatement',
      'RmtPortalDeclaration',
      'RmtOverlayDeclaration',
      'RmtResourceDeclaration',
      'RmtEventBinding'
    ].includes(entry.nodeType))
  } : null;

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
    coreDocument,
    coreJson,
    diagnostics,
    compilerDiagnostics: []
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
