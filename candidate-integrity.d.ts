export interface CandidatePackage {name: string; version: string; file: string; sha256: string; integrity: string;}
export interface CandidateManifest {schema: 'xtend.product-candidates.v1'; coreSha: string; demoSha: string; development?: boolean; packages: CandidatePackage[]; php: {file: string; sha256: string; sources: Record<string, string>};}
export declare function digest(bytes: Uint8Array | string): string;
export declare function verifyCandidates(manifest: CandidateManifest, options: {coreSha: string; demoSha: string; directory: string}): CandidateManifest;
export declare function verifyInstalledClosure(lock: {packages?: Record<string, unknown>}, manifest: CandidateManifest): true;
export declare function verifyResolution(requireFrom: {resolve(specifier: string): string}, manifest: CandidateManifest, installRoot: string): true;
