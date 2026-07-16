import type { XtendBuilderCliIo } from './builder-public-types';

export declare function runCli(args?: string[], io?: XtendBuilderCliIo): number;
export declare function runCliAsync(args?: string[], io?: XtendBuilderCliIo): Promise<number>;
