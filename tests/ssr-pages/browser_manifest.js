'use strict';
async function createBrowserManifest() {
  const {createPortableRenderArtifact} = await import('../../xtendrmt/rmt-portable-render.js');
  const literal = value => ({op:'literal',value});
  const text = value => ({type:'text',text:value});
  const element = (tag,attributes={},children=[]) => ({type:'element',tag,attributes:Object.fromEntries(Object.entries(attributes).map(([key,value])=>[key,literal(value)])),children});
  const artifact = descriptor => createPortableRenderArtifact({descriptor},{inputs:['title','orders','name'],defaults:{title:'',orders:[],name:''}});
  const title = element('h1',{},[text('$model.title')]);
  const layout = element('section',{id:'persistent-layout'},[element('input',{id:'layout-input'}),{...element('div'),pageOutlet:true}]);
  return {
    schema:'xtend.page-manifest.v1',version:'browser-v1',assets:{entry:'/browser_entry.mjs'},
    layouts:{Application:{artifact:artifact(layout),head:[{tag:'meta',attributes:{name:'description',content:'Application'}}]}},
    pages:{
      Login:{artifact:artifact(element('section',{},[title]))},
      Orders:{layout:'Application',artifact:artifact(element('section',{},[title,{type:'repeat',source:'$model.orders',key:'id',template:{type:'element',tag:'a',attributes:{href:{op:'concat',values:[literal('/orders/'),'$item.id']},'data-order':'$item.id'},children:[text('$item.name')]}}]))},
      Detail:{layout:'Application',head:[{tag:'title',text:'Order detail'},{tag:'meta',attributes:{name:'description',content:'Detail'}}],artifact:artifact(element('section',{},[title,element('form',{method:'post',action:'/orders/1'},[element('input',{name:'name',value:'x'}),element('button',{type:'submit'},[text('Save')])])]))}
    }
  };
}
module.exports={createBrowserManifest};
