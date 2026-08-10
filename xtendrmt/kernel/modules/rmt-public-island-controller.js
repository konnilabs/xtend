/* modules/rmt-public-island-controller.js */
(function registerRmtPublicIslandControllerModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const PUBLIC_API_VERSION = '{{KERNEL_VERSION}}';
    const OWNERSHIP_MODES = Object.freeze([
        'observe_only',
        'hydrate_existing',
        'replace_children',
        'managed_subtree'
    ]);

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

    function normalizeOwnershipMode(value, fallbackValue = 'managed_subtree') {
        const safeValue = clampString(value, fallbackValue);
        return OWNERSHIP_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function isElementLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.addEventListener === 'function'
            && typeof value.removeEventListener === 'function';
    }

    appModules.createRmtPublicIslandController = function createRmtPublicIslandController(deps = {}) {
        const rmt = deps.rmt;
        const domCompat = deps.domCompat;
        if (!rmt || typeof rmt.mountRoot !== 'function') {
            throw new Error('RmtPublicIslandController benoetigt einen gueltigen RmtCommandPort.');
        }
        if (!domCompat || typeof domCompat.resolveElement !== 'function') {
            throw new Error('RmtPublicIslandController benoetigt einen gueltigen DomCompatPort.');
        }
        let logicalClock = 0;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => {
                logicalClock += 1;
                return logicalClock;
            });
        const islandRegistry = new Map();
        let autoIslandIdCounter = 0;

        function resolveIslandTarget(input, options = {}) {
            const record = typeof domCompat.resolveElementRecord === 'function'
                ? domCompat.resolveElementRecord(input, options)
                : null;
            if (record && record.element) return record;
            const legacyElement = typeof domCompat.resolveElement === 'function'
                ? domCompat.resolveElement(input, options)
                : null;
            if (!legacyElement) {
                throw new Error('RmtPublicApi konnte kein Island-Zielelement aufloesen.');
            }
            return Object.freeze({ element: legacyElement, elementId: '' });
        }

        function resolveRootId(input, targetRecord, options = {}) {
            const explicitRootId = clampString(
                options.rootId || (input && input.rootId) || (input && input.id),
                ''
            );
            if (explicitRootId) return explicitRootId;
            if (targetRecord.elementId && targetRecord.elementId.trim()) {
                return `island:${targetRecord.elementId.trim()}`;
            }
            autoIslandIdCounter += 1;
            return `rmt:island:${autoIslandIdCounter}`;
        }

        function buildIslandContract(input, options = {}, fallbackOwnershipMode = 'managed_subtree') {
            const rawInput = input && typeof input === 'object' && !isElementLike(input)
                ? input
                : {};
            const targetRecord = resolveIslandTarget(input, { ...rawInput, ...options });
            const element = targetRecord.element;
            const rootId = resolveRootId(rawInput, targetRecord, options);
            const namespace = clampString(options.namespace || rawInput.namespace, '');
            const ownershipMode = normalizeOwnershipMode(
                options.ownershipMode || rawInput.ownershipMode,
                fallbackOwnershipMode
            );
            return {
                rootId,
                element,
                elementId: targetRecord.elementId,
                namespace,
                ownershipMode,
                mountedAt: now(),
                clearChildrenBeforeMount: options.clearChildrenBeforeMount !== false
                    && rawInput.clearChildrenBeforeMount !== false,
                rootOptions: {
                    ...(rawInput.rootOptions && typeof rawInput.rootOptions === 'object' ? rawInput.rootOptions : {}),
                    ...(options.rootOptions && typeof options.rootOptions === 'object' ? options.rootOptions : {}),
                    namespace,
                    ownershipMode
                },
                metadata: cloneSerializable({
                    ...(rawInput.metadata && typeof rawInput.metadata === 'object' ? rawInput.metadata : {}),
                    ...(options.metadata && typeof options.metadata === 'object' ? options.metadata : {})
                }, {}),
                selector: clampString(options.selector || rawInput.selector, '')
            };
        }

        function normalizeIslandRef(islandRef) {
            return clampString(
                islandRef && typeof islandRef === 'object' && typeof islandRef.getRootId === 'function'
                    ? islandRef.getRootId()
                    : islandRef,
                ''
            );
        }

        function getIslandContract(islandRef) {
            const record = islandRegistry.get(normalizeIslandRef(islandRef));
            return record ? cloneSerializable(record.contract, null) : null;
        }

        function invalidateIsland(islandRef) {
            return rmt.invalidateRoot(normalizeIslandRef(islandRef));
        }

        function unmountIsland(islandRef, options = {}) {
            const rootId = normalizeIslandRef(islandRef);
            const record = islandRegistry.get(rootId) || null;
            const result = rmt.disposeRoot(rootId, {
                clearHandlers: options.clearHandlers === true,
                removeState: options.removeState === true
            });
            if (record) domCompat.finalizeIslandUnmount(record.contract, options);
            if (options.removeState !== false) islandRegistry.delete(rootId);
            return result;
        }

        function createIslandHandle(rootId) {
            return Object.freeze({
                dispatchCommand(commandName, payload = {}, options = {}) {
                    return rmt.dispatchCommand({ commandName, rootId, payload }, options);
                },
                getContract: () => getIslandContract(rootId),
                getElement: () => rmt.getRootElement(rootId),
                getRootHandle: () => rmt.getRootHandle(rootId),
                getRootId: () => rootId,
                invalidate: () => invalidateIsland(rootId),
                unmount: (options = {}) => unmountIsland(rootId, options)
            });
        }

        function mountIsland(input, options = {}) {
            const contract = buildIslandContract(input, options, 'managed_subtree');
            domCompat.prepareIslandMount(contract);
            const rootHandle = rmt.mountRoot(contract.rootId, contract.element, contract.rootOptions);
            islandRegistry.set(contract.rootId, { contract, rootHandle });
            return createIslandHandle(contract.rootId);
        }

        function hydrateIsland(input, options = {}) {
            return mountIsland(input, {
                ...options,
                ownershipMode: options.ownershipMode || 'hydrate_existing'
            });
        }

        function observeIsland(input, options = {}) {
            return mountIsland(input, {
                ...options,
                ownershipMode: options.ownershipMode || 'observe_only'
            });
        }

        function listIslands() {
            return Array.from(islandRegistry.values()).map((record) => ({
                rootId: record.contract.rootId,
                elementId: record.contract.elementId,
                namespace: record.contract.namespace,
                ownershipMode: record.contract.ownershipMode,
                mountedAt: record.contract.mountedAt
            })).sort((left, right) => left.rootId.localeCompare(right.rootId));
        }

        function createFacade(options = {}) {
            const rmtCore = options.rmtCore;
            const templateApi = options.templateApi || null;
            const getManifest = typeof options.getManifest === 'function'
                ? options.getManifest
                : (() => null);
            return Object.freeze({
                apiVersion: PUBLIC_API_VERSION,
                dispatchCommand: (commandName, payload = {}, commandOptions = {}) => rmt.dispatchCommand({
                    commandName,
                    payload,
                    rootId: clampString(commandOptions.rootId, '')
                }, commandOptions),
                getCore: () => rmtCore,
                getDomCompat: () => domCompat,
                getHostContract: () => (
                    typeof domCompat.getHostContract === 'function'
                        ? domCompat.getHostContract()
                        : {
                            apiVersion: PUBLIC_API_VERSION,
                            ownershipModes: OWNERSHIP_MODES.slice(),
                            defaultOwnershipMode: 'managed_subtree'
                        }
                ),
                getIslandContract,
                getIslandHandle: (islandRef) => {
                    const contract = getIslandContract(islandRef);
                    return contract ? createIslandHandle(contract.rootId) : null;
                },
                getManifest,
                getRmt: () => rmt,
                getTemplateApi: () => templateApi,
                hydrateIsland,
                invalidateIsland,
                listIslands,
                mountIsland,
                observeIsland,
                unmountIsland,
                version: PUBLIC_API_VERSION
            });
        }

        return Object.freeze({
            createFacade,
            getIslandContract,
            hydrateIsland,
            invalidateIsland,
            listIslands,
            mountIsland,
            observeIsland,
            unmountIsland
        });
    };
})(__XTENDRMT_GLOBAL__);
