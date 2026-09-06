'use strict';
// Lazy compatibility adapters. Registration and profile data live in catalog.json.
const path = require('path');
const { createRequire } = require('module');
const rootDir = path.resolve(__dirname, '../..');
const load = createRequire(path.join(rootDir, 'scripts/run_xtend_tests.js'));

function toRunnerResult(id, label, result) {
  const failures = Array.isArray(result.failures) ? result.failures : [];
  const skips = Array.isArray(result.skips) ? result.skips : [];
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const ok = result.ok === true && result.status !== 'failed' && (result.exitCode === undefined || result.exitCode === 0);
  const runnerResult = {
    id,
    label,
    status: ok ? 'passed' : 'failed',
    exitCode: ok ? 0 : 1,
    passCount: Array.isArray(result.passes) ? result.passes.length : 0,
    failureCount: Math.max(Number.isInteger(result.failureCount) ? result.failureCount : 0, failures.length),
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

function runDocsStubInventoryGate() {
  const report = load("./create_docs_stub_inventory")["createDocsStubInventory"]({ rootDir, threshold: load("./create_docs_stub_inventory")["DEFAULT_MIN_GUIDE_CHARS"] });
  const failures = [];
  if (report.stubSlugCount > 0 || report.stubArticleCount > 0) {
    failures.push({
      message: `Docs stub inventory found ${report.stubSlugCount} stub slugs and ${report.stubArticleCount} stub articles below ${report.threshold} non-code chars.`,
      stubSlugs: report.stubSlugs
    });
  }
  return {
    ok: failures.length === 0,
    passes: failures.length === 0 ? [
      `No visible non-component docs stubs below ${report.threshold} non-code chars.`
    ] : [],
    failures,
    warnings: [],
    report
  };
}

function printDocsStubInventoryGateReport(result) {
  const report = result.report || {};
  console.log(`XTend docs stub inventory checked (${report.guideSlugCount || 0} guide slugs, ${report.guideArticleCount || 0} localized articles).`);
  console.log(`Stub threshold: ${report.threshold || load("./create_docs_stub_inventory")["DEFAULT_MIN_GUIDE_CHARS"]} non-code chars.`);
  console.log(`Stub slugs: ${report.stubSlugCount || 0}; stub articles: ${report.stubArticleCount || 0}.`);
  if (Array.isArray(report.stubSlugs) && report.stubSlugs.length) {
    console.log(`Stub slugs: ${report.stubSlugs.join(', ')}`);
  }
}

module.exports = {
"project-index": () => {
      const result = load("../tests/rmt-language/project_index_suite")["runProjectIndexSuite"]({ rootDir });
      load("../tests/rmt-language/project_index_suite")["printProjectIndexReport"](result);
      return toRunnerResult('project-index', 'Shared project index', result);
    },
"node-runtime-policy": () => {
      const result = load("../tests/platform/node_runtime_policy_suite")["runNodeRuntimePolicySuite"]({ rootDir });
      load("../tests/platform/node_runtime_policy_suite")["printNodeRuntimePolicyReport"](result);
      return toRunnerResult('node-runtime-policy', 'Node 24/26 runtime and support policy', result);
    },
"core": () => {
      const result = load("../tests/core/core_contract_suite")["runCoreContractSuite"]({ rootDir });
      load("../tests/core/core_contract_suite")["printCoreContractReport"](result);
      return toRunnerResult('core', 'Core contract verification', result);
    },
"architecture": () => {
      const result = load("../tests/core/architecture_gate_suite")["runArchitectureGateSuite"]({ rootDir });
      load("../tests/core/architecture_gate_suite")["printArchitectureGateReport"](result);
      return toRunnerResult('architecture', 'Architecture quality gates', result);
    },
"xtend-material-architecture": () => {
      const result = load("../tests/material/xtend_material_architecture_suite")["runXtendMaterialArchitectureSuite"]({ rootDir });
      load("../tests/material/xtend_material_architecture_suite")["printXtendMaterialArchitectureReport"](result);
      return toRunnerResult('xtend-material-architecture', 'XTend Material Tailwind architecture decision', result);
    },
"xtend-material-contract": () => {
      const result = load("../tests/material/material_design_kit_contract_suite")["runMaterialDesignKitContractSuite"]({ rootDir });
      load("../tests/material/material_design_kit_contract_suite")["printMaterialDesignKitContractReport"](result);
      return toRunnerResult('xtend-material-contract', 'XTend Material Design Kit Contract', result);
    },
"package-exports": () => {
      const result = load("../tests/material/material_design_kit_contract_suite")["runXtendMaterialPackageExportsSuite"]({ rootDir });
      load("../tests/material/material_design_kit_contract_suite")["printXtendMaterialPackageExportsReport"](result);
      return toRunnerResult('package-exports', 'XTend Material Package Exports', result);
    },
"xtend-material-shell-recipes": async () => {
      const result = await load("../tests/material/material_shell_recipes_suite")["runMaterialShellRecipesSuite"]({ rootDir });
      load("../tests/material/material_shell_recipes_suite")["printMaterialShellRecipesReport"](result);
      return toRunnerResult('xtend-material-shell-recipes', 'XTend Material Shell Recipes', result);
    },
"xtend-material-flow-recipes": async () => {
      const result = await load("../tests/material/material_flow_recipes_suite")["runMaterialFlowRecipesSuite"]({ rootDir });
      load("../tests/material/material_flow_recipes_suite")["printMaterialFlowRecipesReport"](result);
      return toRunnerResult('xtend-material-flow-recipes', 'XTend Material Flow Recipes', result);
    },
"xtend-material-scaffold": async () => {
      const result = await load("../tests/builder/xtend_material_scaffold_suite")["runXtendMaterialScaffoldSuite"]({ rootDir });
      load("../tests/builder/xtend_material_scaffold_suite")["printXtendMaterialScaffoldReport"](result);
      return toRunnerResult('xtend-material-scaffold', 'XTend Material App Scaffold', result);
    },
"xtend-rmt-app-scaffold": () => {
      const result = load("../tests/builder/xtend_rmt_app_scaffold_suite")["runXtendRmtAppScaffoldSuite"]({ rootDir });
      load("../tests/builder/xtend_rmt_app_scaffold_suite")["printXtendRmtAppScaffoldReport"](result);
      return toRunnerResult('xtend-rmt-app-scaffold', 'Provider-neutraler XTend RMT App Scaffold', result);
    },
"maraca-css-provider": async () => {
      const result = await load("../tests/maraca/maraca_css_provider_contract_suite")["runMaracaCssProviderContractSuite"]({ rootDir });
      load("../tests/maraca/maraca_css_provider_contract_suite")["printMaracaCssProviderContractReport"](result);
      return toRunnerResult('maraca-css-provider', 'Maraca CSS Provider Contract', result);
    },
"maraca-tailwind-css-provider": async () => {
      const result = await load("../tests/maraca/maraca_tailwind_css_provider_suite")["runMaracaTailwindCssProviderSuite"]({ rootDir });
      load("../tests/maraca/maraca_tailwind_css_provider_suite")["printMaracaTailwindCssProviderReport"](result);
      return toRunnerResult('maraca-tailwind-css-provider', 'Maraca Tailwind CSS Provider', result);
    },
"rmt-tailwind-source-inventory": async () => {
      const result = await load("../tests/rmt/rmt_tailwind_source_inventory_suite")["runRmtTailwindSourceInventorySuite"]({ rootDir });
      load("../tests/rmt/rmt_tailwind_source_inventory_suite")["printRmtTailwindSourceInventoryReport"](result);
      return toRunnerResult('rmt-tailwind-source-inventory', 'RMT Tailwind Source Inventory', result);
    },
"components": () => {
      const result = load("../tests/components/component_suite")["runComponentSuites"]({ rootDir });
      load("../tests/components/component_suite")["printComponentSuitesReport"](result);
      return toRunnerResult('components', 'Component-level contract suites', result);
    },
"component-contract-v2": () => {
      const result = load("../tests/components/component_contract_v2_suite")["runComponentContractV2Suite"]({ rootDir });
      load("../tests/components/component_contract_v2_suite")["printComponentContractV2Report"](result);
      return toRunnerResult('component-contract-v2', 'XTend Component Contract v2', result);
    },
"component-shell-contract": () => {
      const result = load("../tests/components/component_shell_contract_suite")["runComponentShellContractSuite"]({ rootDir });
      load("../tests/components/component_shell_contract_suite")["printComponentShellContractReport"](result);
      return toRunnerResult('component-shell-contract', 'XTend Component Shell Contract', result);
    },
"component-styling-contract": () => {
      const result = load("../tests/components/component_styling_contract_suite")["runComponentStylingContractSuite"]({ rootDir });
      load("../tests/components/component_styling_contract_suite")["printComponentStylingContractReport"](result);
      return toRunnerResult('component-styling-contract', 'XTend Component Styling Contract', result);
    },
"enterprise-component-flex-hardening-contract": () => {
      const result = load("../tests/components/enterprise_component_flex_hardening_contract_suite")["runEnterpriseComponentFlexHardeningContractSuite"]({ rootDir });
      load("../tests/components/enterprise_component_flex_hardening_contract_suite")["printEnterpriseComponentFlexHardeningContractReport"](result);
      return toRunnerResult('enterprise-component-flex-hardening-contract', 'ECH-WP-01 Enterprise Component Flex Hardening Contract', result);
    },
"enterprise-component-style-audit": () => {
      const result = load("../tests/components/enterprise_component_style_audit_suite")["runEnterpriseComponentStyleAuditSuite"]({ rootDir });
      load("../tests/components/enterprise_component_style_audit_suite")["printEnterpriseComponentStyleAuditReport"](result);
      return toRunnerResult('enterprise-component-style-audit', 'ECH-WP-02 Enterprise Component Style Audit', result);
    },
"enterprise-icon-control-audit": () => {
      const result = load("../tests/components/enterprise_icon_control_audit_suite")["runEnterpriseIconControlAuditSuite"]({ rootDir });
      load("../tests/components/enterprise_icon_control_audit_suite")["printEnterpriseIconControlAuditReport"](result);
      return toRunnerResult('enterprise-icon-control-audit', 'ECH-WP-04 Enterprise Icon Control Audit', result);
    },
"xheader-menu-modes": () => {
      const result = load("../tests/components/xheader_menu_modes_suite")["runXHeaderMenuModesSuite"]({ rootDir });
      load("../tests/components/xheader_menu_modes_suite")["printXHeaderMenuModesReport"](result);
      return toRunnerResult('xheader-menu-modes', 'ECH-WP-05 XHeader Menu Presentation Modes', result);
    },
"enterprise-overlay-mode-token-parity": () => {
      const result = load("../tests/components/enterprise_overlay_mode_token_parity_suite")["runEnterpriseOverlayModeTokenParitySuite"]({ rootDir });
      load("../tests/components/enterprise_overlay_mode_token_parity_suite")["printEnterpriseOverlayModeTokenParityReport"](result);
      return toRunnerResult('enterprise-overlay-mode-token-parity', 'ECH-WP-06 Enterprise Overlay Mode/Token Parity', result);
    },
"enterprise-layout-display-media-tokenization": () => {
      const result = load("../tests/components/enterprise_layout_display_media_tokenization_suite")["runEnterpriseLayoutDisplayMediaTokenizationSuite"]({ rootDir });
      load("../tests/components/enterprise_layout_display_media_tokenization_suite")["printEnterpriseLayoutDisplayMediaTokenizationReport"](result);
      return toRunnerResult('enterprise-layout-display-media-tokenization', 'ECH-WP-07 Enterprise Layout Display/Media Tokenization', result);
    },
"enterprise-form-control-theme-a11y": () => {
      const result = load("../tests/components/enterprise_form_control_theme_a11y_suite")["runEnterpriseFormControlThemeA11ySuite"]({ rootDir });
      load("../tests/components/enterprise_form_control_theme_a11y_suite")["printEnterpriseFormControlThemeA11yReport"](result);
      return toRunnerResult('enterprise-form-control-theme-a11y', 'ECH-WP-08 Enterprise Form Control Theme/A11y Hardening', result);
    },
"enterprise-navigation-routing-state-hardening": () => {
      const result = load("../tests/components/enterprise_navigation_routing_state_hardening_suite")["runEnterpriseNavigationRoutingStateHardeningSuite"]({ rootDir });
      load("../tests/components/enterprise_navigation_routing_state_hardening_suite")["printEnterpriseNavigationRoutingStateHardeningReport"](result);
      return toRunnerResult('enterprise-navigation-routing-state-hardening', 'ECH-WP-09 Enterprise Navigation Routing State Hardening', result);
    },
"builder-typescript-blueprint": () => {
      const result = load("../tests/builder/typescript_component_blueprint_suite")["runBuilderTypeScriptBlueprintSuite"]({ rootDir });
      load("../tests/builder/typescript_component_blueprint_suite")["printBuilderTypeScriptBlueprintReport"](result);
      return toRunnerResult('builder-typescript-blueprint', 'XTend Builder TypeScript Component Blueprint', result);
    },
"typescript-components": () => {
      const result = load("../tests/builder/typescript_components_build_suite")["runTypeScriptComponentsBuildSuite"]({ rootDir });
      load("../tests/builder/typescript_components_build_suite")["printTypeScriptComponentsBuildReport"](result);
      return toRunnerResult('typescript-components', 'XTend TypeScript Components Build', result);
    },
"scaffold-write-plan": () => {
      const result = load("../tests/builder/scaffold_write_plan_suite")["runScaffoldWritePlanSuite"]({ rootDir });
      load("../tests/builder/scaffold_write_plan_suite")["printScaffoldWritePlanReport"](result);
      return toRunnerResult('scaffold-write-plan', 'XTend Scaffold WritePlan', result);
    },
"scaffold-ownership": () => {
      const result = load("../tests/builder/scaffold_write_plan_suite")["runScaffoldWritePlanSuite"]({ rootDir });
      load("../tests/builder/scaffold_write_plan_suite")["printScaffoldWritePlanReport"](result);
      return toRunnerResult('scaffold-ownership', 'XTend Scaffold Ownership', result);
    },
"scaffold-component-write": () => {
      const result = load("../tests/builder/scaffold_component_write_suite")["runScaffoldComponentWriteSuite"]({ rootDir });
      load("../tests/builder/scaffold_component_write_suite")["printScaffoldComponentWriteReport"](result);
      return toRunnerResult('scaffold-component-write', 'XTend Scaffold Component Write', result);
    },
"scaffold-manifest-patch": () => {
      const result = load("../tests/builder/scaffold_manifest_patch_suite")["runScaffoldManifestPatchSuite"]({ rootDir });
      load("../tests/builder/scaffold_manifest_patch_suite")["printScaffoldManifestPatchReport"](result);
      return toRunnerResult('scaffold-manifest-patch', 'XTend Scaffold Manifest Patch', result);
    },
"scaffold-rmt-build": () => {
      const result = load("../tests/builder/scaffold_rmt_build_suite")["runScaffoldRmtBuildSuite"]({ rootDir });
      load("../tests/builder/scaffold_rmt_build_suite")["printScaffoldRmtBuildReport"](result);
      return toRunnerResult('scaffold-rmt-build', 'XTend Scaffold RMT Build', result);
    },
"scaffold-kernel-lab": () => {
      const result = load("../tests/builder/scaffold_kernel_lab_suite")["runScaffoldKernelLabSuite"]({ rootDir });
      load("../tests/builder/scaffold_kernel_lab_suite")["printScaffoldKernelLabReport"](result);
      return toRunnerResult('scaffold-kernel-lab', 'XTend Scaffold RMT KernelLab', result);
    },
"rmt-artifact-parity": () => {
      const report = load("./verify_xtendrmt_artifact_parity")["runXtendRmtArtifactParity"]();
      const result = {
        ok: report.ok,
        passes: report.checks.filter((entry) => entry.status === 'passed'),
        failures: report.checks.filter((entry) => entry.status === 'failed').map((entry) => entry.message),
        skips: [],
        warnings: [],
        report
      };
      return toRunnerResult('rmt-artifact-parity', 'XTendRMT Artifact Parity', result);
    },
"epic10-p0-component-wave": () => {
      const result = load("../tests/components/epic10_p0_component_wave_suite")["runEpic10P0ComponentWaveSuite"]({ rootDir });
      load("../tests/components/epic10_p0_component_wave_suite")["printEpic10P0ComponentWaveReport"](result);
      return toRunnerResult('epic10-p0-component-wave', 'Epic 10 P0 Component Wave Contract', result);
    },
"component-lab-rmt-inspector": () => {
      const result = load("../tests/builder/component_lab_rmt_inspector_suite")["runComponentLabRmtInspectorSuite"]({ rootDir });
      load("../tests/builder/component_lab_rmt_inspector_suite")["printComponentLabRmtInspectorReport"](result);
      return toRunnerResult('component-lab-rmt-inspector', 'Epic 10 Component Lab and RMT Inspector Pilot', result);
    },
"component-lab-ux-inspector": () => {
      const result = load("../tests/builder/component_lab_ux_inspector_suite")["runComponentLabUxInspectorSuite"]({ rootDir });
      load("../tests/builder/component_lab_ux_inspector_suite")["printComponentLabUxInspectorReport"](result);
      return toRunnerResult('component-lab-ux-inspector', 'Epic 11 Component Lab UX Inspector', result);
    },
"component-ux-browser-smokes": () => {
      const result = load("../tests/browser/component_ux_browser_smoke_suite")["runComponentUxBrowserSmokeSuite"]({ rootDir });
      load("../tests/browser/component_ux_browser_smoke_suite")["printComponentUxBrowserSmokeReport"](result);
      return toRunnerResult('component-ux-browser-smokes', 'Epic 11 Component UX browser smokes', result);
    },
"component-shell-theme-matrix": () => {
      const result = load("../tests/browser/component_shell_theme_matrix_suite")["runComponentShellThemeMatrixSuite"]({ rootDir });
      load("../tests/browser/component_shell_theme_matrix_suite")["printComponentShellThemeMatrixReport"](result);
      return toRunnerResult('component-shell-theme-matrix', 'Epic 11 Component Shell Theme Matrix', result);
    },
"signature-ui-visual-quality": () => {
      const result = load("../tests/browser/signature_ui_visual_quality_suite")["runSignatureUiVisualQualitySuite"]({ rootDir });
      load("../tests/browser/signature_ui_visual_quality_suite")["printSignatureUiVisualQualityReport"](result);
      return toRunnerResult('signature-ui-visual-quality', 'ECH-WP-00 XTend Signature UI Visual Quality', result);
    },
"enterprise-visual-dom-snapshot-matrix": () => {
      const result = load("../tests/browser/enterprise_visual_dom_snapshot_matrix_suite")["runEnterpriseVisualDomSnapshotMatrixSuite"]({ rootDir });
      load("../tests/browser/enterprise_visual_dom_snapshot_matrix_suite")["printEnterpriseVisualDomSnapshotMatrixReport"](result);
      return toRunnerResult('enterprise-visual-dom-snapshot-matrix', 'ECH-WP-10 Enterprise Visual DOM Snapshot Matrix', result);
    },
"enterprise-third-party-authoring-guide": () => {
      const result = load("../tests/docs/enterprise_third_party_authoring_guide_suite")["runEnterpriseThirdPartyAuthoringGuideSuite"]({ rootDir });
      load("../tests/docs/enterprise_third_party_authoring_guide_suite")["printEnterpriseThirdPartyAuthoringGuideReport"](result);
      return toRunnerResult('enterprise-third-party-authoring-guide', 'ECH-WP-11 Enterprise Third-Party Authoring Guide', result);
    },
"enterprise-component-flex-release-handoff": () => {
      const result = load("../tests/platform/enterprise_component_flex_release_handoff_suite")["runEnterpriseComponentFlexReleaseHandoffSuite"]({ rootDir });
      load("../tests/platform/enterprise_component_flex_release_handoff_suite")["printEnterpriseComponentFlexReleaseHandoffReport"](result);
      return toRunnerResult('enterprise-component-flex-release-handoff', 'ECH-WP-12 Enterprise Component Flex Release Handoff', result);
    },
"visual-snapshot-automation": () => {
      const result = load("../tests/browser/visual_snapshot_automation_suite")["runVisualSnapshotAutomationSuite"]({ rootDir });
      load("../tests/browser/visual_snapshot_automation_suite")["printVisualSnapshotAutomationReport"](result);
      return toRunnerResult('visual-snapshot-automation', 'Epic 12 Visual Snapshot Automation Contract', result);
    },
"visual-snapshots": () => {
      const result = load("../tests/browser/visual_snapshots_suite")["runVisualSnapshotsSuite"]({ rootDir });
      load("../tests/browser/visual_snapshots_suite")["printVisualSnapshotsReport"](result);
      return toRunnerResult('visual-snapshots', 'Epic 12 Visual Snapshot local DOM diff runner', result);
    },
"xtend-material-browser-evidence": async () => {
      const result = await load("../tests/browser/material_browser_evidence_suite")["runMaterialBrowserEvidenceSuite"]({ rootDir });
      load("../tests/browser/material_browser_evidence_suite")["printMaterialBrowserEvidenceReport"](result);
      return toRunnerResult('xtend-material-browser-evidence', 'XTM-10 XTend Material Browser Evidence', result);
    },
"design-tokens": () => {
      const result = load("../tests/tokens/design_token_contract_suite")["runDesignTokenContractSuite"]({ rootDir });
      load("../tests/tokens/design_token_contract_suite")["printDesignTokenContractReport"](result);
      return toRunnerResult('design-tokens', 'Epic 12 Enterprise Design System Tokens', result);
    },
"xtheme-token-alias-layer": () => {
      const result = load("../tests/tokens/xtheme_token_alias_layer_suite")["runXThemeTokenAliasLayerSuite"]({ rootDir });
      load("../tests/tokens/xtheme_token_alias_layer_suite")["printXThemeTokenAliasLayerReport"](result);
      return toRunnerResult('xtheme-token-alias-layer', 'ECH-WP-03 XTheme Token Alias Layer', result);
    },
"tailwind-token-bridge": async () => {
      const result = await load("../tests/tokens/tailwind_token_bridge_suite")["runTailwindTokenBridgeSuite"]({ rootDir });
      load("../tests/tokens/tailwind_token_bridge_suite")["printTailwindTokenBridgeReport"](result);
      return toRunnerResult('tailwind-token-bridge', 'XTM-05 Tailwind Token Bridge', result);
    },
"rmt-dsl-authoring-polish": () => {
      const result = load("../tests/rmt/rmt_dsl_authoring_polish_suite")["runRmtDslAuthoringPolishSuite"]({ rootDir });
      load("../tests/rmt/rmt_dsl_authoring_polish_suite")["printRmtDslAuthoringPolishReport"](result);
      return toRunnerResult('rmt-dsl-authoring-polish', 'Epic 12 RMT DSL Authoring Polish', result);
    },
"rmt-source-model": () => {
      const result = load("../tests/rmt-language/rmt_source_model_suite")["runRmtSourceModelSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_source_model_suite")["printRmtSourceModelReport"](result);
      return toRunnerResult('rmt-source-model', 'Epic 14 RMT Source Model and Range Mapping', result);
    },
"rmt-parser": () => {
      const result = load("../tests/rmt-language/rmt_parser_suite")["runRmtParserSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_parser_suite")["printRmtParserReport"](result);
      return toRunnerResult('rmt-parser', 'Epic 14 RMT Parser and Format Adapter', result);
    },
"rmt-vnext-parser": () => {
      const result = load("../tests/rmt-language/rmt_vnext_parser_suite")["runRmtVNextParserSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_parser_suite")["printRmtVNextParserReport"](result);
      return toRunnerResult('rmt-vnext-parser', 'Epic 15 RMT vNext Lexer and Parser MVP', result);
    },
"rmt-vnext-compiler": () => {
      const result = load("../tests/rmt-language/rmt_vnext_compiler_suite")["runRmtVNextCompilerSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_compiler_suite")["printRmtVNextCompilerReport"](result);
      return toRunnerResult('rmt-vnext-compiler', 'Epic 15 RMT vNext Compiler to Core', result);
    },
"rmt-vnext-source-to-sea": async () => {
      const result = await load("../tests/rmt-language/rmt_vnext_source_to_sea_suite")["runRmtVNextSourceToSeaSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_source_to_sea_suite")["printRmtVNextSourceToSeaReport"](result);
      return toRunnerResult('rmt-vnext-source-to-sea', 'RMT vNext Source-to-Sea Browser Gate', result);
    },
"rmt-vnext-component-primitives": async () => {
      const result = await load("../tests/rmt-language/rmt_vnext_component_primitives_suite")["runRmtVNextComponentPrimitivesSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_component_primitives_suite")["printRmtVNextComponentPrimitivesReport"](result);
      return toRunnerResult('rmt-vnext-component-primitives', 'RMT vNext XTend Component Primitive Compatibility', result);
    },
"rmt-node-ssr-adapter": async () => {
      const result = await load("../tests/rmt-language/rmt_node_ssr_adapter_suite")["runRmtNodeSsrAdapterSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_node_ssr_adapter_suite")["printRmtNodeSsrAdapterReport"](result);
      return toRunnerResult('rmt-node-ssr-adapter', 'RMT Node SSR Adapter', result);
    },
"ssr-pages-php": async () => toRunnerResult('ssr-pages-php', 'Portable Node/PHP render parity', await load('../tests/ssr-pages/ssr_pages_suite').runPhpPageParitySuite({ rootDir })),
"ssr-pages": async () => toRunnerResult('ssr-pages', 'Shared page contracts and Node host', await load('../tests/ssr-pages/ssr_pages_suite').runSsrPagesSuite({ rootDir })),
"ssr-pages-browser": async () => toRunnerResult('ssr-pages-browser', 'Node page browser lifecycle', await load('../tests/ssr-pages/node_browser_suite').runNodePageBrowserSuite({ rootDir })),
"ssr-pages-laravel": () => toRunnerResult('ssr-pages-laravel', 'Isolated Laravel package integration', load('../tests/ssr-pages/laravel_integration_suite').runLaravelIntegrationSuite({ rootDir })),
"ssr-pages-laravel-browser": async () => toRunnerResult('ssr-pages-laravel-browser', 'Laravel page browser lifecycle', await load('../tests/ssr-pages/laravel_browser_suite').runLaravelPageBrowserSuite({ rootDir })),
"rmt-resume-runtime": async () => {
      const result = await load("../tests/rmt-language/rmt_resume_runtime_suite")["runRmtResumeRuntimeSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_resume_runtime_suite")["printRmtResumeRuntimeReport"](result);
      return toRunnerResult('rmt-resume-runtime', 'RMT Resume Runtime', result);
    },
"rmt-php-ssr-adapter": async () => {
      const result = await load("../tests/rmt-language/rmt_php_ssr_adapter_suite")["runRmtPhpSsrAdapterSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_php_ssr_adapter_suite")["printRmtPhpSsrAdapterReport"](result);
      return toRunnerResult('rmt-php-ssr-adapter', 'RMT PHP/Laravel SSR Adapter', result);
    },
"rmt-php-app-service-adapter": async () => {
      const result = await load("../tests/rmt-language/rmt_php_app_service_adapter_suite")["runRmtPhpAppServiceAdapterSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_php_app_service_adapter_suite")["printRmtPhpAppServiceAdapterReport"](result);
      return toRunnerResult('rmt-php-app-service-adapter', 'RMT PHP AppService Adapter', result);
    },
"scoped-package-readmes": () => {
      const result = load("../tests/docs/scoped_package_readmes_suite")["runScopedPackageReadmesSuite"]({ rootDir });
      load("../tests/docs/scoped_package_readmes_suite")["printScopedPackageReadmesReport"](result);
      return toRunnerResult('scoped-package-readmes', 'Scoped Package bilingual READMEs', result);
    },
"xtend-classic-branding": () => {
      const result = load("../tests/docs/xtend_classic_branding_suite")["runXtendClassicBrandingSuite"]({ rootDir });
      load("../tests/docs/xtend_classic_branding_suite")["printXtendClassicBrandingReport"](result);
      return toRunnerResult('xtend-classic-branding', 'XTend Classic product branding', result);
    },
"docs-public-quality": () => {
      const result = load("./verify_docs_public_quality")["runDocsPublicQualityCheck"]({ rootDir });
      load("./verify_docs_public_quality")["printDocsPublicQualityReport"](result);
      return toRunnerResult('docs-public-quality', 'Docs Public Quality', result);
    },
"docs-stub-inventory": () => {
      const result = runDocsStubInventoryGate();
      printDocsStubInventoryGateReport(result);
      return toRunnerResult('docs-stub-inventory', 'Docs Stub Inventory', result);
    },
"docs-content-depth": () => {
      const result = load("./verify_docs_content_depth")["runDocsContentDepthCheck"]({ rootDir });
      load("./verify_docs_content_depth")["printDocsContentDepthReport"](result);
      return toRunnerResult('docs-content-depth', 'Docs Content Depth', result);
    },
"docs-quality-gates": () => {
      const result = load("../tests/docs/docs_quality_gate_suite")["runDocsQualityGateSuite"]({ rootDir });
      load("../tests/docs/docs_quality_gate_suite")["printDocsQualityGateReport"](result);
      return toRunnerResult('docs-quality-gates', 'Docs Quality Negative Fixtures', result);
    },
"rmt-stack-docs": () => {
      const result = load("../tests/docs/rmt_stack_docs_suite")["runRmtStackDocsSuite"]({ rootDir });
      load("../tests/docs/rmt_stack_docs_suite")["printRmtStackDocsReport"](result);
      return toRunnerResult('rmt-stack-docs', 'RMT Stack Layer Docs', result);
    },
"rmt-playground-docs": () => {
      const result = load("../tests/docs/rmt_playground_docs_suite")["runRmtPlaygroundDocsSuite"]({ rootDir });
      load("../tests/docs/rmt_playground_docs_suite")["printRmtPlaygroundDocsReport"](result);
      return toRunnerResult('rmt-playground-docs', 'Learn RMT Playground Docs', result);
    },
"rmt-animation-engine-docs": () => {
      const result = load("../tests/docs/rmt_animation_engine_docs_suite")["runRmtAnimationEngineDocsSuite"]({ rootDir });
      load("../tests/docs/rmt_animation_engine_docs_suite")["printRmtAnimationEngineDocsReport"](result);
      return toRunnerResult('rmt-animation-engine-docs', 'RMT AnimationEngine Docs and Live Demo', result);
    },
"docs-shell-catfooding": () => {
      const result = load("../tests/docs/docs_shell_catfooding_suite")["runDocsShellCatfoodingSuite"]({ rootDir });
      load("../tests/docs/docs_shell_catfooding_suite")["printDocsShellCatfoodingReport"](result);
      return toRunnerResult('docs-shell-catfooding', 'Docs Shell Catfooding', result);
    },
"docs-framework-ownership": async () => {
      const result = await load("../tests/docs/docs_framework_ownership_suite")["runDocsFrameworkOwnershipSuite"]({ rootDir });
      load("../tests/docs/docs_framework_ownership_suite")["printDocsFrameworkOwnershipReport"](result);
      return toRunnerResult('docs-framework-ownership', 'Docs Framework Ownership', result);
    },
"rmt-search-runtime": async () => {
      const result = await load("../tests/docs/docs_shell_catfooding_suite")["runRmtSearchRuntimeSuite"]({ rootDir });
      load("../tests/docs/docs_shell_catfooding_suite")["printDocsShellCatfoodingReport"](result);
      return toRunnerResult('rmt-search-runtime', 'RMT Search Runtime', result);
    },
"docs-related-recommendations": async () => {
      const result = await load("../tests/docs/docs_related_recommendations_suite")["runDocsRelatedRecommendationsSuite"]({ rootDir });
      load("../tests/docs/docs_related_recommendations_suite")["printDocsRelatedRecommendationsReport"](result);
      return toRunnerResult('docs-related-recommendations', 'Docs Related Recommendations', result);
    },
"rmt-prewarm-worker-search": async () => {
      const result = await load("../tests/docs/docs_shell_catfooding_suite")["runRmtPrewarmWorkerSearchSuite"]({ rootDir });
      load("../tests/docs/docs_shell_catfooding_suite")["printDocsShellCatfoodingReport"](result);
      return toRunnerResult('rmt-prewarm-worker-search', 'RMT Prewarm Worker Search', result);
    },
"xtend-loader-skeleton-profiles": () => {
      const result = load("../tests/docs/docs_shell_catfooding_suite")["runXtendLoaderSkeletonProfilesSuite"]({ rootDir });
      load("../tests/docs/docs_shell_catfooding_suite")["printDocsShellCatfoodingReport"](result);
      return toRunnerResult('xtend-loader-skeleton-profiles', 'XTend Loader Skeleton Profiles', result);
    },
"maraca-tune": async () => {
      const result = await load("../tests/docs/docs_shell_catfooding_suite")["runMaracaTuneSuite"]({ rootDir });
      load("../tests/docs/docs_shell_catfooding_suite")["printDocsShellCatfoodingReport"](result);
      return toRunnerResult('maraca-tune', 'Maraca Deterministic Tune', result);
    },
"rmt-reference-docs": () => {
      const result = load("../tests/docs/rmt_reference_docs_suite")["runRmtReferenceDocsSuite"]({ rootDir });
      load("../tests/docs/rmt_reference_docs_suite")["printRmtReferenceDocsReport"](result);
      return toRunnerResult('rmt-reference-docs', 'RMT Reference Docs', result);
    },
"rmt-playground-security": () => {
      const result = load("../tests/docs/rmt_playground_security_suite")["runRmtPlaygroundSecuritySuite"]({ rootDir });
      load("../tests/docs/rmt_playground_security_suite")["printRmtPlaygroundSecurityReport"](result);
      return toRunnerResult('rmt-playground-security', 'RMT Playground Security', result);
    },
"docs-php-ssr-prehydration": async () => {
      const result = await load("../tests/rmt/docs_php_ssr_prehydration_suite")["runDocsPhpSsrPrehydrationSuite"]({ rootDir });
      load("../tests/rmt/docs_php_ssr_prehydration_suite")["printDocsPhpSsrPrehydrationReport"](result);
      return toRunnerResult('docs-php-ssr-prehydration', 'Docs-App PHP SSR Prehydration', result);
    },
"docs-php-ssr-performance-budget": () => {
      const result = load("../tests/rmt/docs_php_ssr_performance_budget_suite")["runDocsPhpSsrPerformanceBudgetSuite"]({ rootDir });
      load("../tests/rmt/docs_php_ssr_performance_budget_suite")["printDocsPhpSsrPerformanceBudgetReport"](result);
      return toRunnerResult('docs-php-ssr-performance-budget', 'Docs-App PHP SSR Performance Budget', result);
    },
"docs-php-ssr-cls-budget": () => {
      const result = load("../tests/rmt/docs_php_ssr_cls_budget_suite")["runDocsPhpSsrClsBudgetSuite"]({ rootDir });
      load("../tests/rmt/docs_php_ssr_cls_budget_suite")["printDocsPhpSsrClsBudgetReport"](result);
      return toRunnerResult('docs-php-ssr-cls-budget', 'Docs-App PHP SSR CLS Budget', result);
    },
"rmt-vnext-fabric-bridge": () => {
      const result = load("../tests/rmt-language/rmt_vnext_fabric_bridge_suite")["runRmtVNextFabricBridgeSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_fabric_bridge_suite")["printRmtVNextFabricBridgeReport"](result);
      return toRunnerResult('rmt-vnext-fabric-bridge', 'RMT vNext Fabric Lane/Fiber Bridge Evidence', result);
    },
"rmt-vnext-lifecycle": () => {
      const result = load("../tests/rmt-language/rmt_vnext_lifecycle_suite")["runRmtVNextLifecycleSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_lifecycle_suite")["printRmtVNextLifecycleReport"](result);
      return toRunnerResult('rmt-vnext-lifecycle', 'Epic 15 RMT vNext Lifecycle Operation Contract', result);
    },
"xtensions-host-controller": () => {
      const result = load("../tests/xtensions/xtensions_host_controller_suite")["runXTensionsHostControllerSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_host_controller_suite")["printXTensionsHostControllerReport"](result);
      return toRunnerResult('xtensions-host-controller', 'XTensions HostController Lifecycle Contract', result);
    },
"xtensions-resume-adapter": async () => {
      const result = await load("../tests/xtensions/xtensions_resume_adapter_suite")["runXTensionsResumeAdapterSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_resume_adapter_suite")["printXTensionsResumeAdapterReport"](result);
      return toRunnerResult('xtensions-resume-adapter', 'XTensions Resume Adapter Contract', result);
    },
"xtensions-signal-bridge": () => {
      const result = load("../tests/xtensions/xtensions_signal_bridge_suite")["runXTensionsSignalBridgeSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_signal_bridge_suite")["printXTensionsSignalBridgeReport"](result);
      return toRunnerResult('xtensions-signal-bridge', 'XTensions Signal Bridge and Event Governance Contract', result);
    },
"maraca-xtensions": () => {
      const result = load("../tests/xtensions/maraca_xtensions_suite")["runMaracaXTensionsSuite"]({ rootDir });
      load("../tests/xtensions/maraca_xtensions_suite")["printMaracaXTensionsReport"](result);
      return toRunnerResult('maraca-xtensions', 'XTensions Maraca Manifest and Build Provenance Contract', result);
    },
"xtensions-static-introspection": () => {
      const result = load("../tests/xtensions/xtensions_static_introspection_suite")["runXTensionsStaticIntrospectionSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_static_introspection_suite")["printXTensionsStaticIntrospectionReport"](result);
      return toRunnerResult('xtensions-static-introspection', 'XTensions Static Contract Introspection Contract', result);
    },
"xtensions-runtime-capability-registry": () => {
      const result = load("../tests/xtensions/xtensions_runtime_capability_registry_suite")["runXTensionsRuntimeCapabilityRegistrySuite"]({ rootDir });
      load("../tests/xtensions/xtensions_runtime_capability_registry_suite")["printXTensionsRuntimeCapabilityRegistryReport"](result);
      return toRunnerResult('xtensions-runtime-capability-registry', 'XTensions Runtime Capability Registry and Loading Policy Contract', result);
    },
"xtensions-react-host-controller-poc": () => {
      const result = load("../tests/xtensions/xtensions_react_host_controller_poc_suite")["runXTensionsReactHostControllerPocSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_react_host_controller_poc_suite")["printXTensionsReactHostControllerPocReport"](result);
      return toRunnerResult('xtensions-react-host-controller-poc', 'XTensions React HostController PoC and Scheduling Hints Contract', result);
    },
"xtensions-react-host-adapter": () => {
      const result = load("../tests/xtensions/xtensions_react_host_adapter_suite")["runXTensionsReactHostAdapterSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_react_host_adapter_suite")["printXTensionsReactHostAdapterReport"](result);
      return toRunnerResult('xtensions-react-host-adapter', 'XTensions React Host Adapter Contract', result);
    },
"xtensions-vue-host-controller-poc": () => {
      const result = load("../tests/xtensions/xtensions_vue_host_controller_poc_suite")["runXTensionsVueHostControllerPocSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_vue_host_controller_poc_suite")["printXTensionsVueHostControllerPocReport"](result);
      return toRunnerResult('xtensions-vue-host-controller-poc', 'XTensions Vue HostController PoC and Explicit Update Adapter Contract', result);
    },
"xtensions-vue-host-adapter": () => {
      const result = load("../tests/xtensions/xtensions_vue_host_adapter_suite")["runXTensionsVueHostAdapterSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_vue_host_adapter_suite")["printXTensionsVueHostAdapterReport"](result);
      return toRunnerResult('xtensions-vue-host-adapter', 'XTensions Vue Host Adapter Contract', result);
    },
"xtensions-imperative-host-pocs": () => {
      const result = load("../tests/xtensions/xtensions_imperative_host_pocs_suite")["runXTensionsImperativeHostPocsSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_imperative_host_pocs_suite")["printXTensionsImperativeHostPocsReport"](result);
      return toRunnerResult('xtensions-imperative-host-pocs', 'XTensions Chart.js and Leaflet Imperative Host PoCs Contract', result);
    },
"xtensions-three-render-loop-poc": () => {
      const result = load("../tests/xtensions/xtensions_three_render_loop_poc_suite")["runXTensionsThreeRenderLoopPocSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_three_render_loop_poc_suite")["printXTensionsThreeRenderLoopPocReport"](result);
      return toRunnerResult('xtensions-three-render-loop-poc', 'XTensions Three.js Fiber Render Loop PoC Contract', result);
    },
"xtensions-diagnostic-trail": () => {
      const result = load("../tests/xtensions/xtensions_diagnostic_trail_suite")["runXTensionsDiagnosticTrailSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_diagnostic_trail_suite")["printXTensionsDiagnosticTrailReport"](result);
      return toRunnerResult('xtensions-diagnostic-trail', 'XTensions Diagnostic Trail Contract', result);
    },
"xtensions-security-integrity-gate": () => {
      const result = load("../tests/xtensions/xtensions_security_integrity_gate_suite")["runXTensionsSecurityIntegrityGateSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_security_integrity_gate_suite")["printXTensionsSecurityIntegrityGateReport"](result);
      return toRunnerResult('xtensions-security-integrity-gate', 'XTensions Security, CSP, Supply Chain and Integrity Gate Contract', result);
    },
"xtensions-multi-framework-dashboard": () => {
      const result = load("../tests/xtensions/xtensions_multi_framework_dashboard_suite")["runXTensionsMultiFrameworkDashboardSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_multi_framework_dashboard_suite")["printXTensionsMultiFrameworkDashboardReport"](result);
      return toRunnerResult('xtensions-multi-framework-dashboard', 'XTensions Multi-Framework Dashboard Fixture and Browser Smokes Contract', result);
    },
"xtensions-registry-package-strategy": () => {
      const result = load("../tests/xtensions/xtensions_registry_package_strategy_suite")["runXTensionsRegistryPackageStrategySuite"]({ rootDir });
      load("../tests/xtensions/xtensions_registry_package_strategy_suite")["printXTensionsRegistryPackageStrategyReport"](result);
      return toRunnerResult('xtensions-registry-package-strategy', 'XTensions Registry and Package Strategy Contract', result);
    },
"xtensions-adoption-handoff": () => {
      const result = load("../tests/xtensions/xtensions_adoption_handoff_suite")["runXTensionsAdoptionHandoffSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_adoption_handoff_suite")["printXTensionsAdoptionHandoffReport"](result);
      return toRunnerResult('xtensions-adoption-handoff', 'XTensions Docs, Migration and Enterprise Adoption Handoff Contract', result);
    },
"xtensions-vanilla-host-controller": () => {
      const result = load("../tests/xtensions/xtensions_vanilla_host_adapter_suite")["runXTensionsVanillaHostControllerSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_vanilla_host_adapter_suite")["printXTensionsVanillaHostControllerReport"](result);
      return toRunnerResult('xtensions-vanilla-host-controller', 'XTensions Vanilla Host Adapter Contract', result);
    },
"xtensions-dom-boundary": () => {
      const result = load("../tests/xtensions/xtensions_vanilla_host_adapter_suite")["runXTensionsDomBoundarySuite"]({ rootDir });
      load("../tests/xtensions/xtensions_vanilla_host_adapter_suite")["printXTensionsDomBoundaryReport"](result);
      return toRunnerResult('xtensions-dom-boundary', 'XTensions DOM Boundary Contract', result);
    },
"xtensions-legacy-sandbox-adapter": () => {
      const result = load("../tests/xtensions/xtensions_vanilla_host_adapter_suite")["runXTensionsLegacySandboxAdapterSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_vanilla_host_adapter_suite")["printXTensionsLegacySandboxAdapterReport"](result);
      return toRunnerResult('xtensions-legacy-sandbox-adapter', 'XTensions Legacy Sandbox Adapter Contract', result);
    },
"xtensions-openui5-host-controller": () => {
      const result = load("../tests/xtensions/xtensions_openui5_host_adapter_suite")["runXTensionsOpenUi5HostControllerSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_openui5_host_adapter_suite")["printXTensionsOpenUi5HostControllerReport"](result);
      return toRunnerResult('xtensions-openui5-host-controller', 'XTensions OpenUI5 Host Adapter Contract', result);
    },
"xtensions-openui5-loader-boundary": () => {
      const result = load("../tests/xtensions/xtensions_openui5_host_adapter_suite")["runXTensionsOpenUi5LoaderBoundarySuite"]({ rootDir });
      load("../tests/xtensions/xtensions_openui5_host_adapter_suite")["printXTensionsOpenUi5LoaderBoundaryReport"](result);
      return toRunnerResult('xtensions-openui5-loader-boundary', 'XTensions OpenUI5 Loader Boundary Contract', result);
    },
"xtensions-angular-host-controller": () => {
      const result = load("../tests/xtensions/xtensions_angular_host_adapter_suite")["runXTensionsAngularHostControllerSuite"]({ rootDir });
      load("../tests/xtensions/xtensions_angular_host_adapter_suite")["printXTensionsAngularHostControllerReport"](result);
      return toRunnerResult('xtensions-angular-host-controller', 'XTensions Angular Host Adapter Contract', result);
    },
"xtensions-angular-zone-boundary": () => {
      const result = load("../tests/xtensions/xtensions_angular_host_adapter_suite")["runXTensionsAngularZoneBoundarySuite"]({ rootDir });
      load("../tests/xtensions/xtensions_angular_host_adapter_suite")["printXTensionsAngularZoneBoundaryReport"](result);
      return toRunnerResult('xtensions-angular-zone-boundary', 'XTensions Angular Zone Boundary Contract', result);
    },
"xtend-dev-surface": async () => {
      const result = await load("../tests/xtend-dev-surface/xtend_dev_surface_suite")["runXTendDevSurfaceSuite"]({ rootDir });
      load("../tests/xtend-dev-surface/xtend_dev_surface_suite")["printXTendDevSurfaceReport"](result);
      return toRunnerResult('xtend-dev-surface', 'XTend Dev Surface Chromium DevTools Extension', result);
    },
"rmt-vnext-scheduler": () => {
      const result = load("../tests/rmt-language/rmt_vnext_scheduler_suite")["runRmtVNextSchedulerSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_scheduler_suite")["printRmtVNextSchedulerReport"](result);
      return toRunnerResult('rmt-vnext-scheduler', 'Epic 15 RMT vNext Scheduler Policy Contract', result);
    },
"rmt-kernel-scheduler": async () => {
      const result = await load("../tests/rmt-language/rmt_kernel_scheduler_suite")["runRmtKernelSchedulerSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_scheduler_suite")["printRmtKernelSchedulerReport"](result);
      return toRunnerResult('rmt-kernel-scheduler', 'RMT Kernel 0.8 Microkernel Scheduler', result);
    },
"rmt-vnext-surfaces": () => {
      const result = load("../tests/rmt-language/rmt_vnext_surface_registry_suite")["runRmtVNextSurfaceRegistrySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_surface_registry_suite")["printRmtVNextSurfaceRegistryReport"](result);
      return toRunnerResult('rmt-vnext-surfaces', 'Epic 15 RMT vNext Surface Registry Contract', result);
    },
"rmt-vnext-conditions": () => {
      const result = load("../tests/rmt-language/rmt_vnext_conditions_suite")["runRmtVNextConditionsSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_conditions_suite")["printRmtVNextConditionsReport"](result);
      return toRunnerResult('rmt-vnext-conditions', 'Epic 15 RMT vNext Condition Expression Contract', result);
    },
"rmt-vnext-composition": () => {
      const result = load("../tests/rmt-language/rmt_vnext_composition_suite")["runRmtVNextCompositionSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_composition_suite")["printRmtVNextCompositionReport"](result);
      return toRunnerResult('rmt-vnext-composition', 'Epic 15 RMT vNext Composition and Component Binding Contract', result);
    },
"rmt-vnext-imports": () => {
      const result = load("../tests/rmt-language/rmt_vnext_import_resolver_suite")["runRmtVNextImportResolverSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_import_resolver_suite")["printRmtVNextImportResolverReport"](result);
      return toRunnerResult('rmt-vnext-imports', 'Epic 15 RMT vNext Import Resolver and Module Graph Contract', result);
    },
"rmt-vnext-events": () => {
      const result = load("../tests/rmt-language/rmt_vnext_events_suite")["runRmtVNextEventsSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_events_suite")["printRmtVNextEventsReport"](result);
      return toRunnerResult('rmt-vnext-events', 'Epic 15 RMT vNext Event, Action and Data Source Contract', result);
    },
"rmt-vnext-security": () => {
      const result = load("../tests/rmt-language/rmt_vnext_security_suite")["runRmtVNextSecuritySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_security_suite")["printRmtVNextSecurityReport"](result);
      return toRunnerResult('rmt-vnext-security', 'Epic 15 RMT vNext Security Policy Contract', result);
    },
"rmt-kernel-trust-authority": () => {
      const result = load("../tests/rmt-language/rmt_kernel_trust_authority_suite")["runRmtKernelTrustAuthoritySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_trust_authority_suite")["printRmtKernelTrustAuthorityReport"](result);
      return toRunnerResult('rmt-kernel-trust-authority', 'RKSH-WP-01 Kernel Trust Authority Contract', result);
    },
"rmt-kernel-trusted-dom-runtime": () => {
      const result = load("../tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite")["runRmtKernelTrustedDomRuntimeSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite")["printRmtKernelTrustedDomRuntimeReport"](result);
      return toRunnerResult('rmt-kernel-trusted-dom-runtime', 'RKSH-WP-02 Runtime Trust-Sink Adapter', result);
    },
"rmt-kernel-binding-security": () => {
      const result = load("../tests/rmt-language/rmt_kernel_binding_security_suite")["runRmtKernelBindingSecuritySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_binding_security_suite")["printRmtKernelBindingSecurityReport"](result);
      return toRunnerResult('rmt-kernel-binding-security', 'RKSH-WP-03 Attribute, URL and Property Policies', result);
    },
"rmt-kernel-panic-monitor": () => {
      const result = load("../tests/rmt-language/rmt_kernel_panic_monitor_suite")["runRmtKernelPanicMonitorSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_panic_monitor_suite")["printRmtKernelPanicMonitorReport"](result);
      return toRunnerResult('rmt-kernel-panic-monitor', 'RKSH-WP-04 PanicMonitor State Machine', result);
    },
"rmt-kernel-recovery": () => {
      const result = load("../tests/rmt-language/rmt_kernel_recovery_suite")["runRmtKernelRecoverySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_recovery_suite")["printRmtKernelRecoveryReport"](result);
      return toRunnerResult('rmt-kernel-recovery', 'RKSH-WP-05 Kernel Recovery Policy', result);
    },
"rmt-kernel-escalation": async () => {
      const result = await load("../tests/rmt-language/rmt_kernel_escalation_suite")["runRmtKernelEscalationSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_escalation_suite")["printRmtKernelEscalationReport"](result);
      return toRunnerResult('rmt-kernel-escalation', 'RKSH-WP-06 Diagnostics and Command Bus Escalation', result);
    },
"rmt-kernel-scheduler-failure": async () => {
      const result = await load("../tests/rmt-language/rmt_kernel_scheduler_failure_suite")["runRmtKernelSchedulerFailureSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_scheduler_failure_suite")["printRmtKernelSchedulerFailureReport"](result);
      return toRunnerResult('rmt-kernel-scheduler-failure', 'RKSH-WP-07 Scheduler Failure Semantics', result);
    },
"rmt-kernel-policy-parity": async () => {
      const result = await load("../tests/rmt-language/rmt_kernel_policy_parity_suite")["runRmtKernelPolicyParitySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_policy_parity_suite")["printRmtKernelPolicyParityReport"](result);
      return toRunnerResult('rmt-kernel-policy-parity', 'RKSH-WP-08 Compile-Time Runtime Policy Parity', result);
    },
"rmt-kernel-security-regression": async () => {
      const result = await load("../tests/rmt-language/rmt_kernel_security_regression_suite")["runRmtKernelSecurityRegressionSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_security_regression_suite")["printRmtKernelSecurityRegressionReport"](result);
      return toRunnerResult('rmt-kernel-security-regression', 'RKSH-WP-09 Kernel Security Regression', result);
    },
"rmt-kernel-handoff-docs": () => {
      const result = load("../tests/rmt-language/rmt_kernel_handoff_docs_suite")["runRmtKernelHandoffDocsSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_kernel_handoff_docs_suite")["printRmtKernelHandoffDocsReport"](result);
      return toRunnerResult('rmt-kernel-handoff-docs', 'RKSH-WP-11 Kernel Migration Authoring Incident Handoff', result);
    },
"rmt-vnext-streaming": () => {
      const result = load("../tests/rmt-language/rmt_vnext_streaming_suite")["runRmtVNextStreamingSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_streaming_suite")["printRmtVNextStreamingReport"](result);
      return toRunnerResult('rmt-vnext-streaming', 'Epic 15 RMT vNext Streaming and Incremental Rendering Contract', result);
    },
"rmt-vnext-tooling": () => {
      const result = load("../tests/rmt-language/rmt_vnext_tooling_suite")["runRmtVNextToolingSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_tooling_suite")["printRmtVNextToolingReport"](result);
      return toRunnerResult('rmt-vnext-tooling', 'Epic 15 RMT vNext Tooling Adapter', result);
    },
"rmt-vnext-compatibility": () => {
      const result = load("../tests/rmt-language/rmt_vnext_compatibility_suite")["runRmtVNextCompatibilitySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_compatibility_suite")["printRmtVNextCompatibilityReport"](result);
      return toRunnerResult('rmt-vnext-compatibility', 'Epic 15 RMT vNext Compatibility and Migration', result);
    },
"rmt-vnext-regression": () => {
      const result = load("../tests/rmt-language/rmt_vnext_regression_suite")["runRmtVNextRegressionSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_regression_suite")["printRmtVNextRegressionReport"](result);
      return toRunnerResult('rmt-vnext-regression', 'Epic 15 RMT vNext Fixture Regression Gate', result);
    },
"rmt-vnext-release": () => {
      const result = load("../tests/rmt-language/rmt_vnext_release_handoff_suite")["runRmtVNextReleaseHandoffSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_release_handoff_suite")["printRmtVNextReleaseHandoffReport"](result);
      return toRunnerResult('rmt-vnext-release', 'Epic 15 RMT vNext Release Handoff', result);
    },
"xcommand-kernel": () => {
      const result = load("../tests/rmt/xcommand_kernel_suite")["runXCommandKernelSuite"]({ rootDir });
      load("../tests/rmt/xcommand_kernel_suite")["printXCommandKernelReport"](result);
      return toRunnerResult('xcommand-kernel', 'XCommand Kernel and XKeymap Gate', result);
    },
"xscaler-protocol": () => {
      const result = load("../tests/rmt/xscaler_protocol_suite")["runXScalerProtocolSuite"]({ rootDir });
      load("../tests/rmt/xscaler_protocol_suite")["printXScalerProtocolReport"](result);
      return toRunnerResult('xscaler-protocol', 'XScaler Protocol Gate', result);
    },
"xscaler-public-api": async () => {
      const result = await load("../tests/rmt/xscaler_public_api_suite")["runXScalerPublicApiSuite"]({ rootDir });
      load("../tests/rmt/xscaler_public_api_suite")["printXScalerPublicApiReport"](result);
      return toRunnerResult('xscaler-public-api', 'XScaler Public API and Remote Adapter Loader', result);
    },
"xscaler-php-preflight-parity": () => {
      const result = load("../tests/rmt/xscaler_php_preflight_parity_suite")["runXScalerPhpPreflightParitySuite"]({ rootDir });
      load("../tests/rmt/xscaler_php_preflight_parity_suite")["printXScalerPhpPreflightParityReport"](result);
      return toRunnerResult('xscaler-php-preflight-parity', 'XScaler JS/PHP Preflight Parity', result);
    },
"rmt-xscaler-ssr-hydration-parity": async () => {
      const result = await load("../tests/rmt-language/rmt_xscaler_ssr_hydration_parity_suite")["runRmtXScalerSsrHydrationParitySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_xscaler_ssr_hydration_parity_suite")["printRmtXScalerSsrHydrationParityReport"](result);
      return toRunnerResult('rmt-xscaler-ssr-hydration-parity', 'RMT Node/PHP XScaler SSR Hydration Parity', result);
    },
"xscaler-source-to-sea": () => {
      const result = load("../tests/rmt/xscaler_source_to_sea_suite")["runXScalerSourceToSeaSuite"]({ rootDir });
      load("../tests/rmt/xscaler_source_to_sea_suite")["printXScalerSourceToSeaReport"](result);
      return toRunnerResult('xscaler-source-to-sea', 'XScaler Source-to-Sea Gate', result);
    },
"xsurface-shard": () => {
      const result = load("../tests/xsurface/xsurface_shard_suite")["runXSurfaceShardSuite"]({ rootDir });
      load("../tests/xsurface/xsurface_shard_suite")["printXSurfaceShardReport"](result);
      return toRunnerResult('xsurface-shard', 'XSurface Shard server orchestration', result);
    },
"rmt-vnext-remote-manifest": () => {
      const result = load("../tests/rmt-language/rmt_vnext_remote_manifest_suite")["runRmtVNextRemoteManifestSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_remote_manifest_suite")["printRmtVNextRemoteManifestReport"](result);
      return toRunnerResult('rmt-vnext-remote-manifest', 'Epic 16 RMT vNext Remote Surface Manifest Contract', result);
    },
"rmt-vnext-enterprise-registry": () => {
      const result = load("../tests/rmt-language/rmt_vnext_enterprise_registry_suite")["runRmtVNextEnterpriseRegistrySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_enterprise_registry_suite")["printRmtVNextEnterpriseRegistryReport"](result);
      return toRunnerResult('rmt-vnext-enterprise-registry', 'Epic 16 RMT vNext Enterprise Surface Registry Contract', result);
    },
"rmt-vnext-degradation": () => {
      const result = load("../tests/rmt-language/rmt_vnext_degradation_suite")["runRmtVNextDegradationSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_degradation_suite")["printRmtVNextDegradationReport"](result);
      return toRunnerResult('rmt-vnext-degradation', 'Epic 16 RMT vNext Degradation Policy Contract', result);
    },
"rmt-vnext-remote-security": () => {
      const result = load("../tests/rmt-language/rmt_vnext_remote_security_suite")["runRmtVNextRemoteSecuritySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_remote_security_suite")["printRmtVNextRemoteSecurityReport"](result);
      return toRunnerResult('rmt-vnext-remote-security', 'Epic 16 RMT vNext Remote Security Policy Contract', result);
    },
"rmt-vnext-cross-surface-events": () => {
      const result = load("../tests/rmt-language/rmt_vnext_cross_surface_events_suite")["runRmtVNextCrossSurfaceEventsSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_cross_surface_events_suite")["printRmtVNextCrossSurfaceEventsReport"](result);
      return toRunnerResult('rmt-vnext-cross-surface-events', 'Epic 16 RMT vNext Cross Surface Event Protocol', result);
    },
"rmt-vnext-event-governance": () => {
      const result = load("../tests/rmt-language/rmt_vnext_event_governance_suite")["runRmtVNextEventGovernanceSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_event_governance_suite")["printRmtVNextEventGovernanceReport"](result);
      return toRunnerResult('rmt-vnext-event-governance', 'Epic 16 RMT vNext Event Governance', result);
    },
"rmt-vnext-remote-compiler": () => {
      const result = load("../tests/rmt-language/rmt_vnext_remote_compiler_suite")["runRmtVNextRemoteCompilerSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_remote_compiler_suite")["printRmtVNextRemoteCompilerReport"](result);
      return toRunnerResult('rmt-vnext-remote-compiler', 'Epic 16 RMT vNext Remote Compiler', result);
    },
"rmt-vnext-remote-tooling": () => {
      const result = load("../tests/rmt-language/rmt_vnext_remote_tooling_suite")["runRmtVNextRemoteToolingSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_remote_tooling_suite")["printRmtVNextRemoteToolingReport"](result);
      return toRunnerResult('rmt-vnext-remote-tooling', 'Epic 16 RMT vNext Remote Tooling', result);
    },
"rmt-vnext-remote-compatibility": () => {
      const result = load("../tests/rmt-language/rmt_vnext_remote_compatibility_suite")["runRmtVNextRemoteCompatibilitySuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_remote_compatibility_suite")["printRmtVNextRemoteCompatibilityReport"](result);
      return toRunnerResult('rmt-vnext-remote-compatibility', 'Epic 16 RMT vNext Remote Compatibility and Migration', result);
    },
"rmt-vnext-enterprise-fixtures": () => {
      const result = load("../tests/rmt-language/rmt_vnext_enterprise_fixtures_suite")["runRmtVNextEnterpriseFixturesSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_enterprise_fixtures_suite")["printRmtVNextEnterpriseFixturesReport"](result);
      return toRunnerResult('rmt-vnext-enterprise-fixtures', 'Epic 16 RMT vNext Enterprise MFE Fixtures', result);
    },
"rmt-vnext-enterprise-release": () => {
      const result = load("../tests/rmt-language/rmt_vnext_enterprise_release_suite")["runRmtVNextEnterpriseReleaseSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_vnext_enterprise_release_suite")["printRmtVNextEnterpriseReleaseReport"](result);
      return toRunnerResult('rmt-vnext-enterprise-release', 'Epic 16 RMT vNext Enterprise MFE Release Handoff', result);
    },
"rmt-semantic-graph": () => {
      const result = load("../tests/rmt-language/rmt_semantic_graph_suite")["runRmtSemanticGraphSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_semantic_graph_suite")["printRmtSemanticGraphReport"](result);
      return toRunnerResult('rmt-semantic-graph', 'Epic 14 RMT Semantic Graph', result);
    },
"rmt-linter-rules": () => {
      const result = load("../tests/rmt-language/rmt_linter_rules_suite")["runRmtLinterRulesSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_linter_rules_suite")["printRmtLinterRulesReport"](result);
      return toRunnerResult('rmt-linter-rules', 'Epic 14 RMT Linter Rule Engine', result);
    },
"rmt-linter-cli": () => {
      const result = load("../tests/rmt-language/rmt_linter_cli_suite")["runRmtLinterCliSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_linter_cli_suite")["printRmtLinterCliReport"](result);
      return toRunnerResult('rmt-linter-cli', 'Epic 14 RMT Linter CLI', result);
    },
"rmt-completions": () => {
      const result = load("../tests/rmt-language/rmt_completion_suite")["runRmtCompletionSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_completion_suite")["printRmtCompletionReport"](result);
      return toRunnerResult('rmt-completions', 'Epic 14 RMT Completion Provider', result);
    },
"rmt-navigation": () => {
      const result = load("../tests/rmt-language/rmt_navigation_suite")["runRmtNavigationSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_navigation_suite")["printRmtNavigationReport"](result);
      return toRunnerResult('rmt-navigation', 'Epic 14 RMT Navigation Providers', result);
    },
"rmt-language-server": () => {
      const result = load("../tests/rmt-language/rmt_language_server_suite")["runRmtLanguageServerSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_language_server_suite")["printRmtLanguageServerReport"](result);
      return toRunnerResult('rmt-language-server', 'Epic 14 RMT Language Server MVP', result);
    },
"rmt-code-actions": () => {
      const result = load("../tests/rmt-language/rmt_code_actions_suite")["runRmtCodeActionsSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_code_actions_suite")["printRmtCodeActionsReport"](result);
      return toRunnerResult('rmt-code-actions', 'Epic 14 RMT Code Actions', result);
    },
"rmt-agent-report": () => {
      const result = load("../tests/rmt-language/rmt_agent_repair_report_suite")["runRmtAgentRepairReportSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_agent_repair_report_suite")["printRmtAgentRepairReport"](result);
      return toRunnerResult('rmt-agent-report', 'Epic 14 RMT AI Agent Repair Report', result);
    },
"rmt-ai-developer-kit": () => {
      const result = load("../tests/rmt-language/rmt_ai_developer_kit_suite")["runRmtAiDeveloperKitSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_ai_developer_kit_suite")["printRmtAiDeveloperKitReport"](result);
      return toRunnerResult('rmt-ai-developer-kit', 'RMT AI Developer Kit', result);
    },
"rmt-editor-packaging": () => {
      const result = load("../tests/rmt-language/rmt_editor_packaging_suite")["runRmtEditorPackagingSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_editor_packaging_suite")["printRmtEditorPackagingReport"](result);
      return toRunnerResult('rmt-editor-packaging', 'Epic 14 RMT Editor Packaging', result);
    },
"rmt-language-regression": () => {
      const result = load("../tests/rmt-language/rmt_language_regression_suite")["runRmtLanguageRegressionSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_language_regression_suite")["printRmtLanguageRegressionReport"](result);
      return toRunnerResult('rmt-language-regression', 'Epic 14 RMT Language Regression Matrix', result);
    },
"maraca-docs": () => {
      const result = load("../tests/docs/maraca_docs_suite")["runMaracaDocsSuite"]({ rootDir });
      load("../tests/docs/maraca_docs_suite")["printMaracaDocsReport"](result);
      return toRunnerResult('maraca-docs', 'Maraca Orchestration Docs', result);
    },
"rmt-tooling-docs": () => {
      const result = load("../tests/docs/rmt_tooling_docs_suite")["runRmtToolingDocsSuite"]({ rootDir });
      load("../tests/docs/rmt_tooling_docs_suite")["printRmtToolingDocsReport"](result);
      return toRunnerResult('rmt-tooling-docs', 'Epic 14 RMT Tooling Docs', result);
    },
"epic14-rmt-tooling": () => {
      const result = load("../tests/platform/epic14_rmt_tooling_release_gates_suite")["runEpic14RmtToolingReleaseGatesSuite"]({ rootDir });
      load("../tests/platform/epic14_rmt_tooling_release_gates_suite")["printEpic14RmtToolingReleaseGatesReport"](result);
      return toRunnerResult('epic14-rmt-tooling', 'Epic 14 RMT Tooling Release Gates', result);
    },
"epic14-rmt-tooling-release-gates": () => {
      const result = load("../tests/platform/epic14_rmt_tooling_release_gates_suite")["runEpic14RmtToolingReleaseGatesSuite"]({ rootDir });
      load("../tests/platform/epic14_rmt_tooling_release_gates_suite")["printEpic14RmtToolingReleaseGatesReport"](result);
      return toRunnerResult('epic14-rmt-tooling-release-gates', 'Epic 14 RMT Tooling Release Gates', result);
    },
"epic14-lsp-handoff": () => {
      const result = load("../tests/platform/epic14_lsp_handoff_suite")["runEpic14LspHandoffSuite"]({ rootDir });
      load("../tests/platform/epic14_lsp_handoff_suite")["printEpic14LspHandoffReport"](result);
      return toRunnerResult('epic14-lsp-handoff', 'Epic 14 LSP Handoff', result);
    },
"rc0-gate-matrix": () => {
      const result = load("../tests/platform/epic12_rc0_gate_matrix_suite")["runEpic12Rc0GateMatrixSuite"]({ rootDir });
      load("../tests/platform/epic12_rc0_gate_matrix_suite")["printEpic12Rc0GateMatrixReport"](result);
      return toRunnerResult('rc0-gate-matrix', 'Epic 12 RC0 Gate Matrix', result);
    },
"epic12-docs-adoption": () => {
      const result = load("../tests/docs/epic12_docs_adoption_suite")["runEpic12DocsAdoptionSuite"]({ rootDir });
      load("../tests/docs/epic12_docs_adoption_suite")["printEpic12DocsAdoptionReport"](result);
      return toRunnerResult('epic12-docs-adoption', 'Epic 12 Docs Migration and Enterprise Adoption', result);
    },
"epic12-rc0-handoff": () => {
      const result = load("../tests/platform/epic12_rc0_handoff_suite")["runEpic12Rc0HandoffSuite"]({ rootDir });
      load("../tests/platform/epic12_rc0_handoff_suite")["printEpic12Rc0HandoffReport"](result);
      return toRunnerResult('epic12-rc0-handoff', 'Epic 12 RC0 Handoff', result);
    },
"epic13-rc1-readiness": () => {
      const result = load("../tests/platform/epic13_rc1_readiness_suite")["runEpic13Rc1ReadinessSuite"]({ rootDir });
      load("../tests/platform/epic13_rc1_readiness_suite")["printEpic13Rc1ReadinessReport"](result);
      return toRunnerResult('epic13-rc1-readiness', 'Epic 13 RC1 Readiness', result);
    },
"epic13-release-owner-acceptance": () => {
      const result = load("../tests/platform/epic13_release_owner_acceptance_suite")["runEpic13ReleaseOwnerAcceptanceSuite"]({ rootDir });
      load("../tests/platform/epic13_release_owner_acceptance_suite")["printEpic13ReleaseOwnerAcceptanceReport"](result);
      return toRunnerResult('epic13-release-owner-acceptance', 'Epic 13 Release Owner Acceptance', result);
    },
"epic13-conditional-network-evidence": () => {
      const result = load("../tests/platform/epic13_conditional_network_evidence_suite")["runEpic13ConditionalNetworkEvidenceSuite"]({ rootDir });
      load("../tests/platform/epic13_conditional_network_evidence_suite")["printEpic13ConditionalNetworkEvidenceReport"](result);
      return toRunnerResult('epic13-conditional-network-evidence', 'Epic 13 Conditional Network Evidence', result);
    },
"epic13-conditional-network-evidence-ci": () => {
      const result = load("../tests/platform/epic13_conditional_network_evidence_ci_suite")["runEpic13ConditionalNetworkEvidenceCiSuite"]({ rootDir });
      load("../tests/platform/epic13_conditional_network_evidence_ci_suite")["printEpic13ConditionalNetworkEvidenceCiReport"](result);
      return toRunnerResult('epic13-conditional-network-evidence-ci', 'Epic 13 Conditional Network Evidence CI', result);
    },
"epic13-package-export-lock": () => {
      const result = load("../tests/platform/epic13_package_export_lock_suite")["runEpic13PackageExportLockSuite"]({ rootDir });
      load("../tests/platform/epic13_package_export_lock_suite")["printEpic13PackageExportLockReport"](result);
      return toRunnerResult('epic13-package-export-lock', 'Epic 13 Package Export Lock', result);
    },
"type-exports": () => {
      const result = load("../tests/types/type_exports_suite")["runTypeExportsSuite"]({ rootDir });
      load("../tests/types/type_exports_suite")["printTypeExportsReport"](result);
      return toRunnerResult('type-exports', 'TypeExports Public Declaration Gate', result);
    },
"type-exports-loader": () => {
      const result = load("../tests/types/loader_type_exports_suite")["runTypeExportsLoaderSuite"]({ rootDir });
      load("../tests/types/loader_type_exports_suite")["printTypeExportsLoaderReport"](result);
      return toRunnerResult('type-exports-loader', 'TypeExports Loader Declaration Gate', result);
    },
"type-exports-api": () => {
      const result = load("../tests/types/api_type_exports_suite")["runTypeExportsApiSuite"]({ rootDir });
      load("../tests/types/api_type_exports_suite")["printTypeExportsApiReport"](result);
      return toRunnerResult('type-exports-api', 'TypeExports API Declaration Gate', result);
    },
"type-exports-rmt": () => {
      const result = load("../tests/types/rmt_type_exports_suite")["runTypeExportsRmtSuite"]({ rootDir });
      load("../tests/types/rmt_type_exports_suite")["printTypeExportsRmtReport"](result);
      return toRunnerResult('type-exports-rmt', 'TypeExports RMT Declaration Gate', result);
    },
"type-exports-policy": () => {
      const result = load("../tests/types/policy_type_exports_suite")["runTypeExportsPolicySuite"]({ rootDir });
      load("../tests/types/policy_type_exports_suite")["printTypeExportsPolicyReport"](result);
      return toRunnerResult('type-exports-policy', 'TypeExports Policy Declaration Gate', result);
    },
"type-exports-builder": () => {
      const result = load("../tests/types/builder_type_exports_suite")["runTypeExportsBuilderSuite"]({ rootDir });
      load("../tests/types/builder_type_exports_suite")["printTypeExportsBuilderReport"](result);
      return toRunnerResult('type-exports-builder', 'TypeExports Builder Declaration Gate', result);
    },
"type-exports-catalog": () => {
      const result = load("../tests/types/catalog_type_exports_suite")["runTypeExportsCatalogSuite"]({ rootDir });
      load("../tests/types/catalog_type_exports_suite")["printTypeExportsCatalogReport"](result);
      return toRunnerResult('type-exports-catalog', 'TypeExports Catalog Declaration Gate', result);
    },
"type-exports-vendor": () => {
      const result = load("../tests/types/vendor_type_exports_suite")["runTypeExportsVendorSuite"]({ rootDir });
      load("../tests/types/vendor_type_exports_suite")["printTypeExportsVendorReport"](result);
      return toRunnerResult('type-exports-vendor', 'TypeExports Vendor and Utility Facade Gate', result);
    },
"maraca-plan": () => {
      const result = load("../tests/maraca/maraca_suite")["runMaracaPlanSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaPlanReport"](result);
      return toRunnerResult('maraca-plan', 'XTend Maraca Build Plan', result);
    },
"maraca-bundle": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaBundleSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaBundleReport"](result);
      return toRunnerResult('maraca-bundle', 'XTend Maraca Bundle', result);
    },
"maraca-bundle-report": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaBundleSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaBundleReport"](result);
      return toRunnerResult('maraca-bundle-report', 'XTend Maraca Bundle Report', result);
    },
"maraca-app-services-runtime": async () => {
      const result = await load("../tests/maraca/maraca_app_services_runtime_suite")["runMaracaAppServicesRuntimeSuite"]({ rootDir });
      load("../tests/maraca/maraca_app_services_runtime_suite")["printMaracaAppServicesRuntimeReport"](result);
      return toRunnerResult('maraca-app-services-runtime', 'XTend Maraca AppServices Runtime', result);
    },
"maraca-app-services-cross-runtime": async () => {
      const result = await load("../tests/maraca/maraca_app_services_cross_runtime_parity_suite")["runMaracaAppServicesCrossRuntimeParitySuite"]({ rootDir });
      load("../tests/maraca/maraca_app_services_cross_runtime_parity_suite")["printMaracaAppServicesCrossRuntimeParityReport"](result);
      return toRunnerResult('maraca-app-services-cross-runtime', 'XTend Maraca AppServices Node/PHP Cross-Runtime Parity', result);
    },
"maraca-node-app-host": async () => {
      const result = await load("../tests/maraca/maraca_node_app_host_suite")["runMaracaNodeAppHostSuite"]({ rootDir });
      load("../tests/maraca/maraca_node_app_host_suite")["printMaracaNodeAppHostReport"](result);
      return toRunnerResult('maraca-node-app-host', 'XTend Maraca Node App Host', result);
    },
"xtend-llm-app-services-catfood": () => {
      const result = load("../tests/products/xtend_llm_app_services_catfood_suite")["runXtendLlmAppServicesCatfoodSuite"]({ rootDir });
      load("../tests/products/xtend_llm_app_services_catfood_suite")["printXtendLlmAppServicesCatfoodReport"](result);
      return toRunnerResult('xtend-llm-app-services-catfood', 'XTend LLM AppServices Catfood', result);
    },
"maraca-app-services-test-bench": async () => {
      const result = await load("../tests/products/maraca_app_services_test_bench_suite")["runMaracaAppServicesTestBenchSuite"]({ rootDir });
      load("../tests/products/maraca_app_services_test_bench_suite")["printMaracaAppServicesTestBenchReport"](result);
      return toRunnerResult('maraca-app-services-test-bench', 'Maraca App Services Test Bench', result);
    },
"maraca-app-services-build": async () => {
      const result = await load("../tests/maraca/maraca_app_services_build_suite")["runMaracaAppServicesBuildSuite"]({ rootDir });
      load("../tests/maraca/maraca_app_services_build_suite")["printMaracaAppServicesBuildReport"](result);
      return toRunnerResult('maraca-app-services-build', 'XTend Maraca AppServices Build Source-to-Sea', result);
    },
"maraca-web-app-manifest": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaWebAppManifestSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaWebAppManifestReport"](result);
      return toRunnerResult('maraca-web-app-manifest', 'XTend Maraca Web App Manifest Assistant', result);
    },
