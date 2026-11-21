import { buildMaracaRmtxSSRBundleAsync, MARACA_RMTX_SSR_BUILD_API_VERSION } from '@ccslabs/xtend-maraca';
import { createMaracaRmtxSSRCompositionRoot } from '@ccslabs/xtend-maraca/browser-composition-runtime';
import type { BrowserManagedComponentRoot, RmtxSSRBootOptions } from '@ccslabs/xtend-maraca/browser-composition-runtime';
import { createMaracaRmtxSSRCompositionPort, createMaracaRmtxSSRHostFactory, createMaracaXTensionCompositionPort, RMTX_SSR_COMPOSITION_API_VERSION } from '@ccslabs/xtend-maraca/xtension-composition-runtime';
import type { RmtxSSRCompositionPortOptions, RmtxSSRHostCompositionOptions, ManagedComponentPort, ScopedComponentArtifact } from '@ccslabs/xtend-maraca/xtension-composition-runtime';
import { renderMaracaXTensionSSR, RMTX_XTENSION_SSR_API_VERSION } from '@ccslabs/xtend-maraca/xtension-composition';
import type { RmtxSSRSnapshot, RmtxSSRIntent, RmtxSSRSourceIdentity, RmtxSSRClientOptions, RmtxNodeSSROptions, ComponentSSRSnapshot } from '@ccslabs/xtend-maraca/xtension-composition';
import { createXTensionRMTXResumeStateRegistry, XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION } from '@ccslabs/xtend-compiler/xtensions/state-binding-resume';
import type { XTensionProjectionStateBinding } from '@ccslabs/xtend-compiler/xtensions/state-binding';
import type { SSRRuntimeHostController } from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import { createMaracaRmtxSSRNativeLifecycleRuntime, NATIVE_LIFECYCLE_SSR_RUNTIME_API_VERSION } from '@ccslabs/xtend-maraca/native-lifecycle-ssr-runtime';
import { createMaracaRmtxSSRNativeOrchestrationRuntime, NATIVE_ORCHESTRATION_SSR_RUNTIME_API_VERSION } from '@ccslabs/xtend-maraca/native-orchestration-ssr-runtime';
import { createMaracaRmtxSSRNativeManagedRuntime, NATIVE_MANAGED_SSR_RUNTIME_API_VERSION } from '@ccslabs/xtend-maraca/native-managed-ssr-runtime';
import * as legacyManagedRuntime from '@ccslabs/xtend-maraca/native-managed-runtime';

const builderVersion:'1.0.0'=MARACA_RMTX_SSR_BUILD_API_VERSION;
const compositionVersion:'1.0.0'=RMTX_SSR_COMPOSITION_API_VERSION;
const wireVersion:'3.0.0'=RMTX_XTENSION_SSR_API_VERSION;
const resumeVersion:'4.0.0'=XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION;
const nativeLifecycleVersion:'1.0.0'=NATIVE_LIFECYCLE_SSR_RUNTIME_API_VERSION;
const nativeOrchestrationVersion:'1.0.0'=NATIVE_ORCHESTRATION_SSR_RUNTIME_API_VERSION;
const nativeManagedVersion:'1.0.0'=NATIVE_MANAGED_SSR_RUNTIME_API_VERSION;
declare const nativeLifecycleOptions:Parameters<typeof createMaracaRmtxSSRNativeLifecycleRuntime>[0],nativeOrchestrationOptions:Parameters<typeof createMaracaRmtxSSRNativeOrchestrationRuntime>[0],nativeManagedOptions:Parameters<typeof createMaracaRmtxSSRNativeManagedRuntime>[0];
const native6Schema:'xtend.maraca.plan-runtime.v18'=createMaracaRmtxSSRNativeLifecycleRuntime(nativeLifecycleOptions).snapshot().schema;
const native7Schema:'xtend.maraca.plan-runtime.v18'=createMaracaRmtxSSRNativeOrchestrationRuntime(nativeOrchestrationOptions).snapshot().schema;
const native8Schema:'xtend.maraca.plan-runtime.v18'=createMaracaRmtxSSRNativeManagedRuntime(nativeManagedOptions).snapshot().schema;
// @ts-expect-error The retained CSR module does not grow the new SSR entrypoint.
void legacyManagedRuntime.createMaracaRmtxSSRNativeManagedRuntime;
const built=await buildMaracaRmtxSSRBundleAsync({schema:'xtend.maraca.rmtx-ssr-build-options.v1',input:{source:'app.rmtx',rmtxSyntaxVersion:'8.0.0',profile:'production',lazy:'none',orchestration:'strict',kernel:'strict'}});
const resultSchema:'xtend.maraca.rmtx-ssr-build-result.v1'=built.schema;
// @ts-expect-error The legacy inner input is not the versioned SSR build request.
void buildMaracaRmtxSSRBundleAsync({source:'app.rmtx'});
// @ts-expect-error Unknown Source versions cannot acquire the new target.
void buildMaracaRmtxSSRBundleAsync({schema:'xtend.maraca.rmtx-ssr-build-options.v1',input:{rmtxSyntaxVersion:'9.0.0'}});

