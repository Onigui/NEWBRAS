/**
 * Copas continentais de seleções (etapa 11d): Copa Africana de 2027 com as eliminatórias, Copa da
 * Ásia de 2027, Nations League da Concacaf de 2026/27 (Ligas A e B), Copa Ouro de 2027 e Copa
 * América de 2028.
 *
 * As edições seguintes repetem os participantes, sorteados de novo nos grupos, até as eliminatórias
 * próprias de cada uma entrarem no jogo.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];
type Regra = NonNullable<CompeticaoEntrada["classificados"]>[number];
type Confederacao = "CONMEBOL" | "CONCACAF" | "AFC" | "CAF";

const DESEMPATE: CompeticaoEntrada["desempate"] = [
  "pontos",
  "confronto-direto",
  "saldo-confronto-direto",
  "saldo",
  "gols-pro",
  "vitorias",
];

const grupos = (n: number, turnos: number, datas: string[], o: Record<string, unknown> = {}) =>
  ({
    id: "grupos",
    nome: "Fase de grupos",
    tipo: "grupos",
    grupos: n,
    turnos,
    classificamPorGrupo: 0,
    divisaoGrupos: "ordem-da-lista",
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

/** Mata-mata de 16 depois dos grupos (os 2 primeiros e os 4 melhores terceiros de 6 grupos). */
const mataMataDe16 = (datas: [string, string, string, string]): Fase[] => [
  mataMata("oitavas", "Oitavas de final", [datas[0]], {
    chaveamento: "potes",
    evitarMesmoGrupo: true,
  }),
  mataMata("quartas", "Quartas de final", [datas[1]]),
  mataMata("semifinal", "Semifinal", [datas[2]]),
  mataMata("final", "Final", [datas[3]]),
];

function copa(o: {
  id: string;
  nome: string;
  nomeCurto: string;
  tipo?: "selecoes" | "eliminatorias";
  confederacao: Confederacao;
  aCadaAnos: number;
  anoFinal: number;
  calendario: { inicio: string; fim: string };
  fixos: string[];
  quantidade: number;
  fases: Fase[];
  gruposFixosAte?: number;
  classificados?: Partial<Regra>[];
  campeaoAnterior?: CompeticaoEntrada["campeaoAnterior"];
}): CompeticaoEntrada {
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: o.tipo ?? "selecoes",
    categoria: "selecoes",
    escopo: { tipo: "confederacao", confederacao: o.confederacao },
    periodicidade: { aCadaAnos: o.aCadaAnos, anoBase: o.anoFinal },
    calendario: o.calendario,
    participantes: { fixos: o.fixos, quantidade: o.quantidade },
    fases: o.fases,
    desempate: DESEMPATE,
    ...(o.gruposFixosAte ? { gruposFixosAte: o.gruposFixosAte } : {}),
    classificados: (o.classificados ?? []).map((r) => ({ porGrupo: false, ...r })) as Regra[],
    ...(o.campeaoAnterior ? { campeaoAnterior: o.campeaoAnterior } : {}),
  } as CompeticaoEntrada;
}

const classificadosDe = (de: string, quantidade: number, extra: Partial<Vaga> = {}): Vaga =>
  ({ de, criterio: "classificados", quantidade, ...extra }) as Vaga;

// ------------------------------------------------------------------------- Copa Africana

const ANFITRIOES_CAN = ["KEN", "UGA", "TAN"];

/**
 * Eliminatórias da Copa Africana de 2027 (setembro de 2026 a março de 2027): os 12 grupos do
 * sorteio de maio de 2026, seis rodadas nas datas FIFA. Passam os 2 primeiros; nos grupos dos
 * anfitriões (Quênia, Uganda e Tanzânia, já classificados), só o melhor dos outros.
 */
const ELIMINATORIAS_CAN = copa({
  id: "caf-eliminatorias-copa-africana",
  nome: "Eliminatórias da Copa Africana",
  nomeCurto: "Elim. Copa Africana",
  tipo: "eliminatorias",
  confederacao: "CAF",
  aCadaAnos: 2,
  anoFinal: 2027,
  calendario: { inicio: "09-20", fim: "03-31" },
  // Grupos A a L, na ordem do sorteio.
  fixos: [
    ...["MAR", "GAB", "NIG", "LES"],
    ...["EGY", "ANG", "MWI", "SSD"],
    ...["CIV", "GHA", "GAM", "SOM"],
    ...["RSA", "GUI", "KEN", "ERI"],
    ...["COD", "EQG", "SLE", "ZIM"],
    ...["BFA", "BEN", "MTN", "CTA"],
    ...["CMR", "COM", "NAM", "CGO"],
    ...["TUN", "UGA", "LBY", "BOT"],
    ...["ALG", "ZAM", "TOG", "BDI"],
    ...["SEN", "MOZ", "SDN", "ETH"],
    ...["MLI", "CPV", "RWA", "LBR"],
    ...["NGA", "MAD", "TAN", "GNB"],
  ],
  quantidade: 48,
  gruposFixosAte: 2027,
  fases: [grupos(12, 2, ["09-24", "09-28", "11-12", "11-16", "03-25", "03-29"])],
  classificados: [{ fase: "grupos", posicoes: [1, 2], porGrupo: true, anfitrioes: ANFITRIOES_CAN }],
});

