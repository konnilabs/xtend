import type {RmtResumeIntent} from './rmt-resume-runtime.js';
export interface RmtResumeCaptureAdapter {
  readonly schema:'xtend.rmt.resume-capture-adapter.v1';
  captureIntent(input?:Record<string,unknown>):RmtResumeIntent|null;
  install(root:Element, events?:Readonly<Record<string,unknown>>[], options?:{generation?:string;intercept?:boolean;mapPayload?(record:Record<string,unknown>,event:Event,target:Element):Record<string,unknown>}):{readonly status:string;snapshot():RmtResumeIntent[];dispose():void};
  listIntents():RmtResumeIntent[];
  clearIntents():RmtResumeIntent[];
  listDiagnostics():Record<string,unknown>[];
}
export function createRmtResumeCaptureAdapter(options?:{generation?:string;now?():number;publishDiagnostic?(diagnostic:Record<string,unknown>):void}):RmtResumeCaptureAdapter;