declare const sourceIdentity:RmtxSSRSourceIdentity,snapshot:RmtxSSRSnapshot,oldSnapshot:ComponentSSRSnapshot;
declare const boot:RmtxSSRBootOptions,oldRoot:BrowserManagedComponentRoot;
const root=createMaracaRmtxSSRCompositionRoot({schema:'xtend.maraca.rmtx-ssr-browser-root.v1',configuration:{},sourceIdentity},{});
const client:RmtxSSRClientOptions={schema:'xtend.maraca.xtension-ssr-options.v3',mode:'client',snapshot,verify:()=>true};
void root.boot({...boot,xtensions:{...boot.xtensions,ssr:client}});
const runtimeSchema:'xtend.maraca.plan-runtime.v18'=root.facade.snapshot().schema;
const nativeOnly=createMaracaRmtxSSRCompositionRoot({schema:'xtend.maraca.rmtx-ssr-browser-root.v1',sourceIdentity,configuration:{schema:'xtend.maraca.browser-composition-root.v14',buildPlanSchema:'xtend.maraca.build-plan.v12'}},{});
void nativeOnly.boot({fabric:boot.fabric,xtensions:{grants:{},ssr:client}});
// @ts-expect-error Native-only roots have no framework peer-loading strategy.
void nativeOnly.boot({fabric:boot.fabric,xtensions:{grants:{},ssr:client,loadPeerGroup:()=>({})}});
// @ts-expect-error Native-only target selection cannot grant a provider host.
void nativeOnly.boot({fabric:boot.fabric,xtensions:{grants:{undeclared:{}},ssr:client}});
// @ts-expect-error A legacy CSR root cannot accept the new SSR options.
void oldRoot.boot(boot);
// @ts-expect-error Old signed data is not a v3 source/project handoff.
const invalidSnapshot:RmtxSSRSnapshot=oldSnapshot;
// @ts-expect-error V3 snapshot data cannot be interpreted using old v2 fields.
const oldData:ComponentSSRSnapshot=snapshot;
// @ts-expect-error New browser options retain the exclusive peer-loader union.
const missingLoader:RmtxSSRBootOptions={fabric:boot.fabric,xtensions:{grants:{},ssr:client}};
// @ts-expect-error Exactly one peer-loader strategy is allowed.
const twoLoaders:RmtxSSRBootOptions={fabric:boot.fabric,xtensions:{grants:{},ssr:client,loadPeers:()=>({}),loadPeerGroup:()=>({})}};

