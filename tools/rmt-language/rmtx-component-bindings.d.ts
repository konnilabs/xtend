import type { ComponentInterface, ComponentInterfaceV2 } from '../xtensions/component-interface';
import type { XTensionProjection, XTensionProjectionPath } from '../xtensions/state-binding';
import type { XTensionProjectionStateBindingArtifact, XTensionRepeatScope } from '../xtensions/state-binding-artifact';
import type { RmtRange } from './rmt-tooling-public-types';
export const RMTX_COMPONENT_BINDINGS_API_VERSION: '2.0.0';
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

export const RMTX_COMPONENT_DEPENDENCIES_SCHEMA_V2: 'xtend.rmtx.component-dependencies.v2';
export interface RmtxComponentSourceContractV2 extends Omit<RmtxComponentSourceContract, 'schema' | 'sourceProfile'> {
  readonly schema: 'xtend.rmtx.components.v2';
  readonly sourceProfile: { readonly syntax: 'rmtx'; readonly version: '5.0.0' };
}
export interface RmtxComponentDependencyReportV2 extends Omit<RmtxComponentDependencyReport, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_COMPONENT_DEPENDENCIES_SCHEMA_V2;
  readonly sourceProfile: RmtxComponentSourceContractV2['sourceProfile'];
}
export function projectRmtxComponents(input: { readonly contract: RmtxComponentSourceContractV2; readonly catalog: RmtxComponentCatalog; readonly program: unknown }): {
  readonly xtensionBindings: import('../xtensions/state-binding-artifact').XTensionNativeStateBindingArtifact;
  readonly xtensionComposition: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.xtension-composition-manifest.v9' };
  readonly dependencies: RmtxComponentDependencyReportV2;
};

/** Source6 consumes the unchanged Source5 component source subprofile. */
export const RMTX_LIFECYCLE_COMPONENT_BINDINGS_API_VERSION: '3.0.0';
export const RMTX_COMPONENT_DEPENDENCIES_SCHEMA_V3: 'xtend.rmtx.component-dependencies.v3';
export interface RmtxComponentDependencyReportV3 extends Omit<RmtxComponentDependencyReport, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_COMPONENT_DEPENDENCIES_SCHEMA_V3;
  readonly sourceProfile: { readonly syntax: 'rmtx'; readonly version: '6.0.0' };
  readonly viewProfile: RmtxComponentSourceContractV2['sourceProfile'];
}
export function projectRmtxLifecycleComponents(input: { readonly contract: RmtxComponentSourceContractV2; readonly catalog: RmtxComponentCatalog; readonly program: unknown }): {
  readonly xtensionBindings: import('../xtensions/state-binding-artifact').XTensionLifecycleStateBindingArtifact;
  readonly xtensionComposition: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.xtension-composition-manifest.v10' };
  readonly dependencies: RmtxComponentDependencyReportV3;
};

/** Source7 adds scoped native owners without widening the retained Source4–6 contracts. */
export const RMTX_ORCHESTRATED_COMPONENT_BINDINGS_API_VERSION: '4.0.0';
export interface RmtxComponentSourceContractV3 extends Omit<RmtxComponentSourceContract, 'schema' | 'sourceProfile'> {
 readonly schema: 'xtend.rmtx.components.v3'; readonly sourceProfile: { readonly syntax: 'rmtx'; readonly version: '7.0.0' };
}
export interface RmtxComponentDependencyReportV4 extends Omit<RmtxComponentDependencyReport, 'schema' | 'sourceProfile'> {
 readonly schema: 'xtend.rmtx.component-dependencies.v4'; readonly sourceProfile: RmtxComponentSourceContractV3['sourceProfile'];
 readonly viewProfile: RmtxComponentSourceContractV3['sourceProfile'];
}
export function projectRmtxOrchestratedComponents(input: { readonly contract: RmtxComponentSourceContractV3; readonly catalog: RmtxComponentCatalog; readonly program: unknown }): {
 readonly xtensionBindings: import('../xtensions/state-binding-artifact').XTensionOrchestratedStateBindingArtifact;
 readonly xtensionComposition: Readonly<Record<string, unknown>> & { readonly schema: 'xtend.maraca.xtension-composition-manifest.v11' };
 readonly dependencies: RmtxComponentDependencyReportV4;
};
export const RMTX_MANAGED_COMPONENT_BINDINGS_API_VERSION:'5.0.0';
export interface RmtxComponentSourceContractV4 extends Omit<RmtxComponentSourceContract,'schema'|'sourceProfile'>{readonly schema:'xtend.rmtx.components.v4';readonly sourceProfile:{readonly syntax:'rmtx';readonly version:'8.0.0'}}
export interface RmtxComponentDependencyReportV5 extends Omit<RmtxComponentDependencyReport,'schema'|'sourceProfile'>{readonly schema:'xtend.rmtx.component-dependencies.v5';readonly sourceProfile:RmtxComponentSourceContractV4['sourceProfile'];readonly viewProfile:RmtxComponentSourceContractV4['sourceProfile']}
export function projectRmtxManagedComponents(input:{readonly contract:RmtxComponentSourceContractV4;readonly catalog:RmtxComponentCatalog;readonly program:unknown}):{readonly xtensionBindings:import('../xtensions/state-binding-artifact').XTensionManagedStateBindingArtifact;readonly xtensionComposition:Readonly<Record<string,unknown>>&{readonly schema:'xtend.maraca.xtension-composition-manifest.v12'};readonly dependencies:RmtxComponentDependencyReportV5};
