import controllerApi from './rmt-app-runtime.js';
import {
  RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA,
  createRmtAppPresentationViewPort
} from './rmt-app-view-projector.js';
import {
  RMT_APP_HOST_PORT_SCHEMA,
  createRmtAppHostAdapter
} from './rmt-app-host-adapter.js';

export * from './rmt-app-runtime.js';
export {
  RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA,
  createRmtAppPresentationViewPort
} from './rmt-app-view-projector.js';
export {
  RMT_APP_HOST_PORT_SCHEMA,
  createRmtAppHostAdapter
} from './rmt-app-host-adapter.js';

declare const api: typeof controllerApi & {
  RMT_APP_HOST_PORT_SCHEMA: typeof RMT_APP_HOST_PORT_SCHEMA;
  createRmtAppHostAdapter: typeof createRmtAppHostAdapter;
  RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA: typeof RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA;
  createRmtAppPresentationViewPort: typeof createRmtAppPresentationViewPort;
};

export default api;
