/**
 * Copas nacionais da Europa no formato real de 2026/27 (etapa 9e): cada divisão entra na rodada em
 * que entra no real, com o mando, a prorrogação e as datas de cada copa.
 *
 * O banco não tem os clubes amadores. Onde eles completam uma rodada no real, a rodada guarda os
 * lugares do real (`lugares`) e os que faltam viram folga para os melhores pela ordem de entrada: a
 * 1ª eliminatória da Copa del Rey tem 112 lugares e 78 clubes do banco, então 34 passam direto e os
 * outros 44 jogam. A rodada seguinte fica do tamanho real.
 *
 * "Os clubes que jogam competições europeias" (EFL Cup, KNVB Beker, Taça de Portugal) são os
 * primeiros da liga na temporada anterior, na quantidade de 2026/27.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type MataMata = Extract<Fase, { tipo: "mata-mata" }>;
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];

const faixa = (de: number, ate: number) => Array.from({ length: ate - de + 1 }, (_, i) => de + i);
/** Os colocados de `de` a `ate` da liga (pela temporada anterior; os que subiram vêm por último). */
const da = (liga: string, de: number, ate: number): Vaga => ({
  de: liga,
  criterio: "posicoes",
  posicoes: faixa(de, ate),
  repassa: true,
});
const periodo = (inicio: string, fim: string) => ({ inicio, fim });

function fase(id: string, nome: string, janela: [string, string], o: Partial<MataMata> = {}): Fase {
  return {
    id,
    nome,
    tipo: "mata-mata",
    jogos: 1,
    prorrogacao: true,
    penaltis: true,
    chaveamento: "sorteio",
    mando: "sorteio",
    periodo: periodo(...janela),
    entramAqui: [],
    ...o,
  } as Fase;
}

function copa(o: {
  id: string;
  nome: string;
  nomeCurto: string;
  pais: string;
  quantidade: number;
  vagas: Vaga[];
  fases: Fase[];
  campeaoAnterior?: CompeticaoEntrada["campeaoAnterior"];
}): CompeticaoEntrada {
  const inicio = o.fases[0]?.periodo?.inicio ?? "08-01";
  const fim = o.fases.at(-1)?.periodo?.fim ?? "05-31";
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: "copa",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: o.pais },
    calendario: periodo(inicio, fim),
    participantes: { fixos: [], vagas: o.vagas, quantidade: o.quantidade },
    fases: o.fases,
    ...(o.campeaoAnterior ? { campeaoAnterior: o.campeaoAnterior } : {}),
  };
}

const ENG = {
  pl: "eng-premier-league",
  ch: "eng-championship",
  l1: "eng-league-one",
  l2: "eng-league-two",
};

/**
 * FA Cup: League One e League Two estreiam na 1ª fase (80 lugares: os 32 não profissionais que
 * faltam viram folga), Premier League e Championship na 3ª fase, com 64. Jogo único com
 * prorrogação e pênaltis, sem replay; semifinal e final em Wembley.
 */
const FA_CUP = copa({
  id: "eng-fa-cup",
  nome: "FA Cup",
  nomeCurto: "FA Cup",
  pais: "ENG",
  quantidade: 92,
  vagas: [da(ENG.l1, 1, 24), da(ENG.l2, 1, 24)],
  fases: [
    fase("1-fase", "1ª fase", ["11-03", "11-09"], { lugares: 80 }),
    fase("2-fase", "2ª fase", ["12-01", "12-07"]),
    fase("3-fase", "3ª fase", ["01-05", "01-11"], {
      entramAqui: [da(ENG.pl, 1, 20), da(ENG.ch, 1, 24)],
    }),
    fase("4-fase", "4ª fase", ["02-09", "02-15"]),
    fase("5-fase", "5ª fase", ["03-02", "03-08"]),
    fase("quartas", "Quartas de final", ["03-30", "04-05"]),
    fase("semifinal", "Semifinal", ["04-20", "04-26"], { mando: "neutro" }),
    fase("final", "Final", ["05-16", "05-22"], { mando: "neutro" }),
  ],
});

/**
 * EFL Cup com os 92 clubes, como no real: preliminar com 4 da League Two; a 1ª fase com o resto da
 * EFL (70); os 11 da Premier League fora das copas europeias na 2ª fase e os 9 que as jogam na 3ª,
 * com 32. Empate vai direto para os pênaltis (prorrogação só na final); semifinal em ida e volta.
 */
