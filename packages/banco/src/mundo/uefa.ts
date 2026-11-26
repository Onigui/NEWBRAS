/**
 * Champions League, Europa League e Conference League no formato real de 2026/27 (etapa 10a3),
 * pela lista de acesso da UEFA: o ranking das federações define quantas vagas cada país tem e em
 * que rodada cada clube entra. Qualificatórias com caminho dos campeões e caminho da liga (ou
 * principal), eliminados descendo para a competição de baixo, fase de liga de 36 com potes e
 * playoff do 9º ao 24º. A Rússia segue suspensa e Liechtenstein não tem liga no banco.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];

/** Ranking das federações de 2026/27: [sigla, liga principal, copa nacional (se houver no banco)]. */
const RANKING: Record<number, readonly [string, string, string?]> = {
  1: ["ENG", "eng-premier-league", "eng-fa-cup"],
  2: ["ITA", "ita-serie-a", "ita-coppa-italia"],
  3: ["ESP", "esp-laliga", "esp-copa-del-rey"],
  4: ["GER", "ger-bundesliga", "ger-dfb-pokal"],
  5: ["FRA", "fra-ligue-1", "fra-coupe-de-france"],
  6: ["NED", "ned-eredivisie", "ned-knvb-beker"],
  7: ["POR", "por-liga-portugal", "por-taca-de-portugal"],
  8: ["BEL", "bel-pro-league", "bel-copa"],
  9: ["CZE", "cze-chance-liga"],
  10: ["TUR", "tur-super-lig", "tur-copa"],
  11: ["NOR", "nor-eliteserien"],
  12: ["GRE", "gre-super-league", "gre-copa"],
  13: ["AUT", "aut-bundesliga", "aut-ofb-cup"],
  14: ["SCO", "sco-premiership", "sco-scottish-cup"],
  15: ["POL", "pol-ekstraklasa"],
  16: ["DEN", "den-superliga", "den-landspokal"],
  17: ["SUI", "sui-super-league", "sui-copa"],
  18: ["ISR", "isr-ligat-haal"],
  19: ["CYP", "cyp-first-division"],
  20: ["SWE", "swe-allsvenskan", "swe-svenska-cupen"],
  21: ["CRO", "cro-hnl"],
  22: ["SRB", "srb-superliga"],
  23: ["UKR", "ukr-premier-league"],
  24: ["HUN", "hun-nb-i"],
  25: ["ROU", "rou-superliga"],
  27: ["SVK", "svk-nike-liga"],
  28: ["SVN", "svn-prvaliga"],
  29: ["BUL", "bul-efbet-liga"],
  30: ["AZE", "aze-premier-league"],
  31: ["IRL", "irl-premier-division"],
  32: ["MDA", "mda-super-liga"],
  33: ["ISL", "isl-besta-deild"],
  34: ["BIH", "bih-premijer-liga"],
  35: ["ARM", "arm-premier-league"],
  36: ["LVA", "lva-virsliga"],
  37: ["KVX", "kvx-superliga"],
  38: ["FIN", "fin-veikkausliiga"],
  39: ["KAZ", "kaz-premier-league"],
  40: ["FRO", "fro-premier-league"],
  41: ["MLT", "mlt-premier-league"],
  42: ["NIR", "nir-premiership"],
  43: ["LTU", "ltu-a-lyga"],
  45: ["EST", "est-meistriliiga"],
  46: ["ALB", "alb-kategoria-superiore"],
  47: ["MNE", "mne-prva-liga"],
  48: ["LUX", "lux-bgl-ligue"],
  49: ["WAL", "wal-cymru-premier"],
  50: ["GEO", "geo-erovnuli-liga"],
  51: ["MKD", "mkd-prva-liga"],
  52: ["BLR", "blr-premier-league"],
  53: ["AND", "and-primera-divisio"],
  54: ["GIB", "gib-premier-division"],
  55: ["SMR", "smr-campionato"],
};

const UCL = "uefa-champions-league";
const UEL = "uefa-europa-league";
const UECL = "uefa-conference-league";

/** Federações de a até b que existem no ranking (sem a Rússia, 26, e Liechtenstein, 44). */
const de = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i).filter((r) => RANKING[r]);
const ligaDe = (r: number) => RANKING[r]![1];

