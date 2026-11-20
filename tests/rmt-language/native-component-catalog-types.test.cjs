'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),ts=require('typescript');
test('Source8 generated tag contracts check literals and keep all older profile overloads closed',()=>{
 const input=path.join(__dirname,'native-component-catalog.types.ts'),tsx=path.join(__dirname,'native-component-catalog.authoring.tsx');
 const program=ts.createProgram([input,tsx],{strict:true,noEmit:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.Preserve,lib:['lib.es2022.d.ts','lib.dom.d.ts'],skipLibCheck:false,types:[]});
 const diagnostics=ts.getPreEmitDiagnostics(program);
 const output=ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:file=>file,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'});
 assert.equal(diagnostics.length,0,output);
});