/** Copa Africana de 2027 (19/06 a 17/07, no Quênia, em Uganda e na Tanzânia): 24 em 6 grupos. */
const COPA_AFRICANA = copa({
  id: "caf-copa-africana",
  nome: "Copa Africana de Nações",
  nomeCurto: "Copa Africana",
  confederacao: "CAF",
  aCadaAnos: 2,
  anoFinal: 2027,
  calendario: { inicio: "06-19", fim: "07-17" },
  fixos: ANFITRIOES_CAN,
  quantidade: 24,
  fases: [
    grupos(6, 1, ["06-20", "06-24", "06-28"], {
      classificamPorGrupo: 2,
      melhores: { posicao: 3, quantidade: 4 },
      divisaoGrupos: "potes",
      entramAqui: [classificadosDe("caf-eliminatorias-copa-africana", 21)],
    }),
    ...mataMataDe16(["07-02", "07-06", "07-10", "07-17"]),
  ],
});

// ---------------------------------------------------------------------------- Copa da Ásia

/**
 * Copa da Ásia de 2027 na Arábia Saudita, adiada para 23/12/2027 a 21/01/2028: os 6 grupos do
 * sorteio de maio de 2026 (o Iêmen completou o grupo E).
 */
const COPA_DA_ASIA = copa({
  id: "afc-copa-da-asia",
  nome: "Copa da Ásia",
  nomeCurto: "Copa da Ásia",
  confederacao: "AFC",
  aCadaAnos: 4,
  anoFinal: 2028,
  calendario: { inicio: "12-23", fim: "01-21" },
  fixos: [
    ...["KSA", "KUW", "OMA", "PLE"],
    ...["UZB", "BHR", "PRK", "JOR"],
    ...["IRN", "SYR", "KGZ", "CHN"],
    ...["AUS", "TJK", "IRQ", "SGP"],
    ...["KOR", "UAE", "VIE", "YEM"],
    ...["JPN", "QAT", "THA", "IDN"],
  ],
  quantidade: 24,
  gruposFixosAte: 2028,
  fases: [
    grupos(6, 1, ["12-24", "12-28", "01-01"], {
      classificamPorGrupo: 2,
      melhores: { posicao: 3, quantidade: 4 },
    }),
    ...mataMataDe16(["01-06", "01-10", "01-14", "01-21"]),
  ],
  campeaoAnterior: { temporada: "2024", campeao: "QAT", vice: "JOR" },
});

// ---------------------------------------------------------------------------- Concacaf

/**
 * Nations League da Concacaf de 2026/27, Liga A: México, Estados Unidos, Canadá e Panamá começam nas
 * quartas; as outras jogam 2 grupos (no real, de 6 em formato suíço; a Martinica, que não é da
 * FIFA, fica fora), e os 2 primeiros de cada vão às quartas em ida e volta. A fase final é em março
 * de 2027. Classifica para a Copa Ouro os 4 das semifinais, os 4 que caíram nas quartas e os 2
 * terceiros colocados dos grupos.
 */
const NATIONS_LEAGUE_A = copa({
  id: "concacaf-nations-league-a",
  nome: "Nations League da Concacaf A",
  nomeCurto: "Nations League A",
  confederacao: "CONCACAF",
  aCadaAnos: 2,
  anoFinal: 2027,
  calendario: { inicio: "09-20", fim: "03-31" },
  fixos: [...["CUW", "HAI", "DOM", "CRC", "TRI", "NCA"], ...["GUA", "JAM", "SUR", "HON", "SLV"]],
  quantidade: 15,
  gruposFixosAte: 2027,
  fases: [
    grupos(2, 1, ["09-24", "09-27", "09-30", "10-02", "10-05"], {
      classificamPorGrupo: 2,
      divisaoGrupos: "ordem-da-lista",
    }),
    mataMata("quartas", "Quartas de final", ["11-12", "11-16"], {
      jogos: 2,
      chaveamento: "potes",
      fixosAqui: ["MEX", "USA", "CAN", "PAN"],
    }),
    mataMata("semifinal", "Semifinal", ["03-25"]),
    mataMata("final", "Final", ["03-28"]),
  ],
  classificados: [
    { fase: "quartas", vencedores: true },
    { fase: "quartas", perdedores: true },
    { fase: "grupos", posicoes: [3], porGrupo: true },
  ],
  campeaoAnterior: { temporada: "2024/25", campeao: "MEX", vice: "PAN" },
});

/**
 * Liga B: 4 grupos em turno e returno (as seleções que não são da FIFA ficam fora). Os primeiros e
 * os 2 melhores segundos vão à Copa Ouro.
 */
