// SPDX-License-Identifier: Apache-2.0
'use strict';
// Built platform profiles before Source7 publish no orchestrated binding port.
// Keep their shared SDK entry closed without retaining the newer View runtime.
function validateOrchestratedStateBindingArtifact() {
  throw new TypeError('Orchestrated bindings require the explicit Source7 platform profile.');
}
function materializeOrchestratedStateBindingArtifact() {
  throw new TypeError('Orchestrated bindings require the explicit Source7 platform profile.');
}
module.exports = { validateOrchestratedStateBindingArtifact, materializeOrchestratedStateBindingArtifact };