"maraca-pwa-service-worker": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaPwaServiceWorkerSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaPwaServiceWorkerReport"](result);
      return toRunnerResult('maraca-pwa-service-worker', 'XTend Maraca PWA Service Worker Assistant', result);
    },
"maraca-rmt-source-to-bundle": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaRmtSourceToBundleSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaRmtSourceToBundleReport"](result);
      return toRunnerResult('maraca-rmt-source-to-bundle', 'XTend Maraca RMT Source-to-Bundle CLI', result);
    },
"maraca-orchestration": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaOrchestrationSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaOrchestrationReport"](result);
      return toRunnerResult('maraca-orchestration', 'XTend Maraca App Orchestration', result);
    },
"maraca-kernel-orchestration": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaKernelOrchestrationSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaKernelOrchestrationReport"](result);
      return toRunnerResult('maraca-kernel-orchestration', 'XTend Maraca Kernel Orchestration', result);
    },
"rmt-kernel-orchestration": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaKernelOrchestrationSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaKernelOrchestrationReport"](result);
      return toRunnerResult('rmt-kernel-orchestration', 'XTend RMT Kernel Orchestration', result);
    },
"maraca-kernel-integrity": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaKernelIntegritySuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaKernelIntegrityReport"](result);
      return toRunnerResult('maraca-kernel-integrity', 'XTend Maraca Kernel Integrity', result);
    },
