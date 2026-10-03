import { readFile } from 'node:fs/promises';

const pageLoaderUrl = new URL('../docs/utils/pageloader.js', import.meta.url);
const rendererUrl = new URL('../xtendrmt/rmt-dom-descriptor-renderer.js', import.meta.url);
const source = await readFile(pageLoaderUrl, 'utf8');
const rendererSource = await readFile(rendererUrl, 'utf8');
const forbidden = [
  'create' + 'Element(',
  'create' + 'DocumentFragment(',
  'create' + 'TextNode(',
  'append' + 'Child(',
  'insert' + 'Before(',
  'replace' + 'Children('
];
const violations = forbidden.filter((primitive) => source.includes(primitive));
if (violations.length) {
  throw new Error(`docs/utils/pageloader.js bypasses XTend descriptor rendering: ${violations.join(', ')}`);
}
const rendererPrimitives = forbidden.filter((primitive) => rendererSource.includes(primitive));
if (rendererPrimitives.length < 4) {
  throw new Error('XTend renderer must retain its internal, explicitly allowed DOM primitives.');
}
for (const api of ['renderXtendDescriptor(', 'renderKeyed(', 'patchElement(']) {
  if (!source.includes(api)) throw new Error(`PageLoader must use ${api} from /xtend.js.`);
}
console.log('Docs PageLoader architecture check passed: app code is descriptor-only; renderer internals remain allowed.');
