import { createMaracaBuildPlan, buildMaracaBundleAsync, MARACA_XTENSION_BUILD_PLAN_SCHEMA, MARACA_XTENSION_BUILD_CONFIG_SCHEMA, MARACA_XTENSION_SIZE_BUDGET_REPORT_SCHEMA, type MaracaComposedBuildConfig } from '@ccslabs/xtend-maraca';
import { buildMaracaXTensionComposition } from '@ccslabs/xtend/maraca/xtension-composition';
import { createMaracaXTensionCompositionPort, type XTensionCompositionManifest, type XTensionHostCompositionOptions } from '@ccslabs/xtend/maraca/xtension-composition-runtime';
import { createMaracaBrowserCompositionRoot, MARACA_XTENSION_BROWSER_API_VERSION, type MaracaXTensionBootOptions } from '@ccslabs/xtend/maraca/browser-composition-runtime';
import { createMaracaPlanRuntime, XTENSION_PLAN_RUNTIME_SCHEMA, type ComposedMaracaPlanRuntimeOptions } from '@ccslabs/xtend/maraca/plan-runtime';
import * as bindingsRuntime from '@ccslabs/xtend-compiler/xtensions/state-binding';
import * as react from '@ccslabs/xtend-compiler/xtensions/react-runtime-adapter';
declare const manifest: XTensionCompositionManifest;
const config: Pick<MaracaComposedBuildConfig, 'schema' | 'source' | 'options'> = { schema: MARACA_XTENSION_BUILD_CONFIG_SCHEMA, source: 'app.rmt', options: { xtensionComposition: manifest } };
const plan = createMaracaBuildPlan({ source: config.source, xtensionComposition: manifest });
const planMajor: typeof MARACA_XTENSION_BUILD_PLAN_SCHEMA = plan.schema;
const build = await buildMaracaBundleAsync({ source: 'app.rmt', xtensionComposition: manifest });
const builtPlanMajor: typeof planMajor = build.plan.schema;
const report = await buildMaracaXTensionComposition({ plan, manifest, bindingsRuntime, rootDir: '.', outputDir: 'dist' });
const reportMajor: 'xtend.maraca.xtension-composition-build-report.v2' = report.schema;
const artifactMajor: '2.0.0' = report.artifact.apiVersion;
declare const companion: Parameters<typeof createMaracaXTensionCompositionPort>[0]['companion'];
declare const ports: Pick<XTensionHostCompositionOptions, 'fabric' | 'kernelWork' | 'resourceGraph'>;
const runtimePlan = { ...plan, xtensionComposition: report.artifact };
const port = createMaracaXTensionCompositionPort({ plan: runtimePlan, companion, bindingsRuntime, adapters: { react }, loadPeers: async () => ({}), grants: {} });
const portMajor: 'xtend.maraca.xtension-composition-port.v1' = port.schema;
declare const runtimeOptions: Omit<ComposedMaracaPlanRuntimeOptions, 'plan' | 'xtensionCompositionPort'>;
const runtime = createMaracaPlanRuntime({ ...runtimeOptions, plan: runtimePlan, xtensionCompositionPort: port });
const runtimeMajor: typeof XTENSION_PLAN_RUNTIME_SCHEMA = runtime.snapshot().schema;
const app = createMaracaBrowserCompositionRoot({ schema: 'xtend.maraca.browser-composition-root.v6', buildPlanSchema: plan.schema, xtensionComposition: report.artifact });
const appMajor: typeof MARACA_XTENSION_BROWSER_API_VERSION = app.apiVersion;
await app.boot({ fabric: ports.fabric, xtensions: { loadPeers: async () => ({}), grants: {} } });
const snapshotMajor: typeof runtimeMajor = app.facade.snapshot().schema;
// @ts-expect-error Automatic composition requires an explicit Fabric and peer/grant policy.
app.boot({});
// @ts-expect-error Manual factories cannot bypass the automatic composition contract.
const bypass: MaracaXTensionBootOptions = { fabric: ports.fabric, xtensions: { loadPeers() {}, grants: {} }, createXTensionHost() {} };
const legacy: 'xtend.maraca.build-plan.v4' = createMaracaBuildPlan('legacy.rmt').schema;
void [planMajor, builtPlanMajor, reportMajor, artifactMajor, portMajor, runtimeMajor, appMajor, snapshotMajor, bypass, legacy];

