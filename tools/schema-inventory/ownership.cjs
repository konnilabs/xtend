'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const integrity=require('../../candidate-integrity.cjs');
const packageRoot=path.resolve(__dirname,'../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ledgerBytes=()=>require('node:zlib').gunzipSync(fs.readFileSync(path.join(__dirname,'ownership-ledger.json.gz')));
const read=n=>JSON.parse(n==='ownership-ledger.json'?ledgerBytes():fs.readFileSync(path.join(__dirname,n)));
if(sha(ledgerBytes())!=='40a4e1d38dbf9e64a724d69178803768e6bff22c90c8260f5644916c24e127c8')throw Error('Immutable original governance ledger digest mismatch');
const ids=read('selection.json'),ledger=read('ownership-ledger.json'),bindings=read('authority-bindings.json'),overlay=read('command-lexical-overlay.json');
const overlayHashes=['sha256:0f5bd9a5c6234ca5ead0fb9c2952a31e936be186557ae3c9a539753936e7a1ac','sha256:4d893229587f1cd1fc87f8f3812b1ab89bf5076a5da801eeec0ba6f624877726'];
if(overlay.schemaId!=='xtend.rmt.command.v1'||overlay.variants.length!==2||JSON.stringify(overlay.variants.map(f=>f.hash).sort())!==JSON.stringify(overlayHashes))throw Error('Exact single-ID/two-hash command overlay required');
if(bindings.length!==24||new Set(bindings.map(b=>b.schemaId+'|'+b.expectedFingerprint+'|'+b.oldSource)).size!==24)throw Error('Exact 24 authority-source bindings required');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const equal=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
function expectedHashes(old){return [...new Set([...old.shapePolicy.acceptedFingerprints,...(old.schemaId===overlay.schemaId?overlayHashes:[])])].sort();}
function allowedShape(old,hash){return old.shapeFingerprints.find(f=>f.hash===hash)||(old.schemaId===overlay.schemaId?overlay.variants.find(f=>f.hash===hash):undefined);}
function checkOverlayOwner(scan,owner){const entry=scan.entries.find(e=>e.schemaId===overlay.schemaId);for(const f of entry?.shapeFingerprints||[]){if(!overlayHashes.includes(f.hash))continue;const expected=overlay.variants.find(v=>v.hash===f.hash);if(owner!=='demo'||f.authoritative!==false||!equal(f.shape,expected.shape)||!equal(f.sourcePaths,expected.sourcePaths)||!equal(f.symbols,expected.symbols)||!equal(f.evidence,expected.evidence))throw Error('Exact Demo generated command overlay source/shape binding required');}}
function assertSelection(selection){if(!equal(selection,ids)||ids.length!==101||new Set(ids).size!==101)throw Error('Exact reviewed 101-ID selection required');}
function executableClosure(){
 const files=new Set(),queue=['tools/schema-inventory/index.cjs'];
 while(queue.length){const relative=queue.shift();if(files.has(relative))continue;files.add(relative);const text=fs.readFileSync(path.join(packageRoot,relative),'utf8');
 for(const match of text.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)){const specifier=match[1];if(!specifier.startsWith('.')){if(!require('node:module').isBuiltin(specifier))throw Error('Unbound scanner executable dependency: '+specifier);continue;}
 const base=path.resolve(packageRoot,path.dirname(relative),specifier);if(!base.startsWith(packageRoot+path.sep))throw Error('Scanner helper escaped package');const resolved=[base,base+'.js',base+'.cjs',base+'.json'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!resolved)throw Error('Missing scanner helper: '+specifier);const target=path.relative(packageRoot,resolved);if(target.endsWith('.json'))files.add(target);else queue.push(target);}
 }return [...files].sort();
}
function verifiedPackage({manifest,directory,coreSha,demoSha,ownerRoot}){
 integrity.verifyCandidates(manifest,{directory,coreSha,demoSha});
 const expected=path.join(fs.realpathSync(ownerRoot),'node_modules','@ccslabs','xtend');
 if(fs.realpathSync(packageRoot)!==expected)throw Error('Public scanner must resolve from independent owner installation, never sibling/registry checkout');
 const item=manifest.packages.find(p=>p.name==='@ccslabs/xtend');if(!item||require('../../package.json').version!==item.version)throw Error('Scanner candidate identity mismatch');
 for(const relative of [...executableClosure(),'tools/schema-inventory/engine.cjs','tools/schema-inventory/index.cjs','tools/schema-inventory/ownership.cjs','tools/schema-inventory/selection.json','tools/schema-inventory/ownership-ledger.json.gz','tools/schema-inventory/authority-bindings.json','tools/schema-inventory/command-lexical-overlay.json','candidate-integrity.cjs',...bindings.map(b=>b.packagePath)]){
  const file=path.join(packageRoot,relative);if(!fs.realpathSync(file).startsWith(packageRoot+path.sep))throw Error('Package source escaped installation');
  const bytes=execFileSync('tar',['-xOf',path.join(directory,item.file),'package/'+relative],{maxBuffer:64*1024*1024});
  if(sha(bytes)!==sha(fs.readFileSync(file)))throw Error('Installed scanner/authority differs from verified candidate tarball: '+relative);
 }
 return item;
}
function importAuthorities(options){
 const item=verifiedPackage(options),records=[];
 for(const binding of bindings){const bytes=fs.readFileSync(path.join(packageRoot,binding.packagePath));if(sha(bytes)!==binding.sourceSha256)throw Error('Historical authority source changed');
 const importedSource='imports/core/'+options.coreSha+'/'+binding.oldSource,target=path.join(options.ownerRoot,importedSource);let parent=fs.realpathSync(options.ownerRoot);for(const part of importedSource.split('/').slice(0,-1)){parent=path.join(parent,part);if(fs.existsSync(parent)&&fs.lstatSync(parent).isSymbolicLink())throw Error('Authority import symlink rejected');fs.mkdirSync(parent,{recursive:true});}if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('Authority import symlink rejected');
 if(fs.existsSync(target)&&sha(fs.readFileSync(target))!==binding.sourceSha256)throw Error('Existing imported authority drift');fs.writeFileSync(target,bytes);
 records.push({...binding,importedSource,coreSha:options.coreSha,packageVersion:item.version,packageSha256:item.sha256});}
 return records;
}
function normalizeUsages(usages){
 if(!Array.isArray(usages))throw Error('Actual usage array required');
 return usages.map(u=>{if(!Array.isArray(u.sourcePaths)||!Array.isArray(u.interfaceReferences))throw Error('Actual sourcePaths/interfaceReferences usage structure required');return {...u,sourcePaths:u.sourcePaths.slice().sort(),interfaceReferences:u.interfaceReferences.map(r=>stable(r)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))};}).map(stable).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
