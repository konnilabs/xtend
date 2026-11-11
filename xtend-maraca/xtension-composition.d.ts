import type { MaracaBuildPlan } from './index';
import type { XTensionCompositionManifest, XTensionCompositionArtifact, XTensionCompositionBindingRuntime } from './xtension-composition-runtime';
export type { XTensionCompositionManifest, XTensionCompositionArtifact, XTensionCompositionProvider } from './xtension-composition-runtime';
export const XTENSION_COMPOSITION_BUILD_API_VERSION: '4.0.0';
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
/** A manifest read from a versioned config keeps its union until the result is narrowed. */
export function buildMaracaXTensionComposition(options: {
  readonly plan: MaracaBuildPlan | import('./index').MaracaComposedBuildPlan;
  readonly manifest: import('./xtension-composition-runtime').AnyXTensionCompositionManifest;
  readonly bindingsRuntime: XTensionCompositionBindingRuntime; readonly rootDir: string; readonly outputDir: string;
}): Promise<XTensionCompositionBuildReport | IntegratedXTensionCompositionBuildReport | GraphXTensionCompositionBuildReport | DeferredXTensionCompositionBuildReport>;
