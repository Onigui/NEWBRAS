/**
 * Formações: 11 vagas com posição, lado e lugar de referência no quadro de ataque, com a bola
 * no meio do campo. Durante o jogo a vaga se desloca com a bola e com a fase (atacando ou
 * defendendo). Como no Brasfoot, a formação é só uma sugestão: o técnico escolhe quem joga em
 * cada vaga, e jogador fora da posição da vaga rende menos.
 */
import type { Lado, Posicao } from "@newbras/data";

export interface Vaga {
  posicao: Posicao;
  lado: Lado;
  x: number;
  y: number;
}

const v = (posicao: Posicao, lado: Lado, x: number, y: number): Vaga => ({ posicao, lado, x, y });
const goleiro = v("G", "C", 5, 34);

export const FORMACOES = {
  "4-4-2": [
    goleiro,
    v("L", "D", 30, 8),
    v("Z", "C", 24, 26),
    v("Z", "C", 24, 42),
    v("L", "E", 30, 60),
    v("M", "D", 50, 11),
    v("M", "C", 46, 28),
    v("M", "C", 46, 40),
    v("M", "E", 50, 57),
    v("A", "C", 70, 28),
    v("A", "C", 70, 40),
  ],
  "4-3-3": [
    goleiro,
    v("L", "D", 30, 8),
    v("Z", "C", 24, 26),
    v("Z", "C", 24, 42),
    v("L", "E", 30, 60),
    v("M", "C", 42, 34),
    v("M", "D", 50, 22),
    v("M", "E", 50, 46),
    v("A", "D", 70, 12),
    v("A", "C", 74, 34),
    v("A", "E", 70, 56),
  ],
  "4-5-1": [
    goleiro,
    v("L", "D", 30, 8),
    v("Z", "C", 24, 26),
    v("Z", "C", 24, 42),
    v("L", "E", 30, 60),
    v("M", "D", 52, 10),
    v("M", "C", 42, 24),
    v("M", "C", 50, 34),
    v("M", "C", 42, 44),
    v("M", "E", 52, 58),
    v("A", "C", 72, 34),
  ],
  "4-2-3-1": [
    goleiro,
    v("L", "D", 30, 8),
    v("Z", "C", 24, 26),
    v("Z", "C", 24, 42),
    v("L", "E", 30, 60),
    v("M", "C", 40, 27),
    v("M", "C", 40, 41),
    v("M", "D", 58, 12),
    v("M", "C", 58, 34),
    v("M", "E", 58, 56),
    v("A", "C", 74, 34),
  ],
  "3-5-2": [
    goleiro,
    v("Z", "C", 24, 20),
    v("Z", "C", 22, 34),
    v("Z", "C", 24, 48),
    v("L", "D", 46, 7),
    v("M", "C", 42, 26),
    v("M", "C", 50, 34),
    v("M", "C", 42, 42),
    v("L", "E", 46, 61),
    v("A", "C", 70, 28),
    v("A", "C", 70, 40),
  ],
  "3-4-3": [
    goleiro,
    v("Z", "C", 24, 20),
    v("Z", "C", 22, 34),
    v("Z", "C", 24, 48),
    v("M", "D", 48, 9),
    v("M", "C", 44, 28),
    v("M", "C", 44, 40),
    v("M", "E", 48, 59),
    v("A", "D", 70, 14),
    v("A", "C", 74, 34),
    v("A", "E", 70, 54),
  ],
  "5-3-2": [
    goleiro,
    v("L", "D", 32, 6),
    v("Z", "C", 22, 21),
    v("Z", "C", 20, 34),
    v("Z", "C", 22, 47),
    v("L", "E", 32, 62),
    v("M", "C", 44, 24),
    v("M", "C", 46, 34),
    v("M", "C", 44, 44),
    v("A", "C", 68, 28),
    v("A", "C", 68, 40),
  ],
  "5-4-1": [
    goleiro,
    v("L", "D", 32, 6),
    v("Z", "C", 22, 21),
    v("Z", "C", 20, 34),
    v("Z", "C", 22, 47),
    v("L", "E", 32, 62),
    v("M", "D", 48, 13),
    v("M", "C", 42, 28),
    v("M", "C", 42, 40),
    v("M", "E", 48, 55),
    v("A", "C", 68, 34),
  ],
  "4-2-4": [
    goleiro,
    v("L", "D", 30, 8),
    v("Z", "C", 24, 26),
    v("Z", "C", 24, 42),
    v("L", "E", 30, 60),
    v("M", "C", 44, 27),
    v("M", "C", 44, 41),
    v("A", "D", 68, 10),
    v("A", "C", 72, 27),
    v("A", "C", 72, 41),
    v("A", "E", 68, 58),
  ],
} as const satisfies Record<string, readonly Vaga[]>;

export type Formacao = keyof typeof FORMACOES;
export const NOMES_FORMACOES = Object.keys(FORMACOES) as Formacao[];
