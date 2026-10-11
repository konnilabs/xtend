export interface CandidateDependencies { dependencies?: Record<string,string>; devDependencies?: Record<string,string>; optionalDependencies?: Record<string,string>; peerDependencies?: Record<string,string>; peerDependenciesMeta?: Record<string,{optional?: boolean}>; }
export interface CandidatePackage extends CandidateDependencies {name: string; version: string; file: string; sha256: string; integrity: string;}
export interface CandidateManifest {schema: 'xtend.product-candidates.v1'; coreSha: string; demoSha: string; development?: boolean; packages: CandidatePackage[]; php: {file: string; sha256: string; sources: Record<string, string>};}
export declare function digest(bytes: Uint8Array | string): string;
export declare function verifyCandidates(manifest: CandidateManifest, options: {coreSha: string; demoSha: string; directory: string}): CandidateManifest;
export declare function selectCandidateClosure(manifest: CandidateManifest, app: CandidateDependencies): CandidatePackage[];
export declare function verifyInstalledClosure(lock: {packages?: Record<string, unknown>}, manifest: CandidateManifest): true;
export declare function verifyResolution(requireFrom: {resolve(specifier: string): string}, manifest: CandidateManifest, installRoot: string, app?: CandidateDependencies): true;
