const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');
const path = require('path');
const { readText, resolveRootDir } = require('../utils/files');

const FULL_ATTRIBUTES = [
  'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength',
  'minlength', 'rows', 'label', 'busy', 'invalid', 'density', 'fill',
  'submit-on-enter', 'submit-command', 'syntax-highlight', 'highlight', 'line-numbering', 'lang', 'language'
];
const FULL_EVENTS = ['textarea-changed', 'textarea-invalid', 'textarea-submit', 'xtend-command'];
const FULL_METHODS = ['checkValidity', 'reportValidity', 'validate', 'reset', 'focus', 'snapshot'];

function runXTextareaComponentSuite(options = {}) {
  const result = runPriorityComponentSuite('x-textarea', options);
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const source = readText('src/components/x-textarea/x-textarea.ts', rootDir);
  const contract = readText('src/components/x-textarea/x-textarea.contract.ts', rootDir);
  const rmt = readText('src/components/x-textarea/x-textarea.rmt.ts', rootDir);
  const sourceFixture = readText('src/components/x-textarea/x-textarea.fixture.ts', rootDir);
  const runtime = readText('components/xtextarea.js', rootDir);
  const types = readText('components/xtextarea.d.ts', rootDir);
  const fixture = readText('tests/components/fixtures/xtextarea.component.html', rootDir);
  const maracaRuntime = readText('xtend-maraca/index.js', rootDir);

  const assert = (condition, message) => {
    if (condition) result.passes.push(message);
    else result.failures.push(message);
  };
  const includesAll = (content, values) => values.every((value) => content.includes(`'${value}'`) || content.includes(`\"${value}\"`));

  assert(includesAll(source, FULL_ATTRIBUTES), 'x-textarea TypeScript source declares the full public attribute surface');
  assert(includesAll(contract, FULL_ATTRIBUTES), 'x-textarea component contract declares the full public attribute surface');
  assert(includesAll(source, FULL_EVENTS), 'x-textarea TypeScript source declares all public events');
  assert(includesAll(contract, FULL_EVENTS), 'x-textarea component contract declares all public events');
  assert(includesAll(rmt, FULL_EVENTS), 'x-textarea RMT metadata declares all public events');
  assert(FULL_ATTRIBUTES.every((attribute) => sourceFixture.includes(attribute)) && includesAll(sourceFixture, FULL_EVENTS), 'x-textarea fixture metadata covers the complete public surface');
  assert(['XTextareaChangedEventDetail', 'XTextareaInvalidEventDetail', 'XTextareaSubmitEventDetail', 'XTextareaCommandEventDetail'].every((payloadType) => source.includes(payloadType) && contract.includes(payloadType) && rmt.includes(payloadType) && runtime.includes(payloadType) && types.includes(payloadType)), 'x-textarea source, runtime, types and metadata name every public event payload consistently');
  assert(FULL_METHODS.every((method) => source.includes(`${method}(`)), 'x-textarea TypeScript source declares every public method');
  assert(FULL_METHODS.every((method) => contract.includes(`${method}(`)), 'x-textarea component contract declares every public method');
  assert(types.includes('trimmedLength: number') && types.includes('empty: boolean'), 'x-textarea public payload types match runtime length semantics');
  assert(types.includes("'xtend-command': XTextareaCommandEventDetail"), 'x-textarea types expose the RMT command bridge payload');
  assert(types.includes('export declare const XTextarea: XTextareaConstructor'), 'x-textarea declaration types its productive named runtime export');
  assert(source.includes('this.control.validity.valid') && runtime.includes('this._control.validity.valid'), 'x-textarea passive form synchronization reads validity without dispatching invalid events');
  assert(!/_syncFormValue\(\)\s*\{[\s\S]*?this\.checkValidity\(\)/u.test(runtime), 'x-textarea passive runtime sync never calls the eventful public validity API');
  assert(!/reportValidity\(\)\s*\{[\s\S]*?this\._control\.reportValidity\(\);[\s\S]*?this\._onInvalid\(\)/u.test(runtime), 'x-textarea reportValidity relies on one native invalid event');
  assert(runtime.includes("setIfPresent") === false, 'x-textarea runtime remains independent from Maraca state helpers');
  assert([
    'passive value sync emits no invalid event',
    'checkValidity emits one invalid event',
    'reportValidity emits one invalid event',
    'validate emits one invalid event',
    'passive valid sync clears invalid without event',
    'Shift Enter preserves multiline behavior'
  ].every((check) => fixture.includes(check)), 'x-textarea browser fixture separates passive validity sync from explicit validation semantics');
  assert(['readonly', 'busy', 'fill', 'highlight', 'lang', 'language'].every((attribute) => maracaRuntime.includes(`setIfPresent(\"${attribute}\")`)), 'Maraca runtime synchronizes direct XTextarea state attributes');
  assert(['submitCommand', 'submitOnEnter', 'syntaxHighlight', 'lineNumbering'].every((stateKey) => maracaRuntime.includes(`\"${stateKey}\"`)), 'Maraca runtime synchronizes mapped XTextarea state attributes');
  result.ok = result.failures.length === 0;
  return result;
}

function printXTextareaComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXTextareaComponentSuite();
  printXTextareaComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXTextareaComponentReport,
  runXTextareaComponentSuite
};
