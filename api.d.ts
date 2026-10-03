import type { XTendStateRuntime } from './components/xtend-state';

export type XTendFeedbackType = 'info' | 'success' | 'warning' | 'error';
export type XTendManifest = Record<string, string>;
export type XTendThemeTokenMap = Record<string, string>;
export type XTendThemeRegistry = Record<string, Record<string, unknown>>;
export type XTendUnsubscribe = () => void;

export interface XTendApiReadyDetail {
  schema: 'xtend.api.ready.v1';
  toast: boolean;
  alert: boolean;
  dialog: boolean;
  modal: boolean;
  theme: boolean;
}

export interface XTendComplianceApi {
  version: string;
  getChecklist(): string[];
  getCoreContracts(): Record<string, string[]>;
  getThemeTokens(themeName?: string): XTendThemeTokenMap | Record<string, unknown>;
}

export interface XTendThemeChangePayload {
  theme?: string;
  currentTheme?: string;
  availableThemes?: string[];
  [key: string]: unknown;
}

export interface XTendThemeApi {
  getCurrentTheme(): string | null;
  getAvailableThemes(): string[];
  setTheme(themeName: string): boolean;
  set(name: string, value?: string): boolean;
  get(name?: string): string | null;
  subscribe(subscriber: (payload: XTendThemeChangePayload) => void): XTendUnsubscribe;
  toggleDarkMode(): boolean;
  loadExternalTheme(themeName: string, cssUrl: string): Promise<unknown>;
  registerTheme(name: string, properties?: XTendThemeTokenMap | Record<string, unknown>): boolean;
  removeTheme(themeName: string): boolean;
  getThemeInfo(themeName: string): Record<string, unknown> | null;
  getAllThemeInfo(): XTendThemeRegistry;
  hasTheme(themeName: string): boolean;
  getThemeRegistry(): XTendThemeRegistry;
  listenToSystemTheme(enabled?: boolean): void;
  [key: string]: unknown;
}

export interface XTendToastState {
  id: string;
  message: string;
  type: XTendFeedbackType;
  duration: number;
  timestamp: number;
}

export interface XTendToastApi {
  show(message: string, type?: XTendFeedbackType | string, duration?: number): HTMLElement;
  success(message: string, duration?: number): HTMLElement;
  error(message: string, duration?: number): HTMLElement;
  warning(message: string, duration?: number): HTMLElement;
  info(message: string, duration?: number): HTMLElement;
  clearAll(): void;
}

export interface XTendAlertOptions {
  closable?: boolean;
  duration?: number;
  overlay?: boolean;
  ariaLabel?: string;
}

export interface XTendAlertState extends XTendAlertOptions {
  id: string;
  message: string;
  type: XTendFeedbackType;
  closable: boolean;
  overlay: boolean;
  ariaLabel: string | null;
  timestamp: number;
}

export interface XTendAlertApi {
  show(message: string, type?: XTendFeedbackType | string, options?: XTendAlertOptions): HTMLElement;
  success(message: string, options?: XTendAlertOptions): HTMLElement;
  error(message: string, options?: XTendAlertOptions): HTMLElement;
  warning(message: string, options?: XTendAlertOptions): HTMLElement;
  info(message: string, options?: XTendAlertOptions): HTMLElement;
}

export interface XTendDialogAction {
  label?: string;
  action?: string;
  primary?: boolean;
  close?: boolean;
  [key: string]: unknown;
}

export interface XTendDialogOptions {
  title?: string;
  content?: string;
  overlay?: boolean;
  actions?: XTendDialogAction[];
  [key: string]: unknown;
}

export interface XTendDialogState {
  id: string;
  title: string;
  content: string;
  hasOverlay: boolean;
  actions: XTendDialogAction[];
  timestamp: number;
  open: boolean;
}

export interface XTendDialogApi {
  show(options?: XTendDialogOptions): string;
  close(dialogId: string): void;
}

export interface XTendModalOptions extends XTendDialogOptions {}

export interface XTendModalState extends XTendDialogState {}

export interface XTendModalApi {
  show(options?: XTendModalOptions): string;
  close(modalId: string): void;
}

export interface XTendUiState {
  toasts: XTendToastState[];
  alerts: XTendAlertState[];
  dialogs: XTendDialogState[];
  modals: XTendModalState[];
}

export interface XTendNamespace {
  state?: XTendStateRuntime;
  compliance?: XTendComplianceApi;
  theme?: XTendThemeApi;
  themeRuntime?: unknown;
  toast?: XTendToastApi;
  alert?: XTendAlertApi;
  dialog?: XTendDialogApi;
  modal?: XTendModalApi;
  [key: string]: unknown;
}

export function initXTendAPI(manifest?: XTendManifest): Promise<void>;

declare global {
  interface Window {
    XTend?: XTendNamespace;
    XTheme?: XTendThemeApi;
    XToast?: XTendToastApi;
    XAlert?: XTendAlertApi;
    XDialog?: XTendDialogApi;
    XModal?: XTendModalApi;
    showToast?: XTendToastApi['show'];
    showAlert?: XTendAlertApi['show'];
    showDialog?: XTendDialogApi['show'];
    showModal?: XTendModalApi['show'];
  }

  interface WindowEventMap {
    'xtend-api-ready': CustomEvent<XTendApiReadyDetail>;
  }
}
