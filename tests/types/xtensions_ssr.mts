import { renderMaracaXTensionSSR, XTENSION_SSR_API_VERSION, type XTensionSSRClientOptions, type XTensionSSRServerOptions, type XTensionSSRSnapshot } from '@ccslabs/xtend/maraca/xtension-composition';
import { createReactSSRRuntimeAdapter, type SSRRuntimeHostOptions } from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import { createVueSSRRuntimeAdapter } from '@ccslabs/xtend/xtensions/vue-runtime-adapter';
import { createXTensionResumeStateRegistry, XTENSION_RESUME_STATE_BINDING_API_VERSION } from '@ccslabs/xtend/xtensions/state-binding';
import type { MaracaXTensionSSRBootOptions } from '@ccslabs/xtend/maraca/browser-composition-runtime';
const version: '1.0.0' = XTENSION_SSR_API_VERSION;
const bindingVersion: '3.0.0' = XTENSION_RESUME_STATE_BINDING_API_VERSION;
declare const hostOptions: SSRRuntimeHostOptions;
const host = createReactSSRRuntimeAdapter(hostOptions), vue = createVueSSRRuntimeAdapter(hostOptions);
const major: '7.0.0' = host.apiVersion;
const hostSchema: 'xtend.xtensions.runtime-host-controller.v7' = vue.schema;
const caps: 'xtend.xtensions.runtime-capabilities.v3' = host.getCapabilities().schema;
const actualHydration: boolean = host.getCapabilities().features['render.adoption'];
void host.adopt(hostOptions.container, {}); void host.getSSRReport();
declare const snapshot: XTensionSSRSnapshot;
const client: XTensionSSRClientOptions = { schema: 'xtend.maraca.xtension-ssr-options.v1', mode: 'client', snapshot, verify: async () => true, fallback: 'reject', intents: [] };
const server: XTensionSSRServerOptions = { schema: 'xtend.maraca.xtension-ssr-options.v1', mode: 'server', generation: 'request-1', sign: () => 'signature' };
// @ts-expect-error a client cannot grant its snapshot signing authority
const invalid: XTensionSSRClientOptions = { ...client, sign: () => 'signature' };
// @ts-expect-error server rendering cannot replay browser intents
const invalidServer: XTensionSSRServerOptions = { ...server, intents: [] };
declare const boot: MaracaXTensionSSRBootOptions;
const withResume: MaracaXTensionSSRBootOptions = { ...boot, xtensions: { ...boot.xtensions, ssr: client } };
declare const registryOptions: Parameters<typeof createXTensionResumeStateRegistry>[0];
const registry = createXTensionResumeStateRegistry(registryOptions);
const registryVersion: '3.0.0' = registry.apiVersion;
void [version, bindingVersion, major, hostSchema, caps, actualHydration, invalid, invalidServer, withResume, registryVersion, renderMaracaXTensionSSR];
