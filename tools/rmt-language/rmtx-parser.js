'use strict';

const ts = require('typescript');
const { createRmtSourceModel } = require('./source-model');
const { getRmtxOperatorProfile, RMTX_OPERATOR_PROFILE_SCHEMA, RMTX_OPERATOR_PROFILE_SCHEMA_V2, RMTX_OPERATOR_PROFILE_SCHEMA_V3, RMTX_OPERATOR_PROFILE_SCHEMA_V4, RMTX_OPERATOR_PROFILE_SCHEMA_V5, RMTX_OPERATOR_PROFILE_SCHEMA_V6 } = require('./rmtx-operator-profiles');
const RMTX_PARSER_API_VERSION = '7.0.0';
const RMTX_PARSER_SCHEMA = 'xtend.rmtx.parser-result.v1';
const RMTX_PARSER_SCHEMA_V2 = 'xtend.rmtx.parser-result.v2';
const RMTX_PARSER_SCHEMA_V3 = 'xtend.rmtx.parser-result.v3';
const RMTX_PARSER_SCHEMA_V4 = 'xtend.rmtx.parser-result.v4';
const RMTX_PARSER_SCHEMA_V5 = 'xtend.rmtx.parser-result.v5';
const RMTX_PARSER_SCHEMA_V7 = 'xtend.rmtx.parser-result.v7';
const RMTX_PARSER_SCHEMA_V6 = 'xtend.rmtx.parser-result.v6';
const RMTX_HOST_SCOPES_SCHEMA = 'xtend.rmtx.host-scopes.v1';
const RMTX_HOST_SCOPES_SCHEMA_V2 = 'xtend.rmtx.host-scopes.v2';
const RMTX_HOST_SCOPES_SCHEMA_V4 = 'xtend.rmtx.host-scopes.v4';
const RMTX_HOST_SCOPES_SCHEMA_V3 = 'xtend.rmtx.host-scopes.v3';
const RMTX_COMPONENTS_SCHEMA = 'xtend.rmtx.components.v1';
const RMTX_COMPONENTS_SCHEMA_V3 = 'xtend.rmtx.components.v3';
const RMTX_COMPONENTS_SCHEMA_V2 = 'xtend.rmtx.components.v2';
const RMTX_SYNTAX_VERSION = '1.0.0';
const RMTX_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: RMTX_SYNTAX_VERSION });
const RMTX_SELECTOR_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: '2.0.0' });
const RMTX_KEYED_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: '3.0.0' });
const RMTX_ORCHESTRATION_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: '4.0.0' });
const RMTX_NATIVE_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: '5.0.0' });
const RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: '7.0.0' });
const RMTX_LIFECYCLE_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: '6.0.0' });
const MODULES = new Set(['@ccslabs/xtend/rmt-language/rmtx', '@ccslabs/xtend-compiler/rmt-language/rmtx']);
const UNSAFE = new Set(['__proto__', 'prototype', 'constructor']);
const own = (value, key) => Object.hasOwn(value, key);

class SourceError extends Error {
  constructor(code, message, node) { super(message); this.code = code; this.node = node; }
}

