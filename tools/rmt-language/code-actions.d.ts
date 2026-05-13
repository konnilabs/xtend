export * from './rmt-tooling-public-types';
import type { RmtCodeAction, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction, RmtWorkspaceEdit } from './rmt-tooling-public-types';

export declare const createCodeAction: RmtToolingFactory;
export declare const createRmtCodeActionProvider: RmtToolingFactory;
export declare const getRmtCodeActions: RmtToolingFunction<RmtCodeAction[]>;
export declare const RMT_CODE_ACTION_MODULE_PATH: RmtToolingConstant;
export declare const RMT_CODE_ACTION_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_CODE_ACTION_PROVIDER_SCHEMA: RmtToolingConstant;
export declare const RMT_CODE_ACTION_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_CODE_ACTION_SCHEMA: RmtToolingConstant;
export declare const RMT_CODE_ACTION_SUITE_PATH: RmtToolingConstant;
export declare const RMT_CODE_ACTION_WORKPACKAGE: RmtToolingConstant;
export declare const RMT_WORKSPACE_EDIT_SCHEMA: RmtToolingConstant;
export type RmtCodeActionWorkspaceEdit = RmtWorkspaceEdit;
