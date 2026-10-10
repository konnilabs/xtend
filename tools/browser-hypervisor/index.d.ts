export type BrowserEngine = 'chromium' | 'firefox' | 'edge' | 'webkit';
export interface WebDriverEndpoint { protocol: string; hostname: string; port: number; prefix: string; deadline?: number; assertOwner?: () => void }
export interface BrowserOptions {
  engine?: string;
  browserName?: string;
  capabilities?: Record<string, unknown>;
  browserBinary?: string;
  driver?: string;
  driverPath?: string;
  webDriverUrl?: string;
  port?: number;
  width?: number;
  height?: number;
  timeoutMs?: number;
  cleanupTimeoutMs?: number;
  driverLogPath?: string;
  rootDir?: string;
  fixturePath?: string;
  url?: string;
  resultKey?: string;
  screenshotPath?: string;
  actions?: unknown[];
  preloadScript?: string;
  scripts?: Array<{ waitFor?: string; script: string; args?: unknown[] }>;
  accept?: (result: unknown) => boolean;
  [option: string]: unknown;
}
export interface FixtureResult { schema: string; engine: string; driver: string; driverVersion: string | null; fixtureUrl: string; result: unknown; screenshot: string | null; [identity: string]: unknown }
export interface BrowserEvidence { schema: string; runId?: string; capturedAt?: string; engine: string; harness?: string; harnessSha256: string; status?: string; [field: string]: unknown }
export declare const BROWSER_HYPERVISOR_SCHEMA: string;
export declare const BROWSER_HYPERVISOR_EVIDENCE_SCHEMA: string;
export declare const BROWSER_HYPERVISOR_MATRIX_SCHEMA: string;
export declare const TARGET_ENGINES: readonly string[];
export declare function sha256(value: string | Uint8Array): string;
export declare function normalizeEngine(value: unknown): string;
export declare function defaultDriverForEngine(engine: string): string;
export declare function browserNameForEngine(engine: string, override?: string): string;
export declare function findExecutable(name: string, explicitPath?: string, options?: { explicitOnly?: boolean }): string | null;
export declare function parseEndpoint(value: string): WebDriverEndpoint;
export declare function requestJson(endpoint: WebDriverEndpoint, method: string, pathname: string, payload?: unknown): Promise<{ statusCode: number; body: Record<string, unknown> }>;
export declare function availablePort(requestedPort?: number): Promise<number>;
export declare function createCapabilities(options?: BrowserOptions): { capabilities: { alwaysMatch: Record<string, unknown> } };
export declare function providerOptions(options?: BrowserOptions): { webDriverUrl: string; driverPath: string; browserBinary: string; port?: number };
export declare function detectAvailableEngine(options?: BrowserOptions): string;
export declare function performActions(endpoint: WebDriverEndpoint, sessionId: string, actions?: unknown[]): Promise<void>;
export declare function runFixture(options?: BrowserOptions): Promise<FixtureResult>;
export interface BrowserEvidenceOptions {
  runId?: string;
  capturedAt?: string;
  engine?: string;
  browserName?: string;
  browserVersion?: string;
  driver?: string;
  driverVersion?: string;
  platformName?: string;
  harness?: string;
  harnessText?: string;
  harnessSha256?: string;
  status?: string;
  result?: unknown;
  checks?: unknown[];
  metrics?: Record<string, unknown>;
  claimBoundary?: string;
}
export declare function createEvidence(options?: BrowserEvidenceOptions): BrowserEvidence;
export declare function validateEvidence(evidence: unknown, options?: { runId?: string; harnessSha256?: string }): string[];
export declare function mergeEvidence(items: BrowserEvidence[], options?: { runId?: string; engines?: string[]; harnessSha256?: string }): { schema: string; runId: string | null; status: string; engines: BrowserEvidence[]; engineCount: number; errors: string[]; noInfrastructureResiduals: boolean };
