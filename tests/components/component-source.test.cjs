const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const { readComponentSource, readComponentSourceFiles, resolveComponentImplementationPath } = require('./helpers/component-source.cjs');
const { sourceRegistersCustomElement } = require('../schemas/custom-element-registration.cjs');

test('source inspection follows actual shared definitions and deduplicates reexports', () => {
  const files = readComponentSourceFiles('components/xrouter.js');
  assert.deepEqual(files.map((file) => file.path), ['components/xrouter.js', 'components/xrouter.definition.js']);
  assert.match(readComponentSource('components/xrouter.js'), /class XRouter extends HTMLElement/u);
  assert.match(resolveComponentImplementationPath('components/xrouter.js'), /components\/xrouter\.definition\.js$/u);
});

test('source inspection follows an explicit dynamic Theme definition import', () => {
  const files = readComponentSourceFiles('components/xtheme.js');
  assert.deepEqual(files.map((file) => file.path), ['components/xtheme.js', 'components/xtheme.definition.js']);
  assert.match(files[1].source, /class ThemeManager/u);
});

test('source inspection rejects paths outside component sources', () => {
  assert.throws(() => readComponentSourceFiles('package.json'), /escapes/u);
});

function registrationFixture(t, changes = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-registration-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const files = {
    'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js';
defineManagedComponent('x-probe', XProbe);`,
    'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {}
markManagedComponentClass(XProbe, 'x-probe', {});
export { XProbe };
export default XProbe;`,
    'components/native-managed.js': `export function defineManagedComponent(tag, ctor) { customElements.define(tag, ctor); return ctor; }
export function markManagedComponentClass(ctor, tag) { return ctor; }`,
    ...changes
  };
  for (const [file, source] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), source);
  }
  const reads = [];
  const readSource = file => {
    reads.push(file);
    return Object.hasOwn(files, file) ? fs.readFileSync(path.join(root, file), 'utf8') : null;
  };
  return {
    reads,
    resolve: () => sourceRegistersCustomElement({ typescript: ts, sourcePath: 'components/xprobe.js',
      source: readSource('components/xprobe.js'), tag: 'x-probe', readSource })
  };
}

test('custom-element reference keeps the established direct registration witness', t => {
  const fixture = registrationFixture(t, { 'components/xprobe.js': `class XProbe extends HTMLElement {}
customElements.define('x-probe', XProbe);` });
  assert.equal(fixture.resolve(), true);
  assert.deepEqual(fixture.reads, ['components/xprobe.js']);
});

test('managed registration resolves a real named constructor and authenticates all three sources', t => {
  const fixture = registrationFixture(t);
  assert.equal(fixture.resolve(), true);
  assert.deepEqual(fixture.reads, ['components/xprobe.js', 'components/xprobe.definition.js', 'components/native-managed.js']);
});

test('managed registration follows explicit registrar aliases and default class exports', t => {
  const fixture = registrationFixture(t, {
    'components/xprobe.js': `import { defineManagedComponent as register } from './native-managed.js';
import Probe from './xprobe.definition.js';
register('x-probe', Probe);`,
    'components/xprobe.definition.js': `import { markManagedComponentClass as mark } from './native-managed.js';
export default class XProbe extends HTMLElement {}
mark(XProbe, 'x-probe', {});`
  });
  assert.equal(fixture.resolve(), true);
});

test('managed registration resolves the actual public XKeymap bootstrap and shared class', () => {
  const root = path.resolve(__dirname, '../..');
  const readSource = file => fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal(sourceRegistersCustomElement({ typescript: ts, sourcePath: 'components/xkeymap.js',
    source: readSource('components/xkeymap.js'), tag: 'x-keymap', readSource }), true);
});

