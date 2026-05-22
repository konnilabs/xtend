#!/usr/bin/env node

const path = require('path');
const {
  printCoreContractReport,
  runCoreContractSuite
} = require('../tests/core/core_contract_suite');
const {
  printArchitectureGateReport,
  runArchitectureGateSuite
} = require('../tests/core/architecture_gate_suite');
const {
  printBrowserSmokeReport,
  runBrowserSmokeSuite
} = require('../tests/browser/browser_smoke_suite');
const {
  printReferencePathReport,
  runReferencePathSuite
} = require('../tests/references/reference_path_suite');
const {
  printRmtCompatibilityReport,
  runRmtCompatibilitySuite
} = require('../tests/rmt/rmt_compatibility_suite');
const {
  printRmtFirstClassAppAuthoringReport,
  runRmtFirstClassAppAuthoringSuite
} = require('../tests/rmt/rmt_first_class_app_authoring_suite');
const {
  printRmtSurfaceManagerAuthoringReport,
  runRmtSurfaceManagerAuthoringSuite
} = require('../tests/rmt/rmt_surface_manager_authoring_suite');
const {
  printRmtAppPlatformAuthoringReport,
  runRmtAppPlatformAuthoringSuite
} = require('../tests/rmt/rmt_app_platform_authoring_suite');
const {
  printRmtDomDescriptorRendererReport,
  runRmtDomDescriptorRendererSuite
} = require('../tests/rmt/rmt_dom_descriptor_renderer_suite');
const {
  printRmtComponentTemplatePrimitivesReport,
  runRmtComponentTemplatePrimitivesSuite
} = require('../tests/rmt/rmt_component_template_primitives_suite');
const {
  printRmtStateSelectorRuntimeReport,
  runRmtStateSelectorRuntimeSuite
} = require('../tests/rmt/rmt_state_selector_runtime_suite');
const {
  printRmtActionEffectRuntimeReport,
  runRmtActionEffectRuntimeSuite
} = require('../tests/rmt/rmt_action_effect_runtime_suite');
const {
  printRmtEventRoutingRuntimeReport,
  runRmtEventRoutingRuntimeSuite
} = require('../tests/rmt/rmt_event_routing_runtime_suite');
const {
  printRmtSurfaceResourceGraphRuntimeReport,
  runRmtSurfaceResourceGraphRuntimeSuite
} = require('../tests/rmt/rmt_surface_resource_graph_runtime_suite');
const {
  printRmtAppPlatformToolingReport,
  runRmtAppPlatformToolingSuite
} = require('../tests/rmt-language/rmt_app_platform_tooling_suite');
const {
  printRmtAppPlatformFixtureReport,
  runRmtAppPlatformFixtureSuite
} = require('../tests/rmt/rmt_app_platform_fixture_suite');
const {
  printRmtNativeShellMigrationReport,
  runRmtNativeShellMigrationSuite
} = require('../tests/rmt/rmt_native_shell_migration_suite');
const {
  printSurfaceControllerReport,
  runSurfaceControllerSuite
} = require('../tests/components/surface_controller_suite');
const {
  printSurfaceManagerRuntimeReport,
  runSurfaceManagerRuntimeSuite
} = require('../tests/components/surface_manager_runtime_suite');
const {
  printSurfaceManagerSidePanelReport,
  runSurfaceManagerSidePanelSuite
} = require('../tests/components/surface_manager_side_panel_suite');
const {
  printSurfaceManagerWorkbenchFixtureReport,
  runSurfaceManagerWorkbenchFixtureSuite
} = require('../tests/rmt/surface_manager_workbench_fixture_suite');
const {
  printSurfaceManagerOverlayBridgeReport,
  runSurfaceManagerOverlayBridgeSuite
} = require('../tests/components/surface_manager_overlay_bridge_suite');
const {
  printSurfaceManagerQualityGatesReport,
  runSurfaceManagerQualityGatesSuite
} = require('../tests/components/surface_manager_quality_gates_suite');
const {
  printSurfaceManagerPersistenceReport,
  runSurfaceManagerPersistenceSuite
} = require('../tests/components/surface_manager_persistence_suite');
const {
  printSurfaceManagerLazyHydrationReport,
  runSurfaceManagerLazyHydrationSuite
} = require('../tests/components/surface_manager_lazy_hydration_suite');
const {
  printSurfaceManagerRouteLifecycleReport,
  runSurfaceManagerRouteLifecycleSuite
} = require('../tests/components/surface_manager_route_lifecycle_suite');
const {
  printSurfaceManagerStackPolicyReport,
  runSurfaceManagerStackPolicySuite
} = require('../tests/components/surface_manager_stack_policy_suite');
const {
  printSurfaceManagerLayoutEnginesReport,
  runSurfaceManagerLayoutEnginesSuite
} = require('../tests/components/surface_manager_layout_engines_suite');
const {
  printSurfaceManagerRemotePolicyReport,
  runSurfaceManagerRemotePolicySuite
} = require('../tests/components/surface_manager_remote_policy_suite');
const {
  printSurfaceManagerBrowserLabReport,
  runSurfaceManagerBrowserLabSuite
} = require('../tests/browser/surface_manager_browser_lab_suite');
const {
  printEpic18VendorBugfixSmokeReport,
  runEpic18VendorBugfixSmokeSuite
} = require('../tests/components/epic18_vendor_bugfix_smoke_suite');
const {
  printEpic18RmtAppPlatformReleaseHandoffReport,
  runEpic18RmtAppPlatformReleaseHandoffSuite
} = require('../tests/platform/epic18_rmt_app_platform_release_handoff_suite');
const {
  printSurfaceManagerNativeRmtSurfacesReport,
  runSurfaceManagerNativeRmtSurfacesSuite
} = require('../tests/rmt/surface_manager_native_rmt_surfaces_suite');
const {
  printSurfaceManagerReleaseHandoffReport,
  runSurfaceManagerReleaseHandoffSuite
} = require('../tests/rmt/surface_manager_release_handoff_suite');
const {
  printSurfaceManagerRuntimeReleaseHandoffReport,
  runSurfaceManagerRuntimeReleaseHandoffSuite
} = require('../tests/rmt/surface_manager_runtime_release_handoff_suite');
const {
  printSurfaceManagerAdapterRuntimeReport,
  runSurfaceManagerAdapterRuntimeSuite
} = require('../tests/rmt/surface_manager_adapter_runtime_suite');
const {
  printSurfaceManagerMaterializationReport,
  runSurfaceManagerMaterializationSuite
} = require('../tests/rmt/surface_manager_materialization_suite');
const {
  printRmtShellAuthoringComponentUxReport,
  runRmtShellAuthoringComponentUxSuite
} = require('../tests/rmt/rmt_shell_authoring_component_ux_suite');
const {
  printRmtDslAuthoringPolishReport,
  runRmtDslAuthoringPolishSuite
} = require('../tests/rmt/rmt_dsl_authoring_polish_suite');
const {
  printRmtComponentFabricLaneIngestionReport,
  runRmtComponentFabricLaneIngestionSuite
} = require('../tests/rmt/rmt_component_fabric_lane_ingestion_suite');
const {
  printRmtComponentLifecycleTelemetryReport,
  runRmtComponentLifecycleTelemetrySuite
} = require('../tests/rmt/rmt_component_lifecycle_telemetry_suite');
const {
  printRmtFirstDemoAppReport,
  runRmtFirstDemoAppSuite
} = require('../tests/rmt/rmt_first_demo_app_suite');
const {
  printRmtLifecycleDemoReport,
  runRmtLifecycleDemoSuite
} = require('../tests/rmt/rmt_lifecycle_demo_suite');
const {
  printDocsRmtPilotReport,
  runDocsRmtPilotSuite
} = require('../tests/rmt/docs_rmt_pilot_suite');
const {
  printRmtSourceModelReport,
  runRmtSourceModelSuite
} = require('../tests/rmt-language/rmt_source_model_suite');
const {
  printRmtParserReport,
  runRmtParserSuite
} = require('../tests/rmt-language/rmt_parser_suite');
const {
  printRmtVNextParserReport,
  runRmtVNextParserSuite
} = require('../tests/rmt-language/rmt_vnext_parser_suite');
const {
  printRmtVNextCompilerReport,
  runRmtVNextCompilerSuite
} = require('../tests/rmt-language/rmt_vnext_compiler_suite');
const {
  printRmtVNextSourceToSeaReport,
  runRmtVNextSourceToSeaSuite
} = require('../tests/rmt-language/rmt_vnext_source_to_sea_suite');
const {
  printRmtVNextComponentPrimitivesReport,
  runRmtVNextComponentPrimitivesSuite
} = require('../tests/rmt-language/rmt_vnext_component_primitives_suite');
const {
  printRmtVNextFabricBridgeReport,
  runRmtVNextFabricBridgeSuite
} = require('../tests/rmt-language/rmt_vnext_fabric_bridge_suite');
const {
  printRmtVNextLifecycleReport,
  runRmtVNextLifecycleSuite
} = require('../tests/rmt-language/rmt_vnext_lifecycle_suite');
const {
  printRmtVNextSchedulerReport,
  runRmtVNextSchedulerSuite
} = require('../tests/rmt-language/rmt_vnext_scheduler_suite');
const {
  printRmtVNextSurfaceRegistryReport,
  runRmtVNextSurfaceRegistrySuite
} = require('../tests/rmt-language/rmt_vnext_surface_registry_suite');
const {
  printRmtVNextConditionsReport,
  runRmtVNextConditionsSuite
} = require('../tests/rmt-language/rmt_vnext_conditions_suite');
const {
  printRmtVNextCompositionReport,
  runRmtVNextCompositionSuite
} = require('../tests/rmt-language/rmt_vnext_composition_suite');
const {
  printRmtVNextImportResolverReport,
  runRmtVNextImportResolverSuite
} = require('../tests/rmt-language/rmt_vnext_import_resolver_suite');
const {
  printRmtVNextEventsReport,
  runRmtVNextEventsSuite
} = require('../tests/rmt-language/rmt_vnext_events_suite');
const {
  printRmtVNextSecurityReport,
  runRmtVNextSecuritySuite
} = require('../tests/rmt-language/rmt_vnext_security_suite');
const {
  printRmtKernelTrustAuthorityReport,
  runRmtKernelTrustAuthoritySuite
} = require('../tests/rmt-language/rmt_kernel_trust_authority_suite');
const {
  printRmtKernelTrustedDomRuntimeReport,
  runRmtKernelTrustedDomRuntimeSuite
} = require('../tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite');
const {
  printRmtKernelBindingSecurityReport,
  runRmtKernelBindingSecuritySuite
} = require('../tests/rmt-language/rmt_kernel_binding_security_suite');
const {
  printRmtKernelPanicMonitorReport,
  runRmtKernelPanicMonitorSuite
} = require('../tests/rmt-language/rmt_kernel_panic_monitor_suite');
const {
  printRmtKernelRecoveryReport,
  runRmtKernelRecoverySuite
} = require('../tests/rmt-language/rmt_kernel_recovery_suite');
const {
  printRmtKernelEscalationReport,
  runRmtKernelEscalationSuite
} = require('../tests/rmt-language/rmt_kernel_escalation_suite');
const {
  printRmtKernelSchedulerFailureReport,
  runRmtKernelSchedulerFailureSuite
} = require('../tests/rmt-language/rmt_kernel_scheduler_failure_suite');
const {
  printRmtKernelPolicyParityReport,
  runRmtKernelPolicyParitySuite
} = require('../tests/rmt-language/rmt_kernel_policy_parity_suite');
const {
  printRmtKernelSecurityRegressionReport,
  runRmtKernelSecurityRegressionSuite
} = require('../tests/rmt-language/rmt_kernel_security_regression_suite');
const {
  printRmtKernelHandoffDocsReport,
  runRmtKernelHandoffDocsSuite
} = require('../tests/rmt-language/rmt_kernel_handoff_docs_suite');
const {
  printRmtVNextStreamingReport,
  runRmtVNextStreamingSuite
} = require('../tests/rmt-language/rmt_vnext_streaming_suite');
const {
  printRmtVNextToolingReport,
  runRmtVNextToolingSuite
} = require('../tests/rmt-language/rmt_vnext_tooling_suite');
const {
  printRmtVNextCompatibilityReport,
  runRmtVNextCompatibilitySuite
} = require('../tests/rmt-language/rmt_vnext_compatibility_suite');
const {
  printRmtVNextRegressionReport,
  runRmtVNextRegressionSuite
} = require('../tests/rmt-language/rmt_vnext_regression_suite');
const {
  printRmtVNextReleaseHandoffReport,
  runRmtVNextReleaseHandoffSuite
} = require('../tests/rmt-language/rmt_vnext_release_handoff_suite');
const {
  printRmtVNextRemoteManifestReport,
  runRmtVNextRemoteManifestSuite
} = require('../tests/rmt-language/rmt_vnext_remote_manifest_suite');
const {
  printRmtVNextEnterpriseRegistryReport,
  runRmtVNextEnterpriseRegistrySuite
} = require('../tests/rmt-language/rmt_vnext_enterprise_registry_suite');
const {
  printRmtVNextDegradationReport,
  runRmtVNextDegradationSuite
} = require('../tests/rmt-language/rmt_vnext_degradation_suite');
const {
  printRmtVNextRemoteSecurityReport,
  runRmtVNextRemoteSecuritySuite
} = require('../tests/rmt-language/rmt_vnext_remote_security_suite');
const {
  printRmtVNextCrossSurfaceEventsReport,
  runRmtVNextCrossSurfaceEventsSuite
} = require('../tests/rmt-language/rmt_vnext_cross_surface_events_suite');
const {
  printRmtVNextEventGovernanceReport,
  runRmtVNextEventGovernanceSuite
} = require('../tests/rmt-language/rmt_vnext_event_governance_suite');
const {
  printRmtVNextRemoteCompilerReport,
  runRmtVNextRemoteCompilerSuite
} = require('../tests/rmt-language/rmt_vnext_remote_compiler_suite');
const {
  printRmtVNextRemoteToolingReport,
  runRmtVNextRemoteToolingSuite
} = require('../tests/rmt-language/rmt_vnext_remote_tooling_suite');
const {
  printRmtVNextRemoteCompatibilityReport,
  runRmtVNextRemoteCompatibilitySuite
} = require('../tests/rmt-language/rmt_vnext_remote_compatibility_suite');
const {
  printRmtVNextEnterpriseFixturesReport,
  runRmtVNextEnterpriseFixturesSuite
} = require('../tests/rmt-language/rmt_vnext_enterprise_fixtures_suite');
const {
  printRmtVNextEnterpriseReleaseReport,
  runRmtVNextEnterpriseReleaseSuite
} = require('../tests/rmt-language/rmt_vnext_enterprise_release_suite');
const {
  printRmtSemanticGraphReport,
  runRmtSemanticGraphSuite
} = require('../tests/rmt-language/rmt_semantic_graph_suite');
const {
  printRmtLinterRulesReport,
  runRmtLinterRulesSuite
} = require('../tests/rmt-language/rmt_linter_rules_suite');
const {
  printRmtLinterCliReport,
  runRmtLinterCliSuite
} = require('../tests/rmt-language/rmt_linter_cli_suite');
const {
  printRmtCompletionReport,
  runRmtCompletionSuite
} = require('../tests/rmt-language/rmt_completion_suite');
const {
  printRmtNavigationReport,
  runRmtNavigationSuite
} = require('../tests/rmt-language/rmt_navigation_suite');
const {
  printRmtLanguageServerReport,
  runRmtLanguageServerSuite
} = require('../tests/rmt-language/rmt_language_server_suite');
const {
  printRmtCodeActionsReport,
  runRmtCodeActionsSuite
} = require('../tests/rmt-language/rmt_code_actions_suite');
const {
  printRmtAgentRepairReport,
  runRmtAgentRepairReportSuite
} = require('../tests/rmt-language/rmt_agent_repair_report_suite');
const {
  printRmtEditorPackagingReport,
  runRmtEditorPackagingSuite
} = require('../tests/rmt-language/rmt_editor_packaging_suite');
const {
  printRmtLanguageRegressionReport,
  runRmtLanguageRegressionSuite
} = require('../tests/rmt-language/rmt_language_regression_suite');
const {
  printComponentSuitesReport,
  runComponentSuites
} = require('../tests/components/component_suite');
const {
  printComponentContractV2Report,
  runComponentContractV2Suite
} = require('../tests/components/component_contract_v2_suite');
const {
  printComponentShellContractReport,
  runComponentShellContractSuite
} = require('../tests/components/component_shell_contract_suite');
const {
  printComponentStylingContractReport,
  runComponentStylingContractSuite
} = require('../tests/components/component_styling_contract_suite');
const {
  printEnterpriseComponentFlexHardeningContractReport,
  runEnterpriseComponentFlexHardeningContractSuite
} = require('../tests/components/enterprise_component_flex_hardening_contract_suite');
const {
  printEnterpriseComponentStyleAuditReport,
  runEnterpriseComponentStyleAuditSuite
} = require('../tests/components/enterprise_component_style_audit_suite');
const {
  printEnterpriseIconControlAuditReport,
  runEnterpriseIconControlAuditSuite
} = require('../tests/components/enterprise_icon_control_audit_suite');
const {
  printXHeaderMenuModesReport,
  runXHeaderMenuModesSuite
} = require('../tests/components/xheader_menu_modes_suite');
const {
  printEnterpriseOverlayModeTokenParityReport,
  runEnterpriseOverlayModeTokenParitySuite
} = require('../tests/components/enterprise_overlay_mode_token_parity_suite');
const {
  printEnterpriseLayoutDisplayMediaTokenizationReport,
  runEnterpriseLayoutDisplayMediaTokenizationSuite
} = require('../tests/components/enterprise_layout_display_media_tokenization_suite');
const {
  printEnterpriseFormControlThemeA11yReport,
  runEnterpriseFormControlThemeA11ySuite
} = require('../tests/components/enterprise_form_control_theme_a11y_suite');
const {
  printEnterpriseNavigationRoutingStateHardeningReport,
  runEnterpriseNavigationRoutingStateHardeningSuite
} = require('../tests/components/enterprise_navigation_routing_state_hardening_suite');
const {
  printBuilderTypeScriptBlueprintReport,
  runBuilderTypeScriptBlueprintSuite
} = require('../tests/builder/typescript_component_blueprint_suite');
const {
  printScaffoldWritePlanReport,
  runScaffoldWritePlanSuite
} = require('../tests/builder/scaffold_write_plan_suite');
const {
  printScaffoldComponentWriteReport,
  runScaffoldComponentWriteSuite
} = require('../tests/builder/scaffold_component_write_suite');
const {
  printScaffoldManifestPatchReport,
  runScaffoldManifestPatchSuite
} = require('../tests/builder/scaffold_manifest_patch_suite');
const {
  printScaffoldRmtBuildReport,
  runScaffoldRmtBuildSuite
} = require('../tests/builder/scaffold_rmt_build_suite');
const {
  printEpic10P0ComponentWaveReport,
  runEpic10P0ComponentWaveSuite
} = require('../tests/components/epic10_p0_component_wave_suite');
const {
  printExistingComponentMetadataMigrationReport,
  runExistingComponentMetadataMigrationSuite
} = require('../tests/components/existing_component_metadata_migration_suite');
const {
  printEpic10PlatformGatesReport,
  runEpic10PlatformGatesSuite
} = require('../tests/platform/epic10_platform_gates_suite');
const {
  printEpic10ReleaseHandoffReport,
  runEpic10ReleaseHandoffSuite
} = require('../tests/platform/epic10_release_handoff_suite');
const {
  printComponentLabRmtInspectorReport,
  runComponentLabRmtInspectorSuite
} = require('../tests/builder/component_lab_rmt_inspector_suite');
const {
  printComponentLabUxInspectorReport,
  runComponentLabUxInspectorSuite
} = require('../tests/builder/component_lab_ux_inspector_suite');
const {
  printComponentUxBrowserSmokeReport,
  runComponentUxBrowserSmokeSuite
} = require('../tests/browser/component_ux_browser_smoke_suite');
const {
  printComponentShellThemeMatrixReport,
  runComponentShellThemeMatrixSuite
} = require('../tests/browser/component_shell_theme_matrix_suite');
const {
  printSignatureUiVisualQualityReport,
  runSignatureUiVisualQualitySuite
} = require('../tests/browser/signature_ui_visual_quality_suite');
const {
  printEnterpriseVisualDomSnapshotMatrixReport,
  runEnterpriseVisualDomSnapshotMatrixSuite
} = require('../tests/browser/enterprise_visual_dom_snapshot_matrix_suite');
const {
  printVisualSnapshotAutomationReport,
  runVisualSnapshotAutomationSuite
} = require('../tests/browser/visual_snapshot_automation_suite');
const {
  printVisualSnapshotsReport,
  runVisualSnapshotsSuite
} = require('../tests/browser/visual_snapshots_suite');
const {
  printDesignTokenContractReport,
  runDesignTokenContractSuite
} = require('../tests/tokens/design_token_contract_suite');
const {
  printXThemeTokenAliasLayerReport,
  runXThemeTokenAliasLayerSuite
} = require('../tests/tokens/xtheme_token_alias_layer_suite');
const {
  printComponentUxAuthoringDocsReport,
  runComponentUxAuthoringDocsSuite
} = require('../tests/docs/component_ux_authoring_docs_suite');
const {
  printAccessibilityHydrationReport,
  runAccessibilityHydrationSuite
} = require('../tests/components/accessibility_hydration_suite');
const {
  printScreenreaderSignalReport,
  runScreenreaderSignalSuite
} = require('../tests/a11y/screenreader_signal_suite');
const {
  printMotionContrastReport,
  runMotionContrastSuite
} = require('../tests/a11y/motion_contrast_suite');
const {
  printRuntimeA11yContractReport,
  runRuntimeA11yContractSuite
} = require('../tests/a11y/runtime_a11y_contract_suite');
const {
  printComponentUxPerformanceContractReport,
  runComponentUxPerformanceContractSuite
} = require('../tests/performance/component_ux_performance_contract_suite');
const {
  printComponentNetworkContractReport,
  runComponentNetworkContractSuite
} = require('../tests/components/component_network_contract_suite');
const {
  printFormControlsUxReport,
  runFormControlsUxSuite
} = require('../tests/components/form_controls_ux_suite');
const {
  printFeedbackStatusUxReport,
  runFeedbackStatusUxSuite
} = require('../tests/components/feedback_status_ux_suite');
const {
  printNavigationRoutingUxReport,
  runNavigationRoutingUxSuite
} = require('../tests/components/navigation_routing_ux_suite');
const {
  printOverlayInteractionUxReport,
  runOverlayInteractionUxSuite
} = require('../tests/components/overlay_interaction_ux_suite');
const {
  printLayoutDisplayMediaUxReport,
  runLayoutDisplayMediaUxSuite
} = require('../tests/components/layout_display_media_ux_suite');
const {
  printComponentCatalogCoverageReport,
  runComponentCatalogCoverageSuite
} = require('../tests/catalog/component_catalog_coverage_suite');
const {
  printComponentRegressionPriorityReport,
  runComponentRegressionPrioritySuite
} = require('../tests/catalog/component_regression_priority_suite');
const {
  printComponentLongTailMigrationReport,
  runComponentLongTailMigrationSuite
} = require('../tests/catalog/component_long_tail_migration_suite');
const {
  printEpic11EnterpriseUxHandoffReport,
  runEpic11EnterpriseUxHandoffSuite
} = require('../tests/platform/epic11_enterprise_ux_handoff_suite');
const {
  printEpic12Rc0GateMatrixReport,
  runEpic12Rc0GateMatrixSuite
} = require('../tests/platform/epic12_rc0_gate_matrix_suite');
const {
  printEpic12DocsAdoptionReport,
  runEpic12DocsAdoptionSuite
} = require('../tests/docs/epic12_docs_adoption_suite');
const {
  printEnterpriseThirdPartyAuthoringGuideReport,
  runEnterpriseThirdPartyAuthoringGuideSuite
} = require('../tests/docs/enterprise_third_party_authoring_guide_suite');
const {
  printEnterpriseComponentFlexReleaseHandoffReport,
  runEnterpriseComponentFlexReleaseHandoffSuite
} = require('../tests/platform/enterprise_component_flex_release_handoff_suite');
const {
  printRmtToolingDocsReport,
  runRmtToolingDocsSuite
} = require('../tests/docs/rmt_tooling_docs_suite');
const {
  printEpic14RmtToolingReleaseGatesReport,
  runEpic14RmtToolingReleaseGatesSuite
} = require('../tests/platform/epic14_rmt_tooling_release_gates_suite');
const {
  printEpic14LspHandoffReport,
  runEpic14LspHandoffSuite
} = require('../tests/platform/epic14_lsp_handoff_suite');
const {
  printEpic12Rc0HandoffReport,
  runEpic12Rc0HandoffSuite
} = require('../tests/platform/epic12_rc0_handoff_suite');
const {
  printEpic13Rc1ReadinessReport,
  runEpic13Rc1ReadinessSuite
} = require('../tests/platform/epic13_rc1_readiness_suite');
const {
  printEpic13ReleaseOwnerAcceptanceReport,
  runEpic13ReleaseOwnerAcceptanceSuite
} = require('../tests/platform/epic13_release_owner_acceptance_suite');
const {
  printEpic13ConditionalNetworkEvidenceReport,
  runEpic13ConditionalNetworkEvidenceSuite
} = require('../tests/platform/epic13_conditional_network_evidence_suite');
const {
  printEpic13ConditionalNetworkEvidenceCiReport,
  runEpic13ConditionalNetworkEvidenceCiSuite
} = require('../tests/platform/epic13_conditional_network_evidence_ci_suite');
const {
  printEpic13PackageExportLockReport,
  runEpic13PackageExportLockSuite
} = require('../tests/platform/epic13_package_export_lock_suite');
const {
  printTypeExportsReport,
  runTypeExportsSuite
} = require('../tests/types/type_exports_suite');
const {
  printTypeExportsLoaderReport,
  runTypeExportsLoaderSuite
} = require('../tests/types/loader_type_exports_suite');
const {
  printTypeExportsApiReport,
  runTypeExportsApiSuite
} = require('../tests/types/api_type_exports_suite');
const {
  printTypeExportsRmtReport,
  runTypeExportsRmtSuite
} = require('../tests/types/rmt_type_exports_suite');
const {
  printTypeExportsPolicyReport,
  runTypeExportsPolicySuite
} = require('../tests/types/policy_type_exports_suite');
const {
  printTypeExportsBuilderReport,
  runTypeExportsBuilderSuite
} = require('../tests/types/builder_type_exports_suite');
const {
  printTypeExportsCatalogReport,
  runTypeExportsCatalogSuite
} = require('../tests/types/catalog_type_exports_suite');
const {
  printTypeExportsVendorReport,
  runTypeExportsVendorSuite
} = require('../tests/types/vendor_type_exports_suite');
const {
  printEpic13KnownResidualTriageReport,
  runEpic13KnownResidualTriageSuite
} = require('../tests/platform/epic13_known_residual_triage_suite');
const {
  printEpic13HydrationPerformanceClosureReport,
  runEpic13HydrationPerformanceClosureSuite
} = require('../tests/platform/epic13_hydration_performance_closure_suite');
const {
  printEpic13ProdBrowserCspSmokeReport,
  runEpic13ProdBrowserCspSmokeSuite
} = require('../tests/platform/epic13_prod_browser_csp_smoke_suite');
const {
  printEpic13VisualOwnerArtifactReport,
  runEpic13VisualOwnerArtifactSuite
} = require('../tests/platform/epic13_visual_owner_artifact_suite');
const {
  printEpic13RmtProductionReadinessReport,
  runEpic13RmtProductionReadinessSuite
} = require('../tests/platform/epic13_rmt_production_readiness_suite');
const {
  printEpic13DocsRmtProductionHardeningReport,
  runEpic13DocsRmtProductionHardeningSuite
} = require('../tests/platform/epic13_docs_rmt_production_hardening_suite');
const {
  printEpic13TrustedDomBoundaryReport,
  runEpic13TrustedDomBoundarySuite
} = require('../tests/platform/epic13_trusted_dom_boundary_suite');
const {
  printEpic13Rc1MigrationNotesReport,
  runEpic13Rc1MigrationNotesSuite
} = require('../tests/platform/epic13_rc1_migration_notes_suite');
const {
  printEpic13Rc1GateMatrixCiHandoffReport,
  runEpic13Rc1GateMatrixCiHandoffSuite
} = require('../tests/platform/epic13_rc1_gate_matrix_ci_handoff_suite');
const {
  printEpic13ReleaseReportPackDryRunEvidenceReport,
  runEpic13ReleaseReportPackDryRunEvidenceSuite
} = require('../tests/platform/epic13_release_report_pack_dry_run_evidence_suite');
const {
  printFabricRuntimeReport,
  runFabricRuntimeSuite
} = require('../tests/fabric/fabric_runtime_suite');
const {
  printFabricLifecycleBoundaryReport,
  runFabricLifecycleBoundarySuite
} = require('../tests/fabric/fabric_lifecycle_boundary_suite');
const {
  printFabricReporterAdapterReport,
  runFabricReporterAdapterSuite
} = require('../tests/fabric/fabric_reporter_adapter_suite');
const {
  printFabricRuntimeDiagnosticsBridgeReport,
  runFabricRuntimeDiagnosticsBridgeSuite
} = require('../tests/fabric/fabric_runtime_diagnostics_bridge_suite');
const {
  printFabricComponentFiberReport,
  runFabricComponentFiberSuite
} = require('../tests/fabric/fabric_component_fiber_suite');
const {
  printFabricRouteFiberReport,
  runFabricRouteFiberSuite
} = require('../tests/fabric/fabric_route_fiber_suite');
const {
  printFabricTelemetrySnapshotReport,
  runFabricTelemetrySnapshotSuite
} = require('../tests/fabric/fabric_telemetry_snapshot_suite');
const {
  printFabricPerformanceMeasurementReport,
  runFabricPerformanceMeasurementSuite
} = require('../tests/fabric/fabric_performance_measurement_suite');
const {
  printPerformanceRegressionReport,
  runPerformanceRegressionSuite
} = require('../tests/performance/performance_regression_suite');
const {
  printHydrationPolicyReport,
  runHydrationPolicySuite
} = require('../tests/performance/hydration_policy_suite');
const {
  printFabricRmtLaneMappingReport,
  runFabricRmtLaneMappingSuite
} = require('../tests/fabric/fabric_rmt_lane_mapping_suite');
const {
  printSupplyChainPolicyReport,
  runSupplyChainPolicySuite
} = require('../tests/security/supply_chain_policy_suite');
const {
  printManifestImportPolicyReport,
  runManifestImportPolicySuite
} = require('../tests/security/manifest_import_policy_suite');
const {
  createRunSummary,
  printTextSummary,
  writeJsonReport
} = require('../tests/utils/reporting');

