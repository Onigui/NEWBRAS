/**
 * Copa do Mundo de 2030 (etapa 11c): as eliminatórias das seis confederações, a repescagem
 * intercontinental de março de 2030 e a fase final de 48 seleções.
 *
 * Anfitriões classificados direto: Espanha, Portugal e Marrocos (sedes principais) e Uruguai,
 * Argentina e Paraguai (jogos do centenário). As vagas deles saem da cota de cada confederação.
 *
 * Vagas (as da Copa de 2026, enquanto a FIFA não publica as de 2030): UEFA 16 (14 pelas
 * eliminatórias), CONMEBOL 6 (3) + 1 na repescagem, Concacaf 6 + 2, AFC 8 + 1, CAF 9 (8) + 1, OFC
 * 1 + 1; a repescagem de 6 seleções dá 2 vagas.
 *
 * Formatos: a Concacaf já anunciou o dela (primeira fase com os 22 de pior ranking, segunda fase em
 * 6 grupos e fase final em 3 grupos); a UEFA anunciou a ideia (duas divisões pela Nations League de
 * 2028/29, a de cima em formato suíço com 3 ligas de 12) e o resto foi completado aqui; a CONMEBOL
 * joga com as 7 que não são anfitriãs, em turno e returno; AFC, CAF e OFC repetem o formato do
 * ciclo de 2026, quatro anos depois.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];
type Regra = NonNullable<CompeticaoEntrada["classificados"]>[number];

const DESEMPATE_FIFA: CompeticaoEntrada["desempate"] = [
  "pontos",
  "saldo",
  "gols-pro",
  "confronto-direto",
  "saldo-confronto-direto",
  "vitorias",
];
const ANFITRIOES_UEFA = ["ESP", "POR"];

const grupos = (
  id: string,
  nome: string,
  n: number,
  datas: string[],
  o: Record<string, unknown> = {},
): Fase =>
  ({
    id,
    nome,
    tipo: "grupos",
    grupos: n,
    turnos: 2,
    classificamPorGrupo: 0,
    divisaoGrupos: n > 1 ? "potes" : "ordem-da-lista",
    periodo: { inicio: "01-01", fim: "12-31" },
    datas,
    entramAqui: [],
    ...o,
  }) as Fase;

const mataMata = (
  id: string,
  nome: string,
  datas: string[],
  o: Partial<Extract<Fase, { tipo: "mata-mata" }>> = {},
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
    periodo: { inicio: "01-01", fim: "12-31" },
    datas,
    entramAqui: [],
    ...o,
  }) as Fase;

function eliminatorias(o: {
  id: string;
  nome: string;
  curto: string;
  confederacao: "UEFA" | "CONMEBOL" | "CONCACAF" | "AFC" | "CAF" | "OFC";
  anoFinal: number;
  anos: number;
  calendario: { inicio: string; fim: string };
  fixos?: string[];
  quantidade: number;
  fases: Fase[];
  classificados: Partial<Regra>[];
}): CompeticaoEntrada {
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.curto,
    tipo: "eliminatorias",
    categoria: "selecoes",
    escopo: { tipo: "confederacao", confederacao: o.confederacao },
    periodicidade: { aCadaAnos: 4, anoBase: o.anoFinal },
    calendario: o.calendario,
    anos: o.anos,
    participantes: { fixos: o.fixos ?? [], quantidade: o.quantidade },
    fases: o.fases,
    desempate: DESEMPATE_FIFA,
    classificados: o.classificados.map((r) => ({ porGrupo: false, ...r })) as Regra[],
  } as CompeticaoEntrada;
}

const classificadosDe = (de: string, quantidade: number, extra: Partial<Vaga> = {}): Vaga =>
  ({ de, criterio: "classificados", quantidade, ...extra }) as Vaga;

// ------------------------------------------------------------------------------------ UEFA

const nl = (liga: string, posicoes: number[], grupos: number, extra: Partial<Vaga> = {}) =>
  ({
    de: `uefa-nations-league-${liga}`,
    criterio: "posicoes",
    fase: "fase-de-liga",
    porGrupo: true,
    posicoes,
    quantidade: posicoes.length * grupos,
    ...extra,
  }) as Vaga;

/** Seis rodadas de setembro a novembro de 2029, nas datas FIFA. */
const RODADAS_UEFA = ["09-24", "09-27", "10-01", "10-04", "11-12", "11-15"];