const invalidRegistrationFixtures = [
  ['same-named local fake', { 'components/xprobe.js': `function defineManagedComponent() {}
import { XProbe } from './xprobe.definition.js'; defineManagedComponent('x-probe', XProbe);` }],
  ['foreign registrar import', { 'components/xprobe.js': `import { defineManagedComponent } from './foreign.js';
import { XProbe } from './xprobe.definition.js'; defineManagedComponent('x-probe', XProbe);` }],
  ['type-only registrar import', { 'components/xprobe.js': `import type { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; defineManagedComponent('x-probe', XProbe);` }],
  ['foreign explicit registry argument', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; defineManagedComponent('x-probe', XProbe, foreignRegistry);` }],
  ['uninvoked function body', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; function later() { defineManagedComponent('x-probe', XProbe); }` }],
  ['unreachable conditional call', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; if (false) defineManagedComponent('x-probe', XProbe);` }],
  ['call after unconditional throw', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; throw new Error('stop'); defineManagedComponent('x-probe', XProbe);` }],
  ['mere comment and string tokens', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; // defineManagedComponent('x-probe', XProbe);
const text = "defineManagedComponent('x-probe', XProbe)";` }],
  ['wrong literal tag', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; defineManagedComponent('x-other', XProbe);` }],
  ['nonliteral tag', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; const tag = 'x-probe'; defineManagedComponent(tag, XProbe);` }],
  ['local constructor instead of imported shared class', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
class XProbe extends HTMLElement {} defineManagedComponent('x-probe', XProbe);` }],
  ['different definition import', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './foreign.definition.js'; defineManagedComponent('x-probe', XProbe);` }],
  ['function exported as constructor', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
function XProbe() {} markManagedComponentClass(XProbe, 'x-probe', {}); export { XProbe };` }],
  ['unexported constructor', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {} markManagedComponentClass(XProbe, 'x-probe', {});` }],
  ['class marked with a different tag', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {} markManagedComponentClass(XProbe, 'x-other', {}); export { XProbe };` }],
  ['foreign marker import', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './foreign.js';
class XProbe extends HTMLElement {} markManagedComponentClass(XProbe, 'x-probe', {}); export { XProbe };` }],
  ['uninvoked marker body', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {} function later() { markManagedComponentClass(XProbe, 'x-probe', {}); } export { XProbe };` }],
  ['duplicate registrar binding', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; const defineManagedComponent = () => {}; defineManagedComponent('x-probe', XProbe);` }],
  ['reassigned registrar import', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; defineManagedComponent = foreignRegister; defineManagedComponent('x-probe', XProbe);` }],
  ['reassigned constructor import', { 'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; XProbe = OtherCtor; defineManagedComponent('x-probe', XProbe);` }],
  ['reassigned exported class', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {} XProbe = OtherCtor; markManagedComponentClass(XProbe, 'x-probe', {}); export { XProbe };` }],
  ['destructuring replacement of exported class', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {} ({ ctor: XProbe } = foreign); markManagedComponentClass(XProbe, 'x-probe', {}); export { XProbe };` }],
  ['reassigned marker import', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {} markManagedComponentClass = fakeMarker; markManagedComponentClass(XProbe, 'x-probe', {}); export { XProbe };` }],
  ['updated exported class', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
class XProbe extends HTMLElement {} XProbe++; markManagedComponentClass(XProbe, 'x-probe', {}); export { XProbe };` }],
  ['marker before class initialization', { 'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
markManagedComponentClass(XProbe, 'x-probe', {}); class XProbe extends HTMLElement {} export { XProbe };` }],
  ['evaluated default export before class initialization', {
    'components/xprobe.js': `import { defineManagedComponent } from './native-managed.js';
import XProbe from './xprobe.definition.js'; defineManagedComponent('x-probe', XProbe);`,
    'components/xprobe.definition.js': `import { markManagedComponentClass } from './native-managed.js';
export default XProbe; class XProbe extends HTMLElement {} markManagedComponentClass(XProbe, 'x-probe', {});`
  }],
  ['missing actual trusted helper export', { 'components/native-managed.js': `export function unrelated() {}` }]
];
for (const [label, changes] of invalidRegistrationFixtures) {
  test(`managed registration rejects ${label}`, t => assert.equal(registrationFixture(t, changes).resolve(), false));
}

test('managed registration propagates provider read failures instead of falling back', t => {
  const fixture = registrationFixture(t);
  assert.equal(fixture.resolve(), true);
  assert.throws(() => sourceRegistersCustomElement({ typescript: ts, sourcePath: 'components/xprobe.js',
    source: `import { defineManagedComponent } from './native-managed.js';
import { XProbe } from './xprobe.definition.js'; defineManagedComponent('x-probe', XProbe);`,
    tag: 'x-probe', readSource() { throw new Error('Authenticated source changed'); }
  }), /Authenticated source changed/u);
});
