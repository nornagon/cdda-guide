export function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

export function multimap<K, V>(entries: [K, V][]): Map<K, V[]> {
  let ret = new Map();
  for (const [k, v] of entries) {
    const list = ret.get(k) ?? [];
    list.push(v);
    ret.set(k, list);
  }
  return ret;
}
