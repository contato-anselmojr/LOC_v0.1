export class RNG {
  private seed: number;
  constructor(seed = 123456789) {
    this.seed = seed >>> 0;
  }
  next(): number {
    // xorshift32 simples
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return (this.seed % 1_000_000) / 1_000_000;
  }
  pick<T>(arr: readonly T[]): T {
    const i = Math.floor(this.next() * arr.length);
    return arr[i]!;
  }
}
