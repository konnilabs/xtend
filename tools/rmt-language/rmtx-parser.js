'use strict';

const ts = require('typescript');
const { createRmtSourceModel } = require('./source-model');
const RMTX_PARSER_API_VERSION = '1.0.0';
const RMTX_PARSER_SCHEMA = 'xtend.rmtx.parser-result.v1';
const RMTX_SYNTAX_VERSION = '1.0.0';
const RMTX_SOURCE_PROFILE = Object.freeze({ syntax: 'rmtx', version: RMTX_SYNTAX_VERSION });
const MODULES = new Set(['@ccslabs/xtend/rmt-language/rmtx', '@ccslabs/xtend-compiler/rmt-language/rmtx']);
const OPERATORS = Object.freeze(['Program', 'State', 'Action', 'Input', 'Reduce', 'Portal', 'Surface', 'Lane', 'Mount']);
const UNSAFE = new Set(['__proto__', 'prototype', 'constructor']);
const own = (value, key) => Object.hasOwn(value, key);

class SourceError extends Error {
  constructor(code, message, node) { super(message); this.code = code; this.node = node; }
}

/** Parse a closed declarative TSX profile. No source imports or expressions execute. */
function parseRmtxSource(input = {}, options = {}) {
  input = typeof input === 'string' ? { text: input } : input && typeof input === 'object' ? input : {};
  const sourceModel = createRmtSourceModel({ ...input, languageId: 'rmtx', uri: input.uri || (input.filePath ? undefined : 'untitled:rmtx-document') });
  const diagnostics = [];
  const result = (ast = null, phase = 'syntax') => ({ schema: RMTX_PARSER_SCHEMA, apiVersion: RMTX_PARSER_API_VERSION,
    sourceProfile: RMTX_SOURCE_PROFILE, ok: diagnostics.length === 0, phase,
    status: diagnostics.length ? 'invalid' : 'parsed', sourceModel, ast, diagnostics });
  const diagnostic = (code, message, node, start, end) => diagnostics.push(sourceModel.createDiagnostic({
    code, message, severity: 'error', source: 'rmtx',
    range: sourceModel.rangeForOffsets(start ?? node?.getStart(file) ?? 0, end ?? node?.end ?? 1)
  }));
  let file;
  if (options.syntaxVersion !== undefined && options.syntaxVersion !== RMTX_SYNTAX_VERSION) {
    diagnostic('rmtx.syntax.version.unsupported', `Unsupported RMTX syntax version ${String(options.syntaxVersion)}.`);
    return result(null, 'profile');
  }
  const sourcePath = input.filePath || input.uri;
  const correctExtension = input.filePath ? /\.rmtx$/iu.test(input.filePath) : /\.rmtx(?:[?#].*)?$/iu.test(sourcePath || '');
  if (sourcePath && !correctExtension && !String(sourcePath).startsWith('untitled:')) {
    diagnostic('rmtx.source.extension', 'RMTX sources require the .rmtx extension.'); return result(null, 'profile');
  }
  sourceModel.filePolicy = { extension: '.rmtx', canonical: true, fallback: false, diagnosticCode: null };
  if (Buffer.byteLength(sourceModel.text, 'utf8') > 1024 * 1024) {
    diagnostic('rmtx.source.limit', 'The initial RMTX profile accepts at most 1 MiB of source.'); return result(null, 'profile');
  }
  try {
    file = ts.createSourceFile(input.filePath || 'document.rmtx', sourceModel.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const entry of file.parseDiagnostics) diagnostic('rmtx.syntax.invalid', ts.flattenDiagnosticMessageText(entry.messageText, '\n'), null,
      entry.start ?? 0, (entry.start ?? 0) + (entry.length ?? 1));
    if (diagnostics.length) return result();
    const bindings = new Map();
    let program = null;
    const fail = (code, message, node) => { throw new SourceError(code, message, node); };
    const safe = (key, node) => { if (UNSAFE.has(key)) fail('rmtx.path.unsafe', `Unsafe field ${key}.`, node); return key; };
    const range = node => sourceModel.rangeForOffsets(node.getStart(file), node.end);
    let count = 0;
    const make = (type, node, fields = {}) => {
      if (++count > 50000) fail('rmtx.source.limit', 'Too many declarative nodes.', node);
      return { type, range: range(node), ...fields };
    };
    const unparen = node => { while (ts.isParenthesizedExpression(node)) node = node.expression; return node; };
    const propertyName = node => {
      if (!ts.isIdentifier(node) && !ts.isStringLiteral(node) && !ts.isNumericLiteral(node))
        fail('rmtx.literal.property', 'Only explicit static property names are supported.', node);
      return safe(node.text, node);
    };
    function literal(node, depth = 0) {
      node = unparen(node);
      if (depth > 64) fail('rmtx.source.limit', 'Literal nesting exceeds 64 levels.', node);
      if (ts.isStringLiteral(node)) return make('RmtPrimitiveValue', node, { kind: 'literal', value: node.text });
      if (ts.isNumericLiteral(node)) {
        const value = Number(node.text.replaceAll('_', ''));
        if (!Number.isFinite(value)) fail('rmtx.literal.number', 'Numbers must be finite.', node);
        return make('RmtPrimitiveValue', node, { kind: 'literal', value });
      }
      if (ts.isPrefixUnaryExpression(node) && [ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken].includes(node.operator) && ts.isNumericLiteral(node.operand)) {
        const value = Number(node.operand.text.replaceAll('_', '')) * (node.operator === ts.SyntaxKind.MinusToken ? -1 : 1);
        if (!Number.isFinite(value)) fail('rmtx.literal.number', 'Numbers must be finite.', node);
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
    function reducerValue(fields) {
      const field = fields.value;
      if (!field) fail('rmtx.attribute.required', 'Missing required attribute value.', current);
      const expression = field.initializer;
      if (expression && ts.isJsxExpression(expression) && expression.expression) {
        const node = unparen(expression.expression);
        if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) return pathReference(node);
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
          if (specifier.isTypeOnly || !['RMT', 'model', 'input'].includes(imported) || bindings.has(specifier.name.text))
            fail('rmtx.import.binding', 'Unknown or duplicate authoring binding.', specifier);
          bindings.set(specifier.name.text, imported);
        }
      } else if (ts.isExportAssignment(statement) && !statement.isExportEquals && !program) program = unparen(statement.expression);
      else fail('rmtx.source.statement', 'Only authoring imports and one default JSX export are allowed; no source statements execute.', statement);
    }
    if (!program) fail('rmtx.program.required', 'Expected one default RMT.Program export.', file);
    let current = program;
    function element(node, expected, depth = 0) {
      current = node;
      if (depth > 64) fail('rmtx.source.limit', 'Operator nesting exceeds 64 levels.', node);
      if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) fail('rmtx.child.unsupported', 'Expected a declarative RMT operator element.', node);
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.typeArguments?.length) fail('rmtx.operator.type-arguments', 'Operator type arguments are not supported by this syntax profile.', opening.typeArguments[0]);
      const tag = opening.tagName;
      if (!ts.isPropertyAccessExpression(tag) || !ts.isIdentifier(tag.expression) || bindings.get(tag.expression.text) !== 'RMT')
        fail('rmtx.operator.binding', 'Operators must resolve to the imported RMT namespace.', tag);
      const op = tag.name.text;
      if (!OPERATORS.includes(op)) fail('rmtx.operator.unknown', `Unsupported RMT operator ${op} in syntax profile ${RMTX_SYNTAX_VERSION}.`, tag.name);
      if (!expected.includes(op)) fail('rmtx.operator.context', `${op} is not valid in this child context.`, tag.name);
      const children = ts.isJsxElement(node) ? node.children.filter(child => {
        if (ts.isJsxText(child)) {
          if (child.text.trim()) fail('rmtx.child.text', 'Native text/UI children belong to a later profile.', child);
          return false;
        }
        if (ts.isJsxExpression(child) && !child.expression && !child.dotDotDotToken) return false;
        return true;
      }) : [];
      const lowerChildren = kinds => children.map(child => element(child, kinds, depth + 1));
      const leaf = () => { if (children.length) fail('rmtx.child.unsupported', `${op} cannot have children.`, children[0]); };
      let fields;
      switch (op) {
        case 'Program':
          fields = attrs(opening, ['id']);
          return make('RmtTemplateDeclaration', node, { name: text(fields, 'id', true, true),
            body: lowerChildren(['State', 'Action', 'Portal', 'Surface']) });
        case 'State': {
          leaf(); fields = attrs(opening, ['id', 'type', 'initial', 'preserve']);
          const preserve = value(fields, 'preserve');
          if (preserve && (preserve.kind !== 'literal' || typeof preserve.value !== 'boolean')) fail('rmtx.attribute.boolean', 'preserve requires a boolean.', fields.preserve);
          return make('RmtStateDeclaration', node, { name: text(fields, 'id', true, true), dataType: make('RmtTypeReference', fields.type || node, { value: text(fields, 'type', true) }),
            initial: value(fields, 'initial', true), preserve: preserve ? preserve.value : false, body: [] });
        }
        case 'Action':
          fields = attrs(opening, ['id']);
          return make('RmtActionDeclaration', node, { name: text(fields, 'id', true, true), body: lowerChildren(['Input', 'Reduce']) });
        case 'Input':
          leaf(); fields = attrs(opening, ['name', 'type']);
          return make('RmtActionInputClause', node, { name: text(fields, 'name', true, true),
            dataType: make('RmtTypeReference', fields.type || node, { value: text(fields, 'type', true) }), policy: null });
        case 'Reduce': {
          leaf(); fields = attrs(opening, ['state', 'path', 'value']);
          const target = 'state.' + text(fields, 'state', true, true) + (fields.path ? '.' + text(fields, 'path', true, true) : '');
          return make('RmtReducerStatement', node, { target, targetNode: identifier(target, fields.state), expression: reducerValue(fields) });
        }
        case 'Portal':
          leaf(); fields = attrs(opening, ['id', 'root', 'layer']);
          return make('RmtPortalDeclaration', node, { name: text(fields, 'id', true, true), body: [], attributes: ['root', 'layer'].filter(key => fields[key]).map(key =>
            make('RmtPrimitiveAttribute', fields[key], { keyword: key, value: make('RmtPrimitiveValue', fields[key], { kind: 'literal', value: text(fields, key, true) }) })) });
        case 'Surface': {
          fields = attrs(opening, ['id', 'kind', 'component', 'portal']);
          const name = text(fields, 'id', true, true);
          const metadata = ['kind', 'component'].filter(key => fields[key]).map(key => make('RmtSurfaceHeaderClause', fields[key],
            { keyword: key, value: make('RmtPrimitiveValue', fields[key], { kind: 'literal', value: text(fields, key, true) }) }));
          const body = fields.portal ? [make('RmtSurfacePortalClause', fields.portal, { keyword: 'portal', path: text(fields, 'portal', true, true) })] : [];
          return make('RmtSurfaceDeclaration', node, { name, metadata, body: body.concat(lowerChildren(['Lane'])) });
        }
        case 'Lane':
          fields = attrs(opening, ['name']);
          return make('RmtLaneDeclaration', node, { name: text(fields, 'name', true, true), weight: null, body: lowerChildren(['Mount']) });
        case 'Mount':
          leaf(); fields = attrs(opening, ['target']);
          return make('RmtLifecycleStatement', node, { op: 'mount', target: identifier(text(fields, 'target', true, true), fields.target), source: null, condition: null, policy: null });
        default: throw new Error('Unreachable RMTX operator.');
      }
    }
    const template = element(program, ['Program']);
    const ast = make('RmtVNextDocument', program, { schema: 'xtend.rmt.vnext.ast.v1', body: [template] });
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
    return result(ast, 'parse');
  } catch (error) {
    if (!(error instanceof SourceError) && !(error instanceof RangeError)) throw error;
    diagnostic(error.code || 'rmtx.source.limit', error.message, error.node);
    return result(null, 'lowering');
  }
}

module.exports = { RMTX_PARSER_API_VERSION, RMTX_PARSER_SCHEMA, RMTX_SYNTAX_VERSION, RMTX_SOURCE_PROFILE, parseRmtxSource };
