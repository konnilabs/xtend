import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPONENT_LONG_TAIL_MIGRATION_SCHEMA: string;
export declare const COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA: string;
export declare const COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA: string;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare function createComponentLongTailMigrationGate(options?: XtendCatalogOptions): XtendCatalogGate;
export declare function createComponentLongTailMigrationPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function createMarkdownMatrix(...args: unknown[]): string;
export declare function validateComponentLongTailMigrationPlan(plan?: unknown): XtendCatalogReport;