"maraca-validation": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaValidationSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaValidationReport"](result);
      return toRunnerResult('maraca-validation', 'XTend Maraca Form Validation', result);
    },
"maraca-transitions": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaTransitionSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaTransitionReport"](result);
      return toRunnerResult('maraca-transitions', 'XTend Maraca Surface Transitions', result);
    },
"maraca-package-exports": () => {
      const result = load("../tests/maraca/maraca_suite")["runMaracaPackageExportsSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaPackageExportsReport"](result);
      return toRunnerResult('maraca-package-exports', 'XTend Maraca Package Exports', result);
    },
"maraca-size-budget": async () => {
      const result = await load("../tests/maraca/maraca_suite")["runMaracaSizeBudgetSuite"]({ rootDir });
      load("../tests/maraca/maraca_suite")["printMaracaSizeBudgetReport"](result);
      return toRunnerResult('maraca-size-budget', 'XTend Maraca Size Budget', result);
    },
"epic13-known-residual-triage": () => {
      const result = load("../tests/platform/epic13_known_residual_triage_suite")["runEpic13KnownResidualTriageSuite"]({ rootDir });
      load("../tests/platform/epic13_known_residual_triage_suite")["printEpic13KnownResidualTriageReport"](result);
      return toRunnerResult('epic13-known-residual-triage', 'Epic 13 Known Residual Triage', result);
    },
