export const RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA: 'xtend.rmt.state-binding-view-projector.v1';
export const RMT_STATE_BINDING_APPLICATION_SCHEMA: 'xtend.epic18.rmt-state-binding-application.v1';
export const RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA: 'xtend.rmt.state-binding-diagnostic.v1';

export interface RmtStateBindingModelSnapshot {
  readonly schema?: string;
  readonly states: Readonly<Record<string, unknown>>;
  readonly selectors: Readonly<Record<string, unknown>>;
  readonly derived: Readonly<Record<string, unknown>>;
  readonly model?: Readonly<Record<string, unknown>>;
}

export interface RmtStateBindingDomRenderer {
  commit(request: {
    operation: 'merge-element';
    target: Element;
    descriptor: unknown;
    context?: Record<string, unknown>;
    ownership?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): unknown;
}

export interface RmtStateBindingViewProjectorOptions {
  strategy?: 'attribute-sync' | string;
  domRenderer?: RmtStateBindingDomRenderer;
  /** @deprecated Use domRenderer. */
  renderer?: RmtStateBindingDomRenderer;
  strict?: boolean;
  strictMaraca?: boolean;
  documentTarget?: Document;
  createDomRenderer?: (options: Record<string, unknown>) => RmtStateBindingDomRenderer;
  componentRegistry?: unknown;
  registry?: unknown;
  context?: Record<string, unknown>;
  ownership?: Record<string, unknown>;
  diagnosticsHub?: { publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown };
  diagnosticChannel?: string;
  domDiagnosticChannel?: string;
  publishDiagnostic?: (diagnostic: unknown) => void;
}

export interface RmtStateBindingApplication {
  schema: typeof RMT_STATE_BINDING_APPLICATION_SCHEMA;
  projectorSchema: typeof RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA;
  strategy: 'attribute-sync' | string;
  replacedRoot: false;
  operationCount: number;
  operations: ReadonlyArray<Readonly<Record<string, unknown>>>;
  commitResults: ReadonlyArray<unknown>;
  diagnostics: ReadonlyArray<unknown>;
}

export interface RmtStateBindingViewProjector {
  readonly schema: typeof RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA;
  project(
    root: Element,
    bindings: readonly unknown[],
    modelSnapshot: Readonly<RmtStateBindingModelSnapshot>,
    metadata?: Record<string, unknown>
  ): RmtStateBindingApplication;
  listDiagnostics(): unknown[];
  dispose(): {
    schema: typeof RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA;
    disposed: true;
    alreadyDisposed: boolean;
  };
}

export function createRmtStateBindingViewProjector(
  options?: RmtStateBindingViewProjectorOptions
): RmtStateBindingViewProjector;

declare const api: {
  RMT_STATE_BINDING_APPLICATION_SCHEMA: typeof RMT_STATE_BINDING_APPLICATION_SCHEMA;
  RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA: typeof RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA;
  RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA: typeof RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA;
  createRmtStateBindingViewProjector: typeof createRmtStateBindingViewProjector;
};

export default api;
