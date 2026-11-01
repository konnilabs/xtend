'use strict';
// Runs actual TypeScript consumers and exact AST expressions from the productive
// producer/validators. This is a contract boundary test, not a package install,
// GitHub authentication, complete consumer execution or release approval.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const zlib=require('node:zlib'),crypto=require('node:crypto');
const test=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),profile=require('../../scripts/release/profile.cjs').PROFILE;
const canary=version=>['xtend','release','canary','v'+version].join('.');
function parsed(file,bytes=fs.readFileSync(path.join(root,file),'utf8')){
 const ast=ts.createSourceFile(file,bytes,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 assert.equal(ast.parseDiagnostics.length,0);return ast;
}
function find(ast,predicate){const found=[];function visit(node){if(predicate(node))found.push(node);ts.forEachChild(node,visit);}visit(ast);return found;}
function compile(t,body){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'candidate-interface-compat-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.copyFileSync(path.join(root,'candidate-integrity.d.ts'),path.join(dir,'contract.d.ts'));fs.writeFileSync(path.join(dir,'consumer.ts'),body);
 const program=ts.createProgram([path.join(dir,'consumer.ts')],{noEmit:true,strict:true,types:[],target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10});
 return ts.getPreEmitDiagnostics(program).map(d=>({code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}));
}
test('original public CandidateManifest interface has exactly its historical members',()=>{
 const historical=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'manifest-initial-authority/historical-candidate-declaration.d.ts.gz'))).toString();
 const members=ast=>{const nodes=find(ast,n=>ts.isInterfaceDeclaration(n)&&n.name.text==='CandidateManifest');assert.equal(nodes.length,1);return nodes[0].members.map(n=>n.getText(ast).replace(/\s+/g,''));};
 assert.deepEqual(members(parsed('current.d.ts',fs.readFileSync(path.join(root,'candidate-integrity.d.ts'),'utf8'))),members(parsed('historical.d.ts',historical)));
});
test('legacy access, alias, interface augmentation, both overloads and explicit shared union compile',t=>{
 const diagnostics=compile(t,`import {verifyCandidates,selectCandidateClosure} from './contract';
 import type {CandidateManifest,LegacyCandidateManifest,CoreCandidateManifest} from './contract';
 declare module './contract' { interface CandidateManifest { optionalConsumerExtension?: string; } }
 declare const legacy: CandidateManifest; declare const core: CoreCandidateManifest;
 const alias: LegacyCandidateManifest=legacy;
 const demo: string=alias.demoSha; const extension: string|undefined=legacy.optionalConsumerExtension;
 const oldResult: CandidateManifest=verifyCandidates(legacy,{coreSha:'core',demoSha:'demo',directory:'.'});
 const coreResult: CoreCandidateManifest=verifyCandidates(core,{coreSha:'core',profile:core.profile,directory:'.'});
 selectCandidateClosure(legacy,{}); selectCandidateClosure(core,{});
 function select(m:CandidateManifest|CoreCandidateManifest){return selectCandidateClosure(m,{});}
 `);assert.deepEqual(diagnostics,[]);
});
test('Core candidate cannot masquerade as legacy or claim a Demo identity',t=>{
 const diagnostics=compile(t,`import type {CandidateManifest,CoreCandidateManifest} from './contract';
 declare const core: CoreCandidateManifest;const legacy: CandidateManifest=core;const demo=core.demoSha;`);
 assert.ok(diagnostics.some(d=>/not assignable|missing/.test(d.message)));assert.ok(diagnostics.some(d=>d.code===2339&&/demoSha/.test(d.message)));
});
const artifact={sourceSha:'a'.repeat(40),toolchain:{node:'24.18.0',npm:'11.17.0'},tarballSetIntegrity:'controlled-tarball-binding',manifest:{}};
test('actual consumer report initializer emits only Core canary v2 and starts unsuccessful',()=>{
 const ast=parsed('scripts/release/consumer.cjs'),nodes=find(ast,n=>ts.isVariableDeclaration(n)&&n.name.getText(ast)==='report'&&n.initializer&&n.initializer.getText(ast).includes(canary(2)));
 assert.equal(nodes.length,1);
 const result=vm.runInNewContext('('+nodes[0].initializer.getText(ast)+')',{PROFILE:profile,artifact,process:{versions:{node:'24.18.0'}},buildEvidence:{},buildCanaryIntegrity:()=> 'controlled-build-binding'},{timeout:1000});
 assert.equal(result.schema,canary(2));assert.equal(result.profile,profile);assert.equal(result.sourceSha,artifact.sourceSha);assert.equal(result.ok,false);assert.equal(result.candidateSDK,null);assert.equal(result.resolution,false);assert.ok(!Object.hasOwn(result,'demoSha'));
});
const valid={schema:canary(2),profile,ok:true,sourceSha:artifact.sourceSha,tarballSetIntegrity:artifact.tarballSetIntegrity,toolchain:artifact.toolchain,runtime:{node:'24.18.0',npm:'11.17.0'}};
for(const [file,message,variable] of [
 ['scripts/release/artifact.cjs','Canary source/toolchain/tarball binding mismatch','evidence'],
 ['scripts/release/core-evidence.cjs','Core consumer source/profile/producer-toolchain/runtime mismatch','report']
]){
 const ast=parsed(file),calls=find(ast,n=>ts.isCallExpression(n)&&n.expression.getText(ast)==='check'&&n.arguments[1]&&ts.isStringLiteral(n.arguments[1])&&n.arguments[1].text===message);assert.equal(calls.length,1);
 const expression=calls[0].arguments[0].getText(ast);
 const contractCalls=find(ast,n=>ts.isCallExpression(n)&&n.expression.getText(ast)==='coreContract'&&n.arguments[0].getText(ast)===variable&&n.arguments[1]?.getText(ast).includes(canary(2)));assert.equal(contractCalls.length,1);
 for(const field of ['demoSha','demoRepository','productEvidence','unionEvidence'])test(file+': shared Core contract rejects '+field,()=>assert.throws(()=>require('../../scripts/release/profile.cjs').coreContract({...valid,[field]:'foreign'},canary(2)),/Exact Core contract required/));
 const evaluate=value=>vm.runInNewContext('('+expression+')',{[variable]:value,PROFILE:profile,sourceSha:artifact.sourceSha,tarballSetIntegrity:artifact.tarballSetIntegrity,toolchain:artifact.toolchain,artifact,node:'24.18.0',isDeepStrictEqual:require('node:util').isDeepStrictEqual,releaseSetIntegrity:()=>artifact.tarballSetIntegrity},{timeout:1000});
 test(file+': exact v2 identity boundary accepts matching Core evidence',()=>assert.equal(evaluate(valid),true));
 for(const [name,change] of [
  ['legacy v1',{schema:canary(1)}],['unknown version',{schema:canary(3)}],['wrong profile',{profile:'foreign'}],['Demo field',{demoSha:'b'.repeat(40)}],['wrong source',{sourceSha:'b'.repeat(40)}],['wrong archive set',{tarballSetIntegrity:'foreign'}],['wrong toolchain',{toolchain:{...artifact.toolchain,npm:'foreign'}}],['failed report',{ok:false}]
 ])test(file+': rejects '+name,()=>assert.equal(evaluate({...valid,...change}),false));
 if(variable==='report')test(file+': rejects runtime lane substitution',()=>assert.equal(evaluate({...valid,runtime:{...valid.runtime,node:'26.5.0'}}),false));
}
test('historical v1 fixture contracts remain preserved and distinct from current Core fixtures',()=>{
 const bytes=fs.readFileSync(path.join(root,'tests/release/historical-v1-fixtures.cjs.gz'));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'c6ecbd48fbb6ae6de5a8090e393919cd5d788b8400763215e701c0c88b3d1614');
 const old=zlib.gunzipSync(bytes).toString(),current=fs.readFileSync(path.join(root,'tests/release/fixtures.cjs'),'utf8');
 assert.ok(old.includes(canary(1)));assert.ok(!old.includes(canary(2)));assert.ok(current.includes(canary(2)));assert.ok(!current.includes(canary(1)));
 assert.ok(old.includes(['xtend','release','artifact','v1'].join('.')));assert.ok(current.includes(['xtend','release','artifact','v2'].join('.')));
});

