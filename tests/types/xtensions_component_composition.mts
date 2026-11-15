import {createMaracaXTensionCompositionPort} from '../../xtend-maraca/xtension-composition-runtime.js';
import type { ComponentXTensionCompositionManifest,ComponentXTensionCompositionArtifact,MaracaComponentXTensionCompositionPort } from '../../xtend-maraca/xtension-composition-runtime.js';
import {buildMaracaXTensionComposition,XTENSION_COMPOSITION_BUILD_API_VERSION} from '../../xtend-maraca/xtension-composition.js';
import {createMaracaBrowserCompositionRoot} from '@ccslabs/xtend-maraca/browser-composition-runtime';
import {createMaracaPlanRuntime} from '@ccslabs/xtend-maraca/plan-runtime';
import {createMaracaSizeBudgetReport} from '../../xtend-maraca/index.js';
import type { MaracaComponentBuildPlan } from '../../xtend-maraca/index.js';
import * as interfaces from '../../tools/xtensions/component-interface.js';
declare const manifest:ComponentXTensionCompositionManifest,plan:MaracaComponentBuildPlan,bindingsRuntime:import('../../xtend-maraca/xtension-composition-runtime.js').XTensionCompositionBindingRuntime;
const version:'12.0.0'=XTENSION_COMPOSITION_BUILD_API_VERSION;
const result=await buildMaracaXTensionComposition({plan,manifest,bindingsRuntime,rootDir:'/project',outputDir:'/build'});
const artifact:ComponentXTensionCompositionArtifact=result.artifact;
const app=createMaracaBrowserCompositionRoot({schema:'xtend.maraca.browser-composition-root.v8',buildPlanSchema:'xtend.maraca.build-plan.v6',xtensionComposition:artifact});
const browserVersion:'8.0.0'=app.apiVersion;
const snapshot:'xtend.maraca.plan-runtime.v10'=app.facade.snapshot().schema;
declare const port:MaracaComponentXTensionCompositionPort;
const runtime=createMaracaPlanRuntime({root:document.createElement('main'),plan:{schema:'xtend.maraca.build-plan.v6',xtensionComposition:artifact},xtensionCompositionPort:port});
const runtimeVersion:'xtend.maraca.plan-runtime.v10'=runtime.schema;
// @ts-expect-error Legacy delivery manifest does not allow a distinct render target.
const legacyHost:import('../../xtend-maraca/xtension-composition-runtime.js').DeliveryXTensionCompositionManifest['hosts'][number]={declarationId:'gallery',providerId:'react-gallery',ownerSurface:'owner',targetSurface:'gallery',capabilityRequirements:{schema:'xtend.xtensions.host-capability-requirements.v1',required:{}}};
void [version,browserVersion,snapshot,runtimeVersion,legacyHost,interfaces];

createMaracaSizeBudgetReport({plan,entryPath:"/build/app.mjs",entryBytes:1,bundleFiles:[]});

declare const adapters: import('../../xtend-maraca/xtension-composition-runtime.js').XTensionHostCompositionOptions['adapters'];
declare const grants: import('../../xtend-maraca/xtension-composition-runtime.js').XTensionHostCompositionOptions['grants'];
declare const companion: {artifact: ComponentXTensionCompositionArtifact; createHostFactory(ports: unknown): (context: import('../../xtend-maraca/xtension-composition-runtime.js').ComponentXTensionHostContext) => import('../../tools/xtensions/state-binding.js').NegotiatedRuntimeHostController};
createMaracaXTensionCompositionPort({plan:{...plan,xtensionComposition:artifact},companion,bindingsRuntime,componentInterfaceRuntime:interfaces,adapters,grants,loadPeerGroup:()=>Promise.resolve({})});