/**
 * Liga 2 das eliminatórias europeias: as 16 seleções de pior campanha na Nations League de 2028/29,
 * em 4 grupos de 4; os 4 primeiros vão aos playoffs.
 */
const UEFA_LIGA_2 = eliminatorias({
  id: "uefa-eliminatorias-copa-liga-2",
  nome: "Eliminatórias da Copa (UEFA, Liga 2)",
  curto: "Eliminatórias UEFA 2",
  confederacao: "UEFA",
  anoFinal: 2029,
  anos: 1,
  calendario: { inicio: "09-20", fim: "11-30" },
  quantidade: 16,
  fases: [
    grupos("grupos", "Fase de grupos", 4, RODADAS_UEFA, {
      entramAqui: [
        nl("c", [2], 4, { pular: 2, quantidade: 2 }),
        nl("c", [3, 4], 4),
        nl("d", [1, 2, 3], 2),
      ],
    }),
  ],
  classificados: [{ fase: "grupos", posicoes: [1], porGrupo: true }],
});

/**
 * Liga 1: as 36 melhores na Nations League de 2028/29 (sem Espanha e Portugal), em três ligas de 12
 * no formato suíço (6 jogos, 2 contra cada pote); os três primeiros vão à Copa. Do 2º ao 7º de cada
 * liga e os 4 primeiros da Liga 2 jogam os playoffs de março de 2030 em ida e volta: 11 vagas.
 */
const UEFA_LIGA_1 = eliminatorias({
  id: "uefa-eliminatorias-copa",
  nome: "Eliminatórias da Copa (UEFA)",
  curto: "Eliminatórias UEFA",
  confederacao: "UEFA",
  anoFinal: 2030,
  anos: 1,
  calendario: { inicio: "09-20", fim: "03-31" },
  quantidade: 36,
  fases: [
    {
      id: "liga",
      nome: "Liga 1",
      tipo: "fase-de-liga",
      jogosPorTime: 6,
      potes: 3,
      grupos: 3,
      classificamDireto: 0,
      periodo: { inicio: "09-20", fim: "11-30" },
      datas: RODADAS_UEFA,
      entramAqui: [
        nl("a", [1, 2, 3, 4], 4, { exceto: ANFITRIOES_UEFA, quantidade: 14 }),
        nl("b", [1, 2, 3, 4], 4),
        nl("c", [1], 4),
        nl("c", [2], 4, { maximo: 2, quantidade: 2 }),
      ],
    } as Fase,
    mataMata("playoffs", "Playoffs", ["03-26", "03-29"], {
      jogos: 2,
      chaveamento: "campanha",
      mando: "melhor-campanha",
      eliminatorias: 1,
      todosJogam: true,
      entramAqui: [
        {
          de: "uefa-eliminatorias-copa",
          criterio: "posicoes",
          fase: "liga",
          porGrupo: true,
          posicoes: [2, 3, 4, 5, 6, 7],
          quantidade: 18,
        } as Vaga,
        {
          de: "uefa-eliminatorias-copa-liga-2",
          criterio: "posicoes",
          fase: "grupos",
          porGrupo: true,
          posicoes: [1],
          quantidade: 4,
        } as Vaga,
      ],
    }),
  ],
  classificados: [
    { fase: "liga", posicoes: [1], porGrupo: true },
    { fase: "playoffs", vencedores: true },
  ],
});

// ------------------------------------------------------------------------------- CONMEBOL

/**
 * As 7 que não são anfitriãs em turno e returno (14 rodadas, de setembro de 2027 a novembro de
 * 2028): as 3 primeiras vão à Copa e a 4ª à repescagem.
 */
