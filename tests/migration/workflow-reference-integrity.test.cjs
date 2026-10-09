'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function checkWorkflow(source) {
 const jobs=source.split(/^jobs:\s*$/m)[1];if(!jobs)return [];
 const starts=[...jobs.matchAll(/^  ([a-zA-Z0-9_-]+):\s*$/gm)];const errors=[];
 for(let i=0;i<starts.length;i++) {
  const job=jobs.slice(starts[i].index,starts[i+1]?.index),name=starts[i][1];
  const ids=[...job.matchAll(/^\s+(?:-\s+)?id:\s*['"]?([a-zA-Z0-9_-]+)/gm)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)errors.push(name+': duplicate step ID');
  for(const match of job.matchAll(/\bsteps(?:\.([a-zA-Z0-9_-]+)|\[['"]([^'"]+)['"]\])/g))if(!ids.includes(match[1]||match[2]))errors.push(name+': undefined step '+(match[1]||match[2]));
 }
 return errors;
}
test('all Core workflow expressions and outputs reference existing steps in the same job',()=>{
 const root=path.resolve(__dirname,'../../.github/workflows');for(const file of fs.readdirSync(root).filter(f=>/\.ya?ml$/.test(f)))assert.deepEqual(checkWorkflow(fs.readFileSync(path.join(root,file),'utf8')),[],file);
});
test('deleted, cross-job and output step references are rejected; present guards remain checked',()=>{
 const fixture=`jobs:\n  core:\n    steps:\n      - id: install_1\n        run: npm ci\n      - if: \${{ steps.install_3.outcome == 'success' }}\n        run: npm test\n    outputs:\n      report: \${{ steps.other.outputs.report }}\n  demo:\n    steps:\n      - id: other\n        run: true\n`;
 assert.deepEqual(checkWorkflow(fixture),['core: undefined step install_3','core: undefined step other']);
 assert.deepEqual(checkWorkflow(fixture.replaceAll('steps.install_3','steps.install_1').replaceAll('steps.other','steps.install_1')),[]);
});