import { createMaracaPlanRuntime as standalonePlanRuntime } from '@ccslabs/xtend-maraca/plan-runtime';
import { createMaracaBrowserCompositionRoot as standaloneBrowserRoot } from '@ccslabs/xtend-maraca/browser-composition-runtime';
const samePlanRuntime: typeof createMaracaPlanRuntime = standalonePlanRuntime;
const sameBrowserRoot: typeof createMaracaBrowserCompositionRoot = standaloneBrowserRoot;
void [samePlanRuntime, sameBrowserRoot];

const sizeBudgetMajor: typeof MARACA_XTENSION_SIZE_BUDGET_REPORT_SCHEMA | undefined = build.sizeBudgetReport?.schema;
const ownRuntimeBytes: number | undefined = build.sizeBudgetReport?.xtensions.runtimeBytes;
void [sizeBudgetMajor, ownRuntimeBytes];

import type { GraphXTensionCompositionManifest } from '@ccslabs/xtend/maraca/xtension-composition-runtime';
declare const graphManifest: GraphXTensionCompositionManifest;
const graphPlan = createMaracaBuildPlan({ source: 'app.rmt', xtensionComposition: graphManifest });
const graphReport = await buildMaracaXTensionComposition({ plan: graphPlan, manifest: graphManifest, bindingsRuntime, rootDir: '.', outputDir: 'dist' });
const graphMajor: 'xtend.maraca.xtension-composition-build-report.v3' = graphReport.schema;
const graphApi: '3.0.0' = graphReport.artifact.apiVersion;
const graphRuntimePlan = { ...graphPlan, xtensionComposition: graphReport.artifact };
const graphPort = createMaracaXTensionCompositionPort({ plan: graphRuntimePlan, companion: { artifact: graphReport.artifact, createHostFactory() { return () => ({} as any); } }, bindingsRuntime, adapters: { react }, loadPeers: async () => ({}), grants: {} });
createMaracaPlanRuntime({ ...runtimeOptions, plan: graphRuntimePlan, xtensionCompositionPort: graphPort });
createMaracaBrowserCompositionRoot({ schema: 'xtend.maraca.browser-composition-root.v6', buildPlanSchema: graphPlan.schema, xtensionComposition: graphReport.artifact });
// @ts-expect-error Legacy manifests cannot declare a transitive module inventory.
const invalidLegacy: XTensionCompositionManifest = { ...manifest, modules: graphManifest.modules };
void [graphMajor, graphApi, invalidLegacy];
const configReport = await buildMaracaXTensionComposition({ plan: graphPlan, manifest: graphPlan.xtensionComposition, bindingsRuntime, rootDir: '.', outputDir: 'dist' });
const configReportSchema: 'xtend.maraca.xtension-composition-build-report.v6' | 'xtend.maraca.xtension-composition-build-report.v5' | 'xtend.maraca.xtension-composition-build-report.v4' | 'xtend.maraca.xtension-composition-build-report.v1' | 'xtend.maraca.xtension-composition-build-report.v2' | 'xtend.maraca.xtension-composition-build-report.v3' = configReport.schema;
void configReportSchema;

