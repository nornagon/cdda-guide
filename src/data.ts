import { readable } from 'svelte/store';

export const data = readable(null, function start(set) {
  (async () => {
    const res = await fetch(`/data.json`)
    if (!res.ok) {
      throw new Error(`Error ${res.status} (${res.statusText}) fetching data`)
    }
    console.log('here')
    set(await res.json());
  })();

	return function stop() {
	};
});