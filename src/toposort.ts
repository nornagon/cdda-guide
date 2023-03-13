export function topologicalSort<T>(xs: T[], outgoingEdges: (n: T) => T[]) {
  const result: T[] = [];
  let isDag = true;
  const unmarked = new Set(xs);
  const tempMarks = new Set();
  while (unmarked.size) {
    const n = unmarked.values().next().value as T;
    visit(n);
    if (!isDag) {
      throw new Error("Not a DAG");
    }
  }
  return result;

  function visit(n: T) {
    if (!unmarked.has(n)) return;
    if (tempMarks.has(n)) {
      isDag = false;
      return;
    }
    tempMarks.add(n);
    for (const m of outgoingEdges(n)) {
      visit(m);
    }
    tempMarks.delete(n);
    unmarked.delete(n);
    result.push(n);
  }
}

// Split the graph into connected components, and topologically sort each
// component separately, grouping by rank.
export function topologicalSortComponentsByRank<T>(
  xs: T[],
  outgoingEdges: (n: T) => T[]
): T[][][] {
  return connectedComponents(xs, outgoingEdges).map((cc) =>
    topologicalSortByRank(cc, outgoingEdges)
  );
}

// Topological sort, but group nodes by rank, where rank is the number of
// edges from a node to a node with a higher rank.
function topologicalSortByRank<T>(
  xs: T[],
  outgoingEdges: (n: T) => T[]
): T[][] {
  const ranks = new Map<T, number>();
  const rank = (x: T) => {
    if (ranks.has(x)) return ranks.get(x);
    const r = Math.max(0, ...outgoingEdges(x).map(rank)) + 1;
    ranks.set(x, r);
    return r;
  };
  xs.forEach((x) => rank(x));
  const byRank: T[][] = [];
  const topoSorted = topologicalSort(xs, outgoingEdges);
  for (const x of topoSorted) {
    const r = ranks.get(x)!;
    if (!byRank[r]) byRank[r] = [];
    byRank[r].push(x);
  }
  return byRank.filter((x) => x);
}

function filteredOutgoingEdges<T>(
  xs: T[],
  outgoingEdgesFn: (n: T) => T[]
): (n: T) => T[] {
  return (n: T) => outgoingEdgesFn(n).filter((x) => xs.includes(x));
}
function undirectedEdges<T>(
  xs: T[],
  outgoingEdgesFn: (n: T) => T[]
): (n: T) => T[] {
  const outgoingEdges = filteredOutgoingEdges(xs, outgoingEdgesFn);
  const edges = new Map<T, Set<T>>();
  const addEdge = (a: T, b: T) => {
    if (!edges.has(a)) edges.set(a, new Set());
    edges.get(a)!.add(b);
    if (!edges.has(b)) edges.set(b, new Set());
    edges.get(b)!.add(a);
  };
  for (const a of xs) {
    for (const b of outgoingEdges(a)) addEdge(a, b);
  }
  return (n: T) => [...(edges.get(n) ?? [])];
}

function connectedComponents<T>(xs: T[], outgoingEdgesFn: (n: T) => T[]) {
  const undirectedEdgesFn = undirectedEdges(xs, outgoingEdgesFn);

  const ccs: T[][] = [];
  const ns = new Set(xs);
  while (ns.size) {
    const n = ns.values().next().value as T;
    ns.delete(n);
    const cc: T[] = [];
    const q = [n];
    while (q.length) {
      const x = q.shift()!;
      if (cc.includes(x)) continue;
      cc.push(x);
      ns.delete(x);
      q.push(...undirectedEdgesFn(x));
    }
    ccs.push(cc);
  }
  return ccs;
}
