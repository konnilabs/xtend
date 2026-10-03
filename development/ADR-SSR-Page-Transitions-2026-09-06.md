# SSR page transitions through a host callback

Status: accepted for the Node/PHP page integration.

The approved SSR plan requires optional transitions with reduced-motion support.
The September browser review (ADR-NFM-BPR-011-2026-09-03) rejected general adoption
of same- and cross-document View Transitions. Its decision and negative product-usage
gate remain unchanged.

The common page client therefore accepts an optional `transition(update)` host port.
A visit must opt in, and reduced motion bypasses the port. Without it, the regular
commit runs. The common runtime neither detects nor invokes the native browser API.
Application hosts may bind the port to a native same-document transition, with their
own capability fallback. Cross-document transitions receive no integration.

The shared Node and Laravel browser fixtures exercise an explicit native host binding.
Controlled tests cover a missing port and reduced motion, including exactly one commit.
This is a host integration contract, not a change to the Observatory adoption inventory.