type ManagedSSRPortOptions=Extract<RmtxSSRCompositionPortOptions,{readonly plan:{readonly xtensionComposition:{readonly schema:'xtend.maraca.xtension-composition-artifact.v13'}}}>;
declare const portOptions:ManagedSSRPortOptions,hostOptions:RmtxSSRHostCompositionOptions,oldArtifact:ScopedComponentArtifact;
const port=createMaracaRmtxSSRCompositionPort(portOptions);
const portSchema:'xtend.maraca.xtension-composition-port.v11'=port.schema;
const newSession:'xtend.maraca.xtension-ssr-session.v3'=port.ssrSession.schema;
const host=createMaracaRmtxSSRHostFactory(hostOptions);
declare const hostContext:Parameters<typeof host>[0];
const hostApi:'7.0.0'=host(hostContext).apiVersion;
// @ts-expect-error Port11 is not a legacy CSR10 capability.
const legacyPort:ManagedComponentPort=port;
// @ts-expect-error The old entrypoint cannot accept a v3 session.
void createMaracaXTensionCompositionPort(portOptions);
// @ts-expect-error Scoped v8 data cannot be substituted into a Source8 v13 plan.
void createMaracaRmtxSSRCompositionPort({...portOptions,plan:{...portOptions.plan,xtensionComposition:oldArtifact}});
// @ts-expect-error API3 is not the new projection/resume API4.
void createMaracaRmtxSSRCompositionPort({...portOptions,resumeBindingsRuntime:{...portOptions.resumeBindingsRuntime,XTENSION_RMTX_RESUME_STATE_BINDING_API_VERSION:'3.0.0'}});
declare const managedHost:Extract<RmtxSSRHostCompositionOptions,{readonly artifact:{readonly schema:'xtend.maraca.xtension-composition-artifact.v13'}}>;
const {resolveHostBinding:ignoredResolver,...missingResolver}=managedHost;
// @ts-expect-error Modern keyed SSR hosts require the real materialization resolver.
void createMaracaRmtxSSRHostFactory(missingResolver);

declare const registryOptions:Parameters<typeof createXTensionRMTXResumeStateRegistry>[0],projection:XTensionProjectionStateBinding,createHost:(context:Parameters<ReturnType<typeof createXTensionRMTXResumeStateRegistry>['bind']>[1] extends (value:infer T)=>unknown ? T : never)=>SSRRuntimeHostController;
const registry=createXTensionRMTXResumeStateRegistry(registryOptions);
const registryVersion:'4.0.0'=registry.apiVersion;
void registry.bind(projection,createHost).adopt(document.createElement('div'));
const intent:RmtxSSRIntent={schema:'xtend.maraca.xtension-ssr-intent.v3',id:'intent',generation:'request',address:{documentId:'app',declarationId:'host',keys:[1,'1']},event:'select',payload:{id:'image'},payloadOrigin:'provider'};
// @ts-expect-error Replay requires provider payload provenance.
const invalidIntent:RmtxSSRIntent={schema:'xtend.maraca.xtension-ssr-intent.v3',id:'intent',generation:'request',address:{documentId:'app',declarationId:'host',keys:[]},event:'select',payload:{id:'image'}};
if(built.build){
  const serverPeers:NonNullable<RmtxNodeSSROptions['xtensions']>={grants:boot.xtensions.grants,loadPeerGroup:()=>({})};
  const response=await renderMaracaXTensionSSR({schema:'xtend.maraca.xtension-ssr-render-options.v3',build:built.build,documentTarget:document,root:document.createElement('main'),fabric:boot.fabric,xtensions:serverPeers,generation:'request',sign:()=>''});
  const schema:'xtend.maraca.xtension-ssr-response.v3'=response.schema;
  void schema;
}
void [builderVersion,compositionVersion,wireVersion,resumeVersion,nativeLifecycleVersion,nativeOrchestrationVersion,nativeManagedVersion,native6Schema,native7Schema,native8Schema,resultSchema,runtimeSchema,invalidSnapshot,oldData,missingLoader,twoLoaders,portSchema,newSession,hostApi,legacyPort,registryVersion,intent,invalidIntent];
