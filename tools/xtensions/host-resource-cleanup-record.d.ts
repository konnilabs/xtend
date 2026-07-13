export const XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA: 'xtend.xtensions.host-resource-cleanup-record.v1';

export const XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS: readonly [
  'xtend.xtensions.chart-cleanup-record.v1',
  'xtend.xtensions.leaflet-cleanup-record.v1',
  'xtend.xtensions.react-host-controller-cleanup-record.v1',
  'xtend.xtensions.three-cleanup-record.v1',
  'xtend.xtensions.vue-host-controller-cleanup-record.v1'
];

export type HostResourceCleanupLegacySchemaId = typeof XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS[number];
export type HostResourceCleanupSchemaId = typeof XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA | HostResourceCleanupLegacySchemaId;

export interface HostResourceCleanupRecord {
  schema: typeof XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA;
  hostId: string;
  surfaceId: string;
  xtensionId: string;
  resource: string;
  status: 'released';
  sequence: number;
  timestamp: string;
}

export interface HostResourceCleanupRecordInput {
  hostId: string;
  surfaceId: string;
  xtensionId: string;
  resource: string;
  sequence: number;
  timestamp?: string;
  clock?: () => string;
}

export interface HostResourceCleanupSchemaResolution {
  canonicalSchemaId: typeof XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA;
  inputSchemaId: HostResourceCleanupSchemaId;
  isLegacy: boolean;
  deprecated: boolean;
}

export function createHostResourceCleanupRecord(input: HostResourceCleanupRecordInput): HostResourceCleanupRecord;
export function resolveHostResourceCleanupSchema(schemaId: unknown): HostResourceCleanupSchemaResolution | null;
