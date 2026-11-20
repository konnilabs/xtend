/** Managed rich text shares the existing sanitizer; network resources require an owner port. */
import { createHtmlSanitizer } from '../xtendrmt/html-sanitizer.mjs';
import { getManagedContext, requestManaged, onManagedCleanup } from './native-managed.js';
export function sanitizeManagedHtml(element, html) {
  const result = createHtmlSanitizer(element.ownerDocument.defaultView)(String(html ?? ''));
  if (!result.ok) throw new Error('Native HTML sanitizer unavailable');
  return result.html;
}
export function admitManagedHtml(element, html) {
  const context = getManagedContext(element);
  if (!context?.isActive()) throw new Error('HTML resource admission requires an active owner');
  const template = element.ownerDocument.createElement('template');template.innerHTML = html;
  for (const node of template.content.querySelectorAll('[src],[poster]')) {
    if (node.localName !== 'img') throw new TypeError('Embedded media must use an explicit RMT media component');
    const url = node.getAttribute('src');if (!url) continue;
    if (!['http:','https:','blob:'].includes(new URL(url,element.ownerDocument.baseURI).protocol)) throw new TypeError('Unsafe native HTML image URL');
    const result=context.request('resource.image',{url,context:'rich-text'});
    if (result && typeof result.then==='function') throw new TypeError('HTML image admission must finish before browser URL assignment');
    if (result && typeof result.release==='function') onManagedCleanup(element,()=>result.release());
  }
  return html;
}
