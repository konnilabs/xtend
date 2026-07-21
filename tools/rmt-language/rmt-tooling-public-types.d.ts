export type RmtJsonPrimitive = string | number | boolean | null;
export type RmtJsonValue = RmtJsonPrimitive | RmtJsonValue[] | { [key: string]: RmtJsonValue };
export type RmtDiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';
export type RmtDiagnosticSource = 'rmt' | 'rmt-vnext' | 'rmt-language' | 'rmt-linter' | 'rmt-language-server' | string;

export interface RmtPosition {
  line: number;
  character: number;
  offset?: number;
}

export interface RmtRange {
  start: RmtPosition;
  end: RmtPosition;
}

export interface RmtTextDocument {
  uri?: string;
  filePath?: string;
  languageId?: string;
  version?: number;
  text: string;
}

export interface RmtSourceRef {
  uri?: string;
  filePath?: string;
  pointer?: string;
  range?: RmtRange;
}

export interface RmtToolingDiagnostic {
  code: string;
  message: string;
  severity?: RmtDiagnosticSeverity;
  source?: RmtDiagnosticSource;
  range?: RmtRange;
  pointer?: string;
  sourceRef?: RmtSourceRef;
  data?: RmtJsonValue;
}

export interface RmtTextEdit {
  range: RmtRange;
  newText: string;
}

export interface RmtWorkspaceEdit {
  changes?: Record<string, RmtTextEdit[]>;
  documentChanges?: Array<{
    textDocument?: { uri: string; version?: number | null };
    edits: RmtTextEdit[];
  }>;
}

export interface RmtCompletionItem {
  label: string;
  kind?: string | number;
  detail?: string;
  documentation?: string | RmtMarkupContent;
  insertText?: string;
  sortText?: string;
  filterText?: string;
  data?: RmtJsonValue;
}

export interface RmtHover {
  contents: string | RmtMarkupContent | Array<string | RmtMarkupContent>;
  range?: RmtRange;
}

export interface RmtDocumentSymbol {
  name: string;
  kind: string | number;
  range: RmtRange;
  selectionRange?: RmtRange;
  detail?: string;
  children?: RmtDocumentSymbol[];
}

export interface RmtDefinitionTarget {
  uri?: string;
  range: RmtRange;
  selectionRange?: RmtRange;
  pointer?: string;
}

export interface RmtCodeAction {
  title: string;
  kind?: string;
  diagnosticCode?: string;
  pointer?: string;
  safe?: boolean;
  confidence?: string;
  diagnostics?: RmtToolingDiagnostic[];
  edit?: RmtWorkspaceEdit;
  command?: RmtCommand;
  preview?: RmtJsonValue;
  fixAllActionCount?: number | null;
  diagnosticCodes?: string[];
  isPreferred?: boolean;
  data?: RmtJsonValue;
}

export interface RmtCommand {
  title: string;
  command: string;
  arguments?: RmtJsonValue[];
}

export interface RmtMarkupContent {
  kind: 'plaintext' | 'markdown' | string;
  value: string;
}

export interface RmtParseResult<TAst = RmtJsonValue> {
  ok: boolean;
  ast?: TAst;
  document?: TAst;
  diagnostics: RmtToolingDiagnostic[];
  sourceMap?: Record<string, RmtSourceRef>;
}

export type RmtAppServiceDemandMode = 'invoke' | 'stream';

export interface RmtAppServiceInputFieldPolicy {
  name: string;
  type: string;
  boundary: 'xtend.security.sanitizing-boundary.v1';
  sanitize: 'text';
}

export interface RmtAppServiceInputPolicy {
  schema: 'xtend.maraca.app-service-input-policy.v1';
  fields: RmtAppServiceInputFieldPolicy[];
}

export interface RmtAppServiceActionDemand {
  id: string;
  mode: RmtAppServiceDemandMode;
  inputs: Array<{
    name: string;
    type: string;
    inputPolicy?: {
      schema: 'xtend.maraca.app-service-input-policy.v1';
      boundary: 'xtend.security.sanitizing-boundary.v1';
      sanitize: 'text';
    };
  }>;
}

export interface RmtAppServiceDemand {
  id: string;
  dataSource: string;
  dataSourceRef: string | null;
  mode: RmtAppServiceDemandMode;
  contract: string | null;
  resultPath: string | null;
  actions: RmtAppServiceActionDemand[];
  inputPolicy: RmtAppServiceInputPolicy | null;
  sourceRef: string | null;
}

export interface RmtAppServiceDemandManifest {
  schema: 'xtend.maraca.app-service-demands.v1';
  sourceDocument: {
    id: string;
    namespace: string;
  };
  services: RmtAppServiceDemand[];
  fingerprint: string;
}

export interface RmtCompileResult<TCore = RmtJsonValue> {
  ok: boolean;
  core?: TCore;
  output?: TCore;
  appServiceDemands?: RmtAppServiceDemandManifest | null;
  diagnostics: RmtToolingDiagnostic[];
  sourceMap?: Record<string, RmtSourceRef>;
}

export interface RmtLanguageServiceReport<TData = RmtJsonValue> {
  schema?: string;
  ok: boolean;
  diagnostics: RmtToolingDiagnostic[];
  warnings?: RmtToolingDiagnostic[];
  data?: TData;
}

export interface RmtToolingReport<TData = RmtJsonValue> extends RmtLanguageServiceReport<TData> {
  workpackage?: string;
  status?: string;
  targetReadiness?: string;
  reportSchema?: string;
}

export interface RmtToolingOptions {
  rootDir?: string;
  cwd?: string;
  uri?: string;
  filePath?: string;
  source?: string;
  text?: string;
  document?: RmtTextDocument;
  [key: string]: unknown;
}

export type RmtToolingArguments = unknown[];
export type RmtToolingFunction<TReturn = RmtToolingReport> = (...args: RmtToolingArguments) => TReturn;
export type RmtToolingFactory<TReturn = RmtToolingReport> = (...args: RmtToolingArguments) => TReturn;
export type RmtToolingClassConstructor<TInstance = RmtToolingReport> = new (...args: RmtToolingArguments) => TInstance;
export type RmtToolingConstant<TValue = string> = TValue;

export interface RmtLanguageServiceProvider {
  analyze?(document: RmtTextDocument | string, options?: RmtToolingOptions): RmtLanguageServiceReport;
  lint?(document: RmtTextDocument | string, options?: RmtToolingOptions): RmtToolingDiagnostic[] | RmtLanguageServiceReport;
  format?(document: RmtTextDocument | string, options?: RmtToolingOptions): string | RmtTextEdit[];
  completions?(document: RmtTextDocument | string, position?: RmtPosition, options?: RmtToolingOptions): RmtCompletionItem[];
  hover?(document: RmtTextDocument | string, position?: RmtPosition, options?: RmtToolingOptions): RmtHover | null;
  symbols?(document: RmtTextDocument | string, options?: RmtToolingOptions): RmtDocumentSymbol[];
  definition?(document: RmtTextDocument | string, position?: RmtPosition, options?: RmtToolingOptions): RmtDefinitionTarget | null;
  codeActions?(document: RmtTextDocument | string, range?: RmtRange, options?: RmtToolingOptions): RmtCodeAction[];
}

export interface RmtJsonRpcMessage {
  jsonrpc: '2.0';
  id?: string | number | null;
  method?: string;
  params?: RmtJsonValue;
  result?: RmtJsonValue;
  error?: {
    code: number;
    message: string;
    data?: RmtJsonValue;
  };
}
