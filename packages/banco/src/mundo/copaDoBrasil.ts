/**
 * Copa do Brasil no formato real de 2026 (etapa 9d): 126 clubes em nove fases.
 * - 1ª fase (jogo único): 28 clubes das vagas estaduais, os de pior ranking.
 * - 2ª fase (jogo único): os outros 74 das vagas estaduais e os 14 vencedores.
 * - 3ª fase (jogo único): os 44 vencedores e o grupo 2: campeões da Copa do Nordeste, da Copa
 *   Verde e das Séries C e D da temporada anterior.
 * - 4ª fase (jogo único): 24.
 * - 5ª fase (ida e volta): os 12 vencedores e os 20 da Série A.
 * - Oitavas, quartas e semifinal em ida e volta; final em jogo único, em campo neutro.
 * Nas fases de jogo único, empate vai direto para os pênaltis.
 *
 * As vagas de cada estado são as de 2026 (quantos estreiam na 1ª e na 2ª fase); cada uma vai para
 * o melhor do estadual que ainda não tem vaga (quem é da Série A ou do grupo 2 já entrou), na
 * ordem da classificação do estadual. Em 2027 a CBF passa a 128 clubes, com os campeões das novas
 * Copa Norte, Copa Centro-Oeste e Copa Sul-Sudeste, que ainda não estão no banco.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];

/** Vagas de 2026 por estado: [estreiam na 1ª fase, estreiam na 2ª fase]. */
const VAGAS_ESTADUAIS: Record<string, readonly [number, number]> = {
  mg: [1, 4],
  rj: [1, 5],
  sp: [2, 4],
  es: [2, 1],
  pr: [0, 5],
  rs: [1, 4],
  sc: [1, 3],
  ba: [1, 3],
  ce: [1, 3],
  pe: [1, 3],
  al: [1, 3],
  se: [1, 2],
  rn: [1, 2],
  ma: [1, 2],
  pb: [1, 2],
  pi: [1, 2],
  go: [0, 4],
  mt: [1, 3],
  ms: [2, 1],
  df: [0, 3],
  pa: [1, 3],
  am: [0, 4],
  ac: [2, 1],
  rr: [2, 1],
  ro: [1, 2],
  ap: [0, 3],
  to: [2, 1],
};

const ate = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const doEstadual = (uf: string, n: number): Vaga => ({
  de: `bra-estadual-${uf}`,
  criterio: "posicoes",
  posicoes: ate(n),
  repassa: true,
});
const periodo = (inicio: string, fim: string) => ({ inicio, fim });

function fase(
  id: string,
  nome: string,
  janela: [string, string],
  jogos: 1 | 2,
  o: Partial<Extract<Fase, { tipo: "mata-mata" }>> = {},
): Fase {
  return {
    id,
    nome,
    tipo: "mata-mata",
    jogos,
    prorrogacao: false,
    penaltis: true,
    chaveamento: "sorteio",
    mando: "sorteio",
    periodo: periodo(...janela),
    entramAqui: [],
    ...o,
  } as Fase;
}

const estados = Object.entries(VAGAS_ESTADUAIS);

export const COPA_DO_BRASIL: CompeticaoEntrada = {
  id: "bra-copa-do-brasil",
  nome: "Copa do Brasil",
  nomeCurto: "Copa do Brasil",
  tipo: "copa",
  categoria: "clubes",
  escopo: { tipo: "pais", pais: "BRA" },
  calendario: periodo("02-17", "12-06"),
  participantes: {
    fixos: [],
    // 1ª fase: os de pior ranking de cada estado (depois das vagas da 2ª fase).
    vagas: estados.filter(([, [p]]) => p > 0).map(([uf, [p]]) => doEstadual(uf, p)),
    quantidade: 126,
  },
  fases: [
    fase("1-fase", "1ª fase", ["02-17", "02-19"], 1),
    fase("2-fase", "2ª fase", ["02-24", "03-05"], 1, {
      entramAqui: estados.map(([uf, [, s]]) => doEstadual(uf, s)),
    }),
    fase("3-fase", "3ª fase", ["03-10", "03-12"], 1, {
      todosJogam: true,
      entramAqui: [
        { de: "bra-copa-do-nordeste", criterio: "campeao" },
        { de: "bra-copa-verde", criterio: "campeao" },
        { de: "bra-serie-c", criterio: "campeao" },
        { de: "bra-serie-d", criterio: "campeao" },
      ] as Vaga[],
    }),
    fase("4-fase", "4ª fase", ["03-17", "03-19"], 1, { todosJogam: true }),
    fase("5-fase", "5ª fase", ["04-21", "05-14"], 2, {
      chaveamento: "potes",
      entramAqui: [{ de: "bra-serie-a", criterio: "posicoes", posicoes: ate(20) }] as Vaga[],
    }),
    fase("oitavas", "Oitavas de final", ["07-28", "08-07"], 2, { todosJogam: true }),
    fase("quartas", "Quartas de final", ["08-25", "09-17"], 2, { todosJogam: true }),
    fase("semifinal", "Semifinal", ["10-28", "11-09"], 2, { todosJogam: true }),
    fase("final", "Final", ["12-04", "12-06"], 1, { mando: "neutro" }),
  ],
};
