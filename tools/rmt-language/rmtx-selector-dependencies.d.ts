export declare const RMTX_SELECTOR_DEPENDENCIES_SCHEMA: 'xtend.rmtx.selector-dependencies.v1';
export declare const RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2: 'xtend.rmtx.selector-dependencies.v2';
export declare const RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V3: 'xtend.rmtx.selector-dependencies.v3';
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
/** New source-profile metadata is separate from the unchanged v1 report. */
export interface RmtxSelectorDependencyReportV2 extends Omit<RmtxSelectorDependencyReport, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '3.0.0' }>;
}
/** Pure summary of successful backend facts; does not grant runtime authority. */
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '3.0.0' }>; [metadata: string]: unknown }): RmtxSelectorDependencyReportV2;
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile?: undefined; parserResult: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '3.0.0' }>; [metadata: string]: unknown }; [metadata: string]: unknown }): RmtxSelectorDependencyReportV2;
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '2.0.0' }>; [metadata: string]: unknown }): RmtxSelectorDependencyReport;
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile?: undefined; parserResult: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '2.0.0' }>; [metadata: string]: unknown }; [metadata: string]: unknown }): RmtxSelectorDependencyReport;
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '2.0.0' | '3.0.0' }>; [metadata: string]: unknown }): RmtxSelectorDependencyReport | RmtxSelectorDependencyReportV2;
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile?: undefined; parserResult: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '2.0.0' | '3.0.0' }>; [metadata: string]: unknown }; [metadata: string]: unknown }): RmtxSelectorDependencyReport | RmtxSelectorDependencyReportV2;
export declare function createRmtxSelectorDependencyReport(result: unknown): RmtxSelectorDependencyReport;
export interface RmtxSelectorDependencyReportV3 extends Omit<RmtxSelectorDependencyReport, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V3;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '4.0.0' }>;
}
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '4.0.0' }>; [metadata: string]: unknown }): RmtxSelectorDependencyReportV3;

export declare const RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V4: 'xtend.rmtx.selector-dependencies.v4';
export interface RmtxSelectorDependencyReportV4 extends Omit<RmtxSelectorDependencyReport, 'schema' | 'sourceProfile'> {
  readonly schema: typeof RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V4;
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '5.0.0' }>;
}
export declare function createRmtxSelectorDependencyReport(result: { sourceProfile: Readonly<{ syntax: 'rmtx'; version: '5.0.0' }>; [metadata: string]: unknown }): RmtxSelectorDependencyReportV4;
