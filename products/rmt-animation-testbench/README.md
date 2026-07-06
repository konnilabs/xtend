# RMT AnimationEngine TestBench

Interactive product-local testbench for XTend RMT AnimationEngine surface motion. The app builds a Maraca bundle from `src/rmt/animation-testbench.rmt`, serves a server-prehydrated shell through the RMT Node SSR adapter and exercises live transition overrides in the browser.

## Commands

```sh
npm --prefix products/rmt-animation-testbench run build
npm --prefix products/rmt-animation-testbench run verify
npm --prefix products/rmt-animation-testbench run test:browser
npm --prefix products/rmt-animation-testbench run dev
```

Default server port is `9196`; override with `PORT=9200`.

## Scope

- Five content surfaces plus a sticky footer control surface.
- Effect, duration, easing, interrupt, reduced-motion and layout-key controls.
- Node SSR adapter hydration/resume payload.
- XScaler v1 protocol lazy preflight and ATC-shaped lazy surface responses.
- Browser smoke mode at `/?smoke=1` and reduced-motion smoke at `/?smoke=1&reduced=1`.
