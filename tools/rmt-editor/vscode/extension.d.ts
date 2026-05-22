export * from '../../rmt-language/rmt-tooling-public-types';
import type { RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from '../../rmt-language/rmt-tooling-public-types';

export declare const activate: RmtToolingFunction;
export declare const applyPrimitiveAuthoringWorkspaceEdit: RmtToolingFunction;
export declare const createActiveDocumentPrimitiveAuthoringExperience: RmtToolingFactory;
export declare const createPrimitiveAuthoringApplyExperience: RmtToolingFactory;
export declare const createServerCommand: RmtToolingFactory;
export declare const deactivate: RmtToolingFunction;
export declare const executePrimitiveCommandHandoff: RmtToolingFunction;
export declare const renderPrimitiveAuthoringApplyExperience: RmtToolingFunction<string[]>;
export declare const requestPrimitiveCodeActionsForDocument: RmtToolingFactory;
export declare const resolveServerModule: RmtToolingFactory;
export declare const RMT_VSCODE_PRIMITIVE_AUTHORING_COMMANDS: RmtToolingConstant;
export declare const RMT_VSCODE_PRIMITIVE_AUTHORING_EXPERIENCE_SCHEMA: RmtToolingConstant;
export declare const RMT_VSCODE_BRIDGE_SCHEMA: RmtToolingConstant;
export declare const RMT_VSCODE_BRIDGE_WORKPACKAGE: RmtToolingConstant;
