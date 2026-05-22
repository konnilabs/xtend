import type { XtendCustomEventMap, XtendLayoutDisplayMediaUxProfile, XtendPublicEventContract } from './xtend-public-types';

export type XPlayerAttributeName = 'src' | 'poster' | 'type' | 'media-chooser' | 'downloadable' | 'autoplay' | 'title' | 'height' | 'width';
export type XPlayerEventName = 'xplayer-play' | 'xplayer-pause' | 'xplayer-state' | 'xplayer-fullscreen' | 'xplayer-pip' | 'xplayer-caption' | 'xplayer-mute';
export type XPlayerLayoutDisplayMediaUxProfile = XtendLayoutDisplayMediaUxProfile<'x-player'>;
export type XPlayerRmtCommandName = 'play-media' | 'pause-media' | 'set-source' | 'set-state' | 'apply-theme' | 'play' | 'pause';

export interface XPlayerPlaybackEventDetail {
  currentTime: number;
}

export interface XPlayerFullscreenEventDetail {
  fullscreen: boolean;
}

export interface XPlayerMuteEventDetail {
  muted: boolean;
}

export interface XPlayerStateEventDetail {
  src?: string | null;
  type?: string;
  playing: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
  fullscreen?: boolean;
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
  'xplayer-state': XPlayerStateEventDetail;
  'xplayer-fullscreen': XPlayerFullscreenEventDetail;
  'xplayer-pip': XPlayerEmptyEventDetail;
  'xplayer-caption': XPlayerEmptyEventDetail;
  'xplayer-mute': XPlayerMuteEventDetail;
}

export type XPlayerEventMap = XtendCustomEventMap<XPlayerEventDetailMap>;
export type XPlayerPublicEventContract = XtendPublicEventContract<XPlayerEventName, XPlayerPlaybackEventDetail | XPlayerStateEventDetail | XPlayerFullscreenEventDetail | XPlayerMuteEventDetail | XPlayerEmptyEventDetail>;

export interface XPlayerRmtPlayerContract {
  schema: 'xtend.mm-rmt.player-contract.v1';
  tag: 'x-player';
  commands: XPlayerRmtCommandName[];
  events: XPlayerEventName[];
  stateKey: 'xplayer-state-<id>';
  stateBridge: 'xstate-host-bridge';
  themeTokens: string[];
  parts: string[];
}

export interface XPlayerRmtCommand {
  kind?: XPlayerRmtCommandName;
  type?: XPlayerRmtCommandName;
  command?: XPlayerRmtCommandName;
  src?: string;
  source?: string;
  typeHint?: string;
  poster?: string;
  state?: Partial<XPlayerStateEventDetail>;
  tokens?: Record<string, string | number>;
  theme?: Record<string, string | number>;
}

export interface XPlayerElement extends HTMLElement {
  snapshot(): XPlayerSnapshot;
  getRmtPlayerContract(): XPlayerRmtPlayerContract;
  applyRmtPlayerCommand(command: XPlayerRmtCommandName | XPlayerRmtCommand, payload?: Record<string, unknown>): Promise<XPlayerSnapshot> | XPlayerStateEventDetail | { schema: 'xtend.mm-rmt.player-theme-report.v1'; tokenCount: number };
  playMedia(): Promise<XPlayerSnapshot>;
  pauseMedia(): XPlayerStateEventDetail;
  setMediaState(patch?: Partial<XPlayerStateEventDetail>): XPlayerStateEventDetail;
  applyRmtThemeTokens(tokens?: Record<string, string | number>): { schema: 'xtend.mm-rmt.player-theme-report.v1'; tokenCount: number };
  addEventListener<K extends keyof XPlayerEventMap>(type: K, listener: (event: XPlayerEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'x-player': XPlayerElement;
  }
}

export {};
