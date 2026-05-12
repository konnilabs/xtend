const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_CONDITION_SCHEMA = 'xtend.rmt.vnext-condition-contract.v1';
const RMT_VNEXT_CONDITION_RECORD_SCHEMA = 'xtend.rmt.vnext-condition.v1';
const RMT_VNEXT_EXPRESSION_SCHEMA = 'xtend.rmt.vnext-expression.v1';
const RMT_VNEXT_CONDITION_REPORT_SCHEMA = 'xtend.rmt.vnext-condition-report.v1';
const RMT_VNEXT_CONDITION_WORKPACKAGE = 'WP-E15-09';
const RMT_VNEXT_CONDITION_MODULE_PATH = 'tools/rmt-language/vnext-conditions.js';
const RMT_VNEXT_CONDITION_SUITE_PATH = 'tests/rmt-language/rmt_vnext_conditions_suite.js';
const RMT_VNEXT_CONDITION_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-conditions';

const CONDITION_EXPRESSION_KIND_UNSUPPORTED_CODE = 'rmt.vnext.condition.expression.kind.unsupported';
const CONDITION_OPERATOR_UNSUPPORTED_CODE = 'rmt.vnext.condition.operator.unsupported';
const CONDITION_PATH_UNKNOWN_CODE = 'rmt.vnext.condition.path.unknown';
const CONDITION_TYPE_MISMATCH_CODE = 'rmt.vnext.condition.type.mismatch';
const CONDITION_ROOT_TYPE_CODE = 'rmt.vnext.condition.root.not_boolean';
const CONDITION_EXPRESSION_MISSING_CODE = 'rmt.vnext.condition.expression.missing';

const CONDITION_VALUE_TYPES = Object.freeze(['boolean', 'number', 'string', 'null', 'unknown']);
const CONDITION_EXPRESSION_KINDS = Object.freeze(['literal', 'path', 'unary', 'binary', 'logical', 'group']);
const CONDITION_BINARY_OPERATORS = Object.freeze(['==', '!=', '>', '>=', '<', '<=']);
const CONDITION_LOGICAL_OPERATORS = Object.freeze(['&&', '||']);
const CONDITION_UNARY_OPERATORS = Object.freeze(['!']);

const DEFAULT_CONDITION_PATH_TYPES = Object.freeze({
  'route.visible': 'boolean',
  'route.name': 'string',
  'route.params.id': 'string',
  'user.role': 'string',
  'user.blocked': 'boolean',
  'feature.enabled': 'boolean',
  'settings.dirty': 'boolean',
  'viewport.width': 'number',
  'data.ready': 'boolean'
});

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

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createConditionDiagnostic(coreDocument, operation, condition, code, message, severity = 'error', metadata = {}) {
  const sourceEntry = findSourceEntry(coreDocument, condition && condition.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_CONDITION_SCHEMA,
    workpackage: RMT_VNEXT_CONDITION_WORKPACKAGE,
    severity,
    code,
    message,
    operationId: operation && operation.id ? operation.id : null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: condition && condition.sourceRef ? condition.sourceRef : null,
    range: cloneRange(sourceEntry && sourceEntry.range),
    metadata
  };
}

function normalizePath(path) {
  if (Array.isArray(path)) {
    return path.filter(Boolean).map(String);
  }

  if (typeof path === 'string') {
    return path.split('.').filter(Boolean);
  }

  return [];
}

function typeOfLiteral(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  return 'unknown';
}

function createExpressionRecord(input = {}) {
  return {
    schema: RMT_VNEXT_EXPRESSION_SCHEMA,
    kind: input.kind || 'missing',
    op: input.op || null,
    type: input.type || 'unknown',
    path: input.path || null,
    value: Object.prototype.hasOwnProperty.call(input, 'value') ? input.value : undefined,
    children: Array.isArray(input.children) ? input.children : [],
    pathRefs: Array.isArray(input.pathRefs) ? input.pathRefs : []
  };
}

