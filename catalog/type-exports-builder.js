const fs = require('fs');
const path = require('path');
const {
  TYPE_EXPORTS_BOUNDARY,
  TYPE_EXPORTS_DECLARATION_BOUNDARY,
  TYPE_EXPORTS_KERNEL_BOUNDARY,
  TYPE_EXPORTS_SCHEMA,
  createTypeExportsPlan
} = require('./type-exports');

const TYPE_EXPORTS_BUILDER_SCHEMA = 'xtend.type-exports.builder-declarations.v1';
const TYPE_EXPORTS_BUILDER_REPORT_SCHEMA = 'xtend.type-exports.builder-declarations-report.v1';
const TYPE_EXPORTS_BUILDER_WORKPACKAGE = 'WP-TypeExports-06';
const TYPE_EXPORTS_BUILDER_STATUS = 'accepted-builder-scaffold-component-lab-declarations';
const TYPE_EXPORTS_BUILDER_TARGET = 'builder-scaffold-component-lab-types-ready';
const TYPE_EXPORTS_BUILDER_MODULE = 'catalog/type-exports-builder.js';
const TYPE_EXPORTS_BUILDER_SUITE = 'tests/types/builder_type_exports_suite.js';
const TYPE_EXPORTS_BUILDER_DOCS = 'docs/xtend-builder-types.md';
const TYPE_EXPORTS_BUILDER_BACKLOG = 'development/BACKLOG-XTend-TypeExports-und-Public-Declaration-Hardening.md';
const TYPE_EXPORTS_BUILDER_WORKPACKAGE_DOC = 'development/WP-TypeExports-06-Builder-Scaffold-und-Component-Lab-Programm-APIs-typisieren.md';
const TYPE_EXPORTS_BUILDER_LOCAL_GATE = 'node scripts/run_xtend_tests.js type-exports-builder --json';
const TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT = 'npm run test:type-exports-builder';
const TYPE_EXPORTS_BUILDER_REPORT_ARTIFACT = '.xtend-test-results/xtend-type-exports-builder-report.json';
const BUILDER_SHARED_DECLARATION_FILE = 'xtend-builder/builder-public-types.d.ts';

const BUILDER_PACKAGE_EXPORTS = Object.freeze([
  './builder',
  './builder/*',
  './builder/preview/component-lab',
  './builder/preview/component-lab-ux-inspector',
  './builder/typing/component-shell-contract',
  './builder/typing/component-styling-contract',
  './builder/typing/component-network-contract',
  './builder/typing/rmt-shell-authoring-contract',
  './builder/typing/rmt-dsl-authoring-polish',
  './builder/typing/form-controls-ux-contract',
  './builder/typing/feedback-status-ux-contract',
  './builder/typing/navigation-routing-ux-contract',
  './builder/typing/overlay-interaction-ux-contract',
  './builder/typing/layout-display-media-ux-contract',
  './builder/performance/component-ux-performance-contract'
]);

const BUILDER_SHARED_TYPE_TOKENS = Object.freeze([
  'XtendBuilderComponentInput',
  'XtendBuilderComponentPlan',
  'XtendBuilderComponentFilesResult',
  'XtendBuilderWorkflow',
  'XtendBuilderComponentLabPlan'
]);

const BUILDER_DECLARATION_FILES = Object.freeze([
  BUILDER_SHARED_DECLARATION_FILE,
  'xtend-builder/scaffold.d.ts',
  'xtend-builder/scaffold.config.d.ts',
  'xtend-builder/lib/cli.d.ts',
  'xtend-builder/lib/layout.d.ts',
  'xtend-builder/blueprints/component-blueprint.contract.d.ts',
  'xtend-builder/generators/component-plan.d.ts',
  'xtend-builder/generators/component-files.d.ts',
  'xtend-builder/generators/registry.d.ts',
  'xtend-builder/templates/loader.d.ts',
  'xtend-builder/templates/registry.d.ts',
  'xtend-builder/templates/component/component-suite.template.d.ts',
  'xtend-builder/templates/component/source.template.d.ts',
  'xtend-builder/utils/naming.d.ts',
  'xtend-builder/utils/validation.d.ts',
  'xtend-builder/wiring/features.d.ts',
  'xtend-builder/wiring/hydration.d.ts',
  'xtend-builder/wiring/manifest.d.ts',
  'xtend-builder/a11y/component-a11y-profile.d.ts',
  'xtend-builder/performance/component-performance-profile.d.ts',
  'xtend-builder/performance/component-ux-performance-contract.d.ts',
  'xtend-builder/preview/component-preview.d.ts',
  'xtend-builder/preview/component-lab.d.ts',
  'xtend-builder/preview/component-lab-ux-inspector.d.ts',
  'xtend-builder/extensions/component-extension-points.d.ts',
  'xtend-builder/workflows/developer-workflow.d.ts',
  'xtend-builder/typing/component-types.d.ts',
  'xtend-builder/typing/component-contract-v2.d.ts',
  'xtend-builder/typing/component-shell-contract.d.ts',
  'xtend-builder/typing/component-styling-contract.d.ts',
  'xtend-builder/typing/component-network-contract.d.ts',
  'xtend-builder/typing/rmt-shell-authoring-contract.d.ts',
  'xtend-builder/typing/rmt-dsl-authoring-polish.d.ts',
  'xtend-builder/typing/form-controls-ux-contract.d.ts',
  'xtend-builder/typing/feedback-status-ux-contract.d.ts',
  'xtend-builder/typing/navigation-routing-ux-contract.d.ts',
  'xtend-builder/typing/overlay-interaction-ux-contract.d.ts',
  'xtend-builder/typing/layout-display-media-ux-contract.d.ts'
]);

