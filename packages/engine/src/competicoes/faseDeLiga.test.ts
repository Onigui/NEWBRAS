import { describe, expect, it } from "vitest";
import { Rng } from "../rng";
import { potesSemCompatriotas, sortearFaseDeLiga } from "./faseDeLiga";

const PAISES = ["ENG", "ESP", "ITA", "GER", "FRA", "POR", "NED", "BEL", "TUR", "SCO", "AUT", "SUI"];

function conferir(n: number, potes: number, jogos: number, semente: string) {
  const times = Array.from({ length: n }, (_, i) => `t${i}`);
  // Cinco ingleses, cinco espanhóis... para o sorteio ter de evitar compatriotas.
  const paises = Object.fromEntries(times.map((t, i) => [t, PAISES[i % PAISES.length]!]));
  const r = sortearFaseDeLiga(times, potes, jogos, new Rng(semente), paises);
  expect(r).not.toBeNull();
  const s = n / potes;
  const pote = (t: string) => Math.floor(times.indexOf(t) / s);
  for (const t of times) {
    const deles = r!.filter((j) => j.casa === t || j.fora === t);
    const adv = deles.map((j) => (j.casa === t ? j.fora : j.casa));
    expect(deles).toHaveLength(jogos);
    expect(new Set(adv).size).toBe(jogos);
    // Mesmo número de adversários de cada pote.
    for (let p = 0; p < potes; p++)
      expect(adv.filter((a) => pote(a) === p)).toHaveLength(jogos / potes);
    // Metade em casa, uma partida por rodada, sem compatriota e no máximo 2 do mesmo país.
    expect(deles.filter((j) => j.casa === t)).toHaveLength(jogos / 2);
    expect(new Set(deles.map((j) => j.rodada)).size).toBe(jogos);
    expect(adv.some((a) => paises[a] === paises[t])).toBe(false);
    const porPais = new Map<string, number>();
    for (const a of adv) porPais.set(paises[a]!, (porPais.get(paises[a]!) ?? 0) + 1);
    expect(Math.max(...porPais.values())).toBeLessThanOrEqual(2);
  }
}

describe("fase de liga da UEFA", () => {
  it("Champions e Europa League: 36 times, 4 potes, 8 jogos", () => {
    for (const semente of ["a", "b", "c"]) conferir(36, 4, 8, semente);
  });
  it("Conference League: 36 times, 6 potes, 6 jogos", () => {
    for (const semente of ["a", "b"]) conferir(36, 6, 6, semente);
  });
  it("formato que não fecha devolve nulo (o motor usa o sorteio simples)", () => {
    expect(sortearFaseDeLiga(["a", "b", "c"], 4, 8, new Rng("x"))).toBeNull();
  });
  it("liga regional da Ásia: potes sem compatriotas e sem jogo entre clubes do mesmo país", () => {
    // 16 do Oeste, com 5 sauditas entre os mais fortes (sem ajuste, o pote 1 seria todo saudita).
    const lista = ["KSA", "KSA", "KSA", "KSA", "KSA", "UAE", "UAE", "UAE", "QAT", "QAT", "QAT"]
      .concat(["IRN", "IRN", "UZB", "IRQ", "JOR"])
      .map((p, i) => [`w${i}`, p] as const);
    const paises = Object.fromEntries(lista);
    const times = potesSemCompatriotas(
      lista.map(([t]) => t),
      4,
      paises,
    );
    // Cinco sauditas em quatro potes: só um pote repete país, e nunca o primeiro.
    const repetidos = [0, 1, 2, 3].filter(
      (p) => new Set(times.slice(p * 4, p * 4 + 4).map((t) => paises[t])).size < 4,
    );
    expect(repetidos.length).toBeLessThanOrEqual(1);
    expect(repetidos).not.toContain(0);
    for (const semente of ["a", "b", "c", "d"]) {
      const jogos = sortearFaseDeLiga(times, 4, 8, new Rng(semente), paises, 8);
      expect(jogos).not.toBeNull();
      for (const j of jogos!) expect(paises[j.casa]).not.toBe(paises[j.fora]);
    }
  });
});
