// SPDX-License-Identifier: Apache-2.0
export const DEPLOYMENT_CLIENT_API_VERSION: '1.0.0';
export interface DeploymentLifecycleMetadata {
  readonly schema: 'xtend.maraca.xtension-deployment-client.v1'; readonly revision: string;
  readonly scope: string; readonly workerUrl: string; readonly acknowledgementTimeoutMs: number; readonly headUrl: string;
}
export interface DeploymentHead {
  readonly schema: 'xtend.maraca.xtension-deployment-head.v1'; readonly revision: string;
  readonly scope: string; readonly documentUrl: string; readonly workerUrl: string;
}
export interface DeploymentUpdateReport {
  readonly schema: 'xtend.maraca.xtension-deployment-update-response.v1';
  readonly requestId: string; readonly action: 'status' | 'collect';
  readonly status: 'ok' | 'blocked'; readonly reason: string | null;
  readonly revision: string; readonly waiting: boolean;
  readonly candidates: readonly string[]; readonly deleted: readonly string[];
  readonly currentRevision?: string; readonly updateAvailable?: boolean; readonly requiresDocumentNavigation?: boolean;
  readonly documentUrl?: string | null; readonly workerUrl?: string | null;
}
export interface DeploymentUpdateClient {
  setReadyForRetirement(ready: boolean): void;
  /** Reads advisory same-origin metadata; never registers a worker or navigates. */
  checkForUpdate(): Promise<DeploymentUpdateReport>;
  status(): Promise<DeploymentUpdateReport>;
  collectRetiredCaches(): Promise<DeploymentUpdateReport>;
  dispose(): void;
}
export const deployment: Readonly<DeploymentLifecycleMetadata>;
export function createDeploymentClient(): DeploymentUpdateClient;
