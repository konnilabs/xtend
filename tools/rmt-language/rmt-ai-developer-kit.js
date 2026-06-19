const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RMT_AI_DEVELOPER_KIT_SCHEMA = 'xtend.rmt.ai-developer-kit.v1';
const RMT_AI_DEVELOPER_KIT_MANIFEST_SCHEMA = 'xtend.rmt.ai-developer-kit.manifest.v1';
const RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA = 'xtend.rmt.ai-developer-kit.reference-record.v1';
const RMT_AI_DEVELOPER_KIT_RECIPE_RECORD_SCHEMA = 'xtend.rmt.ai-developer-kit.recipe-record.v1';
const RMT_AI_DEVELOPER_KIT_GUARDRAILS_SCHEMA = 'xtend.rmt.ai-developer-kit.guardrails.v1';
const RMT_AI_DEVELOPER_KIT_WORKPACKAGE = 'RMT-AI-DK-01';
const RMT_AI_DEVELOPER_KIT_STATUS = 'accepted-agent-ingest-kit';
const RMT_AI_DEVELOPER_KIT_MODULE_PATH = 'tools/rmt-language/rmt-ai-developer-kit.js';
const RMT_AI_DEVELOPER_KIT_TYPES_PATH = 'tools/rmt-language/rmt-ai-developer-kit.d.ts';
const RMT_AI_DEVELOPER_KIT_SUITE_PATH = 'tests/rmt-language/rmt_ai_developer_kit_suite.js';
const RMT_AI_DEVELOPER_KIT_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-ai-developer-kit --json';
const RMT_AI_DEVELOPER_KIT_PACKAGE_SCRIPT = 'npm run test:rmt-ai-developer-kit';
const RMT_AI_DEVELOPER_KIT_OUTPUT_DIR = 'docs/ai/rmt-ai-developer-kit';
const COMPACT_TOKEN_LIMIT = 8000;
const SURVIVAL_TOKEN_LIMIT = 2000;
const REPAIR_TOKEN_LIMIT = 4000;

const ARTIFACT_PATHS = Object.freeze({
  compact: 'rmt-ai-kit.compact.md',
  manifest: 'rmt-ai-kit.manifest.json',
  reference: 'rmt-ai-kit.reference.jsonl',
  recipes: 'rmt-ai-kit.recipes.jsonl',
  prompts: 'rmt-ai-kit.prompts.md',
  guardrails: 'rmt-ai-kit.guardrails.json'
});

const FIXED_SOURCE_PATHS = Object.freeze([
  'development/XTendRMT-vNext-Grammar-Contract.md',
  'development/XTendRMT-AI-Agent-Lint-Repair-Contract.md',
  'docs/de/rmt-reference.md',
  'docs/de/rmt-app-platform-tooling.md',
  'docs/de/rmt-vnext-authoring.md',
  'docs/de/xtend-maraca-orchestration.md',
  'docs/de/xtendrmt-app-dsl.md',
  'tools/rmt-language/rmt-tooling-public-types.d.ts',
  'tools/rmt-language/vnext-compiler.d.ts',
  'tools/rmt-language/diagnostics.d.ts',
  'tools/rmt-linter/reporter.d.ts',
  'xtend-maraca/index.d.ts'
]);

