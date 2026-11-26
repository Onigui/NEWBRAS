import { describe, expect, it } from "vitest";
import type { Jogador, Posicao } from "@newbras/data";
import { convocar, TAMANHO_DA_CONVOCACAO } from "./convocacao";

const jogador = (id: string, nacionalidade: string, posicao: Posicao, forca: number) =>
  ({ id, nome: id, nacionalidade, posicao, forca, base: false }) as unknown as Jogador;

describe("convocação", () => {
  it("leva os melhores da nacionalidade, com a quantidade de cada posição", () => {
    const jogadores: Jogador[] = [];
    for (const p of ["G", "Z", "L", "M", "A"] as const)
      for (let i = 0; i < 12; i++) jogadores.push(jogador(`bra-${p}${i}`, "BRA", p, 90 - i));
    jogadores.push(jogador("arg-craque", "ARG", "A", 99));
    const lista = convocar("BRA", jogadores);
    expect(lista).toHaveLength(TAMANHO_DA_CONVOCACAO);
    const conta = (p: Posicao) => lista.filter((j) => j.posicao === p).length;
    expect([conta("G"), conta("Z"), conta("L"), conta("M"), conta("A")]).toEqual([3, 5, 4, 8, 6]);
    expect(lista.map((j) => j.id)).not.toContain("arg-craque");
    expect(lista.find((j) => j.posicao === "G")?.id).toBe("bra-G0");
  });

  it("país com poucos jogadores no banco completa a lista com jogadores fracos", () => {
    const lista = convocar("LIE", [jogador("lie-1", "LIE", "M", 60)]);
    expect(lista).toHaveLength(TAMANHO_DA_CONVOCACAO);
    expect(lista[0]?.id).toBe("lie-1");
    expect(lista.filter((j) => j.id.startsWith("lie-convocado")).every((j) => j.forca === 40)).toBe(
      true,
    );
    expect(lista.some((j) => j.posicao === "G")).toBe(true);
  });
});
