export * from '../../rmt-language/rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from '../../rmt-language/rmt-tooling-public-types';

export declare const activate: RmtToolingFunction;
export declare const createServerCommand: RmtToolingFactory;
export declare const deactivate: RmtToolingFunction;
export declare const resolveServerModule: RmtToolingFactory;
export declare const RMT_VSCODE_BRIDGE_SCHEMA: RmtToolingConstant;
export declare const RMT_VSCODE_BRIDGE_WORKPACKAGE: RmtToolingConstant;
