import { writable } from "svelte/store";
const GUARDED_BLOCK_FNS = ["c", "l", "h", "m", "p", "a", "i", "o", "d"];

export function createBoundary(Component: any) {
  if (Component.$$render) {
    let render = Component.$$render;
    Component.$$render = (
      result: any,
      props: any,
      bindings: any,
      slots: any
    ) => {
      const error = writable(undefined as any);

      try {
        return render(result, { error, ...props }, bindings, slots);
      } catch (e) {
        error.set(e);
        return render(result, { error, ...props }, bindings, {});
      }
    };

    return Component;
  }

  function guard(fn: Function, onError: (err: any) => void) {
    return function guarded(...args: any[]) {
      try {
        return fn(...args);
      } catch (err: any) {
        onError(err);
      }
    };
  }

  return class ErrorBoundaryComponent extends Component {
    constructor(config: any) {
      const error = writable(undefined);

      config.props.$$slots.default = config.props.$$slots.default.map(
        (slot: any) =>
          (...args: any[]) => {
            let guarded = guard(slot, error.set);
            let block = guarded(...args);

            if (block) {
              for (let fn of GUARDED_BLOCK_FNS) {
                if (block[fn]) block[fn] = guard(block[fn], error.set);
              }
            }

            return block;
          }
      );

      super(config);

      this.$$set({ error });
    }
  };
}
