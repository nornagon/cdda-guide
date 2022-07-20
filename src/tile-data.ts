import { writable } from "svelte/store";

const fetchJson = async (url: string) => {
  const res = await fetch(`${url}/tile_config.json`, {
    mode: "cors",
  });
  if (!res.ok)
    throw new Error(
      `Error ${res.status} (${res.statusText}) fetching tile data`
    );
  const json = await res.json();
  await Promise.all(
    json["tiles-new"].map(async (chunk: any) => {
      const blob = await fetch(`${url}/${chunk.file}`).then((b) => b.blob());
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.src = blobUrl;
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
      const nx =
        (img.width / (chunk.sprite_width ?? json.tile_info[0].width)) | 0;
      const ny =
        (img.height / (chunk.sprite_height ?? json.tile_info[0].height)) | 0;
      chunk.nx = nx;
      chunk.ny = ny;
    })
  );
  return json;
};

const { subscribe, set } = writable<any>(null);
export const tileData = {
  subscribe,
  setURL(url: string) {
    if (url) {
      fetchJson(url).then(
        (x) => {
          set({ ...x, baseUrl: url });
        },
        (err) => {
          console.error("Error fetching tiles", err);
        }
      );
    } else {
      set(null);
    }
  },
};
