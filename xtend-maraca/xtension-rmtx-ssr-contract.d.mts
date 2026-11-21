export const RMTX_XTENSION_SSR_API_VERSION: '3.0.0';
export const RMTX_SSR_SOURCE_IDENTITY_SCHEMA: 'xtend.maraca.rmtx-ssr-source-identity.v1';
export interface RmtxSSRSourceIdentity {
  readonly schema: typeof RMTX_SSR_SOURCE_IDENTITY_SCHEMA;
  readonly sourceProfile: { readonly syntax: 'rmtx'; readonly version: `${1|2|3|4|5|6|7|8}.0.0` };
  readonly sourceHash: string;
  readonly project: { readonly schema: 'xtend.rmt.project-report.v1'; readonly apiVersion: '1.0.0'; readonly identity: string; readonly sourceSyntax: 'rmtx' | 'rmt-vnext' };
}
export interface RmtxSSRNativeArtifact {
  readonly schema: 'xtend.maraca.rmtx-ssr-native-artifact.v1'; readonly apiVersion: '1.0.0';
  readonly sourceIdentity: RmtxSSRSourceIdentity; readonly program: Readonly<Record<string, unknown>>;
}
export function normalizeRmtxSSRSourceIdentity(input: unknown, options?: {sourceHash?: string}): RmtxSSRSourceIdentity;
export function createRmtxSSRNativeArtifact(program: Readonly<Record<string, unknown>>, sourceIdentity: RmtxSSRSourceIdentity): RmtxSSRNativeArtifact;
export function validateRmtxSSRNativeArtifact(input: unknown): RmtxSSRNativeArtifact;
