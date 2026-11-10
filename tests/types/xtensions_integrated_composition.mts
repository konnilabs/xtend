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
