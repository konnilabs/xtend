'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
function sourceFiles(){
 const files=new Set(require('../native-orchestration-profile/inspect.cjs').sourceFiles);
 for(const file of fs.readdirSync(__dirname))if(/\.(?:js|cjs|mjs|rmtx)$/.test(file))files.add('development/rmtx-a06/native-component-catalog/'+file);
 const sourceFile=/\.(?:[cm]?js|json|d\.ts)$/;
 for(const dir of ['tools/rmt-language','tools/xtensions','xtend-maraca'])for(const file of fs.readdirSync(path.join(root,dir)))if(sourceFile.test(file)&&fs.statSync(path.join(root,dir,file)).isFile())files.add(dir+'/'+file);
 function addTree(directory){for(const entry of fs.readdirSync(path.join(root,directory),{withFileTypes:true})){const file=directory+'/'+entry.name;if(entry.isDirectory())addTree(file);else if(entry.isFile()&&sourceFile.test(entry.name))files.add(file);}}
 for(const directory of ['tools/rmt-language/contracts','tools/rmt-language/rules','tools/rmt-language/generated','tools/rmt-language/vendor','tools/xtensions/url-state-contracts'])addTree(directory);
 for(const file of ['package.json','components/package.json','fabric/package.json','xtendrmt/kernel/rmt-kernel-sources.json','xtend-builder/generators/rmt-kernel-lab.js'])if(fs.existsSync(path.join(root,file)))files.add(file);
 const kernel=JSON.parse(fs.readFileSync(path.join(root,'xtendrmt/kernel/rmt-kernel-sources.json')));
 for(const module of [kernel.microkernel,...kernel.modules])for(const file of [module.sourcePath,module.typesPath])if(file&&fs.existsSync(path.join(root,file))){const relative=path.relative(root,path.resolve(root,file));if(relative.startsWith('..')||path.isAbsolute(relative))throw new TypeError('Kernel source escaped the captured repository');files.add(relative.split(path.sep).join('/'));}
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'tools/rmt-language/rmtx-native-components-v2.json')));
 for(const row of catalog.components.filter(row=>['x-header'].includes(row.tag))){files.add(row.module);files.add(row.managedModule);for(const dep of row.dependencies)files.add(dep.module);for(const module of [row.module,row.managedModule,...row.dependencies.map(dep=>dep.module)]){const declaration=module.replace(/\.[cm]?js$/,'.d.ts');if(fs.existsSync(path.join(root,declaration)))files.add(declaration);}}
 return [...files].sort();
}
module.exports={sourceFiles};
