'use strict';

const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const ts = require('typescript');
const { createRmtSourceModel } = require('./source-model');
const { getRmtxOperatorProfile } = require('./rmtx-operator-profiles');

const RMTX_LANGUAGE_SERVICE_API_VERSION = '1.0.0';
const RMTX_LANGUAGE_SERVICE_SCHEMA = 'xtend.rmtx.language-service.v1';
const RMTX_LANGUAGE_ANALYSIS_SCHEMA = 'xtend.rmtx.language-analysis.v1';
const RMTX_VIRTUAL_DOCUMENT_SCHEMA = 'xtend.rmtx.virtual-document.v1';
const RMTX_PROJECT_TYPECHECK_SCHEMA = 'xtend.rmtx.project-typecheck.v1';
const AUTHORING_MODULES = new Set(['@ccslabs/xtend/rmt-language/rmtx', '@ccslabs/xtend-compiler/rmt-language/rmtx']);
const ROOTS = new Set(['model', 'selectors', 'item', 'input', 'params', 'result', 'error', 'payload']);
const sourcePath = input => input.filePath || (input.uri?.startsWith('file:') ? fileURLToPath(input.uri) : null);
const normalize = (input, rootDir) => {
  input = typeof input === 'string' ? { text: input } : input || {};
  const filePath = sourcePath(input) || path.join(rootDir, `__untitled_${Buffer.from(input.uri || 'rmtx').toString('hex')}.rmtx`);
  return { ...input, text: String(input.text || ''), filePath: path.resolve(filePath), uri: input.uri || pathToFileURL(path.resolve(filePath)).href,
    languageId: input.languageId || (/\.rmtx$/iu.test(filePath) ? 'rmtx' : 'rmt'), version: input.version ?? 0 };
};
const modelFor = document => createRmtSourceModel(document);
const literal = node => node && (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) ? node.text
  : node?.kind === ts.SyntaxKind.TrueKeyword ? true : node?.kind === ts.SyntaxKind.FalseKeyword ? false : null;
const opening = node => ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
function attrs(node) { return new Map((opening(node)?.attributes.properties || []).filter(ts.isJsxAttribute).map(item => [item.name.getText(), item])); }
function attributeValue(attribute) { const node = attribute?.initializer; return node && ts.isJsxExpression(node) ? node.expression : node; }
function attributeText(attribute) { return literal(attributeValue(attribute)); }
function operator(node, aliases, file) {
  const tag = opening(node)?.tagName;
  return tag && ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression) && aliases.get(tag.expression.text) === 'RMT' ? tag.name.text : null;
}
function aliasesFor(file) {
  const aliases = new Map();
  for (const statement of file.statements) if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)
    && AUTHORING_MODULES.has(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
    for (const entry of statement.importClause.namedBindings.elements) aliases.set(entry.name.text, (entry.propertyName || entry.name).text);
  }
  return aliases;
}
const primitiveType = type => ({ string: 'string', number: 'number', boolean: 'boolean', integer: 'number', json: '__RmtxJson', object: 'Record<string, unknown>', array: 'readonly unknown[]' }[type]
  || (typeof type === 'string' && /^(?:string|number|boolean)\[\]$/u.test(type) ? `readonly ${type}` : 'unknown'));
