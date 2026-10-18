const path=require('path');
const {spawnSync}=require('child_process');
const {createSuiteContext}=require('../utils/assertions');
function runIconDomSafetySuite(options={}){
 const rootDir=options.rootDir||path.resolve(__dirname,'../..');

 const context=createSuiteContext({id:'icon-dom-safety',label:'Native icon DOM safety'});
 const execution=spawnSync(process.execPath,['tests/components/icon_dom_runtime.mjs'],{cwd:rootDir,encoding:'utf8',timeout:30000});
 let result;
 try{result=JSON.parse(execution.stdout.trim().split('\n').at(-1));}
 catch{context.fail(`Icon DOM runtime failed: ${execution.error?.message||execution.stderr}`);return context.result({tag:'icon-dom-safety'});}
 for(const check of result.checks||[])context.assert(check.passed,check.name);
 for(const error of result.errors||[])context.fail(error);
 context.assert(execution.status===0 && result.status==='passed' && result.htmlWrites===0,'Native component fixture completes with HTML setters disabled');
 const audit=spawnSync(process.execPath,['tests/components/html_security_runtime.js'],{cwd:rootDir,encoding:'utf8',timeout:30000});
 try {const report=JSON.parse(audit.stdout.trim().split('\n').at(-1));for(const check of report.checks)context.assert(check.passed,check.name);context.assert(audit.status===0 && report.status==='passed','HTML security audit regression completes');}
 catch {context.fail('HTML security audit regression failed: '+audit.stderr);}

 return context.result({tag:'icon-dom-safety'});
}
module.exports={runIconDomSafetySuite};