const REFERENCE_RECORDS = Object.freeze([
  operatorRecord('template', 'template app.name { ... }', ['document'], 'Groups RMT declarations into one app or feature source of truth.', 'template ai.minimal { surface root { lane visible { hydrate card } } }', 'hydrate card', 'Top-level operations are rejected; put work in surface/lane.', ['development/XTendRMT-vNext-Grammar-Contract.md', 'docs/de/rmt-reference-document-template-import.md']),
  operatorRecord('import', 'import "./shared/*.rmt"', ['document', 'template'], 'Loads static RMT source only; no dynamic expressions.', 'import "./routes/*.rmt"', 'import routesPath', 'Dynamic imports are not part of RMT vNext.', ['development/XTendRMT-vNext-Grammar-Contract.md']),
  operatorRecord('state', 'state app.status type object preserve { initial { text "Ready" } }', ['template'], 'Declares owned application state.', 'state app.ready type boolean initial true', 'state app.ready { initial true }', 'State needs a static type.', ['docs/de/rmt-reference-state-selectors-data.md']),
  operatorRecord('selector', 'selector app.view from state app.status { output StatusView }', ['template'], 'Derives view-models without host JavaScript.', 'selector app.view from state app.status { output StatusView }', 'selector app.view { output StatusView }', 'Selectors need a static source.', ['docs/de/rmt-reference-state-selectors-data.md']),
  operatorRecord('datasource', 'datasource items from endpoint "/api/items" { method GET result list }', ['template'], 'Declares host-owned data access.', 'datasource tickets from endpoint "/api/tickets" { method GET result list fallback fixture tickets.empty }', 'datasource tickets from fetch("/api/tickets")', 'Free function calls are refused.', ['docs/de/rmt-reference-state-selectors-data.md']),
  operatorRecord('resource', 'resource app.timer kind timer owner surface.app { dispose on surface.destroy }', ['template'], 'Declares owner-scoped resources with cleanup.', 'resource app.stream kind stream owner surface.shell { dispose on surface.destroy }', 'resource app.stream kind stream', 'Resources need ownership for cleanup.', ['docs/de/rmt-reference-primitives.md']),
  operatorRecord('portal', 'portal app.root root "#app" layer surface', ['template'], 'Binds surfaces to host roots without manual shell code.', 'portal app.root root "#app" layer surface', 'portal app.root document.querySelector("#app")', 'DOM calls are host adapter work, not RMT source.', ['docs/de/rmt-reference-primitives.md']),
  operatorRecord('surface', 'surface app.home kind page component x-section { ... }', ['template', 'document'], 'Declares UI surfaces and their component capability.', 'surface dashboard kind page component x-section { lane visible { hydrate status.card } }', 'surface dashboard { hydrate status.card }', 'Lifecycle work belongs in lanes.', ['docs/de/rmt-reference-surfaces-lanes-lifecycle.md']),
  operatorRecord('lane', 'lane visible weight 80 { hydrate card }', ['surface'], 'Groups scheduled render/hydration work.', 'lane visible weight 80 { hydrate card from selector app.card }', 'lane visible weight "high" { hydrate card }', 'Lane weight must be a nonnegative integer.', ['development/XTendRMT-vNext-Grammar-Contract.md']),
  operatorRecord('hydrate', 'hydrate target from selector app.view', ['lane', 'slot'], 'Hydrates existing or planned UI from a static source.', 'hydrate status.card from selector app.statusView', 'hydrate status.card from fetch("status")', 'Source kinds must be static.', ['docs/de/rmt-reference-surfaces-lanes-lifecycle.md']),
  operatorRecord('mount', 'mount target from selector app.view { ... }', ['lane', 'slot'], 'Materializes UI work and may contain policy blocks.', 'mount editor.form from selector app.form { on submit -> action app.save }', 'mount editor.form when canAccess("editor")', 'Conditions cannot call functions.', ['docs/de/rmt-reference-surfaces-lanes-lifecycle.md']),
  operatorRecord('on', 'on click "#button" -> action app.save { payload id from target.dataset.id }', ['surface', 'operation policy block'], 'Binds host events to declarative actions.', 'on submit "#form" -> action app.save { preventDefault true }', 'on submit -> app.save()', 'Event bindings must use -> action, not calls.', ['docs/de/rmt-reference-actions-events.md']),
  operatorRecord('payload', 'payload id from target.dataset.id', ['event-payload block'], 'Maps event context into action input.', 'payload value from detail.value', 'payload value detail.value', 'Payload needs an explicit from source.', ['docs/de/rmt-reference-actions-events.md']),
  operatorRecord('preventDefault', 'preventDefault true', ['event-payload block'], 'Declares host default-prevention for event adapters.', 'preventDefault true', 'preventDefault "yes"', 'The value is boolean.', ['docs/de/rmt-reference-actions-events.md']),
  operatorRecord('action', 'action app.save { input value string reduce state.app.form.value = input.value }', ['template'], 'Declares state changes, effects and emitted events.', 'action app.save { input value string reduce state.app.status.text = "Saved" }', 'action app.save { save(value) }', 'Actions are declarative transitions, not functions.', ['docs/de/rmt-reference-actions-events.md']),
  operatorRecord('emit', 'emit app.saved with id input.id', ['action'], 'Publishes typed RMT events.', 'emit ticket.saved with id input.id', 'emit ticket.saved(input.id)', 'Emits use declarative payload mapping.', ['docs/de/rmt-reference-actions-events.md']),
  operatorRecord('when', 'when route.visible == true', ['lifecycle operation', 'stream'], 'Adds small declarative boolean conditions.', 'hydrate panel when user.role == "admin"', 'hydrate panel when canAccess("admin")', 'Function calls are not valid conditions.', ['development/XTendRMT-vNext-Grammar-Contract.md']),
  operatorRecord('slot', 'slot body { hydrate detail }', ['operation policy block'], 'Composes nested lifecycle work inside component slots.', 'mount x-card { slot body { hydrate dashboard } }', 'surface page { slot body { hydrate dashboard } }', 'Slots are only allowed in operation policy blocks.', ['development/XTendRMT-vNext-Grammar-Contract.md']),
  operatorRecord('stream', 'stream feed from sse app.feed', ['lane', 'slot'], 'Declares incremental rendering input.', 'stream docs-content from sse docs.feed { sanitize html }', 'stream docs-content from fetch("/feed")', 'Streams require static source kinds.', ['development/XTendRMT-vNext-Grammar-Contract.md']),
  operatorRecord('trust boundary', 'trust boundary "xtend.security.sanitizing-boundary.v1"', ['operation policy block'], 'Declares explicit trust context.', 'trust boundary "xtend.security.sanitizing-boundary.v1"', 'trust boundary sanitize(html)', 'Trust boundaries are strings, not code.', ['development/XTendRMT-vNext-Grammar-Contract.md']),
  operatorRecord('sanitize', 'sanitize html', ['operation policy block'], 'Declares sanitizer intent for trusted output adapters.', 'sanitize html', 'innerHTML html', 'Manual HTML sinks are not RMT authoring.', ['development/XTendRMT-vNext-Grammar-Contract.md']),
  operatorRecord('validation', 'validation app.contact { mode blocking target action app.next field app.email required email message "Enter email." }', ['template'], 'Declares action gates and field rules for Maraca validation.', 'validation demo.contact { mode blocking target action demo.next field demo.email required email message "Enter a valid email." }', 'validation demo.contact { validate(email) }', 'Validation is declarative and consumed by Maraca strict mode.', ['docs/de/rmt-reference-validation-transitions.md', 'docs/de/xtend-maraca-orchestration.md']),
  operatorRecord('transition', 'transition app.step { trigger action app.next from surfaces [app.a] to surfaces [app.b] effect crossfade durationMs 160 lane transition }', ['template'], 'Declares surface transitions for Maraca orchestration.', 'transition demo.step { trigger action demo.next from surfaces [demo.a] to surfaces [demo.b] effect crossfade durationMs 120 lane transition }', 'transition demo.step { animate() }', 'Transitions cannot embed runtime animation code.', ['docs/de/rmt-reference-validation-transitions.md', 'docs/de/xtend-maraca-orchestration.md']),
  diagnosticRecord('rmt.template.inline-script.refused', 'critical', 'Inline script or unsafe template content must become a reviewed host adapter or safe descriptor.'),
  diagnosticRecord('rmt.ref.schedule.unresolved', 'high', 'Create or reference an existing schedule; agent reports can provide workspace edits.'),
  diagnosticRecord('rmt.syntax.invalid-json', 'high', 'Recover parseability before automated repair.'),
  diagnosticRecord('rmt.app.no-manual-shell.html-sink', 'critical', 'Manual HTML sinks are not valid App Platform authoring.'),
  cliRecord('xt rmt lint app.rmt --agent', 'repair', 'Machine-readable repair plan with deterministic fix order.'),
  cliRecord('xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json', 'maraca', 'Strict production planning without writing bundle files.'),
  cliRecord('xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json', 'maraca', 'Build loaderless ESM app bundle and Maraca reports.')
]);

