# RMT AnimationEngine

RMT AnimationEngine keeps UI transitions beside the surfaces and actions that trigger them. Effects, duration, easing, interruption behavior and accessible fallbacks can therefore be checked at build time instead of emerging later from unrelated browser handlers.

## Prerequisites

Start with an RMT vNext source containing at least two surfaces and an action that moves between them. A shipped bundle must enable Maraca orchestration and transitions. The local compiler lives at `tools/rmt-language/vnext-compiler.js`; the browser runtime is provided by `xtendrmt/rmt-animation-engine-runtime.js`.

```bash
xt rmt lint app.rmt --json
xt rmt build app.rmt --bundle maraca --orchestration strict --transitions strict --out dist --json
```

The build should emit `xtend.rmt.animation-engine.v1` in its orchestration artifacts. At runtime, the engine reports `xtend.rmt.animation-engine-runtime.v1` and exposes methods including `runSurfaceTransitionPhase()`, `listActiveAnimations()` and `snapshot()`.

## Declare a transition

The following document connects one action to two surfaces. `animation docs.motion.detail` is the reusable preset, while `transition docs.motion.openDetail` attaches it to a specific state change. The host does not have to infer CSS classes or observe the action after the fact.

```rmt
template docs.motion.example {
  state docs.motion.list type object preserve {
    initial {
      id "list"
      hidden false
    }
  }

  state docs.motion.detail type object preserve {
    initial {
      id "detail"
      hidden true
    }
  }

  selector docs.motion.list from state docs.motion.list {
    output MotionSurface
  }

  selector docs.motion.detail from state docs.motion.detail {
    output MotionSurface
  }

  action docs.motion.openDetail {
    input source string
    reduce state.docs.motion.list.hidden = true
    reduce state.docs.motion.detail.hidden = false
    emit docs.motion.changed with surface "detail"
  }

  animation docs.motion.detail {
    effect slide-left
    durationMs 240
    easing "cubic-bezier(.2,.8,.2,1)"
    reducedMotion fade
  }

  transition docs.motion.openDetail {
    trigger action docs.motion.openDetail
    from surfaces [docs.motion.list]
    to surfaces [docs.motion.detail]
    use animation docs.motion.detail
    layoutKey "docs-motion-content"
    interrupt replace
    reducedMotion fade
    lane transition
  }

  portal docs.motion.root root "#app" layer surface

  surface docs.motion.list kind view component x-section {
    source selector docs.motion.list
    key list.id
    portal docs.motion.root
    lane visible weight 80 {
      mount docs-motion-list from selector docs.motion.list
    }
  }

  surface docs.motion.detail kind view component x-section {
    source selector docs.motion.detail
    key detail.id
    portal docs.motion.root
    lane visible weight 80 {
      mount docs-motion-detail from selector docs.motion.detail
    }
  }
}
```

The compiler resolves `use animation` and copies the effect, duration, easing and reduced-motion policy into the transition record. Explicit values in the `transition` block may override that preset for one route change. The transition lane keeps visible motion separate from data and background work.

## Effects and layout

The current catalog contains `fade`, `crossfade`, four slide directions, `scale`, `pop`, `zoom`, `flip`, `rotate`, `expand`, `collapse`, `fade-blur`, `shared-element`, `layout-flip` and `none`. For ordinary content, `fade`, `slide-left`, `slide-right` and `pop` are useful starting points. Long movement across large distances makes orientation harder and should not become the default navigation language.

Both `shared-element` and `layout-flip` require a stable `layoutKey`. Without it, the compiler cannot associate the two layout states and emits `rmt.animation.layout_key_missing`. `crossfade` lowers to overlapping enter and exit phases; other effects use serial phasing by default. A `timeline` can explicitly choose parallel or sequential execution.

When another action arrives during a transition, `interrupt` selects the outcome. `replace` follows the latest intent, `finish` waits for current motion, and `cancel` discards it. Navigation commonly benefits from `replace` because a quick second action does not remain queued behind an obsolete visual decision.

## Custom keyframes and spring sampling

