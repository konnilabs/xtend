export const XTENSION_CONTRACT = {
  "schema": "xtend.xtensions.static-contract.v1",
  "id": "xtension.react.todo",
  "name": "React-like Todo XTension",
  "framework": "react",
  "version": "0.0.0-contract",
  "hostControllerSchema": "xtend.xtensions.host-controller.v1",
  "signalBridgeSchema": "xtend.xtensions.signal-bridge.v1",
  "kernelSignalSchema": "xtend.xtensions.kernel-signal.v1",
  "surfaceEventSchema": "xtend.xtensions.surface-event.v1",
  "accepts": [
    "props.update",
    "state.patch",
    "command.dispatch"
  ],
  "emits": [
    "xtension.react.todo.submitted.v1",
    "xtension.react.todo.changed.v1"
  ],
  "capabilities": [
    "host.lifecycle.mount",
    "host.lifecycle.unmount",
    "signal.downstream",
    "event.upstream"
  ]
};

throw new Error('static-introspection-module.mjs must never execute during XTN-04.');
