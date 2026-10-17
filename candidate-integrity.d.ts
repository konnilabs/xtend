export interface CandidateDependencies { dependencies?: Record<string,string>; devDependencies?: Record<string,string>; optionalDependencies?: Record<string,string>; peerDependencies?: Record<string,string>; peerDependenciesMeta?: Record<string,{optional?: boolean}>; }
export interface CandidatePackage extends CandidateDependencies {name: string; version: string; file: string; sha256: string; integrity: string;}
export interface CandidateManifest {schema: 'xtend.product-candidates.v1'; coreSha: string; demoSha: string; development?: boolean; packages: CandidatePackage[]; php: {file: string; sha256: string; sources: Record<string, string>};}
export interface CoreCandidateManifest {schema: 'xtend.product-candidates.v2'; profile: 'xtend.npm.core-only.v1'; coreSha: string; development?: boolean; packages: CandidatePackage[]; php: {file: string; sha256: string; sources: Record<string, string>};}
export type LegacyCandidateManifest = CandidateManifest;
export declare function digest(bytes: Uint8Array | string): string;
export declare function verifyCandidates(manifest: LegacyCandidateManifest, options: {coreSha: string; demoSha: string; directory: string}): LegacyCandidateManifest;
export declare function verifyCandidates(manifest: CoreCandidateManifest, options: {coreSha: string; profile: 'xtend.npm.core-only.v1'; directory: string}): CoreCandidateManifest;
export declare function selectCandidateClosure(manifest: CandidateManifest | CoreCandidateManifest, app: CandidateDependencies): CandidatePackage[];
export declare function verifyInstalledClosure(lock: {packages?: Record<string, unknown>}, manifest: {packages: (CandidatePackage | (CandidateDependencies & {name: string; version: string; integrity: string}))[]}, options?: {app?: CandidateDependencies; registryPackages?: (CandidateDependencies & {name: string; version: string; integrity: string})[]}): true;
export declare function verifyResolution(requireFrom: {resolve(specifier: string): string}, manifest: {packages: (CandidatePackage | (CandidateDependencies & {name: string; version: string; integrity: string}))[]}, installRoot: string, app?: CandidateDependencies): true;
