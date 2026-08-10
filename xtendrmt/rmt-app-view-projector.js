(function attachRmtAppViewProjector(globalTarget) {
  const RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA = 'xtend.rmt.app-presentation-view-port.v1';
  const RMT_APP_PRESENTATION_MODEL_SCHEMA = 'xtend.rmt.app-presentation-model.v1';
  const RMT_VIEW_TEMPLATE_SCHEMA = 'xtend.rmt.view-template.v1';

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function cloneValue(value, fallback = null) {
    if (typeof value === 'undefined') return fallback;
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((entry) => cloneValue(entry, entry));
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      const result = {};
      Object.entries(value).forEach(([key, entry]) => {
        result[key] = cloneValue(entry, entry);
      });
      return result;
    }
    return fallback;
  }

  const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

  function readPath(source, path) {
    if (!path) return source;
    const parts = String(path || '').split('.').filter(Boolean);
    if (parts.some((part) => UNSAFE_PATH_SEGMENTS.has(part))) return undefined;
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      cursor = cursor[part];
    }
    return cursor;
  }

  function richTextSegmentDescriptor(segment = {}) {
    const record = objectRecord(segment);
    const kind = clampString(record.kind || record.type, 'text');
    if (kind === 'code') {
      return {
        type: 'component',
        tag: 'x-code',
        component: 'x-code',
        attributes: {
          lang: record.lang || record.language || 'text',
          'data-rmt-rich-segment': 'code'
        },
        children: [{ type: 'text', text: record.text || record.code || '' }]
      };
    }
    if (kind === 'citation') {
      return {
        type: 'element',
        tag: 'a',
        class: 'xtend-rmt-citation',
        attributes: {
          href: record.href || record.url || '#',
          rel: 'noreferrer',
          target: '_blank',
          'data-rmt-rich-segment': 'citation'
        },
        text: record.label || record.title || record.text || 'source'
      };
    }
    return {
      type: 'element',
      tag: kind === 'strong' ? 'strong' : kind === 'em' ? 'em' : 'span',
      attributes: { 'data-rmt-rich-segment': kind },
      text: record.text || ''
    };
  }

  function projectTemplate(template = {}, model = {}) {
    const record = objectRecord(template);
    if (record.schema && record.schema !== RMT_VIEW_TEMPLATE_SCHEMA) return cloneValue(record, record);
    if (record.kind === 'choice-menu' || record.type === 'choice-menu') {
      const modelSource = clampString(record.modelSource || record.source, '$model.choiceMenu');
      const statePath = (field) => record[`${field}Source`] || `${modelSource}.${field}`;
      const selectPayloadField = clampString(record.selectPayloadField || record.payloadField, 'value');
      return {
        schema: RMT_VIEW_TEMPLATE_SCHEMA,
        type: 'fragment',
        primitive: 'choice-menu',
        children: [
          {
            type: 'element',
            tag: 'button',
            class: record.buttonClass || record.triggerClass || 'xtend-rmt-choice-menu-button',
            attributes: {
              id: record.buttonId || record.triggerId || 'choice-menu-button',
              type: 'button',
              'aria-haspopup': record.ariaHasPopup || 'menu',
              'aria-expanded': statePath('open'),
              'aria-pressed': { op: 'not-equals', left: statePath('activeToolAttr'), right: '' },
              'data-active-tool': statePath('activeToolAttr'),
              disabled: statePath('disabled')
            },
            command: {
              command: record.toggleCommand || record.command || 'rmt.choiceMenu.toggle',
              payload: record.togglePayload || { label: record.label || 'Choice menu' }
            },
            text: statePath('activeToolLabel')
          },
          {
            type: 'element',
            tag: 'div',
            class: record.optionsClass || record.menuClass || 'xtend-rmt-choice-menu-options',
            attributes: {
              id: record.optionsId || record.menuId || 'choice-menu-options',
              role: record.optionsRole || 'menu',
              hidden: { op: 'not', source: statePath('open') }
            },
            children: [
              {
                type: 'repeat',
                source: record.itemsSource || statePath('items'),
                key: record.itemKey || 'value',
                template: {
                  type: 'element',
                  tag: 'button',
                  class: record.itemClass || 'xtend-rmt-choice-menu-item',
                  attributes: {
                    type: 'button',
                    role: record.itemRole || 'menuitemradio',
                    'data-tool-name': '$item.value',
                    'aria-checked': { op: 'equals', left: statePath('activeTool'), right: '$item.value' }
                  },
                  command: {
                    command: record.selectCommand || 'rmt.choiceMenu.select',
                    payload: { [selectPayloadField]: '$item.value' }
                  },
                  text: '$item.label'
                }
              }
            ]
          }
        ]
      };
    }
    if (record.kind === 'rich-text' || record.type === 'rich-text') {
      return {
        schema: RMT_VIEW_TEMPLATE_SCHEMA,
        type: 'fragment',
        children: toArray(record.segments || readPath(model, record.source || '')).map(richTextSegmentDescriptor)
      };
    }
    if (record.kind === 'repeat' || record.type === 'repeat') {
      return {
        schema: RMT_VIEW_TEMPLATE_SCHEMA,
        type: 'repeat',
        source: record.source || '$model.items',
        key: record.key || 'id',
        template: record.template || record.node || { type: 'text', text: '$item' }
      };
    }
    return {
      schema: RMT_VIEW_TEMPLATE_SCHEMA,
      type: record.type || 'fragment',
      children: toArray(record.children || record.nodes).map((child) => projectTemplate(child, model))
    };
  }

  function createRmtAppPresentationViewPort() {
    return Object.freeze({
      schema: RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA,
      project(presentationModel = {}) {
        const presentation = objectRecord(presentationModel);
        if (presentation.schema !== RMT_APP_PRESENTATION_MODEL_SCHEMA) {
          const error = new TypeError(`RMT App View Projector requires ${RMT_APP_PRESENTATION_MODEL_SCHEMA}.`);
          error.code = 'rmt.app.presentation-model-invalid';
          throw error;
        }
        return projectTemplate(presentation.template, presentation.model);
      }
    });
  }

  const api = Object.freeze({
    RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA,
    RMT_APP_PRESENTATION_MODEL_SCHEMA,
    createRmtAppPresentationViewPort
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (globalTarget) globalTarget.XTendRmtAppViewProjector = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_APP_VIEW_PROJECTOR_API__ = globalThis.XTendRmtAppViewProjector;

export const RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA = __XTEND_RMT_APP_VIEW_PROJECTOR_API__.RMT_APP_PRESENTATION_VIEW_PORT_SCHEMA;
export const RMT_APP_PRESENTATION_MODEL_SCHEMA = __XTEND_RMT_APP_VIEW_PROJECTOR_API__.RMT_APP_PRESENTATION_MODEL_SCHEMA;
export const createRmtAppPresentationViewPort = __XTEND_RMT_APP_VIEW_PROJECTOR_API__.createRmtAppPresentationViewPort;

export default __XTEND_RMT_APP_VIEW_PROJECTOR_API__;
