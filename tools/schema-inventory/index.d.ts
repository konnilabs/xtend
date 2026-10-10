export function createScanner(options: {typescript: unknown; defaultRootDir?: string}): {scanSchemaInventory(options: {rootDir: string; sourceProvider?: SourceProvider}): unknown; validateInventoryDocument(inventory: unknown, scan: unknown, options: {rootDir: string; sourceProvider?: SourceProvider}): unknown};
export function importAuthorities(options: Record<string, unknown>): unknown[];
export function verifyPair(options: Record<string, unknown>): Record<string, unknown>;
export function validateOwner(scan: unknown, inventory: unknown, owner: string): unknown[];
export function verifyUnion(coreScan: unknown, demoScan: unknown): unknown[];
export function assertSelection(selection: string[]): void;
export function verifyOwnershipEvidence(binding: {file: string; sha256: string}, options: {directory: string; coreSha: string; demoSha: string; manifest: unknown; startedAt?: string; now?: number}): true;
export function normalizeUsages(usages: unknown[]): unknown[];
export function verifySelectedGovernance(inventory: unknown): {duplicateReviews: unknown[]; consolidations: unknown[]};

export interface SourceProvider { readonly files: () => ReadonlyArray<{owner: string; path: string; logicalPath: string; absolutePath: string}>; readonly hasCurrent: (path: string) => boolean; readonly readCurrent: (path: string) => Uint8Array; readonly provenance: () => unknown; }
export interface SourceArtifactExpectation { producerMode: 'committed' | 'local-uncommitted-proposal'; coreSha: string; demoSha: string; archiveSha256: string; manifestSha256: string; context: {runId: string; runAttempt: string}; }
export function createSourceProvider(options: {archive: string; destination: string; expected: SourceArtifactExpectation}): SourceProvider;

/** Temporary expected view from verified approved records; never writes an inventory. */
export function createExpectedInventory(provider: SourceProvider): unknown;
