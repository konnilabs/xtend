const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  COMPONENT_CONTRACT_V2_SCHEMA,
  COMPONENT_CONTRACT_REPORT_V2_SCHEMA,
  CONTRACT_V2_REQUIRED_DOMAINS,
  CONTRACT_V2_LIFECYCLE_OPERATIONS,
  CONTRACT_V2_LANE_PRECEDENCE,
  createComponentContractV2,
  validateComponentContractV2
} = require('../../xtend-builder/typing/component-contract-v2');

function runComponentContractV2Suite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-contract-v2',
    label: 'XTend Component Contract v2'
  });
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const contractDoc = readText('development/XTend-Component-Contract-v2.md', rootDir);
  const workpackage = readText('development/WP-E10-03-Component-Contract-v2-fuer-TypeScript-RMT-und-Fabric-definieren.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentContractV2;
  const sample = createComponentContractV2({
    tag: 'x-select',
    className: 'XSelect',
    maturity: 'stable',
    attributes: ['name', 'value', 'disabled'],
    events: ['select-changed'],
    slots: ['default', 'option'],
    methods: ['focus(): void']
  });
  const validation = validateComponentContractV2(sample);
  const invalidValidation = validateComponentContractV2({
    schema: COMPONENT_CONTRACT_V2_SCHEMA,
    tag: 'select',
    runtime: {
      format: 'iife',
      cdnAllowed: true
    }
  });

  context.assert(sample.schema === COMPONENT_CONTRACT_V2_SCHEMA, 'Contract factory emits Component Contract v2 schema');
  context.assert(validation.schema === COMPONENT_CONTRACT_REPORT_V2_SCHEMA, 'Contract validator emits report schema');
  context.assert(validation.ok, 'Contract validator accepts a complete sample contract');
  context.assert(!invalidValidation.ok, 'Contract validator rejects invalid component contracts');
  context.assert(CONTRACT_V2_REQUIRED_DOMAINS.includes('rmt'), 'Required domains include RMT');
  context.assert(CONTRACT_V2_REQUIRED_DOMAINS.includes('fabric'), 'Required domains include Fabric');
  context.assert(CONTRACT_V2_REQUIRED_DOMAINS.includes('telemetry'), 'Required domains include Telemetry');
  context.assert(CONTRACT_V2_REQUIRED_DOMAINS.includes('a11y'), 'Required domains include A11y');
  context.assert(CONTRACT_V2_REQUIRED_DOMAINS.includes('performance'), 'Required domains include Performance');
  context.assert(CONTRACT_V2_LIFECYCLE_OPERATIONS.includes('hydrate'), 'Lifecycle operations include hydrate');
  context.assert(CONTRACT_V2_LIFECYCLE_OPERATIONS.includes('event'), 'Lifecycle operations include event');
  context.assert(CONTRACT_V2_LANE_PRECEDENCE[0] === 'rmt.schedule-record', 'Lane precedence starts with concrete RMT schedule records');
  context.assert(sample.source.contractPath === 'src/components/x-select/x-select.contract.ts', 'Sample contract uses the TypeScript contract source path');
  context.assert(sample.runtime.artifact === 'components/xselect.js', 'Sample contract keeps existing basename runtime artifact convention');
  context.assert(sample.runtime.declaration === 'components/xselect.d.ts', 'Sample contract keeps declaration artifact convention');
  context.assert(sample.rmt.adapter === 'xtend.component', 'Sample contract uses XTend component adapter');
  context.assert(sample.rmt.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Sample contract keeps RMT kernel boundary');
  context.assert(sample.fabric.api === '@xtend-fabric', 'Sample contract binds to Fabric API name');
  context.assert(sample.telemetry.schema === 'xtend.fabric.telemetry-snapshot.v1', 'Sample contract binds telemetry snapshots');
  context.assert(sample.a11y.schema === 'xtend.a11y.component-contract.v1', 'Sample contract binds A11y contract');
  context.assert(sample.performance.schema === 'xtend.performance.component-profile.v1', 'Sample contract binds Performance profile');
  context.assert(metadata && metadata.schema === COMPONENT_CONTRACT_V2_SCHEMA, 'Package metadata exposes Component Contract v2 schema');
  context.assert(metadata.workpackage === 'WP-E10-03', 'Package metadata exposes WP-E10-03 owner');
  context.assert(metadata.contract === 'development/XTend-Component-Contract-v2.md', 'Package metadata exposes contract document path');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('publicApi'), 'Package metadata exposes publicApi as required domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('lanes'), 'Package metadata exposes lanes as required domain');
  context.assertIncludes(scaffoldConfig, 'componentContractV2', 'Scaffold config exposes Component Contract v2 section');
  context.assertIncludes(scaffoldConfig, 'xtend-builder/typing/component-contract-v2.js', 'Scaffold config references the Component Contract v2 module');
  context.assertIncludes(contractDoc, COMPONENT_CONTRACT_V2_SCHEMA, 'Contract document declares Component Contract v2 schema');
  context.assertIncludes(contractDoc, 'XtendComponentContractV2', 'Contract document defines the TypeScript interface name');
  context.assertIncludes(contractDoc, 'no-rmt-kernel-import-of-xtend-types', 'Contract document keeps the RMT kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-03 is completed');

  return context.result({
    schema: COMPONENT_CONTRACT_V2_SCHEMA,
    requiredDomains: CONTRACT_V2_REQUIRED_DOMAINS
  });
}

function printComponentContractV2Report(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component Contract v2 erfolgreich.',
    failureTitle: 'XTend Component Contract v2 fehlgeschlagen:'
  });
}

module.exports = {
  printComponentContractV2Report,
  runComponentContractV2Suite
};