function mergePathRefs(...sets) {
  const result = [];
  sets.flat().forEach((path) => {
    if (path && !result.includes(path)) result.push(path);
  });
  return result;
}

function isComparableType(leftType, rightType) {
  if (leftType === 'unknown' || rightType === 'unknown') return true;
  if (leftType === rightType) return true;
  if (leftType === 'null' || rightType === 'null') return true;
  return false;
}

function analyzeExpression(coreDocument, operation, condition, expression, context) {
  if (!expression || typeof expression !== 'object') {
    const diagnostic = createConditionDiagnostic(
      coreDocument,
      operation,
      condition,
      CONDITION_EXPRESSION_MISSING_CODE,
      `Operation "${operation && operation.id || 'unknown'}" has no condition expression.`
    );
    return {
      type: 'unknown',
      pathRefs: [],
      expression: createExpressionRecord({ kind: 'missing' }),
      diagnostics: [diagnostic]
    };
  }

  if (!CONDITION_EXPRESSION_KINDS.includes(expression.kind)) {
    const diagnostic = createConditionDiagnostic(
      coreDocument,
      operation,
      condition,
      CONDITION_EXPRESSION_KIND_UNSUPPORTED_CODE,
      `Expression kind "${expression.kind || 'unknown'}" is not part of the vNext condition subset.`,
      'error',
      { allowedKinds: CONDITION_EXPRESSION_KINDS.slice() }
    );
    return {
      type: 'unknown',
      pathRefs: [],
      expression: createExpressionRecord({ kind: expression.kind || 'unknown' }),
      diagnostics: [diagnostic]
    };
  }

  if (expression.kind === 'literal') {
    const type = typeOfLiteral(expression.value);
    return {
      type,
      pathRefs: [],
      expression: createExpressionRecord({
        kind: 'literal',
        type,
        value: expression.value
      }),
      diagnostics: []
    };
  }

  if (expression.kind === 'path') {
    const pathParts = normalizePath(expression.path || expression.value);
    const path = pathParts.join('.');
    const type = context.pathTypes[path] || 'unknown';
    const diagnostics = [];

    if (!context.pathTypes[path]) {
      diagnostics.push(createConditionDiagnostic(
        coreDocument,
        operation,
        condition,
        CONDITION_PATH_UNKNOWN_CODE,
        `Condition path "${path || 'unknown'}" is not declared in the vNext condition path catalog.`,
        'error',
        { path }
      ));
    }

    return {
      type,
      pathRefs: path ? [path] : [],
      expression: createExpressionRecord({
        kind: 'path',
        type,
        path,
        pathRefs: path ? [path] : []
      }),
      diagnostics
    };
  }

  if (expression.kind === 'group') {
    const inner = analyzeExpression(coreDocument, operation, condition, expression.expression, context);
    return {
      type: inner.type,
      pathRefs: inner.pathRefs,
      expression: createExpressionRecord({
        kind: 'group',
        type: inner.type,
        children: [inner.expression],
        pathRefs: inner.pathRefs
      }),
      diagnostics: inner.diagnostics
    };
  }

  if (expression.kind === 'unary') {
    const argument = analyzeExpression(coreDocument, operation, condition, expression.argument, context);
    const diagnostics = argument.diagnostics.slice();

    if (!CONDITION_UNARY_OPERATORS.includes(expression.op)) {
      diagnostics.push(createConditionDiagnostic(
        coreDocument,
        operation,
        condition,
        CONDITION_OPERATOR_UNSUPPORTED_CODE,
        `Unary operator "${expression.op || 'unknown'}" is not allowed in vNext conditions.`,
        'error',
        { allowedOperators: CONDITION_UNARY_OPERATORS.slice() }
      ));
    }

    if (argument.type !== 'boolean' && argument.type !== 'unknown') {
      diagnostics.push(createConditionDiagnostic(
        coreDocument,
        operation,
        condition,
        CONDITION_TYPE_MISMATCH_CODE,
        `Unary operator "!" expects boolean but received ${argument.type}.`,
        'error',
        { expected: 'boolean', actual: argument.type }
      ));
    }

    return {
      type: 'boolean',
      pathRefs: argument.pathRefs,
      expression: createExpressionRecord({
        kind: 'unary',
        op: expression.op,
        type: 'boolean',
        children: [argument.expression],
        pathRefs: argument.pathRefs
      }),
      diagnostics
    };
  }

  if (expression.kind === 'logical') {
    const left = analyzeExpression(coreDocument, operation, condition, expression.left, context);
    const right = analyzeExpression(coreDocument, operation, condition, expression.right, context);
    const diagnostics = left.diagnostics.concat(right.diagnostics);

    if (!CONDITION_LOGICAL_OPERATORS.includes(expression.op)) {
      diagnostics.push(createConditionDiagnostic(
        coreDocument,
        operation,
        condition,
        CONDITION_OPERATOR_UNSUPPORTED_CODE,
        `Logical operator "${expression.op || 'unknown'}" is not allowed in vNext conditions.`,
        'error',
        { allowedOperators: CONDITION_LOGICAL_OPERATORS.slice() }
      ));
    }

    [left, right].forEach((side) => {
      if (side.type !== 'boolean' && side.type !== 'unknown') {
        diagnostics.push(createConditionDiagnostic(
          coreDocument,
          operation,
          condition,
          CONDITION_TYPE_MISMATCH_CODE,
          `Logical operator "${expression.op}" expects boolean operands but received ${side.type}.`,
          'error',
          { expected: 'boolean', actual: side.type }
        ));
      }
    });

    return {
      type: 'boolean',
      pathRefs: mergePathRefs(left.pathRefs, right.pathRefs),
      expression: createExpressionRecord({
        kind: 'logical',
        op: expression.op,
        type: 'boolean',
        children: [left.expression, right.expression],
        pathRefs: mergePathRefs(left.pathRefs, right.pathRefs)
      }),
      diagnostics
    };
  }

  const left = analyzeExpression(coreDocument, operation, condition, expression.left, context);
  const right = analyzeExpression(coreDocument, operation, condition, expression.right, context);
  const diagnostics = left.diagnostics.concat(right.diagnostics);

  if (!CONDITION_BINARY_OPERATORS.includes(expression.op)) {
    diagnostics.push(createConditionDiagnostic(
      coreDocument,
      operation,
      condition,
      CONDITION_OPERATOR_UNSUPPORTED_CODE,
      `Binary operator "${expression.op || 'unknown'}" is not allowed in vNext conditions.`,
      'error',
      { allowedOperators: CONDITION_BINARY_OPERATORS.slice() }
    ));
  }

  if (['>', '>=', '<', '<='].includes(expression.op)) {
    [left, right].forEach((side) => {
      if (side.type !== 'number' && side.type !== 'unknown') {
        diagnostics.push(createConditionDiagnostic(
          coreDocument,
          operation,
          condition,
          CONDITION_TYPE_MISMATCH_CODE,
          `Operator "${expression.op}" expects number operands but received ${side.type}.`,
          'error',
          { expected: 'number', actual: side.type }
        ));
      }
    });
  } else if (!isComparableType(left.type, right.type)) {
    diagnostics.push(createConditionDiagnostic(
      coreDocument,
      operation,
      condition,
      CONDITION_TYPE_MISMATCH_CODE,
      `Operator "${expression.op}" cannot compare ${left.type} with ${right.type}.`,
      'error',
      { left: left.type, right: right.type }
    ));
  }

  return {
    type: 'boolean',
    pathRefs: mergePathRefs(left.pathRefs, right.pathRefs),
    expression: createExpressionRecord({
      kind: 'binary',
      op: expression.op,
      type: 'boolean',
      children: [left.expression, right.expression],
      pathRefs: mergePathRefs(left.pathRefs, right.pathRefs)
    }),
    diagnostics
  };
}