const CONMEBOL = eliminatorias({
  id: "conmebol-eliminatorias-copa",
  nome: "Eliminatórias da Copa (CONMEBOL)",
  curto: "Eliminatórias CONMEBOL",
  confederacao: "CONMEBOL",
  anoFinal: 2028,
  anos: 2,
  calendario: { inicio: "09-01", fim: "11-30" },
  fixos: ["BRA", "COL", "ECU", "CHI", "PER", "VEN", "BOL"],
  quantidade: 7,
  fases: [
    grupos(
      "liga",
      "Pontos corridos",
      1,
      [
        "09-24",
        "09-28",
        "10-01",
        "10-05",
        "11-12",
        "11-16",
        "03-26",
        "03-30",
        "09-24",
        "09-28",
        "10-01",
        "10-05",
        "11-12",
        "11-16",
      ],
      { periodo: { inicio: "09-01", fim: "11-30" } },
    ),
  ],
  classificados: [
    { fase: "liga", posicoes: [1, 2, 3] },
    { fase: "liga", posicoes: [4] },
  ],
});

// ------------------------------------------------------------------------------- Concacaf

/** As 35 da Concacaf pelo ranking: as 13 primeiras estreiam na segunda fase. */
const RANKING_CONCACAF = [
  "MEX",
  "USA",
  "CAN",
  "PAN",
  "CRC",
  "JAM",
  "HON",
  "SLV",
  "HAI",
  "CUW",
  "GUA",
  "TRI",
  "SUR",
  "NCA",
  "DOM",
  "GUY",
  "PUR",
  "ATG",
  "BER",
  "GRN",
  "SKN",
  "LCA",
  "VIN",
  "BLZ",
  "CUB",
  "MSR",
  "BRB",
  "DMA",
  "ARU",
  "BAH",
  "CAY",
  "TCA",
  "VGB",
  "VIR",
  "AIA",
];

/**
 * Formato anunciado pela Concacaf: 1ª fase em ida e volta com as 22 de pior ranking (setembro de
 * 2027); 2ª fase com as 11 vencedoras e as 13 primeiras em 6 grupos de 4 (outubro de 2027 a março
 * de 2028); fase final com 12 em 3 grupos de 4 (junho de 2028 e setembro e outubro de 2029). As 2
 * primeiras de cada grupo vão à Copa; as 2 melhores terceiras, à repescagem.
 */
const CONCACAF = eliminatorias({
  id: "concacaf-eliminatorias-copa",
  nome: "Eliminatórias da Copa (Concacaf)",
  curto: "Eliminatórias Concacaf",
  confederacao: "CONCACAF",
  anoFinal: 2029,
  anos: 3,
  calendario: { inicio: "09-01", fim: "11-30" },
  fixos: RANKING_CONCACAF,
  quantidade: 35,
  fases: [
    // 48 lugares: as 13 primeiras passam direto e as outras 22 jogam.
    mataMata("1-fase", "1ª fase", ["09-24", "09-28"], {
      jogos: 2,
      lugares: 48,
      chaveamento: "campanha",
      mando: "melhor-campanha",
    }),
    grupos("2-fase", "2ª fase", 6, ["10-01", "10-05", "11-12", "11-16", "03-26", "03-30"], {
      classificamPorGrupo: 2,
    }),
    grupos("fase-final", "Fase final", 3, ["06-04", "06-08", "*09-24", "09-28", "10-01", "10-05"]),
  ],
  classificados: [
    { fase: "fase-final", posicoes: [1, 2], porGrupo: true },
    { fase: "fase-final", posicoes: [3], porGrupo: true, melhores: 2 },
  ],
});

// ------------------------------------------------------------------------------------ AFC

