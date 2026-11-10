import type { MaracaBuildPlan } from './index';
import type { XTensionCompositionManifest, XTensionCompositionArtifact, XTensionCompositionBindingRuntime } from './xtension-composition-runtime';
export type { XTensionCompositionManifest, XTensionCompositionArtifact, XTensionCompositionProvider } from './xtension-composition-runtime';
export const XTENSION_COMPOSITION_BUILD_API_VERSION: '1.0.0';
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
