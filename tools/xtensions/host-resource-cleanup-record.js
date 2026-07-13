'use strict';

const XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA = 'xtend.xtensions.host-resource-cleanup-record.v1';

const XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS = Object.freeze([
  'xtend.xtensions.chart-cleanup-record.v1',
  'xtend.xtensions.leaflet-cleanup-record.v1',
  'xtend.xtensions.react-host-controller-cleanup-record.v1',
  'xtend.xtensions.three-cleanup-record.v1',
  'xtend.xtensions.vue-host-controller-cleanup-record.v1'
]);

const LEGACY_SCHEMA_IDS = new Set(XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS);

function requireNonEmptyString(source, field) {
  const value = source[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`Host resource cleanup record field "${field}" must be a non-empty string.`);
  }
  return value;
}

function timestampFromInput(source) {
  if (typeof source.timestamp === 'string' && source.timestamp.trim() !== '') return source.timestamp;
  if (typeof source.clock === 'function') {
    const timestamp = source.clock();
    if (typeof timestamp !== 'string' || timestamp.trim() === '') {
      throw new TypeError('Host resource cleanup record clock must return a non-empty timestamp string.');
    }
    return timestamp;
  }
  return new Date().toISOString();
}

function createHostResourceCleanupRecord(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  if (!Number.isInteger(source.sequence) || source.sequence < 1) {
    throw new TypeError('Host resource cleanup record field "sequence" must be a positive integer.');
  }

  return {
    schema: XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
    hostId: requireNonEmptyString(source, 'hostId'),
    surfaceId: requireNonEmptyString(source, 'surfaceId'),
    xtensionId: requireNonEmptyString(source, 'xtensionId'),
    resource: requireNonEmptyString(source, 'resource'),
    status: 'released',
    sequence: source.sequence,
    timestamp: timestampFromInput(source)
  };
}

function resolveHostResourceCleanupSchema(schemaId) {
  if (typeof schemaId !== 'string') return null;
  const inputSchemaId = schemaId.trim();
  if (inputSchemaId === XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA) {
    return {
      canonicalSchemaId: XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
      inputSchemaId,
      isLegacy: false,
      deprecated: false
    };
  }
  if (!LEGACY_SCHEMA_IDS.has(inputSchemaId)) return null;
  return {
    canonicalSchemaId: XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
    inputSchemaId,
    isLegacy: true,
    deprecated: true
  };
}

module.exports = {
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_LEGACY_SCHEMA_IDS,
  XTENSIONS_HOST_RESOURCE_CLEANUP_RECORD_SCHEMA,
  createHostResourceCleanupRecord,
  resolveHostResourceCleanupSchema
};
