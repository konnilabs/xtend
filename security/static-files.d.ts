import type {ServerResponse} from 'node:http';
export declare function resolvePublicFile(root: string, relative: string): string | null;
export declare function streamPublicFile(response: ServerResponse, file: string, headers?: Record<string, string>): void;
