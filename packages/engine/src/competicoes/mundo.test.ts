import { describe, expect, it } from "vitest";
import { Competicao, gerarAtributos, type Jogador, type Pais, type Posicao } from "@newbras/data";
import { somarDias } from "../carreira/datas";
import { jogosDoDia, lancarResultado } from "./competicao";
import {
  iniciarMundo,
  jogarDia,
  plantaoDoDia,
  virarTemporadas,
  type MundoCompeticoes,
  type MundoParaCompeticoes,
} from "./mundo";

const BRASIL: Pais = {
  codigo: "BRA",
  nome: "Brasil",
  confederacao: "CONMEBOL",
  nivel: 1,
  grupoNomes: "pt-br",
  temporada: { inicio: "01-10", fim: "12-10" },
  janelas: [],
  cores: { primaria: "#ffdf00", secundaria: "#009c3b" },
};

const POSICOES: Posicao[] = ["G", "L", "L", "Z", "Z", "Z", "M", "M", "M", "M", "A", "A", "A", "G"];

/** a1 é o mais forte e b8 o mais fraco: a força cai com a ordem. */
const A = Array.from({ length: 8 }, (_, i) => `a${i + 1}`);
const B = Array.from({ length: 8 }, (_, i) => `b${i + 1}`);

function elenco(clube: string, nivel: number): Jogador[] {
  return POSICOES.map((posicao, i) => {
    const forca = nivel + (i % 3) - 1;
    return {
      id: `${clube}-${i}`,
      nome: `${clube} ${i}`,
      nascimento: "1998-05-05",
      nacionalidade: "BRA",
      posicao,
      lado: "C",
      forca,
      potencial: forca,
      caracteristicas: [],
      atributos: gerarAtributos({ semente: `${clube}-${i}`, posicao, forca }),
      estrela: false,
      base: false,
      clube,
      aConferir: [],
    } as unknown as Jogador;
  });
}

const liga = (id: string, divisao: number, fixos: string[], movimentos: unknown[]) =>
  Competicao.parse({
    id,
    nome: id,
    tipo: "liga",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: "BRA" },
    divisao,
    calendario: { inicio: "04-01", fim: "11-30" },
    participantes: { fixos, quantidade: 8 },
    fases: [{ id: "pc", nome: "Pontos corridos", tipo: "grupos", grupos: 1, turnos: 2 }],
    movimentos,
  });

const mataMata = (id: string, jogos: 1 | 2, mando: "sorteio" | "neutro") => ({
  id,
  nome: id,
  tipo: "mata-mata" as const,
  jogos,
  prorrogacao: false,
  penaltis: true,
  chaveamento: "chave-fixa" as const,
  mando,
});

function mundo(): MundoParaCompeticoes {
  const competicoes = [
    liga("serie-a", 1, A, [{ tipo: "rebaixamento", posicoes: [7, 8], para: "serie-b" }]),
    liga("serie-b", 2, B, [{ tipo: "acesso", posicoes: [1, 2], para: "serie-a" }]),
    Competicao.parse({
      id: "copa",
      nome: "Copa",
      tipo: "copa",
      categoria: "clubes",
      escopo: { tipo: "pais", pais: "BRA" },
      calendario: { inicio: "03-01", fim: "11-20" },
      participantes: {
        fixos: [],
        vagas: [
          { de: "serie-a", criterio: "posicoes", posicoes: [1, 2, 3, 4, 5, 6, 7, 8] },
          { de: "serie-b", criterio: "posicoes", posicoes: [1, 2, 3, 4] },
        ],
        quantidade: 12,
      },
      fases: [
        { ...mataMata("primeira", 1, "sorteio"), chaveamento: "sorteio" },
        mataMata("quartas", 1, "sorteio"),
        mataMata("semi", 2, "sorteio"),
        mataMata("final", 1, "neutro"),
      ],
    }),
    Competicao.parse({
      id: "supercopa",
      nome: "Supercopa",
      tipo: "supercopa",
      categoria: "clubes",
      escopo: { tipo: "pais", pais: "BRA" },
      calendario: { inicio: "02-01", fim: "02-08" },
      participantes: {
        fixos: [],
        vagas: [
          { de: "serie-a", criterio: "campeao" },
          { de: "copa", criterio: "campeao" },
        ],
        quantidade: 2,
      },
      fases: [mataMata("final", 1, "neutro")],
    }),
  ];
  const elencos = new Map([...A, ...B].map((c, i) => [c, elenco(c, 80 - i * 2)]));
  return {
    competicoes,
    competicao: (id) => competicoes.find((c) => c.id === id),
    pais: (codigo) => (codigo === "BRA" ? BRASIL : undefined),
    elenco: (clube) => elencos.get(clube) ?? [],
    datasFifa: [],
  };
}

