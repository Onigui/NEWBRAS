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
function jogarTudo(c: Competicao, participantes: string[], semente = "s"): EstadoCompeticao {
  let e = montarCompeticao(c, participantes, "2027-01-10", {
    datasFifa: SEM_FIFA,
    semente,
    temporada: "2027",
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
});
