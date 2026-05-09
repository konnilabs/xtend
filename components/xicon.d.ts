import type { XtendCustomEventMap, XtendPublicEventContract } from './xtend-public-types';

export type XIconAttributeName = 'name' | 'pack' | 'src' | 'label' | 'size' | 'stroke-width' | 'color' | 'decorative';
export type XIconEventName = 'icon-ready' | 'icon-missing' | 'icon-pack-registered';
export type XIconSourceKind = 'path' | 'svg' | 'url' | 'missing';

export interface XIconNodeDescriptor {
  tag?: 'path' | 'line' | 'circle' | 'rect' | 'polyline' | 'polygon' | 'ellipse' | 'g' | string;
  attrs?: Record<string, string | number | boolean | null | undefined>;
}

export interface XIconSourceRecord {
  schema?: 'xtend.icon.source.v1';
  name?: string;
  kind?: XIconSourceKind;
  aliases?: string[];
  nodes?: XIconNodeDescriptor[];
  paths?: Array<string | { d: string; attrs?: Record<string, string | number> }>;
  d?: string;
  path?: string;
  svg?: string;
  src?: string;
  url?: string;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  metadata?: Record<string, unknown>;
}

export interface XIconPack {
  schema?: string;
  id: string;
  label?: string;
  source?: string;
  distribution?: 'bundled' | 'local-build' | 'runtime' | string;
  cdnAllowed?: boolean;
  viewBox?: string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  icons: Record<string, string | XIconSourceRecord>;
  metadata?: Record<string, unknown>;
}

export interface XIconResolvedSource {
  schema: 'xtend.icon.source.v1';
  pack: string;
  packLabel?: string;
  source?: string;
  distribution?: string;
  cdnAllowed?: boolean;
  record: XIconSourceRecord;
}

export interface XIconRegistrySnapshotPack {
  id: string;
  label?: string;
  source?: string;
  distribution?: string;
  cdnAllowed: boolean;
  iconCount: number;
  aliases: number;
}

export interface XIconRegistrySnapshot {
  schema: 'xtend.icon.registry.v1';
  defaultPack: string;
  packs: XIconRegistrySnapshotPack[];
}

export interface XIconSnapshot {
  schema: 'xtend.component.x-icon.state.v1';
  componentRef: 'x-icon';
  id: string | null;
  name: string;
  pack: string;
  src: string;
  mode: XIconSourceKind;
  resolved: boolean;
  decorative: boolean;
  label: string;
  size: string;
  strokeWidth: string;
  color: string;
  registry: XIconRegistrySnapshot;
}

export interface XIconEventDetail {
  schema: 'xtend.component.x-icon.ready.v1' | 'xtend.component.x-icon.missing.v1' | 'xtend.icon-pack.registered.v1';
  componentRef?: 'x-icon';
  id?: string | null;
  name?: string;
  pack?: string;
  src?: string;
  source?: string;
  distribution?: string | null;
  resolved?: boolean;
  iconCount?: number;
  cdnAllowed?: boolean;
}

export interface XIconEventDetailMap {
  'icon-ready': XIconEventDetail;
  'icon-missing': XIconEventDetail;
  'icon-pack-registered': XIconEventDetail;
}

export type XIconEventMap = XtendCustomEventMap<XIconEventDetailMap>;
export type XIconPublicEventContract = XtendPublicEventContract<XIconEventName, XIconEventDetail>;

export interface XIconElement extends HTMLElement {
  name: string;
  registerPack(pack: XIconPack, options?: { prepend?: boolean; default?: boolean }): XIconPack;
  setIcon(name: string, options?: { pack?: string; label?: string; src?: string }): XIconSnapshot;
  snapshot(): XIconSnapshot;
  addEventListener<K extends keyof XIconEventMap>(type: K, listener: (event: XIconEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

export function registerIconPack(pack: XIconPack, options?: { prepend?: boolean; default?: boolean }): XIconPack;
export function resolveIcon(name: string, options?: { pack?: string }): XIconResolvedSource | null;
export function getIconRegistrySnapshot(): XIconRegistrySnapshot;
export function createXTendCoreIconPack(overrides?: Partial<XIconPack>): XIconPack;
export function createXTendLucideIconPack(overrides?: Partial<XIconPack>): XIconPack;

declare global {
  interface HTMLElementTagNameMap {
    'x-icon': XIconElement;
  }

  interface Window {
    XTend?: {
      icons?: {
        schema: 'xtend.icon.registry.v1';
        register(pack: XIconPack, options?: { prepend?: boolean; default?: boolean }): XIconPack;
        resolve(name: string, options?: { pack?: string }): XIconResolvedSource | null;
        snapshot(): XIconRegistrySnapshot;
        createCorePack(overrides?: Partial<XIconPack>): XIconPack;
        createLucidePack(overrides?: Partial<XIconPack>): XIconPack;
      };
      [key: string]: unknown;
    };
  }
}

export {};
