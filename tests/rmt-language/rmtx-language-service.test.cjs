'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { createRmtxLanguageService, createRmtxVirtualDocument, checkRmtxProjectTypes } = require('../../tools/rmt-language/rmtx-language-service');
const rootDir = path.resolve(__dirname, '../..');
const header = `import {RMT,model,selectors,item,input} from '@ccslabs/xtend/rmt-language/rmtx';\nexport default `;
function document(text, name = 'editor.rmtx') { const filePath = path.join(rootDir, '.xtend-test-results/a065-editor', name); return { text, filePath, uri: pathToFileURL(filePath).href, languageId: name.endsWith('.rmtx') ? 'rmtx' : 'rmt', version: 1 }; }
function service(documents) { return createRmtxLanguageService({ rootDir, syntaxVersion: '8.0.0', getProjectDocuments: () => documents,
  analyzeProject: () => ({ ok: true, diagnostics: [] }) }); }
function offset(text, needle, after = false) { const value = text.lastIndexOf(needle); assert(value >= 0, needle); return value + (after ? needle.length : 0); }
function position(text, value) { const prefix = text.slice(0, value).split(/\r\n|\r|\n/u); return { line: prefix.length - 1, character: prefix.at(-1).length }; }

test('virtual TSX checks model fields and native properties against actual authoring types', () => {
  const doc = document(header + `<RMT.Program id="app"><RMT.State id="form" type="object" initial={{name:'Ada',age:42}}/>
<RMT.Surface id="view"><RMT.View><RMT.Component tag="x-input" properties={{value:model.form.age}}/>
<RMT.Text value={model.form.missing}/></RMT.View></RMT.Surface></RMT.Program>`);
  const result = checkRmtxProjectTypes([doc], { rootDir, syntaxVersion: '8.0.0' });
  assert.equal(result.ok, false);
  assert(result.diagnostics.some(item => /number.*string|not assignable/u.test(item.message)), JSON.stringify(result.diagnostics));
  assert(result.diagnostics.some(item => /missing/u.test(item.message)), JSON.stringify(result.diagnostics));
  assert(result.diagnostics.every(item => item.uri === doc.uri && !item.filePath.includes('__xtend.tsx')));
});

test('repeated item and nested repeated item follow their lexical collection types', () => {
  const doc = document(header + `<RMT.Program id="app"><RMT.State id="catalog" type="object" initial={{groups:[{id:'g',products:[{id:1,title:'one'}]}]}}/>
<RMT.Repeat from={model.catalog.groups} keyBy={item.id}><RMT.Repeat from={item.products} keyBy={item.id}>
<RMT.Surface id="view"><RMT.View><RMT.Text value={item.title}/><RMT.Text value={item.products}/></RMT.View></RMT.Surface>
</RMT.Repeat></RMT.Repeat></RMT.Program>`);
  const result = checkRmtxProjectTypes([doc], { rootDir });
  assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics));
  assert.match(result.diagnostics[0].message, /products/u);
});

test('action inputs remain distinct between actions and model dynamic markers have no any fallback', () => {
  const doc = document(header + `<RMT.Program id="app"><RMT.State id="title" type="string" initial="one"/>
<RMT.Action id="set"><RMT.Input name="name" type="string"/><RMT.Reduce state="title" value={input.name}/></RMT.Action>
<RMT.Action id="other"><RMT.Input name="count" type="number"/><RMT.Reduce state="title" value={input.name}/></RMT.Action>
</RMT.Program>`);
  const result = checkRmtxProjectTypes([doc], { rootDir });
  assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics)); assert.match(result.diagnostics[0].message, /name/u);
});

test('selectors preserve the source row fields, including item lookup and closed path validation', () => {
  const doc = document(header + `<RMT.Program id="app"><RMT.State id="rows" type="array" initial={[{id:1,label:'one'}]}/>
<RMT.Selector id="visible" from={model.rows}><RMT.Where test={item.id>0}/></RMT.Selector>
<RMT.Repeat from={selectors.visible} keyBy={item.id}><RMT.Surface id="view"><RMT.View>
<RMT.Text value={item.label}/><RMT.Text value={item.unknown}/></RMT.View></RMT.Surface></RMT.Repeat></RMT.Program>`);
  const result = checkRmtxProjectTypes([doc], { rootDir });
  assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics)); assert.match(result.diagnostics[0].message, /unknown/u);
});

