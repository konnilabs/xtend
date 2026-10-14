// Private native shells for component-owned structure. Application UI remains RMT-owned.
import { createSvgElement } from './icon-dom.js';
export { createComponentStyle } from './style-nonce.js';

export function componentNode(documentTarget, tag, attributes = {}, children = []) {
  const node = documentTarget.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined && value !== false) node.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) node.append(typeof child === 'string' ? documentTarget.createTextNode(child) : child);
  return node;
}

export function createCloseIcon(documentTarget, inlineSize = false) {
  const svg = createSvgElement({stroke:'none', nodes: [
    {tag:'circle', attrs:{cx:'12', cy:'12', r:'11', fill:'rgba(255,255,255,0.10)'}},
    {tag:'path', attrs:{d:'M8 8l8 8M16 8l-8 8', stroke:'currentColor', 'stroke-width':'2', 'stroke-linecap':'round'}}
  ]}, {document:documentTarget});
  svg.setAttribute('part', 'close-icon control icon');
  if (inlineSize) { svg.setAttribute('width','1em'); svg.setAttribute('height','1em'); }
  return svg;
}