function jogarAte(m: MundoParaCompeticoes, w0: MundoCompeticoes, de: string, ate: string) {
  let w = w0;
  for (let d = de; d < ate; d = somarDias(d, 1)) {
    w = jogarDia(m, w, d, "s");
    w = virarTemporadas(m, w, somarDias(d, 1), "s").estado;
  }
  return w;
}

describe("copas e supercopas", () => {
  it("na primeira temporada os participantes saem das ligas pela força do elenco", () => {
    const w = iniciarMundo(mundo(), "2027-01-05", "s");
    const copa = w.competicoes.copa!;
    expect([...copa.participantes].sort()).toEqual([...A, "b1", "b2", "b3", "b4"].sort());
    // Sem histórico, a supercopa reúne o mais forte da liga e o mais forte da copa que sobra.
    expect(w.competicoes.supercopa!.participantes).toEqual(["a1", "a2"]);
    // 12 times: a primeira fase tem 4 folgas e mais 4 jogos.
    expect(copa.jogos.filter((j) => j.rodada === 0)).toHaveLength(4);
  });

  it("a copa chega a um campeão, com final neutra e semifinal em ida e volta", () => {
    const m = mundo();
    const w = jogarAte(m, iniciarMundo(m, "2027-01-05", "s"), "2027-01-05", "2027-12-01");
    const copa = w.competicoes.copa!;
    expect(copa.encerrada).toBe(true);
    expect(copa.campeao).toBeDefined();
    expect(copa.classificacao?.[0]).toBe(copa.campeao);
    expect(copa.classificacao?.[1]).not.toBe(copa.campeao);
    const final = copa.jogos.at(-1)!;
    expect(final.neutro).toBe(true);
    expect([final.casa, final.fora]).toContain(copa.campeao);
  });

  it("na temporada seguinte a supercopa junta os campeões e a copa usa a nova Série A", () => {
    const m = mundo();
    let w = iniciarMundo(m, "2027-01-05", "s");
    w = jogarAte(m, w, "2027-01-05", "2028-01-15");
    const campeao = (id: string) =>
      w.historico.find((h) => h.competicao === id && h.temporada === "2027")?.campeao;
    const ligaCampeao = campeao("serie-a")!;
    const copaCampeao = campeao("copa")!;
    expect(w.temporadas.BRA?.nome).toBe("2028");
    const supercopa = w.competicoes.supercopa!.participantes;
    expect(supercopa[0]).toBe(ligaCampeao);
    // Se o mesmo time ganhou as duas, a vaga passa para o melhor da copa que sobra.
    if (copaCampeao !== ligaCampeao) expect(supercopa[1]).toBe(copaCampeao);
    expect(supercopa).toHaveLength(2);
    expect(new Set(supercopa).size).toBe(2);
    // Os promovidos da Série B jogam a copa como times da Série A.
    const serieA = w.competicoes["serie-a"]!.participantes;
    const copa = w.competicoes.copa!.participantes;
    expect(serieA.every((x) => copa.includes(x))).toBe(true);
    // Da Série B entram os quatro primeiros da classificação passada que continuam nela.
    const classB = w.classificacoes?.["serie-b"] ?? [];
    const serieB = w.competicoes["serie-b"]!.participantes;
    const esperados = classB.filter((x) => serieB.includes(x)).slice(0, 4);
    expect(copa.filter((x) => serieB.includes(x)).sort()).toEqual(esperados.sort());
  });
});

describe("plantão de gols", () => {
  it("mostra os mesmos placares que o dia registra, com o jogo do técnico jogado à parte", () => {
    const m = mundo();
    const w = iniciarMundo(m, "2027-01-05", "s");
    const liga = w.competicoes["serie-a"]!;
    const dia = liga.datas[3]!;
    const [nosso, ...outros] = jogosDoDia(liga, dia);
    expect(outros.length).toBeGreaterThan(0);
    const pular = (id: string, i: number) => id === "serie-a" && i === nosso;
    const plantao = plantaoDoDia(m, w, dia, "s", ["serie-a"], pular);
    expect(plantao.map((j) => j.indice)).toEqual(outros);
    for (const j of plantao) {
      // Os minutos fecham com o placar.
      expect(j.gols.filter((g) => g.lado === "casa")).toHaveLength(j.placar[0]);
      expect(j.gols.filter((g) => g.lado === "fora")).toHaveLength(j.placar[1]);
      expect(j.gols.every((g) => g.minuto >= 1 && g.minuto <= (j.prorrogacao ? 120 : 90))).toBe(
        true,
      );
    }
    // O técnico joga (aqui, um 3 a 2 qualquer) e depois o dia fecha no mundo.
    const comNosso = {
      ...w,
      competicoes: { ...w.competicoes, "serie-a": lancarResultado(liga, nosso!, [3, 2]) },
    };
    const depois = jogarDia(m, comNosso, dia, "s").competicoes["serie-a"]!;
    for (const j of plantao) expect(depois.jogos[j.indice]?.placar).toEqual(j.placar);
    expect(depois.jogos[nosso!]?.placar).toEqual([3, 2]);
  });
});
