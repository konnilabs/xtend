import type { XtendBuilderRecord } from '../builder-public-types';

export declare function getClassNameFromTag(tag: string): string;
export declare function getComponentNameFromTag(tag: string): string;
export declare function normalizeTag(tag: string): string;
export declare function replaceArtifactTokens(template: string, values?: XtendBuilderRecord): string;
export declare function toPascalCase(value: string): string;
