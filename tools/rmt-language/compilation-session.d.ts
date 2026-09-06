export interface RmtCompilationSession {
  compileSource(input:{text:string;filePath?:string},options?:Record<string,unknown>):ReturnType<typeof import('./vnext-compiler').compileRmtVNextSource>;
  snapshot():{compilations:number;hits:number;documents:number};
  dispose():void;
}
export function createRmtCompilationSession(options?:{root?:string}):RmtCompilationSession;