A preset may declare custom enter or exit keyframes. The compiler accepts only `opacity` and `transform` by default, keeping the common path friendly to compositor execution. Spring values are sampled during the build, so the browser runtime does not have to solve the motion curve again.

```rmt
template docs.motion.popExample {
  animation docs.motion.pop {
    effect pop
    durationMs 240
    easing "cubic-bezier(.18,.9,.22,1)"
    keyframe enter {
      opacity 0
      transform "scale(.92)"
      offset 0
    }
    keyframe enter {
      opacity 1
      transform "scale(1)"
      offset 1
    }
    spring {
      stiffness 210
      damping 22
      mass 1
    }
    reducedMotion fade
  }
}
```

Filters remain excluded unless a preset opts in explicitly. `fade-blur` therefore requires `allowFilter true`. Keep this exception short: blurring a large article or table can cost considerably more than opacity and transform.

```rmt
template docs.motion.blurExample {
  animation docs.motion.blur {
    effect fade-blur
    durationMs 180
    easing "ease-out"
    allowFilter true
    keyframe enter {
      opacity 0
      filter "blur(6px)"
      offset 0
    }
    keyframe enter {
      opacity 1
      filter "blur(0px)"
      offset 1
    }
    reducedMotion fade
  }
}
```

## Reduced motion and runtime behavior

`reducedMotion fade` replaces the chosen effect with a fade no longer than 120 ms when the browser reports `prefers-reduced-motion: reduce`. Both `instant` and `none` reach the target state without visible movement. Production code should let the runtime read the real preference rather than replacing `matchMedia` globally.

The live demo above this article uses the same runtime and a precompiled plan. Its controls modify only a bounded preview copy of the AOT record. `System preference` follows the browser, while the three preview modes make each fallback observable through an injected test adapter. The demo changes no browser globals and performs no data fetch during replay.

AnimationEngine events such as `xtend-rmt:animation-start`, `xtend-rmt:animation-phase`, `xtend-rmt:animation-complete`, `xtend-rmt:animation-interrupt` and `xtend-rmt:animation-fallback` are suitable telemetry signals. Canonical state still belongs to RMT state and the surface runtime; events are observations, not a second state store.

## Expected result

After a successful build, the Maraca artifact contains an AnimationEngine plan with resolved presets, transition targets, scheduler records and reduced-motion policies. Triggering the action runs exit and enter motion, updates surface visibility and releases active animations. `snapshot()` reports active records, fallback counts, recent results and redacted diagnostics.

The complete product sample in `products/rmt-animation-testbench` adds SSR resume, XScaler preflight and several lazy surfaces. Run it with:

```bash
npm --prefix products/rmt-animation-testbench run build
npm --prefix products/rmt-animation-testbench run dev
```

The TestBench is then available at `http://127.0.0.1:9196/` by default.

## Troubleshooting

| Signal | Cause | Fix |
| --- | --- | --- |
| `rmt.animation.effect_unknown` | The effect is outside the compiler catalog. | Choose an effect listed on this page and compile again. |
| `rmt.animation.reference_missing` | `use animation` does not resolve to a known preset. | Compare the fully qualified animation and transition identifiers. |
| `rmt.animation.layout_key_missing` | `shared-element` or `layout-flip` has no `layoutKey`. | Add one stable key to the transition for both layout states. |
| `rmt.animation.filter_opt_in_missing` | `fade-blur` uses filters without explicit permission. | Set `allowFilter true` on the referenced animation preset. |
| `rmt.animation.interrupt_invalid` | The interruption policy is unknown. | Use `replace`, `finish` or `cancel`. |
| `rmt.animation.transition_reduced_motion_invalid` | The reduced-motion policy is invalid. | Use `fade`, `instant` or `none`. |
| `rmt.animation_engine.xutils_missing` | The runtime cannot find the local XUtils transition runner. | Load `components/xutils.js` locally before AnimationEngine; the engine remains on its instant fallback until then. |

See [Validation and Transitions](./rmt-reference-validation-transitions.md) for the complete syntax. The [RMT Authoring Guide](./rmt-vnext-authoring.md) places motion alongside state, actions and surfaces; [Motion and Contrast](./motion-contrast.md) covers the corresponding accessibility checks.
