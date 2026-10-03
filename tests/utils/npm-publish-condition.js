'use strict';

function assertNpmPublishCondition(context, workflow) {
  const job = (workflow.split('\n  npm-publish-latest:\n')[1] || '').split(/\n  [a-z][\w-]*:\n/u)[0];
  const conditionMatch = job.match(/^    if: (?:>-\n([\s\S]*?)(?=^    \S)|([^\n]+))/mu);
  const needsMatch = job.match(/^    needs:\n((?:      - [\w-]+\n)+)/mu);
  context.assert(Boolean(conditionMatch && needsMatch), 'Publish job exposes its condition and required release gates');
  if (!conditionMatch || !needsMatch) return;
  const condition = (conditionMatch[1] || conditionMatch[2]).trim().replace(/^\$\{\{\s*|\s*\}\}$/gu, '');
  const gateIds = Array.from(needsMatch[1].matchAll(/- ([\w-]+)/gu), (match) => match[1]);
  const hasStatusFunction = /\b(?:always|cancelled|failure|success)\s*\(/u.test(condition);
  context.assert(hasStatusFunction && condition.includes('!cancelled()'), 'Publish condition overrides implicit success while remaining cancellable');
  context.assert(!gateIds.includes('pr-fast-gates'), 'PR-only gate is not a required publish gate');

  // This workflow condition uses a JavaScript-compatible subset of Actions expressions.
  // Model the documented implicit success() separately so the pre-fix condition fails
  // when its PR-only ancestor is skipped, even though all direct needs succeeded.
  // https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions
  let evaluate;
  try {
    evaluate = new Function('github', 'inputs', 'needs', 'cancelled', `return (${condition});`);
  } catch (error) {
    context.assert(false, `Publish condition is evaluable by the regression fixture: ${error.message}`);
    return;
  }
  const successfulNeeds = Object.fromEntries(gateIds.map((id) => [id, { result: 'success' }]));
  function canPublish({ event = 'workflow_dispatch', enabled = true, cancelled = false, needs = successfulNeeds, ancestor = 'skipped' } = {}) {
    return (hasStatusFunction || ancestor === 'success') && Boolean(evaluate(
      { event_name: event }, { publish_to_npm: enabled }, needs, () => cancelled
    ));
  }
  context.assert(canPublish(), 'Manual publish proceeds with successful release gates and a skipped PR-only ancestor');
  context.assert(!canPublish({ enabled: false }), 'Manual run without publish opt-in cannot publish');
  ['push', 'pull_request', 'schedule'].forEach((event) => {
    context.assert(!canPublish({ event }), `${event} cannot publish`);
  });
  context.assert(!canPublish({ cancelled: true }), 'Cancelled workflow cannot publish');
  gateIds.forEach((id) => {
    ['failure', 'cancelled', 'skipped', ''].forEach((result) => {
      const needs = { ...successfulNeeds, [id]: { result } };
      context.assert(!canPublish({ needs }), `Publish remains blocked when ${id} is ${result || 'unknown'}`);
    });
  });
}

module.exports = { assertNpmPublishCondition };
