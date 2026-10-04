const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createWritePlan, applyWritePlan} = require('../../xtend-builder/writing/write-plan');
const {resolvePublicFile} = require('../../security/static-files.cjs');

test('symlinked ancestors, targets and ownership cannot read or write outside Scaffold root, including force', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'xtend-containment-'));
  const root = path.join(temp,'project'); const outside = path.join(temp,'project-backup');
  fs.mkdirSync(root); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside,'sentinel'),'unchanged');
  try {
    fs.symlinkSync(outside,path.join(root,'src'),'dir');
    let plan = createWritePlan([{path:'src/sentinel',content:'attacker',generated:true}], {rootDir:root,write:true,force:true});
    assert.equal(plan.ok,false); assert.equal(applyWritePlan(plan).ok,false);
    fs.unlinkSync(path.join(root,'src')); fs.mkdirSync(path.join(root,'src'));
    fs.symlinkSync(path.join(outside,'sentinel'),path.join(root,'src/file'));
    assert.equal(createWritePlan([{path:'src/file',content:'attacker'}],{rootDir:root,force:true}).ok,false);
    fs.mkdirSync(path.join(root,'.xtend-build'));
    fs.symlinkSync(path.join(outside,'sentinel'),path.join(root,'.xtend-build/scaffold-ownership.json'));
    assert.equal(createWritePlan([],{rootDir:root,write:true,force:true}).ok,false);
    assert.equal(fs.readFileSync(path.join(outside,'sentinel'),'utf8'),'unchanged');
    assert.equal(resolvePublicFile(root,'..%2fproject-backup/sentinel'),null);
    assert.equal(resolvePublicFile(root,'src/file'),null);
    assert.equal(resolvePublicFile(root,'src/'),null);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
test('apply revalidates a plan if an ancestor is replaced after planning', () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-plan-swap-')); const root=path.join(temp,'root'); const outside=path.join(temp,'outside');
  fs.mkdirSync(root);fs.mkdirSync(outside);fs.mkdirSync(path.join(root,'src'));
  try {
    const plan=createWritePlan([{path:'src/new',content:'blocked'}],{rootDir:root,write:true}); assert.equal(plan.ok,true);
    fs.rmdirSync(path.join(root,'src'));fs.symlinkSync(outside,path.join(root,'src'),'dir');
    assert.equal(applyWritePlan(plan).ok,false);assert.equal(fs.existsSync(path.join(outside,'new')),false);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
