import type { XtendBuilderTemplateDefinition, XtendBuilderTemplateRegistry } from '../builder-public-types';

export declare const TEMPLATE_REGISTRY: XtendBuilderTemplateDefinition[];
export declare const TEMPLATE_REGISTRY_SCHEMA: string;
export declare function getTemplateForArtifact(artifactId: string): XtendBuilderTemplateDefinition | null;
export declare function getTemplateRegistry(): XtendBuilderTemplateRegistry;
