/* modules/rmt-template-binding-model.js */
(function registerRmtTemplateBindingModelModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const SUPPORTED_BINDING_KINDS = Object.freeze([
        'text',
        'attribute',
        'property',
        'class_toggle',
        'command',
        'root_event',
        'template_outlet',
        'template_repeat'
    ]);
    const SUPPORTED_SLOT_KINDS = Object.freeze(['text', 'html_fragment', 'template']);

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function cloneSerializable(value, fallbackValue = null) {
        if (value === undefined) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallbackValue;
        }
    }

    function toPlainObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeBindingKind(value, fallbackValue = '') {
        const safeValue = clampString(value, fallbackValue).toLowerCase();
        return SUPPORTED_BINDING_KINDS.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeSlotKind(value, fallbackValue = 'text') {
        const safeValue = clampString(value, fallbackValue).toLowerCase();
        return SUPPORTED_SLOT_KINDS.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeBinding(bindingInput = {}) {
        const rawBinding = toPlainObject(bindingInput);
        const kind = normalizeBindingKind(rawBinding.kind || rawBinding.type, '');
        if (!kind) return null;
        return Object.freeze({
            kind,
            target: clampString(rawBinding.target || rawBinding.selector || rawBinding.elementSelector, ':root'),
            source: clampString(rawBinding.source || rawBinding.path || rawBinding.modelPath || rawBinding.valuePath, ''),
            sourceName: clampString(rawBinding.sourceName || rawBinding.reactivitySource || rawBinding.channel, ''),
            attribute: clampString(rawBinding.attribute || rawBinding.attributeName || rawBinding.name, ''),
            property: clampString(rawBinding.property || rawBinding.propertyName || rawBinding.name, ''),
            className: clampString(rawBinding.className || rawBinding.class || rawBinding.token || rawBinding.name, ''),
            bindingId: clampString(rawBinding.bindingId || rawBinding.id, ''),
            eventType: clampString(rawBinding.eventType || rawBinding.event, ''),
            commandName: clampString(rawBinding.commandName || rawBinding.command, ''),
            eventName: clampString(rawBinding.eventName || rawBinding.emit || rawBinding.rootEventName, ''),
            action: clampString(rawBinding.action || rawBinding.rmAction || rawBinding.dataRmAction || rawBinding.dataAction, ''),
            actionAttribute: clampString(rawBinding.actionAttribute || rawBinding.dataActionAttribute, 'data-rm-action'),
            setActionAttribute: rawBinding.setActionAttribute === true || (
                rawBinding.setActionAttribute !== false
                && !!clampString(rawBinding.action || rawBinding.rmAction || rawBinding.dataRmAction || rawBinding.dataAction, '')
            ),
            payloadSource: clampString(rawBinding.payloadSource || rawBinding.detailSource, ''),
            payload: Object.prototype.hasOwnProperty.call(rawBinding, 'payload')
                ? cloneSerializable(rawBinding.payload, null)
                : null,
            detail: Object.prototype.hasOwnProperty.call(rawBinding, 'detail')
                ? cloneSerializable(rawBinding.detail, null)
                : null,
            hasExplicitFallback: rawBinding.hasExplicitFallback === true || (
                rawBinding.hasExplicitFallback === undefined
                && Object.prototype.hasOwnProperty.call(rawBinding, 'fallback')
            ),
            fallback: Object.prototype.hasOwnProperty.call(rawBinding, 'fallback') ? rawBinding.fallback : null,
            invert: rawBinding.invert === true,
            preventDefault: rawBinding.preventDefault === true,
            stopPropagation: rawBinding.stopPropagation === true,
            capture: rawBinding.capture === true,
            passive: rawBinding.passive === true,
            once: rawBinding.once === true,
            includeInteractionMeta: rawBinding.includeInteractionMeta === true,
            supersessionKey: clampString(rawBinding.supersessionKey, ''),
            payloadContract: cloneSerializable(rawBinding.payloadContract || rawBinding.contract, null),
            payloadAdapter: cloneSerializable(rawBinding.payloadAdapter || rawBinding.adapter || rawBinding.payloadKind, null),
            closest: clampString(rawBinding.closest || rawBinding.closestSelector || rawBinding.delegate, ''),
            condition: cloneSerializable(rawBinding.condition || rawBinding.when, null),
            guard: cloneSerializable(rawBinding.guard || rawBinding.confirm, null),
            postAction: cloneSerializable(rawBinding.postAction || rawBinding.after || rawBinding.afterAction, []),
            commandTarget: cloneSerializable(rawBinding.commandTarget, null),
            lane: clampString(rawBinding.lane, ''),
            templateRef: cloneSerializable(
                rawBinding.template !== undefined
                    ? rawBinding.template
                    : (rawBinding.templateRef !== undefined
                        ? rawBinding.templateRef
                        : (rawBinding.templateId !== undefined
                            ? { id: rawBinding.templateId, namespace: rawBinding.namespace || '' }
                            : null)),
                null
            ),
            templateSource: clampString(rawBinding.templateSource || rawBinding.templatePath || rawBinding.templateRefSource, ''),
            modelSource: clampString(rawBinding.modelSource || rawBinding.outletModelSource || rawBinding.subtreeModelSource, ''),
            itemsSource: clampString(rawBinding.itemsSource || rawBinding.collectionSource || rawBinding.listSource, ''),
            itemAlias: clampString(rawBinding.itemAlias || rawBinding.alias || rawBinding.as, 'item'),
            indexAlias: clampString(rawBinding.indexAlias || rawBinding.positionAlias, 'index'),
            wrapperTag: clampString(rawBinding.wrapperTag || rawBinding.itemContainerTag, 'div'),
            clearWhenMissing: rawBinding.clearWhenMissing !== false,
            removeWhenEmpty: rawBinding.removeWhenEmpty === true,
            emptyMarkup: String(rawBinding.emptyMarkup !== undefined
                ? rawBinding.emptyMarkup
                : (rawBinding.emptyHtml !== undefined ? rawBinding.emptyHtml : '')),
            metadata: cloneSerializable(rawBinding.metadata, {}),
            raw: cloneSerializable(rawBinding, {})
        });
    }

    function normalizeBindings(bindingsInput) {
        return (Array.isArray(bindingsInput) ? bindingsInput : [])
            .map((bindingInput) => normalizeBinding(bindingInput))
            .filter(Boolean);
    }

    function normalizeSlot(slotInput = {}) {
        const rawSlot = toPlainObject(slotInput);
        const inferredKind = rawSlot.template !== undefined
            || rawSlot.templateRef !== undefined
            || rawSlot.templateId !== undefined
            ? 'template'
            : (rawSlot.html !== undefined || rawSlot.markup !== undefined ? 'html_fragment' : 'text');
        const name = clampString(rawSlot.name || rawSlot.slot, '');
        return Object.freeze({
            name,
            kind: normalizeSlotKind(rawSlot.kind || rawSlot.type, inferredKind),
            target: clampString(rawSlot.target || rawSlot.selector || (name ? `[data-slot="${name}"]` : ':root'), ':root'),
            source: clampString(rawSlot.source || rawSlot.path || rawSlot.valuePath, ''),
            sourceName: clampString(rawSlot.sourceName || rawSlot.reactivitySource || rawSlot.channel, ''),
            modelSource: clampString(rawSlot.modelSource || rawSlot.slotModelSource, ''),
            hasExplicitFallback: rawSlot.hasExplicitFallback === true || (
                rawSlot.hasExplicitFallback === undefined
                && Object.prototype.hasOwnProperty.call(rawSlot, 'fallback')
            ),
            fallback: Object.prototype.hasOwnProperty.call(rawSlot, 'fallback') ? rawSlot.fallback : null,
            templateRef: cloneSerializable(
                rawSlot.template !== undefined
                    ? rawSlot.template
                    : (rawSlot.templateRef !== undefined
                        ? rawSlot.templateRef
                        : (rawSlot.templateId !== undefined
                            ? { id: rawSlot.templateId, namespace: rawSlot.namespace || '' }
                            : null)),
                null
            ),
            staticMarkup: String(rawSlot.markup !== undefined
                ? rawSlot.markup
                : (rawSlot.html !== undefined ? rawSlot.html : '')),
            clearWhenMissing: rawSlot.clearWhenMissing !== false,
            emptyMarkup: String(rawSlot.emptyMarkup !== undefined
                ? rawSlot.emptyMarkup
                : (rawSlot.emptyHtml !== undefined ? rawSlot.emptyHtml : '')),
            metadata: cloneSerializable(rawSlot.metadata, {}),
            raw: cloneSerializable(rawSlot, {})
        });
    }

    function normalizeSlots(slotsInput) {
        return (Array.isArray(slotsInput) ? slotsInput : [])
            .map((slotInput) => normalizeSlot(slotInput))
            .filter(Boolean);
    }

    function createBindingStructureDescriptor(bindingInput = {}) {
        const binding = normalizeBinding(bindingInput);
        if (!binding) return null;
        return {
            kind: binding.kind,
            target: binding.target,
            source: binding.source,
            sourceName: binding.sourceName,
            attribute: binding.attribute,
            property: binding.property,
            className: binding.className,
            bindingId: binding.bindingId,
            eventType: binding.eventType,
            commandName: binding.commandName,
            eventName: binding.eventName,
            action: binding.action,
            actionAttribute: binding.actionAttribute,
            setActionAttribute: binding.setActionAttribute === true,
            payloadSource: binding.payloadSource,
            payload: cloneSerializable(binding.payload, null),
            detail: cloneSerializable(binding.detail, null),
            hasExplicitFallback: binding.hasExplicitFallback === true,
            fallback: cloneSerializable(binding.fallback, null),
            invert: binding.invert === true,
            preventDefault: binding.preventDefault === true,
            stopPropagation: binding.stopPropagation === true,
            capture: binding.capture === true,
            passive: binding.passive === true,
            once: binding.once === true,
            includeInteractionMeta: binding.includeInteractionMeta === true,
            supersessionKey: binding.supersessionKey,
            payloadContract: cloneSerializable(binding.payloadContract, null),
            payloadAdapter: cloneSerializable(binding.payloadAdapter, null),
            closest: binding.closest,
            condition: cloneSerializable(binding.condition, null),
            guard: cloneSerializable(binding.guard, null),
            postAction: cloneSerializable(binding.postAction, []),
            commandTarget: cloneSerializable(binding.commandTarget, null),
            lane: binding.lane,
            templateRef: cloneSerializable(binding.templateRef, null),
            templateSource: binding.templateSource,
            modelSource: binding.modelSource,
            itemsSource: binding.itemsSource,
            itemAlias: binding.itemAlias,
            indexAlias: binding.indexAlias,
            wrapperTag: binding.wrapperTag,
            clearWhenMissing: binding.clearWhenMissing !== false,
            emptyMarkup: binding.emptyMarkup
        };
    }

    function createSlotStructureDescriptor(slotInput = {}) {
        const slot = normalizeSlot(slotInput);
        if (!slot) return null;
        return {
            name: slot.name,
            kind: slot.kind,
            target: slot.target,
            source: slot.source,
            sourceName: slot.sourceName,
            modelSource: slot.modelSource,
            hasExplicitFallback: slot.hasExplicitFallback === true,
            fallback: cloneSerializable(slot.fallback, null),
            templateRef: cloneSerializable(slot.templateRef, null),
            staticMarkup: slot.staticMarkup,
            clearWhenMissing: slot.clearWhenMissing !== false,
            emptyMarkup: slot.emptyMarkup
        };
    }

    appModules.createRmtTemplateBindingModel = function createRmtTemplateBindingModel() {
        return Object.freeze({
            kind: 'rmt_template_binding_model',
            version: '1.0',
            createTemplateStructureSignature(bindingsInput = [], slotsInput = [], templateMode = 'html_fragment') {
                return JSON.stringify({
                    mode: clampString(templateMode, 'html_fragment'),
                    bindings: (Array.isArray(bindingsInput) ? bindingsInput : [])
                        .map((bindingInput) => createBindingStructureDescriptor(bindingInput))
                        .filter(Boolean),
                    slots: (Array.isArray(slotsInput) ? slotsInput : [])
                        .map((slotInput) => createSlotStructureDescriptor(slotInput))
                        .filter(Boolean)
                });
            },
            listSupportedBindingKinds: () => SUPPORTED_BINDING_KINDS.slice(),
            listSupportedSlotKinds: () => SUPPORTED_SLOT_KINDS.slice(),
            normalizeBinding,
            normalizeBindings,
            normalizeSlot,
            normalizeSlots
        });
    };
})(__XTENDRMT_GLOBAL__);
