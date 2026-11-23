import { describe, expect, it } from "vitest";
import { Rng, seedFrom } from "./rng";

describe("Rng", () => {
  it("é determinístico: mesma semente, mesma sequência", () => {
    const a = new Rng("final-1998");
    const b = new Rng("final-1998");
    const seqA = Array.from({ length: 100 }, () => a.next());
    const seqB = Array.from({ length: 100 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("sementes diferentes geram sequências diferentes", () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it("retoma do estado salvo exatamente no mesmo ponto", () => {
    const rng = new Rng("save");
    for (let i = 0; i < 37; i++) rng.next();
    const copy = Rng.fromState(rng.getState());
    expect(Array.from({ length: 20 }, () => copy.next())).toEqual(
      Array.from({ length: 20 }, () => rng.next()),
    );
  });

  it("int respeita os limites e cobre todos os valores", () => {
    const rng = new Rng("dado");
    const seen = new Set<number>();
    for (let i = 0; i < 6000; i++) {
      const v = rng.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen.size).toBe(6);
  });

  it("next tem média perto de 0,5", () => {
    const rng = new Rng("media");
    let sum = 0;
    const n = 50_000;
    for (let i = 0; i < n; i++) sum += rng.next();
    expect(sum / n).toBeCloseTo(0.5, 2);
  });

  it("normal tem média e desvio próximos do pedido", () => {
    const rng = new Rng("normal");
    const n = 50_000;
    const xs = Array.from({ length: n }, () => rng.normal(10, 2));
    const mean = xs.reduce((s, x) => s + x, 0) / n;
    const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / n);
    expect(mean).toBeCloseTo(10, 1);
    expect(sd).toBeCloseTo(2, 1);
  });

  it("chance respeita a probabilidade", () => {
    const rng = new Rng("chance");
    let hits = 0;
    const n = 50_000;
    for (let i = 0; i < n; i++) if (rng.chance(0.3)) hits++;
    expect(hits / n).toBeCloseTo(0.3, 2);
  });

  it("weighted favorece pesos maiores", () => {
    const rng = new Rng("peso");
    const counts = { craque: 0, reserva: 0 };
    for (let i = 0; i < 10_000; i++) {
      const p = rng.weighted(["craque", "reserva"] as const, (x) => (x === "craque" ? 3 : 1));
      counts[p]++;
    }
    expect(counts.craque / 10_000).toBeCloseTo(0.75, 1);
  });

  it("shuffle mantém os mesmos itens", () => {
    const rng = new Rng("embaralha");
    const base = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(rng.shuffle(base).sort()).toEqual(base);
  });

  it("fork gera fluxos independentes e reproduzíveis", () => {
    const a = new Rng("temporada").fork("rodada-1");
    const b = new Rng("temporada").fork("rodada-1");
    expect(a.next()).toEqual(b.next());
  });

  it("seedFrom é estável", () => {
    expect(seedFrom("NewBras")).toBe(seedFrom("NewBras"));
    expect(seedFrom("NewBras")).not.toBe(seedFrom("newbras"));
  });
});
