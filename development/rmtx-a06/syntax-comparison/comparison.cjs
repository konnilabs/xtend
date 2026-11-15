'use strict';
// A06 experiment API 1.0.0: closed fixture frontend, never a production RMTX API.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ts = require('typescript');
const { createHash } = require('node:crypto');
const classic = require('../../../tools/rmt-language/classic-compiler');
const { createMaracaBuildPlan } = require('../../../xtend-maraca');
const reference = require('../two-host-reference.cjs');
const interfaces = require('../../../tools/xtensions/component-interface');
const bindingsApi = require('../../../tools/xtensions/state-binding');
const root = path.resolve(__dirname, '../../..');
const API_VERSION = '1.0.0';
const hash = value => createHash('sha256').update(value).digest('hex');
class ComparisonDiagnostic extends TypeError {
  constructor(code, message, node, file) {
    super(message); this.name = 'ComparisonDiagnostic'; this.code = code;
    const sf = file || node?.getSourceFile(); this.file = sf?.originalFileName || sf?.fileName;
    this.start = node?.getStart(sf) ?? 0; this.length = node ? node.getEnd() - this.start : 0;
  }
}
function fail(code, message, node) { throw new ComparisonDiagnostic(code, message, node); }
function checkedModule(source, fileName) {
  // A virtual .tsx URI supplies TypeScript grammar for .rmtx, not execution.
  const realFile = path.resolve(__dirname, fileName), virtualFile = /\.tsx$/.test(realFile) ? realFile : realFile + '.tsx';
  const scanner = ts.createScanner(ts.ScriptTarget.ES2022, false, ts.LanguageVariant.JSX, source);
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (![ts.SyntaxKind.SingleLineCommentTrivia, ts.SyntaxKind.MultiLineCommentTrivia].includes(token)) continue;
    const comment = scanner.getTokenText();
    for (const pragma of comment.matchAll(/@jsx(?:ImportSource|Runtime|Frag)?\s+(\S+)/g)) {
      if (pragma[0] !== '@jsxImportSource .') throw Object.assign(new ComparisonDiagnostic('EX_DIRECTIVE', 'Only the pinned JSX declaration source is allowed.'), {file:realFile,start:scanner.getTokenPos(),length:scanner.getTextPos()-scanner.getTokenPos()});
    }
    if (/@ts-(?:nocheck|ignore|expect-error)\b/.test(comment))
      throw Object.assign(new ComparisonDiagnostic('EX_DIRECTIVE', 'TypeScript suppression directives are outside this checked source profile.'), { file: realFile, start: scanner.getTokenPos(), length: scanner.getTextPos() - scanner.getTokenPos() });
  }
  const parsed = ts.createSourceFile(virtualFile, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  parsed.originalFileName = realFile;
  if (parsed.referencedFiles.length || parsed.typeReferenceDirectives.length || parsed.libReferenceDirectives.length || parsed.hasNoDefaultLib)
    fail('EX_DIRECTIVE', 'Triple-slash references cannot extend the pinned compiler input graph.', parsed);
  if (parsed.parseDiagnostics.length) fail('EX_PARSE', ts.flattenDiagnosticMessageText(parsed.parseDiagnostics[0].messageText, '\n'), parsed);
  for (const stmt of parsed.statements) {
    if (ts.isImportDeclaration(stmt)) {
      if (stmt.moduleSpecifier.text !== './authoring' || !stmt.importClause?.namedBindings || !ts.isNamedImports(stmt.importClause.namedBindings) || stmt.importClause.name || stmt.importClause.isTypeOnly || stmt.attributes)
        fail('EX_IMPORT', 'Only named imports from the pinned experimental authoring declarations are supported.', stmt);
    } else if (!ts.isExportAssignment(stmt) || stmt.isExportEquals) fail('EX_MODULE', 'Only imports and one default JSX export are allowed; source is never executed.', stmt);
  }
  const exports = parsed.statements.filter(ts.isExportAssignment);
  if (exports.length !== 1) fail('EX_MODULE', 'Exactly one default JSX export is required.', parsed);
  const options = { strict: true, noEmit: true, skipLibCheck: true, types: [], jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10 };
  const host = ts.createCompilerHost(options), read = host.readFile.bind(host), exists = host.fileExists.bind(host), get = host.getSourceFile.bind(host);
  host.readFile = name => path.resolve(name) === virtualFile ? source : read(name);
  host.fileExists = name => path.resolve(name) === virtualFile || exists(name);
  host.getSourceFile = (name, lang, onError, shouldCreate) => path.resolve(name) === virtualFile ? ts.createSourceFile(name, source, lang, true, ts.ScriptKind.TSX) : get(name, lang, onError, shouldCreate);
  const program = ts.createProgram([virtualFile], options, host), file = program.getSourceFile(virtualFile), checker = program.getTypeChecker();
  file.originalFileName = realFile;
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    const first = diagnostics[0], error = new ComparisonDiagnostic('EX_TYPESCRIPT', ts.flattenDiagnosticMessageText(first.messageText, '\n'), file, file);
    error.typescriptCode = first.code; error.start = first.start || 0; error.length = first.length || 0; error.file = first.file?.fileName === virtualFile ? realFile : first.file?.fileName || realFile; error.virtualFile = first.file?.fileName; throw error;
  }
  const declarations = program.getSourceFile(path.join(__dirname, 'authoring.d.ts'));
  const moduleSymbol = checker.getSymbolAtLocation(declarations), imported = Object.fromEntries(checker.getExportsOfModule(moduleSymbol).map(s => [s.name, s]));
  const intrinsics = Object.fromEntries(checker.getExportsOfModule(imported.RMT).map(s => [s.name, s]));
  const symbol = node => { const s = checker.getSymbolAtLocation(node); return s && s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s; };
  const exportNode = file.statements.find(ts.isExportAssignment);
  let body = exportNode.expression; while (ts.isParenthesizedExpression(body)) body = body.expression;
  function tag(node) {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    if (!opening) fail('EX_JSX', 'Explicit JSX elements are required.', node);
    const s = symbol(opening.tagName);
    const found = Object.entries(intrinsics).find(([, expected]) => s === expected)?.[0];
    if (found) return found;
    if (s === imported.ProductHeader) return 'ProductHeader';
    fail('EX_INTRINSIC', 'The element is not a captured experimental intrinsic.', opening.tagName);
  }
  function attrs(node, allowed, required = allowed) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const entries = [];
    for (const attr of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attr) || !allowed.includes(attr.name.text)) fail('EX_ATTRIBUTE', 'Unknown or spread JSX attribute.', attr);
      if (entries.some(([name]) => name === attr.name.text)) fail('EX_ATTRIBUTE', 'Duplicate JSX attribute.', attr);
      let value = attr.initializer;
      if (value && ts.isJsxExpression(value)) value = value.expression;
      entries.push([attr.name.text, value || true]);
    }
    const result = Object.fromEntries(entries);
    if (required.some(name => !Object.hasOwn(result, name))) fail('EX_ATTRIBUTE', 'Missing required attribute: ' + required.filter(name => !Object.hasOwn(result, name)).join(', '), node);
    return result;
  }
  function children(node) {
    if (ts.isJsxSelfClosingElement(node)) return [];
    return node.children.filter(child => {
      if (ts.isJsxText(child) && !child.text.trim()) return false;
      if (!ts.isJsxElement(child) && !ts.isJsxSelfClosingElement(child)) fail('EX_CHILD', 'Only explicit child elements are allowed; no callbacks, conditions or executable children.', child);
      return true;
    });
  }
  function string(node) { if (!ts.isStringLiteral(node)) fail('EX_LITERAL', 'A static string is required.', node); return node.text; }
  function id(node) { const s = string(node); if (!/^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(s) || s.split('.').some(x => ['__proto__','prototype','constructor'].includes(x))) fail('EX_ID', 'Unsafe identifier.', node); return s; }
  function object(node) {
    if (!ts.isObjectLiteralExpression(node)) fail('EX_OBJECT', 'An explicit object literal is required.', node);
    const entries = node.properties.map(p => {
      if (!ts.isPropertyAssignment(p) || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) fail('EX_OBJECT', 'Spreads, computed keys, methods and shorthand are outside this profile.', p);
      const key = p.name.text;
      if (['__proto__','prototype','constructor'].includes(key)) fail('EX_OBJECT', 'Unsafe object key.', p);
      return [key, p.initializer];
    });
    if (new Set(entries.map(([k]) => k)).size !== entries.length) fail('EX_OBJECT', 'Duplicate object key.', node);
    return Object.fromEntries(entries);
  }
  function literal(node) {
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) { const value = Number(node.text); if (!Number.isFinite(value)) fail('EX_LITERAL', 'A finite number is required.', node); return value; }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(Object.entries(object(node)).map(([k, v]) => [k, literal(v)]));
    fail('EX_LITERAL', 'Only plain static JSON literals are supported.', node);
  }
  function ref(node, kind) {
    let base = node, segments = [];
    while (ts.isPropertyAccessExpression(base) && !base.questionDotToken) { segments.unshift(base.name.text); base = base.expression; }
    if (!ts.isIdentifier(base) || symbol(base) !== imported[kind] || !segments.length || segments.some(s => ['__proto__','prototype','constructor'].includes(s)))
      fail('EX_REFERENCE', 'A direct, symbol-resolved ' + kind + ' reference is required.', node);
    return segments;
  }
  function modelPath(node) { const [state, ...p] = ref(node, 'model'); return { state, path: p }; }
  return { file, realFile, virtualFile, checker, body, tag, attrs, children, string, id, object, literal, ref, modelPath };
}
function classicKey(key) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new ComparisonDiagnostic('EX_LITERAL', 'Initial object keys must be Classic identifiers in this profile.');
  return key;
}
function classicValue(value) {
  if (Array.isArray(value)) return '[' + value.map(classicValue).join(', ') + ']';
  if (value && typeof value === 'object') return '{ ' + Object.entries(value).map(([k,v]) => classicKey(k) + ' ' + classicValue(v)).join('; ') + ' }';
  return JSON.stringify(value);
}
function compileSource(source) {
  const compiled = classic.compileRmtClassicSource(source);
  if (!compiled.ok) throw Object.assign(new ComparisonDiagnostic('EX_CLASSIC', 'Lowered Classic source failed the actual compiler.'), { diagnostics: compiled.diagnostics });
  return compiled;
}
function readView(ctx, node, mode, capture, compiled) {
  const { tag, attrs, children, string, id, object, ref, modelPath } = ctx;
  const hosts = [], view = [], declarations = new Set();
  const surfaces = compiled?.coreDocument.surfaces;
  for (const child of children(node)) {
    const kind = tag(child);
    if (children(child).length) fail('EX_CHILD', 'Hosts and header are leaf nodes in this profile.', child);
    if (kind === 'ProductHeader') {
      const a = attrs(child, ['product']), binding = modelPath(a.product);
      if (binding.state !== 'product' || binding.path.length) fail('EX_HEADER', 'The closed ProductHeader profile requires model.product.', child);
      view.push({ kind: 'product-header', id: 'product-header', element: 'h1', text: { state: 'product', path: ['id'] } });
    } else if (kind === 'XTension') {
      const keys = ['declarationId','targetSurface','provider','presence','props','intents'];
      if (mode === 'declarative') keys.push('lane');
      const a = attrs(child, keys), providerSegments = ref(a.provider, 'providers');
      if (providerSegments.length !== 1) fail('EX_PROVIDER', 'One captured provider handle is required.', a.provider);
      const providerType = ctx.checker.getTypeAtLocation(a.provider);
      if (!(providerType.flags & ts.TypeFlags.StringLiteral)) fail('EX_PROVIDER', 'The provider handle must carry one exact provider ID.', a.provider);
      const providerId = providerType.value, entry = capture.catalog.entries().find(e => e.definition.providerId === providerId);
      if (!entry) fail('EX_PROVIDER', 'Unknown captured provider.', a.provider);
      const declarationId = id(a.declarationId), targetSurface = id(a.targetSurface);
      if (declarations.has(declarationId)) fail('EX_HOST', 'Duplicate host declaration.', child); declarations.add(declarationId);
      let lane;
      if (mode === 'declarative') lane = string(a.lane);
      else {
        const target = surfaces?.find(s => s.name === targetSurface);
        const laneRecord = target && target.laneRefs.length === 1 ? compiled.coreDocument.lanes.find(l => l.id === target.laneRefs[0]) : null;
        const operation = laneRecord && laneRecord.operationRefs.length === 1 ? compiled.coreDocument.operations.find(o => o.id === laneRecord.operationRefs[0]) : null;
        if (!operation || operation.op !== 'mount' || operation.target?.ref !== declarationId)
          fail('EX_TARGET', 'The view must bind the matching unique Classic mount target.', child);
        lane = laneRecord.name;
      }
      if (!['visible','idle'].includes(lane)) fail('EX_LANE', 'This case uses only visible/idle, never a source-created admission grant.', child);
      const props = Object.fromEntries(Object.entries(object(a.props)).map(([key, value]) => [key, modelPath(value)]));
      const intents = Object.fromEntries(Object.entries(object(a.intents)).map(([event, value]) => {
        const spec = object(value);
        if (!spec.action || Object.keys(spec).some(k => !['action','payload'].includes(k))) fail('EX_INTENT', 'Only explicit action and optional field mapping are allowed.', value);
        return [event, { command: id(spec.action), ...(spec.payload ? { payload: Object.fromEntries(Object.entries(object(spec.payload)).map(([k,v]) => [k,id(v)])) } : {}) }];
      }));
      hosts.push({ declarationId, targetSurface, providerId, lane, presence: modelPath(a.presence), props, intents,
        interfaceVersion: entry.definition.version, interfaceSha256: entry.interfaceSha256, componentVersion: entry.definition.componentVersion });
    } else fail('EX_VIEW', 'Only the closed native header and XTension hosts belong to the view profile.', child);
  }
  if (hosts.length !== 2 || view.length !== 1) fail('EX_VIEW', 'The comparison case requires one native header and two provider hosts.', node);
  return { hosts, view: { format: 1, version: '1.0.0', profile: 'closed-product-header', nodes: view } };
}
function lowerDeclarative(source, capture, fileName = 'declarative.tsx') {
  const c = checkedModule(source, fileName), { tag, attrs, children, string, id, literal, ref } = c;
  if (tag(c.body) !== 'Program') fail('EX_PROFILE', 'The declarative entry must be Program.', c.body);
  const p = attrs(c.body, ['id','documentId']), lines = [], states = [], actions = []; let surface, portal, loweredView;
  for (const child of children(c.body)) {
    const kind = tag(child);
    if (kind === 'State') {
      if (children(child).length) fail('EX_CHILD', 'State must be a leaf.', child);
      const a = attrs(child,['id','type','initial','preserve']);
      if (string(a.type) !== 'object' || a.preserve !== true) fail('EX_STATE', 'This experiment requires preserved object states.', child);
      states.push(`state ${id(a.id)} type object preserve { initial ${classicValue(literal(a.initial))} }`);
    } else if (kind === 'Action') {
      const a = attrs(child,['id']), body = [], inputs = new Map();
      for (const op of children(child)) {
        if (children(op).length) fail('EX_CHILD', 'Action operations must be leaf nodes.', op);
        if (tag(op) === 'Input') {
          const x = attrs(op,['name','type']), name = id(x.name), type = string(x.type);
          if (!['object','string'].includes(type) || inputs.has(name)) fail('EX_ACTION', 'Invalid or duplicate input.', op);
          inputs.set(name, type); body.push(`input ${name} ${type}`);
        } else if (tag(op) === 'Reduce') {
          const x = attrs(op,['state','path','value'],['state','value']);
          const parts = ref(x.value, 'input');
          if (parts.length !== 1 || !inputs.has(parts[0])) fail('EX_REFERENCE', 'This profile requires a whole input declared in this Action.', x.value);
          const actualType = c.checker.getTypeAtLocation(x.value), declaredType = inputs.get(parts[0]);
          if ((declaredType === 'string' && !(actualType.flags & ts.TypeFlags.String)) || (declaredType === 'object' && !(actualType.flags & ts.TypeFlags.Object)))
            fail('EX_ACTION', 'The declared input type differs from its checked handle type.', x.value);
          const suffix = x.path ? '.' + id(x.path) : '';
          body.push(`reduce state.${id(x.state)}${suffix} = input.${parts.join('.')}`);
        } else fail('EX_ACTION', 'Unsupported Action operation.', op);
      }
      actions.push(`action ${id(a.id)} {\n${body.join('\n')}\n}`);
    } else if (kind === 'Portal') {
      if (portal || children(child).length) fail('EX_PORTAL', 'One leaf portal is required.', child);
      const a = attrs(child,['id','root','layer']);
      if (string(a.layer) !== 'surface' || string(a.root) !== '#xtend-maraca-root') fail('EX_PORTAL', 'Only the owned fixture root is allowed.', child);
      portal = id(a.id); lines.push(`portal ${portal} root ${JSON.stringify(string(a.root))} layer surface`);
    } else if (kind === 'Surface') {
      if (surface) fail('EX_SURFACE', 'One native owner is required.', child);
      const a = attrs(child,['id','kind','component','portal','lane','mount']);
      if (string(a.kind) !== 'region' || string(a.component) !== 'section' || string(a.lane) !== 'visible') fail('EX_SURFACE', 'Unsupported owner profile.', child);
      surface = { id: id(a.id), portal: id(a.portal), mount: id(a.mount) };
      loweredView = readView(c, child, 'declarative', capture);
    } else fail('EX_PROFILE', 'Operator is outside the closed comparison profile.', child);
  }
  if (!surface || !portal || surface.portal !== portal || surface.mount !== 'product-header') fail('EX_SURFACE', 'The owner must use the declared portal.', c.body);
  lines.push(`surface ${surface.id} kind region component section { portal ${portal}\n lane visible { mount ${surface.mount} } }`);
  for (const host of loweredView.hosts) lines.push(`surface ${host.targetSurface} kind region component div { portal ${portal}\n lane ${host.lane} { mount ${host.declarationId} } }`);
  const classicSource = `template ${id(p.id)} {\n${[...states,...actions,...lines].join('\n')}\n}\n`;
  return { classicSource, compiled: compileSource(classicSource), contract: { format: 2, version: '2.0.0', caseId: surface.id,
    documentId: id(p.documentId), ownerSurface: surface.id, hosts: loweredView.hosts }, view: loweredView.view,
    sourceMapping: { source: c.realFile, virtual: c.virtualFile, mapping: 'identity-for-tsx-diagnostics', generatedClassicSourceMap: false } };
}
function lowerHybrid(classicSource, viewSource, capture) {
  const compiled = compileSource(classicSource), c = checkedModule(viewSource, 'view.tsx');
  if (c.tag(c.body) !== 'View') fail('EX_PROFILE', 'The hybrid entry must be View.', c.body);
  const a = c.attrs(c.body,['documentId','ownerSurface']), owner = c.id(a.ownerSurface);
  if (!compiled.coreDocument.surfaces.some(s => s.name === owner)) fail('EX_TARGET', 'The native owner is not declared in Classic.', c.body);
  const ownerRecord = compiled.coreDocument.surfaces.find(s => s.name === owner);
  const ownerLane = ownerRecord.laneRefs.length === 1 ? compiled.coreDocument.lanes.find(l => l.id === ownerRecord.laneRefs[0]) : null;
  const ownerOp = ownerLane && ownerLane.operationRefs.length === 1 ? compiled.coreDocument.operations.find(o => o.id === ownerLane.operationRefs[0]) : null;
  if (!ownerOp || ownerOp.op !== 'mount' || ownerOp.target?.ref !== 'product-header') fail('EX_HEADER', 'Classic must mount the closed native header target.', c.body);
  const v = readView(c, c.body, 'hybrid', capture, compiled);
  return { classicSource, compiled, contract: { format: 2, version: '2.0.0', caseId: owner, documentId: c.id(a.documentId), ownerSurface: owner, hosts: v.hosts },
    view: v.view, sourceMapping: { source: c.realFile, virtual: c.virtualFile, mapping: 'identity-for-tsx-diagnostics', generatedClassicSourceMap: false } };
}
function createBackendVariant(input, capture, sourceName) {
  // Reuse provider-owned contracts, but never the old reference's fixed source plan.
  for (const node of input.view.nodes) {
    const state = input.compiled.orchestrationArtifacts.state.states.find(s => s.id === node.text.state);
    let value = state?.initial;
    for (const key of node.text.path) value = value && Object.hasOwn(value, key) ? value[key] : undefined;
    if (typeof value !== 'string') throw new ComparisonDiagnostic('EX_VIEW_BINDING', 'The closed native header requires an actual string-valued initial Model path.');
  }
  const bindings = [], hosts = input.contract.hosts.map(host => {
    const entry = capture.catalog.resolve({ providerId: host.providerId, interfaceVersion: host.interfaceVersion, interfaceSha256: host.interfaceSha256, componentVersion: host.componentVersion }), iface = entry.definition;
    const resolved = interfaces.resolveComponentBinding(iface, { address: { documentId: input.contract.documentId, declarationId: host.declarationId, keys: [] }, props: host.props, intents: host.intents });
    bindings.push({ surface: host.targetSurface, presence: host.presence, binding: resolved.binding });
    return { ...host, ownerSurface: input.contract.ownerSurface, framework: iface.framework, routes: resolved.routes };
  });
  const artifact = { schema: bindingsApi.XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, documentId: input.contract.documentId, bindings };
  const plan = createMaracaBuildPlan({ source: path.relative(root,path.join(__dirname,sourceName)), sourceText: input.classicSource, xtensionBindings: artifact,
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false });
  if (!plan.ok) throw Object.assign(new ComparisonDiagnostic('EX_PLAN', 'Source/binding validation failed.'), { diagnostics: plan.diagnostics });
  return { ...input, capture, lowered: { apiVersion: '2.0.0', contractVersion: '2.0.0', documentId: input.contract.documentId,
    ownerSurface: input.contract.ownerSurface, hosts, plan, bindings: plan.xtensionBindings, automaticCompositionSupported: false } };
}
async function prepareVariants(overrides = {}) {
  const capture = await reference.captureProviders();
  const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
  const declarative = createBackendVariant(lowerDeclarative(overrides.declarative ?? read('declarative.rmtx'),capture,overrides.declarativeFile ?? 'declarative.rmtx'),capture,'declarative.lowered.rmt');
  const hybrid = createBackendVariant(lowerHybrid(overrides.classic ?? read('classic.rmt'),overrides.view ?? read('view.tsx'),capture),capture,'classic.rmt');
  return { declarative, hybrid };
}
function compareVariants(variants) {
  const stripSourceRanges = value => Array.isArray(value) ? value.map(stripSourceRanges) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).filter(([key]) => !(key === 'range' && typeof value.astPointer === 'string' && typeof value.corePointer === 'string')).map(([key, item]) => [key, stripSourceRanges(item)])) : value;
  const semantic = compiled => stripSourceRanges(compiled.orchestrationArtifacts);
  assert.deepEqual(semantic(variants.declarative.compiled), semantic(variants.hybrid.compiled), 'Different source forms must produce the same orchestration artifacts, excluding source ranges.');
  assert.deepEqual(variants.declarative.lowered.bindings,variants.hybrid.lowered.bindings,'Provider bindings differ.');
  assert.deepEqual(variants.declarative.view,variants.hybrid.view,'Native view sidecars differ.');
  return { orchestration: true, bindings: true, nativeView: true };
}
module.exports = { API_VERSION, ComparisonDiagnostic, checkedModule, lowerDeclarative, lowerHybrid, createBackendVariant, prepareVariants, compareVariants, hash, root };