const EFL_CUP = copa({
  id: "eng-league-cup",
  nome: "EFL Cup",
  nomeCurto: "Copa da Liga",
  pais: "ENG",
  quantidade: 92,
  vagas: [da(ENG.l2, 21, 24)],
  fases: [
    fase("preliminar", "Fase preliminar", ["07-26", "08-01"], { prorrogacao: false }),
    fase("1-fase", "1ª fase", ["08-06", "08-12"], {
      prorrogacao: false,
      entramAqui: [da(ENG.l2, 1, 20), da(ENG.l1, 1, 24), da(ENG.ch, 1, 24)],
    }),
    fase("2-fase", "2ª fase", ["08-24", "08-30"], {
      prorrogacao: false,
      entramAqui: [da(ENG.pl, 10, 20)],
    }),
    fase("3-fase", "3ª fase", ["09-14", "09-20"], {
      prorrogacao: false,
      entramAqui: [da(ENG.pl, 1, 9)],
    }),
    fase("4-fase", "4ª fase", ["10-26", "11-01"], { prorrogacao: false }),
    fase("quartas", "Quartas de final", ["12-14", "12-20"], { prorrogacao: false }),
    fase("semifinal", "Semifinal", ["01-11", "02-07"], { jogos: 2, prorrogacao: false }),
    fase("final", "Final", ["03-15", "03-21"], { mando: "neutro" }),
  ],
});

const ESP = {
  l1: "esp-laliga",
  l2: "esp-laliga-2",
  pf: "esp-primera-federacion",
};

/**
 * Copa del Rey: todos os clubes do banco na 1ª eliminatória (112 lugares no real; os amadores que
 * faltam viram folga), menos os quatro da Supercopa, que estreiam nos 16 avos. Jogo único até as
 * quartas, com o clube de divisão mais baixa em casa; semifinal em ida e volta; final em campo
 * neutro (La Cartuja).
 */
const COPA_DEL_REY = copa({
  id: "esp-copa-del-rey",
  nome: "Copa del Rey",
  nomeCurto: "Copa del Rey",
  pais: "ESP",
  quantidade: 82,
  vagas: [da(ESP.l1, 1, 20), da(ESP.l2, 1, 22), da(ESP.pf, 1, 40)],
  campeaoAnterior: {
    temporada: "2025/26",
    campeao: "esp-real-sociedad",
    vice: "esp-atletico-madrid",
  },
  fases: [
    fase("1-eliminatoria", "1ª eliminatória", ["10-24", "10-30"], {
      lugares: 112,
      chaveamento: "potes",
      mando: "menor-divisao",
    }),
    fase("2-eliminatoria", "2ª eliminatória", ["11-29", "12-05"], { mando: "menor-divisao" }),
    fase("16-avos", "16 avos de final", ["12-13", "12-19"], {
      chaveamento: "potes",
      mando: "menor-divisao",
      // Os quatro da Supercopa: campeão e vice da LaLiga e da própria Copa.
      entramAqui: [
        { de: ESP.l1, criterio: "campeao" },
        { de: ESP.l1, criterio: "vice" },
        { de: "esp-copa-del-rey", criterio: "campeao" },
        { de: "esp-copa-del-rey", criterio: "vice" },
      ] as Vaga[],
    }),
    fase("oitavas", "Oitavas de final", ["01-13", "01-19"], { mando: "menor-divisao" }),
    fase("quartas", "Quartas de final", ["01-31", "02-06"], { mando: "menor-divisao" }),
    fase("semifinal", "Semifinal", ["02-09", "03-06"], { jogos: 2 }),
    fase("final", "Final", ["04-18", "04-24"], { mando: "neutro" }),
  ],
});

const ITA = { a: "ita-serie-a", b: "ita-serie-b", c: "ita-serie-c" };

/**
 * Coppa Italia com 44, como no real: preliminar com 4 da Serie B e 4 da Serie C; a 1ª fase com os
 * vencedores, 16 da Serie B e os 12 da Serie A de 9º a 20º; os 8 primeiros da Serie A nas oitavas.
 * Jogo único até as quartas, com o mais bem colocado em casa; semifinal em ida e volta; final no
 * Olímpico de Roma.
 */
