/**
 * Vocabulário básico do futebol no NewBras, igual ao do Brasfoot.
 * Os esquemas completos (time, jogador, liga) chegam na Fase 2.
 */

export const POSICOES = ["G", "L", "Z", "M", "A"] as const;
export type Posicao = (typeof POSICOES)[number];

export const NOME_POSICAO: Record<Posicao, string> = {
  G: "Goleiro",
  L: "Lateral",
  Z: "Zagueiro",
  M: "Meia",
  A: "Atacante",
};

export const LADOS = ["D", "E", "C"] as const;
export type Lado = (typeof LADOS)[number];

/**
 * Atributos de goleiro. As características (as 2 que o Brasfoot mostra) são os atributos mais altos.
 */
export const CARACTERISTICAS_GOLEIRO = [
  "colocacao",
  "saida",
  "reflexo",
  "penalti",
  "reposicao",
] as const;

/** Atributos de jogador de linha: os 10 do Brasfoot, mais chute de longe e força física. */
export const CARACTERISTICAS_LINHA = [
  "armacao",
  "cabeceio",
  "cruzamento",
  "desarme",
  "drible",
  "finalizacao",
  "marcacao",
  "passe",
  "resistencia",
  "velocidade",
  "chuteLonge",
  "forcaFisica",
] as const;

export type CaracteristicaGoleiro = (typeof CARACTERISTICAS_GOLEIRO)[number];
export type CaracteristicaLinha = (typeof CARACTERISTICAS_LINHA)[number];
export type Caracteristica = CaracteristicaGoleiro | CaracteristicaLinha;

export const NOME_CARACTERISTICA: Record<Caracteristica, string> = {
  colocacao: "Colocação",
  saida: "Saída do gol",
  reflexo: "Reflexo",
  penalti: "Defesa de pênalti",
  reposicao: "Reposição",
  armacao: "Armação",
  cabeceio: "Cabeceio",
  cruzamento: "Cruzamento",
  desarme: "Desarme",
  drible: "Drible",
  finalizacao: "Finalização",
  marcacao: "Marcação",
  passe: "Passe",
  resistencia: "Resistência",
  velocidade: "Velocidade",
  chuteLonge: "Chute de longe",
  forcaFisica: "Força física",
};

/** Força vai de 1 a 100, como no Brasfoot. */
export const FORCA_MIN = 1;
export const FORCA_MAX = 100;

/**
 * Regra do NewBras: só o Cristiano Ronaldo, o jogador mais completo da história, chega a 99 de força
 * (no auge). Messi vem em segundo, com 97. Nenhum outro jogador passa de 97: nem força, nem potencial.
 */
export const FORCA_RECORDE = 99;
export const FORCA_TETO = 97;

/** Características válidas para a posição. */
export function caracteristicasDaPosicao(posicao: Posicao): readonly Caracteristica[] {
  return posicao === "G" ? CARACTERISTICAS_GOLEIRO : CARACTERISTICAS_LINHA;
}
