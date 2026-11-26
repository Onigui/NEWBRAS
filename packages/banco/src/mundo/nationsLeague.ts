/**
 * UEFA Nations League 2026/27 (etapa 11a), com os grupos do sorteio de 12/02/2026 e as rodadas nas
 * datas reais: seis na fase de liga (quatro entre setembro e outubro e duas em novembro de 2026),
 * quartas da Liga A em ida e volta em março de 2027 e a fase final em junho.
 *
 * Ainda fora: o jogo do 3º lugar da fase final, os playoffs de acesso e rebaixamento entre as ligas
 * (março de 2027) e a ligação com as eliminatórias da Euro 2028. A edição de 2028/29 passa a três
 * ligas, com a composição que sair daqui.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];

/** Seis rodadas da fase de liga, uma por dia de jogo da janela (24/09 a 17/11). */
const RODADAS = ["09-25", "09-28", "10-02", "10-05", "11-13", "11-16"];
const DESEMPATE_UEFA: CompeticaoEntrada["desempate"] = [
  "pontos",
  "confronto-direto",
  "saldo-confronto-direto",
  "saldo",
  "gols-pro",
  "vitorias",
];

function faseDeLiga(grupos: number, classificam = 0): Fase {
  return {
    id: "fase-de-liga",
    nome: "Fase de liga",
    tipo: "grupos",
    grupos,
    turnos: 2,
    classificamPorGrupo: classificam,
    divisaoGrupos: "ordem-da-lista",
    periodo: { inicio: "09-24", fim: "11-17" },
    datas: RODADAS,
    entramAqui: [],
  } as Fase;
}

function liga(o: {
  letra: "A" | "B" | "C" | "D";
  grupos: string[][];
  fases?: Fase[];
}): CompeticaoEntrada {
  const fixos = o.grupos.flat();
  const comFinal = !!o.fases?.length;
  return {
    id: `uefa-nations-league-${o.letra.toLowerCase()}`,
    nome: `UEFA Nations League ${o.letra}`,
    nomeCurto: `Nations League ${o.letra}`,
    tipo: "selecoes",
    categoria: "selecoes",
    escopo: { tipo: "confederacao", confederacao: "UEFA" },
    divisao: { A: 1, B: 2, C: 3, D: 4 }[o.letra],
    periodicidade: { aCadaAnos: 2, anoBase: 2027 },
    // Os grupos do sorteio de 2026; nas edições seguintes, sorteio novo.
    gruposFixosAte: 2027,
    // Todas as ligas com a temporada de setembro a junho (a das edições de anos ímpares no fim).
    calendario: { inicio: "09-24", fim: "06-13" },
    participantes: { fixos, quantidade: fixos.length },
    fases: [faseDeLiga(o.grupos.length, comFinal ? 2 : 0), ...(o.fases ?? [])],
    desempate: DESEMPATE_UEFA,
    ...(o.letra === "A"
      ? { campeaoAnterior: { temporada: "2024/25", campeao: "POR", vice: "ESP" } }
      : {}),
  } as CompeticaoEntrada;
}

const mataMata = (
  id: string,
  nome: string,
  janela: [string, string],
  datas: string[],
  o: Partial<Extract<Fase, { tipo: "mata-mata" }>>,
): Fase =>
  ({
    id,
    nome,
    tipo: "mata-mata",
    jogos: 1,
    prorrogacao: true,
    penaltis: true,
    chaveamento: "chave-fixa",
    mando: "neutro",
    periodo: { inicio: janela[0], fim: janela[1] },
    datas,
    entramAqui: [],
    ...o,
  }) as Fase;

export const NATIONS_LEAGUE: readonly CompeticaoEntrada[] = [
  liga({
    letra: "A",
    grupos: [
      ["FRA", "ITA", "BEL", "TUR"],
      ["GER", "NED", "SRB", "GRE"],
      ["ESP", "CRO", "ENG", "CZE"],
      ["POR", "DEN", "NOR", "WAL"],
    ],
    fases: [
      // 1º de um grupo contra o 2º de outro, sorteado; o 1º manda a volta.
      mataMata("quartas", "Quartas de final", ["03-25", "03-30"], ["03-25", "03-28"], {
        jogos: 2,
        chaveamento: "potes",
        evitarMesmoGrupo: true,
        mando: "melhor-campanha",
      }),
      mataMata("semifinal", "Semifinal", ["06-09", "06-10"], ["06-09"], {}),
      mataMata("final", "Final", ["06-13", "06-13"], ["06-13"], {}),
    ],
  }),
  liga({
    letra: "B",
    grupos: [
      ["SCO", "SUI", "SVN", "MKD"],
      ["HUN", "UKR", "GEO", "NIR"],
      ["ISR", "AUT", "IRL", "KVX"],
      ["POL", "BIH", "ROU", "SWE"],
    ],
  }),
  liga({
    letra: "C",
    grupos: [
      ["ALB", "FIN", "BLR", "SMR"],
      ["MNE", "ARM", "CYP", "LVA"],
      ["KAZ", "SVK", "FRO", "MDA"],
      ["ISL", "BUL", "EST", "LUX"],
    ],
  }),
  liga({
    letra: "D",
    grupos: [
      ["GIB", "MLT", "AND"],
      ["LTU", "AZE", "LIE"],
    ],
  }),
];