test('Classic imported states produce original-file model definitions and field rename edits', () => {
  const classic = document(`template state.definitions { state product type object { initial { title "one"; count 1 } } }`, 'states.rmt');
  const view = document(header + `<RMT.Program id="app"><RMT.Import path="./states.rmt"/>
<RMT.Surface id="view"><RMT.View><RMT.Text value={model.product.title}/></RMT.View></RMT.Surface></RMT.Program>`);
  const ls = service([view, classic]);
  try {
    ls.updateDocument(view); const point = position(view.text, offset(view.text, 'title'));
    assert.equal(ls.analyze(view.uri).ok, true);
    const definitions = ls.definition(view.uri, point);
    assert.equal(definitions.length, 1, JSON.stringify(definitions)); assert.equal(definitions[0].uri, classic.uri);
    assert.equal(definitions[0].range.start.character, classic.text.indexOf('title'));
    const rename = ls.rename(view.uri, point, 'heading');
    assert(rename.changes[classic.uri]); assert(rename.changes[view.uri]);
    assert(Object.keys(rename.changes).every(uri => !uri.includes('__xtend.tsx')));
  } finally { ls.dispose(); }
});

test('CRLF and UTF16 positions map diagnostics and field completions to real RMTX source', () => {
  const text = header.replaceAll('\n', '\r\n') + `<RMT.Program id="app">\r\n<RMT.State id="profile" type="object" initial={{name:'😀',count:1}}/>\r\n<RMT.Surface id="view"><RMT.View><RMT.Text value={model.profile.nope}/></RMT.View></RMT.Surface>\r\n</RMT.Program>`;
  const doc = document(text); const ls = service([doc]);
  try {
    ls.updateDocument(doc); const result = ls.analyze(doc.uri);
    assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics));
    assert.deepEqual(result.diagnostics[0].range.start, position(text, offset(text, 'nope')));
    const malformed = { ...doc, version: 2, text: text.replace('model.profile.nope', 'model.profile.') };
    ls.updateDocument(malformed);
    const completion = ls.completion(doc.uri, position(malformed.text, offset(malformed.text, 'model.profile.', true)));
    assert(completion.items.some(item => item.label === 'name'), JSON.stringify(completion));
    assert(completion.items.some(item => item.label === 'count'), JSON.stringify(completion));
  } finally { ls.dispose(); }
});

test('unsaved imported RMTX state overlays invalidate model types before disk save', () => {
  const state = document(header + `<RMT.Program id="state"><RMT.State id="product" type="object" initial={{title:'one'}}/></RMT.Program>`, 'state.rmtx');
  const view = document(header + `<RMT.Program id="app"><RMT.Import path="./state.rmtx"/><RMT.Surface id="view"><RMT.View><RMT.Component tag="x-input" properties={{value:model.product.title}}/></RMT.View></RMT.Surface></RMT.Program>`);
  const ls = service([view, state]);
  try {
    ls.updateDocument(view); assert.equal(ls.analyze(view.uri).ok, true);
    ls.updateDocument({ ...state, version: 2, text: state.text.replace("title:'one'", 'title:42') });
    const result = ls.analyze(view.uri); assert.equal(result.ok, false); assert(result.diagnostics.some(item => /not assignable/u.test(item.message)));
  } finally { ls.dispose(); }
});

test('provider props use the same captured provider value rules as the compiler', () => {
  const doc = document(header + `<RMT.Program id="app"><RMT.State id="age" type="number" initial={42}/><RMT.Surface id="host"><RMT.XTension id="gallery" provider="gallery" owner="host" lane="visible" props={{title:model.age}}/></RMT.Surface></RMT.Program>`);
  const result = checkRmtxProjectTypes([doc], { rootDir, componentInterfaceCatalog: { records: [{ definition: { providerId: 'gallery', props: { title: { type: 'string' } } } }] } });
  assert.equal(result.ok, false); assert(result.diagnostics.some(item => /not assignable/u.test(item.message)), JSON.stringify(result.diagnostics));
});

