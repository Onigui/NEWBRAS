import { describe, expect, it } from "vitest";
import { elencoExemplo } from "../exemplo.test-utils";
import { Clube } from "./clube";
import { Competicao } from "./competicao";
import { Jogador } from "./jogador";
import { Tecnico } from "./pessoas";

const jogadorBase = () => ({ ...elencoExemplo("bra-santos", "BRA")[5]! });

describe("Jogador", () => {
  it("aceita um jogador válido e preenche estrela = false", () => {
    const r = Jogador.parse(jogadorBase());
    expect(r.estrela).toBe(false);
  });

  it("recusa potencial menor que a força", () => {
    const r = Jogador.safeParse({ ...jogadorBase(), forca: 80, potencial: 70 });
    expect(r.success).toBe(false);
  });

  it("recusa característica de goleiro em jogador de linha", () => {
    const r = Jogador.safeParse({ ...jogadorBase(), posicao: "Z", caracteristicas: ["reflexo"] });
    expect(r.success).toBe(false);
  });

  it("recusa característica repetida e mais de duas", () => {
    expect(
      Jogador.safeParse({ ...jogadorBase(), caracteristicas: ["passe", "passe"] }).success,
    ).toBe(false);
    expect(
      Jogador.safeParse({ ...jogadorBase(), caracteristicas: ["passe", "drible", "velocidade"] })
        .success,
    ).toBe(false);
  });

  it("jogador livre não pode ter contrato", () => {
    const { clube: _c, ...livre } = jogadorBase();
    expect(Jogador.safeParse(livre).success).toBe(false);
    const { contrato: _ct, ...semContrato } = livre;
    expect(Jogador.safeParse(semContrato).success).toBe(true);
  });

  it("recusa força fora de 1 a 100", () => {
    expect(Jogador.safeParse({ ...jogadorBase(), forca: 0 }).success).toBe(false);
    expect(Jogador.safeParse({ ...jogadorBase(), forca: 101, potencial: 101 }).success).toBe(false);
  });
});

describe("Clube", () => {
  const clube = {
    id: "eng-arsenal",
    nome: "Arsenal",
    nomeCurto: "Arsenal",
    abreviacao: "ARS",
    pais: "ENG",
    cidade: "Londres",
    estadio: { nome: "Emirates Stadium", capacidade: 60_704 },
    cores: { primaria: "#EF0107", secundaria: "#FFFFFF" },
    reputacao: 5,
    nivel: 85,
  };

  it("aceita um clube válido", () => {
    expect(Clube.parse(clube).rivais).toEqual([]);
  });

  it("recusa id com maiúsculas e cor inválida", () => {
    expect(Clube.safeParse({ ...clube, id: "Arsenal" }).success).toBe(false);
    expect(
      Clube.safeParse({ ...clube, cores: { primaria: "vermelho", secundaria: "#FFFFFF" } }).success,
    ).toBe(false);
  });
});

describe("Competicao", () => {
  it("representa a fase de liga da Champions seguida de mata-mata", () => {
    const champions = Competicao.parse({
      id: "uefa-champions",
      nome: "UEFA Champions League",
      tipo: "continental",
      categoria: "clubes",
      escopo: { tipo: "confederacao", confederacao: "UEFA" },
      calendario: { inicio: "09-15", fim: "05-31" },
      participantes: {
        vagas: [{ de: "eng-premier", criterio: "posicoes", posicoes: [1, 2, 3, 4] }],
        quantidade: 36,
      },
      fases: [
        {
          id: "liga",
          nome: "Fase de liga",
          tipo: "fase-de-liga",
          jogosPorTime: 8,
          potes: 4,
          classificamDireto: 8,
          playoff: { de: 9, ate: 24 },
        },
        { id: "playoff", nome: "Playoff", tipo: "mata-mata", jogos: 2 },
        { id: "oitavas", nome: "Oitavas", tipo: "mata-mata", jogos: 2, finalJogoUnico: true },
      ],
    });
    expect(champions.fases).toHaveLength(3);
    expect(champions.pontos).toEqual({ vitoria: 3, empate: 1 });
  });

  it("liga precisa da divisão e fases não podem repetir id", () => {
    const base = {
      id: "x-liga",
      nome: "Liga",
      tipo: "liga",
      categoria: "clubes",
      escopo: { tipo: "mundial" },
      calendario: { inicio: "01-01", fim: "12-31" },
      participantes: { quantidade: 20 },
      fases: [{ id: "a", nome: "A", tipo: "grupos", grupos: 1, turnos: 2 }],
    };
    expect(Competicao.safeParse(base).success).toBe(false);
    expect(Competicao.safeParse({ ...base, divisao: 1 }).success).toBe(true);
    expect(
      Competicao.safeParse({ ...base, divisao: 1, fases: [base.fases[0], base.fases[0]] }).success,
    ).toBe(false);
  });
});

describe("Tecnico", () => {
  it("técnico da CPU precisa de clube ou seleção; humano pode estar desempregado", () => {
    const base = { id: "t1", nome: "Fulano", nacionalidade: "BRA", reputacao: 3 };
    expect(Tecnico.safeParse(base).success).toBe(false);
    expect(Tecnico.safeParse({ ...base, humano: true }).success).toBe(true);
    expect(Tecnico.safeParse({ ...base, selecao: "BRA" }).success).toBe(true);
  });
});