const COPPA_ITALIA = copa({
  id: "ita-coppa-italia",
  nome: "Coppa Italia",
  nomeCurto: "Coppa Italia",
  pais: "ITA",
  quantidade: 44,
  vagas: [da(ITA.b, 17, 20), da(ITA.c, 1, 4)],
  fases: [
    fase("preliminar", "Fase preliminar", ["08-03", "08-09"], { mando: "melhor-campanha" }),
    fase("1-fase", "1ª fase", ["08-10", "08-16"], {
      chaveamento: "potes",
      mando: "melhor-campanha",
      entramAqui: [da(ITA.a, 9, 20), da(ITA.b, 1, 16)],
    }),
    fase("2-fase", "2ª fase", ["09-21", "09-27"], {
      chaveamento: "chave-fixa",
      mando: "melhor-campanha",
    }),
    fase("oitavas", "Oitavas de final", ["12-01", "12-17"], {
      chaveamento: "potes",
      mando: "melhor-campanha",
      entramAqui: [da(ITA.a, 1, 8)],
    }),
    fase("quartas", "Quartas de final", ["02-01", "02-10"], {
      chaveamento: "chave-fixa",
      mando: "melhor-campanha",
    }),
    fase("semifinal", "Semifinal", ["03-01", "04-22"], { jogos: 2, chaveamento: "chave-fixa" }),
    fase("final", "Final", ["05-13", "05-19"], { mando: "neutro" }),
  ],
});

const GER = { l1: "ger-bundesliga", l2: "ger-2-bundesliga", l3: "ger-3-liga" };

/**
 * DFB-Pokal: 64 lugares na 1ª rodada; os 24 amadores que faltam viram folga para os primeiros da
 * Bundesliga. Pote dos profissionais contra o pote de baixo, e o clube da 3. Liga para baixo manda
 * o jogo contra os profissionais até a semifinal. Prorrogação e pênaltis; final em Berlim.
 */
const DFB_POKAL = copa({
  id: "ger-dfb-pokal",
  nome: "DFB-Pokal",
  nomeCurto: "DFB-Pokal",
  pais: "GER",
  quantidade: 56,
  vagas: [da(GER.l1, 1, 18), da(GER.l2, 1, 18), da(GER.l3, 1, 20)],
  campeaoAnterior: { temporada: "2025/26", campeao: "ger-bayern", vice: "ger-stuttgart" },
  fases: [
    fase("1-rodada", "1ª rodada", ["08-18", "08-24"], {
      lugares: 64,
      chaveamento: "potes",
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 3, diferenca: 1 },
    }),
    fase("2-rodada", "2ª rodada", ["10-26", "11-01"], {
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 3, diferenca: 1 },
    }),
    fase("oitavas", "Oitavas de final", ["12-01", "12-07"], {
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 3, diferenca: 1 },
    }),
    fase("quartas", "Quartas de final", ["02-01", "02-07"], {
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 3, diferenca: 1 },
    }),
    fase("semifinal", "Semifinal", ["04-19", "04-25"], {
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 3, diferenca: 1 },
    }),
    fase("final", "Final", ["05-23", "05-29"], { mando: "neutro" }),
  ],
});

const FRA = { l1: "fra-ligue-1", l2: "fra-ligue-2", l3: "fra-ligue-3" };

/**
 * Coupe de France a partir dos 32 avos, quando entra a Ligue 1 (64 lugares; os amadores que faltam
 * viram folga). O clube dois níveis abaixo manda o jogo. Empate vai direto para os pênaltis até a
 * semifinal; só a final, no Stade de France, tem prorrogação.
 */
