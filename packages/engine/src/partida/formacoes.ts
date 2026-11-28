/**
 * Formações: 11 vagas com posição, lado e lugar de referência no quadro de ataque, com a bola
 * no meio do campo. Durante o jogo a vaga se desloca com a bola e com a fase (atacando ou
 * defendendo). Como no Brasfoot, a formação é só uma sugestão: o técnico escolhe quem joga em
 * cada vaga, e jogador fora da posição da vaga rende menos.
 */
import { t } from "@newbras/textos";
import type { Lado, Posicao } from "@newbras/data";

export interface Vaga {
  posicao: Posicao;
  lado: Lado;
  x: number;
  y: number;
}

const v = (posicao: Posicao, lado: Lado, x: number, y: number): Vaga => ({ posicao, lado, x, y });
const goleiro = v("G", "C", 5, 34);
const zaga4 = [v("L", "D", 30, 8), v("Z", "C", 24, 26), v("Z", "C", 24, 42), v("L", "E", 30, 60)];
const zaga3 = [v("Z", "C", 24, 20), v("Z", "C", 22, 34), v("Z", "C", 24, 48)];
const zaga5 = [
  v("L", "D", 32, 6),
  v("Z", "C", 22, 21),
  v("Z", "C", 20, 34),
  v("Z", "C", 22, 47),
  v("L", "E", 32, 62),
];

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
  "4-4-2 losango": [
    goleiro,
    ...zaga4,
    v("M", "C", 40, 34),
    v("M", "D", 50, 20),
    v("M", "E", 50, 48),
    v("M", "C", 60, 34),
    v("A", "C", 72, 28),
    v("A", "C", 72, 40),
  ],
  "4-4-1-1": [
    goleiro,
    ...zaga4,
    v("M", "D", 50, 11),
    v("M", "C", 44, 28),
    v("M", "C", 44, 40),
    v("M", "E", 50, 57),
    v("M", "C", 62, 34),
    v("A", "C", 74, 34),
  ],
  "4-1-4-1": [
    goleiro,
    ...zaga4,
    v("M", "C", 38, 34),
    v("M", "D", 54, 10),
    v("M", "C", 50, 27),
    v("M", "C", 50, 41),
    v("M", "E", 54, 58),
    v("A", "C", 74, 34),
  ],
  "4-3-2-1": [
    goleiro,
    ...zaga4,
    v("M", "C", 44, 22),
    v("M", "C", 42, 34),
    v("M", "C", 44, 46),
    v("M", "C", 62, 25),
    v("M", "C", 62, 43),
    v("A", "C", 75, 34),
  ],
  "4-3-1-2": [
    goleiro,
    ...zaga4,
    v("M", "C", 44, 22),
    v("M", "C", 42, 34),
    v("M", "C", 44, 46),
    v("M", "C", 60, 34),
    v("A", "C", 72, 28),
    v("A", "C", 72, 40),
  ],
  "4-2-2-2": [
    goleiro,
    ...zaga4,
    v("M", "C", 40, 27),
    v("M", "C", 40, 41),
    v("M", "D", 58, 18),
    v("M", "E", 58, 50),
    v("A", "C", 72, 28),
    v("A", "C", 72, 40),
  ],
  "4-2-1-3": [
    goleiro,
    ...zaga4,
    v("M", "C", 40, 27),
    v("M", "C", 40, 41),
    v("M", "C", 56, 34),
    v("A", "D", 70, 12),
    v("A", "C", 74, 34),
    v("A", "E", 70, 56),
  ],
  "4-1-3-2": [
    goleiro,
    ...zaga4,
    v("M", "C", 38, 34),
    v("M", "D", 52, 14),
    v("M", "C", 52, 34),
    v("M", "E", 52, 54),
    v("A", "C", 72, 28),
    v("A", "C", 72, 40),
  ],
  "4-6-0": [
    goleiro,
    ...zaga4,
    v("M", "C", 40, 26),
    v("M", "C", 40, 42),
    v("M", "D", 56, 12),
    v("M", "C", 60, 28),
    v("M", "C", 60, 40),
    v("M", "E", 56, 56),
  ],
  "3-4-1-2": [
    goleiro,
    ...zaga3,
    v("M", "D", 48, 9),
    v("M", "C", 44, 28),
    v("M", "C", 44, 40),
    v("M", "E", 48, 59),
    v("M", "C", 60, 34),
    v("A", "C", 72, 28),
    v("A", "C", 72, 40),
  ],
  "3-4-2-1": [
    goleiro,
    ...zaga3,
    v("M", "D", 48, 9),
    v("M", "C", 44, 28),
    v("M", "C", 44, 40),
    v("M", "E", 48, 59),
    v("M", "C", 62, 24),
    v("M", "C", 62, 44),
    v("A", "C", 75, 34),
  ],
  "3-1-4-2": [
    goleiro,
    ...zaga3,
    v("M", "C", 36, 34),
    v("M", "D", 50, 9),
    v("M", "C", 48, 27),
    v("M", "C", 48, 41),
    v("M", "E", 50, 59),
    v("A", "C", 70, 28),
    v("A", "C", 70, 40),
  ],
  "3-6-1": [
    goleiro,
    ...zaga3,
    v("M", "D", 50, 8),
    v("M", "C", 42, 24),
    v("M", "C", 42, 44),
    v("M", "E", 50, 60),
    v("M", "C", 56, 28),
    v("M", "C", 56, 40),
    v("A", "C", 72, 34),
  ],
  "3-3-4": [
    goleiro,
    ...zaga3,
    v("M", "C", 44, 20),
    v("M", "C", 42, 34),
    v("M", "C", 44, 48),
    v("A", "D", 68, 10),
    v("A", "C", 72, 27),
    v("A", "C", 72, 41),
    v("A", "E", 68, 58),
  ],
  "5-2-3": [
    goleiro,
    ...zaga5,
    v("M", "C", 42, 27),
    v("M", "C", 42, 41),
    v("A", "D", 68, 12),
    v("A", "C", 72, 34),
    v("A", "E", 68, 56),
  ],
  "5-2-1-2": [
    goleiro,
    ...zaga5,
    v("M", "C", 42, 27),
    v("M", "C", 42, 41),
    v("M", "C", 56, 34),
    v("A", "C", 70, 28),
    v("A", "C", 70, 40),
  ],
  "WM (3-2-2-3)": [
    goleiro,
    ...zaga3,
    v("M", "C", 40, 26),
    v("M", "C", 40, 42),
    v("M", "C", 56, 24),
    v("M", "C", 56, 44),
    v("A", "D", 70, 10),
    v("A", "C", 74, 34),
    v("A", "E", 70, 58),
  ],
  "Pirâmide (2-3-5)": [
    goleiro,
    v("Z", "C", 26, 24),
    v("Z", "C", 26, 44),
    v("M", "D", 44, 14),
    v("M", "C", 42, 34),
    v("M", "E", 44, 54),
    v("A", "D", 68, 8),
    v("A", "C", 70, 22),
    v("A", "C", 72, 34),
    v("A", "C", 70, 46),
    v("A", "E", 68, 60),
  ],
} as const satisfies Record<string, readonly Vaga[]>;

