import { JSDOM, VirtualConsole } from 'jsdom';
const faults=[],virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',error=>faults.push(error.message));
const dom=new JSDOM('<!doctype html><script id="xtend-page-data" nonce="iconSmokeNonce123"></script><body></body>',{url:'https://fixture.invalid/',pretendToBeVisual:true,virtualConsole});
const view=dom.window;
// jsdom has ElementInternals but does not implement native form-value submission.
// Native form behavior is exercised by the browser fixture instead.
view.ElementInternals.prototype.setFormValue ??= () => {};

for(const key of ['window','document','HTMLElement','customElements','CustomEvent','Event','DOMParser','MutationObserver','localStorage'])globalThis[key]=view[key];
let htmlWrites=0;
for(const prototype of [view.Element.prototype,view.ShadowRoot.prototype]){
 const descriptor=Object.getOwnPropertyDescriptor(prototype,'innerHTML');
 Object.defineProperty(prototype,'innerHTML',{...descriptor,set(){htmlWrites++;throw new Error('HTML sink is forbidden in the icon regression fixture');}});
}
try{
 await import('../../components/xbutton.js');await import('../../components/xspinner.js');
 for(const name of ['xtoggle','xsection','xtoast','xdialog','xalert'])await import('../../components/'+name+'.js');
 for(const tag of ['x-toggle','x-section','x-toast','x-dialog','x-alert'])await customElements.whenDefined(tag);
 const {runIconDomCases}=await import('./icon_dom_cases.mjs');
 const result=await runIconDomCases(document);
 result.htmlWrites=htmlWrites;result.errors.push(...faults);
 if(htmlWrites)result.errors.push('Unexpected HTML writes');
 result.status=result.errors.length?'failed':'passed';console.log(JSON.stringify(result));
 if(result.status!=='passed')process.exitCode=1;
}catch(error){console.log(JSON.stringify({status:'failed',errors:[error.stack,...faults],htmlWrites}));process.exitCode=1;}
finally{dom.window.close();}
