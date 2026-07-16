export const WORKBENCH_VISUAL_GATE_SCHEMA = 'xtend.material.workbench-visual-gate.v1';

export function evaluateWorkbenchVisualContract(root = document.getElementById('xtend-material-workbench')) {
  const dialog = document.getElementById('review-dialog');
  const primary = root ? root.querySelector('main[data-xtm-slot="primary"]') : null;
  const style = root ? getComputedStyle(root) : null;
  const viewportWidth = document.documentElement.clientWidth;
  const primaryWidth = primary ? primary.getBoundingClientRect().width : 0;
  const horizontalOverflow = Math.max(0, document.documentElement.scrollWidth - viewportWidth);
  const devApiAbsent = !Object.prototype.hasOwnProperty.call(globalThis, '__XTEND_DEV_API__');
  const result = Object.freeze({
    schema: WORKBENCH_VISUAL_GATE_SCHEMA,
    ok: Boolean(root && style && dialog && !dialog.open
      && style.colorScheme === 'light'
      && style.backgroundColor === 'rgb(244, 247, 251)'
      && primaryWidth >= Math.min(320, viewportWidth * 0.7)
      && horizontalOverflow === 0
      && devApiAbsent),
    theme: document.documentElement.dataset.theme || '',
    colorScheme: style ? style.colorScheme : '',
    backgroundColor: style ? style.backgroundColor : '',
    dialogInitiallyClosed: Boolean(dialog && !dialog.open),
    viewportWidth,
    primaryWidth,
    horizontalOverflow,
    devApiAbsent
  });
  if (root) root.dataset.xtmVisualReady = String(result.ok);
  if (root) root.dataset.xtmDevApiBoundary = devApiAbsent ? 'projection-uninstrumented' : 'invalid-projection-api';
  const output = document.getElementById('xtm-browser-status');
  if (output) output.value = `${result.ok ? 'Visual gate passed' : 'Visual gate failed'}; viewport=${viewportWidth}; primary=${Math.round(primaryWidth)}; overflow=${horizontalOverflow}`;
  return result;
}

const visualResult = evaluateWorkbenchVisualContract();
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__XTEND_MATERIAL_VISUAL_GATE__', {
    configurable: true,
    enumerable: false,
    value: visualResult
  });
}
