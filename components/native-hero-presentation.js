import {managedColor,managedImageURL,managedImageCSS} from './native-style-values.js';
import {managedLocal,onManagedCleanup} from './native-managed.js';
const colorAttributes=['background','background-light','background-dark','overlay-light','overlay-dark','font-color','font-color-light','font-color-dark'];
function projection(element,attributes) {
  const values={};
  for(const name of colorAttributes)if(attributes[name]!==undefined&&attributes[name]!==null&&attributes[name]!=='')values[name]=managedColor(element,attributes[name],name);
  const align=attributes.align||'center',vertical=attributes['vertical-align']||'center';
  if(!['left','center','right','start','end','justify','match-parent'].includes(align))throw new TypeError('Invalid managed Hero align');
  if(!['top','center','bottom'].includes(vertical))throw new TypeError('Invalid managed Hero vertical-align');
  const image=attributes['background-image']?managedImageURL(element,attributes['background-image']):null;
  return{values,align,vertical,image,themed:attributes['background-light']!==undefined&&attributes['background-light']!==null||attributes['background-dark']!==undefined&&attributes['background-dark']!==null};
}
function admit(element,context,values){
  if(!values.image||!context.isActive())return;
  const state=managedLocal(element),approved=state.resources||(state.resources=new Set()),key='hero:image:'+values.image;
  if(approved.has(key))return;
  const result=context.request('resource.image',{url:values.image,attribute:'background-image'});
  if(result===false)throw new TypeError('Managed Hero image was denied by its owner');
  if(result&&typeof result.then==='function')throw new TypeError('Hero image admission must complete before browser URL assignment');
  if(result&&typeof result.release==='function')onManagedCleanup(element,()=>result.release());
  approved.add(key);
}
export function prepareManagedHero(element,context){
  context.onCleanup(context.registerProjectionValidator(values=>{const checked=projection(element,values.attributes);admit(element,context,checked);}));
}
export function managedHeroPresentation(element,context){
  const attributes=Object.fromEntries([...colorAttributes,'background-image','align','vertical-align'].filter(name=>element.hasAttribute(name)).map(name=>[name,element.getAttribute(name)]));
  const checked=projection(element,attributes);admit(element,context,checked);return checked;
}
export function applyManagedHeroPresentation(element,checked){
  const hero=element.shadowRoot.querySelector('.hero');
  if(!checked.themed&&checked.values.background)hero.style.backgroundColor=checked.values.background;
  hero.classList.toggle('has-bgimg',!!checked.image);
  if(checked.image){hero.style.backgroundImage=managedImageCSS(checked.image);hero.style.backgroundSize='cover';hero.style.backgroundPosition='center';}
}