test('paired source pins explicitly distinguish historical and current private audit contracts',()=>{
 const api=require('../../tools/schema-inventory/source-provider.cjs'),coreSha='a'.repeat(40),demoSha='b'.repeat(40);
 const corePin={schema:['xtend','product-demo-pin','v1'].join('.'),repository:'https://github.com/konnilabs/xtend-demos.git',demoSha,implementationCoreSha:coreSha};
 const legacy={schema:['xtend','demo-candidate-source','v1'].join('.'),repository:'https://github.com/konnilabs/xtend.git',coreSha,requiredApi:'public-product-support-and-candidate-integrity-v1'};
 const current={...legacy,requiredApi:'public-product-support-candidate-v1-v2-and-private-current-pair-source-audit'};
 assert.equal(api.verifyProductDemoPin(corePin),corePin);
 assert.equal(api.verifyCandidateSourcePin(legacy,coreSha),legacy);
 const paired={...corePin,ownershipContract:'current-pair-v1',sourceRefs:{core:'refs/tags/migration-source/core-c1-20261021-aaaaaaaa',demo:'refs/tags/migration-source/demo-d1-20261021-bbbbbbbb'}};
 assert.equal(api.verifyProductDemoPin(paired),paired);
 assert.equal(api.verifyCandidateSourcePin(current,paired.implementationCoreSha,paired.ownershipContract),current);
 for(const [pin,mode] of [[current,undefined],[legacy,'current-pair-v1'],[current,'unknown']])assert.throws(()=>api.verifyCandidateSourcePin(pin,coreSha,mode));
 for(const mutation of [{coreSha:'main'},{coreSha:'c'.repeat(40)},{repository:'https://example.invalid/other'},{requiredApi:'unreviewed-api'}])assert.throws(()=>api.verifyCandidateSourcePin({...current,...mutation},coreSha,'current-pair-v1'));
 assert.throws(()=>api.verifyProductDemoPin({...paired,ownershipContract:'unknown'}));
 assert.throws(()=>api.verifyProductDemoPin({...paired,demoSha:'main'}));
 for(const owner of ['core','demo'])for(const ref of [undefined,'refs/heads/main','refs/tags/v0.9.0','refs/tags/migration-source/'+owner+'-c1-20261021-cccccccc'])assert.throws(()=>api.verifyProductDemoPin({...paired,sourceRefs:{...paired.sourceRefs,[owner]:ref}}));
});