/** As 46 da AFC pelo ranking: as 20 últimas jogam a 1ª fase. */
const RANKING_AFC = [
  "JPN",
  "IRN",
  "KOR",
  "AUS",
  "QAT",
  "UZB",
  "KSA",
  "IRQ",
  "UAE",
  "JOR",
  "OMA",
  "BHR",
  "CHN",
  "SYR",
  "PLE",
  "VIE",
  "KGZ",
  "THA",
  "TJK",
  "LBN",
  "IDN",
  "PRK",
  "IND",
  "MAS",
  "KUW",
  "TKM",
  "PHI",
  "YEM",
  "HKG",
  "AFG",
  "MDV",
  "SGP",
  "MYA",
  "TPE",
  "NEP",
  "CAM",
  "BAN",
  "BHU",
  "LAO",
  "MNG",
  "BRU",
  "MAC",
  "PAK",
  "SRI",
  "GUM",
  "TLS",
];

/**
 * Formato do ciclo de 2026, quatro anos depois: 1ª fase em ida e volta com as 20 de pior ranking;
 * 2ª fase com 36 em 9 grupos de 4 (os 2 primeiros seguem); 3ª fase com 18 em 3 grupos de 6 (os 2
 * primeiros vão à Copa); 4ª fase com os 3º e 4º em 2 grupos de 3 (o 1º vai à Copa); 5ª fase entre os
 * 2º da 4ª, em ida e volta, pela vaga na repescagem.
 */
const AFC = eliminatorias({
  id: "afc-eliminatorias-copa",
  nome: "Eliminatórias da Copa (AFC)",
  curto: "Eliminatórias AFC",
  confederacao: "AFC",
  anoFinal: 2029,
  anos: 3,
  calendario: { inicio: "10-01", fim: "11-30" },
  fixos: RANKING_AFC,
  quantidade: 46,
  fases: [
    // 72 lugares: as 26 primeiras passam direto e as outras 20 jogam.
    mataMata("1-fase", "1ª fase", ["10-01", "10-05"], {
      jogos: 2,
      lugares: 72,
      chaveamento: "campanha",
      mando: "melhor-campanha",
    }),
    grupos("2-fase", "2ª fase", 9, ["11-12", "11-16", "03-26", "03-30", "06-04", "06-08"], {
      classificamPorGrupo: 2,
    }),
    grupos(
      "3-fase",
      "3ª fase",
      3,
      ["09-24", "09-28", "10-01", "10-05", "11-12", "11-16", "03-26", "03-30", "06-04", "06-08"],
      { faixaClassificada: { de: 3, ate: 4 } },
    ),
    grupos("4-fase", "4ª fase", 2, ["09-28", "10-01", "10-04"], {
      turnos: 1,
      faixaClassificada: { de: 2, ate: 2 },
    }),
    mataMata("5-fase", "5ª fase", ["11-12", "11-16"], {
      jogos: 2,
      chaveamento: "campanha",
      mando: "melhor-campanha",
    }),
  ],
  classificados: [
    { fase: "3-fase", posicoes: [1, 2], porGrupo: true },
    { fase: "4-fase", posicoes: [1], porGrupo: true },
    { fase: "5-fase", vencedores: true },
  ],
});

// ------------------------------------------------------------------------------------ CAF

/** As 53 da CAF (Marrocos é anfitrião), da mais forte para a mais fraca, para os potes. */
const RANKING_CAF = [
  "SEN",
  "EGY",
  "ALG",
  "NGA",
  "CIV",
  "TUN",
  "CMR",
  "MLI",
  "RSA",
  "COD",
  "BFA",
  "GHA",
  "CPV",
  "GUI",
  "GAB",
  "ANG",
  "EQG",
  "ZAM",
  "TAN",
  "UGA",
  "BEN",
  "KEN",
  "MAD",
  "MOZ",
  "LBY",
  "NAM",
  "SDN",
  "MTN",
  "ZIM",
  "GAM",
  "TOG",
  "NIG",
  "RWA",
  "SLE",
  "MWI",
  "GNB",
  "COM",
  "CGO",
  "LBR",
  "BDI",
  "ETH",
  "BOT",
  "CTA",
  "LES",
  "SWZ",
  "SSD",
  "CHA",
  "MRI",
  "STP",
  "DJI",
  "SEY",
  "SOM",
  "ERI",
];