export type Formacao = keyof typeof FORMACOES;
export const NOMES_FORMACOES = Object.keys(FORMACOES) as Formacao[];

/** Limites do lugar de cada vaga numa formação personalizada (quadro de ataque, em metros). */
export const LIMITES_VAGA = {
  xMin: 14,
  xMax: 92,
  yMin: 3,
  yMax: 65,
  goleiroX: 5,
  distanciaMinima: 4,
};

/**
 * Faixa em que meio-campo e ataque se misturam: o meia pode subir até perto da área sem virar
 * atacante, e o atacante pode recuar até o meio sem virar meia. Dentro dela, a vaga mantém o setor
 * de onde veio; sem setor anterior, vale a linha dos 62 m.
 */
export const FAIXA_MEIO_ATAQUE = { inicio: 58, fim: 80, linha: 62 };

/**
 * Posição e lado de uma vaga pelo lugar no campo: até 36 m do próprio gol é defesa
 * (lateral se estiver aberto, zagueiro se estiver no meio); depois, meio-campo ou ataque pela
 * faixa de transição (FAIXA_MEIO_ATAQUE). É o que permite posicionar os jogadores livremente: o
 * motor lê a função pelo lugar.
 */
export function classificarVaga(
  x: number,
  y: number,
  goleiro = false,
  anterior?: Vaga["posicao"],
): Vaga {
  if (goleiro) return { posicao: "G", lado: "C", x: LIMITES_VAGA.goleiroX, y: 34 };
  const aberto = Math.abs(y - 34) > 18;
  const lado: Lado = y < 24 ? "D" : y > 44 ? "E" : "C";
  if (x < 36)
    return aberto ? { posicao: "L", lado: y < 34 ? "D" : "E", x, y } : { posicao: "Z", lado, x, y };
  const f = FAIXA_MEIO_ATAQUE;
  const meio =
    x < f.inicio || (x < f.fim && (anterior === "M" || (anterior !== "A" && x < f.linha)));
  return { posicao: meio ? "M" : "A", lado, x, y };
}