const COUPE_DE_FRANCE = copa({
  id: "fra-coupe-de-france",
  nome: "Coupe de France",
  nomeCurto: "Coupe de France",
  pais: "FRA",
  quantidade: 54,
  vagas: [da(FRA.l1, 1, 18), da(FRA.l2, 1, 18), da(FRA.l3, 1, 18)],
  fases: [
    fase("32-avos", "32 avos de final", ["12-16", "12-22"], {
      lugares: 64,
      chaveamento: "potes",
      prorrogacao: false,
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 1, diferenca: 2 },
    }),
    fase("16-avos", "16 avos de final", ["01-06", "01-12"], {
      prorrogacao: false,
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 1, diferenca: 2 },
    }),
    fase("oitavas", "Oitavas de final", ["02-01", "02-07"], {
      prorrogacao: false,
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 1, diferenca: 2 },
    }),
    fase("quartas", "Quartas de final", ["03-01", "03-07"], {
      prorrogacao: false,
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 1, diferenca: 2 },
    }),
    fase("semifinal", "Semifinal", ["04-19", "04-25"], {
      prorrogacao: false,
      mando: "menor-divisao",
      menorDivisao: { aPartirDe: 1, diferenca: 2 },
    }),
    fase("final", "Final", ["05-17", "05-23"], { mando: "neutro" }),
  ],
});

const POR = { l1: "por-liga-portugal", l2: "por-liga-portugal-2" };

/**
 * Taça de Portugal no formato novo de 2026/27: a I Liga entra na 3ª eliminatória (52 lugares; os
 * clubes da Liga 3 e do Campeonato de Portugal que faltam viram folga), e os 6 das copas europeias
 * só na 4ª, com 32. Tudo em jogo único, o clube de divisão mais baixa em casa; semifinal em campo
 * neutro depois do fim da liga; final no Jamor.
 */
const TACA_DE_PORTUGAL = copa({
  id: "por-taca-de-portugal",
  nome: "Taça de Portugal",
  nomeCurto: "Taça de Portugal",
  pais: "POR",
  quantidade: 36,
  vagas: [da(POR.l1, 7, 18), da(POR.l2, 1, 18)],
  campeaoAnterior: { temporada: "2025/26", campeao: "por-torreense", vice: "por-sporting" },
  fases: [
    fase("3-eliminatoria", "3ª eliminatória", ["10-12", "10-18"], {
      lugares: 52,
      chaveamento: "potes",
      mando: "menor-divisao",
    }),
    fase("4-eliminatoria", "4ª eliminatória", ["11-16", "11-22"], {
      mando: "menor-divisao",
      entramAqui: [da(POR.l1, 1, 6)],
    }),
    fase("oitavas", "Oitavas de final", ["12-14", "12-20"], { mando: "menor-divisao" }),
    fase("quartas", "Quartas de final", ["02-01", "02-07"], { mando: "menor-divisao" }),
    fase("semifinal", "Semifinal", ["05-17", "05-23"], { mando: "neutro" }),
    fase("final", "Final", ["05-24", "05-30"], { mando: "neutro" }),
  ],
});

const NED = { l1: "ned-eredivisie", l2: "ned-eerste-divisie" };

/**
 * KNVB Beker: 1ª rodada com 52 lugares (26 jogos; os amadores que faltam viram folga), sem os 6 das
 * copas europeias, que entram na 2ª rodada, com 32. Prorrogação e pênaltis; final em campo neutro.
 */
const KNVB_BEKER = copa({
  id: "ned-knvb-beker",
  nome: "KNVB Beker",
  nomeCurto: "KNVB Beker",
  pais: "NED",
  quantidade: 38,
  vagas: [da(NED.l1, 7, 18), da(NED.l2, 1, 20)],
  campeaoAnterior: { temporada: "2025/26", campeao: "ned-az", vice: "ned-nec" },
  fases: [
    fase("1-rodada", "1ª rodada", ["10-25", "10-31"], { lugares: 52, chaveamento: "potes" }),
    fase("2-rodada", "2ª rodada", ["12-13", "12-19"], { entramAqui: [da(NED.l1, 1, 6)] }),
    fase("oitavas", "Oitavas de final", ["01-11", "01-17"]),
    fase("quartas", "Quartas de final", ["02-01", "02-07"]),
    fase("semifinal", "Semifinal", ["03-01", "03-07"]),
    fase("final", "Final", ["04-18", "04-24"], { mando: "neutro" }),
  ],
});

export const COPAS_EUROPEIAS: readonly CompeticaoEntrada[] = [
  FA_CUP,
  EFL_CUP,
  COPA_DEL_REY,
  COPPA_ITALIA,
  DFB_POKAL,
  COUPE_DE_FRANCE,
  TACA_DE_PORTUGAL,
  KNVB_BEKER,
];
