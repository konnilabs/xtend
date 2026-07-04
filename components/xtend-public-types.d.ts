export type XtendAttributeValue = string | null;
export type XtendBooleanAttribute = '' | 'true' | 'false' | boolean;
export type XtendRouteMode = 'hash' | 'history';
export type XtendEventSource =
  | 'x-alert'
  | 'x-toast'
  | 'x-modal'
  | 'x-router'
  | 'x-link'
  | 'x-input'
  | 'x-select'
  | 'x-checkbox'
  | 'x-toggle'
  | 'x-radio'
  | 'x-rmt-lifecycle-demo-build'
  | 'x-textarea'
  | 'x-form'
  | 'x-tabs'
  | 'x-dialog'
  | 'x-lightbox'
  | 'x-calendar'
  | 'x-writer'
  | 'x-theme'
  | 'x-button'
  | 'x-icon'
  | 'x-spinner'
  | 'x-menu'
  | 'xstate'
  | 'x-summary'
  | 'x-player'
  | 'x-section'
  | 'x-cards'
  | 'x-header'
  | 'x-footer'
  | 'x-hero'
  | 'x-type'
  | 'x-code'
  | 'x-masonry'
  | 'x-utils';

export type XtendFormControlFamily =
  | 'text-entry'
  | 'selection'
  | 'date-entry'
  | 'form-host'
  | 'rich-text-entry';

export interface XtendFormControlUxProfile<ComponentRef extends string = string> {
  schema: 'xtend.component.form-control-ux-profile.v1';
  componentRef: ComponentRef;
  family: XtendFormControlFamily;
  role: string;
  valueMode: string;
  slots: string[];
  parts: string[];
  events: string[];
  commands: string[];
  stateKey: string;
  schedule: string;
  fabric: {
    lane: string;
    a11yLane?: string;
    diagnosticsLane?: string;
  };
  rmt: Record<string, unknown>;
  validation: Record<string, unknown>;
}

export type XtendFeedbackStatusFamily =
  | 'alert'
  | 'toast'
  | 'inline-status'
  | 'progress'
  | 'spinner';

export interface XtendFeedbackStatusUxProfile<ComponentRef extends string = string> {
  schema: 'xtend.component.feedback-status-ux-profile.v1';
  componentRef: ComponentRef;
  family: XtendFeedbackStatusFamily;
  role: string;
  severityModel: string;
  liveRegion: string;
  timeoutMode: string;
  dismissMode: string;
  events: string[];
  commands: string[];
  stateKey: string;
  schedule: string;
  fabric: {
    lane: string;
    a11yLane?: string;
    diagnosticsLane?: string;
  };
  rmt: Record<string, unknown>;
  statusSemantics: Record<string, unknown>;
}

export type XtendNavigationRoutingFamily =
  | 'router-outlet'
  | 'router-link';

export interface XtendNavigationRoutingUxProfile<ComponentRef extends string = string> {
  schema: 'xtend.component.navigation-routing-ux-profile.v1';
  componentRef: ComponentRef;
  family: XtendNavigationRoutingFamily;
  role: string;
  navigationMode: string;
  activeState: string;
  focusRestore: string;
  routeAnnouncement: string;
  keyboardNavigation: string;
  events: string[];
  commands: string[];
  stateKey: string;
  schedule: string;
  fabric: {
    lane: string;
    a11yLane?: string;
    diagnosticsLane?: string;
  };
  rmt: Record<string, unknown>;
  statusSemantics: Record<string, unknown>;
}

export type XtendOverlayInteractionFamily =
  | 'modal-dialog'
  | 'dialog'
  | 'popover'
  | 'tooltip'
  | 'drawer';

export interface XtendOverlayInteractionUxProfile<ComponentRef extends string = string> {
  schema: 'xtend.component.overlay-interaction-ux-profile.v1';
  componentRef: ComponentRef;
  family: XtendOverlayInteractionFamily;
  role: string;
  modality: string;
  focusTrap: string;
  inertStrategy: string;
  escapeBehavior: string;
  outsideClick: string;
  scrollLock: string;
  portalStrategy: string;
  events: string[];
  commands: string[];
  stateKey: string;
  schedule: string;
  fabric: {
    lane: string;
    a11yLane?: string;
    diagnosticsLane?: string;
  };
  rmt: Record<string, unknown>;
  overlaySemantics: Record<string, unknown>;
}

export type XtendLayoutDisplayMediaFamily =
  | 'layout-section'
  | 'layout-cards'
  | 'layout-header'
  | 'layout-footer'
  | 'display-hero'
  | 'display-text-effect'
  | 'display-code'
  | 'layout-masonry'
  | 'display-disclosure'
  | 'media-player'
  | 'media-lightbox';

export interface XtendLayoutDisplayMediaUxProfile<ComponentRef extends string = string> {
  schema: 'xtend.component.layout-display-media-ux-profile.v1';
  componentRef: ComponentRef;
  family: XtendLayoutDisplayMediaFamily;
  role: string;
  contentKind: string;
  responsiveStrategy: string;
  lazyPolicy: string;
  overflowPolicy: string;
  aspectRatio: string;
  events: string[];
  commands: string[];
  stateKey: string;
  schedule: string;
  fabric: {
    lane: string;
    mediaLane?: string;
    a11yLane?: string;
    diagnosticsLane?: string;
  };
  rmt: Record<string, unknown>;
}

export interface XtendPublicEventContract<Name extends string, Detail> {
  schema: 'xtend.enterprise.er-wp-34.public-component-types.v1';
  name: Name;
  detail: Detail;
  bubbles: boolean;
  composed: boolean;
  source: XtendEventSource;
}

export interface XtendStateDetail {
  id?: string;
  stateKey?: string;
}

export type XtendCustomEventMap<T> = {
  [Name in keyof T]: CustomEvent<T[Name]>;
};
