import type { XtendBuilderConstant, XtendBuilderRecord } from '../builder-public-types';

export declare const SCAFFOLD_LAYOUT: XtendBuilderConstant<XtendBuilderRecord[]>;
export declare function formatScaffoldLayout(layout?: XtendBuilderRecord[]): string;
export declare function getLayoutArea(id: string): XtendBuilderRecord | null;
export declare function getScaffoldLayout(): XtendBuilderRecord[];
