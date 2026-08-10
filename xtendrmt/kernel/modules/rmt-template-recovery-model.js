/* modules/rmt-template-recovery-model.js */
(function registerRmtTemplateRecoveryModelModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const RECOVERY_OUTCOME_SCHEMA = 'xtend.rmt.kernel-recovery-outcome.v1';
    const RECOVERY_SNAPSHOT_SCHEMA = 'xtend.rmt.kernel-recovery-safe-snapshot.v1';

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

    appModules.createRmtTemplateRecoveryModel = function createRmtTemplateRecoveryModel(deps = {}) {
        let logicalClock = 0;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => {
                logicalClock += 1;
                return logicalClock;
            });
        const snapshots = new Map();
        const quarantinedScopes = new Set();
        const outcomes = [];

        function scopeFor(input = {}) {
            return clampString(input.scope || input.rootId || input.snapshotKey || input.templateQualifiedId, 'kernel');
        }

        function rememberSafeSnapshot(input = {}) {
            const scope = scopeFor(input);
            const snapshotKey = clampString(input.snapshotKey || input.rootId, scope);
            const snapshot = Object.freeze({
                schema: RECOVERY_SNAPSHOT_SCHEMA,
                snapshotId: `${RECOVERY_SNAPSHOT_SCHEMA}:${snapshotKey}`,
                snapshotKey,
                rootId: clampString(input.rootId, null),
                scope,
                sourceRef: clampString(input.sourceRef, null),
                templateQualifiedId: clampString(input.templateQualifiedId, null),
                sanitized: input.sanitized === true || input.trusted === true,
                html: clampString(input.html, ''),
                textContent: clampString(input.textContent, ''),
                modelSnapshot: cloneSerializable(input.modelSnapshot, {}),
                capturedAt: now(),
                metadata: cloneSerializable(input.metadata, {})
            });
            snapshots.set(snapshotKey, snapshot);
            snapshots.set(scope, snapshot);
            if (snapshot.rootId) snapshots.set(snapshot.rootId, snapshot);
            return cloneSerializable(snapshot, {});
        }

        function getLastSafeSnapshot(input = {}) {
            const scope = scopeFor(input);
            const key = clampString(input.snapshotKey || input.rootId, scope);
            return cloneSerializable(snapshots.get(key) || snapshots.get(scope) || null, null);
        }

        function quarantineScope(input = {}) {
            const scope = scopeFor(input);
            quarantinedScopes.add(scope);
            return scope;
        }

        function recordOutcome(input = {}) {
            const outcome = Object.freeze({
                schema: RECOVERY_OUTCOME_SCHEMA,
                outcomeId: `${RECOVERY_OUTCOME_SCHEMA}:${outcomes.length + 1}`,
                status: clampString(input.status, 'planned'),
                scope: scopeFor(input),
                rootId: clampString(input.rootId, null),
                quarantined: input.quarantined === true,
                restoredSnapshotId: clampString(input.restoredSnapshotId, null),
                fallbackRendered: input.fallbackRendered === true,
                failures: cloneSerializable(input.failures, []),
                completedAt: now(),
                metadata: cloneSerializable(input.metadata, {})
            });
            outcomes.push(outcome);
            return cloneSerializable(outcome, {});
        }

        return Object.freeze({
            kind: 'rmt_template_recovery_model',
            version: '1.0',
            getLastSafeSnapshot,
            isScopeQuarantined: (input = {}) => quarantinedScopes.has(scopeFor(input)),
            listQuarantinedScopes: () => Array.from(quarantinedScopes),
            listRecoveryOutcomes: () => outcomes.map((entry) => cloneSerializable(entry, {})),
            listSafeSnapshots: () => Array.from(new Set(Array.from(snapshots.values())))
                .map((entry) => cloneSerializable(entry, {})),
            quarantineScope,
            recordOutcome,
            rememberSafeSnapshot
        });
    };
})(__XTENDRMT_GLOBAL__);