const MINIMAL_APP_SOURCE = `template ai.minimal {
  state ai.message type object preserve {
    initial {
      id "message"
      text "Ready"
      tone "info"
    }
  }

  selector ai.messageView from state ai.message {
    output MessageView
  }

  portal ai.root root "#app" layer surface

  surface ai.home kind page component x-section {
    portal ai.root
    lane visible weight 80 {
      hydrate ai.messageCard from selector ai.messageView
    }
  }
}
`;

const ACTION_EVENTS_SOURCE = `template ai.actions {
  state ai.form type object preserve {
    initial {
      id "ai-form"
      value ""
      text "Idle"
    }
  }

  selector ai.formView from state ai.form {
    output AiFormView
  }

  action ai.save {
    input value string
    reduce state.ai.form.value = input.value
    reduce state.ai.form.text = "Saved"
    emit ai.saved with value input.value
  }

  portal ai.root root "#app" layer surface

  surface ai.form kind form component x-form {
    source selector ai.formView
    key form.id
    portal ai.root
    lane user-blocking weight 90 {
      mount ai.formShell from selector ai.formView {
        on submit "#ai-form" -> action ai.save {
          payload value from detail.value
          preventDefault true
        }
      }
    }
  }
}
`;

const RECIPE_RECORDS = Object.freeze([
  recipeRecord({
    id: 'minimal-rmt-app',
    profile: 'survival',
    domains: ['template', 'state', 'selector', 'surface', 'lane'],
    title: 'Minimal RMT App',
    intent: 'Smallest useful agent-authored RMT source.',
    source: MINIMAL_APP_SOURCE,
    commands: ['xt rmt lint app.rmt --agent']
  }),
  recipeRecord({
    id: 'actions-events-payload',
    profile: 'compact',
    domains: ['action', 'event', 'payload'],
    title: 'Action and Event Payload',
    intent: 'Bind host events to RMT actions without function calls.',
    source: ACTION_EVENTS_SOURCE,
    commands: ['xt rmt lint app.rmt --agent']
  }),
  recipeRecord({
    id: 'data-resource-fallback',
    profile: 'full',
    domains: ['datasource', 'resource', 'fallback'],
    title: 'DataSource, Resource and Fallback',
    intent: 'Use the canonical primitive fixture for data and owned cleanup patterns.',
    sourceRef: 'tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt',
    commands: ['xt rmt lint tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt --agent']
  }),
  recipeRecord({
    id: 'validation-transition-maraca-strict',
    profile: 'maraca',
    domains: ['validation', 'transition', 'maraca'],
    title: 'Validation and Transition for Maraca Strict',
    intent: 'Use the production orchestration fixture when agents need a complete strict-mode source.',
    sourceRef: 'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt',
    commands: [
      'xt maraca plan products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json'
    ]
  }),
  recipeRecord({
    id: 'agent-repair-loop',
    profile: 'repair',
    domains: ['repair', 'diagnostics'],
    title: 'Agent Repair Loop',
    intent: 'Repair with deterministic linter reports, then re-run lint after each applied fix.',
    steps: [
      'Run xt rmt lint app.rmt --agent.',
      'Apply only safe workspace-edit steps in fixOrder.',
      'Do not automate noOps with unsafe-automatic-edit.',
      'Re-run xt rmt lint app.rmt --agent after every batch.'
    ],
    commands: ['xt rmt lint app.rmt --agent']
  }),
  recipeRecord({
    id: 'maraca-plan-build',
    profile: 'maraca',
    domains: ['maraca', 'build'],
    title: 'Maraca Plan and Build',
    intent: 'Plan first, build second; use strict mode for production hardening.',
    sourceRef: 'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt',
    commands: [
      'xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json',
      'xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json'
    ]
  })
]);