const rootDir = path.resolve(__dirname, '..');

function toRunnerResult(id, label, result) {
  const failures = Array.isArray(result.failures) ? result.failures : [];
  const skips = Array.isArray(result.skips) ? result.skips : [];
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const runnerResult = {
    id,
    label,
    status: result.ok ? 'passed' : 'failed',
    exitCode: result.ok ? 0 : 1,
    passCount: Array.isArray(result.passes) ? result.passes.length : 0,
    failureCount: failures.length,
    skipCount: skips.length,
    warningCount: warnings.length,
    failures,
    skips,
    warnings
  };
  if (result.report) {
    runnerResult.report = result.report;
  }
  return runnerResult;
}

const suites = [
  {
    id: 'core',
    label: 'Core contract verification',
    description: 'Runs the structured core contract suite.',
    run: () => {
      const result = runCoreContractSuite({ rootDir });
      printCoreContractReport(result);
      return toRunnerResult('core', 'Core contract verification', result);
    }
  },
  {
    id: 'architecture',
    label: 'Architecture quality gates',
    description: 'Runs SSOT, Digital Twin and anti-technical-debt architecture gates.',
    run: () => {
      const result = runArchitectureGateSuite({ rootDir });
      printArchitectureGateReport(result);
      return toRunnerResult('architecture', 'Architecture quality gates', result);
    }
  },
  {
    id: 'components',
    label: 'Component-level contract suites',
    description: 'Runs Component-Level contract suites for prioritized XTend components.',
    run: () => {
      const result = runComponentSuites({ rootDir });
      printComponentSuitesReport(result);
      return toRunnerResult('components', 'Component-level contract suites', result);
    }
  },
  {
    id: 'component-contract-v2',
    label: 'XTend Component Contract v2',
    description: 'Runs Component Contract v2 factory, validator, metadata and documentation gates.',
    run: () => {
      const result = runComponentContractV2Suite({ rootDir });
      printComponentContractV2Report(result);
      return toRunnerResult('component-contract-v2', 'XTend Component Contract v2', result);
    }
  },
  {
    id: 'component-shell-contract',
    label: 'XTend Component Shell Contract',
    description: 'Runs the WP-E11-02 Component Shell Contract factory, validator, metadata and documentation gates.',
    run: () => {
      const result = runComponentShellContractSuite({ rootDir });
      printComponentShellContractReport(result);
      return toRunnerResult('component-shell-contract', 'XTend Component Shell Contract', result);
    }
  },
  {
    id: 'component-styling-contract',
    label: 'XTend Component Styling Contract',
    description: 'Runs the WP-E11-03 Styling, Token and CSS Part Contract factory, validator, metadata and documentation gates.',
    run: () => {
      const result = runComponentStylingContractSuite({ rootDir });
      printComponentStylingContractReport(result);
      return toRunnerResult('component-styling-contract', 'XTend Component Styling Contract', result);
    }
  },
  {
    id: 'enterprise-component-flex-hardening-contract',
    label: 'ECH-WP-01 Enterprise Component Flex Hardening Contract',
    description: 'Runs the Enterprise component flexibility, Signature UI, theme and hardening contract gates.',
    run: () => {
      const result = runEnterpriseComponentFlexHardeningContractSuite({ rootDir });
      printEnterpriseComponentFlexHardeningContractReport(result);
      return toRunnerResult('enterprise-component-flex-hardening-contract', 'ECH-WP-01 Enterprise Component Flex Hardening Contract', result);
    }
  },
  {
    id: 'enterprise-component-style-audit',
    label: 'ECH-WP-02 Enterprise Component Style Audit',
    description: 'Runs static style literal, theme compatibility and text glyph control audit gates.',
    run: () => {
      const result = runEnterpriseComponentStyleAuditSuite({ rootDir });
      printEnterpriseComponentStyleAuditReport(result);
      return toRunnerResult('enterprise-component-style-audit', 'ECH-WP-02 Enterprise Component Style Audit', result);
    }
  },
  {
    id: 'enterprise-icon-control-audit',
    label: 'ECH-WP-04 Enterprise Icon Control Audit',
    description: 'Runs text glyph control, icon part, accessible name and core icon registry gates.',
    run: () => {
      const result = runEnterpriseIconControlAuditSuite({ rootDir });
      printEnterpriseIconControlAuditReport(result);
      return toRunnerResult('enterprise-icon-control-audit', 'ECH-WP-04 Enterprise Icon Control Audit', result);
    }
  },
  {
    id: 'xheader-menu-modes',
    label: 'ECH-WP-05 XHeader Menu Presentation Modes',
    description: 'Runs XHeader menu-mode, placement, modal, snapshot, docs, fixture and theme token gates.',
    run: () => {
      const result = runXHeaderMenuModesSuite({ rootDir });
      printXHeaderMenuModesReport(result);
      return toRunnerResult('xheader-menu-modes', 'ECH-WP-05 XHeader Menu Presentation Modes', result);
    }
  },
  {
    id: 'enterprise-overlay-mode-token-parity',
    label: 'ECH-WP-06 Enterprise Overlay Mode/Token Parity',
    description: 'Runs overlay surface, backdrop, close, content, token, modal/non-modal and SurfaceManager parity gates.',
    run: () => {
      const result = runEnterpriseOverlayModeTokenParitySuite({ rootDir });
      printEnterpriseOverlayModeTokenParityReport(result);
      return toRunnerResult('enterprise-overlay-mode-token-parity', 'ECH-WP-06 Enterprise Overlay Mode/Token Parity', result);
    }
  },
  {
    id: 'enterprise-layout-display-media-tokenization',
    label: 'ECH-WP-07 Enterprise Layout Display/Media Tokenization',
    description: 'Runs layout, display and media component token, signatureDesign, foreign theme, overflow and icon-control gates.',
    run: () => {
      const result = runEnterpriseLayoutDisplayMediaTokenizationSuite({ rootDir });
      printEnterpriseLayoutDisplayMediaTokenizationReport(result);
      return toRunnerResult('enterprise-layout-display-media-tokenization', 'ECH-WP-07 Enterprise Layout Display/Media Tokenization', result);
    }
  },
  {
    id: 'enterprise-form-control-theme-a11y',
    label: 'ECH-WP-08 Enterprise Form Control Theme/A11y Hardening',
    description: 'Runs form control token, density, dark/forced-colors, invalid, busy and part exposure gates.',
    run: () => {
      const result = runEnterpriseFormControlThemeA11ySuite({ rootDir });
      printEnterpriseFormControlThemeA11yReport(result);
      return toRunnerResult('enterprise-form-control-theme-a11y', 'ECH-WP-08 Enterprise Form Control Theme/A11y Hardening', result);
    }
  },
  {
    id: 'enterprise-navigation-routing-state-hardening',
    label: 'ECH-WP-09 Enterprise Navigation Routing State Hardening',
    description: 'Runs navigation token, active/current/selected, disabled, keyboard, long-label and disclosure icon gates.',
    run: () => {
      const result = runEnterpriseNavigationRoutingStateHardeningSuite({ rootDir });
      printEnterpriseNavigationRoutingStateHardeningReport(result);
      return toRunnerResult('enterprise-navigation-routing-state-hardening', 'ECH-WP-09 Enterprise Navigation Routing State Hardening', result);
    }
  },
  {
    id: 'builder-typescript-blueprint',
    label: 'XTend Builder TypeScript Component Blueprint',
    description: 'Runs the WP-E10-07 TypeScript-first component blueprint, template, metadata and generator gates.',
    run: () => {
      const result = runBuilderTypeScriptBlueprintSuite({ rootDir });
      printBuilderTypeScriptBlueprintReport(result);
      return toRunnerResult('builder-typescript-blueprint', 'XTend Builder TypeScript Component Blueprint', result);
    }
  },
  {
    id: 'scaffold-write-plan',
    label: 'XTend Scaffold WritePlan',
    description: 'Runs the WP-E17-01 central WritePlan, root guard, idempotent write and check-mode gates.',
    run: () => {
      const result = runScaffoldWritePlanSuite({ rootDir });
      printScaffoldWritePlanReport(result);
      return toRunnerResult('scaffold-write-plan', 'XTend Scaffold WritePlan', result);
    }
  },
  {
    id: 'scaffold-component-write',
    label: 'XTend Scaffold Component Write',
    description: 'Runs the WP-E17-02 component-files write, ownership, conflict and force-update gates.',
    run: () => {
      const result = runScaffoldComponentWriteSuite({ rootDir });
      printScaffoldComponentWriteReport(result);
      return toRunnerResult('scaffold-component-write', 'XTend Scaffold Component Write', result);
    }
  },
  {
    id: 'scaffold-manifest-patch',
    label: 'XTend Scaffold Manifest Patch',
    description: 'Runs the WP-E17-03 manifest JSON patcher, build report and idempotent patch gates.',
    run: () => {
      const result = runScaffoldManifestPatchSuite({ rootDir });
      printScaffoldManifestPatchReport(result);
      return toRunnerResult('scaffold-manifest-patch', 'XTend Scaffold Manifest Patch', result);
    }
  },
  {
    id: 'scaffold-rmt-build',
    label: 'XTend Scaffold RMT Build',
    description: 'Runs the WP-E17-04 RMT vNext template to XTend app build pipeline and 1.0 gate.',
    run: () => {
      const result = runScaffoldRmtBuildSuite({ rootDir });
      printScaffoldRmtBuildReport(result);
      return toRunnerResult('scaffold-rmt-build', 'XTend Scaffold RMT Build', result);
    }
  },
  {
    id: 'epic10-p0-component-wave',
    label: 'Epic 10 P0 Component Wave Contract',
    description: 'Runs the WP-E10-08 P0 component prioritization, contract stub and handoff gates.',
    run: () => {
      const result = runEpic10P0ComponentWaveSuite({ rootDir });
      printEpic10P0ComponentWaveReport(result);
      return toRunnerResult('epic10-p0-component-wave', 'Epic 10 P0 Component Wave Contract', result);
    }
  },
  {
    id: 'component-lab-rmt-inspector',
    label: 'Epic 10 Component Lab and RMT Inspector Pilot',
    description: 'Runs the WP-E10-12 local Component Lab, RMT Inspector, Telemetry and preview target gates.',
    run: () => {
      const result = runComponentLabRmtInspectorSuite({ rootDir });
      printComponentLabRmtInspectorReport(result);
      return toRunnerResult('component-lab-rmt-inspector', 'Epic 10 Component Lab and RMT Inspector Pilot', result);
    }
  },
  {
    id: 'component-lab-ux-inspector',
    label: 'Epic 11 Component Lab UX Inspector',
    description: 'Runs the WP-E11-13 Component Lab UX Inspector across shell, style, a11y, performance, state and component-network domains.',
    run: () => {
      const result = runComponentLabUxInspectorSuite({ rootDir });
      printComponentLabUxInspectorReport(result);
      return toRunnerResult('component-lab-ux-inspector', 'Epic 11 Component Lab UX Inspector', result);
    }
  },
  {
    id: 'component-ux-browser-smokes',
    label: 'Epic 11 Component UX browser smokes',
    description: 'Runs the WP-E11-14 browser-near component UX and compatibility smoke gates.',
    run: () => {
      const result = runComponentUxBrowserSmokeSuite({ rootDir });
      printComponentUxBrowserSmokeReport(result);
      return toRunnerResult('component-ux-browser-smokes', 'Epic 11 Component UX browser smokes', result);
    }
  },
  {
    id: 'component-shell-theme-matrix',
    label: 'Epic 11 Component Shell Theme Matrix',
    description: 'Runs the WP-E11-15 Component Shell visual theme, motion, density and viewport matrix gates.',
    run: () => {
      const result = runComponentShellThemeMatrixSuite({ rootDir });
      printComponentShellThemeMatrixReport(result);
      return toRunnerResult('component-shell-theme-matrix', 'Epic 11 Component Shell Theme Matrix', result);
    }
  },
  {
    id: 'signature-ui-visual-quality',
    label: 'ECH-WP-00 XTend Signature UI Visual Quality',
    description: 'Runs the XTend Signature UI direction, typography, fixture and x-header pilot gates.',
    run: () => {
      const result = runSignatureUiVisualQualitySuite({ rootDir });
      printSignatureUiVisualQualityReport(result);
      return toRunnerResult('signature-ui-visual-quality', 'ECH-WP-00 XTend Signature UI Visual Quality', result);
    }
  },
  {
    id: 'enterprise-visual-dom-snapshot-matrix',
    label: 'ECH-WP-10 Enterprise Visual DOM Snapshot Matrix',
    description: 'Runs x-header mode, theme, density, motion, viewport, Signature UI state, typography and anti-generic DOM snapshot gates.',
    run: () => {
      const result = runEnterpriseVisualDomSnapshotMatrixSuite({ rootDir });
      printEnterpriseVisualDomSnapshotMatrixReport(result);
      return toRunnerResult('enterprise-visual-dom-snapshot-matrix', 'ECH-WP-10 Enterprise Visual DOM Snapshot Matrix', result);
    }
  },
  {
    id: 'enterprise-third-party-authoring-guide',
    label: 'ECH-WP-11 Enterprise Third-Party Authoring Guide',
    description: 'Runs Corporate Theme authoring docs, XTheme bridge, CSS Parts, icon pack, layout mode, A11y and legacy-token migration gates.',
    run: () => {
      const result = runEnterpriseThirdPartyAuthoringGuideSuite({ rootDir });
      printEnterpriseThirdPartyAuthoringGuideReport(result);
      return toRunnerResult('enterprise-third-party-authoring-guide', 'ECH-WP-11 Enterprise Third-Party Authoring Guide', result);
    }
  },
  {
    id: 'enterprise-component-flex-release-handoff',
    label: 'ECH-WP-12 Enterprise Component Flex Release Handoff',
    description: 'Runs SemVer, deprecated aliases, migration notes, release checklist and adoption-risk handoff gates.',
    run: () => {
      const result = runEnterpriseComponentFlexReleaseHandoffSuite({ rootDir });
      printEnterpriseComponentFlexReleaseHandoffReport(result);
      return toRunnerResult('enterprise-component-flex-release-handoff', 'ECH-WP-12 Enterprise Component Flex Release Handoff', result);
    }
  },
  {
    id: 'visual-snapshot-automation',
    label: 'Epic 12 Visual Snapshot Automation Contract',
    description: 'Runs the WP-E12-10 local-only visual snapshot automation contract and WP-E12-11 runner handoff gates.',
    run: () => {
      const result = runVisualSnapshotAutomationSuite({ rootDir });
      printVisualSnapshotAutomationReport(result);
      return toRunnerResult('visual-snapshot-automation', 'Epic 12 Visual Snapshot Automation Contract', result);
    }
  },
  {
    id: 'visual-snapshots',
    label: 'Epic 12 Visual Snapshot local DOM diff runner',
    description: 'Runs the WP-E12-11 local fixture, JSON baseline and DOM-first visual snapshot gates.',
    run: () => {
      const result = runVisualSnapshotsSuite({ rootDir });
      printVisualSnapshotsReport(result);
      return toRunnerResult('visual-snapshots', 'Epic 12 Visual Snapshot local DOM diff runner', result);
    }
  },
  {
    id: 'design-tokens',
    label: 'Epic 12 Enterprise Design System Tokens',
    description: 'Runs the WP-E12-12 design-token productization contract, x-theme, theme matrix and visual snapshot alignment gates.',
    run: () => {
      const result = runDesignTokenContractSuite({ rootDir });
      printDesignTokenContractReport(result);
      return toRunnerResult('design-tokens', 'Epic 12 Enterprise Design System Tokens', result);
    }
  },
  {
    id: 'xtheme-token-alias-layer',
    label: 'ECH-WP-03 XTheme Token Alias Layer',
    description: 'Runs the normalized XTheme alias, P0 component alias and theme fixture gates.',
    run: () => {
      const result = runXThemeTokenAliasLayerSuite({ rootDir });
      printXThemeTokenAliasLayerReport(result);
      return toRunnerResult('xtheme-token-alias-layer', 'ECH-WP-03 XTheme Token Alias Layer', result);
    }
  },
  {
    id: 'rmt-dsl-authoring-polish',
    label: 'Epic 12 RMT DSL Authoring Polish',
    description: 'Runs the WP-E12-13 RMT DSL alias, diagnostics, fixture, metadata and documentation gates.',
    run: () => {
      const result = runRmtDslAuthoringPolishSuite({ rootDir });
      printRmtDslAuthoringPolishReport(result);
      return toRunnerResult('rmt-dsl-authoring-polish', 'Epic 12 RMT DSL Authoring Polish', result);
    }
  },
  {
    id: 'rmt-source-model',
    label: 'Epic 14 RMT Source Model and Range Mapping',
    description: 'Runs the WP-E14-02 native .rmt source model, offset and JSON Pointer range mapping gates.',
    run: () => {
      const result = runRmtSourceModelSuite({ rootDir });
      printRmtSourceModelReport(result);
      return toRunnerResult('rmt-source-model', 'Epic 14 RMT Source Model and Range Mapping', result);
    }
  },
  {
    id: 'rmt-parser',
    label: 'Epic 14 RMT Parser and Format Adapter',
    description: 'Runs the WP-E14-03 RMT parser, createRmtFormat parseDocument adapter and fallback diagnostic gates.',
    run: () => {
      const result = runRmtParserSuite({ rootDir });
      printRmtParserReport(result);
      return toRunnerResult('rmt-parser', 'Epic 14 RMT Parser and Format Adapter', result);
    }
  },
  {
    id: 'rmt-vnext-parser',
    label: 'Epic 15 RMT vNext Lexer and Parser MVP',
    description: 'Runs the WP-E15-04 RMT vNext lexer, AST, source range and syntax diagnostic gates.',
    run: () => {
      const result = runRmtVNextParserSuite({ rootDir });
      printRmtVNextParserReport(result);
      return toRunnerResult('rmt-vnext-parser', 'Epic 15 RMT vNext Lexer and Parser MVP', result);
    }
  },
  {
    id: 'rmt-vnext-compiler',
    label: 'Epic 15 RMT vNext Compiler to Core',
    description: 'Runs the WP-E15-05 RMT vNext AST-to-Core compiler, source map and golden serialization gates.',
    run: () => {
      const result = runRmtVNextCompilerSuite({ rootDir });
      printRmtVNextCompilerReport(result);
      return toRunnerResult('rmt-vnext-compiler', 'Epic 15 RMT vNext Compiler to Core', result);
    }
  },
  {
    id: 'rmt-vnext-source-to-sea',
    label: 'RMT vNext Source-to-Sea Browser Gate',
    description: 'Runs the RMT-VNEXT-PRIM-06 source, kernel, Fabric, UI and browser viewport correlation gate.',
    run: async () => {
      const result = await runRmtVNextSourceToSeaSuite({ rootDir });
      printRmtVNextSourceToSeaReport(result);
      return toRunnerResult('rmt-vnext-source-to-sea', 'RMT vNext Source-to-Sea Browser Gate', result);
    }
  },
  {
    id: 'rmt-vnext-component-primitives',
    label: 'RMT vNext XTend Component Primitive Compatibility',
    description: 'Runs the all-manifest XTend component capability registry, descriptor, event/state bridge and tiered matrix gate.',
    run: async () => {
      const result = await runRmtVNextComponentPrimitivesSuite({ rootDir });
      printRmtVNextComponentPrimitivesReport(result);
      return toRunnerResult('rmt-vnext-component-primitives', 'RMT vNext XTend Component Primitive Compatibility', result);
    }
  },
  {
    id: 'rmt-vnext-fabric-bridge',
    label: 'RMT vNext Fabric Lane/Fiber Bridge Evidence',
    description: 'Runs the RMT-VNEXT-PRIM-05 Fabric lane, fiber, host adapter telemetry and route/component bridge gate.',
    run: () => {
      const result = runRmtVNextFabricBridgeSuite({ rootDir });
      printRmtVNextFabricBridgeReport(result);
      return toRunnerResult('rmt-vnext-fabric-bridge', 'RMT vNext Fabric Lane/Fiber Bridge Evidence', result);
    }
  },
  {
    id: 'rmt-vnext-lifecycle',
    label: 'Epic 15 RMT vNext Lifecycle Operation Contract',
    description: 'Runs the WP-E15-06 RMT vNext lifecycle operation matrix, idempotency and adapter capability gates.',
    run: () => {
      const result = runRmtVNextLifecycleSuite({ rootDir });
      printRmtVNextLifecycleReport(result);
      return toRunnerResult('rmt-vnext-lifecycle', 'Epic 15 RMT vNext Lifecycle Operation Contract', result);
    }
  },
  {
    id: 'rmt-vnext-scheduler',
    label: 'Epic 15 RMT vNext Scheduler Policy Contract',
    description: 'Runs the WP-E15-07 RMT vNext lane normalization, budget, chunking and backpressure gates.',
    run: () => {
      const result = runRmtVNextSchedulerSuite({ rootDir });
      printRmtVNextSchedulerReport(result);
      return toRunnerResult('rmt-vnext-scheduler', 'Epic 15 RMT vNext Scheduler Policy Contract', result);
    }
  },
  {
    id: 'rmt-vnext-surfaces',
    label: 'Epic 15 RMT vNext Surface Registry Contract',
    description: 'Runs the WP-E15-08 RMT vNext surface type, registry and relation validation gates.',
    run: () => {
      const result = runRmtVNextSurfaceRegistrySuite({ rootDir });
      printRmtVNextSurfaceRegistryReport(result);
      return toRunnerResult('rmt-vnext-surfaces', 'Epic 15 RMT vNext Surface Registry Contract', result);
    }
  },
  {
    id: 'rmt-vnext-conditions',
    label: 'Epic 15 RMT vNext Condition Expression Contract',
    description: 'Runs the WP-E15-09 RMT vNext condition expression, path catalog and type inference gates.',
    run: () => {
      const result = runRmtVNextConditionsSuite({ rootDir });
      printRmtVNextConditionsReport(result);
      return toRunnerResult('rmt-vnext-conditions', 'Epic 15 RMT vNext Condition Expression Contract', result);
    }
  },
  {
    id: 'rmt-vnext-composition',
    label: 'Epic 15 RMT vNext Composition and Component Binding Contract',
    description: 'Runs the WP-E15-10 RMT vNext slot binding, nested operation and component adapter gates.',
    run: () => {
      const result = runRmtVNextCompositionSuite({ rootDir });
      printRmtVNextCompositionReport(result);
      return toRunnerResult('rmt-vnext-composition', 'Epic 15 RMT vNext Composition and Component Binding Contract', result);
    }
  },
  {
    id: 'rmt-vnext-imports',
    label: 'Epic 15 RMT vNext Import Resolver and Module Graph Contract',
    description: 'Runs the WP-E15-11 RMT vNext static import resolver, package boundary and module graph gates.',
    run: () => {
      const result = runRmtVNextImportResolverSuite({ rootDir });
      printRmtVNextImportResolverReport(result);
      return toRunnerResult('rmt-vnext-imports', 'Epic 15 RMT vNext Import Resolver and Module Graph Contract', result);
    }
  },
  {
    id: 'rmt-vnext-events',
    label: 'Epic 15 RMT vNext Event, Action and Data Source Contract',
    description: 'Runs the WP-E15-12 RMT vNext event/action reference, payload and data source capability gates.',
    run: () => {
      const result = runRmtVNextEventsSuite({ rootDir });
      printRmtVNextEventsReport(result);
      return toRunnerResult('rmt-vnext-events', 'Epic 15 RMT vNext Event, Action and Data Source Contract', result);
    }
  },
  {
    id: 'rmt-vnext-security',
    label: 'Epic 15 RMT vNext Security Policy Contract',
    description: 'Runs the WP-E15-13 RMT vNext trust boundary, sanitize policy and unsafe-flow gates.',
    run: () => {
      const result = runRmtVNextSecuritySuite({ rootDir });
      printRmtVNextSecurityReport(result);
      return toRunnerResult('rmt-vnext-security', 'Epic 15 RMT vNext Security Policy Contract', result);
    }
  },
  {
    id: 'rmt-kernel-trust-authority',
    label: 'RKSH-WP-01 Kernel Trust Authority Contract',
    description: 'Runs the kernel trust verdict, scope, sink and diagnostics contract gates.',
    run: () => {
      const result = runRmtKernelTrustAuthoritySuite({ rootDir });
      printRmtKernelTrustAuthorityReport(result);
      return toRunnerResult('rmt-kernel-trust-authority', 'RKSH-WP-01 Kernel Trust Authority Contract', result);
    }
  },
  {
    id: 'rmt-kernel-trusted-dom-runtime',
    label: 'RKSH-WP-02 Runtime Trust-Sink Adapter',
    description: 'Runs the Runtime Trusted DOM sanitizer, trust verdict and unsafe HTML sink gates.',
    run: () => {
      const result = runRmtKernelTrustedDomRuntimeSuite({ rootDir });
      printRmtKernelTrustedDomRuntimeReport(result);
      return toRunnerResult('rmt-kernel-trusted-dom-runtime', 'RKSH-WP-02 Runtime Trust-Sink Adapter', result);
    }
  },
  {
    id: 'rmt-kernel-binding-security',
    label: 'RKSH-WP-03 Attribute, URL and Property Policies',
    description: 'Runs the runtime binding attribute allowlist, URL protocol and property write gates.',
    run: () => {
      const result = runRmtKernelBindingSecuritySuite({ rootDir });
      printRmtKernelBindingSecurityReport(result);
      return toRunnerResult('rmt-kernel-binding-security', 'RKSH-WP-03 Attribute, URL and Property Policies', result);
    }
  },
  {
    id: 'rmt-kernel-panic-monitor',
    label: 'RKSH-WP-04 PanicMonitor State Machine',
    description: 'Runs the kernel panic state, threshold, recovery and runtime diagnostic gates.',
    run: () => {
      const result = runRmtKernelPanicMonitorSuite({ rootDir });
      printRmtKernelPanicMonitorReport(result);
      return toRunnerResult('rmt-kernel-panic-monitor', 'RKSH-WP-04 PanicMonitor State Machine', result);
    }
  },
  {
    id: 'rmt-kernel-recovery',
    label: 'RKSH-WP-05 Kernel Recovery Policy',
    description: 'Runs the kernel recovery quarantine, snapshot restore and safe fallback gates.',
    run: () => {
      const result = runRmtKernelRecoverySuite({ rootDir });
      printRmtKernelRecoveryReport(result);
      return toRunnerResult('rmt-kernel-recovery', 'RKSH-WP-05 Kernel Recovery Policy', result);
    }
  },
  {
    id: 'rmt-kernel-escalation',
    label: 'RKSH-WP-06 Diagnostics and Command Bus Escalation',
    description: 'Runs the kernel diagnostics subscriber and command bus escalation gates.',
    run: async () => {
      const result = await runRmtKernelEscalationSuite({ rootDir });
      printRmtKernelEscalationReport(result);
      return toRunnerResult('rmt-kernel-escalation', 'RKSH-WP-06 Diagnostics and Command Bus Escalation', result);
    }
  },
  {
    id: 'rmt-kernel-scheduler-failure',
    label: 'RKSH-WP-07 Scheduler Failure Semantics',
    description: 'Runs the kernel scheduler failed, aborted, panic-blocked and backpressure panic gates.',
    run: async () => {
      const result = await runRmtKernelSchedulerFailureSuite({ rootDir });
      printRmtKernelSchedulerFailureReport(result);
      return toRunnerResult('rmt-kernel-scheduler-failure', 'RKSH-WP-07 Scheduler Failure Semantics', result);
    }
  },
  {
    id: 'rmt-kernel-policy-parity',
    label: 'RKSH-WP-08 Compile-Time Runtime Policy Parity',
    description: 'Runs the kernel compile-time to runtime policy parity, verdict and drift gates.',
    run: async () => {
      const result = await runRmtKernelPolicyParitySuite({ rootDir });
      printRmtKernelPolicyParityReport(result);
      return toRunnerResult('rmt-kernel-policy-parity', 'RKSH-WP-08 Compile-Time Runtime Policy Parity', result);
    }
  },
  {
    id: 'rmt-kernel-security-regression',
    label: 'RKSH-WP-09 Kernel Security Regression',
    description: 'Runs the kernel negative fixtures, panic recovery and browser-smoke regression gates.',
    run: async () => {
      const result = await runRmtKernelSecurityRegressionSuite({ rootDir });
      printRmtKernelSecurityRegressionReport(result);
      return toRunnerResult('rmt-kernel-security-regression', 'RKSH-WP-09 Kernel Security Regression', result);
    }
  },
  {
    id: 'rmt-kernel-handoff-docs',
    label: 'RKSH-WP-11 Kernel Migration Authoring Incident Handoff',
    description: 'Runs the kernel migration, trusted-output authoring and panic/recovery incident handoff docs gate.',
    run: () => {
      const result = runRmtKernelHandoffDocsSuite({ rootDir });
      printRmtKernelHandoffDocsReport(result);
      return toRunnerResult('rmt-kernel-handoff-docs', 'RKSH-WP-11 Kernel Migration Authoring Incident Handoff', result);
    }
  },
  {
    id: 'rmt-vnext-streaming',
    label: 'Epic 15 RMT vNext Streaming and Incremental Rendering Contract',
    description: 'Runs the WP-E15-14 RMT vNext streaming, chunking, backpressure and host-neutral runtime probe gates.',
    run: () => {
      const result = runRmtVNextStreamingSuite({ rootDir });
      printRmtVNextStreamingReport(result);
      return toRunnerResult('rmt-vnext-streaming', 'Epic 15 RMT vNext Streaming and Incremental Rendering Contract', result);
    }
  },
  {
    id: 'rmt-vnext-tooling',
    label: 'Epic 15 RMT vNext Tooling Adapter',
    description: 'Runs the WP-E15-15 RMT vNext linter, LSP, formatter, snippets and source-map tooling gates.',
    run: () => {
      const result = runRmtVNextToolingSuite({ rootDir });
      printRmtVNextToolingReport(result);
      return toRunnerResult('rmt-vnext-tooling', 'Epic 15 RMT vNext Tooling Adapter', result);
    }
  },
  {
    id: 'rmt-vnext-compatibility',
    label: 'Epic 15 RMT vNext Compatibility and Migration',
    description: 'Runs the WP-E15-16 RMT vNext legacy JSON roundtrip, migration report and compatibility matrix gates.',
    run: () => {
      const result = runRmtVNextCompatibilitySuite({ rootDir });
      printRmtVNextCompatibilityReport(result);
      return toRunnerResult('rmt-vnext-compatibility', 'Epic 15 RMT vNext Compatibility and Migration', result);
    }
  },
  {
    id: 'rmt-vnext-regression',
    label: 'Epic 15 RMT vNext Fixture Regression Gate',
    description: 'Runs the WP-E15-17 RMT vNext fixture matrix, golden compiler, parser fuzz and browser reference gates.',
    run: () => {
      const result = runRmtVNextRegressionSuite({ rootDir });
      printRmtVNextRegressionReport(result);
      return toRunnerResult('rmt-vnext-regression', 'Epic 15 RMT vNext Fixture Regression Gate', result);
    }
  },
  {
    id: 'rmt-vnext-release',
    label: 'Epic 15 RMT vNext Release Handoff',
    description: 'Runs the WP-E15-18 RMT vNext docs, reference demo, release gate matrix and handoff gates.',
    run: () => {
      const result = runRmtVNextReleaseHandoffSuite({ rootDir });
      printRmtVNextReleaseHandoffReport(result);
      return toRunnerResult('rmt-vnext-release', 'Epic 15 RMT vNext Release Handoff', result);
    }
  },
  {
    id: 'rmt-vnext-remote-manifest',
    label: 'Epic 16 RMT vNext Remote Surface Manifest Contract',
    description: 'Runs the WP-E16-02 RMT vNext remote surface manifest, core record and kernel-boundary gates.',
    run: () => {
      const result = runRmtVNextRemoteManifestSuite({ rootDir });
      printRmtVNextRemoteManifestReport(result);
      return toRunnerResult('rmt-vnext-remote-manifest', 'Epic 16 RMT vNext Remote Surface Manifest Contract', result);
    }
  },
  {
    id: 'rmt-vnext-enterprise-registry',
    label: 'Epic 16 RMT vNext Enterprise Surface Registry Contract',
    description: 'Runs the WP-E16-03 RMT vNext enterprise surface registry, ownership and discoverability gates.',
    run: () => {
      const result = runRmtVNextEnterpriseRegistrySuite({ rootDir });
      printRmtVNextEnterpriseRegistryReport(result);
      return toRunnerResult('rmt-vnext-enterprise-registry', 'Epic 16 RMT vNext Enterprise Surface Registry Contract', result);
    }
  },
  {
    id: 'rmt-vnext-degradation',
    label: 'Epic 16 RMT vNext Degradation Policy Contract',
    description: 'Runs the WP-E16-04 RMT vNext versioning, compatibility and graceful degradation gates.',
    run: () => {
      const result = runRmtVNextDegradationSuite({ rootDir });
      printRmtVNextDegradationReport(result);
      return toRunnerResult('rmt-vnext-degradation', 'Epic 16 RMT vNext Degradation Policy Contract', result);
    }
  },
  {
    id: 'rmt-vnext-remote-security',
    label: 'Epic 16 RMT vNext Remote Security Policy Contract',
    description: 'Runs the WP-E16-05 RMT vNext remote trust boundary, manifest integrity, CSP and sandbox gates.',
    run: () => {
      const result = runRmtVNextRemoteSecuritySuite({ rootDir });
      printRmtVNextRemoteSecurityReport(result);
      return toRunnerResult('rmt-vnext-remote-security', 'Epic 16 RMT vNext Remote Security Policy Contract', result);
    }
  },
  {
    id: 'rmt-vnext-cross-surface-events',
    label: 'Epic 16 RMT vNext Cross Surface Event Protocol',
    description: 'Runs the WP-E16-06 RMT vNext cross surface event owner, direction, payload and scope gates.',
    run: () => {
      const result = runRmtVNextCrossSurfaceEventsSuite({ rootDir });
      printRmtVNextCrossSurfaceEventsReport(result);
      return toRunnerResult('rmt-vnext-cross-surface-events', 'Epic 16 RMT vNext Cross Surface Event Protocol', result);
    }
  },
  {
    id: 'rmt-vnext-event-governance',
    label: 'Epic 16 RMT vNext Event Governance',
    description: 'Runs the WP-E16-07 RMT vNext event ownership, delivery policy and governance diagnostic gates.',
    run: () => {
      const result = runRmtVNextEventGovernanceSuite({ rootDir });
      printRmtVNextEventGovernanceReport(result);
      return toRunnerResult('rmt-vnext-event-governance', 'Epic 16 RMT vNext Event Governance', result);
    }
  },
  {
    id: 'rmt-vnext-remote-compiler',
    label: 'Epic 16 RMT vNext Remote Compiler',
    description: 'Runs the WP-E16-08 RMT vNext remote surface parser, compiler, core mapping and golden output gates.',
    run: () => {
      const result = runRmtVNextRemoteCompilerSuite({ rootDir });
      printRmtVNextRemoteCompilerReport(result);
      return toRunnerResult('rmt-vnext-remote-compiler', 'Epic 16 RMT vNext Remote Compiler', result);
    }
  },
  {
    id: 'rmt-vnext-remote-tooling',
    label: 'Epic 16 RMT vNext Remote Tooling',
    description: 'Runs the WP-E16-09 RMT vNext remote linter, LSP facts, snippets and agent report gates.',
    run: () => {
      const result = runRmtVNextRemoteToolingSuite({ rootDir });
      printRmtVNextRemoteToolingReport(result);
      return toRunnerResult('rmt-vnext-remote-tooling', 'Epic 16 RMT vNext Remote Tooling', result);
    }
  },
  {
    id: 'rmt-vnext-remote-compatibility',
    label: 'Epic 16 RMT vNext Remote Compatibility and Migration',
    description: 'Runs the WP-E16-10 RMT vNext remote surface migration, report-only compatibility and legacy roundtrip gates.',
    run: () => {
      const result = runRmtVNextRemoteCompatibilitySuite({ rootDir });
      printRmtVNextRemoteCompatibilityReport(result);
      return toRunnerResult('rmt-vnext-remote-compatibility', 'Epic 16 RMT vNext Remote Compatibility and Migration', result);
    }
  },
  {
    id: 'rmt-vnext-enterprise-fixtures',
    label: 'Epic 16 RMT vNext Enterprise MFE Fixtures',
    description: 'Runs the WP-E16-11 RMT vNext enterprise MFE demo, golden hashes and offline browser smoke gates.',
    run: () => {
      const result = runRmtVNextEnterpriseFixturesSuite({ rootDir });
      printRmtVNextEnterpriseFixturesReport(result);
      return toRunnerResult('rmt-vnext-enterprise-fixtures', 'Epic 16 RMT vNext Enterprise MFE Fixtures', result);
    }
  },
  {
    id: 'rmt-vnext-enterprise-release',
    label: 'Epic 16 RMT vNext Enterprise MFE Release Handoff',
    description: 'Runs the WP-E16-12 RMT vNext enterprise MFE docs, release matrix and handoff gates.',
    run: () => {
      const result = runRmtVNextEnterpriseReleaseSuite({ rootDir });
      printRmtVNextEnterpriseReleaseReport(result);
      return toRunnerResult('rmt-vnext-enterprise-release', 'Epic 16 RMT vNext Enterprise MFE Release Handoff', result);
    }
  },
  {
    id: 'rmt-semantic-graph',
    label: 'Epic 14 RMT Semantic Graph',
    description: 'Runs the WP-E14-04 RMT domain index, reference graph, duplicate and cross-domain diagnostic gates.',
    run: () => {
      const result = runRmtSemanticGraphSuite({ rootDir });
      printRmtSemanticGraphReport(result);
      return toRunnerResult('rmt-semantic-graph', 'Epic 14 RMT Semantic Graph', result);
    }
  },
  {
    id: 'rmt-linter-rules',
    label: 'Epic 14 RMT Linter Rule Engine',
    description: 'Runs the WP-E14-05 RMT rule registry, severity policy, repair hint and deterministic report gates.',
    run: () => {
      const result = runRmtLinterRulesSuite({ rootDir });
      printRmtLinterRulesReport(result);
      return toRunnerResult('rmt-linter-rules', 'Epic 14 RMT Linter Rule Engine', result);
    }
  },
  {
    id: 'rmt-linter-cli',
    label: 'Epic 14 RMT Linter CLI',
    description: 'Runs the WP-E14-06 xt rmt lint, JSON/Text reporter, directory/glob and exit-code gates.',
    run: () => {
      const result = runRmtLinterCliSuite({ rootDir });
      printRmtLinterCliReport(result);
      return toRunnerResult('rmt-linter-cli', 'Epic 14 RMT Linter CLI', result);
    }
  },
  {
    id: 'rmt-completions',
    label: 'Epic 14 RMT Completion Provider',
    description: 'Runs the WP-E14-07 RMT top-level, field, reference, tag, lane, mode and policy completion gates.',
    run: () => {
      const result = runRmtCompletionSuite({ rootDir });
      printRmtCompletionReport(result);
      return toRunnerResult('rmt-completions', 'Epic 14 RMT Completion Provider', result);
    }
  },
  {
    id: 'rmt-navigation',
    label: 'Epic 14 RMT Navigation Providers',
    description: 'Runs the WP-E14-08 hover, document symbols and go-to-definition provider gates.',
    run: () => {
      const result = runRmtNavigationSuite({ rootDir });
      printRmtNavigationReport(result);
      return toRunnerResult('rmt-navigation', 'Epic 14 RMT Navigation Providers', result);
    }
  },
  {
    id: 'rmt-language-server',
    label: 'Epic 14 RMT Language Server MVP',
    description: 'Runs the WP-E14-09 stdio JSON-RPC LSP, document sync and provider mapping gates.',
    run: () => {
      const result = runRmtLanguageServerSuite({ rootDir });
      printRmtLanguageServerReport(result);
      return toRunnerResult('rmt-language-server', 'Epic 14 RMT Language Server MVP', result);
    }
  },
  {
    id: 'rmt-code-actions',
    label: 'Epic 14 RMT Code Actions',
    description: 'Runs the WP-E14-10 quick fix, workspace edit and LSP code action provider gates.',
    run: () => {
      const result = runRmtCodeActionsSuite({ rootDir });
      printRmtCodeActionsReport(result);
      return toRunnerResult('rmt-code-actions', 'Epic 14 RMT Code Actions', result);
    }
  },
  {
    id: 'rmt-agent-report',
    label: 'Epic 14 RMT AI Agent Repair Report',
    description: 'Runs the WP-E14-11 agent repair report, fix order, confidence, impact and no-op gates.',
    run: () => {
      const result = runRmtAgentRepairReportSuite({ rootDir });
      printRmtAgentRepairReport(result);
      return toRunnerResult('rmt-agent-report', 'Epic 14 RMT AI Agent Repair Report', result);
    }
  },
  {
    id: 'rmt-editor-packaging',
    label: 'Epic 14 RMT Editor Packaging',
    description: 'Runs the WP-E14-12 snippets, editor packaging, VS Code bridge and LSP setup docs gates.',
    run: () => {
      const result = runRmtEditorPackagingSuite({ rootDir });
      printRmtEditorPackagingReport(result);
      return toRunnerResult('rmt-editor-packaging', 'Epic 14 RMT Editor Packaging', result);
    }
  },
  {
    id: 'rmt-language-regression',
    label: 'Epic 14 RMT Language Regression Matrix',
    description: 'Runs the WP-E14-13 fixture, negative, fuzz, CLI, LSP and agent regression matrix gates.',
    run: () => {
      const result = runRmtLanguageRegressionSuite({ rootDir });
      printRmtLanguageRegressionReport(result);
      return toRunnerResult('rmt-language-regression', 'Epic 14 RMT Language Regression Matrix', result);
    }
  },
  {
    id: 'rmt-tooling-docs',
    label: 'Epic 14 RMT Tooling Docs',
    description: 'Runs the WP-E14-14 linter, LSP, quick-start, native-authoring, menu and package documentation gates.',
    run: () => {
      const result = runRmtToolingDocsSuite({ rootDir });
      printRmtToolingDocsReport(result);
      return toRunnerResult('rmt-tooling-docs', 'Epic 14 RMT Tooling Docs', result);
    }
  },
  {
    id: 'epic14-rmt-tooling',
    label: 'Epic 14 RMT Tooling Release Gates',
    description: 'Runs the WP-E14-15 RMT tooling package scripts, export surface, scaffold metadata and CI handoff gates.',
    run: () => {
      const result = runEpic14RmtToolingReleaseGatesSuite({ rootDir });
      printEpic14RmtToolingReleaseGatesReport(result);
      return toRunnerResult('epic14-rmt-tooling', 'Epic 14 RMT Tooling Release Gates', result);
    }
  },
  {
    id: 'epic14-lsp-handoff',
    label: 'Epic 14 LSP Handoff',
    description: 'Runs the WP-E14-16 Epic closure, LSP capability matrix, known limitations and upstream handoff gates.',
    run: () => {
      const result = runEpic14LspHandoffSuite({ rootDir });
      printEpic14LspHandoffReport(result);
      return toRunnerResult('epic14-lsp-handoff', 'Epic 14 LSP Handoff', result);
    }
  },
  {
    id: 'rc0-gate-matrix',
    label: 'Epic 12 RC0 Gate Matrix',
    description: 'Runs the WP-E12-14 RC0 PR, release, snapshot, RMT authoring, network, package and residual-policy matrix gates.',
    run: () => {
      const result = runEpic12Rc0GateMatrixSuite({ rootDir });
      printEpic12Rc0GateMatrixReport(result);
      return toRunnerResult('rc0-gate-matrix', 'Epic 12 RC0 Gate Matrix', result);
    }
  },
  {
    id: 'epic12-docs-adoption',
    label: 'Epic 12 Docs Migration and Enterprise Adoption',
    description: 'Runs the WP-E12-15 docs, migration notes, enterprise adoption and RC0 reference gates.',
    run: () => {
      const result = runEpic12DocsAdoptionSuite({ rootDir });
      printEpic12DocsAdoptionReport(result);
      return toRunnerResult('epic12-docs-adoption', 'Epic 12 Docs Migration and Enterprise Adoption', result);
    }
  },
  {
    id: 'epic12-rc0-handoff',
    label: 'Epic 12 RC0 Handoff',
    description: 'Runs the WP-E12-16 Epic closure, RC0 owner-review and publish-boundary handoff gates.',
    run: () => {
      const result = runEpic12Rc0HandoffSuite({ rootDir });
      printEpic12Rc0HandoffReport(result);
      return toRunnerResult('epic12-rc0-handoff', 'Epic 12 RC0 Handoff', result);
    }
  },
  {
    id: 'epic13-rc1-readiness',
    label: 'Epic 13 RC1 Readiness',
    description: 'Runs the WP-E13-01 RC0-to-RC1 readiness model, gate mapping and feature-drift boundary gates.',
    run: () => {
      const result = runEpic13Rc1ReadinessSuite({ rootDir });
      printEpic13Rc1ReadinessReport(result);
      return toRunnerResult('epic13-rc1-readiness', 'Epic 13 RC1 Readiness', result);
    }
  },
  {
    id: 'epic13-release-owner-acceptance',
    label: 'Epic 13 Release Owner Acceptance',
    description: 'Runs the WP-E13-02 Release Owner Acceptance contract, owner checklist, deferral and publish-boundary gates.',
    run: () => {
      const result = runEpic13ReleaseOwnerAcceptanceSuite({ rootDir });
      printEpic13ReleaseOwnerAcceptanceReport(result);
      return toRunnerResult('epic13-release-owner-acceptance', 'Epic 13 Release Owner Acceptance', result);
    }
  },
  {
    id: 'epic13-conditional-network-evidence',
    label: 'Epic 13 Conditional Network Evidence',
    description: 'Runs the WP-E13-03 Conditional Network Evidence contract, offline deferral and publish-boundary gates.',
    run: () => {
      const result = runEpic13ConditionalNetworkEvidenceSuite({ rootDir });
      printEpic13ConditionalNetworkEvidenceReport(result);
      return toRunnerResult('epic13-conditional-network-evidence', 'Epic 13 Conditional Network Evidence', result);
    }
  },
  {
    id: 'epic13-conditional-network-evidence-ci',
    label: 'Epic 13 Conditional Network Evidence CI',
    description: 'Runs the DPF-WP-03 audit/SBOM CI evidence, deferral artifact and workflow handoff gates.',
    run: () => {
      const result = runEpic13ConditionalNetworkEvidenceCiSuite({ rootDir });
      printEpic13ConditionalNetworkEvidenceCiReport(result);
      return toRunnerResult('epic13-conditional-network-evidence-ci', 'Epic 13 Conditional Network Evidence CI', result);
    }
  },
  {
    id: 'epic13-package-export-lock',
    label: 'Epic 13 Package Export Lock',
    description: 'Runs the WP-E13-04 package dry-run artifact, package-files and export-surface lock gates.',
    run: () => {
      const result = runEpic13PackageExportLockSuite({ rootDir });
      printEpic13PackageExportLockReport(result);
      return toRunnerResult('epic13-package-export-lock', 'Epic 13 Package Export Lock', result);
    }
  },
  {
    id: 'type-exports',
    label: 'TypeExports Public Declaration Gate',
    description: 'Runs the WP-TypeExports-01 public package export classification and declaration target gate.',
    run: () => {
      const result = runTypeExportsSuite({ rootDir });
      printTypeExportsReport(result);
      return toRunnerResult('type-exports', 'TypeExports Public Declaration Gate', result);
    }
  },
  {
    id: 'type-exports-loader',
    label: 'TypeExports Loader Declaration Gate',
    description: 'Runs the WP-TypeExports-02 XTendLoader, StyleRegistry and SkeletonLoader declaration drift gate.',
    run: () => {
      const result = runTypeExportsLoaderSuite({ rootDir });
      printTypeExportsLoaderReport(result);
      return toRunnerResult('type-exports-loader', 'TypeExports Loader Declaration Gate', result);
    }
  },
  {
    id: 'type-exports-api',
    label: 'TypeExports API Declaration Gate',
    description: 'Runs the WP-TypeExports-03 api.js and window.XTend namespace declaration drift gate.',
    run: () => {
      const result = runTypeExportsApiSuite({ rootDir });
      printTypeExportsApiReport(result);
      return toRunnerResult('type-exports-api', 'TypeExports API Declaration Gate', result);
    }
  },
  {
    id: 'type-exports-rmt',
    label: 'TypeExports RMT Declaration Gate',
    description: 'Runs the WP-TypeExports-04 XTendRMT runtime, browser and RMT-Language declaration drift gate.',
    run: () => {
      const result = runTypeExportsRmtSuite({ rootDir });
      printTypeExportsRmtReport(result);
      return toRunnerResult('type-exports-rmt', 'TypeExports RMT Declaration Gate', result);
    }
  },
  {
    id: 'type-exports-policy',
    label: 'TypeExports Policy Declaration Gate',
    description: 'Runs the WP-TypeExports-05 Fabric, A11y and Security policy declaration drift gate.',
    run: () => {
      const result = runTypeExportsPolicySuite({ rootDir });
      printTypeExportsPolicyReport(result);
      return toRunnerResult('type-exports-policy', 'TypeExports Policy Declaration Gate', result);
    }
  },
  {
    id: 'type-exports-builder',
    label: 'TypeExports Builder Declaration Gate',
    description: 'Runs the WP-TypeExports-06 Builder, Scaffold and Component Lab declaration drift gate.',
    run: () => {
      const result = runTypeExportsBuilderSuite({ rootDir });
      printTypeExportsBuilderReport(result);
      return toRunnerResult('type-exports-builder', 'TypeExports Builder Declaration Gate', result);
    }
  },
  {
    id: 'type-exports-catalog',
    label: 'TypeExports Catalog Declaration Gate',
    description: 'Runs the WP-TypeExports-07 Catalog plan/report declaration drift gate.',
    run: () => {
      const result = runTypeExportsCatalogSuite({ rootDir });
      printTypeExportsCatalogReport(result);
      return toRunnerResult('type-exports-catalog', 'TypeExports Catalog Declaration Gate', result);
    }
  },
  {
    id: 'type-exports-vendor',
    label: 'TypeExports Vendor and Utility Facade Gate',
    description: 'Runs the WP-TypeExports-08 Prism, Turndown and Design Token facade drift gate.',
    run: () => {
      const result = runTypeExportsVendorSuite({ rootDir });
      printTypeExportsVendorReport(result);
      return toRunnerResult('type-exports-vendor', 'TypeExports Vendor and Utility Facade Gate', result);
    }
  },
  {
    id: 'epic13-known-residual-triage',
    label: 'Epic 13 Known Residual Triage',
    description: 'Runs the WP-E13-05 RC0 known residual triage, boundary-closure and hydration watchpoint gates.',
    run: () => {
      const result = runEpic13KnownResidualTriageSuite({ rootDir });
      printEpic13KnownResidualTriageReport(result);
      return toRunnerResult('epic13-known-residual-triage', 'Epic 13 Known Residual Triage', result);
    }
  },
  {
    id: 'epic13-hydration-performance-closure',
    label: 'Epic 13 Hydration Performance Closure',
    description: 'Runs the WP-E13-06 hydration performance closure, baseline and RC1 watchpoint gates.',
    run: () => {
      const result = runEpic13HydrationPerformanceClosureSuite({ rootDir });
      printEpic13HydrationPerformanceClosureReport(result);
      return toRunnerResult('epic13-hydration-performance-closure', 'Epic 13 Hydration Performance Closure', result);
    }
  },
  {
    id: 'epic13-prod-browser-csp-smoke',
    label: 'Epic 13 PROD Browser CSP Smoke',
    description: 'Runs the WP-E13-07 PROD-like browser, local-server and CSP smoke preparation gates.',
    run: async () => {
      const result = await runEpic13ProdBrowserCspSmokeSuite({ rootDir });
      printEpic13ProdBrowserCspSmokeReport(result);
      return toRunnerResult('epic13-prod-browser-csp-smoke', 'Epic 13 PROD Browser CSP Smoke', result);
    }
  },
  {
    id: 'epic13-visual-owner-artifact',
    label: 'Epic 13 Visual Owner Artifact',
    description: 'Runs the WP-E13-08 visual screenshot owner artifact normalization gates.',
    run: () => {
      const result = runEpic13VisualOwnerArtifactSuite({ rootDir });
      printEpic13VisualOwnerArtifactReport(result);
      return toRunnerResult('epic13-visual-owner-artifact', 'Epic 13 Visual Owner Artifact', result);
    }
  },
  {
    id: 'epic13-rmt-production-readiness',
    label: 'Epic 13 RMT Production Readiness',
    description: 'Runs the WP-E13-09 RMT-first app production readiness bundle gates.',
    run: () => {
      const result = runEpic13RmtProductionReadinessSuite({ rootDir });
      printEpic13RmtProductionReadinessReport(result);
      return toRunnerResult('epic13-rmt-production-readiness', 'Epic 13 RMT Production Readiness', result);
    }
  },
  {
    id: 'epic13-docs-rmt-production-hardening',
    label: 'Epic 13 Docs RMT Production Hardening',
    description: 'Runs the WP-E13-10 Docs-App RMT Parsedown shell production hardening gates.',
    run: () => {
      const result = runEpic13DocsRmtProductionHardeningSuite({ rootDir });
      printEpic13DocsRmtProductionHardeningReport(result);
      return toRunnerResult('epic13-docs-rmt-production-hardening', 'Epic 13 Docs RMT Production Hardening', result);
    }
  },
  {
    id: 'epic13-trusted-dom-boundary',
    label: 'Epic 13 Trusted DOM Boundary',
    description: 'Runs the WP-E13-11 Trusted DOM, Parsedown and RMT HTML boundary browser-proof gates.',
    run: async () => {
      const result = await runEpic13TrustedDomBoundarySuite({ rootDir });
      printEpic13TrustedDomBoundaryReport(result);
      return toRunnerResult('epic13-trusted-dom-boundary', 'Epic 13 Trusted DOM Boundary', result);
    }
  },
  {
    id: 'epic13-rc1-migration-notes',
    label: 'Epic 13 RC1 Migration Notes',
    description: 'Runs the WP-E13-12 RC1 migration notes, SemVer decision and changelog gates.',
    run: () => {
      const result = runEpic13Rc1MigrationNotesSuite({ rootDir });
      printEpic13Rc1MigrationNotesReport(result);
      return toRunnerResult('epic13-rc1-migration-notes', 'Epic 13 RC1 Migration Notes', result);
    }
  },
  {
    id: 'epic13-rc1-gate-matrix-ci-handoff',
    label: 'Epic 13 RC1 Gate Matrix and CI Handoff',
    description: 'Runs the WP-E13-13 RC1 gate matrix, report artifact and CI handoff gates.',
    run: () => {
      const result = runEpic13Rc1GateMatrixCiHandoffSuite({ rootDir });
      printEpic13Rc1GateMatrixCiHandoffReport(result);
      return toRunnerResult('epic13-rc1-gate-matrix-ci-handoff', 'Epic 13 RC1 Gate Matrix and CI Handoff', result);
    }
  },
  {
    id: 'epic13-release-report-pack-dry-run-evidence',
    label: 'Epic 13 Release Report and Pack Dry Run Evidence',
    description: 'Runs the DPF-WP-02 release report, pack dry-run artifact and owner evidence gates.',
    run: () => {
      const result = runEpic13ReleaseReportPackDryRunEvidenceSuite({ rootDir });
      printEpic13ReleaseReportPackDryRunEvidenceReport(result);
      return toRunnerResult('epic13-release-report-pack-dry-run-evidence', 'Epic 13 Release Report and Pack Dry Run Evidence', result);
    }
  },
  {
    id: 'component-ux-authoring-docs',
    label: 'Epic 11 Component UX Authoring Docs',
    description: 'Runs the WP-E11-16 Component UX authoring documentation and handoff gates.',
    run: () => {
      const result = runComponentUxAuthoringDocsSuite({ rootDir });
      printComponentUxAuthoringDocsReport(result);
      return toRunnerResult('component-ux-authoring-docs', 'Epic 11 Component UX Authoring Docs', result);
    }
  },
  {
    id: 'component-long-tail-migration',
    label: 'Epic 11 Legacy Long-Tail Migration',
    description: 'Runs the WP-E11-17 legacy long-tail migration planning gates.',
    run: () => {
      const result = runComponentLongTailMigrationSuite({ rootDir });
      printComponentLongTailMigrationReport(result);
      return toRunnerResult('component-long-tail-migration', 'Epic 11 Legacy Long-Tail Migration', result);
    }
  },
  {
    id: 'epic11-enterprise-ux-handoff',
    label: 'Epic 11 Enterprise UX Handoff',
    description: 'Runs the WP-E11-18 Epic closure, KPI acceptance and enterprise UX handoff gates.',
    run: () => {
      const result = runEpic11EnterpriseUxHandoffSuite({ rootDir });
      printEpic11EnterpriseUxHandoffReport(result);
      return toRunnerResult('epic11-enterprise-ux-handoff', 'Epic 11 Enterprise UX Handoff', result);
    }
  },
  {
    id: 'rmt-first-demo-app',
    label: 'Epic 10 RMT-first Demo App',
    description: 'Runs the WP-E10-13 RMT-first demo app, no-manual-shell host and browser-smoke gates.',
    run: () => {
      const result = runRmtFirstDemoAppSuite({ rootDir });
      printRmtFirstDemoAppReport(result);
      return toRunnerResult('rmt-first-demo-app', 'Epic 10 RMT-first Demo App', result);
    }
  },
  {
    id: 'rmt-lifecycle-demo',
    label: 'RMT Lifecycle Demo',
    description: 'Runs the RMT vNext template, compiler, Scaffold build, generated app and HTTP smoke gates.',
    run: () => {
      const result = runRmtLifecycleDemoSuite({ rootDir });
      printRmtLifecycleDemoReport(result);
      return toRunnerResult('rmt-lifecycle-demo', 'RMT Lifecycle Demo', result);
    }
  },
  {
    id: 'existing-component-metadata',
    label: 'Epic 10 Existing Component RMT/Fabric Metadata Migration',
    description: 'Runs the WP-E10-14 metadata overlay gates for prioritized existing XTend components.',
    run: () => {
      const result = runExistingComponentMetadataMigrationSuite({ rootDir });
      printExistingComponentMetadataMigrationReport(result);
      return toRunnerResult('existing-component-metadata', 'Epic 10 Existing Component RMT/Fabric Metadata Migration', result);
    }
  },
  {
    id: 'epic10-platform-gates',
    label: 'Epic 10 Browser, A11y, Performance and Visual Platform Gates',
    description: 'Runs the WP-E10-15 platform gate chain, CI handoff and browser/a11y/performance/visual gate metadata.',
    run: () => {
      const result = runEpic10PlatformGatesSuite({ rootDir });
      printEpic10PlatformGatesReport(result);
      return toRunnerResult('epic10-platform-gates', 'Epic 10 Browser, A11y, Performance and Visual Platform Gates', result);
    }
  },
  {
    id: 'epic10-release-handoff',
    label: 'Epic 10 Documentation, Guides and Release Handoff',
    description: 'Runs the WP-E10-16 documentation, guide structure, release handoff and Epic closure gates.',
    run: () => {
      const result = runEpic10ReleaseHandoffSuite({ rootDir });
      printEpic10ReleaseHandoffReport(result);
      return toRunnerResult('epic10-release-handoff', 'Epic 10 Documentation, Guides and Release Handoff', result);
    }
  },
  {
    id: 'a11y-hydration',
    label: 'Accessibility and hydration gates',
    description: 'Runs XTend Accessibility and Hydration minimum gates for core UI components.',
    run: () => {
      const result = runAccessibilityHydrationSuite({ rootDir });
      printAccessibilityHydrationReport(result);
      return toRunnerResult('a11y-hydration', 'Accessibility and hydration gates', result);
    }
  },
  {
    id: 'screenreader-signals',
    label: 'Screenreader signal contract gates',
    description: 'Runs aria-live, status region, error region and announcement contract gates.',
    run: () => {
      const result = runScreenreaderSignalSuite({ rootDir });
      printScreenreaderSignalReport(result);
      return toRunnerResult('screenreader-signals', 'Screenreader signal contract gates', result);
    }
  },
  {
    id: 'motion-contrast',
    label: 'Reduced Motion and High Contrast gates',
    description: 'Runs prefers-reduced-motion, forced-colors and non-color-status policy gates.',
    run: () => {
      const result = runMotionContrastSuite({ rootDir });
      printMotionContrastReport(result);
      return toRunnerResult('motion-contrast', 'Reduced Motion and High Contrast gates', result);
    }
  },
  {
    id: 'runtime-a11y-contract',
    label: 'XTend Runtime A11y UX Contract',
    description: 'Runs the WP-E11-04 Runtime A11y behavior, metadata and documentation gates.',
    run: () => {
      const result = runRuntimeA11yContractSuite({ rootDir });
      printRuntimeA11yContractReport(result);
      return toRunnerResult('runtime-a11y-contract', 'XTend Runtime A11y UX Contract', result);
    }
  },
  {
    id: 'component-ux-performance',
    label: 'XTend Component UX Performance Contract',
    description: 'Runs the WP-E11-05 Component UX Performance profile, budget and metadata gates.',
    run: () => {
      const result = runComponentUxPerformanceContractSuite({ rootDir });
      printComponentUxPerformanceContractReport(result);
      return toRunnerResult('component-ux-performance', 'XTend Component UX Performance Contract', result);
    }
  },
  {
    id: 'component-network-contract',
    label: 'XTend Component Network Contract',
    description: 'Runs the WP-E11-06 Component Network events, commands, contexts, metadata and documentation gates.',
    run: () => {
      const result = runComponentNetworkContractSuite({ rootDir });
      printComponentNetworkContractReport(result);
      return toRunnerResult('component-network-contract', 'XTend Component Network Contract', result);
    }
  },
  {
    id: 'rmt-shell-authoring-ux',
    label: 'XTend RMT Shell Authoring for Component UX',
    description: 'Runs the WP-E11-07 RMT Shell Authoring fixture, metadata and documentation gates.',
    run: () => {
      const result = runRmtShellAuthoringComponentUxSuite({ rootDir });
      printRmtShellAuthoringComponentUxReport(result);
      return toRunnerResult('rmt-shell-authoring-ux', 'XTend RMT Shell Authoring for Component UX', result);
    }
  },
  {
    id: 'form-controls-ux',
    label: 'XTend Form Controls UX maturity',
    description: 'Runs the WP-E11-08 Form Controls UX profile, RMT fixture and documentation gates.',
    run: () => {
      const result = runFormControlsUxSuite({ rootDir });
      printFormControlsUxReport(result);
      return toRunnerResult('form-controls-ux', 'XTend Form Controls UX maturity', result);
    }
  },
  {
    id: 'feedback-status-ux',
    label: 'XTend Feedback and Status UX maturity',
    description: 'Runs the WP-E11-09 Feedback and Status UX profile, RMT fixture and documentation gates.',
    run: () => {
      const result = runFeedbackStatusUxSuite({ rootDir });
      printFeedbackStatusUxReport(result);
      return toRunnerResult('feedback-status-ux', 'XTend Feedback and Status UX maturity', result);
    }
  },
  {
    id: 'navigation-routing-ux',
    label: 'XTend Navigation and Routing UX maturity',
    description: 'Runs the WP-E11-10 Navigation and Routing UX profile, RMT fixture and documentation gates.',
    run: () => {
      const result = runNavigationRoutingUxSuite({ rootDir });
      printNavigationRoutingUxReport(result);
      return toRunnerResult('navigation-routing-ux', 'XTend Navigation and Routing UX maturity', result);
    }
  },
  {
    id: 'overlay-interaction-ux',
    label: 'XTend Overlay and Interaction UX maturity',
    description: 'Runs the WP-E11-11 Overlay and Interaction UX profile, RMT fixture and documentation gates.',
    run: () => {
      const result = runOverlayInteractionUxSuite({ rootDir });
      printOverlayInteractionUxReport(result);
      return toRunnerResult('overlay-interaction-ux', 'XTend Overlay and Interaction UX maturity', result);
    }
  },
  {
    id: 'layout-display-media-ux',
    label: 'XTend Layout Display and Media UX maturity',
    description: 'Runs the WP-E11-12 Layout, Display and Media UX profile, RMT fixture and documentation gates.',
    run: () => {
      const result = runLayoutDisplayMediaUxSuite({ rootDir });
      printLayoutDisplayMediaUxReport(result);
      return toRunnerResult('layout-display-media-ux', 'XTend Layout Display and Media UX maturity', result);
    }
  },
  {
    id: 'catalog-coverage',
    label: 'XTend Component Catalog Coverage Matrix',
    description: 'Runs manifest-wide component catalog coverage, maturity and remediation handoff gates.',
    run: () => {
      const result = runComponentCatalogCoverageSuite({ rootDir });
      printComponentCatalogCoverageReport(result);
      return toRunnerResult('catalog-coverage', 'XTend Component Catalog Coverage Matrix', result);
    }
  },
  {
    id: 'regression-priority',
    label: 'XTend visual and browser regression priority plan',
    description: 'Runs ER-WP-35 visual, browser, mobile, theme and performance prioritization gates.',
    run: () => {
      const result = runComponentRegressionPrioritySuite({ rootDir });
      printComponentRegressionPriorityReport(result);
      return toRunnerResult('regression-priority', 'XTend visual and browser regression priority plan', result);
    }
  },
  {
    id: 'fabric',
    label: 'XTend-Fabric runtime skeleton',
    description: 'Runs the XTend-Fabric API, diagnostics, reporter and fiber runtime gates.',
    run: () => {
      const result = runFabricRuntimeSuite({ rootDir });
      printFabricRuntimeReport(result);
      return toRunnerResult('fabric', 'XTend-Fabric runtime skeleton', result);
    }
  },
  {
    id: 'fabric-lane-mapping',
    label: 'XTend-Fabric RMT lane mapping',
    description: 'Runs the XTend-Fabric to XTendRMT schedule lane mapping gates.',
    run: () => {
      const result = runFabricRmtLaneMappingSuite({ rootDir });
      printFabricRmtLaneMappingReport(result);
      return toRunnerResult('fabric-lane-mapping', 'XTend-Fabric RMT lane mapping', result);
    }
  },
  {
    id: 'fabric-lifecycle-boundary',
    label: 'XTend-Fabric component lifecycle error boundary',
    description: 'Runs Component Lifecycle Error Boundary gates for lifecycle, hydration and event handler failures.',
    run: async () => {
      const result = await runFabricLifecycleBoundarySuite({ rootDir });
      printFabricLifecycleBoundaryReport(result);
      return toRunnerResult('fabric-lifecycle-boundary', 'XTend-Fabric component lifecycle error boundary', result);
    }
  },
  {
    id: 'fabric-reporters',
    label: 'XTend-Fabric reporter adapter contract',
    description: 'Runs Noop, Console, Test and future Enterprise reporter adapter gates.',
    run: () => {
      const result = runFabricReporterAdapterSuite({ rootDir });
      printFabricReporterAdapterReport(result);
      return toRunnerResult('fabric-reporters', 'XTend-Fabric reporter adapter contract', result);
    }
  },
  {
    id: 'fabric-runtime-bridge',
    label: 'XTend-Fabric xstate API and RMT diagnostics bridge',
    description: 'Runs xstate, XTend API and XTendRMT diagnostics bridge gates.',
    run: () => {
      const result = runFabricRuntimeDiagnosticsBridgeSuite({ rootDir });
      printFabricRuntimeDiagnosticsBridgeReport(result);
      return toRunnerResult('fabric-runtime-bridge', 'XTend-Fabric xstate API and RMT diagnostics bridge', result);
    }
  },
  {
    id: 'fabric-component-fibers',
    label: 'XTend-Fabric component mount and hydration fibers',
    description: 'Runs Component Mount, Hydration and Preload fiber instrumentation gates.',
    run: async () => {
      const result = await runFabricComponentFiberSuite({ rootDir });
      printFabricComponentFiberReport(result);
      return toRunnerResult('fabric-component-fibers', 'XTend-Fabric component mount and hydration fibers', result);
    }
  },
  {
    id: 'fabric-route-fibers',
    label: 'XTend-Fabric route navigation and render fibers',
    description: 'Runs XRouter navigation and route render fiber instrumentation gates.',
    run: async () => {
      const result = await runFabricRouteFiberSuite({ rootDir });
      printFabricRouteFiberReport(result);
      return toRunnerResult('fabric-route-fibers', 'XTend-Fabric route navigation and render fibers', result);
    }
  },
  {
    id: 'fabric-telemetry-snapshot',
    label: 'XTend-Fabric telemetry snapshots and backpressure',
    description: 'Runs telemetry snapshot, performance runtime and backpressure aggregation gates.',
    run: () => {
      const result = runFabricTelemetrySnapshotSuite({ rootDir });
      printFabricTelemetrySnapshotReport(result);
      return toRunnerResult('fabric-telemetry-snapshot', 'XTend-Fabric telemetry snapshots and backpressure', result);
    }
  },
  {
    id: 'fabric-performance-measurements',
    label: 'XTend-Fabric loader and hydration performance measurements',
    description: 'Runs Loader, Hydration, Render and Route performance measurement gates.',
    run: async () => {
      const result = await runFabricPerformanceMeasurementSuite({ rootDir });
      printFabricPerformanceMeasurementReport(result);
      return toRunnerResult('fabric-performance-measurements', 'XTend-Fabric loader and hydration performance measurements', result);
    }
  },
  {
    id: 'performance-regression',
    label: 'XTend Performance regression gates',
    description: 'Runs deterministic local Performance Budget regression gates.',
    run: async () => {
      const result = await runPerformanceRegressionSuite({ rootDir });
      printPerformanceRegressionReport(result);
      return toRunnerResult('performance-regression', 'XTend Performance regression gates', result);
    }
  },
  {
    id: 'hydration-policy',
    label: 'XTend Lazy/Idle/Visible hydration policy gates',
    description: 'Runs Lazy, Idle and Visible hydration policy gates for Fabric and RMT schedule delegation.',
    run: async () => {
      const result = await runHydrationPolicySuite({ rootDir });
      printHydrationPolicyReport(result);
      return toRunnerResult('hydration-policy', 'XTend Lazy/Idle/Visible hydration policy gates', result);
    }
  },
  {
    id: 'references',
    label: 'Documentation and demo reference paths',
    description: 'Runs documentation, demo and XTendRMT reference-path gates.',
    run: () => {
      const result = runReferencePathSuite({ rootDir });
      printReferencePathReport(result);
      return toRunnerResult('references', 'Documentation and demo reference paths', result);
    }
  },
  {
    id: 'supply-chain',
    label: 'XTend Supply-Chain policy gates',
    description: 'Runs offline dependency, license, vulnerability and release-gate policy checks.',
    run: () => {
      const result = runSupplyChainPolicySuite({ rootDir });
      printSupplyChainPolicyReport(result);
      return toRunnerResult('supply-chain', 'XTend Supply-Chain policy gates', result);
    }
  },
  {
    id: 'manifest-import-policy',
    label: 'XTend manifest and dynamic import policy gates',
    description: 'Runs local Manifest URL, dynamic import allowlist and refusal diagnostics policy checks.',
    run: () => {
      const result = runManifestImportPolicySuite({ rootDir });
      printManifestImportPolicyReport(result);
      return toRunnerResult('manifest-import-policy', 'XTend manifest and dynamic import policy gates', result);
    }
  },
  {
    id: 'rmt-compatibility',
    label: 'XTendRMT compatibility gates',
    description: 'Runs scaffold, schema, native-domain, adapter, browser-near runtime and workflow gates for RMT-compatible XTend artifacts.',
    run: () => {
      const result = runRmtCompatibilitySuite({ rootDir });
      printRmtCompatibilityReport(result);
      return toRunnerResult('rmt-compatibility', 'XTendRMT compatibility gates', result);
    }
  },
  {
    id: 'rmt-first-class-app',
    label: 'RMT-first XTend app authoring contract',
    description: 'Runs the Epic 10 RMT-first XTend app authoring fixture and registry gates.',
    run: () => {
      const result = runRmtFirstClassAppAuthoringSuite({ rootDir });
      printRmtFirstClassAppAuthoringReport(result);
      return toRunnerResult('rmt-first-class-app', 'RMT-first XTend app authoring contract', result);
    }
  },
  {
    id: 'rmt-surface-authoring',
    label: 'RMT SurfaceManager authoring contract',
    description: 'Runs the WP-SM-01 SurfaceManager RMT authoring contract, fixture and metadata gates.',
    run: () => {
      const result = runRmtSurfaceManagerAuthoringSuite({ rootDir });
      printRmtSurfaceManagerAuthoringReport(result);
      return toRunnerResult('rmt-surface-authoring', 'RMT SurfaceManager authoring contract', result);
    }
  },
  {
    id: 'rmt-app-platform-authoring',
    label: 'Epic 18 RMT App Platform authoring model',
    description: 'Runs the WP-E18-04 generic RMT App Platform authoring contract and fixture gates.',
    run: () => {
      const result = runRmtAppPlatformAuthoringSuite({ rootDir });
      printRmtAppPlatformAuthoringReport(result);
      return toRunnerResult('rmt-app-platform-authoring', 'Epic 18 RMT App Platform authoring model', result);
    }
  },
  {
    id: 'rmt-dom-descriptor-renderer',
    label: 'Epic 18 RMT DOM Descriptor renderer',
    description: 'Runs the WP-E18-05 DOM Descriptor renderer, trusted boundary and no-manual-HTML gates.',
    run: async () => {
      const result = await runRmtDomDescriptorRendererSuite({ rootDir });
      printRmtDomDescriptorRendererReport(result);
      return toRunnerResult('rmt-dom-descriptor-renderer', 'Epic 18 RMT DOM Descriptor renderer', result);
    }
  },
  {
    id: 'rmt-component-template-primitives',
    label: 'Epic 18 RMT component-native template primitives',
    description: 'Runs the WP-E18-06 component-native RMT template primitive and fixture gates.',
    run: async () => {
      const result = await runRmtComponentTemplatePrimitivesSuite({ rootDir });
      printRmtComponentTemplatePrimitivesReport(result);
      return toRunnerResult('rmt-component-template-primitives', 'Epic 18 RMT component-native template primitives', result);
    }
  },
  {
    id: 'rmt-state-selector-runtime',
    label: 'Epic 18 RMT typed state selector runtime',
    description: 'Runs the WP-E18-07 typed state, selector, reducer and xstate bridge gates.',
    run: async () => {
      const result = await runRmtStateSelectorRuntimeSuite({ rootDir });
      printRmtStateSelectorRuntimeReport(result);
      return toRunnerResult('rmt-state-selector-runtime', 'Epic 18 RMT typed state selector runtime', result);
    }
  },
  {
    id: 'rmt-action-effect-runtime',
    label: 'Epic 18 RMT action/effect runtime',
    description: 'Runs the WP-E18-08 action, effect, datasource and resource runtime gates.',
    run: async () => {
      const result = await runRmtActionEffectRuntimeSuite({ rootDir });
      printRmtActionEffectRuntimeReport(result);
      return toRunnerResult('rmt-action-effect-runtime', 'Epic 18 RMT action/effect runtime', result);
    }
  },
  {
    id: 'rmt-event-routing-runtime',
    label: 'Epic 18 RMT event routing runtime',
    description: 'Runs the WP-E18-09 declarative event routing and component interaction gates.',
    run: async () => {
      const result = await runRmtEventRoutingRuntimeSuite({ rootDir });
      printRmtEventRoutingRuntimeReport(result);
      return toRunnerResult('rmt-event-routing-runtime', 'Epic 18 RMT event routing runtime', result);
    }
  },
  {
    id: 'rmt-surface-resource-graph-runtime',
    label: 'Epic 18 RMT surface resource graph runtime',
    description: 'Runs the WP-E18-10 surface, overlay, portal and resource graph gates.',
    run: async () => {
      const result = await runRmtSurfaceResourceGraphRuntimeSuite({ rootDir });
      printRmtSurfaceResourceGraphRuntimeReport(result);
      return toRunnerResult('rmt-surface-resource-graph-runtime', 'Epic 18 RMT surface resource graph runtime', result);
    }
  },
  {
    id: 'rmt-app-platform-tooling',
    label: 'Epic 18 RMT App Platform tooling',
    description: 'Runs the WP-E18-11 scaffold, linter, LSP diagnostics and source-map build gates.',
    run: () => {
      const result = runRmtAppPlatformToolingSuite({ rootDir });
      printRmtAppPlatformToolingReport(result);
      return toRunnerResult('rmt-app-platform-tooling', 'Epic 18 RMT App Platform tooling', result);
    }
  },
  {
    id: 'rmt-app-platform-fixture',
    label: 'Epic 18 RMT App Platform fixture',
    description: 'Runs the WP-E18-12 generic App Platform fixture, runtime, scaffold and cleanup gates.',
    run: async () => {
      const result = await runRmtAppPlatformFixtureSuite({ rootDir });
      printRmtAppPlatformFixtureReport(result);
      return toRunnerResult('rmt-app-platform-fixture', 'Epic 18 RMT App Platform fixture', result);
    }
  },
  {
    id: 'rmt-native-shell-migration',
    label: 'RMT Native Shell migration gap',
    description: 'Runs the MM-RMT native shell migration transform, event, surface, player and downstream gate checks.',
    run: async () => {
      const result = await runRmtNativeShellMigrationSuite({ rootDir });
      printRmtNativeShellMigrationReport(result);
      return toRunnerResult('rmt-native-shell-migration', 'RMT Native Shell migration gap', result);
    }
  },
  {
    id: 'surface-controller',
    label: 'Surface Controller and state snapshot contract',
    description: 'Runs the WP-SM-02 Surface Controller runtime, xstate mirror and diagnostics gates.',
    run: () => {
      const result = runSurfaceControllerSuite({ rootDir });
      printSurfaceControllerReport(result);
      return toRunnerResult('surface-controller', 'Surface Controller and state snapshot contract', result);
    }
  },
  {
    id: 'surface-manager',
    label: 'SurfaceManager window runtime contract',
    description: 'Runs the WP-SM-03 x-surface-manager and x-surface-window runtime gates.',
    run: () => {
      const result = runSurfaceManagerRuntimeSuite({ rootDir });
      printSurfaceManagerRuntimeReport(result);
      return toRunnerResult('surface-manager', 'SurfaceManager window runtime contract', result);
    }
  },
  {
    id: 'surface-side-panel',
    label: 'SurfaceManager side-panel runtime contract',
    description: 'Runs the WP-SM-04 x-side-panel and responsive surface mode gates.',
    run: () => {
      const result = runSurfaceManagerSidePanelSuite({ rootDir });
      printSurfaceManagerSidePanelReport(result);
      return toRunnerResult('surface-side-panel', 'SurfaceManager side-panel runtime contract', result);
    }
  },
  {
    id: 'surface-workbench-fixture',
    label: 'SurfaceManager RMT-first Workbench fixture',
    description: 'Runs the WP-SM-05 RMT-first workbench fixture, route-bound content and snapshot gates.',
    run: () => {
      const result = runSurfaceManagerWorkbenchFixtureSuite({ rootDir });
      printSurfaceManagerWorkbenchFixtureReport(result);
      return toRunnerResult('surface-workbench-fixture', 'SurfaceManager RMT-first Workbench fixture', result);
    }
  },
  {
    id: 'surface-overlay-bridge',
    label: 'SurfaceManager overlay stack bridge',
    description: 'Runs the WP-SM-06 x-modal, x-dialog and x-drawer Surface stack compatibility gates.',
    run: () => {
      const result = runSurfaceManagerOverlayBridgeSuite({ rootDir });
      printSurfaceManagerOverlayBridgeReport(result);
      return toRunnerResult('surface-overlay-bridge', 'SurfaceManager overlay stack bridge', result);
    }
  },
  {
    id: 'surface-manager-quality',
    label: 'SurfaceManager browser, a11y, performance and visual gates',
    description: 'Runs the WP-SM-07 mixed Surface stack quality gates across browser, a11y, performance and visual domains.',
    run: () => {
      const result = runSurfaceManagerQualityGatesSuite({ rootDir });
      printSurfaceManagerQualityGatesReport(result);
      return toRunnerResult('surface-manager-quality', 'SurfaceManager browser, a11y, performance and visual gates', result);
    }
  },
  {
    id: 'surface-persistence',
    label: 'SurfaceManager restore-key and snapshot persistence',
    description: 'Runs the WP-SM-12 SurfaceManager persistence and snapshot hydration gates.',
    run: () => {
      const result = runSurfaceManagerPersistenceSuite({ rootDir });
      printSurfaceManagerPersistenceReport(result);
      return toRunnerResult('surface-persistence', 'SurfaceManager restore-key and snapshot persistence', result);
    }
  },
  {
    id: 'surface-lazy-hydration',
    label: 'SurfaceManager shell-first lazy hydration',
    description: 'Runs the WP-SM-13 SurfaceManager SkeletonLoader and lazy content hydration gates.',
    run: () => {
      const result = runSurfaceManagerLazyHydrationSuite({ rootDir });
      printSurfaceManagerLazyHydrationReport(result);
      return toRunnerResult('surface-lazy-hydration', 'SurfaceManager shell-first lazy hydration', result);
    }
  },
  {
    id: 'surface-route-lifecycle',
    label: 'SurfaceManager XRouter-bound lifecycle',
    description: 'Runs the WP-SM-14 XRouter-bound Surface lifecycle gates.',
    run: () => {
      const result = runSurfaceManagerRouteLifecycleSuite({ rootDir });
      printSurfaceManagerRouteLifecycleReport(result);
      return toRunnerResult('surface-route-lifecycle', 'SurfaceManager XRouter-bound lifecycle', result);
    }
  },
  {
    id: 'surface-stack-policy',
    label: 'SurfaceManager modal focus inert stack policy',
    description: 'Runs the WP-SM-15 mixed Surface stack policy gates for modality, focus, inert, Escape and layers.',
    run: () => {
      const result = runSurfaceManagerStackPolicySuite({ rootDir });
      printSurfaceManagerStackPolicyReport(result);
      return toRunnerResult('surface-stack-policy', 'SurfaceManager modal focus inert stack policy', result);
    }
  },
  {
    id: 'surface-layout-engines',
    label: 'SurfaceManager docking split tile layout engines',
    description: 'Runs the WP-SM-16 Surface layout engine gates for docking, split, tile, stacked and freeform bounds.',
    run: () => {
      const result = runSurfaceManagerLayoutEnginesSuite({ rootDir });
      printSurfaceManagerLayoutEnginesReport(result);
      return toRunnerResult('surface-layout-engines', 'SurfaceManager docking split tile layout engines', result);
    }
  },
  {
    id: 'surface-remote-policy',
    label: 'SurfaceManager remote surface trust policy bridge',
    description: 'Runs the WP-SM-17 Remote Surface trust, ownership, capability and degradation gates.',
    run: () => {
      const result = runSurfaceManagerRemotePolicySuite({ rootDir });
      printSurfaceManagerRemotePolicyReport(result);
      return toRunnerResult('surface-remote-policy', 'SurfaceManager remote surface trust policy bridge', result);
    }
  },
  {
    id: 'surface-browser-lab',
    label: 'SurfaceManager Browser Lab visual stability gates',
    description: 'Runs the WP-SM-18 Browser Lab, visual baseline, CLS and shell-first app-shell probe gates.',
    run: () => {
      const result = runSurfaceManagerBrowserLabSuite({ rootDir });
      printSurfaceManagerBrowserLabReport(result);
      return toRunnerResult('surface-browser-lab', 'SurfaceManager Browser Lab visual stability gates', result);
    }
  },
  {
    id: 'epic18-vendor-bugfix-smokes',
    label: 'Epic 18 vendor component bugfix smokes',
    description: 'Runs WP-E18-03 contract and browser-near regression smokes for the five vendor component backports.',
    run: () => {
      const result = runEpic18VendorBugfixSmokeSuite({ rootDir });
      printEpic18VendorBugfixSmokeReport(result);
      return toRunnerResult('epic18-vendor-bugfix-smokes', 'Epic 18 vendor component bugfix smokes', result);
    }
  },
  {
    id: 'epic18-rmt-app-platform',
    label: 'Epic 18 RMT App Platform release handoff',
    description: 'Runs the WP-E18-13 docs, migration, GitHub gates and release handoff checks.',
    run: () => {
      const result = runEpic18RmtAppPlatformReleaseHandoffSuite({ rootDir });
      printEpic18RmtAppPlatformReleaseHandoffReport(result);
      return toRunnerResult('epic18-rmt-app-platform', 'Epic 18 RMT App Platform release handoff', result);
    }
  },
  {
    id: 'surface-runtime-release-handoff',
    label: 'SurfaceManager productive runtime release handoff',
    description: 'Runs the WP-SM-19 Surface Runtime release, migration, compatibility and open-scope handoff gates.',
    run: () => {
      const result = runSurfaceManagerRuntimeReleaseHandoffSuite({ rootDir });
      printSurfaceManagerRuntimeReleaseHandoffReport(result);
      return toRunnerResult('surface-runtime-release-handoff', 'SurfaceManager productive runtime release handoff', result);
    }
  },
  {
    id: 'surface-manager-browser',
    label: 'SurfaceManager browser quality gate',
    description: 'Runs the WP-SM-07 SurfaceManager mixed-stack browser smoke contract.',
    run: () => {
      const result = runSurfaceManagerQualityGatesSuite({ rootDir, domain: 'browser' });
      printSurfaceManagerQualityGatesReport(result);
      return toRunnerResult('surface-manager-browser', 'SurfaceManager browser quality gate', result);
    }
  },
  {
    id: 'surface-manager-a11y',
    label: 'SurfaceManager a11y quality gate',
    description: 'Runs the WP-SM-07 SurfaceManager a11y contract for focus, keyboard, motion and contrast.',
    run: () => {
      const result = runSurfaceManagerQualityGatesSuite({ rootDir, domain: 'a11y' });
      printSurfaceManagerQualityGatesReport(result);
      return toRunnerResult('surface-manager-a11y', 'SurfaceManager a11y quality gate', result);
    }
  },
  {
    id: 'surface-manager-performance',
    label: 'SurfaceManager performance quality gate',
    description: 'Runs the WP-SM-07 SurfaceManager performance budget contract.',
    run: () => {
      const result = runSurfaceManagerQualityGatesSuite({ rootDir, domain: 'performance' });
      printSurfaceManagerQualityGatesReport(result);
      return toRunnerResult('surface-manager-performance', 'SurfaceManager performance quality gate', result);
    }
  },
  {
    id: 'surface-manager-visual',
    label: 'SurfaceManager visual quality gate',
    description: 'Runs the WP-SM-07 SurfaceManager DOM visual baseline contract.',
    run: () => {
      const result = runSurfaceManagerQualityGatesSuite({ rootDir, domain: 'visual' });
      printSurfaceManagerQualityGatesReport(result);
      return toRunnerResult('surface-manager-visual', 'SurfaceManager visual quality gate', result);
    }
  },
  {
    id: 'surface-native-rmt',
    label: 'SurfaceManager native RMT surfaces domain',
    description: 'Runs the WP-SM-08 native RMT surfaces domain and xtend.surface adapter handoff gates.',
    run: () => {
      const result = runSurfaceManagerNativeRmtSurfacesSuite({ rootDir });
      printSurfaceManagerNativeRmtSurfacesReport(result);
      return toRunnerResult('surface-native-rmt', 'SurfaceManager native RMT surfaces domain', result);
    }
  },
  {
    id: 'surface-release-handoff',
    label: 'SurfaceManager release handoff',
    description: 'Runs the WP-SM-09 SurfaceManager docs, Component Lab and migration handoff gates.',
    run: () => {
      const result = runSurfaceManagerReleaseHandoffSuite({ rootDir });
      printSurfaceManagerReleaseHandoffReport(result);
      return toRunnerResult('surface-release-handoff', 'SurfaceManager release handoff', result);
    }
  },
  {
    id: 'surface-adapter-runtime',
    label: 'SurfaceManager productive xtend.surface adapter runtime',
    description: 'Runs the WP-SM-10 productive xtend.surface host adapter runtime gates.',
    run: () => {
      const result = runSurfaceManagerAdapterRuntimeSuite({ rootDir });
      printSurfaceManagerAdapterRuntimeReport(result);
      return toRunnerResult('surface-adapter-runtime', 'SurfaceManager productive xtend.surface adapter runtime', result);
    }
  },
  {
    id: 'surface-native-materialization',
    label: 'SurfaceManager native surfaces materialization',
    description: 'Runs the WP-SM-11 native surfaces to XTend UI materialization gates.',
    run: () => {
      const result = runSurfaceManagerMaterializationSuite({ rootDir });
      printSurfaceManagerMaterializationReport(result);
      return toRunnerResult('surface-native-materialization', 'SurfaceManager native surfaces materialization', result);
    }
  },
  {
    id: 'rmt-component-fabric-ingestion',
    label: 'RMT XTend component Fabric/Lane ingestion',
    description: 'Runs the Epic 10 XTend component adapter Fabric/Lane ingestion gates.',
    run: () => {
      const result = runRmtComponentFabricLaneIngestionSuite({ rootDir });
      printRmtComponentFabricLaneIngestionReport(result);
      return toRunnerResult('rmt-component-fabric-ingestion', 'RMT XTend component Fabric/Lane ingestion', result);
    }
  },
  {
    id: 'rmt-component-lifecycle-telemetry',
    label: 'RMT XTend component lifecycle telemetry',
    description: 'Runs the Epic 10 XTend component lifecycle telemetry and Fabric snapshot gates.',
    run: () => {
      const result = runRmtComponentLifecycleTelemetrySuite({ rootDir });
      printRmtComponentLifecycleTelemetryReport(result);
      return toRunnerResult('rmt-component-lifecycle-telemetry', 'RMT XTend component lifecycle telemetry', result);
    }
  },
  {
    id: 'docs-rmt-pilot',
    label: 'Docs-App RMT Parsedown scheduling pilot',
    description: 'Runs the ER-WP-40 Docs-App Parsedown scheduling pilot gates.',
    run: () => {
      const result = runDocsRmtPilotSuite({ rootDir });
      printDocsRmtPilotReport(result);
      return toRunnerResult('docs-rmt-pilot', 'Docs-App RMT Parsedown scheduling pilot', result);
    }
  },
  {
    id: 'browser',
    label: 'Browser smoke harness',
    description: 'Validates Custom Element and core-flow browser smoke fixtures and optionally runs Safari WebDriver.',
    run: async () => {
      const result = await runBrowserSmokeSuite({ rootDir });
      printBrowserSmokeReport(result);
      return toRunnerResult('browser', 'Browser smoke harness', result);
    }
  }
];

