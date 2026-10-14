// Component-internal icon materialization. Never attach the parsed SVG document:
// reconstruct only supported geometry in the owning document.
const SVG_NS = 'http://www.w3.org/2000/svg';
const SAFE_NODE_NAMES = new Set(['path', 'line', 'circle', 'rect', 'polyline', 'polygon', 'ellipse', 'g']);
const SAFE_ATTR_NAMES = new Set([
  'd',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'points',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'opacity',
  'fill-rule',
  'clip-rule',
  'transform'
]);

function normalizeName(value) { return String(value || '').trim().toLowerCase(); }
export function isSafeIconUrl(value) {
  const url = String(value || '').trim();
  if (!url) return false;
  const lowered = url.replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
  if (lowered.startsWith('javascript:') || lowered.startsWith('vbscript:')) return false;
  if (lowered.startsWith('data:')) return lowered.startsWith('data:image/');
  return true;
}

function setSafeAttribute(element, name, value) {
  if (!SAFE_ATTR_NAMES.has(name)) return;
  if (value === undefined || value === null || value === false) return;
  const text = String(value);
  // Geometry packs have no external paint servers or CSS expressions.
  if ((name === 'fill' || name === 'stroke') && /url\s*\(|expression\s*\(/i.test(text.replace(/[\u0000-\u001F\u007F]/g, ''))) return;
  element.setAttribute(name, text);
}

function appendSafeSvgNode(parent, sourceNode) {
  const tag = normalizeName(sourceNode && sourceNode.localName);
  if (!SAFE_NODE_NAMES.has(tag)) return;
  const child = parent.ownerDocument.createElementNS(SVG_NS, tag);
  Array.from(sourceNode.attributes || []).forEach((attribute) => {
    setSafeAttribute(child, normalizeName(attribute.name), attribute.value);
  });
  Array.from(sourceNode.children || []).forEach((nestedNode) => {
    appendSafeSvgNode(child, nestedNode);
  });
  parent.appendChild(child);
}

function appendSafeSvgMarkup(svg, markup, options) {
  const Parser = svg.ownerDocument.defaultView?.DOMParser || globalThis.DOMParser;
  if (!markup || !Parser || /<!\s*(?:DOCTYPE|ENTITY)\b/i.test(String(markup))) return;
  const parsed = new Parser().parseFromString(String(markup), 'image/svg+xml');
  const sourceSvg = parsed.documentElement;
  if (!sourceSvg || normalizeName(sourceSvg.localName) !== 'svg' || parsed.getElementsByTagName('parsererror').length) return;
  if (options.preserveRootAttributes) {
    Array.from(sourceSvg.attributes).forEach(attribute => setSafeAttribute(svg, normalizeName(attribute.name), attribute.value));
  }
  const parsedViewBox = sourceSvg.getAttribute('viewBox');
  if (parsedViewBox) svg.setAttribute('viewBox', parsedViewBox);
  Array.from(sourceSvg.children || []).forEach((sourceNode) => {
    appendSafeSvgNode(svg, sourceNode);
  });
}

export function createSvgElement(record, options = {}) {
  const documentTarget = options.document || globalThis.document;
  const svg = documentTarget.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('part', 'svg');
  svg.setAttribute('viewBox', record.viewBox || '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('fill', 'none');
  setSafeAttribute(svg, 'fill', record.fill || 'none');
  svg.setAttribute('stroke', 'currentColor');
  setSafeAttribute(svg, 'stroke', record.stroke || 'currentColor');
  svg.setAttribute('stroke-width', String(options.strokeWidth || '2'));
  svg.setAttribute('stroke-linecap', record.strokeLinecap || 'round');
  svg.setAttribute('stroke-linejoin', record.strokeLinejoin || 'round');

  (record.nodes || []).forEach((node) => {
    const tag = normalizeName(node && node.tag || 'path');
    if (!SAFE_NODE_NAMES.has(tag)) return;
    const child = documentTarget.createElementNS(SVG_NS, tag);
    Object.entries(node.attrs || {}).forEach(([attrName, attrValue]) => {
      setSafeAttribute(child, attrName, attrValue);
    });
    svg.appendChild(child);
  });
  appendSafeSvgMarkup(svg, record.svg, options);
  return svg;
}

export function createUrlElement(record, options = {}) {
  const img = (options.document || globalThis.document).createElement('img');
  img.part = 'image';
  img.alt = options.decorative ? '' : options.label || record.name || '';
  img.decoding = 'async';
  img.loading = 'lazy';
  if (isSafeIconUrl(record.src)) {
    img.src = record.src;
  }
  return img;
}

