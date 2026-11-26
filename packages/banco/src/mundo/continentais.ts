/**
 * Copas continentais de clubes (etapa 10a). As vagas saem das ligas e das copas de cada país, pela
 * temporada anterior (na primeira, pela força do elenco). A segunda e a terceira competição de cada
 * confederação excluem quem já está na de cima: a vaga passa para o próximo da tabela.
 *
 * Formatos simplificados do real, sem as fases preliminares: Libertadores e Sul-Americana com 32
 * na fase de grupos; Champions, Europa e Conference League com fase de liga de 36 e playoff do 9º
 * ao 24º; Copa dos Campeões da CONCACAF em mata-mata; Champions League da AFC com fase de liga de
 * 24; CAF com grupos; OFC com dois grupos de 4.
 */
import type { CompeticaoEntrada, Confederacao } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];

/** Vagas de um país: liga principal, quantas vagas e, se o campeão da copa ganha uma, a copa. */
type VagasDoPais = readonly [liga: string, quantas: number, copa?: string];

function vagasDe(paises: readonly VagasDoPais[]): CompeticaoEntrada["participantes"]["vagas"] {
  return paises.flatMap(([liga, n, copa]) => {
    const daLiga = copa ? n - 1 : n;
    return [
      // O campeão da copa primeiro: se ele já tiver vaga pela liga, ela passa ao próximo da tabela.
      ...(copa ? [{ de: copa, criterio: "campeao" as const }] : []),
      ...(daLiga > 0
        ? [
            {
              de: liga,
              criterio: "posicoes" as const,
              posicoes: Array.from({ length: daLiga }, (_, i) => i + 1),
              repassa: true,
            },
          ]
        : []),
    ];
  });
}

const total = (paises: readonly VagasDoPais[]) => paises.reduce((s, [, n]) => s + n, 0);

function continental(o: {
  id: string;
  nome: string;
  nomeCurto: string;
  confederacao: Confederacao;
  calendario: { inicio: string; fim: string };
  paises: readonly VagasDoPais[];
  exclui?: string[];
  fases: Fase[];
}): CompeticaoEntrada {
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: "continental",
    categoria: "clubes",
    escopo: { tipo: "confederacao", confederacao: o.confederacao },
    calendario: o.calendario,
    participantes: {
      fixos: [],
      vagas: vagasDe(o.paises),
      exclui: o.exclui ?? [],
      quantidade: total(o.paises),
    },
    fases: o.fases,
  };
}

/** Fase de grupos em ida e volta com os dois primeiros de cada grupo seguindo. */
const grupos = (n: number, turnos = 2, classificam = 2): Fase => ({
  id: "grupos",
  nome: "Fase de grupos",
  tipo: "grupos",
  grupos: n,
  turnos,
  classificamPorGrupo: classificam,
});

/** Mata-mata até o campeão: ida e volta, com final em jogo único (neutro) ou também em dois jogos. */
const mataMata = (
  o: {
    finalUnica?: boolean;
    mandoFinal?: "neutro" | "melhor-campanha";
    chaveamento?: "campanha" | "sorteio";
  } = {},
): Fase => ({
  id: "mata-mata",
  nome: "Mata-mata",
  tipo: "mata-mata",
  jogos: 2,
  finalJogoUnico: o.finalUnica ?? true,
  prorrogacao: true,
  penaltis: true,
  chaveamento: o.chaveamento ?? "campanha",
  mando: o.mandoFinal ?? "neutro",
});

