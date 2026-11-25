import { describe, expect, it } from "vitest";
import {
  atributosDaPosicao,
  caracteristicasDosAtributos,
  escalarAtributos,
  forcaDosAtributos,
  gerarAtributos,
  PESOS,
  type Atributo,
} from "./atributos";
import { POSICOES } from "./football";
import { Jogador } from "./schemas/jogador";

const base = {
  id: "bra-teste",
  nome: "Teste",
  nascimento: "2000-01-01",
  nacionalidade: "BRA",
  posicao: "A",
  lado: "C",
  forca: 80,
  potencial: 85,
  caracteristicas: ["velocidade", "finalizacao"],
  estrela: false,
};

describe("atributos", () => {
  it("cada posição tem seus atributos e pesos só deles", () => {
    expect(atributosDaPosicao("G")).toHaveLength(5);
    expect(atributosDaPosicao("Z")).toHaveLength(12);
    for (const p of POSICOES)
      for (const a of Object.keys(PESOS[p])) expect(atributosDaPosicao(p)).toContain(a);
  });

  it("gera perfis com a força exata e as características pedidas", () => {
    let total = 0;
    let forcaCerta = 0;
    let caracteristicasCertas = 0;
    for (const posicao of POSICOES) {
      const lista = atributosDaPosicao(posicao);
      for (let forca = 20; forca <= 95; forca += 3) {
        for (let k = 0; k < lista.length; k++) {
          const c1 = lista[k] as Atributo;
          const c2 = lista[(k + 3) % lista.length] as Atributo;
          const caracteristicas = k % 7 === 0 ? [c1] : [c1, c2];
          const atr = gerarAtributos({
            semente: `j${forca}-${k}`,
            posicao,
            forca,
            caracteristicas,
          });
          total++;
          if (forcaDosAtributos(posicao, atr) === forca) forcaCerta++;
          const derivadas = caracteristicasDosAtributos(posicao, atr);
          if ([...derivadas].sort().join() === [...caracteristicas].sort().join())
            caracteristicasCertas++;
          for (const a of lista) expect(atr[a]).toBeGreaterThanOrEqual(1);
        }
      }
    }
    expect(forcaCerta / total).toBeGreaterThan(0.99);
    expect(caracteristicasCertas / total).toBeGreaterThan(0.97);
  });

  it("é determinístico", () => {
    const p = {
      semente: "x",
      posicao: "M" as const,
      forca: 70,
      caracteristicas: ["passe" as const],
    };
    expect(gerarAtributos(p)).toEqual(gerarAtributos(p));
  });

  it("destaques viram os atributos mais altos e descem com a força de hoje", () => {
    const atr = gerarAtributos({
      semente: "bale",
      posicao: "A",
      forca: 90,
      caracteristicas: ["velocidade", "finalizacao"],
      destaques: { velocidade: 99 },
    });
    expect(atr.velocidade).toBe(99);
    expect(caracteristicasDosAtributos("A", atr)[0]).toBe("velocidade");
    const garoto = gerarAtributos({
      semente: "bale",
      posicao: "A",
      forca: 45,
      forcaAuge: 90,
      destaques: { velocidade: 99 },
    });
    expect(forcaDosAtributos("A", garoto)).toBe(45);
    expect(caracteristicasDosAtributos("A", garoto)[0]).toBe("velocidade");
  });

  it("escalar muda a força e mantém o perfil", () => {
    const atr = gerarAtributos({
      semente: "z",
      posicao: "Z",
      forca: 60,
      caracteristicas: ["cabeceio"],
    });
    const maior = escalarAtributos("Z", atr, 80);
    expect(forcaDosAtributos("Z", maior)).toBe(80);
    expect(caracteristicasDosAtributos("Z", maior)[0]).toBe("cabeceio");
  });
});

describe("jogador com atributos", () => {
  it("sem atributos, gera um perfil coerente com a força", () => {
    const j = Jogador.parse(base);
    expect(j.forca).toBe(80);
    expect(Object.keys(j.atributos)).toHaveLength(12);
    expect(j.caracteristicas).toEqual(["velocidade", "finalizacao"]);
  });

  it("com atributos, a força e as características saem deles", () => {
    const atributos = Object.fromEntries(atributosDaPosicao("A").map((a) => [a, 50]));
    const j = Jogador.parse({ ...base, atributos: { ...atributos, chuteLonge: 95, drible: 90 } });
    expect(j.forca).toBe(forcaDosAtributos("A", j.atributos));
    expect(j.caracteristicas).toEqual(["chuteLonge", "drible"]);
    expect(j.potencial).toBeGreaterThanOrEqual(j.forca);
  });

  it("validar de novo não muda nada", () => {
    const uma = Jogador.parse(base);
    expect(Jogador.parse(uma)).toEqual(uma);
  });

  it("acusa atributo faltando", () => {
    const r = Jogador.safeParse({ ...base, atributos: { velocidade: 90 } });
    expect(r.success).toBe(false);
  });

  it("goleiro tem os atributos de goleiro", () => {
    const j = Jogador.parse({ ...base, posicao: "G", caracteristicas: ["reflexo"] });
    expect(Object.keys(j.atributos).sort()).toEqual([
      "colocacao",
      "penalti",
      "reflexo",
      "reposicao",
      "saida",
    ]);
    expect(j.caracteristicas[0]).toBe("reflexo");
  });
});
