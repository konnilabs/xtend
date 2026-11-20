'use strict';
const path = require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const source = 'development/rmtx-a06/native-component-catalog/source.rmtx';
const root = path.resolve(__dirname, '../../..');
function providers() { return require('../orchestration-profile/reference.cjs').providers(); }
function catalog() { return require('../orchestration-profile/reference.cjs').catalog(); }
function createInput(outputDir) { return {source, out:path.resolve(outputDir), profile:'production', rmtxSyntaxVersion:'8.0.0', rmtxProviders:providers(), orchestration:'strict',kernel:'strict',hydration:'off',validation:'off',transitions:'off',pwa:false,services:false,lazy:false}; }
function compiler() { return require('../../../tools/rmt-language/rmtx-compiler').createRmtxCompiler({syntaxVersion:'8.0.0'}); }
function build(outputDir) { return require('../../../xtend-maraca').buildMaracaBundleAsync(createInput(outputDir),{rootDir:root,compileSource:compiler().compileSource}); }
function verifyCompileCases() {
 const text=fs.readFileSync(path.join(root,source),'utf8'),captured=catalog(),names=[];
 const reject=(name,input,options={})=>{const result=compiler().compileSource({text:input,filePath:source},{componentInterfaceCatalog:captured,...options});assert.equal(result.ok,false,name);assert.equal(result.orchestrationArtifacts,null,name);names.push(name);};
 reject('Source6 remains closed to Source8 controls and Surface repeats',text,{syntaxVersion:'6.0.0'});
 reject('Surface repeats require an explicit stable key',text.replace(' keyBy={item.id}',''));
 reject('Mount admission requires a Boolean guard',text.replace('when={model.ui.mount}','when={"yes"}'));
 reject('Native keys cannot name an absent repeat level',text.replace('keys={{productId:0}}','keys={{productId:1}}'));
 reject('Component tags must be in the captured shipped catalog',text.replace('tag="x-header"','tag="x-unknown"'));
 reject('Slots must be offered by the captured component',text.replace('name="actions"','name="unsafe"'));
 reject('Native components cannot acquire event-handler sinks',text.replace('tag="x-header"','tag="x-header" attributes={{onclick:"unsafe"}}'));
 reject('Props projections cannot execute source methods',text.replace('images:item.images','images:item.images.filter(Boolean)'));
 reject('Providers must be captured by the pinned interface catalog',text.replace('provider="react-product-gallery"','provider="unknown-gallery"'));
 reject('Repeated native views cannot duplicate DOM ids',text.replace("type:'button'","id:'duplicate',type:'button'"));
 return {passed:true,checks:names.length,names};
}
module.exports = {source,providers,catalog,createInput,compiler,build,verifyCompileCases};
