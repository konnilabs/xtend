export * from './rmt-tooling-public-types';
import type { RmtDocumentSymbol, RmtToolingConstant, RmtToolingFactory, RmtToolingFunction } from './rmt-tooling-public-types';

export declare const createDocumentSymbol: RmtToolingFactory;
export declare const createRmtDocumentSymbolsProvider: RmtToolingFactory;
export declare const getRmtDocumentSymbols: RmtToolingFunction<RmtDocumentSymbol[]>;
export declare const RMT_DOCUMENT_SYMBOLS_MODULE_PATH: RmtToolingConstant;
export declare const RMT_DOCUMENT_SYMBOLS_PACKAGE_SCRIPT: RmtToolingConstant;
export declare const RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA: RmtToolingConstant;
export declare const RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA: RmtToolingConstant;
export declare const RMT_DOCUMENT_SYMBOLS_SCHEMA: RmtToolingConstant;
export declare const RMT_DOCUMENT_SYMBOLS_SUITE_PATH: RmtToolingConstant;
export declare const RMT_DOCUMENT_SYMBOLS_WORKPACKAGE: RmtToolingConstant;