function selectedGovernance(doc){
 const selected=r=>(r.schemaIds||[]).some(id=>ids.includes(id))||ids.includes(r.canonicalSchemaId);
 return {duplicateReviews:(doc.duplicateReviews||[]).filter(selected),consolidations:(doc.consolidations||[]).filter(selected)};
}
function verifySelectedGovernance(doc){
 const expected=selectedGovernance(ledger),actual=selectedGovernance(doc);
 for(const key of ['duplicateReviews','consolidations'])if(!equal(actual[key],expected[key]))throw Error('Selected historical '+key+' changed');return expected;
}
function validateOwner(scan,localInventory,owner){
 const entries=localInventory.entries;assertSelection(localInventory.selection||ids);
 if(localInventory.ledgerSha256&&localInventory.ledgerSha256!==sha(ledgerBytes()))throw Error('Historical ledger binding mismatch');
 checkOverlayOwner(scan,owner);
 const rows=[];
 for(const id of ids){const old=ledger.entries.find(e=>e.schemaId===id),actual=scan.entries.find(e=>e.schemaId===id),local=entries.find(e=>e.schemaId===id);
  if(!actual||!local)throw Error('Missing local observed ownership: '+id);
  if(!equal(normalizeUsages(local.usages),normalizeUsages(actual.usages)))throw Error('Local inventory usage/source binding differs from actual scan: '+id);
  if(!equal(local.canonicalDefinition,actual.canonicalDefinition))throw Error('Local canonical binding differs from actual scan: '+id);
  const hashes=actual.shapeFingerprints.map(f=>f.hash).sort();if(local.shapePolicy.mode!==(hashes.length>1?'polymorphic':hashes.length===1?'single':'unresolved'))throw Error('Local policy mode differs from actual cardinality: '+id);if(!equal(local.shapePolicy.acceptedFingerprints.slice().sort(),hashes))throw Error('Local accepted set differs from current owner observation: '+id);
  for(const key of ['aliasOf','replacedBy','releasedFingerprintSetHash','lifecycle'])if(!equal(local[key],old[key]))throw Error('Historical release/alias/lifecycle mutation: '+id);
  for(const key of ['decision','rationale','releasedFingerprintSetHash','authoritativeFingerprints'])if(!equal(local.shapePolicy[key],old.shapePolicy[key]))throw Error('Historical shape policy mutation: '+id);
  const authorities=actual.shapeFingerprints.filter(f=>f.authoritative).map(f=>f.hash).sort();if(!equal(authorities,(old.shapePolicy.authoritativeFingerprints||[]).slice().sort()))throw Error('Actual locally observed authority set mismatch: '+id);
  if(old.releasedFingerprintSetHash&&'sha256:'+sha(Buffer.from(JSON.stringify(authorities)))!==old.releasedFingerprintSetHash)throw Error('Actual authority does not preserve released fingerprint set: '+id);
  for(const f of actual.shapeFingerprints){const prior=allowedShape(old,f.hash);if(!prior||!equal(prior.shape,f.shape))throw Error('Unapproved current shape: '+id);}
  rows.push({schemaId:id,owner,hashes,authorities});
 }
 return rows;
}
function verifyUnion(coreScan,demoScan){
 const rows=[];for(const id of ids){const old=ledger.entries.find(e=>e.schemaId===id);const shapes=[...(coreScan.entries.find(e=>e.schemaId===id)?.shapeFingerprints||[]),...(demoScan.entries.find(e=>e.schemaId===id)?.shapeFingerprints||[])];const union=[...new Set(shapes.map(f=>f.hash))].sort();if(!equal(union,expectedHashes(old)))throw Error('101-ID accepted union mismatch: '+id);for(const f of shapes)if(!equal(f.shape,allowedShape(old,f.hash)?.shape))throw Error('Current normalized shape differs from historical accepted shape: '+id);rows.push({schemaId:id,hashes:union});}return rows;
}
function verifyPair({scanner,coreRoot,ownerRoot,localInventory,manifest,directory,coreSha,demoSha}){
 const options={manifest,directory,coreSha,demoSha,ownerRoot};const item=verifiedPackage(options);
 if(sha(fs.readFileSync(path.join(ownerRoot,overlay.sourcePath)))!==overlay.sourceSha256)throw Error('Exact regenerated command artifact digest required');
 const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 if(git(coreRoot,['rev-parse','HEAD'])!==coreSha||git(coreRoot,['status','--porcelain','--untracked-files=no'])||git(ownerRoot,['rev-parse','HEAD'])!==demoSha)throw Error('Exact clean source checkout required');
 const changed=git(ownerRoot,['diff','HEAD','--name-only']).split('\n').filter(Boolean);
 for(const file of changed){if(path.basename(file)!=='package-lock.json')throw Error('Owner source changed after exact checkout');const lock=JSON.parse(fs.readFileSync(path.join(ownerRoot,file)));integrity.verifyInstalledClosure(lock,manifest);}
 integrity.verifyInstalledClosure(JSON.parse(fs.readFileSync(path.join(ownerRoot,'package-lock.json'))),manifest);
 integrity.verifyResolution(require('node:module').createRequire(path.join(ownerRoot,'package.json')),manifest,path.join(ownerRoot,'node_modules'));
 for(const binding of bindings)if(sha(fs.readFileSync(path.join(coreRoot,binding.oldSource)))!==binding.sourceSha256)throw Error('Pinned current Core authority source differs from packaged source');
 const records=importAuthorities(options),coreScan=scanner.scanSchemaInventory({rootDir:coreRoot}),demoScan=scanner.scanSchemaInventory({rootDir:ownerRoot});
 for(const record of records){const f=demoScan.entries.find(e=>e.schemaId===record.schemaId)?.shapeFingerprints.find(f=>f.hash===record.expectedFingerprint);if(!f?.authoritative||!f.evidence.some(e=>e.path===record.importedSource&&e.authoritative&&e.completeness==='complete'))throw Error('Imported authority not actually observed');}
 const current=JSON.parse(fs.readFileSync(path.join(coreRoot,'tests/schemas/xtend-schema-inventory.json')));
 verifySelectedGovernance(current);verifySelectedGovernance(localInventory.governance);
 if(localInventory.governanceLedgerSha256!==sha(ledgerBytes()))throw Error('Demo historical governance ledger binding mismatch');
 for(const familyId of new Set(ids.map(id=>ledger.entries.find(e=>e.schemaId===id).familyId)))if(!equal(current.schemaFamilies.find(f=>f.familyId===familyId),ledger.schemaFamilies.find(f=>f.familyId===familyId)))throw Error('Selected historical family governance changed');
 const scoped=scanner.validateInventoryDocument(current,coreScan,{rootDir:coreRoot}).errors.filter(e=>ids.includes(e.schemaId)||(e.schemaIds||[]).some(id=>ids.includes(id))||ids.some(id=>ledger.entries.find(e=>e.schemaId===id).familyId===e.familyId));
 if(scoped.length)throw Error('Required production Core scanner rejects selected owner/family: '+JSON.stringify(scoped.slice(0,3)));
 const projected=JSON.parse(JSON.stringify(localInventory).replaceAll('imports/core/{CORE_SHA}/','imports/core/'+coreSha+'/'));
 const core=validateOwner(coreScan,current,'core'),demo=validateOwner(demoScan,projected,'demo'),union=verifyUnion(coreScan,demoScan);
 return {selection:ids,coreSha,demoSha,ledgerSha256:sha(ledgerBytes()),packageVersion:item.version,packageSha256:item.sha256,authorities:records,core,demo,union,selectionOk:true,migrationComplete:false,remainingOwnershipIds:23,generatedAt:new Date().toISOString()};
}
function verifyOwnershipEvidence(binding,{directory,coreSha,demoSha,manifest,startedAt,now=Date.now()}){
 if(!binding||!['schema-ownership-101.json','reports/schema-ownership-101.json'].includes(binding.file)||!binding.sha256)throw Error('Missing required ownership evidence');
 const bytes=fs.readFileSync(path.join(directory,binding.file));if(sha(bytes)!==binding.sha256)throw Error('Ownership evidence digest mismatch');
 const report=JSON.parse(bytes),item=manifest.packages.find(p=>p.name==='@ccslabs/xtend');
 if(!item||report.coreSha!==coreSha||report.demoSha!==demoSha||report.packageSha256!==item.sha256||report.packageVersion!==item.version||report.ledgerSha256!==sha(ledgerBytes())||report.selectionOk!==true||report.migrationComplete!==false||report.remainingOwnershipIds!==23)throw Error('Ownership evidence candidate identity/result mismatch');
 const time=Date.parse(report.generatedAt);if(!Number.isFinite(time)||startedAt&&time<Date.parse(startedAt)||time>now+1000||now-time>3600000)throw Error('Stale ownership evidence');
 assertSelection(report.selection);
 for(const owner of ['core','demo','union'])if(report[owner]?.length!==101||!equal(report[owner].map(r=>r.schemaId),ids))throw Error('Incomplete ownership evidence');
 for(const row of report.union)if(!equal(row.hashes,expectedHashes(ledger.entries.find(e=>e.schemaId===row.schemaId))))throw Error('Ownership evidence historical union mismatch');
 for(const id of ids){const a=report.core.find(r=>r.schemaId===id),b=report.demo.find(r=>r.schemaId===id);if(!equal([...new Set([...a.hashes,...b.hashes])].sort(),report.union.find(r=>r.schemaId===id).hashes))throw Error('Ownership report local/union mismatch');}
 const commandCore=report.core.find(r=>r.schemaId===overlay.schemaId);if(commandCore.hashes.some(h=>overlayHashes.includes(h)))throw Error('Command lexical overlay belongs only to Demo');
 if(report.authorities?.length!==24)throw Error('Missing ownership authority evidence');
 for(const b of bindings){const record=report.authorities.find(r=>r.schemaId===b.schemaId&&r.oldSource===b.oldSource&&r.expectedFingerprint===b.expectedFingerprint);if(!record||record.coreSha!==coreSha||record.packageSha256!==item.sha256||record.packageVersion!==item.version||record.sourceSha256!==b.sourceSha256||record.importedSource!=='imports/core/'+coreSha+'/'+b.oldSource)throw Error('Ownership authority evidence identity/digest mismatch');}
 return true;
}
module.exports={importAuthorities,verifyPair,validateOwner,verifyUnion,assertSelection,verifyOwnershipEvidence,normalizeUsages,verifySelectedGovernance};
