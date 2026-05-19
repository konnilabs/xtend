const {
  createBoundaryPolicyRule
} = require('./boundary-policy');
const {
  createDocumentPolicyRule
} = require('./document-policy');
const {
  createRoutePolicyRule
} = require('./route-policy');
const {
  createSchedulerPolicyRule
} = require('./scheduler-policy');
const {
  createTemplatePolicyRule
} = require('./template-policy');
const {
  createAppPlatformPolicyRule
} = require('./app-platform-policy');

function getDefaultRmtLinterRules() {
  return [
    createDocumentPolicyRule(),
    createRoutePolicyRule(),
    createTemplatePolicyRule(),
    createSchedulerPolicyRule(),
    createBoundaryPolicyRule(),
    createAppPlatformPolicyRule()
  ];
}

module.exports = {
  getDefaultRmtLinterRules
};