function createConditionRecord(coreDocument, operation, context) {
  const condition = operation.condition || {};
  const analyzed = analyzeExpression(coreDocument, operation, condition, condition.expression, context);
  const diagnostics = analyzed.diagnostics.slice();

  if (analyzed.type !== 'boolean' && analyzed.type !== 'unknown') {
    diagnostics.push(createConditionDiagnostic(
      coreDocument,
      operation,
      condition,
      CONDITION_ROOT_TYPE_CODE,
      `Condition root expression must be boolean but resolved to ${analyzed.type}.`,
      'error',
      { actual: analyzed.type }
    ));
  }

  return {
    schema: RMT_VNEXT_CONDITION_RECORD_SCHEMA,
    operationId: operation.id,
    sourceRef: condition.sourceRef || null,
    resultType: analyzed.type,
    pathRefs: analyzed.pathRefs,
    expression: analyzed.expression,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function normalizePathTypes(pathTypes = {}) {
  const normalized = { ...DEFAULT_CONDITION_PATH_TYPES };
  Object.keys(pathTypes || {}).forEach((path) => {
    const type = pathTypes[path];
    normalized[path] = CONDITION_VALUE_TYPES.includes(type) ? type : 'unknown';
  });
  return normalized;
}

function createConditionContract(coreDocument, options = {}) {
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  const context = {
    pathTypes: normalizePathTypes(options.pathTypes)
  };
  const conditionRecords = operations
    .filter((operation) => operation && operation.condition)
    .map((operation) => createConditionRecord(coreDocument, operation, context));
  const diagnostics = conditionRecords.flatMap((record) => record.diagnostics);
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_CONDITION_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_CONDITION_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    conditionCount: conditionRecords.length,
    operationCount: operations.length,
    expressionKinds: CONDITION_EXPRESSION_KINDS.slice(),
    operators: {
      binary: CONDITION_BINARY_OPERATORS.slice(),
      logical: CONDITION_LOGICAL_OPERATORS.slice(),
      unary: CONDITION_UNARY_OPERATORS.slice()
    },
    pathTypes: { ...context.pathTypes },
    conditions: conditionRecords,
    diagnostics
  };
}

function serializeConditionContract(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

function createRmtVNextConditionContract(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_CONDITION_SCHEMA,
    conditionSchema: RMT_VNEXT_CONDITION_RECORD_SCHEMA,
    expressionSchema: RMT_VNEXT_EXPRESSION_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_CONDITION_WORKPACKAGE,
    defaultPathTypes: DEFAULT_CONDITION_PATH_TYPES,
    createContract: (coreDocument, options = {}) => createConditionContract(coreDocument, {
      ...defaultOptions,
      ...options
    }),
    serializeContract: serializeConditionContract
  });
}

