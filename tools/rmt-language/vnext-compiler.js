const {
  RMT_FILE_FALLBACK_CODE,
  RMT_VNEXT_PARSER_SCHEMA,
  RMT_VNEXT_PARSER_WORKPACKAGE,
  parseRmtVNextSource
} = require('./vnext-parser');

const RMT_VNEXT_CORE_SCHEMA = 'xtend.rmt.core-format.vnext.v1';
const RMT_VNEXT_COMPILER_SCHEMA = 'xtend.rmt.vnext-compiler.v1';
const RMT_VNEXT_COMPILER_REPORT_SCHEMA = 'xtend.rmt.vnext-compiler-report.v1';
const RMT_VNEXT_COMPILER_WORKPACKAGE = 'WP-E15-05';
const RMT_VNEXT_COMPILER_MODULE_PATH = 'tools/rmt-language/vnext-compiler.js';
const RMT_VNEXT_COMPILER_SUITE_PATH = 'tests/rmt-language/rmt_vnext_compiler_suite.js';
const RMT_VNEXT_COMPILER_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-compiler';
const RMT_VNEXT_COMPILER_DIAGNOSTIC_CODE = 'rmt.vnext.compiler.diagnostic';

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
    lanes: [],
    operations: [],
    slots: [],
    events: [],
    dataSources: [],
    securityPolicies: [],
    sourceMap: []
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

function isImportNode(node) {
  return node && node.type === 'RmtImportDeclaration';
}

function isLaneNode(node) {
  return node && node.type === 'RmtLaneDeclaration';
}

function isOperationNode(node) {
  return node && (node.type === 'RmtLifecycleStatement' || node.type === 'RmtStreamStatement');
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
  }

  compile() {
    const body = Array.isArray(this.ast && this.ast.body) ? this.ast.body : [];

    body.forEach((node) => {
      if (isImportNode(node)) {
        this.compileImport(node);
      } else if (isTemplateNode(node)) {
        this.compileTemplate(node);
      } else if (isSurfaceNode(node)) {
        this.compileSurface(node, null);
      }
    });

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
    const record = {
      id: surfaceId,
      name,
      kind: name === 'root' ? 'root' : 'named_surface',
      laneRefs
    };

    if (templateContext) {
      record.scope = {
        template: templateContext.templateId
      };
    }

    const surfaceRecord = addRecord(this.core, 'surfaces', record, node, 'RmtSurfaceDeclaration');

    (Array.isArray(node.body) ? node.body : []).forEach((child) => {
      if (!isLaneNode(child)) return;
      const lane = this.compileLane(child, {
        ...templateContext,
        surfaceName: name,
        surfaceId,
        surfacePath: scopePath
      });
      if (lane) laneRefs.push(lane.id);
    });

    surfaceRecord.laneRefs = laneRefs;
    return surfaceRecord;
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
      const dataSource = this.compileDataSource(node.source, operationId, context.operationPath);
      record.source = {
        ref: dataSource.id,
        kind: dataSource.kind,
        id: dataSource.target
      };
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

function serializeRmtVNextCore(coreDocument) {
  return `${JSON.stringify(coreDocument, null, 2)}\n`;
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

  const coreDocument = compileRmtVNextAst(parserResult.ast, options);
  const coreJson = serializeRmtVNextCore(coreDocument);
  const diagnostics = parserResult.diagnostics.slice();

  return {
    schema: RMT_VNEXT_COMPILER_SCHEMA,
    workpackage: RMT_VNEXT_COMPILER_WORKPACKAGE,
    ok: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length === 0,
    phase: 'compile',
    status: 'compiled',
    parserResult,
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
  RMT_VNEXT_PARSER_WORKPACKAGE,
  compileRmtVNextAst,
  compileRmtVNextSource,
  createRmtVNextCompiler,
  serializeRmtVNextCore
};
