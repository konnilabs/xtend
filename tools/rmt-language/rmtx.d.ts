import type { RmtJsonValue } from './rmt-tooling-public-types';
/** Static markers. Model/item fields are compiler-checked; no model type SDK is implied. */
export declare const RMTX_AUTHORING_API_VERSION: '4.0.0';
export type RmtxLegacyOperator = 'Program' | 'State' | 'Action' | 'Input' | 'Reduce' | 'Portal' | 'Surface' | 'Lane' | 'Mount';
/** Complete original v1 authoring namespace type, retained for compatibility consumers. */
export type RmtxLegacyAuthoringNamespace = Readonly<Record<RmtxLegacyOperator, (attributes: Readonly<Record<string, unknown>>) => null>>;
export type RmtxLegacyReferenceNamespace = Readonly<Record<string, unknown>>;
export interface RmtxProgramAttributes { id: string; children?: unknown }
export interface RmtxStateAttributes { id: string; type: string; initial: RmtJsonValue; preserve?: boolean; children?: never }
export interface RmtxActionAttributes { id: string; children?: unknown }
export interface RmtxInputAttributes { name: string; type: string; children?: never }
export interface RmtxReduceAttributes { state: string; path?: string; value: unknown; children?: never }
export interface RmtxPortalAttributes { id: string; root?: string; layer?: string; children?: never }
export interface RmtxSurfaceAttributes { id: string; kind?: string; component?: string; portal?: string; children?: unknown }
export interface RmtxLaneAttributes { name: string; children?: unknown }
export interface RmtxMountAttributes { target: string; children?: never }
export interface RmtxSelectorAttributes { id: string; from: unknown; children?: unknown }
export interface RmtxWhereAttributes { test: unknown; children?: never }
export interface RmtxFindAttributes { test: unknown; children?: never }
export interface RmtxSortAttributes { by: unknown; direction?: 'asc' | 'desc'; children?: never }
export interface RmtxOutputAttributes { type: string; children?: never }
/** Complete v2 namespace; model field types remain deliberately unknown. */
export interface RmtxAuthoringNamespaceV2 {
  readonly Program: (attributes: RmtxProgramAttributes) => null;
  readonly State: (attributes: RmtxStateAttributes) => null;
  readonly Action: (attributes: RmtxActionAttributes) => null;
  readonly Input: (attributes: RmtxInputAttributes) => null;
  readonly Reduce: (attributes: RmtxReduceAttributes) => null;
  readonly Portal: (attributes: RmtxPortalAttributes) => null;
  readonly Surface: (attributes: RmtxSurfaceAttributes) => null;
  readonly Lane: (attributes: RmtxLaneAttributes) => null;
  readonly Mount: (attributes: RmtxMountAttributes) => null;
  readonly Selector: (attributes: RmtxSelectorAttributes) => null;
  readonly Where: (attributes: RmtxWhereAttributes) => null;
  readonly Find: (attributes: RmtxFindAttributes) => null;
  readonly Sort: (attributes: RmtxSortAttributes) => null;
  readonly Output: (attributes: RmtxOutputAttributes) => null;
}
export interface RmtxSurfaceAttributesV3 extends RmtxSurfaceAttributes { present?: unknown }
export interface RmtxRepeatAttributes { from: unknown; keyBy: unknown; children?: unknown }
export interface RmtxOnAttributes { event: string; action: string; payload: Readonly<Record<string, string>>; when?: unknown; children?: never }
export interface RmtxAuthoringNamespaceV3 extends Omit<RmtxAuthoringNamespaceV2, 'Surface'> {
  readonly Surface: (attributes: RmtxSurfaceAttributesV3) => null;
  readonly Repeat: (attributes: RmtxRepeatAttributes) => null;
  readonly On: (attributes: RmtxOnAttributes) => null;
}