/** Colocações exatas na liga (Champions: campeão, vice...). */
function lugares(r: number, posicoes: number[], extra: Partial<Vaga> = {}): Vaga {
  return { de: ligaDe(r), criterio: "posicoes", posicoes, repassa: true, ...extra };
}

/** Campeão da liga, no caminho dos campeões (não passa a vaga para o vice). */
const campeaoDaLiga = (r: number): Vaga => lugares(r, [1], { repassa: false, caminho: "campeoes" });

/**
 * Próximos da liga que ainda não têm vaga numa competição da UEFA (a Europa League e a Conference
 * League excluem os de cima). "1, 2, 3" = os três melhores que sobram.
 */
const proximos = (r: number, quantos: number, extra: Partial<Vaga> = {}): Vaga =>
  lugares(
    r,
    Array.from({ length: quantos }, (_, i) => i + 1),
    extra,
  );

/** Campeão da copa nacional; sem copa no banco, o melhor da liga que sobra. */
function campeaoDaCopa(r: number, extra: Partial<Vaga> = {}): Vaga {
  const copa = RANKING[r]![2];
  return copa ? { de: copa, criterio: "campeao", ...extra } : proximos(r, 1, extra);
}

const eliminados = (
  deCompeticao: string,
  fase: string,
  quantidade: number,
  extra: Partial<Vaga> = {},
): Vaga => ({
  de: deCompeticao,
  criterio: "eliminados",
  fase,
  quantidade,
  ...extra,
});

const periodo = (inicio: string, fim: string) => ({ inicio, fim });

/** Eliminatória de ida e volta (UEFA: prorrogação e pênaltis no jogo de volta). */
function qualificatoria(
  id: string,
  nome: string,
  janela: readonly [string, string],
  entramAqui: Vaga[] = [],
  chaveamento: "caminhos" | "sorteio" = "caminhos",
): Fase {
  return {
    id,
    nome,
    tipo: "mata-mata",
    jogos: 2,
    prorrogacao: true,
    penaltis: true,
    chaveamento,
    mando: "melhor-campanha",
    periodo: periodo(janela[0], janela[1]),
    entramAqui,
  };
}

/** Fase de liga, playoff do 9º ao 24º e mata-mata até a final em jogo único em campo neutro. */
function faseFinal(
  o: {
    jogos: number;
    potes: number;
    liga: readonly [string, string];
    playoff: readonly [string, string];
    mataMata: readonly [string, string];
  },
  entramAqui: Vaga[],
): Fase[] {
  return [
    {
      id: "fase-de-liga",
      nome: "Fase de liga",
      tipo: "fase-de-liga",
      jogosPorTime: o.jogos,
      potes: o.potes,
      classificamDireto: 8,
      playoff: { de: 9, ate: 24 },
      periodo: periodo(o.liga[0], o.liga[1]),
      entramAqui,
    },
    {
      id: "playoff",
      nome: "Playoff do mata-mata",
      tipo: "mata-mata",
      jogos: 2,
      prorrogacao: true,
      penaltis: true,
      chaveamento: "campanha",
      mando: "melhor-campanha",
      periodo: periodo(o.playoff[0], o.playoff[1]),
    },
    {
      id: "mata-mata",
      nome: "Mata-mata",
      tipo: "mata-mata",
      jogos: 2,
      finalJogoUnico: true,
      prorrogacao: true,
      penaltis: true,
      chaveamento: "campanha",
      mando: "neutro",
      periodo: periodo(o.mataMata[0], o.mataMata[1]),
    },
  ];
}

// ------------------------------------------------------------------------------- Champions League

/**
 * Champions League 2026/27: 29 direto na fase de liga (campeões das federações 1 a 10, os 6
 * primeiros países com o vice, os 5 primeiros com o 3º, os 4 primeiros com o 4º, o 5º da
 * Inglaterra e da Espanha pelas vagas de desempenho europeu, o campeão da Champions e o da Europa
 * League); 7 pelas qualificatórias: 5 do caminho dos campeões e 2 do caminho da liga.
 */