/** Fase de liga da UEFA: 36 times, 8 primeiros às oitavas e playoff do 9º ao 24º. */
const faseDeLiga = (jogos: number, n = 36): Fase[] => [
  {
    id: "fase-de-liga",
    nome: "Fase de liga",
    tipo: "fase-de-liga",
    jogosPorTime: jogos,
    potes: 4,
    classificamDireto: n === 36 ? 8 : 16,
    ...(n === 36 ? { playoff: { de: 9, ate: 24 } } : {}),
  },
  ...(n === 36
    ? [
        {
          id: "playoff",
          nome: "Playoff",
          tipo: "mata-mata" as const,
          jogos: 2 as const,
          prorrogacao: true,
          penaltis: true,
          chaveamento: "campanha" as const,
          mando: "melhor-campanha" as const,
        },
      ]
    : []),
  mataMata(),
];

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
  // ------------------------------------------------------------------ UEFA
  continental({
    id: "uefa-champions-league",
    nome: "UEFA Champions League",
    nomeCurto: "Champions League",
    confederacao: "UEFA",
    calendario: { inicio: "09-15", fim: "05-31" },
    paises: [
      ["eng-premier-league", 5],
      ["esp-laliga", 5],
      ["ita-serie-a", 4],
      ["ger-bundesliga", 4],
      ["fra-ligue-1", 3],
      ["por-liga-portugal", 2],
      ["ned-eredivisie", 2],
      ["bel-pro-league", 1],
      ["tur-super-lig", 1],
      ["sco-premiership", 1],
      ["aut-bundesliga", 1],
      ["sui-super-league", 1],
      ["gre-super-league", 1],
      ["den-superliga", 1],
      ["cze-chance-liga", 1],
      ["nor-eliteserien", 1],
      ["cro-hnl", 1],
      ["srb-superliga", 1],
    ],
    fases: faseDeLiga(8),
  }),
  continental({
    id: "uefa-europa-league",
    nome: "UEFA Europa League",
    nomeCurto: "Europa League",
    confederacao: "UEFA",
    calendario: { inicio: "09-15", fim: "05-24" },
    exclui: ["uefa-champions-league"],
    paises: [
      ["eng-premier-league", 2, "eng-fa-cup"],
      ["esp-laliga", 2, "esp-copa-del-rey"],
      ["ita-serie-a", 2, "ita-coppa-italia"],
      ["ger-bundesliga", 2, "ger-dfb-pokal"],
      ["fra-ligue-1", 2, "fra-coupe-de-france"],
      ["por-liga-portugal", 2, "por-taca-de-portugal"],
      ["ned-eredivisie", 2, "ned-knvb-beker"],
      ["bel-pro-league", 2, "bel-copa"],
      ["tur-super-lig", 2, "tur-copa"],
      ["sco-premiership", 1, "sco-scottish-cup"],
      ["aut-bundesliga", 2, "aut-ofb-cup"],
      ["sui-super-league", 1, "sui-copa"],
      ["gre-super-league", 2, "gre-copa"],
      ["den-superliga", 1, "den-landspokal"],
      ["cze-chance-liga", 2],
      ["nor-eliteserien", 2],
      ["cro-hnl", 1],
      ["srb-superliga", 1],
      ["pol-ekstraklasa", 2],
      ["ukr-premier-league", 1],
      ["isr-ligat-haal", 1],
      ["hun-nb-i", 1],
    ],
    fases: faseDeLiga(8),
  }),
  continental({
    id: "uefa-conference-league",
    nome: "UEFA Conference League",
    nomeCurto: "Conference League",
    confederacao: "UEFA",
    calendario: { inicio: "09-15", fim: "05-28" },
    exclui: ["uefa-champions-league", "uefa-europa-league"],
    paises: [
      ["eng-premier-league", 1],
      ["esp-laliga", 1],
      ["ita-serie-a", 1],
      ["ger-bundesliga", 1],
      ["fra-ligue-1", 1],
      ["por-liga-portugal", 1],
      ["ned-eredivisie", 1],
      ["bel-pro-league", 1],
      ["tur-super-lig", 1],
      ["sco-premiership", 2],
      ["aut-bundesliga", 1],
      ["sui-super-league", 2],
      ["gre-super-league", 1],
      ["den-superliga", 2],
      ["swe-allsvenskan", 2, "swe-svenska-cupen"],
      ["cze-chance-liga", 1],
      ["nor-eliteserien", 1],
      ["cro-hnl", 1],
      ["srb-superliga", 1],
      ["pol-ekstraklasa", 2],
      ["ukr-premier-league", 1],
      ["isr-ligat-haal", 1],
      ["hun-nb-i", 1],
      ["rou-superliga", 1],
      ["cyp-first-division", 1],
      ["bul-efbet-liga", 1],
      ["svk-nike-liga", 1],
      ["svn-prvaliga", 1],
      ["aze-premier-league", 1],
      ["kaz-premier-league", 1],
      ["irl-premier-division", 1],
    ],
    fases: faseDeLiga(6),
  }),
  // ------------------------------------------------------------------ CONCACAF
  continental({
    id: "concacaf-champions-cup",
    nome: "Copa dos Campeões da CONCACAF",
    nomeCurto: "Copa dos Campeões",
    confederacao: "CONCACAF",
    calendario: { inicio: "02-04", fim: "06-01" },
    paises: [
      ["mex-liga-mx", 5],
      ["usa-mls", 5, "usa-open-cup"],
      ["can-cpl", 1],
      ["crc-liga-fpd", 2],
      ["hon-liga-nacional", 1],
      ["gua-liga-nacional", 1],
      ["pan-lpf", 1],
    ],
    fases: [mataMata({ mandoFinal: "melhor-campanha", chaveamento: "sorteio" })],
  }),
  // ------------------------------------------------------------------ AFC
  continental({
    id: "afc-champions-league",
    nome: "AFC Champions League Elite",
    nomeCurto: "Champions da Ásia",
    confederacao: "AFC",
    calendario: { inicio: "09-15", fim: "05-20" },
    paises: [
      ["ksa-pro-league", 4, "ksa-kings-cup"],
      ["jpn-j1", 3, "jpn-emperors-cup"],
      ["kor-k-league-1", 3, "kor-copa"],
      ["qat-stars-league", 3, "qat-emir-cup"],
      ["uae-pro-league", 2],
      ["irn-pro-league", 2],
      ["chn-super-league", 2],
      ["aus-a-league", 1],
      ["tha-thai-league-1", 1],
      ["uzb-super-league", 1],
      ["irq-stars-league", 1],
      ["mas-super-league", 1],
    ],
    fases: faseDeLiga(8, 24),
  }),
  // ------------------------------------------------------------------ CAF
  continental({
    id: "caf-champions-league",
    nome: "CAF Champions League",
    nomeCurto: "Champions da África",
    confederacao: "CAF",
    calendario: { inicio: "10-15", fim: "05-31" },
    paises: [
      ["egy-premier-league", 2],
      ["mar-botola-pro", 2],
      ["rsa-premiership", 2],
      ["tun-ligue-1", 2],
      ["alg-ligue-1", 2],
      ["ang-girabola", 1],
      ["nga-npfl", 1],
      ["tan-premier-league", 1],
      ["sen-ligue-1", 1],
      ["gha-premier-league", 1],
      ["civ-ligue-1", 1],
    ],
    fases: [grupos(4), mataMata({ finalUnica: false })],
  }),
  // ------------------------------------------------------------------ OFC
  continental({
    id: "ofc-champions-league",
    nome: "OFC Champions League",
    nomeCurto: "Champions da Oceania",
    confederacao: "OFC",
    calendario: { inicio: "03-01", fim: "05-31" },
    paises: [
      ["nzl-northern-league", 1],
      ["nzl-central-league", 1],
      ["fij-premier-league", 1],
      ["sol-s-league", 1],
      ["van-national-super-league", 1],
      ["ncl-super-ligue", 1],
      ["tah-ligue-1", 1],
      ["png-national-soccer-league", 1],
    ],
    fases: [
      grupos(2, 1, 2),
      {
        id: "mata-mata",
        nome: "Mata-mata",
        tipo: "mata-mata",
        jogos: 1,
        prorrogacao: true,
        penaltis: true,
        chaveamento: "campanha",
        mando: "neutro",
      },
    ],
  }),
];