"epic13-hydration-performance-closure": () => {
      const result = load("../tests/platform/epic13_hydration_performance_closure_suite")["runEpic13HydrationPerformanceClosureSuite"]({ rootDir });
      load("../tests/platform/epic13_hydration_performance_closure_suite")["printEpic13HydrationPerformanceClosureReport"](result);
      return toRunnerResult('epic13-hydration-performance-closure', 'Epic 13 Hydration Performance Closure', result);
    },
"epic13-prod-browser-csp-smoke": async () => {
      const result = await load("../tests/platform/epic13_prod_browser_csp_smoke_suite")["runEpic13ProdBrowserCspSmokeSuite"]({ rootDir });
      load("../tests/platform/epic13_prod_browser_csp_smoke_suite")["printEpic13ProdBrowserCspSmokeReport"](result);
      return toRunnerResult('epic13-prod-browser-csp-smoke', 'Epic 13 PROD Browser CSP Smoke', result);
    },
"epic13-visual-owner-artifact": () => {
      const result = load("../tests/platform/epic13_visual_owner_artifact_suite")["runEpic13VisualOwnerArtifactSuite"]({ rootDir });
      load("../tests/platform/epic13_visual_owner_artifact_suite")["printEpic13VisualOwnerArtifactReport"](result);
      return toRunnerResult('epic13-visual-owner-artifact', 'Epic 13 Visual Owner Artifact', result);
    },
