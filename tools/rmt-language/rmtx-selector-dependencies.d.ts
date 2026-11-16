export declare const RMTX_SELECTOR_DEPENDENCIES_SCHEMA: 'xtend.rmtx.selector-dependencies.v1';
export interface RmtxSelectorDependencyRead {
  readonly symbol: string;
  readonly path: readonly string[];
  readonly reference: string;
}
export interface RmtxSelectorDependencyEntry {
  readonly id: string;
  readonly source: Readonly<{ kind: 'state' | 'selector'; symbol: string }>;
  /** Direct reads include the source and every static predicate branch. */
  readonly stateReads: readonly RmtxSelectorDependencyRead[];
  readonly selectorReads: readonly RmtxSelectorDependencyRead[];
  /** Direct State reads plus the State reads of referenced selectors. */
  readonly transitiveStateReads: readonly RmtxSelectorDependencyRead[];
  /** Local row/parameter paths; parameter arguments do not flow into dependencies. */
  readonly rowPaths: readonly (readonly string[])[];
  readonly parameterPaths: readonly (readonly string[])[];
}
export interface RmtxSelectorDependencyReport {
  readonly schema: typeof RMTX_SELECTOR_DEPENDENCIES_SCHEMA;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '2.0.0' }>;
  readonly topologicalOrder: readonly string[];
  readonly selectors: readonly RmtxSelectorDependencyEntry[];
  readonly incrementalRecomputation: false;
  readonly runtimeTracking: false;
  readonly parametersForwardedToDependencies: false;
}
/** Pure summary of successful backend facts; does not grant runtime authority. */
export declare function createRmtxSelectorDependencyReport(result: unknown): RmtxSelectorDependencyReport;
