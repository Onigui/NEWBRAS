import { describe, expect, it } from "vitest";
import { Competicao, type CompeticaoEntrada } from "@newbras/data";
import { Rng } from "../rng";
import {
  avancarCompeticao,
  classificadosPelasRegras,
  desempateDoJogo,
  jogosDoDia,
  lancarResultado,
  montarCompeticao,
  movimentosDaTemporada,
  receberEntrantes,
  resolverVagaDinamica,
  tabelaDoGrupo,
  type EstadoCompeticao,
} from "./competicao";
import { simularRapido } from "./rapida";
import { ordenarTabela } from "./tabela";
import { todosContraTodos } from "./rodadas";

const SEM_FIFA = [] as const;
const times = (prefixo: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefixo}${i + 1}`);
const forca = (t: string) => 90 - Number(t.replace(/\D/g, "")) * 0.6;

function comp(c: Partial<CompeticaoEntrada> & Pick<CompeticaoEntrada, "fases">): Competicao {
  return Competicao.parse({
    id: "teste",
    nome: "Teste",
    tipo: "liga",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: "BRA" },
    divisao: 1,
    calendario: { inicio: "02-01", fim: "11-30" },
    participantes: { fixos: [], quantidade: 2 },
    ...c,
  });
}

/** Joga a competição inteira, dia a dia, com a simulação rápida. */
function jogarTudo(
  c: Competicao,
  participantes: string[],
  semente = "s",
  extra: {
    caminhos?: Record<string, string>;
    entrantes?: Record<string, string[]>;
    divisoes?: Record<string, number>;
  } = {},
): EstadoCompeticao {
  let e = montarCompeticao(c, participantes, "2027-01-10", {
    datasFifa: SEM_FIFA,
    semente,
    temporada: "2027",
    ...extra,
  });
  const rng = new Rng(semente);
  for (let guarda = 0; guarda < 400 && !e.encerrada; guarda++) {
    const proximas = e.jogos
      .filter((j) => !j.placar)
      .map((j) => e.datas[j.rodada] as string)
      .sort();
    const dia = proximas[0];
    if (!dia) break;
    for (const i of jogosDoDia(e, dia)) {
      const j = e.jogos[i]!;
      const d = desempateDoJogo(c, e, j);
      const r = simularRapido(rng, forca(j.casa), forca(j.fora), {
        ...(j.neutro ? { neutro: true } : {}),
        desempate: d.desempate,
        ...(d.agregado ? { agregado: d.agregado } : {}),
      });
      e = lancarResultado(e, i, r.placar, r.penaltis);
    }
    e = avancarCompeticao(c, e, semente);
  }
  return e;
}

describe("tabela e jogos", () => {
  it("todos contra todos: cada um enfrenta todos, uma vez em casa e outra fora", () => {
    const rodadas = todosContraTodos(20, 2, new Rng("x"));
    expect(rodadas).toHaveLength(38);
    const pares = new Set(rodadas.flat().map(([a, b]) => `${a}-${b}`));
    expect(pares.size).toBe(380);
    for (const r of rodadas) expect(new Set(r.flat()).size).toBe(20);
  });

  it("todos contra todos: ninguém joga mais de três vezes seguidas em casa ou fora", () => {
    for (const n of [8, 12, 18, 20, 24]) {
      const rodadas = todosContraTodos(n, 2, new Rng(`t${n}`));
      for (let t = 0; t < n; t++) {
        const mandos = rodadas.map((r) =>
          r.find(([a, b]) => a === t || b === t)?.[0] === t ? "C" : "F",
        );
        expect(mandos.join(""), `${n} times, time ${t}`).not.toMatch(/CCCC|FFFF/);
        expect(mandos.filter((x) => x === "C")).toHaveLength(n - 1);
      }
    }
  });

  it("desempata por vitórias, saldo e confronto direto", () => {
    const jogos = [
      { casa: "A", fora: "B", placar: [1, 0] as [number, number] },
      { casa: "B", fora: "C", placar: [3, 0] as [number, number] },
      { casa: "C", fora: "A", placar: [1, 0] as [number, number] },
    ];
    // Três com 3 pontos: o saldo decide (B +2, C -2, A 0).
    const t = ordenarTabela(["A", "B", "C"], jogos, ["pontos", "saldo"]);
    expect(t.map((l) => l.clube)).toEqual(["B", "A", "C"]);
    const t2 = ordenarTabela(
      ["A", "B"],
      [
        { casa: "A", fora: "B", placar: [2, 1] },
        { casa: "B", fora: "A", placar: [1, 1] },
      ],
      ["pontos", "confronto-direto"],
    );
    expect(t2[0]?.clube).toBe("A");
  });
});

describe("competições", () => {
  it("liga de 20 em dois turnos: 380 jogos aos domingos, campeão é o líder e 4 caem", () => {
    const c = comp({
      fases: [{ id: "pc", nome: "Pontos corridos", tipo: "grupos", grupos: 1, turnos: 2 }],
      movimentos: [{ tipo: "rebaixamento", para: "serie-b", posicoes: [17, 18, 19, 20] }],
    });
    const e = jogarTudo(c, times("T", 20));
    expect(e.jogos).toHaveLength(380);
    expect(e.encerrada).toBe(true);
    expect(e.campeao).toBe(tabelaDoGrupo(c, e, 0, 0)[0]?.clube);
    const desceram = movimentosDaTemporada(c, e).filter((m) => m.tipo === "rebaixamento");
    expect(desceram).toHaveLength(4);
    expect(new Set(e.datas).size).toBe(38);
  });

  it("Série B: 1º e 2º sobem direto e o playoff do 3º ao 6º dá a terceira vaga", () => {
    const c = comp({
      fases: [
        {
          id: "pc",
          nome: "Pontos corridos",
          tipo: "grupos",
          grupos: 1,
          turnos: 2,
          faixaClassificada: { de: 3, ate: 6 },
        },
        {
          id: "po",
          nome: "Playoffs",
          tipo: "mata-mata",
          jogos: 2,
          chaveamento: "campanha",
          mando: "melhor-campanha",
        },
      ],
      movimentos: [
        { tipo: "acesso", para: "a", posicoes: [1, 2] },
        { tipo: "playoff-acesso", para: "a", posicoes: [3, 4, 5, 6] },
      ],
    });
    const e = jogarTudo(c, times("B", 20));
    const tabela = tabelaDoGrupo(c, e, 0, 0).map((l) => l.clube);
    expect(e.campeao).toBe(tabela[0]);
    expect(tabela.slice(2, 6)).toContain(e.vencedorPlayoff);
    const sobem = movimentosDaTemporada(c, e).map((m) => m.clube);
    expect(sobem).toHaveLength(3);
    expect(sobem.slice(0, 2)).toEqual(tabela.slice(0, 2));
  });

  it("estadual: turno único, oito melhores no mata-mata em jogo único até o campeão", () => {
    const c = comp({
      tipo: "estadual",
      divisao: undefined,
      escopo: { tipo: "estado", pais: "BRA", estado: "SP" },
      calendario: { inicio: "01-10", fim: "03-08" },
      fases: [
        {
          id: "pf",
          nome: "Primeira fase",
          tipo: "grupos",
          grupos: 1,
          turnos: 1,
          classificamPorGrupo: 8,
        },
        {
          id: "mm",
          nome: "Mata-mata",
          tipo: "mata-mata",
          jogos: 1,
          chaveamento: "campanha",
          mando: "melhor-campanha",
        },
      ],
    });
    const e = jogarTudo(c, times("P", 16));
    expect(e.encerrada).toBe(true);
    const chaves = e.fases[1]?.chaves ?? [];
    expect(chaves.map((r) => r.length)).toEqual([4, 2, 1]);
    // Quartas pela campanha: 1º x 8º.
    const tabela = tabelaDoGrupo(c, e, 0, 0).map((l) => l.clube);
    expect([chaves[0]?.[0]?.a, chaves[0]?.[0]?.b]).toEqual([tabela[0], tabela[7]]);
    expect(e.campeao).toBe(chaves[2]?.[0]?.vencedor);
    expect(e.classificacao?.[0]).toBe(e.campeao);
    // Tudo entre o início e o fim do estadual.
    expect(e.datas.every((d) => d >= "2027-01-10" && d <= "2027-03-08")).toBe(true);
  });

  it("Série D: 16 grupos pela ordem da lista, 64 no mata-mata em ida e volta, 4 semifinalistas sobem", () => {
    const fases: CompeticaoEntrada["fases"] = [
      {
        id: "g",
        nome: "Grupos",
        tipo: "grupos",
        grupos: 16,
        turnos: 2,
        classificamPorGrupo: 4,
        divisaoGrupos: "ordem-da-lista",
      },
      ...["2", "3", "8", "4", "s", "f"].map((id, i) => ({
        id,
        nome: `Fase ${i}`,
        tipo: "mata-mata" as const,
        jogos: 2 as const,
        chaveamento: (i === 0 ? "campanha" : "chave-fixa") as "campanha" | "chave-fixa",
        mando: "melhor-campanha" as const,
      })),
    ];
    const c = comp({
      calendario: { inicio: "04-05", fim: "09-13" },
      fases,
      movimentos: [{ tipo: "acesso", para: "c", posicoes: [1, 2, 3, 4] }],
    });
    const e = jogarTudo(c, times("D", 96));
    expect(e.encerrada).toBe(true);
    expect(e.fases[0]?.grupos?.[0]).toEqual(times("D", 6));
    const finalistas = e.fases[6]?.chaves?.[0]?.[0];
    expect(e.campeao).toBe(finalistas?.vencedor);
    const sobem = movimentosDaTemporada(c, e).map((m) => m.clube);
    const semi = (e.fases[5]?.chaves?.[0] ?? []).flatMap((p) => [p.a, p.b]);
    expect(new Set(sobem)).toEqual(new Set(semi));
  });

  it("Championship: eliminatória do 5º ao 8º e 3º e 4º entrando direto no playoff com final única", () => {
    const c = comp({
      calendario: { inicio: "08-14", fim: "05-20" },
      fases: [
        {
          id: "t",
          nome: "Temporada",
          tipo: "grupos",
          grupos: 1,
          turnos: 2,
          faixaClassificada: { de: 5, ate: 8 },
        },
        {
          id: "e",
          nome: "Eliminatória",
          tipo: "mata-mata",
          jogos: 1,
          chaveamento: "campanha",
          mando: "melhor-campanha",
        },
        {
          id: "p",
          nome: "Playoffs",
          tipo: "mata-mata",
          jogos: 2,
          finalJogoUnico: true,
          chaveamento: "campanha",
          mando: "neutro",
          entramAqui: [{ de: "teste", criterio: "posicoes", posicoes: [3, 4] }],
        },
      ],
      movimentos: [
        { tipo: "acesso", para: "pl", posicoes: [1, 2] },
        { tipo: "playoff-acesso", para: "pl", posicoes: [3, 4, 5, 6, 7, 8] },
      ],
    });
    let e = jogarTudo(c, times("C", 24), "champ");
    expect(e.encerrada).toBe(true);
    const tabela = tabelaDoGrupo(c, e, 0, 0).map((l) => l.clube);
    expect(e.fases[2]?.times.slice(0, 2)).toEqual(tabela.slice(2, 4));
    expect(tabela.slice(2, 8)).toContain(e.vencedorPlayoff);
    const final = e.jogos.filter((j) => j.fase === 2 && j.chave === 1);
    expect(final).toHaveLength(1);
    expect(final[0]?.neutro).toBe(true);
    e = { ...e };
    expect(movimentosDaTemporada(c, e)).toHaveLength(3);
  });

  it("fase de liga da Champions: 8 jogos para cada, 1º ao 8º direto às oitavas e playoff do 9º ao 24º", () => {
    const c = comp({
      tipo: "continental",
      escopo: { tipo: "confederacao", confederacao: "UEFA" },
      divisao: undefined,
      calendario: { inicio: "09-15", fim: "05-31" },
      participantes: { fixos: [], quantidade: 36 },
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
        { id: "playoff", nome: "Playoff", tipo: "mata-mata", jogos: 2, chaveamento: "campanha" },
        {
          id: "mata-mata",
          nome: "Mata-mata",
          tipo: "mata-mata",
          jogos: 2,
          finalJogoUnico: true,
          chaveamento: "campanha",
          mando: "neutro",
        },
      ],
    });
    const times36 = times("u", 36);
    const e = jogarTudo(c, times36);
    const liga = e.jogos.filter((j) => j.fase === 0);
    expect(liga).toHaveLength(36 * 4);
    for (const t of times36) {
      const deles = liga.filter((j) => j.casa === t || j.fora === t);
      expect(deles).toHaveLength(8);
      // Oito adversários diferentes.
      expect(new Set(deles.map((j) => (j.casa === t ? j.fora : j.casa))).size).toBe(8);
    }
    const tabela = tabelaDoGrupo(c, e, 0, 0).map((l) => l.clube);
    // O playoff tem só quem ficou do 9º ao 24º.
    const playoff = new Set(e.jogos.filter((j) => j.fase === 1).flatMap((j) => [j.casa, j.fora]));
    expect([...playoff].sort()).toEqual(tabela.slice(8, 24).sort());
    // As oitavas têm os 8 primeiros e os 8 vencedores do playoff.
    const oitavas = e.jogos.filter((j) => j.fase === 2 && j.chave === 0);
    const naOitava = new Set(oitavas.flatMap((j) => [j.casa, j.fora]));
    expect(naOitava.size).toBe(16);
    for (const t of tabela.slice(0, 8)) expect(naOitava.has(t)).toBe(true);
    expect(e.encerrada).toBe(true);
    expect(e.campeao).toBeDefined();
    const final = e.jogos.at(-1)!;
    expect(final.neutro).toBe(true);
    expect(e.classificacao?.[0]).toBe(e.campeao);
  });

  it("sorteios: 1ª fase só entre clubes do mesmo país e grupos por potes sem compatriotas", () => {
    const paises = Object.fromEntries(
      times("t", 32).map((t, i) => [
        t,
        ["BRA", "ARG", "URU", "CHI", "COL", "PAR", "PER", "ECU"][i % 8]!,
      ]),
    );
    const primeira = comp({
      tipo: "continental",
      escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
      divisao: undefined,
      participantes: { fixos: [], quantidade: 32 },
      fases: [
        { id: "f1", nome: "1ª fase", tipo: "mata-mata", jogos: 1, chaveamento: "pais" },
        {
          id: "g",
          nome: "Grupos",
          tipo: "grupos",
          grupos: 4,
          turnos: 2,
          classificamPorGrupo: 2,
          divisaoGrupos: "potes",
          entramAqui: [
            {
              de: "outra",
              criterio: "posicoes",
              posicoes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            },
          ],
        },
        { id: "mm", nome: "Mata-mata", tipo: "mata-mata", jogos: 2, chaveamento: "potes" },
      ],
    });
    const e = montarCompeticao(primeira, times("t", 32), "2027-01-10", {
      datasFifa: SEM_FIFA,
      semente: "s",
      temporada: "2027",
      paises,
    });
    const pares = e.fases[0]!.chaves![0]!;
    expect(pares).toHaveLength(16);
    for (const p of pares) expect(paises[p.a]).toBe(paises[p.b]);
  });

  it("qualificatória da UEFA: cada caminho só cruza consigo mesmo", () => {
    const c = comp({
      tipo: "continental",
      escopo: { tipo: "confederacao", confederacao: "UEFA" },
      divisao: undefined,
      participantes: { fixos: [], quantidade: 12 },
      fases: [
        { id: "q", nome: "Qualificatória", tipo: "mata-mata", jogos: 2, chaveamento: "caminhos" },
        {
          id: "liga",
          nome: "Liga",
          tipo: "grupos",
          grupos: 1,
          turnos: 1,
          entramAqui: [{ de: "x", criterio: "posicoes", posicoes: [1, 2] }],
        },
      ],
    });
    const times12 = times("c", 12);
    const caminhos = Object.fromEntries(times12.map((t, i) => [t, i < 8 ? "campeoes" : "liga"]));
    const e = montarCompeticao(c, times12, "2027-07-01", {
      datasFifa: SEM_FIFA,
      semente: "s",
      temporada: "2027/28",
      caminhos,
    });
    const pares = e.fases[0]!.chaves![0]!;
    expect(pares).toHaveLength(6);
    for (const p of pares) expect(caminhos[p.a]).toBe(caminhos[p.b]);
  });

  it("Champions da Ásia: liga do Oeste e do Leste, oitavas dentro da região pela campanha", () => {
    const c = comp({
      tipo: "continental",
      escopo: { tipo: "confederacao", confederacao: "AFC" },
      divisao: undefined,
      calendario: { inicio: "09-15", fim: "05-31" },
      participantes: { fixos: [], quantidade: 32 },
      fases: [
        {
          id: "liga",
          nome: "Fase de liga",
          tipo: "fase-de-liga",
          jogosPorTime: 8,
          potes: 4,
          grupos: 2,
          classificamDireto: 8,
        },
        {
          id: "oitavas",
          nome: "Oitavas",
          tipo: "mata-mata",
          jogos: 2,
          chaveamento: "caminhos-campanha",
        },
        { id: "final", nome: "Fase final", tipo: "mata-mata", jogos: 1, mando: "neutro" },
      ],
    });
    const times32 = times("a", 32);
    const caminhos = Object.fromEntries(times32.map((t, i) => [t, i % 2 ? "leste" : "oeste"]));
    const e = jogarTudo(c, times32, "s", { caminhos });
    const liga = e.jogos.filter((j) => j.fase === 0);
    expect(liga).toHaveLength(32 * 4);
    for (const j of liga) expect(caminhos[j.casa]).toBe(caminhos[j.fora]);
    for (const t of times32)
      expect(liga.filter((j) => j.casa === t || j.fora === t)).toHaveLength(8);
    // Oitavas: os oito primeiros de cada região, 1º x 8º, 2º x 7º...
    for (const g of [0, 1]) {
      const tabela = tabelaDoGrupo(c, e, 0, g).map((l) => l.clube);
      expect(tabela).toHaveLength(16);
      const oitavas = e.jogos.filter(
        (j) => j.fase === 1 && j.chave === 0 && tabela.includes(j.casa),
      );
      const pares = new Set(oitavas.map((j) => [j.casa, j.fora].sort().join("-")));
      expect(pares.size).toBe(4);
      for (let i = 0; i < 4; i++)
        expect(pares.has([tabela[i]!, tabela[7 - i]!].sort().join("-"))).toBe(true);
    }
    expect(e.encerrada).toBe(true);
    expect(e.jogos.at(-1)!.neutro).toBe(true);
  });

  it("Copa Intercontinental: cada campeão chega na sua fase, com folgas no Dérbi e na Challenger", () => {
    const vaga = (de: string, depois = false) => ({
      de,
      criterio: "campeao" as const,
      fase: "final",
      depois,
    });
    const fase = (id: string, entramAqui: ReturnType<typeof vaga>[], neutro = false) => ({
      id,
      nome: id,
      tipo: "mata-mata" as const,
      jogos: 1,
      prorrogacao: true,
      chaveamento: "chave-fixa" as const,
      mando: neutro ? ("neutro" as const) : ("melhor-campanha" as const),
      entramAqui,
    });
    const c = comp({
      tipo: "intercontinental",
      escopo: { tipo: "mundial" },
      divisao: undefined,
      calendario: { inicio: "08-20", fim: "12-20" },
      participantes: { fixos: [], quantidade: 6 },
      fases: [
        fase("playoff", [vaga("asia"), vaga("oceania")]),
        fase("africa", [vaga("africa")]),
        fase("derbi", [vaga("concacaf"), vaga("conmebol", true)], true),
        fase("final", [vaga("uefa")], true),
      ] as CompeticaoEntrada["fases"],
    });
    let e = montarCompeticao(c, [], "2027-01-01", {
      datasFifa: SEM_FIFA,
      semente: "s",
      temporada: "2027",
      quantidadePlanejada: 2,
    });
    // Ninguém ainda: a primeira fase espera os campeões.
    expect(e.aguardando).toBe(0);
    expect(e.jogos).toHaveLength(0);
    expect(e.datas).toHaveLength(5);
    const jogar = () => {
      const rng = new Rng("j");
      for (const [i, j] of e.jogos.entries()) {
        if (j.placar) continue;
        const d = desempateDoJogo(c, e, j);
        const r = simularRapido(rng, forca(j.casa), forca(j.fora), {
          ...(j.neutro ? { neutro: true } : {}),
          desempate: d.desempate,
        });
        e = lancarResultado(e, i, r.placar, r.penaltis);
      }
      e = avancarCompeticao(c, e, "s");
    };
    // O campeão da Champions chega cedo (junho) e espera a final.
    e = receberEntrantes(c, e, 3, { 0: ["t1"] }, "s");
    e = receberEntrantes(c, e, 0, { 0: ["t5"], 1: ["t9"] }, "s");
    expect(e.jogos).toHaveLength(1);
    expect(e.jogos[0]).toMatchObject({ casa: "t5", fora: "t9" });
    jogar();
    e = receberEntrantes(c, e, 1, { 0: ["t6"] }, "s");
    expect(e.jogos[1]?.casa).toBe("t6");
    jogar();
    const africa = e.fases[1]!.chaves![0]![0]!.vencedor!;
    e = receberEntrantes(c, e, 2, { 0: ["t3"], 1: ["t2"] }, "s");
    // Dérbi das Américas: CONCACAF x CONMEBOL; o vencedor da Copa África-Ásia-Pacífico folga.
    const derbi = e.jogos.filter((j) => j.fase === 2);
    expect(derbi).toHaveLength(1);
    expect([derbi[0]!.casa, derbi[0]!.fora].sort()).toEqual(["t2", "t3"]);
    expect(derbi[0]!.neutro).toBe(true);
    jogar();
    // Copa Challenger: vencedor do Dérbi x vencedor da Copa África-Ásia-Pacífico; a Champions folga.
    const challenger = e.jogos.filter((j) => j.fase === 3);
    expect(challenger).toHaveLength(1);
    expect([challenger[0]!.casa, challenger[0]!.fora]).toContain(africa);
    expect([challenger[0]!.casa, challenger[0]!.fora]).not.toContain("t1");
    jogar();
    const final = e.jogos.filter((j) => j.fase === 3).at(-1)!;
    expect([final.casa, final.fora]).toContain("t1");
    jogar();
    expect(e.encerrada).toBe(true);
    expect(e.jogos).toHaveLength(5);
  });

  it("Série B de 2026: 3º x 6º e 4º x 5º em ida e volta, e os dois vencedores sobem", () => {
    const c = comp({
      fases: [
        {
          id: "pc",
          nome: "Pontos corridos",
          tipo: "grupos",
          grupos: 1,
          turnos: 2,
          faixaClassificada: { de: 3, ate: 6 },
        },
        {
          id: "po",
          nome: "Playoffs",
          tipo: "mata-mata",
          jogos: 2,
          chaveamento: "campanha",
          mando: "melhor-campanha",
          eliminatorias: 1,
        },
      ],
      movimentos: [
        { tipo: "acesso", para: "a", posicoes: [1, 2] },
        { tipo: "playoff-acesso", para: "a", posicoes: [3, 4, 5, 6] },
      ],
    });
    const e = jogarTudo(c, times("B", 20));
    const tabela = tabelaDoGrupo(c, e, 0, 0).map((l) => l.clube);
    expect(e.jogos.filter((j) => j.fase === 1)).toHaveLength(4);
    expect(e.vencedoresPlayoff).toHaveLength(2);
    const sobem = movimentosDaTemporada(c, e).filter((m) => m.tipo === "acesso");
    expect(sobem).toHaveLength(4);
    // Um vencedor de cada confronto (3º ou 6º; 4º ou 5º).
    const [x, y] = e.vencedoresPlayoff!;
    expect([tabela[2], tabela[5]]).toContain(x);
    expect([tabela[3], tabela[4]]).toContain(y);
  });

  it("liga em grupos: o 1º de cada grupo sobe e o playoff junta a faixa de todos os grupos", () => {
    const c = comp({
      participantes: { fixos: [], quantidade: 20 },
      fases: [
        {
          id: "t",
          nome: "Temporada",
          tipo: "grupos",
          grupos: 2,
          turnos: 2,
          divisaoGrupos: "ordem-da-lista",
          faixaClassificada: { de: 2, ate: 5 },
        },
        {
          id: "po",
          nome: "Playoffs",
          tipo: "mata-mata",
          jogos: 2,
          chaveamento: "campanha",
          mando: "melhor-campanha",
          eliminatorias: 2,
        },
      ],
      movimentos: [
        { tipo: "acesso", para: "a", posicoes: [1], porGrupo: true },
        { tipo: "playoff-acesso", para: "a", posicoes: [2, 3, 4, 5], porGrupo: true },
      ],
    });
    const e = jogarTudo(c, times("F", 20));
    expect(e.fases[1]?.times).toHaveLength(8);
    expect(e.vencedoresPlayoff).toHaveLength(2);
    const sobem = movimentosDaTemporada(c, e).filter((m) => m.tipo === "acesso");
    expect(sobem).toHaveLength(4);
    for (const g of [0, 1])
      expect(sobem.map((m) => m.clube)).toContain(tabelaDoGrupo(c, e, 0, g)[0]?.clube);
  });

  it("copa com lugares do real: os que faltam viram folga para os primeiros e o de baixo manda", () => {
    const fase = (id: string, o: Record<string, unknown> = {}) => ({
      id,
      nome: id,
      tipo: "mata-mata" as const,
      jogos: 1,
      chaveamento: "sorteio" as const,
      mando: "menor-divisao" as const,
      ...o,
    });
    const c = comp({
      tipo: "copa",
      divisao: undefined,
      participantes: { fixos: [], quantidade: 11 },
      fases: [
        // 12 lugares e 9 clubes: 3 folgas para os primeiros e 3 jogos, 6 seguem.
        fase("primeira", { lugares: 12, chaveamento: "potes" }),
        fase("segunda", {
          entramAqui: [{ de: "liga", criterio: "posicoes", posicoes: [1, 2] }],
        }),
        fase("semi"),
        fase("final", { mando: "neutro" }),
      ] as CompeticaoEntrada["fases"],
    });
    const clubes = times("D", 9);
    // D1 a D3 na 1ª divisão, D4 a D6 na 2ª, D7 a D9 fora das ligas (amadores).
    const divisoes = { D1: 1, D2: 1, D3: 1, D4: 2, D5: 2, D6: 2, X1: 1, X2: 1 };
    const e = jogarTudo(c, clubes, "s", { entrantes: { "1.0": ["X1", "X2"] }, divisoes });
    const primeira = e.fases[0]!.chaves![0]!;
    expect(primeira.filter((p) => !p.b).map((p) => p.a)).toEqual(["D1", "D2", "D3"]);
    expect(primeira.filter((p) => p.b)).toHaveLength(3);
    expect(e.fases[1]?.times).toHaveLength(8);
    // Jogo único com o mando do clube de divisão mais baixa (quem não tem liga conta como a última).
    const div = (x: string) => divisoes[x as keyof typeof divisoes] ?? 99;
    for (const j of e.jogos.filter((j) => j.fase < 3)) {
      if (div(j.casa) !== div(j.fora)) expect(div(j.casa)).toBeGreaterThan(div(j.fora));
    }
    expect(e.encerrada).toBe(true);
    expect(e.jogos.at(-1)?.neutro).toBe(true);
  });

  it("datas fixas: as rodadas caem nos dias marcados, mesmo virando o ano", () => {
    const c = comp({
      tipo: "selecoes",
      categoria: "selecoes",
      escopo: { tipo: "confederacao", confederacao: "UEFA" },
      divisao: undefined,
      calendario: { inicio: "09-24", fim: "06-13" },
      participantes: { fixos: ["AAA", "BBB", "CCC", "DDD"], quantidade: 4 },
      fases: [
        {
          id: "liga",
          nome: "Liga",
          tipo: "grupos",
          grupos: 1,
          turnos: 2,
          classificamPorGrupo: 2,
          periodo: { inicio: "09-24", fim: "11-17" },
          datas: ["09-25", "09-28", "10-02", "10-05", "11-13", "11-16"],
        },
        {
          id: "final",
          nome: "Final",
          tipo: "mata-mata",
          jogos: 1,
          chaveamento: "campanha",
          mando: "neutro",
          periodo: { inicio: "06-13", fim: "06-13" },
          datas: ["06-13"],
        },
      ] as CompeticaoEntrada["fases"],
    });
    const e = montarCompeticao(c, ["AAA", "BBB", "CCC", "DDD"], "2026-09-24", {
      datasFifa: SEM_FIFA,
      semente: "s",
      temporada: "2026/27",
    });
    expect(e.datas).toEqual([
      "2026-09-25",
      "2026-09-28",
      "2026-10-02",
      "2026-10-05",
      "2026-11-13",
      "2026-11-16",
      "2027-06-13",
    ]);
  });

  it("eliminatórias: diretos, melhor segundo e playoff com quem sobrou", () => {
    const c = comp({
      tipo: "eliminatorias",
      categoria: "selecoes",
      escopo: { tipo: "confederacao", confederacao: "UEFA" },
      divisao: undefined,
      participantes: { fixos: [], quantidade: 6 },
      fases: [
        { id: "grupos", nome: "Grupos", tipo: "grupos", grupos: 2, turnos: 2 },
        {
          id: "playoffs",
          nome: "Playoffs",
          tipo: "mata-mata",
          jogos: 1,
          chaveamento: "campanha",
          mando: "neutro",
          limiteDeEntradas: 2,
          entramAqui: [
            {
              de: "teste",
              criterio: "posicoes",
              fase: "grupos",
              porGrupo: true,
              posicoes: [2, 3],
              foraDosClassificados: true,
            },
          ],
        },
      ] as CompeticaoEntrada["fases"],
      classificados: [
        { fase: "grupos", posicoes: [1], porGrupo: true },
        { fase: "grupos", posicoes: [2], porGrupo: true, melhores: 1 },
        { fase: "playoffs", vencedores: true },
      ],
    });
    const e = jogarTudo(c, ["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(e.encerrada).toBe(true);
    const diretos = classificadosPelasRegras(c, e, 1);
    expect(diretos).toHaveLength(3);
    // O playoff tem 2: o segundo que não foi direto e o melhor terceiro, nenhum dos diretos.
    const playoff = e.fases[1]!.times;
    expect(playoff).toHaveLength(2);
    expect(playoff.some((t) => diretos.includes(t))).toBe(false);
    expect(e.classificados).toHaveLength(4);
    expect(new Set(e.classificados).size).toBe(4);
    expect(e.classificados!.slice(0, 3)).toEqual(diretos);
  });

  it("Copa: anfitriões na frente, classificados de outras com recorte e repescagem com perdedores", () => {
    const fase = (id: string, o: Record<string, unknown> = {}) => ({
      id,
      nome: id,
      tipo: "mata-mata" as const,
      jogos: 1,
      chaveamento: "campanha" as const,
      mando: "neutro" as const,
      ...o,
    });
    // Eliminatórias com 4: a final dá o campeão e o vice (perdedores) como classificados.
    const elim = comp({
      id: "elim",
      tipo: "eliminatorias",
      categoria: "selecoes",
      escopo: { tipo: "confederacao", confederacao: "OFC" },
      divisao: undefined,
      participantes: { fixos: ["AAA", "BBB", "CCC", "DDD"], quantidade: 4 },
      fases: [
        fase("semi"),
        fase("final", { chaveamento: "chave-fixa" }),
      ] as CompeticaoEntrada["fases"],
      classificados: [
        { fase: "final", vencedores: true },
        { fase: "final", perdedores: true },
      ],
    });
    const e1 = jogarTudo(elim, ["AAA", "BBB", "CCC", "DDD"]);
    expect(e1.classificados).toHaveLength(2);
    expect(e1.classificados![0]).toBe(e1.campeao);
    // A Copa: 2 anfitriões fixos e o campeão das eliminatórias (maximo 1); o vice fica de fora.
    const copa = comp({
      id: "copa",
      tipo: "selecoes",
      categoria: "selecoes",
      escopo: { tipo: "mundial" },
      divisao: undefined,
      participantes: { fixos: ["HHH", "III"], quantidade: 3 },
      fases: [
        fase("final", {
          todosJogam: true,
          entramAqui: [{ de: "elim", criterio: "classificados", maximo: 1, quantidade: 1 }],
        }),
      ] as CompeticaoEntrada["fases"],
    });
    let e2 = montarCompeticao(copa, ["HHH", "III"], "2027-01-10", {
      datasFifa: SEM_FIFA,
      semente: "s",
      temporada: "2027",
    });
    expect(e2.aguardando).toBe(0);
    const lista = resolverVagaDinamica(elim, e1, {
      criterio: "classificados",
      porGrupo: false,
      maximo: 1,
    });
    expect(lista).toEqual([e1.campeao]);
    expect(
      resolverVagaDinamica(elim, e1, { criterio: "classificados", porGrupo: false, pular: 1 }),
    ).toEqual([e1.classificados![1]]);
    e2 = receberEntrantes(copa, e2, 0, { 0: lista! }, "s");
    // Os anfitriões vêm na frente da lista da fase.
    expect(e2.fases[0]?.times.slice(0, 2)).toEqual(["HHH", "III"]);
    expect(e2.fases[0]?.times).toHaveLength(3);
  });

  it("datas com * pulam para o ano seguinte", () => {
    const c = comp({
      tipo: "eliminatorias",
      categoria: "selecoes",
      escopo: { tipo: "confederacao", confederacao: "CONCACAF" },
      divisao: undefined,
      calendario: { inicio: "06-01", fim: "11-30" },
      participantes: { fixos: ["AAA", "BBB"], quantidade: 2 },
      fases: [
        {
          id: "liga",
          nome: "Liga",
          tipo: "grupos",
          grupos: 1,
          turnos: 2,
          periodo: { inicio: "06-01", fim: "11-30" },
          datas: ["06-04", "*09-24"],
        },
      ] as CompeticaoEntrada["fases"],
    });
    const e = montarCompeticao(c, ["AAA", "BBB"], "2028-06-01", {
      datasFifa: SEM_FIFA,
      semente: "s",
      temporada: "2028",
    });
    expect(e.datas).toEqual(["2028-06-04", "2029-09-24"]);
  });

  it("movimento com anos: só vale nas temporadas dele (ampliação da Série C)", () => {
    const c = comp({
      fases: [{ id: "t", nome: "Temporada", tipo: "grupos", grupos: 1, turnos: 1 }],
      movimentos: [
        { tipo: "rebaixamento", para: "d", posicoes: [9, 10], ate: 2027 },
        { tipo: "rebaixamento", para: "d", posicoes: [5, 6, 7, 8, 9, 10], desde: 2028 },
      ],
    });
    const e = jogarTudo(c, times("C", 10));
    expect(e.temporada).toBe("2027");
    expect(movimentosDaTemporada(c, e)).toHaveLength(2);
    expect(movimentosDaTemporada(c, { ...e, temporada: "2028" })).toHaveLength(6);
  });
});
