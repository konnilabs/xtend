// SPDX-License-Identifier: Apache-2.0
'use strict';
// This is the reviewed grant list, not an inference from Shadow DOM or observedAttributes.
// The generator only pins bytes. Adding a method/attribute to a class never adds a grant.
const string = { type: 'string' }, number = { type: 'number' }, boolean = { type: 'boolean' }, json = { type: 'json', nullable: true };
const array = items => ({ type: 'array', items });
const object = (fields = {}, optional = []) => ({ type: 'object', fields, ...(optional.length ? { optional } : {}) });
const event = (fields = {}, required = []) => ({ payload: object({ detail: object(fields, Object.keys(fields).filter(key => !required.includes(key))) }) });
const command = (args = {}, capability = 'component.command', result = json, optional = []) => ({ args: object(args, optional), result, capability });
const attrs = (text = '', flags = '') => ({ ...Object.fromEntries(text.split(' ').filter(Boolean).map(key => [key, { ...string, nullable: true }])), ...Object.fromEntries(flags.split(' ').filter(Boolean).map(key => [key, { ...boolean, nullable: true }])) });
const events = (names, fields = {}) => Object.fromEntries(names.split(' ').filter(Boolean).map(key => [key, event(fields)]));
const commonControl = { value: string, message: string, source: string };
const toggleControl = { checked: boolean, value: string, name: string, message: string, source: string };
const overlay = { id: { ...string, nullable: true }, open: boolean, source: string, placement: string, modal: boolean };
const controlSlots = ['label', 'hint', 'error'];
const focus = { focus: command({}, 'component.focus') };
const validity = { checkValidity: command({}, 'component.validity', boolean), reportValidity: command({}, 'component.validity', boolean), validate: command({}, 'component.validity', boolean) };
const definitions = {};
function ui(tag, attributes, properties = {}, declaredEvents = {}, commands = {}, slots = ['default'], capabilities = [], controlled = []) {
  definitions[tag] = { role: 'ui', ownership: 'shadow', attributes, properties, events: declaredEvents, commands, slots,
    capabilities: [...new Set([...Object.values(commands).map(spec => spec.capability), ...capabilities])], state: { controlled, ephemeral: ['focus', 'selection', 'animation', 'draft'] }, dom: { authorChildren: 'preserve', writes: 'shadow-only' } };
}
ui('x-button', attrs('label data-label text variant size icon icon-name icon-pack aria-label aria-busy', 'disabled loading overlay'), { title: string }, events('loading-start loading-end click focus blur button-interaction', { disabled: boolean, loading: boolean, busy: boolean, label: string, type: string, key: string }), { ...focus, setLoading: command({ loading: boolean }) }, ['default'], [], ['disabled', 'loading']);
ui('x-header', attrs('src logo-size title brand-collapse menu-mode menu-placement menu-breakpoint menu-width menu-max-height menu-align', 'sticky shadow menu-modal menu-open'), { title: string }, events('header-ready header-layout-changed header-brand-visibility-changed menu-before-open menu-before-close menu-opened menu-closed menu-mode-changed menu-placement-changed logo-loaded', { menuOpen: boolean, title: string, menuMode: string, menuPlacement: string, source: string, previousPresentation: string, oldValue: { ...string, nullable: true }, newValue: { ...string, nullable: true } }), { toggleMenu: command({ open: boolean }, 'surface.overlay'), isMenuOpen: command({}, 'component.snapshot', boolean) }, ['actions', 'logo', 'nav', 'search', 'title', 'utility'], ['surface.overlay', 'resource.image'], ['menu-open']);
ui('x-icon', attrs('name pack src label size stroke-width color', 'decorative'), { name: string }, events('icon-ready icon-missing icon-pack-registered', { name: string, pack: string, src: string, resolved: boolean, iconCount: number, cdnAllowed: boolean }), { setIcon: command({ name: string }, 'resource.icon') }, [], ['resource.icon']);
ui('x-cards', attrs('columns gap'), {}, events('cards-layout', { columns: string, gap: string }), {}, ['default']);
ui('x-footer', attrs('src logo-size', 'sticky'), {}, events('footer-ready theme-applied logo-loaded', { theme: { ...string, nullable: true }, src: { ...string, nullable: true }, sticky: boolean }), {}, ['title', 'nav', 'extra'], ['resource.image']);
ui('x-progress', attrs('value max label status', 'indeterminate busy'), { value: number }, events('progress-changed progress-complete', { value: number, max: number, percent: number, source: string }), { setProgress: command({ value: number }), complete: command(), reset: command() }, ['default', 'label'], [], ['value']);
ui('x-section', attrs('padding background layout label', 'bordered'), {}, events('section-rendered', { layout: string, label: string }), {}, ['default']);
ui('x-status', attrs('type state message polite label', 'dismissible busy'), {}, events('status-changed status-dismissed', { type: string, status: string, message: string, busy: boolean, source: string }), { announce: command({ message: string }, 'a11y.announce'), dismiss: command() }, ['default', 'label'], [], ['state', 'message', 'busy']);
ui('x-summary', attrs('type', 'open'), {}, events('open close', { open: boolean }), { open: command(), close: command(), toggle: command() }, ['default', 'title'], [], ['open']);
ui('x-type', attrs('texts speed pause cursor', 'blinking-cursor loop'), { texts: array(string) }, events('typing-started typing-completed text-erased', { text: string }), { pause: command(), resume: command() }, []);
ui('x-input', attrs('type name value placeholder accept', 'required disabled multiple'), { value: string }, { 'input-changed': event({ ...commonControl, fileCount: number, files: array(object({ handle: string, name: string, type: string, size: number, lastModified: number })) }, ['value']), 'validation-failed': event(commonControl, ['value', 'message']) }, { ...focus, ...validity, reset: command() }, controlSlots, ['file.select'], ['value']);
ui('x-textarea', attrs('name value placeholder maxlength minlength rows label density fill lang language', 'required disabled readonly busy invalid submit-on-enter syntax-highlight highlight line-numbering'), { value: string, lineNumbering: boolean }, events('textarea-changed textarea-invalid textarea-submit', { ...commonControl, length: number, trimmedLength: number, empty: boolean, maxLength: number, highlighted: boolean, highlightEngine: string, highlightLanguage: string }), { ...focus, ...validity, reset: command() }, controlSlots, ['resource.highlight'], ['value']);
for (const [tag, attributes, properties, declaredEvents] of [
  ['x-checkbox', attrs('name value label', 'checked disabled required indeterminate'), { checked: boolean, value: string, indeterminate: boolean }, 'checkbox-changed checkbox-invalid'],
  ['x-toggle', attrs('name value label density', 'checked disabled required busy invalid'), { checked: boolean, value: string }, 'toggle-changed toggle-invalid'],
  ['x-radio', attrs('name value label', 'checked disabled required'), { checked: boolean, value: string }, 'radio-changed radio-invalid']
]) ui(tag, attributes, properties, events(declaredEvents, toggleControl), { ...focus, ...validity, reset: command(), ...(tag === 'x-radio' ? { check: command() } : { toggle: command() }) }, ['default', ...controlSlots], [], ['checked', 'value']);
ui('x-select', attrs('name value placeholder label', 'disabled required multiple'), { value: string, values: array(string), multiple: boolean }, events('select-changed select-invalid', { ...commonControl, values: array(string) }), { ...focus, ...validity, reset: command() }, ['default', ...controlSlots], [], ['value', 'values']);
ui('x-calendar', attrs('value min max name locale', 'disabled required'), { value: string }, { 'date-select': event({ value: string, date: string, source: string }, ['value']) }, { ...focus, checkValidity: validity.checkValidity, reportValidity: validity.reportValidity, reset: command() }, [], [], ['value']);
ui('x-form', attrs('name'), {}, { submit: event({ data: json }, ['data']), invalid: event({ message: string, invalidRefs: array(string) }, ['message']), reset: event({ source: string }) }, { validate: validity.validate, submit: command({}, 'form.submit'), reset: command({}, 'form.reset') }, ['default'], ['form.submit', 'form.reset']);
ui('x-link', attrs('href target rel navigation download', 'active'), { state: json }, events('before-navigate after-navigate', { href: string, path: string, mode: string, state: json, navigationKind: string, fallbackReason: { ...string, nullable: true }, source: string }), { ...focus }, ['default'], ['router.navigate', 'file.download'], ['active']);
ui('x-tabs', attrs('selected text-color orientation'), {}, { 'tab-selected': event({ index: number }, ['index']) }, { selectTab: command({ index: number }) }, ['default'], [], ['selected']);
ui('x-menu', attrs('orientation'), {}, events('item-clicked navigation-requested keyboard-navigation menu-item-clicked menu-navigation menu-keyboard-navigation', { href: { ...string, nullable: true }, index: number, key: string, fromIndex: number, toIndex: number, path: string, label: string, source: string }), {}, ['default'], ['router.navigate']);
ui('x-hero', attrs('background background-light background-dark background-image align vertical-align overlay-light overlay-dark font-color font-color-light font-color-dark text-box', 'fullheight overlay animate scroll-button'), {}, events('hero-rendered hero-animated', { background: { ...string, nullable: true }, fullheight: boolean, overlay: boolean }), { scrollPast: command({}, 'surface.scroll') }, ['default', 'hero-title'], ['resource.image', 'surface.scroll']);
ui('x-code', attrs('lang language'), { code: string }, events('code-copied', { code: string, language: string }), { hydrate: command({}, 'resource.highlight') }, ['default'], ['resource.highlight', 'clipboard.write']);
ui('x-masonry', attrs('columns gap', 'save-positions'), {}, events('masonry-layout', { columns: string, gap: string, order: array(string) }), {}, ['default'], ['layout.measure']);
ui('x-alert', attrs('type duration aria-label', 'closable overlay'), {}, events('alert-shown alert-dismissed', { id: string, message: string, type: string, closable: boolean, duration: number, overlay: boolean, ariaLabel: { ...string, nullable: true }, dismissed: boolean, reason: string, source: string }), { dismiss: command({ reason: string }, 'surface.overlay') }, ['default'], ['surface.overlay']);
ui('x-dialog', attrs('title width height', 'open overlay'), {}, events('dialog-opened dialog-closed', overlay), { open: command({}, 'surface.overlay'), close: command({}, 'surface.overlay') }, ['default', 'actions'], ['surface.overlay'], ['open']);
ui('x-drawer', attrs('placement label', 'open modal route-aware'), { open: boolean }, events('drawer-opened drawer-closed drawer-route-selected', { ...overlay, routeRef: { ...string, nullable: true } }), { openDrawer: command({}, 'surface.overlay'), closeDrawer: command({}, 'surface.overlay'), toggle: command({}, 'surface.overlay') }, ['default', 'trigger', 'header', 'footer'], ['surface.overlay'], ['open']);
ui('x-keymap', attrs('title locale platform', 'open'), { entries: array(object({ id: string, label: string, icon: string, sequence: array(string), group: string }, ['label', 'icon', 'sequence', 'group'])) }, { 'xkeymap-close': event({ reason: string }, ['reason']), keydown: event({ key: string }), click: event() }, { open: command({}, 'surface.overlay'), close: command({ reason: string }, 'surface.overlay'), isOpen: command({}, 'component.snapshot', boolean) }, [], ['surface.overlay', 'keyboard.scoped'], ['open']);
ui('x-lightbox', attrs('src alt', 'open'), {}, events('lightbox-opened lightbox-closed', { src: string }), { open: command({}, 'surface.overlay'), close: command({}, 'surface.overlay') }, ['trigger'], ['surface.overlay', 'resource.image'], ['open']);
ui('x-modal', attrs('title content', 'open overlay'), { actions: array(object({ label: string, action: string, primary: boolean, close: boolean }, ['primary', 'close'])) }, events('modal-opened modal-closed modal-action', { ...overlay, action: string }), { open: command({}, 'surface.overlay'), close: command({}, 'surface.overlay') }, ['default', 'actions'], ['surface.overlay'], ['open']);
ui('x-popover', attrs('placement anchor label', 'open modal'), { open: boolean }, events('popover-opened popover-closed', overlay), { show: command({}, 'surface.overlay'), hide: command({}, 'surface.overlay'), toggle: command({}, 'surface.overlay') }, ['default', 'actions', 'trigger'], ['surface.overlay'], ['open']);
ui('x-spinner', attrs('size color speed type aria-label aria-busy aria-valuetext', 'paused overlay'), {}, events('spinner-started spinner-stopped paused resumed', { id: string, paused: boolean, source: string, stateKey: string }), { pause: command(), resume: command() }, ['default'], ['surface.overlay'], ['paused']);
ui('x-toast', attrs('type duration'), {}, events('toast-shown toast-dismissed', { id: string, message: string, type: string, duration: number, dismissed: boolean, reason: string, source: string }), { dismiss: command({ reason: string }, 'surface.overlay') }, ['default'], ['surface.overlay']);
ui('x-tooltip', attrs('for placement delay label', 'open'), { open: boolean }, events('tooltip-opened tooltip-closed', overlay), { show: command({}, 'surface.overlay'), hide: command({}, 'surface.overlay'), toggle: command({}, 'surface.overlay') }, ['default', 'trigger'], ['surface.overlay', 'a11y.anchor'], ['open']);
ui('x-player', attrs('src poster type title height width', 'media-chooser downloadable autoplay'), { playing: boolean, currentTime: number, volume: number, muted: boolean }, events('xplayer-remote-play xplayer-play xplayer-pause xplayer-state xplayer-fullscreen xplayer-pip xplayer-caption xplayer-mute', { src: { ...string, nullable: true }, type: string, playing: boolean, currentTime: number, volume: number, muted: boolean, fullscreen: boolean }), { play: command({}, 'media.play'), pause: command({}, 'media.pause'), playMedia: command({}, 'media.play'), pauseMedia: command({}, 'media.pause'), setMediaState: command({ state: object({ playing: boolean, currentTime: number, volume: number, muted: boolean }, ['playing', 'currentTime', 'volume', 'muted']) }, 'media.control') }, [], ['media.play', 'media.pause', 'media.control', 'resource.media', 'file.select', 'file.download', 'media.fullscreen', 'media.pip'], ['playing', 'currentTime', 'volume', 'muted']);
ui('x-writer', attrs('storage-key api method autosave'), { value: string }, { 'writer:change': event({ html: string, markdown: string, plain: string, source: string }, ['html', 'markdown', 'plain']), 'writer:save': event({ status: json, response: json }), 'writer:error': event({ error: object({ name: string, message: string }) }), 'writer:autosave': event({ source: string }), 'writer:export': event({ filename: string, success: boolean, error: string }) }, { ...focus, reset: command(), save: command({}, 'writer.network'), exportMarkdown: command({}, 'writer.export'), exportHTML: command({}, 'writer.export'), getHTML: command({}, 'component.snapshot', string), getText: command({}, 'component.snapshot', string), getMarkdown: command({}, 'component.snapshot', string) }, [], ['writer.network', 'writer.storage', 'writer.export', 'resource.markdown', 'html.sanitize'], ['value']);
for (const [tag, attributes, capability] of [
  ['x-router', attrs('mode navigation-policy skeleton skeleton-profile skeleton-lines skeleton-min-height title-template document-title-template title-prefix title-suffix default-title', 'reuse-component adopt-prerendered-route'), 'router.bind'],
  ['x-side-panel', attrs('panel-id placement width min-width max-width label state', 'open modal persistent'), 'surface.bind'],
  ['x-surface-manager', attrs('manager-id mode', 'debug'), 'surface.manager.bind'],
  ['x-surface-portal', attrs('portal-id policy layer for z-index-start z-step'), 'surface.portal.bind'],
  ['x-surface-region', attrs('region-id surface-id region role policy'), 'surface.bind'],
  ['x-surface-window', attrs('surface-id window-id title x y width height min-width min-height max-width max-height', 'open minimized maximized resizable draggable'), 'surface.bind']
]) definitions[tag] = { role: 'platform', ownership: 'surface', attributes, properties: {}, events: {}, commands: {}, slots: ['default'], capabilities: [capability], state: { controlled: [], ephemeral: ['focus', 'bounds'] }, dom: { authorChildren: 'preserve', writes: 'surface-port' } };
for (const [tag, capabilities] of [['x-theme', ['theme.read', 'theme.write']], ['x-utils', ['utils.format', 'utils.effects']], ['xtend-i18n', ['i18n.read', 'i18n.locale', 'i18n.labels']], ['xtend-state', ['state.read', 'state.write', 'state.subscribe']]]) definitions[tag] = { role: 'service', ownership: 'service', attributes: {}, properties: {}, events: {}, commands: {}, slots: [], capabilities, state: { controlled: [], ephemeral: [] }, dom: { authorChildren: 'preserve', writes: 'none' } };
definitions['x-rmt-lifecycle-demo-build'] = { role: 'demo', ownership: 'shadow', attributes: attrs('variant aria-label'), properties: {}, events: {}, commands: {}, slots: ['default'], capabilities: [], state: { controlled: [], ephemeral: [] }, dom: { authorChildren: 'preserve', writes: 'shadow-only' } };
// Exact managed implementations, separately reviewed from the wider Classic method surface.
const snapshot = command({}, 'component.snapshot');
const managedCommands = {
  'x-alert': { dismiss: command({ reason: string }, 'overlay.acquire', json, ['reason']), snapshot },
  'x-button': { focus: command({}, 'focus.request'), setLoading: command({ loading: boolean }) },
  'x-calendar': { focus: command({}, 'focus.request'), snapshot }, 'x-cards': { snapshot },
  'x-checkbox': { focus: command({}, 'focus.request'), validate: validity.validate, reset: command() },
  'x-code': { hydrate: command({}, 'resource.highlight'), snapshot },
  'x-dialog': { open: command({}, 'overlay.acquire'), close: command({}, 'overlay.acquire'), snapshot },
  'x-drawer': { open: command({}, 'overlay.acquire'), close: command({}, 'overlay.acquire'), toggle: command({}, 'overlay.acquire'), snapshot },
  'x-footer': { snapshot }, 'x-form': { submit: command({}, 'form.submit'), reset: command({}, 'form.reset'), validate: validity.validate, getFormData: snapshot },
  'x-header': { toggleMenu: command({ open: boolean }, 'overlay.acquire'), snapshot },
  'x-hero': { scrollPast: command({}, 'focus.request'), snapshot }, 'x-icon': { snapshot },
  'x-input': { focus: command({}, 'focus.request'), validate: validity.validate, reset: command() },
  'x-keymap': { open: command({ entries: definitions['x-keymap'].properties.entries }, 'overlay.acquire', json, ['entries']), close: command({ reason: string }, 'overlay.acquire', json, ['reason']) },
  'x-lightbox': { open: command({ src: string }, 'overlay.acquire', json, ['src']), close: command({}, 'overlay.acquire'), snapshot },
  'x-link': { focus: command({}, 'focus.request') }, 'x-masonry': { snapshot }, 'x-menu': { focus: command({}, 'focus.request') },
  'x-modal': { open: command({}, 'overlay.acquire'), close: command({}, 'overlay.acquire'), snapshot },
  'x-player': { play: command({}, 'media.request'), pause: command({}, 'media.request'), seek: command({ time: number }, 'media.request'), fullscreen: command({ enabled: boolean }, 'media.request'), snapshot },
  'x-popover': { show: command({}, 'overlay.acquire'), hide: command({}, 'overlay.acquire'), toggle: command({}, 'overlay.acquire'), snapshot },
  'x-progress': { snapshot }, 'x-radio': { focus: command({}, 'focus.request'), validate: validity.validate, reset: command() },
  'x-section': { snapshot }, 'x-select': { focus: command({}, 'focus.request'), validate: validity.validate, reset: command() },
  'x-spinner': { snapshot }, 'x-status': { snapshot, dismiss: command() }, 'x-summary': { snapshot },
  'x-tabs': { selectTab: command({ index: number }) },
  'x-textarea': { focus: command({}, 'focus.request'), validate: validity.validate, reset: command(), snapshot },
  'x-toast': { dismiss: command({ reason: string }, 'overlay.acquire', json, ['reason']) },
  'x-toggle': { focus: command({}, 'focus.request'), validate: validity.validate, reset: command() },
  'x-tooltip': { show: command({}, 'overlay.acquire'), hide: command({}, 'overlay.acquire'), toggle: command({}, 'overlay.acquire'), snapshot },
  'x-type': { pause: command(), resume: command(), snapshot },
  'x-writer': { focus: command({}, 'focus.request'), reset: command(), save: command({ autosave: boolean }, 'writer.save', json, ['autosave']), exportHTML: command({ filename: string }, 'writer.export', json, ['filename']), exportMarkdown: command({ filename: string }, 'writer.export', json, ['filename']), getHTML: command({}, 'component.snapshot', string), getText: command({}, 'component.snapshot', string), getMarkdown: command({}, 'component.snapshot', string) }
};
for (const tag of ['x-input', 'x-textarea', 'x-checkbox', 'x-toggle', 'x-radio', 'x-select']) Object.assign(managedCommands[tag], { checkValidity: validity.checkValidity, reportValidity: validity.reportValidity });
Object.assign(managedCommands['x-checkbox'], { toggle: command() }); Object.assign(managedCommands['x-toggle'], { toggle: command() }); Object.assign(managedCommands['x-radio'], { check: command() });
managedCommands['x-calendar'] = { focus: command({}, 'focus.request'), checkValidity: validity.checkValidity, reportValidity: validity.reportValidity, reset: command() };
managedCommands['x-drawer'] = { openDrawer: command({}, 'overlay.acquire'), closeDrawer: command({}, 'overlay.acquire'), toggle: command({}, 'overlay.acquire'), snapshot };
Object.assign(managedCommands['x-header'], { isMenuOpen: command({}, 'component.snapshot', boolean) });
Object.assign(managedCommands['x-icon'], { setIcon: command({ name: string }, 'resource.icon') });
Object.assign(managedCommands['x-keymap'], { isOpen: command({}, 'component.snapshot', boolean) });
Object.assign(managedCommands['x-player'], { playMedia: command({}, 'media.request'), pauseMedia: command({}, 'media.request'), setMediaState: command({ state: object({ playing: boolean, currentTime: number, volume: number, muted: boolean }, ['playing', 'currentTime', 'volume', 'muted']) }, 'media.request') });
Object.assign(managedCommands['x-progress'], { setProgress: command({ value: number }), complete: command(), reset: command() });
Object.assign(managedCommands['x-spinner'], { pause: command(), resume: command() });
Object.assign(managedCommands['x-status'], { announce: command({ message: string }, 'a11y.announce') });
Object.assign(managedCommands['x-summary'], { open: command(), close: command(), toggle: command() });
const renamedCapabilities = { 'component.focus': 'focus.request', 'surface.overlay': 'overlay.acquire', 'surface.scroll': 'focus.request', 'router.navigate': 'navigation.request', 'writer.network': 'writer.save', 'resource.markdown': 'writer.markdown', 'media.play': 'media.request', 'media.pause': 'media.request', 'media.control': 'media.request', 'media.fullscreen': 'media.request', 'media.pip': 'media.request', 'a11y.anchor': 'focus.request', 'file.select': 'file.read' };
for (const [tag, commands] of Object.entries(managedCommands)) {
  const definition = definitions[tag]; definition.commands = commands;
  definition.capabilities = [...new Set([...definition.capabilities.map(capability => renamedCapabilities[capability] || capability), ...Object.values(commands).map(spec => spec.capability)])].sort();
  for (const rule of Object.values(definition.attributes)) rule.nullable = true;
}
definitions['x-form'].events.invalid = event({ message: string, invalidFields: array(string) }, ['message']);
definitions['x-player'].events['player-state-changed'] = event({ playing: boolean, currentTime: number, volume: number, muted: boolean, duration: number, source: string }, ['playing', 'currentTime', 'volume', 'muted']);
definitions['x-player'].events['player-error'] = event({ error: object({ name: string, message: string }), operation: string }, ['error']);
definitions['x-player'].events['player-source-requested'] = event({ src: string }, ['src']);
definitions['x-keymap'].events['xkeymap-open'] = event({ open: boolean, entries: definitions['x-keymap'].properties.entries }, ['open']);
definitions['x-keymap'].events['xkeymap-close'] = event({ reason: string, open: boolean }, ['reason']);
definitions['x-form'].capabilities.push('file.read');
definitions['x-button'].capabilities.push('resource.icon');
definitions['x-writer'].capabilities.push('resource.image');
definitions['x-modal'].capabilities.push('resource.image');
// Model-controlled opening/restoration uses the owner's explicit focus port.
for(const tag of ['x-header','x-keymap','x-lightbox'])definitions[tag].capabilities.push('focus.request');
const typedKey={type:'key'},layoutItems=array(object({key:typedKey,ref:string,title:string,disabled:boolean,collapsed:boolean,keys:array(typedKey)},['title','disabled','collapsed','keys']));
Object.assign(definitions['x-tabs'].properties,{items:layoutItems,selectedKey:{...typedKey,nullable:true}});definitions['x-tabs'].capabilities.push('layout.bind');definitions['x-tabs'].state.controlled.push('items','selectedKey');definitions['x-tabs'].events['tab-selection-requested']=event({key:typedKey},['key']);
// Source8 selection follows stable typed identity; the Classic positional
// selected attribute must not race the controlled selectedKey property.
delete definitions['x-tabs'].attributes.selected;definitions['x-tabs'].state.controlled=definitions['x-tabs'].state.controlled.filter(name=>name!=='selected');
Object.assign(definitions['x-masonry'].properties,{items:layoutItems,order:array(typedKey)});definitions['x-masonry'].capabilities.push('layout.bind');definitions['x-masonry'].state.controlled.push('items','order');definitions['x-masonry'].events['masonry-change-requested']=event({order:array(typedKey),collapsed:array(typedKey)});
definitions['x-masonry'].properties.collapsed=array(typedKey);definitions['x-masonry'].state.controlled.push('collapsed');
definitions['x-player'].properties.currentTime={type:'number',minimum:0};definitions['x-player'].properties.volume={type:'number',minimum:0,maximum:1};definitions['x-player'].commands.seek.args.fields.time={type:'number',minimum:0};definitions['x-player'].commands.setMediaState.args.fields.state.fields.currentTime={type:'number',minimum:0};definitions['x-player'].commands.setMediaState.args.fields.state.fields.volume={type:'number',minimum:0,maximum:1};
// Reviewed shipped control states; the existence of observedAttributes alone is not a grant.
for(const tag of ['x-checkbox','x-input','x-radio','x-select'])Object.assign(definitions[tag].attributes,attrs('density','busy invalid'));
definitions['x-form'].attributes=attrs('density','busy invalid disabled');
Object.assign(definitions['x-link'].attributes,attrs('','disabled'));
Object.assign(definitions['x-toast'].attributes,attrs('tone','open hidden'));
// Legacy writer storage/endpoints/timers are owned by explicit RMT ports and Model.
// Granting these ignored or ambient-I/O attributes would advertise a false managed feature.
definitions['x-writer'].attributes={};
definitions['x-writer'].events['writer:link-requested']=event({href:string},['href']);
definitions['x-modal'].events['modal-link-requested']=event({href:string},['href']);
definitions['x-calendar'].properties.viewDate={type:'string',format:'civil-date'};definitions['x-calendar'].state.controlled.push('viewDate');definitions['x-calendar'].events['calendar-view-changed']=event({viewDate:{type:'string',format:'civil-date'}},['viewDate']);
definitions['x-calendar'].properties.value={type:'string',format:'civil-date-or-empty'};for(const name of ['value','min','max'])definitions['x-calendar'].attributes[name]={type:'string',nullable:true,format:'civil-date-or-empty'};
// Platform mutation is delegated to exact compiled native-platform operations.
// No command accepts another Surface ID or a capability expansion.
const platformBounds={x:number,y:number,width:{type:'number',minimum:0},height:{type:'number',minimum:0},minWidth:{type:'number',minimum:0},minHeight:{type:'number',minimum:0},maxWidth:{type:'number',minimum:0},maxHeight:{type:'number',minimum:0}};
const platformUpdate={label:string,bounds:object(platformBounds,Object.keys(platformBounds)),placement:string,mode:string,pinned:boolean,collapsed:boolean,modal:boolean};
const surfaceCommands={open:command({},'surface.command'),close:command({reason:string},'surface.command',json,['reason']),focus:command({},'surface.command'),restore:command({},'surface.command'),update:command(platformUpdate,'surface.command',json,Object.keys(platformUpdate))};
definitions['x-surface-region'].commands={...surfaceCommands};
definitions['x-surface-window'].commands={...surfaceCommands,minimize:command({},'surface.command'),maximize:command({},'surface.command'),move:command({x:number,y:number},'surface.command',json,['x','y']),resize:command(platformBounds,'surface.command',json,Object.keys(platformBounds))};
definitions['x-side-panel'].commands={...surfaceCommands,minimize:command({},'surface.command'),resize:command(platformBounds,'surface.command',json,Object.keys(platformBounds)),pin:command({},'surface.command'),unpin:command({},'surface.command'),collapse:command({},'surface.command'),expand:command({mode:string},'surface.command',json,['mode']),dock:command({mode:string,placement:string},'surface.command',json,['placement'])};
definitions['x-surface-manager'].commands={snapshot:command({},'surface.snapshot')};
definitions['x-router'].commands={navigate:command({href:string,state:json,replace:boolean},'router.navigate',json,['state','replace']),canNavigate:command({href:string},'router.read',boolean)};
const portalUpdate={policy:string,layer:string,target:string,zIndexStart:number,zStep:{type:'number',minimum:1}};
definitions['x-surface-portal'].commands={update:command(portalUpdate,'surface.portal.update',json,Object.keys(portalUpdate))};
for(const tag of ['x-surface-region','x-surface-window','x-side-panel','x-surface-manager','x-router','x-surface-portal'])definitions[tag].capabilities=[...new Set([...definitions[tag].capabilities,...Object.values(definitions[tag].commands).map(spec=>spec.capability)])].sort();
definitions['x-router'].properties.routes=array(object({path:string,id:string,title:string},['id','title']));definitions['x-router'].state.controlled.push('routes');definitions['x-router'].events['route-changed']=event({path:string,source:string},['path','source']);
// Actual Controller snapshots own platform lifecycle/bounds state. Authoring
// exposes assertions and real local UI toggles; mutations use compiled commands.
definitions['x-surface-region'].attributes=attrs('surface-id role');
definitions['x-surface-window'].attributes=attrs('surface-id','resizable draggable');
definitions['x-side-panel'].attributes=attrs('surface-id','resizable collapsible collapsable closable pinnable');
for(const tag of ['x-surface-region','x-surface-window','x-side-panel']){definitions[tag].properties={};definitions[tag].state.controlled=[];}
definitions['x-surface-manager'].attributes=attrs('manager-id');definitions['x-router'].attributes={};
definitions['x-surface-manager'].slots = ['default', 'windows', 'panels', 'overlays'];
definitions['x-router'].slots = ['default', 'prerendered-route'];
module.exports = { definitions, string, number, boolean, json, array, object, event, command, attrs, events };
