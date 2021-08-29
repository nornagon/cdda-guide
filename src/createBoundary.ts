import { writable } from 'svelte/store';
const GUARDED_BLOCK_FNS = ['c', 'l', 'h', 'm', 'p', 'a', 'i', 'o', 'd'];

export function createBoundary(Component) {
  if (Component.$$render) {
    let render = Component.$$render;
    Component.$$render = (result, props, bindings, slots) => {
      const error = writable(undefined);

      try {
        return render(result, { error, ...props }, bindings, slots);
      } catch (e) {
        error.set(e);
        return render(result, { error, ...props }, bindings, {});
      }
    };

    return Component;
  }

  function guard(fn, onError) {
    return function guarded(...args) {
      try {
        return fn(...args);
      } catch (err) {
        onError(err);
      }
    };
  }

  return class ErrorBoundaryComponent extends Component {
    constructor(config) {
      const error = writable(undefined);

      config.props.$$slots.default = config.props.$$slots.default.map(
        (slot) => (...args) => {
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