const atom = text => ({ text });
function sourceToken(document, node, file, text) {
  let start = node?.getStart ? node.getStart(file) : node?.range?.startOffset ?? 0;
  let end = node?.end ?? node?.range?.endOffset ?? start;
  if (node && (node.getStart ? ts.isStringLiteral(node) : document.text[start] === '"' || document.text[start] === "'")) { start++; end--; }
  return { document, start, end, text };
}
function inferTsValue(node, document, file) {
  if (!node) return atom('unknown');
  if (ts.isParenthesizedExpression(node)) return inferTsValue(node.expression, document, file);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return atom('string');
  if (ts.isNumericLiteral(node) || ts.isPrefixUnaryExpression(node)) return atom('number');
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return atom('boolean');
  if (node.kind === ts.SyntaxKind.NullKeyword) return atom('__RmtxJson');
  if (ts.isArrayLiteralExpression(node)) return { array: node.elements.map(item => inferTsValue(item, document, file)) };
  if (ts.isObjectLiteralExpression(node) && !node.properties.length) return atom('Record<string, unknown>');
  if (ts.isObjectLiteralExpression(node)) return { fields: new Map(node.properties.filter(ts.isPropertyAssignment).map(property => {
    const key = property.name.getText(file).replace(/^['"]|['"]$/gu, '');
    return [key, { token: sourceToken(document, property.name, file, key), value: inferTsValue(property.initializer, document, file) }];
  })) };
  return atom('unknown');
}
function inferClassicValue(node, document) {
  if (!node) return atom('unknown');
  if (node.kind === 'literal') return atom(node.value === null ? '__RmtxJson' : typeof node.value);
  if (node.kind === 'array') return { array: (node.items || []).map(item => inferClassicValue(item, document)) };
  if (node.kind === 'object' && !node.fields?.length) return atom('Record<string, unknown>');
  if (node.kind === 'object') return { fields: new Map((node.fields || []).map(field => [field.key, {
    token: sourceToken(document, field.keyNode || field, null, field.key), value: inferClassicValue(field.value, document)
  }])) };
  return atom('unknown');
}
function addPath(tree, name, value, token) {
  const pieces = String(name).split('.'); let current = tree, offset = 0;
  pieces.forEach((piece, index) => {
    if (!current.fields) current.fields = new Map();
    const partToken = { ...token, start: token.start + offset, end: token.start + offset + piece.length };
    if (index === pieces.length - 1) current.fields.set(piece, { token: partToken, value });
    else {
      if (!current.fields.has(piece)) current.fields.set(piece, { token: partToken, value: { fields: new Map() } });
      current = current.fields.get(piece).value;
    }
    offset += piece.length + 1;
  });
}
function collectDeclarations(documents) {
  const states = { fields: new Map() }, stateDeclarations = [], selectors = [], files = [], classics = [], symbols = [];
  for (const document of documents) {
    if (document.languageId !== 'rmtx' && !/\.rmtx$/iu.test(document.filePath)) {
      const parsed = require('./classic-parser').parseRmtClassicSource(document);
      classics.push({ document, ast: parsed.ast });
      function visit(value) {
        if (!value || typeof value !== 'object') return;
        const domain = { RmtStateDeclaration: 'State', RmtActionDeclaration: 'Action', RmtSelectorDeclaration: 'Selector', RmtSurfaceDeclaration: 'Surface', RmtPortalDeclaration: 'Portal' }[value.type];
        if (domain && typeof value.name === 'string') symbols.push({ name: value.name, domain,
          token: sourceToken(document, value.nameNode || value, null, value.name), nodeRange: { start: value.range.startOffset, end: value.range.endOffset } });
        if (value.type === 'RmtStateDeclaration') {
          const initial = value.initial || (value.body || []).find(item => item.type === 'RmtInitialBlock');
          const type = initial?.type === 'RmtInitialBlock' ? { fields: new Map((initial.body || []).map(field => [field.key, {
            token: sourceToken(document, field.keyNode || field, null, field.key), value: inferClassicValue(field.value, document)
          }])) } : inferClassicValue(initial, document);
          stateDeclarations.push({ name: value.name, value: type.text === 'unknown' ? atom(primitiveType(value.dataType?.value)) : type, token: sourceToken(document, value.nameNode || value, null, value.name) });
        }
        for (const [key, child] of Object.entries(value)) if (!['range', 'sourceModel'].includes(key)) {
          if (Array.isArray(child)) child.forEach(visit); else if (child && typeof child === 'object') visit(child);
        }
      }
      visit(parsed.ast); continue;
    }
    const file = ts.createSourceFile(document.filePath, document.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    files.push({ document, file, aliases: aliasesFor(file) });
    const aliases = aliasesFor(file);
    function visit(node, surface = null) {
      const op = operator(node, aliases, file), attributes = attrs(node), id = attributeText(attributes.get('id'));
      if (op && typeof id === 'string') {
        const token = sourceToken(document, attributeValue(attributes.get('id')), file, id);
        symbols.push({ name: id, domain: op, token, nodeRange: { start: node.getStart(file), end: node.end } });
        if (op === 'State') {
          const initial = attributeValue(attributes.get('initial')), declared = primitiveType(attributeText(attributes.get('type')));
          const inferred = inferTsValue(initial, document, file);
          stateDeclarations.push({ name: id, value: inferred.text === 'unknown' || declared !== 'Record<string, unknown>' && declared !== 'readonly unknown[]' && declared !== 'unknown' && declared !== '__RmtxJson'
            ? atom(declared) : inferred, token });
        }
        if (op === 'Selector') selectors.push({ id, node, attributes, token, document, file, aliases });
        if (op === 'Surface') surface = id;
      }
      if (op === 'Component' && surface && typeof attributeText(attributes.get('ref')) === 'string') {
        const ref = attributeText(attributes.get('ref'));
        symbols.push({ name: surface + '.' + ref, domain: 'NativeRef', token: sourceToken(document, attributeValue(attributes.get('ref')), file, ref),
          nodeRange: { start: node.getStart(file), end: node.end } });
      }
      ts.forEachChild(node, child => visit(child, surface));
    }
    visit(file);
  }
  for (const declaration of stateDeclarations.sort((a, b) => a.name.split('.').length - b.name.split('.').length)) addPath(states, declaration.name, declaration.value, declaration.token);
  const references = [];
  function reference(domain, value, token, prefix = false) {
    const candidate = symbols.filter(item => item.domain === domain && (item.name === value || prefix && value.startsWith(item.name + '.')))
      .sort((a, b) => b.name.length - a.name.length)[0];
    if (!candidate) return;
    const length = candidate.domain === 'NativeRef' ? candidate.token.text.length : candidate.name.length;
    const start = candidate.domain === 'NativeRef' ? token.start + candidate.name.length - length : token.start;
    references.push({ domain, name: candidate.name, token: { ...token, start, end: start + length } });
  }
  for (const { document, file, aliases } of files) {
    function visit(node) {
      const op = operator(node, aliases, file), attributes = attrs(node);
      for (const [key, attribute] of attributes) {
        const value = attributeText(attribute); if (typeof value !== 'string') continue;
        const domain = key === 'action' ? 'Action' : key === 'state' ? 'State' : key === 'portal' ? 'Portal' : key === 'owner' ? 'Surface' : key === 'target' ? 'Surface' : null;
        const token = sourceToken(document, attributeValue(attribute), file, value);
        if (domain) reference(domain, value, token, true);
        if (key === 'target' && op === 'Effect' && attributeText(attributes.get('kind')) === 'component-command') reference('NativeRef', value, token);
      }
      if (ts.isPropertyAccessExpression(node) && !(ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node)) {
        const names = []; let root = node;
        while (ts.isPropertyAccessExpression(root)) { names.unshift(root.name); root = root.expression; }
        const kind = ts.isIdentifier(root) && aliases.get(root.text), domain = kind === 'model' ? 'State' : kind === 'selectors' ? 'Selector' : null;
        if (domain && names.length) {
          const value = names.map(item => item.text).join('.'), token = { document, start: names[0].getStart(file), end: node.end, text: value };
          reference(domain, value, token, true);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
  }
  for (const { document, ast } of classics) {
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'RmtIdentifier' && typeof node.value === 'string') {
        const kind = node.value.startsWith('state.') ? 'State' : node.value.startsWith('selector.') ? 'Selector' : null;
        if (kind) { const prefix = kind === 'State' ? 6 : 9, token = sourceToken(document, node, null, node.value); reference(kind, node.value.slice(prefix), { ...token, start: token.start + prefix }, true); }
      }
      if (node.type === 'RmtPrimitiveSourceReference' && ['state', 'selector'].includes(node.kind) && node.valueNode) reference(node.kind === 'state' ? 'State' : 'Selector', node.value, sourceToken(document, node.valueNode, null, node.value), true);
      if (node.actionNode?.value) reference('Action', node.actionNode.value, sourceToken(document, node.actionNode, null, node.actionNode.value), true);
      for (const [key, value] of Object.entries(node)) if (!['range', 'startToken', 'endToken', 'sourceModel'].includes(key)) {
        if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast);
  }
  return { states, selectors, files, symbols, references };
}

/** Generate a private, in-memory TSX view. Source text is parsed, never run. */
function createRmtxVirtualDocument(input = {}, options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd()), document = normalize(input, rootDir);
  const documents = (options.documents || [document]).map(item => normalize(item, rootDir));
  if (!documents.some(item => item.uri === document.uri)) documents.push(document);
  const facts = collectDeclarations(documents), entry = facts.files.find(item => item.document.uri === document.uri);
  if (!entry) throw new TypeError('A virtual RMTX document requires RMTX source.');
  const { file, aliases } = entry, syntaxVersion = options.syntaxVersion || options.rmtxSyntaxVersion || '8.0.0';
  const profile = getRmtxOperatorProfile(syntaxVersion), segments = [], replacements = [], declarations = [];
  let text = '', nextScope = 0;
  const emit = value => { text += value; };
  function mapped(value, token, kind = 'declaration') {
    const start = text.length; emit(value); segments.push({ virtualStart: start, virtualEnd: text.length, uri: token.document.uri,
      sourceStart: token.start, sourceEnd: token.end, kind });
  }
  function renderType(type) {
    if (type.fields) {
      if (type.text && type.text !== 'unknown' && type.text !== 'Record<string, unknown>') emit(type.text + '&');
      emit('{'); for (const [key, field] of type.fields) { emit('readonly "'); mapped(key, field.token); emit('":'); renderType(field.value); emit(';'); } emit('}');
    } else if (type.array) {
      if (!type.array.length) emit('readonly unknown[]'); else { emit('ReadonlyArray<'); type.array.forEach((item, index) => { if (index) emit('|'); renderType(item); }); emit('>'); }
    } else emit(type.text || 'unknown');
  }
  emit(`import type * as __RmtxSdk from ${JSON.stringify(path.join(__dirname, 'rmtx').replaceAll('\\', '/'))};\n`);
  emit('type __RmtxJson=null|boolean|number|string|readonly __RmtxJson[]|{readonly[key:string]:__RmtxJson};\n');
  emit('type __RmtxElement<T>=T extends readonly(infer E)[]?E:never;\n');
  emit('declare function __rmtx_boolean(value:boolean):boolean;\n');
  emit('declare const __rmtx_model:'); renderType(facts.states); emit(';\n');
  const rootName = canonical => canonical === 'model' ? '__rmtx_model' : canonical === 'selectors' ? '__rmtx_selectors' : `__rmtx_${canonical}`;
  const selectorNames = new Map(facts.selectors.map((selector, index) => [selector.id, `__rmtx_selector${index}`]));
  function pathExpression(node, currentAliases, itemName = '__rmtx_item') {
    if (!node) return null;
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    const parts = [];
    while (ts.isPropertyAccessExpression(node)) { parts.unshift(node.name.text); node = node.expression; }
    if (!ts.isIdentifier(node)) return null;
    const kind = currentAliases.get(node.text); if (!ROOTS.has(kind)) return null;
    if (kind === 'selectors') {
      const name = parts.join('.'), owner = [...selectorNames.keys()].sort((a, b) => b.length - a.length).find(id => name === id || name.startsWith(id + '.'));
      if (owner) return selectorNames.get(owner) + name.slice(owner.length);
    }
    return (kind === 'item' ? itemName : rootName(kind)) + parts.map(part => '.' + part).join('');
  }
  const selectorTree = { fields: new Map() };
  for (const selector of facts.selectors) {
    const from = pathExpression(attributeValue(selector.attributes.get('from')), selector.aliases), children = ts.isJsxElement(selector.node) ? selector.node.children : [];
    const find = children.some(node => operator(node, selector.aliases, selector.file) === 'Find');
    emit(`declare const ${selectorNames.get(selector.id)}:${from ? find ? `__RmtxElement<typeof ${from}>|null` : `typeof ${from}` : 'unknown'};\n`);
    addPath(selectorTree, selector.id, atom(`typeof ${selectorNames.get(selector.id)}`), selector.token);
  }
  emit('declare const __rmtx_selectors:'); renderType(selectorTree); emit(';\n');
  emit('declare const __rmtx_item:never;declare const __rmtx_input:never;\n');
  for (const kind of ['params', 'result', 'error', 'payload']) emit(`declare const __rmtx_${kind}:Readonly<Record<string,unknown>>;\n`);
  for (const [alias, canonical] of aliases) {
    const imported = file.statements.flatMap(statement => ts.isImportDeclaration(statement) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) ? [...statement.importClause.namedBindings.elements] : []).find(item => item.name.text === alias);
    if (canonical === 'RMT') {
      const namespace = syntaxVersion === '1.0.0' ? 'RmtxLegacyAuthoringNamespace' : `RmtxAuthoringNamespaceV${syntaxVersion.split('.')[0]}`;
      emit('declare const '); mapped(alias, sourceToken(document, imported.name, file, alias), 'import'); emit(`:__RmtxSdk.${namespace};\n`);
    } else if (canonical === 'contains') { emit(`declare function ${alias}(value:unknown,search:unknown):boolean;\n`); }
  }
  for (const statement of file.statements) if (ts.isImportDeclaration(statement)) replacements.push({ start: statement.getStart(file), end: statement.end, value: document.text.slice(statement.getStart(file), statement.end).replace(/[^\r\n]/gu, ' ') });
  const seen = new Set();
  function valueRuleType(rule) {
    let value = rule?.type === 'object' ? '{' + Object.entries(rule.fields || {}).map(([key, field]) => `${JSON.stringify(key)}:${valueRuleType(field)}`).join(';') + '}'
      : rule?.type === 'array' ? `ReadonlyArray<${valueRuleType(rule.items)}>` : primitiveType(rule?.type);
    return rule?.nullable ? value + '|null' : value;
  }
  function replaceIdentifier(node, context) {
    if (!ts.isIdentifier(node) || seen.has(node.pos)) return;
    const canonical = aliases.get(node.text);
    if (!ROOTS.has(canonical)) return;
    if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node || ts.isPropertyAssignment(node.parent) && node.parent.name === node) return;
    seen.add(node.pos);
    replacements.push({ start: node.getStart(file), end: node.end, value: canonical === 'item' ? context.item : canonical === 'input' ? context.input : rootName(canonical) });
  }
  function visit(node, context = { item: '__rmtx_item', input: '__rmtx_input' }) {
    if (ts.isImportDeclaration(node)) return;
    const op = operator(node, aliases, file), attributes = attrs(node);
    if (op === 'When' && ts.isJsxElement(node) && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const condition = attributeValue(attributes.get('test'));
      if (condition) {
        let value = condition.getText(file); const edits = [];
        function roots(child) {
          if (ts.isIdentifier(child) && ROOTS.has(aliases.get(child.text)) && !(ts.isPropertyAccessExpression(child.parent) && child.parent.name === child)) {
            const canonical = aliases.get(child.text), name = canonical === 'item' ? context.item : canonical === 'input' ? context.input : rootName(canonical);
            edits.push({ start: child.getStart(file) - condition.getStart(file), end: child.end - condition.getStart(file), name });
          }
          ts.forEachChild(child, roots);
        }
        roots(condition); for (const edit of edits.sort((a, b) => b.start - a.start)) value = value.slice(0, edit.start) + edit.name + value.slice(edit.end);
        replacements.push({ start: node.getStart(file), end: node.getStart(file), value: `{(${value})?(`, order: 0 });
        replacements.push({ start: node.end, end: node.end, value: '):null}', order: 2 });
        replacements.push({ start: condition.getStart(file), end: condition.getStart(file), value: '__rmtx_boolean(', order: 0 });
        replacements.push({ start: condition.end, end: condition.end, value: ')', order: 2 });
      }
    }
    if (op === 'XTension') {
      const providerId = attributeText(attributes.get('provider'));
      const provider = options.componentInterfaceCatalog?.records?.find(item => item.definition?.providerId === providerId)?.definition;
      const expression = attributeValue(attributes.get('props'));
      if (provider && expression) {
        const name = `__rmtx_props${nextScope++}`, optional = new Set(provider.optionalProps || []);
        const type = '{' + Object.entries(provider.props || {}).map(([key, rule]) => `${JSON.stringify(key)}${optional.has(key) ? '?' : ''}:${valueRuleType(rule)}`).join(';') + '}';
        emit(`declare function ${name}(props:${type}):${type};\n`);
        replacements.push({ start: expression.getStart(file), end: expression.getStart(file), value: name + '(', order: 0 });
        replacements.push({ start: expression.end, end: expression.end, value: ')', order: 2 });
      }
    }
    if (op === 'Action') {
      const name = `__rmtx_input${nextScope++}`, inputTree = { fields: new Map() };
      if (ts.isJsxElement(node)) for (const child of node.children) if (operator(child, aliases, file) === 'Input') {
        const fields = attrs(child), id = attributeText(fields.get('name')); if (typeof id !== 'string') continue;
        let type = primitiveType(attributeText(fields.get('type')));
        if (attributeText(fields.get('nullable')) === true) type += '|null';
        if (attributeText(fields.get('optional')) === true && !fields.has('default')) type += '|undefined';
        addPath(inputTree, id, atom(type), sourceToken(document, attributeValue(fields.get('name')), file, id));
      }
      declarations.push({ name, type: inputTree }); context = { ...context, input: name };
    }
    if (op === 'Repeat' || op === 'Selector') {
      const from = pathExpression(attributeValue(attributes.get('from')), aliases, context.item), name = `__rmtx_item${nextScope++}`;
      declarations.push({ name, type: atom(from ? `__RmtxElement<typeof ${from}>` : 'unknown') });
      // The collection expression belongs to the parent; keyBy and children to its item.
      const childContext = { ...context, item: name };
      for (const field of opening(node).attributes.properties) visit(field, ts.isJsxAttribute(field) && field.name.getText(file) === 'from' ? context : childContext);
      if (ts.isJsxElement(node)) node.children.forEach(child => visit(child, childContext));
      return;
    }
    if (ts.isIdentifier(node)) replaceIdentifier(node, context);
    ts.forEachChild(node, child => visit(child, context));
  }
  visit(file);
  for (const declaration of declarations) { emit(`declare const ${declaration.name}:`); renderType(declaration.type); emit(';\n'); }
  const prefixLength = text.length;
  replacements.sort((a, b) => a.start - b.start || (a.order ?? 1) - (b.order ?? 1) || b.end - a.end);
  let cursor = 0;
  for (const replacement of replacements) {
    if (replacement.start < cursor) continue;
    if (replacement.start > cursor) mapped(document.text.slice(cursor, replacement.start), { document, start: cursor, end: replacement.start }, 'source');
    if (replacement.start === replacement.end) emit(replacement.value);
    else mapped(replacement.value, { document, start: replacement.start, end: replacement.end }, 'replacement');
    cursor = replacement.end;
  }
  if (cursor < document.text.length) mapped(document.text.slice(cursor), { document, start: cursor, end: document.text.length }, 'source');
  const originalModel = modelFor(document);
  function toVirtualOffset(position, uri = document.uri) {
    const target = documents.find(item => item.uri === uri); if (!target) return null;
    const offset = typeof position === 'number' ? position : modelFor(target).offsetAt(position);
    const matches = segments.filter(segment => segment.uri === uri && offset >= segment.sourceStart && offset <= segment.sourceEnd);
    matches.sort((a, b) => (a.kind === 'declaration' ? -1 : 0) - (b.kind === 'declaration' ? -1 : 0) || (a.sourceEnd - a.sourceStart) - (b.sourceEnd - b.sourceStart));
    const segment = matches[0]; return segment ? segment.virtualStart + Math.min(offset - segment.sourceStart, segment.virtualEnd - segment.virtualStart) : null;
  }
  function toOriginalSpan(start, length = 0) {
    const end = start + length, matches = segments.filter(segment => start < segment.virtualEnd && end >= segment.virtualStart || length === 0 && start >= segment.virtualStart && start <= segment.virtualEnd);
    const segment = matches.find(item => item.kind === 'declaration') || matches[0]; if (!segment) return null;
    const sourceDocument = documents.find(item => item.uri === segment.uri); if (!sourceDocument) return null;
    const sourceStart = segment.sourceStart + Math.min(Math.max(0, start - segment.virtualStart), segment.sourceEnd - segment.sourceStart);
    const sourceEnd = Math.max(sourceStart, segment.sourceStart + Math.min(Math.max(0, end - segment.virtualStart), segment.sourceEnd - segment.sourceStart));
    return { uri: sourceDocument.uri, filePath: sourceDocument.filePath, range: modelFor(sourceDocument).rangeForOffsets(sourceStart, sourceEnd), start: sourceStart, end: sourceEnd };
  }
  return { schema: RMTX_VIRTUAL_DOCUMENT_SCHEMA, apiVersion: RMTX_LANGUAGE_SERVICE_API_VERSION, sourceProfile: profile.sourceProfile,
    document, fileName: document.filePath + '.__xtend.tsx', text, segments, prefixLength, symbols: facts.symbols,
    references: facts.references, sourceDocuments: documents, sourceModel: originalModel, toVirtualOffset, toOriginalSpan };
}

function createRmtxLanguageService(options = {}) {
  const syntaxVersion = options.rmtxSyntaxVersion || options.syntaxVersion || '8.0.0';
  options = { ...options, syntaxVersion, rmtxSyntaxVersion: syntaxVersion };
  const rootDir = path.resolve(options.rootDir || process.cwd()), documents = new Map(), virtuals = new Map();
  const project = options.project || (options.getProjectDocuments ? null : require('./rmt-project').createRmtProject({ rootDir, ...options }));
  let projectVersion = 0;
  const compilerOptions = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.Preserve, types: [], ...options.typescriptOptions };
  const host = { getCompilationSettings: () => compilerOptions, getScriptFileNames: () => [...virtuals.keys()],
    getScriptVersion: () => String(projectVersion), getProjectVersion: () => String(projectVersion), getCurrentDirectory: () => rootDir,
    getDefaultLibFileName: settings => ts.getDefaultLibFilePath(settings), fileExists: file => virtuals.has(file) || ts.sys.fileExists(file),
    readFile: file => virtuals.get(file)?.text ?? ts.sys.readFile(file), readDirectory: ts.sys.readDirectory, directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories, getScriptSnapshot: file => { const text = virtuals.get(file)?.text ?? ts.sys.readFile(file); return typeof text === 'string' ? ts.ScriptSnapshot.fromString(text) : undefined; } };
  const languageService = ts.createLanguageService(host);
  function updateDocument(input) {
    const document = normalize(input, rootDir), previous = documents.get(document.uri);
    if (previous && document.version < previous.version) return false;
    documents.set(document.uri, document); project?.updateDocument(document); projectVersion++; return true;
  }
  function closeDocument(uri) { documents.delete(uri); project?.removeDocument(uri); projectVersion++; }
  function projectDocuments(document) {
    const resolve = value => options.getProjectDocuments ? options.getProjectDocuments(value, { recoverImports: true }) : project.getDocuments(value, { recoverImports: true });
    const selected = [...(resolve(document) || [document])];
    // A Classic dependency has no outgoing edge to its RMTX consumers. Include
    // open consumer graphs so navigation from its declaration sees those uses.
    for (const opened of documents.values()) {
      if (opened.languageId !== 'rmtx' && !/\.rmtx$/iu.test(opened.filePath)) continue;
      const graph = resolve(opened) || [];
      if (graph.some(item => item.uri === document.uri || item.filePath === document.filePath)) selected.push(...graph);
    }
    return [...new Map(selected.map(item => [item.uri || item.filePath, item])).values()];
  }
  function hasRmtxDependencies(input) {
    const document = typeof input === 'object' ? normalize(input, rootDir) : documents.get(input);
    return Boolean(document && (document.languageId === 'rmtx' || /\.rmtx$/iu.test(document.filePath)
      || projectDocuments(document).some(item => item.languageId === 'rmtx' || /\.rmtx$/iu.test(item.filePath))));
  }
  function refresh(input) {
    const document = typeof input === 'object' ? normalize(input, rootDir) : documents.get(input);
    if (!document) return null;
    const deps = projectDocuments(document);
    const selected = (deps || [document]).map(item => documents.get(item.uri) || normalize(item, rootDir));
    const index = selected.findIndex(item => item.uri === document.uri); if (index < 0) selected.push(document); else selected[index] = document;
    const next = new Map();
    const capturedCatalog = options.componentInterfaceCatalog || project?.analyze?.(document, { recoverImports: true })?.componentInterfaceCatalog;
    for (const item of selected) if (item.languageId === 'rmtx' || /\.rmtx$/iu.test(item.filePath)) {
      const virtual = createRmtxVirtualDocument(item, { ...options, componentInterfaceCatalog: capturedCatalog, rootDir, documents: selected }); next.set(virtual.fileName, virtual);
    }
    if (next.size !== virtuals.size || [...next].some(([name, value]) => virtuals.get(name)?.text !== value.text)) {
      virtuals.clear(); next.forEach((value, name) => virtuals.set(name, value)); projectVersion++;
    }
    return virtuals.get(document.filePath + '.__xtend.tsx') || { document, sourceProfile: { syntax: 'rmtx', version: options.syntaxVersion || options.rmtxSyntaxVersion || '8.0.0' } };
  }
  function analyze(input) {
    const virtual = refresh(input); if (!virtual) return null;
    const document = virtual.document, compiled = options.analyzeProject ? options.analyzeProject(document) : project?.compileSource(document, { semanticCheck: false })
      || require('./rmtx-compiler').compileRmtxSource(document, { syntaxVersion: options.syntaxVersion || options.rmtxSyntaxVersion || '8.0.0' });
    const diagnostics = [...(compiled?.diagnostics || [])].map(item => ({ ...item, uri: item.uri || document.uri, filePath: item.filePath || document.filePath, source: item.source || 'rmtx' }));
    for (const current of compiled?.ok === false ? [] : virtuals.values()) for (const diagnostic of [...languageService.getSyntacticDiagnostics(current.fileName), ...languageService.getSemanticDiagnostics(current.fileName)]) {
        const location = current.toOriginalSpan(diagnostic.start || 0, diagnostic.length || 0);
        if (!location) continue;
        diagnostics.push({ code: `rmtx.typescript.${diagnostic.code}`, severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'), ...location, source: 'rmtx-typescript' });
      }
    const seen = new Set(), unique = diagnostics.filter(item => { const key = JSON.stringify([item.uri, item.code, item.range, item.message]); if (seen.has(key)) return false; seen.add(key); return true; });
    return { schema: RMTX_LANGUAGE_ANALYSIS_SCHEMA, apiVersion: RMTX_LANGUAGE_SERVICE_API_VERSION, sourceProfile: virtual.sourceProfile,
      document, diagnostics: unique, ok: !unique.some(item => item.severity === 'error'), compileResult: compiled, virtualDocument: virtual.fileName ? virtual : null };
  }
  function at(input, position) {
    const current = refresh(input); if (!current) return null;
    if (current.fileName) return { virtual: current, offset: current.toVirtualOffset(position) };
    for (const virtual of virtuals.values()) { const offset = virtual.toVirtualOffset(position, current.document.uri); if (offset !== null) return { virtual, offset }; }
    return null;
  }
  function completion(input, position) {
    const current = at(input, position); if (!current || current.offset === null) return { isIncomplete: false, items: [] };
    const result = languageService.getCompletionsAtPosition(current.virtual.fileName, current.offset, { includeCompletionsForModuleExports: false });
    return { isIncomplete: false, items: (result?.entries || []).filter(item => !item.name.startsWith('__rmtx_')).map(item => ({ label: item.name, kind: item.kind === 'property' ? 10 : 6,
      detail: item.kind, sortText: item.sortText, ...(item.replacementSpan ? { textEdit: { range: current.virtual.toOriginalSpan(item.replacementSpan.start, item.replacementSpan.length)?.range, newText: item.name } } : {}) })) };
  }
  function hover(input, position) {
    const symbol = symbolAt(input, position);
    if (symbol) return { contents: { kind: 'markdown', value: `\`RMT.${symbol.domain} ${symbol.name}\`` }, range: tokenLocation(symbol.token).range };
    const current = at(input, position); if (!current || current.offset === null) return null;
    const result = languageService.getQuickInfoAtPosition(current.virtual.fileName, current.offset); if (!result) return null;
    return { contents: { kind: 'markdown', value: '```typescript\n' + ts.displayPartsToString(result.displayParts).replaceAll('__rmtx_model', 'model').replaceAll('__rmtx_selectors', 'selectors') + '\n```\n' + ts.displayPartsToString(result.documentation) },
      range: current.virtual.toOriginalSpan(result.textSpan.start, result.textSpan.length)?.range };
  }
  function definition(input, position) {
    const symbol = symbolAt(input, position);
    if (symbol) return symbol.definitions.map(item => tokenLocation(item.token));
    const current = at(input, position); if (!current || current.offset === null) return [];
    return (languageService.getDefinitionAtPosition(current.virtual.fileName, current.offset) || []).map(item => {
      const virtual = virtuals.get(item.fileName); if (virtual) return virtual.toOriginalSpan(item.textSpan.start, item.textSpan.length);
      const source = ts.sys.readFile(item.fileName); if (source === undefined) return null;
      const document = normalize({ filePath: item.fileName, text: source }, rootDir); return { uri: document.uri, range: modelFor(document).rangeForOffsets(item.textSpan.start, item.textSpan.start + item.textSpan.length) };
    }).filter(Boolean).map(({ uri, range }) => ({ uri, range }));
  }
  function references(input, position, includeDeclaration = true) {
    const symbol = symbolAt(input, position);
    if (symbol) {
      const virtual = refresh(input), facts = virtual.symbols ? virtual : virtuals.values().next().value;
      const found = [...(includeDeclaration ? symbol.definitions : []), ...(facts?.references || []).filter(item => item.domain === symbol.domain && item.name === symbol.name)];
      return uniqueLocations(found.map(item => tokenLocation(item.token)));
    }
    const current = at(input, position); if (!current || current.offset === null) return [];
    const definitions = definition(input, position), results = [], seen = new Set();
    for (const target of definitions) {
      const source = [...virtuals.values()].flatMap(item => item.sourceDocuments).find(item => item.uri === target.uri);
      if (source) refresh(source);
    }
    for (const target of definitions) for (const virtual of virtuals.values()) {
      const offset = virtual.toVirtualOffset(target.range.start, target.uri); if (offset === null) continue;
      for (const item of languageService.getReferencesAtPosition(virtual.fileName, offset) || []) {
        const source = virtuals.get(item.fileName), location = source?.toOriginalSpan(item.textSpan.start, item.textSpan.length); if (!location) continue;
        const declaration = definitions.some(item => item.uri === location.uri && JSON.stringify(item.range) === JSON.stringify(location.range));
        if (!includeDeclaration && declaration) continue;
        const key = JSON.stringify([location.uri, location.range]); if (!seen.has(key)) { seen.add(key); results.push({ uri: location.uri, range: location.range }); }
      }
    }
    return results;
  }
  function rename(input, position, newName) {
    const symbol = symbolAt(input, position), pattern = symbol && symbol.domain !== 'NativeRef' ? /^[$A-Z_a-z][$\w]*(?:\.[$A-Z_a-z][$\w]*)*$/u : /^[$A-Z_a-z][$\w]*$/u;
    if (symbol && symbol.definitions.length !== 1) throw new TypeError('An ambiguous RMTX declaration cannot be renamed.');
    if (typeof newName !== 'string' || !pattern.test(newName) || newName.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) throw new TypeError('RMTX names require safe identifiers.');
    const changes = {};
    for (const item of references(input, position, true)) (changes[item.uri] ||= []).push({ range: item.range, newText: newName });
    return { changes };
  }
  function prepareRename(input, position) {
    const symbol = symbolAt(input, position);
    if (symbol) return { range: tokenLocation(symbol.token).range, placeholder: symbol.token.document.text.slice(symbol.token.start, symbol.token.end) };
    const current = at(input, position); if (!current || current.offset === null) return null;
    const info = languageService.getRenameInfo(current.virtual.fileName, current.offset);
    const location = info.canRename && current.virtual.toOriginalSpan(info.triggerSpan.start, info.triggerSpan.length);
    if (!location || !references(input, position, true).length) return null;
    return { range: location.range, placeholder: info.displayName };
  }
  function documentSymbols(input) {
    const current = refresh(input); if (!current) return [];
    const facts = current.symbols ? current : virtuals.values().next().value, sourceModel = modelFor(current.document);
    return (facts?.symbols || []).filter(item => item.token.document.uri === current.document.uri).map(item => ({ name: item.name, kind: 13,
      range: sourceModel.rangeForOffsets(item.nodeRange.start, item.nodeRange.end),
      selectionRange: sourceModel.rangeForOffsets(item.token.start, item.token.end), detail: item.domain }));
  }
  function tokenLocation(token) { return { uri: token.document.uri, range: modelFor(token.document).rangeForOffsets(token.start, token.end) }; }
  function uniqueLocations(values) { return [...new Map(values.map(value => [JSON.stringify(value), value])).values()]; }
  function symbolAt(input, position) {
    const current = refresh(input); if (!current) return null;
    const facts = current.symbols ? current : virtuals.values().next().value;
    const offset = typeof position === 'number' ? position : modelFor(current.document).offsetAt(position);
    const occurrence = [...(facts?.symbols || []), ...(facts?.references || [])].find(item => item.token.document.uri === current.document.uri && offset >= item.token.start && offset <= item.token.end);
    if (!occurrence) return null;
    const definitions = (facts?.symbols || []).filter(item => item.domain === occurrence.domain && item.name === occurrence.name);
    return { ...occurrence, definitions };
  }
  return { schema: RMTX_LANGUAGE_SERVICE_SCHEMA, apiVersion: RMTX_LANGUAGE_SERVICE_API_VERSION, documents, updateDocument, closeDocument,
    analyze, completion, hover, definition, references, rename, prepareRename, documentSymbols, refresh, hasRmtxDependencies,
    dispose() { languageService.dispose(); documents.clear(); virtuals.clear(); project?.dispose(); } };
}

/** Semantic checking alone: no source-module execution, project compilation or writes. */
function checkRmtxProjectTypes(documents, options = {}) {
  const entry = documents.find(document => document.languageId === 'rmtx' || /\.rmtx$/iu.test(document.filePath || ''));
  if (!entry) return { schema: RMTX_PROJECT_TYPECHECK_SCHEMA, apiVersion: RMTX_LANGUAGE_SERVICE_API_VERSION, ok: true, diagnostics: [] };
  const service = createRmtxLanguageService({ ...options, project: null, getProjectDocuments: () => documents,
    analyzeProject: () => ({ ok: true, diagnostics: [] }) });
  try {
    const result = service.analyze(entry);
    return { schema: RMTX_PROJECT_TYPECHECK_SCHEMA, apiVersion: RMTX_LANGUAGE_SERVICE_API_VERSION, ok: result.ok, diagnostics: result.diagnostics };
  } finally { service.dispose(); }
}
module.exports = { RMTX_LANGUAGE_SERVICE_API_VERSION, RMTX_LANGUAGE_SERVICE_SCHEMA, RMTX_LANGUAGE_ANALYSIS_SCHEMA, RMTX_VIRTUAL_DOCUMENT_SCHEMA, RMTX_PROJECT_TYPECHECK_SCHEMA,
  createRmtxVirtualDocument, createRmtxLanguageService, checkRmtxProjectTypes };
