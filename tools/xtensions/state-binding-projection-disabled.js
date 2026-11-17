// SPDX-License-Identifier: Apache-2.0
'use strict';
// The legacy platform profile has no projection capability. Its shared binding
// validators retain their guards without importing the Source4 evaluator.
function configureProjectionContracts() {}
function unsupportedProjection() { throw new TypeError('Model projections require the explicit Source4 platform profile.'); }
const visitProjection = unsupportedProjection, validateProjection = unsupportedProjection,
  mapProjection = unsupportedProjection, evaluateProjection = unsupportedProjection;
module.exports = { configureProjectionContracts, visitProjection, validateProjection, mapProjection, evaluateProjection };
