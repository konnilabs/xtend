import { parseRmtClassicSource, type RmtClassicAst } from '@ccslabs/xtend/rmt-language/classic-parser';
import {
  compileRmtClassicSource, compileRmtClassicAst, createRmtClassicCompiler,
  validateRmtClassicAst, isRmtClassicAst, type RmtStateDeclaration
} from '@ccslabs/xtend/rmt-language/classic-compiler';

const parsed = parseRmtClassicSource({ text: 'state count type number initial 0' });
if (parsed.ok) {
  const ast: RmtClassicAst = parsed.ast;
  compileRmtClassicAst(ast, { sourceModel: parsed.sourceModel, contractVersion: '1.0.0' });
}
const candidate: unknown = JSON.parse('{}');
validateRmtClassicAst(candidate);
if (isRmtClassicAst(candidate)) createRmtClassicCompiler().compileAst(candidate);
const result = compileRmtClassicSource({ text: '' });
result.compilerDiagnostics.forEach(diagnostic => diagnostic.message.toUpperCase());
const coreSchema: 'xtend.rmt.core-format.vnext.v1' | undefined = result.coreDocument?.schema;
void coreSchema;
// @ts-expect-error unknown JSON must pass the type guard before compilation
compileRmtClassicAst(candidate);
// @ts-expect-error the public API only accepts the implemented contract version
createRmtClassicCompiler({ contractVersion: '2.0.0' });
const invalid: RmtStateDeclaration = {
  type: 'RmtStateDeclaration', name: 'count', initial: null, body: [],
  dataType: { type: 'RmtTypeReference', value: 'number' },
  // @ts-expect-error unknown semantic fields are closed in generated types
  surprise: true
};
void invalid;
