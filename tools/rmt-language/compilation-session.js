'use strict';
const {createHash}=require('node:crypto');
const path=require('node:path');
const {compileRmtVNextSource}=require('./vnext-compiler');
/** One build session shares compiler facts across Maraca and portable page output. */
function createRmtCompilationSession({root=process.cwd()}={}) {
  const results=new Map();let compilations=0,hits=0;
  return {
    compileSource(input,options={}) {
      options={documentId:path.relative(root,input.filePath || '.').replace(/\\/gu,'/'),...options};
      const key=createHash('sha256').update(path.resolve(input.filePath || '.')).update('\0').update(input.text).update('\0').update(JSON.stringify(options)).digest('hex');
      if(results.has(key)){hits++;return results.get(key);}
      const result=compileRmtVNextSource(input,options);results.set(key,result);compilations++;return result;
    },
    snapshot:()=>({compilations,hits,documents:results.size}),
    dispose(){results.clear();}
  };
}
module.exports={createRmtCompilationSession};
