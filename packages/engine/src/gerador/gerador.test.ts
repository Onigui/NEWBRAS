import { Jogador, elencoValido } from "@newbras/data";
import { describe, expect, it } from "vitest";
import { forcaEsperada, fracaoDoPotencial, idadeEm } from "../evolucao";
import { Rng } from "../rng";
import { gerarElenco } from "./elenco";
import { gerarJogador } from "./jogador";
import { gerarNome, gruposDeNomes } from "./nomes";

const HOJE = "2026-07-01";

describe("curva de evolução", () => {
  it("cresce até o auge, fica estável e depois cai", () => {
    expect(fracaoDoPotencial(18, "A")).toBeLessThan(fracaoDoPotencial(23, "A"));
    expect(fracaoDoPotencial(23, "A")).toBeLessThan(fracaoDoPotencial(27, "A"));
    expect(fracaoDoPotencial(27, "A")).toBe(1);
    expect(fracaoDoPotencial(31, "A")).toBe(1);
    expect(fracaoDoPotencial(33, "A")).toBeLessThan(1);
    expect(fracaoDoPotencial(35, "A")).toBeLessThan(fracaoDoPotencial(33, "A"));
  });

  it("o declínio acelera com a idade", () => {
    const queda = (i: number) => fracaoDoPotencial(i, "M") - fracaoDoPotencial(i + 1, "M");
    expect(queda(34)).toBeGreaterThan(queda(32));
  });

  it("goleiros amadurecem e declinam mais tarde", () => {
    expect(fracaoDoPotencial(25, "G")).toBeLessThan(fracaoDoPotencial(25, "A"));
    expect(fracaoDoPotencial(33, "G")).toBe(1);
  });

  it("um renascido de 17 anos com potencial 92 começa bem abaixo e chega ao auge", () => {
    expect(forcaEsperada(92, 17, "A")).toBeLessThan(60);
    expect(forcaEsperada(92, 28, "A")).toBe(92);
  });

  it("calcula a idade considerando o aniversário", () => {
    expect(idadeEm("2000-07-02", "2026-07-01")).toBe(25);
    expect(idadeEm("2000-07-01", "2026-07-01")).toBe(26);
  });
});

describe("gerarNome", () => {
  it("gera nomes para todos os grupos e usa o padrão para grupo desconhecido", () => {
    const rng = new Rng("nomes");
    for (const g of [...gruposDeNomes(), "xx"]) {
      const { nome, nomeCompleto } = gerarNome(rng, g);
      expect(nome.length).toBeGreaterThan(1);
      expect(nomeCompleto.split(" ").length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("gerarJogador", () => {
  it("gera jogadores sempre válidos pelo esquema, em todas as posições", () => {
    const rng = new Rng("validos");
    for (let i = 0; i < 500; i++) {
      const j = gerarJogador(rng, {
        id: `j-${i}`,
        nacionalidade: "BRA",
        grupoNomes: "pt-br",
        posicao: rng.pick(["G", "L", "Z", "M", "A"] as const),
        nivel: rng.int(1, 99),
        hoje: HOJE,
        clube: "bra-clube",
      });
      expect(Jogador.safeParse(j).success, JSON.stringify(j)).toBe(true);
    }
  });

  it("a idade do nascimento bate com a idade pedida", () => {
    const rng = new Rng("idade");
    for (let idade = 17; idade <= 37; idade++) {
      const j = gerarJogador(rng, {
        id: "x",
        nacionalidade: "ENG",
        grupoNomes: "en",
        posicao: "Z",
        nivel: 60,
        hoje: HOJE,
        idade,
      });
      expect(idadeEm(j.nascimento, HOJE)).toBe(idade);
    }
  });

  it("é determinístico com a mesma semente", () => {
    const opcoes = {
      id: "x",
      nacionalidade: "ESP",
      grupoNomes: "es",
      posicao: "M" as const,
      nivel: 70,
      hoje: HOJE,
    };
    expect(gerarJogador(new Rng("s"), opcoes)).toEqual(gerarJogador(new Rng("s"), opcoes));
  });
});

describe("gerarElenco", () => {
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const titulares = (elenco: ReturnType<typeof gerarElenco>) =>
    elenco.filter((j) => (j.numero ?? 99) <= 11).map((j) => j.forca);

  it("gera 25 jogadores, elenco válido, sem ids nem camisas repetidas", () => {
    const elenco = gerarElenco(
      new Rng("elenco"),
      { id: "bra-teste", nivel: 70 },
      { nacionalidade: "BRA", grupoNomes: "pt-br", hoje: HOJE },
    );
    expect(elenco).toHaveLength(25);
    expect(elencoValido(elenco)).toBe(true);
    expect(new Set(elenco.map((j) => j.id)).size).toBe(25);
    expect(new Set(elenco.map((j) => j.numero)).size).toBe(25);
    expect(elenco.filter((j) => j.posicao === "G")).toHaveLength(3);
    expect(
      elenco
        .filter((j) => j.posicao === "L")
        .map((j) => j.lado)
        .sort(),
    ).toEqual(["D", "D", "E", "E"]);
  });

  it("clube mais forte gera titulares mais fortes", () => {
    const rng = new Rng("niveis");
    const forte: number[] = [];
    const fraco: number[] = [];
    for (let i = 0; i < 20; i++) {
      forte.push(
        ...titulares(
          gerarElenco(
            rng,
            { id: "f", nivel: 85 },
            { nacionalidade: "BRA", grupoNomes: "pt-br", hoje: HOJE },
          ),
        ),
      );
      fraco.push(
        ...titulares(
          gerarElenco(
            rng,
            { id: "w", nivel: 45 },
            { nacionalidade: "BRA", grupoNomes: "pt-br", hoje: HOJE },
          ),
        ),
      );
    }
    expect(media(forte)).toBeGreaterThan(media(fraco) + 25);
    expect(Math.abs(media(forte) - 85)).toBeLessThan(8);
  });

  it("inclui estrangeiros quando pedido", () => {
    const rng = new Rng("estrangeiros");
    const elenco = gerarElenco(
      rng,
      { id: "ksa-x", nivel: 72 },
      {
        nacionalidade: "KSA",
        grupoNomes: "ar",
        hoje: HOJE,
        estrangeiros: [{ nacionalidade: "BRA", grupoNomes: "pt-br" }],
        fracaoEstrangeiros: 0.3,
      },
    );
    const brasileiros = elenco.filter((j) => j.nacionalidade === "BRA").length;
    expect(brasileiros).toBeGreaterThan(0);
    expect(brasileiros).toBeLessThan(25);
  });
});
