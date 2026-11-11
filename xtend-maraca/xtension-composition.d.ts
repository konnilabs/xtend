import type { MaracaBuildPlan } from './index';
import type { XTensionCompositionManifest, XTensionCompositionArtifact, XTensionCompositionBindingRuntime } from './xtension-composition-runtime';
export type { XTensionCompositionManifest, XTensionCompositionArtifact, XTensionCompositionProvider } from './xtension-composition-runtime';
export const XTENSION_COMPOSITION_BUILD_API_VERSION: '8.0.0';
export interface XTensionCompositionBuildReport {
  readonly schema: 'xtend.maraca.xtension-composition-build-report.v1';
  readonly apiVersion: '1.0.0'; readonly ok: true;
  readonly artifact: XTensionCompositionArtifact;
  readonly entryPath: string;
  readonly files: readonly { readonly fileName: string; readonly sha256: string; readonly bytes: number }[];
  readonly frameworkDependenciesBundled: false;
  readonly runtimeExecutionVerified: false;
}
/** Fail-closed, local, self-contained ESM provider capture. No provider is executed at build time. */
export function buildMaracaXTensionComposition(options: {
  readonly plan: MaracaBuildPlan; readonly manifest: XTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime;
  readonly rootDir: string; readonly outputDir: string;
}): Promise<XTensionCompositionBuildReport>;

export interface IntegratedXTensionCompositionBuildReport extends Omit<XTensionCompositionBuildReport, 'schema' | 'apiVersion' | 'artifact'> {
  readonly schema: 'xtend.maraca.xtension-composition-build-report.v2'; readonly apiVersion: '2.0.0';
  readonly artifact: import('./xtension-composition-runtime').IntegratedXTensionCompositionArtifact;
}
export function buildMaracaXTensionComposition(options: {
  readonly plan: import('./index').MaracaComposedBuildPlan; readonly manifest: XTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime; readonly rootDir: string; readonly outputDir: string;
}): Promise<IntegratedXTensionCompositionBuildReport>;

export type { GraphXTensionCompositionManifest, GraphXTensionCompositionArtifact, AnyXTensionCompositionManifest } from './xtension-composition-runtime';
export interface GraphXTensionCompositionBuildReport extends Omit<XTensionCompositionBuildReport, 'schema' | 'apiVersion' | 'artifact'> {
  readonly schema: 'xtend.maraca.xtension-composition-build-report.v3'; readonly apiVersion: '3.0.0';
  readonly artifact: import('./xtension-composition-runtime').GraphXTensionCompositionArtifact;
}
export function buildMaracaXTensionComposition(options: {
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
  readonly manifest: import('./xtension-composition-runtime').GraphXTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime; readonly rootDir: string; readonly outputDir: string;
}): Promise<GraphXTensionCompositionBuildReport>;
export type { DeferredXTensionCompositionManifest, DeferredXTensionCompositionArtifact, XTensionLoadPlan } from './xtension-composition-runtime';
export interface DeferredXTensionCompositionBuildReport extends Omit<XTensionCompositionBuildReport, 'schema' | 'apiVersion' | 'artifact'> {
  readonly schema: 'xtend.maraca.xtension-composition-build-report.v4'; readonly apiVersion: '4.0.0';
  readonly artifact: import('./xtension-composition-runtime').DeferredXTensionCompositionArtifact;
}
export function buildMaracaXTensionComposition(options: {
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
  readonly manifest: import('./xtension-composition-runtime').DeferredXTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime; readonly rootDir: string; readonly outputDir: string;
}): Promise<DeferredXTensionCompositionBuildReport>;
export type { SharedXTensionCompositionManifest, SharedXTensionCompositionArtifact, SharedXTensionLoadPlan, XTensionPeerGroup } from './xtension-composition-runtime';
export interface SharedXTensionCompositionBuildReport extends Omit<XTensionCompositionBuildReport, 'schema' | 'apiVersion' | 'artifact'> {
  readonly schema: 'xtend.maraca.xtension-composition-build-report.v5'; readonly apiVersion: '5.0.0';
  readonly artifact: import('./xtension-composition-runtime').SharedXTensionCompositionArtifact;
}
export function buildMaracaXTensionComposition(options: {
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
  readonly manifest: import('./xtension-composition-runtime').SharedXTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime; readonly rootDir: string; readonly outputDir: string;
}): Promise<SharedXTensionCompositionBuildReport>;
export type { DeliveryXTensionCompositionManifest, DeliveryXTensionCompositionArtifact, XTensionDeliveryPolicy } from './xtension-composition-runtime';
export interface XTensionDeliveryPlan {
  readonly schema: 'xtend.maraca.xtension-delivery-plan.v1'; readonly scope: 'composition-graph';
  readonly entryFile: string; readonly mode: 'same-origin-external-esm';
  readonly headers: { readonly 'Content-Security-Policy': string; readonly 'X-Content-Type-Options': 'nosniff' };
  readonly javascriptContentType: 'text/javascript; charset=utf-8'; readonly runtimeDeliveryVerified: false;
  readonly files: readonly { readonly fileName: string; readonly sha256: string; readonly bytes: number }[];
}
export interface DeliveryXTensionCompositionBuildReport extends Omit<XTensionCompositionBuildReport, 'schema' | 'apiVersion' | 'artifact'> {
  readonly schema: 'xtend.maraca.xtension-composition-build-report.v6'; readonly apiVersion: '6.0.0';
  readonly artifact: import('./xtension-composition-runtime').DeliveryXTensionCompositionArtifact;
  readonly deliveryFile: string;
}
export function buildMaracaXTensionComposition(options: {
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
  readonly manifest: import('./xtension-composition-runtime').DeliveryXTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime; readonly rootDir: string; readonly outputDir: string;
}): Promise<DeliveryXTensionCompositionBuildReport>;
/** A manifest read from a versioned config keeps its union until the result is narrowed. */
export function buildMaracaXTensionComposition(options: {
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
  readonly manifest: import('./xtension-composition-runtime').AnyXTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime; readonly rootDir: string; readonly outputDir: string;
}): Promise<XTensionCompositionBuildReport | IntegratedXTensionCompositionBuildReport | GraphXTensionCompositionBuildReport | DeferredXTensionCompositionBuildReport | SharedXTensionCompositionBuildReport | DeliveryXTensionCompositionBuildReport>;