const CHAMPIONS: CompeticaoEntrada = {
  id: UCL,
  nome: "UEFA Champions League",
  nomeCurto: "Champions League",
  tipo: "continental",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "UEFA" },
  calendario: periodo("07-07", "06-05"),
  campeaoAnterior: { temporada: "2025/26", campeao: "fra-psg", vice: "eng-arsenal" },
  // O de 2024/25 conta para o Mundial de Clubes de 2029.
  campeoesAnteriores: [{ temporada: "2024/25", campeao: "fra-psg", vice: "ita-inter" }],
  participantes: {
    fixos: [],
    // 1ª qualificatória: campeões das federações 24, 25 e 29 a 55.
    vagas: [24, 25, ...de(29, 55)].map(campeaoDaLiga),
    quantidade: 81,
  },
  fases: [
    qualificatoria("q1", "1ª qualificatória", ["07-07", "07-15"]),
    qualificatoria(
      "q2",
      "2ª qualificatória",
      ["07-21", "07-29"],
      [
        ...[...de(15, 22), 27, 28].map(campeaoDaLiga),
        ...[10, 13, 14, 15].map((r) => lugares(r, [2], { caminho: "liga" })),
      ],
    ),
    qualificatoria(
      "q3",
      "3ª qualificatória",
      ["08-04", "08-11"],
      [
        lugares(8, [2], { caminho: "liga" }),
        lugares(9, [2], { caminho: "liga" }),
        lugares(6, [3], { caminho: "liga" }),
        lugares(5, [4], { caminho: "liga" }),
        lugares(11, [2], { caminho: "liga" }),
        lugares(12, [2], { caminho: "liga" }),
      ],
    ),
    qualificatoria(
      "rodada-playoff",
      "Rodada de playoff",
      ["08-18", "08-26"],
      de(11, 14).map(campeaoDaLiga),
    ),
    ...faseFinal(
      {
        jogos: 8,
        potes: 4,
        liga: ["09-15", "01-27"],
        playoff: ["02-16", "02-24"],
        mataMata: ["03-09", "06-05"],
      },
      [
        lugares(1, [1, 2, 3, 4, 5]),
        lugares(2, [1, 2, 3, 4]),
        lugares(3, [1, 2, 3, 4, 5]),
        lugares(4, [1, 2, 3, 4]),
        lugares(5, [1, 2, 3]),
        lugares(6, [1, 2]),
        ...[7, 8, 9, 10].map((r) => lugares(r, [1])),
        // Campeões da Champions e da Europa League (depois das vagas pela liga: se já estiverem
        // classificados, a vaga vai para o campeão ucraniano e para o vice português).
        { de: UCL, criterio: "campeao", alternativas: [{ de: ligaDe(23), posicoes: [1] }] },
        { de: UEL, criterio: "campeao", alternativas: [{ de: ligaDe(7), posicoes: [2] }] },
      ],
    ),
  ],
};

// -------------------------------------------------------------------------------- Europa League

/**
 * Europa League 2026/27: campeões de copa e colocados nas ligas em quatro rodadas de
 * qualificação, com os eliminados da Champions entrando em cada uma (os campeões que caem na 2ª
 * qualificatória formam o caminho dos campeões da 3ª). Na fase de liga, o campeão da Conference,
 * os campeões de copa das 7 primeiras federações, o 5º das 5 primeiras, os 12 vencedores do
 * playoff e os 11 eliminados da Champions.
 */
