export interface XtendMcpServerOptions {
  workspaceRoots?: string[];
  allowWorkspaceWrite?: boolean;
  bundleDir?: string;
  knowledgeDir?: string;
}

export declare const XTEND_MCP_VERSION: '0.2.0';
export interface XtendMcpSourceInput {
  source?:string;
  path?:string;
  sourceSyntax?:'rmt-vnext'|'rmtx';
  rmtxSyntaxVersion?:'1.0.0'|'2.0.0'|'3.0.0'|'4.0.0'|'5.0.0'|'6.0.0'|'7.0.0'|'8.0.0';
  rmtxProvidersFile?:string;
  project?:boolean;
}
export declare const XTEND_MCP_RESULT_SCHEMA: 'xtend.mcp.tool-result.v1';
export declare function createXtendMcpServer(options?: XtendMcpServerOptions): unknown;
export declare function createXtendMcpServerFactory(options?: XtendMcpServerOptions): () => unknown;
