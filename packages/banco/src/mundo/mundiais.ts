/**
 * Supercopas continentais e competições mundiais de clubes (etapa 10b), no formato real:
 * - Recopa Sul-Americana: campeão da Libertadores x campeão da Sul-Americana, ida e volta em
 *   fevereiro (prorrogação e pênaltis no empate do agregado).
 * - Supercopa da UEFA: campeão da Champions x campeão da Europa League, jogo único em campo neutro
 *   em agosto, direto para os pênaltis no empate.
 * - Supercopa da CAF: campeão da Champions x campeão da Copa das Confederações, jogo único na casa
 *   do campeão da Champions.
 * - Copa Intercontinental da FIFA (anual): Copa África-Ásia-Pacífico (o campeão da Ásia recebe o da
 *   Oceania em agosto; o vencedor visita o campeão da África em setembro), Dérbi das Américas,
 *   Copa Challenger e a final contra o campeão da Champions, em dezembro, em sede neutra.
 * - Mundial de Clubes da FIFA (a cada 4 anos, desde 2025): 32 clubes, 8 grupos de 4 e mata-mata
 *   em jogo único. Vagas pelos campeões continentais dos últimos 4 anos e pelo ranking.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];

const periodo = (inicio: string, fim: string) => ({ inicio, fim });
const campeao = (de: string, extra: Partial<Vaga> = {}): Vaga => ({
  de,
  criterio: "campeao",
  ...extra,
});

/** Decisão em um confronto (supercopas). */
function decisao(janela: [string, string], o: Partial<Extract<Fase, { tipo: "mata-mata" }>>): Fase {
  return {
    id: "final",
    nome: "Final",
    tipo: "mata-mata",
    jogos: 1,
    prorrogacao: false,
    penaltis: true,
    chaveamento: "chave-fixa",
    mando: "melhor-campanha",
    periodo: periodo(...janela),
    ...o,
  } as Fase;
}

const RECOPA: CompeticaoEntrada = {
  id: "conmebol-recopa",
  nome: "Recopa Sul-Americana",
  nomeCurto: "Recopa",
  tipo: "supercopa",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "CONMEBOL" },
  calendario: periodo("02-15", "03-05"),
  diasDeJogo: [4],
  campeaoAnterior: { temporada: "2025", campeao: "arg-racing", vice: "bra-botafogo" },
  // O campeão da Libertadores decide em casa.
  participantes: {
    fixos: [],
    vagas: [campeao("conmebol-libertadores"), campeao("conmebol-sul-americana")],
    quantidade: 2,
  },
  fases: [decisao(["02-15", "03-05"], { jogos: 2, prorrogacao: true })],
};

const SUPERCOPA_UEFA: CompeticaoEntrada = {
  id: "uefa-supercopa",
  nome: "Supercopa da UEFA",
  nomeCurto: "Supercopa da UEFA",
  tipo: "supercopa",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "UEFA" },
  calendario: periodo("08-09", "08-16"),
  diasDeJogo: [3],
  campeaoAnterior: { temporada: "2025/26", campeao: "fra-psg", vice: "eng-tottenham" },
  participantes: {
    fixos: [],
    vagas: [campeao("uefa-champions-league"), campeao("uefa-europa-league")],
    quantidade: 2,
  },
  fases: [decisao(["08-09", "08-16"], { mando: "neutro" })],
};

const SUPERCOPA_CAF: CompeticaoEntrada = {
  id: "caf-supercopa",
  nome: "Supercopa da CAF",
  nomeCurto: "Supercopa da CAF",
  tipo: "supercopa",
  categoria: "clubes",
  escopo: { tipo: "confederacao", confederacao: "CAF" },
  calendario: periodo("10-15", "10-25"),
  diasDeJogo: [6],
  campeaoAnterior: { temporada: "2025/26", campeao: "egy-pyramids", vice: "mar-rs-berkane" },
  participantes: {
    fixos: [],
    vagas: [campeao("caf-champions-league"), campeao("caf-confederation-cup")],
    quantidade: 2,
  },
  fases: [decisao(["10-15", "10-25"], {})],
};

/** Campeão da edição que termina no ano (entra quando a final dela acontece). */
const campeaoDoAno = (de: string, finalDe: string, extra: Partial<Vaga> = {}) =>
  campeao(de, { fase: finalDe, ...extra });

const eliminatoria = (
  id: string,
  nome: string,
  janela: [string, string],
  entramAqui: Vaga[],
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
    mando: "melhor-campanha",
    periodo: periodo(...janela),
    entramAqui,
    ...o,
  }) as Fase;

/**
 * Copa Intercontinental: todos chegam durante o ano, cada um quando a sua continental termina. No
 * Dérbi das Américas o vencedor da Copa África-Ásia-Pacífico folga; na fase final, o campeão da
 * Champions folga na Copa Challenger e espera o vencedor na final.
 */