const BUILDER_REPRESENTATIVE_DECLARATION_TOKENS = Object.freeze({
  'xtend-builder/scaffold.d.ts': ['runCli'],
  'xtend-builder/lib/cli.d.ts': ['buildConfigSummary', 'parseFlagArgs', 'runCli'],
  'xtend-builder/blueprints/component-blueprint.contract.d.ts': ['XtendBuilderBlueprintContract', 'getComponentBlueprintContract', 'TYPESCRIPT_BLUEPRINT_REQUIREMENTS'],
  'xtend-builder/generators/component-plan.d.ts': ['XtendBuilderComponentPlan', 'createComponentPlan'],
  'xtend-builder/generators/component-files.d.ts': ['XtendBuilderComponentFilesResult', 'createComponentFiles'],
  'xtend-builder/generators/registry.d.ts': ['XtendBuilderGeneratorRegistry', 'runGenerator'],
  'xtend-builder/workflows/developer-workflow.d.ts': ['XtendBuilderWorkflow', 'createDeveloperWorkflow', 'createVerifyPlan'],
  'xtend-builder/preview/component-lab.d.ts': ['XtendBuilderComponentLabPlan', 'createComponentLabPlan', 'validateComponentLabPlan'],
  'xtend-builder/preview/component-lab-ux-inspector.d.ts': ['createComponentLabUxInspectorPlan', 'validateComponentLabUxInspectorPlan'],
  'xtend-builder/typing/component-types.d.ts': ['createComponentTypingContract', 'RMT_ATTACHMENT_SCHEMA'],
  'xtend-builder/typing/component-contract-v2.d.ts': ['createComponentContractV2', 'validateComponentContractV2'],
  'xtend-builder/typing/component-shell-contract.d.ts': ['createComponentShellContract', 'validateComponentShellContract'],
  'xtend-builder/typing/component-styling-contract.d.ts': ['createComponentStylingContract', 'validateComponentStylingContract'],
  'xtend-builder/typing/component-network-contract.d.ts': ['createComponentNetworkContract', 'validateComponentNetworkContract'],
  'xtend-builder/typing/rmt-shell-authoring-contract.d.ts': ['createRmtShellAuthoringContract', 'validateRmtShellAuthoringContract'],
  'xtend-builder/typing/rmt-dsl-authoring-polish.d.ts': ['createRmtDslAuthoringPolishPlan', 'validateRmtDslAuthoringPolishPlan'],
  'xtend-builder/typing/form-controls-ux-contract.d.ts': ['createFormControlsUxContract', 'validateFormControlsUxContract'],
  'xtend-builder/typing/feedback-status-ux-contract.d.ts': ['createFeedbackStatusUxContract', 'validateFeedbackStatusUxContract'],
  'xtend-builder/typing/navigation-routing-ux-contract.d.ts': ['createNavigationRoutingUxContract', 'validateNavigationRoutingUxContract'],
  'xtend-builder/typing/overlay-interaction-ux-contract.d.ts': ['createOverlayInteractionUxContract', 'validateOverlayInteractionUxContract'],
  'xtend-builder/typing/layout-display-media-ux-contract.d.ts': ['createLayoutDisplayMediaUxContract', 'validateLayoutDisplayMediaUxContract'],
  'xtend-builder/performance/component-ux-performance-contract.d.ts': ['createComponentUxPerformanceContract', 'validateComponentUxPerformanceContract']
});

