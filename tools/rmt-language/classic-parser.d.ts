export * from './classic-ast-types';
import type { RmtClassicAst } from './classic-ast-types';
import type { RmtJsonValue, RmtToolingDiagnostic } from './rmt-tooling-public-types';
export declare const RMT_CLASSIC_AST_SCHEMA: 'xtend.rmt.vnext.ast.v1';
export type RmtClassicParseResult = {
  schema: string; phase: string; status: string; sourceModel: unknown; diagnostics: RmtToolingDiagnostic[];
} & ({ ok: true; ast: RmtClassicAst } | { ok: false; ast: RmtJsonValue });
export declare function parseRmtClassicSource(input?: unknown, options?: Record<string, unknown>): RmtClassicParseResult;
export declare function createRmtClassicParser(options?: Record<string, unknown>): Readonly<{
  schema: string; astSchema: typeof RMT_CLASSIC_AST_SCHEMA; name: 'RMT Classic'; parseSource: typeof parseRmtClassicSource;
}>;