import type { DeferredXTensionCompositionManifest, DeferredXTensionHostCompositionOptions } from '@ccslabs/xtend/maraca/xtension-composition-runtime';
declare const deferredManifest: DeferredXTensionCompositionManifest;
const deferredPlan = createMaracaBuildPlan({ source: 'app.rmt', xtensionComposition: deferredManifest });
const deferredReport = await buildMaracaXTensionComposition({ plan: deferredPlan, manifest: deferredManifest, bindingsRuntime, rootDir: '.', outputDir: 'dist' });
const deferredMajor: 'xtend.maraca.xtension-composition-build-report.v4' = deferredReport.schema;
const loadPlanMajor: 'xtend.maraca.xtension-load-plan.v1' = deferredReport.artifact.loadPlan.schema;
const deferredRuntimePlan = { ...deferredPlan, xtensionComposition: deferredReport.artifact };
const deferredPort = createMaracaXTensionCompositionPort({ plan: deferredRuntimePlan, companion: { artifact: deferredReport.artifact, createHostFactory() { return () => ({} as any); } }, bindingsRuntime, adapters: { react }, loadPeers: async () => ({}), grants: {} });
createMaracaPlanRuntime({ ...runtimeOptions, plan: deferredRuntimePlan, xtensionCompositionPort: deferredPort });
// @ts-expect-error Eager namespaces cannot replace a deferred provider loader.
const deferredBypass: Pick<DeferredXTensionHostCompositionOptions, 'providers'> = { providers: {} };
void [deferredMajor, loadPlanMajor, deferredBypass];

import { createMaracaXTensionHostFactory, type SharedXTensionCompositionManifest, type SharedXTensionHostCompositionOptions } from '@ccslabs/xtend/maraca/xtension-composition-runtime';
import { createMaracaXTensionHostFactory as standaloneHostFactory } from '@ccslabs/xtend-maraca/xtension-composition-runtime';
declare const sharedManifest: SharedXTensionCompositionManifest;
const sharedPlan = createMaracaBuildPlan({ source: 'app.rmt', xtensionComposition: sharedManifest });
const sharedReport = await buildMaracaXTensionComposition({ plan: sharedPlan, manifest: sharedManifest, bindingsRuntime, rootDir: '.', outputDir: 'dist' });
const sharedMajor: 'xtend.maraca.xtension-composition-build-report.v5' = sharedReport.schema;
const sharedApi: '5.0.0' = sharedReport.artifact.apiVersion;
const sharedLoadPlan: 'xtend.maraca.xtension-load-plan.v2' = sharedReport.artifact.loadPlan.schema;
const sharedRuntimePlan = { ...sharedPlan, xtensionComposition: sharedReport.artifact };
const sharedPort = createMaracaXTensionCompositionPort({ plan: sharedRuntimePlan, companion: { artifact: sharedReport.artifact, createHostFactory() { return () => ({} as any); } }, bindingsRuntime, adapters: { react }, loadPeerGroup: async ({ group, signal }) => { signal.throwIfAborted(); const ids: readonly string[] = group.providerIds; return { ids, versions: group.versions }; }, grants: {} });
createMaracaPlanRuntime({ ...runtimeOptions, plan: sharedRuntimePlan, xtensionCompositionPort: sharedPort });
await app.boot({ fabric: ports.fabric, xtensions: { loadPeerGroup: async () => ({}), grants: {} } });
// @ts-expect-error Shared peer groups cannot use the per-host loader.
const sharedBypass: Pick<SharedXTensionHostCompositionOptions, 'loadPeers'> = { loadPeers() {} };
// @ts-expect-error A boot must choose exactly one explicit peer-loader port.
const ambiguousBoot: MaracaXTensionBootOptions = { fabric: ports.fabric, xtensions: { loadPeers() {}, loadPeerGroup() {}, grants: {} } };
const sameHostFactory: typeof createMaracaXTensionHostFactory = standaloneHostFactory;
void [sharedMajor, sharedApi, sharedLoadPlan, sharedBypass, ambiguousBoot, sameHostFactory];

