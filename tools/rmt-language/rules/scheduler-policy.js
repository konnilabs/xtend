const KNOWN_HYDRATION_POLICIES = new Set([
  'runtime_render',
  'hydrate_prerendered',
  'managed_subtree',
  'manual',
  'none',
  'lazy',
  'idle',
  'visible'
]);

function createSchedulerPolicyRule() {
  return {
    id: 'rmt.scheduler-policy',
    description: 'Validiert Schedule Endpoints und bekannte Hydration Policies.',
    defaultSeverity: 'warning',
    run(context) {
      const diagnostics = [];

      context.toArray(context.document.schedules).forEach((schedule, index) => {
        const pointer = context.joinPointer('schedules', index);

        if (!context.normalizeString(schedule && schedule.endpointName)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.schedule.endpoint.missing',
            message: `Schedule "${schedule && schedule.id ? schedule.id : index}" sollte endpointName definieren.`,
            pointer
          }));
        }
      });

      context.toArray(context.document.components).forEach((component, index) => {
        const hydration = component && component.hydration;
        const mode = hydration && context.normalizeString(hydration.mode);

        if (mode && !KNOWN_HYDRATION_POLICIES.has(mode)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.hydration.policy.unknown',
            message: `Component "${component && component.id ? component.id : index}" nutzt unbekannte Hydration Policy "${mode}".`,
            pointer: context.joinPointer('components', index, 'hydration', 'mode')
          }));
        }
      });

      context.toArray(context.document.templates).forEach((template, index) => {
        const hydration = template && template.hydration;
        const mode = hydration && context.normalizeString(hydration.mode);

        if (mode && !KNOWN_HYDRATION_POLICIES.has(mode)) {
          diagnostics.push(context.createDiagnostic({
            code: 'rmt.hydration.policy.unknown',
            message: `Template "${template && template.id ? template.id : index}" nutzt unbekannte Hydration Policy "${mode}".`,
            pointer: context.joinPointer('templates', index, 'hydration', 'mode')
          }));
        }
      });

      return diagnostics;
    }
  };
}

module.exports = {
  KNOWN_HYDRATION_POLICIES,
  createSchedulerPolicyRule
};
