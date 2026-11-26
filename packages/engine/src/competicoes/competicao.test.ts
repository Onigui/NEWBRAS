import { describe, expect, it } from "vitest";
import { Competicao, type CompeticaoEntrada } from "@newbras/data";
import { Rng } from "../rng";
import {
  avancarCompeticao,
  desempateDoJogo,
  jogosDoDia,
  lancarResultado,
  montarCompeticao,
  movimentosDaTemporada,
  receberEntrantes,
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
  extra: { caminhos?: Record<string, string> } = {},
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
});
