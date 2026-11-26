/**
 * Copas continentais da CONCACAF, AFC, CAF e OFC no formato real de 2026/27 (etapa 10a4), com as
 * competições que alimentam ou completam cada uma:
 * - CONCACAF: Copa dos Campeões (27 clubes, 5 direto às oitavas), Leagues Cup, Copa
 *   Centro-Americana e Copa do Caribe, que dão vagas para a Copa dos Campeões do ano seguinte.
 * - AFC: Champions League Elite (fase preliminar, ligas do Oeste e do Leste com 16 cada, oitavas na
 *   região e fase final em jogo único na Arábia Saudita) e Champions League Two (32 em grupos,
 *   chave regional até a final), que recebe os eliminados da preliminar da Elite.
 * - CAF: Champions League (61 clubes, duas fases preliminares) e Copa das Confederações (56).
 * - OFC: Champions League com qualificatória das quatro federações menores e fase final em sede
 *   única. A OFC Professional League, criada em 2026, fica para quando os clubes dela estiverem no
 *   banco.
 */
import type { CompeticaoEntrada, Confederacao } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];

const periodo = (inicio: string, fim: string) => ({ inicio, fim });

/** Colocações na liga (com exclusão, "1, 2" = os dois melhores que ainda não têm vaga). */
const pos = (de: string, ...posicoes: number[]): Vaga => ({
  de,
  criterio: "posicoes",
  posicoes,
  repassa: true,
});
/** Os n melhores da liga que ainda não têm vaga. */
const melhores = (de: string, n: number, extra: Partial<Vaga> = {}): Vaga => ({
  ...pos(de, ...Array.from({ length: n }, (_, i) => i + 1)),
  ...extra,
});
const campeao = (de: string, extra: Partial<Vaga> = {}): Vaga => ({
  de,
  criterio: "campeao",
  ...extra,
});
const eliminados = (
  de: string,
  fase: string,
  quantidade: number,
  extra: Partial<Vaga> = {},
): Vaga => ({
  de,
  criterio: "eliminados",
  fase,
  quantidade,
  ...extra,
});

function competicao(o: {
  id: string;
  nome: string;
  nomeCurto: string;
  confederacao: Confederacao;
  calendario: [string, string];
  vagas: Vaga[];
  quantidade: number;
  fases: Fase[];
  exclui?: string[];
  campeaoAnterior?: CompeticaoEntrada["campeaoAnterior"];
  campeoesAnteriores?: CompeticaoEntrada["campeoesAnteriores"];
}): CompeticaoEntrada {
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: "continental",
    categoria: "clubes",
    escopo: { tipo: "confederacao", confederacao: o.confederacao },
    calendario: periodo(...o.calendario),
    ...(o.campeaoAnterior ? { campeaoAnterior: o.campeaoAnterior } : {}),
    ...(o.campeoesAnteriores ? { campeoesAnteriores: o.campeoesAnteriores } : {}),
    participantes: {
      fixos: [],
      vagas: o.vagas,
      exclui: o.exclui ?? [],
      quantidade: o.quantidade,
    },
    fases: o.fases,
  };
}

/** Eliminatória (uma rodada só; a última fase vai até a final). */
function mataMata(
  id: string,
  nome: string,
  janela: [string, string],
  o: Partial<Extract<Fase, { tipo: "mata-mata" }>> = {},
): Fase {
  return {
    id,
    nome,
    tipo: "mata-mata",
    jogos: 2,
    prorrogacao: false,
    penaltis: true,
    chaveamento: "sorteio",
    mando: "melhor-campanha",
    periodo: periodo(...janela),
    ...o,
  } as Fase;
}

function grupos(
  id: string,
  nome: string,
  janela: [string, string],
  n: number,
  turnos: number,
  classificam: number,
  entramAqui: Vaga[] = [],
): Fase {
  return {
    id,
    nome,
    tipo: "grupos",
    grupos: n,
    turnos,
    classificamPorGrupo: classificam,
    divisaoGrupos: "potes",
    periodo: periodo(...janela),
    entramAqui,
  };
}

// ======================================================================================== CONCACAF

const MLS = "usa-mls";
const LIGA_MX = "mex-liga-mx";
const LEAGUES_CUP = "concacaf-leagues-cup";
const CENTRO_AMERICANA = "concacaf-copa-centro-americana";
const CARIBE = "concacaf-copa-do-caribe";

/**
 * Copa dos Campeões 2026: 27 clubes. Direto às oitavas os campeões da Copa Centro-Americana, da Copa
 * do Caribe, da Leagues Cup, da MLS e da Liga MX; os outros 22 jogam a 1ª fase. Eliminatórias em ida
 * e volta e final em jogo único na casa de quem tem a melhor campanha.
 */
