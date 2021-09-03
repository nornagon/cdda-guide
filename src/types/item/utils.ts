export function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

export class Maybe<T> {
  constructor(value: T) {
  }
  getOrDefault() {
    return 123;
  }
  map<X>(f: T => X): Maybe<X> {
    throw "not implemented";
  }
}
