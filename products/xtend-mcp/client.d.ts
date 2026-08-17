export interface XtendMcpClientOptions {
  command?: string;
  args?: string[];
  cwd?: string;
  workspaceRoots?: string[];
  bundleDir?: string;
  knowledgeDir?: string;
}

export declare function createXtendMcpClient(options?: XtendMcpClientOptions): Promise<unknown>;
export declare function executeRmtKnowledgeViaMcp(request: unknown, options?: XtendMcpClientOptions): Promise<unknown>;
export declare function closeXtendMcpClient(): Promise<void>;
