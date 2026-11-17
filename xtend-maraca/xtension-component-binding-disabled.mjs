// SPDX-License-Identifier: Apache-2.0
// Manifest profiles 1–5 have no provider-owned component-interface capability.
// Shared composers keep an explicit guard without capturing that evaluator.
export function validateComponentBindings() {
  throw new TypeError('Component bindings require the explicit component platform profile.');
}
