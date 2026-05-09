export const {{className}}RmtComponentMetadata = {{rmtComponentMetadataJson}} as const;

export const {{className}}RmtAuthoringBoundary = {
  adapter: 'xtend.component',
  componentContract: '{{componentContractV2Schema}}',
  rmtContract: '{{typeRmtComponentContractVersion}}',
  fabricLaneIngestion: '{{componentFabricLaneIngestionSchema}}',
  lifecycleTelemetry: '{{componentLifecycleTelemetrySchema}}',
  kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
} as const;

export default {{className}}RmtComponentMetadata;
