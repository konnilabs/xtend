'use strict';
const { validateRmtxSSRSourceIdentity } = require('./rmtx-ssr-contract.mjs');
// A separate entrypoint registers the genuine project compiler. Serialized
// plans, options or hashes cannot opt an old build into this new handoff.
const compilers = new WeakSet(), plans = new WeakMap();
function registerRmtxSSRCompiler(compile) { compilers.add(compile); }
function captureRmtxSSRPlan(plan, result, compile) {
  if (!compilers.has(compile)) return plan;
  if (!plan.ok) return plan;
  if (plan.profile !== 'production' || plan.lazy !== 'none' || plan.pwa?.enabled || plan.services?.enabled
    || plan.orchestrationMode !== 'strict' || plan.kernelMode !== 'strict') {
    throw new TypeError('RMTX SSR requires a strict production build with lazy:none and separate PWA/AppServices.');
  }
  const project = result.project;
  if (!project?.ok || project.effectiveSourceProfile?.syntax !== 'rmtx') throw new TypeError('RMTX SSR requires a successfully compiled RMTX project graph.');
  const sourceIdentity = validateRmtxSSRSourceIdentity({ schema: 'xtend.maraca.rmtx-ssr-source-identity.v1',
    sourceProfile: project.effectiveSourceProfile, sourceHash: plan.sourceHash,
    project: { schema: project.schema, apiVersion: project.apiVersion, identity: project.identity, sourceSyntax: project.sourceSyntax } });
  plans.set(plan, Object.freeze({ sourceIdentity }));
  return plan;
}
function getRmtxSSRPlanContext(plan) { return plans.get(plan) || null; }
module.exports = { registerRmtxSSRCompiler, captureRmtxSSRPlan, getRmtxSSRPlanContext };
