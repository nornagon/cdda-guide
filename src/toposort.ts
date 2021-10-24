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