function printHelp() {
  console.log(`XTend Test Runner

Usage:
  node scripts/run_xtend_tests.js [suite...] [options]
  node scripts/run_xtend_tests.js --list

Options:
  --json                 Print a machine-readable JSON summary and suppress suite detail output.
  --report <path>        Write a machine-readable JSON report to a repository-relative or absolute path.
  --help                 Show this help.

Suites:
${suites.map((suite) => `  ${suite.id.padEnd(10)} ${suite.description}`).join('\n')}

Examples:
  node scripts/run_xtend_tests.js
  node scripts/run_xtend_tests.js core
  node scripts/run_xtend_tests.js architecture
  node scripts/run_xtend_tests.js components
  node scripts/run_xtend_tests.js component-contract-v2
  node scripts/run_xtend_tests.js component-shell-contract
  node scripts/run_xtend_tests.js component-styling-contract
  node scripts/run_xtend_tests.js enterprise-component-flex-hardening-contract
  node scripts/run_xtend_tests.js enterprise-component-style-audit
  node scripts/run_xtend_tests.js enterprise-icon-control-audit
  node scripts/run_xtend_tests.js xheader-menu-modes
  node scripts/run_xtend_tests.js enterprise-overlay-mode-token-parity
  node scripts/run_xtend_tests.js enterprise-layout-display-media-tokenization
  node scripts/run_xtend_tests.js enterprise-form-control-theme-a11y
  node scripts/run_xtend_tests.js enterprise-navigation-routing-state-hardening
  node scripts/run_xtend_tests.js scaffold-write-plan
  node scripts/run_xtend_tests.js scaffold-component-write
  node scripts/run_xtend_tests.js scaffold-manifest-patch
  node scripts/run_xtend_tests.js scaffold-rmt-build
  node scripts/run_xtend_tests.js epic10-p0-component-wave
  node scripts/run_xtend_tests.js component-lab-rmt-inspector
  node scripts/run_xtend_tests.js component-lab-ux-inspector
  node scripts/run_xtend_tests.js component-ux-browser-smokes
  node scripts/run_xtend_tests.js component-shell-theme-matrix
  node scripts/run_xtend_tests.js signature-ui-visual-quality
  node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix
  node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide
  node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff
  node scripts/run_xtend_tests.js visual-snapshot-automation
  node scripts/run_xtend_tests.js visual-snapshots
  node scripts/run_xtend_tests.js design-tokens
  node scripts/run_xtend_tests.js xtheme-token-alias-layer
  node scripts/run_xtend_tests.js rmt-dsl-authoring-polish
  node scripts/run_xtend_tests.js rmt-source-model
  node scripts/run_xtend_tests.js rmt-parser
  node scripts/run_xtend_tests.js rmt-vnext-parser
  node scripts/run_xtend_tests.js rmt-vnext-compiler
  node scripts/run_xtend_tests.js rmt-vnext-source-to-sea
  node scripts/run_xtend_tests.js rmt-vnext-component-primitives
  node scripts/run_xtend_tests.js rmt-vnext-fabric-bridge
  node scripts/run_xtend_tests.js rmt-vnext-lifecycle
  node scripts/run_xtend_tests.js rmt-vnext-scheduler
  node scripts/run_xtend_tests.js rmt-vnext-surfaces
  node scripts/run_xtend_tests.js rmt-vnext-conditions
  node scripts/run_xtend_tests.js rmt-vnext-composition
  node scripts/run_xtend_tests.js rmt-vnext-imports
  node scripts/run_xtend_tests.js rmt-vnext-events
  node scripts/run_xtend_tests.js rmt-vnext-security
  node scripts/run_xtend_tests.js rmt-vnext-streaming
  node scripts/run_xtend_tests.js rmt-vnext-tooling
  node scripts/run_xtend_tests.js rmt-vnext-compatibility
  node scripts/run_xtend_tests.js rmt-vnext-regression
  node scripts/run_xtend_tests.js rmt-vnext-release
  node scripts/run_xtend_tests.js rmt-vnext-remote-manifest
  node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry
  node scripts/run_xtend_tests.js rmt-vnext-degradation
  node scripts/run_xtend_tests.js rmt-vnext-remote-security
  node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events
  node scripts/run_xtend_tests.js rmt-vnext-event-governance
  node scripts/run_xtend_tests.js rmt-vnext-remote-compiler
  node scripts/run_xtend_tests.js rmt-vnext-remote-tooling
  node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility
  node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures
  node scripts/run_xtend_tests.js rmt-vnext-enterprise-release
  node scripts/run_xtend_tests.js rmt-semantic-graph
  node scripts/run_xtend_tests.js rmt-linter-rules
  node scripts/run_xtend_tests.js rmt-linter-cli
  node scripts/run_xtend_tests.js rmt-completions
  node scripts/run_xtend_tests.js rmt-navigation
  node scripts/run_xtend_tests.js rmt-language-server
  node scripts/run_xtend_tests.js rmt-code-actions
  node scripts/run_xtend_tests.js rmt-agent-report
  node scripts/run_xtend_tests.js rmt-editor-packaging
  node scripts/run_xtend_tests.js rmt-language-regression
  node scripts/run_xtend_tests.js rmt-tooling-docs
  node scripts/run_xtend_tests.js epic14-rmt-tooling
  node scripts/run_xtend_tests.js epic14-lsp-handoff
  node scripts/run_xtend_tests.js rc0-gate-matrix
  node scripts/run_xtend_tests.js epic12-docs-adoption
  node scripts/run_xtend_tests.js epic12-rc0-handoff
  node scripts/run_xtend_tests.js epic13-rc1-readiness
  node scripts/run_xtend_tests.js epic13-release-owner-acceptance
  node scripts/run_xtend_tests.js epic13-conditional-network-evidence
  node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci
  node scripts/run_xtend_tests.js epic13-package-export-lock
  node scripts/run_xtend_tests.js type-exports
  node scripts/run_xtend_tests.js type-exports-loader
  node scripts/run_xtend_tests.js type-exports-api
  node scripts/run_xtend_tests.js type-exports-rmt
  node scripts/run_xtend_tests.js type-exports-policy
  node scripts/run_xtend_tests.js type-exports-builder
  node scripts/run_xtend_tests.js type-exports-catalog
  node scripts/run_xtend_tests.js type-exports-vendor
  node scripts/run_xtend_tests.js epic13-known-residual-triage
  node scripts/run_xtend_tests.js epic13-hydration-performance-closure
  node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke
  node scripts/run_xtend_tests.js epic13-visual-owner-artifact
  node scripts/run_xtend_tests.js epic13-rmt-production-readiness
  node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening
  node scripts/run_xtend_tests.js epic13-trusted-dom-boundary
  node scripts/run_xtend_tests.js epic13-rc1-migration-notes
  node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff
  node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence
  node scripts/run_xtend_tests.js component-ux-authoring-docs
  node scripts/run_xtend_tests.js component-long-tail-migration
  node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff
  node scripts/run_xtend_tests.js rmt-lifecycle-demo
  node scripts/run_xtend_tests.js a11y-hydration
  node scripts/run_xtend_tests.js screenreader-signals
  node scripts/run_xtend_tests.js motion-contrast
  node scripts/run_xtend_tests.js runtime-a11y-contract
  node scripts/run_xtend_tests.js component-ux-performance
  node scripts/run_xtend_tests.js component-network-contract
  node scripts/run_xtend_tests.js rmt-shell-authoring-ux
  node scripts/run_xtend_tests.js form-controls-ux
  node scripts/run_xtend_tests.js catalog-coverage
  node scripts/run_xtend_tests.js regression-priority
  node scripts/run_xtend_tests.js fabric
  node scripts/run_xtend_tests.js fabric-lane-mapping
  node scripts/run_xtend_tests.js fabric-lifecycle-boundary
  node scripts/run_xtend_tests.js fabric-reporters
  node scripts/run_xtend_tests.js fabric-runtime-bridge
  node scripts/run_xtend_tests.js fabric-component-fibers
  node scripts/run_xtend_tests.js fabric-route-fibers
  node scripts/run_xtend_tests.js fabric-telemetry-snapshot
  node scripts/run_xtend_tests.js fabric-performance-measurements
  node scripts/run_xtend_tests.js performance-regression
  node scripts/run_xtend_tests.js hydration-policy
  node scripts/run_xtend_tests.js references
  node scripts/run_xtend_tests.js supply-chain
	  node scripts/run_xtend_tests.js manifest-import-policy
  node scripts/run_xtend_tests.js rmt-compatibility
  node scripts/run_xtend_tests.js rmt-first-class-app
  node scripts/run_xtend_tests.js rmt-surface-authoring
  node scripts/run_xtend_tests.js rmt-app-platform-authoring
  node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer
  node scripts/run_xtend_tests.js rmt-component-template-primitives
  node scripts/run_xtend_tests.js rmt-state-selector-runtime
  node scripts/run_xtend_tests.js rmt-action-effect-runtime
  node scripts/run_xtend_tests.js rmt-event-routing-runtime
  node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime
  node scripts/run_xtend_tests.js rmt-app-platform-tooling
  node scripts/run_xtend_tests.js rmt-app-platform-fixture
  node scripts/run_xtend_tests.js rmt-native-shell-migration
  node scripts/run_xtend_tests.js epic18-rmt-app-platform
  node scripts/run_xtend_tests.js surface-controller
  node scripts/run_xtend_tests.js surface-manager
  node scripts/run_xtend_tests.js surface-side-panel
  node scripts/run_xtend_tests.js surface-workbench-fixture
  node scripts/run_xtend_tests.js surface-overlay-bridge
  node scripts/run_xtend_tests.js surface-manager-quality
  node scripts/run_xtend_tests.js surface-manager-browser
  node scripts/run_xtend_tests.js surface-manager-a11y
  node scripts/run_xtend_tests.js surface-manager-performance
  node scripts/run_xtend_tests.js surface-manager-visual
  node scripts/run_xtend_tests.js surface-adapter-runtime
  node scripts/run_xtend_tests.js surface-native-materialization
  node scripts/run_xtend_tests.js surface-persistence
  node scripts/run_xtend_tests.js surface-lazy-hydration
  node scripts/run_xtend_tests.js surface-route-lifecycle
  node scripts/run_xtend_tests.js surface-stack-policy
  node scripts/run_xtend_tests.js surface-layout-engines
  node scripts/run_xtend_tests.js surface-remote-policy
  node scripts/run_xtend_tests.js surface-browser-lab
  node scripts/run_xtend_tests.js epic18-vendor-bugfix-smokes
  node scripts/run_xtend_tests.js surface-runtime-release-handoff
  node scripts/run_xtend_tests.js rmt-component-fabric-ingestion
	  node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry
	  node scripts/run_xtend_tests.js docs-rmt-pilot
	  node scripts/run_xtend_tests.js browser
  node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json
  node scripts/run_xtend_tests.js core architecture --json
`);
}