import type { DeliveryXTensionCompositionManifest } from '@ccslabs/xtend/maraca/xtension-composition-runtime';
import type { XTensionDeliveryPlan } from '@ccslabs/xtend/maraca/xtension-composition';
declare const deliveryManifest: DeliveryXTensionCompositionManifest;
const deliveryPlan = createMaracaBuildPlan({ source: 'app.rmt', xtensionComposition: deliveryManifest });
const deliveryReport = await buildMaracaXTensionComposition({ plan: deliveryPlan, manifest: deliveryManifest, bindingsRuntime, rootDir: '.', outputDir: 'dist' });
const deliveryMajor: 'xtend.maraca.xtension-composition-build-report.v6' = deliveryReport.schema;
const deliveryApi: '6.0.0' = deliveryReport.artifact.apiVersion;
const deliveryFile: string = deliveryReport.deliveryFile;
const retainedLoadPlan: 'xtend.maraca.xtension-load-plan.v2' = deliveryReport.artifact.loadPlan.schema;
const deliveryRuntimePlan = { ...deliveryPlan, xtensionComposition: deliveryReport.artifact };
const deliveryPort = createMaracaXTensionCompositionPort({ plan: deliveryRuntimePlan, companion: { artifact: deliveryReport.artifact, createHostFactory() { return () => ({} as any); } }, bindingsRuntime, adapters: { react }, loadPeerGroup: async () => ({}), grants: {} });
createMaracaPlanRuntime({ ...runtimeOptions, plan: deliveryRuntimePlan, xtensionCompositionPort: deliveryPort });
declare const deployment: XTensionDeliveryPlan;
const notAnAttestation: false = deployment.runtimeDeliveryVerified;
// @ts-expect-error The delivery profile cannot enable arbitrary script origins.
const unsafeDelivery: DeliveryXTensionCompositionManifest['delivery'] = { schema: 'xtend.maraca.xtension-delivery-policy.v1', mode: 'any-origin' };
void [deliveryMajor, deliveryApi, deliveryFile, retainedLoadPlan, notAnAttestation, unsafeDelivery];

import { buildMaracaXTensionDeployment, loadMaracaXTensionDeployment, createMaracaXTensionDeploymentHandler, XTENSION_DEPLOYMENT_API_VERSION, type XTensionDeploymentConfig } from '@ccslabs/xtend/maraca/xtension-composition';
import { buildMaracaXTensionDeployment as standaloneDeployment } from '@ccslabs/xtend-maraca/xtension-composition';
const deploymentApi: '3.0.0' = XTENSION_DEPLOYMENT_API_VERSION;
const deploymentOptions: XTensionDeploymentConfig = { schema: 'xtend.maraca.xtension-deployment-config.v1', build, application: { rootDir: '.', bootstrap: { fileName: 'app-bootstrap.mjs', sha256: '0'.repeat(64) }, modules: [] }, publicPath: '/release/', outputDir: 'sealed' };
const sealed = buildMaracaXTensionDeployment(deploymentOptions);
const sealSchema: 'xtend.maraca.xtension-deployment-manifest.v1' = sealed.manifest.schema;
const sealedHandler = createMaracaXTensionDeploymentHandler(loadMaracaXTensionDeployment({ rootDir: sealed.outputDir, manifestSha256: sealed.manifestSha256 }));
const sameDeployment: typeof buildMaracaXTensionDeployment = standaloneDeployment;
// @ts-expect-error Loading a deployment requires an external trusted manifest digest.
loadMaracaXTensionDeployment({ rootDir: 'sealed' });
void [deploymentApi,sealSchema,sealedHandler,sameDeployment];

