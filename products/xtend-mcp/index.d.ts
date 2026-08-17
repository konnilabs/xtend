export interface XtendMcpServerOptions {
  workspaceRoots?: string[];
  allowWorkspaceWrite?: boolean;
  bundleDir?: string;
  knowledgeDir?: string;
}

export declare const XTEND_MCP_VERSION: '0.1.0';
export declare const XTEND_MCP_RESULT_SCHEMA: 'xtend.mcp.tool-result.v1';
export declare function createXtendMcpServer(options?: XtendMcpServerOptions): unknown;
export declare function createXtendMcpServerFactory(options?: XtendMcpServerOptions): () => unknown;
