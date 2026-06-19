const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  runCli
} = require('../../xtend-builder/lib/cli');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  createMaracaBuildPlan
} = require('../../xtend-maraca');
const {
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
  SURVIVAL_TOKEN_LIMIT,
  createRmtAiDeveloperKit,
  estimateTokens,
  exportRmtAiDeveloperKit
} = require('../../tools/rmt-language/rmt-ai-developer-kit');

function createMemoryStream() {
  const chunks = [];

  return {
    write(chunk) {
      chunks.push(String(chunk));
    },
    toString() {
      return chunks.join('');
    }
  };
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function parseJsonl(text) {
  return String(text || '')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function artifactPath(fileName) {
  return `${RMT_AI_DEVELOPER_KIT_OUTPUT_DIR}/${fileName}`;
}

function exportDefault(packageManifest, exportKey) {
  const entry = packageManifest.exports && packageManifest.exports[exportKey];
  return typeof entry === 'string' ? entry : entry && entry.default;
}

function readRecipeSource(recipe, rootDir) {
  if (recipe.source) {
    return {
      text: recipe.source,
      filePath: path.join(rootDir, `${recipe.id}.rmt`)
    };
  }

  return {
    text: readText(recipe.sourceRef, rootDir),
    filePath: resolveRepoPath(recipe.sourceRef, rootDir)
  };
}

function runShapeChecks(context, kit) {
  context.assert(kit.schema === RMT_AI_DEVELOPER_KIT_SCHEMA, 'Kit exposes stable AI Developer Kit schema');
  context.assert(kit.status === RMT_AI_DEVELOPER_KIT_STATUS, 'Kit exposes accepted ingest status');
  context.assert(kit.workpackage === RMT_AI_DEVELOPER_KIT_WORKPACKAGE, 'Kit declares AI Developer Kit workpackage');
  context.assert(kit.manifest.schema === RMT_AI_DEVELOPER_KIT_MANIFEST_SCHEMA, 'Manifest exposes stable schema');
  context.assert(kit.manifest.kitSchema === RMT_AI_DEVELOPER_KIT_SCHEMA, 'Manifest links back to kit schema');
  context.assert(kit.guardrails.schema === RMT_AI_DEVELOPER_KIT_GUARDRAILS_SCHEMA, 'Guardrails expose stable schema');
  context.assert(kit.manifest.outputDir === RMT_AI_DEVELOPER_KIT_OUTPUT_DIR, 'Manifest declares output directory');
  context.assert(kit.manifest.localGate === RMT_AI_DEVELOPER_KIT_LOCAL_GATE, 'Manifest declares local gate');
  context.assert(kit.manifest.packageScript === RMT_AI_DEVELOPER_KIT_PACKAGE_SCRIPT, 'Manifest declares package script');
  context.assert(kit.manifest.recordCounts.reference === kit.referenceRecords.length, 'Manifest reference count matches records');
  context.assert(kit.manifest.recordCounts.recipes === kit.recipeRecords.length, 'Manifest recipe count matches records');
  context.assert(kit.manifest.tokenEstimates.compact <= COMPACT_TOKEN_LIMIT, 'Compact profile stays inside token budget');
  context.assert(estimateTokens(kit.compact) <= SURVIVAL_TOKEN_LIMIT, 'Survival load stays inside tiny-model token budget');
  context.assert(estimateTokens(`${kit.compact}\n${kit.prompts}`) <= REPAIR_TOKEN_LIMIT, 'Repair profile stays inside repair token budget');
  context.assert(kit.manifest.loadOrder[0] === ARTIFACT_PATHS.compact, 'Load order starts with compact markdown');
  context.assert(kit.manifest.loadOrder.includes('xt rmt lint --agent'), 'Load order requires agent linting');
  context.assert(kit.manifest.loadOrder.includes('xt maraca plan/build --json'), 'Load order points production bundles to Maraca');
  context.assert(Object.keys(ARTIFACT_PATHS).every((key) => Boolean(kit.artifacts[ARTIFACT_PATHS[key]])), 'Kit generates every declared artifact');
}

function runGuardrailChecks(context, kit) {
  const forbidden = kit.guardrails.forbiddenSyntax || [];
  const boundaries = kit.guardrails.securityBoundaries || [];

  ['inline JavaScript', 'inline HTML', 'dynamic imports', 'free function calls in when'].forEach((entry) => {
    context.assert(forbidden.includes(entry), `Guardrails forbid ${entry}`);
  });
  context.assert(boundaries.includes('no-rmt-kernel-import-of-xtend-types'), 'Guardrails preserve XTend kernel boundary');
  context.assert(kit.compact.includes('RMT is declarative app structure'), 'Compact file explains declarative mental model');
  context.assert(kit.compact.includes('Compiler Record, Host Adapter and Scheduler Signal'), 'Compact file separates runtime responsibilities');
  context.assert(kit.compact.includes('xt rmt lint app.rmt --agent'), 'Compact file documents repair loop command');
  context.assert(kit.prompts.includes('## Authoring'), 'Prompts include authoring profile');
  context.assert(kit.prompts.includes('## Repair'), 'Prompts include repair profile');
  context.assert(kit.prompts.includes('## Maraca Build'), 'Prompts include Maraca build profile');
}

function runJsonlChecks(context, kit) {
  const referenceRecords = parseJsonl(kit.referenceJsonl);
  const recipeRecords = parseJsonl(kit.recipesJsonl);
  const operatorRecords = referenceRecords.filter((record) => record.kind === 'operator');
  const requiredOperators = ['template', 'state', 'selector', 'surface', 'lane', 'hydrate', 'action', 'on', 'validation', 'transition'];

  context.assert(referenceRecords.length === kit.referenceRecords.length, 'Reference JSONL has one line per reference record');
  context.assert(recipeRecords.length === kit.recipeRecords.length, 'Recipe JSONL has one line per recipe record');
  context.assert(referenceRecords.every((record) => record.schema === RMT_AI_DEVELOPER_KIT_REFERENCE_RECORD_SCHEMA), 'Every reference record uses stable schema');
  context.assert(recipeRecords.every((record) => record.schema === RMT_AI_DEVELOPER_KIT_RECIPE_RECORD_SCHEMA), 'Every recipe record uses stable schema');
  requiredOperators.forEach((operator) => {
    context.assert(operatorRecords.some((record) => record.operator === operator), `Reference includes operator ${operator}`);
  });
  operatorRecords.forEach((record) => {
    context.assert(Boolean(record.syntax), `${record.id} declares syntax`);
    context.assert(Array.isArray(record.allowedContexts) && record.allowedContexts.length > 0, `${record.id} declares allowed contexts`);
    context.assert(Boolean(record.parameters), `${record.id} declares parameters`);
    context.assert(Boolean(record.validExample), `${record.id} declares valid example`);
    context.assert(Boolean(record.invalidExample), `${record.id} declares invalid example`);
    context.assert(Boolean(record.diagnostics), `${record.id} declares diagnostics`);
    context.assert(Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0, `${record.id} declares source references`);
  });
  context.assert(referenceRecords.some((record) => record.command === 'xt rmt lint app.rmt --agent'), 'Reference records document agent lint command');
  context.assert(referenceRecords.some((record) => record.command && record.command.includes('xt maraca plan')), 'Reference records document Maraca plan command');
}

function runRecipeChecks(context, kit, rootDir) {
  kit.recipeRecords.forEach((recipe) => {
    context.assert(Array.isArray(recipe.domains) && recipe.domains.length > 0, `${recipe.id} declares task domains`);
    context.assert(Array.isArray(recipe.commands) && recipe.commands.length > 0, `${recipe.id} declares commands`);
    if (recipe.compileExpectation !== 'must-compile') return;

    const source = readRecipeSource(recipe, rootDir);
    const result = compileRmtVNextSource(source);
    const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.severity === 'error');
    context.assert(result.ok === true, `${recipe.id} compiles${errors.length > 0 ? ` (${errors.map((diagnostic) => diagnostic.code).join(', ')})` : ''}`);
  });

  const maracaRecipe = kit.recipeRecords.find((recipe) => recipe.id === 'validation-transition-maraca-strict');
  const plan = createMaracaBuildPlan({
    source: maracaRecipe.sourceRef,
    orchestration: 'strict',
    kernel: 'strict',
    hydration: 'strict',
    validation: 'strict',
    transitions: 'strict'
  }, {
    rootDir
  });
  context.assert(plan.ok === true, 'Maraca strict recipe produces a valid plan');
  context.assert(plan.status === 'planned', 'Maraca strict recipe stops at plan phase');
}

function runExportChecks(context, rootDir) {
  const compactExport = exportRmtAiDeveloperKit({
    rootDir,
    profile: 'compact',
    format: 'md'
  });
  const fullExport = exportRmtAiDeveloperKit({
    rootDir,
    profile: 'full',
    format: 'jsonl'
  });
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-ai-kit-'));

  try {
    const generated = exportRmtAiDeveloperKit({
      rootDir,
      profile: 'full',
      format: 'all',
      out: tempRoot
    });
    context.assert(compactExport.ok === true && compactExport.outputs.length === 2, 'Compact markdown export returns compact and prompt artifacts');
    context.assert(compactExport.outputs.every((output) => typeof output.content === 'string'), 'In-memory export keeps content for agent pipelines');
    context.assert(fullExport.outputs.length === Object.keys(ARTIFACT_PATHS).length, 'Full export returns all ingest artifacts');
    context.assert(generated.outputs.every((output) => output.generated === true), 'Output-dir export writes all selected artifacts');
    context.assert(generated.outputs.every((output) => fs.existsSync(resolveRepoPath(output.path, rootDir))), 'Output-dir export reports existing generated files');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function runCliChecks(context) {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runCli(['rmt', 'ai-kit', 'export', '--profile', 'compact', '--format', 'md', '--json'], {
    stdout,
    stderr
  });
  const report = JSON.parse(stdout.toString());
  const help = createMemoryStream();
  const helpExitCode = runCli(['rmt', 'ai-kit', '--help'], {
    stdout: help,
    stderr: createMemoryStream()
  });

  context.assert(exitCode === 0, 'CLI compact AI kit export exits successfully');
  context.assert(stderr.toString() === '', 'CLI compact AI kit export keeps stderr empty');
  context.assert(report.schema === RMT_AI_DEVELOPER_KIT_SCHEMA, 'CLI export emits kit schema');
  context.assert(report.outputs.some((output) => output.path === ARTIFACT_PATHS.compact), 'CLI compact export includes compact markdown');
  context.assert(helpExitCode === 0, 'CLI AI kit help exits successfully');
  context.assert(help.toString().includes('xt rmt ai-kit export'), 'CLI help documents AI kit export command');
}

function runGeneratedArtifactChecks(context, kit, rootDir) {
  Object.values(ARTIFACT_PATHS).forEach((fileName) => {
    const relativePath = artifactPath(fileName);
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
    context.assert(readText(relativePath, rootDir) === kit.artifacts[fileName], `${relativePath} matches generated source`);
  });

  const manifest = readJson(artifactPath(ARTIFACT_PATHS.manifest), rootDir);
  context.assert(manifest.schema === RMT_AI_DEVELOPER_KIT_MANIFEST_SCHEMA, 'Generated manifest parses with stable schema');
  context.assert(manifest.sourceHashes.some((entry) => entry.path === 'development/XTendRMT-vNext-Grammar-Contract.md'), 'Manifest hashes grammar contract');
  context.assert(manifest.sourceHashes.some((entry) => entry.path === 'docs/de/rmt-reference.md'), 'Manifest hashes public RMT reference');
  context.assert(manifest.sourceHashes.some((entry) => entry.path === 'tools/rmt-linter/reporter.d.ts'), 'Manifest hashes agent repair reporter types');
  context.assert(manifest.sourceHashes.some((entry) => entry.path === 'xtend-maraca/index.d.ts'), 'Manifest hashes Maraca public types');
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const toolsManifest = readJson('tools/package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtAiDeveloperKit;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  context.assert(metadata && metadata.schema === RMT_AI_DEVELOPER_KIT_SCHEMA, 'Package metadata declares AI Developer Kit schema');
  context.assert(metadata && metadata.module === RMT_AI_DEVELOPER_KIT_MODULE_PATH, 'Package metadata points to AI Kit module');
  context.assert(metadata && metadata.types === RMT_AI_DEVELOPER_KIT_TYPES_PATH, 'Package metadata points to AI Kit types');
  context.assert(metadata && metadata.suite === RMT_AI_DEVELOPER_KIT_SUITE_PATH, 'Package metadata points to AI Kit suite');
  context.assert(metadata && metadata.outputDir === RMT_AI_DEVELOPER_KIT_OUTPUT_DIR, 'Package metadata declares AI Kit output directory');
  context.assert(metadata && metadata.localGate === RMT_AI_DEVELOPER_KIT_LOCAL_GATE, 'Package metadata declares AI Kit local gate');
  context.assert(metadata && metadata.packageScript === RMT_AI_DEVELOPER_KIT_PACKAGE_SCRIPT, 'Package metadata declares AI Kit package script');
  context.assert(exportDefault(packageManifest, './rmt-language/rmt-ai-developer-kit') === './tools/rmt-language/rmt-ai-developer-kit.js', 'Root package exports AI Kit module');
  context.assert(exportDefault(toolsManifest, './rmt-language/rmt-ai-developer-kit') === './rmt-language/rmt-ai-developer-kit.js', 'Tools package exports AI Kit module');
  context.assert(packageManifest.scripts['test:rmt-ai-developer-kit'] === 'node scripts/run_xtend_tests.js rmt-ai-developer-kit', 'Package exposes AI Kit test script');
  context.assert(packageManifest.scripts['test:rmt-tooling'].includes('rmt-ai-developer-kit'), 'Bundled RMT tooling gate includes AI Kit');
  context.assert(runner.includes("id: 'rmt-ai-developer-kit'"), 'Test runner exposes AI Kit suite');
}

function runRmtAiDeveloperKitSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-ai-developer-kit',
    label: 'RMT AI Developer Kit'
  });
  const kit = createRmtAiDeveloperKit({ rootDir });
  const moduleSyntax = syntaxCheckFile(RMT_AI_DEVELOPER_KIT_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_AI_DEVELOPER_KIT_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_AI_DEVELOPER_KIT_MODULE_PATH, rootDir, 'AI Kit module exists');
  assertFileExists(context, RMT_AI_DEVELOPER_KIT_TYPES_PATH, rootDir, 'AI Kit types exist');
  assertFileExists(context, RMT_AI_DEVELOPER_KIT_SUITE_PATH, rootDir, 'AI Kit suite exists');
  context.assert(moduleSyntax.ok, `AI Kit module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `AI Kit suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runShapeChecks(context, kit);
  runGuardrailChecks(context, kit);
  runJsonlChecks(context, kit);
  runRecipeChecks(context, kit, rootDir);
  runExportChecks(context, rootDir);
  runCliChecks(context);
  runGeneratedArtifactChecks(context, kit, rootDir);
  runMetadataChecks(context, rootDir);

  return context.result({
    schema: RMT_AI_DEVELOPER_KIT_SCHEMA,
    workpackage: RMT_AI_DEVELOPER_KIT_WORKPACKAGE,
    module: RMT_AI_DEVELOPER_KIT_MODULE_PATH,
    suite: RMT_AI_DEVELOPER_KIT_SUITE_PATH,
    outputDir: RMT_AI_DEVELOPER_KIT_OUTPUT_DIR
  });
}

function printRmtAiDeveloperKitReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT AI Developer Kit erfolgreich.',
    failureTitle: 'RMT AI Developer Kit fehlgeschlagen:'
  });
}

module.exports = {
  printRmtAiDeveloperKitReport,
  runRmtAiDeveloperKitSuite
};
