#!/usr/bin/env node
'use strict';
// Actual TextMate/Oniguruma tokenization. No JSX or authoring imports execute.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
async function inspect() {
  const appRoot = process.env.XTEND_VSCODE_APP_ROOT || path.resolve(path.dirname(process.execPath), 'resources/app');
  const load = name => { try { return require(name); } catch { return require(path.join(appRoot,'node_modules.asar',name)); } };
  const textmate = load('vscode-textmate'), oniguruma = load('vscode-oniguruma');
  let wasm;
  try { wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')); }
  catch { wasm = fs.readFileSync(path.join(appRoot,'node_modules.asar.unpacked/vscode-oniguruma/release/onig.wasm')); }
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset,wasm.byteOffset+wasm.byteLength));
  const grammarFile = process.env.XTEND_TSX_GRAMMAR || path.join(appRoot,'extensions/typescript-basics/syntaxes/TypeScriptReact.tmLanguage.json');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
  const builtinManifestPath = path.resolve(path.dirname(grammarFile),'../package.json');
  const builtinManifest = JSON.parse(fs.readFileSync(builtinManifestPath,'utf8'));
  const builtinId = `${builtinManifest.publisher}.${builtinManifest.name}`;
  assert(manifest.extensionDependencies.includes(builtinId), `The TSX grammar dependency must use its declared extension ID ${builtinId}, not its installation folder name.`);
  const files = new Map(manifest.contributes.grammars.map(g => [g.scopeName,path.join(__dirname,g.path)]));
  files.set('source.tsx',grammarFile);
  const registry = new textmate.Registry({
    onigLib: Promise.resolve({createOnigScanner: p=>new oniguruma.OnigScanner(p),createOnigString:s=>new oniguruma.OnigString(s)}),
    getInjections: scope => manifest.contributes.grammars.filter(g=>g.injectTo?.includes(scope)).map(g=>g.scopeName),
    loadGrammar: async scope => files.has(scope) ? textmate.parseRawGrammar(fs.readFileSync(files.get(scope),'utf8'),files.get(scope)) : null
  });
  try {
    const grammar = await registry.loadGrammar('source.rmtx');
    assert(grammar,'RMTX grammar must load with its actual TSX dependency.');
    const source = [
      'import { RMT, model } from "./authoring";',
      'export default (',
      '  <RMT.Surface id="root">',
      '    <RMT.foo prop="bar" />',
      '    <RMT.Header value={{ id: model.product.id, items: [1, 2] }} />',
      '    <RMT.When test={model.ready && !model.pending}>',
      '      <h1>{model.product.id}</h1>',
      '    </RMT.When>',
      '    {/* <RMT.NotAnOperator bad="ignored" /> */}',
      '    <RMT.Text value="<RMT.StringContent />" />',
      '  </RMT.Surface>',
      ');',
      '// <RMT.CommentContent />',
      'const text = "<RMT.StringContent />";'
    ];
    let state = textmate.INITIAL;
    const rows = source.map(line=>{const r=grammar.tokenizeLine(line,state);state=r.ruleStack;return r.tokens.map(t=>({text:line.slice(t.startIndex,t.endIndex),scopes:t.scopes}));});
    const checks=['TSX dependency ID matches the actual built-in extension manifest'];
    const check=(name,condition)=>{assert(condition,name);checks.push(name);};
    const token=(line,word,scope)=>rows[line].some(t=>t.text.includes(word)&&t.scopes.some(s=>s.includes(scope)));
    check('RMTX root scope is retained',rows.every(row=>row.every(t=>t.scopes.includes('source.rmtx'))));
    check('paired operator namespace is highlighted',token(2,'RMT','entity.name.tag.namespace.rmtx'));
    check('paired operator name is highlighted',token(2,'Surface','support.class.component.rmtx'));
    check('lower-case qualified operators are highlighted',token(3,'foo','support.class.component.rmtx'));
    check('self-closing punctuation retains TSX scope',token(3,'/>','punctuation.definition.tag.end.tsx'));
    check('JSX attribute names retain TSX scope',token(3,'prop','entity.other.attribute-name.tsx'));
    check('JSX attribute strings retain TSX scope',token(3,'bar','string.quoted.double.tsx'));
    check('nested object expressions use TSX member scopes',token(4,'product','variable.other.object.property.tsx'));
    check('logical operators use TSX operator scopes',token(5,'&&','keyword.operator.logical.tsx'));
    check('ordinary JSX children retain TSX tag scopes',token(6,'h1','entity.name.tag.tsx'));
    check('closing operator names retain RMTX scopes',token(7,'When','support.class.component.rmtx')&&token(10,'Surface','support.class.component.rmtx'));
    check('JSX comments do not acquire RMTX operator scopes',!rows[8].some(t=>t.scopes.includes('support.class.component.rmtx'))&&token(8,'NotAnOperator','comment'));
    check('attribute string contents do not acquire operator scopes',!rows[9].some(t=>t.text.includes('StringContent')&&t.scopes.includes('support.class.component.rmtx')));
    check('line comments do not acquire operator scopes',!rows[12].some(t=>t.scopes.includes('support.class.component.rmtx'))&&token(12,'CommentContent','comment'));
    check('ordinary string contents do not acquire operator scopes',!rows[13].some(t=>t.scopes.includes('support.class.component.rmtx'))&&token(13,'StringContent','string'));
    return {passed:true,node:process.version,tsxGrammar:grammarFile,builtinManifestPath,builtinId,checks:checks.length,names:checks,source,tokenization:rows};
  } finally {registry.dispose();}
}
if(require.main===module)inspect().then(report=>console.log(JSON.stringify({passed:report.passed,node:report.node,checks:report.checks,tsxGrammar:report.tsxGrammar}))).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={inspect};
