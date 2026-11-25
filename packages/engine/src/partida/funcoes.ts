/**
 * Como cada função joga no motor. A nota da função (pacote de dados) diz quanto o jogador serve
 * para ela; aqui fica o que ele faz em campo: onde se posiciona, o que prefere fazer com a bola
 * e para onde a bola vai. O falso 9 sai da área, o ponta abre, o ponta invertido corta para dentro,
 * o volante protege a defesa, o ala vive no ataque.
 */
import type { Funcao } from "@newbras/data";

export interface Comportamento {
  /** Metros a mais (ou a menos) que ele avança quando o time ataca. */
  avanco: number;
  /** Metros a mais quando o time ataca e a bola já passou da intermediária. */
  avancoFinal: number;
  /** Metros a mais (negativo = mais recuado) quando o time defende. */
  defesa: number;
  /** Atacando, abre para a linha lateral (positivo) ou fecha para o meio (negativo), em metros. */
  largura: number;
  /** Entra na área no fim da jogada, passando da linha da bola. */
  chegada: boolean;
  /** Atacando, fica tantos metros atrás da linha de impedimento (o falso 9 sai da área). */
  recua: number;
  /** Joga no limite do impedimento, esperando a bola nas costas da zaga. */
  linha: boolean;
  /** Quanto prefere cada ação com a bola (multiplica o peso da escolha). */
  chute: number;
  passe: number;
  conduz: number;
  drible: number;
  cruza: number;
  /** Gosto por lançar em profundidade. */
  profundidade: number;
  /** Quanto é procurado no lançamento em profundidade. */
  alvoProfundidade: number;
  /** Quanto é procurado no cruzamento. */
  alvoArea: number;
  /** Disposição para dar o bote. */
  bote: number;
  /** Cansaço (correr mais cansa mais). */
  desgaste: number;
  /** Para onde leva a bola na condução: fração do caminho até o meio (o ponta fica aberto). */
  corta: readonly [number, number];
}

const BASE: Comportamento = {
  avanco: 0,
  avancoFinal: 0,
  defesa: 0,
  largura: 0,
  chegada: false,
  recua: 0,
  linha: false,
  chute: 1,
  passe: 1,
  conduz: 1,
  drible: 1,
  cruza: 1,
  profundidade: 1,
  alvoProfundidade: 1,
  alvoArea: 1,
  bote: 1,
  desgaste: 1,
  corta: [0.05, 0.25],
};

const c = (mudancas: Partial<Comportamento>): Comportamento => ({ ...BASE, ...mudancas });
/** O que todo atacante faz: sobe no terço final e joga no limite do impedimento. */
const ATACANTE: Partial<Comportamento> = { avancoFinal: 3, linha: true };

export const COMPORTAMENTO: Readonly<Record<Funcao, Comportamento>> = {
  goleiro: c({}),
  "goleiro-libero": c({ avanco: 7 }),
  zagueiro: c({ profundidade: 0.8 }),
  "zagueiro-construtor": c({ passe: 1.15, profundidade: 1.5, conduz: 1.1 }),
  libero: c({ avanco: 3, conduz: 1.7, drible: 1.3, profundidade: 1.2 }),
  lateral: c({}),
  "lateral-defensivo": c({ avanco: -5, cruza: 0.7, desgaste: 0.9, bote: 1.1 }),
  ala: c({ avanco: 7, largura: 3, cruza: 1.4, conduz: 1.2, desgaste: 1.15, corta: [0, 0.1] }),
  volante: c({ avanco: -4, defesa: -2, bote: 1.3, passe: 1.1, chute: 0.6, conduz: 0.8 }),
  "volante-construtor": c({ avanco: -3, passe: 1.2, profundidade: 1.7, chute: 0.8 }),
  "meio-campista": c({ chegada: true, chute: 1.4 }),
  "box-to-box": c({ avanco: 3, chegada: true, chute: 1.2, bote: 1.15, desgaste: 1.15 }),
  armador: c({ avanco: -2, passe: 1.2, profundidade: 1.8, chute: 0.8 }),
  "meia-aberto": c({ largura: 2, cruza: 1.1, conduz: 1.1, chute: 1.3, corta: [0, 0.12] }),
  "meia-por-dentro": c({ largura: -9, passe: 1.15, chute: 1.1, profundidade: 1.2 }),
  "meia-armador": c({
    chegada: true,
    defesa: 3,
    passe: 1.2,
    profundidade: 1.8,
    drible: 1.1,
    chute: 0.9,
    bote: 0.8,
  }),
  "meia-atacante": c({
    avanco: 3,
    chegada: true,
    chute: 1.3,
    alvoArea: 1.2,
    alvoProfundidade: 1.2,
    defesa: 2,
  }),
  ponta: c({
    ...ATACANTE,
    largura: 5,
    cruza: 1.25,
    conduz: 1.2,
    drible: 1.15,
    chute: 0.85,
    alvoProfundidade: 1.2,
    corta: [0, 0.08],
  }),
  "ponta-invertido": c({
    ...ATACANTE,
    largura: -6,
    chegada: true,
    chute: 1.35,
    drible: 1.2,
    cruza: 0.5,
    alvoProfundidade: 1.1,
    corta: [0.3, 0.55],
  }),
  "segundo-atacante": c({
    ...ATACANTE,
    avanco: 1,
    chegada: true,
    chute: 1.15,
    alvoProfundidade: 1.2,
  }),
  centroavante: c({ ...ATACANTE, alvoArea: 1.15, conduz: 0.9, drible: 0.9 }),
  pivo: c({
    ...ATACANTE,
    linha: false,
    passe: 1.3,
    chute: 0.95,
    alvoArea: 1.6,
    alvoProfundidade: 0.5,
    conduz: 0.6,
    drible: 0.6,
  }),
  "falso-9": c({
    ...ATACANTE,
    linha: false,
    recua: 11,
    passe: 1.3,
    profundidade: 1.6,
    drible: 1.2,
    chute: 0.9,
    alvoArea: 0.5,
    alvoProfundidade: 0.4,
  }),
  "atacante-velocidade": c({
    ...ATACANTE,
    conduz: 1.3,
    chute: 1.1,
    alvoArea: 0.8,
    alvoProfundidade: 1.8,
  }),
};
