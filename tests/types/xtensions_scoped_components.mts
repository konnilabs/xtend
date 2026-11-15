import {createMaracaBuildPlan,buildMaracaBundleAsync} from '@ccslabs/xtend-maraca';
import type {MaracaScopedComponentBuildInput} from '@ccslabs/xtend-maraca';
import {buildMaracaXTensionComposition} from '@ccslabs/xtend-maraca/xtension-composition';
import {createMaracaBrowserCompositionRoot} from '@ccslabs/xtend-maraca/browser-composition-runtime';
import type {ComponentSSRSnapshot,ComponentSSRIntent,XTensionSSRSnapshot} from '../../xtend-maraca/xtension-ssr.js';
declare const input:MaracaScopedComponentBuildInput,bindingsRuntime:import('../../xtend-maraca/xtension-composition-runtime.js').XTensionCompositionBindingRuntime;
const plan=createMaracaBuildPlan(input);const planVersion:'xtend.maraca.build-plan.v7'=plan.schema;
const output=await buildMaracaXTensionComposition({plan,manifest:input.xtensionComposition,bindingsRuntime,rootDir:'/app',outputDir:'/out'});
const app=createMaracaBrowserCompositionRoot({schema:'xtend.maraca.browser-composition-root.v9',buildPlanSchema:'xtend.maraca.build-plan.v7',xtensionComposition:output.artifact});
const version:'9.0.0'=app.apiVersion;
declare const snapshot:ComponentSSRSnapshot;
// @ts-expect-error Old snapshot data cannot be interpreted as a component snapshot v2.
const invalid:ComponentSSRSnapshot={} as XTensionSSRSnapshot;
const intent:ComponentSSRIntent={schema:'xtend.maraca.xtension-ssr-intent.v2',id:'id',generation:'g',address:{documentId:'d',declarationId:'x',keys:['g',1]},event:'changeSort',payload:{order:'rating'},payloadOrigin:'provider'};
// @ts-expect-error SSR v2 requires explicit provider payload provenance.
const oldIntent:ComponentSSRIntent={schema:'xtend.maraca.xtension-ssr-intent.v2',id:'id',generation:'g',address:{documentId:'d',declarationId:'x',keys:[]},event:'changeSort',payload:{sort:'rating'}};
void [planVersion,version,snapshot,invalid,intent,oldIntent,buildMaracaBundleAsync];

import {renderMaracaXTensionSSR} from '../../xtend-maraca/xtension-ssr.js';
declare const documentTarget:Document,root:HTMLElement,fabric:import('../../xtend-maraca/browser-composition-runtime.js').MaracaXTensionBootOptions['fabric'],xtensions:import('../../xtend-maraca/browser-composition-runtime.js').MaracaXTensionBootOptions['xtensions'];
const built=await buildMaracaBundleAsync(input);
const rendered=await renderMaracaXTensionSSR({build:built,documentTarget,root,fabric,xtensions,generation:'test',sign:()=>''});
const ssrVersion:'xtend.maraca.xtension-ssr-response.v2'=rendered.schema;
void ssrVersion;
