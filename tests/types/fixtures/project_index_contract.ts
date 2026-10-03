import { createProjectIndex, computeImpact, type IndexSymbol, type ProjectSnapshot } from '@ccslabs/xtend/project-index';
import { createProjectIndex as createCompilerIndex } from '../../../tools/project-index';

const index = createProjectIndex({ rootDir: '/project', profile: 'rmt' });
createCompilerIndex({ workspaceRoots: ['/project'], profile: 'repository' }).dispose();
const snapshot: ProjectSnapshot = index.build().snapshot();
const symbol: IndexSymbol | undefined = index.searchSymbols('count')[0];
index.updateDocument({ filePath: '/project/app.rmt', version: 2, text: 'state count type number initial 0' });
if (symbol) {
  const references = index.references({ symbolId: symbol.id, includeDeclaration: true });
  const line: number = references[0].range.start.line;
  void line;
}
const impact = computeImpact({ baseSnapshot: snapshot, headSnapshot: index.snapshot(), changedPaths: ['app.rmt'] });
const selection: 'not-performed' = impact.testSelection;
void selection;
// @ts-expect-error document text must be a string
index.updateDocument({ filePath: '/project/app.rmt', text: 42 });
// @ts-expect-error references require a concrete navigation query
index.references('count');
// @ts-expect-error supported profiles are a closed union
createProjectIndex({ rootDir: '/project', profile: 'full-semantics' });
index.dispose();