function printSuites() {
  suites.forEach((suite) => {
    console.log(`${suite.id}\t${suite.label}\t${suite.description}`);
  });
}

function resolveRequestedSuites(requested) {
  if (requested.length === 0 || requested.includes('all')) {
    return suites;
  }

  const selected = [];
  const unknown = [];

  requested.forEach((id) => {
    const suite = suites.find((candidate) => candidate.id === id);
    if (suite) {
      selected.push(suite);
      return;
    }
    unknown.push(id);
  });

  if (unknown.length > 0) {
    console.error(`Unknown XTend test suite: ${unknown.join(', ')}`);
    console.error('Run `node scripts/run_xtend_tests.js --list` to see available suites.');
    process.exit(1);
  }

  return selected;
}

function parseArgs(args) {
  const options = {
    help: false,
    list: false,
    json: false,
    reportPath: null,
    suiteIds: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list') {
      options.list = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--report') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        console.error('Missing value for --report.');
        process.exit(1);
      }
      options.reportPath = value;
      index += 1;
    } else if (arg.startsWith('--report=')) {
      options.reportPath = arg.slice('--report='.length);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown XTend test runner option: ${arg}`);
      console.error('Run `node scripts/run_xtend_tests.js --help` to see available options.');
      process.exit(1);
    } else {
      options.suiteIds.push(arg);
    }
  }

  return options;
}

async function withMutedConsole(task) {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await task();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

function runSuite(suite, options = {}) {
  if (!options.json) {
    console.log(`\n== ${suite.label} ==\n`);
  }

  return suite.run();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (options.list) {
    printSuites();
    return;
  }

  const selectedSuites = resolveRequestedSuites(options.suiteIds);
  const results = [];
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  for (const suite of selectedSuites) {
    const run = () => runSuite(suite, options);
    results.push(options.json ? await withMutedConsole(run) : await run());
  }
  const completed = Date.now();
  const summary = createRunSummary(results, {
    startedAt,
    completedAt: new Date(completed).toISOString(),
    durationMs: completed - started
  });

  if (options.reportPath) {
    const reportPath = writeJsonReport(summary, options.reportPath, rootDir);
    if (!options.json) {
      console.log(`\nXTend JSON report written: ${reportPath}`);
    }
  }

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printTextSummary(summary);
  }

  if (summary.status !== 'passed') {
    const failed = summary.suites.find((suite) => suite.status !== 'passed');
    process.exit((failed && failed.exitCode) || 1);
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
