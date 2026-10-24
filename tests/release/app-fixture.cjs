'use strict';
// Controlled envelope fixture derived from the reviewed migration fixture.
// No real application, helper provisioning or product acceptance is claimed.
const { fixture } = require('../migration/electron-attestation-fixture.cjs');
function receipt({ directory, coreSha, demoSha, generatedAt }) {
  const value = fixture(directory);
  for (const item of [value.app, value.consumer, value.suite]) Object.assign(item, { coreSha, demoSha });
  value.app.generatedAt = generatedAt; value.consumer.generatedAt = generatedAt;
  value.suite.attestation.coreSha = coreSha; value.suite.attestation.demoSha = demoSha;
  value.suite.attestation.app = value.write('electron-sandbox-attestation.json', value.app);
  value.consumer.reportSha256 = value.suite.attestation.app.sha256;
  value.suite.attestation.consumer = value.write('electron-app-attestation-consumer.json', value.consumer);
  value.options = { ...value.options, coreSha, demoSha };
  return value;
}
module.exports = { receipt };
