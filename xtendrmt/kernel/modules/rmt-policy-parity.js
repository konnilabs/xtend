/* modules/rmt-policy-parity.js */
(function registerRmtKernelPolicyParityModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const RMT_KERNEL_POLICY_PARITY_SCHEMA = 'xtend.rmt.kernel-policy-parity.v1';
    const RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA = 'xtend.rmt.kernel-policy-parity-matrix.v1';
    const RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA = 'xtend.rmt.kernel-policy-parity-report.v1';
    const RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA = 'xtend.rmt.kernel-policy-parity-drift.v1';
    const RMT_KERNEL_POLICY_PARITY_WORKPACKAGE = 'RKSH-WP-08';
    const RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL = 'rmt.kernel.policy_parity';
    const KERNEL_POLICY_PARITY_RUNTIME_HOOKS = Object.freeze([
        'recordTrustVerdict',
        'commitTrustedHtml',
        'commitTrustedAttribute',
        'commitTrustedProperty',
        'applyRemoteSurfacePolicy',
        'recoverFromPanic',
        'rememberSafeSnapshot',
        'listRecoveryOutcomes',
        'panicBlockScope',
        'abortScope',
        'reportPerformanceSample',
        'dispatchCommand',
        'recordEscalation',
        'listEscalations'
    ]);
    const DEFAULT_KERNEL_POLICY_PARITY_MATRIX = Object.freeze([
        Object.freeze({ id: 'vnext-security-trust-boundary-runtime-trust-authority', sourceSchema: 'xtend.rmt.vnext-security-policy-contract.v1', policyFamily: 'vnext-security', compileTimeCodes: Object.freeze(['rmt.vnext.security.policy.owner_missing', 'rmt.vnext.security.trust_boundary.missing', 'rmt.vnext.security.trust_boundary.unknown', 'rmt.vnext.security.sanitize.missing', 'rmt.vnext.security.sanitize.format_unsupported', 'rmt.vnext.security.policy.duplicate', 'rmt.vnext.security.policy.conflict', 'rmt.vnext.security.sanitize.without_boundary']), compileTimeStatuses: Object.freeze(['blocked']), runtimeScope: 'trusted-runtime-output', runtimeHooks: Object.freeze(['recordTrustVerdict', 'commitTrustedHtml']), runtimeSchemas: Object.freeze(['xtend.rmt.kernel-trust-authority.v1', 'xtend.rmt.kernel-trust-verdict.v1']), runtimeVerdicts: Object.freeze(['sanitized', 'blocked', 'panic']), panicTrigger: 'trust-verdict-blocked', recoveryAction: 'quarantine-scope' }),
        Object.freeze({ id: 'vnext-security-binding-runtime-attribute-property-policy', sourceSchema: 'xtend.rmt.vnext-security-policy-contract.v1', policyFamily: 'vnext-security', compileTimeCodes: Object.freeze(['rmt.vnext.security.trust_boundary.missing', 'rmt.vnext.security.sanitize.without_boundary', 'rmt.vnext.security.policy.conflict']), compileTimeStatuses: Object.freeze(['blocked']), runtimeScope: 'binding-output', runtimeHooks: Object.freeze(['commitTrustedAttribute', 'commitTrustedProperty', 'recordTrustVerdict']), runtimeSchemas: Object.freeze(['xtend.rmt.kernel-trust-authority.v1', 'xtend.rmt.kernel-trust-verdict.v1']), runtimeVerdicts: Object.freeze(['trusted', 'blocked', 'panic']), panicTrigger: 'trust-verdict-blocked', recoveryAction: 'quarantine-scope' }),
        Object.freeze({ id: 'remote-security-runtime-remote-output-trust-scope', sourceSchema: 'xtend.rmt.vnext-remote-security-policy.v1', policyFamily: 'remote-security', compileTimeCodes: Object.freeze(['rmt.vnext.remote_security.trust_boundary_missing', 'rmt.vnext.remote_security.trust_boundary_unknown', 'rmt.vnext.remote_security.origin_not_allowed', 'rmt.vnext.remote_security.integrity_missing', 'rmt.vnext.remote_security.csp_missing', 'rmt.vnext.remote_security.sandbox_conflict', 'rmt.vnext.remote_security.capability_escalation', 'rmt.vnext.remote_security.event_payload_missing', 'rmt.vnext.remote_security.degradation_blocked']), compileTimeStatuses: Object.freeze(['blocked']), runtimeScope: 'remote-output', runtimeHooks: Object.freeze(['applyRemoteSurfacePolicy', 'recordTrustVerdict', 'recordEscalation']), runtimeSchemas: Object.freeze(['xtend.rmt.kernel-trust-authority.v1', 'xtend.rmt.kernel-trust-verdict.v1', 'xtend.rmt.kernel-escalation.v1']), runtimeVerdicts: Object.freeze(['blocked', 'panic']), trustBoundary: 'xtend.security.remote-surface.v1', panicTrigger: 'remote-output-policy-blocked', recoveryAction: 'quarantine-scope' }),
        Object.freeze({ id: 'degradation-blocked-runtime-panic-recovery', sourceSchema: 'xtend.rmt.vnext-degradation-policy.v1', policyFamily: 'degradation', compileTimeCodes: Object.freeze(['rmt.vnext.degradation.registry_surface_blocked', 'rmt.vnext.degradation.fallback_missing', 'rmt.vnext.degradation.capability_missing', 'rmt.vnext.degradation.version_mismatch', 'rmt.vnext.degradation.shell_version_unsupported', 'rmt.vnext.degradation.event_restricted']), compileTimeStatuses: Object.freeze(['blocked']), runtimeScope: 'degraded-or-blocked-surface', runtimeHooks: Object.freeze(['recoverFromPanic', 'rememberSafeSnapshot', 'listRecoveryOutcomes', 'panicBlockScope']), runtimeSchemas: Object.freeze(['xtend.rmt.kernel-recovery.v1', 'xtend.rmt.kernel-recovery-outcome.v1', 'xtend.rmt.kernel-scheduler-failure.v1']), runtimeVerdicts: Object.freeze(['blocked', 'recovered', 'panic']), panicTrigger: 'degradation-blocked', recoveryAction: 'render-safe-fallback' }),
        Object.freeze({ id: 'streaming-error-path-runtime-panic-scheduler', sourceSchema: 'xtend.rmt.vnext-streaming-contract.v1', policyFamily: 'streaming', compileTimeCodes: Object.freeze(['rmt.vnext.streaming.security.missing', 'rmt.vnext.streaming.error_path.missing', 'rmt.vnext.streaming.backpressure.missing', 'rmt.vnext.streaming.data_source.missing', 'rmt.vnext.streaming.data_source.kind_unsupported', 'rmt.vnext.streaming.capability.missing']), compileTimeStatuses: Object.freeze(['blocked']), runtimeScope: 'streaming-output', runtimeHooks: Object.freeze(['reportPerformanceSample', 'panicBlockScope', 'recordTrustVerdict']), runtimeSchemas: Object.freeze(['xtend.rmt.kernel-scheduler-failure.v1', 'xtend.rmt.kernel-scheduler-failure-record.v1', 'xtend.rmt.kernel-trust-verdict.v1']), runtimeVerdicts: Object.freeze(['blocked', 'panic']), panicTrigger: 'scheduler-backpressure', recoveryAction: 'pause-scheduler-jobs' }),
        Object.freeze({ id: 'event-governance-delivery-block-runtime-signal', sourceSchema: 'xtend.rmt.vnext-event-governance-policy.v1', policyFamily: 'event-governance', compileTimeCodes: Object.freeze(['rmt.vnext.event_governance.delivery_policy_missing', 'rmt.vnext.event_governance.delivery_mode_invalid', 'rmt.vnext.event_governance.protocol_blocked', 'rmt.vnext.event_governance.sensitivity_missing']), compileTimeStatuses: Object.freeze(['blocked']), runtimeScope: 'event-delivery', runtimeHooks: Object.freeze(['dispatchCommand', 'recordEscalation', 'listEscalations']), runtimeSchemas: Object.freeze(['xtend.rmt.kernel-escalation.v1', 'xtend.rmt.kernel-escalation-envelope.v1']), runtimeVerdicts: Object.freeze(['blocked', 'panic']), panicTrigger: 'command-bus-failure', recoveryAction: 'notify-host' })
    ]);
    const SOURCE_SCHEMA_ALIASES = Object.freeze({
        'xtend.rmt.vnext-remote-security-report.v1': 'xtend.rmt.vnext-remote-security-policy.v1',
        'xtend.rmt.vnext-degradation-report.v1': 'xtend.rmt.vnext-degradation-policy.v1',
        'xtend.rmt.vnext-event-governance-report.v1': 'xtend.rmt.vnext-event-governance-policy.v1'
    });

    function normalizeString(value, fallback = '') {
        if (value === null || value === undefined) return fallback;
        const normalized = String(value).trim();
        return normalized || fallback;
    }

    function normalizeArray(value) {
        if (Array.isArray(value)) return value;
        if (value === null || value === undefined) return [];
        return [value];
    }

    function uniqueList(values) {
        return Array.from(new Set(normalizeArray(values).map((value) => normalizeString(value, '')).filter(Boolean))).sort();
    }

    function cloneJson(value, fallback = null) {
        if (value === undefined) return fallback;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallback;
        }
    }

    function normalizeSourceSchema(report = {}) {
        const raw = normalizeString(report.policySchema || report.sourceSchema || report.schema, '');
        return SOURCE_SCHEMA_ALIASES[raw] || raw;
    }

    function normalizeMatrixEntry(entry = {}) {
        return {
            id: normalizeString(entry.id, 'policy-parity-rule'),
            sourceSchema: normalizeSourceSchema(entry),
            policyFamily: normalizeString(entry.policyFamily, 'kernel'),
            compileTimeCodes: uniqueList(entry.compileTimeCodes),
            compileTimeStatuses: uniqueList(entry.compileTimeStatuses || ['blocked']),
            runtimeScope: normalizeString(entry.runtimeScope, 'runtime-output'),
            runtimeHooks: uniqueList(entry.runtimeHooks),
            runtimeSchemas: uniqueList(entry.runtimeSchemas),
            runtimeVerdicts: uniqueList(entry.runtimeVerdicts || ['blocked']),
            trustBoundary: normalizeString(entry.trustBoundary, null),
            panicTrigger: normalizeString(entry.panicTrigger, 'trust-verdict-blocked'),
            recoveryAction: normalizeString(entry.recoveryAction, 'quarantine-scope')
        };
    }

    function createKernelPolicyParityMatrix(input = {}) {
        const customEntries = normalizeArray(input.matrix || input.entries);
        const entries = customEntries.length > 0 ? customEntries : DEFAULT_KERNEL_POLICY_PARITY_MATRIX;
        return {
            schema: RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
            paritySchema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
            workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
            entryCount: entries.length,
            entries: entries.map(normalizeMatrixEntry)
        };
    }

    function createKernelPolicyParityContract(options = {}) {
        const matrix = createKernelPolicyParityMatrix(options);
        return {
            schema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
            matrixSchema: RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA,
            reportSchema: RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA,
            driftSchema: RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA,
            workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE,
            status: 'completed-compile-runtime-policy-parity',
            localGate: 'node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json',
            diagnosticsChannel: RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL,
            hostNeutral: true,
            sourcePolicySchemas: uniqueList(matrix.entries.map((entry) => entry.sourceSchema)),
            runtimeScopes: uniqueList(matrix.entries.map((entry) => entry.runtimeScope)),
            runtimeHooks: uniqueList(matrix.entries.flatMap((entry) => entry.runtimeHooks)),
            matrix
        };
    }

    function collectDiagnosticBlocks(report) {
        return normalizeArray(report.diagnostics).map((diagnostic, index) => {
            const sourceSchema = normalizeSourceSchema(report);
            const code = normalizeString(diagnostic && (diagnostic.code || diagnostic.diagnosticCode), '');
            const severity = normalizeString(diagnostic && (diagnostic.severity || diagnostic.level), 'info');
            if (!code || (severity !== 'error' && severity !== 'fatal')) return null;
            return {
                sourceSchema,
                reportSchema: normalizeString(report.schema, sourceSchema),
                code,
                severity,
                status: 'blocked',
                message: normalizeString(diagnostic.message, code),
                sourceRef: normalizeString(diagnostic.sourceRef || diagnostic.path || diagnostic.operationId || diagnostic.surfaceId || diagnostic.eventId, sourceSchema + ':' + index),
                metadata: cloneJson(diagnostic.metadata || {}, {})
            };
        }).filter(Boolean);
    }

    function collectStatusBlocks(report) {
        const sourceSchema = normalizeSourceSchema(report);
        const blocks = [];
        const candidates = [].concat(normalizeArray(report.postures), normalizeArray(report.surfaces), normalizeArray(report.streams), normalizeArray(report.events));
        candidates.forEach((record, index) => {
            if (!record || typeof record !== 'object') return;
            const status = normalizeString(record.status || record.state, '');
            if (status !== 'blocked') return;
            const nestedBlocks = collectDiagnosticBlocks({ ...record, schema: report.schema, policySchema: report.policySchema || sourceSchema, diagnostics: record.diagnostics || [] });
            if (nestedBlocks.length > 0) {
                blocks.push(...nestedBlocks);
                return;
            }
            blocks.push({
                sourceSchema,
                reportSchema: normalizeString(report.schema, sourceSchema),
                code: sourceSchema + '.blocked',
                severity: 'error',
                status: 'blocked',
                message: 'Blocked record in ' + sourceSchema,
                sourceRef: normalizeString(record.id || record.operationId || record.enterpriseSurfaceId || record.eventId, sourceSchema + ':blocked:' + index),
                metadata: {}
            });
        });
        return blocks;
    }

    function collectCompileTimeBlocks(input = {}) {
        const reports = []
            .concat(normalizeArray(input.reports), normalizeArray(input.contracts), normalizeArray(input.securityContract), normalizeArray(input.remoteSecurityReport), normalizeArray(input.degradationReport), normalizeArray(input.streamingContract), normalizeArray(input.eventGovernanceReport));
        const blocks = [];
        reports.forEach((report) => {
            if (!report || typeof report !== 'object') return;
            blocks.push(...collectDiagnosticBlocks(report), ...collectStatusBlocks(report));
        });
        const seen = new Set();
        return blocks.filter((block) => {
            const key = block.sourceSchema + ':' + block.code + ':' + block.sourceRef;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function createRuntimeCapabilitySnapshot(input = {}, options = {}) {
        const runtime = input.runtime || options.runtime || {};
        const explicitHooks = normalizeArray(input.runtimeHooks || options.runtimeHooks);
        const discoveredHooks = [];
        if (runtime && typeof runtime === 'object') {
            KERNEL_POLICY_PARITY_RUNTIME_HOOKS.forEach((hook) => {
                if (typeof runtime[hook] === 'function') discoveredHooks.push(hook);
            });
            const commandBus = typeof runtime.getCommandBus === 'function' ? runtime.getCommandBus() : null;
            if (commandBus && typeof commandBus === 'object') {
                if (typeof commandBus.dispatch === 'function') discoveredHooks.push('dispatchCommand');
                if (typeof commandBus.recordEscalation === 'function') discoveredHooks.push('recordEscalation');
                if (typeof commandBus.listEscalations === 'function') discoveredHooks.push('listEscalations');
            }
            const diagnosticsHub = typeof runtime.getDiagnosticsHub === 'function' ? runtime.getDiagnosticsHub() : null;
            if (diagnosticsHub && typeof diagnosticsHub === 'object') {
                if (typeof diagnosticsHub.recordEscalation === 'function') discoveredHooks.push('recordEscalation');
                if (typeof diagnosticsHub.listEscalations === 'function') discoveredHooks.push('listEscalations');
            }
        }
        const hooks = uniqueList(explicitHooks.length > 0 ? explicitHooks.concat(discoveredHooks) : discoveredHooks);
        return {
            hooks,
            missingDefaultHooks: KERNEL_POLICY_PARITY_RUNTIME_HOOKS.filter((hook) => !hooks.includes(hook))
        };
    }

    function findMatrixEntriesForBlock(block, matrixEntries) {
        return matrixEntries.filter((entry) => entry.sourceSchema === block.sourceSchema && entry.compileTimeStatuses.includes(block.status) && (entry.compileTimeCodes.includes(block.code) || block.code === entry.sourceSchema + '.blocked'));
    }

    function createKernelPolicyParityRuntimeReport(input = {}, options = {}) {
        const matrix = createKernelPolicyParityMatrix(options.matrix ? { matrix: options.matrix } : input);
        const runtimeCapabilities = createRuntimeCapabilitySnapshot(input, options);
        const compileTimeBlocks = collectCompileTimeBlocks(input);
        const appliedPolicies = [];
        const drift = [];
        compileTimeBlocks.forEach((block) => {
            const entries = findMatrixEntriesForBlock(block, matrix.entries);
            if (entries.length === 0) {
                drift.push({ schema: RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA, type: 'missing-runtime-mapping', sourceSchema: block.sourceSchema, blockCode: block.code, sourceRef: block.sourceRef, message: 'No runtime parity mapping for ' + block.code + '.' });
                return;
            }
            entries.forEach((entry) => {
                const missingRuntimeHooks = entry.runtimeHooks.filter((hook) => !runtimeCapabilities.hooks.includes(hook));
                const verdict = missingRuntimeHooks.length > 0 ? 'drift' : (entry.runtimeVerdicts.includes('blocked') ? 'blocked' : entry.runtimeVerdicts[0]);
                const applied = { blockCode: block.code, sourceSchema: block.sourceSchema, matrixEntryId: entry.id, policyFamily: entry.policyFamily, runtimeScope: entry.runtimeScope, runtimeHooks: entry.runtimeHooks.slice(), missingRuntimeHooks, runtimeSchemas: entry.runtimeSchemas.slice(), runtimeVerdicts: entry.runtimeVerdicts.slice(), appliedPolicy: entry.id, verdict, panicTrigger: entry.panicTrigger, recoveryAction: entry.recoveryAction, trustBoundary: entry.trustBoundary || null };
                appliedPolicies.push(applied);
                if (missingRuntimeHooks.length > 0) {
                    drift.push({ schema: RMT_KERNEL_POLICY_PARITY_DRIFT_SCHEMA, type: 'missing-runtime-hook', sourceSchema: block.sourceSchema, blockCode: block.code, matrixEntryId: entry.id, sourceRef: block.sourceRef, missingRuntimeHooks: missingRuntimeHooks.slice(), message: 'Runtime hook missing for ' + entry.id + ': ' + missingRuntimeHooks.join(', ') + '.' });
                }
            });
        });
        const status = drift.length > 0 ? 'drift' : 'ready';
        return { schema: RMT_KERNEL_POLICY_PARITY_REPORT_SCHEMA, paritySchema: RMT_KERNEL_POLICY_PARITY_SCHEMA, matrixSchema: RMT_KERNEL_POLICY_PARITY_MATRIX_SCHEMA, workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE, status, ok: status === 'ready', compileTimeBlockCount: compileTimeBlocks.length, appliedPolicyCount: appliedPolicies.length, driftCount: drift.length, sourcePolicySchemas: uniqueList(matrix.entries.map((entry) => entry.sourceSchema)), runtimeScopes: uniqueList(matrix.entries.map((entry) => entry.runtimeScope)), runtimeCapabilities, compileTimeBlocks, appliedPolicies, drift };
    }

    appModules.createRmtKernelPolicyParity = function createRmtKernelPolicyParity(options = {}) {
        const diagnosticsHub = options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function' ? options.diagnosticsHub : null;
        const reports = [];
        function publishReport(report) {
            if (!diagnosticsHub) return;
            try {
                diagnosticsHub.publish(RMT_KERNEL_POLICY_PARITY_DIAGNOSTIC_CHANNEL, report, { source: RMT_KERNEL_POLICY_PARITY_SCHEMA, workpackage: RMT_KERNEL_POLICY_PARITY_WORKPACKAGE, status: report.status, driftCount: report.driftCount });
            } catch (_error) {}
        }
        function createRuntimeReport(input = {}) {
            const report = createRuntimeReportFactory(input, options);
            reports.push(report);
            publishReport(report);
            return cloneJson(report, {});
        }
        function createRuntimeReportFactory(input = {}, runtimeOptions = {}) {
            return createKernelPolicyParityRuntimeReport(input, runtimeOptions);
        }
        return Object.freeze({
            schema: RMT_KERNEL_POLICY_PARITY_SCHEMA,
            contract: createKernelPolicyParityContract(options),
            getMatrix: () => cloneJson(createKernelPolicyParityMatrix(options), {}),
            createRuntimeReport,
            checkDrift: (input = {}) => createRuntimeReport(input).drift,
            listReports: () => reports.map((report) => cloneJson(report, {}))
        });
    };
})(__XTENDRMT_GLOBAL__);
