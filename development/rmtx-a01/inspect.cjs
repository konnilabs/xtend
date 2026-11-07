#!/usr/bin/env node
'use strict';

// Development observations, not an accepted schema baseline or a language spec.
// Uses the repository's existing TypeScript parser; no application entry runs.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'inventory.json');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const digest = value => createHash('sha256').update(value).digest('hex');
const sorted = values => [...new Set(values)].sort();
const parserFile = 'tools/rmt-language/vnext-parser.js';
const compilerFile = 'tools/rmt-language/vnext-compiler.js';
const sources = [parserFile, compilerFile, 'tools/rmt-language/semantic-graph.js',
  'tools/rmt-language/classic-ast-rules.js', 'tools/rmt-language/classic-ast-contract.js',
  'tools/rmt-language/classic-semantic-rules.js', 'tools/rmt-language/classic-ast-types.d.ts',
  'tools/rmt-language/classic-compiler.js', 'tools/rmt-language/classic-compiler.d.ts',
  'tools/rmt-language/classic-parser.js', 'tools/rmt-language/classic-parser.d.ts',
  'tools/rmt-language/contracts/classic-ast.v1.schema.json',
  'tools/rmt-language/vnext-conditions.js', 'tools/rmt-language/vnext-composition.js',
  'tools/rmt-language/vnext-tooling.js', 'tools/rmt-language-server/protocol.js',
  'tools/rmt-language/vnext-compiler.d.ts', 'tools/rmt-language/rmt-tooling-public-types.d.ts',
  'xtendrmt/rmt-state-selector-runtime.js', 'xtendrmt/rmt-state-selector-runtime.d.ts',
  'xtendrmt/rmt-state-host-adapter.d.ts', 'xtendrmt/rmt-dom-descriptor-renderer.js',
  'xtendrmt/rmt-state-binding-view-projector.js', 'xtendrmt/rmt-portable-render.js', 'xtendrmt/rmt-portable-render.d.ts',
  'xtendrmt/rmt-portable-render.php', 'xtendrmt/rmt-kernel-scheduler.d.ts',
  'xtendrmt/rmt-action-effect-runtime.js', 'xtendrmt/rmt-event-routing-runtime.js',
  'xtendrmt/rmt-form-validation-runtime.d.ts', 'xtendrmt/rmt-animation-engine-runtime.d.ts',
  'xtendrmt/rmt-surface-transition-runtime.d.ts', 'xtendrmt/rmt-resume-runtime.d.ts',
  'tools/xtensions/runtime-host-controller.d.ts', 'tools/xtensions/signal-bridge-contract.d.ts',
  'tools/xtensions/resume-adapter-contract.d.ts', 'xtend-maraca/plan-runtime.mjs',
  'xtendrmt/rmt.schema.json', 'xtendrmt/kernel/templates/rmt.schema.json', 'xtendrmt/contracts/portable-render.v2.json'];
const fixtures = ['vnext-valid-minimal', 'vnext-valid-complex', 'vnext-primitives-grammar-design',
  'vnext-conditions-valid', 'vnext-lifecycle-valid', 'vnext-security-valid', 'vnext-composition-valid',
  'vnext-remote-compiler-valid', 'maraca-orchestration-app', 'maraca-validation-app',
  'maraca-transitions-app', 'vnext-resumability-valid', 'vnext-responsive-bounds-valid']
  .map(name => `tests/rmt-language/fixtures/${name}.rmt`)
  .concat(['docs/xtendrmt-docs-document-v2.rmt', 'development/rmtx-a01/probes/authoring-variants.rmt']);
const probes = ['development/rmtx-a01/probes/selector-datasource.rmt',
  'development/rmtx-a01/probes/core-identity.rmt'];

