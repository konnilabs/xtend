export interface RmtCompilationSession {
  readonly apiVersion:'2.0.0';
  readonly schema:'xtend.rmt.compilation-session.v2';
  compileSource(input:{text:string;filePath?:string},options:Record<string,unknown>&{project:true}):ReturnType<typeof import('./rmt-project').compileRmtProjectSource>;
  compileSource(input:{text:string;filePath?:string},options?:Record<string,unknown>):ReturnType<typeof import('./vnext-compiler').compileRmtVNextSource>;
  compileProjectSource:typeof import('./rmt-project').compileRmtProjectSource;
  invalidate():number;
  snapshot():{compilations:number;hits:number;documents:number};
  dispose():void;
}
export declare const RMT_COMPILATION_SESSION_API_VERSION:'2.0.0';
export declare const RMT_COMPILATION_SESSION_SCHEMA:'xtend.rmt.compilation-session.v2';
export type RmtProjectCompilationSession=Omit<RmtCompilationSession,'compileSource'>&{compileSource:typeof import('./rmt-project').compileRmtProjectSource};
export function createRmtCompilationSession(options:{root?:string;applyDefaultDocumentId?:boolean;readonlyResults?:boolean;maxEntries?:number;project:true;sourceSyntax?:'rmt-vnext'|'rmtx';rmtxSyntaxVersion?:string;rmtxProvidersFile?:string}):RmtProjectCompilationSession;
export function createRmtCompilationSession(options?:{root?:string;applyDefaultDocumentId?:boolean;readonlyResults?:boolean;maxEntries?:number;project?:false;sourceSyntax?:'rmt-vnext'|'rmtx';rmtxSyntaxVersion?:string;rmtxProvidersFile?:string}):RmtCompilationSession;