const EUROPA: CompeticaoEntrada = {
  id: UEL,
  nome: "UEFA Europa League",
  nomeCurto: "Europa League",
  tipo: "continental",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "UEFA" },
  calendario: periodo("07-09", "05-26"),
  campeaoAnterior: { temporada: "2025/26", campeao: "eng-aston-villa" },
  participantes: {
    fixos: [],
    // 1ª qualificatória: campeões de copa das federações 21 a 33.
    vagas: de(21, 33).map((r) => campeaoDaCopa(r)),
    exclui: [UCL],
    quantidade: 76,
  },
  fases: [
    qualificatoria("q1", "1ª qualificatória", ["07-09", "07-16"], [], "sorteio"),
    qualificatoria(
      "q2",
      "2ª qualificatória",
      ["07-23", "07-30"],
      [
        ...de(16, 20).map((r) => campeaoDaCopa(r)),
        ...de(7, 12).map((r) => proximos(r, 1)),
        proximos(6, 1),
      ],
      "sorteio",
    ),
    qualificatoria(
      "q3",
      "3ª qualificatória",
      ["08-06", "08-13"],
      [
        eliminados(UCL, "q2", 12, { doCaminho: "campeoes", caminho: "campeoes" }),
        ...de(13, 15).map((r) => campeaoDaCopa(r)),
        eliminados(UCL, "q2", 2, { doCaminho: "liga" }),
      ],
    ),
    qualificatoria(
      "rodada-playoff",
      "Rodada de playoff",
      ["08-20", "08-27"],
      [
        ...de(8, 12).map((r) => campeaoDaCopa(r)),
        eliminados(UCL, "q3", 6, { doCaminho: "campeoes" }),
      ],
      "sorteio",
    ),
    ...faseFinal(
      {
        jogos: 8,
        potes: 4,
        liga: ["09-16", "01-28"],
        playoff: ["02-18", "02-25"],
        mataMata: ["03-11", "05-26"],
      },
      [
        ...de(1, 7).map((r) => campeaoDaCopa(r)),
        ...de(1, 5).map((r) => proximos(r, 1)),
        // Campeão da Conference (se já tiver vaga, o melhor belga que sobra).
        {
          de: UECL,
          criterio: "campeao",
          alternativas: [{ de: ligaDe(8), posicoes: [1, 2, 3, 4] }],
        },
        eliminados(UCL, "rodada-playoff", 7),
        eliminados(UCL, "q3", 4, { doCaminho: "liga" }),
      ],
    ),
  ],
};

// ---------------------------------------------------------------------------- Conference League

/** Quantas vagas de liga cada federação tem na Conference League (fora as de copa). */
const DA_LIGA_NA_1A: readonly (readonly [number, number])[] = [
  ...de(34, 37).map((r) => [r, 3] as const),
  ...de(38, 43).map((r) => [r, 2] as const),
  ...de(45, 50).map((r) => [r, 3] as const),
  ...de(51, 55).map((r) => [r, 2] as const),
];

/**
 * Conference League 2026/27: 52 clubes na 1ª qualificatória (as federações de 34 a 55), as de 6 a
 * 33 entrando na 2ª, os 6º colocados das 5 primeiras na rodada de playoff, e os eliminados da
 * Champions (caminho dos campeões) e da Europa League em cada rodada. Fase de liga de 36 com 6
 * jogos para cada um, 1 adversário de cada um dos 6 potes.
 */
const CONFERENCE: CompeticaoEntrada = {
  id: UECL,
  nome: "UEFA Conference League",
  nomeCurto: "Conference League",
  tipo: "continental",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "UEFA" },
  calendario: periodo("07-09", "05-27"),
  campeaoAnterior: { temporada: "2025/26", campeao: "eng-crystal-palace" },
  participantes: {
    fixos: [],
    vagas: DA_LIGA_NA_1A.map(([r, n]) => proximos(r, n)),
    exclui: [UCL, UEL],
    quantidade: 164,
  },
  fases: [
    qualificatoria("q1", "1ª qualificatória", ["07-09", "07-16"], [], "sorteio"),
    qualificatoria(
      "q2",
      "2ª qualificatória",
      ["07-23", "07-30"],
      [
        eliminados(UCL, "q1", 14, { caminho: "campeoes" }),
        ...de(6, 12).map((r) => proximos(r, 1)),
        ...de(13, 33).map((r) => proximos(r, 2)),
        // Os campeões de copa das federações 38 a 43 entram aqui.
        ...de(38, 43).map((r) => proximos(r, 1)),
        eliminados(UEL, "q1", 6),
      ],
    ),
    qualificatoria("q3", "3ª qualificatória", ["08-06", "08-13"], [eliminados(UEL, "q2", 9)]),
    qualificatoria(
      "rodada-playoff",
      "Rodada de playoff",
      ["08-20", "08-27"],
      [
        eliminados(UEL, "q3", 6, { doCaminho: "campeoes", caminho: "campeoes" }),
        ...de(1, 5).map((r) => proximos(r, 1)),
        eliminados(UEL, "q3", 7, { doCaminho: "principal" }),
      ],
    ),
    ...faseFinal(
      {
        jogos: 6,
        potes: 6,
        liga: ["10-01", "12-17"],
        playoff: ["02-18", "02-25"],
        mataMata: ["03-11", "05-27"],
      },
      [eliminados(UEL, "rodada-playoff", 12)],
    ),
  ],
};

export const UEFA: readonly CompeticaoEntrada[] = [CHAMPIONS, EUROPA, CONFERENCE];
