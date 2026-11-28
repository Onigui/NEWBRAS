/**
 * Quantos reservas cada competição deixa relacionar no banco (pesquisa de 28/11/2026, temporada
 * 2026/27). Desde a regra das cinco substituições, cada liga e cada confederação define o próprio
 * banco. Fontes e o que ainda está a conferir: `docs/DECISOES.md`.
 */
import type { Competicao } from "./schemas/competicao";

/** Banco das ligas sem dado conferido (o mais comum entre as grandes, como Premier League e Bundesliga). */
export const RESERVAS_PADRAO = 9;
/** Banco dos amistosos (sem regulamento de competição). */
export const RESERVAS_AMISTOSO = 12;
/** O maior banco que uma competição permite (Serie A, Copa do Mundo). */
export const RESERVAS_MAXIMO = 15;

/** Banco por país, nas competições nacionais (ligas, copas e estaduais). */
const POR_PAIS: Readonly<Record<string, number>> = {
  ENG: 9, // Premier League e EFL: 9.
  GER: 9, // Bundesliga: 9.
  FRA: 9, // Ligue 1: 20 na súmula, 9 reservas (Ligue 2: 7, abaixo).
  USA: 9, // MLS: 9.
  KSA: 9, // Saudi Pro League: 9.
  ESP: 12, // LaLiga: 12.
  POR: 12, // Liga Portugal: de 9 para 12 a partir de 2026/27.
  NED: 12, // Eredivisie: 23 na súmula, 12 reservas.
  BRA: 12, // CBF: até 12 reservas.
  ARG: 12, // Liga Profesional: 11 titulares e 12 suplentes.
};

type CompeticaoParaBanco = Pick<Competicao, "id" | "categoria" | "escopo" | "tipo"> &
  Partial<Pick<Competicao, "divisao" | "reservas">>;

/** Reservas que o banco comporta na competição (sem competição: amistoso). */
export function reservasDaCompeticao(c: CompeticaoParaBanco | undefined): number {
  if (!c) return RESERVAS_AMISTOSO;
  if (c.reservas) return c.reservas;
  if (c.categoria === "selecoes")
    // Fase final com listas de 26: todos os que não começam ficam no banco. Eliminatórias e
    // Nations League: 23 na súmula, como nas competições de clubes da UEFA.
    return /eliminatorias|nations-league|repescagem/.test(c.id) ? 12 : RESERVAS_MAXIMO;
  // Champions, Libertadores, Mundial de Clubes e as outras de confederação: 12.
  if (c.escopo.tipo === "confederacao" || c.escopo.tipo === "mundial") return 12;
  const pais = c.escopo.pais;
  // Itália: Serie A, Coppa Italia e Supercoppa com 15; as divisões de baixo, a conferir.
  if (pais === "ITA") return c.tipo === "liga" && (c.divisao ?? 1) > 1 ? RESERVAS_PADRAO : 15;
  if (pais === "FRA" && c.tipo === "liga" && c.divisao === 2) return 7;
  return POR_PAIS[pais] ?? RESERVAS_PADRAO;
}
