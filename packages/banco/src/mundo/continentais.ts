/**
 * Copas continentais de clubes, no formato real de cada confederação: a CONMEBOL aqui (etapa 10a2),
 * a UEFA em uefa.ts (10a3) e CONCACAF, AFC, CAF e OFC em confederacoes.ts (10a4). As vagas saem das
 * ligas e das copas de cada país pela temporada anterior (na primeira, pela força do elenco); a
 * competição de baixo exclui quem já está na de cima e recebe os eliminados dela.
 */
import type { CompeticaoEntrada } from "@newbras/data";
import { OUTRAS_CONFEDERACOES } from "./confederacoes";
import { UEFA } from "./uefa";

type Fase = CompeticaoEntrada["fases"][number];

// ---------------------------------------------------------------------- CONMEBOL (2026)

type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];
const posicoes = (de: string, ...p: number[]): Vaga => ({
  de,
  criterio: "posicoes",
  posicoes: p,
  repassa: true,
});
const campeao = (de: string): Vaga => ({ de, criterio: "campeao" });
const periodo = (inicio: string, fim: string) => ({ inicio, fim });

/** Eliminatória de ida e volta (CONMEBOL: empate no agregado vai direto aos pênaltis). */
const eliminatoria = (
  id: string,
  nome: string,
  inicio: string,
  fim: string,
  extra: Partial<Fase> = {},
): Fase =>
  ({
    id,
    nome,
    tipo: "mata-mata",
    jogos: 2,
    prorrogacao: false,
    penaltis: true,
    chaveamento: "sorteio",
    mando: "melhor-campanha",
    periodo: periodo(inicio, fim),
    ...extra,
  }) as Fase;

/** Oitavas à final: ida e volta, final em jogo único em campo neutro (com prorrogação). */
const fasesFinais = (inicio: string, fim: string, entramAqui: Vaga[] = []): Fase => ({
  id: "mata-mata",
  nome: "Mata-mata",
  tipo: "mata-mata",
  jogos: 2,
  finalJogoUnico: true,
  prorrogacao: false,
  prorrogacaoNaFinal: true,
  penaltis: true,
  chaveamento: "potes",
  mando: "neutro",
  periodo: periodo(inicio, fim),
  entramAqui,
});

const LIGA = {
  BRA: "bra-serie-a",
  ARG: "arg-liga-profesional",
  BOL: "bol-division-profesional",
  CHI: "chi-primera",
  COL: "col-primera-a",
  ECU: "ecu-ligapro",
  PAR: "par-primera",
  PER: "per-liga-1",
  URU: "uru-primera",
  VEN: "ven-liga-futve",
} as const;
/** Os seis países que têm uma vaga na 1ª fase da Libertadores (o 4º de cada). */
const SEIS = ["BOL", "ECU", "PAR", "PER", "URU", "VEN"] as const;

/**
 * Libertadores 2026: 47 clubes. 1ª fase com 6 (o 4º de Bolívia, Equador, Paraguai, Peru, Uruguai e
 * Venezuela), 2ª fase com mais 13, 3ª fase com 8; os 4 vencedores vão aos grupos com os 28 que
 * entram direto (o campeão da Libertadores e o da Sul-Americana como vagas extras do país). Grupos
 * por potes, sem clubes do mesmo país juntos; os 3º colocados vão para o playoff da Sul-Americana;
 * oitavas com os primeiros contra os segundos; final única em campo neutro.
 */
