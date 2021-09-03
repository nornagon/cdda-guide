export function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

export class Maybe<T> {
  private readonly value: T | undefined;
  constructor(value: T | undefined) {
    this.value = value;
  }
  getOrDefault(default_: T): T {
    return this.value ?? default_;
  }
  map<X>(f: (value: T) => X): Maybe<X> {
    throw "not implemented";
  }
}
