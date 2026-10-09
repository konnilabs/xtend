/** Resolve an explicitly public, packaged XTend asset. Rejects absolute/traversal paths. */
export declare function resolveProductAsset(relative: string): string;
/** Generate the canonical ESM wrapper from a kernel source artifact. */
export declare function generateEntrypoint(source: string, target: string): string;