test('file-based provider metadata reaches semantic props without executing provider code', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmtx-editor-provider-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const hash = value => require('node:crypto').createHash('sha256').update(value).digest('hex');
  const code = 'throw new Error("Provider code must never execute in the editor"); export function createComponent() {}';
  fs.writeFileSync(path.join(directory, 'provider.mjs'), code);
  const metadata = JSON.parse(fs.readFileSync(path.join(rootDir, 'development/rmtx-a06/providers/react.interface.json'), 'utf8'));
  metadata.entry.module = './provider.mjs'; metadata.entry.sha256 = hash(code); metadata.props = { title: { type: 'string' } };
  const bytes = JSON.stringify(metadata); fs.writeFileSync(path.join(directory, 'interface.json'), bytes);
  fs.writeFileSync(path.join(directory, 'rmtx.providers.json'), JSON.stringify({ schema: 'xtend.maraca.rmtx-providers.v1', interfaces: [{ file: './interface.json', sha256: hash(bytes) }] }));
  const filePath = path.join(directory, 'app.rmtx'), doc = { filePath, uri: pathToFileURL(filePath).href, text: header + `<RMT.Program id="app"><RMT.State id="age" type="number" initial={42}/><RMT.Surface id="host"><RMT.XTension id="gallery" provider="react-product-gallery" owner="host" lane="visible" props={{title:model.age}}/></RMT.Surface></RMT.Program>` };
  const ls = createRmtxLanguageService({ rootDir: directory, analyzeProject: () => ({ ok: true, diagnostics: [] }) });
  try {
    ls.updateDocument(doc); const result = ls.analyze(doc.uri);
    assert.equal(result.ok, false); assert(result.diagnostics.some(item => /not assignable/u.test(item.message)), JSON.stringify(result.diagnostics));
  } finally { ls.dispose(); }
});

test('qualified State IDs and chained selectors obey longest declared prefixes independent of declaration order', () => {
  const doc = document(header + `<RMT.Program id="app"><RMT.State id="product.detail" type="object" initial={{rows:[{id:1,title:'one'}]}}/>
<RMT.State id="product" type="object" initial={{name:'parent'}}/>
<RMT.Selector id="source" from={model.product.detail.rows}/><RMT.Selector id="selected" from={selectors.source}><RMT.Where test={item.id>0}/></RMT.Selector>
<RMT.Repeat from={selectors.selected} keyBy={item.id}><RMT.Surface id="view"><RMT.View><RMT.Text value={item.title}/><RMT.Text value={model.product.name}/></RMT.View></RMT.Surface></RMT.Repeat></RMT.Program>`);
  const result = checkRmtxProjectTypes([doc], { rootDir }); assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
});

test('Action, State and native component references navigate and rename on original source strings', () => {
  const state = document(header + `<RMT.Program id="state"><RMT.State id="name" type="string" initial="one"/><RMT.Action id="name.changed"><RMT.Input name="value" type="string"/><RMT.Reduce state="name" value={input.value}/></RMT.Action></RMT.Program>`, 'state.rmtx');
  const view = document(header + `<RMT.Program id="app"><RMT.Import path="./state.rmtx"/><RMT.Surface id="view"><RMT.View>
<RMT.Component tag="x-input" ref="email" properties={{value:model.name}}><RMT.On event="input-changed" action="name.changed" payload={{value:'detail.value'}}/></RMT.Component>
</RMT.View></RMT.Surface><RMT.Action id="focus"><RMT.Effect kind="component-command" target="view.email" command="focus" args={{}}/></RMT.Action></RMT.Program>`);
  const ls = service([view, state]);
  try {
    ls.updateDocument(view); const point = position(view.text, offset(view.text, 'name.changed'));
    const definitions = ls.definition(view.uri, point); assert.equal(definitions.length, 1); assert.equal(definitions[0].uri, state.uri);
    const edits = ls.rename(view.uri, point, 'name.updated'); assert(edits.changes[state.uri]); assert(edits.changes[view.uri]);
    const component = ls.definition(view.uri, position(view.text, offset(view.text, 'email'))); assert.equal(component.length, 1);
    assert.equal(component[0].range.start.character, view.text.split('\n')[2].indexOf('email'));
    const rename = ls.rename(view.uri, position(view.text, offset(view.text, 'email')), 'field'); assert.equal(rename.changes[view.uri].length, 2);
  } finally { ls.dispose(); }
});

