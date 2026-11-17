'use strict';
const ts=require('typescript'),fs=require('node:fs');
const files=['tests/types/xtensions_component_composition.mts','tests/types/xtensions_composition.mts','tests/types/xtensions_integrated_composition.mts','tests/types/xtensions_ssr.mts','tests/types/xtensions_scoped_components.mts'];
const p=ts.createProgram(files,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,noEmit:true,skipLibCheck:false,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']});
const diagnostics=ts.getPreEmitDiagnostics(p),out=ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'});
const log=`Node ${process.version}\nTypeScript ${ts.version}\nentryFixtures ${files.length}\nskipLibCheck false\ndiagnostics ${diagnostics.length}\n`+out;
process.stdout.write(log);process.exitCode=Number(!!diagnostics.length);
