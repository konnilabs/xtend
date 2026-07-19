export interface RmtAppScaffoldInput {
  rootDir?: string;
  runtime?: 'maraca' | string;
  designKit?: 'none' | 'native' | 'neutral' | string;
  server?: 'none' | 'node' | 'php' | 'both' | string;
  out?: string;
  name?: string;
  title?: string;
  write?: boolean | string;
  check?: boolean | string;
  force?: boolean | string;
}

export function createRmtAppScaffold(input?: RmtAppScaffoldInput, options?: { rootDir?: string }): Record<string, unknown>;
