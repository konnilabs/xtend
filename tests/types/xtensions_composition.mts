import { buildMaracaXTensionComposition, XTENSION_COMPOSITION_BUILD_API_VERSION, type XTensionCompositionManifest } from '@ccslabs/xtend/maraca/xtension-composition';
import { createMaracaXTensionHostFactory, XTENSION_COMPOSITION_API_VERSION, type XTensionHostCompositionOptions } from '@ccslabs/xtend/maraca/xtension-composition-runtime';
import * as bindingRuntime from '@ccslabs/xtend-compiler/xtensions/state-binding';
import * as react from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
import * as vue from '@ccslabs/xtend-compiler/xtensions/vue-runtime-adapter';
import { createMaracaBuildPlan } from '@ccslabs/xtend-maraca';
import type { MaracaPlanRuntimeOptions } from '@ccslabs/xtend/maraca/plan-runtime';
const buildVersion: '10.0.0' = XTENSION_COMPOSITION_BUILD_API_VERSION;
const runtimeVersion: '7.0.0' = XTENSION_COMPOSITION_API_VERSION;
const manifest: XTensionCompositionManifest = { schema: 'xtend.maraca.xtension-composition-manifest.v1',
  providers: [{ id: 'panel', framework: 'react', version: '1.0.0', entry: { module: './panel.mjs', exportName: 'createPanel' }, integrity: { sha256: '0'.repeat(64) }, peers: { react: '18.3.1', 'react-dom': '18.3.1' } }],
  hosts: [{ declarationId: 'panel', providerId: 'panel', ownerSurface: 'panel', capabilityRequirements: { schema: 'xtend.xtensions.host-capability-requirements.v1', required: { features: ['surface.lifecycle'] } } }] };
const plan = createMaracaBuildPlan('app.rmt');
const report = await buildMaracaXTensionComposition({ plan, manifest, bindingsRuntime: bindingRuntime, rootDir: '.', outputDir: 'dist' });
const noExecutionClaim: false = report.runtimeExecutionVerified;
declare const shared: Pick<XTensionHostCompositionOptions, 'fabric' | 'kernelWork' | 'resourceGraph'>;
const factory = createMaracaXTensionHostFactory({ ...shared, artifact: report.artifact, plan, bindingsRuntime: bindingRuntime,
  providers: { panel: { createPanel: (_peers: unknown) => ({}) } }, adapters: { react, vue }, loadPeers: async ({ signal, provider }) => { signal.throwIfAborted(); return { version: provider.version }; },
  grants: { panel: { work: { scan: { lane: 'background', maxChunkMs: 4 } }, allowedResources: ['timer'] } } });
declare const context: Parameters<NonNullable<MaracaPlanRuntimeOptions['createXTensionHost']>>[0];
const host = factory(context);
const actualHostMajor: '6.0.0' = host.apiVersion;
// @ts-expect-error Providers cannot grant scopes through the declaration manifest.
manifest.hosts[0].scope = 'untrusted';
// @ts-expect-error Legacy manifests are a separate static-report contract.
const legacy: XTensionCompositionManifest = { schema: 'xtend.maraca.xtension-manifest.v1' };
void [buildVersion, runtimeVersion, noExecutionClaim, actualHostMajor, legacy];
