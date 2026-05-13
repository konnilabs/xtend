export type XtendBuilderJsonPrimitive = string | number | boolean | null;
export type XtendBuilderJsonValue = XtendBuilderJsonPrimitive | XtendBuilderJsonValue[] | { [key: string]: XtendBuilderJsonValue };
export type XtendBuilderRecord<TValue = unknown> = Record<string, TValue>;
export type XtendBuilderStatus = 'accepted' | 'planned' | 'pilot' | 'dry-run-contract-binding' | 'prepared-contract-only' | string;
export type XtendBuilderOutputMode = 'text' | 'json' | 'json-file' | string;
export type XtendBuilderConstant<TValue = unknown> = TValue;
export type XtendBuilderFunction<TReturn = unknown> = (...args: unknown[]) => TReturn;
export type XtendBuilderFactory<TReturn = unknown, TInput = XtendBuilderComponentInput> = (input?: TInput, options?: XtendBuilderOptions) => TReturn;

export interface XtendBuilderOptions {
  rootDir?: string;
  config?: XtendBuilderRecord;
  blueprint?: XtendBuilderBlueprintContract;
  plan?: XtendBuilderComponentPlan;
  [key: string]: unknown;
}

export interface XtendBuilderDiagnostic {
  code?: string;
  message: string;
  severity?: 'debug' | 'info' | 'warn' | 'error' | string;
  path?: string;
  details?: unknown;
}

export interface XtendBuilderReport<TPlan = unknown> {
  schema: string;
  ok: boolean;
  errors: string[];
  warnings?: string[];
  plan?: TPlan;
  [key: string]: unknown;
}

export interface XtendBuilderCommand {
  id: string;
  command: string;
  argv: string[];
  purpose: string;
  output?: XtendBuilderOutputMode;
}

export interface XtendBuilderCliIo {
  stdout?: { write(value: string): unknown };
  stderr?: { write(value: string): unknown };
  [key: string]: unknown;
}

export interface XtendBuilderCliArgs {
  command: string | null;
  help: boolean;
  json: boolean;
  rest: string[];
}

export interface XtendBuilderFlagArgs {
  _: string[];
  [key: string]: unknown;
}

export interface XtendBuilderComponentInput {
  tag?: string;
  name?: string;
  profile?: string | string[];
  profiles?: string | string[];
  feature?: string | string[];
  features?: string | string[];
  suite?: string | string[];
  suites?: string | string[];
  [key: string]: unknown;
}

export interface XtendBuilderArtifactContract {
  id: string;
  pathTemplate: string;
  required: boolean | 'conditional' | string;
  mode: string;
  purpose: string;
  minimumContract: string[];
}

export interface XtendBuilderArtifactPlan {
  id: string;
  required: boolean | 'conditional' | string;
  mode: string;
  action: string;
  targetPath: string;
  templateId: string | null;
  templateStatus: string;
  purpose: string;
  minimumContract: string[];
}

export interface XtendBuilderComponentPlan {
  schema: string;
  ok: boolean;
  mode: string;
  generator?: string;
  writeStrategy?: string;
  input?: XtendBuilderRecord;
  a11yProfile?: XtendBuilderRecord;
  performanceProfile?: XtendBuilderRecord;
  artifacts: XtendBuilderArtifactPlan[];
  errors?: string[];
  nextStep?: string;
  [key: string]: unknown;
}

export interface XtendBuilderRenderedFile {
  id: string;
  targetPath: string;
  action: string;
  templateId: string;
  templatePath: string;
  content: string;
}

export interface XtendBuilderComponentFilesResult {
  schema: string;
  ok: boolean;
  mode: string;
  generator?: string;
  writeStrategy?: string;
  input?: XtendBuilderRecord;
  wiring?: XtendBuilderRecord;
  rmtCompatibility?: XtendBuilderRecord;
  files: XtendBuilderRenderedFile[];
  errors?: string[];
  exceptions: string[];
  nextStep?: string;
  [key: string]: unknown;
}

export interface XtendBuilderBlueprintContract {
  schema: string;
  status: XtendBuilderStatus;
  naming: XtendBuilderRecord;
  artifacts: XtendBuilderArtifactContract[];
  profiles: XtendBuilderRecord[];
  typescriptBlueprint?: XtendBuilderRecord;
  a11yProfile?: XtendBuilderRecord;
  performancePolicy?: XtendBuilderRecord;
  exceptionPolicy?: XtendBuilderRecord;
}

export interface XtendBuilderGeneratorDefinition {
  id: string;
  command: string;
  status: XtendBuilderStatus;
  description: string;
  module: string;
  schema: string;
  [key: string]: unknown;
}

export interface XtendBuilderGeneratorRegistry {
  schema: string;
  generators: XtendBuilderGeneratorDefinition[];
  [key: string]: unknown;
}

export interface XtendBuilderTemplateDefinition {
  id: string;
  artifact: string;
  status: XtendBuilderStatus;
  path: string;
  [key: string]: unknown;
}

export interface XtendBuilderTemplateRegistry {
  schema: string;
  templates: XtendBuilderTemplateDefinition[];
  [key: string]: unknown;
}

export interface XtendBuilderTemplateRenderResult {
  ok: boolean;
  content?: string;
  template?: XtendBuilderTemplateDefinition;
  error?: string;
}

export interface XtendBuilderWorkflow {
  schema: string;
  ok: boolean;
  mode: string;
  writePolicy?: string;
  entryPoints?: XtendBuilderCommand[];
  commands?: XtendBuilderCommand[];
  npmScripts?: XtendBuilderRecord<string>;
  selectedSuites?: string[];
  reviewChecklist?: string[];
  nextStep?: string;
  [key: string]: unknown;
}

export interface XtendBuilderContractPlan extends XtendBuilderRecord {
  schema: string;
  status?: XtendBuilderStatus;
  workpackage?: string;
  localGate?: string;
}

export interface XtendBuilderPreviewTarget {
  schema: string;
  tag: string;
  title: string;
  family: string;
  maturity: string;
  priority: string;
  profiles: string[];
  paths: XtendBuilderRecord<string>;
  rmt: XtendBuilderRecord;
  fabric: XtendBuilderRecord;
  telemetry: XtendBuilderRecord;
  a11y: XtendBuilderRecord;
  performance: XtendBuilderRecord;
}

export interface XtendBuilderComponentLabPlan extends XtendBuilderContractPlan {
  renderMode: string;
  localOnly: boolean;
  externalNetworkAllowed: boolean;
  kernelBoundary: string;
  lab: {
    previewTargets: XtendBuilderPreviewTarget[];
    requiredPanels: string[];
    panels: XtendBuilderRecord[];
    [key: string]: unknown;
  };
  inspector: XtendBuilderRecord;
  gates: string[];
  handoff: XtendBuilderRecord;
}