test('Python producer and Node consumer agree on current, historical and invalid paired pins',()=>{
 const api=require('../../tools/schema-inventory/source-provider.cjs'),pin=require('../../product-demos.lock.json');
 const candidate={schema:['xtend','demo-candidate-source','v1'].join('.'),repository:'https://github.com/konnilabs/xtend.git',coreSha:pin.implementationCoreSha,requiredApi:'public-product-support-candidate-v1-v2-and-private-current-pair-source-audit'};
 const legacy={schema:pin.schema,repository:pin.repository,demoSha:pin.demoSha,implementationCoreSha:pin.implementationCoreSha};
 const rows=[[pin,candidate],[legacy,{...candidate,requiredApi:'public-product-support-and-candidate-integrity-v1'}],
  [pin,{...candidate,requiredApi:'public-product-support-and-candidate-integrity-v1'}],[legacy,candidate],
  [pin,{...candidate,coreSha:'0'.repeat(40)}],[{...pin,ownershipContract:'foreign'},candidate],
  [{...pin,sourceRefs:{...pin.sourceRefs,core:'refs/heads/main'}},candidate],
  [{...pin,sourceRefs:{...pin.sourceRefs,demo:'refs/tags/v0.9.0'}},candidate],
  [{...pin,sourceRefs:{}},candidate],[{...pin,demoSha:'main'},candidate],
  [{...pin,ownershipContract:null},candidate],
  [{...pin,sourceRefs:{...pin.sourceRefs,core:[pin.sourceRefs.core]}},candidate]];
 const node=rows.map(([p,d])=>{try{api.verifyProductDemoPin(p);api.verifyCandidateSourcePin(d,p.implementationCoreSha,p.ownershipContract);return true;}catch{return false;}});
 assert.deepEqual(node,[true,true,false,false,false,false,false,false,false,false,false,false]);
 const code="import sys,json,runpy\nverify=runpy.run_path(sys.argv[1])['verify_pin_records']\nresults=[]\nfor pin,demo in json.load(sys.stdin):\n try:\n  verify(pin,demo);results.append(True)\n except (ValueError,TypeError,KeyError):results.append(False)\nprint(json.dumps(results))\n";
 const result=require('node:child_process').spawnSync('python3',['-c',code,path.join(root,'scripts/build-union-source-artifact.py')],{input:JSON.stringify(rows),encoding:'utf8',timeout:10000});
 assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),node);
});
