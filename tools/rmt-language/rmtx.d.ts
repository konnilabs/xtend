import type { RmtJsonValue } from './rmt-tooling-public-types';
/** Static markers. Model/item fields are compiler-checked; no model type SDK is implied. */
export declare const RMTX_AUTHORING_API_VERSION: '2.0.0';
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
export interface RmtxAuthoringNamespace {
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
/** Module API v2 exposes the known names; syntax selection remains the compiler's responsibility. */
export declare const RMT: Readonly<RmtxAuthoringNamespace>;
export declare const model: RmtxLegacyReferenceNamespace;
export declare const input: RmtxLegacyReferenceNamespace;
export declare const selectors: Readonly<Record<string, unknown>>;
export declare const item: Readonly<Record<string, unknown>>;
export declare const params: Readonly<Record<string, unknown>>;
/** Declarative marker; calling it at runtime throws rather than executing a predicate. */
export declare function contains(value: unknown, search: unknown): boolean;