module.exports = {
  CONDITION_BINARY_OPERATORS,
  CONDITION_EXPRESSION_KIND_UNSUPPORTED_CODE,
  CONDITION_EXPRESSION_KINDS,
  CONDITION_EXPRESSION_MISSING_CODE,
  CONDITION_LOGICAL_OPERATORS,
  CONDITION_OPERATOR_UNSUPPORTED_CODE,
  CONDITION_PATH_UNKNOWN_CODE,
  CONDITION_ROOT_TYPE_CODE,
  CONDITION_TYPE_MISMATCH_CODE,
  CONDITION_UNARY_OPERATORS,
  DEFAULT_CONDITION_PATH_TYPES,
  RMT_VNEXT_CONDITION_MODULE_PATH,
  RMT_VNEXT_CONDITION_PACKAGE_SCRIPT,
  RMT_VNEXT_CONDITION_RECORD_SCHEMA,
  RMT_VNEXT_CONDITION_REPORT_SCHEMA,
  RMT_VNEXT_CONDITION_SCHEMA,
  RMT_VNEXT_CONDITION_SUITE_PATH,
  RMT_VNEXT_CONDITION_WORKPACKAGE,
  RMT_VNEXT_EXPRESSION_SCHEMA,
  createConditionContract,
  createRmtVNextConditionContract,
  serializeConditionContract
};
