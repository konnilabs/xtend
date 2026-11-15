'use strict';

// Analysis probes only. This is neither an RMTX parser nor a public language contract.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
const { parseRmtClassicSource } = require('../../tools/rmt-language/classic-parser');

function primitive(value) {
  if (Array.isArray(value)) return `[${value.map(primitive).join(', ')}]`;
  if (value && typeof value === 'object') return `{ ${Object.entries(value).map(([k, v]) => `${JSON.stringify(k)} ${primitive(v)}`).join(', ')} }`;
  return JSON.stringify(value);
}

function parseTSX(source) {
  return ts.createSourceFile('candidate.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function typeErrors(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-tsx-scope-'));
  try {
    const file = path.join(dir, 'candidate.tsx');
    fs.writeFileSync(file, source);
    const program = ts.createProgram([file], { noEmit: true, strict: true, skipLibCheck: true, types: [], jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022 });
    return ts.getPreEmitDiagnostics(program).map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

async function inspect() {
  const checks = [];
  const { createRmtStateSelectorRuntime } = await import(pathToFileURL(path.join(root, 'xtendrmt/rmt-state-selector-runtime.js')));
  for (const [name, expression, items, expected] of [
    ['Classic negation covers the comparison', '!item.name == null', [{ name: 'alpha' }], 1],
    ['Explicit JS-style grouping changes the result', '(!item.name) == null', [{ name: 'alpha' }], 0],
    ['Classic equality is strict despite its spelling', 'item.value == 1', [{ value: '1' }, { value: 1 }], 1],
    ['Classic contains is string containment, including array string conversion', 'contains(item.tags, "1")', [{ tags: ['10'] }, { tags: ['2'] }], 1],
    ['Decimal selector comparisons execute', 'item.value > 0.5', [{ value: 0.4 }, { value: 0.7 }], 1],
    ['JavaScript strict equality spelling is not Classic syntax', 'item.value === 1', [], null],
    ['Chained comparison is not Classic syntax', 'item.a < item.b < item.c', [], null],
    ['Arithmetic is not a Classic selector expression', 'item.value + 1 > 0', [], null],
    ['Arbitrary method calls are not Classic selector expressions', 'item.value.filter(item.other)', [], null],
    ['Unary minus is not a Classic selector literal', 'item.value > -1', [], null]
  ]) {
    const text = `template probe {\n state rows type array initial ${primitive(items)}\n selector selected from state rows {\n where ${expression}\n }\n}`;
    const parsed = parseRmtClassicSource(text), compiled = compileRmtClassicSource(text);
    assert.equal(compiled.ok, expected !== null, name);
    let selected = null;
    if (compiled.ok) {
      selected = createRmtStateSelectorRuntime(compiled.orchestrationArtifacts.state).select('selected');
      assert.equal(selected.length, expected, name);
    }
    checks.push({ name, expression, parseOk: parsed.ok, compileOk: compiled.ok, selected, diagnosticCodes: compiled.diagnostics.map(d => d.code) });
  }

  for (const [name, type, expression, input, jsValue, rmtIndex] of [
    ['Negation/comparison differs even in valid typed JavaScript', '{name: string | null}', '!item.name == null', { name: 'alpha' }, false, 0],
    ['Loose JavaScript equality differs from Classic equality', '{value: string | number}', 'item.value == 1', { value: '1' }, true, 2],
    ['Array includes does not implement the Classic contains intrinsic', '{tags: string[]}', 'item.tags.includes("1")', { tags: ['10'] }, false, 3]
  ]) {
    const diagnostics = typeErrors(`declare const item: ${type}; const predicate = ${expression};`);
    assert.deepEqual(diagnostics, []);
    const actual = vm.runInNewContext(expression, { item: input }, { timeout: 1000 });
    assert.equal(actual, jsValue);
    const selected = checks[rmtIndex].selected.some(row => JSON.stringify(row) === JSON.stringify(input));
    assert.notEqual(selected, actual);
    checks.push({ name, input, expression, typeDiagnostics: diagnostics, rmtSelected: selected, jsSelected: actual });
  }

  for (const [name, source, accepted] of [
    ['Explicit lifecycle and scheduler nodes fit ordinary TSX grammar', '<RMT.Template id="app"><RMT.Surface id="root"><RMT.Lane name="visible" weight={80}><RMT.Hydrate target="card" from={selector("product.view")} when={model.ready && !model.pending} /></RMT.Lane></RMT.Surface></RMT.Template>', true],
    ['Action, policy and transition records fit ordinary TSX grammar', '<RMT.Program><RMT.Action id="save"><RMT.Input name="id" type="string"/><RMT.Effect kind="request" datasource="saveProduct"/><RMT.Reduce target="state.product" value={result.product}/></RMT.Action><RMT.Transition id="next" from={["step1"]} to={["step2"]} lane="transition"/></RMT.Program>', true],
    ['Nested repeats can use genuine callback scopes', '<RMT.For each={groups} keyBy="id">{group => <RMT.For each={group.items} keyBy="id">{item => <RMT.Host declarationId="card" props={{item}} />}</RMT.For>}</RMT.For>', true],
    ['Classic keywords cannot be pasted into JSX expression braces', '<RMT.Surface>{lane visible { hydrate card from selector product }}</RMT.Surface>', false],
    ['Classic event arrow is not a JavaScript expression', '<RMT.On route={click -> action.save}/>', false],
    ['TSX generic callbacks need disambiguation', 'const fn = <T>(item: T) => item;', false],
    ['A trailing comma disambiguates a generic TSX callback', 'const fn = <T,>(item: T) => item;', true]
  ]) {
    const diagnostics = parseTSX(source).parseDiagnostics;
    assert.equal(diagnostics.length === 0, accepted, name);
    checks.push({ name, source, parseAccepted: accepted, diagnosticCodes: diagnostics.map(d => d.code), semanticLoweringImplemented: false });
  }

  const declarations = `
    declare namespace JSX { interface Element { readonly node: unique symbol } interface ElementChildrenAttribute { children: {} } }
    declare namespace RMT {
      function For<T>(props: { each: readonly T[]; keyBy: keyof T; children: (item: T) => JSX.Element }): JSX.Element;
      function ForString(props: { each: readonly {id: string}[]; as: string; children: JSX.Element }): JSX.Element;
      function Item(props: { id: string }): JSX.Element;
    }
    declare const items: readonly { id: string; title: string }[];
  `;
  const scoped = typeErrors(declarations + 'const tree = <RMT.For each={items} keyBy="id">{item => <RMT.Item id={item.id}/>}</RMT.For>;');
  assert.deepEqual(scoped, []);
  checks.push({ name: 'A typed child callback introduces a checked lexical item', diagnostics: scoped });
  const missing = typeErrors(declarations + 'const tree = <RMT.For each={items} keyBy="id">{item => <RMT.Item id={item.missing}/>}</RMT.For>;');
  assert(missing.some(d => d.code === 2339));
  checks.push({ name: 'Unknown callback fields fail normal TypeScript checking', diagnostics: missing });
  const stringScope = typeErrors(declarations + 'const tree = <RMT.ForString each={items} as="item"><RMT.Item id={item.id}/></RMT.ForString>;');
  assert(stringScope.some(d => d.code === 2304 || d.code === 2552));
  checks.push({ name: 'A string-valued as attribute introduces no TypeScript variable', diagnostics: stringScope });

  const idFile = parseTSX('const bad = model.product.selected-image; const literal = <RMT.State id="product.selected-image"/>;');
  assert.equal(idFile.parseDiagnostics.length, 0);
  const badPath = idFile.statements[0].declarationList.declarations[0].initializer;
  assert(ts.isBinaryExpression(badPath) && badPath.operatorToken.kind === ts.SyntaxKind.MinusToken);
  checks.push({ name: 'A hyphenated RMT identifier must not become dotted JS member access', parsedAs: 'subtraction', stringIdentifierAccepted: true });

  const source = `
    const RMT = { When: "when" }; const model = { value: 1 }; const calls = [];
    function read() { calls.push("read"); return model.value; }
    function factory(type, props) { calls.push("factory"); return {type, props}; }
    const tree = <RMT.When test={read()} />;
    model.value = 2;
    globalThis.result = { calls, captured: tree.props.test, current: model.value };
  `;
  const emitted = ts.transpileModule(source, { fileName: 'eager.tsx', compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: 'factory', target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const sandbox = {}; vm.runInNewContext(emitted, sandbox, { timeout: 1000 });
  assert.equal(JSON.stringify(sandbox.result), JSON.stringify({ calls: ['read', 'factory'], captured: 1, current: 2 }));
  checks.push({ name: 'An ordinary JSX factory receives eagerly evaluated values without dependency paths', observed: JSON.parse(JSON.stringify(sandbox.result)), customLoweringExecuted: false });

  const inputs = ['operator-tsx-probes.cjs', 'syntax-and-jsx-sideloading-assessment.md', 'scoped-components.md'].map(p => 'development/rmtx-a06/' + p).concat([
    'tools/rmt-language/classic-parser.js', 'tools/rmt-language/classic-compiler.js', 'tools/rmt-language/classic-ast-rules.js',
    'tools/rmt-language/vnext-parser.js', 'tools/rmt-language/vnext-compiler.js', 'xtendrmt/rmt-state-selector-runtime.js'
  ]);
  return { format: 1, version: '1.0.0', date: '2026-11-15', node: process.version, typescript: ts.version, checks: checks.length, passed: true, observations: checks,
    sources: Object.fromEntries(inputs.map(p => [p, createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex')])),
    rmtxFrontendImplemented: false, syntaxDecisionMade: false, axOrHumanBenchmarkPerformed: false };
}

if (require.main === module) inspect().then(result => {
  const text = JSON.stringify(result, null, 2) + '\n', file = path.join(__dirname, 'operator-tsx-evidence.json');
  if (process.argv.includes('--write')) fs.writeFileSync(file, text);
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file, 'utf8'), text, 'Analysis source or toolchain drift');
  console.log(JSON.stringify({ passed: result.passed, checks: result.checks, node: result.node, typescript: result.typescript }));
}).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { inspect };