const INTERCONTINENTAL: CompeticaoEntrada = {
  id: "fifa-intercontinental",
  nome: "Copa Intercontinental da FIFA",
  nomeCurto: "Intercontinental",
  tipo: "intercontinental",
  categoria: "clubes",
  escopo: { tipo: "mundial" },
  calendario: periodo("08-20", "12-20"),
  campeaoAnterior: { temporada: "2025", campeao: "fra-psg", vice: "bra-flamengo" },
  participantes: { fixos: [], vagas: [], quantidade: 6 },
  fases: [
    // O campeão da Ásia recebe o da Oceania.
    eliminatoria(
      "africa-asia-pacifico-playoff",
      "Copa África-Ásia-Pacífico, playoff",
      ["08-24", "08-28"],
      [
        campeaoDoAno("afc-champions-league", "fase-final"),
        campeaoDoAno("ofc-champions-league", "mata-mata"),
      ],
    ),
    // O campeão da África recebe o vencedor.
    eliminatoria(
      "africa-asia-pacifico",
      "Copa África-Ásia-Pacífico",
      ["09-16", "09-22"],
      [campeaoDoAno("caf-champions-league", "mata-mata")],
    ),
    eliminatoria(
      "derbi-das-americas",
      "Dérbi das Américas",
      ["12-07", "12-11"],
      [
        campeaoDoAno("concacaf-champions-cup", "mata-mata"),
        campeaoDoAno("conmebol-libertadores", "mata-mata", { depois: true }),
      ],
      { mando: "neutro" },
    ),
    eliminatoria(
      "final",
      "Copa Challenger e final",
      ["12-11", "12-18"],
      [campeaoDoAno("uefa-champions-league", "mata-mata")],
      { mando: "neutro" },
    ),
  ],
};

/** Vagas de uma confederação no Mundial: os campeões dos 4 anos e as do ranking. */
const campeoes = (de: string): Vaga => ({ de, criterio: "campeoes", edicoes: 4, quantidade: 4 });
const ranking = (de: string, quantidade: number): Vaga => ({
  de,
  criterio: "ranking",
  edicoes: 4,
  quantidade,
  maximoPorPais: 2,
});

/**
 * Mundial de Clubes de 2029, no formato de 2025 (o único que a FIFA definiu até nov/2026; a
 * ampliação para 48 clubes e a sede ainda não foram confirmadas). A ordem das vagas monta os potes:
 * campeões da Champions e da Libertadores no pote 1, os europeus do ranking no 2. A vaga da sede vai
 * provisoriamente para o campeão do Marrocos, favorito nas notícias.
 */
const MUNDIAL_DE_CLUBES: CompeticaoEntrada = {
  id: "fifa-mundial-de-clubes",
  nome: "Mundial de Clubes da FIFA",
  nomeCurto: "Mundial de Clubes",
  tipo: "intercontinental",
  categoria: "clubes",
  escopo: { tipo: "mundial" },
  periodicidade: { aCadaAnos: 4, anoBase: 2029 },
  calendario: periodo("06-12", "07-20"),
  campeaoAnterior: { temporada: "2025", campeao: "eng-chelsea", vice: "fra-psg" },
  participantes: {
    fixos: [],
    vagas: [
      campeoes("uefa-champions-league"),
      campeoes("conmebol-libertadores"),
      ranking("uefa-champions-league", 8),
      ranking("conmebol-libertadores", 2),
      campeoes("afc-champions-league"),
      campeoes("caf-champions-league"),
      campeoes("concacaf-champions-cup"),
      ranking("ofc-champions-league", 1),
      campeao("mar-botola-pro"),
    ],
    quantidade: 32,
  },
  fases: [
    {
      id: "grupos",
      nome: "Fase de grupos",
      tipo: "grupos",
      grupos: 8,
      turnos: 1,
      classificamPorGrupo: 2,
      divisaoGrupos: "potes",
      periodo: periodo("06-14", "06-27"),
      entramAqui: [],
    },
    {
      id: "mata-mata",
      nome: "Mata-mata",
      tipo: "mata-mata",
      jogos: 1,
      prorrogacao: true,
      penaltis: true,
      chaveamento: "potes",
      mando: "neutro",
      periodo: periodo("06-28", "07-15"),
      entramAqui: [],
    },
  ],
};

export const SUPERCOPAS_CONTINENTAIS: readonly CompeticaoEntrada[] = [
  RECOPA,
  SUPERCOPA_UEFA,
  SUPERCOPA_CAF,
];
export const MUNDIAIS: readonly CompeticaoEntrada[] = [INTERCONTINENTAL, MUNDIAL_DE_CLUBES];