const NATIONS_LEAGUE_B = copa({
  id: "concacaf-nations-league-b",
  nome: "Nations League da Concacaf B",
  nomeCurto: "Nations League B",
  confederacao: "CONCACAF",
  aCadaAnos: 2,
  anoFinal: 2027,
  calendario: { inicio: "09-20", fim: "03-31" },
  // Os grupos do sorteio sem as que não são da FIFA, em 4 grupos de 3 (as Ilhas Cayman passam do
  // grupo A para o D, que ficou com 2).
  fixos: [
    ...["GUY", "PUR", "DMA"],
    ...["LCA", "BRB", "BER"],
    ...["CUB", "SKN", "GRN"],
    ...["VIN", "BLZ", "CAY"],
  ],
  quantidade: 12,
  gruposFixosAte: 2027,
  fases: [grupos(4, 2, ["09-24", "09-27", "10-01", "10-04", "11-12", "11-15"])],
  classificados: [
    { fase: "grupos", posicoes: [1], porGrupo: true },
    { fase: "grupos", posicoes: [2], porGrupo: true, melhores: 2 },
  ],
});

/**
 * Copa Ouro de 2027 (17/06 a 11/07): 16 pela Nations League, no formato novo de 2 grupos de 8 em
 * que cada um joga 4 vezes; os 4 primeiros de cada grupo vão às quartas. No real, 8 vêm direto da
 * Nations League, 7 de uma fase preliminar e 1 é convidado.
 */
const COPA_OURO = copa({
  id: "concacaf-copa-ouro",
  nome: "Copa Ouro",
  nomeCurto: "Copa Ouro",
  confederacao: "CONCACAF",
  aCadaAnos: 2,
  anoFinal: 2027,
  calendario: { inicio: "06-15", fim: "07-12" },
  fixos: [],
  quantidade: 16,
  fases: [
    {
      id: "grupos",
      nome: "Fase de grupos",
      tipo: "fase-de-liga",
      jogosPorTime: 4,
      potes: 4,
      grupos: 2,
      classificamDireto: 4,
      periodo: { inicio: "06-15", fim: "06-30" },
      datas: ["06-18", "06-21", "06-24", "06-27"],
      entramAqui: [
        classificadosDe("concacaf-nations-league-a", 10),
        classificadosDe("concacaf-nations-league-b", 6),
      ],
    } as Fase,
    mataMata("quartas", "Quartas de final", ["07-01"], {
      chaveamento: "potes",
      evitarMesmoGrupo: true,
    }),
    mataMata("semifinal", "Semifinal", ["07-05"]),
    mataMata("final", "Final", ["07-11"]),
  ],
  // Os 8 das quartas, do campeão aos que caíram nas quartas (a Copa América chama os 6 primeiros).
  classificados: [
    { fase: "final", vencedores: true },
    { fase: "final", perdedores: true },
    { fase: "semifinal", perdedores: true },
    { fase: "quartas", perdedores: true },
  ],
  campeaoAnterior: { temporada: "2025", campeao: "MEX", vice: "USA" },
});

// ---------------------------------------------------------------------------- Copa América

/**
 * Copa América de 2028 (junho e julho): as 10 da CONMEBOL e 6 da Concacaf (as 6 melhores da Copa
 * Ouro de 2027), como em 2024: 4 grupos de 4, os 2 primeiros de cada vão às quartas. Sede, datas e
 * formato ainda não foram anunciados; a mais provável é nos Estados Unidos.
 */
const COPA_AMERICA = copa({
  id: "conmebol-copa-america",
  nome: "Copa América",
  nomeCurto: "Copa América",
  confederacao: "CONMEBOL",
  aCadaAnos: 4,
  anoFinal: 2028,
  calendario: { inicio: "06-10", fim: "07-05" },
  fixos: ["ARG", "BRA", "URU", "COL", "ECU", "PAR", "CHI", "PER", "VEN", "BOL"],
  quantidade: 16,
  fases: [
    grupos(4, 1, ["06-13", "06-17", "06-21"], {
      classificamPorGrupo: 2,
      divisaoGrupos: "potes",
      entramAqui: [classificadosDe("concacaf-copa-ouro", 6, { maximo: 6 })],
    }),
    mataMata("quartas", "Quartas de final", ["06-25"], {
      chaveamento: "potes",
      evitarMesmoGrupo: true,
    }),
    mataMata("semifinal", "Semifinal", ["06-29"]),
    mataMata("final", "Final", ["07-03"]),
  ],
  campeaoAnterior: { temporada: "2024", campeao: "ARG", vice: "COL" },
});

export const COPAS_CONTINENTAIS_DE_SELECOES: readonly CompeticaoEntrada[] = [
  ELIMINATORIAS_CAN,
  COPA_AFRICANA,
  COPA_DA_ASIA,
  NATIONS_LEAGUE_A,
  NATIONS_LEAGUE_B,
  COPA_OURO,
  COPA_AMERICA,
];
