import { describe, expect, it } from "vitest";
import type { Carreira } from "@newbras/engine";
import { avisosDasAbas } from "./avisosDasAbas";

const mundo = {
  clube: () => ({ pais: "BRA" }) as never,
  competicao: () => ({ escopo: { tipo: "pais", pais: "BRA" } }) as never,
};
const carreira = (extra: Partial<Carreira>): Carreira =>
  ({ inicio: "2026-07-01", data: "2026-08-10", clube: "x", noticias: [], ...extra }) as Carreira;
const relatorio = (data: string) => ({ id: data, data }) as never;

describe("avisos nas abas", () => {
  it("o relatório novo do olheiro avisa na Base até o técnico abrir a aba", () => {
    const base = { jogadores: [], olheiros: [], relatorios: [relatorio("2026-08-05")] };
    expect(avisosDasAbas(carreira({ base }), mundo, { escalacao: 0, selecao: 0 }).base).toEqual({
      n: 1,
      urgente: false,
    });
    const visto = carreira({ base, vistas: { base: "2026-08-06" } });
    expect(avisosDasAbas(visto, mundo, { escalacao: 0, selecao: 0 }).base).toBeUndefined();
  });

  it("o que espera uma ação é urgente e fica até ser resolvido", () => {
    const c = carreira({ propostas: [{} as never], vistas: { mercado: "2026-08-10" } });
    const r = avisosDasAbas(c, mundo, { escalacao: 2, selecao: 0 });
    expect(r.mercado).toEqual({ n: 1, urgente: true });
    expect(r.escalacao).toEqual({ n: 2, urgente: true });
    expect(r.jogos).toBeUndefined();
  });
});