/**
 * Formato do ciclo de 2026: 9 grupos de 6 (um de 5, sem Marrocos), em turno e returno, de novembro
 * de 2027 a outubro de 2029. Os 8 melhores primeiros vão à Copa (a 9ª vaga da África é a de
 * Marrocos); o 9º primeiro e os 3 melhores segundos jogam os playoffs (semifinal e final em jogo
 * único, em campo neutro) pela vaga na repescagem.
 */
const CAF = eliminatorias({
  id: "caf-eliminatorias-copa",
  nome: "Eliminatórias da Copa (CAF)",
  curto: "Eliminatórias CAF",
  confederacao: "CAF",
  anoFinal: 2029,
  anos: 3,
  calendario: { inicio: "11-01", fim: "11-30" },
  fixos: RANKING_CAF,
  quantidade: 53,
  fases: [
    grupos("grupos", "Fase de grupos", 9, [
      "11-12",
      "11-16",
      "06-04",
      "06-08",
      "*03-26",
      "03-30",
      "09-24",
      "09-28",
      "10-01",
      "10-05",
    ]),
    mataMata("playoffs", "Playoffs", ["11-12", "11-16"], {
      chaveamento: "campanha",
      limiteDeEntradas: 4,
      entramAqui: [
        {
          de: "caf-eliminatorias-copa",
          criterio: "posicoes",
          fase: "grupos",
          porGrupo: true,
          posicoes: [1],
          foraDosClassificados: true,
          quantidade: 1,
        } as Vaga,
        {
          de: "caf-eliminatorias-copa",
          criterio: "posicoes",
          fase: "grupos",
          porGrupo: true,
          posicoes: [2],
          melhores: 3,
          quantidade: 3,
        } as Vaga,
      ],
    }),
  ],
  classificados: [
    { fase: "grupos", posicoes: [1], porGrupo: true, melhores: 8 },
    { fase: "playoffs", vencedores: true },
  ],
});

// ------------------------------------------------------------------------------------ OFC

/**
 * Formato do ciclo de 2026, aproximado: 1ª fase com as 6 de pior ranking em jogo único (no real, as
 * 4 últimas em turno único), 2ª fase com 8 em 2 grupos de 4, semifinal e final em março de 2029. A
 * campeã vai à Copa; a vice, à repescagem.
 */
const OFC = eliminatorias({
  id: "ofc-eliminatorias-copa",
  nome: "Eliminatórias da Copa (OFC)",
  curto: "Eliminatórias OFC",
  confederacao: "OFC",
  anoFinal: 2029,
  anos: 1,
  calendario: { inicio: "09-20", fim: "03-31" },
  fixos: ["NZL", "NCL", "TAH", "FIJ", "SOL", "VAN", "PNG", "SAM", "TGA", "COK", "ASA"],
  quantidade: 11,
  fases: [
    mataMata("1-fase", "1ª fase", ["09-24"], { lugares: 16, chaveamento: "campanha" }),
    grupos("2-fase", "2ª fase", 2, ["09-28", "10-01", "10-04"], {
      turnos: 1,
      classificamPorGrupo: 2,
    }),
    mataMata("semifinal", "Semifinal", ["03-26"], { chaveamento: "campanha" }),
    mataMata("final", "Final", ["03-29"]),
  ],
  classificados: [
    { fase: "final", vencedores: true },
    { fase: "final", perdedores: true },
  ],
});

// --------------------------------------------------------------------------- Repescagem

/**
 * Repescagem intercontinental (março de 2030, em campo neutro): 6 seleções, as 2 primeiras da lista
 * (a 4ª da CONMEBOL e a melhor terceira da Concacaf) direto na final de cada caminho; as outras 4
 * jogam as semifinais. As 2 vencedoras vão à Copa.
 */