const COPA_DOS_CAMPEOES = competicao({
  id: "concacaf-champions-cup",
  nome: "Copa dos Campeões da CONCACAF",
  nomeCurto: "Copa dos Campeões",
  confederacao: "CONCACAF",
  calendario: ["02-03", "05-30"],
  campeaoAnterior: { temporada: "2025", campeao: "mex-cruz-azul", vice: "can-vancouver-whitecaps" },
  quantidade: 27,
  vagas: [
    melhores(MLS, 4),
    campeao("usa-open-cup"),
    pos(LEAGUES_CUP, 1, 2),
    melhores(LIGA_MX, 5),
    melhores("can-cpl", 3),
    pos(CENTRO_AMERICANA, 1, 2, 3, 4, 5),
    pos(CARIBE, 1, 2),
  ],
  fases: [
    mataMata("primeira-fase", "1ª fase", ["02-03", "02-26"], { prorrogacao: true }),
    mataMata("mata-mata", "Mata-mata", ["03-10", "05-30"], {
      finalJogoUnico: true,
      prorrogacao: true,
      chaveamento: "potes",
      entramAqui: [
        campeao(CENTRO_AMERICANA),
        campeao(CARIBE),
        campeao(LEAGUES_CUP),
        pos(MLS, 1),
        pos(LIGA_MX, 1),
      ],
    }),
  ],
});

/**
 * Leagues Cup: 18 da MLS e os 18 da Liga MX numa fase de 3 jogos, os 8 melhores no mata-mata em jogo
 * único. Os três primeiros vão à Copa dos Campeões do ano seguinte.
 */
const LEAGUES = competicao({
  id: LEAGUES_CUP,
  nome: "Leagues Cup",
  nomeCurto: "Leagues Cup",
  confederacao: "CONCACAF",
  calendario: ["07-29", "09-06"],
  campeaoAnterior: { temporada: "2025", campeao: "usa-seattle-sounders" },
  quantidade: 36,
  vagas: [melhores(MLS, 18), melhores(LIGA_MX, 18)],
  fases: [
    {
      id: "fase-de-liga",
      nome: "Fase de liga",
      tipo: "fase-de-liga",
      jogosPorTime: 3,
      potes: 1,
      classificamDireto: 8,
      periodo: periodo("07-29", "08-08"),
    },
    mataMata("mata-mata", "Mata-mata", ["08-19", "09-06"], {
      jogos: 1,
      chaveamento: "campanha",
    }),
  ],
});

/** Copa Centro-Americana: 20 clubes em 4 grupos de 5; os 6 melhores vão à Copa dos Campeões. */
const COPA_CENTRO_AMERICANA = competicao({
  id: CENTRO_AMERICANA,
  nome: "Copa Centro-Americana da CONCACAF",
  nomeCurto: "Copa Centro-Americana",
  confederacao: "CONCACAF",
  calendario: ["07-29", "12-03"],
  campeaoAnterior: { temporada: "2025", campeao: "crc-alajuelense" },
  quantidade: 20,
  vagas: [
    melhores("crc-liga-fpd", 4),
    melhores("hon-liga-nacional", 4),
    melhores("pan-lpf", 3),
    melhores("gua-liga-nacional", 3),
    melhores("slv-primera", 3),
    melhores("nca-liga-primera", 2),
    melhores("blz-premier-league", 1),
  ],
  fases: [
    grupos("grupos", "Fase de grupos", ["07-29", "09-25"], 4, 1, 2),
    mataMata("mata-mata", "Mata-mata", ["10-21", "12-03"], { chaveamento: "potes" }),
  ],
});

/** Copa do Caribe: 10 clubes em 2 grupos de 5; os 3 melhores vão à Copa dos Campeões. */
const COPA_DO_CARIBE = competicao({
  id: CARIBE,
  nome: "Copa do Caribe da CONCACAF",
  nomeCurto: "Copa do Caribe",
  confederacao: "CONCACAF",
  calendario: ["08-12", "12-03"],
  campeaoAnterior: { temporada: "2025", campeao: "jam-mount-pleasant" },
  quantidade: 10,
  vagas: [
    melhores("jam-premier-league", 2),
    melhores("tri-premier-league", 2),
    melhores("dom-liga-dominicana", 2),
    melhores("hai-ligue-haitienne", 1),
    melhores("sur-eerste-divisie", 1),
    melhores("pur-liga-puerto-rico", 1),
    melhores("cuw-prome-divishon", 1),
  ],
  fases: [
    grupos("grupos", "Fase de grupos", ["08-12", "10-02"], 2, 1, 2),
    mataMata("mata-mata", "Mata-mata", ["10-21", "12-03"], { chaveamento: "potes" }),
  ],
});