function walk(node, visit) { visit(node); ts.forEachChild(node, child => walk(child, visit)); }
function textName(node) { return node && (node.text ?? node.getText()); }
function functionOwner(node) {
  for (let at = node.parent; at; at = at.parent) if (ts.isFunctionLike(at)) return at;
  return null;
}
function symbol(node) { return textName(node?.name) || '<anonymous>'; }
function strings(node) {
  if (!node) return [];
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isConditionalExpression(node)) return strings(node.whenTrue).concat(strings(node.whenFalse));
  return [];
}
function evidence(file, tree, node) {
  return { file, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
    symbol: symbol(functionOwner(node)) };
}
function resolveLocal(node) {
  if (!node || !ts.isIdentifier(node)) return node;
  const owner = functionOwner(node);
  let found;
  walk(owner || node.getSourceFile(), candidate => {
    if (ts.isVariableDeclaration(candidate) && textName(candidate.name) === node.text
      && functionOwner(candidate) === owner && candidate.pos < node.pos) found = candidate.initializer;
  });
  return found || node;
}
function fields(node) {
  const value = resolveLocal(node);
  if (!value || !ts.isObjectLiteralExpression(value)) return { fields: [], spreads: [], unresolved: value?.getText().slice(0, 100) || null };
  return {
    fields: sorted(value.properties.filter(prop => !ts.isSpreadAssignment(prop)).map(prop => textName(prop.name)).filter(Boolean)),
    spreads: value.properties.filter(ts.isSpreadAssignment).map(prop => prop.expression.getText())
  };
}
function staticFacts(file) {
  const code = read(file);
  const tree = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true,
    file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
  if (tree.parseDiagnostics.length) throw new Error(`Cannot inspect ${file}: TypeScript parse diagnostics.`);
  const nodes = [];
  walk(tree, node => nodes.push(node));
  const calls = nodes.filter(ts.isCallExpression);
  const facts = { versionedIdentifiers: [], catalogs: [], evaluators: [], operatorBranches: [], interfaces: [], astFactories: [], coreRecords: [], artifactLayouts: [] };
  for (const node of nodes) {
    const ref = evidence(file, tree, node);
    if (file === parserFile && ts.isObjectLiteralExpression(node)) {
      const type = node.properties.find(prop => ts.isPropertyAssignment(prop) && textName(prop.name) === 'type');
      if (type && ts.isStringLiteral(type.initializer) && type.initializer.text.startsWith('Rmt')) {
        facts.astFactories.push({ types: [type.initializer.text], typeExpression: type.initializer.getText(),
          construction: 'object-literal', ...fields(node), ...ref });
      }
    }
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const value = node.initializer;
      if (ts.isStringLiteral(value) && (/^xtend\..*\.v\d+(?:\.\d+)*$/u.test(value.text) || /^https:\/\/xtendrmt/u.test(value.text))) {
        facts.versionedIdentifiers.push({ name: textName(node.name), value: value.text, ...ref });
      }
      let array;
      if (ts.isNewExpression(value) && value.expression.getText() === 'Set') array = value.arguments?.[0];
      if (ts.isCallExpression(value) && value.expression.getText() === 'Object.freeze') array = value.arguments[0];
      if (array && ts.isArrayLiteralExpression(array) && array.elements.every(ts.isStringLiteralLike)) {
        facts.catalogs.push({ name: textName(node.name), values: sorted(array.elements.map(item => item.text)), ...ref });
      }
    }
    if (ts.isInterfaceDeclaration(node)) facts.interfaces.push({ name: textName(node.name),
      fields: node.members.map(member => ({ name: textName(member.name) || '[index]', optional: !!member.questionToken,
        type: member.type?.getText() || member.getText(), declaration: member.getText() })), ...ref });
    if (ts.isSwitchStatement(node)) {
      const cases = node.caseBlock.clauses.filter(ts.isCaseClause).flatMap(clause => strings(clause.expression));
      if (cases.length) facts.evaluators.push({ function: symbol(functionOwner(node)),
        discriminant: node.expression.getText(), cases: sorted(cases), ...ref });
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === 'includes' && ts.isArrayLiteralExpression(node.expression.expression)
      && node.arguments[0] && ['op', 'operation', 'normalizedOp'].includes(node.arguments[0].getText())) {
      facts.operatorBranches.push({ values: node.expression.expression.elements.flatMap(strings),
        dispatch: node.arguments[0].getText(), ...ref });
    }
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken].includes(node.operatorToken.kind)
      && ['op', 'operation', 'normalizedOp'].includes(node.left.getText()) && ts.isStringLiteral(node.right)) {
      facts.operatorBranches.push({ values: [node.right.text], dispatch: node.left.getText(), ...ref });
    }
    if (ts.isReturnStatement(node) && node.expression && ts.isObjectLiteralExpression(node.expression)
      && ['createCoreDocument', 'createAppPlatformRecords', 'createKernelRecords', 'createRmtAppOrchestrationArtifacts',
        'createRmtAppServiceDemands'].includes(symbol(functionOwner(node)))) {
      const nested = [];
      function objectPaths(object, pointer) {
        for (const prop of object.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const at = `${pointer}/${textName(prop.name)}`;
          nested.push({ path: at, form: ts.SyntaxKind[prop.initializer.kind] });
          if (ts.isObjectLiteralExpression(prop.initializer)) objectPaths(prop.initializer, at);
        }
      }
      objectPaths(node.expression, '');
      facts.artifactLayouts.push({ function: symbol(functionOwner(node)), ...fields(node.expression), paths: nested, ...ref });
    }
    if (!ts.isCallExpression(node)) continue;
    const callee = ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : textName(node.expression);
    if (callee === 'createNode') {
      let types = strings(node.arguments[0]);
      if (!types.length && ts.isIdentifier(node.arguments[0])) {
        for (let owner = functionOwner(node); owner && !types.length; owner = functionOwner(owner)) {
          const parameter = owner.parameters.findIndex(item => textName(item.name) === node.arguments[0].text);
          if (parameter >= 0) types = calls.filter(call => ts.isPropertyAccessExpression(call.expression)
            && call.expression.name.text === symbol(owner)).flatMap(call => strings(call.arguments[parameter]));
        }
      }
      facts.astFactories.push({ types: sorted(types), typeExpression: node.arguments[0]?.getText(),
        ...fields(node.arguments[3]), ...ref });
    }
    if (callee === 'addRecord' && ts.isStringLiteral(node.arguments[1])) {
      const record = node.arguments[2];
      const writes = [];
      if (record && ts.isIdentifier(record)) walk(functionOwner(node), candidate => {
        if (ts.isBinaryExpression(candidate) && candidate.operatorToken.kind === ts.SyntaxKind.EqualsToken
          && ts.isPropertyAccessExpression(candidate.left) && candidate.left.expression.getText() === record.text) {
          writes.push(candidate.left.name.text);
        }
      });
      facts.coreRecords.push({ domain: node.arguments[1].text, nodeTypes: strings(node.arguments[4]),
        nodeTypeExpression: node.arguments[4]?.getText() || null,
        ...fields(record), assignedFields: sorted(writes), commonFields: ['sourceRef'], ...ref });
    }
  }
  return facts;
}

