import type { PageManifest } from '@ccslabs/xtend-rmt/page-contract';
import type { JsonValue } from '@ccslabs/xtend-rmt/portable-render';
export interface PageBuildDefinition { source: string; maraca?:{entry:string}; inputs?: string[]; defaults?: Record<string,JsonValue>; layout?: string; head?: NonNullable<PageManifest['pages'][string]['head']> }
export interface PageBuildConfiguration {
  schema?: 'xtend.page-build.v1';
  assetRoot?: string; target?: 'node' | 'php' | 'both'; host?: 'laravel'; output?: string;
  assets?: PageManifest['assets'];
  vite?: {manifest?: string; entry: string; base?: string};
  pages: Record<string,PageBuildDefinition>;
  layouts?: Record<string,PageBuildDefinition & {outlet: string}>;
}
export interface PageBuildOptions {
  root: string;
  compileSource?:import('./compilation-session').RmtCompilationSession['compileSource'];
  config?: string;
  target?: 'node' | 'php' | 'both';
  host?: 'laravel';
  output?: string;
}
export interface PageBuildResult { ok: true; manifest: PageManifest; output: string; sourceCount: number }
export function buildPages(options: PageBuildOptions): Promise<PageBuildResult>;
export function runPageBuildCli(args: string[], io?: {stdout?: {write(value: string): unknown}; stderr?: {write(value: string): unknown}}): Promise<number>;