// ============================================================================================= AFC

const ELITE = "afc-champions-league";
const TWO = "afc-champions-league-two";
const oeste = { caminho: "oeste" } as const;
const leste = { caminho: "leste" } as const;

/**
 * Champions League Elite 2026/27: 32 clubes na fase de liga, 16 no Oeste e 16 no Leste (14 direto
 * e 2 da preliminar em cada região); 8 jogos para cada um dentro da região; oitavas na região em
 * ida e volta (1º x 8º...); quartas, semifinal e final em jogo único na Arábia Saudita.
 */
const CHAMPIONS_ELITE = competicao({
  id: ELITE,
  nome: "AFC Champions League Elite",
  nomeCurto: "Champions da Ásia",
  confederacao: "AFC",
  calendario: ["08-10", "05-01"],
  campeaoAnterior: { temporada: "2025/26", campeao: "ksa-al-ahli" },
  campeoesAnteriores: [{ temporada: "2024/25", campeao: "ksa-al-ahli" }],
  quantidade: 36,
  // Preliminar (jogo único, na região): 4 no Oeste e 4 no Leste.
  vagas: [
    melhores("ksa-pro-league", 1, oeste),
    melhores("uae-pro-league", 1, oeste),
    melhores("uzb-super-league", 1, oeste),
    melhores("jor-pro-league", 1, oeste),
    campeao(TWO, { ...leste, alternativas: [{ de: "jpn-j1", posicoes: [5, 6] }] }),
    melhores("kor-k-league-1", 1, leste),
    melhores("aus-a-league", 1, leste),
    melhores("vie-v-league-1", 1, leste),
  ],
  fases: [
    mataMata("preliminar", "Fase preliminar", ["08-10", "08-13"], {
      jogos: 1,
      prorrogacao: true,
      chaveamento: "caminhos",
    }),
    {
      id: "fase-de-liga",
      nome: "Fase de liga",
      tipo: "fase-de-liga",
      jogosPorTime: 8,
      potes: 4,
      grupos: 2,
      classificamDireto: 8,
      periodo: periodo("09-14", "02-17"),
      entramAqui: [
        melhores("ksa-pro-league", 4, oeste),
        melhores("uae-pro-league", 3, oeste),
        melhores("qat-stars-league", 3, oeste),
        melhores("irn-pro-league", 2, oeste),
        melhores("uzb-super-league", 1, oeste),
        melhores("irq-stars-league", 1, oeste),
        melhores("jpn-j1", 4, leste),
        melhores("kor-k-league-1", 3, leste),
        melhores("tha-thai-league-1", 3, leste),
        melhores("chn-super-league", 2, leste),
        melhores("aus-a-league", 1, leste),
        melhores("mas-super-league", 1, leste),
      ],
    },
    mataMata("oitavas", "Oitavas de final", ["03-01", "03-17"], {
      prorrogacao: true,
      chaveamento: "caminhos-campanha",
    }),
    mataMata("fase-final", "Fase final", ["04-23", "05-01"], {
      jogos: 1,
      prorrogacao: true,
      mando: "neutro",
    }),
  ],
});

/**
 * Champions League Two 2026/27: 32 clubes em 8 grupos (4 no Oeste, 4 no Leste), com os perdedores da
 * preliminar da Elite; chave regional até a final em jogo único.
 */
