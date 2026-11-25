import { describe, expect, it } from "vitest";
import {
  CARACTERISTICAS_GOLEIRO,
  CARACTERISTICAS_LINHA,
  NOME_CARACTERISTICA,
  POSICOES,
  caracteristicasDaPosicao,
} from "./football";

describe("vocabulário do futebol", () => {
  it("tem as 5 posições do Brasfoot", () => {
    expect(POSICOES).toEqual(["G", "L", "Z", "M", "A"]);
  });

  it("tem 5 atributos de goleiro e 12 de linha", () => {
    expect(CARACTERISTICAS_GOLEIRO).toHaveLength(5);
    expect(CARACTERISTICAS_LINHA).toHaveLength(12);
  });

  it("toda característica tem nome em português", () => {
    for (const c of [...CARACTERISTICAS_GOLEIRO, ...CARACTERISTICAS_LINHA]) {
      expect(NOME_CARACTERISTICA[c]).toBeTruthy();
    }
  });

  it("goleiro só usa características de goleiro", () => {
    expect(caracteristicasDaPosicao("G")).toBe(CARACTERISTICAS_GOLEIRO);
    expect(caracteristicasDaPosicao("A")).toBe(CARACTERISTICAS_LINHA);
  });
});
