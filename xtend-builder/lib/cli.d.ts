import type { XtendBuilderCliArgs, XtendBuilderCliIo, XtendBuilderFlagArgs, XtendBuilderRecord } from '../builder-public-types';

export declare const COMMAND_ALIASES: Readonly<Record<string, string>>;
export declare function buildConfigSummary(): XtendBuilderRecord;
export declare function buildHelpText(): string;
export declare function buildServeHelpText(): string;
export declare function normalizeCommand(command?: string | null): string | null;
export declare function parseArgs(args?: string[]): XtendBuilderCliArgs;
export declare function parseFlagArgs(args?: string[]): XtendBuilderFlagArgs;
export declare function runCli(args?: string[], io?: XtendBuilderCliIo): number;
export declare function runCliAsync(args?: string[], io?: XtendBuilderCliIo): Promise<number>;