"epic13-rmt-production-readiness": () => {
      const result = load("../tests/platform/epic13_rmt_production_readiness_suite")["runEpic13RmtProductionReadinessSuite"]({ rootDir });
      load("../tests/platform/epic13_rmt_production_readiness_suite")["printEpic13RmtProductionReadinessReport"](result);
      return toRunnerResult('epic13-rmt-production-readiness', 'Epic 13 RMT Production Readiness', result);
    },
"epic13-docs-rmt-production-hardening": () => {
      const result = load("../tests/platform/epic13_docs_rmt_production_hardening_suite")["runEpic13DocsRmtProductionHardeningSuite"]({ rootDir });
      load("../tests/platform/epic13_docs_rmt_production_hardening_suite")["printEpic13DocsRmtProductionHardeningReport"](result);
      return toRunnerResult('epic13-docs-rmt-production-hardening', 'Epic 13 Docs RMT Production Hardening', result);
    },
"epic13-trusted-dom-boundary": async () => {
      const result = await load("../tests/platform/epic13_trusted_dom_boundary_suite")["runEpic13TrustedDomBoundarySuite"]({ rootDir });
      load("../tests/platform/epic13_trusted_dom_boundary_suite")["printEpic13TrustedDomBoundaryReport"](result);
      return toRunnerResult('epic13-trusted-dom-boundary', 'Epic 13 Trusted DOM Boundary', result);
    },
"epic13-rc1-migration-notes": () => {
      const result = load("../tests/platform/epic13_rc1_migration_notes_suite")["runEpic13Rc1MigrationNotesSuite"]({ rootDir });
      load("../tests/platform/epic13_rc1_migration_notes_suite")["printEpic13Rc1MigrationNotesReport"](result);
      return toRunnerResult('epic13-rc1-migration-notes', 'Epic 13 RC1 Migration Notes', result);
    },
"epic13-rc1-gate-matrix-ci-handoff": () => {
      const result = load("../tests/platform/epic13_rc1_gate_matrix_ci_handoff_suite")["runEpic13Rc1GateMatrixCiHandoffSuite"]({ rootDir });
      load("../tests/platform/epic13_rc1_gate_matrix_ci_handoff_suite")["printEpic13Rc1GateMatrixCiHandoffReport"](result);
      return toRunnerResult('epic13-rc1-gate-matrix-ci-handoff', 'Epic 13 RC1 Gate Matrix and CI Handoff', result);
    },
"epic13-release-report-pack-dry-run-evidence": () => {
      const result = load("../tests/platform/epic13_release_report_pack_dry_run_evidence_suite")["runEpic13ReleaseReportPackDryRunEvidenceSuite"]({ rootDir });
      load("../tests/platform/epic13_release_report_pack_dry_run_evidence_suite")["printEpic13ReleaseReportPackDryRunEvidenceReport"](result);
      return toRunnerResult('epic13-release-report-pack-dry-run-evidence', 'Epic 13 Release Report and Pack Dry Run Evidence', result);
    },
"pack-dry-run": async () => {
      const result = await load("../tests/performance/xtend_material_performance_suite")["runXtendMaterialPackDryRunSuite"]({ rootDir });
      load("../tests/performance/xtend_material_performance_suite")["printXtendMaterialPackDryRunReport"](result);
      return toRunnerResult('pack-dry-run', 'XTM-11 Material Package Dry Run', result);
    },
"component-ux-authoring-docs": () => {
      const result = load("../tests/docs/component_ux_authoring_docs_suite")["runComponentUxAuthoringDocsSuite"]({ rootDir });
      load("../tests/docs/component_ux_authoring_docs_suite")["printComponentUxAuthoringDocsReport"](result);
      return toRunnerResult('component-ux-authoring-docs', 'Epic 11 Component UX Authoring Docs', result);
    },
"component-long-tail-migration": () => {
      const result = load("../tests/catalog/component_long_tail_migration_suite")["runComponentLongTailMigrationSuite"]({ rootDir });
      load("../tests/catalog/component_long_tail_migration_suite")["printComponentLongTailMigrationReport"](result);
      return toRunnerResult('component-long-tail-migration', 'Epic 11 Legacy Long-Tail Migration', result);
    },
"epic11-enterprise-ux-handoff": () => {
      const result = load("../tests/platform/epic11_enterprise_ux_handoff_suite")["runEpic11EnterpriseUxHandoffSuite"]({ rootDir });
      load("../tests/platform/epic11_enterprise_ux_handoff_suite")["printEpic11EnterpriseUxHandoffReport"](result);
      return toRunnerResult('epic11-enterprise-ux-handoff', 'Epic 11 Enterprise UX Handoff', result);
    },
