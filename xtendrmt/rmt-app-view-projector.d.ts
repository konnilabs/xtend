export declare const RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA: 'xtend.rmt.app-presentation-view-port.v1';
export declare const RMT_APP_PRESENTATION_MODEL_SCHEMA: 'xtend.rmt.app-presentation-model.v1';

export interface RmtAppPresentationModel {
  readonly schema: typeof RMT_APP_PRESENTATION_MODEL_SCHEMA;
  readonly template: Readonly<Record<string, unknown>>;
  readonly model: Readonly<Record<string, unknown>>;
}

export interface RmtAppPresentationViewPort {
  readonly schema: typeof RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA;
  project(
    presentationModel: RmtAppPresentationModel,
    metadata?: Readonly<Record<string, unknown>>
  ): Readonly<Record<string, unknown>>;
}

export declare function createRmtAppPresentationViewPort(): RmtAppPresentationViewPort;

declare const api: {
  RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA: typeof RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA;
  RMT_APP_PRESENTATION_MODEL_SCHEMA: typeof RMT_APP_PRESENTATION_MODEL_SCHEMA;
  createRmtAppPresentationViewPort: typeof createRmtAppPresentationViewPort;
};

export default api;
