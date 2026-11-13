// SPDX-License-Identifier: Apache-2.0
export const DEPLOYMENT_CLIENT_API_VERSION: '1.0.0';
export interface DeploymentClientMetadata {
  schema: 'xtend.maraca.xtension-deployment-client.v1'; revision: string;
  scope: string; workerUrl: string; acknowledgementTimeoutMs: number;
}
export const deployment: Readonly<DeploymentClientMetadata>;
export interface DeploymentUpdateReport {
  readonly schema: 'xtend.maraca.xtension-deployment-update-response.v1';
  readonly requestId: string; readonly action: 'status' | 'collect';
  readonly status: 'ok' | 'blocked'; readonly reason: string | null;
  readonly revision: string; readonly waiting: boolean;
  readonly candidates: readonly string[]; readonly deleted: readonly string[];
}
export interface DeploymentUpdateClient {
  /** An explicit application lease; the default is false. */
  setReadyForRetirement(ready: boolean): void;
  status(): Promise<DeploymentUpdateReport>;
  checkForUpdate(): Promise<DeploymentUpdateReport>;
  collectRetiredCaches(): Promise<DeploymentUpdateReport>;
  dispose(): void;
}
export function createDeploymentClient(): DeploymentUpdateClient;

export interface DeploymentUpdateRequest {
  readonly schema: 'xtend.maraca.xtension-deployment-update-request.v1'; readonly requestId: string;
  readonly action: 'status' | 'collect'; readonly revision: string;
}
export interface DeploymentUpdateChallenge {
  readonly schema: 'xtend.maraca.xtension-deployment-update-challenge.v1'; readonly nonce: string; readonly revision: string;
}
export interface DeploymentUpdateAcknowledgement {
  readonly schema: 'xtend.maraca.xtension-deployment-update-ack.v1'; readonly nonce: string; readonly revision: string; readonly ready: boolean;
}
