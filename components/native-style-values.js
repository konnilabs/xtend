/** Small typed CSS values for reviewed managed sinks; no declarations or stylesheet input. */
function scalar(value, attribute) {
  if (typeof value !== 'string' || value.length > 4096) throw new TypeError(`Invalid managed ${attribute} value`);
  const text=value.trim();
  if (!text || /[<>{};\\'"!@\u0000-\u001f\u007f]/.test(text) || text.includes('/*') || text.includes('*/')) throw new TypeError(`Unsafe managed ${attribute} value`);
  return text;
}
function functions(text, allowed, attribute) {
  for (const match of text.matchAll(/([a-zA-Z_-][a-zA-Z0-9_-]*)\s*\(/g)) if (!allowed.has(match[1].toLowerCase())) throw new TypeError(`Unsupported managed ${attribute} function`);
}
const colors=new Set(['var','rgb','rgba','hsl','hsla','hwb','lab','lch','oklab','oklch','color','color-mix','light-dark']);
const dimensions=new Set(['var','calc','min','max','clamp','env']);
export function managedColor(element,value,attribute='color') {
  const text=scalar(value,attribute);functions(text,colors,attribute);
  const style=element.ownerDocument.createElement('span').style;style.setProperty('color',text);
  if (!style.getPropertyValue('color')) throw new TypeError(`Invalid managed ${attribute} color`);
  return text;
}
export function managedDimension(element,value,attribute) {
  if (!['width','height'].includes(attribute)) throw new TypeError('Managed dimensions require width or height');
  const text=scalar(value,attribute);functions(text,dimensions,attribute);
  const style=element.ownerDocument.createElement('span').style;style.setProperty(attribute,text);
  if (!style.getPropertyValue(attribute)) throw new TypeError(`Invalid managed ${attribute} dimension`);
  return text;
}
export function managedImageURL(element,value,attribute='background-image') {
  if (typeof value !== 'string' || value.length>4096 || /[<>{}\\\u0000-\u001f\u007f]/.test(value)) throw new TypeError(`Unsafe managed ${attribute} URL`);
  let raw=value.trim();
  if (/^url\s*\(/i.test(raw)) {
    const match=/^url\(\s*(?:"([^"\\]*)"|'([^'\\]*)'|([^'"\\()\s]+))\s*\)$/i.exec(raw);
    if (!match) throw new TypeError(`Managed ${attribute} requires exactly one URL`);
    raw=match[1]??match[2]??match[3];
  } else if (/^[a-zA-Z_-][a-zA-Z0-9_-]*\s*\(/.test(raw)) throw new TypeError(`Managed ${attribute} requires one direct URL`);
  if (!raw) throw new TypeError(`Managed ${attribute} requires a nonempty URL`);
  const url=new URL(raw,element.ownerDocument.baseURI);
  if (!['http:','https:','blob:'].includes(url.protocol)) throw new TypeError(`Unsafe managed ${attribute} protocol`);
  return url.href;
}
export function managedImageCSS(url) { return `url(${JSON.stringify(url)})`; }
export function prepareManagedColorAttribute(element,context,attribute) {
  context.onCleanup(context.registerProjectionValidator(({attributes})=>{const value=attributes[attribute];if(value!==undefined&&value!==null&&value!=='')managedColor(element,value,attribute);}));
}
