import { describe, expect, it } from "vitest";
import { RESERVAS_AMISTOSO, reservasDaCompeticao } from "./reservas";

const liga = (pais: string, divisao = 1) =>
  ({
    id: `${pais}-liga`,
    categoria: "clubes",
    tipo: "liga",
    escopo: { tipo: "pais", pais },
    divisao,
  }) as const;

describe("banco de reservas por competição", () => {
  it("segue a regra de cada liga e confederação", () => {
    expect(reservasDaCompeticao(liga("ENG"))).toBe(9);
    expect(reservasDaCompeticao(liga("ESP"))).toBe(12);
    expect(reservasDaCompeticao(liga("ITA"))).toBe(15);
    expect(reservasDaCompeticao(liga("FRA", 2))).toBe(7);
    expect(reservasDaCompeticao(liga("BRA"))).toBe(12);
    expect(reservasDaCompeticao(liga("XYZ"))).toBe(9);
    expect(
      reservasDaCompeticao({
        id: "uefa-champions-league",
        categoria: "clubes",
        tipo: "copa",
        escopo: { tipo: "confederacao", confederacao: "UEFA" },
      }),
    ).toBe(12);
    const mundial = { categoria: "selecoes", tipo: "copa", escopo: { tipo: "mundial" } } as const;
    expect(reservasDaCompeticao({ ...mundial, id: "fifa-copa-do-mundo" })).toBe(15);
    expect(reservasDaCompeticao({ ...mundial, id: "conmebol-eliminatorias-copa" })).toBe(12);
    expect(reservasDaCompeticao(undefined)).toBe(RESERVAS_AMISTOSO);
    expect(reservasDaCompeticao({ ...liga("ENG"), reservas: 7 })).toBe(7);
  });
});
