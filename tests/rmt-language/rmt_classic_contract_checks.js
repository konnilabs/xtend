'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const classic = require('@ccslabs/xtend/rmt-language/classic-compiler');
const parser = require('@ccslabs/xtend/rmt-language/classic-parser');
const legacy = require('../../tools/rmt-language/vnext-compiler');

function bare(ast) {
  return JSON.parse(JSON.stringify(ast, (key, value) => ['range', 'astPointer', 'startToken', 'endToken', 'imports', 'templates', 'surfaces', 'remoteSurfaces'].includes(key) ? undefined : value));
}
async function runClassicContractChecks(context, rootDir) {
  const ts = require('typescript');
  const program = ts.createProgram([path.join(rootDir, 'tests/rmt-language/fixtures/classic-contract-consumer.ts')], {
    strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext
  });
  const typeDiagnostics = ts.getPreEmitDiagnostics(program);
  context.assert(typeDiagnostics.length === 0, `Classic public TypeScript consumer compiles: ${typeDiagnostics.map(entry => ts.flattenDiagnosticMessageText(entry.messageText, ' ')).join('; ')}`);
  const schema = classic.getRmtClassicAstSchema();
  context.assert(schema.title.includes('RMT Classic') && schema.$id === parser.RMT_CLASSIC_AST_SCHEMA,
    'Classic publishes its input schema while retaining the legacy wire discriminator');
  context.assert(Object.keys(schema.definitions).filter(key => key.startsWith('Rmt')).length === 122,
    'Classic contract covers all 122 existing AST node types');
  schema.definitions.RmtStateDeclaration.required = [];
  const cachedSchema = require('@ccslabs/xtend/rmt-language/classic-ast.schema.json');
  const previous = cachedSchema.definitions.RmtStateDeclaration.required;
  try {
    cachedSchema.definitions.RmtStateDeclaration.required = [];
    context.assert(classic.getRmtClassicAstSchema().definitions.RmtStateDeclaration.required.includes('name'),
      'public schema copies and JSON module consumers cannot mutate compiler validation');
  } finally { cachedSchema.definitions.RmtStateDeclaration.required = previous; }
  const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'development/rmtx-a01/inventory.json'))).corpus;
  for (const { file } of corpus) {
    const input = { text: fs.readFileSync(path.join(rootDir, file), 'utf8'), filePath: path.join(rootDir, file) };
    const parsed = parser.parseRmtClassicSource(input);
    const result = classic.compileRmtClassicSource(input);
    context.assert(result.ok && classic.validateRmtClassicAst(parsed.ast).length === 0, `Classic contract accepts ${file}`);
    if (!result.ok) continue;
    context.assert(classic.serializeRmtClassicCore(classic.compileRmtClassicAst(parsed.ast, { sourceModel: parsed.sourceModel })) === result.coreJson,
      'Classic AST and source use the same checked backend');
    context.assert(legacy.compileRmtVNextSource(input).coreJson === result.coreJson, 'Classic and compatibility entrypoints preserve Core bytes');
  }
  const factory = classic.createRmtClassicCompiler();
  context.assert(factory.name === 'RMT Classic' && factory.contract.version === '1.0.0' && Object.isFrozen(factory.contract),
    'Classic factory advertises the immutable versioned compiler contract');
  for (const call of [() => classic.createRmtClassicCompiler({ contractVersion: '2.0.0' }),
    () => classic.compileRmtClassicSource({}, { contractVersion: '2.0.0' }),
    () => factory.compileAst({}, { contractVersion: '2.0.0' })]) {
    let rejected;
    try { call(); } catch (error) { rejected = error; }
    context.assert(rejected?.code === 'rmt.classic.contract.unsupported' && rejected.expected === '1.0.0',
      'Classic cannot silently accept an unsupported compiler contract version');
  }

  const source = `template contract {
  state rows type array initial []
  state count type number initial 0
  selector visible from state rows { where item.active == true\n sort by item.id asc\n output object[] }
  action change { input value number\n reduce state.count = input.value }
}`;
  const ast = bare(parser.parseRmtClassicSource({ text: source }).ast);
  const mutations = [
    ['missing required name', draft => { delete draft.body[0].body[0].name; }, 'structure'],
    ['unknown nested field', draft => { draft.body[0].body[0].unexpected = true; }, 'structure'],
    ['wrong child context', draft => { draft.body[0].body[2].body.push(draft.body[0].body[0]); }, 'structure'],
    ['unknown nested node', draft => { draft.body[0].body[2].body.push({ type: 'RmtUnknownClause' }); }, 'structure'],
    ['wrong primitive variant', draft => { draft.body[0].body[0].initial = { type: 'RmtPrimitiveValue', kind: 'literal', value: {} }; }, 'structure'],
    ['wrong comparison operator', draft => { draft.body[0].body[2].body[0].expression.op = '+'; }, 'structure'],
    ['duplicate sort', draft => { draft.body[0].body[2].body.push(draft.body[0].body[2].body[1]); }, 'cardinality'],
    ['conflicting identifier helper', draft => { draft.body[0].body[0].nameNode.value = 'other'; draft.body[0].body[0].nameNode.parts = ['other']; }, 'coherence'],
    ['forged source pointer', draft => { draft.body[0].body[0].astPointer = '/body/99'; }, 'coherence'],
    ['stale convenience index', draft => { draft.templates = []; }, 'coherence'],
    ['reversed source range', draft => { draft.body[0].range = { start: { line: 3, character: 0 }, end: { line: 2, character: 0 } }; }, 'range'],
    ['foreign AST version', draft => { draft.schema = parser.RMT_CLASSIC_AST_SCHEMA.replace(/v1$/u, 'v99'); }, 'structure']
  ];
  for (const [label, mutate, rule] of mutations) {
    const draft = JSON.parse(JSON.stringify(ast)); mutate(draft);
    const diagnostics = classic.validateRmtClassicAst(draft);
    context.assert(diagnostics.some(item => item.rule === rule), `${label}: Classic validation produces a precise rule diagnostic`);
    let rejected;
    try { classic.compileRmtClassicAst(draft); } catch (error) { rejected = error; }
    context.assert(rejected?.phase === 'ast' && rejected.diagnostics.some(item => item.rule === rule), `${label}: the compiler cannot bypass the contract`);
  }
  let invoked = 0;
  const accessor = Object.defineProperty({}, 'range', { enumerable: true, get() { invoked++; return {}; } });
  context.assert(classic.validateRmtClassicAst(accessor).length > 0 && invoked === 0, 'contract rejects accessor data without executing it');

  for (const array of [new Array(1), Object.assign([], { ignored: 1 })]) {
    const malformed = bare(ast); malformed.body = array;
    context.assert(classic.validateRmtClassicAst(malformed).some(entry => entry.rule === 'data'), 'Classic rejects sparse arrays and ignored array fields');
  }
  context.assert(classic.compileRmtClassicSource({ text: 'state app.status type object initial {}\n action load { status app.status }' }).ok,
    'Classic preserves bare declared State names in Action status');
  context.assert(classic.compileRmtClassicSource({ text: 'state status type object {\n initial {\n value "idle"\n }\n }' }).ok,
    'Classic parses State initial blocks without requiring preserve as a type delimiter');
  const cleanup = classic.compileRmtClassicSource({ text: `template cleanup {
    resource one kind timer owner surface.box {}
    resource two kind timer owner surface.box {}
    surface box kind panel component x-section {
      destroy releases resource one
      destroy releases resource two
    }
  }` });
  context.assert(cleanup.ok && cleanup.coreDocument.surfaces[0].resourceRefs.map(entry => entry.target).join(',') === 'one,two',
    'Classic keeps all explicitly declared surface cleanup resources');
  const invalid = [
    ['unknown reducer input', 'state count type number initial 0\n action change { input value number\n reduce state.count = input.missing }', 'rmt.classic.ref.input_unknown'],
    ['unknown reducer read', 'state count type number initial 0\n action change { reduce state.count = state.missing }', 'rmt.vnext.primitive.unknown-reference'],
    ['wrong reducer namespace', 'state count type number initial 0\n action change { reduce selector.count = 1 }', 'rmt.classic.ref.reducer_target'],
    ['wrong root assignment type', 'state count type number initial 0\n action change { reduce state.count = "wrong" }', 'rmt.classic.type.mismatch'],
    ['wrong initial container', 'state rows type array initial "wrong"', 'rmt.classic.type.mismatch'],
    ['unknown Action status', 'action load { status state.missing }', 'rmt.vnext.primitive.unknown-reference'],
    ['missing validation include', 'validation form { include missing }', 'rmt.vnext.primitive.unknown-reference'],
    ['selector cycle', 'selector one from selector two {}\n selector two from selector one {}', 'rmt.classic.ref.cycle'],
    ['predicate dependency cycle', 'state rows type array initial []\n selector one from state rows { where selector.two.length > 0 }\n selector two from selector one {}', 'rmt.classic.ref.cycle'],
    ['validation include cycle', 'validation one { include two }\n validation two { include one }', 'rmt.classic.ref.cycle']
  ];
  for (const [label, body, code] of invalid) {
    const result = classic.compileRmtClassicSource({ text: `template contract {\n${body}\n}` });
    context.assert(!result.ok && result.phase === 'semantic' && result.diagnostics.some(item => item.code === code), `${label}: rejected before Core emission`);
    context.assert(!result.coreDocument && !result.orchestrationArtifacts, `${label}: emits no executable artifact`);
    let rejected;
    try { classic.compileRmtClassicAst(result.parserResult.ast, { sourceModel: result.parserResult.sourceModel }); } catch (error) { rejected = error; }
    context.assert(JSON.stringify(rejected?.diagnostics) === JSON.stringify(result.diagnostics), `${label}: source/AST semantic diagnostics match`);
  }
  const forwards = classic.compileRmtClassicSource({ text: `template contract {
  state rows type array initial []
  state toggle type boolean initial true
  selector final from selector filtered {}
  selector filtered from state rows { where selector.enabled\n where item.active == true }
  selector enabled from state toggle {}
}` });
  context.assert(forwards.ok && forwards.orchestrationArtifacts.state.selectors.map(selector => selector.id).join(',') === 'enabled,filtered,final',
    'Classic orders source and predicate dependencies before consumers');
  if (forwards.ok) {
    const { createRmtStateSelectorRuntime } = await import(pathToFileURL(path.join(rootDir, 'xtendrmt/rmt-state-selector-runtime.js')));
    const runtime = createRmtStateSelectorRuntime(JSON.parse(JSON.stringify(forwards.orchestrationArtifacts.state)));
    runtime.modelCommandPort.apply([{ operation: 'set', state: 'rows', value: [{ id: 1, active: true }, { id: 2, active: false }] }]);
    context.assert(runtime.modelReader.select('final')?.map(row => row.id).join(',') === '1', 'dependency-ordered selectors execute the intended Model values');
    runtime.modelCommandPort.apply([{ operation: 'set', state: 'toggle', value: false }]);
    context.assert(runtime.modelReader.select('final')?.length === 0, 'predicate dependencies recompute after State changes');
  }
}

module.exports = { runClassicContractChecks };
