export function createScanner(options: {typescript: unknown; defaultRootDir?: string}): {scanSchemaInventory(options: {rootDir: string}): unknown; validateInventoryDocument(inventory: unknown, scan: unknown, options: {rootDir: string}): unknown};
export function importAuthorities(options: Record<string, unknown>): unknown[];
export function verifyPair(options: Record<string, unknown>): Record<string, unknown>;
export function validateOwner(scan: unknown, inventory: unknown, owner: string): unknown[];
export function verifyUnion(coreScan: unknown, demoScan: unknown): unknown[];
export function assertSelection(selection: string[]): void;
export function verifyOwnershipEvidence(binding: {file: string; sha256: string}, options: {directory: string; coreSha: string; demoSha: string; manifest: unknown; startedAt?: string; now?: number}): true;
export function normalizeUsages(usages: unknown[]): unknown[];
export function verifySelectedGovernance(inventory: unknown): {duplicateReviews: unknown[]; consolidations: unknown[]};