const CHAMPIONS_TWO = competicao({
  id: TWO,
  nome: "AFC Champions League Two",
  nomeCurto: "Champions Two",
  confederacao: "AFC",
  calendario: ["08-12", "05-15"],
  campeaoAnterior: { temporada: "2025/26", campeao: "jpn-gamba-osaka" },
  exclui: [ELITE],
  quantidade: 35,
  // Preliminar: Índia, Turcomenistão e Kuwait no Oeste; Indonésia e Filipinas no Leste.
  vagas: [
    melhores("ind-super-league", 2, oeste),
    melhores("tkm-yokary-liga", 1, oeste),
    melhores("kuw-premier-league", 1, oeste),
    melhores("idn-super-league", 1, leste),
    melhores("phi-football-league", 1, leste),
  ],
  fases: [
    mataMata("preliminar", "Fase preliminar", ["08-12", "08-31"], {
      jogos: 1,
      prorrogacao: true,
      chaveamento: "caminhos",
    }),
    grupos("grupos", "Fase de grupos", ["09-15", "12-09"], 8, 2, 2, [
      ...["ksa-pro-league", "uae-pro-league", "qat-stars-league", "irn-pro-league"].map((l) =>
        melhores(l, 1, oeste),
      ),
      ...["uzb-super-league", "irq-stars-league", "jor-pro-league"].map((l) =>
        melhores(l, 1, oeste),
      ),
      melhores("bhr-premier-league", 2, oeste),
      melhores("oma-professional-league", 2, oeste),
      melhores("kuw-premier-league", 1, oeste),
      ...["jpn-j1", "kor-k-league-1", "tha-thai-league-1", "chn-super-league"].map((l) =>
        melhores(l, 1, leste),
      ),
      ...["aus-a-league", "mas-super-league", "vie-v-league-1"].map((l) => melhores(l, 1, leste)),
      melhores("sgp-premier-league", 2, leste),
      melhores("hkg-premier-league", 2, leste),
      melhores("cam-premier-league", 2, leste),
      eliminados(ELITE, "preliminar", 2, { doCaminho: "oeste", caminho: "oeste", depois: true }),
      eliminados(ELITE, "preliminar", 2, { doCaminho: "leste", caminho: "leste", depois: true }),
    ]),
    mataMata("mata-mata", "Mata-mata", ["02-09", "05-15"], {
      finalJogoUnico: true,
      prorrogacao: true,
      chaveamento: "caminhos-campanha",
    }),
  ],
});

// ============================================================================================= CAF

/** As 12 federações com duas vagas em cada competição (ranking de cinco anos da CAF para 2026/27). */
const CAF_DUAS = [
  "alg-ligue-1",
  "mar-botola-pro",
  "egy-premier-league",
  "tun-ligue-1",
  "ang-girabola",
  "civ-ligue-1",
  "mli-premiere-division",
  "nga-npfl",
  "cod-linafoot",
  "rsa-premiership",
  "sdn-premier-league",
  "tan-premier-league",
];
/** As outras federações, com uma vaga em cada (das que costumam se inscrever). */
const CAF_UMA = [
  "bdi-ligue-a",
  "ben-ligue-1",
  "bfa-premier-league",
  "bot-premier-league",
  "cgo-ligue-1",
  "cha-ligue-1",
  "cmr-elite-one",
  "cpv-campeonato",
  "eqg-liga-nacional",
  "eth-premier-league",
  "gab-championnat-national",
  "gam-league-first-division",
  "gha-premier-league",
  "gnb-campeonato",
  "gui-ligue-1",
  "ken-premier-league",
  "lbr-first-division",
  "lby-premier-league",
  "les-premier-league",
  "mad-orange-pro-league",
  "moz-mocambola",
  "mri-premier-league",
  "mtn-super-d1",
  "mwi-super-league",
  "nam-premiership",
  "nig-super-ligue",
  "rwa-premier-league",
  "sen-ligue-1",
  "sey-premier-league",
  "sle-premier-league",
  "som-first-division",
  "ssd-premier-league",
  "swz-premier-league",
  "tog-championnat-national",
  "uga-premier-league",
  "zam-super-league",
  "zim-premier-soccer-league",
];

const fasesCaf = (byes: Vaga[]): Fase[] => [
  mataMata("preliminar-1", "1ª fase preliminar", ["09-04", "09-13"]),
  mataMata("preliminar-2", "2ª fase preliminar", ["10-16", "10-25"], { entramAqui: byes }),
  grupos("grupos", "Fase de grupos", ["11-27", "01-24"], 4, 2, 2),
  mataMata("mata-mata", "Mata-mata", ["02-26", "05-31"], { chaveamento: "potes" }),
];

/**
 * Champions League da CAF 2026/27: 61 clubes. O campeão e os dois mais fortes entram na 2ª fase
 * preliminar; os outros 58 jogam a 1ª. 16 nos grupos, quartas, semifinal e final em ida e volta.
 */
