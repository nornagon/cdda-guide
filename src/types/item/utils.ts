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

export function groupBy<T>(things: T[], groupsFor: (x: T) => string[]) {
  const map = new Map<string, T[]>();
  for (const thing of things) {
    const groups = groupsFor(thing);
    for (const group of groups) {
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(thing);
    }
  }
  return map;
}

export function uniq<T>(things: T[], id: (a: T) => any = (a) => a): T[] {
  const seen = new Set();
  const result = [];
  for (const thing of things) {
    const thingId = id(thing);
    if (!seen.has(thingId)) result.push(thing);
    seen.add(thingId);
  }
  return result;
}