const BUILDER_RUNTIME_EXPORTS_BY_SOURCE = Object.freeze({
  'xtend-builder/scaffold.js': ['runCli'],
  'xtend-builder/lib/cli.js': ['COMMAND_ALIASES', 'buildConfigSummary', 'buildHelpText', 'normalizeCommand', 'parseArgs', 'parseFlagArgs', 'runCli'],
  'xtend-builder/lib/layout.js': ['SCAFFOLD_LAYOUT', 'formatScaffoldLayout', 'getLayoutArea', 'getScaffoldLayout'],
  'xtend-builder/blueprints/component-blueprint.contract.js': ['ARTIFACT_MATRIX', 'A11Y_PROFILE_REQUIREMENTS', 'COMPONENT_BLUEPRINT_SCHEMA', 'TYPESCRIPT_BLUEPRINT_REQUIREMENTS', 'TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA', 'COMPONENT_FABRIC_LANE_INGESTION_SCHEMA', 'COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA', 'EXCEPTION_POLICY', 'NAMING_CONTRACT', 'PERFORMANCE_POLICY_REQUIREMENTS', 'PROFILE_CHECKS', 'getArtifactContract', 'getComponentBlueprintContract', 'getProfileContract'],
  'xtend-builder/generators/component-plan.js': ['COMPONENT_PLAN_SCHEMA', 'createComponentPlan'],
  'xtend-builder/generators/component-files.js': ['COMPONENT_FILES_SCHEMA', 'RENDERED_ARTIFACTS', 'createComponentFiles'],
  'xtend-builder/generators/registry.js': ['GENERATOR_REGISTRY_SCHEMA', 'getGenerator', 'getGeneratorRegistry', 'runGenerator'],
  'xtend-builder/templates/loader.js': ['renderTemplateForArtifact', 'renderTemplateString'],
  'xtend-builder/templates/registry.js': ['TEMPLATE_REGISTRY', 'TEMPLATE_REGISTRY_SCHEMA', 'getTemplateForArtifact', 'getTemplateRegistry'],
  'xtend-builder/utils/naming.js': ['getClassNameFromTag', 'getComponentNameFromTag', 'normalizeTag', 'replaceArtifactTokens', 'toPascalCase'],
  'xtend-builder/utils/validation.js': ['ALLOWED_FEATURES', 'normalizeList', 'validateComponentPlanInput'],
  'xtend-builder/wiring/features.js': ['FEATURE_PROFILE_RULES', 'FEATURE_WIRING_SCHEMA', 'createFeatureWiring'],
  'xtend-builder/wiring/hydration.js': ['HYDRATION_WIRING_SCHEMA', 'createHydrationWiring'],
  'xtend-builder/wiring/manifest.js': ['MANIFEST_PATCH_PLAN_SCHEMA', 'MANIFEST_WIRING_SCHEMA', 'createManifestWiring'],
  'xtend-builder/a11y/component-a11y-profile.js': ['A11Y_COMPONENT_CONTRACT_SCHEMA', 'A11Y_PROFILE_SCHEMA', 'A11Y_MOTION_CONTRAST_POLICY_SCHEMA', 'A11Y_MOTION_POLICY_SCHEMA', 'A11Y_CONTRAST_POLICY_SCHEMA', 'A11Y_MOTION_CONTRAST_TEST_SCHEMA', 'A11Y_SCREENREADER_SIGNALS_SCHEMA', 'A11Y_SCREENREADER_SIGNAL_RECORD_SCHEMA', 'A11Y_TEST_CONTRACT_SCHEMA', 'PROFILE_A11Y_RULES', 'SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA', 'createComponentA11yProfile'],
  'xtend-builder/performance/component-performance-profile.js': ['GLOBAL_PERFORMANCE_RULES', 'HYDRATION_POLICY_SCHEMA', 'PERFORMANCE_BUDGET_MATRIX_SCHEMA', 'PERFORMANCE_COMPONENT_PROFILE_SCHEMA', 'PERFORMANCE_MEASUREMENT_SCHEMA', 'PERFORMANCE_POLICY_SCHEMA', 'PERFORMANCE_REGRESSION_GATE_SCHEMA', 'PROFILE_PERFORMANCE_RULES', 'createComponentPerformanceProfile'],
  'xtend-builder/performance/component-ux-performance-contract.js': ['COMPONENT_UX_PERFORMANCE_BUDGET_CLASSES', 'COMPONENT_UX_PERFORMANCE_CONTRACT_DOC', 'COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_HYDRATION_POLICIES', 'COMPONENT_UX_PERFORMANCE_LANES', 'COMPONENT_UX_PERFORMANCE_PHASES', 'COMPONENT_UX_PERFORMANCE_PROFILES', 'COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS', 'COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS', 'COMPONENT_UX_PERFORMANCE_WORKPACKAGE', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_STYLING_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'HYDRATION_POLICY_SCHEMA', 'KERNEL_BOUNDARY', 'PERFORMANCE_BUDGET_MATRIX_SCHEMA', 'PERFORMANCE_COMPONENT_PROFILE_SCHEMA', 'PERFORMANCE_MEASUREMENT_SCHEMA', 'PERFORMANCE_POLICY_SCHEMA', 'PERFORMANCE_REGRESSION_GATE_SCHEMA', 'RMT_PERFORMANCE_AUTHORING_SCHEMA', 'RUNTIME_A11Y_CONTRACT_SCHEMA', 'createComponentUxPerformanceContract', 'validateComponentUxPerformanceContract'],
  'xtend-builder/preview/component-preview.js': ['COMPONENT_PREVIEW_SCHEMA', 'RMT_COMPATIBILITY_BINDING_SCHEMA', 'createComponentPreviewContract'],
  'xtend-builder/preview/component-lab.js': ['COMPONENT_LAB_DOC_PATH', 'COMPONENT_LAB_FIXTURE_PATH', 'COMPONENT_LAB_GATE_SCHEMA', 'COMPONENT_LAB_LOCAL_GATE', 'COMPONENT_LAB_SCHEMA', 'COMPONENT_LAB_SUITE_PATH', 'COMPONENT_LAB_WP_PATH', 'REQUIRED_INSPECTOR_DOMAINS', 'REQUIRED_LAB_PANELS', 'createComponentLabGate', 'createComponentLabPlan', 'validateComponentLabPlan'],
  'xtend-builder/preview/component-lab-ux-inspector.js': ['COMPONENT_LAB_UX_FAMILY_IDS', 'COMPONENT_LAB_UX_INSPECTOR_DOC_PATH', 'COMPONENT_LAB_UX_INSPECTOR_DOMAINS', 'COMPONENT_LAB_UX_INSPECTOR_FIXTURE_PATH', 'COMPONENT_LAB_UX_INSPECTOR_LOCAL_GATE', 'COMPONENT_LAB_UX_INSPECTOR_REPORT_SCHEMA', 'COMPONENT_LAB_UX_INSPECTOR_SCHEMA', 'COMPONENT_LAB_UX_INSPECTOR_SUITE_PATH', 'COMPONENT_LAB_UX_INSPECTOR_WORKPACKAGE', 'COMPONENT_LAB_UX_INSPECTOR_WP_PATH', 'COMPONENT_LAB_UX_NEXT_WORKPACKAGE', 'COMPONENT_LAB_UX_REQUIRED_PANELS', 'COMPONENT_LAB_UX_TARGET_DIMENSIONS', 'FAMILY_DEFINITIONS', 'KERNEL_BOUNDARY', 'createComponentLabUxInspectorGate', 'createComponentLabUxInspectorPlan', 'validateComponentLabUxInspectorPlan'],
  'xtend-builder/extensions/component-extension-points.js': ['COMPONENT_EXTENSION_POINTS_SCHEMA', 'ROOT_LIFECYCLE_SCHEMA', 'TEMPLATE_EXTENSION_SCHEMA', 'RENDERING_EXTENSION_SCHEMA', 'ROOT_HANDSHAKE_CONTRACT_VERSION', 'HOST_CAPABILITIES_CONTRACT_VERSION', 'RMT_COMPATIBILITY_BINDING_SCHEMA', 'ROOT_LIFECYCLE_HOOKS', 'createComponentExtensionPoints'],
  'xtend-builder/workflows/developer-workflow.js': ['DEVELOPER_WORKFLOW_SCHEMA', 'VERIFY_PLAN_SCHEMA', 'createDeveloperWorkflow', 'createVerifyPlan'],
  'xtend-builder/typing/component-types.js': ['COMPONENT_TYPING_SCHEMA', 'RMT_ATTACHMENT_SCHEMA', 'RMT_COMPONENT_CONTRACT_VERSION', 'RMT_TEMPLATE_AUTHORING_CONTRACT_VERSION', 'RMT_ROOT_HANDSHAKE_CONTRACT_VERSION', 'RMT_HOST_CAPABILITIES_CONTRACT_VERSION', 'RMT_COMPATIBILITY_BINDING_SCHEMA', 'createComponentTypingContract'],
  'xtend-builder/typing/component-contract-v2.js': ['COMPONENT_CONTRACT_V2_SCHEMA', 'COMPONENT_CONTRACT_REPORT_V2_SCHEMA', 'COMPONENT_CONTRACT_V2_WORKPACKAGE', 'COMPONENT_CONTRACT_V2_DOC', 'TYPESCRIPT_SOURCE_STRATEGY_SCHEMA', 'RMT_COMPONENT_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'TELEMETRY_SNAPSHOT_SCHEMA', 'CONTRACT_V2_REQUIRED_DOMAINS', 'CONTRACT_V2_LIFECYCLE_OPERATIONS', 'CONTRACT_V2_LANE_PRECEDENCE', 'createComponentContractV2', 'validateComponentContractV2'],
  'xtend-builder/typing/component-shell-contract.js': ['COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_SHELL_REPORT_SCHEMA', 'COMPONENT_SHELL_WORKPACKAGE', 'COMPONENT_SHELL_CONTRACT_DOC', 'COMPONENT_CONTRACT_V2_SCHEMA', 'UX_MATURITY_MODEL_SCHEMA', 'RMT_SHELL_AUTHORING_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'A11Y_COMPONENT_CONTRACT_SCHEMA', 'PERFORMANCE_COMPONENT_PROFILE_SCHEMA', 'KERNEL_BOUNDARY', 'SHELL_REQUIRED_DOMAINS', 'SHELL_DOM_MODES', 'SHELL_REQUIRED_STATES', 'SHELL_DEFAULT_SLOTS', 'SHELL_DEFAULT_PARTS', 'SHELL_FOCUS_STRATEGIES', 'createComponentShellContract', 'validateComponentShellContract'],
  'xtend-builder/typing/component-styling-contract.js': ['COMPONENT_STYLING_CONTRACT_SCHEMA', 'COMPONENT_STYLING_REPORT_SCHEMA', 'COMPONENT_STYLING_WORKPACKAGE', 'COMPONENT_STYLING_CONTRACT_DOC', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_CONTRACT_V2_SCHEMA', 'UX_MATURITY_MODEL_SCHEMA', 'RMT_STYLE_AUTHORING_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'KERNEL_BOUNDARY', 'STYLING_REQUIRED_DOMAINS', 'STYLING_TOKEN_CATEGORIES', 'STYLING_REQUIRED_VARIANTS', 'STYLING_REQUIRED_SIZES', 'STYLING_REQUIRED_DENSITIES', 'STYLING_REQUIRED_THEMES', 'STYLING_REQUIRED_PARTS', 'STYLING_MOTION_POLICIES', 'createComponentStylingContract', 'validateComponentStylingContract'],
  'xtend-builder/typing/component-network-contract.js': ['COMPONENT_CONTRACT_V2_SCHEMA', 'COMPONENT_NETWORK_ASSERTIONS', 'COMPONENT_NETWORK_CONTEXTS', 'COMPONENT_NETWORK_CONTRACT_DOC', 'COMPONENT_NETWORK_CONTRACT_SCHEMA', 'COMPONENT_NETWORK_PROFILES', 'COMPONENT_NETWORK_REPORT_SCHEMA', 'COMPONENT_NETWORK_REQUIRED_COMMANDS', 'COMPONENT_NETWORK_REQUIRED_DOMAINS', 'COMPONENT_NETWORK_REQUIRED_EVENTS', 'COMPONENT_NETWORK_WORKPACKAGE', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_STYLING_CONTRACT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'KERNEL_BOUNDARY', 'RMT_NETWORK_AUTHORING_SCHEMA', 'RUNTIME_A11Y_CONTRACT_SCHEMA', 'createComponentNetworkContract', 'validateComponentNetworkContract'],
  'xtend-builder/typing/rmt-shell-authoring-contract.js': ['COMPONENT_CONTRACT_V2_SCHEMA', 'COMPONENT_NETWORK_CONTRACT_SCHEMA', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_STYLING_CONTRACT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'KERNEL_BOUNDARY', 'RMT_A11Y_AUTHORING_SCHEMA', 'RMT_NETWORK_AUTHORING_SCHEMA', 'RMT_PERFORMANCE_AUTHORING_SCHEMA', 'RMT_SHELL_AUTHORING_ASSERTIONS', 'RMT_SHELL_AUTHORING_CONTRACT_DOC', 'RMT_SHELL_AUTHORING_FIELDS', 'RMT_SHELL_AUTHORING_FIXTURE', 'RMT_SHELL_AUTHORING_REPORT_SCHEMA', 'RMT_SHELL_AUTHORING_REQUIRED_ADAPTERS', 'RMT_SHELL_AUTHORING_REQUIRED_DOMAINS', 'RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES', 'RMT_SHELL_AUTHORING_SCHEMA', 'RMT_SHELL_AUTHORING_WORKPACKAGE', 'RMT_STYLE_AUTHORING_SCHEMA', 'RUNTIME_A11Y_CONTRACT_SCHEMA', 'createRmtShellAuthoringContract', 'validateRmtShellAuthoringContract'],
  'xtend-builder/typing/rmt-dsl-authoring-polish.js': ['COMPONENT_NETWORK_SCHEMA', 'DIAGNOSTIC_CODES', 'DSL_ALIAS_NAMES', 'FABRIC_BOUNDARY_SCHEMA', 'KERNEL_BOUNDARY', 'RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH', 'RMT_DSL_AUTHORING_POLISH_DOC_PATH', 'RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH', 'RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA', 'RMT_DSL_AUTHORING_POLISH_LOCAL_GATE', 'RMT_DSL_AUTHORING_POLISH_MODULE_PATH', 'RMT_DSL_AUTHORING_POLISH_PACKAGE_SCRIPT', 'RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA', 'RMT_DSL_AUTHORING_POLISH_SCHEMA', 'RMT_DSL_AUTHORING_POLISH_SUITE_PATH', 'RMT_DSL_AUTHORING_POLISH_WORKPACKAGE', 'RMT_DSL_AUTHORING_POLISH_WP_PATH', 'RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA', 'RMT_SHELL_AUTHORING_SCHEMA', 'RMT_STYLE_AUTHORING_SCHEMA', 'RMT_XROUTER_ADAPTER_SCHEMA', 'XTEND_DESIGN_TOKEN_SCHEMA', 'createRmtDslAuthoringPolishPlan', 'validateRmtDslAuthoringPolishFixture', 'validateRmtDslAuthoringPolishPlan'],
  'xtend-builder/typing/form-controls-ux-contract.js': ['COMPONENT_CONTRACT_V2_SCHEMA', 'COMPONENT_NETWORK_CONTRACT_SCHEMA', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_STYLING_CONTRACT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'FORM_CONTROLS_UX_CONTRACT_DOC', 'FORM_CONTROLS_UX_FIXTURE', 'FORM_CONTROLS_UX_REPORT_SCHEMA', 'FORM_CONTROLS_UX_SCHEMA', 'FORM_CONTROLS_UX_WORKPACKAGE', 'FORM_CONTROL_PROFILES', 'FORM_CONTROL_REQUIRED_ASSERTIONS', 'FORM_CONTROL_REQUIRED_COMMANDS', 'FORM_CONTROL_REQUIRED_DOMAINS', 'FORM_CONTROL_REQUIRED_EVENTS', 'FORM_CONTROL_REQUIRED_SCHEDULES', 'FORM_CONTROL_TARGETS', 'KERNEL_BOUNDARY', 'RMT_SHELL_AUTHORING_SCHEMA', 'RUNTIME_A11Y_CONTRACT_SCHEMA', 'createFormControlsUxContract', 'validateFormControlsUxContract'],
  'xtend-builder/typing/feedback-status-ux-contract.js': ['COMPONENT_CONTRACT_V2_SCHEMA', 'COMPONENT_NETWORK_CONTRACT_SCHEMA', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_STYLING_CONTRACT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'FEEDBACK_STATUS_PROFILES', 'FEEDBACK_STATUS_REQUIRED_ASSERTIONS', 'FEEDBACK_STATUS_REQUIRED_COMMANDS', 'FEEDBACK_STATUS_REQUIRED_DOMAINS', 'FEEDBACK_STATUS_REQUIRED_EVENTS', 'FEEDBACK_STATUS_REQUIRED_SCHEDULES', 'FEEDBACK_STATUS_TARGETS', 'FEEDBACK_STATUS_UX_CONTRACT_DOC', 'FEEDBACK_STATUS_UX_FIXTURE', 'FEEDBACK_STATUS_UX_REPORT_SCHEMA', 'FEEDBACK_STATUS_UX_SCHEMA', 'FEEDBACK_STATUS_UX_WORKPACKAGE', 'KERNEL_BOUNDARY', 'RMT_SHELL_AUTHORING_SCHEMA', 'RUNTIME_A11Y_CONTRACT_SCHEMA', 'createFeedbackStatusUxContract', 'validateFeedbackStatusUxContract'],
  'xtend-builder/typing/navigation-routing-ux-contract.js': ['NAVIGATION_ROUTING_PROFILES', 'NAVIGATION_ROUTING_REQUIRED_ASSERTIONS', 'NAVIGATION_ROUTING_REQUIRED_COMMANDS', 'NAVIGATION_ROUTING_REQUIRED_DOMAINS', 'NAVIGATION_ROUTING_REQUIRED_EVENTS', 'NAVIGATION_ROUTING_REQUIRED_SCHEDULES', 'NAVIGATION_ROUTING_TARGETS', 'NAVIGATION_ROUTING_UX_CONTRACT_DOC', 'NAVIGATION_ROUTING_UX_FIXTURE', 'NAVIGATION_ROUTING_UX_REPORT_SCHEMA', 'NAVIGATION_ROUTING_UX_SCHEMA', 'NAVIGATION_ROUTING_UX_WORKPACKAGE', 'KERNEL_BOUNDARY', 'createNavigationRoutingUxContract', 'validateNavigationRoutingUxContract'],
  'xtend-builder/typing/overlay-interaction-ux-contract.js': ['COMPONENT_CONTRACT_V2_SCHEMA', 'COMPONENT_NETWORK_CONTRACT_SCHEMA', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_STYLING_CONTRACT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'KERNEL_BOUNDARY', 'OVERLAY_INTERACTION_PROFILES', 'OVERLAY_INTERACTION_REQUIRED_ASSERTIONS', 'OVERLAY_INTERACTION_REQUIRED_COMMANDS', 'OVERLAY_INTERACTION_REQUIRED_DOMAINS', 'OVERLAY_INTERACTION_REQUIRED_EVENTS', 'OVERLAY_INTERACTION_REQUIRED_SCHEDULES', 'OVERLAY_INTERACTION_TARGETS', 'OVERLAY_INTERACTION_UX_CONTRACT_DOC', 'OVERLAY_INTERACTION_UX_FIXTURE', 'OVERLAY_INTERACTION_UX_REPORT_SCHEMA', 'OVERLAY_INTERACTION_UX_SCHEMA', 'OVERLAY_INTERACTION_UX_WORKPACKAGE', 'RMT_SHELL_AUTHORING_SCHEMA', 'RUNTIME_A11Y_CONTRACT_SCHEMA', 'createOverlayInteractionUxContract', 'validateOverlayInteractionUxContract'],
  'xtend-builder/typing/layout-display-media-ux-contract.js': ['COMPONENT_CONTRACT_V2_SCHEMA', 'COMPONENT_NETWORK_CONTRACT_SCHEMA', 'COMPONENT_SHELL_CONTRACT_SCHEMA', 'COMPONENT_STYLING_CONTRACT_SCHEMA', 'COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA', 'FABRIC_BOUNDARY_SCHEMA', 'KERNEL_BOUNDARY', 'LAYOUT_DISPLAY_MEDIA_PROFILES', 'LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS', 'LAYOUT_DISPLAY_MEDIA_REQUIRED_COMMANDS', 'LAYOUT_DISPLAY_MEDIA_REQUIRED_DOMAINS', 'LAYOUT_DISPLAY_MEDIA_REQUIRED_EVENTS', 'LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES', 'LAYOUT_DISPLAY_MEDIA_TARGETS', 'LAYOUT_DISPLAY_MEDIA_UX_CONTRACT_DOC', 'LAYOUT_DISPLAY_MEDIA_UX_FIXTURE', 'LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA', 'LAYOUT_DISPLAY_MEDIA_UX_SCHEMA', 'LAYOUT_DISPLAY_MEDIA_UX_WORKPACKAGE', 'RMT_SHELL_AUTHORING_SCHEMA', 'RUNTIME_A11Y_CONTRACT_SCHEMA', 'createLayoutDisplayMediaUxContract', 'validateLayoutDisplayMediaUxContract']
});

const FORBIDDEN_BUILDER_DECLARATION_IMPORT_PATTERNS = Object.freeze([
  '.js',
  'components/',
  '../components',
  'xtend-loader',
  'xtend-dev',
  'api.js',
  '../api',
  'xtendrmt/',
  '../xtendrmt',
  'tools/rmt-language',
  '../tools'
]);

function getDefaultPackageManifest() {
  return require('../package.json');
}

function toRepoRelative(filePath) {
  return filePath ? filePath.replace(/^\.\//u, '') : null;
}

function fileExists(rootDir, relativePath) {
  return Boolean(relativePath) && !relativePath.includes('*') && fs.existsSync(path.join(rootDir, toRepoRelative(relativePath)));
}

function readText(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, toRepoRelative(relativePath));
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function collectExportTargets(value, targets = []) {
  if (typeof value === 'string') {
    targets.push(value);
    return targets;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectExportTargets(entry, targets));
  }
  return targets;
}

function getTypesCondition(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  return entry && typeof entry === 'object' ? entry.types : null;
}

function getRuntimeTarget(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return null;
  return entry.import || entry.browser || entry.default || null;
}

function resolveDeclarationForExport(exportKey) {
  if (exportKey === './builder') return './xtend-builder/scaffold.d.ts';
  if (exportKey === './builder/*') return './xtend-builder/*.d.ts';
  return `${exportKey.replace('./builder', './xtend-builder')}.d.ts`;
}

function resolveSourceForExport(exportKey) {
  if (exportKey === './builder') return './xtend-builder/scaffold.js';
  if (exportKey === './builder/*') return './xtend-builder/*';
  return `${exportKey.replace('./builder', './xtend-builder')}.js`;
}

function declarationIncludesRuntimeName(source, name) {
  return source.includes(` ${name}:`)
    || source.includes(` ${name};`)
    || source.includes(` ${name}(`)
    || source.includes(`function ${name}`)
    || source.includes(`const ${name}`)
    || source.includes(` ${name}<`);
}

function createTypeExportsBuilderPlan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = options.packageManifest || getDefaultPackageManifest();
  const typeExportsPlan = options.typeExportsPlan || createTypeExportsPlan({ rootDir, packageManifest });
  const sharedTypesSource = readText(rootDir, BUILDER_SHARED_DECLARATION_FILE);
  const declarationFiles = BUILDER_DECLARATION_FILES.map((filePath) => ({
    filePath,
    exists: fileExists(rootDir, filePath),
    size: fileExists(rootDir, filePath) ? fs.statSync(path.join(rootDir, filePath)).size : 0
  }));
  const exportRecords = BUILDER_PACKAGE_EXPORTS.map((exportKey) => {
    const expectedTypes = resolveDeclarationForExport(exportKey);
    const runtimeTarget = getRuntimeTarget(packageManifest, exportKey);
    const actualTypes = getTypesCondition(packageManifest, exportKey);
    const entry = packageManifest.exports && packageManifest.exports[exportKey];
    return {
      exportKey,
      expectedTypes,
      actualTypes,
      hasTypesCondition: actualTypes === expectedTypes,
      declarationExists: exportKey === './builder/*' ? true : fileExists(rootDir, expectedTypes),
      runtimeTarget,
      expectedRuntimeTarget: resolveSourceForExport(exportKey),
      runtimeTargetMatches: runtimeTarget === resolveSourceForExport(exportKey),
      targets: collectExportTargets(entry)
    };
  });
  const declarationImportLines = BUILDER_DECLARATION_FILES.flatMap((filePath) => {
    const source = readText(rootDir, filePath);
    return source.split('\n')
      .filter((line) => /\bfrom\s+['"]/u.test(line) || /\brequire\(/u.test(line))
      .map((line) => ({ filePath, line }));
  });
  const forbiddenDeclarationRuntimeImports = declarationImportLines
    .filter((entry) => FORBIDDEN_BUILDER_DECLARATION_IMPORT_PATTERNS.some((pattern) => entry.line.includes(pattern)))
    .map((entry) => `${entry.filePath}:${entry.line.trim()}`);
  const runtimeImportsDeclarationFiles = Object.keys(BUILDER_RUNTIME_EXPORTS_BY_SOURCE)
    .filter((filePath) => readText(rootDir, filePath)
      .split('\n')
      .some((line) => (/^\s*import\b/u.test(line) || /\brequire\(/u.test(line)) && line.includes('.d.ts')));
  const missingRuntimeExportTokens = Object.entries(BUILDER_RUNTIME_EXPORTS_BY_SOURCE).flatMap(([sourcePath, runtimeNames]) => {
    const declarationPath = sourcePath.replace(/\.js$/u, '.d.ts');
    const declarationSource = readText(rootDir, declarationPath);
    return runtimeNames
      .filter((name) => !declarationIncludesRuntimeName(declarationSource, name))
      .map((name) => `${declarationPath}:${name}`);
  });
  const typeExportClassifications = typeExportsPlan.classifications || [];
  const typeExportsMissingDeclarations = BUILDER_PACKAGE_EXPORTS
    .filter((exportKey) => exportKey !== './builder/*')
    .filter((exportKey) => {
      const classification = typeExportClassifications.find((entry) => entry.exportKey === exportKey);
      return !classification || classification.declarationExists !== true || classification.typeDecision !== 'declaration-ready';
    });

  return {
    schema: TYPE_EXPORTS_BUILDER_SCHEMA,
    reportSchema: TYPE_EXPORTS_BUILDER_REPORT_SCHEMA,
    sourceTypeExportsSchema: TYPE_EXPORTS_SCHEMA,
    workpackage: TYPE_EXPORTS_BUILDER_WORKPACKAGE,
    status: TYPE_EXPORTS_BUILDER_STATUS,
    targetReadiness: TYPE_EXPORTS_BUILDER_TARGET,
    generatedAt: options.generatedAt || 'static-local',
    module: TYPE_EXPORTS_BUILDER_MODULE,
    suite: TYPE_EXPORTS_BUILDER_SUITE,
    docs: TYPE_EXPORTS_BUILDER_DOCS,
    backlog: TYPE_EXPORTS_BUILDER_BACKLOG,
    workpackageDocument: TYPE_EXPORTS_BUILDER_WORKPACKAGE_DOC,
    localGate: TYPE_EXPORTS_BUILDER_LOCAL_GATE,
    packageScript: TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT,
    reportArtifact: TYPE_EXPORTS_BUILDER_REPORT_ARTIFACT,
    boundaries: [
      TYPE_EXPORTS_BOUNDARY,
      TYPE_EXPORTS_KERNEL_BOUNDARY,
      TYPE_EXPORTS_DECLARATION_BOUNDARY
    ],
    packageExports: BUILDER_PACKAGE_EXPORTS.slice(),
    declarationFiles,
    sharedDeclarationFile: BUILDER_SHARED_DECLARATION_FILE,
    sharedTypeTokens: BUILDER_SHARED_TYPE_TOKENS.slice(),
    representativeDeclarationTokens: JSON.parse(JSON.stringify(BUILDER_REPRESENTATIVE_DECLARATION_TOKENS)),
    exportRecords,
    missingPackageExports: BUILDER_PACKAGE_EXPORTS.filter((exportKey) => !packageManifest.exports || !packageManifest.exports[exportKey]),
    missingTypesConditions: exportRecords.filter((record) => !record.actualTypes).map((record) => record.exportKey),
    mismatchedTypesConditions: exportRecords.filter((record) => record.actualTypes && !record.hasTypesCondition).map((record) => `${record.exportKey}:${record.actualTypes}`),
    missingRuntimeTargets: exportRecords.filter((record) => !record.runtimeTarget || !record.runtimeTargetMatches).map((record) => record.exportKey),
    missingDeclarationFiles: declarationFiles.filter((entry) => !entry.exists).map((entry) => entry.filePath),
    missingSharedTypeTokens: BUILDER_SHARED_TYPE_TOKENS.filter((token) => !sharedTypesSource.includes(token)),
    missingRepresentativeDeclarationTokens: Object.entries(BUILDER_REPRESENTATIVE_DECLARATION_TOKENS).flatMap(([filePath, tokens]) => {
      const source = readText(rootDir, filePath);
      return tokens.filter((token) => !source.includes(token)).map((token) => `${filePath}:${token}`);
    }),
    missingRuntimeExportTokens,
    forbiddenDeclarationRuntimeImports,
    runtimeImportsDeclarationFiles,
    typeExportsMissingDeclarations,
    runtimeChanged: false,
    nextWorkpackage: 'WP-TypeExports-07'
  };
}

function validateTypeExportsBuilderPlan(plan = createTypeExportsBuilderPlan()) {
  const errors = [];

  if (!plan || plan.schema !== TYPE_EXPORTS_BUILDER_SCHEMA) errors.push(`schema must be ${TYPE_EXPORTS_BUILDER_SCHEMA}`);
  if (!plan || plan.reportSchema !== TYPE_EXPORTS_BUILDER_REPORT_SCHEMA) errors.push(`reportSchema must be ${TYPE_EXPORTS_BUILDER_REPORT_SCHEMA}`);
  if (!plan || plan.sourceTypeExportsSchema !== TYPE_EXPORTS_SCHEMA) errors.push(`sourceTypeExportsSchema must be ${TYPE_EXPORTS_SCHEMA}`);
  if (!plan || plan.workpackage !== TYPE_EXPORTS_BUILDER_WORKPACKAGE) errors.push(`workpackage must be ${TYPE_EXPORTS_BUILDER_WORKPACKAGE}`);
  if (!plan || plan.status !== TYPE_EXPORTS_BUILDER_STATUS) errors.push(`status must be ${TYPE_EXPORTS_BUILDER_STATUS}`);
  if (!plan || plan.targetReadiness !== TYPE_EXPORTS_BUILDER_TARGET) errors.push(`targetReadiness must be ${TYPE_EXPORTS_BUILDER_TARGET}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_KERNEL_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_KERNEL_BOUNDARY}`);
  if (!plan || !Array.isArray(plan.boundaries) || !plan.boundaries.includes(TYPE_EXPORTS_DECLARATION_BOUNDARY)) errors.push(`boundary must include ${TYPE_EXPORTS_DECLARATION_BOUNDARY}`);
  if (!plan || plan.packageExports.length !== BUILDER_PACKAGE_EXPORTS.length) errors.push('Builder package export count changed');
  if (!plan || plan.declarationFiles.length !== BUILDER_DECLARATION_FILES.length) errors.push('Builder declaration file count changed');
  if (!plan || plan.missingPackageExports.length > 0) errors.push(`missing Builder package exports: ${plan ? plan.missingPackageExports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingTypesConditions.length > 0) errors.push(`missing Builder types conditions: ${plan ? plan.missingTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.mismatchedTypesConditions.length > 0) errors.push(`mismatched Builder types conditions: ${plan ? plan.mismatchedTypesConditions.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeTargets.length > 0) errors.push(`mismatched Builder runtime targets: ${plan ? plan.missingRuntimeTargets.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingDeclarationFiles.length > 0) errors.push(`missing Builder declaration files: ${plan ? plan.missingDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingSharedTypeTokens.length > 0) errors.push(`missing shared Builder type tokens: ${plan ? plan.missingSharedTypeTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRepresentativeDeclarationTokens.length > 0) errors.push(`missing representative Builder declaration tokens: ${plan ? plan.missingRepresentativeDeclarationTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.missingRuntimeExportTokens.length > 0) errors.push(`Builder declaration files miss runtime exports: ${plan ? plan.missingRuntimeExportTokens.join(', ') : '<plan missing>'}`);
  if (!plan || plan.forbiddenDeclarationRuntimeImports.length > 0) errors.push(`Builder declaration files import forbidden runtime surfaces: ${plan ? plan.forbiddenDeclarationRuntimeImports.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeImportsDeclarationFiles.length > 0) errors.push(`Builder runtime imports declaration files: ${plan ? plan.runtimeImportsDeclarationFiles.join(', ') : '<plan missing>'}`);
  if (!plan || plan.typeExportsMissingDeclarations.length > 0) errors.push(`TypeExports does not see Builder declarations: ${plan ? plan.typeExportsMissingDeclarations.join(', ') : '<plan missing>'}`);
  if (!plan || plan.runtimeChanged !== false) errors.push('Builder TypeExports WP must not change runtime code');
  if (!plan || plan.nextWorkpackage !== 'WP-TypeExports-07') errors.push('Builder TypeExports must hand off to WP-TypeExports-07');

  return {
    schema: TYPE_EXPORTS_BUILDER_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createTypeExportsBuilderReport(options = {}) {
  const plan = options.plan || createTypeExportsBuilderPlan(options);
  const validation = validateTypeExportsBuilderPlan(plan);

  return {
    schema: TYPE_EXPORTS_BUILDER_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    packageExportCount: plan.packageExports.length,
    declarationFileCount: plan.declarationFiles.length,
    sharedTypeTokens: plan.sharedTypeTokens,
    nextWorkpackage: plan.nextWorkpackage,
    plan
  };
}

module.exports = {
  BUILDER_DECLARATION_FILES,
  BUILDER_PACKAGE_EXPORTS,
  BUILDER_REPRESENTATIVE_DECLARATION_TOKENS,
  BUILDER_SHARED_DECLARATION_FILE,
  BUILDER_SHARED_TYPE_TOKENS,
  TYPE_EXPORTS_BUILDER_BACKLOG,
  TYPE_EXPORTS_BUILDER_DOCS,
  TYPE_EXPORTS_BUILDER_LOCAL_GATE,
  TYPE_EXPORTS_BUILDER_MODULE,
  TYPE_EXPORTS_BUILDER_PACKAGE_SCRIPT,
  TYPE_EXPORTS_BUILDER_REPORT_ARTIFACT,
  TYPE_EXPORTS_BUILDER_REPORT_SCHEMA,
  TYPE_EXPORTS_BUILDER_SCHEMA,
  TYPE_EXPORTS_BUILDER_STATUS,
  TYPE_EXPORTS_BUILDER_SUITE,
  TYPE_EXPORTS_BUILDER_TARGET,
  TYPE_EXPORTS_BUILDER_WORKPACKAGE,
  TYPE_EXPORTS_BUILDER_WORKPACKAGE_DOC,
  createTypeExportsBuilderPlan,
  createTypeExportsBuilderReport,
  resolveDeclarationForExport,
  validateTypeExportsBuilderPlan
};
