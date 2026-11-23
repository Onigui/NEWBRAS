/**
 * Gerador de números pseudoaleatórios com semente (sfc32).
 *
 * Tudo que é sorteado no motor passa por aqui. Mesma semente = mesma partida,
 * o que permite testes reproduzíveis, replays e depuração de bugs.
 */

export type RngState = readonly [number, number, number, number];

/** Converte um texto ou número em uma semente de 32 bits (hash cyrb53 reduzido). */
export function seedFrom(input: string | number): number {
  const text = String(input);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  private spareNormal: number | null = null;

  constructor(seed: string | number) {
    const s = seedFrom(seed);
    this.a = 0x9e3779b9;
    this.b = 0x243f6a88;
    this.c = 0xb7e15162;
    this.d = s;
    // Aquece o gerador para espalhar a semente.
    for (let i = 0; i < 15; i++) this.nextUint32();
  }

  static fromState(state: RngState): Rng {
    const rng = new Rng(0);
    [rng.a, rng.b, rng.c, rng.d] = state;
    return rng;
  }

  /** Estado atual, para salvar o jogo e retomar exatamente do mesmo ponto. */
  getState(): RngState {
    return [this.a, this.b, this.c, this.d];
  }

  nextUint32(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    const t = (this.a + this.b + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) >>> 0;
    return t;
  }

  /** Número em [0, 1). */
  next(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Inteiro em [min, max], inclusive nas duas pontas. */
  int(min: number, max: number): number {
    if (max < min) throw new RangeError(`int(${min}, ${max}): max menor que min`);
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Número real em [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Verdadeiro com probabilidade p (0 a 1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Distribuição normal (Box-Muller). */
  normal(mean = 0, sd = 1): number {
    if (this.spareNormal !== null) {
      const v = this.spareNormal;
      this.spareNormal = null;
      return mean + v * sd;
    }
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    const mag = Math.sqrt(-2 * Math.log(u));
    this.spareNormal = mag * Math.sin(2 * Math.PI * v);
    return mean + mag * Math.cos(2 * Math.PI * v) * sd;
  }

  /** Um item da lista, com chance igual para todos. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError("pick() em lista vazia");
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Um item da lista, com chance proporcional ao peso. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    let total = 0;
    for (const item of items) total += Math.max(0, weight(item));
    if (total <= 0) return this.pick(items);
    let roll = this.next() * total;
    for (const item of items) {
      roll -= Math.max(0, weight(item));
      if (roll < 0) return item;
    }
    return items[items.length - 1] as T;
  }

  /** Cópia embaralhada da lista (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }

  /**
   * Novo gerador independente, derivado deste e de um rótulo.
   * Ex.: rng.fork("rodada-12") para cada rodada não afetar as outras.
   */
  fork(label: string): Rng {
    return new Rng(`${this.nextUint32()}:${label}`);
  }
}