const CAF_CHAMPIONS = competicao({
  id: "caf-champions-league",
  nome: "CAF Champions League",
  nomeCurto: "Champions da África",
  confederacao: "CAF",
  calendario: ["09-04", "05-31"],
  campeaoAnterior: { temporada: "2025/26", campeao: "rsa-mamelodi-sundowns" },
  campeoesAnteriores: [
    { temporada: "2024/25", campeao: "egy-pyramids", vice: "rsa-mamelodi-sundowns" },
  ],
  quantidade: 61,
  vagas: [
    ...CAF_DUAS.map((l) =>
      l === "egy-premier-league" || l === "mar-botola-pro" ? melhores(l, 1) : melhores(l, 2),
    ),
    // Sem Eritreia, Djibuti, São Tomé e República Centro-Africana (que costumam não se inscrever).
    ...CAF_UMA.filter((l) => !["cha-ligue-1"].includes(l)).map((l) => melhores(l, 1)),
  ],
  fases: fasesCaf([
    campeao("caf-champions-league", {
      alternativas: [{ de: "rsa-premiership", posicoes: [1, 2, 3] }],
    }),
    melhores("egy-premier-league", 1),
    melhores("mar-botola-pro", 1),
  ]),
});

/**
 * Copa das Confederações da CAF 2026/27: 56 clubes, 8 direto na 2ª fase preliminar. Quem cai nas
 * preliminares da Champions League não vem para cá (regra atual da CAF).
 */
const CAF_CONFEDERACOES = competicao({
  id: "caf-confederation-cup",
  nome: "Copa das Confederações da CAF",
  nomeCurto: "Copa das Confederações",
  confederacao: "CAF",
  calendario: ["09-04", "05-31"],
  campeaoAnterior: { temporada: "2025/26", campeao: "alg-usm-alger" },
  exclui: ["caf-champions-league"],
  quantidade: 56,
  vagas: [
    ...CAF_DUAS.map((l) =>
      [
        "egy-premier-league",
        "mar-botola-pro",
        "alg-ligue-1",
        "rsa-premiership",
        "tun-ligue-1",
        "tan-premier-league",
        "sdn-premier-league",
      ].includes(l)
        ? melhores(l, 1)
        : melhores(l, 2),
    ),
    ...CAF_UMA.filter(
      (l) =>
        ![
          "cha-ligue-1",
          "eqg-liga-nacional",
          "gnb-campeonato",
          "mri-premier-league",
          "les-premier-league",
          "som-first-division",
        ].includes(l),
    ).map((l) => melhores(l, 1)),
  ],
  fases: fasesCaf([
    campeao("caf-confederation-cup", {
      alternativas: [{ de: "alg-ligue-1", posicoes: [1, 2, 3, 4] }],
    }),
    ...[
      "egy-premier-league",
      "mar-botola-pro",
      "alg-ligue-1",
      "rsa-premiership",
      "tun-ligue-1",
      "tan-premier-league",
      "sdn-premier-league",
    ].map((l) => melhores(l, 1)),
  ]),
});

// ============================================================================================= OFC

/**
 * Champions League da OFC 2026: qualificatória em sede única com os campeões de Samoa Americana,
 * Ilhas Cook, Samoa e Tonga (o vencedor sobe); fase final em sede única com dois grupos de 4,
 * semifinal e final em jogo único.
 */
const OFC_CHAMPIONS = competicao({
  id: "ofc-champions-league",
  nome: "OFC Champions League",
  nomeCurto: "Champions da Oceania",
  confederacao: "OFC",
  calendario: ["01-31", "08-22"],
  campeaoAnterior: { temporada: "2025", campeao: "nzl-auckland-city" },
  quantidade: 11,
  vagas: [
    "asa-fbfas-premier-league",
    "cok-round-cup",
    "sam-national-league",
    "tga-major-league",
  ].map((l) => melhores(l, 1)),
  fases: [
    {
      id: "qualificatoria",
      nome: "Qualificatória",
      tipo: "grupos",
      grupos: 1,
      turnos: 1,
      classificamPorGrupo: 1,
      periodo: periodo("01-31", "02-06"),
    },
    grupos(
      "grupos",
      "Fase de grupos",
      ["08-09", "08-16"],
      2,
      1,
      2,
      [
        "fij-premier-league",
        "sol-s-league",
        "nzl-northern-league",
        "png-national-soccer-league",
        "van-national-super-league",
        "tah-ligue-1",
        "ncl-super-ligue",
      ].map((l) => melhores(l, 1)),
    ),
    mataMata("mata-mata", "Mata-mata", ["08-19", "08-22"], {
      jogos: 1,
      prorrogacao: true,
      chaveamento: "potes",
      mando: "neutro",
    }),
  ],
});

export const OUTRAS_CONFEDERACOES: readonly CompeticaoEntrada[] = [
  COPA_DOS_CAMPEOES,
  LEAGUES,
  COPA_CENTRO_AMERICANA,
  COPA_DO_CARIBE,
  CHAMPIONS_ELITE,
  CHAMPIONS_TWO,
  CAF_CHAMPIONS,
  CAF_CONFEDERACOES,
  OFC_CHAMPIONS,
];