function operatorRecord(operator, syntax, allowedContexts, description, validExample, invalidExample, diagnostics, sourceRefs) {
  return {
    schema: RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA,
    kind: 'operator',
    id: `operator:${operator}`,
    operator,
    syntax,
    allowedContexts,
    parameters: 'Static identifiers, strings, integers, booleans, paths or declarative expressions only.',
    description,
    validExample,
    invalidExample,
    diagnostics,
    sourceRefs
  };
}

function diagnosticRecord(code, impact, repairHint) {
  return {
    schema: RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA,
    kind: 'diagnostic',
    id: `diagnostic:${code}`,
    code,
    impact,
    repairHint,
    sourceRefs: ['development/XTendRMT-AI-Agent-Lint-Repair-Contract.md', 'tools/rmt-linter/reporter.d.ts']
  };
}

function cliRecord(command, profile, description) {
  return {
    schema: RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA,
    kind: 'cli',
    id: `cli:${command}`,
    command,
    profile,
    description,
    sourceRefs: ['xtend-builder/lib/cli.js', 'tools/rmt-linter/cli.js', 'xtend-maraca/index.d.ts']
  };
}

function recipeRecord(input) {
  return {
    schema: RMT_AI_DEVELOPER_KIT_RECIPE_RECORD_SCHEMA,
    compileExpectation: input.source || input.sourceRef ? 'must-compile' : 'procedure',
    negative: false,
    ...input
  };
}

