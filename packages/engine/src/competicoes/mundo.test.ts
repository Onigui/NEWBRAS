import { describe, expect, it } from "vitest";
import { Competicao, gerarAtributos, type Jogador, type Pais, type Posicao } from "@newbras/data";
import { somarDias } from "../carreira/datas";
import { jogosDoDia, lancarResultado, tabelaDoGrupo } from "./competicao";
import {
  abrirTemporadasFaltando,
  anoFinal,
  datasContinentais,
  edicaoDaSelecao,
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

describe("liga aberta", () => {
  it("Série D: ficam os da fase marcada, entra o rebaixado e os melhores do estadual completam", () => {
    const C = ["c1", "c2", "c3", "c4"];
    const D = ["d1", "d2", "d3", "d4", "d5", "d6"];
    const E = ["e1", "e2", "e3"];
    const competicoes = [
      {
        ...liga("serie-c", 1, C, [{ tipo: "rebaixamento", posicoes: [4], para: "serie-d" }]),
        participantes: { fixos: C, quantidade: 4, vagas: [], exclui: [] },
      },
      Competicao.parse({
        id: "serie-d",
        nome: "serie-d",
        tipo: "liga",
        categoria: "clubes",
        escopo: { tipo: "pais", pais: "BRA" },
        divisao: 2,
        calendario: { inicio: "04-01", fim: "11-30" },
        participantes: {
          fixos: D,
          quantidade: 6,
          renovacao: {
            ficam: "mata",
            vagas: [{ de: "estadual", criterio: "posicoes", posicoes: [1, 2] }],
          },
        },
        fases: [
          { id: "pc", nome: "pc", tipo: "grupos", grupos: 1, turnos: 2, classificamPorGrupo: 4 },
          { ...mataMata("mata", 1, "sorteio"), chaveamento: "campanha" },
        ],
        movimentos: [{ tipo: "acesso", posicoes: [1], para: "serie-c" }],
      }),
      Competicao.parse({
        id: "estadual",
        nome: "estadual",
        tipo: "estadual",
        categoria: "clubes",
        escopo: { tipo: "estado", pais: "BRA", estado: "SP" },
        calendario: { inicio: "01-15", fim: "03-25" },
        participantes: { fixos: [...D, ...E], quantidade: 9 },
        fases: [{ id: "pc", nome: "pc", tipo: "grupos", grupos: 1, turnos: 1 }],
      }),
    ];
    const elencos = new Map([...C, ...D, ...E].map((c, i) => [c, elenco(c, 80 - i * 2)]));
    const m: MundoParaCompeticoes = {
      competicoes,
      competicao: (id) => competicoes.find((c) => c.id === id),
      pais: (codigo) => (codigo === "BRA" ? BRASIL : undefined),
      elenco: (clube) => elencos.get(clube) ?? [],
      datasFifa: [],
    };
    let w = iniciarMundo(m, "2027-01-05", "s");
    w = jogarAte(m, w, "2027-01-05", "2027-12-08");
    const antes = w.competicoes["serie-d"]!;
    expect(antes.encerrada).toBe(true);
    w = jogarAte(m, w, "2027-12-08", "2028-01-15");
    expect(w.temporadas.BRA?.nome).toBe("2028");
    const nova = w.competicoes["serie-d"]!.participantes;
    expect(nova).toHaveLength(6);
    const rebaixado = w.classificacoes?.["serie-c"]?.[3];
    const promovido = w.classificacoes?.["serie-d"]?.[0];
    expect(nova).toContain(rebaixado);
    expect(nova).not.toContain(promovido);
    // Ficam os 4 que chegaram ao mata-mata (menos o que subiu).
    const ficam = antes.fases[1]!.times.filter((x) => x !== promovido);
    for (const x of ficam) expect(nova).toContain(x);
    // As duas vagas do estadual: os melhores dele que não estão em outra liga nem já ficaram.
    const ocupados = new Set([...ficam, rebaixado, ...w.competicoes["serie-c"]!.participantes]);
    const doEstadual = (w.classificacoes?.estadual ?? []).filter((x) => !ocupados.has(x));
    expect(nova.filter((x) => !ocupados.has(x)).sort()).toEqual(doEstadual.slice(0, 2).sort());
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

describe("continentais", () => {
  const continental = (id: string, exclui: string[]) =>
    Competicao.parse({
      id,
      nome: id,
      tipo: "continental",
      categoria: "clubes",
      escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
      calendario: { inicio: "04-01", fim: "11-25" },
      participantes: {
        fixos: [],
        vagas: [{ de: "serie-a", criterio: "posicoes", posicoes: [1, 2, 3, 4] }],
        exclui,
        quantidade: 4,
      },
      fases: [
        {
          id: "mm",
          nome: "Mata-mata",
          tipo: "mata-mata",
          jogos: 2,
          chaveamento: "campanha",
        },
      ],
    });

  function comContinentais(): MundoParaCompeticoes {
    const base = mundo();
    const competicoes = [
      ...base.competicoes,
      continental("liberta", []),
      continental("sula", ["liberta"]),
    ];
    return { ...base, competicoes, competicao: (id) => competicoes.find((c) => c.id === id) };
  }

  it("a de baixo exclui quem está na de cima e as ligas fogem das datas continentais", () => {
    const m = comContinentais();
    const w = iniciarMundo(m, "2027-01-05", "s");
    expect(w.temporadas["conf:CONMEBOL"]?.nome).toBe("2027");
    const liberta = w.competicoes.liberta!.participantes;
    const sula = w.competicoes.sula!.participantes;
    expect(liberta).toEqual(["a1", "a2", "a3", "a4"]);
    expect(sula).toEqual(["a5", "a6", "a7", "a8"]);
    // A Libertadores às quartas e a Sul-Americana às quintas, nas datas já reservadas.
    const reservadas = datasContinentais(m, "CONMEBOL", "2027-01-01", "2027-12-31");
    for (const d of [...w.competicoes.liberta!.datas, ...w.competicoes.sula!.datas])
      expect(reservadas.has(d)).toBe(true);
    // A Série A não joga nem no dia nem na véspera ou no dia seguinte de uma data continental.
    for (const d of w.competicoes["serie-a"]!.datas)
      for (const r of reservadas)
        expect(Math.abs(Date.parse(d) - Date.parse(r))).toBeGreaterThan(864e5);
  });

  it("na temporada seguinte as vagas saem da classificação da liga", () => {
    const m = comContinentais();
    let w = iniciarMundo(m, "2027-01-05", "s");
    w = jogarAte(m, w, "2027-01-05", "2028-01-10");
    expect(w.competicoes.liberta!.temporada).toBe("2028");
    const classA = w.classificacoes?.["serie-a"] ?? [];
    const serieA = w.competicoes["serie-a"]!.participantes;
    const esperados = classA.filter((x) => serieA.includes(x)).slice(0, 4);
    expect(w.competicoes.liberta!.participantes).toEqual(esperados);
    expect(w.historico.some((h) => h.competicao === "liberta" && h.campeao)).toBe(true);
  });

  it("salvamento sem as continentais ganha a temporada delas, com os jogos passados disputados", () => {
    const antigo = iniciarMundo(mundo(), "2027-06-10", "s");
    const m = comContinentais();
    const w = abrirTemporadasFaltando(m, antigo, "2027-06-10", "s");
    const liberta = w.competicoes.liberta!;
    expect(liberta.temporada).toBe("2027");
    const passados = liberta.jogos.filter((j) => (liberta.datas[j.rodada] ?? "") < "2027-06-10");
    expect(passados.length).toBeGreaterThan(0);
    expect(passados.every((j) => j.placar)).toBe(true);
    // As competições que já existiam não mudam.
    expect(w.competicoes["serie-a"]).toBe(antigo.competicoes["serie-a"]);
  });
});

describe("fases preliminares e clubes que passam de uma competição para outra", () => {
  const ida = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    nome: id,
    tipo: "mata-mata" as const,
    jogos: 2 as const,
    prorrogacao: false,
    chaveamento: "sorteio" as const,
    ...extra,
  });
  function mundoPreliminar(): MundoParaCompeticoes {
    const base = mundo();
    const libertadores = Competicao.parse({
      id: "lib",
      nome: "Libertadores",
      tipo: "continental",
      categoria: "clubes",
      escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
      calendario: { inicio: "02-01", fim: "11-28" },
      participantes: {
        fixos: [],
        vagas: [{ de: "serie-b", criterio: "posicoes", posicoes: [1, 2, 3, 4] }],
        quantidade: 10,
      },
      fases: [
        ida("previa", { periodo: { inicio: "02-01", fim: "02-28" } }),
        {
          id: "grupos",
          nome: "Grupos",
          tipo: "grupos",
          grupos: 2,
          turnos: 1,
          classificamPorGrupo: 2,
          divisaoGrupos: "potes",
          periodo: { inicio: "04-01", fim: "05-31" },
          entramAqui: [
            { de: "lib", criterio: "campeao" },
            { de: "serie-a", criterio: "posicoes", posicoes: [1, 2, 3, 4, 5] },
          ],
        },
        { ...ida("final", { chaveamento: "potes" }), periodo: { inicio: "08-01", fim: "11-28" } },
      ],
    });
    const sul = Competicao.parse({
      id: "sul",
      nome: "Sul-Americana",
      tipo: "continental",
      categoria: "clubes",
      escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
      calendario: { inicio: "02-01", fim: "11-21" },
      participantes: {
        fixos: [],
        vagas: [{ de: "serie-b", criterio: "posicoes", posicoes: [1, 2, 3, 4] }],
        exclui: ["lib"],
        quantidade: 8,
      },
      fases: [
        ida("primeira", { periodo: { inicio: "03-01", fim: "03-31" } }),
        {
          ...ida("final", { chaveamento: "potes" }),
          periodo: { inicio: "08-01", fim: "11-21" },
          entramAqui: [
            {
              de: "lib",
              criterio: "posicoes",
              fase: "grupos",
              posicoes: [3],
              porGrupo: true,
              quantidade: 2,
            },
            { de: "lib", criterio: "eliminados", fase: "previa", quantidade: 2, depois: true },
          ],
        },
      ],
    });
    const competicoes = [...base.competicoes, libertadores, sul];
    return { ...base, competicoes, competicao: (id) => competicoes.find((c) => c.id === id) };
  }

  it("prévia, grupos com o campeão e os da liga, e os eliminados seguindo na outra copa", () => {
    const m = mundoPreliminar();
    let w = iniciarMundo(m, "2027-01-05", "s");
    const lib0 = w.competicoes.lib!;
    // A prévia tem os 4 da Série B; os 6 dos grupos (o campeão e 5 da Série A) entram depois.
    expect(lib0.fases[0]?.times.sort()).toEqual(["b1", "b2", "b3", "b4"]);
    expect(lib0.participantes).toHaveLength(10);
    // A Sul-Americana não repete ninguém da Libertadores.
    const sul0 = w.competicoes.sul!;
    expect(sul0.participantes.sort()).toEqual(["b5", "b6", "b7", "b8"]);
    w = jogarAte(m, w, "2027-01-05", "2027-12-01");
    const lib = w.competicoes.lib!;
    const sul = w.competicoes.sul!;
    expect(lib.fases[1]?.times).toHaveLength(8);
    expect(lib.campeao).toBeDefined();
    expect(sul.campeao).toBeDefined();
    // Os 2 eliminados da prévia e os 3º colocados dos grupos estão na fase final da Sul-Americana.
    const passaram = new Set(lib.fases[1]!.times);
    const eliminados = lib.fases[0]!.times.filter((t) => !passaram.has(t));
    const terceiros = [0, 1].map((g) => tabelaDoGrupo(m.competicao("lib")!, lib, 1, g)[2]!.clube);
    const finalSul = sul.fases[1]!.times;
    for (const t of [...eliminados, ...terceiros]) expect(finalSul).toContain(t);
    // Os 3º da Libertadores são a metade de cima; os eliminados da prévia vêm por último.
    expect(finalSul.slice(0, 2).sort()).toEqual([...terceiros].sort());
    expect(finalSul.slice(-2).sort()).toEqual([...eliminados].sort());
  });
});

describe("temporadas de outras chaves", () => {
  it("ano final de uma temporada de um ano ou de dois", () => {
    expect(anoFinal("2026/27")).toBe(2027);
    expect(anoFinal("2027")).toBe(2027);
    expect(anoFinal("1999/00")).toBe(2000);
    expect(anoFinal("2027/29")).toBe(2029);
  });

  it("seleções: edições de vários anos e o intervalo entre elas, em que nada abre", () => {
    const c = Competicao.parse({
      id: "eliminatorias",
      nome: "Eliminatórias",
      tipo: "eliminatorias",
      categoria: "selecoes",
      escopo: { tipo: "confederacao", confederacao: "UEFA" },
      periodicidade: { aCadaAnos: 4, anoBase: 2028 },
      calendario: { inicio: "03-25", fim: "03-31" },
      anos: 2,
      participantes: { fixos: ["AAA", "BBB"], quantidade: 2 },
      fases: [{ id: "g", nome: "g", tipo: "grupos", grupos: 1, turnos: 2 }],
    });
    expect(edicaoDaSelecao(c, "2027-06-01")).toEqual({
      nome: "2027/28",
      inicio: "2027-03-25",
      fim: "2028-03-31",
    });
    expect(edicaoDaSelecao(c, "2026-11-01")).toEqual({
      nome: "2024/27",
      inicio: "2024-04-01",
      fim: "2027-03-24",
      intervalo: true,
    });
    expect(edicaoDaSelecao(c, "2028-04-01").intervalo).toBe(true);
    expect(edicaoDaSelecao(c, "2031-03-25").nome).toBe("2031/32");
  });
});