/** Complete v3 authoring namespace remains available independently of source4. */
export interface RmtxInputAttributesV4 extends Omit<RmtxInputAttributes, 'children'> { optional?: boolean; nullable?: boolean; default?: RmtJsonValue; children?: unknown }
export interface RmtxLaneAttributesV4 extends RmtxLaneAttributes { weight?: number }
export interface RmtxOnAttributesV4 extends RmtxOnAttributes { preventDefault?: boolean }
export interface RmtxXTensionIntent { readonly action: string; readonly payload: Readonly<Record<string, string>>; readonly keys?: Readonly<Record<string, number>> }
export interface RmtxXTensionAttributes { id: string; provider: string; owner: string; lane: string; props: Readonly<Record<string, unknown>>; intents?: Readonly<Record<string, RmtxXTensionIntent>>; children?: never }
export interface RmtxDataSourceAttributes { id: string; sourceKind?: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; source?: string; mode?: string; method?: string; contract?: string; result?: string; fallbackKind?: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; fallback?: string; children?: unknown }
export interface RmtxDataSourceModeAttributes { value: RmtJsonValue; children?: never }
export interface RmtxDataSourceMethodAttributes { value: RmtJsonValue; children?: never }
export interface RmtxDataSourceContractAttributes { value: RmtJsonValue; children?: never }
export interface RmtxDataSourceResultAttributes { value: RmtJsonValue; children?: never }
export interface RmtxDataSourceFallbackAttributes { kind: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; ref: string; children?: never }
export interface RmtxStatusAttributes { path: string; children?: never }
export interface RmtxExecutionAttributes { path: "fastpass"; children?: never }
export interface RmtxInputPolicyAttributes { children?: unknown }
export interface RmtxEffectAttributes { kind: string; sourceKind?: "datasource" | "resource" | "selector" | "surface"; source?: string; path?: unknown; children?: never }
export interface RmtxRecipeAttributes { recipe: string; state: string; path?: string; value?: unknown; children?: never }
export interface RmtxEmitAttributes { event: string; payload?: unknown; children?: never }
export interface RmtxResultHandlerAttributes { phase: "success" | "error"; kind: "reduce" | "emit" | "overlay"; state?: string; path?: string; value?: unknown; event?: string; payload?: unknown; target?: string; message?: unknown; tone?: unknown; children?: never }
export interface RmtxValidationAttributes { id: string; children?: unknown }
export interface RmtxValidationModeAttributes { mode: string; children?: never }
export interface RmtxValidationTargetAttributes { kind: "action" | "surface" | "state"; target: string; children?: never }
export interface RmtxValidationFieldAttributes { field: string; children?: unknown }
export interface RmtxValidationRuleAttributes { kind: "required" | "email" | "minLength" | "maxLength" | "pattern" | "message"; value?: RmtJsonValue; children?: never }
export interface RmtxValidationIncludeAttributes { ref: string; children?: never }
export interface RmtxAnimationAttributes { id: string; children?: unknown }
export interface RmtxAnimationPresetAttributes { preset: string; children?: never }
export interface RmtxAnimationEffectAttributes { effect: string; children?: never }
export interface RmtxAnimationDurationAttributes { value: number; children?: never }
export interface RmtxAnimationEasingAttributes { value: string; children?: never }
export interface RmtxAnimationAllowFilterAttributes { value: boolean; children?: never }
export interface RmtxAnimationReducedMotionAttributes { policy: string; children?: never }
export interface RmtxAnimationSpringAttributes { stiffness?: number; damping?: number; mass?: number; velocity?: number; children?: never }
export interface RmtxAnimationKeyframeAttributes { phase: "enter" | "exit"; opacity?: number; transform?: string; filter?: string; offset?: number; children?: never }
export interface RmtxAnimationTimelineAttributes { children?: unknown }
export interface RmtxAnimationTimelineStepAttributes { kind: "enter" | "exit" | "sequence" | "parallel" | "stagger"; phase?: "enter" | "exit"; delayMs?: number; durationMs?: number; eachMs?: number; children?: never }
export interface RmtxTransitionTimelineAttributes { children?: unknown }
export interface RmtxTransitionTimelineStepAttributes { kind: "enter" | "exit" | "sequence" | "parallel" | "stagger"; phase?: "enter" | "exit"; delayMs?: number; durationMs?: number; eachMs?: number; children?: never }
export interface RmtxTransitionAttributes { id: string; children?: unknown }
export interface RmtxTransitionTriggerAttributes { kind: "action" | "event" | "state" | "surface"; target: string; children?: never }
export interface RmtxTransitionFromAttributes { value: string | readonly string[]; children?: never }
export interface RmtxTransitionToAttributes { value: string | readonly string[]; children?: never }
export interface RmtxTransitionDurationAttributes { value: number; children?: never }
export interface RmtxTransitionEasingAttributes { value: string; children?: never }
export interface RmtxTransitionLayoutKeyAttributes { value: string; children?: never }
export interface RmtxTransitionEffectAttributes { effect: string; children?: never }
export interface RmtxTransitionLaneAttributes { lane: string; children?: never }
export interface RmtxTransitionUseAnimationAttributes { ref: string; children?: never }
export interface RmtxTransitionInterruptAttributes { policy: string; children?: never }
export interface RmtxTransitionReducedMotionAttributes { policy: string; children?: never }
export interface RmtxPortalAttributesV4 { id: string; root?: string; layer?: string; z?: number; children?: unknown }
export interface RmtxOverlayAttributes { id: string; kind?: string; portal?: string; children?: unknown }
export interface RmtxPortalPolicyAttributes { name: "escape" | "focus" | "pointer" | "scroll" | "stack" | "close" | "singleton" | "dismissible" | "inert"; values: readonly (string | number | boolean | null)[]; children?: never }
export interface RmtxOverlayPolicyAttributes { name: "escape" | "focus" | "pointer" | "scroll" | "stack" | "close" | "singleton" | "dismissible" | "inert"; values: readonly (string | number | boolean | null)[]; children?: never }
export interface RmtxResourceAttributes { id: string; kind?: string; owner?: string; source?: string; children?: unknown }
export interface RmtxResourceImportAttributes { value: string; children?: never }
export interface RmtxResourceSourceAttributes { kind: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; ref: string; children?: never }
export interface RmtxResourceDisposeAttributes { on: string; children?: never }
export interface RmtxSurfaceSourceAttributes { kind: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; ref: string; children?: never }
export interface RmtxSurfaceBoundsAttributes { mode?: "fixed" | "responsive"; scope?: "viewport" | "container"; width?: number | string; height?: number | string; minWidth?: number | string; minHeight?: number | string; maxWidth?: number | string; maxHeight?: number | string; x?: number | string; y?: number | string; children?: never }
export interface RmtxSurfacePreserveAttributes { value: "true" | "false" | "state" | "resources" | "all"; children?: never }
export interface RmtxSurfaceDestroyAttributes { resource: string; children?: never }
export interface RmtxSearchSourceAttributes { id: string; children?: unknown }
export interface RmtxSearchQueryAttributes { kind: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; ref: string; children?: never }
export interface RmtxSearchResourceAttributes { kind: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; ref: string; children?: never }
export interface RmtxSearchFallbackResourceAttributes { kind: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; ref: string; children?: never }
export interface RmtxSearchWeightAttributes { field: string; value: number; children?: never }
export interface RmtxSearchValueAttributes { name: "minQueryLength" | "debounceMs" | "resultLimit" | "fallbackThreshold" | "resultTemplate" | "emptyTemplate" | "loadingTemplate" | "activeIndexState" | "selectionState" | "localePolicy" | "a11y"; value: RmtJsonValue; children?: never }
export interface RmtxMountAttributesV4 { target: string; children?: unknown }
export interface RmtxHydrateAttributes { target: string; children?: unknown }
export interface RmtxSuspendAttributes { target: string; children?: unknown }
export interface RmtxResumeAttributes { target: string; children?: unknown }
export interface RmtxInvalidateAttributes { target: string; children?: unknown }
export interface RmtxDisposeAttributes { target: string; children?: unknown }
export interface RmtxPrewarmAttributes { target: string; children?: unknown }
export interface RmtxRecycleAttributes { target: string; children?: unknown }
export interface RmtxDetachAttributes { target: string; children?: unknown }
export interface RmtxReattachAttributes { target: string; children?: unknown }
export interface RmtxStreamAttributes { target: string; children?: unknown }
export interface RmtxSourceAttributes { kind: "endpoint" | "sse" | "worker" | "selector" | "state" | "datasource" | "fixture" | "resource"; target: string; children?: never }
export interface RmtxPolicyAttributes { children?: unknown }
export interface RmtxSlotAttributes { name: string; children?: unknown }
export interface RmtxTrustBoundaryAttributes { boundary: string; children?: never }
export interface RmtxSanitizeAttributes { format: string; children?: never }
export interface RmtxHydrationAttributes { policy?: string; mode?: string; insularHydration?: boolean; children?: never }
export interface RmtxResumabilityAttributes { mode?: string; snapshot?: string; eventReplay?: string; integrity?: string; children?: never }
export interface RmtxIsolationAttributes { boundary?: string; mode?: string; children?: never }
export interface RmtxRemoteSurfaceAttributes { id: string; remoteId: string; children?: unknown }
export interface RmtxRemoteOwnerAttributes { id: string; children?: never }
export interface RmtxRemoteVersionAttributes { value: string; children?: never }
export interface RmtxRemoteOriginAttributes { value: string; children?: never }
export interface RmtxRemoteEventPayloadAttributes { value: string; children?: never }
export interface RmtxRemoteIntegrityAttributes { algorithm: "sha256" | "sha384" | "sha512"; digest: string; children?: never }
export interface RmtxRemoteTrustBoundaryAttributes { boundary: string; children?: never }
export interface RmtxRemoteFallbackAttributes { ref: string; children?: never }
export interface RmtxRemoteExposeAttributes { surface: string; lane: string; targetKind: string; target: string; children?: never }
export interface RmtxRemoteEventAttributes { surface: string; kind: "emits" | "consumes"; event: string; children?: unknown }
export interface RmtxRemoteEventDirectionAttributes { direction: "outbound" | "inbound"; children?: never }
export interface RmtxRemoteEventLaneAttributes { lane: string; children?: never }
export interface RmtxRemoteEventFromAttributes { kind: string; ref: string; children?: never }
export interface RmtxImportAttributes { path: string; mode?: "static_file" | "static_glob"; children?: never }
/** Source4 adds closed orchestration tags. Selecting a syntax version is explicit. */
export interface RmtxAuthoringNamespace extends Omit<RmtxAuthoringNamespaceV3, 'Portal' | 'Mount' | 'Input' | 'Lane' | 'On'> {
  readonly Input: (attributes: RmtxInputAttributesV4) => null;
  readonly Lane: (attributes: RmtxLaneAttributesV4) => null;
  readonly On: (attributes: RmtxOnAttributesV4) => null;
  readonly XTension: (attributes: RmtxXTensionAttributes) => null;
  readonly DataSource: (attributes: RmtxDataSourceAttributes) => null;
  readonly DataSourceMode: (attributes: RmtxDataSourceModeAttributes) => null;
  readonly DataSourceMethod: (attributes: RmtxDataSourceMethodAttributes) => null;
  readonly DataSourceContract: (attributes: RmtxDataSourceContractAttributes) => null;
  readonly DataSourceResult: (attributes: RmtxDataSourceResultAttributes) => null;
  readonly DataSourceFallback: (attributes: RmtxDataSourceFallbackAttributes) => null;
  readonly Status: (attributes: RmtxStatusAttributes) => null;
  readonly Execution: (attributes: RmtxExecutionAttributes) => null;
  readonly InputPolicy: (attributes: RmtxInputPolicyAttributes) => null;
  readonly Effect: (attributes: RmtxEffectAttributes) => null;
  readonly Recipe: (attributes: RmtxRecipeAttributes) => null;
  readonly Emit: (attributes: RmtxEmitAttributes) => null;
  readonly ResultHandler: (attributes: RmtxResultHandlerAttributes) => null;
  readonly Validation: (attributes: RmtxValidationAttributes) => null;
  readonly ValidationMode: (attributes: RmtxValidationModeAttributes) => null;
  readonly ValidationTarget: (attributes: RmtxValidationTargetAttributes) => null;
  readonly ValidationField: (attributes: RmtxValidationFieldAttributes) => null;
  readonly ValidationRule: (attributes: RmtxValidationRuleAttributes) => null;
  readonly ValidationInclude: (attributes: RmtxValidationIncludeAttributes) => null;
  readonly Animation: (attributes: RmtxAnimationAttributes) => null;
  readonly AnimationPreset: (attributes: RmtxAnimationPresetAttributes) => null;
  readonly AnimationEffect: (attributes: RmtxAnimationEffectAttributes) => null;
  readonly AnimationDuration: (attributes: RmtxAnimationDurationAttributes) => null;
  readonly AnimationEasing: (attributes: RmtxAnimationEasingAttributes) => null;
  readonly AnimationAllowFilter: (attributes: RmtxAnimationAllowFilterAttributes) => null;
  readonly AnimationReducedMotion: (attributes: RmtxAnimationReducedMotionAttributes) => null;
  readonly AnimationSpring: (attributes: RmtxAnimationSpringAttributes) => null;
  readonly AnimationKeyframe: (attributes: RmtxAnimationKeyframeAttributes) => null;
  readonly AnimationTimeline: (attributes: RmtxAnimationTimelineAttributes) => null;
  readonly AnimationTimelineStep: (attributes: RmtxAnimationTimelineStepAttributes) => null;
  readonly TransitionTimeline: (attributes: RmtxTransitionTimelineAttributes) => null;
  readonly TransitionTimelineStep: (attributes: RmtxTransitionTimelineStepAttributes) => null;
  readonly Transition: (attributes: RmtxTransitionAttributes) => null;
  readonly TransitionTrigger: (attributes: RmtxTransitionTriggerAttributes) => null;
  readonly TransitionFrom: (attributes: RmtxTransitionFromAttributes) => null;
  readonly TransitionTo: (attributes: RmtxTransitionToAttributes) => null;
  readonly TransitionDuration: (attributes: RmtxTransitionDurationAttributes) => null;
  readonly TransitionEasing: (attributes: RmtxTransitionEasingAttributes) => null;
  readonly TransitionLayoutKey: (attributes: RmtxTransitionLayoutKeyAttributes) => null;
  readonly TransitionEffect: (attributes: RmtxTransitionEffectAttributes) => null;
  readonly TransitionLane: (attributes: RmtxTransitionLaneAttributes) => null;
  readonly TransitionUseAnimation: (attributes: RmtxTransitionUseAnimationAttributes) => null;
  readonly TransitionInterrupt: (attributes: RmtxTransitionInterruptAttributes) => null;
  readonly TransitionReducedMotion: (attributes: RmtxTransitionReducedMotionAttributes) => null;
  readonly Portal: (attributes: RmtxPortalAttributesV4) => null;
  readonly Overlay: (attributes: RmtxOverlayAttributes) => null;
  readonly PortalPolicy: (attributes: RmtxPortalPolicyAttributes) => null;
  readonly OverlayPolicy: (attributes: RmtxOverlayPolicyAttributes) => null;
  readonly Resource: (attributes: RmtxResourceAttributes) => null;
  readonly ResourceImport: (attributes: RmtxResourceImportAttributes) => null;
  readonly ResourceSource: (attributes: RmtxResourceSourceAttributes) => null;
  readonly ResourceDispose: (attributes: RmtxResourceDisposeAttributes) => null;
  readonly SurfaceSource: (attributes: RmtxSurfaceSourceAttributes) => null;
  readonly SurfaceBounds: (attributes: RmtxSurfaceBoundsAttributes) => null;
  readonly SurfacePreserve: (attributes: RmtxSurfacePreserveAttributes) => null;
  readonly SurfaceDestroy: (attributes: RmtxSurfaceDestroyAttributes) => null;
  readonly SearchSource: (attributes: RmtxSearchSourceAttributes) => null;
  readonly SearchQuery: (attributes: RmtxSearchQueryAttributes) => null;
  readonly SearchResource: (attributes: RmtxSearchResourceAttributes) => null;
  readonly SearchFallbackResource: (attributes: RmtxSearchFallbackResourceAttributes) => null;
  readonly SearchWeight: (attributes: RmtxSearchWeightAttributes) => null;
  readonly SearchValue: (attributes: RmtxSearchValueAttributes) => null;
  readonly Mount: (attributes: RmtxMountAttributesV4) => null;
  readonly Hydrate: (attributes: RmtxHydrateAttributes) => null;
  readonly Suspend: (attributes: RmtxSuspendAttributes) => null;
  readonly Resume: (attributes: RmtxResumeAttributes) => null;
  readonly Invalidate: (attributes: RmtxInvalidateAttributes) => null;
  readonly Dispose: (attributes: RmtxDisposeAttributes) => null;
  readonly Prewarm: (attributes: RmtxPrewarmAttributes) => null;
  readonly Recycle: (attributes: RmtxRecycleAttributes) => null;
  readonly Detach: (attributes: RmtxDetachAttributes) => null;
  readonly Reattach: (attributes: RmtxReattachAttributes) => null;
  readonly Stream: (attributes: RmtxStreamAttributes) => null;
  readonly Source: (attributes: RmtxSourceAttributes) => null;
  readonly Policy: (attributes: RmtxPolicyAttributes) => null;
  readonly Slot: (attributes: RmtxSlotAttributes) => null;
  readonly TrustBoundary: (attributes: RmtxTrustBoundaryAttributes) => null;
  readonly Sanitize: (attributes: RmtxSanitizeAttributes) => null;
  readonly Hydration: (attributes: RmtxHydrationAttributes) => null;
  readonly Resumability: (attributes: RmtxResumabilityAttributes) => null;
  readonly Isolation: (attributes: RmtxIsolationAttributes) => null;
  readonly RemoteSurface: (attributes: RmtxRemoteSurfaceAttributes) => null;
  readonly RemoteOwner: (attributes: RmtxRemoteOwnerAttributes) => null;
  readonly RemoteVersion: (attributes: RmtxRemoteVersionAttributes) => null;
  readonly RemoteOrigin: (attributes: RmtxRemoteOriginAttributes) => null;
  readonly RemoteEventPayload: (attributes: RmtxRemoteEventPayloadAttributes) => null;
  readonly RemoteIntegrity: (attributes: RmtxRemoteIntegrityAttributes) => null;
  readonly RemoteTrustBoundary: (attributes: RmtxRemoteTrustBoundaryAttributes) => null;
  readonly RemoteFallback: (attributes: RmtxRemoteFallbackAttributes) => null;
  readonly RemoteExpose: (attributes: RmtxRemoteExposeAttributes) => null;
  readonly RemoteEvent: (attributes: RmtxRemoteEventAttributes) => null;
  readonly RemoteEventDirection: (attributes: RmtxRemoteEventDirectionAttributes) => null;
  readonly RemoteEventLane: (attributes: RmtxRemoteEventLaneAttributes) => null;
  readonly RemoteEventFrom: (attributes: RmtxRemoteEventFromAttributes) => null;
  readonly Import: (attributes: RmtxImportAttributes) => null;
}
/** Module API v4 exposes known names; syntax selection remains the compiler's responsibility. */
export declare const RMT: Readonly<RmtxAuthoringNamespace>;
export declare const model: RmtxLegacyReferenceNamespace;
export declare const input: RmtxLegacyReferenceNamespace;
export declare const selectors: Readonly<Record<string, unknown>>;
export declare const item: Readonly<Record<string, unknown>>;
export declare const params: Readonly<Record<string, unknown>>;
export declare const result: Readonly<Record<string, unknown>>;
export declare const error: Readonly<Record<string, unknown>>;
export declare const payload: Readonly<Record<string, unknown>>;
/** Declarative marker; calling it at runtime throws rather than executing a predicate. */
export declare function contains(value: unknown, search: unknown): boolean;
