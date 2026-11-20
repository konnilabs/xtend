import type { RmtProjectOptions, RmtProjectCompileResult } from './rmt-project';
export declare const RMT_PROJECT_WATCH_API_VERSION:'1.0.0';
export declare const RMT_PROJECT_WATCH_SCHEMA:'xtend.rmt.project-watch.v1';
export interface RmtProjectWatcherOptions extends RmtProjectOptions {
  entryFile?:string;filePath?:string;intervalMs?:number;onResult?:(result:RmtProjectCompileResult)=>void;
}
export interface RmtProjectWatcher {
  readonly apiVersion:'1.0.0';readonly schema:'xtend.rmt.project-watch.v1';
  poll():{changed:boolean;identity:string;result:RmtProjectCompileResult};
  start():RmtProjectWatcher;
  snapshot():{updates:number;running:boolean;closed:boolean;compilations:number;hits:number;documents:number};
  dispose():void;
}
export declare function createRmtProjectWatcher(options?:RmtProjectWatcherOptions):RmtProjectWatcher;
