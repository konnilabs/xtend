export function runNativeUsingProbe(record) {
  {
    using resource = {
      [Symbol.dispose]() {
        record('using-dispose');
      }
    };
    record('using-body');
  }
  return true;
}

export async function runNativeAwaitUsingProbe(record) {
  {
    await using resource = {
      async [Symbol.asyncDispose]() {
        record('await-using-dispose');
      }
    };
    record('await-using-body');
  }
  return true;
}
