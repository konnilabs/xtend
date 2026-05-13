import type { XtendBuilderComponentFilesResult, XtendBuilderComponentInput, XtendBuilderOptions } from '../builder-public-types';

export declare const COMPONENT_FILES_SCHEMA: string;
export declare const RENDERED_ARTIFACTS: string[];
export declare function createComponentFiles(input?: XtendBuilderComponentInput, options?: XtendBuilderOptions): XtendBuilderComponentFilesResult;
