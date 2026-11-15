'use strict';

// A06 experiment only: no module execution, production frontend, or public API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const options = {
  strict: true, noEmit: true, types: [], skipLibCheck: false,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.Preserve
};
const fixture = [
  'declare namespace JSX { interface Element { readonly node: unique symbol } }',
  'declare function Host(props: { title: string }): JSX.Element;',
  'declare const model: { product: { title: string } };',
  'export const view = <Host title={model.product.title} />;',
  ''
].join('\n');

function inspect() {
  const checks = [], dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a06-extensions-'));
  const record = (name, result) => checks.push({ name, ...result });
  const write = (name, source) => {
    const file = path.join(dir, name); fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source); return file;
  };
  const diagnostics = program => ts.getPreEmitDiagnostics(program).map(d => ({
    code: d.code, file: d.file ? path.basename(d.file.fileName) : null,
    start: d.start ?? null, length: d.length ?? null,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n').split(dir).join('<work>')
  }));
  const program = (file, additional = {}) => ts.createProgram([file], { ...options, ...additional });
  try {
    let syntaxShape;
    for (const suffix of ['tsx', 'rmtx', 'rmtx.tsx']) {
      const file = write(`roots/view.${suffix}`, fixture);
      const parsed = ts.createSourceFile(file, fixture, options.target, true, ts.ScriptKind.TSX);
      assert.equal(parsed.parseDiagnostics.length, 0);
      const shape = [];
      const visit = node => { shape.push(node.kind); ts.forEachChild(node, visit); }; visit(parsed);
      const syntaxSha256 = hash(JSON.stringify(shape));
      if (syntaxShape) assert.equal(syntaxSha256, syntaxShape); else syntaxShape = syntaxSha256;
      record(`explicit TSX parser accepts .${suffix} with the same syntax tree`, { diagnosticCodes: [], syntaxSha256, scriptKind: 'TSX' });
      const errors = diagnostics(program(file));
      if (suffix === 'rmtx') assert.deepEqual(errors.map(d => d.code), [6054]);
      else assert.deepEqual(errors, []);
      record(`ordinary TypeScript program root .${suffix}`, { accepted: errors.length === 0, diagnostics: errors });
    }

    const inferred = ts.createSourceFile('view.rmtx', fixture, options.target, true);
    assert.equal(inferred.scriptKind, ts.ScriptKind.TS);
    assert(inferred.parseDiagnostics.length > 0);
    record('unknown extension does not infer JSX parsing', { inferredScriptKind: 'TS', diagnosticCodes: inferred.parseDiagnostics.map(d => d.code) });

    const arbitraryRoot = diagnostics(program(path.join(dir, 'roots/view.rmtx'), { allowArbitraryExtensions: true }));
    assert.deepEqual(arbitraryRoot.map(d => d.code), [6054]);
    record('allowArbitraryExtensions does not register .rmtx as a source root', { diagnostics: arbitraryRoot });

    const globDir = path.join(dir, 'glob'); write('glob/view.rmtx', fixture);
    for (const include of [['**/*'], ['**/*.rmtx']]) {
      const result = ts.parseJsonConfigFileContent({ compilerOptions: { jsx: 'preserve' }, include }, ts.sys, globDir);
      assert.deepEqual(result.fileNames, []); assert(result.errors.some(d => d.code === 18003));
      record(`default config expansion ignores custom roots: ${include[0]}`, { include, files: [], diagnosticCodes: result.errors.map(d => d.code) });
    }

    // The original .rmtx is deliberately invalid: imported declarations cannot prove source validity.
    const consumer = write('imports/app.ts', 'import view from "./view.rmtx"; const id: string = view.productId;\n');
    write('imports/view.rmtx', 'THIS IS NOT VALID TSX');
    for (const allowArbitraryExtensions of [false, true]) {
      const errors = diagnostics(program(consumer, { allowArbitraryExtensions }));
      assert.deepEqual(errors.map(d => d.code), [2307]);
      record(`custom import without declaration (allowArbitraryExtensions=${allowArbitraryExtensions})`, { diagnostics: errors });
    }
    write('imports/view.d.rmtx.ts', 'declare const view: { readonly productId: string }; export default view;\n');
    for (const allowArbitraryExtensions of [false, true]) {
      const p = program(consumer, { allowArbitraryExtensions }), errors = diagnostics(p);
      assert.deepEqual(errors.map(d => d.code), allowArbitraryExtensions ? [] : [6263]);
      const sources = p.getSourceFiles().filter(f => f.fileName.startsWith(dir)).map(f => path.basename(f.fileName));
      assert(!sources.includes('view.rmtx'));
      record(`custom import with view.d.rmtx.ts (allowArbitraryExtensions=${allowArbitraryExtensions})`, {
        diagnostics: errors, checkedFiles: sources, originalSourceChecked: false
      });
    }
    fs.writeFileSync(consumer, 'import view from "./view.rmtx"; const id = view.missing;\n');
    const badImport = diagnostics(program(consumer, { allowArbitraryExtensions: true }));
    assert.deepEqual(badImport.map(d => d.code), [2339]);
    record('declaration import checks the consumer boundary, not the .rmtx body', { diagnostics: badImport });

    for (const valid of [true, false]) {
      const source = valid ? fixture : fixture.replace('model.product.title', 'model.product.missing');
      const original = write('virtual/view.rmtx', source), virtual = original + '.tsx';
      const host = ts.createCompilerHost(options), getSourceFile = host.getSourceFile.bind(host);
      host.getSourceFile = (name, version, onError, shouldCreateNewSourceFile) =>
        name === virtual ? ts.createSourceFile(name, fs.readFileSync(original, 'utf8'), version, true, ts.ScriptKind.TSX)
          : getSourceFile(name, version, onError, shouldCreateNewSourceFile);
      const p = ts.createProgram([virtual], options, host), errors = diagnostics(p);
      assert.deepEqual(errors.map(d => d.code), valid ? [] : [2339]);
      const mapped = errors.map(d => {
        assert.equal(d.file, 'view.rmtx.tsx');
        assert.equal(source.slice(d.start, d.start + d.length), 'missing');
        return { ...d, file: 'view.rmtx', sourceText: source.slice(d.start, d.start + d.length), offsetMapping: 'identity' };
      });
      record(`in-memory TSX projection checks .rmtx source (${valid ? 'valid' : 'wrong field'})`, {
        accepted: errors.length === 0, virtualFile: 'view.rmtx.tsx', originalFile: 'view.rmtx', diagnostics: mapped,
        emitted: false, moduleExecution: false, generalSourceMapsImplemented: false
      });
    }

    const eager = fixture.replace('declare const model: { product: { title: string } };', 'declare function computeTitle(): string;')
      .replace('model.product.title', 'computeTitle()');
    const eagerFile = write('ordinary/effects.tsx', eager), eagerErrors = diagnostics(program(eagerFile));
    assert.deepEqual(eagerErrors, []);
    record('ordinary TSX typechecking does not impose declarative expression rules', {
      diagnostics: eagerErrors, callExpressionAcceptedByTypeScript: true, expressionExecuted: false,
      rmtSemanticValidationPerformed: false
    });

    const candidate = fs.readFileSync(path.join(root, 'development/rmtx-a06/two-host.candidate.tsx'), 'utf8');
    for (const suffix of ['tsx', 'rmtx', 'rmtx.tsx']) {
      const parsed = ts.createSourceFile(`two-host.candidate.${suffix}`, candidate, options.target, true, ts.ScriptKind.TSX);
      assert.equal(parsed.parseDiagnostics.length, 0);
      record(`existing Two-Host candidate parses as explicit TSX under .${suffix}`, {
        diagnosticCodes: [], semanticLoweringPerformed: false, providerExecution: false
      });
    }

    return {
      format: 1, version: '1.0.0', stage: 'A06-file-extension-experiment', date: '2026-11-15',
      node: process.version, typescript: ts.version, passed: true, checks: checks.length, observations: checks,
      sourceExecutionPerformed: false, productionFrontendImplemented: false, editorSessionTested: false,
      sources: Object.fromEntries([
        'development/rmtx-a06/syntax-comparison/extension-probes.cjs',
        'development/rmtx-a06/two-host.candidate.tsx'
      ].map(file => [file, hash(fs.readFileSync(path.join(root, file)))]))
    };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

if (require.main === module) {
  try {
    const result = inspect(), text = JSON.stringify(result, null, 2) + '\n', output = path.join(__dirname, 'extension-evidence.json');
    if (process.argv.includes('--write')) fs.writeFileSync(output, text);
    if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output, 'utf8'), text, 'Extension experiment source/toolchain drift');
    console.log(JSON.stringify({ passed: result.passed, checks: result.checks, node: result.node, typescript: result.typescript }));
  } catch (error) { console.error(error); process.exitCode = 1; }
}
module.exports = { inspect };
