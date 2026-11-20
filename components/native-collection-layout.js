/** Collection UI uses only explicit Renderer refs and typed keys. Author nodes remain Renderer-owned. */
import { getManagedContext, managedLocal, onManagedCleanup, requestManaged, emitManagedEvent, componentListen } from './native-managed.js';
const identity = (key) => {
  const safeString = typeof key === 'string' && key.length > 0 && key.trim() === key && !['__proto__','constructor','prototype'].includes(key);
  const safeNumber = typeof key === 'number' && Number.isSafeInteger(key) && key >= 0 && !Object.is(key,-0);
  if (!safeString && !safeNumber) throw new TypeError('Collection keys must use safe nonempty strings or nonnegative safe integers');
  return JSON.stringify([typeof key,key]);
};
export function validateCollectionItems(items) {
  if (!Array.isArray(items)) throw new TypeError('Collection items must be an array');
  const seen = new Set();
  return items.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(key => !['key','ref','title','disabled','collapsed','keys'].includes(key)) || typeof item.ref !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(item.ref)) throw new TypeError('Collection items require explicit local Renderer refs');
    const key = identity(item.key); if (seen.has(key)) throw new TypeError('Duplicate typed collection key'); seen.add(key);
    if (item.keys !== undefined && (!Array.isArray(item.keys) || item.keys.some(value => { identity(value); return false; }))) throw new TypeError('Item keys require a full typed tuple');
    if (item.title !== undefined && typeof item.title !== 'string' || item.disabled !== undefined && typeof item.disabled !== 'boolean' || item.collapsed !== undefined && typeof item.collapsed !== 'boolean') throw new TypeError('Invalid collection item DTO');
    return { ...item, ...(item.keys ? {keys:item.keys.slice()} : {}) };
  });
}
function keys(element, values, complete = false) {
  if (!Array.isArray(values)) throw new TypeError('Collection key projection must be an array');
  const known = new Set((element._nativeItems || []).map(item => identity(item.key))), seen = new Set();
  for (const value of values) { const id = identity(value); if (!known.has(id) || seen.has(id)) throw new TypeError('Collection projection references an unknown or duplicate typed key'); seen.add(id); }
  if (complete && seen.size !== known.size) throw new TypeError('Collection order must contain every typed item key');
  return values.slice();
}
function stateFor(element) { const state = managedLocal(element); return state.collection || (state.collection = { lease:null, signature:null, controls:null, dragged:null, preview:null }); }
function request(element, name, detail) {
  if (!emitManagedEvent(element,name,detail)) throw new TypeError(`Collection transition requires a validated RMT.On Action for ${name}`);
}
function orderedItems(element) {
  const items = element._nativeItems || [];
  const order = element._nativeOrder === undefined ? items.map(item => item.key) : keys(element,element._nativeOrder,true);
  return order.map(key => items.find(item => identity(item.key) === identity(key)));
}
function selection(element, items) {
  const selected = element._nativeSelectedKey === undefined ? items.find(item => !item.disabled)?.key ?? null : element._nativeSelectedKey;
  if (selected !== null && !items.some(item => identity(item.key) === identity(selected) && !item.disabled)) throw new TypeError('Selected tab key is absent or disabled');
  return selected;
}
function collapsed(element, items) { return element._nativeCollapsed === undefined ? items.filter(item => item.collapsed).map(item => item.key) : keys(element,element._nativeCollapsed); }
function bind(element, kind, items) {
  const state = stateFor(element), context = getManagedContext(element);
  const refs = items.map(item => ({key:item.key,ref:item.ref,keys:item.keys || context.keys,...(item.title === undefined ? {} : {title:item.title}),...(item.disabled === undefined ? {} : {disabled:item.disabled}),...(item.collapsed === undefined ? {} : {collapsed:item.collapsed})}));
  const signature = JSON.stringify([kind,refs]);
  if (state.signature !== signature) {
    state.lease?.release(); state.lease = null;
    if (items.length) {
      const lease = requestManaged(element,'layout.bind',{kind,items:refs});
      if (!lease || typeof lease.project !== 'function' || typeof lease.release !== 'function') throw new TypeError('A Renderer-owned collection presentation lease is required');
      state.lease = lease;
    }
    state.signature = signature;
  }
  return state.lease;
}
function button(element,label,part,handler) {
  const node=element.ownerDocument.createElement('button');node.type='button';node.textContent=label;node.setAttribute('part',part);node.addEventListener('click',handler);return node;
}
function renderTabs(element,items,lease) {
  const header=element.shadowRoot.querySelector('.tabs'), state=stateFor(element), root=element.shadowRoot;
  const fallback=root.querySelector('slot:not([name])');
  if (!state.tabNodes) state.tabNodes=new Map();
  if (!state.panels) { state.panels=element.ownerDocument.createElement('div');state.panels.setAttribute('part','panels');root.insertBefore(state.panels,fallback); }
  if (fallback) fallback.hidden=items.length>0;
  const selected=selection(element,items), focusKey=selected===null?items.find(item=>!item.disabled)?.key ?? null:selected, retained=new Set(items.map(item=>identity(item.key)));
  for(const [key,nodes] of state.tabNodes)if(!retained.has(key)){nodes.button.remove();nodes.panel.remove();state.tabNodes.delete(key);}
  // The actual Renderer validates and projects all owned originals before controls acquire links.
  lease?.project({kind:'tabs',items:items.map(item=>({key:item.key,ref:item.ref,keys:item.keys || getManagedContext(element).keys})),selectedKey:selected});
  element._tabs=items.map((item)=>{
    const key=identity(item.key);let nodes=state.tabNodes.get(key);
    if(!nodes){
      const control=button(element,'','tab control',()=>{const current=(element._nativeItems||[]).find(row=>identity(row.key)===key);if(current&&!current.disabled)request(element,'tab-selection-requested',{key:current.key});});
      const panel=element.ownerDocument.createElement('div'),slot=element.ownerDocument.createElement('slot');panel.setAttribute('part','panel');panel.append(slot);
      control.addEventListener('keydown',(event)=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
        event.preventDefault();const available=(element._nativeItems||[]).filter(candidate=>!candidate.disabled),current=available.findIndex(candidate=>identity(candidate.key)===key);
        const next=event.key==='Home'?available[0]:event.key==='End'?available.at(-1):available[(current+(/Left|Up/.test(event.key)?-1:1)+available.length)%available.length];
        if(next){request(element,'tab-selection-requested',{key:next.key});state.tabNodes.get(identity(next.key))?.button.focus();}
      });
      nodes={button:control,panel,slot};state.tabNodes.set(key,nodes);
    }
    const node=nodes.button;node.textContent=item.title || String(item.key);node.setAttribute('role','tab');node.disabled=!!item.disabled;
    node.tabIndex=key===identityNullable(focusKey)?0:-1;node.setAttribute('aria-selected',String(key===identityNullable(selected)));
    header.append(node);state.panels.append(nodes.panel);
    if(lease){if(typeof lease.linkControl!=='function')throw new TypeError('Renderer-owned tab accessibility links are required');lease.linkControl(item.key,node,nodes.panel,nodes.slot);}
    return node;
  });
  element._hasRenderedTabs=true;
}

