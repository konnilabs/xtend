// SPDX-License-Identifier: Apache-2.0
'use strict';
// Closed Source7 primitive sinks; no compiler or legacy runtime dependency.
const NATIVE_VIEW_MAX_KEY_LENGTH = 4096;
const NATIVE_VIEW_TAG_NAMES = Object.freeze(('a abbr address article aside audio b bdi bdo blockquote br button caption code col colgroup data datalist dd del details dfn dialog div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr i img input ins kbd label legend li main mark menu meter nav ol optgroup option output p picture pre progress q rp rt ruby s samp section select small source span strong sub summary sup table tbody td textarea tfoot th thead time tr track u ul var video wbr').split(' '));
const NATIVE_VIEW_PROPERTY_NAMES = Object.freeze(('value checked disabled selected readOnly required multiple indeterminate tabIndex title placeholder name type id open').split(' '));
const NATIVE_VIEW_VOID_TAG_NAMES = Object.freeze('br col hr img input source track wbr'.split(' '));
const properties = new Set(NATIVE_VIEW_PROPERTY_NAMES);
const blocked = new Set(['style', 'slot', 'part', 'srcdoc', 'innerhtml', 'outerhtml', 'insertadjacenthtml', '__proto__', 'prototype', 'constructor', 'srcset']);
function assertNativeAttributeName(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*$/u.test(value) || value.startsWith('on') || blocked.has(value)
    || ['data-rmt-', 'data-rmtx-', 'data-maraca-', 'data-xt-', 'data-xtend-'].some(prefix => value.startsWith(prefix))) throw new TypeError('Native attributes require safe static names without internal markers or executable sinks.');
}
function assertNativePropertyName(value) { if (!properties.has(value)) throw new TypeError('Native properties require the declared closed property names.'); }
function assertNativeDomId(value) { if (value !== null && (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/u.test(value))) throw new TypeError('Native DOM ids require a static selector-safe string or null.'); }
module.exports = { NATIVE_VIEW_MAX_KEY_LENGTH, NATIVE_VIEW_TAG_NAMES, NATIVE_VIEW_PROPERTY_NAMES, NATIVE_VIEW_VOID_TAG_NAMES, assertNativeAttributeName, assertNativePropertyName, assertNativeDomId };
