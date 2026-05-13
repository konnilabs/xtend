import type { XtendBuilderComponentInput, XtendBuilderGeneratorDefinition, XtendBuilderGeneratorRegistry } from '../builder-public-types';

export declare const GENERATOR_REGISTRY_SCHEMA: string;
export declare function getGenerator(id: string): XtendBuilderGeneratorDefinition | null;
export declare function getGeneratorRegistry(): XtendBuilderGeneratorRegistry;
export declare function runGenerator(id: string, input?: XtendBuilderComponentInput): unknown;