const LIBERTADORES: CompeticaoEntrada = {
  id: "conmebol-libertadores",
  nome: "Copa Libertadores da América",
  nomeCurto: "Libertadores",
  tipo: "continental",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
  calendario: periodo("02-01", "11-28"),
  campeaoAnterior: { temporada: "2025", campeao: "bra-flamengo", vice: "bra-palmeiras" },
  participantes: {
    fixos: [],
    vagas: SEIS.map((p) => posicoes(LIGA[p], 4)),
    quantidade: 47,
  },
  fases: [
    eliminatoria("fase-1", "1ª fase", "02-03", "02-12"),
    eliminatoria("fase-2", "2ª fase", "02-17", "02-26", {
      entramAqui: [
        posicoes(LIGA.BRA, 5, 6),
        posicoes(LIGA.ARG, 5),
        posicoes(LIGA.CHI, 3, 4),
        posicoes(LIGA.COL, 3, 4),
        ...SEIS.map((p) => posicoes(LIGA[p], 3)),
      ],
    }),
    eliminatoria("fase-3", "3ª fase", "03-03", "03-12"),
    {
      id: "grupos",
      nome: "Fase de grupos",
      tipo: "grupos",
      grupos: 8,
      turnos: 2,
      classificamPorGrupo: 2,
      divisaoGrupos: "potes",
      periodo: periodo("04-07", "05-28"),
      entramAqui: [
        campeao("conmebol-libertadores"),
        campeao("conmebol-sul-americana"),
        campeao("bra-copa-do-brasil"),
        posicoes(LIGA.BRA, 1, 2, 3, 4),
        campeao("arg-copa-argentina"),
        posicoes(LIGA.ARG, 1, 2, 3, 4),
        ...(["BOL", "CHI", "COL", "ECU", "PAR", "PER", "URU", "VEN"] as const).map((p) =>
          posicoes(LIGA[p], 1, 2),
        ),
      ],
    },
    fasesFinais("08-11", "11-28"),
  ],
};

/**
 * Sul-Americana 2026: 1ª fase com 32 clubes (4 de cada país menos Brasil e Argentina) em jogo único
 * entre clubes do mesmo país; grupos com os 16 vencedores, 6 do Brasil, 6 da Argentina e os 4
 * eliminados da 3ª fase da Libertadores (pote 4); os primeiros vão às oitavas e os segundos jogam o
 * playoff contra os 3º colocados dos grupos da Libertadores; final única em campo neutro.
 */
const SUL_AMERICANA: CompeticaoEntrada = {
  id: "conmebol-sul-americana",
  nome: "Copa Sul-Americana",
  nomeCurto: "Sul-Americana",
  tipo: "continental",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
  calendario: periodo("03-01", "11-21"),
  campeaoAnterior: { temporada: "2025", campeao: "arg-lanus", vice: "bra-atletico-mg" },
  participantes: {
    fixos: [],
    vagas: (["BOL", "CHI", "COL", "ECU", "PAR", "PER", "URU", "VEN"] as const).map((p) =>
      posicoes(LIGA[p], 1, 2, 3, 4),
    ),
    exclui: ["conmebol-libertadores"],
    quantidade: 56,
  },
  fases: [
    {
      id: "primeira-fase",
      nome: "1ª fase",
      tipo: "mata-mata",
      jogos: 1,
      prorrogacao: false,
      penaltis: true,
      chaveamento: "pais",
      mando: "sorteio",
      periodo: periodo("03-03", "03-05"),
    },
    {
      id: "grupos",
      nome: "Fase de grupos",
      tipo: "grupos",
      grupos: 8,
      turnos: 2,
      classificamPorGrupo: 0,
      divisaoGrupos: "potes",
      periodo: periodo("04-07", "05-28"),
      entramAqui: [
        posicoes(LIGA.BRA, 1, 2, 3, 4, 5, 6),
        posicoes(LIGA.ARG, 1, 2, 3, 4, 5, 6),
        {
          de: "conmebol-libertadores",
          criterio: "eliminados",
          fase: "fase-3",
          quantidade: 4,
          depois: true,
        },
      ],
    },
    eliminatoria("playoffs", "Playoffs", "07-14", "07-23", {
      chaveamento: "potes",
      entramAqui: [
        // Os 3º da Libertadores são a metade de cima: decidem em casa.
        {
          de: "conmebol-libertadores",
          criterio: "posicoes",
          fase: "grupos",
          posicoes: [3],
          porGrupo: true,
          quantidade: 8,
        },
        {
          de: "conmebol-sul-americana",
          criterio: "posicoes",
          fase: "grupos",
          posicoes: [2],
          porGrupo: true,
          quantidade: 8,
        },
      ],
    }),
    fasesFinais("08-11", "11-21", [
      {
        de: "conmebol-sul-americana",
        criterio: "posicoes",
        fase: "grupos",
        posicoes: [1],
        porGrupo: true,
        quantidade: 8,
      },
    ]),
  ],
};

const CONMEBOL: readonly CompeticaoEntrada[] = [LIBERTADORES, SUL_AMERICANA];

export const CONTINENTAIS: readonly CompeticaoEntrada[] = [
  ...CONMEBOL,
  ...UEFA,
  ...OUTRAS_CONFEDERACOES,
];
