import type { XtendBuilderRecord, XtendBuilderTemplateRenderResult } from '../builder-public-types';

export declare function renderTemplateForArtifact(artifactId: string, values?: XtendBuilderRecord): XtendBuilderTemplateRenderResult;
export declare function renderTemplateString(template: string, values?: XtendBuilderRecord): string;