/** Node build/deployment API. Native browser execution keeps composition API6. */
export const XTENSION_DEPLOYMENT_API_VERSION: '2.0.0';
export interface XTensionDeploymentManifest {
  readonly schema: 'xtend.maraca.xtension-deployment-manifest.v1'; readonly apiVersion: '1.0.0';
  readonly mode: 'native-sri-importmap'; readonly publicPath: string;
  readonly documentFile: string; readonly bootstrap: string;
  readonly files: readonly { readonly fileName: string; readonly bytes: number; readonly sha256: string }[];
}
export interface XTensionDeploymentResult {
  readonly schema: 'xtend.maraca.xtension-deployment-result.v1'; readonly apiVersion: '1.0.0';
  readonly outputDir: string; readonly manifestFile: 'xtend.deployment.json'; readonly manifestSha256: string;
  readonly manifest: XTensionDeploymentManifest;
  readonly headers: Readonly<{ 'Content-Security-Policy': string; 'Integrity-Policy': 'blocked-destinations=(script)'; 'X-Content-Type-Options': 'nosniff'; 'Cache-Control': 'no-store, no-transform' }>;
  readonly accounting?: Readonly<{ totalBytes: number; applicationBytes: number; envelopeBytes: number; frameworkBytes: number; frameworkBaselineBytes: number; xtensionRuntimeBytes: number; withinBudget: boolean }>;
  readonly runtimeExecutionVerified: false;
}
export interface XTensionDeploymentConfig {
  readonly schema: 'xtend.maraca.xtension-deployment-config.v1';
  /** Actual successful object returned by the regular async build; JSON replay is rejected. */
  readonly build: { readonly ok: boolean; readonly plan: import('./index').MaracaComposedBuildPlan };
  readonly application: { readonly rootDir: string; readonly bootstrap: { readonly fileName: string; readonly sha256: string }; readonly modules: readonly { readonly fileName: string; readonly sha256: string }[] };
  readonly publicPath: string; readonly outputDir: string;
}
export function buildMaracaXTensionDeployment(options: XTensionDeploymentConfig): XTensionDeploymentResult;
export function buildMaracaXTensionDeployment(options: XTensionRuntimeDeploymentConfig): XTensionRuntimeDeploymentResult;
/** The expected manifest digest must come from trusted deployment configuration. */
export function loadMaracaXTensionDeployment(options: { readonly rootDir: string; readonly manifestSha256: string; readonly serverRootDir?: string }): XTensionDeploymentResult | XTensionRuntimeDeploymentResult;
export function createMaracaXTensionDeploymentHandler(result: XTensionDeploymentResult | XTensionRuntimeDeploymentResult): (
  request: { readonly method?: string; readonly url?: string },
  response: { setHeader(name: string, value: string | number): unknown; writeHead(status: number, headers?: Readonly<Record<string, string | number>>): unknown; end(body?: Uint8Array): unknown }
) => boolean;

/** Opt-in runtime policy. Worker registration remains a trusted origin operation. */
export interface XTensionDeploymentRuntimePolicy {
  readonly schema: 'xtend.maraca.xtension-deployment-runtime-policy.v1';
  readonly pwa: 'disabled' | 'verified-static-cache';
  readonly appServices: 'disabled' | 'separate-server';
}
export interface XTensionRuntimeDeploymentConfig extends Omit<XTensionDeploymentConfig, 'schema'> {
  readonly schema: 'xtend.maraca.xtension-deployment-config.v2';
  readonly origin: string; readonly runtime: XTensionDeploymentRuntimePolicy;
  /** Required when AppServices are enabled; must be separate from all public/input trees. */
  readonly serverOutputDir?: string;
}
export interface XTensionRuntimeDeploymentManifest extends Omit<XTensionDeploymentManifest, 'schema' | 'apiVersion'> {
  readonly schema: 'xtend.maraca.xtension-deployment-manifest.v2'; readonly apiVersion: '2.0.0';
  readonly origin: string; readonly runtime: XTensionDeploymentRuntimePolicy; readonly servicePath: string | null;
  readonly serverFiles: readonly { readonly fileName: string; readonly sha256: string; readonly bytes: number }[];
  readonly pwa: Readonly<{workerFile: 'xtend.sealed-service-worker.js'; offlineFile: 'xtend.sealed-offline.html'; manifestFile: string; cacheName: string}> | null;
}
export interface XTensionRuntimeDeploymentResult extends Omit<XTensionDeploymentResult, 'schema' | 'apiVersion' | 'manifest' | 'accounting'> {
  readonly schema: 'xtend.maraca.xtension-deployment-result.v2'; readonly apiVersion: '2.0.0';
  readonly manifest: XTensionRuntimeDeploymentManifest; readonly serverOutputDir?: string;
  readonly accounting?: NonNullable<XTensionDeploymentResult['accounting']> & Readonly<{publicBytes: number; serverBytes: number; pwaWorkerBytes: number}>;
}
