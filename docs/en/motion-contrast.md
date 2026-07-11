# Motion and Contrast

Respect reduced motion, contrast and non-color status cues.

## What it covers

Motion and contrast policies preserve operation under `prefers-reduced-motion` and `forced-colors`. State cannot depend on motion or color alone; focus, selection, busy, and error states need additional shape, text, or icon cues.

## Public building blocks

- `tests/a11y/motion_contrast_suite.js` verifies policy contracts.
- Component profiles declare reduced-motion and high-contrast behavior.
- Design tokens provide focus, surface, text, and status values.

## Recommended workflow

Run the shared policy gate:

```bash
node scripts/run_xtend_tests.js motion-contrast --json
```

Then inspect the relevant browser fixture under both media-query modes. Reduced motion simplifies transitions rather than removing state. Native controls, focus outlines, and non-color state markers remain visible under forced colors.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