"rmt-demo-inventory": () => {
      const result = load("../tests/rmt/rmt_demo_inventory_suite")["runRmtDemoInventorySuite"]({ rootDir });
      load("../tests/rmt/rmt_demo_inventory_suite")["printRmtDemoInventoryReport"](result);
      return toRunnerResult('rmt-demo-inventory', 'XTendRMT Demo Inventory', result);
    },
"rmt-first-demo-app": () => {
      const result = load("../tests/rmt/rmt_first_demo_app_suite")["runRmtFirstDemoAppSuite"]({ rootDir });
      load("../tests/rmt/rmt_first_demo_app_suite")["printRmtFirstDemoAppReport"](result);
      return toRunnerResult('rmt-first-demo-app', 'Epic 10 RMT-first Demo App', result);
    },
"rmt-lifecycle-demo": () => {
      const result = load("../tests/rmt/rmt_lifecycle_demo_suite")["runRmtLifecycleDemoSuite"]({ rootDir });
      load("../tests/rmt/rmt_lifecycle_demo_suite")["printRmtLifecycleDemoReport"](result);
      return toRunnerResult('rmt-lifecycle-demo', 'RMT Lifecycle Demo', result);
    },
"existing-component-metadata": () => {
      const result = load("../tests/components/existing_component_metadata_migration_suite")["runExistingComponentMetadataMigrationSuite"]({ rootDir });
      load("../tests/components/existing_component_metadata_migration_suite")["printExistingComponentMetadataMigrationReport"](result);
      return toRunnerResult('existing-component-metadata', 'Epic 10 Existing Component RMT/Fabric Metadata Migration', result);
    },
"epic10-platform-gates": () => {
      const result = load("../tests/platform/epic10_platform_gates_suite")["runEpic10PlatformGatesSuite"]({ rootDir });
      load("../tests/platform/epic10_platform_gates_suite")["printEpic10PlatformGatesReport"](result);
      return toRunnerResult('epic10-platform-gates', 'Epic 10 Browser, A11y, Performance and Visual Platform Gates', result);
    },
"epic10-release-handoff": () => {
      const result = load("../tests/platform/epic10_release_handoff_suite")["runEpic10ReleaseHandoffSuite"]({ rootDir });
      load("../tests/platform/epic10_release_handoff_suite")["printEpic10ReleaseHandoffReport"](result);
      return toRunnerResult('epic10-release-handoff', 'Epic 10 Documentation, Guides and Release Handoff', result);
    },
"a11y-hydration": () => {
      const result = load("../tests/components/accessibility_hydration_suite")["runAccessibilityHydrationSuite"]({ rootDir });
      load("../tests/components/accessibility_hydration_suite")["printAccessibilityHydrationReport"](result);
      return toRunnerResult('a11y-hydration', 'Accessibility and hydration gates', result);
    },
"aria-in-html-conformance": () => {
      const result = load("../tests/a11y/aria_in_html_conformance_suite")["runAriaInHtmlConformanceSuite"]({ rootDir });
      load("../tests/a11y/aria_in_html_conformance_suite")["printAriaInHtmlConformanceReport"](result);
      return toRunnerResult('aria-in-html-conformance', 'ARIA in HTML 2026 author-conformance gate', result);
    },
"screenreader-signals": () => {
      const result = load("../tests/a11y/screenreader_signal_suite")["runScreenreaderSignalSuite"]({ rootDir });
      load("../tests/a11y/screenreader_signal_suite")["printScreenreaderSignalReport"](result);
      return toRunnerResult('screenreader-signals', 'Screenreader signal contract gates', result);
    },
"motion-contrast": () => {
      const result = load("../tests/a11y/motion_contrast_suite")["runMotionContrastSuite"]({ rootDir });
      load("../tests/a11y/motion_contrast_suite")["printMotionContrastReport"](result);
      return toRunnerResult('motion-contrast', 'Reduced Motion and High Contrast gates', result);
    },
"runtime-a11y-contract": () => {
      const result = load("../tests/a11y/runtime_a11y_contract_suite")["runRuntimeA11yContractSuite"]({ rootDir });
      load("../tests/a11y/runtime_a11y_contract_suite")["printRuntimeA11yContractReport"](result);
      return toRunnerResult('runtime-a11y-contract', 'XTend Runtime A11y UX Contract', result);
    },
"component-runtime-a11y": () => {
      const result = load("../tests/a11y/runtime_a11y_contract_suite")["runRuntimeA11yContractSuite"]({ rootDir });
      load("../tests/a11y/runtime_a11y_contract_suite")["printRuntimeA11yContractReport"](result);
      return toRunnerResult('component-runtime-a11y', 'XTend Component Runtime A11y UX Contract', result);
    },
"component-ux-performance": () => {
      const result = load("../tests/performance/component_ux_performance_contract_suite")["runComponentUxPerformanceContractSuite"]({ rootDir });
      load("../tests/performance/component_ux_performance_contract_suite")["printComponentUxPerformanceContractReport"](result);
      return toRunnerResult('component-ux-performance', 'XTend Component UX Performance Contract', result);
    },
"xtend-material-performance": async () => {
      const result = await load("../tests/performance/xtend_material_performance_suite")["runXtendMaterialPerformanceSuite"]({ rootDir });
      load("../tests/performance/xtend_material_performance_suite")["printXtendMaterialPerformanceReport"](result);
      return toRunnerResult('xtend-material-performance', 'XTM-11 XTend Material Quality and Anti-Monkeypatching', result);
    },
"xtend-material-catfooding": async () => {
      const result = await load("../tests/products/xtend_material_catfooding_suite")["runXtendMaterialCatfoodingSuite"]({ rootDir });
      load("../tests/products/xtend_material_catfooding_suite")["printXtendMaterialCatfoodingReport"](result);
      return toRunnerResult('xtend-material-catfooding', 'XTM-12 XTend Material Catfooding Workbench', result);
    },
"erp-resumability-catfood": async () => {
      const result = await load("../tests/products/erp_resumability_catfooding_suite")["runErpResumabilityCatfoodingSuite"]({ rootDir });
      load("../tests/products/erp_resumability_catfooding_suite")["printErpResumabilityCatfoodingReport"](result);
      return toRunnerResult('erp-resumability-catfood', 'RMT ERP Resumability Catfooding', result);
    },
"xtend-material-cli-generated-app": async () => {
      const result = await load('../tests/products/xtend_material_cli_generated_app_suite')['runXtendMaterialCliGeneratedAppSuite']({ rootDir });
      load('../tests/products/xtend_material_cli_generated_app_suite')['printXtendMaterialCliGeneratedAppReport'](result);
      return toRunnerResult('xtend-material-cli-generated-app', 'XTM-14 CLI-generated Kernel Material App', result);
    },
"xtend-material-docs": async () => {
      const result = await load("../tests/docs/xtend_material_docs_suite")["runXtendMaterialDocsSuite"]({ rootDir });
      load("../tests/docs/xtend_material_docs_suite")["printXtendMaterialDocsReport"](result);
      return toRunnerResult('xtend-material-docs', 'XTM-13 XTend Material Docs, Migration and Release', result);
    },
"component-network-contract": () => {
      const result = load("../tests/components/component_network_contract_suite")["runComponentNetworkContractSuite"]({ rootDir });
      load("../tests/components/component_network_contract_suite")["printComponentNetworkContractReport"](result);
      return toRunnerResult('component-network-contract', 'XTend Component Network Contract', result);
    },
"rmt-shell-authoring-ux": () => {
      const result = load("../tests/rmt/rmt_shell_authoring_component_ux_suite")["runRmtShellAuthoringComponentUxSuite"]({ rootDir });
      load("../tests/rmt/rmt_shell_authoring_component_ux_suite")["printRmtShellAuthoringComponentUxReport"](result);
      return toRunnerResult('rmt-shell-authoring-ux', 'XTend RMT Shell Authoring for Component UX', result);
    },
"form-controls-ux": () => {
      const result = load("../tests/components/form_controls_ux_suite")["runFormControlsUxSuite"]({ rootDir });
      load("../tests/components/form_controls_ux_suite")["printFormControlsUxReport"](result);
      return toRunnerResult('form-controls-ux', 'XTend Form Controls UX maturity', result);
    },
"feedback-status-ux": () => {
      const result = load("../tests/components/feedback_status_ux_suite")["runFeedbackStatusUxSuite"]({ rootDir });
      load("../tests/components/feedback_status_ux_suite")["printFeedbackStatusUxReport"](result);
      return toRunnerResult('feedback-status-ux', 'XTend Feedback and Status UX maturity', result);
    },
"navigation-routing-ux": () => {
      const result = load("../tests/components/navigation_routing_ux_suite")["runNavigationRoutingUxSuite"]({ rootDir });
      load("../tests/components/navigation_routing_ux_suite")["printNavigationRoutingUxReport"](result);
      return toRunnerResult('navigation-routing-ux', 'XTend Navigation and Routing UX maturity', result);
    },
"overlay-interaction-ux": () => {
      const result = load("../tests/components/overlay_interaction_ux_suite")["runOverlayInteractionUxSuite"]({ rootDir });
      load("../tests/components/overlay_interaction_ux_suite")["printOverlayInteractionUxReport"](result);
      return toRunnerResult('overlay-interaction-ux', 'XTend Overlay and Interaction UX maturity', result);
    },
"browser-hypervisor": async () => {
      const result = await load("../tests/browser/browser_hypervisor_suite")["runBrowserHypervisorSuite"]({ rootDir });
      load("../tests/browser/browser_hypervisor_suite")["printBrowserHypervisorReport"](result);
      return toRunnerResult('browser-hypervisor', 'XTend Browser Hypervisor', result);
    },
"browser-primitive-radar": () => {
      const result = load("../tests/native-first/browser_primitive_radar_suite")["runBrowserPrimitiveRadarSuite"]({ rootDir });
      load("../tests/native-first/browser_primitive_radar_suite")["printBrowserPrimitiveRadarReport"](result);
      return toRunnerResult('browser-primitive-radar', 'Browser Primitive Radar and Observatory Intake', result);
    },
"primitive-adoption-gate": () => {
      const result = load("../tests/native-first/primitive_adoption_gate_suite")["runPrimitiveAdoptionGateSuite"]({ rootDir });
      load("../tests/native-first/primitive_adoption_gate_suite")["printPrimitiveAdoptionGateReport"](result);
      return toRunnerResult('primitive-adoption-gate', 'Native Primitive Adoption Gate', result);
    },
"observatory-adoption-labs": () => {
      const result = load("../tests/native-first/observatory_adoption_labs_suite")["runObservatoryAdoptionLabsSuite"]({ rootDir });
      load("../tests/native-first/observatory_adoption_labs_suite")["printObservatoryAdoptionLabsReport"](result);
      return toRunnerResult('observatory-adoption-labs', 'Observatory Adoption Labs', result);
    },
"native-first-overlay-focus": () => {
      const result = load("../tests/native-first/native_first_overlay_focus_suite")["runNativeFirstOverlayFocusSuite"]({ rootDir });
      load("../tests/native-first/native_first_overlay_focus_suite")["printNativeFirstOverlayFocusReport"](result);
      return toRunnerResult('native-first-overlay-focus', 'Native-First Overlay Focus Hardening', result);
    },
"native-first-form-navigation-media": () => {
      const result = load("../tests/native-first/native_first_form_navigation_media_suite")["runNativeFirstFormNavigationMediaSuite"]({ rootDir });
      load("../tests/native-first/native_first_form_navigation_media_suite")["printNativeFirstFormNavigationMediaReport"](result);
      return toRunnerResult('native-first-form-navigation-media', 'Native-First Form Navigation Media Hardening', result);
    },
"native-first-framework-leverage": () => {
      const result = load("../tests/native-first/native_first_framework_leverage_suite")["runNativeFirstFrameworkLeverageSuite"]({ rootDir });
      load("../tests/native-first/native_first_framework_leverage_suite")["printNativeFirstFrameworkLeverageReport"](result);
      return toRunnerResult('native-first-framework-leverage', 'Native-First Framework Leverage Layer', result);
    },
"native-first-market-pattern-parity": () => {
      const result = load("../tests/native-first/native_first_market_pattern_parity_suite")["runNativeFirstMarketPatternParitySuite"]({ rootDir });
      load("../tests/native-first/native_first_market_pattern_parity_suite")["printNativeFirstMarketPatternParityReport"](result);
      return toRunnerResult('native-first-market-pattern-parity', 'Native-First Market Pattern Parity', result);
    },
"contract-registry": () => {
      const result = load("../tests/native-first/native_first_contract_registry_suite")["runNativeFirstContractRegistrySuite"]({ rootDir });
      load("../tests/native-first/native_first_contract_registry_suite")["printNativeFirstContractRegistryReport"](result);
      return toRunnerResult('contract-registry', 'Native-First Contract Registry', result);
    },
"schema-inventory": () => {
      const result = load("../tests/schemas/schema_inventory_suite")["runSchemaInventorySuite"]({ rootDir });
      load("../tests/schemas/schema_inventory_suite")["printSchemaInventoryReport"](result);
      return toRunnerResult('schema-inventory', 'XTend Schema Inventory', result);
    },
"contract-runtime-parity": () => {
      const result = load("../tests/native-first/native_first_contract_runtime_parity_suite")["runNativeFirstContractRuntimeParitySuite"]({ rootDir });
      load("../tests/native-first/native_first_contract_runtime_parity_suite")["printNativeFirstContractRuntimeParityReport"](result);
      return toRunnerResult('contract-runtime-parity', 'Native-First Contract-to-Runtime Parity', result);
    },
"native-first-evidence-pack": () => {
      const result = load("../tests/native-first/native_first_audit_evidence_pack_suite")["runNativeFirstAuditEvidencePackSuite"]({ rootDir });
      load("../tests/native-first/native_first_audit_evidence_pack_suite")["printNativeFirstAuditEvidencePackReport"](result);
      return toRunnerResult('native-first-evidence-pack', 'Native-First Audit Evidence Pack', result);
    },
"rmt-ui-primitive-gap": () => {
      const result = load("../tests/native-first/native_first_rmt_ui_primitive_gap_suite")["runNativeFirstRmtUiPrimitiveGapSuite"]({ rootDir });
      load("../tests/native-first/native_first_rmt_ui_primitive_gap_suite")["printNativeFirstRmtUiPrimitiveGapReport"](result);
      return toRunnerResult('rmt-ui-primitive-gap', 'Native-First RMT UI Primitive Gap Analysis', result);
    },
"rmt-syntax-growth": () => {
      const result = load("../tests/native-first/native_first_rmt_syntax_growth_suite")["runNativeFirstRmtSyntaxGrowthSuite"]({ rootDir });
      load("../tests/native-first/native_first_rmt_syntax_growth_suite")["printNativeFirstRmtSyntaxGrowthReport"](result);
      return toRunnerResult('rmt-syntax-growth', 'Native-First RMT Syntax Growth', result);
    },
"rmt-action-effect-data-resource-primitives": () => {
      const result = load("../tests/native-first/native_first_rmt_action_effect_data_resource_suite")["runNativeFirstRmtActionEffectDataResourceSuite"]({ rootDir });
      load("../tests/native-first/native_first_rmt_action_effect_data_resource_suite")["printNativeFirstRmtActionEffectDataResourceReport"](result);
      return toRunnerResult('rmt-action-effect-data-resource-primitives', 'Native-First RMT Action Effect Data Resource Primitives', result);
    },
"rmt-complete-ui-recipes": () => {
      const result = load("../tests/native-first/native_first_rmt_complete_ui_recipe_suite")["runNativeFirstRmtCompleteUiRecipeSuite"]({ rootDir });
      load("../tests/native-first/native_first_rmt_complete_ui_recipe_suite")["printNativeFirstRmtCompleteUiRecipeReport"](result);
      return toRunnerResult('rmt-complete-ui-recipes', 'Native-First RMT Complete UI Recipes', result);
    },
"rmt-renderer-dom-descriptor-proofs": () => {
      const result = load("../tests/native-first/native_first_rmt_renderer_dom_descriptor_proofs_suite")["runNativeFirstRmtRendererDomDescriptorProofSuite"]({ rootDir });
      load("../tests/native-first/native_first_rmt_renderer_dom_descriptor_proofs_suite")["printNativeFirstRmtRendererDomDescriptorProofReport"](result);
      return toRunnerResult('rmt-renderer-dom-descriptor-proofs', 'Native-First RMT Renderer DOM Descriptor Proofs', result);
    },
"native-first-budget-gates": () => {
      const result = load("../tests/native-first/native_first_budget_gate_suite")["runNativeFirstBudgetGateSuite"]({ rootDir });
      load("../tests/native-first/native_first_budget_gate_suite")["printNativeFirstBudgetGateReport"](result);
      return toRunnerResult('native-first-budget-gates', 'Native-First Performance Complexity Bundle Budget Gates', result);
    },