test('nullable selector results narrow inside declarative When guards without executing source', () => {
  const doc = document(header + `<RMT.Program id="app"><RMT.State id="rows" type="array" initial={[{id:1,title:'one'}]}/>
<RMT.Selector id="first" from={model.rows}><RMT.Find test={item.id===1}/></RMT.Selector>
<RMT.Surface id="view"><RMT.View><RMT.When test={selectors.first!==null}><RMT.Component tag="x-input" properties={{value:selectors.first.title}}/></RMT.When></RMT.View></RMT.Surface></RMT.Program>`);
  const result = checkRmtxProjectTypes([doc], { rootDir }); assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
});

test('references from an imported declaration include unsaved open consumers in its real project', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmtx-editor-project-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const stateText = header + `<RMT.Program id="state"><RMT.State id="product" type="object" initial={{title:'one'}}/></RMT.Program>`;
  const viewText = header + `<RMT.Program id="view"><RMT.Import path="./state.rmtx"/><RMT.Surface id="root"><RMT.View><RMT.Text value={model.product.title}/></RMT.View></RMT.Surface></RMT.Program>`;
  for (const [name, text] of [['state.rmtx', stateText], ['one.rmtx', viewText], ['two.rmtx', viewText.replace('id="view"', 'id="viewTwo"')]]) fs.writeFileSync(path.join(directory, name), text);
  const docs = ['state.rmtx', 'one.rmtx', 'two.rmtx'].map(name => ({ filePath: path.join(directory, name), uri: pathToFileURL(path.join(directory, name)).href, text: fs.readFileSync(path.join(directory, name), 'utf8'), languageId: 'rmtx', version: 1 }));
  const ls = createRmtxLanguageService({ rootDir: directory, syntaxVersion: '8.0.0' });
  try {
    docs.forEach(doc => ls.updateDocument(doc));
    const references = ls.references(docs[0].uri, position(stateText, offset(stateText, 'title')), true);
    assert.deepEqual(new Set(references.map(item => item.uri)), new Set(docs.map(item => item.uri)), JSON.stringify(references));
  } finally { ls.dispose(); }
});

test('navigation never pins a closed disk dependency as a stale editor overlay', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmtx-editor-watch-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const classic = 'template states { state product type object { initial { title "one" } } }';
  const view = header + `<RMT.Program id="app"><RMT.Import path="./state.rmt"/><RMT.Surface id="view"><RMT.View><RMT.Component tag="x-input" properties={{value:model.product.title}}/></RMT.View></RMT.Surface></RMT.Program>`;
  fs.writeFileSync(path.join(directory, 'state.rmt'), classic); fs.writeFileSync(path.join(directory, 'view.rmtx'), view);
  const doc = { filePath: path.join(directory, 'view.rmtx'), uri: pathToFileURL(path.join(directory, 'view.rmtx')).href, text: view, languageId: 'rmtx', version: 1 };
  const ls = createRmtxLanguageService({ rootDir: directory, syntaxVersion: '8.0.0' });
  try {
    ls.updateDocument(doc); const first = ls.analyze(doc.uri); assert.equal(first.ok, true, JSON.stringify(first.diagnostics));
    assert.notEqual(first.schema, ls.schema, 'The analysis DTO and service port have separate schema identities');
    assert(ls.references(doc.uri, position(view, offset(view, 'title')), true).length >= 2);
    fs.writeFileSync(path.join(directory, 'state.rmt'), classic.replace('"one"', '42'));
    const changed = ls.analyze(doc.uri); assert.equal(changed.ok, false); assert(changed.diagnostics.some(item => /not assignable/u.test(item.message)));
  } finally { ls.dispose(); }
});