/**
 * Formação personalizada a partir de 11 pontos (o primeiro é o goleiro, que fica no gol).
 * Os pontos são limitados ao campo útil; a função de cada vaga vem do lugar e, na faixa entre
 * meio-campo e ataque, do setor que ela tinha antes (as vagas anteriores, se vierem).
 */
export function formacaoPersonalizada(
  pontos: ReadonlyArray<{ x: number; y: number }>,
  anteriores?: readonly Vaga[],
): Vaga[] {
  return pontos.map((p, i) => {
    const x = Math.min(LIMITES_VAGA.xMax, Math.max(LIMITES_VAGA.xMin, p.x));
    const y = Math.min(LIMITES_VAGA.yMax, Math.max(LIMITES_VAGA.yMin, p.y));
    return classificarVaga(x, y, i === 0, anteriores?.[i]?.posicao);
  });
}

/** Problemas de uma formação personalizada, no idioma da interface (lista vazia = pode jogar). */
export function validarFormacao(vagas: readonly Vaga[]): string[] {
  const problemas: string[] = [];
  if (vagas.length !== 11)
    problemas.push(t("a formação precisa de 11 vagas (tem {vagas})", { vagas: vagas.length }));
  if (vagas[0]?.posicao !== "G") problemas.push(t("a primeira vaga é a do goleiro"));
  if (vagas.slice(1).some((v) => v.posicao === "G")) problemas.push(t("só pode haver um goleiro"));
  for (let i = 1; i < vagas.length; i++)
    for (let j = i + 1; j < vagas.length; j++) {
      const a = vagas[i] as Vaga;
      const b = vagas[j] as Vaga;
      if (Math.hypot(a.x - b.x, a.y - b.y) < LIMITES_VAGA.distanciaMinima) {
        problemas.push(t("há jogadores em cima um do outro: afaste-os pelo menos 4 metros"));
        return problemas;
      }
    }
  return problemas;
}

/** Contagem por setor, para mostrar o desenho da formação (ex.: "4-3-3"). */
export function desenhoDaFormacao(vagas: readonly Vaga[]): string {
  // Ala (lateral adiantado, como no 3-5-2) conta no meio-campo.
  const ala = (v: Vaga) => v.posicao === "L" && v.x >= 40;
  const defesa = vagas.filter((v) => v.posicao === "Z" || (v.posicao === "L" && !ala(v))).length;
  const meio = vagas.filter((v) => v.posicao === "M" || ala(v)).length;
  const ataque = vagas.filter((v) => v.posicao === "A").length;
  return [defesa, meio, ataque].join("-");
}