function identityNullable(key) { return key===null?null:identity(key); }
function renderMasonry(element,items,lease) {
  const state=stateFor(element), root=element.shadowRoot, slot=root.querySelector('slot');
  slot.hidden=false;slot.style.display='contents';element._applyAttributes();
  if (!state.controls) { state.controls=element.ownerDocument.createElement('div');state.controls.setAttribute('part','collection-controls');state.controls.setAttribute('role','toolbar');state.controls.setAttribute('aria-label','Masonry layout');root.insertBefore(state.controls,element._container); }
  state.controls.replaceChildren();
  const collapsedKeys=collapsed(element,items), collapsedSet=new Set(collapsedKeys.map(identity));
  const emitOrder=(from,to)=>{const order=items.map(item=>item.key);const moved=order.splice(from,1)[0];order.splice(to,0,moved);request(element,'masonry-change-requested',{order,collapsed:collapsedKeys});};
  items.forEach((item,index)=>{
    const control=element.ownerDocument.createElement('span');control.setAttribute('part','item-controls');
    const toggle=button(element,item.title || String(item.key),'collapse control',()=>{const next=collapsedKeys.filter(key=>identity(key)!==identity(item.key));if(!collapsedSet.has(identity(item.key)))next.push(item.key);request(element,'masonry-change-requested',{order:items.map(entry=>entry.key),collapsed:next});});
    toggle.setAttribute('aria-expanded',String(!collapsedSet.has(identity(item.key))));toggle.disabled=!!item.disabled;
    const up=button(element,'↑','move-up control',()=>emitOrder(index,index-1));up.disabled=index===0 || !!item.disabled;up.setAttribute('aria-label',`Move ${item.title || item.key} up`);
    const down=button(element,'↓','move-down control',()=>emitOrder(index,index+1));down.disabled=index===items.length-1 || !!item.disabled;down.setAttribute('aria-label',`Move ${item.title || item.key} down`);
    control.append(toggle,up,down);control.draggable=!item.disabled;
    control.addEventListener('dragstart',(event)=>{state.dragged=item.key;state.preview=element.ownerDocument.createElement('div');state.preview.textContent=item.title || String(item.key);state.preview.inert=true;state.preview.setAttribute('aria-hidden','true');state.preview.setAttribute('part','drag-preview');root.append(state.preview);const rect=lease?.measure?.(item.ref,item.keys);if(rect){state.preview.style.width=`${rect.width}px`;state.preview.style.height=`${rect.height}px`;}event.dataTransfer?.setDragImage?.(state.preview,0,0);});
    control.addEventListener('dragover',(event)=>{if(state.dragged!==null)event.preventDefault();});
    control.addEventListener('drop',(event)=>{if(state.dragged===null)return;event.preventDefault();const from=items.findIndex(entry=>identity(entry.key)===identity(state.dragged));if(from>=0)emitOrder(from,index);state.dragged=null;state.preview?.remove();state.preview=null;});
    control.addEventListener('dragend',()=>{state.dragged=null;state.preview?.remove();state.preview=null;});
    state.controls.append(control);
  });
  lease?.project({kind:'masonry',items:items.map(item=>({key:item.key,ref:item.ref,keys:item.keys || getManagedContext(element).keys})),order:items.map(item=>item.key),collapsed:collapsedKeys});
}
export function projectNativeCollection(element,kind) {
  const context=getManagedContext(element);if(!context?.isActive())return;
  const items=orderedItems(element), lease=bind(element,kind,items);
  if(kind==='tabs')renderTabs(element,items,lease);else renderMasonry(element,items,lease);
}
export function prepareNativeCollection(element,kind) {
  const context = getManagedContext(element);
  if (context.registerProjectionValidator) context.onCleanup(context.registerProjectionValidator((next) => {
    const items = validateCollectionItems(next.properties.items || element._nativeItems || []), known = new Set(items.map(item => identity(item.key)));
    for (const field of ['order','collapsed']) if (next.properties[field] !== undefined) {
      const values = next.properties[field], ids = values.map(identity);
      if (new Set(ids).size !== ids.length || ids.some(id => !known.has(id)) || field === 'order' && ids.length !== items.length) throw new TypeError('Invalid atomic collection key projection');
    }
    if (next.properties.selectedKey != null && !known.has(identity(next.properties.selectedKey))) throw new TypeError('Unknown selected tab key');
  }));
  if (context.onProjection) context.onCleanup(context.onProjection(() => projectNativeCollection(element,kind)));
}
export function connectNativeCollection(element,kind) {
  projectNativeCollection(element,kind);
  const slot=element.shadowRoot.querySelector('slot:not([name])');if(slot)componentListen(element,slot,'slotchange',()=>projectNativeCollection(element,kind));
  onManagedCleanup(element,()=>{const state=stateFor(element);state.lease?.release();state.lease=null;state.signature=null;state.preview?.remove();state.preview=null;state.dragged=null;state.controls?.remove();state.controls=null;state.panels?.remove();state.panels=null;state.tabNodes?.clear();element._tabs=kind==='tabs'?[]:element._tabs;if(kind==='tabs'){const fallback=element.shadowRoot.querySelector('slot:not([name])');if(fallback)fallback.hidden=false;element.shadowRoot.querySelector('.tabs').replaceChildren();}});
}
export function setNativeCollectionItems(element,items,kind) {if(items===undefined&&getManagedContext(element)?.isApplyingUpdate()){element._nativeItems=[];return;}element._nativeItems=validateCollectionItems(items);if (!getManagedContext(element)?.isApplyingUpdate()) projectNativeCollection(element,kind);}
export function setNativeCollectionSelection(element,key) {if(key===undefined&&getManagedContext(element)?.isApplyingUpdate()){element._nativeSelectedKey=undefined;return;}if(key!==null)identity(key);element._nativeSelectedKey=key;if (!getManagedContext(element)?.isApplyingUpdate()) projectNativeCollection(element,'tabs');}
export function setNativeCollectionOrder(element,order) {if(order===undefined&&getManagedContext(element)?.isApplyingUpdate()){element._nativeOrder=undefined;return;}element._nativeOrder=getManagedContext(element)?.isApplyingUpdate()?order.slice():keys(element,order,true);if (!getManagedContext(element)?.isApplyingUpdate()) projectNativeCollection(element,'masonry');}
export function setNativeCollectionCollapsed(element,values) {if(values===undefined&&getManagedContext(element)?.isApplyingUpdate()){element._nativeCollapsed=undefined;return;}element._nativeCollapsed=getManagedContext(element)?.isApplyingUpdate()?values.slice():keys(element,values);if (!getManagedContext(element)?.isApplyingUpdate()) projectNativeCollection(element,'masonry');}
