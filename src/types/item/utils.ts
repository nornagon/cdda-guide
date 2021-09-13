export function showProbability(prob: number) {
  const ret = (prob * 100).toFixed(2);
  if (ret === "0.00") return "< 0.01%";
  return ret + "%";
}

// I could use purify instead if you are ok with adding a dependency
// see https://gigobyte.github.io/purify/adts/Maybe#static-fromNullable
export class Maybe<T> {
  private readonly value: T | undefined;
  constructor(value: T | undefined) {
    this.value = value;
  }
  getOrDefault(default_: T): T {
    return this.value ?? default_;
  }
  map<X>(f: (value: T) => X): Maybe<X> {
    if (this.value === undefined || this.value === null)
      return new Maybe(undefined);
    const value = f(this.value);
    return new Maybe(value);
  }
}