"native-first-docs-authoring": () => {
      const result = load("../tests/native-first/native_first_docs_authoring_suite")["runNativeFirstDocsAuthoringSuite"]({ rootDir });
      load("../tests/native-first/native_first_docs_authoring_suite")["printNativeFirstDocsAuthoringReport"](result);
      return toRunnerResult('native-first-docs-authoring', 'Native-First Docs Authoring Guides', result);
    },
"native-first-migration-deprecation": () => {
      const result = load("../tests/native-first/native_first_migration_deprecation_suite")["runNativeFirstMigrationDeprecationSuite"]({ rootDir });
      load("../tests/native-first/native_first_migration_deprecation_suite")["printNativeFirstMigrationDeprecationReport"](result);
      return toRunnerResult('native-first-migration-deprecation', 'Native-First Migration Deprecation Plan', result);
    },
"native-first-mission-handoff": () => {
      const result = load("../tests/native-first/native_first_mission_handoff_suite")["runNativeFirstMissionHandoffSuite"]({ rootDir });
      load("../tests/native-first/native_first_mission_handoff_suite")["printNativeFirstMissionHandoffReport"](result);
      return toRunnerResult('native-first-mission-handoff', 'Native-First Mission Handoff', result);
    },
"rmt-ui-maximality-owned-surface-baseline": () => {
      const result = load("../tests/native-first/rmt_ui_maximality_owned_surface_baseline_suite")["runRmtUiMaximalityOwnedSurfaceBaselineSuite"]({ rootDir });
      load("../tests/native-first/rmt_ui_maximality_owned_surface_baseline_suite")["printRmtUiMaximalityOwnedSurfaceBaselineReport"](result);
      return toRunnerResult('rmt-ui-maximality-owned-surface-baseline', 'RMT UI Maximality Owned Surface Baseline', result);
    },
"rmt-ui-maximality-owned-surface-gate-hygiene": () => {
      const result = load("../tests/native-first/rmt_ui_maximality_owned_surface_gate_hygiene_suite")["runRmtUiMaximalityOwnedSurfaceGateHygieneSuite"]({ rootDir });
      load("../tests/native-first/rmt_ui_maximality_owned_surface_gate_hygiene_suite")["printRmtUiMaximalityOwnedSurfaceGateHygieneReport"](result);
      return toRunnerResult('rmt-ui-maximality-owned-surface-gate-hygiene', 'RMT UI Maximality Owned Surface Gate Hygiene', result);
    },
"rmt-owned-data-display-primitives": () => {
      const result = load("../tests/native-first/rmt_owned_data_display_primitives_suite")["runRmtOwnedDataDisplayPrimitivesSuite"]({ rootDir });
      load("../tests/native-first/rmt_owned_data_display_primitives_suite")["printRmtOwnedDataDisplayPrimitivesReport"](result);
      return toRunnerResult('rmt-owned-data-display-primitives', 'RMT Owned Data Display Primitives', result);
    },
"rmt-owned-command-search-primitives": () => {
      const result = load("../tests/native-first/rmt_owned_command_search_primitives_suite")["runRmtOwnedCommandSearchPrimitivesSuite"]({ rootDir });
      load("../tests/native-first/rmt_owned_command_search_primitives_suite")["printRmtOwnedCommandSearchPrimitivesReport"](result);
      return toRunnerResult('rmt-owned-command-search-primitives', 'RMT Owned Command Search Primitives', result);
    },
"rmt-owned-recipe-extension": () => {
      const result = load("../tests/native-first/rmt_owned_recipe_extension_suite")["runRmtOwnedRecipeExtensionSuite"]({ rootDir });
      load("../tests/native-first/rmt_owned_recipe_extension_suite")["printRmtOwnedRecipeExtensionReport"](result);
      return toRunnerResult('rmt-owned-recipe-extension', 'RMT Owned Recipe Extension', result);
    },
"rmt-owned-surface-browser-lab": () => {
      const result = load("../tests/native-first/rmt_owned_surface_browser_lab_suite")["runRmtOwnedSurfaceBrowserLabSuite"]({ rootDir });
      load("../tests/native-first/rmt_owned_surface_browser_lab_suite")["printRmtOwnedSurfaceBrowserLabReport"](result);
      return toRunnerResult('rmt-owned-surface-browser-lab', 'RMT Owned Surface Browser Lab Visual Evidence', result);
    },
"rmt-owned-contract-budget-runtime-parity": () => {
      const result = load("../tests/native-first/rmt_owned_contract_budget_runtime_parity_suite")["runRmtOwnedContractBudgetRuntimeParitySuite"]({ rootDir });
      load("../tests/native-first/rmt_owned_contract_budget_runtime_parity_suite")["printRmtOwnedContractBudgetRuntimeParityReport"](result);
      return toRunnerResult('rmt-owned-contract-budget-runtime-parity', 'RMT Owned Contract Budget Runtime Parity', result);
    },
"rmt-owned-migration-deprecation-docs-handoff": () => {
      const result = load("../tests/native-first/rmt_owned_migration_deprecation_docs_handoff_suite")["runRmtOwnedMigrationDeprecationDocsHandoffSuite"]({ rootDir });
      load("../tests/native-first/rmt_owned_migration_deprecation_docs_handoff_suite")["printRmtOwnedMigrationDeprecationDocsHandoffReport"](result);
      return toRunnerResult('rmt-owned-migration-deprecation-docs-handoff', 'RMT Owned Migration Deprecation Docs Handoff', result);
    },
"rmt-owned-release-handoff": () => {
      const result = load("../tests/native-first/rmt_owned_release_handoff_suite")["runRmtOwnedReleaseHandoffSuite"]({ rootDir });
      load("../tests/native-first/rmt_owned_release_handoff_suite")["printRmtOwnedReleaseHandoffReport"](result);
      return toRunnerResult('rmt-owned-release-handoff', 'RMT Owned Release Handoff', result);
    },
"layout-display-media-ux": () => {
      const result = load("../tests/components/layout_display_media_ux_suite")["runLayoutDisplayMediaUxSuite"]({ rootDir });
      load("../tests/components/layout_display_media_ux_suite")["printLayoutDisplayMediaUxReport"](result);
      return toRunnerResult('layout-display-media-ux', 'XTend Layout Display and Media UX maturity', result);
    },
"catalog-coverage": () => {
      const result = load("../tests/catalog/component_catalog_coverage_suite")["runComponentCatalogCoverageSuite"]({ rootDir });
      load("../tests/catalog/component_catalog_coverage_suite")["printComponentCatalogCoverageReport"](result);
      return toRunnerResult('catalog-coverage', 'XTend Component Catalog Coverage Matrix', result);
    },
"regression-priority": () => {
      const result = load("../tests/catalog/component_regression_priority_suite")["runComponentRegressionPrioritySuite"]({ rootDir });
      load("../tests/catalog/component_regression_priority_suite")["printComponentRegressionPriorityReport"](result);
      return toRunnerResult('regression-priority', 'XTend visual and browser regression priority plan', result);
    },
"fabric": () => {
      const result = load("../tests/fabric/fabric_runtime_suite")["runFabricRuntimeSuite"]({ rootDir });
      load("../tests/fabric/fabric_runtime_suite")["printFabricRuntimeReport"](result);
      return toRunnerResult('fabric', 'XTend-Fabric runtime skeleton', result);
    },
"fabric-lane-mapping": () => {
      const result = load("../tests/fabric/fabric_rmt_lane_mapping_suite")["runFabricRmtLaneMappingSuite"]({ rootDir });
      load("../tests/fabric/fabric_rmt_lane_mapping_suite")["printFabricRmtLaneMappingReport"](result);
      return toRunnerResult('fabric-lane-mapping', 'XTend-Fabric RMT lane mapping', result);
    },
"fabric-lifecycle-boundary": async () => {
      const result = await load("../tests/fabric/fabric_lifecycle_boundary_suite")["runFabricLifecycleBoundarySuite"]({ rootDir });
      load("../tests/fabric/fabric_lifecycle_boundary_suite")["printFabricLifecycleBoundaryReport"](result);
      return toRunnerResult('fabric-lifecycle-boundary', 'XTend-Fabric component lifecycle error boundary', result);
    },
"fabric-reporters": () => {
      const result = load("../tests/fabric/fabric_reporter_adapter_suite")["runFabricReporterAdapterSuite"]({ rootDir });
      load("../tests/fabric/fabric_reporter_adapter_suite")["printFabricReporterAdapterReport"](result);
      return toRunnerResult('fabric-reporters', 'XTend-Fabric reporter adapter contract', result);
    },
"fabric-runtime-bridge": () => {
      const result = load("../tests/fabric/fabric_runtime_diagnostics_bridge_suite")["runFabricRuntimeDiagnosticsBridgeSuite"]({ rootDir });
      load("../tests/fabric/fabric_runtime_diagnostics_bridge_suite")["printFabricRuntimeDiagnosticsBridgeReport"](result);
      return toRunnerResult('fabric-runtime-bridge', 'XTend-Fabric state API and RMT diagnostics bridge', result);
    },
"fabric-component-fibers": async () => {
      const result = await load("../tests/fabric/fabric_component_fiber_suite")["runFabricComponentFiberSuite"]({ rootDir });
      load("../tests/fabric/fabric_component_fiber_suite")["printFabricComponentFiberReport"](result);
      return toRunnerResult('fabric-component-fibers', 'XTend-Fabric component mount and hydration fibers', result);
    },
"fabric-route-fibers": async () => {
      const result = await load("../tests/fabric/fabric_route_fiber_suite")["runFabricRouteFiberSuite"]({ rootDir });
      load("../tests/fabric/fabric_route_fiber_suite")["printFabricRouteFiberReport"](result);
      return toRunnerResult('fabric-route-fibers', 'XTend-Fabric route navigation and render fibers', result);
    },
"fabric-telemetry-snapshot": () => {
      const result = load("../tests/fabric/fabric_telemetry_snapshot_suite")["runFabricTelemetrySnapshotSuite"]({ rootDir });
      load("../tests/fabric/fabric_telemetry_snapshot_suite")["printFabricTelemetrySnapshotReport"](result);
      return toRunnerResult('fabric-telemetry-snapshot', 'XTend-Fabric telemetry snapshots and backpressure', result);
    },
"fabric-performance-measurements": async () => {
      const result = await load("../tests/fabric/fabric_performance_measurement_suite")["runFabricPerformanceMeasurementSuite"]({ rootDir });
      load("../tests/fabric/fabric_performance_measurement_suite")["printFabricPerformanceMeasurementReport"](result);
      return toRunnerResult('fabric-performance-measurements', 'XTend-Fabric loader and hydration performance measurements', result);
    },
"performance-regression": async () => {
      const result = await load("../tests/performance/performance_regression_suite")["runPerformanceRegressionSuite"]({ rootDir });
      load("../tests/performance/performance_regression_suite")["printPerformanceRegressionReport"](result);
      return toRunnerResult('performance-regression', 'XTend Performance regression gates', result);
    },
"rmt-retained-warm-reuse-performance": () => {
      const result = load("../tests/performance/rmt_retained_warm_reuse_performance_suite")["runRmtRetainedWarmReusePerformanceSuite"]({ rootDir });
      load("../tests/performance/rmt_retained_warm_reuse_performance_suite")["printRmtRetainedWarmReusePerformanceReport"](result);
      return toRunnerResult('rmt-retained-warm-reuse-performance', 'RMT 0.8 retained warm reuse browser performance', result);
    },
"hydration-policy": async () => {
      const result = await load("../tests/performance/hydration_policy_suite")["runHydrationPolicySuite"]({ rootDir });
      load("../tests/performance/hydration_policy_suite")["printHydrationPolicyReport"](result);
      return toRunnerResult('hydration-policy', 'XTend Lazy/Idle/Visible hydration policy gates', result);
    },
"super-prewarm-worker-experiment": async () => {
      const result = await load("../tests/rmt/super_prewarm_worker_experiment_suite")["runSuperPrewarmWorkerExperimentSuite"]({ rootDir });
      load("../tests/rmt/super_prewarm_worker_experiment_suite")["printSuperPrewarmWorkerExperimentReport"](result);
      return toRunnerResult('super-prewarm-worker-experiment', 'XTend Super Prewarm Worker Experiment', result);
    },
"ui-coprocessor": () => {
      const result = load("../tests/rmt/ui_coprocessor_suite")["runUiCoprocessorSuite"]({ rootDir });
      load("../tests/rmt/ui_coprocessor_suite")["printUiCoprocessorReport"](result);
      return toRunnerResult('ui-coprocessor', 'XTend RMT UI Coprocessor', result);
    },
"xtend-layout-stability-contract": () => {
      const result = load("../tests/performance/xtend_layout_stability_contract_suite")["runXtendLayoutStabilityContractSuite"]({ rootDir });
      load("../tests/performance/xtend_layout_stability_contract_suite")["printXtendLayoutStabilityContractReport"](result);
      return toRunnerResult('xtend-layout-stability-contract', 'XTend Layout Stability Contract', result);
    },
"references": () => {
      const result = load("../tests/references/reference_path_suite")["runReferencePathSuite"]({ rootDir });
      load("../tests/references/reference_path_suite")["printReferencePathReport"](result);
      return toRunnerResult('references', 'Documentation and demo reference paths', result);
    },
"supply-chain": () => {
      const result = load("../tests/security/supply_chain_policy_suite")["runSupplyChainPolicySuite"]({ rootDir });
      load("../tests/security/supply_chain_policy_suite")["printSupplyChainPolicyReport"](result);
      return toRunnerResult('supply-chain', 'XTend Supply-Chain policy gates', result);
    },
"manifest-import-policy": () => {
      const result = load("../tests/security/manifest_import_policy_suite")["runManifestImportPolicySuite"]({ rootDir });
      load("../tests/security/manifest_import_policy_suite")["printManifestImportPolicyReport"](result);
      return toRunnerResult('manifest-import-policy', 'XTend manifest and dynamic import policy gates', result);
    },
"xss-pentest": async () => {
      const result = await load("../tests/security/xss_pentest_suite")["runXssPentestSuite"]({ rootDir });
      load("../tests/security/xss_pentest_suite")["printXssPentestReport"](result);
      return toRunnerResult('xss-pentest', 'XTend XSS pentest suite', result);
    },
"rmt-compatibility": () => {
      const result = load("../tests/rmt/rmt_compatibility_suite")["runRmtCompatibilitySuite"]({ rootDir });
      load("../tests/rmt/rmt_compatibility_suite")["printRmtCompatibilityReport"](result);
      return toRunnerResult('rmt-compatibility', 'XTendRMT compatibility gates', result);
    },
"rmt-bestcase-flagship": () => {
      const result = load("../tests/rmt/rmt_bestcase_flagship_suite")["runRmtBestcaseFlagshipSuite"]({ rootDir });
      load("../tests/rmt/rmt_bestcase_flagship_suite")["printRmtBestcaseFlagshipReport"](result);
      return toRunnerResult('rmt-bestcase-flagship', 'XTendRMT Bestcase Flagship Demo', result);
    },
"rmt-first-class-app": () => {
      const result = load("../tests/rmt/rmt_first_class_app_authoring_suite")["runRmtFirstClassAppAuthoringSuite"]({ rootDir });
      load("../tests/rmt/rmt_first_class_app_authoring_suite")["printRmtFirstClassAppAuthoringReport"](result);
      return toRunnerResult('rmt-first-class-app', 'RMT-first XTend app authoring contract', result);
    },
"rmt-surface-authoring": () => {
      const result = load("../tests/rmt/rmt_surface_manager_authoring_suite")["runRmtSurfaceManagerAuthoringSuite"]({ rootDir });
      load("../tests/rmt/rmt_surface_manager_authoring_suite")["printRmtSurfaceManagerAuthoringReport"](result);
      return toRunnerResult('rmt-surface-authoring', 'RMT SurfaceManager authoring contract', result);
    },
"rmt-app-platform-authoring": () => {
      const result = load("../tests/rmt/rmt_app_platform_authoring_suite")["runRmtAppPlatformAuthoringSuite"]({ rootDir });
      load("../tests/rmt/rmt_app_platform_authoring_suite")["printRmtAppPlatformAuthoringReport"](result);
      return toRunnerResult('rmt-app-platform-authoring', 'Epic 18 RMT App Platform authoring model', result);
    },
"rmt-dom-descriptor-renderer": async () => {
      const result = await load("../tests/rmt/rmt_dom_descriptor_renderer_suite")["runRmtDomDescriptorRendererSuite"]({ rootDir });
      load("../tests/rmt/rmt_dom_descriptor_renderer_suite")["printRmtDomDescriptorRendererReport"](result);
      return toRunnerResult('rmt-dom-descriptor-renderer', 'Epic 18 RMT DOM Descriptor renderer', result);
    },
"rmt-component-template-primitives": async () => {
      const result = await load("../tests/rmt/rmt_component_template_primitives_suite")["runRmtComponentTemplatePrimitivesSuite"]({ rootDir });
      load("../tests/rmt/rmt_component_template_primitives_suite")["printRmtComponentTemplatePrimitivesReport"](result);
      return toRunnerResult('rmt-component-template-primitives', 'Epic 18 RMT component-native template primitives', result);
    },