import type { XTensionRuntimeDeploymentConfig, XTensionDeploymentRuntimePolicy } from '@ccslabs/xtend/maraca/xtension-composition';
const runtimePolicy: XTensionDeploymentRuntimePolicy = { schema: 'xtend.maraca.xtension-deployment-runtime-policy.v1', pwa: 'verified-static-cache', appServices: 'separate-server' };
const runtimeDeploymentOptions: XTensionRuntimeDeploymentConfig = { ...deploymentOptions, schema: 'xtend.maraca.xtension-deployment-config.v2', runtime: runtimePolicy, origin: 'https://example.test', serverOutputDir: 'private-services' };
const runtimeDeployment = buildMaracaXTensionDeployment(runtimeDeploymentOptions);
const runtimeDeploymentApi: '2.0.0' = runtimeDeployment.apiVersion;
const runtimeDeploymentSchema: 'xtend.maraca.xtension-deployment-manifest.v2' = runtimeDeployment.manifest.schema;
const publicBytes: number | undefined = runtimeDeployment.accounting?.publicBytes;
createMaracaXTensionDeploymentHandler(loadMaracaXTensionDeployment({ rootDir: 'public', serverRootDir: 'private', manifestSha256: '0'.repeat(64) }));
// @ts-expect-error Cache rules require a closed policy, rather than an arbitrary runtime strategy.
const unsafeRuntimePolicy: XTensionDeploymentRuntimePolicy = { schema: 'xtend.maraca.xtension-deployment-runtime-policy.v1', pwa: 'cache-everything', appServices: 'separate-server' };
// @ts-expect-error The v1 configuration retains its original closed shape.
const unsafeLegacyDeployment: XTensionDeploymentConfig = { ...deploymentOptions, runtime: runtimePolicy };
void [runtimeDeploymentApi,runtimeDeploymentSchema,publicBytes,unsafeRuntimePolicy,unsafeLegacyDeployment];

import type {XTensionCoordinatedDeploymentConfig, DeploymentUpdateClient, DeploymentUpdateReport} from '@ccslabs/xtend/maraca/xtension-composition';
const coordinatedOptions: XTensionCoordinatedDeploymentConfig = {...runtimeDeploymentOptions, schema:'xtend.maraca.xtension-deployment-config.v3', runtime:{schema:'xtend.maraca.xtension-deployment-runtime-policy.v2',pwa:'verified-static-cache',appServices:'separate-server',updates:'coordinated',acknowledgementTimeoutMs:1000},retainedDeployments:[runtimeDeployment],retainedByteBudget:5_000_000};
const coordinated=buildMaracaXTensionDeployment(coordinatedOptions);
const coordinatedApi: '3.0.0'=coordinated.apiVersion;
const coordinatedSchema: 'xtend.maraca.xtension-deployment-manifest.v3'=coordinated.manifest.schema;
const revisionId: string=coordinated.manifest.revision.id;
const retainedBytes: number|undefined=coordinated.accounting?.retainedBytes;
declare const deploymentClient: DeploymentUpdateClient;
deploymentClient.setReadyForRetirement(true);
const updateStatus: Promise<DeploymentUpdateReport>=deploymentClient.collectRetiredCaches();
// @ts-expect-error Forced takeover is not an activation policy.
const forcedUpdate: XTensionCoordinatedDeploymentConfig['runtime']={schema:'xtend.maraca.xtension-deployment-runtime-policy.v2',pwa:'verified-static-cache',appServices:'disabled',updates:'force',acknowledgementTimeoutMs:1000};
// @ts-expect-error Retained snapshots require an explicit storage budget.
const unbudgetedUpdate: XTensionCoordinatedDeploymentConfig={...runtimeDeploymentOptions,schema:'xtend.maraca.xtension-deployment-config.v3',runtime:coordinatedOptions.runtime,retainedDeployments:[]};
void [coordinatedApi,coordinatedSchema,revisionId,retainedBytes,updateStatus,forcedUpdate,unbudgetedUpdate];

import { loadMaracaXTensionDeploymentSnapshot, type XTensionDeploymentSnapshot } from '@ccslabs/xtend/maraca/xtension-composition';
const staticHistory: XTensionDeploymentSnapshot=loadMaracaXTensionDeploymentSnapshot({rootDir:'old-public',manifestSha256:'0'.repeat(64)});
const withStaticHistory=buildMaracaXTensionDeployment({...coordinatedOptions,retainedDeployments:[staticHistory]});
const advisory: Promise<DeploymentUpdateReport>=deploymentClient.checkForUpdate();
const headFile: 'xtend.deployment-head.json'|undefined=withStaticHistory.manifest.headFile;
// @ts-expect-error A public snapshot cannot act as an active HTTP deployment.
createMaracaXTensionDeploymentHandler(staticHistory);
void [advisory,headFile];
