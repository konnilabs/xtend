/** One sanitized HTML boundary for local, explicitly injected highlighting providers. */
import { createHtmlSanitizer } from '../xtendrmt/html-sanitizer.mjs';
import { requestManaged } from './native-managed.js';
const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export function highlightManagedCode(element, code, language) {
  if (language === 'text' || !language) return { html: escape(code), highlighted: false, engine: 'plain', language: language || 'text' };
  const result = requestManaged(element, 'resource.highlight', { code, language });
  if (!result || typeof result !== 'object' || typeof result.then === 'function' || typeof result.highlighted !== 'boolean') throw new TypeError('The local highlighting port must return a synchronous highlight DTO');
  if (!result.highlighted) return { html: escape(code), highlighted: false, engine: 'plain', language };
  if (typeof result.html !== 'string') throw new TypeError('Highlighted code must contain sanitized HTML');
  const sanitized = createHtmlSanitizer(element.ownerDocument.defaultView)(result.html);
  if (!sanitized.ok) throw new Error('Native highlighting sanitizer unavailable');
  const template = element.ownerDocument.createElement('template'); template.innerHTML = sanitized.html;
  for (const node of template.content.querySelectorAll('*')) {
    if (!['span','mark','code'].includes(node.localName)) throw new TypeError('Highlight providers may only return token markup');
    for (const attr of [...node.attributes]) if (attr.name !== 'class') node.removeAttribute(attr.name);
  }
  return { html: template.innerHTML, highlighted: true, engine: typeof result.engine === 'string' ? result.engine : 'local', language };
}
