import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XPlayerAttributeName = 'src' | 'poster' | 'type' | 'media-chooser' | 'downloadable' | 'autoplay' | 'title' | 'height' | 'width';
export type XPlayerEventName = 'xplayer-play' | 'xplayer-pause' | 'xplayer-fullscreen' | 'xplayer-pip' | 'xplayer-caption' | 'xplayer-mute';
export type XPlayerLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-player'>;

export interface XPlayerPlaybackEventDetail {
  currentTime: number;
}

export interface XPlayerFullscreenEventDetail {
  fullscreen: boolean;
}

export interface XPlayerMuteEventDetail {
  muted: boolean;
}

export interface XPlayerEmptyEventDetail {
  [key: string]: never;
}

export interface XPlayerSnapshot {
  schema: 'xtend.component.layout-display-media-snapshot.v1';
  componentRef: 'x-player';
  stateKey: string;
  schedule: 'media.lazy.load';
  src: string | null;
  type: string;
  playing: boolean;
  currentTime: number;
}

export interface XPlayerEventDetailMap {
  'xplayer-play': XPlayerPlaybackEventDetail;
  'xplayer-pause': XPlayerPlaybackEventDetail;
  'xplayer-fullscreen': XPlayerFullscreenEventDetail;
  'xplayer-pip': XPlayerEmptyEventDetail;
  'xplayer-caption': XPlayerEmptyEventDetail;
  'xplayer-mute': XPlayerMuteEventDetail;
}

export type XPlayerEventMap = XtendCustomEventMap<XPlayerEventDetailMap>;
export type XPlayerPublicEventContract = XtendPublicEventContract<XPlayerEventName, XPlayerPlaybackEventDetail | XPlayerFullscreenEventDetail | XPlayerMuteEventDetail | XPlayerEmptyEventDetail>;

export interface XPlayerElement extends HTMLElement {
  snapshot(): XPlayerSnapshot;
  addEventListener<K extends keyof XPlayerEventMap>(type: K, listener: (event: XPlayerEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-player': XPlayerElement;
  }
}

export {};
