'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), Module=require('node:module');
const dir=path.resolve(__dirname,'../../tools/rmt-editor/vscode'), bridge=require(path.join(dir,'extension.js'));
const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
function document(languageId='rmtx',fileName='/tmp/editor-test.rmtx') {return {languageId,fileName,uri:{fsPath:fileName,toString:()=>new URL('file://'+fileName).toString()},version:1,getText:()=>'<RMT.Surface id="root" />'};}
function host(doc) {return {window:{activeTextEditor:{document:doc},showErrorMessage:()=>{}},workspace:{workspaceFolders:[{uri:{fsPath:path.resolve(__dirname,'../..')}}],getWorkspaceFolder:()=>({uri:{fsPath:path.resolve(__dirname,'../..')}})}};}
test('RMTX registers its own extension and depends explicitly on the maintained TSX grammar',()=>{
 const language=pkg.contributes.languages.find(l=>l.id==='rmtx');assert.deepEqual(language.extensions,['.rmtx']);assert(pkg.activationEvents.includes('onLanguage:rmtx'));assert(pkg.extensionDependencies.includes('vscode.typescript'));
 const grammar=pkg.contributes.grammars.find(g=>g.language==='rmtx');assert.equal(grammar.scopeName,'source.rmtx');assert.equal(JSON.parse(fs.readFileSync(path.join(dir,grammar.path))).patterns[0].include,'source.tsx');
 assert(!pkg.contributes.languages.find(l=>l.id==='rmt').extensions.includes('.rmtx'));
});
test('every declared RMTX contribution is a real local packaged file',()=>{
 for(const entry of [...pkg.contributes.languages.filter(x=>x.id==='rmtx').map(x=>x.configuration),...pkg.contributes.grammars.filter(x=>x.scopeName.includes('rmtx')).map(x=>x.path),...pkg.contributes.snippets.filter(x=>x.language==='rmtx').map(x=>x.path)]) assert(fs.statSync(path.join(dir,entry)).isFile(),entry);
 for (const language of pkg.contributes.languages.filter(l=>['rmt','rmtx'].includes(l.id))) for(const scheme of ['light','dark']) {
  assert(fs.statSync(path.join(dir,language.icon[scheme])).isFile());assert(fs.readFileSync(path.join(dir,language.icon[scheme]),'utf8').includes('<svg'));
 }
 assert(pkg.files.includes('icons/**'));assert(!pkg.contributes.iconThemes,'Language icons retain the selected theme');
 assert(pkg.files.includes('rmtx-language-configuration.json'));assert(fs.readFileSync(path.join(dir,'build-vsix.js'),'utf8').includes("'rmtx-language-configuration.json'"));
});
test('RMTX snippets distinguish self-closing from paired operators and configuration supports TSX comments',()=>{
 const snippets=JSON.parse(fs.readFileSync(path.join(dir,'snippets/rmtx.code-snippets')));
 const self=snippets['RMTX self-closing operator'].body.join('\n'),paired=snippets['RMTX paired operator'].body.join('\n');
 assert(self.endsWith('/>'));assert(!self.includes('</'));assert(paired.includes('</RMT.${1:Operator}>'));assert(!paired.includes('/>'));
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'rmtx-language-configuration.json'))).comments,{lineComment:'//',blockComment:['/*','*/']});
});
test('LanguageClient selects Classic and RMTX explicitly, without claiming provider TSX files',()=>{
 const config=bridge.createVsCodeLanguageClientConfig({}, {rmtxSyntaxVersion:'8.0.0',rmtxProvidersFile:'metadata/providers.json'});
 assert.deepEqual(config.clientOptions.documentSelector,[{scheme:'file',language:'rmt'},{scheme:'untitled',language:'rmt'},{scheme:'file',language:'rmtx'},{scheme:'untitled',language:'rmtx'}]);
 assert.deepEqual(config.clientOptions.initializationOptions,{rmtxSyntaxVersion:'8.0.0',rmtxProvidersFile:'metadata/providers.json'});
 const resolved=bridge.resolveLanguageServerInvocation(host(document()),{extensionPath:dir});
 assert.equal(resolved.useBundledNode,true);
 const runtime=bridge.createRuntimeLanguageClientServerOptions({TransportKind:{stdio:0}}, {...resolved,transport:'stdio'});
 assert.equal(runtime.command,process.execPath);assert.equal(runtime.options.env.ELECTRON_RUN_AS_NODE,'1');assert.equal(runtime.transport,0);
});
for(const [languageId,fileName] of [['rmtx','/tmp/editor.rmtx'],['rmt','/tmp/mislabeled.rmtx'],['rmtx','/tmp/mislabeled.rmt'],['rmtx',null]]) {
 test('direct Classic code actions reject RMTX before constructing a server: '+languageId+' '+fileName,()=>{
  const doc=document(languageId,fileName||undefined);if(fileName===null){delete doc.fileName;doc.uri={toString:()=> 'untitled:Untitled-1'};}
  let created=false;const result=bridge.requestPrimitiveCodeActionsForDocument(doc,{}, {serverFactory(){created=true;throw Error('Must not parse RMTX as Classic');}});
  assert.equal(result.ok,false);assert.equal(result.status,'unsupported-language');assert.deepEqual(result.actions,[]);assert.equal(created,false);
 });
}
test('active-document Classic experience preserves the unsupported result without requesting an LSP',()=>{
 const result=bridge.createActiveDocumentPrimitiveAuthoringExperience({}, {document:document(),serverFactory(){throw Error('No Classic server');}});
 assert.equal(result.ok,false);assert.equal(result.status,'unsupported-language');assert.equal(result.lsp.status,'unsupported-language');assert.equal(result.lsp.codeActionCount,0);
});
test('Classic lint and debug paths reject RMTX while project build check and write route to the real CLI',()=>{
 const doc=document('rmt','/tmp/mislabeled.rmtx'), vscode=host(doc);let executed=0;
 vscode.tasks={executeTask(){executed++;}};vscode.debug={startDebugging(){executed++;}};vscode.window.createTerminal=()=>{executed++;};
 for(const task of ['lint-active']) assert.equal(bridge.runXtendRmtTask(vscode,{},task).ok,false);
 for(const task of ['lint-active','agent-repair-report']) assert.equal(bridge.runXtendCliInTerminal(vscode,{},task).ok,false);
 assert.equal(bridge.startXtendRmtDebugSession(vscode,{},'Debug Active RMT Build').ok,false);
 assert.equal(bridge.createVsCodeTaskProvider(vscode,{}).resolveTask({definition:{task:'lint-active'}}),undefined);
 assert.equal(executed,0);
 delete vscode.tasks;
 const checked=bridge.runXtendRmtTask(vscode,{extensionPath:dir},'rmt-build-check',{dryRun:true});
 assert.equal(checked.ok,true);assert(checked.task.definition.args.includes('check'),JSON.stringify(checked));assert(checked.task.definition.args.includes('--project'));
 const written=bridge.runXtendRmtTask(vscode,{extensionPath:dir},'rmt-build-write',{dryRun:true});
 assert.equal(written.ok,true);assert(written.task.definition.args.includes('maraca'));assert(written.task.definition.args.includes('build'));
 assert(!written.task.definition.args.includes('rmt-build'));
 const configured=bridge.runXtendRmtTask(vscode,{extensionPath:dir},'rmt-build-check',{rmtxSyntaxVersion:'7.0.0',rmtxProvidersFile:'metadata/providers.json'}).task.definition.args;
 assert(configured.includes('7.0.0'));assert(configured.includes('--rmtx-providers-file'));assert(configured.includes('metadata/providers.json'));
});
test('actual activation registers a shared dispatcher, provider metadata watcher and bundled Node client',async()=>{
 const commands=new Map(), clients=[],disposable=()=>({dispose(){}}),vscode=host(document());
 vscode.window.createOutputChannel=()=>({appendLine(){},clear(){},show(){},dispose(){}});
 vscode.commands={registerCommand(name,fn){commands.set(name,fn);return disposable();}};
 let watched=null,disposed=false;vscode.workspace.createFileSystemWatcher=pattern=>{watched=pattern;return {dispose(){disposed=true;}};};
 class LanguageClient {constructor(id,name,server,options){this.options=options;this.server=server;clients.push(this);}start(){}stop(){this.stopped=true;}}
 const source=fs.readFileSync(path.join(dir,'extension.js'),'utf8'),module={exports:{}},requireFrom=Module.createRequire(path.join(dir,'extension.js'));
 vm.runInThisContext(Module.wrap(source),{filename:path.join(dir,'extension.js')})(module.exports,name=>name==='vscode'?vscode:name==='vscode-languageclient/node'?{LanguageClient,TransportKind:{stdio:0}}:requireFrom(name),module,path.join(dir,'extension.js'),dir);
 const context={extensionPath:dir,subscriptions:[]},result=module.exports.activate(context);
 assert.equal(result.languageClient,'started');assert.equal(clients.length,1);assert(clients[0].options.documentSelector.some(s=>s.language==='rmtx'));assert(clients[0].options.documentSelector.some(s=>s.language==='rmt'));
 assert.equal(clients[0].server.command,process.execPath);assert.equal(clients[0].server.options.env.ELECTRON_RUN_AS_NODE,'1');assert(watched.includes('json'));
 assert(commands.has('xtendRmt.runActiveLint'));assert.equal(commands.get('xtendRmt.runActiveLint')().ok,false);
 await module.exports.deactivate();assert.equal(clients[0].stopped,true);assert.equal(disposed,true);
});
