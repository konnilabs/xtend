export const PAGE_RESPONSE_SCHEMA = 'xtend.page-response.v1';
export const PAGE_MANIFEST_SCHEMA = 'xtend.page-manifest.v1';
export function pagePagination({next = null, previous = null, props}) {
  if (!Array.isArray(props) || !props.length) throw pageError('page.pagination_props','Pagination requires prop names.');
  if ([next,previous].some(url=>url!==null && typeof url!=='string')) throw pageError('page.pagination_url','Invalid pagination URL.');
  return {next,previous,props:props.map(assertKey)};
}
export function mergePageHead(layout = [], page = []) {
  const records = new Map();
  for (const record of [...layout, ...page]) {
    const key = record.tag === 'title' ? 'title' : record.tag === 'meta' ? `meta:${record.attributes?.name || record.attributes?.property || record.attributes?.charset || ''}` : '';
    if (!key || key === 'meta:') throw pageError('page.invalid_head', 'Head entries require a title or an identified meta tag.');
    records.set(key, record);
  }
  return [...records.values()];
}
export function composePageDescriptor(layout, page) {
  if (!layout) return page;
  let count = 0;
  function visit(node) {
    if (Array.isArray(node)) return node.map(visit);
    if (!node || typeof node !== 'object') return node;
    if (node.pageOutlet === true) { count++; return {type:'element',tag:'div',attributes:{'data-xtend-page-slot':{op:'literal',value:'true'}},children:[page]}; }
    const result = {...node};
    for (const key of ['children','nodes']) if (node[key]) result[key] = visit(node[key]);
    if (node.slots) result.slots = Object.fromEntries(Object.entries(node.slots).map(([name,value]) => [name,visit(value)]));
    return result;
  }
  const descriptor = visit(layout);
  if (count !== 1) throw pageError('page.layout_outlet', 'A page layout must declare exactly one pageOutlet.');
  return descriptor;
}
const provider = Symbol('xtend.page.provider');
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
export function pageError(code, message, status = 500) { return Object.assign(new Error(message), { code, status }); }
export function assertKey(key) {
  if (typeof key !== 'string' || !key || key.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) throw pageError('page.unsafe_key', 'Invalid page data key.', 400);
  return key;
}
export const Prop = Object.freeze({
  lazy: resolve => ({ [provider]: true, kind: 'lazy', resolve }),
  defer: (resolve, group = 'default') => ({ [provider]: true, kind: 'defer', resolve, group: assertKey(group) }),
  merge: (resolve, options = {}) => ({ [provider]: true, kind: 'merge', resolve, mode: 'append', ...options }),
  once: (resolve, options = {}) => ({ [provider]: true, kind: 'once', resolve, ttl: 60000, ...options })
});
export function parsePageSelection(headers) {
  const header = name => typeof headers.get === 'function' ? headers.get(name) : headers[name.toLowerCase()];
  const list = name => {
    const raw = header(name);
    if (!raw) return null;
    try { const values = JSON.parse(raw); if (!Array.isArray(values) || values.length > 256) throw new Error(); return values.map(assertKey); }
    catch { throw pageError('page.invalid_selection', `Invalid ${name}.`, 400); }
  };
  return { only: list('X-XTend-Only'), deferred: list('X-XTend-Deferred'), once: list('X-XTend-Once') || [], prefetch: header('X-XTend-Prefetch') === '1' };
}
export async function resolvePageProps(input, context = {}, selection = {}) {
  const props = Object.create(null), deferred = Object.create(null), merge = Object.create(null), once = Object.create(null);
  const tasks = [];
  for (const [key, source] of Object.entries(input || {})) {
    assertKey(key);
    const record = source?.[provider] ? source : { kind: 'value', resolve: source };
    if (record.kind === 'defer' && !selection.deferred?.includes(record.group)) { (deferred[record.group] ||= []).push(key); continue; }
    if (selection.deferred && !(record.kind === 'defer' && selection.deferred.includes(record.group))) continue;
    if (selection.only && !selection.only.includes(key)) continue;
    if (record.kind === 'lazy' && !selection.only?.includes(key)) continue;
    if (record.kind === 'once') {
      if (!Number.isSafeInteger(record.ttl) || record.ttl < 1) throw pageError('page.once_ttl', 'Once data requires a positive integer TTL.');
      const token = assertKey(record.key || key);
      once[key] = { key: token, ttl: record.ttl };
      if (selection.once?.includes(token)) continue;
    }
    tasks.push((async () => {
      context.signal?.throwIfAborted();
      const value = typeof record.resolve === 'function' ? await record.resolve(context) : record.resolve;
      context.signal?.throwIfAborted();
      props[key] = value;
      if (record.kind === 'merge') {
        if (!['replace', 'append', 'prepend'].includes(record.mode)) throw pageError('page.merge_mode', 'Unsupported page merge mode.');
        merge[key] = { mode: record.mode, key: record.key || null };
      }
    })());
  }
  await Promise.all(tasks);
  return { props, deferred, merge, once };
}
export function mergePageProps(previous, incoming, rules = {}) {
  const result = { ...previous };
  for (const [key, value] of Object.entries(incoming || {})) {
    assertKey(key);
    const rule = rules[key];
    if (rule && !['replace', 'append', 'prepend'].includes(rule.mode)) throw pageError('page.merge_mode', 'Unsupported page merge mode.');
    if (!rule || rule.mode === 'replace' || !Array.isArray(value) || !Array.isArray(result[key])) { result[key] = value; continue; }
    const old = result[key];
    if (!rule.key) result[key] = rule.mode === 'prepend' ? [...value, ...old] : [...old, ...value];
    else {
      assertKey(rule.key);
      const identity = entry => rule.key.split('.').reduce((owner, field) => owner?.[field], entry);
      const validIdentity = entry => ['string', 'number'].includes(typeof identity(entry)) && (typeof identity(entry) !== 'number' || Number.isFinite(identity(entry)));
      const incomingById = new Map(value.map(entry => [identity(entry), entry]));
      const oldIds = new Set(old.map(identity));
      if (value.some(entry => !validIdentity(entry)) || old.some(entry => !validIdentity(entry)) || incomingById.size !== value.length || oldIds.size !== old.length) throw pageError('page.merge_identity', 'Merge values need unique identities.');
      const updated = old.map(entry => incomingById.get(identity(entry)) || entry);
      const added = value.filter(entry => !oldIds.has(identity(entry)));
      result[key] = rule.mode === 'prepend' ? [...added, ...updated] : [...updated, ...added];
    }
  }
  return result;
}
export function safePageJson(value) {
  return JSON.stringify(value, (key, value) => {
    if (key) assertKey(key);
    if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'number' && !Number.isFinite(value)) throw pageError('page.non_json_data', 'Page data must be JSON serializable.');
    return value;
  }).replace(/[<>&\u2028\u2029]/gu, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
export function validatePageResponse(page) {
  if (page?.schema !== PAGE_RESPONSE_SCHEMA || typeof page.version !== 'string' || !page.version || typeof page.contextKey !== 'string' || !page.contextKey || !['page', 'redirect', 'reload'].includes(page.kind)) throw pageError('page.invalid_response', 'Invalid XTend page response.');
  if (page.kind === 'page' && (typeof page.page !== 'string' || typeof page.url !== 'string' || !page.props || typeof page.props !== 'object' || Array.isArray(page.props))) throw pageError('page.invalid_response', 'Invalid page data.');
  if (page.kind !== 'page' && (typeof page.location !== 'string' || !page.location)) throw pageError('page.invalid_response','A redirect requires a destination.');
  return page;
}