/** Parse a closed declarative TSX profile. No source imports or expressions execute. */
function parseRmtxSource(input = {}, options = {}) {
  input = typeof input === 'string' ? { text: input } : input && typeof input === 'object' ? input : {};
  const selectedVersion = ['2.0.0', '3.0.0', '4.0.0', '5.0.0', '6.0.0', '7.0.0'].includes(options.syntaxVersion) ? options.syntaxVersion : RMTX_SYNTAX_VERSION;
  const orchestration = selectedVersion === '7.0.0';
  const lifecycle = orchestration || selectedVersion === '6.0.0';
  const native = lifecycle || selectedVersion === '5.0.0';
  const extended = native || selectedVersion === '4.0.0';
  const profile = getRmtxOperatorProfile(selectedVersion);
  const sourceProfile = orchestration ? RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE : lifecycle ? RMTX_LIFECYCLE_SOURCE_PROFILE : native ? RMTX_NATIVE_SOURCE_PROFILE : extended ? RMTX_ORCHESTRATION_SOURCE_PROFILE : selectedVersion === '3.0.0' ? RMTX_KEYED_SOURCE_PROFILE : selectedVersion === '2.0.0' ? RMTX_SELECTOR_SOURCE_PROFILE : RMTX_SOURCE_PROFILE;
  const viewProfile = orchestration ? RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE : lifecycle ? RMTX_NATIVE_SOURCE_PROFILE : sourceProfile;
  const sourceModel = createRmtSourceModel({ ...input, languageId: 'rmtx', uri: input.uri || (input.filePath ? undefined : 'untitled:rmtx-document') });
  const diagnostics = [];
  let hostScopes = null;
  let components = null, actionInputRules = null, nativeView = null, nativeLifecycle = null;
  const result = (ast = null, phase = 'syntax') => ({ schema: orchestration ? RMTX_PARSER_SCHEMA_V7 : lifecycle ? RMTX_PARSER_SCHEMA_V6 : native ? RMTX_PARSER_SCHEMA_V5 : extended ? RMTX_PARSER_SCHEMA_V4 : selectedVersion === '3.0.0' ? RMTX_PARSER_SCHEMA_V3 : selectedVersion === '2.0.0' ? RMTX_PARSER_SCHEMA_V2 : RMTX_PARSER_SCHEMA,
    apiVersion: selectedVersion, sourceProfile, ok: diagnostics.length === 0, phase,
    status: diagnostics.length ? 'invalid' : 'parsed', sourceModel, ast, diagnostics,
    ...(['3.0.0', '4.0.0', '5.0.0', '6.0.0', '7.0.0'].includes(selectedVersion) ? { hostScopes: ast ? hostScopes : null } : {}),
    ...(extended ? { components: ast ? components : null, actionInputRules: ast ? actionInputRules : null } : {}),
    ...(native ? { nativeView: ast ? nativeView : null, actionProfile: RMTX_ORCHESTRATION_SOURCE_PROFILE } : {}),
    ...(lifecycle ? { viewProfile, nativeLifecycle: ast ? nativeLifecycle : null } : {}) });
  const diagnostic = (code, message, node, start, end) => diagnostics.push(sourceModel.createDiagnostic({
    code, message, severity: 'error', source: 'rmtx',
    range: sourceModel.rangeForOffsets(start ?? node?.getStart(file) ?? 0, end ?? node?.end ?? 1)
  }));
  let file;
  if (options.syntaxVersion !== undefined && !['1.0.0', '2.0.0', '3.0.0', '4.0.0', '5.0.0', '6.0.0', '7.0.0'].includes(options.syntaxVersion)) {
    diagnostic('rmtx.syntax.version.unsupported', `Unsupported RMTX syntax version ${String(options.syntaxVersion)}.`);
    return result(null, 'profile');
  }
  const sourcePath = input.filePath || input.uri;
  const correctExtension = input.filePath ? /\.rmtx$/iu.test(input.filePath) : /\.rmtx(?:[?#].*)?$/iu.test(sourcePath || '');
  if (sourcePath && !correctExtension && !String(sourcePath).startsWith('untitled:')) {
    diagnostic('rmtx.source.extension', 'RMTX sources require the .rmtx extension.'); return result(null, 'profile');
  }
  sourceModel.filePolicy = { extension: '.rmtx', canonical: true, fallback: false, diagnosticCode: null };
  if (Buffer.byteLength(sourceModel.text, 'utf8') > profile.limits.sourceUtf8Bytes) {
    diagnostic('rmtx.source.limit', 'The initial RMTX profile accepts at most 1 MiB of source.'); return result(null, 'profile');
  }
  try {
    file = ts.createSourceFile(input.filePath || 'document.rmtx', sourceModel.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const entry of file.parseDiagnostics) diagnostic('rmtx.syntax.invalid', ts.flattenDiagnosticMessageText(entry.messageText, '\n'), null,
      entry.start ?? 0, (entry.start ?? 0) + (entry.length ?? 1));
    if (diagnostics.length) return result();
    const bindings = new Map();
    const scopeDeclarations = [], conditionReads = [], eventDeclarations = [], componentDeclarations = [], nativeDeclarations = [], inputRules = new Map(), lifecycleDeclarations = new Map(), nativeComponents = new Map(), nativeEventKeys = new Map();
    let program = null;
    const fail = (code, message, node) => { throw new SourceError(code, message, node); };
    const safe = (key, node) => { if (UNSAFE.has(key)) fail('rmtx.path.unsafe', `Unsafe field ${key}.`, node); return key; };
    const range = node => sourceModel.rangeForOffsets(node.getStart(file), node.end);
    let count = 0;
    const make = (type, node, fields = {}) => {
      if (++count > profile.limits.generatedNodes) fail('rmtx.source.limit', 'Too many declarative nodes.', node);
      return { type, range: range(node), ...fields };
    };
    const unparen = node => { while (ts.isParenthesizedExpression(node)) node = node.expression; return node; };
    const literalNumber = (value, node) => {
      if (!Number.isFinite(value)) fail('rmtx.literal.number', 'Numbers must be finite.', node);
      if (native && Object.is(value, -0)) fail('rmtx.literal.number', 'Source5 JSON numbers must preserve their value in serialization; negative zero is forbidden.', node);
      return value;
    };
    const propertyName = node => {
      if (!ts.isIdentifier(node) && !ts.isStringLiteral(node) && !ts.isNumericLiteral(node))
        fail('rmtx.literal.property', 'Only explicit static property names are supported.', node);
      return safe(node.text, node);
    };
    function literal(node, depth = 0) {
      node = unparen(node);
      if (depth > profile.limits.literalDepth) fail('rmtx.source.limit', 'Literal nesting exceeds 64 levels.', node);
      if (ts.isStringLiteral(node)) return make('RmtPrimitiveValue', node, { kind: 'literal', value: node.text });
      if (ts.isNumericLiteral(node)) {
        const value = literalNumber(Number(node.text.replaceAll('_', '')), node);
        return make('RmtPrimitiveValue', node, { kind: 'literal', value });
      }
      if (ts.isPrefixUnaryExpression(node) && [ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken].includes(node.operator) && ts.isNumericLiteral(node.operand)) {
        const value = literalNumber(Number(node.operand.text.replaceAll('_', '')) * (node.operator === ts.SyntaxKind.MinusToken ? -1 : 1), node);
        return make('RmtPrimitiveValue', node, { kind: 'literal', value });
      }
      if ([ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind))
        return make('RmtPrimitiveValue', node, { kind: 'literal', value: node.kind === ts.SyntaxKind.NullKeyword ? null : node.kind === ts.SyntaxKind.TrueKeyword });
      if (ts.isArrayLiteralExpression(node)) return make('RmtPrimitiveValue', node, { kind: 'array', items: node.elements.map(item => literal(item, depth + 1)) });
      if (ts.isObjectLiteralExpression(node)) {
        const keys = new Set();
        const fields = node.properties.map(property => {
          if (!ts.isPropertyAssignment(property)) fail('rmtx.literal.property', 'Spreads, methods, accessors and shorthand fields are not declarative literals.', property);
          const key = propertyName(property.name);
          if (keys.has(key)) fail('rmtx.literal.duplicate', `Duplicate object field ${key}.`, property.name);
          keys.add(key);
          return make('RmtObjectValueField', property, { key, value: literal(property.initializer, depth + 1) });
        });
        return make('RmtPrimitiveValue', node, { kind: 'object', fields });
      }
      fail('rmtx.expression.unsupported', 'Only JSON literals are allowed here; source expressions are never evaluated.', node);
    }
    const decode = (text, node) => text.replace(/&([^;\s]+);/gu, (entity, token) => {
      const known = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
      if (own(known, token)) return known[token];
      const numeric = /^#(?:x([a-f\d]+)|(\d+))$/iu.exec(token);
      const value = numeric && Number.parseInt(numeric[1] || numeric[2], numeric[1] ? 16 : 10);
      if (numeric && value >= 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)) return String.fromCodePoint(value);
      fail('rmtx.attribute.entity', 'Unsupported JSX entity; use an explicit string expression.', node);
    });
    const identifier = (value, node) => make('RmtIdentifier', node, { value, parts: value.split('.') });
    function attrs(element, allowed) {
      const fields = Object.create(null);
      for (const item of element.attributes.properties) {
        if (!ts.isJsxAttribute(item) || !ts.isIdentifier(item.name)) fail('rmtx.attribute.unsupported', 'Spread and namespaced attributes are not supported.', item);
        const key = item.name.text;
        if (!allowed.includes(key)) fail('rmtx.attribute.unknown', `Unknown ${element.tagName.getText(file)} attribute ${key}.`, item.name);
        if (own(fields, key)) fail('rmtx.attribute.duplicate', `Duplicate attribute ${key}.`, item.name);
        fields[key] = item;
      }
      return fields;
    }
    function value(fields, key, required = false) {
      const field = fields[key];
      if (!field) {
        if (required) fail('rmtx.attribute.required', `Missing required attribute ${key}.`, current);
        return null;
      }
      if (!field.initializer) return make('RmtPrimitiveValue', field, { kind: 'literal', value: true });
      if (ts.isStringLiteral(field.initializer)) return make('RmtPrimitiveValue', field.initializer,
        { kind: 'literal', value: decode(field.initializer.text, field.initializer) });
      if (ts.isJsxExpression(field.initializer) && field.initializer.expression) return literal(field.initializer.expression);
      fail('rmtx.attribute.value', 'Expected a static literal attribute.', field);
    }
    function text(fields, key, required = false, symbol = false) {
      const v = value(fields, key, required);
      if (!v) return null;
      if (v.kind !== 'literal' || typeof v.value !== 'string' || !v.value || v.value.trim() !== v.value)
        fail('rmtx.attribute.string', `${key} requires a nonempty static string.`, fields[key]);
      if (symbol) {
        if (!/^[A-Za-z_$][\w$-]*(?:\.[A-Za-z_$][\w$-]*)*$/u.test(v.value)) fail('rmtx.symbol.invalid', `Unsupported symbol ${v.value}.`, fields[key]);
        v.value.split('.').forEach(part => safe(part, fields[key]));
      }
      return v.value;
    }
    function pathReference(expression) {
      expression = unparen(expression);
      const parts = [];
      while (ts.isPropertyAccessExpression(expression) && !expression.questionDotToken) {
        parts.unshift(safe(expression.name.text, expression.name)); expression = expression.expression;
      }
      if (!ts.isIdentifier(expression) || !['model', 'input'].includes(bindings.get(expression.text)) || !parts.length)
        fail('rmtx.expression.unsupported', 'Expected a direct imported model/input path; calls, computed paths and optional chains are not supported.', expression);
      return [bindings.get(expression.text) === 'model' ? 'state' : 'input', ...parts].join('.');
    }
    function scopedPath(expression, allowed, allowItemRoot = false) {
      const original = expression;
      expression = unparen(expression);
      const parts = [];
      while (ts.isPropertyAccessExpression(expression) && !expression.questionDotToken) {
        parts.unshift(safe(expression.name.text, expression.name));
        expression = expression.expression;
      }
      const binding = ts.isIdentifier(expression) && bindings.get(expression.text);
      if (!binding || !allowed.includes(binding) || (!parts.length && !(allowItemRoot && (binding === 'item' || extended && ['result', 'error', 'payload', 'input'].includes(binding)))))
        fail('rmtx.scope.path', `Expected a direct ${allowed.join('/')} path in this context.`, original);
      const root = { model: 'state', selectors: 'selector', item: 'item', params: 'input', input: 'input', result: 'result', error: 'error', payload: 'payload' }[binding];
      return { path: [root, ...parts], binding };
    }
    // A finite syntax tree, never a JavaScript evaluator. References are explicit
    // imported markers; objects and arrays keep the same closed JSON boundary.
    function primitiveExpression(node, depth = 0) {
      node = unparen(node);
      if (depth > profile.limits.literalDepth) fail('rmtx.source.limit', 'Expression nesting exceeds 64 levels.', node);
      if (ts.isPropertyAccessExpression(node) || ts.isIdentifier(node) && bindings.has(node.text)) {
        const { path } = scopedPath(node, ['model', 'input', 'selectors', 'result', 'error', 'payload'], true);
        return make('RmtPrimitiveValue', node, { kind: 'path', value: path.join('.'), path });
      }
      if (ts.isArrayLiteralExpression(node)) return make('RmtPrimitiveValue', node,
        { kind: 'array', items: node.elements.map(child => primitiveExpression(child, depth + 1)) });
      if (ts.isObjectLiteralExpression(node)) {
        const seen = new Set();
        return make('RmtPrimitiveValue', node, { kind: 'object', fields: node.properties.map(property => {
          if (!ts.isPropertyAssignment(property)) fail('rmtx.expression.object', 'Only explicit fields are allowed in declarative projections.', property);
          const key = propertyName(property.name);
          if (seen.has(key)) fail('rmtx.literal.duplicate', `Duplicate object field ${key}.`, property);
          seen.add(key);
          return make('RmtObjectValueField', property, { key, value: primitiveExpression(property.initializer, depth + 1) });
        }) });
      }
      return literal(node, depth);
    }
    function serializePrimitive(value) {
      if (value.kind === 'literal') return JSON.stringify(value.value);
      if (value.kind === 'path') return value.path.map(part => part.includes('$') ? '`' + part + '`' : part).join('.');
      if (value.kind === 'array') return `[${value.items.map(serializePrimitive).join(',')}]`;
      return `{${value.fields.map(field => `${JSON.stringify(field.key)} ${serializePrimitive(field.value)}`).join(' ')}}`;
    }
    function projection(node, depth = 0) {
      node = unparen(node);
      if (depth > profile.limits.expressionDepth) fail('rmtx.source.limit', 'Props projection exceeds the expression depth limit.', node);
      if (ts.isPropertyAccessExpression(node) || ts.isIdentifier(node) && bindings.has(node.text)) {
        const source = scopedPath(node, ['model', 'selectors', 'item'], true);
        return { kind: 'unresolved-path', binding: source.binding, path: source.path, node };
      }
      if (ts.isArrayLiteralExpression(node)) return { kind: 'array', items: node.elements.map(child => projection(child, depth + 1)) };
      if (ts.isObjectLiteralExpression(node)) {
        const fields = {}, seen = new Set();
        for (const property of node.properties) {
          if (!ts.isPropertyAssignment(property)) fail('rmtx.props.object', 'Props require explicit fields; spread, accessors and methods are forbidden.', property);
          const key = propertyName(property.name);
          if (seen.has(key)) fail('rmtx.literal.duplicate', `Duplicate object field ${key}.`, property);
          seen.add(key); fields[key] = projection(property.initializer, depth + 1);
        }
        return { kind: 'object', fields };
      }
      if (ts.isConditionalExpression(node)) return { kind: 'conditional', test: projection(node.condition, depth + 1),
        then: projection(node.whenTrue, depth + 1), else: projection(node.whenFalse, depth + 1) };
      if (ts.isPrefixUnaryExpression(node)) {
        const operand = unparen(node.operand);
        if (native && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(operand))
          literalNumber(-Number(operand.text.replaceAll('_', '')), node);
        const op = new Map([[ts.SyntaxKind.ExclamationToken, '!'], [ts.SyntaxKind.MinusToken, '-'], [ts.SyntaxKind.PlusToken, '+']]).get(node.operator);
        if (op) return { kind: 'unary', op, value: projection(node.operand, depth + 1) };
      }
      if (ts.isBinaryExpression(node)) {
        const op = new Map([[ts.SyntaxKind.EqualsEqualsEqualsToken, '==='], [ts.SyntaxKind.ExclamationEqualsEqualsToken, '!=='],
          [ts.SyntaxKind.LessThanToken, '<'], [ts.SyntaxKind.LessThanEqualsToken, '<='], [ts.SyntaxKind.GreaterThanToken, '>'], [ts.SyntaxKind.GreaterThanEqualsToken, '>='],
          [ts.SyntaxKind.AmpersandAmpersandToken, '&&'], [ts.SyntaxKind.BarBarToken, '||'], [ts.SyntaxKind.PlusToken, '+'], [ts.SyntaxKind.MinusToken, '-'],
          [ts.SyntaxKind.AsteriskToken, '*'], [ts.SyntaxKind.SlashToken, '/'], [ts.SyntaxKind.PercentToken, '%']]).get(node.operatorToken.kind);
        if (op) return { kind: 'binary', op, left: projection(node.left, depth + 1), right: projection(node.right, depth + 1) };
      }
      const value = literal(node);
      if (value.kind !== 'literal') fail('rmtx.props.expression', 'Unsupported props projection.', node);
      return { kind: 'literal', value: value.value };
    }
    function expressionField(fields, key) {
      const field = fields[key];
      if (!field) fail('rmtx.attribute.required', `Missing required attribute ${key}.`, current);
      if (!field.initializer || !ts.isJsxExpression(field.initializer) || !field.initializer.expression)
        fail('rmtx.expression.required', `${key} requires an explicit declarative expression.`, field);
      return field.initializer.expression;
    }
    function scalarExpression(node, depth, condition = false) {
      if (depth > profile.limits.expressionDepth) fail('rmtx.source.limit', 'Predicate nesting exceeds the expression limit.', node);
      if (ts.isParenthesizedExpression(node)) return scalarExpression(node.expression, depth + 1, condition);
      if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) {
        const { path } = scopedPath(node, condition ? ['model'] : ['model', 'selectors', 'item', 'params'], !condition);
        if (condition) conditionReads.push({ path, node });
        return make(condition ? 'RmtConditionExpression' : 'RmtSelectorExpression', node, { kind: 'path', path, value: path.join('.') });
      }
      const value = literal(node);
      if (value.kind !== 'literal') fail('rmtx.predicate.scalar', 'Comparisons and contains require scalar literals or direct paths.', node);
      return make('RmtConditionExpression', node, { kind: 'literal', value: value.value });
    }
    function predicate(node, depth = 0, condition = false) {
      if (depth > profile.limits.expressionDepth) fail('rmtx.source.limit', 'Predicate nesting exceeds the expression limit.', node);
      if (ts.isParenthesizedExpression(node)) return make('RmtConditionExpression', node,
        { kind: 'group', expression: predicate(node.expression, depth + 1, condition) });
      if ([ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(node.kind))
        return make('RmtConditionExpression', node, { kind: 'literal', value: node.kind === ts.SyntaxKind.TrueKeyword });
      if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
        if (!ts.isParenthesizedExpression(node.operand)) fail('rmtx.predicate.negation', 'Use !(predicate) with explicit parentheses; Classic and JavaScript negation precedence differ.', node);
        return make('RmtConditionExpression', node, { kind: 'unary', op: '!', argument: predicate(node.operand, depth + 1, condition) });
      }
      if (ts.isBinaryExpression(node)) {
        const op = node.operatorToken.kind;
        if ([ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken].includes(op)) return make('RmtConditionExpression', node,
          { kind: 'logical', op: op === ts.SyntaxKind.AmpersandAmpersandToken ? '&&' : '||',
            left: predicate(node.left, depth + 1, condition), right: predicate(node.right, depth + 1, condition) });
        const operators = new Map([[ts.SyntaxKind.EqualsEqualsEqualsToken, '=='], [ts.SyntaxKind.ExclamationEqualsEqualsToken, '!='],
          [ts.SyntaxKind.LessThanToken, '<'], [ts.SyntaxKind.LessThanEqualsToken, '<='], [ts.SyntaxKind.GreaterThanToken, '>'], [ts.SyntaxKind.GreaterThanEqualsToken, '>=']]);
        if (operators.has(op)) return make('RmtConditionExpression', node, { kind: 'binary', op: operators.get(op),
          left: scalarExpression(node.left, depth + 1, condition), right: scalarExpression(node.right, depth + 1, condition) });
        if ([ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(op))
          fail('rmtx.predicate.equality', 'Use === or !==; the underlying RMT comparison is strict.', node.operatorToken);
      }
      if (!condition && ts.isCallExpression(node) && !node.questionDotToken && !node.typeArguments?.length && ts.isIdentifier(node.expression)
        && bindings.get(node.expression.text) === 'contains' && node.arguments.length === 2) {
        return make('RmtSelectorExpression', node, { kind: 'call', name: 'contains', args: node.arguments.map(arg => scalarExpression(arg, depth + 1)) });
      }
      fail('rmtx.predicate.boolean', 'Expected an explicit boolean comparison, contains, or a composed boolean predicate; compare paths explicitly.', node);
    }
    function reducerValue(fields) {
      const field = fields.value;
      if (!field) fail('rmtx.attribute.required', 'Missing required attribute value.', current);
      const expression = field.initializer;
      if (extended && expression && ts.isJsxExpression(expression) && expression.expression)
        return serializePrimitive(primitiveExpression(expression.expression));
      if (expression && ts.isJsxExpression(expression) && expression.expression) {
        const node = unparen(expression.expression);
        if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) return selectedVersion === '1.0.0' ? pathReference(node)
          : scopedPath(node, ['model', 'input', 'selectors']).path.join('.');
      }
      const v = value(fields, 'value', true);
      if (v.kind !== 'literal') fail('rmtx.reduce.value', 'This profile supports scalar reducer literals or direct model/input paths.', field);
      return JSON.stringify(v.value);
    }
    for (const statement of file.statements) {
      if (ts.isImportDeclaration(statement)) {
        const clause = statement.importClause;
        if (!ts.isStringLiteral(statement.moduleSpecifier) || !MODULES.has(statement.moduleSpecifier.text) || statement.attributes ||
          !clause || clause.name || clause.isTypeOnly || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings))
          fail('rmtx.import.unsupported', 'Only named static imports from the RMTX authoring module are supported.', statement);
        for (const specifier of clause.namedBindings.elements) {
          const imported = (specifier.propertyName || specifier.name).text;
          if (specifier.isTypeOnly || !profile.imports.includes(imported) || bindings.has(specifier.name.text))
            fail('rmtx.import.binding', 'Unknown or duplicate authoring binding.', specifier);
          bindings.set(specifier.name.text, imported);
        }
      } else if (ts.isExportAssignment(statement) && !statement.isExportEquals && !program) program = unparen(statement.expression);
      else fail('rmtx.source.statement', 'Only authoring imports and one default JSX export are allowed; no source statements execute.', statement);
    }
    if (!program) fail('rmtx.program.required', 'Expected one default RMT.Program export.', file);
    let current = program;
    function nativeChildren(nodes, surface, repeats, path, depth, slotOwner = null) {
      return nodes.filter(child => {
        if (ts.isJsxText(child)) {
          if (child.text.trim()) fail('rmtx.native.text', 'Native text must use an explicit RMT.Text value.', child);
          return false;
        }
        return !(ts.isJsxExpression(child) && !child.expression && !child.dotDotDotToken);
      }).map((child, index) => nativeElement(child, surface, repeats, [...path, index], depth + 1, slotOwner));
    }
    function nativeElement(node, surface, repeats, path, depth, slotOwner = null) {
      if (depth > profile.limits.operatorDepth) fail('rmtx.source.limit', 'Native operator nesting exceeds 64 levels.', node);
      if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) fail('rmtx.native.node', 'Native children must be qualified declarative operators.', node);
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = opening.tagName;
      if (opening.typeArguments?.length || !ts.isPropertyAccessExpression(tag) || !ts.isIdentifier(tag.expression) || bindings.get(tag.expression.text) !== 'RMT')
        fail('rmtx.native.operator', 'Native children must resolve to qualified RMT operators without type arguments.', opening);
      const op = tag.name.text;
      if (!(orchestration ? ['Element', 'Text', 'Repeat', 'When', 'Component', 'Slot'] : ['Element', 'Text', 'Repeat', 'When']).includes(op)) fail('rmtx.native.context', 'Native views allow Element, Text, Repeat and When only.', tag);
      const fields = attrs(opening, Object.keys(profile.operators[op].attributes));
      const sourceChildren = ts.isJsxElement(node) ? node.children : [];
      const nativeDeclarationId = `native:${surface}:${path.join('.')}`;
      const output = { type: op === 'Element' ? 'element' : op === 'Component' ? 'native-component' : op === 'Slot' ? 'native-slot' : op === 'Text' ? 'text' : op === 'Repeat' ? 'native-repeat' : 'native-when', nativeDeclarationId };
      const expression = key => {
        const field = fields[key];
        if (!field) fail('rmtx.attribute.required', `Missing required attribute ${key}.`, opening);
        const expressionNode = field.initializer;
        const projected = expressionNode && ts.isJsxExpression(expressionNode) && expressionNode.expression
          ? projection(expressionNode.expression) : { kind: 'literal', value: value(fields, key, true).value };
        return { expression: projected, repeats };
      };
      if (op === 'Slot') {
        if (!slotOwner) fail('rmtx.native.slot-context', 'Slot must be a direct child of a captured public Component.', node);
        output.name = text(fields, 'name', true);
        if (!slotOwner.slots.includes(output.name)) fail('rmtx.native.slot-name', 'The selected component does not declare this slot.', fields.name);
        output.children = nativeChildren(sourceChildren, surface, repeats, path, depth);
        return output;
      }
      if (op === 'Component') {
        output.tag = text(fields, 'tag', true);
        let metadata;
        try { metadata = require('./rmtx-native-components').getRmtxNativeComponent(output.tag); }
        catch (error) { fail('rmtx.native.component', error.message, fields.tag); }
        nativeComponents.set(output.tag, metadata);
        const guard = require('../xtensions/native-component-contract');
        for (const field of ['attributes', 'properties']) {
          if (!fields[field]) continue;
          const map = projection(expressionField(fields, field));
          if (map.kind !== 'object') fail('rmtx.native.fields', `${field} requires a static scalar field map.`, fields[field]);
          for (const name of Object.keys(map.fields)) {
            if (!guard.nativeComponentSinkAllowed(metadata, name, field === 'attributes' ? 'attribute' : 'property'))
              fail('rmtx.native.component-sink', 'Unknown or unsafe public component field.', fields[field]);
            if (name === 'id' && repeats.length) fail('rmtx.native.id', 'Repeated component nodes cannot declare DOM ids.', fields[field]);
          }
          output[field] = Object.fromEntries(Object.entries(map.fields).map(([name, expression]) => [name, { expression, repeats }]));
        }
        const children = nativeChildren(sourceChildren, surface, repeats, path, depth, metadata), slots = children.filter(child => child.type === 'native-slot');
        const defaults = children.filter(child => child.type !== 'native-slot');
        if (defaults.length) {
          if (!metadata.slots.includes('default')) fail('rmtx.native.slot-name', 'This component has no default slot; use its declared named slots.', node);
          slots.push({type:'native-slot',name:'default',nativeDeclarationId: nativeDeclarationId + ':default',children:defaults});
        }
        if (new Set(slots.map(slot => slot.name)).size !== slots.length) fail('rmtx.native.slot-duplicate', 'Each component slot may be supplied once.', node);
        output.slots = slots;
        return output;
      }
      if (op === 'Text') {
        if (sourceChildren.some(child => !ts.isJsxText(child) || child.text.trim())) fail('rmtx.native.text', 'RMT.Text cannot have children.', node);
        output.value = expression('value'); return output;
      }
      if (op === 'When') output.test = expression('test');
      if (op === 'Repeat') {
        const fromNode = expressionField(fields, 'from');
        const source = scopedPath(fromNode, repeats.length ? ['item'] : ['model']);
        const keyNode = expressionField(fields, 'keyBy'), key = scopedPath(keyNode, ['item']).path.slice(1);
        const nextRepeats = [...repeats, { source, key, node: fromNode }];
        output.repeat = nextRepeats;
        output.children = nativeChildren(sourceChildren, surface, nextRepeats, path, depth);
        if (!output.children.length) fail('rmtx.native.repeat.empty', 'A native Repeat requires declarative children.', node);
        return output;
      }
      if (op === 'Element') {
        output.tag = text(fields, 'tag', true);
        const { NATIVE_VIEW_TAG_NAMES, NATIVE_VIEW_VOID_TAG_NAMES, assertNativeAttributeName, assertNativePropertyName } = require('../xtensions/native-view-projection');
        if (!NATIVE_VIEW_TAG_NAMES.includes(output.tag)) fail('rmtx.native.tag', 'Element requires an allowed native HTML tag.', fields.tag);
        for (const field of ['attributes', 'properties']) {
          if (!fields[field]) continue;
          const map = projection(expressionField(fields, field));
          if (map.kind !== 'object') fail('rmtx.native.fields', 'Native fields require an explicit object of scalar projections.', fields[field]);
          for (const key of Object.keys(map.fields)) {
            try { (field === 'attributes' ? assertNativeAttributeName : assertNativePropertyName)(key); }
            catch (error) { fail('rmtx.native.sink', error.message, fields[field]); }
            if (key === 'id' && repeats.length) fail('rmtx.native.id', 'Repeated native elements cannot declare DOM ids.', fields[field]);
          }
          output[field] = Object.fromEntries(Object.entries(map.fields).map(([key, expression]) => [key, { expression, repeats }]));
        }
        output.children = nativeChildren(sourceChildren, surface, repeats, path, depth);
        if (NATIVE_VIEW_VOID_TAG_NAMES.includes(output.tag) && output.children.length) fail('rmtx.native.void', 'Void HTML elements cannot have children.', node);
        return output;
      }
      output.children = nativeChildren(sourceChildren, surface, repeats, path, depth);
      return output;
    }
    function element(node, expected, depth = 0, scopeStack = [], surfaceTarget = null) {
      current = node;
      if (depth > profile.limits.operatorDepth) fail('rmtx.source.limit', 'Operator nesting exceeds 64 levels.', node);
      if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) fail('rmtx.child.unsupported', 'Expected a declarative RMT operator element.', node);
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.typeArguments?.length) fail('rmtx.operator.type-arguments', 'Operator type arguments are not supported by this syntax profile.', opening.typeArguments[0]);
      const tag = opening.tagName;
      if (!ts.isPropertyAccessExpression(tag) || !ts.isIdentifier(tag.expression) || bindings.get(tag.expression.text) !== 'RMT')
        fail('rmtx.operator.binding', 'Operators must resolve to the imported RMT namespace.', tag);
      const op = tag.name.text;
      if (!own(profile.operators, op)) fail('rmtx.operator.unknown', `Unsupported RMT operator ${op} in syntax profile ${selectedVersion}.`, tag.name);
      if (!expected.includes(op)) fail('rmtx.operator.context', `${op} is not valid in this child context.`, tag.name);
      const children = ts.isJsxElement(node) ? node.children.filter(child => {
        if (ts.isJsxText(child)) {
          if (child.text.trim()) fail('rmtx.child.text', 'Native text/UI children belong to a later profile.', child);
          return false;
        }
        if (ts.isJsxExpression(child) && !child.expression && !child.dotDotDotToken) return false;
        return true;
      }) : [];
      const lowerChildren = (scopes = scopeStack, target = surfaceTarget) => children.flatMap(child => element(child, profile.operators[op].children, depth + 1, scopes, target));
      const leaf = () => { if (children.length) fail('rmtx.child.unsupported', `${op} cannot have children.`, children[0]); };
      let fields = attrs(opening, Object.keys(profile.operators[op].attributes));
      if (orchestration && ['Mount','Hydrate','Suspend','Resume','Invalidate','Dispose','Prewarm','Recycle','Detach','Reattach'].includes(op)) {
        if (!surfaceTarget || children.length) fail('rmtx.lifecycle.scope', 'Native lifecycle operators require their owning Surface without Source or Policy children.', node);
        const target = text(fields, 'target', true, true);
        if (target !== surfaceTarget) fail('rmtx.lifecycle.target', 'Native lifecycle operations target their owning Surface declaration.', fields.target);
        const statement = make('RmtLifecycleStatement', node, {op:op.toLowerCase(),target:identifier(target,fields.target),source:null,condition:null,policy:null});
        lifecycleDeclarations.set(statement,{when:fields.when ? projection(expressionField(fields,'when')) : {kind:'literal',value:true},repeats:scopeStack,range:range(node),node});
        return statement;
      }
      if (lifecycle && op === 'Mount' && fields.when) {
        if (!surfaceTarget || scopeStack.length || children.length)
          fail('rmtx.lifecycle.scope', 'A guarded Mount requires a static owning Surface and cannot carry Source or Policy children.', node);
        const target = text(fields, 'target', true, true);
        if (target !== surfaceTarget) fail('rmtx.lifecycle.target', 'A guarded Mount must target its own Surface.', fields.target);
        const statement = make('RmtLifecycleStatement', node, { op: 'mount', target: identifier(target, fields.target), source: null, condition: null, policy: null });
        lifecycleDeclarations.set(statement, { when: projection(expressionField(fields, 'when')), range: range(node), node });
        return statement;
      }
      if (extended) {
        const lowered = require('./rmtx-extended-operators').lowerExtendedOperator(op,
          { ts, file, make, fail, identifier, attrs, value, text, expressionField, scopedPath, predicate, literal,
            primitiveExpression, serializePrimitive, lowerChildren, leaf, fields, node, op, scopeStack, surfaceTarget, native, sourceProfile });
        if (lowered !== undefined) return lowered;
      }
      switch (op) {
        case 'Program':
          return make('RmtTemplateDeclaration', node, { name: text(fields, 'id', true, true),
            body: lowerChildren() });
        case 'State': {
          leaf();
          const preserve = value(fields, 'preserve');
          if (preserve && (preserve.kind !== 'literal' || typeof preserve.value !== 'boolean')) fail('rmtx.attribute.boolean', 'preserve requires a boolean.', fields.preserve);
          return make('RmtStateDeclaration', node, { name: text(fields, 'id', true, true), dataType: make('RmtTypeReference', fields.type || node, { value: text(fields, 'type', true) }),
            initial: value(fields, 'initial', true), preserve: preserve ? preserve.value : false, body: [] });
        }
        case 'Action':
          return make('RmtActionDeclaration', node, { name: text(fields, 'id', true, true), body: lowerChildren() });
        case 'Input': {
          if (!extended) leaf();
          const name = text(fields, 'name', true, true), type = text(fields, 'type', true);
          const policy = extended ? lowerChildren() : [];
          if (policy.length > 1) fail('rmtx.input.policy', 'An Input accepts at most one InputPolicy.', node);
          const rule = { name, type };
          if (extended) {
            for (const key of ['optional', 'nullable']) if (fields[key]) {
              const flag = value(fields, key);
              if (flag.kind !== 'literal' || typeof flag.value !== 'boolean') fail('rmtx.input.rule', `${key} requires a boolean literal.`, fields[key]);
              rule[key] = flag.value;
            }
            if (fields.default) {
              const json = value(fields, 'default');
              const decodeValue = v => v.kind === 'literal' ? v.value : v.kind === 'array' ? v.items.map(decodeValue)
                : Object.fromEntries(v.fields.map(field => [field.key, decodeValue(field.value)]));
              rule.default = decodeValue(json);
            }
          }
          const lowered = make('RmtActionInputClause', node, { name,
            dataType: make('RmtTypeReference', fields.type || node, { value: type }), policy: policy[0] || null });
          if (extended) inputRules.set(lowered, rule);
          return lowered;
        }
        case 'Reduce': {
          leaf();
          const target = 'state.' + text(fields, 'state', true, true) + (fields.path ? '.' + text(fields, 'path', true, true) : '');
          return make('RmtReducerStatement', node, { target, targetNode: identifier(target, fields.state), expression: reducerValue(fields) });
        }
        case 'Portal':
          leaf();
          return make('RmtPortalDeclaration', node, { name: text(fields, 'id', true, true), body: [], attributes: ['root', 'layer'].filter(key => fields[key]).map(key =>
            make('RmtPrimitiveAttribute', fields[key], { keyword: key, value: make('RmtPrimitiveValue', fields[key], { kind: 'literal', value: text(fields, key, true) }) })) });
        case 'View': {
          if (!native || !surfaceTarget || !orchestration && scopeStack.length || nativeDeclarations.some(view => view.surface === surfaceTarget))
            fail('rmtx.native.owner', 'A native View requires its own ordinary unscoped Surface and may be declared once.', node);
          nativeDeclarations.push({ surface: surfaceTarget, ...(orchestration && scopeStack.length ? { repeats: scopeStack } : {}), children: nativeChildren(children, surfaceTarget, orchestration ? scopeStack : [], [], depth) });
          return [];
        }
        case 'Surface': {
          const name = text(fields, 'id', true, true);
          if (native) {
            if (fields.kind && !profile.operators.Surface.attributes.kind.values.includes(text(fields, 'kind', true)))
              fail('rmtx.native.surface-kind', 'Source5 requires an explicitly supported surface kind.', fields.kind);
            if (fields.component && !require('../xtensions/native-view-projection').NATIVE_VIEW_TAG_NAMES.includes(text(fields, 'component', true)))
              fail('rmtx.native.surface-component', 'Source5 Surface components use the closed native HTML profile; custom components require a separate contract.', fields.component);
            if (!orchestration && fields.present && children.some(child => (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) && (ts.isJsxElement(child) ? child.openingElement.tagName : child.tagName).getText(file).endsWith('.View')))
              fail('rmtx.native.owner', 'A native View cannot be attached to a conditional XTension host.', node);
          }
          if (scopeStack.length || fields.present || orchestration && surfaceTarget) {
            const presenceNode = fields.present ? expressionField(fields, 'present') : null;
            const presence = presenceNode ? scopedPath(presenceNode, scopeStack.length ? ['model', 'item'] : ['model']) : null;
            scopeDeclarations.push({ surface: name, repeats: scopeStack, ...(orchestration && surfaceTarget ? {parent:surfaceTarget,placement:fields.portal?'portal':'nested'} : orchestration && fields.portal ? {placement:'portal'} : {}),
              presence: presence && { ...presence, node: presenceNode }, range: range(node) });
          }
          const metadata = ['kind', 'component'].filter(key => native || fields[key]).map(key => make('RmtSurfaceHeaderClause', fields[key] || node,
            { keyword: key, value: make('RmtPrimitiveValue', fields[key] || node, { kind: 'literal', value: fields[key] ? text(fields, key, true) : key === 'kind' ? 'region' : 'div' }) }));
          const body = fields.portal ? [make('RmtSurfacePortalClause', fields.portal, { keyword: 'portal', path: text(fields, 'portal', true, true) })] : [];
          const lowered = lowerChildren(scopeStack, name);
          if (native && nativeDeclarations.some(entry => entry.surface === name) && componentDeclarations.some(entry => entry.surface === name))
            fail('rmtx.native.owner', 'Native views and provider-owned children cannot share a host Surface.', node);
          if (orchestration && componentDeclarations.some(entry => entry.surface === name) && scopeDeclarations.some(entry => entry.parent === name && entry.placement === 'nested'))
            fail('rmtx.native.owner', 'A provider-owned Surface cannot contain physically nested native Surface wrappers; use an explicit Portal outside its foreign root.', node);
          if (orchestration && nativeDeclarations.some(view => view.surface === name)
              && !lowered.some(child => child.type === 'RmtLaneDeclaration' && child.body.some(statement => statement.type === 'RmtLifecycleStatement' && statement.op === 'mount'))) {
            // A native View has the same automatic CSR admission as its rendered
            // content. Desugar that default into an ordinary Classic AST1 Mount
            // so Kernel, source-map and Lifecycle2 authority share one real job.
            // An authored Mount (including when=false) always owns admission.
            const statement = make('RmtLifecycleStatement', node, { op: 'mount', target: identifier(name, node), source: null, condition: null, policy: null });
            lifecycleDeclarations.set(statement, { when: { kind: 'literal', value: true }, repeats: scopeStack, range: range(node), node });
            let lane = lowered.find(child => child.type === 'RmtLaneDeclaration' && child.name === 'visible');
            if (!lane) { lane = make('RmtLaneDeclaration', node, { name: 'visible', weight: null, body: [] }); lowered.push(lane); }
            lane.body.push(statement);
          }
          if (extended && componentDeclarations.some(entry => entry.surface === name)) {
            if (lowered.some(child => ['RmtEventBinding', 'RmtLaneDeclaration'].includes(child.type)))
              fail('rmtx.component.host', 'An inline XTension owns its host lifecycle and provider-intent boundary.', node);
            const declaration = componentDeclarations.find(entry => entry.surface === name);
            lowered.push(make('RmtLaneDeclaration', node, { name: declaration.lane, weight: null, body: [
              make('RmtLifecycleStatement', node, { op: 'mount', target: identifier(name, node), source: null, condition: null, policy: null })
            ] }));
          }
          if ((scopeStack.length || fields.present) && !(orchestration && nativeDeclarations.some(view=>view.surface===name)) && lowered.some(child => child.type === 'RmtEventBinding'))
            fail('rmtx.host-scope.native-event', 'Scoped XTension hosts use validated provider intents; native On bindings belong on ordinary owner surfaces.', node);
          return make('RmtSurfaceDeclaration', node, { name, metadata, body: body.concat(lowered) });
        }
        case 'Lane':
          return make('RmtLaneDeclaration', node, { name: text(fields, 'name', true, true),
            weight: extended && fields.weight ? value(fields, 'weight').value : null, body: lowerChildren() });
        case 'Mount':
          leaf();
          return make('RmtLifecycleStatement', node, { op: 'mount', target: identifier(text(fields, 'target', true, true), fields.target), source: null, condition: null, policy: null });
        case 'Selector': {
          const sourceNode = expressionField(fields, 'from');
          const sourcePath = scopedPath(sourceNode, ['model', 'selectors']).path;
          return make('RmtSelectorDeclaration', node, { name: text(fields, 'id', true, true),
            source: make('RmtPrimitiveSourceReference', sourceNode, { kind: sourcePath[0], value: sourcePath.slice(1).join('.') }), body: lowerChildren() });
        }
        case 'Where':
        case 'Find': {
          leaf(); const sourceNode = expressionField(fields, 'test');
          return make(op === 'Where' ? 'RmtSelectorWhereClause' : 'RmtSelectorFindClause', node,
            { keyword: op.toLowerCase(), expression: predicate(sourceNode) });
        }
        case 'Sort': {
          leaf(); const sourceNode = expressionField(fields, 'by');
          const by = scopedPath(sourceNode, ['item']).path.join('.');
          const direction = fields.direction ? text(fields, 'direction', true) : null;
          if (direction && !['asc', 'desc'].includes(direction)) fail('rmtx.sort.direction', 'Sort direction must be asc or desc.', fields.direction);
          return make('RmtSelectorSortClause', node, { by, direction });
        }
        case 'Output':
          leaf(); return make('RmtSelectorOutputClause', node, { dataType: make('RmtTypeReference', fields.type || node, { value: text(fields, 'type', true) }) });
        case 'Repeat': {
          const fromNode = expressionField(fields, 'from');
          const source = scopedPath(fromNode, scopeStack.length ? ['item'] : ['model']);
          const keyNode = expressionField(fields, 'keyBy');
          const key = scopedPath(keyNode, ['item']).path.slice(1);
          if (!children.length) fail('rmtx.repeat.empty', 'A host Repeat requires Surface declarations or nested Repeat scopes.', node);
          return native ? children.flatMap(child => element(child, ['Repeat', 'Surface'], depth + 1, [...scopeStack, { source, key, node: fromNode }], surfaceTarget)) : lowerChildren([...scopeStack, { source, key, node: fromNode }]);
        }
        case 'On': {
          leaf();
          const event = text(fields, 'event', true, true), action = text(fields, 'action', true, true);
          const payload = value(fields, 'payload', true);
          if (payload.kind !== 'object' || !extended && !payload.fields.length)
            fail('rmtx.event.payload', 'On requires a nonempty static payload map from Action fields to detail/target paths.', fields.payload);
          const keyFields = {};
          if (orchestration && fields.keys) {
            const raw = value(fields, 'keys');
            if (raw.kind !== 'object' || !scopeStack.length) fail('rmtx.native.event-keys', 'Native event keys require a scoped owning Surface and a static field/index map.', fields.keys);
            for (const field of raw.fields) {
              safe(field.key, fields.keys);
              if (field.value.kind !== 'literal' || !Number.isSafeInteger(field.value.value) || Object.is(field.value.value, -0)
                  || field.value.value < 0 || field.value.value >= scopeStack.length || payload.fields.some(value => value.key === field.key))
                fail('rmtx.native.event-keys', 'Event key fields require distinct Action fields and declared ancestor key indices.', fields.keys);
              keyFields[field.key] = field.value.value;
            }
          }
          const mappings = payload.fields.map(field => {
            const path = field.value;
            if (!/^[A-Za-z_$][\w$-]*$/u.test(field.key) || path.kind !== 'literal' || typeof path.value !== 'string'
                || !/^(?:detail|target)(?:\.[A-Za-z_$][\w$-]*)+$/u.test(path.value))
              fail('rmtx.event.payload', 'Payload values must be explicit direct detail/target path strings.', fields.payload);
            if(orchestration && /(?:^|\.)__rmtxScopedKeys(?:\.|$)/u.test(path.value)) fail('rmtx.native.event-keys', 'The scoped key transport is compiler-owned; use On.keys.', fields.payload);
            field.key.split('.').forEach(part => safe(part, fields.payload));
            path.value.split('.').forEach(part => safe(part, fields.payload));
            return make('RmtEventPayloadMapping', fields.payload, { name: field.key, source: path.value });
          });
          for(const [name,index]of Object.entries(keyFields)) mappings.push(make('RmtEventPayloadMapping',fields.keys,{name,source:`detail.__rmtxScopedKeys.k${index}`}));
          eventDeclarations.push({ action, fields: mappings.map(mapping => mapping.name), node: fields.payload, actionNode: fields.action });
          if (extended && fields.preventDefault) {
            const option = value(fields, 'preventDefault');
            if (option.kind !== 'literal' || typeof option.value !== 'boolean') fail('rmtx.event.option', 'preventDefault requires a boolean literal.', fields.preventDefault);
            mappings.push(make('RmtEventOptionClause', fields.preventDefault, { keyword: 'preventDefault', value: option }));
          }
          const statement = make('RmtEventBinding', node, { event, action,
            selector: make('RmtEventSelector', node, { value: `[data-rmt-surface="${surfaceTarget}"]` }), target: null,
            condition: fields.when ? make('RmtConditionClause', fields.when,
              { expression: predicate(expressionField(fields, 'when'), 0, true) }) : null,
            policy: make('RmtEventPayloadBlock', fields.payload, { body: mappings }) });
          if(Object.keys(keyFields).length)nativeEventKeys.set(statement,{surface:surfaceTarget,fields:keyFields});
          return statement;
        }
        case 'XTension': {
          leaf();
          if (!surfaceTarget || componentDeclarations.some(entry => entry.surface === surfaceTarget))
            fail('rmtx.component.host', 'An XTension requires its own Surface with exactly one provider declaration.', node);
          const props = fields.props ? projection(expressionField(fields, 'props')) : { kind: 'object', fields: {} };
          if (props.kind !== 'object') fail('rmtx.component.props', 'XTension props require an explicit object projection.', fields.props || node);
          const decodeValue = v => v.kind === 'literal' ? v.value : v.kind === 'array' ? v.items.map(decodeValue)
            : Object.fromEntries(v.fields.map(field => [field.key, decodeValue(field.value)]));
          const intents = fields.intents ? decodeValue(value(fields, 'intents')) : {};
          if (!intents || Array.isArray(intents) || typeof intents !== 'object') fail('rmtx.component.intents', 'Intents require an explicit static object.', fields.intents || node);
          componentDeclarations.push({ declarationId: text(fields, 'id', true, true), surface: surfaceTarget,
            providerId: text(fields, 'provider', true), ownerSurface: text(fields, 'owner', true, true),
            lane: text(fields, 'lane', true, true), props: props.fields, intents, range: range(node) });
          return [];
        }
        default: throw new Error('Unreachable RMTX operator.');
      }
    }
    const template = element(program, ['Program']);
    if (orchestration) {
      // The formal Classic AST1 keeps Surface declarations at template scope.
      // Source7 preserves lexical ownership in Header2.scopes rather than
      // inventing nested AST wire types that existing consumers cannot read.
      const flattened = [];
      const append = declaration => {
        flattened.push(declaration);
        if (declaration.type !== 'RmtSurfaceDeclaration') return;
        const nested = declaration.body.filter(child => child.type === 'RmtSurfaceDeclaration');
        declaration.body = declaration.body.filter(child => child.type !== 'RmtSurfaceDeclaration');
        nested.forEach(append);
      };
      template.body.forEach(append);
      template.body = flattened;
    }
    const documentDeclarations = extended ? template.body.filter(child => child.type === 'RmtRemoteSurfaceDeclaration') : [];
    if (extended) template.body = template.body.filter(child => child.type !== 'RmtRemoteSurfaceDeclaration');
    const ast = make('RmtVNextDocument', program, { schema: 'xtend.rmt.vnext.ast.v1', body: [template, ...documentDeclarations] });
    if (selectedVersion === '3.0.0' || extended) {
      const states = template.body.filter(node => node.type === 'RmtStateDeclaration').map(node => node.name)
        .sort((left, right) => right.length - left.length);
      function modelPath(path, node) {
        const reference = path.slice(1).join('.');
        const state = states.find(id => reference === id || reference.startsWith(id + '.'));
        if (!state) fail('rmtx.model.reference', `Unknown Model state in ${reference}.`, node);
        const suffix = reference.slice(state.length);
        return { state, path: suffix ? suffix.slice(1).split('.') : [] };
      }
      conditionReads.forEach(read => modelPath(read.path, read.node));
      const actions = new Map(template.body.filter(node => node.type === 'RmtActionDeclaration').map(node => [node.name, node]));
      if (extended) actionInputRules = { schema: 'xtend.rmtx.action-input-rules.v1', sourceProfile: native ? RMTX_ORCHESTRATION_SOURCE_PROFILE : sourceProfile,
        actions: [...actions.values()].map(action => ({ id: action.name,
          inputs: action.body.filter(child => child.type === 'RmtActionInputClause').map(child => inputRules.get(child)) })) };
      for (const declaration of eventDeclarations) {
        const action = actions.get(declaration.action);
        if (!action) fail('rmtx.action.reference', `Unknown Action ${declaration.action}.`, declaration.actionNode);
        const inputs = action.body.filter(node => node.type === 'RmtActionInputClause').map(node => node.name);
        const required = extended ? action.body.filter(child => child.type === 'RmtActionInputClause'
          && !inputRules.get(child).optional && !own(inputRules.get(child), 'default')).map(child => child.name) : inputs;
        if ((!extended && inputs.length !== declaration.fields.length) || declaration.fields.some(name => !inputs.includes(name)) || required.some(name => !declaration.fields.includes(name)))
          fail('rmtx.event.payload.inputs', 'On payload fields must exactly match the declared Action inputs.', declaration.node);
      }
      hostScopes = { schema: orchestration ? RMTX_HOST_SCOPES_SCHEMA_V4 : native ? RMTX_HOST_SCOPES_SCHEMA_V3 : extended ? RMTX_HOST_SCOPES_SCHEMA_V2 : RMTX_HOST_SCOPES_SCHEMA, sourceProfile: viewProfile,
        hosts: scopeDeclarations.map(declaration => {
          const repeat = declaration.repeats.map((scope, index) => ({
            ...(index === 0 ? modelPath(scope.source.path, scope.node) : { path: scope.source.path.slice(1) }), key: scope.key
          }));
          const presence = !declaration.presence ? null : declaration.presence.binding === 'model'
            ? modelPath(declaration.presence.path, declaration.presence.node)
            : { state: repeat[0].state,
              path: [...repeat.flatMap((scope, index) => [...scope.path, { repeat: index }]), ...declaration.presence.path.slice(1)] };
          return { surface: declaration.surface, ...(repeat.length ? { repeat } : {}), ...(presence ? { presence } : {}), ...(declaration.parent?{parent:declaration.parent}:{}), ...(declaration.placement?{placement:declaration.placement}:{}), range: declaration.range };
        }) };
      if (orchestration) for(const host of componentDeclarations){
        const existing=hostScopes.hosts.find(scope=>scope.surface===host.surface);
        if(existing){if(existing.parent&&existing.parent!==host.ownerSurface)fail('rmtx.component.owner','Provider owner differs from its lexical Surface owner.',program);existing.parent=host.ownerSurface;if(!existing.placement)existing.placement='portal';}
        else hostScopes.hosts.push({surface:host.surface,parent:host.ownerSurface,placement:'portal',range:host.range});
      }
      if (extended) {
        const selectorNames = template.body.filter(node => node.type === 'RmtSelectorDeclaration').map(node => node.name).sort((a, b) => b.length - a.length);
        const resolveProjection = (expression, host) => {
          if (expression.kind === 'unresolved-path') {
            if (expression.binding === 'model') return { kind: 'path', root: 'state', symbol: modelPath(expression.path, expression.node).state,
              path: modelPath(expression.path, expression.node).path };
            if (expression.binding === 'selectors') {
              const reference = expression.path.slice(1).join('.'), symbol = selectorNames.find(id => reference === id || reference.startsWith(id + '.'));
              if (!symbol) fail('rmtx.selector.reference', `Unknown Selector in ${reference}.`, expression.node);
              return { kind: 'path', root: 'selector', symbol, path: reference === symbol ? [] : reference.slice(symbol.length + 1).split('.') };
            }
            if (!host.repeat?.length) fail('rmtx.component.item', 'item props require a source Repeat host.', expression.node);
            return { kind: 'path', root: 'state', symbol: host.repeat[0].state,
              path: [...host.repeat.flatMap((scope, index) => [...scope.path, { repeat: index }]), ...expression.path.slice(1)] };
          }
          if (expression.kind === 'object') return { kind: 'object', fields: Object.fromEntries(Object.entries(expression.fields).map(([key, child]) => [key, resolveProjection(child, host)])) };
          if (expression.kind === 'array') return { kind: 'array', items: expression.items.map(child => resolveProjection(child, host)) };
          if (expression.kind === 'conditional') return { kind: 'conditional', test: resolveProjection(expression.test, host), then: resolveProjection(expression.then, host), else: resolveProjection(expression.else, host) };
          if (expression.kind === 'unary') return { kind: 'unary', op: expression.op, value: resolveProjection(expression.value, host) };
          if (expression.kind === 'binary') return { kind: 'binary', op: expression.op, left: resolveProjection(expression.left, host), right: resolveProjection(expression.right, host) };
          return expression;
        };
        for (const declaration of lifecycleDeclarations.values()) {
          const repeat=(declaration.repeats || []).map((scope,index)=>({...(!index?modelPath(scope.source.path,scope.node):{path:scope.source.path.slice(1)}),key:scope.key}));
          declaration.repeat=repeat; declaration.resolvedWhen = resolveProjection(declaration.when, {repeat});
        }
        components = { schema: orchestration ? RMTX_COMPONENTS_SCHEMA_V3 : native ? RMTX_COMPONENTS_SCHEMA_V2 : RMTX_COMPONENTS_SCHEMA, sourceProfile: viewProfile, documentId: template.name,
          hosts: componentDeclarations.map(declaration => {
            const scope = hostScopes.hosts.find(host => host.surface === declaration.surface) || {};
            return { ...declaration, ...(scope.repeat ? { repeat: scope.repeat } : {}), ...(scope.presence ? { presence: scope.presence } : {}),
              props: Object.fromEntries(Object.entries(declaration.props).map(([key, expression]) => [key, resolveProjection(expression, scope)])) };
          }) };
        if (native) {
          const canonicalScopes = repeats => repeats.map((scope, index) => ({
            ...(index === 0 ? modelPath(scope.source.path, scope.node) : { path: scope.source.path.slice(1) }), key: scope.key
          }));
          function resolveNative(node) {
            const output = { type: node.type, nativeDeclarationId: node.nativeDeclarationId };
            if (node.tag) output.tag = node.tag;
            if (node.name) output.name = node.name;
            for (const field of ['value', 'test']) if (node[field]) output[field] = resolveProjection(node[field].expression, { repeat: canonicalScopes(node[field].repeats) });
            for (const field of ['attributes', 'properties']) if (node[field]) output[field] = Object.fromEntries(Object.entries(node[field])
              .map(([key, value]) => [key, resolveProjection(value.expression, { repeat: canonicalScopes(value.repeats) })]));
            if (node.repeat) output.repeat = canonicalScopes(node.repeat);
            if (node.children) output.children = node.children.map(resolveNative);
            if (node.slots) output.slots = node.slots.map(resolveNative);
            return output;
          }
          nativeView = { schema: orchestration ? 'xtend.rmtx.native-view.v2' : 'xtend.rmtx.native-view.v1', sourceProfile: viewProfile, documentId: template.name,
            ...(orchestration ? {eventKeys:[],components:[...nativeComponents.values()].sort((a,b)=>a.tag.localeCompare(b.tag)),scopes:hostScopes.hosts.map(({surface,repeat,presence,parent,placement})=>({surface,...(repeat?{repeat}:{}),...(presence?{presence}:{}),...(parent?{parent}:{}),...(placement?{placement}:{})}))} : {}),
            views: nativeDeclarations.map(view => ({ surface: view.surface, ...(view.repeats?{repeat:canonicalScopes(view.repeats)}:{}), children: view.children.map(resolveNative) })) };
          try { (orchestration ? require('./rmtx-native-view').validateRmtxNativeOrchestrationViewContract : require('./rmtx-native-view').validateNativeViewContract)(nativeView); }
          catch (error) { fail('rmtx.native.contract', error.message, program); }
        }
        for (const scope of hostScopes.hosts) if (!orchestration && !components.hosts.some(host => host.surface === scope.surface))
          fail('rmtx.component.host', 'Source4 Repeat/present requires an inline XTension in each scoped Surface.', program);
      }
    }
    function pointers(value, pointer = '') {
      if (!value || typeof value !== 'object') return;
      if (value.type) value.astPointer = pointer || '/';
      for (const [key, child] of Object.entries(value)) {
        if (key === 'range' || key === 'astPointer') continue;
        if (Array.isArray(child)) child.forEach((item, i) => pointers(item, `${pointer}/${key}/${i}`));
        else pointers(child, `${pointer}/${key}`);
      }
    }
    pointers(ast);
    if(orchestration)nativeView.eventKeys=[...nativeEventKeys].map(([statement,record])=>({astPointer:statement.astPointer,...record}));
    if (lifecycle) {
      const operations = [], matched = new Set();
      const declaredSurfaces = [];
      const collectSurfaces = node => { if(!node||typeof node!=='object')return; if(node.type==='RmtSurfaceDeclaration')declaredSurfaces.push(node); for(const child of node.body||[])collectSurfaces(child); };
      collectSurfaces(template);
      for (const surface of orchestration ? declaredSurfaces : template.body.filter(child => child.type === 'RmtSurfaceDeclaration')) {
        for (const lane of surface.body.filter(child => child.type === 'RmtLaneDeclaration')) {
          for (const statement of lane.body) {
            const declaration = lifecycleDeclarations.get(statement);
            if (!declaration) continue;
            if (!orchestration && lane.name !== 'visible') fail('rmtx.lifecycle.lane', 'This lifecycle profile admits guarded Mount only in the visible Lane.', declaration.node);
            if (!nativeDeclarations.some(view => view.surface === surface.name) || !orchestration && scopeDeclarations.some(scope => scope.surface === surface.name)
              || componentDeclarations.some(host => host.surface === surface.name) || operations.some(operation => operation.ownerSurface === surface.name && (!orchestration || operation.op === statement.op)))
              fail('rmtx.lifecycle.owner', 'A Surface with its own native View permits one guarded Mount, without provider ownership or host scopes.', declaration.node);
            matched.add(statement);
            operations.push({ astPointer: statement.astPointer, ownerSurface: surface.name, target: statement.target.value,
              op: orchestration ? statement.op : 'mount', lane: lane.name, when: declaration.resolvedWhen, ...(declaration.repeat?.length ? {repeat:declaration.repeat} : {}), range: declaration.range });
          }
        }
      }
      if (matched.size !== lifecycleDeclarations.size) fail('rmtx.lifecycle.scope', 'Guarded Mount declarations must be direct children of an owning Surface Lane.', program);
      nativeLifecycle = { schema: orchestration ? 'xtend.rmtx.native-lifecycle.v2' : 'xtend.rmtx.native-lifecycle.v1', documentId: template.name, sourceProfile,
        viewProfile, actionProfile: RMTX_ORCHESTRATION_SOURCE_PROFILE, operations };
      try { (orchestration ? require('./rmtx-native-lifecycle').validateRmtxNativeOrchestrationLifecycleContract : require('./rmtx-native-lifecycle').validateRmtxNativeLifecycleContract)(nativeLifecycle); }
      catch (error) { fail(error.code || 'rmtx.lifecycle.invalid', error.message, program); }
    }
    return result(ast, 'parse');
  } catch (error) {
    if (!(error instanceof SourceError) && !(error instanceof RangeError)) throw error;
    diagnostic(error.code || 'rmtx.source.limit', error.message, error.node);
    return result(null, 'lowering');
  }
}

