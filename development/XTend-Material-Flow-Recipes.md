# XTend Material Flow Recipes

Status: XTM-08 contract, local-first and pre-release.

The flow layer composes existing XTend components. It owns layout, spacing and responsive visual composition only. Validation, error, busy, disabled and success behavior remains owned by RMT and the selected components.

## Form to confirmation

```rmt
validation material.flow.requiredFields {
  mode blocking
  target action material.flow.review
  field material.flow.name required message "Enter your full name."
  field material.flow.email required email message "Enter a valid email address."
}

surface material.flow.form kind window component x-form {
  source selector material.flow.form
  lane visible { hydrate material-form-flow from selector material.flow.form }
}

surface material.flow.confirmation kind modal component x-dialog {
  source selector material.flow.confirmation
  lane transition { hydrate material-confirmation-flow from selector material.flow.confirmation }
}
```

The selectors provide the semantic classes `xtm-form-flow` and `xtm-confirmation-flow`. Product RMT must not author Tailwind utilities directly.

## Dashboard and content

```rmt
surface material.flow.dashboard kind content component x-cards {
  source selector material.flow.dashboard
  lane visible { hydrate material-dashboard from selector material.flow.dashboard }
}

surface material.flow.content kind content component x-summary {
  source selector material.flow.content
  lane visible { hydrate material-content-page from selector material.flow.content }
}
```

`material.dashboard` provides a responsive card composition, not a DataGrid. `material.content-page` preserves article-first reading order when its aside collapses below the body.

## Explicit non-claims

- No `data-grid` parity.
- No `autocomplete` parity.
- No `command-palette` parity.
- Color is never the only validation or status signal.
- Recipes do not access component shadow roots or redefine component behavior.
