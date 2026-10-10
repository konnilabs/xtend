export interface LaravelPackageBuildOptions {
  rootDir?: string;
  output?: string;
  archiveTool?: 'tar';
  php?: string;
}
export interface LaravelPackageBuildResult {
  directory: string;
  archive: string;
  sha256: string;
  files: Record<string, string>;
}
export declare function buildLaravelPackage(options?: LaravelPackageBuildOptions): LaravelPackageBuildResult;
