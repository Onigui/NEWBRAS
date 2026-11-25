import { describe, expect, it } from "vitest";
import { gerarAtributos } from "./atributos";
import {
  DADOS_FUNCAO,
  FUNCOES,
  FUNCOES_DA_POSICAO,
  melhorPapel,
  notaNoPapel,
  papeisPossiveis,
  papelValido,
  posicaoDaVaga,
  posicoesNaturais,
  POSICOES_CAMPO,
  type JogadorParaNota,
} from "./funcoes";
import type { Lado, Posicao } from "./football";

function jogador(
  posicao: Posicao,
  lado: Lado,
  forca: number,
  extra: Partial<JogadorParaNota> = {},
) {
  const atributos = gerarAtributos({ semente: `${posicao}${lado}${forca}`, posicao, forca });
  return { posicao, lado, forca, atributos, ...extra };
}

describe("posições e funções", () => {
  it("toda função pertence a uma posição e toda posição tem funções", () => {
    const usadas = new Set(POSICOES_CAMPO.flatMap((p) => FUNCOES_DA_POSICAO[p]));
    expect([...usadas].sort()).toEqual([...FUNCOES].sort());
    for (const f of FUNCOES) expect(Object.keys(DADOS_FUNCAO[f].pesos).length).toBeGreaterThan(2);
  });

  it("o lugar da vaga vira posição de campo", () => {
    expect(posicaoDaVaga({ posicao: "G", lado: "C", x: 5, y: 34 })).toBe("GOL");
    expect(posicaoDaVaga({ posicao: "L", lado: "D", x: 30, y: 8 })).toBe("LD");
    expect(posicaoDaVaga({ posicao: "M", lado: "C", x: 40, y: 27 })).toBe("VOL");
    expect(posicaoDaVaga({ posicao: "M", lado: "C", x: 50, y: 34 })).toBe("MC");
    expect(posicaoDaVaga({ posicao: "M", lado: "C", x: 58, y: 34 })).toBe("MEI");
    expect(posicaoDaVaga({ posicao: "M", lado: "E", x: 50, y: 57 })).toBe("ME");
    expect(posicaoDaVaga({ posicao: "A", lado: "D", x: 70, y: 12 })).toBe("PD");
    expect(posicaoDaVaga({ posicao: "A", lado: "C", x: 64, y: 34 })).toBe("SA");
    expect(posicaoDaVaga({ posicao: "A", lado: "C", x: 74, y: 34 })).toBe("CA");
  });

  it("na vaga de centroavante dá para pedir falso 9 ou segundo atacante, mas não zagueiro", () => {
    const papeis = papeisPossiveis("CA");
    expect(papeis).toContainEqual({ posicao: "CA", funcao: "falso-9" });
    expect(papeis).toContainEqual({ posicao: "SA", funcao: "segundo-atacante" });
    expect(papelValido("CA", { posicao: "ZAG", funcao: "zagueiro" })).toBe(false);
  });

  it("a melhor função do jogador na posição dele dá a força; fora dela, bem menos", () => {
    const atacante = jogador("A", "C", 90);
    const naturais = posicoesNaturais(atacante);
    expect(naturais[0] && ["CA", "PD", "PE", "SA"]).toContain(naturais[0]);
    // A melhor função de ataque dá a força; a CPU às vezes fica com a padrão, até 3 abaixo.
    const melhor = Math.max(
      ...papeisPossiveis("CA")
        .concat(papeisPossiveis("PD"))
        .map((p) => notaNoPapel(atacante, p)),
    );
    expect(melhor).toBe(90);
    expect(notaNoPapel(atacante, melhorPapel(atacante, "CA"))).toBeGreaterThanOrEqual(87);
    const meia = notaNoPapel(atacante, { posicao: "MEI", funcao: "meia-armador" });
    expect(meia).toBeLessThanOrEqual(82);
    expect(meia).toBeGreaterThanOrEqual(68);
    expect(notaNoPapel(atacante, { posicao: "ZAG", funcao: "zagueiro" })).toBeLessThan(70);
    expect(notaNoPapel(atacante, { posicao: "GOL", funcao: "goleiro" })).toBeLessThan(35);
  });

  it("as posições reais do jogador contam: o ponta rende mais na ponta do que de centroavante", () => {
    const ponta = jogador("A", "D", 84, { posicoesCampo: ["PD"] });
    const naPonta = notaNoPapel(ponta, melhorPapel(ponta, "PD"));
    expect(naPonta).toBe(84);
    expect(notaNoPapel(ponta, melhorPapel(ponta, "CA"))).toBeLessThan(naPonta);
    // O lateral que também joga de zagueiro não perde nada lá.
    const coringa = jogador("L", "D", 85, { posicoesCampo: ["LD", "LE", "ZAG"] });
    const generico = jogador("L", "D", 85);
    expect(notaNoPapel(coringa, melhorPapel(coringa, "ZAG"))).toBeGreaterThan(
      notaNoPapel(generico, melhorPapel(generico, "ZAG")),
    );
  });

  it("lateral do lado trocado perde um pouco", () => {
    const direito = jogador("L", "D", 80);
    expect(notaNoPapel(direito, { posicao: "LE", funcao: "lateral" })).toBeLessThan(
      notaNoPapel(direito, { posicao: "LD", funcao: "lateral" }),
    );
  });
});