function observedFields(records) {
  const result = {};
  for (const record of records) for (const [key, value] of Object.entries(record)) {
    (result[key] ||= new Set()).add(value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value);
  }
  return Object.fromEntries(Object.keys(result).sort().map(key => [key, sorted(result[key])]));
}
async function inspect() {
  if (ts.version !== '5.9.3') throw new Error('Use the existing pinned TypeScript 5.9.3 parser.');
  const { compileRmtVNextSource } = require(path.join(root, compilerFile));
  const { createRmtStateSelectorRuntime } = await import(pathToFileURL(path.join(root, 'xtendrmt/rmt-state-selector-runtime.js')));
  const portable = await import(pathToFileURL(path.join(root, 'xtendrmt/rmt-portable-render.js')));
  const expressionModel = createRmtStateSelectorRuntime();
  const facts = Object.fromEntries(sources.filter(file => /\.(?:js|mjs|ts)$/u.test(file)).map(file => [file, staticFacts(file)]));
  const astRecords = new Map(), coreRecords = new Map(), artifactRecords = new Map();
  const opaque = new Set(['initial', 'value', 'defaults', 'attributes', 'attrs', 'properties', 'props', 'root', 'descriptor', 'descriptors']);
  function artifactFields(value, pointer, depth = 0) {
    if (!value || typeof value !== 'object' || depth > 4) return;
    if (Array.isArray(value)) {
      value.forEach(item => artifactFields(item, `${pointer}/*`, depth));
      return;
    }
    if (!artifactRecords.has(pointer)) artifactRecords.set(pointer, []);
    artifactRecords.get(pointer).push(value);
    for (const [key, child] of Object.entries(value)) {
      if (!opaque.has(key)) artifactFields(child, `${pointer}/${key}`, depth + 1);
    }
  }
  const corpus = fixtures.map(file => {
    const result = compileRmtVNextSource({ text: read(file), filePath: file });
    const seen = new WeakSet();
    function visit(value) {
      if (!value || typeof value !== 'object' || seen.has(value)) return;
      seen.add(value);
      if (typeof value.type === 'string' && value.type.startsWith('Rmt')) {
        if (!astRecords.has(value.type)) astRecords.set(value.type, []);
        astRecords.get(value.type).push(value);
      }
      Object.values(value).forEach(visit);
    }
    visit(result.parserResult.ast);
    artifactFields(result.coreDocument?.appPlatform, '/appPlatform');
    artifactFields(result.coreDocument?.kernelRecords, '/kernelRecords');
    artifactFields(result.orchestrationArtifacts, '/orchestration');
    artifactFields(result.appServiceDemands, '/appServiceDemands');
    for (const [domain, records] of Object.entries(result.coreDocument || {})) {
      if (!Array.isArray(records)) continue;
      if (!coreRecords.has(domain)) coreRecords.set(domain, []);
      coreRecords.get(domain).push(...records.filter(record => record && typeof record === 'object'));
    }
    return { file, parsed: result.parserResult.ok, compiled: result.ok, phase: result.phase,
      diagnostics: result.diagnostics.map(item => ({ code: item.code, severity: item.severity })),
      astKinds: sorted([...seenTypes(result.parserResult.ast)]),
      coreCounts: Object.fromEntries(Object.entries(result.coreDocument || {}).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])),
      orchestrationPresent: !!result.orchestrationArtifacts };
  });
  function seenTypes(ast) {
    const found = new Set(), seen = new WeakSet();
    function visit(value) { if (!value || typeof value !== 'object' || seen.has(value)) return; seen.add(value);
      if (typeof value.type === 'string' && value.type.startsWith('Rmt')) found.add(value.type); Object.values(value).forEach(visit); }
    visit(ast); return found;
  }
  const observations = [];
  for (const file of probes) {
    const result = compileRmtVNextSource({ text: read(file), filePath: file });
    const row = { file, compiled: result.ok, phase: result.phase, status: result.status,
      diagnostics: result.diagnostics.map(item => item.code),
      diagnosticLocations: result.diagnostics.map(item => ({ code: item.code, pointer: item.pointer || null,
        range: item.range, ...(item.relatedInformation ? { relatedInformation: item.relatedInformation } : {}) })),
      artifactsEmitted: !!(result.coreDocument || result.coreJson || result.orchestrationArtifacts || result.appServiceDemands) };
    if (file.includes('selector-datasource') && result.ok) {
      try {
        const value = createRmtStateSelectorRuntime(result.orchestrationArtifacts.state).modelReader.select('picked');
        Object.assign(row, { runtimeSource: result.orchestrationArtifacts.state.selectors[0].from, runtimeValue: value, runtimeValueIsArray: Array.isArray(value) });
      } catch (error) { row.runtimeError = { name: error.name, code: error.code || null }; }
    }
    if (file.includes('core-identity') && result.ok) {
      const ids = result.coreDocument.states.map(state => state.id);
      Object.assign(row, { sourceNames: result.coreDocument.states.map(state => state.name), coreIds: ids,
        uniqueCoreIds: new Set(ids).size, sourceRefs: result.coreDocument.states.map(state => state.sourceRef) });
    }
    observations.push(row);
  }
  const validation = compileRmtVNextSource({ text: read('tests/rmt-language/fixtures/maraca-validation-app.rmt').replace(/component x-input/gu, 'component x-button'), filePath: 'inventory-validation-capability.rmt' });
  observations.push({ mutationOf: 'tests/rmt-language/fixtures/maraca-validation-app.rmt', mutation: 'component x-input -> component x-button',
    compiled: validation.ok, compilerDiagnostics: validation.diagnostics.map(item => item.code),
    validationDiagnostics: (validation.orchestrationArtifacts?.validation?.diagnostics || []).map(item => ({ code: item.code, severity: item.severity })) });
  const portableCases = [
    ['equality', { op: 'equals', left: { op: 'literal', value: 2 }, right: { op: 'literal', value: 2 } }],
    ['relational', { op: 'gt', left: { op: 'literal', value: 2 }, right: { op: 'literal', value: 1 } }],
    ['uppercase', { op: 'uppercase', value: { op: 'literal', value: 'abc' } }],
    ['formatDateShort', { op: 'formatDateShort', value: { op: 'literal', value: '2026-11-07' } }]
  ].map(([name, expression]) => {
    const input = { descriptor: { type: 'text', text: expression } };
    const row = { name, modelResult: expressionModel.resolve(expression),
      validationCodes: portable.validatePortableDescriptor(input.descriptor).map(item => item.code) };
    for (const target of ['node', 'php']) {
      try { const artifact = portable.createPortableRenderArtifact(input, { target }); row[target] = { accepted: true,
        advertisedTargets: artifact.targets, ...(target === 'node' ? { projectedText: portable.projectPortableRender(artifact).descriptor.text } : {}) }; }
      catch (error) { row[target] = { accepted: false, diagnosticCodes: (error.diagnostics || []).map(item => item.code) }; }
    }
    return row;
  });
  const formal = JSON.parse(read('xtendrmt/rmt.schema.json'));
  const minimal = compileRmtVNextSource({ text: read(fixtures[0]), filePath: fixtures[0] });
  const declaredAstTypes = sorted(facts[parserFile].astFactories.flatMap(factory => factory.types).concat('RmtVNextDocument'));
  return {
    inventoryFormat: 'rmtx-a01-observations',
    limitations: ['Static fields and observed fixture types are not a closed JSON Schema or required-field inference.',
      'Observed artifact paths stop after four object levels; initial/value/attribute/prop data and render trees are opaque.',
      'Switch cases and allowlists are implementation evidence, not target execution guarantees.',
      'PHP acceptance below is the existing JS target gate, not execution in a PHP process.',
      'Existing tools/schema-inventory remains responsible for release schema governance; no acceptance baseline is changed.'],
    toolchain: { parser: `typescript@${ts.version}`, generatorSha256: digest(fs.readFileSync(__filename)) },
    inputs: sorted(sources.concat(fixtures, probes)).map(file => ({ file, sha256: digest(read(file)) })),
    facts, corpus,
    astCoverage: { declaredTypes: declaredAstTypes, observedTypes: sorted([...astRecords.keys()]),
      unobservedDeclaredTypes: declaredAstTypes.filter(type => !astRecords.has(type)),
      observedWithoutStaticFactory: sorted([...astRecords.keys()].filter(type => !declaredAstTypes.includes(type))),
      dynamicFactories: facts[parserFile].astFactories.filter(factory => !factory.types.length) },
    observedAstFields: Object.fromEntries([...astRecords].sort().map(([type, records]) => [type, { count: records.length, fields: observedFields(records) }])),
    observedCoreFields: Object.fromEntries([...coreRecords].sort().map(([domain, records]) => [domain, { count: records.length, fields: observedFields(records) }])),
    observedArtifactFields: Object.fromEntries([...artifactRecords].sort().map(([pointer, records]) => [pointer, { count: records.length, fields: observedFields(records) }])),
    documentSchemaComparison: { id: formal.$id, additionalProperties: formal.additionalProperties,
      templateMatchesExport: digest(read('xtendrmt/kernel/templates/rmt.schema.json')) === digest(read('xtendrmt/rmt.schema.json')),
      formalRootFields: Object.keys(formal.properties).sort(),
      compilerRootFields: Object.keys(minimal.coreDocument).sort(),
      serializedCompilerRootFields: Object.keys(JSON.parse(minimal.coreJson)).sort(),
      compilerOnlyFields: Object.keys(minimal.coreDocument).filter(key => !Object.hasOwn(formal.properties, key)).sort(),
      formalDefinitions: Object.keys(formal.$defs).sort() },
    observations, portableCases
  };
}

inspect().then(inventory => {
  const encoded = JSON.stringify(inventory, null, 2) + '\n';
  if (process.argv.includes('--write')) fs.writeFileSync(output, encoded);
  if (process.argv.includes('--check') && (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== encoded)) {
    throw new Error('A01 observations are stale. Inspect input changes, then regenerate with --write.');
  }
  console.log(JSON.stringify({ fixtures: inventory.corpus.length, compiled: inventory.corpus.filter(item => item.compiled).length,
    declaredAstTypes: inventory.astCoverage.declaredTypes.length, observedAstTypes: inventory.astCoverage.observedTypes.length,
    unobservedAstTypes: inventory.astCoverage.unobservedDeclaredTypes.length,
    coreDomains: Object.keys(inventory.observedCoreFields).length, output: path.relative(root, output) }));
}).catch(error => { console.error(error.stack || String(error)); process.exitCode = 1; });
