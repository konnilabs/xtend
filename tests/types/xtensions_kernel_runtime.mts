import {createReactKernelRuntimeAdapter, type KernelComponentCapabilities} from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import {createVueKernelRuntimeAdapter} from '@ccslabs/xtend/xtensions/vue-runtime-adapter';
import {createRmtKernelScheduler} from '../../xtendrmt/rmt-kernel-scheduler.js';
import {createXtendFabric} from '../../fabric/xtend-fabric.js';
import {createXTensionStateRegistry} from '@ccslabs/xtend/xtensions/state-binding';
import {createMaracaPlanRuntime} from '@ccslabs/xtend-maraca/plan-runtime';
const scheduler=createRmtKernelScheduler(),fabric=createXtendFabric();
const config={container:document.body,component:{},fabric,kernelWork:{scheduler,rootId:'app',scope:'item-1',work:{scan:{lane:'background' as const,maxChunkMs:4}}}};
const react=createReactKernelRuntimeAdapter(config),vue=createVueKernelRuntimeAdapter(config);
const schema:'xtend.xtensions.runtime-host-controller.v3'=react.schema;const api:'3.0.0'=vue.apiVersion;
const runtime=createMaracaPlanRuntime({root:document.body,plan:{},createXTensionHost:()=>react});
const registry=createXTensionStateRegistry({modelReader:runtime.model as any,commandDispatcher:{dispatch:()=>Promise.resolve()}});
registry.bind({schema:'xtend.xtensions.state-binding.v2',address:{documentId:'d',declarationId:'p',keys:[]},props:{},intents:{}},()=>react);
declare const capabilities:KernelComponentCapabilities;
const work=capabilities.work.schedule('scan',async context=>{context.guard(()=>true)();if(context.shouldYield())await context.yield();return 42;});
const result:Promise<number>=work.result;
// @ts-expect-error Kernel delivery requires the Fabric port.
createReactKernelRuntimeAdapter({...config,fabric:undefined});
// @ts-expect-error Kernel delivery requires the scheduler and scoped configuration.
createVueKernelRuntimeAdapter({container:document.body,component:{},fabric});
// @ts-expect-error Components cannot supply lane, priority, root or scope.
capabilities.work.schedule('scan',()=>1,{lane:'user-blocking'});
void schema;void api;void result;void react.getCapabilities();void vue.snapshot().kernelWork;
