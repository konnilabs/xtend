/* modules/rmt-format.js */
(function registerRmtFormatModelModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const DOCUMENT_KIND = 'rmt_document';
    const DOCUMENT_VERSION = '1.0';
    const CONTENT_TYPE = 'application/vnd.xtendrmt+json';
    const PREFERRED_FILE_EXTENSION = '.rmt';
    const JSON_FALLBACK_FILE_EXTENSIONS = Object.freeze([
        '.rmt.json',
        '.json'
    ]);
    const SUPPORTED_FILE_EXTENSIONS = Object.freeze([
        PREFERRED_FILE_EXTENSION,
        ...JSON_FALLBACK_FILE_EXTENSIONS
    ]);
    const TEMPLATE_MODES = Object.freeze([
        'html_fragment',
        'text',
        'dom_descriptor'
    ]);
    const BINDING_KINDS = Object.freeze([
        'text',
        'attribute',
        'property',
        'class_toggle',
        'command',
        'root_event',
        'template_outlet',
        'template_repeat'
    ]);
    const SLOT_KINDS = Object.freeze([
        'text',
        'html_fragment',
        'template'
    ]);
    const HYDRATION_MODES = Object.freeze([
        'runtime_render',
        'hydrate_prerendered',
        'worker_prerender_hydrate',
        'server_prerender_hydrate',
        'server_prerender_resume',
        'prerender_only'
    ]);
    const OWNERSHIP_MODES = Object.freeze([
        'observe_only',
        'hydrate_existing',
        'replace_children',
        'managed_subtree'
    ]);
    const DSL_NORMALIZATION_SCHEMA = 'xtend.rmt.dsl-normalization.v1';
    const DSL_DIAGNOSTIC_CODES = Object.freeze([
        'rmt.dsl.legacy_metadata_promoted',
        'rmt.dsl.reference.missing_adapter',
        'rmt.dsl.reference.missing_component',
        'rmt.dsl.reference.missing_template',
        'rmt.dsl.reference.missing_schedule',
        'rmt.dsl.reference.missing_route'
    ]);
    const RUNTIME_REGISTRY_SCHEMA = 'xtend.rmt.runtime-registry.v1';
    const RUNTIME_REGISTRY_DIAGNOSTIC_CODES = Object.freeze([
        'rmt.runtime.registry.missing_route',
        'rmt.runtime.registry.missing_component',
        'rmt.runtime.registry.duplicate_route',
        'rmt.runtime.registry.duplicate_component'
    ]);
    const RUNTIME_REGISTRY_LIFECYCLE_EVENTS = Object.freeze([
        'create',
        'mount',
        'hydrate',
        'update',
        'dispose'
    ]);
    const NATIVE_DOMAIN_NAMES = Object.freeze([
        'adapters',
        'components',
        'routes',
        'schedules',
        'surfaces'
    ]);

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function normalizeFileExtension(value) {
        const safeValue = clampString(value, '').toLowerCase();
        if (!safeValue) return '';
        if (safeValue.endsWith('.rmt.json')) return '.rmt.json';
        if (safeValue.endsWith('.rmt')) return '.rmt';
        if (safeValue.endsWith('.json')) return '.json';
        const dotIndex = safeValue.lastIndexOf('.');
        return dotIndex >= 0 ? safeValue.slice(dotIndex) : '';
    }

    function inferFileExtension(sourceUrl) {
        const safeUrl = clampString(sourceUrl, '');
        if (!safeUrl) return '';
        const withoutHash = safeUrl.split('#')[0];
        const withoutQuery = withoutHash.split('?')[0];
        return normalizeFileExtension(withoutQuery);
    }

    function isSupportedFileExtension(value) {
        return SUPPORTED_FILE_EXTENSIONS.includes(normalizeFileExtension(value));
    }

    function getFileExtensionLoaderHint(fileExtension) {
        const normalizedExtension = normalizeFileExtension(fileExtension);
        if (normalizedExtension === '.rmt') return 'rmt';
        if (normalizedExtension === '.rmt.json') return 'rmt-json-fallback';
        if (normalizedExtension === '.json') return 'json-fallback';
        return '';
    }

    function describeSourceFile(sourceUrl) {
        const fileExtension = inferFileExtension(sourceUrl);
        return Object.freeze({
            fileExtension,
            isPreferredRmtExtension: fileExtension === PREFERRED_FILE_EXTENSION,
            isJsonFallbackExtension: JSON_FALLBACK_FILE_EXTENSIONS.includes(fileExtension),
            isSupportedRmtExtension: SUPPORTED_FILE_EXTENSIONS.includes(fileExtension),
            loaderHint: getFileExtensionLoaderHint(fileExtension),
            contentType: CONTENT_TYPE
        });
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
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        return value;
    }

    function normalizeObjectArray(values) {
        return (Array.isArray(values) ? values : [])
            .map((entry) => cloneSerializable(toPlainObject(entry), {}))
            .filter((entry) => entry && typeof entry === 'object');
    }

    function normalizeTemplateMode(value, fallbackValue = 'html_fragment') {
        const safeValue = clampString(value, fallbackValue);
        return TEMPLATE_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeBindingKind(value, fallbackValue = 'text') {
        const safeValue = clampString(value, fallbackValue);
        return BINDING_KINDS.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeSlotKind(value, fallbackValue = 'text') {
        const safeValue = clampString(value, fallbackValue);
        return SLOT_KINDS.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeHydrationMode(value, fallbackValue = '') {
        const safeValue = clampString(value, fallbackValue);
        return HYDRATION_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeOwnershipMode(value, fallbackValue = '') {
        const safeValue = clampString(value, fallbackValue);
        return OWNERSHIP_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeOptionalBoolean(value, fallbackValue = null) {
        if (value === true) return true;
        if (value === false) return false;
        return fallbackValue;
    }

    function normalizeEntryCollection(entriesInput, normalizer) {
        if (Array.isArray(entriesInput)) {
            return entriesInput
                .map((entryInput) => normalizer(entryInput, ''))
                .filter(Boolean);
        }
        const rawEntries = toPlainObject(entriesInput);
        return Object.keys(rawEntries)
            .map((entryName) => normalizer(rawEntries[entryName], entryName))
            .filter(Boolean);
    }

    function normalizeBindingEntry(bindingInput = {}, fallbackName = '') {
        const rawBinding = toPlainObject(bindingInput);
        const inferredKind = rawBinding.itemsSource !== undefined
            || rawBinding.collectionSource !== undefined
            || rawBinding.listSource !== undefined
            ? 'template_repeat'
            : (rawBinding.template !== undefined
            || rawBinding.templateRef !== undefined
            || rawBinding.templateId !== undefined
            || rawBinding.templateSource !== undefined
            || rawBinding.modelSource !== undefined
            ? 'template_outlet'
            : (rawBinding.command !== undefined || rawBinding.commandName !== undefined
                ? 'command'
                : (rawBinding.emit !== undefined || rawBinding.eventName !== undefined
                    ? 'root_event'
                    : (rawBinding.class !== undefined || rawBinding.className !== undefined
                        ? 'class_toggle'
                        : (rawBinding.attribute !== undefined || rawBinding.attributeName !== undefined
                            ? 'attribute'
                            : (rawBinding.property !== undefined || rawBinding.propertyName !== undefined
                                ? 'property'
                                : 'text'))))));
        return Object.freeze({
            kind: normalizeBindingKind(rawBinding.kind || rawBinding.type, inferredKind),
            target: clampString(
                rawBinding.target || rawBinding.selector || rawBinding.elementSelector,
                ':root'
            ),
            source: clampString(
                rawBinding.source || rawBinding.path || rawBinding.modelPath || rawBinding.valuePath,
                ''
            ),
            sourceName: clampString(
                rawBinding.sourceName || rawBinding.reactivitySource || rawBinding.channel,
                ''
            ),
            attribute: clampString(rawBinding.attribute || rawBinding.attributeName || rawBinding.name, ''),
            property: clampString(rawBinding.property || rawBinding.propertyName || rawBinding.name, ''),
            className: clampString(rawBinding.className || rawBinding.class || rawBinding.token || rawBinding.name, ''),
            eventType: clampString(rawBinding.eventType || rawBinding.event, ''),
            commandName: clampString(rawBinding.commandName || rawBinding.command, ''),
            eventName: clampString(rawBinding.eventName || rawBinding.emit || rawBinding.rootEventName, ''),
            action: clampString(
                rawBinding.action || rawBinding.rmAction || rawBinding.dataRmAction || rawBinding.dataAction,
                ''
            ),
            actionAttribute: clampString(
                rawBinding.actionAttribute || rawBinding.dataActionAttribute,
                'data-rm-action'
            ),
            setActionAttribute: rawBinding.setActionAttribute === true
                || (
                    rawBinding.setActionAttribute !== false
                    && !!clampString(
                        rawBinding.action || rawBinding.rmAction || rawBinding.dataRmAction || rawBinding.dataAction,
                        ''
                    )
                ),
            payloadSource: clampString(rawBinding.payloadSource || rawBinding.detailSource, ''),
            payload: Object.prototype.hasOwnProperty.call(rawBinding, 'payload')
                ? cloneSerializable(rawBinding.payload, null)
                : null,
            detail: Object.prototype.hasOwnProperty.call(rawBinding, 'detail')
                ? cloneSerializable(rawBinding.detail, null)
                : null,
            hasExplicitFallback: rawBinding.hasExplicitFallback === true
                || (
                    rawBinding.hasExplicitFallback === undefined
                    && Object.prototype.hasOwnProperty.call(rawBinding, 'fallback')
                ),
            fallback: Object.prototype.hasOwnProperty.call(rawBinding, 'fallback')
                ? cloneSerializable(rawBinding.fallback, null)
                : null,
            invert: rawBinding.invert === true,
            preventDefault: rawBinding.preventDefault === true,
            stopPropagation: rawBinding.stopPropagation === true,
            capture: rawBinding.capture === true,
            passive: rawBinding.passive === true,
            once: rawBinding.once === true,
            includeInteractionMeta: rawBinding.includeInteractionMeta === true,
            supersessionKey: clampString(rawBinding.supersessionKey, ''),
            template: cloneSerializable(
                rawBinding.template !== undefined
                    ? rawBinding.template
                    : (rawBinding.templateRef !== undefined
                        ? rawBinding.templateRef
                        : (rawBinding.templateId !== undefined
                            ? {
                                id: rawBinding.templateId,
                                namespace: rawBinding.namespace || ''
                            }
                            : null)),
                null
            ),
            templateSource: clampString(
                rawBinding.templateSource || rawBinding.templatePath || rawBinding.templateRefSource,
                ''
            ),
            modelSource: clampString(
                rawBinding.modelSource || rawBinding.outletModelSource || rawBinding.subtreeModelSource,
                ''
            ),
            itemsSource: clampString(
                rawBinding.itemsSource || rawBinding.collectionSource || rawBinding.listSource,
                ''
            ),
            itemAlias: clampString(rawBinding.itemAlias || rawBinding.alias || rawBinding.as, 'item'),
            indexAlias: clampString(rawBinding.indexAlias || rawBinding.positionAlias, 'index'),
            wrapperTag: clampString(rawBinding.wrapperTag || rawBinding.itemContainerTag, 'div'),
            clearWhenMissing: rawBinding.clearWhenMissing !== false,
            removeWhenEmpty: rawBinding.removeWhenEmpty === true,
            emptyMarkup: String(
                rawBinding.emptyMarkup !== undefined
                    ? rawBinding.emptyMarkup
                    : (rawBinding.emptyHtml !== undefined ? rawBinding.emptyHtml : '')
            ),
            metadata: cloneSerializable(rawBinding.metadata, {})
        });
    }

    function normalizeActionBindingEntry(actionInput = {}, fallbackName = '') {
        const rawAction = toPlainObject(actionInput);
        const actionName = clampString(
            rawAction.action || rawAction.name || rawAction.commandName || rawAction.command || fallbackName,
            ''
        );
        return normalizeBindingEntry({
            ...rawAction,
            kind: rawAction.kind || rawAction.type || 'command',
            eventType: rawAction.eventType || rawAction.event || 'click',
            commandName: rawAction.commandName || rawAction.command || actionName,
            action: actionName,
            setActionAttribute: rawAction.setActionAttribute !== false
        }, fallbackName);
    }

    function normalizeEventBindingEntry(eventInput = {}, fallbackName = '') {
        const rawEvent = toPlainObject(eventInput);
        const eventName = clampString(
            rawEvent.eventName || rawEvent.emit || rawEvent.name || fallbackName,
            ''
        );
        const actionName = clampString(
            rawEvent.action || rawEvent.rmAction || rawEvent.dataRmAction || eventName,
            ''
        );
        return normalizeBindingEntry({
            ...rawEvent,
            kind: rawEvent.kind || rawEvent.type || 'root_event',
            eventType: rawEvent.eventType || rawEvent.event || 'click',
            eventName,
            action: actionName,
            setActionAttribute: rawEvent.setActionAttribute !== false
        }, fallbackName);
    }

    function normalizeSlotEntry(slotInput = {}, fallbackName = '') {
        const rawSlot = typeof slotInput === 'string'
            ? { source: slotInput }
            : toPlainObject(slotInput);
        const name = clampString(rawSlot.name || rawSlot.slot || fallbackName, '');
        const inferredKind = rawSlot.template !== undefined
            || rawSlot.templateRef !== undefined
            || rawSlot.templateId !== undefined
            ? 'template'
            : (rawSlot.html !== undefined || rawSlot.markup !== undefined ? 'html_fragment' : 'text');
        return Object.freeze({
            name,
            kind: normalizeSlotKind(rawSlot.kind || rawSlot.type, inferredKind),
            target: clampString(rawSlot.target || rawSlot.selector || (name ? `[data-slot="${name}"]` : ':root'), ':root'),
            source: clampString(rawSlot.source || rawSlot.path || rawSlot.valuePath, ''),
            sourceName: clampString(rawSlot.sourceName || rawSlot.reactivitySource || rawSlot.channel, ''),
            modelSource: clampString(rawSlot.modelSource || rawSlot.slotModelSource, ''),
            hasExplicitFallback: rawSlot.hasExplicitFallback === true
                || (
                    rawSlot.hasExplicitFallback === undefined
                    && Object.prototype.hasOwnProperty.call(rawSlot, 'fallback')
                ),
            fallback: Object.prototype.hasOwnProperty.call(rawSlot, 'fallback')
                ? cloneSerializable(rawSlot.fallback, null)
                : null,
            template: cloneSerializable(
                rawSlot.template !== undefined
                    ? rawSlot.template
                    : (rawSlot.templateRef !== undefined
                        ? rawSlot.templateRef
                        : (rawSlot.templateId !== undefined
                            ? {
                                id: rawSlot.templateId,
                                namespace: rawSlot.namespace || ''
                            }
                            : null)),
                null
            ),
            markup: String(
                rawSlot.markup !== undefined
                    ? rawSlot.markup
                    : (rawSlot.html !== undefined ? rawSlot.html : '')
            ),
            clearWhenMissing: rawSlot.clearWhenMissing !== false,
            emptyMarkup: String(
                rawSlot.emptyMarkup !== undefined
                    ? rawSlot.emptyMarkup
                    : (rawSlot.emptyHtml !== undefined ? rawSlot.emptyHtml : '')
            ),
            metadata: cloneSerializable(rawSlot.metadata, {})
        });
    }

    function normalizePropEntry(propInput = {}, fallbackName = '') {
        const isNameOnlyProp = typeof propInput === 'string';
        const rawProp = isNameOnlyProp
            ? { name: propInput }
            : toPlainObject(propInput);
        const isObjectProp = propInput && typeof propInput === 'object' && !Array.isArray(propInput);
        const name = clampString(rawProp.name || rawProp.prop || rawProp.property || fallbackName, '');
        const hasDefault = rawProp.hasDefault === true
            || Object.prototype.hasOwnProperty.call(rawProp, 'defaultValue')
            || Object.prototype.hasOwnProperty.call(rawProp, 'default')
            || Object.prototype.hasOwnProperty.call(rawProp, 'value')
            || (!isNameOnlyProp && !isObjectProp && propInput !== undefined);
        const defaultValue = Object.prototype.hasOwnProperty.call(rawProp, 'defaultValue')
            ? rawProp.defaultValue
            : (Object.prototype.hasOwnProperty.call(rawProp, 'default')
                ? rawProp.default
                : (Object.prototype.hasOwnProperty.call(rawProp, 'value') ? rawProp.value : propInput));
        return Object.freeze({
            name,
            source: clampString(
                rawProp.source || rawProp.path || rawProp.modelPath || rawProp.valuePath,
                name ? `props.${name}` : ''
            ),
            type: clampString(rawProp.type || rawProp.kind, ''),
            required: rawProp.required === true,
            hasDefault,
            defaultValue: hasDefault ? cloneSerializable(defaultValue, null) : null,
            attribute: clampString(rawProp.attribute || rawProp.attributeName, name),
            property: clampString(rawProp.property || rawProp.propertyName, name),
            reflect: rawProp.reflect === true,
            metadata: cloneSerializable(rawProp.metadata, {})
        });
    }

    function normalizePropEntries(propsInput = []) {
        return normalizeEntryCollection(propsInput, (propInput, fallbackName) => (
            normalizePropEntry(propInput, fallbackName)
        ));
    }

    function normalizeSlotEntries(slotsInput = []) {
        return normalizeEntryCollection(slotsInput, (slotInput, fallbackName) => (
            normalizeSlotEntry(slotInput, fallbackName)
        ));
    }

    function normalizeHydrationContract(hydrationInput = {}) {
        const rawHydration = typeof hydrationInput === 'string'
            ? { mode: hydrationInput }
            : toPlainObject(hydrationInput);
        const mode = normalizeHydrationMode(rawHydration.mode || rawHydration.executionMode, '');
        return Object.freeze({
            mode,
            executionMode: mode,
            ownershipMode: normalizeOwnershipMode(rawHydration.ownershipMode || rawHydration.ownership, ''),
            autoHydrate: normalizeOptionalBoolean(rawHydration.autoHydrate, null),
            preferInsularHydration: rawHydration.preferInsularHydration === true
                || rawHydration.insularHydration === true,
            clearChildrenBeforeMount: normalizeOptionalBoolean(rawHydration.clearChildrenBeforeMount, null),
            transport: clampString(rawHydration.transport || rawHydration.prerenderTransport, ''),
            metadata: cloneSerializable(rawHydration.metadata, {})
        });
    }

    function normalizeErrorBoundary(errorBoundaryInput = {}) {
        const rawBoundary = typeof errorBoundaryInput === 'string'
            ? { fallbackMarkup: errorBoundaryInput }
            : toPlainObject(errorBoundaryInput);
        const hasBoundary = Object.keys(rawBoundary).length > 0;
        const fallbackMarkup = String(
            rawBoundary.fallbackMarkup !== undefined
                ? rawBoundary.fallbackMarkup
                : (rawBoundary.fallbackHtml !== undefined
                    ? rawBoundary.fallbackHtml
                    : (rawBoundary.markup !== undefined ? rawBoundary.markup : ''))
        );
        return Object.freeze({
            enabled: hasBoundary ? rawBoundary.enabled !== false : false,
            name: clampString(rawBoundary.name || rawBoundary.id, ''),
            target: clampString(rawBoundary.target || rawBoundary.selector, ''),
            fallbackMarkup,
            fallbackText: String(rawBoundary.fallbackText !== undefined ? rawBoundary.fallbackText : ''),
            fallbackTemplate: cloneSerializable(
                rawBoundary.fallbackTemplate !== undefined
                    ? rawBoundary.fallbackTemplate
                    : (rawBoundary.template !== undefined ? rawBoundary.template : null),
                null
            ),
            modelSource: clampString(rawBoundary.modelSource || rawBoundary.source || rawBoundary.path, ''),
            capture: rawBoundary.capture !== false,
            emitEvent: clampString(rawBoundary.emitEvent || rawBoundary.eventName, 'template:error-boundary'),
            metadata: cloneSerializable(rawBoundary.metadata, {})
        });
    }

    function normalizeTemplateBindings(rawTemplate = {}) {
        const bindings = normalizeEntryCollection(rawTemplate.bindings, (bindingInput, fallbackName) => (
            normalizeBindingEntry(bindingInput, fallbackName)
        ));
        const actionBindings = normalizeEntryCollection(rawTemplate.actions, (actionInput, fallbackName) => (
            normalizeActionBindingEntry(actionInput, fallbackName)
        ));
        const eventBindings = normalizeEntryCollection(rawTemplate.events, (eventInput, fallbackName) => (
            normalizeEventBindingEntry(eventInput, fallbackName)
        ));
        return bindings.concat(actionBindings, eventBindings);
    }

    function qualifyTemplateId(namespace, templateId) {
        const safeNamespace = clampString(namespace, '');
        const safeTemplateId = clampString(templateId, '');
        if (!safeTemplateId) {
            throw new Error('RmtFormat benoetigt eine gueltige Template-Id.');
        }
        return safeNamespace ? `${safeNamespace}:${safeTemplateId}` : safeTemplateId;
    }

    function normalizeDocumentManifest(manifestInput = {}, options = {}) {
        const rawManifest = toPlainObject(manifestInput);
        const sourceUrl = clampString(options.sourceUrl || rawManifest.sourceUrl, '');
        const sourceFile = describeSourceFile(sourceUrl);
        const documentId = clampString(
            options.documentId || rawManifest.documentId || rawManifest.id,
            'rmt-document'
        );
        return Object.freeze({
            documentId,
            namespace: clampString(options.namespace || rawManifest.namespace, ''),
            contentType: clampString(options.contentType || rawManifest.contentType, sourceFile.contentType),
            loaderHint: clampString(options.loaderHint || rawManifest.loaderHint, sourceFile.loaderHint),
            sourceUrl,
            metadata: cloneSerializable(rawManifest.metadata, {}),
            reactivityHints: cloneSerializable(rawManifest.reactivityHints, {})
        });
    }

    function normalizeTemplateEntry(templateInput = {}, options = {}) {
        const rawTemplate = toPlainObject(templateInput);
        const documentManifest = options.documentManifest && typeof options.documentManifest === 'object'
            ? options.documentManifest
            : normalizeDocumentManifest({}, options);
        const templateId = clampString(rawTemplate.id || rawTemplate.templateId, '');
        if (!templateId) {
            throw new Error('RmtFormat benoetigt template.id.');
        }

        const namespace = clampString(rawTemplate.namespace, documentManifest.namespace || '');
        const mode = normalizeTemplateMode(rawTemplate.mode || rawTemplate.templateMode, 'html_fragment');
        const markup = String(
            rawTemplate.markup !== undefined
                ? rawTemplate.markup
                : (rawTemplate.html !== undefined
                    ? rawTemplate.html
                    : (rawTemplate.source !== undefined ? rawTemplate.source : ''))
        );

        return Object.freeze({
            id: templateId,
            qualifiedId: qualifyTemplateId(namespace, templateId),
            namespace,
            mode,
            markup,
            props: normalizePropEntries(rawTemplate.props || rawTemplate.properties),
            bindings: normalizeTemplateBindings(rawTemplate),
            slots: normalizeSlotEntries(rawTemplate.slots),
            hydration: normalizeHydrationContract(rawTemplate.hydration || rawTemplate.hydrate || rawTemplate.rendering),
            errorBoundary: normalizeErrorBoundary(rawTemplate.errorBoundary || rawTemplate.error || rawTemplate.boundary),
            metadata: cloneSerializable(rawTemplate.metadata, {}),
            reactivityHints: cloneSerializable(rawTemplate.reactivityHints, {}),
            documentId: clampString(options.documentId || documentManifest.documentId, ''),
            sourceUrl: clampString(options.sourceUrl || documentManifest.sourceUrl, ''),
            loaderHint: clampString(rawTemplate.loaderHint || documentManifest.loaderHint, '')
        });
    }

    function createDslDiagnostic(level, code, message, path, metadata = {}) {
        return Object.freeze({
            level: clampString(level, 'info'),
            code: clampString(code, ''),
            message: clampString(message, ''),
            path: clampString(path, ''),
            metadata: cloneSerializable(metadata, {})
        });
    }

    function uniqueValues(values = []) {
        return Array.from(new Set(
            values
                .map((value) => clampString(value, ''))
                .filter(Boolean)
        ));
    }

    function collectRecordIds(records = [], extraIdFactory = null) {
        const values = [];
        records.forEach((record) => {
            const safeRecord = toPlainObject(record);
            values.push(safeRecord.id);
            if (typeof extraIdFactory === 'function') {
                const extraValue = extraIdFactory(safeRecord);
                if (Array.isArray(extraValue)) {
                    values.push(...extraValue);
                } else {
                    values.push(extraValue);
                }
            }
        });
        return uniqueValues(values);
    }

    function normalizeDomainRecords(values) {
        return Object.freeze(normalizeObjectArray(values).map((entry) => Object.freeze(entry)));
    }

    function readDomainInput(rawDocument, documentManifest, domainName, diagnostics) {
        const rawManifest = toPlainObject(rawDocument.manifest);
        const rawMetadata = toPlainObject(rawManifest.metadata || documentManifest.metadata);
        if (Array.isArray(rawDocument[domainName])) {
            return {
                records: rawDocument[domainName],
                source: 'top-level'
            };
        }
        if (Array.isArray(rawMetadata[domainName])) {
            diagnostics.push(createDslDiagnostic(
                'info',
                'rmt.dsl.legacy_metadata_promoted',
                `Promoted legacy manifest metadata domain "${domainName}" into normalized RMT domain records.`,
                `manifest.metadata.${domainName}`,
                { domain: domainName }
            ));
            return {
                records: rawMetadata[domainName],
                source: `manifest.metadata.${domainName}`
            };
        }
        return {
            records: [],
            source: 'default-empty'
        };
    }

    function normalizeScheduleReference(scheduleRef) {
        if (typeof scheduleRef === 'string') return clampString(scheduleRef, '');
        const rawSchedule = toPlainObject(scheduleRef);
        return clampString(rawSchedule.id || rawSchedule.ref || '', '');
    }

    function normalizeTemplateReference(templateRef) {
        if (typeof templateRef === 'string') return clampString(templateRef, '');
        const rawTemplateRef = toPlainObject(templateRef);
        return clampString(
            rawTemplateRef.id
            || rawTemplateRef.templateId
            || rawTemplateRef.ref
            || rawTemplateRef.template,
            ''
        );
    }

    function addMissingReferenceDiagnostic(diagnostics, options = {}) {
        diagnostics.push(createDslDiagnostic(
            'warning',
            options.code,
            `${options.sourceDomain || 'domain'} record "${options.sourceId || ''}" references missing ${options.targetDomain || 'target'} "${options.ref || ''}".`,
            options.path,
            {
                sourceDomain: options.sourceDomain || '',
                sourceId: options.sourceId || '',
                field: options.field || '',
                ref: options.ref || '',
                targetDomain: options.targetDomain || ''
            }
        ));
    }

    function hasReference(referenceGraph, key, ref) {
        const safeRef = clampString(ref, '');
        return !!safeRef && Array.isArray(referenceGraph[key]) && referenceGraph[key].includes(safeRef);
    }

    function buildReferenceGraph(domains, templates) {
        return Object.freeze({
            adapters: collectRecordIds(domains.adapters),
            components: collectRecordIds(domains.components),
            routes: collectRecordIds(domains.routes),
            schedules: collectRecordIds(domains.schedules, (schedule) => schedule.endpointName),
            surfaces: collectRecordIds(domains.surfaces),
            templates: collectRecordIds(templates, (template) => template.qualifiedId)
        });
    }

    function validateDslReferences(domains, templates = [], diagnostics) {
        const referenceGraph = buildReferenceGraph(domains, templates);
        domains.components.forEach((component, index) => {
            const componentId = clampString(component.id, `components[${index}]`);
            const adapterRef = clampString(component.adapter, '');
            if (adapterRef && !hasReference(referenceGraph, 'adapters', adapterRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_adapter',
                    sourceDomain: 'components',
                    sourceId: componentId,
                    field: 'adapter',
                    ref: adapterRef,
                    targetDomain: 'adapters',
                    path: `components[${index}].adapter`
                });
            }
            const scheduleRef = normalizeScheduleReference(component.schedule);
            if (scheduleRef && !hasReference(referenceGraph, 'schedules', scheduleRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_schedule',
                    sourceDomain: 'components',
                    sourceId: componentId,
                    field: 'schedule',
                    ref: scheduleRef,
                    targetDomain: 'schedules',
                    path: `components[${index}].schedule`
                });
            }
        });

        domains.routes.forEach((route, index) => {
            const routeId = clampString(route.id, `routes[${index}]`);
            const routerRef = clampString(route.router, '');
            if (routerRef && !hasReference(referenceGraph, 'adapters', routerRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_adapter',
                    sourceDomain: 'routes',
                    sourceId: routeId,
                    field: 'router',
                    ref: routerRef,
                    targetDomain: 'adapters',
                    path: `routes[${index}].router`
                });
            }
            const componentRef = clampString(route.component, '');
            if (componentRef && !hasReference(referenceGraph, 'components', componentRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_component',
                    sourceDomain: 'routes',
                    sourceId: routeId,
                    field: 'component',
                    ref: componentRef,
                    targetDomain: 'components',
                    path: `routes[${index}].component`
                });
            }
            const templateRef = normalizeTemplateReference(route.template);
            if (templateRef && !hasReference(referenceGraph, 'templates', templateRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_template',
                    sourceDomain: 'routes',
                    sourceId: routeId,
                    field: 'template',
                    ref: templateRef,
                    targetDomain: 'templates',
                    path: `routes[${index}].template`
                });
            }
            const scheduleRef = normalizeScheduleReference(route.schedule);
            if (scheduleRef && !hasReference(referenceGraph, 'schedules', scheduleRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_schedule',
                    sourceDomain: 'routes',
                    sourceId: routeId,
                    field: 'schedule',
                    ref: scheduleRef,
                    targetDomain: 'schedules',
                    path: `routes[${index}].schedule`
                });
            }
        });

        domains.surfaces.forEach((surface, index) => {
            const surfaceId = clampString(surface.id, `surfaces[${index}]`);
            const adapterRef = clampString(surface.adapter, '');
            if (adapterRef && !hasReference(referenceGraph, 'adapters', adapterRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_adapter',
                    sourceDomain: 'surfaces',
                    sourceId: surfaceId,
                    field: 'adapter',
                    ref: adapterRef,
                    targetDomain: 'adapters',
                    path: `surfaces[${index}].adapter`
                });
            }
            const managerRef = clampString(surface.manager, '');
            if (managerRef && !hasReference(referenceGraph, 'components', managerRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_component',
                    sourceDomain: 'surfaces',
                    sourceId: surfaceId,
                    field: 'manager',
                    ref: managerRef,
                    targetDomain: 'components',
                    path: `surfaces[${index}].manager`
                });
            }
            const componentRef = clampString(surface.component, '');
            if (componentRef && !hasReference(referenceGraph, 'components', componentRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_component',
                    sourceDomain: 'surfaces',
                    sourceId: surfaceId,
                    field: 'component',
                    ref: componentRef,
                    targetDomain: 'components',
                    path: `surfaces[${index}].component`
                });
            }
            const routeRef = clampString(surface.route, '');
            if (routeRef && !hasReference(referenceGraph, 'routes', routeRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_route',
                    sourceDomain: 'surfaces',
                    sourceId: surfaceId,
                    field: 'route',
                    ref: routeRef,
                    targetDomain: 'routes',
                    path: `surfaces[${index}].route`
                });
            }
            const scheduleRef = normalizeScheduleReference(surface.schedule);
            if (scheduleRef && !hasReference(referenceGraph, 'schedules', scheduleRef)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_schedule',
                    sourceDomain: 'surfaces',
                    sourceId: surfaceId,
                    field: 'schedule',
                    ref: scheduleRef,
                    targetDomain: 'schedules',
                    path: `surfaces[${index}].schedule`
                });
            }
        });

        templates.forEach((template, index) => {
            const metadata = template && template.hydration && template.hydration.metadata
                ? template.hydration.metadata
                : {};
            const endpointHint = clampString(metadata.endpointHint, '');
            if (endpointHint && !hasReference(referenceGraph, 'schedules', endpointHint)) {
                addMissingReferenceDiagnostic(diagnostics, {
                    code: 'rmt.dsl.reference.missing_schedule',
                    sourceDomain: 'templates',
                    sourceId: template.id,
                    field: 'hydration.metadata.endpointHint',
                    ref: endpointHint,
                    targetDomain: 'schedules',
                    path: `templates[${index}].hydration.metadata.endpointHint`
                });
            }
        });

        return referenceGraph;
    }

    function normalizeDslDomains(rawDocument, documentManifest, templates = []) {
        const diagnostics = [];
        const domainSources = {};
        const domains = {};
        NATIVE_DOMAIN_NAMES.forEach((domainName) => {
            const domainInput = readDomainInput(rawDocument, documentManifest, domainName, diagnostics);
            domains[domainName] = normalizeDomainRecords(domainInput.records);
            domainSources[domainName] = Object.freeze({
                source: domainInput.source,
                count: domains[domainName].length
            });
        });

        const referenceGraph = validateDslReferences(domains, templates, diagnostics);
        const normalizedDiagnostics = Object.freeze(diagnostics.map((entry) => Object.freeze(entry)));
        const normalization = Object.freeze({
            schema: DSL_NORMALIZATION_SCHEMA,
            status: normalizedDiagnostics.length > 0 ? 'normalized_with_diagnostics' : 'normalized',
            domains: Object.freeze(domainSources),
            referenceGraph,
            diagnosticCodes: DSL_DIAGNOSTIC_CODES.slice(),
            diagnosticCount: normalizedDiagnostics.length,
            templateOnlyCompatible: domains.adapters.length === 0
                && domains.components.length === 0
                && domains.routes.length === 0
                && domains.schedules.length === 0
                && domains.surfaces.length === 0
        });

        return Object.freeze({
            adapters: domains.adapters,
            components: domains.components,
            routes: domains.routes,
            schedules: domains.schedules,
            surfaces: domains.surfaces,
            diagnostics: normalizedDiagnostics,
            normalization
        });
    }

    function normalizeRegistryRequirementList(values) {
        if (Array.isArray(values)) return uniqueValues(values);
        return uniqueValues(String(values || '').split(','));
    }

    function addRuntimeRegistryDiagnostic(diagnostics, code, message, path, metadata = {}) {
        diagnostics.push(createDslDiagnostic(
            'warning',
            code,
            message,
            path,
            metadata
        ));
    }

    function createArrayIndex(entries, fieldName) {
        const index = {};
        entries.forEach((entry) => {
            const value = clampString(entry[fieldName], '');
            if (!value) return;
            const bucket = index[value] || [];
            bucket.push(entry.id);
            index[value] = bucket;
        });
        Object.keys(index).forEach((key) => {
            index[key] = Object.freeze(index[key]);
        });
        return Object.freeze(index);
    }

    function createByIdIndex(entries, diagnostics, options = {}) {
        const index = {};
        entries.forEach((entry, indexPosition) => {
            const id = clampString(entry.id, '');
            if (!id) return;
            if (index[id]) {
                addRuntimeRegistryDiagnostic(
                    diagnostics,
                    options.duplicateCode,
                    `${options.label || 'Registry'} record "${id}" is declared more than once; adapters should consume the first stable record.`,
                    `${options.path || 'registry'}[${indexPosition}].id`,
                    {
                        id,
                        registry: options.registry || '',
                        keptIndex: index[id].index,
                        duplicateIndex: indexPosition
                    }
                );
                return;
            }
            index[id] = entry;
        });
        return Object.freeze(index);
    }

    function normalizeComponentRegistryEntry(componentInput, indexPosition) {
        const component = toPlainObject(componentInput);
        const id = clampString(component.id, `components[${indexPosition}]`);
        return Object.freeze({
            id,
            index: indexPosition,
            kind: clampString(component.kind, ''),
            adapterId: clampString(component.adapter, ''),
            tag: clampString(component.tag || component.renderer, ''),
            scheduleRef: normalizeScheduleReference(component.schedule),
            lifecycleEvents: RUNTIME_REGISTRY_LIFECYCLE_EVENTS.slice(),
            record: cloneSerializable(component, {})
        });
    }

    function normalizeRouteRegistryEntry(routeInput, indexPosition) {
        const route = toPlainObject(routeInput);
        const id = clampString(route.id, `routes[${indexPosition}]`);
        const componentId = clampString(route.component, '');
        const templateRef = normalizeTemplateReference(route.template);
        return Object.freeze({
            id,
            index: indexPosition,
            path: clampString(route.path, ''),
            routerId: clampString(route.router, ''),
            componentId,
            templateRef,
            redirect: clampString(route.redirect, ''),
            scheduleRef: normalizeScheduleReference(route.schedule),
            lifecycleEvents: RUNTIME_REGISTRY_LIFECYCLE_EVENTS.slice(),
            targetKind: componentId ? 'component' : (templateRef ? 'template' : (route.redirect ? 'redirect' : 'none')),
            record: cloneSerializable(route, {})
        });
    }

    function createRmtRuntimeRegistries(documentInput = {}, options = {}) {
        const documentRecord = typeof documentInput === 'string'
            ? normalizeDocumentRecord(JSON.parse(documentInput), options)
            : (documentInput && documentInput.kind === DOCUMENT_KIND && Array.isArray(documentInput.templates) && documentInput.normalization
            ? documentInput
            : normalizeDocumentRecord(documentInput, options));
        const diagnostics = [];
        const componentEntries = Object.freeze((Array.isArray(documentRecord.components) ? documentRecord.components : [])
            .map((component, indexPosition) => normalizeComponentRegistryEntry(component, indexPosition)));
        const routeEntries = Object.freeze((Array.isArray(documentRecord.routes) ? documentRecord.routes : [])
            .map((route, indexPosition) => normalizeRouteRegistryEntry(route, indexPosition)));
        const componentById = createByIdIndex(componentEntries, diagnostics, {
            duplicateCode: 'rmt.runtime.registry.duplicate_component',
            label: 'Component registry',
            path: 'components',
            registry: 'components'
        });
        const routeById = createByIdIndex(routeEntries, diagnostics, {
            duplicateCode: 'rmt.runtime.registry.duplicate_route',
            label: 'Route registry',
            path: 'routes',
            registry: 'routes'
        });
        const componentByTag = createArrayIndex(componentEntries, 'tag');
        const componentsByAdapter = createArrayIndex(componentEntries, 'adapterId');
        const routesByPath = createArrayIndex(routeEntries, 'path');
        const routesByRouter = createArrayIndex(routeEntries, 'routerId');
        const routesByComponent = createArrayIndex(routeEntries, 'componentId');
        const requiredRoutes = normalizeRegistryRequirementList(options.requiredRoutes || options.requiredRouteIds || []);
        const requiredComponents = normalizeRegistryRequirementList(options.requiredComponents || options.requiredComponentIds || []);

        requiredRoutes.forEach((routeRef) => {
            if (!routeById[routeRef] && !routesByPath[routeRef]) {
                addRuntimeRegistryDiagnostic(
                    diagnostics,
                    'rmt.runtime.registry.missing_route',
                    `Required route "${routeRef}" is not present in the RMT route registry.`,
                    'routes',
                    {
                        ref: routeRef,
                        registry: 'routes',
                        acceptedIndexes: ['id', 'path']
                    }
                );
            }
        });

        requiredComponents.forEach((componentRef) => {
            if (!componentById[componentRef] && !componentByTag[componentRef]) {
                addRuntimeRegistryDiagnostic(
                    diagnostics,
                    'rmt.runtime.registry.missing_component',
                    `Required component "${componentRef}" is not present in the RMT component registry.`,
                    'components',
                    {
                        ref: componentRef,
                        registry: 'components',
                        acceptedIndexes: ['id', 'tag']
                    }
                );
            }
        });

        const sourceDiagnostics = Object.freeze(cloneSerializable(documentRecord.diagnostics, []));
        const registryDiagnostics = Object.freeze(diagnostics.map((entry) => Object.freeze(entry)));
        const diagnosticCount = sourceDiagnostics.length + registryDiagnostics.length;
        return Object.freeze({
            schema: RUNTIME_REGISTRY_SCHEMA,
            status: diagnosticCount > 0
                ? 'ready_with_diagnostics'
                : (routeEntries.length > 0 || componentEntries.length > 0 ? 'ready' : 'empty'),
            documentId: documentRecord.manifest ? documentRecord.manifest.documentId : '',
            normalization: cloneSerializable(documentRecord.normalization, null),
            diagnostics: registryDiagnostics,
            sourceDiagnostics,
            diagnosticCount,
            lifecycleEvents: RUNTIME_REGISTRY_LIFECYCLE_EVENTS.slice(),
            routes: routeEntries,
            components: componentEntries,
            routeRegistry: Object.freeze({
                ids: Object.freeze(routeEntries.map((entry) => entry.id)),
                byId: routeById,
                byPath: routesByPath,
                byRouter: routesByRouter,
                byComponent: routesByComponent
            }),
            componentRegistry: Object.freeze({
                ids: Object.freeze(componentEntries.map((entry) => entry.id)),
                byId: componentById,
                byTag: componentByTag,
                byAdapter: componentsByAdapter
            })
        });
    }

    function normalizeDocumentRecord(documentInput = {}, options = {}) {
        const rawDocument = toPlainObject(documentInput);
        const documentManifest = normalizeDocumentManifest(rawDocument.manifest, {
            documentId: options.documentId || rawDocument.documentId || rawDocument.id,
            namespace: options.namespace || rawDocument.namespace,
            loaderHint: options.loaderHint || rawDocument.loaderHint,
            sourceUrl: options.sourceUrl || rawDocument.sourceUrl
        });
        const templates = (Array.isArray(rawDocument.templates) ? rawDocument.templates : []).map((templateInput) => (
            normalizeTemplateEntry(templateInput, {
                documentId: documentManifest.documentId,
                sourceUrl: documentManifest.sourceUrl,
                documentManifest
            })
        ));
        const normalizedDsl = normalizeDslDomains(rawDocument, documentManifest, templates);

        return Object.freeze({
            kind: DOCUMENT_KIND,
            version: clampString(rawDocument.version, DOCUMENT_VERSION),
            manifest: documentManifest,
            adapters: normalizedDsl.adapters,
            components: normalizedDsl.components,
            routes: normalizedDsl.routes,
            schedules: normalizedDsl.schedules,
            surfaces: normalizedDsl.surfaces,
            diagnostics: normalizedDsl.diagnostics,
            normalization: normalizedDsl.normalization,
            templates
        });
    }

    appModules.createRmtFormat = function createRmtFormat() {
        function createEmptyDocument(options = {}) {
            return normalizeDocumentRecord({
                kind: DOCUMENT_KIND,
                version: DOCUMENT_VERSION,
                manifest: {
                    documentId: options.documentId || options.id || 'rmt-document',
                    namespace: options.namespace || '',
                    loaderHint: options.loaderHint || '',
                    sourceUrl: options.sourceUrl || '',
                    metadata: options.metadata || {},
                    reactivityHints: options.reactivityHints || {}
                },
                templates: []
            }, options);
        }

        function normalizeDocument(documentInput = {}, options = {}) {
            if (typeof documentInput === 'string') {
                return parseDocument(documentInput, options);
            }
            return normalizeDocumentRecord(documentInput, options);
        }

        function parseDocument(documentSource, options = {}) {
            if (typeof documentSource !== 'string') {
                throw new Error('RmtFormat.parseDocument() erwartet einen JSON-String.');
            }
            const rawDocument = JSON.parse(documentSource);
            return normalizeDocumentRecord(rawDocument, options);
        }

        function serializeDocument(documentInput, options = {}) {
            const safeDocument = normalizeDocument(documentInput, options);
            const serializedDocument = {
                kind: safeDocument.kind,
                version: safeDocument.version,
                manifest: cloneSerializable(safeDocument.manifest, {}),
                templates: safeDocument.templates.map((template) => ({
                    id: template.id,
                    namespace: template.namespace,
                    mode: template.mode,
                    markup: template.markup,
                    props: cloneSerializable(template.props, []),
                    bindings: cloneSerializable(template.bindings, []),
                    slots: cloneSerializable(template.slots, []),
                    hydration: cloneSerializable(template.hydration, {}),
                    errorBoundary: cloneSerializable(template.errorBoundary, {}),
                    metadata: cloneSerializable(template.metadata, {}),
                    reactivityHints: cloneSerializable(template.reactivityHints, {})
                }))
            };
            NATIVE_DOMAIN_NAMES.forEach((domainName) => {
                if (Array.isArray(safeDocument[domainName]) && safeDocument[domainName].length > 0) {
                    serializedDocument[domainName] = cloneSerializable(safeDocument[domainName], []);
                }
            });
            if (options.includeDiagnostics === true && Array.isArray(safeDocument.diagnostics) && safeDocument.diagnostics.length > 0) {
                serializedDocument.diagnostics = cloneSerializable(safeDocument.diagnostics, []);
            }
            if (options.includeNormalization === true && safeDocument.normalization) {
                serializedDocument.normalization = cloneSerializable(safeDocument.normalization, {});
            }
            return JSON.stringify(serializedDocument, null, options.pretty === false ? 0 : 2);
        }

        return Object.freeze({
            contentType: CONTENT_TYPE,
            createEmptyDocument,
            describeSourceFile,
            documentKind: DOCUMENT_KIND,
            documentVersion: DOCUMENT_VERSION,
            getJsonFallbackFileExtensions: () => JSON_FALLBACK_FILE_EXTENSIONS.slice(),
            getPreferredFileExtension: () => PREFERRED_FILE_EXTENSION,
            inferFileExtension,
            isSupportedFileExtension,
            listSupportedFileExtensions: () => SUPPORTED_FILE_EXTENSIONS.slice(),
            listSupportedBindingKinds: () => BINDING_KINDS.slice(),
            listSupportedHydrationModes: () => HYDRATION_MODES.slice(),
            listSupportedOwnershipModes: () => OWNERSHIP_MODES.slice(),
            createRuntimeRegistries: createRmtRuntimeRegistries,
            normalizeBindingEntry,
            normalizeBindingKind,
            normalizeDslDomains,
            normalizeErrorBoundary,
            normalizeHydrationContract,
            normalizeHydrationMode,
            normalizeOwnershipMode,
            normalizePropEntry,
            normalizePropEntries,
            listSupportedTemplateModes: () => TEMPLATE_MODES.slice(),
            listSupportedSlotKinds: () => SLOT_KINDS.slice(),
            listDslDiagnosticCodes: () => DSL_DIAGNOSTIC_CODES.slice(),
            listRuntimeRegistryDiagnosticCodes: () => RUNTIME_REGISTRY_DIAGNOSTIC_CODES.slice(),
            normalizeDocument,
            normalizeDocumentManifest,
            normalizeSlotEntry,
            normalizeSlotKind,
            normalizeTemplateEntry,
            normalizeTemplateMode,
            parseDocument,
            qualifyTemplateId,
            serializeDocument
        });
    };
})(__XTENDRMT_GLOBAL__);