"rmt-state-selector-runtime": async () => {
      const result = await load("../tests/rmt/rmt_state_selector_runtime_suite")["runRmtStateSelectorRuntimeSuite"]({ rootDir });
      load("../tests/rmt/rmt_state_selector_runtime_suite")["printRmtStateSelectorRuntimeReport"](result);
      return toRunnerResult('rmt-state-selector-runtime', 'Epic 18 RMT typed state selector runtime', result);
    },
"rmt-action-effect-runtime": async () => {
      const result = await load("../tests/rmt/rmt_action_effect_runtime_suite")["runRmtActionEffectRuntimeSuite"]({ rootDir });
      load("../tests/rmt/rmt_action_effect_runtime_suite")["printRmtActionEffectRuntimeReport"](result);
      return toRunnerResult('rmt-action-effect-runtime', 'Epic 18 RMT action/effect runtime', result);
    },
"rmt-event-routing-runtime": async () => {
      const result = await load("../tests/rmt/rmt_event_routing_runtime_suite")["runRmtEventRoutingRuntimeSuite"]({ rootDir });
      load("../tests/rmt/rmt_event_routing_runtime_suite")["printRmtEventRoutingRuntimeReport"](result);
      return toRunnerResult('rmt-event-routing-runtime', 'Epic 18 RMT event routing runtime', result);
    },
"rmt-app-runtime": async () => {
      const result = await load("../tests/rmt/rmt_app_runtime_suite")["runRmtAppRuntimeSuite"]({ rootDir });
      load("../tests/rmt/rmt_app_runtime_suite")["printRmtAppRuntimeReport"](result);
      return toRunnerResult('rmt-app-runtime', 'RMT full app runtime', result);
    },
"rmt-surface-resource-graph-runtime": async () => {
      const result = await load("../tests/rmt/rmt_surface_resource_graph_runtime_suite")["runRmtSurfaceResourceGraphRuntimeSuite"]({ rootDir });
      load("../tests/rmt/rmt_surface_resource_graph_runtime_suite")["printRmtSurfaceResourceGraphRuntimeReport"](result);
      return toRunnerResult('rmt-surface-resource-graph-runtime', 'Epic 18 RMT surface resource graph runtime', result);
    },
"rmt-detached-runtime-harness": async () => {
      const result = await load("../tests/rmt/rmt_detached_runtime_harness_suite")["runRmtDetachedRuntimeHarnessSuite"]({ rootDir });
      load("../tests/rmt/rmt_detached_runtime_harness_suite")["printRmtDetachedRuntimeHarnessReport"](result);
      return toRunnerResult('rmt-detached-runtime-harness', 'RMT Detached Runtime gate harness', result);
    },
"rmt-dom-compat-parity": async () => {
      const result = await load("../tests/rmt/rmt_dom_compat_parity_suite")["runRmtDomCompatParitySuite"]({ rootDir });
      load("../tests/rmt/rmt_dom_compat_parity_suite")["printRmtDomCompatParityReport"](result);
      return toRunnerResult('rmt-dom-compat-parity', 'RMT DomCompat and SurfaceManager ownership parity', result);
    },
"rmt-app-platform-tooling": () => {
      const result = load("../tests/rmt-language/rmt_app_platform_tooling_suite")["runRmtAppPlatformToolingSuite"]({ rootDir });
      load("../tests/rmt-language/rmt_app_platform_tooling_suite")["printRmtAppPlatformToolingReport"](result);
      return toRunnerResult('rmt-app-platform-tooling', 'Epic 18 RMT App Platform tooling', result);
    },
"rmt-app-platform-fixture": async () => {
      const result = await load("../tests/rmt/rmt_app_platform_fixture_suite")["runRmtAppPlatformFixtureSuite"]({ rootDir });
      load("../tests/rmt/rmt_app_platform_fixture_suite")["printRmtAppPlatformFixtureReport"](result);
      return toRunnerResult('rmt-app-platform-fixture', 'Epic 18 RMT App Platform fixture', result);
    },
"rmt-native-shell-migration": async () => {
      const result = await load("../tests/rmt/rmt_native_shell_migration_suite")["runRmtNativeShellMigrationSuite"]({ rootDir });
      load("../tests/rmt/rmt_native_shell_migration_suite")["printRmtNativeShellMigrationReport"](result);
      return toRunnerResult('rmt-native-shell-migration', 'RMT Native Shell migration gap', result);
    },
"surface-controller": async () => {
      const result = await load("../tests/components/surface_controller_suite")["runSurfaceControllerSuite"]({ rootDir });
      load("../tests/components/surface_controller_suite")["printSurfaceControllerReport"](result);
      return toRunnerResult('surface-controller', 'Surface Controller and state snapshot contract', result);
    },
"surface-type-capability-matrix": () => {
      const result = load("../tests/components/surface_type_capability_matrix_suite")["runSurfaceTypeCapabilityMatrixSuite"]({ rootDir });
      load("../tests/components/surface_type_capability_matrix_suite")["printSurfaceTypeCapabilityMatrixReport"](result);
      return toRunnerResult('surface-type-capability-matrix', 'Surface type capability matrix', result);
    },
"surface-manager": () => {
      const result = load("../tests/components/surface_manager_runtime_suite")["runSurfaceManagerRuntimeSuite"]({ rootDir });
      load("../tests/components/surface_manager_runtime_suite")["printSurfaceManagerRuntimeReport"](result);
      return toRunnerResult('surface-manager', 'SurfaceManager window runtime contract', result);
    },
"surface-side-panel": () => {
      const result = load("../tests/components/surface_manager_side_panel_suite")["runSurfaceManagerSidePanelSuite"]({ rootDir });
      load("../tests/components/surface_manager_side_panel_suite")["printSurfaceManagerSidePanelReport"](result);
      return toRunnerResult('surface-side-panel', 'SurfaceManager side-panel runtime contract', result);
    },
"surface-workbench-fixture": () => {
      const result = load("../tests/rmt/surface_manager_workbench_fixture_suite")["runSurfaceManagerWorkbenchFixtureSuite"]({ rootDir });
      load("../tests/rmt/surface_manager_workbench_fixture_suite")["printSurfaceManagerWorkbenchFixtureReport"](result);
      return toRunnerResult('surface-workbench-fixture', 'SurfaceManager RMT-first Workbench fixture', result);
    },
"surface-overlay-bridge": () => {
      const result = load("../tests/components/surface_manager_overlay_bridge_suite")["runSurfaceManagerOverlayBridgeSuite"]({ rootDir });
      load("../tests/components/surface_manager_overlay_bridge_suite")["printSurfaceManagerOverlayBridgeReport"](result);
      return toRunnerResult('surface-overlay-bridge', 'SurfaceManager overlay stack bridge', result);
    },
"surface-manager-quality": () => {
      const result = load("../tests/components/surface_manager_quality_gates_suite")["runSurfaceManagerQualityGatesSuite"]({ rootDir });
      load("../tests/components/surface_manager_quality_gates_suite")["printSurfaceManagerQualityGatesReport"](result);
      return toRunnerResult('surface-manager-quality', 'SurfaceManager browser, a11y, performance and visual gates', result);
    },
"surface-persistence": () => {
      const result = load("../tests/components/surface_manager_persistence_suite")["runSurfaceManagerPersistenceSuite"]({ rootDir });
      load("../tests/components/surface_manager_persistence_suite")["printSurfaceManagerPersistenceReport"](result);
      return toRunnerResult('surface-persistence', 'SurfaceManager restore-key and snapshot persistence', result);
    },
"surface-lazy-hydration": () => {
      const result = load("../tests/components/surface_manager_lazy_hydration_suite")["runSurfaceManagerLazyHydrationSuite"]({ rootDir });
      load("../tests/components/surface_manager_lazy_hydration_suite")["printSurfaceManagerLazyHydrationReport"](result);
      return toRunnerResult('surface-lazy-hydration', 'SurfaceManager shell-first lazy hydration', result);
    },
"surface-route-lifecycle": () => {
      const result = load("../tests/components/surface_manager_route_lifecycle_suite")["runSurfaceManagerRouteLifecycleSuite"]({ rootDir });
      load("../tests/components/surface_manager_route_lifecycle_suite")["printSurfaceManagerRouteLifecycleReport"](result);
      return toRunnerResult('surface-route-lifecycle', 'SurfaceManager XRouter-bound lifecycle', result);
    },
"surface-stack-policy": () => {
      const result = load("../tests/components/surface_manager_stack_policy_suite")["runSurfaceManagerStackPolicySuite"]({ rootDir });
      load("../tests/components/surface_manager_stack_policy_suite")["printSurfaceManagerStackPolicyReport"](result);
      return toRunnerResult('surface-stack-policy', 'SurfaceManager modal focus inert stack policy', result);
    },
"surface-layout-engines": () => {
      const result = load("../tests/components/surface_manager_layout_engines_suite")["runSurfaceManagerLayoutEnginesSuite"]({ rootDir });
      load("../tests/components/surface_manager_layout_engines_suite")["printSurfaceManagerLayoutEnginesReport"](result);
      return toRunnerResult('surface-layout-engines', 'SurfaceManager docking split tile layout engines', result);
    },
"surface-remote-policy": () => {
      const result = load("../tests/components/surface_manager_remote_policy_suite")["runSurfaceManagerRemotePolicySuite"]({ rootDir });
      load("../tests/components/surface_manager_remote_policy_suite")["printSurfaceManagerRemotePolicyReport"](result);
      return toRunnerResult('surface-remote-policy', 'SurfaceManager remote surface trust policy bridge', result);
    },
"surface-browser-lab": () => {
      const result = load("../tests/browser/surface_manager_browser_lab_suite")["runSurfaceManagerBrowserLabSuite"]({ rootDir });
      load("../tests/browser/surface_manager_browser_lab_suite")["printSurfaceManagerBrowserLabReport"](result);
      return toRunnerResult('surface-browser-lab', 'SurfaceManager Browser Lab visual stability gates', result);
    },
"epic18-vendor-bugfix-smokes": async () => {
      const result = await load("../tests/components/epic18_vendor_bugfix_smoke_suite")["runEpic18VendorBugfixSmokeSuite"]({ rootDir });
      load("../tests/components/epic18_vendor_bugfix_smoke_suite")["printEpic18VendorBugfixSmokeReport"](result);
      return toRunnerResult('epic18-vendor-bugfix-smokes', 'Epic 18 vendor component bugfix smokes', result);
    },
"epic18-rmt-app-platform": () => {
      const result = load("../tests/platform/epic18_rmt_app_platform_release_handoff_suite")["runEpic18RmtAppPlatformReleaseHandoffSuite"]({ rootDir });
      load("../tests/platform/epic18_rmt_app_platform_release_handoff_suite")["printEpic18RmtAppPlatformReleaseHandoffReport"](result);
      return toRunnerResult('epic18-rmt-app-platform', 'Epic 18 RMT App Platform release handoff', result);
    },
"surface-runtime-release-handoff": () => {
      const result = load("../tests/rmt/surface_manager_runtime_release_handoff_suite")["runSurfaceManagerRuntimeReleaseHandoffSuite"]({ rootDir });
      load("../tests/rmt/surface_manager_runtime_release_handoff_suite")["printSurfaceManagerRuntimeReleaseHandoffReport"](result);
      return toRunnerResult('surface-runtime-release-handoff', 'SurfaceManager productive runtime release handoff', result);
    },
"surface-manager-browser": () => {
      const result = load("../tests/components/surface_manager_quality_gates_suite")["runSurfaceManagerQualityGatesSuite"]({ rootDir, domain: 'browser' });
      load("../tests/components/surface_manager_quality_gates_suite")["printSurfaceManagerQualityGatesReport"](result);
      return toRunnerResult('surface-manager-browser', 'SurfaceManager browser quality gate', result);
    },
"surface-manager-a11y": () => {
      const result = load("../tests/components/surface_manager_quality_gates_suite")["runSurfaceManagerQualityGatesSuite"]({ rootDir, domain: 'a11y' });
      load("../tests/components/surface_manager_quality_gates_suite")["printSurfaceManagerQualityGatesReport"](result);
      return toRunnerResult('surface-manager-a11y', 'SurfaceManager a11y quality gate', result);
    },
"surface-manager-performance": () => {
      const result = load("../tests/components/surface_manager_quality_gates_suite")["runSurfaceManagerQualityGatesSuite"]({ rootDir, domain: 'performance' });
      load("../tests/components/surface_manager_quality_gates_suite")["printSurfaceManagerQualityGatesReport"](result);
      return toRunnerResult('surface-manager-performance', 'SurfaceManager performance quality gate', result);
    },
"surface-manager-visual": () => {
      const result = load("../tests/components/surface_manager_quality_gates_suite")["runSurfaceManagerQualityGatesSuite"]({ rootDir, domain: 'visual' });
      load("../tests/components/surface_manager_quality_gates_suite")["printSurfaceManagerQualityGatesReport"](result);
      return toRunnerResult('surface-manager-visual', 'SurfaceManager visual quality gate', result);
    },
"surface-native-rmt": () => {
      const result = load("../tests/rmt/surface_manager_native_rmt_surfaces_suite")["runSurfaceManagerNativeRmtSurfacesSuite"]({ rootDir });
      load("../tests/rmt/surface_manager_native_rmt_surfaces_suite")["printSurfaceManagerNativeRmtSurfacesReport"](result);
      return toRunnerResult('surface-native-rmt', 'SurfaceManager native RMT surfaces domain', result);
    },
"surface-release-handoff": () => {
      const result = load("../tests/rmt/surface_manager_release_handoff_suite")["runSurfaceManagerReleaseHandoffSuite"]({ rootDir });
      load("../tests/rmt/surface_manager_release_handoff_suite")["printSurfaceManagerReleaseHandoffReport"](result);
      return toRunnerResult('surface-release-handoff', 'SurfaceManager release handoff', result);
    },
"surface-adapter-runtime": () => {
      const result = load("../tests/rmt/surface_manager_adapter_runtime_suite")["runSurfaceManagerAdapterRuntimeSuite"]({ rootDir });
      load("../tests/rmt/surface_manager_adapter_runtime_suite")["printSurfaceManagerAdapterRuntimeReport"](result);
      return toRunnerResult('surface-adapter-runtime', 'SurfaceManager productive xtend.surface adapter runtime', result);
    },
"surface-native-materialization": () => {
      const result = load("../tests/rmt/surface_manager_materialization_suite")["runSurfaceManagerMaterializationSuite"]({ rootDir });
      load("../tests/rmt/surface_manager_materialization_suite")["printSurfaceManagerMaterializationReport"](result);
      return toRunnerResult('surface-native-materialization', 'SurfaceManager native surfaces materialization', result);
    },
"rmt-component-fabric-ingestion": () => {
      const result = load("../tests/rmt/rmt_component_fabric_lane_ingestion_suite")["runRmtComponentFabricLaneIngestionSuite"]({ rootDir });
      load("../tests/rmt/rmt_component_fabric_lane_ingestion_suite")["printRmtComponentFabricLaneIngestionReport"](result);
      return toRunnerResult('rmt-component-fabric-ingestion', 'RMT XTend component Fabric/Lane ingestion', result);
    },
"rmt-component-lifecycle-telemetry": () => {
      const result = load("../tests/rmt/rmt_component_lifecycle_telemetry_suite")["runRmtComponentLifecycleTelemetrySuite"]({ rootDir });
      load("../tests/rmt/rmt_component_lifecycle_telemetry_suite")["printRmtComponentLifecycleTelemetryReport"](result);
      return toRunnerResult('rmt-component-lifecycle-telemetry', 'RMT XTend component lifecycle telemetry', result);
    },
"docs-rmt-pilot": () => {
      const result = load("../tests/rmt/docs_rmt_pilot_suite")["runDocsRmtPilotSuite"]({ rootDir });
      load("../tests/rmt/docs_rmt_pilot_suite")["printDocsRmtPilotReport"](result);
      return toRunnerResult('docs-rmt-pilot', 'Docs-App RMT Parsedown scheduling pilot', result);
    },
"docs-pageloader-target-architecture": () => {
      const result = load("../tests/docs/docs_pageloader_target_architecture_suite")["runDocsPageLoaderTargetArchitectureSuite"]({ rootDir });
      load("../tests/docs/docs_pageloader_target_architecture_suite")["printDocsPageLoaderTargetArchitectureReport"](result);
      return toRunnerResult('docs-pageloader-target-architecture', 'Docs PageLoader target architecture', result);
    },
"landing-page": () => {
      const result = load("../tests/browser/landing_page_suite")["runLandingPageSuite"]({ rootDir });
      load("../tests/browser/landing_page_suite")["printLandingPageReport"](result);
      return toRunnerResult('landing-page', 'XTend project landing page', result);
    },
"browser": async () => {
      const result = await load("../tests/browser/browser_smoke_suite")["runBrowserSmokeSuite"]({ rootDir });
      load("../tests/browser/browser_smoke_suite")["printBrowserSmokeReport"](result);
      return toRunnerResult('browser', 'Browser smoke harness', result);
    },
"test-runner": async () => toRunnerResult('test-runner', 'Test runner execution and profile contracts', await load('../tests/platform/test_runner_suite').runTestRunnerSuite({ rootDir }))
};