module.exports = { RMTX_PARSER_API_VERSION, RMTX_PARSER_SCHEMA, RMTX_PARSER_SCHEMA_V2, RMTX_PARSER_SCHEMA_V3, RMTX_PARSER_SCHEMA_V4, RMTX_PARSER_SCHEMA_V5, RMTX_PARSER_SCHEMA_V6, RMTX_PARSER_SCHEMA_V7,
  RMTX_HOST_SCOPES_SCHEMA, RMTX_HOST_SCOPES_SCHEMA_V2, RMTX_HOST_SCOPES_SCHEMA_V3, RMTX_HOST_SCOPES_SCHEMA_V4, RMTX_COMPONENTS_SCHEMA, RMTX_COMPONENTS_SCHEMA_V2, RMTX_COMPONENTS_SCHEMA_V3, RMTX_SYNTAX_VERSION,
  RMTX_SOURCE_PROFILE, RMTX_SELECTOR_SOURCE_PROFILE, RMTX_KEYED_SOURCE_PROFILE, RMTX_ORCHESTRATION_SOURCE_PROFILE, RMTX_NATIVE_SOURCE_PROFILE, RMTX_LIFECYCLE_SOURCE_PROFILE, RMTX_NATIVE_ORCHESTRATION_SOURCE_PROFILE,
  RMTX_OPERATOR_PROFILE_SCHEMA, RMTX_OPERATOR_PROFILE_SCHEMA_V2, RMTX_OPERATOR_PROFILE_SCHEMA_V3, RMTX_OPERATOR_PROFILE_SCHEMA_V4, RMTX_OPERATOR_PROFILE_SCHEMA_V5, RMTX_OPERATOR_PROFILE_SCHEMA_V6, getRmtxOperatorProfile, parseRmtxSource };
