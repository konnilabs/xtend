export interface XtendMcpTransportOptions {
  workspaceRoots?: string[];
  allowWorkspaceWrite?: boolean;
  bundleDir?: string;
  knowledgeDir?: string;
}

export interface XtendMcpHttpOptions extends XtendMcpTransportOptions {
  port?: number;
  token?: string;
}

export declare function startXtendMcpStdio(options?: XtendMcpTransportOptions): unknown;
export declare function startXtendMcpHttp(options?: XtendMcpHttpOptions): Promise<unknown>;