function resolveRootDir(rootDir) {
  return path.resolve(rootDir || path.join(__dirname, '..', '..'));
}

function toRepoRelative(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function readTextIfExists(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function collectDocsSources(rootDir) {
  const docsDir = path.join(rootDir, 'docs', 'de');
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir)
    .filter((entry) => /^rmt-reference.*\.md$/u.test(entry) || /^learn-rmt.*\.md$/u.test(entry))
    .map((entry) => `docs/de/${entry}`)
    .sort();
}

function collectSourcePaths(rootDir) {
  return [...new Set(FIXED_SOURCE_PATHS.concat(collectDocsSources(rootDir)))]
    .filter((relativePath) => fs.existsSync(path.join(rootDir, relativePath)))
    .sort();
}

function createSourceRecords(rootDir) {
  return collectSourcePaths(rootDir).map((relativePath) => {
    const content = readTextIfExists(rootDir, relativePath);
    return {
      path: relativePath,
      sha256: sha256(content),
      bytes: Buffer.byteLength(content)
    };
  });
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function stringifyJsonl(records) {
  return records.map((record) => JSON.stringify(record)).join('\n') + '\n';
}

function createGuardrails() {
  return {
    schema: RMT_AI_DEVELOPER_KIT_GUARDRAILS_SCHEMA,
    status: RMT_AI_DEVELOPER_KIT_STATUS,
    forbiddenSyntax: [
      'if',
      'else',
      'for',
      'while',
      'switch',
      'try',
      'catch',
      'function',
      'return',
      'await',
      'async',
      'class',
      'new',
      'eval',
      'inline JavaScript',
      'inline HTML',
      'dynamic imports',
      'free function calls in when'
    ],
    securityBoundaries: [
      'no-rmt-kernel-import-of-host-runtime-types',
      'no-rmt-kernel-import-of-xtend-types',
      'no manual HTML sinks in normal App Platform authoring',
      'trusted output requires explicit trust boundary and sanitize policy'
    ],
    workflow: [
      'Load compact markdown first.',
      'Load JSONL records matching the task domain.',
      'Use a recipe before inventing syntax.',
      'Run xt rmt lint --agent before and after repairs.',
      'Use Maraca plan/build for production app bundles.'
    ],
    repairPolicy: {
      applySafeWorkspaceEditsOnly: true,
      rerunLintAfterEachBatch: true,
      noOpReasonsRequireHumanReview: ['unsafe-automatic-edit', 'component-stub-needs-authoring-context', 'source-not-parseable']
    }
  };
}

function createCompactMarkdown(guardrails) {
  return [
    '# RMT AI Developer Kit Compact',
    '',
    'Always load this file before asking an agent to write, repair or ship RMT.',
    '',
    '## Mental Model',
    '',
    '- RMT is declarative app structure, not JavaScript.',
    '- Humans write `.rmt`; tools compile to Core records, source maps and diagnostics.',
    '- Runtime behavior must be separated into Compiler Record, Host Adapter and Scheduler Signal.',
    '- Maraca is the production path for loaderless RMT-first XTend app bundles.',
    '',
    '## Load Order',
    '',
    '1. Load this compact file.',
    '2. Load relevant records from `rmt-ai-kit.reference.jsonl`.',
    '3. Load one matching recipe from `rmt-ai-kit.recipes.jsonl`.',
    '4. Run `xt rmt lint app.rmt --agent`.',
    '5. For app bundles, run `xt maraca plan ... --json` before build.',
    '',
    '## Non-Negotiable Rules',
    '',
    ...guardrails.forbiddenSyntax.map((entry) => `- Do not author ${entry}.`),
    '',
    '## Core Authoring Pattern',
    '',
    '```rmt',
    MINIMAL_APP_SOURCE.trim(),
    '```',
    '',
    '## Operator Context Map',
    '',
    '- `template`: document root for declarations.',
    '- `state`: owned app state; always give `type`.',
    '- `selector`: view-model from `state`, `datasource` or another supported source.',
    '- `surface`: UI surface with `kind`, `component`, `portal`, `lane`.',
    '- `lane`: scheduling block; lifecycle operations belong here.',
    '- `mount`/`hydrate`: render or hydrate targets from static sources.',
    '- `on ... -> action`: event binding; never call action functions.',
    '- `payload`: map `detail`, `target`, `input` or state paths.',
    '- `validation`: blocking rules and action gate for Maraca.',
    '- `transition`: surface change consumed by Maraca transitions.',
    '- `trust boundary` + `sanitize`: required for trusted output flows.',
    '',
    '## Repair Loop',
    '',
    '```bash',
    'xt rmt lint app.rmt --agent',
    '```',
    '',
    '- Apply `safe: true` workspace edits in `fixOrder`.',
    '- Treat `noOps` as handoff items, not automatic edits.',
    '- Re-run the agent report after every applied batch.',
    '',
    '## Maraca Flow',
    '',
    '```bash',
    'xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json',
    'xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json',
    '```',
    '',
    'Strict mode should fail early when payload contracts, resource ownership, hydration policy, component capabilities, validation messages or transition targets are incomplete.',
    ''
  ].join('\n');
}

function createPromptsMarkdown() {
  return [
    '# RMT AI Developer Kit Prompts',
    '',
    '## Authoring',
    '',
    'Load `rmt-ai-kit.compact.md`, then load reference JSONL records for the domains in the user request. Write only declarative RMT. Use one recipe as the shape source. Run `xt rmt lint <file> --agent` before claiming success.',
    '',
    '## Repair',
    '',
    'Run `xt rmt lint <file> --agent`. Apply only safe workspace-edit repairs in `fixOrder`. Do not rewrite unsafe no-op diagnostics. Re-run lint after each batch and summarize remaining no-ops.',
    '',
    '## Migration',
    '',
    'Identify whether input is legacy JSON/Core or native `.rmt`. Preserve semantics, migrate toward native `.rmt`, and keep host adapter work outside RMT source. Validate with linter and compiler.',
    '',
    '## Maraca Build',
    '',
    'Plan before build. Use strict orchestration, kernel, hydration, validation and transitions for production. Treat Maraca diagnostics as build blockers until explicit owner acceptance.',
    ''
  ].join('\n');
}

function createManifest({ rootDir, compact, referenceJsonl, recipesJsonl, prompts, guardrails, sourceRecords }) {
  return {
    schema: RMT_AI_DEVELOPER_KIT_MANIFEST_SCHEMA,
    kitSchema: RMT_AI_DEVELOPER_KIT_SCHEMA,
    version: '0.1.0',
    status: RMT_AI_DEVELOPER_KIT_STATUS,
    workpackage: RMT_AI_DEVELOPER_KIT_WORKPACKAGE,
    generatedAt: 'static-local',
    language: 'en-technical',
    outputDir: RMT_AI_DEVELOPER_KIT_OUTPUT_DIR,
    module: RMT_AI_DEVELOPER_KIT_MODULE_PATH,
    types: RMT_AI_DEVELOPER_KIT_TYPES_PATH,
    suite: RMT_AI_DEVELOPER_KIT_SUITE_PATH,
    localGate: RMT_AI_DEVELOPER_KIT_LOCAL_GATE,
    packageScript: RMT_AI_DEVELOPER_KIT_PACKAGE_SCRIPT,
    loadOrder: [
      ARTIFACT_PATHS.compact,
      ARTIFACT_PATHS.reference,
      ARTIFACT_PATHS.recipes,
      'xt rmt lint --agent',
      'xt maraca plan/build --json'
    ],
    profiles: {
      survival: { tokenBudget: SURVIVAL_TOKEN_LIMIT, purpose: 'tiny context, hard rules and one minimal recipe' },
      compact: { tokenBudget: COMPACT_TOKEN_LIMIT, purpose: 'always-load context' },
      full: { tokenBudget: null, purpose: 'JSONL retrieval and complete source anchors' },
      repair: { tokenBudget: REPAIR_TOKEN_LIMIT, purpose: 'linter, code actions and repair report workflow' },
      maraca: { tokenBudget: null, purpose: 'planning, bundling and runtime orchestration' }
    },
    tokenEstimates: {
      compact: estimateTokens(compact),
      prompts: estimateTokens(prompts),
      guardrails: estimateTokens(JSON.stringify(guardrails))
    },
    recordCounts: {
      reference: REFERENCE_RECORDS.length,
      recipes: RECIPE_RECORDS.length,
      sources: sourceRecords.length
    },
    artifacts: {
      [ARTIFACT_PATHS.compact]: { sha256: sha256(compact), tokenEstimate: estimateTokens(compact) },
      [ARTIFACT_PATHS.reference]: { sha256: sha256(referenceJsonl), lineCount: REFERENCE_RECORDS.length },
      [ARTIFACT_PATHS.recipes]: { sha256: sha256(recipesJsonl), lineCount: RECIPE_RECORDS.length },
      [ARTIFACT_PATHS.prompts]: { sha256: sha256(prompts), tokenEstimate: estimateTokens(prompts) },
      [ARTIFACT_PATHS.guardrails]: { sha256: sha256(JSON.stringify(guardrails, null, 2)), tokenEstimate: estimateTokens(JSON.stringify(guardrails)) }
    },
    sourceHashes: sourceRecords,
    rootDir: toRepoRelative(rootDir, rootDir)
  };
}

function createArtifactMap(kit) {
  return {
    [ARTIFACT_PATHS.compact]: kit.compact,
    [ARTIFACT_PATHS.manifest]: JSON.stringify(kit.manifest, null, 2) + '\n',
    [ARTIFACT_PATHS.reference]: kit.referenceJsonl,
    [ARTIFACT_PATHS.recipes]: kit.recipesJsonl,
    [ARTIFACT_PATHS.prompts]: kit.prompts,
    [ARTIFACT_PATHS.guardrails]: JSON.stringify(kit.guardrails, null, 2) + '\n'
  };
}

function createRmtAiDeveloperKit(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const sourceRecords = createSourceRecords(rootDir);
  const guardrails = createGuardrails();
  const compact = createCompactMarkdown(guardrails);
  const referenceJsonl = stringifyJsonl(REFERENCE_RECORDS);
  const recipesJsonl = stringifyJsonl(RECIPE_RECORDS);
  const prompts = createPromptsMarkdown();
  const manifest = createManifest({
    rootDir,
    compact,
    referenceJsonl,
    recipesJsonl,
    prompts,
    guardrails,
    sourceRecords
  });
  const kit = {
    schema: RMT_AI_DEVELOPER_KIT_SCHEMA,
    status: RMT_AI_DEVELOPER_KIT_STATUS,
    workpackage: RMT_AI_DEVELOPER_KIT_WORKPACKAGE,
    manifest,
    compact,
    referenceRecords: REFERENCE_RECORDS.map((record) => ({ ...record })),
    recipeRecords: RECIPE_RECORDS.map((record) => ({ ...record })),
    referenceJsonl,
    recipesJsonl,
    prompts,
    guardrails
  };
  kit.artifacts = createArtifactMap(kit);
  return kit;
}

function selectArtifactNames(profile, format) {
  if (profile === 'full') return Object.values(ARTIFACT_PATHS);
  if (format === 'jsonl') return [ARTIFACT_PATHS.reference, ARTIFACT_PATHS.recipes, ARTIFACT_PATHS.manifest];
  if (format === 'json') return [ARTIFACT_PATHS.manifest, ARTIFACT_PATHS.guardrails];
  if (format === 'md') return [ARTIFACT_PATHS.compact, ARTIFACT_PATHS.prompts];
  return Object.values(ARTIFACT_PATHS);
}

function exportRmtAiDeveloperKit(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const profile = options.profile || 'full';
  const format = options.format || 'all';
  const kit = createRmtAiDeveloperKit({ rootDir });
  const selectedNames = selectArtifactNames(profile, format);
  const outputDir = options.out || options.outputDir || null;
  const outputs = selectedNames.map((fileName) => {
    const content = kit.artifacts[fileName];
    const targetPath = outputDir ? path.join(outputDir, fileName) : fileName;
    return {
      id: fileName.replace(/^rmt-ai-kit\.|\.[^.]+$/gu, ''),
      path: targetPath,
      kind: fileName.endsWith('.jsonl') ? 'jsonl' : fileName.endsWith('.json') ? 'json' : 'markdown',
      generated: false,
      bytes: Buffer.byteLength(content),
      sha256: sha256(content),
      content
    };
  });

  if (outputDir) {
    const absoluteOutputDir = path.isAbsolute(outputDir) ? outputDir : path.join(rootDir, outputDir);
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
    outputs.forEach((output) => {
      const absolutePath = path.join(absoluteOutputDir, path.basename(output.path));
      fs.writeFileSync(absolutePath, output.content);
      output.path = toRepoRelative(rootDir, absolutePath);
      output.generated = true;
      delete output.content;
    });
  }

  return {
    schema: RMT_AI_DEVELOPER_KIT_SCHEMA,
    status: 'exported',
    ok: true,
    profile,
    format,
    outputDir: outputDir || null,
    manifest: kit.manifest,
    outputs
  };
}

module.exports = {
  ARTIFACT_PATHS,
  COMPACT_TOKEN_LIMIT,
  REPAIR_TOKEN_LIMIT,
  RMT_AI_DEVELOPER_KIT_GUARDRAILS_SCHEMA,
  RMT_AI_DEVELOPER_KIT_LOCAL_GATE,
  RMT_AI_DEVELOPER_KIT_MANIFEST_SCHEMA,
  RMT_AI_DEVELOPER_KIT_MODULE_PATH,
  RMT_AI_DEVELOPER_KIT_OUTPUT_DIR,
  RMT_AI_DEVELOPER_KIT_PACKAGE_SCRIPT,
  RMT_AI_DEVELOPER_KIT_RECIPE_RECORD_SCHEMA,
  RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA,
  RMT_AI_DEVELOPER_KIT_SCHEMA,
  RMT_AI_DEVELOPER_KIT_STATUS,
  RMT_AI_DEVELOPER_KIT_SUITE_PATH,
  RMT_AI_DEVELOPER_KIT_TYPES_PATH,
  RMT_AI_DEVELOPER_KIT_WORKPACKAGE,
  RECIPE_RECORDS,
  REFERENCE_RECORDS,
  SURVIVAL_TOKEN_LIMIT,
  createRmtAiDeveloperKit,
  exportRmtAiDeveloperKit,
  estimateTokens
};