const REPESCAGEM: CompeticaoEntrada = {
  id: "fifa-repescagem-copa",
  nome: "Repescagem da Copa do Mundo",
  nomeCurto: "Repescagem",
  tipo: "eliminatorias",
  categoria: "selecoes",
  escopo: { tipo: "mundial" },
  periodicidade: { aCadaAnos: 4, anoBase: 2030 },
  calendario: { inicio: "03-20", fim: "03-31" },
  participantes: { fixos: [], quantidade: 6 },
  fases: [
    mataMata("semifinal", "Semifinal", ["03-26"], {
      lugares: 8,
      chaveamento: "campanha",
      entramAqui: [
        classificadosDe("conmebol-eliminatorias-copa", 1, { pular: 3, maximo: 1 }),
        classificadosDe("concacaf-eliminatorias-copa", 2, { pular: 6, maximo: 2 }),
        classificadosDe("afc-eliminatorias-copa", 1, { pular: 8, maximo: 1 }),
        classificadosDe("caf-eliminatorias-copa", 1, { pular: 8, maximo: 1 }),
        classificadosDe("ofc-eliminatorias-copa", 1, { pular: 1, maximo: 1 }),
      ],
    }),
    mataMata("final", "Final", ["03-31"], { chaveamento: "potes", eliminatorias: 1 }),
  ],
  desempate: DESEMPATE_FIFA,
  classificados: [{ fase: "final", vencedores: true, porGrupo: false }],
} as CompeticaoEntrada;

// --------------------------------------------------------------------------- Copa do Mundo

/**
 * Copa do Mundo de 2030 (13/06 a 21/07): 48 seleções em 12 grupos de 4, sem duas da mesma
 * confederação no grupo (a UEFA, com 16, divide alguns); os 2 primeiros e os 8 melhores terceiros
 * vão aos 16 avos, e daí em diante é mata-mata até a final.
 */
export const COPA_DO_MUNDO: CompeticaoEntrada = {
  id: "fifa-copa-do-mundo",
  nome: "Copa do Mundo",
  nomeCurto: "Copa do Mundo",
  tipo: "selecoes",
  categoria: "selecoes",
  escopo: { tipo: "mundial" },
  periodicidade: { aCadaAnos: 4, anoBase: 2030 },
  calendario: { inicio: "06-08", fim: "07-21" },
  participantes: { fixos: ["ESP", "POR", "MAR", "ARG", "URU", "PAR"], quantidade: 48 },
  campeaoAnterior: { temporada: "2026", campeao: "ESP", vice: "ARG" },
  campeoesAnteriores: [{ temporada: "2022", campeao: "ARG", vice: "FRA" }],
  fases: [
    grupos("grupos", "Fase de grupos", 12, ["06-14", "06-19", "06-24"], {
      turnos: 1,
      classificamPorGrupo: 2,
      melhores: { posicao: 3, quantidade: 8 },
      periodo: { inicio: "06-08", fim: "06-27" },
      entramAqui: [
        classificadosDe("uefa-eliminatorias-copa", 14),
        classificadosDe("conmebol-eliminatorias-copa", 3, { maximo: 3 }),
        classificadosDe("concacaf-eliminatorias-copa", 6, { maximo: 6 }),
        classificadosDe("afc-eliminatorias-copa", 8, { maximo: 8 }),
        classificadosDe("caf-eliminatorias-copa", 8, { maximo: 8 }),
        classificadosDe("ofc-eliminatorias-copa", 1, { maximo: 1 }),
        classificadosDe("fifa-repescagem-copa", 2),
      ],
    }),
    mataMata("16-avos", "16 avos de final", ["06-29"], {
      chaveamento: "potes",
      evitarMesmoGrupo: true,
    }),
    mataMata("oitavas", "Oitavas de final", ["07-05"]),
    mataMata("quartas", "Quartas de final", ["07-10"]),
    mataMata("semifinal", "Semifinal", ["07-15"]),
    mataMata("final", "Final", ["07-21"]),
  ],
  desempate: DESEMPATE_FIFA,
} as CompeticaoEntrada;

export const COMPETICOES_DA_COPA: readonly CompeticaoEntrada[] = [
  UEFA_LIGA_1,
  UEFA_LIGA_2,
  CONMEBOL,
  CONCACAF,
  AFC,
  CAF,
  OFC,
  REPESCAGEM,
  COPA_DO_MUNDO,
];
