import type { ComponentInterface, ComponentInterfaceV2 } from '../xtensions/component-interface';
import type { XTensionProjection, XTensionProjectionPath } from '../xtensions/state-binding';
import type { XTensionProjectionStateBindingArtifact, XTensionRepeatScope } from '../xtensions/state-binding-artifact';
import type { RmtRange } from './rmt-tooling-public-types';
export const RMTX_COMPONENT_BINDINGS_API_VERSION: '1.0.0';
export const RMTX_COMPONENT_DEPENDENCIES_SCHEMA: 'xtend.rmtx.component-dependencies.v1';
export interface RmtxComponentSourceContract {
  readonly schema: 'xtend.rmtx.components.v1';
  readonly sourceProfile: { readonly syntax: 'rmtx'; readonly version: '4.0.0' };
  readonly documentId: string;
  readonly hosts: readonly {
    readonly declarationId: string; readonly surface: string; readonly providerId: string; readonly ownerSurface: string; readonly lane: string;
    readonly props: Readonly<Record<string, XTensionProjection>>;
    readonly intents: Readonly<Record<string, { readonly action: string; readonly payload: Readonly<Record<string, string>>; readonly keys?: Readonly<Record<string, number>> }>>;
    readonly repeat?: readonly [XTensionRepeatScope & { readonly state: string }, ...XTensionRepeatScope[]];
    readonly presence?: { readonly state: string; readonly path: XTensionProjectionPath };
    readonly range?: RmtRange;
  }[];
}
export interface RmtxComponentCatalog {
  readonly schema: 'xtend.xtensions.component-interface-catalog.v1'; readonly apiVersion: '1.0.0';
  readonly records: readonly { readonly definition: ComponentInterface | ComponentInterfaceV2; readonly interfaceSha256: string; readonly moduleSha256: string; readonly file: string }[];
  readonly providers: readonly Readonly<Record<string, unknown>>[];
  readonly interfaces: readonly { readonly providerId: string; readonly file: string; readonly sha256: string }[];
}
export interface RmtxComponentDependencyRead { readonly root: 'state' | 'selector'; readonly symbol: string; readonly path: XTensionProjectionPath }
export interface RmtxComponentDependencyReport {
  readonly schema: typeof RMTX_COMPONENT_DEPENDENCIES_SCHEMA; readonly sourceProfile: RmtxComponentSourceContract['sourceProfile'];
  readonly declarations: readonly { readonly declarationId: string; readonly reads: readonly RmtxComponentDependencyRead[]; readonly transitiveStateReads?: readonly RmtxComponentDependencyRead[]; readonly allSyntacticBranches: true }[];
  readonly runtimeTracking: false; readonly runtimeSubscriptionsChanged: false;
  readonly selectorValueValidation: 'existing-runtime-props-boundary'; readonly missingModelPathFallback: false;
}
export function projectRmtxComponents(input: { readonly contract: RmtxComponentSourceContract; readonly catalog: RmtxComponentCatalog; readonly program: unknown }): {
  readonly xtensionBindings: XTensionProjectionStateBindingArtifact;
  readonly xtensionComposition: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.xtension-composition-manifest.v8' };
  readonly dependencies: RmtxComponentDependencyReport;
};
